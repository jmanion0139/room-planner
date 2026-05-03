import type { PlacedPiece } from '../types';
import { inchesToPx } from './scale';

export const GRID_SNAP_INCHES = 6;
export const PIECE_SNAP_THRESHOLD_PX = 18;

/** Snap x,y (canvas px) to the nearest grid increment */
export function snapToGrid(
  x: number,
  y: number,
  gridInches: number,
  scale: number
): { x: number; y: number } {
  const gridPx = inchesToPx(gridInches, scale);
  return {
    x: Math.round(x / gridPx) * gridPx,
    y: Math.round(y / gridPx) * gridPx,
  };
}

interface PieceBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function getBounds(piece: PlacedPiece, scale: number): PieceBounds {
  return {
    left: piece.x,
    top: piece.y,
    right: piece.x + inchesToPx(piece.width, scale),
    bottom: piece.y + inchesToPx(piece.depth, scale),
  };
}

export interface SnapResult {
  x: number;
  y: number;
  guideLines: GuideLine[];
}

export interface GuideLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Try to snap dragging piece edge-to-edge against stationary pieces.
 * Returns the snapped position and any guide lines to render.
 */
export function snapToPieces(
  dragging: PlacedPiece,
  others: PlacedPiece[],
  threshold: number,
  scale: number
): SnapResult {
  let snappedX = dragging.x;
  let snappedY = dragging.y;
  const guides: GuideLine[] = [];

  const dW = inchesToPx(dragging.width, scale);
  const dH = inchesToPx(dragging.depth, scale);

  let bestDX = threshold + 1;
  let bestDY = threshold + 1;

  for (const other of others) {
    if (other.id === dragging.id) continue;
    const o = getBounds(other, scale);
    // Horizontal snap: dragging right edge → other left edge
    const dx1 = Math.abs(dragging.x + dW - o.left);
    if (dx1 < bestDX) { bestDX = dx1; snappedX = o.left - dW; }

    // Horizontal snap: dragging left edge → other right edge
    const dx2 = Math.abs(dragging.x - o.right);
    if (dx2 < bestDX) { bestDX = dx2; snappedX = o.right; }

    // Vertical snap: dragging bottom edge → other top edge
    const dy1 = Math.abs(dragging.y + dH - o.top);
    if (dy1 < bestDY) { bestDY = dy1; snappedY = o.top - dH; }

    // Vertical snap: dragging top edge → other bottom edge
    const dy2 = Math.abs(dragging.y - o.bottom);
    if (dy2 < bestDY) { bestDY = dy2; snappedY = o.bottom; }
  }

  // Generate guide lines for snapped axes
  if (bestDX <= threshold) {
    guides.push({ x1: snappedX + dW, y1: dragging.y, x2: snappedX + dW, y2: dragging.y + dH });
  }
  if (bestDY <= threshold) {
    guides.push({ x1: dragging.x, y1: snappedY + dH, x2: dragging.x + dW, y2: snappedY + dH });
  }

  return { x: snappedX, y: snappedY, guideLines: guides };
}

/**
 * Align dragging piece along shared axis with nearest snapped neighbor.
 * Returns the aligned x or y if two edges are within threshold of each other.
 */
export function alignEdges(
  dragging: PlacedPiece,
  others: PlacedPiece[],
  threshold: number,
  scale: number
): { x: number; y: number } {
  let { x, y } = dragging;
  const dW = inchesToPx(dragging.width, scale);
  const dH = inchesToPx(dragging.depth, scale);

  for (const other of others) {
    if (other.id === dragging.id) continue;
    const o = getBounds(other, scale);

    // Align top edges
    if (Math.abs(y - o.top) < threshold) y = o.top;
    // Align bottom edges
    if (Math.abs(y + dH - o.bottom) < threshold) y = o.bottom - dH;
    // Align left edges
    if (Math.abs(x - o.left) < threshold) x = o.left;
    // Align right edges
    if (Math.abs(x + dW - o.right) < threshold) x = o.right - dW;
  }

  return { x, y };
}
