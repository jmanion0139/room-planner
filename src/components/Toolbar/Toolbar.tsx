import React, { useRef } from 'react';
import Konva from 'konva';
import { useLayoutStore } from '../../store/layoutStore';
import { exportPNG, exportJSON, importJSON } from '../../utils/export';

interface ToolbarProps {
  stageRef: React.RefObject<Konva.Stage | null>;
}

export const Toolbar: React.FC<ToolbarProps> = ({ stageRef }) => {
  const { room, placedPieces, pieceDefinitions, loadLayout, resetLayout } = useLayoutStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportPNG = () => {
    if (stageRef.current) exportPNG(stageRef.current);
  };

  const handleExportJSON = () => {
    exportJSON({ room, placedPieces, pieceDefinitions });
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const state = await importJSON(file);
      loadLayout(state);
    } catch (err) {
      alert('Failed to load layout file. Make sure it is a valid JSON layout export.');
    }
    e.target.value = '';
  };

  const handleReset = () => {
    if (window.confirm('Clear the canvas and reset to default? This cannot be undone.')) {
      resetLayout();
    }
  };

  return (
    <header className="flex items-center gap-2 px-3 md:px-4 min-h-12 py-2 bg-gray-900 text-white shadow-lg flex-shrink-0 flex-wrap">
      <span className="font-bold text-sm tracking-wide mr-2 md:mr-4 text-blue-300">Room Planner</span>

      <div className="h-5 w-px bg-gray-600" />

      <button
        onClick={handleExportPNG}
        className="text-xs px-3 py-1.5 bg-blue-700 hover:bg-blue-600 rounded transition-colors font-medium"
        title="Export layout as PNG image"
      >
        Export PNG
      </button>

      <button
        onClick={handleExportJSON}
        className="text-xs px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded transition-colors font-medium"
        title="Export layout as JSON file"
      >
        Save JSON
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="text-xs px-3 py-1.5 bg-yellow-700 hover:bg-yellow-600 rounded transition-colors font-medium"
        title="Load layout from JSON file"
      >
        Load JSON
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        title="Import layout JSON"
        onChange={handleImportJSON}
        className="hidden"
      />

      <div className="h-5 w-px bg-gray-600" />

      <button
        onClick={handleReset}
        className="text-xs px-3 py-1.5 bg-red-800 hover:bg-red-700 rounded transition-colors font-medium"
        title="Reset canvas"
      >
        Reset
      </button>

      <div className="flex-1" />

      <span className="hidden md:inline text-xs text-gray-400">
        {placedPieces.length} piece{placedPieces.length !== 1 ? 's' : ''} · Scroll to zoom · Middle-drag to pan · Delete to remove selected
      </span>
      <span className="md:hidden text-xs text-gray-400 w-full pt-1">
        {placedPieces.length} piece{placedPieces.length !== 1 ? 's' : ''} · Pinch to zoom · Two-finger pan · Use Properties to rotate/remove
      </span>
    </header>
  );
};
