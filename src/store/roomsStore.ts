import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Room, PlacedPiece, RoomTab } from '../types';
import { DEFAULT_ROOM } from './layoutStore';

interface RoomsState {
  rooms: RoomTab[];
  activeRoomId: string;

  /** Write the current canvas state back into the active room slot (no side-effects). */
  syncCurrentRoom: (room: Room, placedPieces: PlacedPiece[]) => void;

  /** Sync current, switch to `id`, return the new room's data. */
  switchRoom: (id: string, currentRoom: Room, currentPieces: PlacedPiece[]) => { room: Room; placedPieces: PlacedPiece[] };

  /** Sync current, add a new default room, switch to it, return its data. */
  addRoom: (currentRoom: Room, currentPieces: PlacedPiece[]) => { room: Room; placedPieces: PlacedPiece[] };

  /**
   * Sync current, remove `id`. If `id` was active, switch to an adjacent tab.
   * Returns `{ room, placedPieces }` of the new active room (or null if the removed room
   * was not the active one and the active room didn't change).
   */
  removeRoom: (id: string, currentRoom: Room, currentPieces: PlacedPiece[]) => { room: Room; placedPieces: PlacedPiece[] } | null;

  /** Rename a room tab. */
  renameRoom: (id: string, name: string) => void;

  /** Replace the entire rooms list (used by persistence hydration). */
  hydrateRooms: (rooms: RoomTab[], activeRoomId: string) => void;
}

function makeDefaultRoom(index: number): RoomTab {
  return {
    id: uuidv4(),
    name: `Room ${index}`,
    room: { ...DEFAULT_ROOM, obstacles: [] },
    placedPieces: [],
  };
}

const firstRoom = makeDefaultRoom(1);

export const useRoomsStore = create<RoomsState>((set, get) => ({
  rooms: [firstRoom],
  activeRoomId: firstRoom.id,

  syncCurrentRoom: (room, placedPieces) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id === s.activeRoomId ? { ...r, room, placedPieces } : r
      ),
    })),

  switchRoom: (id, currentRoom, currentPieces) => {
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id === s.activeRoomId ? { ...r, room: currentRoom, placedPieces: currentPieces } : r
      ),
      activeRoomId: id,
    }));
    const target = get().rooms.find((r) => r.id === id)!;
    return { room: target.room, placedPieces: target.placedPieces };
  },

  addRoom: (currentRoom, currentPieces) => {
    const newTab = makeDefaultRoom(get().rooms.length + 1);
    set((s) => ({
      rooms: [
        ...s.rooms.map((r) =>
          r.id === s.activeRoomId ? { ...r, room: currentRoom, placedPieces: currentPieces } : r
        ),
        newTab,
      ],
      activeRoomId: newTab.id,
    }));
    return { room: newTab.room, placedPieces: newTab.placedPieces };
  },

  removeRoom: (id, currentRoom, currentPieces) => {
    const { rooms, activeRoomId } = get();
    if (rooms.length <= 1) return null; // can't remove last tab

    // Sync current into its slot first
    const synced = rooms.map((r) =>
      r.id === activeRoomId ? { ...r, room: currentRoom, placedPieces: currentPieces } : r
    );
    const remaining = synced.filter((r) => r.id !== id);

    let newActiveId = activeRoomId;
    if (activeRoomId === id) {
      // Switch to neighbour: prefer tab at same index, fall back to previous
      const removedIndex = synced.findIndex((r) => r.id === id);
      newActiveId = remaining[Math.min(removedIndex, remaining.length - 1)].id;
    }

    set({ rooms: remaining, activeRoomId: newActiveId });

    if (activeRoomId === id) {
      const newActive = remaining.find((r) => r.id === newActiveId)!;
      return { room: newActive.room, placedPieces: newActive.placedPieces };
    }
    return null; // active room didn't change, caller doesn't need to reload canvas
  },

  renameRoom: (id, name) =>
    set((s) => ({
      rooms: s.rooms.map((r) => (r.id === id ? { ...r, name } : r)),
    })),

  hydrateRooms: (rooms, activeRoomId) => set({ rooms, activeRoomId }),
}));
