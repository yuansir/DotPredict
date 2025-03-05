import { useState, useEffect, useCallback } from 'react';
import { Session, GameState } from '../types';
import { gameService } from '../services/gameService';
import { useAlert } from '../contexts/AlertContext';

/**
 * useSessionManagement - 管理会话相关的状态和操作
 */
export function useSessionManagement(selectedDate: string) {
  // 会话相关状态
  const [availableSessions, setAvailableSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number>(1);
  const [isSessionEnding, setIsSessionEnding] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    history: [],
    totalPredictions: 0,
    correctPredictions: 0,
    predictionStats: [],
    isViewingHistory: false
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // 使用提示系统
  const { showAlert } = useAlert();

  /**
   * 加载可用会话列表
   */
  const loadAvailableSessions = useCallback(async () => {
    try {
      const sessions = await gameService.getAvailableSessions(selectedDate);
      setAvailableSessions(sessions);
      return sessions;
    } catch (error) {
      console.error('Error loading available sessions:', error);
      return [];
    }
  }, [selectedDate]);

  /**
   * 获取最新会话ID，如果不存在则初始化日期记录
   */
  const fetchLatestSessionId = useCallback(async () => {
    try {
      const latestId = await gameService.getLatestSessionId(selectedDate);
      
      // 如果没有找到会话，创建第一个会话记录
      if (latestId === 0 || latestId === null) {
        console.log('未找到现有会话，初始化日期记录');
        // 初始化日期记录
        await gameService.initializeDailyRecord(selectedDate, 1);
        return 1;
      }
      
      // 返回下一个会话ID (当前最大ID + 1)
      const nextSessionId = latestId + 1;
      console.log(`获取到最新会话ID: ${latestId}，下一个会话ID: ${nextSessionId}`);
      return nextSessionId;
    } catch (error) {
      console.error('Error fetching latest session ID:', error);
      // 错误时也初始化数据
      await gameService.initializeDailyRecord(selectedDate, 1);
      return 1; // 默认从1开始
    }
  }, [selectedDate]);

  /**
   * 加载会话数据，确保状态一致性
   */
  const loadSessionData = useCallback(async (sessionId?: number) => {
    setIsLoading(true);
    try {
      // 如果没有指定会话ID，加载默认会话
      const actualSessionId = sessionId === undefined ? currentSessionId : sessionId;
      
      // 获取当前的会话列表状态
      const currentSessions = [...availableSessions];
      
      // 检查是否是"新一轮输入中"会话
      const isNewSession = currentSessions.some(s => 
        s.id === actualSessionId && s.label === '新一轮输入中');
      
      console.log('加载会话数据:', { 
        selectedDate, 
        sessionId: actualSessionId, 
        isNewSession 
      });
      
      // 统一加载逻辑，使用相同的加载函数
      const loadedGameState = await gameService.loadGameStateByDateAndSession(
        selectedDate, 
        actualSessionId
      );
      
      // 更新游戏状态
      if (loadedGameState) {
        setGameState(loadedGameState);
      } else {
        // 如果没有数据，重置为空状态
        setGameState({
          history: [],
          totalPredictions: 0,
          correctPredictions: 0,
          predictionStats: [],
          isViewingHistory: false
        });
      }
      
      return loadedGameState;
    } catch (error) {
      console.error('Error loading session data:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, currentSessionId, availableSessions]);

  /**
   * 会话变更处理函数
   */
  const handleSessionChange = useCallback(async (sessionId: number) => {
    setIsLoading(true);
    try {
      // 先更新当前会话ID
      setCurrentSessionId(sessionId);
      
      // 确保状态更新完成后再加载数据
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // 然后加载数据
      await loadSessionData(sessionId);
    } catch (error) {
      console.error('Error changing session:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadSessionData]);

  /**
   * 保存游戏状态
   */
  const saveGameState = useCallback(async (state: GameState) => {
    try {
      await gameService.saveGameState(state, selectedDate, currentSessionId);
      return true; // 返回成功标志
    } catch (error) {
      console.error('Error saving game state:', error);
      return false; // 返回失败标志
    }
  }, [selectedDate, currentSessionId]);

  /**
   * 清空当前会话数据
   */
  const clearCurrentSessionData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 清空服务端数据
      const result = await gameService.clearSessionData(selectedDate, currentSessionId);
      
      // 清空本地状态
      setGameState({
        history: [],
        totalPredictions: 0,
        correctPredictions: 0,
        predictionStats: [],
        isViewingHistory: false
      });
      
      // 如果操作成功且获得了新的会话ID
      if (result.success && result.latestSessionId) {
        // 重新加载会话列表
        await loadAvailableSessions();
        
        // 设置新的会话ID
        setCurrentSessionId(result.latestSessionId);
        
        showAlert('数据已成功清空', 'info');
      } else if (!result.success) {
        showAlert('清空数据失败，请重试', 'error');
      }
      
      return result.success; // 返回成功标志
    } catch (error) {
      console.error('Error clearing session data:', error);
      showAlert('清空数据失败，请重试', 'error');
      return false; // 返回失败标志
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, currentSessionId, loadAvailableSessions, showAlert]);

  /**
   * 结束当前会话
   */
  const endCurrentSession = useCallback(async () => {
    setIsSessionEnding(true);
    try {
      await gameService.endSession(selectedDate, currentSessionId);
      
      // 更新可用会话列表
      await loadAvailableSessions();
      
      // 获取新的会话ID
      const newSessionId = await fetchLatestSessionId();
      if (newSessionId) {
        setCurrentSessionId(newSessionId);
        
        // 清空游戏状态
        setGameState({
          history: [],
          totalPredictions: 0,
          correctPredictions: 0,
          predictionStats: [],
          isViewingHistory: false
        });
        
        // 添加成功提示
        showAlert('本轮输入已成功终止', 'info');
      } else {
        showAlert('终止输入后无法获取新会话ID', 'warning');
      }
    } catch (error) {
      console.error('Error ending session:', error);
      showAlert('终止输入失败，请重试', 'error');
    } finally {
      setIsSessionEnding(false);
      setIsLoading(false);
    }
  }, [selectedDate, currentSessionId, loadAvailableSessions, fetchLatestSessionId, showAlert]);

  // 初始化会话和加载数据
  useEffect(() => {
    const initializeSession = async () => {
      setIsLoading(true);
      try {
        // 1. 先加载可用会话
        const sessions = await loadAvailableSessions();
        
        // 2. 获取最新会话ID
        const latestId = await fetchLatestSessionId();
        setCurrentSessionId(latestId);
        
        // 3. 确保状态已更新
        setAvailableSessions(sessions);
        
        // 4. 等待一个微任务，确保状态更新完成
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // 5. 使用已确认的数据加载会话
        await loadSessionData(latestId);
      } catch (error) {
        console.error('Error initializing session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [selectedDate]); // 仅在日期变更时重新初始化

  return {
    // 状态
    gameState,
    availableSessions,
    currentSessionId,
    isLoading,
    isSessionEnding,
    
    // 操作
    setGameState,
    saveGameState,
    clearCurrentSessionData,
    handleSessionChange,
    endCurrentSession,
    loadSessionData
  };
}
