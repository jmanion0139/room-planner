import { useEffect, useRef } from 'react';
import { useLayoutStore } from '../store/layoutStore';
import type { LayoutState } from '../types';

const STORAGE_KEY = 'slv-layout';
const DEBOUNCE_MS = 800;

export function usePersistence() {
  const { room, placedPieces, pieceDefinitions, loadLayout } = useLayoutStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LayoutState;
        if (parsed.room && parsed.placedPieces && parsed.pieceDefinitions) {
          loadLayout(parsed);
        }
      }
    } catch {
      // Ignore malformed storage
    }
  }, [loadLayout]);

  // Debounced save on every state change
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ room, placedPieces, pieceDefinitions })
        );
      } catch {
        // Ignore quota errors
      }
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [room, placedPieces, pieceDefinitions]);
}
