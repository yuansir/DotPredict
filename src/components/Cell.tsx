import React from 'react';
import { DotColor } from '../types';
import { FiX } from 'react-icons/fi';

interface CellProps {
  color: DotColor | null;
  onClick: () => void;
  onDelete: () => void;
  isPredicted: boolean;
  predictedColor: DotColor | null;
  isNext: boolean;
  canDelete: boolean;
}

export const Cell: React.FC<CellProps> = ({
  color,
  onClick,
  onDelete,
  isPredicted,
  predictedColor,
  isNext,
  canDelete,
}) => {
  return (
    <div
      className={`relative aspect-square w-full transition-all duration-200
        ${isNext ? 'ring-2 ring-blue-500 ring-opacity-60' : ''}
        ${!color && isNext ? 'bg-blue-50' : ''}
      `}
      onClick={onClick}
    >
      {/* 预测提示 */}
      {isPredicted && predictedColor && !color && (
        <div className="inset-0 flex items-center justify-center">
          {/* 预测背景光晕 */}
          <div className={`inset-2 rounded-full blur-sm transition-opacity duration-300
            ${predictedColor === 'red' ? 'bg-red-200' : 'bg-gray-200'} opacity-30`}
          />
          
          {/* 预测点 */}
          <div className="w-3/4 h-3/4 flex items-center justify-center">
            <div
              className={`w-full h-full rounded-full transition-all duration-300
                ${predictedColor === 'red' ? 'bg-red-500' : 'bg-gray-900'}
                opacity-25 hover:opacity-40
                ${isNext ? 'animate-pulse' : ''}
              `}
            >
              {/* 高光效果 */}
              <div className="top-1 left-2 w-2 h-2 bg-white rounded-full opacity-30"></div>
            </div>
          </div>
        </div>
      )}

      {/* 实际点的显示 */}
      {color && (
        <div className="inset-2 flex items-center justify-center group">
          {/* 实际点的背景光晕 */}
          <div className={`inset-0 rounded-full blur-sm transition-opacity duration-300
            ${color === 'red' ? 'bg-red-200' : 'bg-gray-200'} opacity-20`}
          />
          
          {/* 实际点 */}
          <div
            className={`w-3/4 h-3/4 rounded-full transition-all duration-300
              ${color === 'red' ? 'bg-red-500' : 'bg-gray-900'}
              ${canDelete ? 'group-hover:scale-90' : ''}
              shadow-lg
            `}
          >
            {/* 高光效果 */}
            <div className="top-1 left-2 w-2 h-2 bg-white rounded-full opacity-30"></div>
          </div>

          {/* 删除按钮 */}
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="inset-0 flex items-center justify-center opacity-0 
                group-hover:opacity-100 transition-all duration-300"
            >
              <div className="p-1 rounded-full bg-red-500 shadow-lg 
                transform group-hover:scale-110 transition-transform duration-200">
                <FiX className="w-5 h-5 text-white" />
              </div>
            </button>
          )}
        </div>
      )}

      {/* 下一个位置指示器 */}
      {isNext && !color && (
        <div className="inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
        </div>
      )}
    </div>
  );
};
