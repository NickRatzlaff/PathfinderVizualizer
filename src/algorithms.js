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

const clonePoint = (node) => ({ row: node.row, col: node.col });

const isGoalNode = (node, end) => node.row === end.row && node.col === end.col;

const createPathResult = (visitOrder, previous, endNode) => ({
  visitedNodes: visitOrder,
  path: reconstructPath(previous, toKey(endNode.row, endNode.col)),
});

const isValidGridNode = (grid, row, col) => {
  const node = grid[row]?.[col];
  return Boolean(node && !node.isWall);
};

const collectDirectionalNode = (grid, baseNode, rowShift, colShift) => {
  const targetRow = baseNode.row + rowShift;
  const targetCol = baseNode.col + colShift;
  if (!isValidGridNode(grid, targetRow, targetCol)) {
    return null;
  }
  return grid[targetRow][targetCol];
};

const getNeighborsWithOrder = (grid, node, preferredDirections) => {
  const neighbors = [];
  for (const [rowShift, colShift] of preferredDirections) {
    const nextNode = collectDirectionalNode(grid, node, rowShift, colShift);
    if (nextNode) {
      neighbors.push(nextNode);
    }
  }
  return neighbors;
};

const reverseDirections = [
  [-1, 0],
  [0, -1],
  [1, 0],
  [0, 1],
];

class PriorityQueue {
  constructor(compareFn) {
    this.compareFn = compareFn;
    this.heap = [];
  }

  size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  push(value) {
    this.heap.push(value);
    this.heapifyUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) {
      return null;
    }
    if (this.heap.length === 1) {
      return this.heap.pop();
    }
    const firstValue = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.heapifyDown(0);
    return firstValue;
  }

  heapifyUp(index) {
    let currentIndex = index;
    while (currentIndex > 0) {
      const parentIndex = Math.floor((currentIndex - 1) / 2);
      if (this.compareFn(this.heap[currentIndex], this.heap[parentIndex]) >= 0) {
        break;
      }
      [this.heap[currentIndex], this.heap[parentIndex]] = [
        this.heap[parentIndex],
        this.heap[currentIndex],
      ];
      currentIndex = parentIndex;
    }
  }

  heapifyDown(index) {
    let currentIndex = index;
    const heapSize = this.heap.length;
    while (currentIndex < heapSize) {
      const leftChildIndex = currentIndex * 2 + 1;
      const rightChildIndex = currentIndex * 2 + 2;
      let bestIndex = currentIndex;

      if (
        leftChildIndex < heapSize &&
        this.compareFn(this.heap[leftChildIndex], this.heap[bestIndex]) < 0
      ) {
        bestIndex = leftChildIndex;
      }

      if (
        rightChildIndex < heapSize &&
        this.compareFn(this.heap[rightChildIndex], this.heap[bestIndex]) < 0
      ) {
        bestIndex = rightChildIndex;
      }

      if (bestIndex === currentIndex) {
        break;
      }

      [this.heap[currentIndex], this.heap[bestIndex]] = [
        this.heap[bestIndex],
        this.heap[currentIndex],
      ];
      currentIndex = bestIndex;
    }
  }
}

class Deque {
  constructor() {
    this.storage = new Map();
    this.frontIndex = 0;
    this.backIndex = -1;
  }

  size() {
    return this.backIndex - this.frontIndex + 1;
  }

  isEmpty() {
    return this.size() <= 0;
  }

  pushBack(value) {
    this.backIndex += 1;
    this.storage.set(this.backIndex, value);
  }

  pushFront(value) {
    this.frontIndex -= 1;
    this.storage.set(this.frontIndex, value);
  }

  popFront() {
    if (this.isEmpty()) {
      return null;
    }
    const value = this.storage.get(this.frontIndex);
    this.storage.delete(this.frontIndex);
    this.frontIndex += 1;
    return value;
  }

  popBack() {
    if (this.isEmpty()) {
      return null;
    }
    const value = this.storage.get(this.backIndex);
    this.storage.delete(this.backIndex);
    this.backIndex -= 1;
    return value;
  }
}

