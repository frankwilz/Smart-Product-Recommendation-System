# Smart Product Recommendation System

This project implements a **Smart Product Recommendation System** using core data structures and algorithms from the course, including **graphs, heaps, and traversal techniques**. The system models how e-commerce platforms efficiently generate product recommendations based on co-purchase behavior and category similarity.

---

## Features

- Efficient product lookup using a **dictionary keyed by product ID**.
- **Weighted directed graph** representing product relationships:
  - Co-purchase edges: weight 3.0  
  - Same-category edges: weight 1.0
- **Breadth-First Search (BFS)** traversal to explore neighborhood products.
- **Max-Heap** to efficiently retrieve top recommended products.
- Interactive CLI for querying products and customizing recommendation parameters.

---

## Algorithm Overview

1. **Data Structures**
   - Products stored in a dictionary for **O(1) lookup**.
   - Weighted directed graph models relationships:
     - Co-purchased products linked with weight 3.0
     - Products in the same category linked with weight 1.0

2. **Graph Construction**
   - Iterates through purchase history to link frequently bought together products.
   - Connects products in the same category to represent similarity.

3. **Recommendation Generation**
   - BFS traversal from source product up to a **user-defined depth**.
   - Each neighbor contributes a score:  
     `edgeWeight × (popularity / 100) × (1 / distance)`  
   - Scores accumulate over multiple paths.

4. **Top-K Selection**
   - Candidate products inserted into a **Max-Heap** sorted by total score.
   - Top K products are popped to form the recommendation list.

5. **Complexity**
   - Graph building: **O(P² + E)**  
   - Query execution: **O(V + E)** for BFS traversal + **O(K log N)** for heap extraction  

This approach ensures scalability and responsiveness, making it suitable for large e-commerce datasets.

---

## Sample Output (Interactive CLI)

```bash
> node recommendation_system_interactive.js 
Enter product ID or name ('exit' to quit): Laptop 
How many recommendations would you like? (default 5): 3 
Max graph depth to search (1-4, default 2): 2 

■ Top 3 recommendations for "Laptop" (ID: 1)
------------------------------------------------------------
1. Mouse (ID: 3)
   ➤ Score: 1.9500
   ➤ Distance: 1
   ➤ Category: Electronics
   ➤ Price: $25
   ➤ Popularity: 65

2. Monitor (ID: 5)
   ➤ Score: 1.7300
   ➤ Distance: 1
   ➤ Category: Electronics
   ➤ Price: $230
   ➤ Popularity: 80

3. External SSD (ID: 20)
   ➤ Score: 1.6100
   ➤ Distance: 1
   ➤ Category: Electronics
   ➤ Price: $140
   ➤ Popularity: 77
------------------------------------------------------------
