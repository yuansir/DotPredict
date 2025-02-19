import React, { useEffect, useState } from 'react';
import { DotColor, Position } from '../types';
import { BiUndo } from 'react-icons/bi';
import { MdOutlineLeaderboard } from 'react-icons/md';
import { FiTrash2, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { ConfirmDialog } from './ConfirmDialog';
import { RuleDisplay } from './RuleDisplay';
import { Transition } from '@headlessui/react';
import { SequenceConfig } from '../utils/sequencePredictor';

interface ControlPanelProps {
  selectedColor: DotColor;
  onColorSelect: (color: DotColor) => void;
  onUndo: () => void;
  onClear: () => void;
  onShowStats: () => void;
  accuracy: number;
  totalPredictions: number;
  predictedColor: DotColor | null;
  probability: number | null;
  isRecordMode: boolean;
  onSequenceConfigChange?: (config: Partial<SequenceConfig>) => void;
  sequenceConfig?: SequenceConfig;
  className?: string;
}

const RULES_EXPANDED_KEY = 'dotPredict_rulesExpanded';

export const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedColor,
  onColorSelect,
  onUndo,
  onClear,
  onShowStats,
  accuracy,
  totalPredictions,
  predictedColor,
  probability,
  isRecordMode,
  onSequenceConfigChange,
  sequenceConfig = { length: 3, isEnabled: true },
  className = ''
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isRulesExpanded, setIsRulesExpanded] = useState(() => {
    const saved = localStorage.getItem(RULES_EXPANDED_KEY);
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem(RULES_EXPANDED_KEY, JSON.stringify(isRulesExpanded));
  }, [isRulesExpanded]);

  return (
    <div className={`space-y-6 ${className}`}>
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
            disabled={!true}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 
              ${
                true
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
          >
            <BiUndo className={`w-5 h-5 ${true ? 'animate-pulse' : ''}`} />
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

          {/* 清空数据按钮 */}
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-red-500 to-red-600 
              hover:from-red-600 hover:to-red-700 text-white flex items-center justify-center space-x-2 
              transition-all duration-200 transform hover:scale-[1.02] active:scale-95"
          >
            <FiTrash2 className="w-5 h-5" />
            <span>清空数据</span>
          </button>
        </div>

        {/* 序列预测配置 */}
        {isRecordMode && onSequenceConfigChange && (
          <div className="space-y-4">
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 transition-all duration-200 hover:bg-gray-700/50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-100">序列预测设置</h3>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-3 text-gray-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sequenceConfig.isEnabled}
                    onChange={(e) => onSequenceConfigChange({ isEnabled: e.target.checked })}
                    className="form-checkbox h-5 w-5 text-blue-500 rounded border-gray-600 bg-gray-700 
                      focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                  />
                  <span>启用预测</span>
                </label>
                <div className="flex items-center space-x-3">
                  <span className="text-gray-300">序列长度:</span>
                  <select
                    value={sequenceConfig.length}
                    onChange={(e) => onSequenceConfigChange({ length: Number(e.target.value) })}
                    className="form-select h-9 pl-3 pr-8 py-1 text-gray-200 bg-gray-700 border border-gray-600 
                      rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    disabled={!sequenceConfig.isEnabled}
                    aria-label="选择序列长度"
                  >
                    {[2, 3, 4, 5].map(n => (
                      <option key={n} value={n} className="bg-gray-700 text-gray-200">{n}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 预测信息 */}
            {sequenceConfig.isEnabled && (
              <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 transition-all duration-200 hover:bg-gray-700/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-100">预测信息</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">准确率</span>
                    <span className="text-gray-100 font-medium">{accuracy.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">总预测次数</span>
                    <span className="text-gray-100 font-medium">{totalPredictions}</span>
                  </div>
                  {predictedColor && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">下一个预测</span>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-4 h-4 rounded-full ${
                            predictedColor === 'red' ? 'bg-red-500' : 'bg-gray-100'
                          } shadow-sm`}
                          aria-label={`预测颜色: ${predictedColor === 'red' ? '红色' : '黑色'}`}
                        />
                        <span className="text-gray-100 font-medium">
                          {probability ? `${(probability * 100).toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 状态显示 */}
        <div className="bg-gray-700 rounded-lg p-4 space-y-4">
          {/* 预测准确率 */}
          <div className="flex justify-between items-center p-3 rounded-lg bg-gray-800/30">
            <span className="text-gray-400">预测准确率</span>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-24 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${accuracy}%` }}
                />
              </div>
              <span className="text-green-400 font-medium">{accuracy.toFixed(1)}%</span>
            </div>
          </div>

          {/* 预测次数 */}
          <div className="flex justify-between items-center p-3 rounded-lg bg-gray-800/30">
            <span className="text-gray-400">预测次数</span>
            <span className="text-blue-400 font-medium">{totalPredictions}</span>
          </div>
        </div>

        {/* 规则展开/折叠按钮 */}
        <button
          onClick={() => setIsRulesExpanded(!isRulesExpanded)}
          className="w-full py-2 px-4 rounded-lg bg-gray-700 text-gray-300 
            flex items-center justify-center space-x-2 
            transition-all duration-200 hover:bg-gray-600"
        >
          <span>{isRulesExpanded ? '收起规则' : '查看规则'}</span>
          {isRulesExpanded ? (
            <FiChevronUp className="w-5 h-5" />
          ) : (
            <FiChevronDown className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* 规则显示（可折叠） */}
      <Transition
        show={isRulesExpanded}
        enter="transition-all duration-300 ease-out"
        enterFrom="transform scale-95 opacity-0 -translate-y-4"
        enterTo="transform scale-100 opacity-100 translate-y-0"
        leave="transition-all duration-200 ease-in"
        leaveFrom="transform scale-100 opacity-100 translate-y-0"
        leaveTo="transform scale-95 opacity-0 -translate-y-4"
      >
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl p-6">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-gray-100">游戏规则</h2>
            <p className="text-sm text-gray-400 mt-1">了解如何玩转点阵预测游戏</p>
          </div>
          <RuleDisplay />
        </div>
      </Transition>

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={onClear}
        title="确认清空数据"
        message="这将清空所有游戏数据，包括历史记录和统计信息。此操作不可撤销，是否确认继续？"
        confirmText="清空数据"
        cancelText="取消"
        type="danger"
      />
    </div>
  );
};
