import React from 'react';
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import { IoReturnDownBack } from 'react-icons/io5';

interface TimelineProps {
  totalMoves: number;
  windowStart: number;
  windowSize: number;
  onWindowChange: (start: number) => void;
  onReturnToLatest: () => void;
  isViewingHistory: boolean;
}

export const Timeline: React.FC<TimelineProps> = ({
  totalMoves,
  windowStart,
  windowSize,
  onWindowChange,
  onReturnToLatest,
  isViewingHistory,
}) => {
  const totalPages = Math.ceil(totalMoves / windowSize);
  const currentPage = Math.floor(windowStart / windowSize) + 1;
  const maxStart = Math.max(0, totalMoves - windowSize);

  const handlePrevious = () => {
    const newStart = Math.max(0, windowStart - windowSize);
    onWindowChange(newStart);
  };

  const handleNext = () => {
    const newStart = Math.min(maxStart, windowStart + windowSize);
    onWindowChange(newStart);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    const newStart = Math.floor((maxStart * value) / 100);
    // 确保 newStart 是 windowSize 的整数倍
    const alignedStart = Math.floor(newStart / windowSize) * windowSize;
    onWindowChange(alignedStart);
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between px-2">
        <button
          onClick={handlePrevious}
          disabled={windowStart === 0}
          className={`p-1 rounded-lg transition-all duration-200 ${
            windowStart === 0
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-blue-600 hover:bg-blue-50'
          }`}
          title="查看前一页"
        >
          <BiChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex-1 mx-4">
          <input
            type="range"
            min="0"
            max="100"
            value={(windowStart / maxStart) * 100 || 0}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <button
          onClick={handleNext}
          disabled={windowStart >= maxStart}
          className={`p-1 rounded-lg transition-all duration-200 ${
            windowStart >= maxStart
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-blue-600 hover:bg-blue-50'
          }`}
          title="查看后一页"
        >
          <BiChevronRight className="w-6 h-6" />
        </button>

        {isViewingHistory && (
          <button
            onClick={onReturnToLatest}
            className="ml-2 p-1 rounded-lg transition-all duration-200 text-green-600 hover:bg-green-50"
            title="返回到最新状态"
          >
            <IoReturnDownBack className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="text-center text-sm text-gray-500">
        {isViewingHistory ? (
          <span>
            第 {currentPage} 页，共 {totalPages} 页 
            ({windowStart + 1} - {Math.min(windowStart + windowSize, totalMoves)}/{totalMoves})
          </span>
        ) : (
          <span>
            {totalPages > 1 ? `第 ${totalPages} 页` : ''} 
            {totalMoves === windowSize ? ' (即将开始新页面)' : ''}
          </span>
        )}
      </div>
    </div>
  );
};
