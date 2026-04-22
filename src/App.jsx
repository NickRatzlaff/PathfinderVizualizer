import { useEffect, useRef, useState } from "react";
import { aStar, bfs, dijkstra } from "./algorithms";

const ROWS = 18;
const COLS = 32;
const VISIT_DELAY = 18;
const PATH_DELAY = 36;

const algorithms = {
  bfs: {
    label: "Breadth-First Search",
    helper: "Expands in layers and finds the shortest path on an unweighted grid.",
    run: bfs,
  },
  dijkstra: {
    label: "Dijkstra's Algorithm",
    helper: "Explores by cheapest known distance and guarantees the shortest path.",
    run: dijkstra,
  },
  astar: {
    label: "A* Search",
    helper: "Uses a Manhattan-distance heuristic to reach the goal more directly.",
    run: aStar,
  },
};

const toolLabels = {
  wall: "Walls",
  start: "Start",
  end: "End",
};

const legendItems = [
  { label: "Start", className: "start" },
  { label: "Target", className: "end" },
  { label: "Wall", className: "wall" },
  { label: "Visited", className: "visited" },
  { label: "Path", className: "path" },
];

const createNode = (row, col, start, end) => ({
  row,
  col,
  isStart: row === start.row && col === start.col,
  isEnd: row === end.row && col === end.col,
  isWall: false,
  isVisited: false,
  isPath: false,
});

const buildGrid = (start, end, preservedWalls = new Set()) =>
  Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, (_, col) => {
      const key = `${row}-${col}`;
      return {
        ...createNode(row, col, start, end),
        isWall: preservedWalls.has(key),
      };
    })
  );

const sleep = (delay) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, delay);
  });

/**
 * Set wall state for one cell and clear path visualization like a toggle does.
 * @param {"add" | "remove"} mode
 */
const applyWallPaint = (setGrid, row, col, mode) => {
  const nextWall = mode === "add";

  setGrid((currentGrid) =>
    currentGrid.map((currentRow) =>
      currentRow.map((node) => {
        if (node.row === row && node.col === col && !node.isStart && !node.isEnd) {
          return {
            ...node,
            isWall: nextWall,
            isVisited: false,
            isPath: false,
          };
        }

        if (node.isVisited || node.isPath) {
          return { ...node, isVisited: false, isPath: false };
        }

        return node;
      })
    )
  );
};