export const dfs = (grid, start, end) => {
  const startKey = toKey(start.row, start.col);
  const endKey = toKey(end.row, end.col);
  const stack = [clonePoint(start)];
  const previous = new Map([[startKey, null]]);
  const visited = new Set();
  const visitOrder = [];

  while (stack.length > 0) {
    const current = stack.pop();
    const currentKey = toKey(current.row, current.col);

    if (visited.has(currentKey)) {
      continue;
    }

    visited.add(currentKey);
    visitOrder.push(clonePoint(current));

    if (currentKey === endKey) {
      break;
    }

    const neighbors = getNeighborsWithOrder(grid, current, reverseDirections);
    for (const neighbor of neighbors) {
      const neighborKey = toKey(neighbor.row, neighbor.col);
      if (visited.has(neighborKey)) {
        continue;
      }
      if (!previous.has(neighborKey)) {
        previous.set(neighborKey, currentKey);
      }
      stack.push(clonePoint(neighbor));
    }
  }

  return createPathResult(visitOrder, previous, end);
};

export const greedyBestFirstSearch = (grid, start, end) => {
  const startKey = toKey(start.row, start.col);
  const endKey = toKey(end.row, end.col);
  const frontier = new PriorityQueue(
    (left, right) => left.heuristicScore - right.heuristicScore,
  );
  const visited = new Set();
  const queued = new Set([startKey]);
  const previous = new Map([[startKey, null]]);
  const visitOrder = [];

  frontier.push({
    row: start.row,
    col: start.col,
    heuristicScore: manhattanDistance(start, end),
  });

  while (!frontier.isEmpty()) {
    const current = frontier.pop();
    const currentKey = toKey(current.row, current.col);

    if (visited.has(currentKey)) {
      continue;
    }

    visited.add(currentKey);
    visitOrder.push(clonePoint(current));

    if (currentKey === endKey) {
      break;
    }

    for (const neighbor of getNeighbors(grid, current)) {
      const neighborKey = toKey(neighbor.row, neighbor.col);
      if (visited.has(neighborKey) || queued.has(neighborKey)) {
        continue;
      }
      queued.add(neighborKey);
      previous.set(neighborKey, currentKey);
      frontier.push({
        row: neighbor.row,
        col: neighbor.col,
        heuristicScore: manhattanDistance(neighbor, end),
      });
    }
  }

  return createPathResult(visitOrder, previous, end);
};

export const weightedAStar = (grid, start, end, heuristicWeight = 1.8) => {
  const safeWeight = Number.isFinite(heuristicWeight) ? heuristicWeight : 1.8;
  const startKey = toKey(start.row, start.col);
  const endKey = toKey(end.row, end.col);
  const frontier = new PriorityQueue((left, right) => left.fScore - right.fScore);
  const gScores = new Map([[startKey, 0]]);
  const previous = new Map([[startKey, null]]);
  const finalized = new Set();
  const visitOrder = [];

  frontier.push({
    row: start.row,
    col: start.col,
    gScore: 0,
    fScore: safeWeight * manhattanDistance(start, end),
  });

  while (!frontier.isEmpty()) {
    const current = frontier.pop();
    const currentKey = toKey(current.row, current.col);

    if (finalized.has(currentKey)) {
      continue;
    }
    finalized.add(currentKey);
    visitOrder.push(clonePoint(current));

    if (currentKey === endKey) {
      break;
    }

    for (const neighbor of getNeighbors(grid, current)) {
      const neighborKey = toKey(neighbor.row, neighbor.col);
      const tentativeGScore = (gScores.get(currentKey) ?? Infinity) + 1;
      if (tentativeGScore >= (gScores.get(neighborKey) ?? Infinity)) {
        continue;
      }
      gScores.set(neighborKey, tentativeGScore);
      previous.set(neighborKey, currentKey);
      frontier.push({
        row: neighbor.row,
        col: neighbor.col,
        gScore: tentativeGScore,
        fScore: tentativeGScore + safeWeight * manhattanDistance(neighbor, end),
      });
    }
  }

  return createPathResult(visitOrder, previous, end);
};

