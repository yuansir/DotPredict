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
  history: Move[];
  totalPredictions: number;
  correctPredictions: number;
  predictionStats: {
    timestamp: number;
    accuracy: number;
    totalPredictions: number;
  }[];
  grid?: (DotColor | null)[][];
  windowStart?: number;
  isViewingHistory?: boolean;
  
  // 矩阵分页相关字段
  currentPage?: number;     // 当前页码
  totalPages?: number;      // 总页数
  currentPageMatrix?: (DotColor | null)[][]; // 当前页的矩阵数据
  currentInputPage?: number; // 当前输入页（最后一页）
}

export interface Pattern {
  colors: DotColor[];
  probability: number;
}

export interface PredictionResult {
  color: DotColor;
  probability: number;
  pattern: string;
  matchCount: number;  // 添加匹配次数字段
}

export interface Prediction {
  position: Position;
  color: DotColor;
  probability: number;
}

/**
 * 会话信息接口
 */
export interface Session {
  id: number;
  moveCount: number;
  startTime: Date;
  label: string;
}
