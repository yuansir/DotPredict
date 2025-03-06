import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { DotColor, Position, GameState, Move, Session } from '../types';
import { useSessionManagement } from '../hooks/useSessionManagement';
import { useMatrixManagement } from '../hooks/useMatrixManagement';
import { usePagination } from '../hooks/usePagination';
import { useContinuityPrediction } from '../hooks/useContinuityPrediction';
import { useRulePrediction } from '../hooks/useRulePrediction';
import { useMatrixPagination } from '../hooks/useMatrixPagination';
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
  userModeOverride: boolean; // 添加用户模式覆盖标志
  
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
  
  // 规则预测状态
  rulePredictions: (DotColor | null)[];
  rulePredictionRow: number | null;
  rulePredictionUpdateId: number;
  
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
  
  // 用户模式覆盖标志 - 记录用户是否手动切换了模式
  const [userModeOverride, setUserModeOverride] = useState<boolean>(false);
  
  // 加载状态
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // 会话终止状态
  const [isSessionEnding, setIsSessionEnding] = useState<boolean>(false);
  
  // 添加调试日志 - 记录模式状态变化
  useEffect(() => {
    console.log('[DEBUG] 模式状态:', {
      isViewingHistory: gameState.isViewingHistory,
      userModeOverride,
      recordMode: (!gameState.isViewingHistory || userModeOverride),
      selectedDate,
      isToday: selectedDate === new Date().toISOString().split('T')[0]
    });
  }, [gameState.isViewingHistory, userModeOverride, selectedDate]);

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

  // 规则预测状态管理
  const [rulePredictionState, setRulePredictionState] = useState<{
    predictions: (DotColor | null)[];
    predictionRowIndex: number | null;
    updateId: number;
    lastMatrixHash: string;
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

  // 同步会话状态到本地状态，但保留用户模式覆盖设置
  useEffect(() => {
    console.log('[DEBUG] 会话状态变更:', {
      '变更前': {
        isViewingHistory: gameState.isViewingHistory,
        userModeOverride
      },
      '变更后': {
        isViewingHistory: sessionGameState.isViewingHistory,
        userModeOverride: userModeOverride
      },
      '日期': selectedDate
    });
    
    // 如果用户强制设置了录入模式，即使切换日期或翻页，也保持在录入模式
    if (userModeOverride) {
      setGameState(prevState => ({
        ...sessionGameState,
        isViewingHistory: false // 保持在录入模式
      }));
      console.log('[DEBUG] 用户模式覆盖生效，保持录入模式');
    } else {
      setGameState(sessionGameState);
    }
    
    setAvailableSessions(sessionAvailableSessions);
    setCurrentSessionId(sessionCurrentSessionId);
    setIsLoading(sessionIsLoading);
    setIsSessionEnding(sessionIsSessionEnding);
  }, [
    sessionGameState, 
    sessionAvailableSessions, 
    sessionCurrentSessionId, 
    sessionIsLoading, 
    sessionIsSessionEnding,
    userModeOverride, // 添加依赖，确保用户模式覆盖更改时重新运行
    selectedDate
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
    sessionClearCurrentSessionData,
    setUserModeOverride // 传递用户模式覆盖设置函数
  );

  // 计算连续性预测
  const continuityResult = useContinuityPrediction(gameState, nextPosition, userModeOverride);

  // 计算规则预测
  const ruleResult = useRulePrediction(gameState, nextPosition, userModeOverride);

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
  }, [matrixData, gameState.history, nextPosition]);

  // 添加预测状态更新逻辑
  useEffect(() => {
    // 计算当前矩阵哈希
    const currentMatrixHash = calculateMatrixHash();
    
    // 仅当矩阵实际发生变化时才更新预测
    if (currentMatrixHash !== predictionState.lastMatrixHash) {
      // 更新预测状态，确保创建新的引用
      setPredictionState(prev => ({
        predictions: [...continuityResult.predictions], // 创建新数组
        predictionRowIndex: continuityResult.predictionRowIndex,
        updateId: prev.updateId + 1,
        lastMatrixHash: currentMatrixHash
      }));
      
      console.log('[DEBUG] GameContext - 预测状态已更新:', {
        predictions: continuityResult.predictions,
        predictionRowIndex: continuityResult.predictionRowIndex,
        updateId: predictionState.updateId + 1,
        gameStateHistory: gameState.history.length,
        matrixHashChanged: currentMatrixHash !== predictionState.lastMatrixHash
      });
    }
  }, [
    continuityResult, 
    gameState.history, 
    calculateMatrixHash,
    predictionState.lastMatrixHash
  ]);

  // 添加规则预测状态更新逻辑
  useEffect(() => {
    // 计算当前矩阵哈希
    const currentMatrixHash = calculateMatrixHash();
    
    // 仅当矩阵实际发生变化时才更新预测
    if (currentMatrixHash !== rulePredictionState.lastMatrixHash) {
      // 更新预测状态，确保创建新的引用
      setRulePredictionState(prev => ({
        predictions: [...ruleResult.predictions], // 创建新数组
        predictionRowIndex: ruleResult.predictionRowIndex,
        updateId: prev.updateId + 1,
        lastMatrixHash: currentMatrixHash
      }));
      
      console.log('[DEBUG] GameContext - 规则预测状态已更新:', {
        predictions: ruleResult.predictions,
        predictionRowIndex: ruleResult.predictionRowIndex,
        updateId: rulePredictionState.updateId + 1,
        gameStateHistory: gameState.history.length,
        matrixHashChanged: currentMatrixHash !== rulePredictionState.lastMatrixHash
      });
    }
  }, [
    ruleResult, 
    gameState.history, 
    calculateMatrixHash, 
    rulePredictionState.lastMatrixHash
  ]);

  // 自定义方法：处理会话变化
  const handleSessionChange = useCallback((sessionId: number) => {
    console.log('[DEBUG] 会话切换:', { 从: currentSessionId, 到: sessionId, 用户模式覆盖: userModeOverride });
    sessionHandleSessionChange(sessionId);
  }, [sessionHandleSessionChange, currentSessionId, userModeOverride]);

  // 自定义方法：结束当前会话
  const endCurrentSession = useCallback(async () => {
    console.log('[DEBUG] 结束当前会话:', { sessionId: currentSessionId, 模式: gameState.isViewingHistory ? '预览' : '录入' });
    try {
      setIsSessionEnding(true);
      await sessionEndCurrentSession();
      setIsSessionEnding(false);
    } catch (error) {
      console.error('结束会话失败:', error);
      setIsSessionEnding(false);
    }
  }, [sessionEndCurrentSession, currentSessionId, gameState.isViewingHistory, setIsSessionEnding]);

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
  const safeToggleHistoryMode = useCallback((isViewing: boolean, isUserAction: boolean = true) => {
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
    
    console.log(`安全模式切换: 目标=${isViewing ? '预览' : '录入'}, 是否用户操作=${isUserAction}`);
    
    // 更新模式并传递isUserAction参数
    toggleHistoryMode(isViewing, isUserAction);
  }, [selectedDate, currentSessionId, toggleHistoryMode]);

  // 当日期变更时的处理逻辑 - 自动重置用户模式覆盖标志
  useEffect(() => {
    console.log('[DEBUG] 日期变更事件:', {
      '当前日期': selectedDate,
      '是否为今天': selectedDate === new Date().toISOString().split('T')[0],
      '当前模式': gameState.isViewingHistory ? '预览模式' : '录入模式',
      '用户模式覆盖': userModeOverride
    });
    
    // 日期变更时重置用户模式覆盖标志
    // 这确保选择非今日日期时会默认进入预览模式
    const isDateChanged = selectedDate !== processedStateRef.current?.date;
    if (isDateChanged && userModeOverride) {
      setUserModeOverride(false);
      console.log('[DEBUG] 日期已变更，自动重置用户模式覆盖标志');
    }
    
    // 更新处理状态引用
    processedStateRef.current = {
      sessionId: currentSessionId,
      isViewingHistory: gameState.isViewingHistory,
      date: selectedDate
    };
  }, [selectedDate, gameState.isViewingHistory, userModeOverride, currentSessionId, setUserModeOverride]);
  
  // 自动检测历史日期并切换到预览模式（除非用户手动切换）
  useEffect(() => {
    // 检查是否是历史日期
    const today = new Date().toISOString().split('T')[0];
    const isHistoricalDate = selectedDate !== today;
    
    // 重置状态管理ref
    modeTransitionRef.current.isTransitioning = false;
    modeTransitionRef.current.pendingMode = null;
    
    // 对于历史日期，仅在初始时设置默认预览模式
    if (isHistoricalDate && !userModeOverride) {
      console.log('历史日期，初始化默认模式，当前模式:', gameState.isViewingHistory ? '预览模式' : '录入模式');
      // 如果当前非预览模式，切换到预览模式
      if (!gameState.isViewingHistory) {
        toggleHistoryMode(true, false); // 这是系统自动切换
      }
    }
  }, [selectedDate, toggleHistoryMode, gameState.isViewingHistory, userModeOverride]);

  // 基于会话状态自动切换预览模式
  useEffect(() => {
    // 如果当前未处于加载状态，且有会话列表
    if (isLoading || availableSessions.length === 0) return;
    
    const selectedSession = availableSessions.find(s => s.id === currentSessionId);
    const isNewSession = selectedSession?.label === '新一轮输入中...';
    const today = new Date().toISOString().split('T')[0];
    const isCurrentDay = selectedDate === today;
    
    // 如果不是当天日期，默认设置为预览模式，除非用户手动设置了模式
    // 我们已经在上面的useEffect中处理了此逻辑，所以这里可以简化
    if (!isCurrentDay) {
      return; // 当日期不是当天时，交给上面的useEffect处理
    }
    
    // 对于当天日期：只有"新一轮输入中"会话才是录入模式，其他都是预览模式
    const shouldBeInViewMode = !isNewSession;
    
    // 避免在转换中重复更新或当用户手动设置了模式时覆盖
    if (modeTransitionRef.current.isTransitioning || userModeOverride) return;
    
    // 只有当当前模式与期望模式不匹配时才切换
    if (shouldBeInViewMode !== gameState.isViewingHistory) {
      // 标记正在转换
      modeTransitionRef.current.isTransitioning = true;
      
      console.log('基于会话状态自动切换模式:', {
        shouldBeInViewMode,
        currentMode: gameState.isViewingHistory ? '预览' : '录入',
        sessionId: currentSessionId,
        isNewSession,
        isCurrentDay
      });
      
      // 使用安全的模式切换函数
      safeToggleHistoryMode(shouldBeInViewMode);
      
      // 延迟重置转换状态
      setTimeout(() => {
        modeTransitionRef.current.isTransitioning = false;
      }, 100);
    }
  }, [isLoading, availableSessions, currentSessionId, selectedDate, gameState.isViewingHistory, safeToggleHistoryMode, toggleHistoryMode]);
  
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
    userModeOverride,
    
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
    
    // 连续性预测状态
    continuityPredictions: predictionState.predictions,
    continuityPredictionRow: predictionState.predictionRowIndex,
    predictionUpdateId: predictionState.updateId,
    
    // 规则预测状态
    rulePredictions: rulePredictionState.predictions,
    rulePredictionRow: rulePredictionState.predictionRowIndex,
    rulePredictionUpdateId: rulePredictionState.updateId,
    
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
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};
