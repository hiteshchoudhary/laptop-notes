// ============================================================
// FILE 17: GRAPH ALGORITHMS — DIJKSTRA, TOPOLOGICAL SORT & CYCLE DETECTION
// Topic: Advanced graph algorithms for weighted shortest paths, ordering, and cycle detection
// WHY: Real-world graphs have weights (distances, costs, times). Dijkstra finds
//   the cheapest route. Topological sort orders dependencies. Cycle detection
//   prevents deadlocks. These power GPS navigation, build systems, and compilers.
// ============================================================

// ============================================================
// OLA/UBER — THE GRAPH ALGORITHMS STORY
// When you book an Ola in Bangalore, the app must find the fastest route from
// your pickup on MG Road to your drop at Electronic City. Each road segment
// has a travel time (weight). Dijkstra's algorithm processes roads from fastest
// to slowest, guaranteeing the optimal route. Meanwhile, the build system that
// deploys Ola's code uses topological sort to compile dependencies in order,
// and cycle detection ensures no circular dependency deadlocks the build.
// ============================================================

// --- Helper: Priority Queue (Min-Heap) ---
// WHY: Dijkstra needs to always process the closest unvisited node.
// A min-heap gives us O(log n) insert and O(log n) extract-min.

class MinPriorityQueue {
  constructor() {
    this.heap = [];
  }

  // Big-O: O(log n)
  enqueue(element, priority) {
    this.heap.push({ element, priority });
    this._bubbleUp(this.heap.length - 1);
  }

  // Big-O: O(log n)
  dequeue() {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return min;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  _bubbleUp(idx) {
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      if (this.heap[parentIdx].priority <= this.heap[idx].priority) break;
      [this.heap[parentIdx], this.heap[idx]] = [this.heap[idx], this.heap[parentIdx]];
      idx = parentIdx;
    }
  }

  _sinkDown(idx) {
    const length = this.heap.length;
    while (true) {
      let smallest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;

      if (left < length && this.heap[left].priority < this.heap[smallest].priority) {
        smallest = left;
      }
      if (right < length && this.heap[right].priority < this.heap[smallest].priority) {
        smallest = right;
      }
      if (smallest === idx) break;
      [this.heap[smallest], this.heap[idx]] = [this.heap[idx], this.heap[smallest]];
      idx = smallest;
    }
  }
}

// --- Helper: Graph class (reused from File 16 with minor tweaks) ---
class Graph {
  constructor(isDirected = false) {
    this.adjacencyList = new Map();
    this.isDirected = isDirected;
  }

  addVertex(vertex) {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, []);
    }
    return this;
  }

  addEdge(v1, v2, weight = 1) {
    this.addVertex(v1);
    this.addVertex(v2);
    this.adjacencyList.get(v1).push({ node: v2, weight });
    if (!this.isDirected) {
      this.adjacencyList.get(v2).push({ node: v1, weight });
    }
    return this;
  }

  getNeighbors(vertex) {
    return this.adjacencyList.get(vertex) || [];
  }

  getVertices() {
    return [...this.adjacencyList.keys()];
  }

  display() {
    for (const [vertex, edges] of this.adjacencyList) {
      const connections = edges.map((e) => `${e.node}(${e.weight})`).join(", ");
      console.log(`  ${vertex} -> [${connections}]`);
    }
  }
}

// ============================================================
// EXAMPLE 1 — Dijkstra's Algorithm
// Story: Ola's routing engine in Bangalore must find the fastest route from
// Koramangala to Whitefield. Roads have different travel times based on traffic
// (weight). Dijkstra's algorithm starts at Koramangala with distance 0, then
// greedily processes the closest reachable intersection, updating distances
// whenever a shorter path is found. This guarantees the optimal route.
// ============================================================

// WHY: Dijkstra's is THE standard algorithm for shortest paths in weighted
// graphs with non-negative weights. Used by every GPS, ride-hailing app,
// and network routing protocol (OSPF). Time: O((V + E) log V) with min-heap.

// --- How Dijkstra Works ---
// 1. Initialize: dist[source] = 0, dist[all others] = Infinity
// 2. Add source to priority queue with priority 0
// 3. While PQ not empty:
//    a. Extract minimum distance node (u)
//    b. If already processed, skip (lazy deletion)
//    c. For each neighbor v of u:
//       If dist[u] + weight(u,v) < dist[v]:  (RELAXATION)
//         Update dist[v]
//         Set previous[v] = u
//         Add v to PQ with new distance
// 4. Distances map has shortest paths from source to all nodes

