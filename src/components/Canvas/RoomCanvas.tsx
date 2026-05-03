import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import Konva from 'konva';
import { useLayoutStore } from '../../store/layoutStore';
import { inchesToPx } from '../../utils/scale';
import { GridLayer } from './GridLayer';
import { SectionalPiece } from './SectionalPiece';
import { SnapGuides } from './SnapGuides';
import { DimensionLayer } from './DimensionLayer';
import { computeOuterEdges } from '../../utils/outerEdges';
import type { GuideLine } from '../../utils/snap';
import type { PlacedPiece } from '../../types';

interface RoomCanvasProps {
  containerWidth: number;
  containerHeight: number;
  stageRef: React.RefObject<Konva.Stage | null>;
}

const MIN_SCALE = 0.35;
const MAX_SCALE = 10;

export const RoomCanvas: React.FC<RoomCanvasProps> = ({ containerWidth, containerHeight, stageRef }) => {
  const {
    room,
    placedPieces,
    selectedPieceIds,
    scale,
    viewportZoom,
    stageOffset,
    selectPiece,
    clearSelection,
    updatePiece,
    removeSelectedPieces,
    setViewportZoom,
    setStageOffset,
  } = useLayoutStore();

  const [guideLines, setGuideLines] = useState<GuideLine[]>([]);

  const roomPxW = inchesToPx(room.width, scale);
  const roomPxH = inchesToPx(room.height, scale);

  // Delete selected pieces on keyboard Delete/Backspace
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPieceIds.length > 0) {
        // Only delete if not focused in an input
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        removeSelectedPieces();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedPieceIds, removeSelectedPieces]);

  // Wheel zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const oldZoom = viewportZoom;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const scaleBy = 1.05;
      const direction = e.evt.deltaY < 0 ? 1 : -1;
      const newZoom = Math.min(MAX_SCALE, Math.max(MIN_SCALE, oldZoom * (direction > 0 ? scaleBy : 1 / scaleBy)));

      const mousePointTo = {
        x: (pointer.x - stageOffset.x) / oldZoom,
        y: (pointer.y - stageOffset.y) / oldZoom,
      };

      const newOffset = {
        x: pointer.x - mousePointTo.x * newZoom,
        y: pointer.y - mousePointTo.y * newZoom,
      };

      setViewportZoom(newZoom);
      setStageOffset(newOffset);
    },
    [viewportZoom, stageOffset, setViewportZoom, setStageOffset, stageRef]
  );

  // Pan via middle mouse button
  const isPanning = useRef(false);
  const lastPanPoint = useRef({ x: 0, y: 0 });
  const pinchState = useRef<{ lastCenter: { x: number; y: number } | null; lastDistance: number | null }>({
    lastCenter: null,
    lastDistance: null,
  });

  const getTouchPoint = useCallback((touch: Touch, stage: Konva.Stage) => {
    const rect = stage.container().getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }, []);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 1) {
      isPanning.current = true;
      lastPanPoint.current = { x: e.evt.clientX, y: e.evt.clientY };
      e.evt.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isPanning.current) return;
      const dx = e.evt.clientX - lastPanPoint.current.x;
      const dy = e.evt.clientY - lastPanPoint.current.y;
      lastPanPoint.current = { x: e.evt.clientX, y: e.evt.clientY };
      setStageOffset({ x: stageOffset.x + dx, y: stageOffset.y + dy });
    },
    [stageOffset, setStageOffset]
  );

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const handleTouchStart = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (e.evt.touches.length !== 2) return;
      const stage = stageRef.current;
      if (!stage) return;

      const p1 = getTouchPoint(e.evt.touches[0], stage);
      const p2 = getTouchPoint(e.evt.touches[1], stage);
      const center = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      };
      const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);

      pinchState.current = {
        lastCenter: center,
        lastDistance: distance,
      };
    },
    [getTouchPoint, stageRef]
  );

  const handleTouchMove = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (e.evt.touches.length !== 2) return;

      const stage = stageRef.current;
      if (!stage) return;

      e.evt.preventDefault();

      const p1 = getTouchPoint(e.evt.touches[0], stage);
      const p2 = getTouchPoint(e.evt.touches[1], stage);
      const center = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      };
      const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);

      const { lastCenter, lastDistance } = pinchState.current;
      if (!lastCenter || !lastDistance || lastDistance === 0) {
        pinchState.current = { lastCenter: center, lastDistance: distance };
        return;
      }

      const oldZoom = viewportZoom;
      const zoomFactor = distance / lastDistance;
      const newZoom = Math.min(MAX_SCALE, Math.max(MIN_SCALE, oldZoom * zoomFactor));

      const centerDelta = {
        x: center.x - lastCenter.x,
        y: center.y - lastCenter.y,
      };

      const pannedOffset = {
        x: stageOffset.x + centerDelta.x,
        y: stageOffset.y + centerDelta.y,
      };

      const worldPoint = {
        x: (center.x - pannedOffset.x) / oldZoom,
        y: (center.y - pannedOffset.y) / oldZoom,
      };

      const newOffset = {
        x: center.x - worldPoint.x * newZoom,
        y: center.y - worldPoint.y * newZoom,
      };

      setViewportZoom(newZoom);
      setStageOffset(newOffset);
      pinchState.current = { lastCenter: center, lastDistance: distance };
    },
    [getTouchPoint, viewportZoom, stageOffset, setViewportZoom, setStageOffset, stageRef]
  );

  const handleTouchEnd = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    if (e.evt.touches.length < 2) {
      pinchState.current = { lastCenter: null, lastDistance: null };
    }
  }, []);

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Deselect when clicking empty space (unless Ctrl held for multi-select)
      if (e.target === e.currentTarget && !e.evt.ctrlKey) {
        clearSelection();
      }
    },
    [clearSelection]
  );

  // Group drag: track start positions of all selected pieces
  const groupDragStartPositions = useRef<Record<string, { x: number; y: number }>>({});

  const handleGroupDragStart = useCallback(
    (_leadId: string) => {
      const positions: Record<string, { x: number; y: number }> = {};
      for (const p of placedPieces) {
        if (selectedPieceIds.includes(p.id)) {
          positions[p.id] = { x: p.x, y: p.y };
        }
      }
      groupDragStartPositions.current = positions;
    },
    [selectedPieceIds, placedPieces]
  );

  const handleGroupDragMove = useCallback(
    (leadId: string, dx: number, dy: number) => {
      for (const [id, startPos] of Object.entries(groupDragStartPositions.current)) {
        if (id !== leadId) {
          updatePiece(id, { x: startPos.x + dx, y: startPos.y + dy });
        }
      }
    },
    [updatePiece]
  );

  const handleGroupDragEnd = useCallback(
    (leadId: string, finalX: number, finalY: number) => {
      updatePiece(leadId, { x: finalX, y: finalY });
      groupDragStartPositions.current = {};
    },
    [updatePiece]
  );

  // Compute clusters for the info overlay
  const clusters = computeClusters(placedPieces, scale);

  // Compute outer edge segments for dimension annotations
  const outerEdges = computeOuterEdges(placedPieces, scale);

  return (
    <Stage
      ref={stageRef}
      width={containerWidth}
      height={containerHeight}
      x={stageOffset.x}
      y={stageOffset.y}
      scaleX={viewportZoom}
      scaleY={viewportZoom}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleStageClick}

    >
      {/* Background / room layer */}
      <Layer>
        {/* Room fill */}
        <Rect
          x={0}
          y={0}
          width={roomPxW}
          height={roomPxH}
          fill="#ffffff"
          stroke="#374151"
          strokeWidth={2}
          shadowEnabled
          shadowColor="rgba(0,0,0,0.15)"
          shadowBlur={8}
          shadowOffsetX={2}
          shadowOffsetY={2}
        />
        {/* Obstacles */}
        {room.obstacles.map((obs) => (
          <Group key={obs.id} x={inchesToPx(obs.x, scale)} y={inchesToPx(obs.y, scale)}>
            <Rect
              width={inchesToPx(obs.width, scale)}
              height={inchesToPx(obs.height, scale)}
              fill="#9ca3af"
              stroke="#4b5563"
              strokeWidth={1.5}
            />
            <Text
              text={obs.label}
              width={inchesToPx(obs.width, scale)}
              height={inchesToPx(obs.height, scale)}
              align="center"
              verticalAlign="middle"
              fontSize={10}
              fill="#ffffff"
              listening={false}
            />
          </Group>
        ))}
      </Layer>

      {/* Grid layer */}
      <GridLayer roomWidthIn={room.width} roomHeightIn={room.height} scale={scale} />

      {/* Pieces layer */}
      <Layer>
        {placedPieces.map((piece) => (
          <SectionalPiece
            key={piece.id}
            piece={piece}
            isSelected={selectedPieceIds.includes(piece.id)}
            selectedCount={selectedPieceIds.length}
            scale={scale}
            otherPieces={placedPieces.filter((p) => p.id !== piece.id)}
            onSelect={selectPiece}
            onUpdate={updatePiece}
            onGuideLines={setGuideLines}
            onGroupDragStart={handleGroupDragStart}
            onGroupDragMove={handleGroupDragMove}
            onGroupDragEnd={handleGroupDragEnd}
          />
        ))}
        <SnapGuides guides={guideLines} />
      </Layer>

      {/* Edge dimension annotations */}
      <DimensionLayer segments={outerEdges} />

      {/* Per-cluster bounding box + perimeter overlay */}
      {clusters.length > 0 && (
        <Layer listening={false}>
          {clusters.map((cluster, i) => {
            const bb = cluster.bbox;
            const perimIn = Math.round(cluster.perimeterPx / scale);
            return (
              <React.Fragment key={i}>
                <Rect
                  x={bb.x - 4}
                  y={bb.y - 4}
                  width={bb.w + 8}
                  height={bb.h + 8}
                  stroke="#3b82f6"
                  strokeWidth={1}
                  dash={[6, 4]}
                  fill="transparent"
                />
                <Text
                  x={bb.x}
                  y={bb.y + bb.h + 8}
                  text={`${bb.wIn}" W × ${bb.hIn}" D  •  Perimeter: ${perimIn}" (${(perimIn / 12).toFixed(1)} ft)`}
                  fontSize={11}
                  fill="#1d4ed8"
                  fontStyle="bold"
                />
              </React.Fragment>
            );
          })}
        </Layer>
      )}
    </Stage>
  );
};

