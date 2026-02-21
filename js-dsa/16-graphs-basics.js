// ============================================================
// FILE 16: GRAPHS — BASICS, BFS & DFS
// Topic: Understanding graph data structures and fundamental traversal algorithms
// WHY: Graphs model real-world relationships — social networks, maps, internet
//   routing, dependency resolution, and recommendation engines. Nearly every
//   system at scale (Google Maps, LinkedIn, Swiggy delivery) relies on graphs.
// ============================================================

// ============================================================
// DELHI METRO — THE GRAPH STORY
// Imagine the Delhi Metro network: each station (Rajiv Chowk, Huda City Centre,
// Kashmere Gate) is a NODE. Each metro line connecting two stations is an EDGE.
// Finding the shortest path from Rajiv Chowk to Huda City Centre is literally
// a graph traversal problem — BFS gives you the fewest stops, DFS explores
// every branch before backtracking. This is how Google Maps, Ola, and DMRC's
// own journey planner work under the hood.
// ============================================================

// ============================================================
// EXAMPLE 1 — What is a Graph?
// Story: Think of India's railway network. Every city (Delhi, Mumbai, Chennai)
// is a node. Every train route connecting two cities is an edge. Some routes
// are one-way (directed), some go both ways (undirected). Some routes have
// distances (weighted). The entire Indian Railways map is one massive graph.
// ============================================================

// WHY: A graph is the most general-purpose data structure. Trees, linked lists,
// and even arrays can be represented as graphs. Understanding graphs unlocks
// the ability to model virtually any relationship-based problem.

// --- Definition ---
// Graph G = (V, E) where:
//   V = set of vertices (nodes)
//   E = set of edges (connections between nodes)

// --- Types of Graphs ---
// 1. Directed vs Undirected:
//    - Directed (digraph): edges have direction (A -> B doesn't mean B -> A)
//      Example: Instagram follow — you follow someone, they may not follow back
//    - Undirected: edges go both ways (A -- B means A->B and B->A)
//      Example: Facebook friendship — mutual by definition

// 2. Weighted vs Unweighted:
//    - Weighted: edges have values (distance, cost, time)
//      Example: road network — Bangalore to Mysore is 150km
//    - Unweighted: all edges are equal
//      Example: social connections — either connected or not

// 3. Cyclic vs Acyclic:
//    - Cyclic: contains at least one cycle (A->B->C->A)
//      Example: circular metro line
//    - Acyclic: no cycles. DAG (Directed Acyclic Graph) is very common
//      Example: course prerequisites — no circular dependencies

console.log("=== TYPES OF GRAPHS ===");
console.log("Directed: Instagram follows (A->B, not necessarily B->A)");
console.log("Undirected: Facebook friends (A--B, always mutual)");
console.log("Weighted: Road network (edges have distances)");
console.log("Unweighted: Social connections (connected or not)");
console.log("Cyclic: Circular metro line (A->B->C->A)");
console.log("Acyclic (DAG): Course prerequisites\n");

// ============================================================
// EXAMPLE 2 — Graph Representations
// Story: Flipkart's warehouse network connects 50 cities. The tech team must
// decide: do we store connections in a big 50x50 grid (adjacency matrix) or
// as a list of neighbors for each city (adjacency list)? Since most cities
// connect to only 3-5 others (sparse graph), the adjacency list wins — it
// uses O(V+E) space instead of O(V^2) for the matrix.
// ============================================================

// WHY: How you store a graph determines the time and space complexity of
// every operation. Choosing wrong can make your code 100x slower.

// --- Adjacency Matrix ---
// A 2D array where matrix[i][j] = 1 (or weight) if edge from i to j
// Space: O(V^2) — even if graph is sparse
// Lookup edge: O(1) — just check matrix[i][j]
// Find all neighbors: O(V) — scan entire row
// Best for: dense graphs where most nodes connect to most others

console.log("=== ADJACENCY MATRIX ===");

