import React from 'react';
import { Layer, Line, Text, Rect, Group } from 'react-konva';
import type { EdgeSegment } from '../../utils/outerEdges';

interface DimensionLayerProps {
  segments: EdgeSegment[];
}

/** Pixels from the piece edge to the dimension line. */
const DIM_OFFSET = 22;
/** Half-length of the tick marks at each end of the dimension line. */
const TICK_HALF = 4;
const FONT_SIZE = 10;
const STROKE = '#6366f1';   // indigo-500
const TEXT_FILL = '#3730a3'; // indigo-800

export const DimensionLayer: React.FC<DimensionLayerProps> = ({ segments }) => {
  return (
    <Layer listening={false}>
      {segments.map((seg, i) => {
        const { axis, fixed, start, end, side, lengthIn } = seg;
        const label = `${lengthIn}"`;
        const labelWidth = Math.max(28, label.length * 6 + 10);
        const labelHeight = FONT_SIZE + 4;
        const mid = (start + end) / 2;
        // outward direction: top/left faces negative axis direction, bottom/right faces positive
        const outward = side === 'top' || side === 'left' ? -1 : 1;
        const lineCoord = fixed + outward * DIM_OFFSET;

        if (axis === 'h') {
          // Horizontal dimension: dimension line runs horizontally at lineCoord (y-value)
          return (
            <Group key={i}>
              {/* Leader lines from piece edge down to dimension line */}
              <Line
                points={[start, fixed, start, lineCoord]}
                stroke={STROKE} strokeWidth={1} opacity={0.55}
              />
              <Line
                points={[end, fixed, end, lineCoord]}
                stroke={STROKE} strokeWidth={1} opacity={0.55}
              />
              {/* Dimension line */}
              <Line
                points={[start, lineCoord, end, lineCoord]}
                stroke={STROKE} strokeWidth={1.5}
              />
              {/* End ticks on dimension line */}
              <Line
                points={[start, lineCoord - TICK_HALF, start, lineCoord + TICK_HALF]}
                stroke={STROKE} strokeWidth={1.5}
              />
              <Line
                points={[end, lineCoord - TICK_HALF, end, lineCoord + TICK_HALF]}
                stroke={STROKE} strokeWidth={1.5}
              />
              {/* Label */}
              <Rect
                x={mid - labelWidth / 2}
                y={lineCoord - labelHeight / 2}
                width={labelWidth}
                height={labelHeight}
                fill="white"
                opacity={0.92}
                cornerRadius={2}
              />
              <Text
                x={mid - labelWidth / 2}
                y={lineCoord - labelHeight / 2 + 1}
                width={labelWidth}
                align="center"
                text={label}
                fontSize={FONT_SIZE}
                fill={TEXT_FILL}
                fontStyle="bold"
                listening={false}
              />
            </Group>
          );
        } else {
          // Vertical dimension: dimension line runs vertically at lineCoord (x-value)
          return (
            <Group key={i}>
              {/* Leader lines from piece edge across to dimension line */}
              <Line
                points={[fixed, start, lineCoord, start]}
                stroke={STROKE} strokeWidth={1} opacity={0.55}
              />
              <Line
                points={[fixed, end, lineCoord, end]}
                stroke={STROKE} strokeWidth={1} opacity={0.55}
              />
              {/* Dimension line */}
              <Line
                points={[lineCoord, start, lineCoord, end]}
                stroke={STROKE} strokeWidth={1.5}
              />
              {/* End ticks on dimension line */}
              <Line
                points={[lineCoord - TICK_HALF, start, lineCoord + TICK_HALF, start]}
                stroke={STROKE} strokeWidth={1.5}
              />
              <Line
                points={[lineCoord - TICK_HALF, end, lineCoord + TICK_HALF, end]}
                stroke={STROKE} strokeWidth={1.5}
              />
              {/* Label */}
              <Rect
                x={lineCoord - labelWidth / 2}
                y={mid - labelHeight / 2}
                width={labelWidth}
                height={labelHeight}
                fill="white"
                opacity={0.92}
                cornerRadius={2}
              />
              <Text
                x={lineCoord - labelWidth / 2}
                y={mid - labelHeight / 2 + 1}
                width={labelWidth}
                align="center"
                text={label}
                fontSize={FONT_SIZE}
                fill={TEXT_FILL}
                fontStyle="bold"
                listening={false}
              />
            </Group>
          );
        }
      })}
    </Layer>
  );
};
