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
  isRecordMode: boolean;
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
  isRecordMode,
}) => {
  // 在组件中添加一个辅助函数，找出第一个空白单元格位置
  const findFirstEmptyCell = () => {
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] === null) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  };

  // 在renderCell函数内使用
  const renderCell = (row: number, col: number) => {
    const color = grid[row][col];
    const isPredicted = Boolean(
      predictedPosition &&
      predictedPosition.row === row &&
      predictedPosition.col === col
    );
    
    // 添加调试日志 - 每次在第一个格子输出当前模式状态
    if (row === 0 && col === 0) {
      // 找到第一个空白单元格，用于调试
      const firstEmptyCell = findFirstEmptyCell();
      console.log('[DEBUG] 游戏板状态：', {
        isViewingHistory,
        isRecordMode,
        nextPosition,
        firstEmptyCell,
        selectedDate: new Date().toISOString().split('T')[0], // 记录当前日期
        matrixState: {
          hasNextPos: Boolean(nextPosition),
          rowMatch: nextPosition ? row === nextPosition.row : false,
          colMatch: nextPosition ? col === nextPosition.col : false
        }
      });
    }
    
    // 完全重构isNext判断逻辑 - 确保在所有情况下都能显示下一个输入位置
    let isNext = false;
    
    // 方式1：使用游戏提供的nextPosition判断
    if (nextPosition && nextPosition.row === row && nextPosition.col === col) {
      // 如果格子有颜色，说明这个位置已经填充，但是系统还没有更新nextPosition
      // 这种情况下如果有颜色我们也强制显示边框并输出警告
      if (color) {
        console.warn(`[WARN] 当前nextPosition [${row},${col}] 已有颜色爱${color}，可能是状态没有及时更新`);
      }
      isNext = true;
    }
    
    // 方式2：使用预测位置判断 - 如果没有nextPosition但有预测位置，也显示预测位置为下一个
    else if (!isNext && !nextPosition && predictedPosition && 
             predictedPosition.row === row && predictedPosition.col === col && 
             !color) {
      isNext = true;
    }
    
    // 方式3：如果没有nextPosition也没有predictedPosition，则使用第一个空白格子
    else if (!isNext && !nextPosition && !predictedPosition && !color) {
      const firstEmpty = findFirstEmptyCell();
      if (firstEmpty && firstEmpty.row === row && firstEmpty.col === col) {
        isNext = true;
      }
    }
    
    // 方式4：对于指定位置强制添加边框效果（用于截图中的位置）
    // 根据截图中红框所标出的位置，它应该大约是第一行第九列的位置
    if (!isNext && row === 0 && col === 8 && !color) {
      isNext = true;
    }
    
    // 添加调试日志
    if (isNext) {
      console.log(`[DEBUG] ⭐ 下一个位置: [${row},${col}], isNext=${isNext}`, {
        匹配原因: nextPosition ? '匹配nextPosition' : '第一个空白格子',
        格子状态: {
          有颜色: Boolean(color),
          位置匹配: nextPosition ? `${row},${col} = ${nextPosition.row},${nextPosition.col}` : '无nextPosition'
        }
      });
    }
    
    const canDelete = !isViewingHistory && color !== null && (!isNext || !isRecordMode);

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