// Big-O: Time O((V + E) log V), Space O(V)
function dijkstra(graph, source) {
  const distances = new Map();   // Shortest distance from source to each node
  const previous = new Map();    // For path reconstruction
  const visited = new Set();
  const pq = new MinPriorityQueue();

  // Step 1: Initialize all distances to Infinity
  for (const vertex of graph.getVertices()) {
    distances.set(vertex, Infinity);
    previous.set(vertex, null);
  }
  distances.set(source, 0);

  // Step 2: Add source to PQ
  pq.enqueue(source, 0);

  // Step 3: Process nodes
  while (!pq.isEmpty()) {
    const { element: current, priority: currentDist } = pq.dequeue();

    // Lazy deletion: skip if already processed with a shorter distance
    if (visited.has(current)) continue;
    visited.add(current);

    // If current distance is already greater than known, skip
    if (currentDist > distances.get(current)) continue;

    // Relaxation: check all neighbors
    for (const edge of graph.getNeighbors(current)) {
      if (visited.has(edge.node)) continue;

      const newDist = distances.get(current) + edge.weight;

      // Found a shorter path!
      if (newDist < distances.get(edge.node)) {
        distances.set(edge.node, newDist);
        previous.set(edge.node, current);
        pq.enqueue(edge.node, newDist);
      }
    }
  }

  return { distances, previous };
}

// --- Path Reconstruction ---
function getPath(previous, target) {
  const path = [];
  let current = target;
  while (current !== null) {
    path.unshift(current);
    current = previous.get(current);
  }
  return path;
}

// Build Bangalore road network (weighted, undirected)
console.log("=== DIJKSTRA'S ALGORITHM ===");
console.log("Bangalore Road Network (travel time in minutes):\n");

const bangalore = new Graph(false);
bangalore.addEdge("Koramangala", "HSR Layout", 10);
bangalore.addEdge("Koramangala", "Indiranagar", 15);
bangalore.addEdge("HSR Layout", "BTM Layout", 8);
bangalore.addEdge("HSR Layout", "Silk Board", 12);
bangalore.addEdge("BTM Layout", "Jayanagar", 7);
bangalore.addEdge("Indiranagar", "MG Road", 10);
bangalore.addEdge("MG Road", "Majestic", 20);
bangalore.addEdge("Silk Board", "Electronic City", 25);
bangalore.addEdge("Silk Board", "Marathahalli", 15);
bangalore.addEdge("Marathahalli", "Whitefield", 20);
bangalore.addEdge("Indiranagar", "Marathahalli", 12);
bangalore.addEdge("Jayanagar", "Majestic", 15);

bangalore.display();

// Run Dijkstra from Koramangala
const { distances, previous } = dijkstra(bangalore, "Koramangala");

console.log("\nShortest distances from Koramangala:");
for (const [city, dist] of distances) {
  const path = getPath(previous, city);
  console.log(`  ${city}: ${dist} min | Path: ${path.join(" -> ")}`);
}

console.log("\nLIMITATION: Dijkstra does NOT work with negative weights!");
console.log("For negative weights, use Bellman-Ford algorithm.\n");

// ============================================================
// EXAMPLE 3 — Topological Sort
// Story: Infosys builds a massive microservices platform. Service A depends
// on Service B and C. Service B depends on D. You can't start A until B and C
// are running. Topological sort gives the correct startup ORDER so that every
// service starts only after its dependencies are ready. This is exactly how
// npm, Maven, and Bazel resolve build dependencies.
// ============================================================

// WHY: Topological sort orders vertices of a DAG such that for every edge
// u->v, u comes before v. Essential for: build systems, task scheduling,
// course prerequisites, spreadsheet cell evaluation, compiler phases.

// --- Kahn's Algorithm (BFS-based) ---
// 1. Compute in-degree for each vertex
// 2. Add all vertices with in-degree 0 to queue
// 3. While queue not empty:
//    a. Dequeue vertex u, add to result
//    b. For each neighbor v of u: decrement in-degree[v]
//    c. If in-degree[v] becomes 0, enqueue v
// 4. If result.length !== V, graph has a cycle (not a DAG)

