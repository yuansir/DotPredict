import React, { useState } from 'react';
import { DotColor } from '../types';

interface CellProps {
  color: DotColor | null;
  onClick: () => void;
  onDelete?: () => void;
  isPredicted: boolean;
  predictedColor: DotColor | null;
  isNext: boolean;
  position: { row: number; col: number };
  canDelete?: boolean;
}

export const Cell: React.FC<CellProps> = ({
  color,
  onClick,
  onDelete,
  isPredicted,
  predictedColor,
  isNext,
  position,
  canDelete = false,
}) => {
  const [showDeleteButton, setShowDeleteButton] = useState(false);

  return (
    <div
      className={`
        aspect-square relative
        flex items-center justify-center
        transition-all duration-300
        ${color ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50'}
        ${isNext ? 'bg-blue-50' : ''}
        group
      `}
      onMouseEnter={() => canDelete && setShowDeleteButton(true)}
      onMouseLeave={() => setShowDeleteButton(false)}
    >
      {/* 实际的点 */}
      {color && (
        <div
          className={`
            w-5 h-5 rounded-full
            ${color === 'red' ? 'bg-red-500' : 'bg-gray-900'}
            transform transition-all duration-300
            ${isPredicted ? 'scale-110' : ''}
            ${showDeleteButton ? 'opacity-50' : ''}
            shadow-md
          `}
        />
      )}

      {/* 删除按钮 */}
      {color && canDelete && showDeleteButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className={`
            absolute inset-0 flex items-center justify-center
            bg-white bg-opacity-90 rounded-full
            transform transition-all duration-200
            hover:bg-red-50
            focus:outline-none focus:ring-2 focus:ring-red-500
          `}
          title="删除此点"
        >
          <svg
            className="w-4 h-4 text-red-500"
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
        </button>
      )}

      {/* 预测的点 */}
      {!color && isPredicted && predictedColor && (
        <div
          className={`
            w-5 h-5 rounded-full border-2
            ${
              predictedColor === 'red'
                ? 'border-red-500'
                : 'border-gray-900'
            }
            opacity-50
          `}
        />
      )}

      {/* 下一个位置指示器 */}
      {isNext && !color && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
};
