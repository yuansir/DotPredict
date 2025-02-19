import React from 'react';
import { DotColor } from '../types';

interface PredictionSequenceDisplayProps {
  historicalColors: DotColor[];  // 历史颜色序列
  predictedColor: DotColor | null;  // 预测的下一个颜色
  matchCount: number;  // 历史匹配序列次数
  confidence: number;  // 预测置信度
  sequenceLength: number;  // 序列长度
}

export const PredictionSequenceDisplay: React.FC<PredictionSequenceDisplayProps> = ({
  historicalColors,
  predictedColor,
  matchCount,
  confidence,
  sequenceLength
}) => {
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

  return (
    <div className="bg-gray-800/80 backdrop-blur-md rounded-xl p-6 mt-4 shadow-lg border border-gray-700">
      <h3 className="text-gray-200 text-sm mb-4 font-medium">预测序列分析</h3>
      
      {/* 历史序列显示 */}
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-gray-300 text-sm">当前序列：</span>
        <div className="flex space-x-2">
          {historicalColors.map((color, index) => renderDot(color, index))}
        </div>
      </div>
      
      {/* 预测结果 */}
      {predictedColor ? (
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
                  {Math.round(confidence * 100)}%
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
