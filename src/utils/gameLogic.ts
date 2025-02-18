import { DotColor, Pattern, PredictionResult, Position } from '../types';

const PATTERNS_75: Pattern[] = [
  { colors: ['black', 'black', 'red'], probability: 0.75 },
  { colors: ['red', 'red', 'black'], probability: 0.75 },
  { colors: ['black', 'red', 'red'], probability: 0.75 },
  { colors: ['red', 'black', 'black'], probability: 0.75 }
];

const PATTERNS_25: Pattern[] = [
  { colors: ['red', 'red', 'red'], probability: 0.25 },
  { colors: ['black', 'black', 'black'], probability: 0.25 },
  { colors: ['red', 'black', 'red'], probability: 0.25 },
  { colors: ['black', 'red', 'black'], probability: 0.25 }
];

export const getLastTwoDots = (
  grid: (DotColor | null)[][],
  history: { position: Position; color: DotColor }[]
): { color: DotColor; position: Position }[] => {
  return history.slice(-2);
};

export const predictNextColor = (
  lastTwo: { color: DotColor; position: Position }[]
): PredictionResult | null => {
  if (lastTwo.length < 2) return null;

  const [dot1, dot2] = lastTwo;
  const pattern75Match = PATTERNS_75.find(pattern =>
    pattern.colors[0] === dot1.color &&
    pattern.colors[1] === dot2.color
  );

  const pattern25Match = PATTERNS_25.find(pattern =>
    pattern.colors[0] === dot1.color &&
    pattern.colors[1] === dot2.color
  );

  if (pattern75Match) {
    const predictedColor = Math.random() < 0.75 ? pattern75Match.colors[2] : (pattern75Match.colors[2] === 'red' ? 'black' : 'red');
    return {
      color: predictedColor,
      probability: 0.75,
      pattern: pattern75Match.colors.join('-')
    };
  }

  if (pattern25Match) {
    const predictedColor = Math.random() < 0.25 ? pattern25Match.colors[2] : (pattern25Match.colors[2] === 'red' ? 'black' : 'red');
    return {
      color: predictedColor,
      probability: 0.25,
      pattern: pattern25Match.colors.join('-')
    };
  }

  return null;
};

export const getNextEmptyCell = (
  grid: (DotColor | null)[][],
  currentPosition: Position
): Position | null => {
  const GRID_SIZE = grid.length;
  let { row, col } = currentPosition;

  // 从当前位置开始查找下一个空单元格
  while (row < GRID_SIZE) {
    while (col < GRID_SIZE) {
      if (grid[row][col] === null) {
        return { row, col };
      }
      col++;
    }
    row++;
    col = 0;
  }

  // 如果没有找到，从头开始查找
  row = 0;
  col = 0;
  while (row < GRID_SIZE) {
    while (col < GRID_SIZE) {
      if (grid[row][col] === null) {
        return { row, col };
      }
      col++;
    }
    row++;
    col = 0;
  }

  return null;
};
