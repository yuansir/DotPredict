import { useMemo } from 'react';
import { DotColor, GameState, Position } from '../types';

interface ContinuityPredictionResult {
  predictions: (DotColor | null)[];
  predictionRowIndex: number | null;
}

/**
 * 连续性预测钩子函数，用于预测下一个球的颜色
 * 规则：当一行中最后两个已填充的球颜色相同时，预测下一个球也是相同颜色
 */
export const useContinuityPrediction = (
  gameState: GameState,
  nextPosition: Position | null,
  userModeOverride: boolean = false
): ContinuityPredictionResult => {
  // 返回连续性预测结果
  return useMemo(() => {
    // console.log('[DEBUG] useContinuityPrediction - 开始计算', {
    //   gameState: {
    //     isViewingHistory: gameState?.isViewingHistory,
    //     historyLength: gameState?.history?.length
    //   },
    //   nextPosition
    // });

    // 初始化预测结果，三个位置都为空 - 每次都完全重置
    const predictions: (DotColor | null)[] = [null, null, null];
    let predictionRowIndex: number | null = null;

    // 如果没有下一个位置、在查看历史模式(除非用户手动覆盖)、或没有历史记录，则不进行预测
    // console.log('[DEBUG] useContinuityPrediction - 检查预测条件:', {
    //   hasNextPosition: !!nextPosition,
    //   hasGameState: !!gameState,
    //   isViewingHistory: gameState?.isViewingHistory,
    //   userModeOverride,
    //   historyLength: gameState?.history?.length || 0,
    //   skipPrediction: !nextPosition || !gameState || (gameState.isViewingHistory && !userModeOverride) || !gameState.history || gameState.history.length === 0
    // });

    if (!nextPosition ||
      !gameState ||
      (gameState.isViewingHistory && !userModeOverride) ||
      !gameState.history ||
      gameState.history.length === 0) {
      // console.log('[DEBUG] useContinuityPrediction - 不满足预测条件，返回空结果');
      return { predictions, predictionRowIndex: null };
    }

    try {
      // 基于matrix格式实际获取行索引
      const rowIndex = nextPosition.row !== undefined ? nextPosition.row : 0;
      predictionRowIndex = rowIndex;

      // console.log('[DEBUG] useContinuityPrediction - 当前待输入位置行索引:', rowIndex);

      // 安全地计算矩阵尺寸
      const totalRows = 3; // 固定行数
      const totalCols = Math.max(1, Math.ceil((gameState.history?.length || 0) / totalRows) + 1);

      // console.log('[DEBUG] useContinuityPrediction - 矩阵尺寸:', { totalRows, totalCols });

      // 创建并初始化矩阵
      const fullMatrix: (DotColor | null)[][] = Array(totalRows)
        .fill(null)
        .map(() => Array(totalCols).fill(null));

      // 填充矩阵
      if (gameState.history && gameState.history.length > 0) {
        gameState.history.forEach((move) => {
          if (move && move.position && move.color) {
            const row = move.position.row;
            const col = move.position.col;
            if (row >= 0 && row < totalRows && col >= 0 && col < totalCols) {
              fullMatrix[row][col] = move.color;
            }
          }
        });
      }

      // console.log('[DEBUG] useContinuityPrediction - 重新布局后的矩阵:', fullMatrix);

      // 遍历每一行，检查最后两个非空球是否颜色相同
      for (let row = 0; row < totalRows; row++) {
        const currentRow = fullMatrix[row];

        // 找到该行所有非空的球
        const nonEmptyPositions = [];
        for (let col = 0; col < currentRow.length; col++) {
          if (currentRow[col] !== null) {
            nonEmptyPositions.push({ col, color: currentRow[col] });
          }
        }

        // 计算最后两个非空球
        if (nonEmptyPositions.length >= 2) {
          const lastTwoPositions = nonEmptyPositions.slice(-2);
          const lastColor = lastTwoPositions[1].color;
          const secondLastColor = lastTwoPositions[0].color;

          // console.log(`[DEBUG] useContinuityPrediction - 行${row}最后两个球:`, {
          //   secondLastColor,
          //   lastColor,
          //   lastTwoPositions
          // });

          // 如果最后两个球颜色相同，则预测下一个球也是相同颜色
          if (lastColor === secondLastColor) {
            predictions[row] = lastColor;
            // console.log(`[DEBUG] useContinuityPrediction - 行${row}设置预测结果:`, lastColor);
          } else {
            // console.log(`[DEBUG] useContinuityPrediction - 行${row}最后两球颜色不同，无预测`);
          }
        } else {
          // console.log(`[DEBUG] useContinuityPrediction - 行${row}非空球少于2个，无法预测`);
        }
      }

      // 清除非当前行的预测结果
      if (predictionRowIndex !== null) {
        // 只保留当前行的预测结果，清空其他行
        for (let i = 0; i < predictions.length; i++) {
          if (i !== predictionRowIndex) {
            predictions[i] = null;
          }
        }

        // // console.log('[DEBUG] useContinuityPrediction - 清除非当前行预测结果，最终结果:',
        //   predictions.map((p, idx) => `行${idx}: ${p || '无'}`));
      }

    } catch (error) {
      // console.error('[DEBUG] useContinuityPrediction - 计算错误:', error);
      // 发生错误时返回空预测，不影响UI渲染
    }

    // 返回预测结果和预测行索引
    const result = {
      predictions,
      predictionRowIndex
    };

    // console.log('[DEBUG] useContinuityPrediction - 最终预测结果:', {
    //   predictions,
    //   predictionRowIndex,
    //   gameStateLength: gameState?.history?.length
    // });

    return result;
  }, [gameState, nextPosition]);
};
