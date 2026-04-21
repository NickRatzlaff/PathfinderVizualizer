const directions = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const toKey = (row, col) => `${row}-${col}`;

const manhattanDistance = (a, b) =>
  Math.abs(a.row - b.row) + Math.abs(a.col - b.col);

const getNeighbors = (grid, node) => {
  const neighbors = [];

  for (const [rowShift, colShift] of directions) {
    const nextRow = node.row + rowShift;
    const nextCol = node.col + colShift;
    const nextNode = grid[nextRow]?.[nextCol];

    if (!nextNode || nextNode.isWall) {
      continue;
    }

    neighbors.push(nextNode);
  }

  return neighbors;
};

const reconstructPath = (previous, endKey) => {
  if (!previous.has(endKey)) {
    return [];
  }

  const path = [];
  let currentKey = endKey;

  while (currentKey) {
    const [row, col] = currentKey.split("-").map(Number);
    path.unshift({ row, col });
    currentKey = previous.get(currentKey) ?? null;
  }

  return path;
};

export const bfs = (grid, start, end) => {
  const queue = [start];
  const queued = new Set([toKey(start.row, start.col)]);
  const visited = new Set();
  const previous = new Map([[toKey(start.row, start.col), null]]);
  const visitOrder = [];

  while (queue.length > 0) {
    const current = queue.shift();
    const currentKey = toKey(current.row, current.col);

    if (visited.has(currentKey)) {
      continue;
    }

    visited.add(currentKey);
    visitOrder.push(current);

    if (current.row === end.row && current.col === end.col) {
      break;
    }

    for (const neighbor of getNeighbors(grid, current)) {
      const neighborKey = toKey(neighbor.row, neighbor.col);

      if (visited.has(neighborKey) || queued.has(neighborKey)) {
        continue;
      }

      queued.add(neighborKey);
      previous.set(neighborKey, currentKey);
      queue.push(neighbor);
    }
  }

  return {
    visitedNodes: visitOrder,
    path: reconstructPath(previous, toKey(end.row, end.col)),
  };
};

export const dijkstra = (grid, start, end) => {
  const startKey = toKey(start.row, start.col);
  const endKey = toKey(end.row, end.col);
  const frontier = [{ row: start.row, col: start.col, distance: 0 }];
  const distances = new Map([[startKey, 0]]);
  const previous = new Map([[startKey, null]]);
  const visited = new Set();
  const visitOrder = [];

  while (frontier.length > 0) {
    frontier.sort((left, right) => left.distance - right.distance);
    const current = frontier.shift();
    const currentKey = toKey(current.row, current.col);

    if (visited.has(currentKey)) {
      continue;
    }

    visited.add(currentKey);
    visitOrder.push({ row: current.row, col: current.col });

    if (currentKey === endKey) {
      break;
    }

    for (const neighbor of getNeighbors(grid, current)) {
      const neighborKey = toKey(neighbor.row, neighbor.col);
      const tentativeDistance = (distances.get(currentKey) ?? Infinity) + 1;

      if (tentativeDistance >= (distances.get(neighborKey) ?? Infinity)) {
        continue;
      }

      distances.set(neighborKey, tentativeDistance);
      previous.set(neighborKey, currentKey);
      frontier.push({
        row: neighbor.row,
        col: neighbor.col,
        distance: tentativeDistance,
      });
    }
  }

  return {
    visitedNodes: visitOrder,
    path: reconstructPath(previous, endKey),
  };
};

export const aStar = (grid, start, end) => {
  const startKey = toKey(start.row, start.col);
  const endKey = toKey(end.row, end.col);
  const frontier = [
    {
      row: start.row,
      col: start.col,
      gScore: 0,
      fScore: manhattanDistance(start, end),
    },
  ];
  const gScores = new Map([[startKey, 0]]);
  const previous = new Map([[startKey, null]]);
  const visited = new Set();
  const visitOrder = [];

  while (frontier.length > 0) {
    frontier.sort((left, right) => left.fScore - right.fScore);
    const current = frontier.shift();
    const currentKey = toKey(current.row, current.col);

    if (visited.has(currentKey)) {
      continue;
    }

    visited.add(currentKey);
    visitOrder.push({ row: current.row, col: current.col });

    if (currentKey === endKey) {
      break;
    }

    for (const neighbor of getNeighbors(grid, current)) {
      const neighborKey = toKey(neighbor.row, neighbor.col);
      const tentativeScore = (gScores.get(currentKey) ?? Infinity) + 1;

      if (tentativeScore >= (gScores.get(neighborKey) ?? Infinity)) {
        continue;
      }

      gScores.set(neighborKey, tentativeScore);
      previous.set(neighborKey, currentKey);
      frontier.push({
        row: neighbor.row,
        col: neighbor.col,
        gScore: tentativeScore,
        fScore: tentativeScore + manhattanDistance(neighbor, end),
      });
    }
  }

  return {
    visitedNodes: visitOrder,
    path: reconstructPath(previous, endKey),
  };
};