export const bidirectionalBfs = (grid, start, end) => {
  const startKey = toKey(start.row, start.col);
  const endKey = toKey(end.row, end.col);
  const startQueue = new Deque();
  const endQueue = new Deque();
  const startVisited = new Set([startKey]);
  const endVisited = new Set([endKey]);
  const startPrevious = new Map([[startKey, null]]);
  const endPrevious = new Map([[endKey, null]]);
  const visitOrder = [];

  if (startKey === endKey) {
    return {
      visitedNodes: [clonePoint(start)],
      path: [clonePoint(start)],
    };
  }

  startQueue.pushBack(clonePoint(start));
  endQueue.pushBack(clonePoint(end));

  let meetingKey = null;

  const processFrontierStep = (
    activeQueue,
    activeVisited,
    oppositeVisited,
    activePrevious,
    forwardDirection,
  ) => {
    const current = activeQueue.popFront();
    if (!current) {
      return null;
    }
    const currentKey = toKey(current.row, current.col);
    visitOrder.push(clonePoint(current));

    const directionSet = forwardDirection ? directions : reverseDirections;
    for (const neighbor of getNeighborsWithOrder(grid, current, directionSet)) {
      const neighborKey = toKey(neighbor.row, neighbor.col);
      if (activeVisited.has(neighborKey)) {
        continue;
      }
      activeVisited.add(neighborKey);
      activePrevious.set(neighborKey, currentKey);
      activeQueue.pushBack(clonePoint(neighbor));
      if (oppositeVisited.has(neighborKey)) {
        return neighborKey;
      }
    }
    return null;
  };

  while (!startQueue.isEmpty() && !endQueue.isEmpty()) {
    meetingKey = processFrontierStep(
      startQueue,
      startVisited,
      endVisited,
      startPrevious,
      true,
    );
    if (meetingKey) {
      break;
    }

    meetingKey = processFrontierStep(
      endQueue,
      endVisited,
      startVisited,
      endPrevious,
      false,
    );
    if (meetingKey) {
      break;
    }
  }

  if (!meetingKey) {
    return {
      visitedNodes: visitOrder,
      path: [],
    };
  }

  const startHalfPath = reconstructPath(startPrevious, meetingKey);
  const endHalfPath = [];
  let bridgeKey = endPrevious.get(meetingKey) ?? null;
  while (bridgeKey) {
    const [row, col] = bridgeKey.split("-").map(Number);
    endHalfPath.push({ row, col });
    bridgeKey = endPrevious.get(bridgeKey) ?? null;
  }

  return {
    visitedNodes: visitOrder,
    path: [...startHalfPath, ...endHalfPath],
  };
};

const buildDepthLimitedSearch = (depthLimit) => (grid, start, end) => {
  const startKey = toKey(start.row, start.col);
  const endKey = toKey(end.row, end.col);
  const previous = new Map([[startKey, null]]);
  const visitOrder = [];
  const stack = [{ row: start.row, col: start.col, depth: 0 }];
  const bestKnownDepth = new Map([[startKey, 0]]);
  let foundEnd = false;

  while (stack.length > 0) {
    const current = stack.pop();
    const currentKey = toKey(current.row, current.col);
    const knownDepth = bestKnownDepth.get(currentKey);
    if (knownDepth !== undefined && current.depth > knownDepth) {
      continue;
    }

    visitOrder.push(clonePoint(current));
    if (currentKey === endKey) {
      foundEnd = true;
      break;
    }

    if (current.depth >= depthLimit) {
      continue;
    }

    const neighbors = getNeighborsWithOrder(grid, current, reverseDirections);
    for (const neighbor of neighbors) {
      const neighborKey = toKey(neighbor.row, neighbor.col);
      const nextDepth = current.depth + 1;
      if (nextDepth >= (bestKnownDepth.get(neighborKey) ?? Infinity)) {
        continue;
      }

      bestKnownDepth.set(neighborKey, nextDepth);
      previous.set(neighborKey, currentKey);
      stack.push({
        row: neighbor.row,
        col: neighbor.col,
        depth: nextDepth,
      });
    }
  }

  return {
    visitedNodes: visitOrder,
    path: foundEnd ? reconstructPath(previous, endKey) : [],
  };
};

export const depthLimitedSearch = (grid, start, end, depthLimit = 24) =>
  buildDepthLimitedSearch(depthLimit)(grid, start, end);

