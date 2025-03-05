import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { DotColor, Position, GameState, Move, Session } from '../types';
import { useSessionManagement } from '../hooks/useSessionManagement';
import { useMatrixManagement } from '../hooks/useMatrixManagement';
import { usePagination } from '../hooks/usePagination';
import { useGameActions } from '../hooks/useGameActions';

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
  
  // 操作方法
  handleSessionChange: (sessionId: number) => void;
  endCurrentSession: () => Promise<void>;
  handleColorSelect: (color: DotColor) => void;
  handleUndo: () => void;
  handleClear: () => void;
  toggleHistoryMode: (isViewing: boolean) => void;
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
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
  
  // 初始化会话管理
  const {
    gameState,
    availableSessions,
    currentSessionId,
    isLoading,
    isSessionEnding,
    setGameState,
    saveGameState,
    handleSessionChange,
    endCurrentSession,
    loadSessionData,
    clearCurrentSessionData
  } = useSessionManagement(selectedDate);
  
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
  
  // 初始化游戏操作
  const {
    handleColorSelect,
    handleUndo,
    handleClear,
    toggleHistoryMode
  } = useGameActions(
    gameState,
    setGameState,
    saveGameState,
    addColorToMatrix,
    undoLastMove,
    clearAllData,
    clearCurrentSessionData
  );

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
    
    // 操作方法
    handleSessionChange,
    endCurrentSession,
    handleColorSelect,
    handleUndo,
    handleClear,
    toggleHistoryMode,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    getLastNColors,
    checkLastTwoColors
  };
  
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
