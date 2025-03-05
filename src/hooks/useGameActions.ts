import { useCallback } from 'react';
import { GameState, DotColor } from '../types';
import { useAlert } from '../contexts/AlertContext';
import { debounce } from '../utils/debounce';

/**
 * useGameActions - 管理游戏操作的自定义钩子
 */
export function useGameActions(
  gameState: GameState,
  setGameState: (state: GameState) => void,
  saveGameState: (state: GameState) => Promise<void>,
  addColorToMatrix: (color: DotColor) => void,
  undoLastMove: () => void,
  clearAllData: () => void,
  clearCurrentSessionData: () => Promise<boolean>
) {
  // 使用全局提示系统
  const { showAlert } = useAlert();

  // 包装保存函数，添加错误提示
  const saveWithErrorHandling = useCallback(async (state: GameState) => {
    try {
      await saveGameState(state);
    } catch (error) {
      console.error('保存游戏状态出错:', error);
      showAlert('保存游戏状态失败，请重试', 'error');
    }
  }, [saveGameState, showAlert]);

  // 使用防抖包装保存函数，300ms延迟
  const debouncedSave = useCallback(
    debounce((state: GameState) => saveWithErrorHandling(state), 300),
    [saveWithErrorHandling]
  );

  /**
   * 处理颜色选择
   */
  const handleColorSelect = useCallback(async (color: DotColor) => {
    if (gameState.isViewingHistory) return;
    
    console.log('[DEBUG] handleColorSelect - 放置球前:', {
      historyLength: gameState.history.length,
      color
    });
    
    // 添加颜色到矩阵
    addColorToMatrix(color);
    
    // 由于addColorToMatrix会调用setGameState更新状态，
    // 我们需要使用回调方式获取最新状态并保存
    setGameState(currentState => {
      const updatedState = {
        ...currentState,
        // 确保历史记录正确更新
        lastUpdateTime: new Date().toISOString()
      };
      
      // 使用防抖保存最新状态
      debouncedSave(updatedState);
      
      console.log('[DEBUG] handleColorSelect - 放置球后:', {
        historyLength: updatedState.history.length,
        lastUpdateTime: updatedState.lastUpdateTime
      });
      
      // 返回更新后的状态，强制触发重渲染
      return updatedState;
    });
  }, [addColorToMatrix, debouncedSave, setGameState, gameState.history.length]);

  /**
   * 处理撤销操作
   */
  const handleUndo = useCallback(async () => {
    if (gameState.isViewingHistory || gameState.history.length === 0) return;
    
    // 执行撤销
    undoLastMove();
    
    // 使用回调获取最新状态并保存
    setGameState(currentState => {
      // 使用防抖保存最新状态
      debouncedSave(currentState);
      
      return currentState;
    });
  }, [undoLastMove, debouncedSave, setGameState]);

  /**
   * 处理清空操作
   */
  const handleClear = useCallback(async () => {
    if (gameState.isViewingHistory) return;
    
    try {
      // 清空本地UI和数据库中的所有相关数据
      const success = await clearCurrentSessionData();
      
      // 本地UI更新（在clearCurrentSessionData内部已处理）
      clearAllData();
      
      if (success) {
        showAlert('数据已成功清空', 'info');
      } else {
        showAlert('清空数据时发生错误', 'error');
      }
    } catch (error) {
      console.error('清空操作失败:', error);
      showAlert('清空数据时发生错误', 'error');
    }
  }, [clearCurrentSessionData, clearAllData, showAlert]);

  /**
   * 切换历史查看模式
   */
  const toggleHistoryMode = useCallback((isViewing: boolean) => {
    // 只有当模式确实改变时才更新状态
    if (gameState.isViewingHistory !== isViewing) {
      console.log(`切换模式: ${gameState.isViewingHistory ? '预览' : '录入'} -> ${isViewing ? '预览' : '录入'}`);
      setGameState(prevState => ({
        ...prevState,
        isViewingHistory: isViewing
      }));
    }
  }, [setGameState, gameState.isViewingHistory]);

  return {
    handleColorSelect,
    handleUndo,
    handleClear,
    toggleHistoryMode
  };
}
