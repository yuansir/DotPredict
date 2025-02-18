import React from 'react';
import { DotColor, Position } from '../types';
import { Cell } from './Cell';
import { Timeline } from './Timeline';

interface GameBoardProps {
  grid: (DotColor | null)[][];
  onCellClick: (position: Position) => void;
  onCellDelete: (position: Position) => void;
  predictedPosition: Position | null;
  predictedColor: DotColor | null;
  nextPosition: Position | null;
  lastPosition: Position | null;
  windowStart: number;
  totalMoves: number;
  onWindowChange: (start: number) => void;
  onReturnToLatest: () => void;
  isViewingHistory: boolean;
}

const WINDOW_SIZE = 64; // 8x8 网格

export const GameBoard: React.FC<GameBoardProps> = ({
  grid,
  onCellClick,
  onCellDelete,
  predictedPosition,
  predictedColor,
  nextPosition,
  windowStart,
  totalMoves,
  onWindowChange,
  onReturnToLatest,
  isViewingHistory,
}) => {
  const renderCell = (row: number, col: number) => {
    const color = grid[row][col];
    const isPredicted = Boolean(
      predictedPosition &&
      predictedPosition.row === row &&
      predictedPosition.col === col
    );
    const isNext = Boolean(nextPosition && nextPosition.row === row && nextPosition.col === col);
    const canDelete = !isViewingHistory && color !== null && !isNext;

    return (
      <Cell
        key={`${row}-${col}`}
        color={color}
        onClick={() => onCellClick({ row, col })}
        onDelete={() => onCellDelete({ row, col })}
        isPredicted={isPredicted}
        predictedColor={predictedColor}
        isNext={isNext}
        canDelete={canDelete}
      />
    );
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-lg p-4 md:p-6 space-y-4">
      {/* 时间轴 */}
      <Timeline
        windowStart={windowStart}
        totalMoves={totalMoves}
        windowSize={WINDOW_SIZE}
        onWindowChange={onWindowChange}
        onReturnToLatest={onReturnToLatest}
        isViewingHistory={isViewingHistory}
      />

      {/* 游戏面板 */}
      <div className="relative aspect-square w-full">
        {/* 背景网格 */}
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
          {Array.from({ length: 64 }).map((_, i) => (
            <div
              key={i}
              className="border border-gray-100"
            />
          ))}
        </div>

        {/* 点阵内容 */}
        <div className="relative grid grid-cols-8 grid-rows-8 gap-0">
          {grid.map((row, rowIndex) =>
            row.map((_, colIndex) => renderCell(rowIndex, colIndex))
          )}
        </div>
      </div>
    </div>
  );
};