// Example: 4 stations — 0:Rajiv Chowk, 1:Mandi House, 2:Barakhamba, 3:Patel Chowk
const matrixGraph = [
  //  0  1  2  3
  [0, 1, 1, 1], // 0: Rajiv Chowk connects to 1, 2, 3
  [1, 0, 1, 0], // 1: Mandi House connects to 0, 2
  [1, 1, 0, 0], // 2: Barakhamba connects to 0, 1
  [1, 0, 0, 0], // 3: Patel Chowk connects to 0
];

console.log("Stations: 0=Rajiv Chowk, 1=Mandi House, 2=Barakhamba, 3=Patel Chowk");
console.log("Matrix representation:");
matrixGraph.forEach((row, i) => console.log(`  Station ${i}: [${row.join(", ")}]`));
console.log(`Edge between 0 and 1? ${matrixGraph[0][1] === 1}`); // O(1) lookup
console.log(`Edge between 1 and 3? ${matrixGraph[1][3] === 1}`); // O(1) lookup

// --- Adjacency List ---
// A Map/Object where each key is a node and value is array of neighbors
// Space: O(V + E) — only stores actual edges
// Lookup edge: O(degree of node) — scan neighbor list
// Find all neighbors: O(1) — directly access the list
// Best for: sparse graphs (most real-world graphs)

console.log("\n=== ADJACENCY LIST ===");

const listGraph = {
  "Rajiv Chowk": ["Mandi House", "Barakhamba", "Patel Chowk"],
  "Mandi House": ["Rajiv Chowk", "Barakhamba"],
  "Barakhamba": ["Rajiv Chowk", "Mandi House"],
  "Patel Chowk": ["Rajiv Chowk"],
};

Object.entries(listGraph).forEach(([station, neighbors]) => {
  console.log(`  ${station} -> [${neighbors.join(", ")}]`);
});

// --- When to use which ---
// Adjacency Matrix: dense graphs, quick edge lookups, small V
//   Big-O: Space O(V^2), Edge lookup O(1), All neighbors O(V)
// Adjacency List: sparse graphs (most real-world), large V
//   Big-O: Space O(V+E), Edge lookup O(degree), All neighbors O(1)

console.log("\n=== COMPARISON ===");
console.log("Matrix: O(V^2) space | O(1) edge lookup | O(V) neighbors");
console.log("List:   O(V+E) space | O(deg) edge lookup | O(1) neighbors");
console.log("Real-world winner: Adjacency List (most graphs are sparse)\n");

// ============================================================
// EXAMPLE 3 — Graph Class Implementation (Adjacency List)
// Story: Zomato builds a graph of restaurants and delivery zones. Each
// restaurant is a vertex, each delivery route is an edge with a distance
// weight. The graph must support adding/removing restaurants and routes
// dynamically as Zomato expands to new cities.
// ============================================================

// WHY: A clean Graph class is the foundation for every graph algorithm.
// Once you have addVertex, addEdge, removeEdge, removeVertex, you can
// implement BFS, DFS, Dijkstra, and everything else on top.

class Graph {
  constructor(isDirected = false) {
    this.adjacencyList = new Map(); // Map<vertex, Array<{node, weight}>>
    this.isDirected = isDirected;
  }

