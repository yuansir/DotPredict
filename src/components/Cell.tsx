import React, { useEffect } from 'react';
import { DotColor } from '../types';

interface CellProps {
  color: DotColor | null;
  onClick: () => void;
  onDelete: () => void;
  isPredicted: boolean;
  predictedColor: DotColor | null;
  isNext: boolean;
  canDelete: boolean;
}

// 使用全局CSS中定义的动画样式

export const Cell: React.FC<CellProps> = ({
  color,
  onClick,
  onDelete,
  // @ts-ignore
  isPredicted,
  predictedColor,
  isNext,
  canDelete,
}) => {
  // 调试输出isNext状态变化
  useEffect(() => {
    if (isNext) {
      // console.log('[DEBUG] Cell - 渲染待输入小球:', { isNext, hasColor: !!color, predictedColor });
    }
  }, [isNext, color, predictedColor]);

  // 构建类名
  const cellClasses = [
    'relative aspect-square w-full transition-all duration-200',
    // 待输入位置样式
    isNext ? 'border-[3px] border-blue-600 ring-4 ring-blue-400/50 next-input-cell animate-pulse-border shadow-blue' : '',
    // 空白格子且为待输入位置
    !color && isNext ? 'bg-blue-100' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cellClasses}
      onClick={onClick}
    >
      {/* 下一个位置指示器 */}
      {isNext && predictedColor && !color && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`absolute inset-2 rounded-full blur-sm transition-opacity duration-300 ${predictedColor === 'red' ? 'bg-red-200' : 'bg-gray-200'} opacity-30`} />
          <div className="relative w-3/4 h-3/4">
            <div className={`w-full h-full rounded-full transition-all duration-300 ${predictedColor === 'red' ? 'bg-red-500' : 'bg-gray-900'} animate-pulse`} />
          </div>
        </div>
      )}

      {/* 实际点的显示 */}
      {color && (
        <div className="absolute inset-2 flex items-center justify-center group">
          {/* 实际点的背景光晕 */}
          <div className={`absolute inset-0 rounded-full blur-sm transition-opacity duration-300
            ${color === 'red' ? 'bg-red-200' : 'bg-gray-200'} opacity-20`}
          />
          
          {/* 实际点 */}
          <div
            className={`relative w-3/4 h-3/4 rounded-full transition-all duration-300
              ${color === 'red' ? 'bg-red-500' : 'bg-gray-900'}
              ${canDelete ? 'group-hover:scale-90' : ''}
              shadow-lg
            `}
          >
            {/* 高光效果 */}
            <div className="absolute top-1 left-2 w-2 h-2 bg-white rounded-full opacity-30"></div>
          </div>

          {/* 删除按钮 */}
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="absolute inset-0 flex items-center justify-center opacity-0 
                group-hover:opacity-100 transition-all duration-300"
            >
              <div className="p-1 rounded-full bg-red-500 shadow-lg 
                transform group-hover:scale-110 transition-transform duration-200">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </button>
          )}
        </div>
      )}

      {/* 下一个位置指示器 - 使用CSS类的动画指示器 */}
      {isNext && !color && (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          {/* 外部光晕 */}
          <div 
            className="absolute w-10 h-10 bg-blue-400 rounded-full opacity-40 animate-pulse-scale-slow" 
          />
          {/* 中间光晕 */}
          <div 
            className="absolute w-8 h-8 bg-blue-500 rounded-full opacity-60 animate-pulse-scale-medium" 
          />
          {/* 内部光晕 */}
          <div 
            className="absolute w-6 h-6 bg-blue-600 rounded-full opacity-80 animate-pulse-scale-fast" 
          />
          {/* 中心点 */}
          <div className="absolute w-4 h-4 bg-blue-700 rounded-full shadow-lg z-10" />
          {/* 辐射效果 */}
          <div className="absolute w-full h-full flex items-center justify-center">
            <div className="absolute w-16 h-16 border-2 border-blue-300/30 rounded-full animate-pulse-radiate" />
          </div>
        </div>
      )}
    </div>
  );
};
