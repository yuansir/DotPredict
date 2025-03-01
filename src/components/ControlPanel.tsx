import React, { useEffect, useState } from 'react';
// @ts-ignore
import { DotColor, Position } from '../types';
import { BiUndo } from 'react-icons/bi';
import { FiTrash2, FiChevronDown, FiChevronUp, FiStopCircle } from 'react-icons/fi';
import { ConfirmDialog } from './ConfirmDialog';
import { RuleDisplay } from './RuleDisplay';
import { Transition } from '@headlessui/react';
import { SequenceConfig } from '../utils/sequencePredictor';

interface ControlPanelProps {
  selectedColor: DotColor;
  onColorSelect: (color: DotColor) => void;
  onUndo: () => void;
  onClear: () => void;
  onEndSession: () => void;
  predictedColor: DotColor | null;
  probability: number | null;
  isRecordMode: boolean;
  onSequenceConfigChange?: (config: Partial<SequenceConfig>) => void;
  sequenceConfig?: SequenceConfig;
  className?: string;
  rule75Prediction: {
    predictedColor: DotColor | null;
    currentSequence: DotColor[];
  };
}

// 序列长度选项
// @ts-ignore - 未使用的变量
const sequenceLengthOptions = [
  { value: 4, label: '4' },
  { value: 5, label: '5' },
  { value: 6, label: '6' },
  { value: 7, label: '7' },
  { value: 8, label: '8' },
  { value: 9, label: '9' }
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedColor,
  onColorSelect,
  onUndo,
  onClear,
  onEndSession,
  // @ts-ignore - 未使用的属性
  predictedColor,
  // @ts-ignore - 未使用的属性
  probability,
  // @ts-ignore - 未使用的属性
  isRecordMode,
  // @ts-ignore - 未使用的属性
  onSequenceConfigChange,
  // @ts-ignore - 未使用的属性
  sequenceConfig = { length: 4, isEnabled: false },
  className = '',
  // @ts-ignore - 未使用的属性
  rule75Prediction
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isRulesExpanded, setIsRulesExpanded] = useState(() => {
    const saved = localStorage.getItem('dotPredict_rulesExpanded');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('dotPredict_rulesExpanded', JSON.stringify(isRulesExpanded));
  }, [isRulesExpanded]);

  return (
    <div className={`grid grid-cols-2 gap-6 ${className}`}>
      {/* 第一栏：颜色选择和基础操作 */}
      <div className="flex-1 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl p-6 space-y-6">
        {/* 标题和说明 */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-gray-100">基础操作</h2>
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
              className={`group relative h-20 rounded-lg transition-all duration-200 ${selectedColor === 'red'
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
              className={`group relative h-20 rounded-lg transition-all duration-200 ${selectedColor === 'black'
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
              ${true
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
          >
            <BiUndo className={`w-5 h-5 ${true ? 'animate-pulse' : ''}`} />
            <span>撤销</span>
          </button>

          {/* 终止输入按钮 */}
          <button
            onClick={onEndSession}
            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 
              hover:from-yellow-600 hover:to-yellow-700 text-white flex items-center justify-center space-x-2 
              transition-all duration-200"
          >
            <FiStopCircle className="w-5 h-5" />
            <span>终止输入</span>
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
      </div>

      {/* 第三栏：游戏规则 */}
      <div className="flex-1 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-gray-100">游戏规则</h2>
          <p className="text-sm text-gray-400">点击展开查看规则</p>
        </div>

        {/* 规则展示区域 */}
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
              <p className="text-sm text-gray-400 mt-1">了解如何玩转点阵预测游戏</p>
            </div>
            <RuleDisplay />
          </div>
        </Transition>
      </div>

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={onClear}
        title="确认清空数据"
        message="这将清空所有游戏数据，包括历史记录、统计信息和当前游戏进度。请确保您已保存所有必要的数据后再进行此操作。"
        confirmText="清空数据"
        cancelText="取消"
        type="danger"
      />
    </div>
  );
};
