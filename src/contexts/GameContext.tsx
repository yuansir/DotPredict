import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
