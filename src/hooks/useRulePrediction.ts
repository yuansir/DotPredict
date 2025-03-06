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
      
      // 添加第二个预测位功能 - 查找符合25%规则的列
      const secondPredictionColor = findColumnMatchingPattern(fullMatrix);
      if (secondPredictionColor) {
        predictions[1] = secondPredictionColor;
        console.log('[DEBUG] useRulePrediction - 设置第二个预测位颜色:', secondPredictionColor);
      }
      
    } catch (error) {
      console.error('[ERROR] useRulePrediction - 预测计算错误:', error);
    }
    
    console.log('[DEBUG] useRulePrediction - 最终预测结果:', predictions);
    
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
  
  console.log('[DEBUG] findColumnMatchingPattern - 开始从右向左查找符合规则的列, 总列数:', totalCols);
  
  // 从右向左遍历所有列（从最新到最旧）
  for (let col = totalCols - 1; col >= 0; col--) {
    // 提取当前列所有三行的值
    const column = [
      fullMatrix[0]?.[col],
      fullMatrix[1]?.[col],
      fullMatrix[2]?.[col]
    ];
    
    // 跳过有空值的列
    if (column.includes(null) || column.includes(undefined)) {
      continue;
    }
    
    console.log(`[DEBUG] findColumnMatchingPattern - 检查列 ${col}:`, column);
    
    // 判断列是否匹配四种规则之一
    if (isPatternMatch(column as DotColor[])) {
      console.log(`[DEBUG] findColumnMatchingPattern - 找到匹配的列 ${col}, 取第二个球颜色:`, column[1]);
      return column[1] as DotColor; // 返回中间位置的颜色
    }
  }
  
  console.log('[DEBUG] findColumnMatchingPattern - 未找到符合规则的列');
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
  
  if (isMatch) {
    console.log('[DEBUG] isPatternMatch - 匹配到规则模式:', { 
      first, second, third,
      patternType: isRedRedRed ? '红红红' : 
                  isBlackBlackBlack ? '黑黑黑' : 
                  isRedBlackRed ? '红黑红' : 
                  '黑红黑'
    });
  }
  
  return isMatch;
}