  // --- addVertex(v) ---
  // Big-O: O(1)
  addVertex(vertex) {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, []);
    }
    return this;
  }

  // --- addEdge(v1, v2, weight) ---
  // Big-O: O(1) for adjacency list insertion
  addEdge(v1, v2, weight = 1) {
    // Ensure both vertices exist
    this.addVertex(v1);
    this.addVertex(v2);

    this.adjacencyList.get(v1).push({ node: v2, weight });

    // If undirected, add edge in both directions
    if (!this.isDirected) {
      this.adjacencyList.get(v2).push({ node: v1, weight });
    }
    return this;
  }

  // --- removeEdge(v1, v2) ---
  // Big-O: O(E) in worst case — scan neighbor list
  removeEdge(v1, v2) {
    if (this.adjacencyList.has(v1)) {
      this.adjacencyList.set(
        v1,
        this.adjacencyList.get(v1).filter((edge) => edge.node !== v2)
      );
    }
    if (!this.isDirected && this.adjacencyList.has(v2)) {
      this.adjacencyList.set(
        v2,
        this.adjacencyList.get(v2).filter((edge) => edge.node !== v1)
      );
    }
    return this;
  }

  // --- removeVertex(v) ---
  // Big-O: O(V + E) — must remove all edges referencing this vertex
  removeVertex(vertex) {
    if (!this.adjacencyList.has(vertex)) return this;

    // Remove all edges TO this vertex from other vertices
    for (const [v, edges] of this.adjacencyList) {
      this.adjacencyList.set(
        v,
        edges.filter((edge) => edge.node !== vertex)
      );
    }

    // Remove the vertex itself
    this.adjacencyList.delete(vertex);
    return this;
  }

  // --- getNeighbors(v) ---
  // Big-O: O(1) — direct access to neighbor list
  getNeighbors(vertex) {
    return this.adjacencyList.get(vertex) || [];
  }

  // --- hasEdge(v1, v2) ---
  // Big-O: O(degree of v1)
  hasEdge(v1, v2) {
    if (!this.adjacencyList.has(v1)) return false;
    return this.adjacencyList.get(v1).some((edge) => edge.node === v2);
  }

  // --- getVertices() ---
  getVertices() {
    return [...this.adjacencyList.keys()];
  }

  // --- display() ---
  display() {
    for (const [vertex, edges] of this.adjacencyList) {
      const connections = edges
        .map((e) => `${e.node}(w:${e.weight})`)
        .join(", ");
      console.log(`  ${vertex} -> [${connections}]`);
    }
  }
}

// Build Delhi Metro graph (undirected, unweighted)
console.log("=== DELHI METRO GRAPH ===");
const metro = new Graph(false); // undirected
metro.addEdge("Rajiv Chowk", "Mandi House");
metro.addEdge("Rajiv Chowk", "Barakhamba");
metro.addEdge("Rajiv Chowk", "Patel Chowk");
metro.addEdge("Mandi House", "Pragati Maidan");
metro.addEdge("Barakhamba", "Mandi House");
metro.addEdge("Patel Chowk", "Central Secretariat");
metro.addEdge("Central Secretariat", "Udyog Bhawan");
metro.addEdge("Udyog Bhawan", "Race Course");
metro.addEdge("Race Course", "Jor Bagh");
metro.addEdge("Jor Bagh", "INA");
metro.addEdge("INA", "AIIMS");
metro.addEdge("AIIMS", "Green Park");
metro.addEdge("Green Park", "Hauz Khas");
metro.addEdge("Hauz Khas", "Malviya Nagar");
metro.addEdge("Malviya Nagar", "Saket");
metro.display();

console.log(`\nHas edge Rajiv Chowk - Mandi House? ${metro.hasEdge("Rajiv Chowk", "Mandi House")}`);
console.log(`Has edge Rajiv Chowk - AIIMS? ${metro.hasEdge("Rajiv Chowk", "AIIMS")}`);
console.log(`Neighbors of Rajiv Chowk:`, metro.getNeighbors("Rajiv Chowk").map(e => e.node));

// Test directed graph
console.log("\n=== DIRECTED GRAPH (Instagram) ===");
const instagram = new Graph(true); // directed
instagram.addEdge("Virat", "Anushka");   // Virat follows Anushka
instagram.addEdge("Anushka", "Virat");   // Anushka follows Virat back
instagram.addEdge("Virat", "Dhoni");     // Virat follows Dhoni
instagram.addEdge("Rohit", "Virat");     // Rohit follows Virat
instagram.display();
console.log(`Virat follows Dhoni? ${instagram.hasEdge("Virat", "Dhoni")}`);   // true
console.log(`Dhoni follows Virat? ${instagram.hasEdge("Dhoni", "Virat")}`);   // false

// ============================================================
// EXAMPLE 4 — BFS (Breadth-First Search)
// Story: IRCTC needs to find the route with fewest stops from Delhi to
// Chennai. BFS explores stations level by level — first all stations 1 stop
// away, then 2 stops, then 3. The moment it reaches Chennai, that's the
// shortest path by number of stops. This is exactly how Google Maps finds
// the fewest-transfer metro route.
// ============================================================

