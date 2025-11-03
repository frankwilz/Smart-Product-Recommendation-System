#!/usr/bin/env node
/**
 * Smart Product Recommendation System — Fully Interactive (Medium dataset)
 * - Medium dataset (25 products) to demonstrate scalability and richer recommendations
 * - Graph construction from purchase history + category similarity
 * - BFS traversal (limited depth) + weighted scoring
 * - Max-heap for efficient top-K selection
 * - Interactive CLI accepts product ID or name (case-insensitive substring match)
 *
 * Run:
 *   node recommendation_system_interactive.js
 *
 * Exported for unit testing: buildGraph, recommend, MaxHeap, products, purchaseHistory
 */

/* =====================
   1) DATA (25 products) the more the better i think:)
   ===================== */
const products = {
  1:  { id:1,  name:"Laptop", category:"Electronics", price:1200, quantity:8,  popularity:95 },
  2:  { id:2,  name:"Phone", category:"Electronics", price:800,  quantity:20, popularity:98 },
  3:  { id:3,  name:"Mouse", category:"Electronics", price:25,   quantity:150,popularity:65 },
  4:  { id:4,  name:"Keyboard", category:"Electronics", price:55,  quantity:120,popularity:70 },
  5:  { id:5,  name:"Monitor", category:"Electronics", price:230, quantity:35, popularity:80 },
  6:  { id:6,  name:"Webcam", category:"Electronics", price:90,  quantity:40, popularity:68 },
  7:  { id:7,  name:"USB-C Hub", category:"Electronics", price:45, quantity:70, popularity:60 },
  8:  { id:8,  name:"Office Chair", category:"Furniture", price:140, quantity:18, popularity:72 },
  9:  { id:9,  name:"Standing Desk", category:"Furniture", price:350, quantity:6, popularity:85 },
  10: { id:10, name:"Desk Lamp", category:"Furniture", price:28, quantity:60, popularity:60 },
  11: { id:11, name:"Notebook", category:"Stationery", price:5,  quantity:300,popularity:50 },
  12: { id:12, name:"Pen Pack", category:"Stationery", price:4, quantity:600,popularity:45 },
  13: { id:13, name:"Planner", category:"Stationery", price:12, quantity:140,popularity:55 },
  14: { id:14, name:"Backpack", category:"Accessories", price:65, quantity:70, popularity:75 },
  15: { id:15, name:"Headphones", category:"Electronics", price:150, quantity:30, popularity:88 },
  16: { id:16, name:"Bluetooth Speaker", category:"Electronics", price:120, quantity:25, popularity:82 },
  17: { id:17, name:"Coffee Mug", category:"Home", price:12, quantity:200,popularity:58 },
  18: { id:18, name:"Water Bottle", category:"Home", price:18, quantity:160,popularity:62 },
  19: { id:19, name:"Mouse Pad", category:"Accessories", price:10, quantity:210,popularity:48 },
  20: { id:20, name:"External SSD", category:"Electronics", price:140, quantity:22,popularity:77 },
  21: { id:21, name:"HDMI Cable", category:"Electronics", price:10, quantity:400,popularity:50 },
  22: { id:22, name:"Graphic Tablet", category:"Electronics", price:220, quantity:12,popularity:66 },
  23: { id:23, name:"Printer", category:"Electronics", price:180, quantity:9,popularity:63 },
  24: { id:24, name:"Stapler", category:"Stationery", price:8, quantity:180,popularity:40 },
  25: { id:25, name:"Desk Organizer", category:"Furniture", price:22, quantity:90,popularity:52 },
};

/* =====================
   2) Purchase history (orders)
   - Each order is an array of product IDs that were bought together
   - Designed to create realistic co-purchase signals
   ===================== */
