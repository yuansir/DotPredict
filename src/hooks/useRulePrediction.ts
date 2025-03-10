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
  nextPosition: Position | null,
  userModeOverride: boolean = false
): RulePredictionResult => {
  return useMemo(() => {
    // 初始化预测数组 - 只有第一个位置可能有预测值
    const predictions: (DotColor | null)[] = [null, null, null];
    let predictionRowIndex: number | null = 0; // 始终是第一行

    try {
      // 如果没有历史记录或在查看历史模式(除非用户手动覆盖)，则不进行预测
      // console.log('[DEBUG] useRulePrediction - 检查预测条件:', {
      //   hasHistory: !!gameState?.history,
      //   historyLength: gameState?.history?.length || 0,
      //   isViewingHistory: gameState?.isViewingHistory,
      //   userModeOverride,
      //   skipPrediction: !gameState?.history || (gameState.isViewingHistory && !userModeOverride) || gameState.history.length === 0
      // });

      if (!gameState?.history ||
        (gameState.isViewingHistory && !userModeOverride) ||
        gameState.history.length === 0) {
        return { predictions, predictionRowIndex: null };
      }

      // console.log('[DEBUG] useRulePrediction - 开始计算第一行规则预测');

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

        // console.log('[DEBUG] useRulePrediction - 第一行最后两个球:', {
        //   secondLastColor,
        //   lastColor
        // });

        // 如果最后两个球颜色相同，则预测下一个也是相同颜色
        if (lastColor === secondLastColor) {
          predictions[0] = lastColor; // 只设置第一个预测位
          // console.log('[DEBUG] useRulePrediction - 设置第一个预测位颜色:', lastColor);
        }
      }

      // 获取当前输入的球的位置和颜色
      let currentInputPosition: Position | null = null;
      let currentInputColor: DotColor | null = null;
      
      if (gameState.history.length > 0) {
        const lastMove = gameState.history[gameState.history.length - 1];
        if (lastMove && lastMove.position && lastMove.color) {
          currentInputPosition = lastMove.position;
          currentInputColor = lastMove.color;
          // console.log('[DEBUG] 当前输入:', {
          //   position: currentInputPosition,
          //   color: currentInputColor
          // });
        }
      }

      // 添加第二个预测位功能 - 基于新的预测逻辑
      const secondPredictionColor = findColumnMatchingPattern(
        fullMatrix, 
        currentInputPosition, 
        currentInputColor
      );
      
      if (secondPredictionColor) {
        predictions[1] = secondPredictionColor;
        // console.log('[DEBUG] useRulePrediction - 设置第二个预测位颜色:', secondPredictionColor);
      }

      // 添加第三个预测位功能 - 基于75%规则模式
      // 不管录入还是预览模式，只要满足某列前两个球已填充且第三个空缺，就应用75%规则预测

      // 方法一：判断当前待输入位置 - 如果是第三行，使用该列的前两个球预测
      if (nextPosition && nextPosition.row === 2) {
        // 获取当前待输入位置所在列的第一和第二个球的颜色
        const col = nextPosition.col;

        // 获取当前列的第一个和第二个球的颜色
        const firstBall = fullMatrix[0][col];
        const secondBall = fullMatrix[1][col];

        // console.log('[DEBUG] useRulePrediction - 当前待输入列的前两个球:', {
        //   column: col,
        //   firstBall,
        //   secondBall
        // });

        // 如果前两个球都有值，则根据75%规则预测第三个球
        if (firstBall !== null && secondBall !== null) {
          const thirdPredictionColor = predictThirdPositionFromColumn(firstBall, secondBall);
          if (thirdPredictionColor) {
            predictions[2] = thirdPredictionColor;
            // console.log('[DEBUG] useRulePrediction - 基于当前列设置第三个预测位颜色:', thirdPredictionColor);
          }
        }
      }

      // 方法二：如枟方法一未设置第三个预测值，则检查所有列，找出第三个位置为空且前两个都有值的列
      if (!predictions[2]) {
        // 遍历所有列，找到第三个球缺失但前两个球存在的列
        for (let col = 0; col < fullMatrix[0].length; col++) {
          const firstBall = fullMatrix[0][col];
          const secondBall = fullMatrix[1][col];
          const thirdBall = fullMatrix[2]?.[col];

          // 前两个球都有值且第三个球为空
          if (firstBall !== null && secondBall !== null && thirdBall === null) {
            const thirdPredictionColor = predictThirdPositionFromColumn(firstBall, secondBall);
            if (thirdPredictionColor) {
              predictions[2] = thirdPredictionColor;
              // console.log('[DEBUG] useRulePrediction - 基于满足条件列设置第三个预测位颜色:', {
              //   column: col,
              //   firstBall,
              //   secondBall,
              //   prediction: thirdPredictionColor
              // });
              break; // 找到第一个符合条件的列就跳出
            }
          }
        }
      }

    } catch (error) {
      console.error('[ERROR] useRulePrediction - 预测计算错误:', error);
    }

    // console.log('[DEBUG] useRulePrediction - 最终预测结果:', predictions);

    return { predictions, predictionRowIndex };
  }, [gameState]);
};

