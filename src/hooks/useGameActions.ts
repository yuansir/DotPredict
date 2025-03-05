import { useCallback } from 'react';
import { GameState, DotColor } from '../types';

/**
 * useGameActions - 管理游戏操作的自定义钩子
 */
export function useGameActions(
  gameState: GameState,
  setGameState: (state: GameState) => void,
  saveGameState: (state: GameState) => Promise<void>,
  addColorToMatrix: (color: DotColor) => void,
  undoLastMove: () => void,
  clearAllData: () => void
) {
  /**
   * 处理颜色选择
   */
  const handleColorSelect = useCallback(async (color: DotColor) => {
    if (gameState.isViewingHistory) return;
    
    // 添加颜色到矩阵
    addColorToMatrix(color);
    
    // 保存更新后的游戏状态
    // 注意：由于addColorToMatrix内部会更新gameState，
    // 我们需要在下一个渲染周期才能获取到更新后的gameState
    // 这里使用setTimeout作为一个简单的解决方案
    setTimeout(async () => {
      await saveGameState(gameState);
    }, 0);
  }, [gameState, addColorToMatrix, saveGameState]);

  /**
   * 处理撤销操作
   */
  const handleUndo = useCallback(async () => {
    if (gameState.isViewingHistory || gameState.history.length === 0) return;
    
    // 执行撤销
    undoLastMove();
    
    // 保存更新后的游戏状态
    setTimeout(async () => {
      await saveGameState(gameState);
    }, 0);
  }, [gameState, undoLastMove, saveGameState]);

  /**
   * 处理清空操作
   */
  const handleClear = useCallback(async () => {
    if (gameState.isViewingHistory) return;
    
    // 执行清空
    clearAllData();
    
    // 保存更新后的游戏状态
    await saveGameState({
      ...gameState,
      history: [],
    });
  }, [gameState, clearAllData, saveGameState]);

  /**
   * 切换历史查看模式
   */
  const toggleHistoryMode = useCallback((isViewing: boolean) => {
    setGameState({
      ...gameState,
      isViewingHistory: isViewing
    });
  }, [gameState, setGameState]);

  return {
    handleColorSelect,
    handleUndo,
    handleClear,
    toggleHistoryMode
  };
}
