import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { DotColor, Position, GameState, Move, Session } from '../types';
import { useSessionManagement } from '../hooks/useSessionManagement';
import { useMatrixManagement } from '../hooks/useMatrixManagement';
import { usePagination } from '../hooks/usePagination';
import { useGameActions } from '../hooks/useGameActions';
import { useMatrixPagination } from '../hooks/useMatrixPagination';
import { useContinuityPrediction } from '../hooks/useContinuityPrediction';

// 定义上下文类型
interface GameContextType {
  // 会话状态
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  gameState: GameState;
  availableSessions: Session[];
  currentSessionId: number;
  isLoading: boolean;
  isSessionEnding: boolean;
  
  // 矩阵状态
  matrixData: (DotColor | null)[][];
  lastPosition: Position | null;
  nextPosition: Position;
  
  // 分页状态
  currentPage: number;
  totalPages: number;
  displayItems: Move[];
  
  // 矩阵分页状态
  matrixCurrentPage: number;
  matrixTotalPages: number;
  currentPageMatrix: (DotColor | null)[][];
  currentInputPage: number;
  
  // 连续性预测状态
  continuityPredictions: (DotColor | null)[];
  continuityPredictionRow: number | null;
  predictionUpdateId: number;
  
  // 操作方法
  handleSessionChange: (sessionId: number) => void;
  endCurrentSession: () => Promise<void>;
  handleColorSelect: (color: DotColor) => void;
  handleUndo: () => void;
  handleClear: () => void;
  toggleHistoryMode: (isViewing: boolean) => void;
  
  // 历史记录分页方法
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  
  // 矩阵分页方法
  matrixGoToPage: (page: number) => void;
  matrixGoToNextPage: () => void;
  matrixGoToPreviousPage: () => void;
  matrixGoToFirstPage: () => void;
  matrixGoToLastPage: () => void;
  
  // 辅助方法
  getLastNColors: (history: Move[], n: number) => DotColor[];
  checkLastTwoColors: (row: (DotColor | null)[], rowIndex: number) => { sameColor: boolean, color: DotColor | null };
}

