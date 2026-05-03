import React, { useState } from 'react';
import { useLayoutStore } from '../../store/layoutStore';

export const CustomPieceForm: React.FC = () => {
  const addDefinition = useLayoutStore((s) => s.addDefinition);
  const [label, setLabel] = useState('');
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(width);
    const d = parseFloat(depth);
    if (!label.trim()) { setError('Name is required'); return; }
    if (isNaN(w) || w <= 0) { setError('Width must be a positive number'); return; }
    if (isNaN(d) || d <= 0) { setError('Depth must be a positive number'); return; }
    addDefinition({ label: label.trim(), width: w, depth: d });
    setLabel('');
    setWidth('');
    setDepth('');
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Add Custom Piece</h3>
      <input
        type="text"
        placeholder="Name"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex gap-2">
        <input
          type="number"
          placeholder='Width (")'
          value={width}
          onChange={(e) => setWidth(e.target.value)}
          min={1}
          className="w-1/2 text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          placeholder='Depth (")'
          value={depth}
          onChange={(e) => setDepth(e.target.value)}
          min={1}
          className="w-1/2 text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        className="w-full text-sm bg-blue-600 text-white py-1.5 rounded hover:bg-blue-700 transition-colors font-medium"
      >
        Add Piece
      </button>
    </form>
  );
};