/**
 * 查找符合规则模式的列，并根据输入位置和颜色预测下一个球的颜色
 * @param fullMatrix 完整矩阵数据
 * @param currentInputPosition 当前输入位置
 * @param currentInputColor 当前输入的球的颜色
 * @returns 预测的下一个球的颜色，如果无法预测则返回null
 */
function findColumnMatchingPattern(
  fullMatrix: (DotColor | null)[][],
  currentInputPosition: Position | null,
  currentInputColor: DotColor | null
): DotColor | null {
  // 如果没有输入位置或颜色，无法预测
  if (!currentInputPosition || !currentInputColor) {
    console.log('[DEBUG] 无法预测: 没有输入位置或颜色');
    return null;
  }
  
  // 判断当前输入的是第几个球（基于行号）
  // 只有在输入第一个球（行号为0）或第二个球（行号为1）时才进行预测
  const inputRow = currentInputPosition.row;
  if (inputRow !== 0 && inputRow !== 1) {
    console.log('[DEBUG] 无法预测: 输入行号不符合条件', inputRow);
    return null;
  }
  
  console.log('[DEBUG] 当前输入位置和颜色:', {
    position: currentInputPosition,
    color: currentInputColor
  });
  
  // 获取列数
  const totalCols = fullMatrix[0]?.length || 0;
  console.log('[DEBUG] 矩阵总列数:', totalCols);
  
  // 存储找到的模式类型
  let foundPatternType: 'connected' | 'opposite' | null = null;
  // 存储找到模式的列索引
  let foundPatternColumn: number = -1;
  
  // 从右向左遍历所有列（从最新到最旧），优先使用最新列的模式
  // 移除对第一列的特殊处理，确保我们优先使用最新的列模式
  {
    // 从右向左遍历所有列（从最新到最旧）
    for (let col = totalCols - 1; col >= 0; col--) {
      // 提取当前列所有三行的值
      const column = [
        fullMatrix[0]?.[col],
        fullMatrix[1]?.[col],
        fullMatrix[2]?.[col]
      ];
      
      console.log(`[DEBUG] 检查列 ${col}:`, column);
      
      // 检查是否有完整的三个球
      const hasThreeBalls = column.every(ball => ball !== null && ball !== undefined);
      
      // 只有完整的列才能用于识别模式
      if (hasThreeBalls) {
        const patternType = getPatternType(column as DotColor[]);
        if (patternType) {
          console.log(`[DEBUG] 找到匹配的模式列:`, {
            column,
            patternType,
            col
          });
          foundPatternType = patternType;
          foundPatternColumn = col;
          break; // 找到第一个匹配的模式就退出
        }
      }
    }
  }
  
  // 如果找到了模式，根据模式类型和当前输入预测下一个球
  if (foundPatternType) {
    // 获取最新输入的颜色
    // 确保使用最新的输入颜色，而不是历史颜色
    let latestInputColor = currentInputColor;
    
    // 记录原始输入颜色，用于调试
    console.log(`[DEBUG] 原始输入颜色:`, {
      currentInputColor,
      inputPosition: currentInputPosition
    });
    
    // 如果当前输入位置的列号大于找到模式的列号，说明我们正在处理新的一列
    // 这种情况下，应该使用当前输入颜色作为预测基础
    if (currentInputPosition.col > foundPatternColumn) {
      console.log(`[DEBUG] 使用当前输入颜色进行预测:`, {
        latestInputColor,
        patternType: foundPatternType,
        currentColumn: currentInputPosition.col,
        patternColumn: foundPatternColumn
      });
    } else {
      console.log(`[DEBUG] 注意: 当前输入列号不大于模式列号`, {
        currentColumn: currentInputPosition.col,
        patternColumn: foundPatternColumn
      });
    }
    
    const prediction = getPredictionByPattern(foundPatternType, latestInputColor);
    console.log(`[DEBUG] 基于模式生成预测:`, {
      patternType: foundPatternType,
      latestInputColor,
      prediction,
      rule: foundPatternType === 'connected' ? '相连模式: 预测与输入相同' : '相反模式: 预测与输入相反'
    });
    return prediction;
  }
  
  console.log('[DEBUG] 没有找到匹配的模式');
  return null; // 没有找到匹配的模式
}