// 创建上下文
export const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider组件
interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  // 日期状态
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  // 游戏状态
  const [gameState, setGameState] = useState<GameState>({
    history: [],
    isViewingHistory: false,
  });
  
  // 当前会话ID
  const [currentSessionId, setCurrentSessionId] = useState<number>(0);
  
  // 会话列表
  const [availableSessions, setAvailableSessions] = useState<Session[]>([]);
  
  // 加载状态
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // 会话终止状态
  const [isSessionEnding, setIsSessionEnding] = useState<boolean>(false);

  // 预测状态管理
  const [predictionState, setPredictionState] = useState<{
    predictions: (DotColor | null)[];
    predictionRowIndex: number | null;
    updateId: number;
    lastMatrixHash: string; // 添加矩阵哈希以检测实际变化
  }>({
    predictions: [null, null, null],
    predictionRowIndex: null,
    updateId: 0,
    lastMatrixHash: ""
  });

  // 初始化会话管理
  const {
    gameState: sessionGameState,
    availableSessions: sessionAvailableSessions,
    currentSessionId: sessionCurrentSessionId,
    isLoading: sessionIsLoading,
    isSessionEnding: sessionIsSessionEnding,
    setGameState: sessionSetGameState,
    saveGameState: sessionSaveGameState,
    handleSessionChange: sessionHandleSessionChange,
    endCurrentSession: sessionEndCurrentSession,
    loadSessionData: sessionLoadSessionData,
    clearCurrentSessionData: sessionClearCurrentSessionData
  } = useSessionManagement(selectedDate);

  // 同步会话状态到本地状态
  useEffect(() => {
    setGameState(sessionGameState);
    setAvailableSessions(sessionAvailableSessions);
    setCurrentSessionId(sessionCurrentSessionId);
    setIsLoading(sessionIsLoading);
    setIsSessionEnding(sessionIsSessionEnding);
  }, [
    sessionGameState, 
    sessionAvailableSessions, 
    sessionCurrentSessionId, 
    sessionIsLoading, 
    sessionIsSessionEnding
  ]);
  
  // 初始化矩阵管理
  const {
    matrixData,
    lastPosition,
    nextPosition,
    addColorToMatrix,
    undoLastMove,
    clearAllData,
    getLastNColors,
    checkLastTwoColors
  } = useMatrixManagement(gameState, setGameState);
  
  // 初始化分页
  const {
    currentPage,
    totalPages,
    displayItems,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage
  } = usePagination(gameState.history);
  
  // 初始化矩阵分页
  const {
    currentPage: matrixCurrentPage,
    totalPages: matrixTotalPages,
    currentPageMatrix,
    currentInputPage,
    goToNextPage: matrixGoToNextPage,
    goToPreviousPage: matrixGoToPreviousPage,
    goToPage: matrixGoToPage,
    goToFirstPage: matrixGoToFirstPage,
    goToLastPage: matrixGoToLastPage
  } = useMatrixPagination(
    matrixData, 
    3, 
    24, 
    gameState.history.length,
    gameState.history,
    !gameState.isViewingHistory // 当不处于预览模式时才启用自动跳转(即输入模式时)
  );
  
  // 初始化游戏动作
  const {
    handleColorSelect,
    handleUndo,
    handleClear,
    toggleHistoryMode
  } = useGameActions(
    gameState,
    setGameState,
    sessionSaveGameState,
    addColorToMatrix,
    undoLastMove,
    clearAllData,
    sessionClearCurrentSessionData
  );

  // 计算连续性预测
  const predictionResult = useContinuityPrediction(gameState, nextPosition);

  // 计算矩阵哈希，用于检测真实变化
  const calculateMatrixHash = useCallback(() => {
    try {
      const matrixString = JSON.stringify(matrixData);
      const historyLength = gameState.history.length;
      const positionString = nextPosition ? `${nextPosition.row}-${nextPosition.col}` : "null";
      return `${matrixString.length}-${historyLength}-${positionString}`;
    } catch (e) {
      console.error("[ERROR] 计算矩阵哈希失败:", e);
      return Date.now().toString(); // 发生错误时返回时间戳
    }
  }, [matrixData, gameState.history.length, nextPosition]);

  // 添加预测状态更新逻辑
  useEffect(() => {
    // 计算当前矩阵哈希
    const currentMatrixHash = calculateMatrixHash();
    
    // 仅当矩阵实际发生变化时才更新预测
    if (currentMatrixHash !== predictionState.lastMatrixHash) {
      // 更新预测状态，确保创建新的引用
      setPredictionState(prev => ({
        predictions: [...predictionResult.predictions], // 创建新数组
        predictionRowIndex: predictionResult.predictionRowIndex,
        updateId: prev.updateId + 1,
        lastMatrixHash: currentMatrixHash
      }));
      
      console.log('[DEBUG] GameContext - 预测状态已更新:', {
        predictions: predictionResult.predictions,
        predictionRowIndex: predictionResult.predictionRowIndex,
        updateId: predictionState.updateId + 1,
        gameStateHistory: gameState.history.length,
        matrixHashChanged: currentMatrixHash !== predictionState.lastMatrixHash
      });
    }
  }, [
    predictionResult, 
    gameState.history.length, 
    nextPosition, 
    calculateMatrixHash
  ]);

  // 添加调试预测更新功能
  const DEBUG_PREDICTION = true;

  useEffect(() => {
    if (DEBUG_PREDICTION) {
      console.log('[DEBUG] 预测状态跟踪 - 历史长度变化:', {
        historyLength: gameState.history.length,
        predictions: predictionState.predictions,
        row: predictionState.predictionRowIndex,
        nextPos: nextPosition,
        updateId: predictionState.updateId,
        matrixHash: predictionState.lastMatrixHash
      });
    }
  }, [gameState.history.length, predictionState, nextPosition]);

  // 自定义方法：处理会话变化
  const handleSessionChange = useCallback((sessionId: number) => {
    sessionHandleSessionChange(sessionId);
  }, [sessionHandleSessionChange]);

  // 自定义方法：结束当前会话
  const endCurrentSession = useCallback(async () => {
    await sessionEndCurrentSession();
  }, [sessionEndCurrentSession]);

  // 添加防循环保护ref
  const processedStateRef = useRef<{
    sessionId: number;
    isViewingHistory: boolean;
    date: string;
  } | null>(null);

  // 创建状态管理ref
  const modeTransitionRef = useRef({
    isTransitioning: false,
    pendingMode: null as boolean | null,
    lastUpdate: {
      date: '',
      sessionId: 0,
      mode: false
    }
  });

  // 创建安全的模式切换函数
  const safeToggleHistoryMode = useCallback((isViewing: boolean) => {
    const current = modeTransitionRef.current;
    
    // 检查是否与上次更新相同
    if (current.lastUpdate.date === selectedDate && 
        current.lastUpdate.sessionId === currentSessionId &&
        current.lastUpdate.mode === isViewing) {
      return; // 避免重复更新
    }
    
    // 更新最后一次更新记录
    current.lastUpdate = {
      date: selectedDate,
      sessionId: currentSessionId,
      mode: isViewing
    };
    
    // 更新模式
    toggleHistoryMode(isViewing);
  }, [selectedDate, currentSessionId, toggleHistoryMode]);

  // 自动检测历史日期并切换到预览模式
  useEffect(() => {
    // 检查是否是历史日期
    const today = new Date().toISOString().split('T')[0];
    const isHistoricalDate = selectedDate !== today;
    
    // 重置状态管理ref
    modeTransitionRef.current.isTransitioning = false;
    modeTransitionRef.current.pendingMode = null;
    
    // 对于历史日期，切换到预览模式
    if (isHistoricalDate && !gameState.isViewingHistory) {
      console.log('历史日期，切换到预览模式:', selectedDate);
      safeToggleHistoryMode(true);
    }
  }, [selectedDate, gameState.isViewingHistory, safeToggleHistoryMode]);

  // 基于会话状态自动切换预览模式
  useEffect(() => {
    // 如果当前未处于加载状态，且有会话列表
    if (isLoading || availableSessions.length === 0) return;
    
    // 避免在转换中重复更新
    if (modeTransitionRef.current.isTransitioning) return;
    
    const selectedSession = availableSessions.find(s => s.id === currentSessionId);
    const isNewSession = selectedSession?.label === '新一轮输入中...';
    const today = new Date().toISOString().split('T')[0];
    const isCurrentDay = selectedDate === today;
    
    // 只有当天的"新一轮输入中"会话才是录入模式，其他都是预览模式
    const shouldBeInViewMode = !isCurrentDay || !isNewSession;
    
    // 只有当当前模式与期望模式不匹配时才切换
    if (shouldBeInViewMode !== gameState.isViewingHistory) {
      // 标记正在转换
      modeTransitionRef.current.isTransitioning = true;
      
      console.log('基于会话状态自动切换模式:', {
        shouldBeInViewMode,
        currentMode: gameState.isViewingHistory ? '预览' : '录入',
        sessionId: currentSessionId,
        isNewSession
      });
      
      // 使用安全的模式切换函数
      safeToggleHistoryMode(shouldBeInViewMode);
      
      // 延迟重置转换状态
      setTimeout(() => {
        modeTransitionRef.current.isTransitioning = false;
      }, 100);
    }
  }, [isLoading, availableSessions, currentSessionId, selectedDate, gameState.isViewingHistory, safeToggleHistoryMode]);
  
  // 提供上下文值
  const contextValue: GameContextType = {
    // 会话状态
    selectedDate,
    setSelectedDate,
    gameState,
    availableSessions,
    currentSessionId,
    isLoading,
    isSessionEnding,
    
    // 矩阵状态
    matrixData,
    lastPosition,
    nextPosition,
    
    // 分页状态
    currentPage,
    totalPages,
    displayItems,
    
    // 矩阵分页状态
    matrixCurrentPage,
    matrixTotalPages,
    currentPageMatrix,
    currentInputPage,
    
    // 连续性预测状态 - 确保使用预测状态对象中的值
    continuityPredictions: predictionState.predictions,
    continuityPredictionRow: predictionState.predictionRowIndex,
    predictionUpdateId: predictionState.updateId,
    
    // 操作方法
    handleSessionChange,
    endCurrentSession,
    handleColorSelect,
    handleUndo,
    handleClear,
    toggleHistoryMode,
    
    // 历史记录分页方法
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    
    // 矩阵分页方法
    matrixGoToPage,
    matrixGoToNextPage,
    matrixGoToPreviousPage,
    matrixGoToFirstPage,
    matrixGoToLastPage,
    
    getLastNColors,
    checkLastTwoColors
  };
  
  console.log('matrixTotalPages:', matrixTotalPages);
  console.log('currentPageMatrix:', currentPageMatrix);
  
  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

// 自定义钩子
export const useGameContext = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};
