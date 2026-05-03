import React from 'react';
import { Line } from 'react-konva';
import type { GuideLine } from '../../utils/snap';

interface SnapGuidesProps {
  guides: GuideLine[];
}

export const SnapGuides: React.FC<SnapGuidesProps> = ({ guides }) => (
  <>
    {guides.map((g, i) => (
      <Line
        key={i}
        points={[g.x1, g.y1, g.x2, g.y2]}
        stroke="#3b82f6"
        strokeWidth={1.5}
        dash={[6, 3]}
        listening={false}
      />
    ))}
  </>
);
