import React from 'react';
import { DotColor } from '../types';
import { BiUndo } from 'react-icons/bi';
import { MdOutlineLeaderboard } from 'react-icons/md';
import { RuleDisplay } from './RuleDisplay';

interface ControlPanelProps {
  onColorSelect: (color: DotColor) => void;
  selectedColor: DotColor;
  onShowStats: () => void;
  onUndo: () => void;
  canUndo: boolean;
  accuracy: number;
  totalPredictions: number;
  predictedColor: DotColor | null;
  probability: number | null;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onColorSelect,
  selectedColor,
  onShowStats,
  onUndo,
  canUndo,
  accuracy,
  totalPredictions,
  predictedColor,
  probability,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl p-6 space-y-6">
        {/* 标题和说明 */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-gray-100">控制面板</h2>
          <p className="text-sm text-gray-400">选择颜色放置点</p>
        </div>

        {/* 颜色选择器容器 */}
        <div className="relative bg-gray-700 rounded-lg p-4 shadow-inner">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 opacity-50 rounded-lg"></div>
          
          {/* 控制按钮组 */}
          <div className="relative grid grid-cols-2 gap-4">
            {/* 红色按钮 */}
            <button
              onClick={() => onColorSelect('red')}
              className={`group relative h-20 rounded-lg transition-all duration-200 ${
                selectedColor === 'red'
                  ? 'ring-2 ring-red-500 ring-opacity-60'
                  : ''
              }`}
            >
              {/* 按钮背景 */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-lg"></div>
              
              {/* 红色球体 */}
              <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 
                rounded-full bg-gradient-to-br from-red-400 to-red-600 
                shadow-lg transition-transform duration-200 
                ${selectedColor === 'red' ? 'scale-110' : 'group-hover:scale-105'}`}>
                {/* 高光效果 */}
                <div className="absolute top-1 left-2 w-4 h-4 bg-white rounded-full opacity-30"></div>
              </div>
            </button>

            {/* 黑色按钮 */}
            <button
              onClick={() => onColorSelect('black')}
              className={`group relative h-20 rounded-lg transition-all duration-200 ${
                selectedColor === 'black'
                  ? 'ring-2 ring-gray-400 ring-opacity-60'
                  : ''
              }`}
            >
              {/* 按钮背景 */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-lg"></div>
              
              {/* 黑色球体 */}
              <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 
                rounded-full bg-gradient-to-br from-gray-700 to-gray-900 
                shadow-lg transition-transform duration-200 
                ${selectedColor === 'black' ? 'scale-110' : 'group-hover:scale-105'}`}>
                {/* 高光效果 */}
                <div className="absolute top-1 left-2 w-4 h-4 bg-white rounded-full opacity-20"></div>
              </div>
            </button>
          </div>

          {/* 指示灯 */}
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50 animate-pulse"></div>
        </div>

        {/* 功能按钮区 */}
        <div className="space-y-4">
          {/* 撤销按钮 */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 
              ${
                canUndo
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
          >
            <BiUndo className={`w-5 h-5 ${canUndo ? 'animate-pulse' : ''}`} />
            <span>撤销</span>
          </button>

          {/* 统计按钮 */}
          <button
            onClick={onShowStats}
            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 
              hover:from-purple-600 hover:to-purple-700 text-white flex items-center justify-center space-x-2 
              transition-all duration-200"
          >
            <MdOutlineLeaderboard className="w-5 h-5" />
            <span>查看统计</span>
          </button>
        </div>

        {/* 状态显示 */}
        <div className="bg-gray-700 rounded-lg p-4 space-y-3">
          {/* 预测信息 */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">当前预测</span>
            {predictedColor ? (
              <div className="flex items-center space-x-2">
                <div
                  className={`w-4 h-4 rounded-full ${
                    predictedColor === 'red' ? 'bg-red-500' : 'bg-gray-900'
                  }`}
                />
                <span className="text-gray-200">
                  {predictedColor === 'red' ? '红色' : '黑色'}
                  <span className="text-gray-400 text-xs ml-1">
                    (概率: {probability ? `${(probability * 100).toFixed(0)}%` : 'N/A'})
                  </span>
                </span>
              </div>
            ) : (
              <span className="text-gray-500">暂无预测</span>
            )}
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">预测准确率</span>
            <span className="text-green-400 font-medium">{accuracy.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">预测次数</span>
            <span className="text-blue-400 font-medium">{totalPredictions}</span>
          </div>
        </div>
      </div>

      {/* 规则展示 */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl p-6">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gray-100">游戏规则</h2>
          <p className="text-sm text-gray-400 mt-1">了解如何玩转点阵预测游戏</p>
        </div>
        <RuleDisplay />
      </div>
    </div>
  );
};
