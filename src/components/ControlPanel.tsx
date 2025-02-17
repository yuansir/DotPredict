import React from 'react';
import { DotColor } from '../types';
import { RuleDisplay } from './RuleDisplay';

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
              p-2 rounded-lg transition-all duration-200
              ${
                canUndo
                  ? 'text-blue-600 hover:bg-blue-50'
                  : 'text-gray-400 cursor-not-allowed'
              }
              focus:outline-none focus:ring-2 focus:ring-blue-500
            `}
            title="撤销上一步 (Ctrl+Z)"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a4 4 0 0 1 4 4v2m-6-6l-3-3m0 0L5 4m3 3H3"
              />
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => onColorSelect('red')}
            className={`group relative flex items-center justify-center w-16 h-16 rounded-lg transition-all duration-200 ${
              selectedColor === 'red'
                ? 'ring-4 ring-red-300 scale-105'
                : 'hover:scale-105'
            }`}
            aria-label="选择红色"
          >
            <div className="w-8 h-8 rounded-full bg-red-500" />
            <span className="absolute -bottom-6 text-sm text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
              红点
            </span>
          </button>
          <button
            onClick={() => onColorSelect('black')}
            className={`group relative flex items-center justify-center w-16 h-16 rounded-lg transition-all duration-200 ${
              selectedColor === 'black'
                ? 'ring-4 ring-gray-300 scale-105'
                : 'hover:scale-105'
            }`}
            aria-label="选择黑色"
          >
            <div className="w-8 h-8 rounded-full bg-gray-900" />
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