const purchaseHistory = [
  [1, 3, 4, 6],        // laptop + mouse + keyboard + webcam
  [2, 3, 7],           // phone + mouse + USB-C hub
  [1, 5, 20],          // laptop + monitor + external SSD
  [15, 16],            // headphones + speaker
  [8, 9, 25],          // chair + standing desk + organizer
  [11, 12, 13],        // notebook + pen + planner
  [14, 11],            // backpack + notebook
  [2, 6, 21],          // phone + webcam + HDMI cable
  [1, 3, 10],          // laptop + mouse + lamp
  [22, 3],             // graphic tablet + mouse
  [23, 21, 24],        // printer + hdmi + stapler
  [5, 20, 21],         // monitor + externalSSD + hdmi
  [15, 7],             // headphones + USB-C hub
  [17, 18],            // mug + water bottle
  [19, 3],             // mouse pad + mouse
  [4, 3, 19],          // keyboard + mouse + mousepad
  [14, 25],            // backpack + organizer
  [9, 8],              // standing desk + chair
  [2, 15, 6],          // phone + headphones + webcam
  [13, 11],            // planner + notebook
  [1, 20, 7],          // laptop + externalSSD + hub
  [22, 23],            // tablet + printer
  [5, 6],              // monitor + webcam
  [10, 8],             // lamp + chair
  [12, 24, 11],        // pens + stapler + notebook
];

/* =====================
   3) Graph Construction
   - Graph represented as Map<id, Map<neighborId, weight>>
   - Co-purchase weight: 3.0 (strong)
   - Same-category weight: 1.0 (weaker)
   ===================== */
function buildGraph(productsObj, purchaseHistoryArr) {
  const graph = new Map();
  for (const idStr of Object.keys(productsObj)) {
    graph.set(Number(idStr), new Map());
  }

  // co-purchase edges
  for (const order of purchaseHistoryArr) {
    for (let i = 0; i < order.length; i++) {
      for (let j = i + 1; j < order.length; j++) {
        const a = order[i], b = order[j];
        incrementEdge(graph, a, b, 3.0);
        incrementEdge(graph, b, a, 3.0);
      }
    }
  }

  // same-category edges
  const ids = Object.keys(productsObj).map(Number);
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i], b = ids[j];
      if (productsObj[a].category === productsObj[b].category) {
        incrementEdge(graph, a, b, 1.0);
        incrementEdge(graph, b, a, 1.0);
      }
    }
  }

  return graph;
}

function incrementEdge(graph, from, to, weight) {
  if (!graph.has(from)) graph.set(from, new Map());
  const neighbors = graph.get(from);
  neighbors.set(to, (neighbors.get(to) || 0) + weight);
}

/* =====================
   4) MaxHeap implementation
   ===================== */
class MaxHeap {
  constructor(compareFn) {
    this.data = [];
    this.compare = compareFn || ((a, b) => a.score - b.score);
  }
  size() { return this.data.length; }
  isEmpty() { return this.size() === 0; }
  push(item) {
    this.data.push(item);
    this._siftUp(this.size() - 1);
  }
  pop() {
    if (this.isEmpty()) return null;
    this._swap(0, this.size() - 1);
    const top = this.data.pop();
    this._siftDown(0);
    return top;
  }
  peek() { return this.isEmpty() ? null : this.data[0]; }
  _parent(i) { return Math.floor((i - 1) / 2); }
  _left(i) { return 2 * i + 1; }
  _right(i) { return 2 * i + 2; }
  _swap(i, j) { [this.data[i], this.data[j]] = [this.data[j], this.data[i]]; }
  _siftUp(i) {
    while (i > 0) {
      const p = this._parent(i);
      if (this.compare(this.data[i], this.data[p]) <= 0) break;
      this._swap(i, p);
      i = p;
    }
  }
  _siftDown(i) {
    while (true) {
      const l = this._left(i), r = this._right(i);
      let largest = i;
      if (l < this.size() && this.compare(this.data[l], this.data[largest]) > 0) largest = l;
      if (r < this.size() && this.compare(this.data[r], this.data[largest]) > 0) largest = r;
      if (largest === i) break;
      this._swap(i, largest);
      i = largest;
    }
  }
}

/* =====================
   5) Recommendation algorithm (BFS + scoring)
   - score contribution per discovered neighbor:
     contrib = edgeWeight * (popularity/100) * (1 / distance)
   - aggregated across multiple paths
   ===================== */
