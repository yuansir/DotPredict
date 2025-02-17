import React from 'react';
import { DotColor } from '../types';
import { RuleDisplay } from './RuleDisplay';
import { BiUndo } from 'react-icons/bi';

interface ControlPanelProps {
  onColorSelect: (color: DotColor) => void;
  selectedColor: DotColor;
  onShowStats: () => void;
  onUndo: () => void;
  canUndo: boolean;
  accuracy: number;
  totalPredictions: number;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onColorSelect,
  selectedColor,
  onShowStats,
  onUndo,
  canUndo,
  accuracy,
  totalPredictions,
}) => {
  return (
    <div className="space-y-6">
      {/* 颜色选择和撤销按钮 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">放置点的颜色</h3>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`
              p-2 rounded-lg transition-all duration-200 flex items-center
              ${
                canUndo
                  ? 'text-blue-600 hover:bg-blue-50 hover:scale-110'
                  : 'text-gray-400 cursor-not-allowed opacity-50'
              }
              focus:outline-none focus:ring-2 focus:ring-blue-500
            `}
            title="撤销上一步 (Ctrl+Z)"
          >
            <BiUndo className="w-6 h-6" />
          </button>
        </div>
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => onColorSelect('red')}
            className={`
              group relative flex items-center justify-center w-16 h-16 
              rounded-lg transition-all duration-200
              ${
                selectedColor === 'red'
                  ? 'bg-red-50'
                  : 'hover:bg-red-50'
              }
              focus:outline-none focus:ring-2 focus:ring-red-300
            `}
            aria-label="选择红色"
          >
            <div className={`
              w-8 h-8 rounded-full bg-red-500 transition-transform duration-200
              ${selectedColor === 'red' ? 'scale-110 shadow-lg' : 'hover:scale-110'}
            `} />
            <span className="absolute -bottom-6 text-sm text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
              红点
            </span>
          </button>
          <button
            onClick={() => onColorSelect('black')}
            className={`
              group relative flex items-center justify-center w-16 h-16 
              rounded-lg transition-all duration-200
              ${
                selectedColor === 'black'
                  ? 'bg-gray-50'
                  : 'hover:bg-gray-50'
              }
              focus:outline-none focus:ring-2 focus:ring-gray-300
            `}
            aria-label="选择黑色"
          >
            <div className={`
              w-8 h-8 rounded-full bg-gray-900 transition-transform duration-200
              ${selectedColor === 'black' ? 'scale-110 shadow-lg' : 'hover:scale-110'}
            `} />
            <span className="absolute -bottom-6 text-sm text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
              黑点
            </span>
          </button>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">预测统计</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">准确率</span>
            <div className="flex items-center">
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${accuracy}%` }}
                />
              </div>
              <span className="ml-2 text-lg font-semibold text-green-600">
                {accuracy.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">预测次数</span>
            <span className="text-lg font-semibold text-blue-600">
              {totalPredictions}
            </span>
          </div>
          <button
            onClick={onShowStats}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
          >
            查看详细统计
          </button>
        </div>
      </div>

      {/* 规则展示 */}
      <RuleDisplay />
    </div>
  );
};
