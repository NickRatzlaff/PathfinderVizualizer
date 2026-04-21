# PathFinder Visualizer

A simple React app for exploring how common pathfinding algorithms move through a 2D grid.

## Features

- Place a start node
- Place an end node
- Toggle walls and obstacles
- Choose between BFS, Dijkstra's Algorithm, and A*
- Animate each algorithm step by step
- Clear the path while keeping walls
- Reset the full grid

## Tech Stack

- React
- Vite

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## How To Use

1. Select a placement tool: `Start`, `End`, or `Walls`.
2. Click the grid to place nodes or toggle walls.
3. Choose an algorithm from the dropdown.
4. Click `Run Visualization` to watch the search animate.
5. Use `Clear Path` to remove visited/path states without removing walls.
6. Use `Reset Grid` to restore the default layout.

## Algorithms Included

- Breadth-First Search (BFS)
- Dijkstra's Algorithm
- A*
