import type { PlacedPiece } from '../types';
import { inchesToPx } from './scale';

export interface EdgeSegment {
  axis: 'h' | 'v';
  fixed: number;    // y for horizontal, x for vertical (canvas px)
  start: number;    // start along perpendicular axis (canvas px)
  end: number;      // end along perpendicular axis (canvas px)
  side: 'top' | 'bottom' | 'left' | 'right';
  lengthIn: number; // length in whole inches
}

interface Interval {
  start: number;
  end: number;
}

function subtractIntervals(source: Interval[], subtract: Interval[]): Interval[] {
  let result = [...source];
  for (const sub of subtract) {
    const next: Interval[] = [];
    for (const seg of result) {
      if (sub.end <= seg.start || sub.start >= seg.end) {
        next.push(seg);
      } else {
        if (seg.start < sub.start) next.push({ start: seg.start, end: sub.start });
        if (sub.end < seg.end) next.push({ start: sub.end, end: seg.end });
      }
    }
    result = next;
  }
  return result;
}

function mergeIntervals(intervals: Interval[]): Interval[] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: Interval[] = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (sorted[i].start <= last.end + 1) {
      last.end = Math.max(last.end, sorted[i].end);
    } else {
      merged.push({ ...sorted[i] });
    }
  }
  return merged;
}

/** Tolerance (px) for treating two coordinates as the same edge line. */
const COORD_THRESHOLD = 2;

/**
 * Compute all outer (exterior-facing) edge segments for the given pieces.
 * Two pieces sharing an edge cancel that edge; only unshared edges remain.
 * Results are suitable for drawing dimension annotations on the canvas.
 */
export function computeOuterEdges(pieces: PlacedPiece[], scale: number): EdgeSegment[] {
  if (pieces.length === 0) return [];

  // Collect all unique horizontal (y) and vertical (x) boundary coordinates.
  const rawYs: number[] = [];
  const rawXs: number[] = [];
  for (const p of pieces) {
    rawYs.push(p.y, p.y + inchesToPx(p.depth, scale));
    rawXs.push(p.x, p.x + inchesToPx(p.width, scale));
  }

  function uniqueCoords(vals: number[]): number[] {
    const rounded = [...new Set(vals.map((v) => Math.round(v)))].sort((a, b) => a - b);
    const result: number[] = [];
    for (const c of rounded) {
      if (result.length === 0 || c - result[result.length - 1] > COORD_THRESHOLD) {
        result.push(c);
      }
    }
    return result;
  }

  const uniqueYs = uniqueCoords(rawYs);
  const uniqueXs = uniqueCoords(rawXs);
  const segments: EdgeSegment[] = [];

  // --- Horizontal edges (top / bottom of pieces) ---
  for (const y of uniqueYs) {
    const topIntervals: Interval[] = [];
    const bottomIntervals: Interval[] = [];
    for (const p of pieces) {
      const pxW = inchesToPx(p.width, scale);
      const pxH = inchesToPx(p.depth, scale);
      if (Math.abs(p.y - y) <= COORD_THRESHOLD) {
        topIntervals.push({ start: p.x, end: p.x + pxW });
      }
      if (Math.abs(p.y + pxH - y) <= COORD_THRESHOLD) {
        bottomIntervals.push({ start: p.x, end: p.x + pxW });
      }
    }
    const tops = mergeIntervals(topIntervals);
    const bottoms = mergeIntervals(bottomIntervals);

    for (const seg of subtractIntervals(tops, bottoms)) {
      const lengthIn = Math.round((seg.end - seg.start) / scale);
      if (lengthIn > 0) {
        segments.push({ axis: 'h', fixed: y, start: seg.start, end: seg.end, side: 'top', lengthIn });
      }
    }
    for (const seg of subtractIntervals(bottoms, tops)) {
      const lengthIn = Math.round((seg.end - seg.start) / scale);
      if (lengthIn > 0) {
        segments.push({ axis: 'h', fixed: y, start: seg.start, end: seg.end, side: 'bottom', lengthIn });
      }
    }
  }

  // --- Vertical edges (left / right of pieces) ---
  for (const x of uniqueXs) {
    const leftIntervals: Interval[] = [];
    const rightIntervals: Interval[] = [];
    for (const p of pieces) {
      const pxW = inchesToPx(p.width, scale);
      const pxH = inchesToPx(p.depth, scale);
      if (Math.abs(p.x - x) <= COORD_THRESHOLD) {
        leftIntervals.push({ start: p.y, end: p.y + pxH });
      }
      if (Math.abs(p.x + pxW - x) <= COORD_THRESHOLD) {
        rightIntervals.push({ start: p.y, end: p.y + pxH });
      }
    }
    const lefts = mergeIntervals(leftIntervals);
    const rights = mergeIntervals(rightIntervals);

    for (const seg of subtractIntervals(lefts, rights)) {
      const lengthIn = Math.round((seg.end - seg.start) / scale);
      if (lengthIn > 0) {
        segments.push({ axis: 'v', fixed: x, start: seg.start, end: seg.end, side: 'left', lengthIn });
      }
    }
    for (const seg of subtractIntervals(rights, lefts)) {
      const lengthIn = Math.round((seg.end - seg.start) / scale);
      if (lengthIn > 0) {
        segments.push({ axis: 'v', fixed: x, start: seg.start, end: seg.end, side: 'right', lengthIn });
      }
    }
  }

  return segments;
}
