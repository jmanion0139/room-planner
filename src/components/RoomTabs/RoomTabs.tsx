import { useRef, useState, useEffect } from 'react';
import { useRoomsStore } from '../../store/roomsStore';
import { useLayoutStore } from '../../store/layoutStore';

interface RoomTabsProps {
  onAfterSwitch: () => void;
}

export function RoomTabs({ onAfterSwitch }: RoomTabsProps) {
  const { rooms, activeRoomId, switchRoom, addRoom, removeRoom, renameRoom } = useRoomsStore();
  const { room, placedPieces, loadRoomLayout } = useLayoutStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleSwitch = (id: string) => {
    if (id === activeRoomId) return;
    const result = switchRoom(id, room, placedPieces);
    loadRoomLayout(result.room, result.placedPieces);
    onAfterSwitch();
  };

  const handleAdd = () => {
    const result = addRoom(room, placedPieces);
    loadRoomLayout(result.room, result.placedPieces);
    onAfterSwitch();
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (rooms.length <= 1) return;
    const result = removeRoom(id, room, placedPieces);
    if (result) {
      loadRoomLayout(result.room, result.placedPieces);
      onAfterSwitch();
    }
  };

  const startEdit = (e: React.MouseEvent | React.TouchEvent, id: string, currentName: string) => {
    e.preventDefault();
    setEditingId(id);
    setEditingName(currentName);
  };

  const commitEdit = () => {
    if (editingId) {
      const trimmed = editingName.trim();
      if (trimmed) renameRoom(editingId, trimmed);
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditingId(null);
  };

  return (
    <div className="flex items-center gap-0 bg-gray-800 border-b border-gray-700 overflow-x-auto flex-shrink-0 select-none"
      style={{ scrollbarWidth: 'none' }}>
      {rooms.map((tab) => {
        const isActive = tab.id === activeRoomId;
        return (
          <div
            key={tab.id}
            onClick={() => handleSwitch(tab.id)}
            className={`group relative flex items-center gap-1.5 min-w-0 px-3 h-9 cursor-pointer flex-shrink-0 border-r border-gray-700 transition-colors ${
              isActive
                ? 'bg-gray-100 text-gray-900 border-b-2 border-b-blue-500'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {editingId === tab.id ? (
              <input
                ref={inputRef}
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="w-24 text-xs font-medium bg-white text-gray-900 border border-blue-400 rounded px-1 outline-none"
              />
            ) : (
              <span
                className="text-xs font-medium truncate max-w-[120px]"
                onDoubleClick={(e) => startEdit(e, tab.id, tab.name)}
              >
                {tab.name}
              </span>
            )}

            {rooms.length > 1 && (
              <button
                onClick={(e) => handleRemove(e, tab.id)}
                className={`flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full text-[10px] leading-none transition-colors ${
                  isActive
                    ? 'text-gray-500 hover:bg-red-100 hover:text-red-600'
                    : 'text-gray-500 opacity-0 group-hover:opacity-100 hover:bg-red-900 hover:text-red-400'
                }`}
                title="Remove room"
              >
                ×
              </button>
            )}
          </div>
        );
      })}

      <button
        onClick={handleAdd}
        className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-lg leading-none"
        title="Add room"
      >
        +
      </button>
    </div>
  );
}
