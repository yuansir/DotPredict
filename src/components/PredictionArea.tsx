import React, { useEffect } from 'react';
import { DotColor } from '../types';
import PredictionColumn from './PredictionColumn';

interface PredictionAreaProps {
  continuityPredictionColors: (DotColor | null)[];
  currentPredictionRow: number | null;
  predictionUpdateId: number;
}

/**
 * PredictionArea - 预测区域组件，管理所有预测列
 * 根据最后两个非空球颜色显示预测，并高亮当前待输入位置所在行
 */
const PredictionArea: React.FC<PredictionAreaProps> = ({
  continuityPredictionColors,
  currentPredictionRow,
  predictionUpdateId
}) => {
  // 调试日志
  useEffect(() => {
    console.log('[DEBUG] PredictionArea - 渲染预测区域:', {
      predictions: continuityPredictionColors,
      currentRow: currentPredictionRow,
      updateId: predictionUpdateId,
      renderTime: new Date().toISOString()
    });
  }, [continuityPredictionColors, currentPredictionRow, predictionUpdateId]);

  return (
    <div className="relative ml-6 bg-blue-50 px-3 py-3 rounded-lg border border-blue-100">
      {/* 预测列标题 - 绝对定位 */}
      <div className="absolute -top-6 left-0 right-0 flex justify-around px-3">
        <div className="w-16 text-center text-sm font-medium text-gray-700 whitespace-nowrap">连续性</div>
        <div className="w-16 text-center text-sm font-medium text-gray-700 whitespace-nowrap">规则</div>
      </div>

      {/* 预测列内容 */}
      {[0, 1, 2].map((row) => (
        <div 
          key={`prediction-row-${row}-${predictionUpdateId}`} 
          className="flex mb-3 items-center"
          data-prediction-row-container={row}
          data-is-current-row={row === currentPredictionRow}
        >
          {/* 预测列1 - 连续性 */}
          <PredictionColumn
            key={`prediction-col-${row}-${predictionUpdateId}`}
            row={row}
            currentPredictionRow={currentPredictionRow}
            predictionColor={continuityPredictionColors[row]}
            predictionUpdateId={predictionUpdateId}
          />

          {/* 预测列2 - 规则 */}
          <div
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center bg-white"
            data-rule-prediction-col={row}
          >
            {/* TODO: 规则预测逻辑暂时禁用，未来将重新实现 */}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PredictionArea;
