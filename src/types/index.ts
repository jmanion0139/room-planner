export type Rotation = 0 | 90 | 180 | 270;

export interface Room {
  width: number;  // inches
  height: number; // inches
  obstacles: Obstacle[];
}

export interface Obstacle {
  id: string;
  label: string;
  x: number; // inches from room origin
  y: number; // inches from room origin
  width: number;  // inches
  height: number; // inches
}

export interface PieceDefinition {
  id: string;
  label: string;
  width: number;  // inches
  depth: number;  // inches
  isCustom: boolean;
}

export interface PlacedPiece {
  id: string;
  definitionId: string;
  label: string;
  x: number;    // canvas px from room origin
  y: number;    // canvas px from room origin
  width: number;  // inches (may be swapped from definition when rotated 90/270)
  depth: number;  // inches
  rotation: Rotation;
}

export interface LayoutState {
  room: Room;
  pieceDefinitions: PieceDefinition[];
  placedPieces: PlacedPiece[];
}
