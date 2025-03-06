import { useMemo } from 'react';
import { DotColor, GameState, Position } from '../types';

interface RulePredictionResult {
  predictions: (DotColor | null)[];
  predictionRowIndex: number | null;
}

/**
 * 规则预测钩子函数 - 只预测第一行的结果并显示在规则预测列第一个位置
 */
export const useRulePrediction = (
  gameState: GameState,
  nextPosition: Position | null
): RulePredictionResult => {
  return useMemo(() => {
    // 初始化预测数组 - 只有第一个位置可能有预测值
    const predictions: (DotColor | null)[] = [null, null, null];
    let predictionRowIndex: number | null = 0; // 始终是第一行
    
    try {
      // 如果没有历史记录或在查看历史模式，则不进行预测
      if (!gameState?.history || 
          gameState.isViewingHistory || 
          gameState.history.length === 0) {
        return { predictions, predictionRowIndex: null };
      }
      
      console.log('[DEBUG] useRulePrediction - 开始计算第一行规则预测');
      
      // 创建矩阵并填充数据
      const totalRows = 3;
      const totalCols = Math.max(1, Math.ceil((gameState.history?.length || 0) / totalRows) + 1);
      const fullMatrix: (DotColor | null)[][] = Array(totalRows)
        .fill(null)
        .map(() => Array(totalCols).fill(null));
      
      // 填充历史数据到矩阵
      gameState.history.forEach((move) => {
        if (move?.position && move?.color) {
          const row = move.position.row;
          const col = move.position.col;
          if (row >= 0 && row < totalRows && col >= 0 && col < totalCols) {
            fullMatrix[row][col] = move.color;
          }
        }
      });
      
      // 只分析第一行数据
      const firstRow = fullMatrix[0];
      
      // 找到第一行所有非空球
      const nonEmptyPositions = [];
      for (let col = 0; col < firstRow.length; col++) {
        if (firstRow[col] !== null) {
          nonEmptyPositions.push({ col, color: firstRow[col] });
        }
      }
      
      // 如果第一行有至少两个非空球，检查最后两个是否颜色相同
      if (nonEmptyPositions.length >= 2) {
        const lastTwoPositions = nonEmptyPositions.slice(-2);
        const lastColor = lastTwoPositions[1].color as DotColor;
        const secondLastColor = lastTwoPositions[0].color as DotColor;
        
        console.log('[DEBUG] useRulePrediction - 第一行最后两个球:', { 
          secondLastColor, 
          lastColor 
        });
        
        // 如果最后两个球颜色相同，则预测下一个也是相同颜色
        if (lastColor === secondLastColor) {
          predictions[0] = lastColor; // 只设置第一个预测位
          console.log('[DEBUG] useRulePrediction - 设置第一个预测位颜色:', lastColor);
        }
      }
      
    } catch (error) {
      console.error('[ERROR] useRulePrediction - 预测计算错误:', error);
    }
    
    console.log('[DEBUG] useRulePrediction - 最终预测结果:', predictions);
    
    return { predictions, predictionRowIndex };
  }, [gameState]);
};