export const iterativeDeepeningDfs = (grid, start, end, maxDepth = 64) => {
  const combinedVisited = [];
  for (let depth = 0; depth <= maxDepth; depth += 1) {
    const limitedSearch = buildDepthLimitedSearch(depth);
    const result = limitedSearch(grid, start, end);
    combinedVisited.push(...result.visitedNodes);
    if (result.path.length > 0) {
      return {
        visitedNodes: combinedVisited,
        path: result.path,
      };
    }
  }

  return {
    visitedNodes: combinedVisited,
    path: [],
  };
};

const backtrackDfsRecursive = (
  grid,
  currentNode,
  endNode,
  currentVisited,
  globalVisited,
  previous,
  visitOrder,
) => {
  const currentKey = toKey(currentNode.row, currentNode.col);
  currentVisited.add(currentKey);
  globalVisited.add(currentKey);
  visitOrder.push(clonePoint(currentNode));

  if (isGoalNode(currentNode, endNode)) {
    return true;
  }

  for (const neighbor of getNeighborsWithOrder(grid, currentNode, directions)) {
    const neighborKey = toKey(neighbor.row, neighbor.col);
    if (currentVisited.has(neighborKey)) {
      continue;
    }
    if (!previous.has(neighborKey)) {
      previous.set(neighborKey, currentKey);
    }
    const found = backtrackDfsRecursive(
      grid,
      neighbor,
      endNode,
      currentVisited,
      globalVisited,
      previous,
      visitOrder,
    );
    if (found) {
      return true;
    }
  }

  currentVisited.delete(currentKey);
  return false;
};

export const recursiveBacktrackingDfs = (grid, start, end) => {
  const startKey = toKey(start.row, start.col);
  const endKey = toKey(end.row, end.col);
  const previous = new Map([[startKey, null]]);
  const visitOrder = [];
  const currentVisited = new Set();
  const globalVisited = new Set();

  backtrackDfsRecursive(
    grid,
    start,
    end,
    currentVisited,
    globalVisited,
    previous,
    visitOrder,
  );

  return {
    visitedNodes: visitOrder,
    path: previous.has(endKey) ? reconstructPath(previous, endKey) : [],
  };
};

export const beamSearch = (grid, start, end, beamWidth = 3) => {
  const safeBeamWidth = Math.max(1, Math.floor(beamWidth));
  const startKey = toKey(start.row, start.col);
  const endKey = toKey(end.row, end.col);
  const previous = new Map([[startKey, null]]);
  const visited = new Set([startKey]);
  const visitOrder = [];
  let frontierLayer = [clonePoint(start)];

  while (frontierLayer.length > 0) {
    const candidateLayer = [];

    for (const current of frontierLayer) {
      const currentKey = toKey(current.row, current.col);
      visitOrder.push(clonePoint(current));
      if (currentKey === endKey) {
        return createPathResult(visitOrder, previous, end);
      }

      for (const neighbor of getNeighbors(grid, current)) {
        const neighborKey = toKey(neighbor.row, neighbor.col);
        if (visited.has(neighborKey)) {
          continue;
        }
        visited.add(neighborKey);
        previous.set(neighborKey, currentKey);
        candidateLayer.push(clonePoint(neighbor));
      }
    }

    candidateLayer.sort(
      (left, right) => manhattanDistance(left, end) - manhattanDistance(right, end),
    );
    frontierLayer = candidateLayer.slice(0, safeBeamWidth);
  }

  return {
    visitedNodes: visitOrder,
    path: [],
  };
};

const computeZeroOneWeight = (fromNode, toNode) => {
  const isStraightMove =
    Math.abs(fromNode.row - toNode.row) + Math.abs(fromNode.col - toNode.col) === 1;
  return isStraightMove ? 0 : 1;
};