// WHY: BFS guarantees the shortest path in unweighted graphs. It explores
// all neighbors at the current depth before moving deeper. This level-by-level
// approach is the foundation for shortest-path, connected-components, and
// many other algorithms.

// --- BFS Algorithm ---
// 1. Start at source, add to queue, mark visited
// 2. While queue not empty:
//    a. Dequeue front node
//    b. Process it
//    c. Enqueue all unvisited neighbors, mark visited
// Big-O: Time O(V + E), Space O(V)

// BFS traversal — returns order of visited nodes
function bfsTraversal(graph, start) {
  const visited = new Set();
  const queue = [start];     // Using array as queue (for simplicity)
  const order = [];

  visited.add(start);

  while (queue.length > 0) {
    const current = queue.shift(); // Dequeue front — O(n) with array, O(1) with real queue
    order.push(current);

    for (const edge of graph.getNeighbors(current)) {
      if (!visited.has(edge.node)) {
        visited.add(edge.node);  // Mark visited BEFORE enqueueing (prevents duplicates)
        queue.push(edge.node);
      }
    }
  }

  return order;
}

console.log("\n=== BFS TRAVERSAL (Delhi Metro from Rajiv Chowk) ===");
const bfsOrder = bfsTraversal(metro, "Rajiv Chowk");
console.log("Visit order (level by level):");
bfsOrder.forEach((station, i) => console.log(`  Step ${i + 1}: ${station}`));

// --- BFS Shortest Path (unweighted) ---
// WHY: BFS naturally finds the shortest path in unweighted graphs because
// it processes all nodes at distance d before distance d+1.

function bfsShortestPath(graph, start, end) {
  const visited = new Set();
  const queue = [start];
  const previous = new Map(); // To reconstruct path

  visited.add(start);
  previous.set(start, null);

  while (queue.length > 0) {
    const current = queue.shift();

    // Found the destination!
    if (current === end) {
      // Reconstruct path by following previous pointers
      const path = [];
      let node = end;
      while (node !== null) {
        path.unshift(node);       // Add to front
        node = previous.get(node);
      }
      return { path, distance: path.length - 1 };
    }

    for (const edge of graph.getNeighbors(current)) {
      if (!visited.has(edge.node)) {
        visited.add(edge.node);
        previous.set(edge.node, current); // Track where we came from
        queue.push(edge.node);
      }
    }
  }

  return { path: [], distance: -1 }; // No path found
}

console.log("\n=== BFS SHORTEST PATH ===");
const result1 = bfsShortestPath(metro, "Rajiv Chowk", "Hauz Khas");
console.log(`Rajiv Chowk -> Hauz Khas:`);
console.log(`  Path: ${result1.path.join(" -> ")}`);
console.log(`  Stops: ${result1.distance}`);

const result2 = bfsShortestPath(metro, "Rajiv Chowk", "Saket");
console.log(`Rajiv Chowk -> Saket:`);
console.log(`  Path: ${result2.path.join(" -> ")}`);
console.log(`  Stops: ${result2.distance}`);

// ============================================================
// EXAMPLE 5 — DFS (Depth-First Search)
// Story: PhonePe's fraud detection team traces suspicious transaction chains.
// Starting from one flagged account, DFS dives deep along each transaction
// chain (A sent to B, B sent to C, C sent to D...) before backtracking.
// This deep exploration finds the entire fraud ring, even through complex
// chains of shell companies.
// ============================================================

// WHY: DFS goes as deep as possible before backtracking. It's ideal for
// problems involving paths, cycles, connected components, and topological
// ordering. It uses less memory than BFS for deep graphs.

// --- DFS Recursive ---
// Big-O: Time O(V + E), Space O(V) for call stack

function dfsRecursive(graph, start) {
  const visited = new Set();
  const order = [];

  function dfs(node) {
    visited.add(node);
    order.push(node);

    for (const edge of graph.getNeighbors(node)) {
      if (!visited.has(edge.node)) {
        dfs(edge.node); // Recurse deeper
      }
    }
  }

  dfs(start);
  return order;
}

