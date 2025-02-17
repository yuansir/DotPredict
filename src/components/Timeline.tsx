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
  const maxStart = Math.max(0, totalMoves - windowSize);
  const progress = totalMoves === 0 ? 0 : (windowStart / maxStart) * 100;

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
    const newStart = Math.round((maxStart * value) / 100);
    onWindowChange(newStart);
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
          title="查看前面的历史"
        >
          <BiChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex-1 mx-4">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
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
          title="查看后面的历史"
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
            正在查看历史记录 ({windowStart + 1} - {Math.min(windowStart + windowSize, totalMoves)}/{totalMoves})
          </span>
        ) : (
          <span>当前显示最新状态</span>
        )}
      </div>
    </div>
  );
};
