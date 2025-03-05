import { useState, useEffect, useCallback, useMemo } from 'react';
import { DotColor, Position, Move, GameState } from '../types';

/**
 * useMatrixManagement - 管理矩阵状态和操作
 */
export function useMatrixManagement(gameState: GameState, setGameState: (state: GameState) => void) {
  // 矩阵常量
  const PATTERN_ROWS = 3;
  const PATTERN_COLS = 24;
  
  // 矩阵状态
  const [lastPosition, setLastPosition] = useState<Position | null>(null);
  const [nextPosition, setNextPosition] = useState<Position>({ row: 0, col: 0 });
  const [matrixData, setMatrixData] = useState<(DotColor | null)[][]>(
    Array(PATTERN_ROWS).fill(null).map(() => Array(PATTERN_COLS).fill(null))
  );

  /**
   * 获取下一个可用位置
   */
  const calculateNextPosition = useCallback((history: Move[]): Position => {
    if (history.length === 0) {
      return { row: 0, col: 0 };
    }

    const lastMove = history[history.length - 1];
    const { row, col } = lastMove.position;
    
    // 如果当前列已到最后，移到下一行
    if (col === PATTERN_COLS - 1) {
      return { row: (row + 1) % PATTERN_ROWS, col: 0 };
    }
    
    // 否则继续在当前行的下一列
    return { row, col: col + 1 };
  }, [PATTERN_COLS, PATTERN_ROWS]);

  /**
   * 从历史记录构建矩阵数据
   */
  const buildMatrixFromHistory = useCallback((history: Move[]) => {
    // 初始化空矩阵
    const matrix: (DotColor | null)[][] = Array(PATTERN_ROWS)
      .fill(null)
      .map(() => Array(PATTERN_COLS).fill(null));
    
    // 填充历史数据
    history.forEach(move => {
      const { row, col } = move.position;
      if (row < PATTERN_ROWS && col < PATTERN_COLS) {
        matrix[row][col] = move.color;
      }
    });
    
    return matrix;
  }, [PATTERN_ROWS, PATTERN_COLS]);

  /**
   * 添加新的颜色到矩阵
   */
  const addColorToMatrix = useCallback((color: DotColor) => {
    // 停止操作如果正在浏览历史
    if (gameState.isViewingHistory) return;
    
    const pos = nextPosition;
    const timestamp = Date.now();
    
    // 更新状态
    setLastPosition(pos);
    
    // 更新矩阵数据
    const newMatrix = [...matrixData];
    newMatrix[pos.row][pos.col] = color;
    setMatrixData(newMatrix);
    
    // 创建新的移动记录
    const newMove: Move = {
      position: pos,
      color,
      timestamp,
    };
    
    // 更新游戏状态
    const newHistory = [...gameState.history, newMove];
    setGameState({
      ...gameState,
      history: newHistory,
    });
    
    // 计算下一个位置
    setNextPosition(calculateNextPosition(newHistory));
  }, [nextPosition, matrixData, gameState, setGameState, calculateNextPosition]);

  /**
   * 撤销最后一步操作
   */
  const undoLastMove = useCallback(() => {
    // 停止操作如果正在浏览历史或没有历史记录
    if (gameState.isViewingHistory || gameState.history.length === 0) return;
    
    // 移除最后一步
    const newHistory = [...gameState.history];
    const removedMove = newHistory.pop();
    
    // 更新游戏状态
    setGameState({
      ...gameState,
      history: newHistory,
    });
    
    // 更新矩阵数据
    if (removedMove) {
      const { row, col } = removedMove.position;
      const newMatrix = [...matrixData];
      newMatrix[row][col] = null;
      setMatrixData(newMatrix);
      
      // 更新最后位置和下一个位置
      setLastPosition(newHistory.length > 0 ? newHistory[newHistory.length - 1].position : null);
      setNextPosition(removedMove.position);
    }
  }, [gameState, setGameState, matrixData]);

  /**
   * 清空所有数据
   */
  const clearAllData = useCallback(() => {
    // 停止操作如果正在浏览历史
    if (gameState.isViewingHistory) return;
    
    // 重置游戏状态
    setGameState({
      ...gameState,
      history: [],
    });
    
    // 重置矩阵和位置
    setMatrixData(Array(PATTERN_ROWS).fill(null).map(() => Array(PATTERN_COLS).fill(null)));
    setLastPosition(null);
    setNextPosition({ row: 0, col: 0 });
  }, [gameState, setGameState, PATTERN_ROWS, PATTERN_COLS]);

  /**
   * 在历史记录更新时重建矩阵
   */
  useEffect(() => {
    const newMatrix = buildMatrixFromHistory(gameState.history);
    setMatrixData(newMatrix);
    
    // 更新位置信息
    if (gameState.history.length > 0) {
      setLastPosition(gameState.history[gameState.history.length - 1].position);
    } else {
      setLastPosition(null);
    }
    setNextPosition(calculateNextPosition(gameState.history));
  }, [gameState.history, buildMatrixFromHistory, calculateNextPosition]);

  /**
   * 获取矩阵中指定位置的颜色
   */
  const getColorAt = useCallback((position: Position): DotColor | null => {
    const { row, col } = position;
    if (row < 0 || row >= PATTERN_ROWS || col < 0 || col >= PATTERN_COLS) {
      return null;
    }
    return matrixData[row][col];
  }, [matrixData, PATTERN_ROWS, PATTERN_COLS]);

  /**
   * 获取最后N个颜色
   */
  const getLastNColors = useCallback((history: Move[], n: number): DotColor[] => {
    return history.slice(-n).map(move => move.color);
  }, []);

  /**
   * 检查某行的最后两个颜色
   */
  const checkLastTwoColors = useCallback((row: (DotColor | null)[], rowIndex: number): { sameColor: boolean, color: DotColor | null } => {
    const nonNullColors = row.filter(color => color !== null) as DotColor[];
    if (nonNullColors.length < 2) {
      return { sameColor: false, color: null };
    }
    
    const lastTwo = nonNullColors.slice(-2);
    return {
      sameColor: lastTwo[0] === lastTwo[1],
      color: lastTwo[0]
    };
  }, []);

  return {
    // 状态
    matrixData,
    lastPosition,
    nextPosition,
    
    // 操作
    addColorToMatrix,
    undoLastMove,
    clearAllData,
    getColorAt,
    getLastNColors,
    checkLastTwoColors
  };
}
