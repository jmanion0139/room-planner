import type { PieceDefinition } from '../types';

export const DEFAULT_PIECES: PieceDefinition[] = [
  {
    id: 'seat-base',
    label: 'Seat Base',
    width: 35,
    depth: 29,
    isCustom: false,
  },
  {
    id: 'standard-side',
    label: 'Standard Side',
    width: 35,
    depth: 6,
    isCustom: false,
  },
  {
    id: 'deep-side',
    label: 'Deep Side',
    width: 29,
    depth: 6,
    isCustom: false,
  },
];