console.log("\n=== DFS RECURSIVE (Delhi Metro from Rajiv Chowk) ===");
const dfsRecOrder = dfsRecursive(metro, "Rajiv Chowk");
console.log("Visit order (depth-first):");
dfsRecOrder.forEach((station, i) => console.log(`  Step ${i + 1}: ${station}`));

// --- DFS Iterative (using explicit stack) ---
// WHY: Recursive DFS can cause stack overflow on deep graphs (>10,000 nodes).
// Iterative DFS uses an explicit stack to avoid this limit.
// Big-O: Time O(V + E), Space O(V)

function dfsIterative(graph, start) {
  const visited = new Set();
  const stack = [start];
  const order = [];

  while (stack.length > 0) {
    const current = stack.pop(); // LIFO — go deep first

    if (visited.has(current)) continue; // Skip if already visited
    visited.add(current);
    order.push(current);

    // Push neighbors in reverse order so first neighbor is processed first
    const neighbors = graph.getNeighbors(current);
    for (let i = neighbors.length - 1; i >= 0; i--) {
      if (!visited.has(neighbors[i].node)) {
        stack.push(neighbors[i].node);
      }
    }
  }

  return order;
}

console.log("\n=== DFS ITERATIVE (Delhi Metro from Rajiv Chowk) ===");
const dfsIterOrder = dfsIterative(metro, "Rajiv Chowk");
console.log("Visit order (depth-first, iterative):");
dfsIterOrder.forEach((station, i) => console.log(`  Step ${i + 1}: ${station}`));

// ============================================================
// EXAMPLE 6 — BFS vs DFS Comparison
// Story: Amazon India has two teams optimizing delivery. Team A (BFS) checks
// all warehouses 1 hop away first, then 2 hops — guaranteed to find the
// closest warehouse. Team B (DFS) dives deep into one supply chain at a time —
// great for mapping the entire chain but doesn't guarantee finding the nearest.
// ============================================================

// WHY: Knowing when to use BFS vs DFS is a core interview skill.

console.log("\n=== BFS vs DFS COMPARISON ===");
console.log("+-----------------+---------------------------+---------------------------+");
console.log("| Feature         | BFS                       | DFS                       |");
console.log("+-----------------+---------------------------+---------------------------+");
console.log("| Data Structure  | Queue (FIFO)              | Stack (LIFO) / Recursion  |");
console.log("| Exploration     | Level by level (wide)     | Branch by branch (deep)   |");
console.log("| Shortest Path   | YES (unweighted)          | NO (may find longer path) |");
console.log("| Memory          | O(V) — stores entire level| O(h) — h = max depth      |");
console.log("| Use Cases       | Shortest path, level order| Topological sort, cycles  |");
console.log("| Time            | O(V + E)                  | O(V + E)                  |");
console.log("+-----------------+---------------------------+---------------------------+");

// ============================================================
// EXAMPLE 7 — Problem: Does Path Exist Between Two Nodes?
// Story: LinkedIn wants to check if two professionals are connected through
// any chain of connections. If Ravi in Delhi can reach Sunita in Mumbai through
// mutual connections, LinkedIn shows "2nd degree" or "3rd degree" connection.
// ============================================================

// WHY: Path existence is the most fundamental graph query. It's used in social
// networks, network connectivity, and reachability analysis.

// Big-O: Time O(V + E), Space O(V)
function hasPath(graph, start, end) {
  if (start === end) return true;

  const visited = new Set();
  const queue = [start];
  visited.add(start);

  while (queue.length > 0) {
    const current = queue.shift();

    for (const edge of graph.getNeighbors(current)) {
      if (edge.node === end) return true;
      if (!visited.has(edge.node)) {
        visited.add(edge.node);
        queue.push(edge.node);
      }
    }
  }

  return false;
}

