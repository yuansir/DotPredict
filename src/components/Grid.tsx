import React from 'react';
import { Cell } from './Cell';
import { Position, DotColor } from '../types';

interface GridProps {
  grid: (DotColor | null)[][];
  selectedCell: Position;
  onCellClick: (row: number, col: number) => void;
  predictedCell?: Position;
  predictedColor?: DotColor;
}

export const Grid: React.FC<GridProps> = ({
  grid,
  selectedCell,
  onCellClick,
  predictedCell,
  predictedColor
}) => {
  return (
    <div className="grid grid-cols-8 gap-0.5 bg-gray-200 p-0.5 rounded-lg">
      {grid.map((row, rowIndex) => (
        row.map((cell, colIndex) => (
          <Cell
            key={`${rowIndex}-${colIndex}`}
            color={cell}
            isSelected={rowIndex === selectedCell.row && colIndex === selectedCell.col}
            isPredicted={predictedCell?.row === rowIndex && predictedCell?.col === colIndex}
            predictedColor={predictedColor}
            onClick={() => onCellClick(rowIndex, colIndex)}
          />
        ))
      ))}
    </div>
  );
};
