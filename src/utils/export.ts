import Konva from 'konva';
import { saveAs } from 'file-saver';
import type { LayoutState } from '../types';

export function exportPNG(stage: Konva.Stage, filename = 'sectional-layout.png'): void {
  const dataUrl = stage.toDataURL({ pixelRatio: 2, mimeType: 'image/png' });
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export function exportJSON(state: LayoutState, filename = 'sectional-layout.json'): void {
  const json = JSON.stringify(
    { room: state.room, pieceDefinitions: state.pieceDefinitions, placedPieces: state.placedPieces },
    null,
    2
  );
  const blob = new Blob([json], { type: 'application/json' });
  saveAs(blob, filename);
}

export function importJSON(file: File): Promise<LayoutState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string) as LayoutState;
        if (!parsed.room || !parsed.placedPieces || !parsed.pieceDefinitions) {
          reject(new Error('Invalid layout file'));
          return;
        }
        resolve(parsed);
      } catch {
        reject(new Error('Failed to parse layout file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