console.log("\n=== PATH EXISTENCE ===");
console.log(`Path from Rajiv Chowk to Saket? ${hasPath(metro, "Rajiv Chowk", "Saket")}`);
console.log(`Path from Rajiv Chowk to Green Park? ${hasPath(metro, "Rajiv Chowk", "Green Park")}`);

// Add an isolated station
metro.addVertex("Noida City Centre");
console.log(`Path from Rajiv Chowk to Noida City Centre? ${hasPath(metro, "Rajiv Chowk", "Noida City Centre")}`);
// false — no edge connects them

// ============================================================
// EXAMPLE 8 — Problem: Count Connected Components
// Story: During a network outage at Jio, the engineering team needs to count
// how many isolated network clusters exist. Each cluster is a connected
// component — devices within a cluster can communicate, but different clusters
// are disconnected. Counting components tells them how fragmented the network is.
// ============================================================

// WHY: Connected components reveal the structure of a graph. In social networks,
// each component is an isolated community. In networks, each component is an
// independent sub-network.

// Big-O: Time O(V + E), Space O(V)
function countConnectedComponents(graph) {
  const visited = new Set();
  let count = 0;

  for (const vertex of graph.getVertices()) {
    if (!visited.has(vertex)) {
      // Found a new component — BFS/DFS to mark all nodes in it
      count++;
      const queue = [vertex];
      visited.add(vertex);

      while (queue.length > 0) {
        const current = queue.shift();
        for (const edge of graph.getNeighbors(current)) {
          if (!visited.has(edge.node)) {
            visited.add(edge.node);
            queue.push(edge.node);
          }
        }
      }
    }
  }

  return count;
}

console.log("\n=== CONNECTED COMPONENTS ===");

// Build a graph with multiple components
const network = new Graph(false);
// Component 1: Delhi cluster
network.addEdge("Delhi-Server1", "Delhi-Server2");
network.addEdge("Delhi-Server2", "Delhi-Server3");
// Component 2: Mumbai cluster
network.addEdge("Mumbai-Server1", "Mumbai-Server2");
// Component 3: Isolated server
network.addVertex("Chennai-Server1");

console.log("Network topology:");
network.display();
console.log(`Connected components: ${countConnectedComponents(network)}`);
// Output: 3 (Delhi cluster, Mumbai cluster, Chennai isolated)

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. A graph is (V, E) — vertices and edges. Most flexible data structure.
// 2. Adjacency List (O(V+E) space) beats Adjacency Matrix (O(V^2)) for
//    sparse graphs, which is most real-world graphs.
// 3. BFS uses a Queue, explores level-by-level, finds shortest unweighted path.
//    Time: O(V+E), Space: O(V).
// 4. DFS uses Stack/Recursion, goes deep first. Same time O(V+E) but
//    less memory for deep graphs. Used for cycles, topo sort, path finding.
// 5. ALWAYS mark nodes visited BEFORE adding to queue/stack to avoid
//    infinite loops in cyclic graphs.
// 6. Path existence, connected components, and shortest path (unweighted)
//    are fundamental BFS/DFS applications.
// 7. BFS = shortest path (unweighted), level-order.
//    DFS = topological sort, cycle detection, exhaustive search.
// 8. In interviews: clarify directed/undirected, weighted/unweighted,
//    cyclic/acyclic before coding.
// ============================================================

console.log("\n=== BIG-O SUMMARY ===");
console.log("+-----------------------+------------------+------------------+");
console.log("| Operation             | Adjacency List   | Adjacency Matrix |");
console.log("+-----------------------+------------------+------------------+");
console.log("| Add Vertex            | O(1)             | O(V^2) resize    |");
console.log("| Add Edge              | O(1)             | O(1)             |");
console.log("| Remove Edge           | O(E)             | O(1)             |");
console.log("| Remove Vertex         | O(V + E)         | O(V^2)           |");
console.log("| Query Edge            | O(degree)        | O(1)             |");
console.log("| Get Neighbors         | O(1)             | O(V)             |");
console.log("| BFS / DFS             | O(V + E)         | O(V^2)           |");
console.log("| Space                 | O(V + E)         | O(V^2)           |");
console.log("+-----------------------+------------------+------------------+");
