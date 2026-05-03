import React, { useState } from 'react';
import { useLayoutStore } from '../../store/layoutStore';


export const RoomSettings: React.FC = () => {
  const { room, setRoom, addObstacle, removeObstacle } = useLayoutStore();
  const [roomW, setRoomW] = useState(String(room.width));
  const [roomH, setRoomH] = useState(String(room.height));
  const [unit, setUnit] = useState<'in' | 'ft'>('ft');

  const toInches = (val: string): number => {
    const n = parseFloat(val);
    return unit === 'ft' ? n * 12 : n;
  };

  const fromInches = (inches: number): string => {
    return unit === 'ft' ? (inches / 12).toFixed(1) : String(inches);
  };

  const [obsLabel, setObsLabel] = useState('');
  const [obsX, setObsX] = useState('0');
  const [obsY, setObsY] = useState('0');
  const [obsW, setObsW] = useState('12');
  const [obsH, setObsH] = useState('12');

  const handleApplyRoom = () => {
    const w = toInches(roomW);
    const h = toInches(roomH);
    if (w > 0 && h > 0) setRoom({ width: w, height: h });
  };

  const handleAddObstacle = () => {
    if (!obsLabel.trim()) return;
    addObstacle({
      label: obsLabel.trim(),
      x: toInches(obsX),
      y: toInches(obsY),
      width: toInches(obsW),
      height: toInches(obsH),
    });
    setObsLabel('');
    setObsX('0');
    setObsY('0');
    setObsW('12');
    setObsH('12');
  };

  const handleToggleUnit = (newUnit: 'in' | 'ft') => {
    if (newUnit === unit) return;
    setUnit(newUnit);
    setRoomW(fromInches(toInches(roomW)));
    setRoomH(fromInches(toInches(roomH)));
  };

  return (
    <div className="space-y-4">
      {/* Unit toggle */}
      <div className="flex gap-1">
        {(['ft', 'in'] as const).map((u) => (
          <button
            key={u}
            onClick={() => handleToggleUnit(u)}
            className={`flex-1 text-xs py-1 rounded border transition-colors ${unit === u ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}
          >
            {u === 'ft' ? 'Feet' : 'Inches'}
          </button>
        ))}
      </div>

      {/* Room dimensions */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Room Size</h3>
        <div className="flex gap-2 mb-2">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Width ({unit})</label>
            <input
              type="number"
              title={`Room width in ${unit}`}
              value={roomW}
              onChange={(e) => setRoomW(e.target.value)}
              min={1}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Depth ({unit})</label>
            <input
              type="number"
              title={`Room depth in ${unit}`}
              value={roomH}
              onChange={(e) => setRoomH(e.target.value)}
              min={1}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <button
          onClick={handleApplyRoom}
          className="w-full text-sm bg-gray-700 text-white py-1.5 rounded hover:bg-gray-800 transition-colors font-medium"
        >
          Apply Room Size
        </button>
      </div>

      {/* Obstacles */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Obstacles</h3>
        <div className="space-y-1 mb-2">
          {room.obstacles.length === 0 && (
            <p className="text-xs text-gray-400 italic">No obstacles added</p>
          )}
          {room.obstacles.map((obs) => (
            <div key={obs.id} className="flex items-center justify-between text-xs bg-gray-100 rounded px-2 py-1">
              <span className="font-medium text-gray-700">{obs.label}</span>
              <span className="text-gray-500">{obs.width}"×{obs.height}" @ ({obs.x}",{obs.y}")</span>
              <button
                onClick={() => removeObstacle(obs.id)}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Add obstacle form */}
        <div className="space-y-1.5 border border-dashed border-gray-300 rounded p-2">
          <p className="text-xs text-gray-500 font-medium">Add Obstacle</p>
          <input
            type="text"
            placeholder="Label (e.g. Door, Column)"
            value={obsLabel}
            onChange={(e) => setObsLabel(e.target.value)}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="grid grid-cols-2 gap-1">
            <input type="number" placeholder={`X (${unit})`} value={obsX} onChange={(e) => setObsX(e.target.value)} className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="number" placeholder={`Y (${unit})`} value={obsY} onChange={(e) => setObsY(e.target.value)} className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="number" placeholder={`W (${unit})`} value={obsW} onChange={(e) => setObsW(e.target.value)} className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="number" placeholder={`H (${unit})`} value={obsH} onChange={(e) => setObsH(e.target.value)} className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button
            onClick={handleAddObstacle}
            className="w-full text-xs bg-gray-600 text-white py-1 rounded hover:bg-gray-700 transition-colors"
          >
            Add Obstacle
          </button>
        </div>
      </div>
    </div>
  );
};