// Big-O: Time O(V + E), Space O(V)
function topologicalSortKahns(graph) {
  const inDegree = new Map();
  const result = [];

  // Initialize in-degrees to 0
  for (const vertex of graph.getVertices()) {
    inDegree.set(vertex, 0);
  }

  // Calculate in-degrees
  for (const vertex of graph.getVertices()) {
    for (const edge of graph.getNeighbors(vertex)) {
      inDegree.set(edge.node, (inDegree.get(edge.node) || 0) + 1);
    }
  }

  // Enqueue all vertices with in-degree 0
  const queue = [];
  for (const [vertex, degree] of inDegree) {
    if (degree === 0) {
      queue.push(vertex);
    }
  }

  console.log("  Initial in-degrees:", Object.fromEntries(inDegree));
  console.log("  Starting queue (in-degree 0):", queue);

  // Process queue
  while (queue.length > 0) {
    const current = queue.shift();
    result.push(current);

    for (const edge of graph.getNeighbors(current)) {
      inDegree.set(edge.node, inDegree.get(edge.node) - 1);
      if (inDegree.get(edge.node) === 0) {
        queue.push(edge.node);
      }
    }
  }

  // If not all vertices are in result, there's a cycle
  if (result.length !== graph.getVertices().length) {
    console.log("  WARNING: Cycle detected! Not all vertices could be sorted.");
    return null;
  }

  return result;
}

// --- DFS-based Topological Sort ---
// 1. For each unvisited vertex, run DFS
// 2. After all children of a vertex are processed (post-order), push to stack
// 3. Result is the reverse of the stack (or stack popped in order)

// Big-O: Time O(V + E), Space O(V)
function topologicalSortDFS(graph) {
  const visited = new Set();
  const stack = []; // Will contain result in reverse order

  function dfs(vertex) {
    visited.add(vertex);

    for (const edge of graph.getNeighbors(vertex)) {
      if (!visited.has(edge.node)) {
        dfs(edge.node);
      }
    }

    // Post-order: push after all descendants are processed
    stack.push(vertex);
  }

  for (const vertex of graph.getVertices()) {
    if (!visited.has(vertex)) {
      dfs(vertex);
    }
  }

  return stack.reverse(); // Reverse post-order = topological order
}

console.log("\n=== TOPOLOGICAL SORT ===");

// Course prerequisites (directed acyclic graph)
const courses = new Graph(true);
courses.addEdge("Math Basics", "Algebra");
courses.addEdge("Math Basics", "Geometry");
courses.addEdge("Algebra", "Calculus");
courses.addEdge("Geometry", "Trigonometry");
courses.addEdge("Algebra", "Linear Algebra");
courses.addEdge("Calculus", "Differential Equations");
courses.addEdge("Linear Algebra", "Machine Learning");
courses.addEdge("Calculus", "Machine Learning");
courses.addEdge("Trigonometry", "Physics");

console.log("Course dependency graph:");
courses.display();

console.log("\nKahn's Algorithm (BFS-based):");
const kahnResult = topologicalSortKahns(courses);
console.log("  Order:", kahnResult.join(" -> "));

console.log("\nDFS-based Topological Sort:");
const dfsResult = topologicalSortDFS(courses);
console.log("  Order:", dfsResult.join(" -> "));

// ============================================================
// EXAMPLE 4 — Cycle Detection
// Story: RBI monitors circular money flows (money laundering). If money goes
// from Account A -> B -> C -> A, that's a cycle — a potential red flag for
// illegal circular transactions. The system must detect such cycles in
// real-time across millions of transactions.
// ============================================================

// WHY: Cycles in directed graphs mean deadlocks (OS), circular dependencies
// (build systems), or infinite loops (state machines). Detecting them is
// critical for system correctness.

// --- Cycle Detection in Undirected Graph ---
// DFS with parent tracking: if we visit a node that's already visited
// and it's NOT our parent, we found a cycle.
// Big-O: Time O(V + E), Space O(V)

function hasCycleUndirected(graph) {
  const visited = new Set();

  function dfs(node, parent) {
    visited.add(node);

    for (const edge of graph.getNeighbors(node)) {
      if (!visited.has(edge.node)) {
        if (dfs(edge.node, node)) return true; // Cycle found deeper
      } else if (edge.node !== parent) {
        // Visited node that is NOT our parent = CYCLE!
        console.log(`  Cycle detected: ${node} -> ${edge.node} (already visited, not parent)`);
        return true;
      }
    }

    return false;
  }

  for (const vertex of graph.getVertices()) {
    if (!visited.has(vertex)) {
      if (dfs(vertex, null)) return true;
    }
  }

  return false;
}

