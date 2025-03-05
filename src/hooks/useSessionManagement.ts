import { useState, useEffect, useCallback } from 'react';
import { Session, GameState } from '../types';
import { gameService } from '../services/gameService';

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
   * 获取最新会话ID
   */
  const fetchLatestSessionId = useCallback(async () => {
    try {
      const latestId = await gameService.getLatestSessionId(selectedDate);
      return latestId + 1; // 返回下一个可用ID（新会话）
    } catch (error) {
      console.error('Error fetching latest session ID:', error);
      return 1; // 默认从1开始
    }
  }, [selectedDate]);

  /**
   * 加载会话数据
   */
  const loadSessionData = useCallback(async (sessionId?: number) => {
    setIsLoading(true);
    try {
      // 如果没有指定会话ID，加载默认会话
      const actualSessionId = sessionId === undefined ? currentSessionId : sessionId;
      
      // 检查是否是"新一轮输入中"会话
      const isNewSession = availableSessions.some(s => 
        s.id === actualSessionId && s.label === '新一轮输入中');
      
      console.log('加载会话数据:', { 
        selectedDate, 
        sessionId: actualSessionId, 
        isNewSession 
      });
      
      let loadedGameState: GameState | null;
      
      if (isNewSession) {
        // 加载未完成的当前会话数据（最新会话ID）
        loadedGameState = await gameService.loadGameStateByDateAndSession(
          selectedDate, 
          actualSessionId
        );
      } else {
        // 加载特定会话的数据
        loadedGameState = await gameService.loadGameStateByDateAndSession(
          selectedDate, 
          actualSessionId
        );
      }
      
      if (loadedGameState) {
        setGameState(loadedGameState);
      } else {
        // 如果没有数据，则初始化空状态
        setGameState({
          history: [],
          totalPredictions: 0,
          correctPredictions: 0,
          predictionStats: [],
          isViewingHistory: false
        });
      }
    } catch (error) {
      console.error('Error loading session data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, currentSessionId, availableSessions]);

  /**
   * 保存游戏状态
   */
  const saveGameState = useCallback(async (state: GameState) => {
    try {
      await gameService.saveGameState(state, selectedDate, currentSessionId);
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  }, [selectedDate, currentSessionId]);

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
      setCurrentSessionId(newSessionId);
      
      // 清空游戏状态
      setGameState({
        history: [],
        totalPredictions: 0,
        correctPredictions: 0,
        predictionStats: [],
        isViewingHistory: false
      });
      
      console.log('会话已结束，切换到新会话ID:', newSessionId);
    } catch (error) {
      console.error('Error ending session:', error);
    } finally {
      setIsSessionEnding(false);
    }
  }, [selectedDate, currentSessionId, loadAvailableSessions, fetchLatestSessionId]);

  /**
   * 处理会话变更
   */
  const handleSessionChange = useCallback((sessionId: number) => {
    setCurrentSessionId(sessionId);
    loadSessionData(sessionId);
  }, [loadSessionData]);

  // 初始化会话和加载数据
  useEffect(() => {
    const initializeSession = async () => {
      setIsLoading(true);
      try {
        // 1. 加载可用会话
        const sessions = await loadAvailableSessions();
        
        // 2. 获取最新会话ID
        const latestId = await fetchLatestSessionId();
        setCurrentSessionId(latestId);
        
        // 3. 加载会话数据
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
    handleSessionChange,
    endCurrentSession,
    loadSessionData
  };
}
