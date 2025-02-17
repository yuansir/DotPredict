import { describe, it, expect } from 'vitest';
import { predictNextColor, getLastTwoDots, getNextEmptyCell } from '../utils/gameLogic';
import { DotColor, Position } from '../types';

describe('Game Logic Tests', () => {
  describe('predictNextColor', () => {
    it('should return null when less than 2 dots are provided', () => {
      const result = predictNextColor([]);
      expect(result).toBeNull();
    });

    it('should predict color based on 75% pattern', () => {
      const lastTwo = [
        { color: 'black' as DotColor, position: { row: 0, col: 0 } },
        { color: 'black' as DotColor, position: { row: 0, col: 1 } }
      ];
      const result = predictNextColor(lastTwo);
      expect(result).not.toBeNull();
      expect(result?.probability).toBe(0.75);
    });
  });

  describe('getNextEmptyCell', () => {
    it('should find next empty cell in empty grid', () => {
      const grid = Array(8).fill(null).map(() => Array(8).fill(null));
      const currentPos: Position = { row: 0, col: 0 };
      const result = getNextEmptyCell(grid, currentPos);
      expect(result).toEqual({ row: 0, col: 0 });
    });

    it('should return null for full grid', () => {
      const grid = Array(8).fill(null).map(() => Array(8).fill('red'));
      const currentPos: Position = { row: 0, col: 0 };
      const result = getNextEmptyCell(grid, currentPos);
      expect(result).toBeNull();
    });
  });
});
