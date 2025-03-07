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

      // 添加第二个预测位功能 - 查找符合25%规则的列
      const secondPredictionColor = findColumnMatchingPattern(fullMatrix);
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
 * 查找符合25%规则模式的列
 * 从右到左扫描矩阵，找到第一个符合四种规则模式之一的列
 * 返回该列的第二个球的颜色（中间位置）
 */
function findColumnMatchingPattern(fullMatrix: (DotColor | null)[][]): DotColor | null {
  // 获取列数
  const totalCols = fullMatrix[0]?.length || 0;

  // console.log('[DEBUG] findColumnMatchingPattern - 开始从右向左查找符合规则的列, 总列数:', totalCols);

  // 从右向左遍历所有列（从最新到最旧）
  for (let col = totalCols - 1; col >= 0; col--) {
    // 提取当前列所有三行的值
    const column = [
      fullMatrix[0]?.[col],
      fullMatrix[1]?.[col],
      fullMatrix[2]?.[col]
    ];

    // 跳过有空值的列
    if (column.includes(null) || column.some(item => item === undefined)) {
      continue;
    }

    // console.log(`[DEBUG] findColumnMatchingPattern - 检查列 ${col}:`, column);

    // 判断列是否匹配四种规则之一
    if (isPatternMatch(column as DotColor[])) {
      // console.log(`[DEBUG] findColumnMatchingPattern - 找到匹配的列 ${col}, 取第二个球颜色:`, column[1]);
      return column[1] as DotColor; // 返回中间位置的颜色
    }
  }

  // console.log('[DEBUG] findColumnMatchingPattern - 未找到符合规则的列');
  return null; // 没有找到匹配的列
}

/**
 * 检查列是否匹配25%规则模式
 * 规则模式包括：红红红、黑黑黑、红黑红、黑红黑
 */
function isPatternMatch(column: DotColor[]): boolean {
  if (column.length !== 3) return false;

  // 提取列中的三个颜色
  const [first, second, third] = column;

  // 检查是否匹配四种规则之一
  const isRedRedRed = first === 'red' && second === 'red' && third === 'red';
  const isBlackBlackBlack = first === 'black' && second === 'black' && third === 'black';
  const isRedBlackRed = first === 'red' && second === 'black' && third === 'red';
  const isBlackRedBlack = first === 'black' && second === 'red' && third === 'black';

  const isMatch = isRedRedRed || isBlackBlackBlack || isRedBlackRed || isBlackRedBlack;

  // if (isMatch) {
  //   console.log('[DEBUG] isPatternMatch - 匹配到规则模式:', {
  //     first, second, third,
  //     patternType: isRedRedRed ? '红红红' :
  //       isBlackBlackBlack ? '黑黑黑' :
  //         isRedBlackRed ? '红黑红' :
  //           '黑红黑'
  //   });
  // }

  return isMatch;
}

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
