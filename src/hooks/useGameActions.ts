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
  clearCurrentSessionData: () => Promise<boolean>,
  setUserModeOverride?: (override: boolean) => void
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
    
    // console.log('[DEBUG] handleColorSelect - 放置球前:', {
    //   historyLength: gameState.history.length,
    //   color
    // });
    
    // 添加颜色到矩阵
    addColorToMatrix(color);
    
    // 由于addColorToMatrix会调用setGameState更新状态，
    // 我们需要使用延时来确保在状态更新后保存
    setTimeout(() => {
      // 使用防抖保存最新状态
      debouncedSave(gameState);
      
      // console.log('[DEBUG] handleColorSelect - 放置球后:', {
      //   historyLength: gameState.history.length
      // });
    }, 0);
  }, [addColorToMatrix, debouncedSave, setGameState]);

  /**
   * 处理撤销操作
   */
  const handleUndo = useCallback(async () => {
    if (gameState.isViewingHistory || gameState.history.length === 0) return;
    
    // 执行撤销
    undoLastMove();
    
    // 使用延时来确保在状态更新后保存
    setTimeout(() => {
      // 使用防抖保存最新状态
      debouncedSave(gameState);
    }, 0);
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
   * @param isViewing 是否查看历史（预览模式）
   * @param isUserAction 是否是用户手动切换，默认为true
   */
  const toggleHistoryMode = useCallback((isViewing: boolean, isUserAction: boolean = true) => {
    // 只有当模式确实改变时才更新状态
    if (gameState.isViewingHistory !== isViewing) {
      console.log(`切换模式: ${gameState.isViewingHistory ? '预览' : '录入'} -> ${isViewing ? '预览' : '录入'}, 用户操作: ${isUserAction}`);
      
      // 如果是用户手动切换模式，更新用户模式覆盖标志
      if (isUserAction && setUserModeOverride) {
        setUserModeOverride(true);
        console.log('用户手动切换模式，已设置模式覆盖标志');
      }
      
      const updatedState: GameState = {
        ...gameState,
        isViewingHistory: isViewing
      };
      setGameState(updatedState);
    }
  }, [setGameState, gameState.isViewingHistory, setUserModeOverride]);

  return {
    handleColorSelect,
    handleUndo,
    handleClear,
    toggleHistoryMode
  };
}