interface BBox {
  x: number; y: number; w: number; h: number;
  wIn: number; hIn: number;
}

interface Cluster {
  pieces: PlacedPiece[];
  bbox: BBox;
  perimeterPx: number;
}

function computeClusters(pieces: PlacedPiece[], scale: number): Cluster[] {
  if (pieces.length === 0) return [];
  const TOUCH_THRESHOLD = 2;
  const adjacent = new Map<string, Set<string>>();
  for (const p of pieces) adjacent.set(p.id, new Set());
  for (let i = 0; i < pieces.length; i++) {
    for (let j = i + 1; j < pieces.length; j++) {
      if (areTouching(pieces[i], pieces[j], scale, TOUCH_THRESHOLD)) {
        adjacent.get(pieces[i].id)!.add(pieces[j].id);
        adjacent.get(pieces[j].id)!.add(pieces[i].id);
      }
    }
  }
  const visited = new Set<string>();
  const clusters: Cluster[] = [];
  for (const piece of pieces) {
    if (visited.has(piece.id)) continue;
    const clusterPieces: PlacedPiece[] = [];
    const queue: PlacedPiece[] = [piece];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (visited.has(curr.id)) continue;
      visited.add(curr.id);
      clusterPieces.push(curr);
      for (const neighborId of adjacent.get(curr.id)!) {
        if (!visited.has(neighborId)) {
          const neighbor = pieces.find((p) => p.id === neighborId)!;
          queue.push(neighbor);
        }
      }
    }
    clusters.push({
      pieces: clusterPieces,
      bbox: computeBBox(clusterPieces, scale),
      perimeterPx: computePerimeter(clusterPieces, scale),
    });
  }
  return clusters;
}

