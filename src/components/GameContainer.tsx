import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { useGameContext } from '../contexts/GameContext';
import { ControlPanel } from './ControlPanel';
import { useAlert } from '../contexts/AlertContext';
import { MatrixPagination } from './MatrixPagination';
import { Position } from '../types';
import PredictionArea from './PredictionArea'; // 导入预测区域组件

/**
 * GameContainer组件 - 游戏主容器，管理游戏界面和交互
 */
export const GameContainer: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    gameState,
    availableSessions,
    currentSessionId,
    // isLoading, // 未使用变量
    // matrixData, // 未使用变量
    nextPosition,
    totalPages,
    currentPageMatrix,
    // matrixTotalPages, // 未使用变量
    matrixCurrentPage,
    handleSessionChange,
    handleColorSelect,
    handleUndo,
    handleClear,
    toggleHistoryMode,
    endCurrentSession,
    continuityPredictions,
    continuityPredictionRow,
    predictionUpdateId,
    rulePredictions       // 添加规则预测数据
    // rulePredictionRow  // 未使用变量
  } = useGameContext();

  const { showAlert } = useAlert();

  // 控制规则说明区域显示/隐藏的状态
  const [showRules, setShowRules] = useState(true);

  // 处理完成编辑的函数 - 暂时未使用
  // const handleFinishEdit = () => {
  //   if (endCurrentSession) {
  //     endCurrentSession();
  //   }
  // };

  // 创建一个预览模式检查包装函数
  const withPreviewCheck = (action: Function, actionName: string) => {
    return (...args: any[]) => {
      if (gameState.isViewingHistory) {
        showAlert(`当前处于预览模式，${actionName}功能不可用。请切换到录入模式后再试。`, 'warning');
        return;
      }
      action(...args);
    };
  };

  // 包装各个操作函数
  const safeHandleColorSelect = withPreviewCheck(handleColorSelect, '颜色选择');
  const safeHandleUndo = withPreviewCheck(handleUndo, '撤销');
  const safeHandleClear = withPreviewCheck(handleClear, '清空数据');
  const safeEndCurrentSession = withPreviewCheck(endCurrentSession, '终止输入');

  // 处理点击矩阵中的点的函数
  const handleDotClick = useCallback((position: { row: number, col: number }) => {
    if (gameState.isViewingHistory) return;

    // 判断当前位置是否有颜色
    const currentColor = currentPageMatrix[position.row]?.[position.col];

    // 如果有颜色，切换为相反颜色；如果没有颜色，默认选择黑色
    const newColor = currentColor === 'red' ? 'black' : 'red';

    // 调用颜色选择处理函数
    safeHandleColorSelect(newColor);
  }, [gameState.isViewingHistory, currentPageMatrix, safeHandleColorSelect]);

  // 处理预测颜色数据转换
  const continuityPredictionColors = useMemo(() => {
    return continuityPredictions || [null, null, null];
  }, [continuityPredictions]);

  // 处理规则预测颜色数据转换
  const rulePredictionColors = useMemo(() => {
    return rulePredictions || [null, null, null];
  }, [rulePredictions]);

  // 当前预测行索引
  const currentPredictionRow = useMemo(() => {
    return continuityPredictionRow;
  }, [continuityPredictionRow]);

  // 构建矩阵
  const matrix = useMemo(() => {
    // 定义每页列数常量
    const COLS_PER_PAGE = 24; // 每页显示24列

    // 调试输出nextPosition的值
    // console.log('[DEBUG] GameContainer - 当前nextPosition:', nextPosition, '当前页码:', matrixCurrentPage, '当前页起始列:', (matrixCurrentPage - 1) * COLS_PER_PAGE);

    // 计算当前页的起始列
    const pageStartCol = (matrixCurrentPage - 1) * COLS_PER_PAGE;

    // 全局坐标转换为页内坐标的函数
    const globalToLocalPosition = (globalPos: Position | null): Position | null => {
      if (!globalPos) return null;
      return {
        row: globalPos.row,
        col: globalPos.col - pageStartCol
      };
    };

    // 检查全局坐标是否在当前页面范围内
    const isPositionInCurrentPage = (globalPos: Position | null): boolean => {
      if (!globalPos) return false;
      const localPos = globalToLocalPosition(globalPos);
      return localPos !== null && localPos.col >= 0 && localPos.col < COLS_PER_PAGE;
    };

    // 使用分页后的矩阵数据
    return currentPageMatrix.map((row, rowIndex) => (
      <div key={`row-${rowIndex}`} className="flex mb-2">
        {row.map((color, colIndex) => {
          // 页内坐标
          const position = { row: rowIndex, col: colIndex };

          // 计算当前单元格的全局坐标
          const globalCol = colIndex + pageStartCol;
          // 全局位置计算 - 仅用于内部逻辑，不需要单独变量

          // 不需要计算页内坐标，因为isNext判断已经使用了isPositionInCurrentPage函数

          // 优化isNext判断，确保nextPosition存在且在当前页面内
          const isNext = Boolean(
            !gameState.isViewingHistory &&
            nextPosition &&
            isPositionInCurrentPage(nextPosition) &&
            nextPosition.row === rowIndex &&
            nextPosition.col === globalCol
          );

          // 当找到待输入位置时记录日志
          if (isNext) {
            // console.log('[DEBUG] GameContainer - 在矩阵中找到待输入位置:', { 
            //   position, 
            //   globalPosition, 
            //   nextPosition, 
            //   localNextPosition,
            //   pageStartCol
            // });
          }

          return (
            <div
              key={`cell-${rowIndex}-${colIndex}`}
              className={`w-8 h-8 rounded-full ${isNext ? 'border-2 border-blue-500' : 'border border-gray-300'} flex items-center justify-center mr-2 ${gameState.isViewingHistory ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
              onClick={() => handleDotClick(position)}
            >
              {color && (
                <div
                  className={`w-6 h-6 rounded-full ${color === 'red' ? 'bg-red-500' : 'bg-black'}`}
                ></div>
              )}
            </div>
          );
        })}
      </div>
    ));
  }, [currentPageMatrix, gameState.isViewingHistory, nextPosition, handleDotClick]);

  // 日志记录预测数据
  useEffect(() => {
    // console.log('[DEBUG] GameContainer - UI渲染前预测数据:', {
    //   continuityPredictionColors,
    //   currentPredictionRow,
    //   continuityPredictionsJSON: JSON.stringify(continuityPredictionColors),
    //   gameStateHistory: gameState.history.length,
    //   predictionUpdateId,
    //   renderTime: new Date().toISOString()
    // });
  }, [continuityPredictionColors, currentPredictionRow, gameState.history.length, predictionUpdateId]);

  return (
    <div className="game-container max-w-7xl mx-auto">
      {/* 标题和说明 */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">点阵预测游戏</h1>
        <p className="text-gray-600 mt-2">
          选择颜色，点击按钮自动填充下一个位置！从左边第一列开始，从上往下依次填充。
        </p>
        <p className="text-gray-500 text-sm mt-1">
          提示：点击已放置的点可以删除，或使用撤销按钮退回上一步。
        </p>
      </div>

      {/* 日期选择区域 */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center text-lg font-semibold text-gray-800 mr-4">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            日期选择
          </span>

          {/* 模式切换按钮 - 增强视觉效果 */}
          <div className="flex flex-col rounded-md shadow-sm" role="group">
            <div className="flex">
              <button
                type="button"
                onClick={() => {
                  // console.log('[DEBUG] 用户点击切换到录入模式');
                  toggleHistoryMode(false); // 切换到录入模式
                }}
                className={`px-4 py-2 text-sm font-medium 
                  ${!gameState.isViewingHistory
                    ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                  } 
                  border border-gray-300 rounded-l-lg focus:z-10 focus:ring-2 focus:ring-blue-500 focus:text-white
                  transition-all duration-200
                `}
              >
                <span className="flex items-center">
                  {!gameState.isViewingHistory && (
                    <span className="mr-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  )}
                  录入模式
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  // console.log('[DEBUG] 用户点击切换到预览模式');
                  toggleHistoryMode(true); // 切换到预览模式
                }}
                className={`px-4 py-2 text-sm font-medium 
                  ${gameState.isViewingHistory
                    ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                  } 
                  border border-gray-300 rounded-r-lg focus:z-10 focus:ring-2 focus:ring-blue-500 focus:text-white
                  transition-all duration-200
                `}
              >
                <span className="flex items-center">
                  {gameState.isViewingHistory && (
                    <span className="mr-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  )}
                  预览模式
                </span>
              </button>
            </div>

            {/* 全局模式状态指示器 */}
            <div className="text-xs text-gray-500 mt-1 text-center">
              {(() => {
                const isHistoricalDate = selectedDate !== new Date().toISOString().split('T')[0];
                return isHistoricalDate && (
                  <span className="text-xs">
                    您在查看历史数据 {selectedDate}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            className="w-full sm:w-auto px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gray-300"
            onClick={() => {
              const prevDate = new Date(selectedDate);
              prevDate.setDate(prevDate.getDate() - 1);
              setSelectedDate(prevDate.toISOString().split('T')[0]);
            }}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            前一天
          </button>

          <div className="flex-grow w-full sm:w-auto mt-2 sm:mt-0">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white mt-2 sm:mt-0"
                value={currentSessionId}
                onChange={(e) => handleSessionChange(Number(e.target.value))}
              >
                {availableSessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            className="w-full sm:w-auto px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors flex items-center justify-center mt-2 sm:mt-0 focus:outline-none focus:ring-2 focus:ring-gray-300"
            onClick={() => {
              const nextDate = new Date(selectedDate);
              nextDate.setDate(nextDate.getDate() + 1);
              setSelectedDate(nextDate.toISOString().split('T')[0]);
            }}
          >
            后一天
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>

        <div className="mt-3 text-sm text-gray-500 flex items-center flex-wrap">
          <span>
            {new Date(selectedDate).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </span>
          {selectedDate === new Date().toISOString().split('T')[0] && (
            <span className="ml-2 text-green-500 font-medium text-sm px-2 py-0.5 bg-green-50 rounded-full">今天</span>
          )}
        </div>
      </div>

      {/* 连续模式预测区域 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">连续模式预测</h2>
        </div>

        {/* 矩阵分页导航 - 移到矩阵上方 */}
        {totalPages > 1 && (
          <div className="mb-4">
            <MatrixPagination />
          </div>
        )}

        {/* 主容器：包含矩阵和预测列 */}
        <div className="flex items-end">
          {/* 矩阵 */}
          <div className="flex-grow overflow-x-auto mb-6">
            <div className="matrix-container">
              {matrix}
            </div>
          </div>

          {/* 预测区域组件 */}
          <PredictionArea
            continuityPredictionColors={continuityPredictionColors}
            rulePredictionColors={rulePredictionColors}
            currentPredictionRow={currentPredictionRow}
            predictionUpdateId={predictionUpdateId}
          />
        </div>
      </div>

      {/* 基础操作和游戏规则区域 - 两栏布局 */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {/* 左侧 - 基础操作 */}
        <div className="w-full md:w-1/2">
          <ControlPanel
            selectedColor={'black' as const} // 默认选择黑色
            onColorSelect={safeHandleColorSelect}
            onUndo={safeHandleUndo}
            onClear={safeHandleClear}
            onEndSession={safeEndCurrentSession}
            totalMoves={gameState.history ? gameState.history.length : 0}
            isViewingHistory={gameState.isViewingHistory}
          />
        </div>

        {/* 右侧 - 游戏规则 */}
        <div className="w-full md:w-1/2 bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white text-center mb-4">游戏规则</h3>
          <p className="text-sm text-gray-400 text-center mb-4">点击展开查看规则</p>

          <div className="bg-gray-700 rounded-lg p-4 cursor-pointer" onClick={() => setShowRules(!showRules)}>
            <div className="flex justify-between items-center">
              <span className="text-white">{showRules ? '收起规则' : '展开规则'}</span>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={showRules ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}></path>
              </svg>
            </div>
          </div>

          {showRules && <div className="mt-4 text-gray-300 space-y-6">
            <div>
              <div className="flex items-center text-blue-400 mb-2">
                <div className="w-6 h-6 rounded-full bg-blue-400 flex items-center justify-center text-white mr-2">?</div>
                <h4 className="text-lg font-medium">了解如何玩转点阵预测游戏</h4>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center text-blue-400 mb-1">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2 text-xs">1</div>
                    <h5 className="font-medium">基本规则</h5>
                  </div>
                  <ul className="list-disc pl-8 space-y-1 text-sm">
                    <li>从左到右，从上到下依次放置点</li>
                    <li>系统会预测下一个点的颜色</li>
                    <li>蓝色边框表示下一个放置位置</li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-center text-blue-400 mb-1">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2 text-xs">2</div>
                    <h5 className="font-medium">操作说明</h5>
                  </div>
                  <ul className="list-disc pl-8 space-y-1 text-sm">
                    <li>点击颜色按钮放置点</li>
                    <li>使用撤销按钮或Ctrl+Z撤销</li>
                    <li>日期选择和分页按钮查看历史</li>
                  </ul>
                </div>
                {/* 
                <div>
                  <div className="flex items-center text-blue-400 mb-1">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2 text-xs">3</div>
                    <h5 className="font-medium">75% 规则模式</h5>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    <div className="flex flex-col items-center">
                      <div className="flex flex-col gap-1 mb-1">
                        <div className="w-4 h-4 rounded-full bg-black"></div>
                        <div className="w-4 h-4 rounded-full bg-black"></div>
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      </div>
                      <span className="text-xs text-center">黑黑→红<br />(75%)</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex flex-col gap-1 mb-1">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <div className="w-4 h-4 rounded-full bg-black"></div>
                      </div>
                      <span className="text-xs text-center">红红→黑<br />(75%)</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex flex-col gap-1 mb-1">
                        <div className="w-4 h-4 rounded-full bg-black"></div>
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      </div>
                      <span className="text-xs text-center">黑红→红<br />(75%)</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex flex-col gap-1 mb-1">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <div className="w-4 h-4 rounded-full bg-black"></div>
                        <div className="w-4 h-4 rounded-full bg-black"></div>
                      </div>
                      <span className="text-xs text-center">红黑→黑<br />(75%)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center text-yellow-400 mb-1">
                    <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center text-white mr-2 text-xs">4</div>
                    <h5 className="font-medium">25% 规则模式</h5>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    <div className="flex flex-col items-center">
                      <div className="flex flex-col gap-1 mb-1">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      </div>
                      <span className="text-xs text-center">红红→红<br />(25%)</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex flex-col gap-1 mb-1">
                        <div className="w-4 h-4 rounded-full bg-black"></div>
                        <div className="w-4 h-4 rounded-full bg-black"></div>
                        <div className="w-4 h-4 rounded-full bg-black"></div>
                      </div>
                      <span className="text-xs text-center">黑黑→黑<br />(25%)</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex flex-col gap-1 mb-1">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <div className="w-4 h-4 rounded-full bg-black"></div>
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      </div>
                      <span className="text-xs text-center">红黑→红<br />(25%)</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex flex-col gap-1 mb-1">
                        <div className="w-4 h-4 rounded-full bg-black"></div>
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <div className="w-4 h-4 rounded-full bg-black"></div>
                      </div>
                      <span className="text-xs text-center">黑红→黑<br />(25%)</span>
                    </div>
                  </div>
                </div> */}
              </div>
            </div>
          </div>}
        </div>
      </div>
    </div>
  );
};
