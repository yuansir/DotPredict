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
    if (windowStart > 0) {
      const newStart = windowStart - windowSize;
      onWindowChange(Math.max(0, newStart));
    }
  };

  const handleNext = () => {
    const nextStart = windowStart + windowSize;
    if (nextStart < totalMoves) {
      onWindowChange(nextStart);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    const targetPage = Math.floor((totalPages - 1) * value / 100);
    const newStart = targetPage * windowSize;
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
              : 'hover:bg-gray-100'
          }`}
        >
          <BiChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-sm text-gray-500">
          第 {currentPage} 页, 共 {totalPages} 页 ({windowStart + 1}-{Math.min(windowStart + windowSize, totalMoves)}/{totalMoves})
        </div>
        <div className="flex gap-2">
          {isViewingHistory && (
            <button
              onClick={onReturnToLatest}
              className="p-1 rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              <IoReturnDownBack className="w-6 h-6" />
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={windowStart + windowSize >= totalMoves}
            className={`p-1 rounded-lg transition-all duration-200 ${
              windowStart + windowSize >= totalMoves
                ? 'text-gray-400 cursor-not-allowed'
                : 'hover:bg-gray-100'
            }`}
          >
            <BiChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
