import PF from 'pathfinding';
import { COLLISION_BOXES } from './AgentBehavior';

const CELL_SIZE = 10;
const GRID_WIDTH = Math.ceil(1000 / CELL_SIZE);  // 100
const GRID_HEIGHT = Math.ceil(600 / CELL_SIZE);  // 60

function buildGrid(): PF.Grid {
  const grid = new PF.Grid(GRID_WIDTH, GRID_HEIGHT);

  for (const box of COLLISION_BOXES) {
    // Mark a cell unwalkable only if its center is inside the collision box.
    // Cell centers are 5px from edges, so paths stay at least 5px from furniture.
    for (let c = 0; c < GRID_WIDTH; c++) {
      const cellCenterX = c * CELL_SIZE + CELL_SIZE / 2;
      if (cellCenterX < box.x || cellCenterX > box.x + box.width) continue;
      for (let r = 0; r < GRID_HEIGHT; r++) {
        const cellCenterY = r * CELL_SIZE + CELL_SIZE / 2;
        if (cellCenterY >= box.y && cellCenterY <= box.y + box.height) {
          grid.setWalkableAt(c, r, false);
        }
      }
    }
  }

  return grid;
}

const baseGrid = buildGrid();
const finder = new PF.AStarFinder({
  allowDiagonal: false,
  dontCrossCorners: true,
});

export function findPath(startX: number, startY: number, endX: number, endY: number): Array<{ x: number; y: number }> {
  const startCol = Math.min(GRID_WIDTH - 1, Math.max(0, Math.floor(startX / CELL_SIZE)));
  const startRow = Math.min(GRID_HEIGHT - 1, Math.max(0, Math.floor(startY / CELL_SIZE)));
  const endCol = Math.min(GRID_WIDTH - 1, Math.max(0, Math.floor(endX / CELL_SIZE)));
  const endRow = Math.min(GRID_HEIGHT - 1, Math.max(0, Math.floor(endY / CELL_SIZE)));

  // If start or end is unwalkable, find the nearest walkable cell
  const grid = baseGrid.clone();
  let sCol = startCol;
  let sRow = startRow;
  let eCol = endCol;
  let eRow = endRow;

  if (!grid.isWalkableAt(sCol, sRow)) {
    let found = false;
    for (let radius = 1; radius <= 3 && !found; radius++) {
      for (let dx = -radius; dx <= radius && !found; dx++) {
        for (let dy = -radius; dy <= radius && !found; dy++) {
          const c = sCol + dx;
          const r = sRow + dy;
          if (c >= 0 && c < GRID_WIDTH && r >= 0 && r < GRID_HEIGHT && grid.isWalkableAt(c, r)) {
            sCol = c;
            sRow = r;
            found = true;
          }
        }
      }
    }
  }

  if (!grid.isWalkableAt(eCol, eRow)) {
    let found = false;
    for (let radius = 1; radius <= 3 && !found; radius++) {
      for (let dx = -radius; dx <= radius && !found; dx++) {
        for (let dy = -radius; dy <= radius && !found; dy++) {
          const c = eCol + dx;
          const r = eRow + dy;
          if (c >= 0 && c < GRID_WIDTH && r >= 0 && r < GRID_HEIGHT && grid.isWalkableAt(c, r)) {
            eCol = c;
            eRow = r;
            found = true;
          }
        }
      }
    }
  }

  const rawPath = finder.findPath(sCol, sRow, eCol, eRow, grid);

  if (rawPath.length === 0) {
    // No path found - return direct line as fallback
    return [{ x: startX, y: startY }, { x: endX, y: endY }];
  }

  // Convert grid cells back to pixel coordinates (cell center)
  const path = (rawPath as [number, number][]).map(([c, r]) => ({
    x: c * CELL_SIZE + CELL_SIZE / 2,
    y: r * CELL_SIZE + CELL_SIZE / 2,
  }));

  if (path.length === 1) {
    path.push({ x: endX, y: endY });
  }

  return path;
}