function recommend(graph, productsObj, productId, k = 5, options = {}) {
  if (!graph.has(productId)) return [];

  const maxDepth = options.maxDepth || 2;
  const visited = new Set([productId]);
  const queue = [{ id: productId, depth: 0 }];
  const scores = new Map();
  const distances = new Map();

  while (queue.length > 0) {
    const { id, depth } = queue.shift();
    if (depth >= maxDepth) continue;
    const neighbors = graph.get(id) || new Map();
    for (const [nbr, weight] of neighbors.entries()) {
      if (nbr === productId) continue;
      const newDepth = depth + 1;
      if (!distances.has(nbr) || distances.get(nbr) > newDepth) distances.set(nbr, newDepth);
      const pop = (productsObj[nbr] && productsObj[nbr].popularity) ? productsObj[nbr].popularity : 50;
      const contrib = weight * (pop / 100) * (1 / newDepth);
      scores.set(nbr, (scores.get(nbr) || 0) + contrib);

      if (!visited.has(nbr)) {
        visited.add(nbr);
        queue.push({ id: nbr, depth: newDepth });
      }
    }
  }

  // build heap of candidates
  const heap = new MaxHeap((a, b) => a.score - b.score);
  for (const [candId, score] of scores.entries()) {
    heap.push({ id: candId, score, distance: distances.get(candId) });
  }

  const results = [];
  while (results.length < k && !heap.isEmpty()) {
    const top = heap.pop();
    results.push({
      id: top.id,
      score: Number(top.score.toFixed(4)),
      distance: top.distance,
      product: productsObj[top.id],
    });
  }
  return results;
}

/* =====================
   6) Interactive CLI + helpers
   ===================== */
const readline = require('readline');

function findProductByInput(input) {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) {
    const id = Number(trimmed);
    return products[id] || null;
  }
  const keyword = trimmed.toLowerCase();
  const matches = Object.values(products).filter(p => p.name.toLowerCase().includes(keyword));
  if (matches.length === 0) return null;
  const exact = matches.find(m => m.name.toLowerCase() === keyword);
  return exact || matches[0];
}

function prettyPrintRecs(sourceProduct, recs) {
  console.log("\n" + "=".repeat(72));
  console.log(`🔍 Top ${recs.length} recommendations for "${sourceProduct.name}" (ID: ${sourceProduct.id})`);
  console.log("-".repeat(72));
  if (recs.length === 0) {
    console.log("No recommendations found for this product with the current dataset/settings.");
  } else {
    recs.forEach((r, i) => {
      console.log(`${i + 1}. ${r.product.name} (ID: ${r.product.id})`);
      console.log(`   ➤ Score: ${r.score.toFixed(4)}   ➤ Distance: ${r.distance}   ➤ Category: ${r.product.category}`);
      console.log(`   ➤ Price: $${r.product.price}   ➤ Popularity: ${r.product.popularity}`);
      console.log("-".repeat(72));
    });
  }
  console.log("=".repeat(72) + "\n");
}

const graph = buildGraph(products, purchaseHistory);

function startInteractiveCLI() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  console.log("\nSmart Product Recommendation System — Interactive CLI (Medium dataset)");
  console.log("Type a product ID or a product name (e.g., '1' or 'Laptop'). Type 'exit' to quit.\n");

  function prompt() {
    rl.question("Enter product ID or name ('exit' to quit): ", (answer) => {
      if (!answer) return prompt();
      const trimmed = answer.trim();
      if (trimmed.toLowerCase() === 'exit') {
        console.log("Goodbye 👋");
        rl.close();
        return;
      }
      const product = findProductByInput(trimmed);
      if (!product) {
        console.log("No product found matching that input. Try ID or name (e.g., '1' or 'Laptop').\n");
        return prompt();
      }

      rl.question("How many recommendations would you like? (default 5): ", (kStr) => {
        let k = parseInt(kStr);
        if (isNaN(k) || k <= 0) k = 5;
        rl.question("Max graph depth to search (1-4, default 2): ", (depthStr) => {
          let d = parseInt(depthStr);
          if (isNaN(d) || d < 1) d = 2;
          if (d > 4) d = 4;
          const recs = recommend(graph, products, product.id, k, { maxDepth: d });
          prettyPrintRecs(product, recs);
          return prompt();
        });
      });
    });
  }

  prompt();
}
// If file executed directly, start CLI
if (require.main === module) {
  startInteractiveCLI();
}

// Export for testing
module.exports = { buildGraph, recommend, MaxHeap, products, purchaseHistory, startInteractiveCLI };
