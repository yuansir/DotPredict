import { useCallback, useRef, useEffect } from 'react';
import { GameState, DotColor } from '../types';
import { useAlert } from '../contexts/AlertContext';

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
  
  // 使用 ref 跟踪最新的游戏状态
  const latestGameStateRef = useRef<GameState>(gameState);
  
  // 更新 ref 以跟踪最新的游戏状态
  useEffect(() => {
    latestGameStateRef.current = gameState;
  }, [gameState]);

  // 包装保存函数，添加错误提示
  const saveWithErrorHandling = useCallback(async (state: GameState) => {
    try {
      console.log('[DEBUG] saveWithErrorHandling - 开始保存游戏状态:', {
        historyLength: state.history.length,
        time: new Date().toISOString()
      });
      await saveGameState(state);
    } catch (error) {
      console.error('保存游戏状态出错:', error);
      showAlert('保存游戏状态失败，请重试', 'error');
    }
  }, [saveGameState, showAlert]);

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
    // 我们需要使用延时来确保在状态更新后保存
    setTimeout(() => {
      // 使用 ref 获取最新的游戏状态
      const currentGameState = latestGameStateRef.current;
      
      console.log('[DEBUG] handleColorSelect - 放置球后准备保存:', {
        historyLength: currentGameState.history.length,
        time: new Date().toISOString()
      });
      
      // 使用防抖保存最新状态
      if (currentGameState.history.length > 0) {
        // 直接保存，不使用防抖
        saveWithErrorHandling(currentGameState);
        console.log('[DEBUG] handleColorSelect - 已触发保存操作');
      } else {
        console.warn('[DEBUG] handleColorSelect - 未触发保存操作，因为历史记录为空');
      }
    }, 100); // 增加延时，确保状态已更新
  }, [addColorToMatrix, saveWithErrorHandling, gameState]);

  /**
   * 处理撤销操作
   */
  const handleUndo = useCallback(async () => {
    if (gameState.isViewingHistory || gameState.history.length === 0) return;
    
    console.log('[DEBUG] handleUndo - 撤销前:', {
      historyLength: gameState.history.length
    });
    
    // 执行撤销
    undoLastMove();
    
    // 使用延时来确保在状态更新后保存
    setTimeout(() => {
      // 使用 ref 获取最新的游戏状态
      const currentGameState = latestGameStateRef.current;
      
      console.log('[DEBUG] handleUndo - 撤销后准备保存:', {
        historyLength: currentGameState.history.length,
        time: new Date().toISOString()
      });
      
      // 直接保存，不使用防抖
      saveWithErrorHandling(currentGameState);
      console.log('[DEBUG] handleUndo - 已触发保存操作');
    }, 100); // 增加延时，确保状态已更新
  }, [undoLastMove, saveWithErrorHandling, gameState]);

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
      
      // 如果是管理员且操作成功，显示成功消息
      // 如果是普通用户，不显示错误消息，因为本地UI已经清空
      if (success) {
        showAlert('数据已成功清空', 'info');
      } else {
        // 不显示错误消息，因为对于普通用户来说，本地UI已经清空
        // 这是预期行为，不是错误
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
      console.log(`[DEBUG] 切换模式: ${gameState.isViewingHistory ? '预览' : '录入'} -> ${isViewing ? '预览' : '录入'}, 用户操作: ${isUserAction}, 历史记录长度: ${gameState.history.length}`);
      
      // 如果是用户手动切换模式，更新用户模式覆盖标志
      if (isUserAction && setUserModeOverride) {
        setUserModeOverride(true);
        console.log('[DEBUG] 用户手动切换模式，已设置模式覆盖标志');
      }
      
      const updatedState: GameState = {
        ...gameState,
        isViewingHistory: isViewing
      };
      
      console.log('[DEBUG] 更新游戏状态前:', {
        isViewingHistory: gameState.isViewingHistory,
        historyLength: gameState.history.length
      });
      
      setGameState(updatedState);
      
      console.log('[DEBUG] 更新游戏状态后:', {
        isViewingHistory: updatedState.isViewingHistory,
        historyLength: updatedState.history.length
      });
    } else {
      console.log(`[DEBUG] 模式未变化: ${isViewing ? '预览' : '录入'}, 跳过更新`);
    }
  }, [setGameState, gameState, setUserModeOverride]);

  return {
    handleColorSelect,
    handleUndo,
    handleClear,
    toggleHistoryMode
  };
}
