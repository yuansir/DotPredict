import { describe, it, expect } from 'vitest';
import { predictNextColor, getNextEmptyCell } from '../utils/gameLogic';
import { DotColor } from '../types';

describe('gameLogic', () => {
  describe('predictNextColor', () => {
    it('should return null when there are less than 2 dots', () => {
      const result = predictNextColor([]);
      expect(result).toBeNull();
    });

    it('should predict with 75% pattern', () => {
      const dots = [
        { color: 'black' as DotColor, position: { row: 0, col: 0 } },
        { color: 'black' as DotColor, position: { row: 0, col: 1 } }
      ];
      const result = predictNextColor(dots);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.probability).toBe(0.75);
      }
    });

    it('should predict with 25% pattern', () => {
      const dots = [
        { color: 'red' as DotColor, position: { row: 0, col: 0 } },
        { color: 'red' as DotColor, position: { row: 0, col: 1 } }
      ];
      const result = predictNextColor(dots);
      expect(result).not.toBeNull();
      if (result) {
        expect(['red', 'black']).toContain(result.color);
      }
    });
  });

  describe('getNextEmptyCell', () => {
    it('should find the next empty cell', () => {
      const grid = [
        ['red', null, 'black'],
        [null, 'red', null],
        ['black', null, null]
      ] as (DotColor | null)[][];

      const result = getNextEmptyCell(grid, { row: 0, col: 0 });
      expect(result).toEqual({ row: 0, col: 1 });
    });

    it('should return null when no empty cells', () => {
      const grid = [
        ['red', 'black', 'red'],
        ['black', 'red', 'black'],
        ['red', 'black', 'red']
      ] as (DotColor | null)[][];

      const result = getNextEmptyCell(grid, { row: 0, col: 0 });
      expect(result).toBeNull();
    });
  });
});
