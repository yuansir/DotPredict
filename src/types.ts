export type DotColor = 'red' | 'black';

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  position: Position;
  color: DotColor;
  timestamp: number;
  prediction?: {
    color: DotColor;
    isCorrect: boolean;
    probability: number;
  };
}

export interface GameState {
  grid: (DotColor | null)[][];
  history: Move[];
  windowStart: number;
  totalPredictions: number;
  correctPredictions: number;
  isViewingHistory: boolean;
  predictionStats: {
    timestamp: number;
    accuracy: number;
    totalPredictions: number;
  }[];
}

export interface Prediction {
  position: Position;
  color: DotColor;
  probability: number;
}
