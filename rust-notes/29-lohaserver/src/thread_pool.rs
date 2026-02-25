use std::sync::{mpsc, Arc, Mutex};
use std::thread;

/// A job is simply a boxed closure that can be sent across threads.
type Job = Box<dyn FnOnce() + Send + 'static>;

/// A fixed-size pool of worker threads that process jobs from a shared
/// channel.
///
/// Analogy: The row of booking counters at the railway station. Each
/// `Worker` is one counter clerk. The `mpsc` channel is the token queue
/// that passengers (jobs) wait in. When a clerk finishes, they pick the
/// next token automatically.
pub struct ThreadPool {
    workers: Vec<Worker>,
    sender: Option<mpsc::Sender<Job>>,
}

impl ThreadPool {
    /// Create a new ThreadPool with the given number of workers.
    ///
    /// # Panics
    /// Panics if `size` is zero.
    pub fn new(size: usize) -> Self {
        assert!(size > 0, "ThreadPool size must be at least 1");

        let (sender, receiver) = mpsc::channel::<Job>();
        let receiver = Arc::new(Mutex::new(receiver));

        let mut workers = Vec::with_capacity(size);
        for id in 0..size {
            workers.push(Worker::new(id, Arc::clone(&receiver)));
        }

        println!("[ThreadPool] Spawned {} worker threads", size);

        ThreadPool {
            workers,
            sender: Some(sender),
        }
    }

    /// Send a job (closure) to the pool for execution.
    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
        let job = Box::new(f);
        if let Some(ref sender) = self.sender {
            sender.send(job).expect("Failed to send job to worker");
        }
    }
}

impl Drop for ThreadPool {
    /// Graceful shutdown: drop the sender so workers see a disconnect,
    /// then join every worker thread.
    fn drop(&mut self) {
        println!("[ThreadPool] Shutting down...");

        // Drop the sender — this causes all receivers to get an error
        // on the next recv(), breaking their loops.
        drop(self.sender.take());

        for worker in &mut self.workers {
            if let Some(handle) = worker.thread.take() {
                println!("[ThreadPool] Joining worker {}...", worker.id);
                handle.join().expect("Worker thread panicked");
            }
        }

        println!("[ThreadPool] All workers stopped.");
    }
}

// -------------------------------------------------------------------

/// A single worker thread that loops, pulling jobs from the shared
/// receiver.
struct Worker {
    id: usize,
    thread: Option<thread::JoinHandle<()>>,
}

impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Self {
        let handle = thread::spawn(move || loop {
            // Lock the mutex just long enough to receive one job, then
            // release the lock so other workers can pick jobs too.
            let job = {
                let lock = receiver.lock().expect("Worker mutex poisoned");
                lock.recv() // blocks until a job arrives or channel closes
            };

            match job {
                Ok(job) => {
                    println!("[Worker {}] Handling a request...", id);
                    job();
                }
                Err(_) => {
                    // Channel closed — time to exit.
                    println!("[Worker {}] Channel closed, shutting down.", id);
                    break;
                }
            }
        });

        Worker {
            id,
            thread: Some(handle),
        }
    }
}