export const zeroOneBfs = (grid, start, end) => {
  const startKey = toKey(start.row, start.col);
  const endKey = toKey(end.row, end.col);
  const deque = new Deque();
  const distances = new Map([[startKey, 0]]);
  const previous = new Map([[startKey, null]]);
  const settled = new Set();
  const visitOrder = [];

  deque.pushBack(clonePoint(start));

  while (!deque.isEmpty()) {
    const current = deque.popFront();
    const currentKey = toKey(current.row, current.col);
    if (settled.has(currentKey)) {
      continue;
    }
    settled.add(currentKey);
    visitOrder.push(clonePoint(current));

    if (currentKey === endKey) {
      break;
    }

    for (const neighbor of getNeighbors(grid, current)) {
      const neighborKey = toKey(neighbor.row, neighbor.col);
      const edgeWeight = computeZeroOneWeight(current, neighbor);
      const tentativeDistance = (distances.get(currentKey) ?? Infinity) + edgeWeight;
      if (tentativeDistance >= (distances.get(neighborKey) ?? Infinity)) {
        continue;
      }
      distances.set(neighborKey, tentativeDistance);
      previous.set(neighborKey, currentKey);
      if (edgeWeight === 0) {
        deque.pushFront(clonePoint(neighbor));
      } else {
        deque.pushBack(clonePoint(neighbor));
      }
    }
  }

  return createPathResult(visitOrder, previous, end);
};

export const uniformCostSearch = (grid, start, end) => {
  const startKey = toKey(start.row, start.col);
  const endKey = toKey(end.row, end.col);
  const frontier = new PriorityQueue((left, right) => left.cost - right.cost);
  const bestCosts = new Map([[startKey, 0]]);
  const previous = new Map([[startKey, null]]);
  const settled = new Set();
  const visitOrder = [];

  frontier.push({ row: start.row, col: start.col, cost: 0 });

  while (!frontier.isEmpty()) {
    const current = frontier.pop();
    const currentKey = toKey(current.row, current.col);
    if (settled.has(currentKey)) {
      continue;
    }

    settled.add(currentKey);
    visitOrder.push(clonePoint(current));

    if (currentKey === endKey) {
      break;
    }

    for (const neighbor of getNeighbors(grid, current)) {
      const neighborKey = toKey(neighbor.row, neighbor.col);
      const tentativeCost = (bestCosts.get(currentKey) ?? Infinity) + 1;
      if (tentativeCost >= (bestCosts.get(neighborKey) ?? Infinity)) {
        continue;
      }
      bestCosts.set(neighborKey, tentativeCost);
      previous.set(neighborKey, currentKey);
      frontier.push({
        row: neighbor.row,
        col: neighbor.col,
        cost: tentativeCost,
      });
    }
  }

  return createPathResult(visitOrder, previous, end);
};

const getAlternateHeuristic = (node, endNode) => {
  const rowDelta = Math.abs(node.row - endNode.row);
  const colDelta = Math.abs(node.col - endNode.col);
  const chebyshevDistance = Math.max(rowDelta, colDelta);
  return chebyshevDistance + 0.001 * (rowDelta + colDelta);
};

export const bestFirstSearchWithTieBreaker = (grid, start, end) => {
  const startKey = toKey(start.row, start.col);
  const endKey = toKey(end.row, end.col);
  const frontier = new PriorityQueue((left, right) => {
    if (left.heuristicScore !== right.heuristicScore) {
      return left.heuristicScore - right.heuristicScore;
    }
    return left.tieBreaker - right.tieBreaker;
  });
  const queued = new Set([startKey]);
  const visited = new Set();
  const previous = new Map([[startKey, null]]);
  const visitOrder = [];

  frontier.push({
    row: start.row,
    col: start.col,
    heuristicScore: manhattanDistance(start, end),
    tieBreaker: getAlternateHeuristic(start, end),
  });

  while (!frontier.isEmpty()) {
    const current = frontier.pop();
    const currentKey = toKey(current.row, current.col);
    if (visited.has(currentKey)) {
      continue;
    }

    visited.add(currentKey);
    visitOrder.push(clonePoint(current));
    if (currentKey === endKey) {
      break;
    }

    for (const neighbor of getNeighbors(grid, current)) {
      const neighborKey = toKey(neighbor.row, neighbor.col);
      if (visited.has(neighborKey) || queued.has(neighborKey)) {
        continue;
      }
      queued.add(neighborKey);
      previous.set(neighborKey, currentKey);
      frontier.push({
        row: neighbor.row,
        col: neighbor.col,
        heuristicScore: manhattanDistance(neighbor, end),
        tieBreaker: getAlternateHeuristic(neighbor, end),
      });
    }
  }

  return createPathResult(visitOrder, previous, end);
};
