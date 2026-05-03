import React from 'react';
import { useLayoutStore } from '../../store/layoutStore';

export const PropertiesPanel: React.FC = () => {
  const {
    placedPieces,
    selectedPieceIds,
    rotatePiece,
    removePiece,
    rotateSelectedPieces,
    removeSelectedPieces,
  } = useLayoutStore();

  const selectedPieces = placedPieces.filter((p) => selectedPieceIds.includes(p.id));

  if (selectedPieces.length === 0) {
    return (
      <div className="p-4 text-xs text-gray-400 italic">
        Select a piece on the canvas to see its properties. Hold Ctrl to select multiple.
      </div>
    );
  }

  if (selectedPieces.length === 1) {
    const piece = selectedPieces[0];
    return (
      <div className="p-4 space-y-4">
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Selected Piece</h3>
          <p className="text-sm font-bold text-gray-800">{piece.label}</p>
          <p className="text-xs text-gray-500">{piece.width}" × {piece.depth}" (W × D)</p>
          <p className="text-xs text-gray-400 mt-0.5">Rotation: {piece.rotation}°</p>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Rotation</h3>
          <button
            onClick={() => rotatePiece(piece.id)}
            className="w-full text-xs py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-300 transition-colors font-medium"
          >
            Rotate 90° →
          </button>
        </div>

        <div className="pt-2 border-t border-gray-200">
          <button
            onClick={() => removePiece(piece.id)}
            className="w-full text-xs py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-200 transition-colors font-medium"
          >
            Remove Piece
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Selection</h3>
        <p className="text-sm font-bold text-gray-800">{selectedPieces.length} pieces selected</p>
        <p className="text-xs text-gray-400 mt-0.5">Ctrl+click to add or remove pieces</p>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Group Actions</h3>
        <button
          onClick={rotateSelectedPieces}
          className="w-full text-xs py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-300 transition-colors font-medium"
        >
          Rotate Group 90° →
        </button>
      </div>

      <div className="pt-2 border-t border-gray-200">
        <button
          onClick={removeSelectedPieces}
          className="w-full text-xs py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-200 transition-colors font-medium"
        >
          Remove Selected ({selectedPieces.length})
        </button>
      </div>
    </div>
  );
};
