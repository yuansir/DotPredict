import React from 'react';
import { DotColor } from '../types';

interface PredictionSequenceDisplayProps {
  historicalColors: DotColor[];  // 历史颜色序列
  predictedColor: DotColor | null;  // 预测的下一个颜色
  matchCount: number;  // 历史匹配序列次数
  confidence: number;  // 预测置信度
  sequenceLength: number;  // 序列长度
  isLoading?: boolean;  // 新增loading状态
}

export const PredictionSequenceDisplay: React.FC<PredictionSequenceDisplayProps> = ({
  historicalColors = [],
  predictedColor,
  matchCount = 0,
  confidence = 0,
  sequenceLength,
  isLoading = false  // 默认为false
}) => {
  // 添加日志，记录组件接收到的props
  console.log('PredictionSequenceDisplay接收到的props:', {
    historicalColors,
    predictedColor,
    matchCount,
    confidence,
    sequenceLength,
    isLoading
  });

  // 渲染单个小球的函数
  const renderDot = (color: DotColor, key: number, isPredict: boolean = false) => (
    <div
      key={key}
      className={`
        relative w-4 h-4 rounded-full transform transition-all duration-300
        ${color === 'red' 
          ? 'bg-gradient-to-br from-red-400 to-red-600' 
          : 'bg-gradient-to-br from-gray-800 to-gray-900'
        }
        ${isPredict ? 'w-5 h-5 animate-bounce-gentle' : 'animate-pulse-slow'}
        hover:scale-110
        shadow-lg
      `}
    >
      {/* 高光效果 */}
      <div className={`
        absolute rounded-full bg-white opacity-30
        ${isPredict 
          ? 'w-2 h-2 top-0.5 left-1' 
          : 'w-1.5 h-1.5 top-0.5 left-1'
        }
      `} />
    </div>
  );

  // 渲染空点的函数
  const renderEmptyDot = (key: number) => (
    <div
      key={key}
      className="relative w-4 h-4 rounded-full bg-gray-700/50 border border-gray-600/50"
    />
  );

  return (
    <div className="bg-gray-800/80 backdrop-blur-md rounded-xl p-6 mt-4 shadow-lg border border-gray-700">
      <h3 className="text-gray-200 text-sm mb-4 font-medium">预测序列分析</h3>
      
      {/* 历史序列显示 */}
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-gray-300 text-sm">当前序列：</span>
        <div className="flex space-x-2">
          {historicalColors.length > 0 ? (
            historicalColors.map((color, index) => renderDot(color, index))
          ) : (
            // 如果没有历史记录，显示空点
            Array.from({ length: sequenceLength }).map((_, index) => renderEmptyDot(index))
          )}
        </div>
      </div>
      
      {/* 预测结果 */}
      {isLoading ? (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="text-gray-400">
              预测计算中
              <span className="inline-flex ml-1">
                <span className="animate-[loading1_1s_infinite] opacity-0">.</span>
                <span className="animate-[loading2_1s_infinite] opacity-0">.</span>
                <span className="animate-[loading3_1s_infinite] opacity-0">.</span>
              </span>
            </div>
          </div>
        </div>
      ) : predictedColor ? (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <span className="text-gray-300 text-sm">预测下一个：</span>
            {renderDot(predictedColor, -1, true)}
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm">
              <span className="text-gray-200">
                历史匹配序列 
                <span className="text-blue-400 font-semibold ml-1">
                  {matchCount}
                </span>
                <span className="text-gray-400 mx-1">次</span>
                •
                <span className="text-gray-200 ml-1">
                  置信度：
                </span>
                <span className="text-blue-400 font-semibold">
                  {/* 确保confidence是一个0到1之间的数值 */}
                  {Math.round((confidence >= 0 && confidence <= 1 ? confidence : 0) * 100)}%
                </span>
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-2">
          <span className="text-gray-400 italic">暂无预测</span>
        </div>
      )}
    </div>
  );
};
