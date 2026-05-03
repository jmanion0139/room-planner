import React from 'react';
import { useLayoutStore } from '../../store/layoutStore';
import type { PieceDefinition } from '../../types';

const PIECE_COLORS: Record<string, string> = {
  'seat-base': 'bg-blue-200 border-blue-400',
  'standard-side': 'bg-green-200 border-green-400',
  'deep-side': 'bg-red-200 border-red-400',
};
const CUSTOM_COLOR = 'bg-amber-100 border-amber-400';

export const PieceLibrary: React.FC = () => {
  const { pieceDefinitions, addPiece, removeDefinition } = useLayoutStore();
  const defaults = pieceDefinitions.filter((d) => !d.isCustom);
  const custom = pieceDefinitions.filter((d) => d.isCustom);

  const renderPiece = (def: PieceDefinition) => {
    const colorClass = PIECE_COLORS[def.id] ?? CUSTOM_COLOR;
    return (
      <div key={def.id} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-gray-300 bg-white group">
        <div className={`w-8 h-8 rounded border-2 flex-shrink-0 ${colorClass}`} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-800 truncate">{def.label}</div>
          <div className="text-xs text-gray-500">{def.width}" × {def.depth}"</div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => addPiece(def.id)}
            title="Add to canvas"
            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
          >
            +
          </button>
          {def.isCustom && (
            <button
              onClick={() => removeDefinition(def.id)}
              title="Delete piece type"
              className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Standard Pieces</h3>
        <div className="space-y-1.5">{defaults.map(renderPiece)}</div>
      </div>
      {custom.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Custom Pieces</h3>
          <div className="space-y-1.5">{custom.map(renderPiece)}</div>
        </div>
      )}
    </div>
  );
};