function App() {
  const [startNode, setStartNode] = useState({ row: 4, col: 6 });
  const [endNode, setEndNode] = useState({ row: 12, col: 24 });
  const [grid, setGrid] = useState(() =>
    buildGrid({ row: 4, col: 6 }, { row: 12, col: 24 })
  );
  const [activeTool, setActiveTool] = useState("wall");
  const [algorithmKey, setAlgorithmKey] = useState("bfs");
  const [status, setStatus] = useState("Choose a tool, sketch some walls, and run an algorithm.");
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTokenRef = useRef(0);
  const wallDragRef = useRef({ active: false, mode: null });
  const lastWallPaintKeyRef = useRef(null);

  useEffect(() => {
    return () => {
      animationTokenRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const endWallDrag = () => {
      const wasPainting = wallDragRef.current.active;
      wallDragRef.current = { active: false, mode: null };
      lastWallPaintKeyRef.current = null;

      if (wasPainting) {
        setStatus("Walls updated. Run the search when you are ready.");
      }
    };

    const handlePointerMove = (event) => {
      const drag = wallDragRef.current;
      if (!drag.active || drag.mode === null) {
        return;
      }

      const target = document.elementFromPoint(event.clientX, event.clientY);
      const cellButton = target?.closest?.("[data-grid-cell]");
      if (!cellButton) {
        return;
      }

      const row = Number(cellButton.dataset.row);
      const col = Number(cellButton.dataset.col);
      const key = `${row}-${col}`;

      if (key === lastWallPaintKeyRef.current) {
        return;
      }

      lastWallPaintKeyRef.current = key;
      applyWallPaint(setGrid, row, col, drag.mode);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", endWallDrag);
    window.addEventListener("pointercancel", endWallDrag);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", endWallDrag);
      window.removeEventListener("pointercancel", endWallDrag);
    };
  }, []);

  const rebuildGrid = (nextStart, nextEnd, preservedWalls = collectWalls(grid)) => {
    const sanitizedWalls = new Set(preservedWalls);
    sanitizedWalls.delete(`${nextStart.row}-${nextStart.col}`);
    sanitizedWalls.delete(`${nextEnd.row}-${nextEnd.col}`);
    return buildGrid(nextStart, nextEnd, sanitizedWalls);
  };

  const clearPathState = () => {
    setGrid((currentGrid) =>
      currentGrid.map((row) =>
        row.map((node) => ({
          ...node,
          isVisited: false,
          isPath: false,
        }))
      )
    );
  };

  const handlePlacementPointerDown = (event, row, col) => {
    if (event.button !== 0) {
      return;
    }

    if (isAnimating) {
      return;
    }

    if (activeTool === "start") {
      if (row === endNode.row && col === endNode.col) {
        return;
      }

      const nextStart = { row, col };
      setStartNode(nextStart);
      setGrid(rebuildGrid(nextStart, endNode));
      setStatus("Start node moved. Run an algorithm to compare the new route.");
      return;
    }

    if (activeTool === "end") {
      if (row === startNode.row && col === startNode.col) {
        return;
      }

      const nextEnd = { row, col };
      setEndNode(nextEnd);
      setGrid(rebuildGrid(startNode, nextEnd));
      setStatus("Target moved. Run the visualizer to watch the new search.");
      return;
    }

    const node = grid[row][col];

    if (node.isStart || node.isEnd) {
      return;
    }

    const mode = node.isWall ? "remove" : "add";

    wallDragRef.current = { active: true, mode };
    lastWallPaintKeyRef.current = `${row}-${col}`;
    applyWallPaint(setGrid, row, col, mode);

    setStatus(
      mode === "remove"
        ? "Erasing walls. Release the mouse or lift your finger to finish."
        : "Painting walls. Drag across the grid to sketch obstacles."
    );
  };

  const runVisualization = async () => {
    if (isAnimating) {
      return;
    }

    const activeAlgorithm = algorithms[algorithmKey];
    const preparedGrid = grid.map((row) =>
      row.map((node) => ({
        ...node,
        isVisited: false,
        isPath: false,
      }))
    );

    setGrid(preparedGrid);
    setIsAnimating(true);
    setStatus(`Running ${activeAlgorithm.label}...`);

    const { visitedNodes, path } = activeAlgorithm.run(preparedGrid, startNode, endNode);
    const animationToken = animationTokenRef.current + 1;
    animationTokenRef.current = animationToken;

    for (const node of visitedNodes) {
      if (animationTokenRef.current !== animationToken) {
        return;
      }

      if ((node.row === startNode.row && node.col === startNode.col) ||
        (node.row === endNode.row && node.col === endNode.col)) {
        await sleep(VISIT_DELAY);
        continue;
      }

      setGrid((currentGrid) =>
        currentGrid.map((row) =>
          row.map((cell) =>
            cell.row === node.row && cell.col === node.col
              ? { ...cell, isVisited: true }
              : cell
          )
        )
      );

      await sleep(VISIT_DELAY);
    }

    const finalPath = path.filter(
      (node) =>
        !(node.row === startNode.row && node.col === startNode.col) &&
        !(node.row === endNode.row && node.col === endNode.col)
    );

    for (const node of finalPath) {
      if (animationTokenRef.current !== animationToken) {
        return;
      }

      setGrid((currentGrid) =>
        currentGrid.map((row) =>
          row.map((cell) =>
            cell.row === node.row && cell.col === node.col
              ? { ...cell, isPath: true }
              : cell
          )
        )
      );

      await sleep(PATH_DELAY);
    }

    setIsAnimating(false);
    setStatus(
      path.length > 0
        ? `${activeAlgorithm.label} found a path in ${Math.max(path.length - 1, 0)} steps.`
        : `${activeAlgorithm.label} could not reach the target.`
    );
  };

  const clearPath = () => {
    if (isAnimating) {
      return;
    }

    clearPathState();
    setStatus("Path cleared. Your walls are still in place.");
  };

  const resetGrid = () => {
    if (isAnimating) {
      return;
    }

    const nextStart = { row: 4, col: 6 };
    const nextEnd = { row: 12, col: 24 };

    setStartNode(nextStart);
    setEndNode(nextEnd);
    setGrid(buildGrid(nextStart, nextEnd));
    setStatus("Grid reset. Place nodes, add walls, and explore again.");
  };

  const selectedAlgorithm = algorithms[algorithmKey];

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Interactive Pathfinding Lab</p>
          <h1>Visualize how classic search algorithms navigate a maze.</h1>
          <p className="hero-text">
            Place a start node, set a target, sketch obstacles, then compare how
            breadth-first search, Dijkstra&apos;s algorithm, and A* explore the same grid.
          </p>
        </div>
        <div className="stats-panel">
          <div>
            <span className="stats-label">Selected Algorithm</span>
            <strong>{selectedAlgorithm.label}</strong>
          </div>
          <div>
            <span className="stats-label">Best For</span>
            <strong>{selectedAlgorithm.helper}</strong>
          </div>
        </div>
      </section>

      <section className="control-panel">
        <div className="control-group">
          <span className="group-label">Placement Tool</span>
          <div className="segmented">
            {Object.entries(toolLabels).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={activeTool === key ? "chip active" : "chip"}
                onClick={() => setActiveTool(key)}
                disabled={isAnimating}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <label className="select-group">
          <span className="group-label">Algorithm</span>
          <select
            value={algorithmKey}
            onChange={(event) => setAlgorithmKey(event.target.value)}
            disabled={isAnimating}
          >
            {Object.entries(algorithms).map(([key, algorithm]) => (
              <option key={key} value={key}>
                {algorithm.label}
              </option>
            ))}
          </select>
        </label>

        <div className="button-row">
          <button
            type="button"
            className="action-button primary"
            onClick={runVisualization}
            disabled={isAnimating}
          >
            {isAnimating ? "Animating..." : "Run Visualization"}
          </button>
          <button
            type="button"
            className="action-button secondary"
            onClick={clearPath}
            disabled={isAnimating}
          >
            Clear Path
          </button>
          <button
            type="button"
            className="action-button secondary"
            onClick={resetGrid}
            disabled={isAnimating}
          >
            Reset Grid
          </button>
        </div>
      </section>

      <section className="legend">
        {legendItems.map((item) => (
          <div key={item.label} className="legend-item">
            <span className={`legend-swatch ${item.className}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </section>

      <section className="grid-card">
        <div className="grid-header">
          <div>
            <h2>Traversal Grid</h2>
            <p>
              Click or click-drag with the wall tool to paint obstacles; use start/end tools for nodes.
            </p>
          </div>
          <div className="status-pill">{status}</div>
        </div>

        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
        >
          {grid.flat().map((node) => (
            <button
              key={`${node.row}-${node.col}`}
              type="button"
              className={getCellClassName(node)}
              data-grid-cell
              data-row={node.row}
              data-col={node.col}
              onPointerDown={(event) => handlePlacementPointerDown(event, node.row, node.col)}
              aria-label={`Row ${node.row + 1}, Column ${node.col + 1}`}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function collectWalls(grid) {
  const walls = new Set();

  for (const row of grid) {
    for (const node of row) {
      if (node.isWall) {
        walls.add(`${node.row}-${node.col}`);
      }
    }
  }

  return walls;
}

function getCellClassName(node) {
  const classNames = ["grid-cell"];

  if (node.isStart) {
    classNames.push("start");
  } else if (node.isEnd) {
    classNames.push("end");
  } else if (node.isWall) {
    classNames.push("wall");
  } else if (node.isPath) {
    classNames.push("path");
  } else if (node.isVisited) {
    classNames.push("visited");
  }

  return classNames.join(" ");
}

export default App;
