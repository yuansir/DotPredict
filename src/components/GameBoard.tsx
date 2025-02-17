import React from 'react';
import { DotColor, Position } from '../types';
import { Cell } from './Cell';

interface GameBoardProps {
  grid: (DotColor | null)[][];
  onCellClick: (position: Position) => void;
  onCellDelete: (position: Position) => void;
  predictedPosition: Position | null;
  predictedColor: DotColor | null;
  nextPosition: Position | null;
  lastPosition: Position | null;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  grid,
  onCellClick,
  onCellDelete,
  predictedPosition,
  predictedColor,
  nextPosition,
  lastPosition,
}) => {
  return (
    <div className="w-full bg-white rounded-xl shadow-lg p-4 md:p-6">
      <div className="relative aspect-square">
        {/* 背景网格 */}
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
          {Array.from({ length: 64 }).map((_, index) => (
            <div
              key={`grid-${index}`}
              className="border border-gray-200"
            />
          ))}
        </div>

        {/* 点阵内容 */}
        <div className="relative grid grid-cols-8 grid-rows-8 gap-0">
          {grid.map((row, rowIndex) =>
            row.map((color, colIndex) => {
              const position = { row: rowIndex, col: colIndex };
              const isLast = lastPosition?.row === rowIndex && lastPosition?.col === colIndex;
              const isNextPos = nextPosition?.row === rowIndex && nextPosition?.col === colIndex;
              
              return (
                <Cell
                  key={`${rowIndex}-${colIndex}`}
                  color={color}
                  onClick={() => onCellClick(position)}
                  onDelete={() => onCellDelete(position)}
                  isPredicted={
                    predictedPosition?.row === rowIndex &&
                    predictedPosition?.col === colIndex
                  }
                  predictedColor={
                    predictedPosition?.row === rowIndex &&
                    predictedPosition?.col === colIndex
                      ? predictedColor
                      : null
                  }
                  isNext={isNextPos}
                  position={position}
                  canDelete={color !== null && !isNextPos}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