function areTouching(a: PlacedPiece, b: PlacedPiece, scale: number, threshold: number): boolean {
  const ax1 = a.x, ax2 = a.x + inchesToPx(a.width, scale);
  const ay1 = a.y, ay2 = a.y + inchesToPx(a.depth, scale);
  const bx1 = b.x, bx2 = b.x + inchesToPx(b.width, scale);
  const by1 = b.y, by2 = b.y + inchesToPx(b.depth, scale);
  const leftRightTouch = Math.abs(ax2 - bx1) <= threshold || Math.abs(bx2 - ax1) <= threshold;
  const verticalOverlap = Math.min(ay2, by2) > Math.max(ay1, by1);
  const topBottomTouch = Math.abs(ay2 - by1) <= threshold || Math.abs(by2 - ay1) <= threshold;
  const horizontalOverlap = Math.min(ax2, bx2) > Math.max(ax1, bx1);
  return (leftRightTouch && verticalOverlap) || (topBottomTouch && horizontalOverlap);
}

function computeBBox(pieces: PlacedPiece[], scale: number): BBox {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pieces) {
    const r = p.x + inchesToPx(p.width, scale);
    const b = p.y + inchesToPx(p.depth, scale);
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (r > maxX) maxX = r;
    if (b > maxY) maxY = b;
  }
  const w = maxX - minX;
  const h = maxY - minY;
  return { x: minX, y: minY, w, h, wIn: Math.round(w / scale), hIn: Math.round(h / scale) };
}

function computePerimeter(pieces: PlacedPiece[], scale: number): number {
  let total = 0;
  for (const p of pieces) {
    total += 2 * (inchesToPx(p.width, scale) + inchesToPx(p.depth, scale));
  }
  const THRESHOLD = 2;
  for (let i = 0; i < pieces.length; i++) {
    for (let j = i + 1; j < pieces.length; j++) {
      total -= 2 * sharedEdgeLength(pieces[i], pieces[j], scale, THRESHOLD);
    }
  }
  return total;
}

function sharedEdgeLength(a: PlacedPiece, b: PlacedPiece, scale: number, threshold: number): number {
  const ax1 = a.x, ax2 = a.x + inchesToPx(a.width, scale);
  const ay1 = a.y, ay2 = a.y + inchesToPx(a.depth, scale);
  const bx1 = b.x, bx2 = b.x + inchesToPx(b.width, scale);
  const by1 = b.y, by2 = b.y + inchesToPx(b.depth, scale);
  let shared = 0;
  if (Math.abs(ax2 - bx1) <= threshold || Math.abs(bx2 - ax1) <= threshold) {
    const overlapY = Math.min(ay2, by2) - Math.max(ay1, by1);
    if (overlapY > 0) shared += overlapY;
  }
  if (Math.abs(ay2 - by1) <= threshold || Math.abs(by2 - ay1) <= threshold) {
    const overlapX = Math.min(ax2, bx2) - Math.max(ax1, bx1);
    if (overlapX > 0) shared += overlapX;
  }
  return shared;
}
