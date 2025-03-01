import React from 'react';
import { DotColor } from '../types';
import { FiInfo } from 'react-icons/fi';

interface DotPatternProps {
  pattern: DotColor[];
  className?: string;
}

const DotPattern: React.FC<DotPatternProps> = ({ pattern, className = '' }) => {
  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {pattern.map((color, index) => (
        <div
          key={index}
          className={`w-4 h-4 rounded-full transition-all duration-200
            ${color === 'red' ? 'bg-red-500' : 'bg-gray-900'}
            shadow-md
          `}
        >
          <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white rounded-full opacity-30"></div>
        </div>
      ))}
    </div>
  );
};

export const RuleDisplay: React.FC = () => {
  const rule75Patterns: DotColor[][] = [
    ['black', 'black', 'red'],
    ['red', 'red', 'black'],
    ['black', 'red', 'red'],
    ['red', 'black', 'black'],
  ];

  const rule25Patterns: DotColor[][] = [
    ['red', 'red', 'red'],
    ['black', 'black', 'black'],
    ['red', 'black', 'red'],
    ['black', 'red', 'black'],
  ];

  const patternDescriptions = {
    '75': [
      '黑黑→红(75%)',
      '红红→黑(75%)',
      '黑红→红(75%)',
      '红黑→黑(75%)',
    ],
    '25': [
      '红红→红(25%)',
      '黑黑→黑(25%)',
      '红黑→红(25%)',
      '黑红→黑(25%)',
    ],
  };

  return (
    <div className="space-y-4">
      {/* 基本规则 */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="mt-1">
            <FiInfo className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-gray-200 font-medium mb-2">基本规则</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center space-x-2">
                <span>•</span>
                <span>从左到右，从上到下依次放置点</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>•</span>
                <span>系统会预测下一个点的颜色</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>•</span>
                <span>蓝色边框表示下一个放置位置</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 操作说明 */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="mt-1">
            <FiInfo className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-gray-200 font-medium mb-2">操作说明</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center space-x-2">
                <span>•</span>
                <span>点击颜色按钮放置点</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>•</span>
                <span>使用撤销按钮或 Ctrl+Z 撤销</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>•</span>
                <span>使用方向键或时间轴查看历史</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 75% 规则 */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="mt-1">
            <FiInfo className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-gray-200 font-medium mb-2">75% 规则模式</h3>
            <div className="grid grid-cols-4 gap-8">
              {rule75Patterns.map((pattern, index) => (
                <div key={index} className="flex flex-col items-center space-y-3">
                  <DotPattern pattern={pattern} />
                  <span className="text-xs text-gray-400">
                    {patternDescriptions['75'][index]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 25% 规则 */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="mt-1">
            <FiInfo className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-gray-200 font-medium mb-2">25% 规则模式</h3>
            <div className="grid grid-cols-4 gap-8">
              {rule25Patterns.map((pattern, index) => (
                <div key={index} className="flex flex-col items-center space-y-3">
                  <DotPattern pattern={pattern} />
                  <span className="text-xs text-gray-400">
                    {patternDescriptions['25'][index]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
