import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { LayoutState, PlacedPiece, PieceDefinition, Room, Obstacle, Rotation } from '../types';
import { DEFAULT_PIECES } from '../data/defaultPieces';
import { inchesToPx } from '../utils/scale';

const DEFAULT_ROOM: Room = {
  width: 144, // 12 ft
  height: 168, // 14 ft
  obstacles: [],
};

const DEFAULT_SCALE = 4; // px per inch

interface StoreState extends LayoutState {
  selectedPieceIds: string[];
  scale: number;
  viewportZoom: number;
  stageOffset: { x: number; y: number };

  // Room actions
  setRoom: (room: Partial<Room>) => void;
  addObstacle: (obstacle: Omit<Obstacle, 'id'>) => void;
  removeObstacle: (id: string) => void;

  // Piece definition actions
  addDefinition: (def: Omit<PieceDefinition, 'id' | 'isCustom'>) => void;
  removeDefinition: (id: string) => void;

  // Placed piece actions
  addPiece: (definitionId: string) => void;
  updatePiece: (id: string, changes: Partial<PlacedPiece>) => void;
  removePiece: (id: string) => void;
  rotatePiece: (id: string) => void;
  selectPiece: (id: string, addToSelection?: boolean) => void;
  clearSelection: () => void;
  rotateSelectedPieces: () => void;
  removeSelectedPieces: () => void;

  // Layout persistence
  loadLayout: (state: LayoutState) => void;
  resetLayout: () => void;

  // Viewport
  setScale: (scale: number) => void;
  setViewportZoom: (zoom: number) => void;
  setStageOffset: (offset: { x: number; y: number }) => void;
}

export const useLayoutStore = create<StoreState>((set, get) => ({
  room: DEFAULT_ROOM,
  pieceDefinitions: DEFAULT_PIECES,
  placedPieces: [],
  selectedPieceIds: [],
  scale: DEFAULT_SCALE,
  viewportZoom: 1,
  stageOffset: { x: 40, y: 40 },

  setRoom: (changes) =>
    set((s) => ({ room: { ...s.room, ...changes } })),

  addObstacle: (obstacle) =>
    set((s) => ({
      room: {
        ...s.room,
        obstacles: [...s.room.obstacles, { ...obstacle, id: uuidv4() }],
      },
    })),

  removeObstacle: (id) =>
    set((s) => ({
      room: {
        ...s.room,
        obstacles: s.room.obstacles.filter((o) => o.id !== id),
      },
    })),

  addDefinition: (def) =>
    set((s) => ({
      pieceDefinitions: [
        ...s.pieceDefinitions,
        { ...def, id: uuidv4(), isCustom: true },
      ],
    })),

  removeDefinition: (id) =>
    set((s) => ({
      pieceDefinitions: s.pieceDefinitions.filter((d) => d.id !== id),
      placedPieces: s.placedPieces.filter((p) => p.definitionId !== id),
    })),

  addPiece: (definitionId) => {
    const def = get().pieceDefinitions.find((d) => d.id === definitionId);
    if (!def) return;
    const { scale, room } = get();
    // Place near center of current viewport
    const roomPxW = inchesToPx(room.width, scale);
    const roomPxH = inchesToPx(room.height, scale);
    const cx = roomPxW / 2 - inchesToPx(def.width, scale) / 2;
    const cy = roomPxH / 2 - inchesToPx(def.depth, scale) / 2;
    const newPiece: PlacedPiece = {
      id: uuidv4(),
      definitionId,
      label: def.label,
      x: cx,
      y: cy,
      width: def.width,
      depth: def.depth,
      rotation: 0,
    };
    set((s) => ({ placedPieces: [...s.placedPieces, newPiece] }));
  },

  updatePiece: (id, changes) =>
    set((s) => ({
      placedPieces: s.placedPieces.map((p) =>
        p.id === id ? { ...p, ...changes } : p
      ),
    })),

  removePiece: (id) =>
    set((s) => ({
      placedPieces: s.placedPieces.filter((p) => p.id !== id),
      selectedPieceIds: s.selectedPieceIds.filter((sid) => sid !== id),
    })),

  rotatePiece: (id) =>
    set((s) => ({
      placedPieces: s.placedPieces.map((p) => {
        if (p.id !== id) return p;
        const nextRotation = ((p.rotation + 90) % 360) as Rotation;
        // Swap width/depth so piece rotates around its top-left while keeping center
        const { scale } = s;
        const oldCx = p.x + inchesToPx(p.width, scale) / 2;
        const oldCy = p.y + inchesToPx(p.depth, scale) / 2;
        const newW = p.depth;
        const newD = p.width;
        const newX = oldCx - inchesToPx(newW, scale) / 2;
        const newY = oldCy - inchesToPx(newD, scale) / 2;
        return { ...p, rotation: nextRotation, width: newW, depth: newD, x: newX, y: newY };
      }),
    })),

  selectPiece: (id, addToSelection = false) =>
    set((s) => ({
      selectedPieceIds: addToSelection
        ? s.selectedPieceIds.includes(id)
          ? s.selectedPieceIds.filter((sid) => sid !== id)
          : [...s.selectedPieceIds, id]
        : [id],
    })),

  clearSelection: () => set({ selectedPieceIds: [] }),

  rotateSelectedPieces: () =>
    set((s) => {
      const { selectedPieceIds, placedPieces, scale } = s;
      const selected = placedPieces.filter((p) => selectedPieceIds.includes(p.id));
      if (selected.length === 0) return {};
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of selected) {
        const r = p.x + inchesToPx(p.width, scale);
        const b = p.y + inchesToPx(p.depth, scale);
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (r > maxX) maxX = r;
        if (b > maxY) maxY = b;
      }
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      return {
        placedPieces: placedPieces.map((p) => {
          if (!selectedPieceIds.includes(p.id)) return p;
          const oldCx = p.x + inchesToPx(p.width, scale) / 2;
          const oldCy = p.y + inchesToPx(p.depth, scale) / 2;
          // Rotate center 90° clockwise around group center
          const newCx = cx + (oldCy - cy);
          const newCy = cy - (oldCx - cx);
          const newW = p.depth;
          const newD = p.width;
          return {
            ...p,
            rotation: ((p.rotation + 90) % 360) as Rotation,
            width: newW,
            depth: newD,
            x: newCx - inchesToPx(newW, scale) / 2,
            y: newCy - inchesToPx(newD, scale) / 2,
          };
        }),
      };
    }),

  removeSelectedPieces: () =>
    set((s) => ({
      placedPieces: s.placedPieces.filter((p) => !s.selectedPieceIds.includes(p.id)),
      selectedPieceIds: [],
    })),

  loadLayout: (state) =>
    set({
      room: state.room,
      pieceDefinitions: state.pieceDefinitions,
      placedPieces: state.placedPieces,
    }),

  resetLayout: () =>
    set({
      room: DEFAULT_ROOM,
      pieceDefinitions: DEFAULT_PIECES,
      placedPieces: [],
      selectedPieceIds: [],
    }),

  setScale: (scale) => set({ scale }),
  setViewportZoom: (viewportZoom) => set({ viewportZoom }),
  setStageOffset: (stageOffset) => set({ stageOffset }),
}));
