import React from 'react';
import { Layer, Line } from 'react-konva';
import { inchesToPx } from '../../utils/scale';

interface GridLayerProps {
  roomWidthIn: number;
  roomHeightIn: number;
  scale: number;
}

const MAJOR_GRID_IN = 12;
const MINOR_GRID_IN = 6;

export const GridLayer: React.FC<GridLayerProps> = ({ roomWidthIn, roomHeightIn, scale }) => {
  const roomW = inchesToPx(roomWidthIn, scale);
  const roomH = inchesToPx(roomHeightIn, scale);

  const lines: React.ReactNode[] = [];

  // Vertical lines
  for (let x = 0; x <= roomWidthIn; x += MINOR_GRID_IN) {
    const px = inchesToPx(x, scale);
    const isMajor = x % MAJOR_GRID_IN === 0;
    lines.push(
      <Line
        key={`v-${x}`}
        points={[px, 0, px, roomH]}
        stroke={isMajor ? '#ccc' : '#e8e8e8'}
        strokeWidth={isMajor ? 1 : 0.5}
        listening={false}
      />
    );
  }

  // Horizontal lines
  for (let y = 0; y <= roomHeightIn; y += MINOR_GRID_IN) {
    const py = inchesToPx(y, scale);
    const isMajor = y % MAJOR_GRID_IN === 0;
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, py, roomW, py]}
        stroke={isMajor ? '#ccc' : '#e8e8e8'}
        strokeWidth={isMajor ? 1 : 0.5}
        listening={false}
      />
    );
  }

  return <Layer listening={false}>{lines}</Layer>;
};