/**
 * 获取列的模式类型
 * @param column 完整的列数据（三个球）
 * @returns 模式类型：'connected'（相连）或'opposite'（相反）或null（不匹配）
 */
function getPatternType(column: DotColor[]): 'connected' | 'opposite' | null {
  if (column.length !== 3) return null;
  
  // 提取列中的三个颜色
  const [first, second, third] = column;
  
  // 检查是否匹配"相连"模式
  const isRedRedRed = first === 'red' && second === 'red' && third === 'red';
  const isBlackBlackBlack = first === 'black' && second === 'black' && third === 'black';
  
  // 检查是否匹配"相反"模式
  const isRedBlackRed = first === 'red' && second === 'black' && third === 'red';
  const isBlackRedBlack = first === 'black' && second === 'red' && third === 'black';
  
  if (isRedRedRed || isBlackBlackBlack) {
    return 'connected'; // 相连模式
  } else if (isRedBlackRed || isBlackRedBlack) {
    return 'opposite'; // 相反模式
  }
  
  return null; // 不匹配任何模式
}

/**
 * 根据模式类型和当前输入球的颜色预测下一个球的颜色
 * @param patternType 模式类型：'connected'（相连）或'opposite'（相反）
 * @param currentInputColor 当前输入球的颜色
 * @returns 预测的下一个球的颜色
 */
function getPredictionByPattern(
  patternType: 'connected' | 'opposite', 
  currentInputColor: DotColor
): DotColor {
  if (patternType === 'connected') {
    // 相连模式：预测结果与当前输入球颜色相同
    return currentInputColor;
  } else {
    // 相反模式：预测结果与当前输入球颜色相反
    return currentInputColor === 'red' ? 'black' : 'red';
  }
}

// 注意: 下面的函数已被注释掉，因为它当前未被使用
// 如果将来需要使用这个函数，可以取消注释
/**
 * 检查列是否匹配25%规则模式
 * 规则模式包括：红红红、黑黑黑、红黑红、黑红黑
 *
 * @param column 列数据
 * @returns 是否匹配规则模式
 */
