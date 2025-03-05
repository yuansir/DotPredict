import React, { useEffect, memo } from 'react';
import { DotColor } from '../types';

interface PredictionColumnProps {
  row: number;
  currentPredictionRow: number | null;
  predictionColor: DotColor | null;
  predictionUpdateId: number;
}

/**
 * PredictionColumn - 专门负责渲染单个预测球的组件
 * 使用memo确保只在必要时重新渲染
 */
const PredictionColumnInner: React.FC<PredictionColumnProps> = ({ 
  row, 
  currentPredictionRow, 
  predictionColor,
  predictionUpdateId 
}) => {
  // 调试日志
  useEffect(() => {
    console.log(`[DEBUG] PredictionColumn[${row}] 渲染:`, {
      predictionColor,
      isCurrentRow: currentPredictionRow === row,
      updateId: predictionUpdateId,
      time: new Date().toISOString()
    });
  }, [row, currentPredictionRow, predictionColor, predictionUpdateId]);

  // 添加强制重绘逻辑
  useEffect(() => {
    // 获取DOM元素并强制重绘
    const forceRepaint = () => {
      const element = document.querySelector(`[data-prediction-column-id="${row}"]`);
      if (element) {
        // 强制浏览器重新计算布局
        element.classList.add('force-repaint');
        setTimeout(() => element.classList.remove('force-repaint'), 10);
      }
    };
    
    // 在状态更新时强制重绘
    forceRepaint();
  }, [row, predictionUpdateId, predictionColor]);

  // 是否当前行
  const isCurrentRow = currentPredictionRow === row;
  // 是否有预测颜色
  const hasPrediction = predictionColor !== null;

  return (
    <div
      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 bg-white 
        ${isCurrentRow ? 'border-yellow-400 animate-pulse-border' : 'border-blue-400'}`}
      data-row={row}
      data-is-prediction-row={isCurrentRow}
      data-update-id={predictionUpdateId}
      data-has-prediction={hasPrediction}
      data-prediction-column-id={row}
      data-prediction-color-value={predictionColor || 'none'}
    >
      {hasPrediction && (
        <div
          className={`w-6 h-6 rounded-full ${
            predictionColor === 'red' ? 'bg-red-500' : 'bg-black'
          }`}
          data-prediction-row={row}
          data-prediction-color={predictionColor}
          data-prediction-time={new Date().toISOString()}
        ></div>
      )}
    </div>
  );
};

// 使用memo包装组件，提高性能
const PredictionColumn = memo(PredictionColumnInner);

export default PredictionColumn;
