import React, { useEffect } from 'react';
import { DotColor } from '../types';
import PredictionColumn from './PredictionColumn';

interface PredictionAreaProps {
  continuityPredictionColors: (DotColor | null)[];
  rulePredictionColors: (DotColor | null)[];
  currentPredictionRow: number | null;
  predictionUpdateId: number;
}

/**
 * PredictionArea - 预测区域组件，管理所有预测列
 * 根据最后两个非空球颜色显示预测，并高亮当前待输入位置所在行
 */
const PredictionArea: React.FC<PredictionAreaProps> = ({
  continuityPredictionColors,
  rulePredictionColors,
  currentPredictionRow,
  predictionUpdateId
}) => {
  // 调试日志
  useEffect(() => {
    // console.log('[DEBUG] PredictionArea - 渲染预测区域:', {
    //   continuityPredictions: continuityPredictionColors,
    //   rulePredictions: rulePredictionColors,
    //   currentRow: currentPredictionRow,
    //   updateId: predictionUpdateId,
    //   renderTime: new Date().toISOString(),
    //   // 添加详细调试信息
    //   showConditionForThirdBall: rulePredictionColors[2] !== null && ((2 === currentPredictionRow) || (2 > 2)),
    //   thirdBallPrediction: rulePredictionColors[2],
    //   isCurrentRowMatchingThirdBall: 2 === currentPredictionRow
    // });

    // 每行的详细调试信息
    // [0, 1, 2].forEach(r => {
    //   // console.log(`[DETAILED DEBUG] 第${r + 1}个小球:`, {
    //   //   row: r,
    //   //   predictionColor: rulePredictionColors[r],
    //   //   currentPredictionRow,
    //   //   isCurrentRow: r === currentPredictionRow,
    //   //   displayCondition1: rulePredictionColors[r] !== null,
    //   //   displayCondition2: r !== 0,
    //   //   displayCondition3: r <= 2 ? r === currentPredictionRow : true,
    //   //   shouldDisplay: rulePredictionColors[r] !== null && r !== 0 && (r <= 2 ? r === currentPredictionRow : true)
    //   // });
    // });
  }, [continuityPredictionColors, rulePredictionColors, currentPredictionRow, predictionUpdateId]);

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
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white
              ${row === currentPredictionRow ? 'border-yellow-400 animate-pulse-border' : 'border-blue-400'}`}
            data-rule-prediction-col={row}
            data-is-current-row={row === currentPredictionRow}
            data-update-id={predictionUpdateId}
            data-has-prediction={rulePredictionColors[row] !== null}
          >
            {/* 显示规则预测结果 */}
            {/* 规则1: 第一个小球(row=0)始终不显示 */}
            {/* 规则2: 第二个小球(row=1)仅当它是当前待输入位置时才显示 */}
            {/* 规则3: 第三个小球(row=2)仅当它是当前待输入位置时才显示 */}
            {/* 测试输出每行的条件计算结果 */}
            {(() => {
              if (row === 2) {
                // console.log(`[DEBUG] 第三个小球显示条件:`, {
                //   row,
                //   currentPredictionRow,
                //   hasPrediction: rulePredictionColors[row] !== null,
                //   showCondition: rulePredictionColors[row] && (row === currentPredictionRow),
                //   predictionColor: rulePredictionColors[row]
                // });
              }
              return null;
            })()}
            {rulePredictionColors[row] &&
              row !== 0 &&
              // 修改条件逻辑：第一行不显示，第二行始终显示，第三行保持原有逻辑
              (row === 1 || row === 2) && (
                <div
                  className={`w-6 h-6 rounded-full ${rulePredictionColors[row] === 'red' ? 'bg-red-500' : 'bg-black'
                    }`}
                  data-prediction-color={rulePredictionColors[row]}
                  data-prediction-time={new Date().toISOString()}
                />
              )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PredictionArea;
