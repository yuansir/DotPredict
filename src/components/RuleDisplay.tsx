import React from 'react';
import { DotColor } from '../types';

interface DotPatternProps {
  pattern: DotColor[];
}

const Dot: React.FC<{ color: DotColor }> = ({ color }) => (
  <div
    className={`w-4 h-4 rounded-full ${
      color === 'red' ? 'bg-red-500' : 'bg-gray-900'
    }`}
  />
);

const DotPattern: React.FC<DotPatternProps> = ({ pattern }) => (
  <div className="flex flex-col items-center space-y-1">
    {pattern.map((color, index) => (
      <Dot key={index} color={color} />
    ))}
  </div>
);

interface RuleDisplayProps {
  className?: string;
}

export const RuleDisplay: React.FC<RuleDisplayProps> = ({ className }) => {
  const rule25Patterns: DotColor[][] = [
    ['red', 'red', 'red'],        // 三红
    ['black', 'black', 'black'],  // 三黑
    ['red', 'black', 'red'],      // 红黑红
    ['black', 'red', 'black']     // 黑红黑
  ];

  const rule75Patterns: DotColor[][] = [
    ['black', 'black', 'red'],    // 两黑一红
    ['red', 'red', 'black'],      // 两红一黑
    ['black', 'red', 'black'],    // 黑红黑
    ['red', 'black', 'black']     // 红黑黑
  ];

  const patternDescriptions = {
    '25': ['三红连续', '三黑连续', '红黑红', '黑红黑'],
    '75': ['两黑一红', '两红一黑', '黑红黑', '红黑黑']
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="space-y-6">
        {/* 25% 规则 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full mr-2">
              25%
            </span>
            规则模式
          </h3>
          <div className="grid grid-cols-4 gap-8">
            {rule25Patterns.map((pattern, index) => (
              <div key={index} className="flex flex-col items-center">
                <DotPattern pattern={pattern} />
                <span className="mt-2 text-xs text-gray-500">
                  {patternDescriptions['25'][index]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 75% 规则 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full mr-2">
              75%
            </span>
            规则模式
          </h3>
          <div className="grid grid-cols-4 gap-8">
            {rule75Patterns.map((pattern, index) => (
              <div key={index} className="flex flex-col items-center">
                <DotPattern pattern={pattern} />
                <span className="mt-2 text-xs text-gray-500">
                  {patternDescriptions['75'][index]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
