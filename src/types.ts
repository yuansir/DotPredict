export type DotColor = 'red' | 'black';

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  position: Position;
  color: DotColor;
  timestamp?: number;
}

export interface GameState {
  grid: (DotColor | null)[][];
  history: Move[];
  windowStart: number;
  totalPredictions: number;
  correctPredictions: number;
  isViewingHistory: boolean;
}

export interface Prediction {
  position: Position;
  color: DotColor;
}
