import React, { useEffect } from 'react';
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

const WINDOW_SIZE = 24; // 时间轴长度（总列数）

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
  // 调试输出nextPosition的值
  useEffect(() => {
    // console.log('[DEBUG] GameBoard - 渲染时的nextPosition:', nextPosition, '当前窗口起始列:', windowStart);
  }, [nextPosition, windowStart]);

  // 全局坐标转换为页内坐标的函数
  const globalToLocalPosition = (globalPos: Position | null): Position | null => {
    if (!globalPos) return null;
    return {
      row: globalPos.row,
      col: globalPos.col - windowStart
    };
  };

  // 检查全局坐标是否在当前页面范围内
  const isPositionInCurrentPage = (globalPos: Position | null): boolean => {
    if (!globalPos) return false;
    const localPos = globalToLocalPosition(globalPos);
    return localPos.col >= 0 && localPos.col < WINDOW_SIZE;
  };

  // 渲染单元格
  const renderCell = (row: number, col: number) => {
    // 获取格子状态
    const color = grid[row][col];
    
    // 计算当前单元格的全局坐标
    const globalCol = col + windowStart;
    const globalPosition = { row, col: globalCol };
    
    // 计算nextPosition的页内坐标
    const localNextPosition = globalToLocalPosition(nextPosition);
    
    // 判断是否是预测位置（使用全局坐标比较）
    const isPredicted = Boolean(
      predictedPosition &&
      predictedPosition.row === row &&
      predictedPosition.col === globalCol
    );
    
    // 判断是否是下一个输入位置（待输入位置）- 使用全局坐标比较
    const isNext = Boolean(
      // 确保不是预览模式
      !isViewingHistory && 
      // 确保nextPosition存在且在当前页面内
      nextPosition !== null && 
      isPositionInCurrentPage(nextPosition) &&
      // 确保行匹配
      nextPosition.row === row && 
      // 确保列匹配（使用全局坐标比较）
      nextPosition.col === globalCol
    );
    
    // 调试输出isNext状态
    if (isNext) {
      // console.log('[DEBUG] GameBoard - 找到待输入位置:', { 
      //   row, 
      //   col, 
      //   globalCol, 
      //   nextPosition,
      //   localNextPosition,
      //   windowStart,
      //   isMatch: nextPosition && nextPosition.row === row && nextPosition.col === globalCol
      // });
    }
    
    // 确定是否可以删除
    const canDelete = !isViewingHistory && color !== null && (!isNext || !isRecordMode);

    // 渲染Cell组件
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

  // 查找第一个可用的Tailwind grid-cols类（确保布局正确）
  const getGridColsClass = () => {
    // 检查是否有自定义的grid-cols-24类，如果没有则回退到grid-cols-12 + cols-span-2
    return "grid-cols-24 grid-rows-3";
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
        {/* 背景网格 - 3行24列的显示区域 */}
        <div className={`absolute inset-0 grid ${getGridColsClass()}`}>
          {Array.from({ length: 72 }).map((_, i) => (
            <div
              key={i}
              className="border border-gray-100"
            />
          ))}
        </div>

        {/* 点阵内容 - 3行24列的显示区域 */}
        <div className={`relative grid ${getGridColsClass()} gap-0`}>
          {grid.map((row, rowIndex) =>
            row.map((_, colIndex) => 
              renderCell(rowIndex, colIndex)
            )
          )}
        </div>
      </div>
    </div>
  );
};