// --- Cycle Detection in Directed Graph (3-Color DFS) ---
// WHITE (unvisited) -> GRAY (in progress) -> BLACK (done)
// If DFS encounters a GRAY node, it means we're still processing its
// subtree and found a back edge = CYCLE!
// Big-O: Time O(V + E), Space O(V)

function hasCycleDirected(graph) {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map();

  for (const vertex of graph.getVertices()) {
    color.set(vertex, WHITE);
  }

  function dfs(node) {
    color.set(node, GRAY); // Mark as "being processed"

    for (const edge of graph.getNeighbors(node)) {
      if (color.get(edge.node) === GRAY) {
        // Back edge to a node still being processed = CYCLE!
        console.log(`  Cycle detected: ${node} -> ${edge.node} (back edge to GRAY node)`);
        return true;
      }
      if (color.get(edge.node) === WHITE) {
        if (dfs(edge.node)) return true;
      }
      // BLACK nodes are fully processed — no cycle through them
    }

    color.set(node, BLACK); // Mark as "fully processed"
    return false;
  }

  for (const vertex of graph.getVertices()) {
    if (color.get(vertex) === WHITE) {
      if (dfs(vertex)) return true;
    }
  }

  return false;
}

console.log("\n=== CYCLE DETECTION ===");

// Undirected graph WITH cycle
console.log("Undirected Graph with Cycle:");
const undirectedCyclic = new Graph(false);
undirectedCyclic.addEdge("A", "B");
undirectedCyclic.addEdge("B", "C");
undirectedCyclic.addEdge("C", "A"); // Creates cycle A-B-C-A
undirectedCyclic.display();
console.log(`Has cycle? ${hasCycleUndirected(undirectedCyclic)}\n`);

// Directed graph WITH cycle
console.log("Directed Graph with Cycle:");
const directedCyclic = new Graph(true);
directedCyclic.addEdge("Login", "Dashboard");
directedCyclic.addEdge("Dashboard", "Settings");
directedCyclic.addEdge("Settings", "Profile");
directedCyclic.addEdge("Profile", "Dashboard"); // Cycle: Dashboard->Settings->Profile->Dashboard
directedCyclic.display();
console.log(`Has cycle? ${hasCycleDirected(directedCyclic)}\n`);

// ============================================================
// EXAMPLE 5 — Connected Components
// Story: During Jio's network rollout, engineers need to verify full
// connectivity. If 100 towers exist but form 3 separate clusters, some
// users can't reach others. Counting connected components reveals how
// many isolated sub-networks exist and which towers need bridging.
// ============================================================

// WHY: Connected components tell you the structural integrity of a graph.
// In social networks, each component is an isolated community.
// In infrastructure, disconnected components mean service gaps.

// --- Undirected: BFS/DFS from each unvisited node ---
// Big-O: Time O(V + E), Space O(V)
function findConnectedComponents(graph) {
  const visited = new Set();
  const components = [];

  for (const vertex of graph.getVertices()) {
    if (!visited.has(vertex)) {
      const component = [];
      const queue = [vertex];
      visited.add(vertex);

      while (queue.length > 0) {
        const current = queue.shift();
        component.push(current);

        for (const edge of graph.getNeighbors(current)) {
          if (!visited.has(edge.node)) {
            visited.add(edge.node);
            queue.push(edge.node);
          }
        }
      }

      components.push(component);
    }
  }

  return components;
}

console.log("\n=== CONNECTED COMPONENTS ===");

const jioNetwork = new Graph(false);
// Cluster 1: Mumbai region
jioNetwork.addEdge("Mumbai-T1", "Mumbai-T2");
jioNetwork.addEdge("Mumbai-T2", "Mumbai-T3");
jioNetwork.addEdge("Mumbai-T1", "Mumbai-T3");
// Cluster 2: Delhi region
jioNetwork.addEdge("Delhi-T1", "Delhi-T2");
// Cluster 3: Isolated tower
jioNetwork.addVertex("Chennai-T1");

console.log("Jio Tower Network:");
jioNetwork.display();

const components = findConnectedComponents(jioNetwork);
console.log(`\nNumber of connected components: ${components.length}`);
components.forEach((comp, i) => {
  console.log(`  Component ${i + 1}: [${comp.join(", ")}]`);
});

// ============================================================
// EXAMPLE 6 — Course Schedule Problem (Cycle Detection in DAG)
// Story: IIT Bombay students register for courses. Some courses have
// prerequisites: CS201 requires CS101. But what if CS101 accidentally
// requires CS201? That's a circular dependency — impossible to schedule!
// The registrar's system must detect such cycles and reject invalid schedules.
// ============================================================

