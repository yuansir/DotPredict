export type DotColor = 'red' | 'black';

export interface Position {
  row: number;
  col: number;
}

export interface Pattern {
  sequence: DotColor[];
  probability: number;
}

export interface GameState {
  grid: (DotColor | null)[][];
  history: Array<{
    position: Position;
    color: DotColor;
  }>;
  totalPredictions: number;
  correctPredictions: number;
}

export interface PredictionResult {
  color: DotColor;
  position: Position;
  probability: number;
  pattern: Pattern;
}
