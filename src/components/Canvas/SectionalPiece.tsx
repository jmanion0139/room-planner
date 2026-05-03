import React, { useCallback, useRef } from 'react';
import { Group, Rect, Text } from 'react-konva';
import type { PlacedPiece } from '../../types';
import { inchesToPx } from '../../utils/scale';
import { snapToGrid, snapToPieces, alignEdges, GRID_SNAP_INCHES, PIECE_SNAP_THRESHOLD_PX } from '../../utils/snap';
import type { GuideLine } from '../../utils/snap';
import type { KonvaEventObject } from 'konva/lib/Node';

// Piece colours by piece type
const PIECE_COLORS: Record<string, string> = {
  'seat-base': '#93c5fd',     // blue-300
  'standard-side': '#86efac', // green-300
  'deep-side': '#fca5a5',     // red-300
};
const CUSTOM_COLOR = '#fde68a'; // amber-200
const SELECTED_STROKE = '#1d4ed8';
const MULTI_SELECTED_STROKE = '#7c3aed'; // purple-700
const DEFAULT_STROKE = '#374151';

interface SectionalPieceProps {
  piece: PlacedPiece;
  isSelected: boolean;
  selectedCount: number;
  scale: number;
  otherPieces: PlacedPiece[];
  onSelect: (id: string, addToSelection: boolean) => void;
  onUpdate: (id: string, changes: Partial<PlacedPiece>) => void;
  onGuideLines: (lines: GuideLine[]) => void;
  onGroupDragStart: (leadId: string) => void;
  onGroupDragMove: (leadId: string, dx: number, dy: number) => void;
  onGroupDragEnd: (leadId: string, finalX: number, finalY: number) => void;
}

export const SectionalPiece: React.FC<SectionalPieceProps> = ({
  piece,
  isSelected,
  selectedCount,
  scale,
  otherPieces,
  onSelect,
  onUpdate,
  onGuideLines,
  onGroupDragStart,
  onGroupDragMove,
  onGroupDragEnd,
}) => {
  const pxW = inchesToPx(piece.width, scale);
  const pxH = inchesToPx(piece.depth, scale);
  const fillColor = PIECE_COLORS[piece.definitionId] ?? CUSTOM_COLOR;
  const isGroupDrag = isSelected && selectedCount > 1;

  // Track position at drag start so we can compute deltas for group move
  const dragStartPos = useRef({ x: piece.x, y: piece.y });

  const handleDragStart = useCallback(() => {
    dragStartPos.current = { x: piece.x, y: piece.y };
    if (isGroupDrag) {
      onGroupDragStart(piece.id);
    }
  }, [piece.x, piece.y, isGroupDrag, piece.id, onGroupDragStart]);

  const handleDragMove = useCallback(
    (e: KonvaEventObject<DragEvent>) => {
      const node = e.target;
      let x = node.x();
      let y = node.y();

      if (isGroupDrag) {
        // Grid snap the lead piece and propagate delta to the whole group
        const gridSnapped = snapToGrid(x, y, GRID_SNAP_INCHES, scale);
        node.x(gridSnapped.x);
        node.y(gridSnapped.y);
        onGroupDragMove(
          piece.id,
          gridSnapped.x - dragStartPos.current.x,
          gridSnapped.y - dragStartPos.current.y,
        );
        return;
      }

      // Single-piece snap: edge-to-edge snap then grid fallback
      const snapResult = snapToPieces(
        { ...piece, x, y },
        otherPieces,
        PIECE_SNAP_THRESHOLD_PX,
        scale
      );

      x = snapResult.x;
      y = snapResult.y;

      const aligned = alignEdges({ ...piece, x, y }, otherPieces, PIECE_SNAP_THRESHOLD_PX, scale);
      x = aligned.x;
      y = aligned.y;

      if (snapResult.guideLines.length === 0) {
        const gridSnapped = snapToGrid(x, y, GRID_SNAP_INCHES, scale);
        x = gridSnapped.x;
        y = gridSnapped.y;
      }

      node.x(x);
      node.y(y);
      onGuideLines(snapResult.guideLines);
    },
    [piece, otherPieces, scale, onGuideLines, isGroupDrag, onGroupDragMove]
  );

  const handleDragEnd = useCallback(
    (e: KonvaEventObject<DragEvent>) => {
      if (isGroupDrag) {
        onGroupDragEnd(piece.id, e.target.x(), e.target.y());
        onGuideLines([]);
        return;
      }
      onUpdate(piece.id, { x: e.target.x(), y: e.target.y() });
      onGuideLines([]);
    },
    [isGroupDrag, piece.id, onGroupDragEnd, onUpdate, onGuideLines]
  );

  const strokeColor = isSelected
    ? (selectedCount > 1 ? MULTI_SELECTED_STROKE : SELECTED_STROKE)
    : DEFAULT_STROKE;

  const labelText = `${piece.label}\n${piece.width}" × ${piece.depth}"`;

  return (
    <Group
      x={piece.x}
      y={piece.y}
      draggable
      onClick={(e) => onSelect(piece.id, e.evt.ctrlKey)}
      onTap={() => onSelect(piece.id, false)}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <Rect
        width={pxW}
        height={pxH}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isSelected ? 2.5 : 1.5}
        cornerRadius={2}
        shadowEnabled={isSelected}
        shadowColor={selectedCount > 1 ? '#7c3aed' : '#1d4ed8'}
        shadowBlur={8}
        shadowOpacity={0.3}
      />
      <Text
        text={labelText}
        width={pxW}
        height={pxH}
        align="center"
        verticalAlign="middle"
        fontSize={Math.max(9, Math.min(13, scale * 2.5))}
        fill={isSelected ? '#1e3a8a' : '#1f2937'}
        fontStyle={isSelected ? 'bold' : 'normal'}
        padding={4}
        listening={false}
        wrap="word"
      />
    </Group>
  );
};