// WHY: This is a classic interview problem (LeetCode #207). It combines
// graph construction with cycle detection in directed graphs.

// Big-O: Time O(V + E), Space O(V)
function canFinishCourses(numCourses, prerequisites) {
  // Build directed graph: prerequisite -> course
  const graph = new Map();
  const inDegree = new Map();

  for (let i = 0; i < numCourses; i++) {
    graph.set(i, []);
    inDegree.set(i, 0);
  }

  for (const [course, prereq] of prerequisites) {
    graph.get(prereq).push(course);
    inDegree.set(course, inDegree.get(course) + 1);
  }

  // Kahn's algorithm — if we can process all courses, no cycle
  const queue = [];
  for (const [course, degree] of inDegree) {
    if (degree === 0) queue.push(course);
  }

  let processedCount = 0;
  const order = [];

  while (queue.length > 0) {
    const current = queue.shift();
    order.push(current);
    processedCount++;

    for (const next of graph.get(current)) {
      inDegree.set(next, inDegree.get(next) - 1);
      if (inDegree.get(next) === 0) {
        queue.push(next);
      }
    }
  }

  return {
    canFinish: processedCount === numCourses,
    order: processedCount === numCourses ? order : null,
  };
}

console.log("=== COURSE SCHEDULE PROBLEM ===");

// Valid schedule
const prereqs1 = [
  [1, 0], // Course 1 requires Course 0
  [2, 0], // Course 2 requires Course 0
  [3, 1], // Course 3 requires Course 1
  [3, 2], // Course 3 requires Course 2
];
const result1 = canFinishCourses(4, prereqs1);
console.log("4 courses, valid prerequisites:");
prereqs1.forEach(([c, p]) => console.log(`  Course ${c} requires Course ${p}`));
console.log(`Can finish? ${result1.canFinish}`);
console.log(`Order: ${result1.order.join(" -> ")}`);

// Invalid schedule (cycle)
const prereqs2 = [
  [1, 0], // Course 1 requires Course 0
  [0, 1], // Course 0 requires Course 1 — CYCLE!
];
const result2 = canFinishCourses(2, prereqs2);
console.log("\n2 courses, circular prerequisites:");
prereqs2.forEach(([c, p]) => console.log(`  Course ${c} requires Course ${p}`));
console.log(`Can finish? ${result2.canFinish}`);

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Dijkstra's Algorithm: shortest path in weighted graphs (non-negative).
//    Time: O((V+E) log V) with min-heap. DOES NOT work with negative weights.
// 2. Relaxation is the core of Dijkstra: if dist[u]+w(u,v) < dist[v], update.
// 3. Topological Sort: linear ordering of DAG vertices. Every edge u->v means
//    u comes before v. Time: O(V+E).
//    - Kahn's (BFS): use in-degree counts. Also detects cycles.
//    - DFS-based: post-order then reverse.
// 4. Cycle Detection:
//    - Undirected: DFS + parent tracking. Back edge to non-parent = cycle.
//    - Directed: 3-color DFS (WHITE/GRAY/BLACK). Back edge to GRAY = cycle.
// 5. Connected Components: BFS/DFS from each unvisited node. Time: O(V+E).
// 6. Course Schedule = topological sort + cycle detection combined.
// 7. Cheapest flights within K stops = modified BFS with cost tracking.
// 8. For negative weights: use Bellman-Ford (O(V*E)).
//    For all-pairs shortest path: use Floyd-Warshall (O(V^3)).
// ============================================================

console.log("\n=== BIG-O SUMMARY ===");
console.log("+---------------------------+---------------------+--------+");
console.log("| Algorithm                 | Time                | Space  |");
console.log("+---------------------------+---------------------+--------+");
console.log("| Dijkstra (min-heap)       | O((V+E) log V)      | O(V)   |");
console.log("| Dijkstra (array)          | O(V^2)              | O(V)   |");
console.log("| Topological Sort (Kahn)   | O(V + E)            | O(V)   |");
console.log("| Topological Sort (DFS)    | O(V + E)            | O(V)   |");
console.log("| Cycle Detection           | O(V + E)            | O(V)   |");
console.log("| Connected Components      | O(V + E)            | O(V)   |");
console.log("| Bellman-Ford              | O(V * E)            | O(V)   |");
console.log("| Floyd-Warshall            | O(V^3)              | O(V^2) |");
console.log("+---------------------------+---------------------+--------+");