// function isPatternMatch(column: DotColor[]): boolean {
//   if (column.length !== 3) return false;
// 
//   // 提取列中的三个颜色
//   const [first, second, third] = column;
// 
//   // 检查是否匹配四种规则之一
//   const isRedRedRed = first === 'red' && second === 'red' && third === 'red';
//   const isBlackBlackBlack = first === 'black' && second === 'black' && third === 'black';
//   const isRedBlackRed = first === 'red' && second === 'black' && third === 'red';
//   const isBlackRedBlack = first === 'black' && second === 'red' && third === 'black';
// 
//   const isMatch = isRedRedRed || isBlackBlackBlack || isRedBlackRed || isBlackRedBlack;
//   return isMatch;
// }

/**
 * 预测规则预测列第三个位置的颜色 (基于规则列前两个球 - 旧版逻辑)
 * 基于75%规则模式：
 * 1. 黑黑→红 (75%)
 * 2. 红红→黑 (75%)
 * 3. 黑红→红 (75%)
 * 4. 红黑→黑 (75%)
 * 
 * @param first 规则预测列第一个位置的颜色
 * @param second 规则预测列第二个位置的颜色
 * @returns 规则预测列第三个位置应该填充的颜色，如果不匹配任何规则则返回null
 */
// 注释未使用的函数以避免TypeScript警告
/*function predictThirdPosition(first: DotColor, second: DotColor): DotColor | null {
  console.log('[DEBUG] predictThirdPosition - 分析前两个预测位:', { first, second });
  
  // 根据75%规则模式确定第三个位置的颜色
  if (first === 'black' && second === 'black') {
    // 黑黑→红 (75%)
    console.log('[DEBUG] predictThirdPosition - 匹配规则: 黑黑→红');
    return 'red';
  } else if (first === 'red' && second === 'red') {
    // 红红→黑 (75%)
    console.log('[DEBUG] predictThirdPosition - 匹配规则: 红红→黑');
    return 'black';
  } else if (first === 'black' && second === 'red') {
    // 黑红→红 (75%)
    console.log('[DEBUG] predictThirdPosition - 匹配规则: 黑红→红');
    return 'red';
  } else if (first === 'red' && second === 'black') {
    // 红黑→黑 (75%)
    console.log('[DEBUG] predictThirdPosition - 匹配规则: 红黑→黑');
    return 'black';
  }
  
  console.log('[DEBUG] predictThirdPosition - 没有匹配任何75%规则模式');
  return null;
}*/

/**
 * 基于当前列的前两个球预测第三个球的颜色
 * 基于75%规则模式：
 * 1. 黑黑→红 (75%)
 * 2. 红红→黑 (75%)
 * 3. 黑红→红 (75%)
 * 4. 红黑→黑 (75%)
 * 
 * @param first 当前列第一个球的颜色
 * @param second 当前列第二个球的颜色
 * @returns 第三个球的预测颜色，如果不匹配任何规则则返回null
 */
function predictThirdPositionFromColumn(first: DotColor, second: DotColor): DotColor | null {
  // console.log('[DEBUG] predictThirdPositionFromColumn - 分析当前列前两个球:', { first, second });

  // 根据75%规则模式确定第三个位置的颜色
  if (first === 'black' && second === 'black') {
    // 黑黑→红 (75%)
    // console.log('[DEBUG] predictThirdPositionFromColumn - 匹配规则: 黑黑→红');
    return 'red';
  } else if (first === 'red' && second === 'red') {
    // 红红→黑 (75%)
    // console.log('[DEBUG] predictThirdPositionFromColumn - 匹配规则: 红红→黑');
    return 'black';
  } else if (first === 'black' && second === 'red') {
    // 黑红→红 (75%)
    // console.log('[DEBUG] predictThirdPositionFromColumn - 匹配规则: 黑红→红');
    return 'red';
  } else if (first === 'red' && second === 'black') {
    // 红黑→黑 (75%)
    // console.log('[DEBUG] predictThirdPositionFromColumn - 匹配规则: 红黑→黑');
    return 'black';
  }

  // console.log('[DEBUG] predictThirdPositionFromColumn - 没有匹配任何75%规则模式');
  return null;
}
