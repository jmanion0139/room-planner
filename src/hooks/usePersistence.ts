import { useEffect, useRef } from 'react';
import { useLayoutStore } from '../store/layoutStore';
import { useRoomsStore } from '../store/roomsStore';
import type { LayoutState, RoomTab } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'room-planner-rooms';
const LEGACY_KEY = 'slv-layout';
const DEBOUNCE_MS = 800;

interface PersistedData {
  rooms: RoomTab[];
  activeRoomId: string;
  pieceDefinitions: LayoutState['pieceDefinitions'];
}

export function usePersistence() {
  const { room, placedPieces, pieceDefinitions, loadLayout } = useLayoutStore();
  const { rooms, activeRoomId, hydrateRooms, syncCurrentRoom } = useRoomsStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as PersistedData;
        if (data.rooms?.length && data.activeRoomId && data.pieceDefinitions) {
          const activeRoom = data.rooms.find((r) => r.id === data.activeRoomId) ?? data.rooms[0];
          hydrateRooms(data.rooms, activeRoom.id);
          loadLayout({
            room: activeRoom.room,
            placedPieces: activeRoom.placedPieces,
            pieceDefinitions: data.pieceDefinitions,
          });
          return;
        }
      }

      // Migrate legacy key
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy) as LayoutState;
        if (parsed.room && parsed.placedPieces && parsed.pieceDefinitions) {
          const migratedTab: RoomTab = {
            id: uuidv4(),
            name: 'Room 1',
            room: parsed.room,
            placedPieces: parsed.placedPieces,
          };
          hydrateRooms([migratedTab], migratedTab.id);
          loadLayout(parsed);
        }
      }
    } catch {
      // Ignore malformed storage
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced save whenever any relevant state changes
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      try {
        // Sync live canvas into the active room slot, then read the freshest list
        syncCurrentRoom(room, placedPieces);
        const latestRooms = useRoomsStore.getState().rooms;

        const data: PersistedData = {
          rooms: latestRooms,
          activeRoomId,
          pieceDefinitions,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // Ignore quota errors
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [room, placedPieces, pieceDefinitions, rooms, activeRoomId, syncCurrentRoom]);
}
