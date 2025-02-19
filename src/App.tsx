import React, { useEffect, useState, useCallback } from 'react';
import { DotColor, Position, GameState, Move } from './types';
import { GameBoard } from './components/GameBoard';
import { ControlPanel } from './components/ControlPanel';
import { StatsPanel } from './components/StatsPanel';
import { SupabaseStorageService } from './services/supabase-storage';
import { predictNextColor } from './utils/gameLogic';
import { DateSelector } from './components/DateSelector';
import LoadingScreen from './components/LoadingScreen';
import AlertDialog from './components/AlertDialog';
import { SequencePredictor, SequenceConfig } from './utils/sequencePredictor';
import { supabase, testConnection } from './lib/supabase';

const GRID_SIZE = 8;
const WINDOW_SIZE = GRID_SIZE * GRID_SIZE;

const createEmptyGrid = () =>
  Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(null));

const calculateGrid = (history: Move[], windowStart: number) => {
  const newGrid = createEmptyGrid();

  // 获取当前页的移动记录
  const displayMoves = history.slice(windowStart, windowStart + WINDOW_SIZE);
  console.log('Display moves:', {
    totalMoves: history.length,
    windowStart,
    displayMovesLength: displayMoves.length
  });

  // 处理当前页的移动记录
  displayMoves.forEach((move, index) => {
    // 计算在网格中的位置（纵向填充）
    const col = Math.floor(index / GRID_SIZE);  // 先确定在第几列
    const row = index % GRID_SIZE;              // 再确定在这列的第几行

    if (row < GRID_SIZE && col < GRID_SIZE) {
      newGrid[row][col] = move.color;
    }
  });

  return newGrid;
};

const App: React.FC = () => {
  const today = new Date().toISOString().slice(0, 10);

  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [isRecordMode, setIsRecordMode] = useState<boolean>(selectedDate === today);  // 今天是录入模式，其他日期是预览模式

  const [gameState, setGameState] = useState<GameState>(() => {
    const initialState: GameState = {
      grid: createEmptyGrid(),
      history: [],
      windowStart: 0,
      totalPredictions: 0,
      correctPredictions: 0,
      isViewingHistory: false,
      predictionStats: [],
    };
    return initialState;
  });

  const [selectedColor, setSelectedColor] = useState<DotColor>('red');
  const [predictedPosition, setPredictedPosition] = useState<Position | null>(null);
  const [predictedColor, setPredictedColor] = useState<DotColor | null>(null);
  const [predictedProbability, setPredictedProbability] = useState<number | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [nextPosition, setNextPosition] = useState<Position>({ row: 0, col: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [lastPosition, setLastPosition] = useState<Position | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'info' | 'warning' | 'error'>('warning');

  // 序列配置状态
  const [currentSequenceConfig, setCurrentSequenceConfig] = useState<SequenceConfig>({
    length: 3,
    isEnabled: true
  });

  const storage = new SupabaseStorageService();

  // 初始化序列预测器
  const [predictor] = useState(() => new SequencePredictor(currentSequenceConfig));

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    // 切换到今天时是录入模式，其他日期是预览模式
    setIsRecordMode(date === today);
  };

  const handleModeChange = (mode: boolean) => {
    setIsRecordMode(mode);
    if (mode) {
      const nextEmpty = findNextEmptyPosition(gameState.grid);
      if (nextEmpty) {
        setNextPosition(nextEmpty);
      }
      if (gameState.isViewingHistory) {
        handleReturnToLatest();
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleWindowChange(Math.max(0, gameState.windowStart - GRID_SIZE));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const maxStart = Math.max(0, gameState.history.length - WINDOW_SIZE);
        handleWindowChange(Math.min(maxStart, gameState.windowStart + GRID_SIZE));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  const updateDisplayGrid = useCallback((history: Move[], windowStart: number) => {
    console.log('updateDisplayGrid called:', {
      historyLength: history.length,
      windowStart,
      windowSize: WINDOW_SIZE
    });
    return calculateGrid(history, windowStart);
  }, []);

  useEffect(() => {
    const loadState = async () => {
      setIsLoading(true);
      try {
        // 测试连接
        const connectionTest = await testConnection();
        if (!connectionTest.success) {
          throw new Error(`数据库连接失败: ${connectionTest.error}`);
        }
        console.log(`数据库连接成功，耗时: ${connectionTest.duration}ms`);

        const savedState = await storage.loadGameStateByDate(selectedDate);

        if (savedState) {
          // 确保 windowStart 是从第一页开始
          const initialWindowStart = 0;

          const stateWithStats = {
            ...savedState,
            windowStart: initialWindowStart,  // 强制从第一页开始
            predictionStats: savedState.predictionStats || [],
            // 使用独立函数计算初始网格
            grid: calculateGrid(savedState.history, initialWindowStart)
          };

          setGameState(stateWithStats);

          const nextEmpty = findNextEmptyPosition(stateWithStats.grid);
          if (nextEmpty) {
            setNextPosition(nextEmpty);
          }
          if (savedState.history.length > 0) {
            setLastPosition(savedState.history[savedState.history.length - 1].position);
          }
        } else {
          setGameState({
            grid: createEmptyGrid(),
            history: [],
            windowStart: 0,
            totalPredictions: 0,
            correctPredictions: 0,
            isViewingHistory: false,
            predictionStats: [],
          });
          setNextPosition({ row: 0, col: 0 });
          setLastPosition(null);
        }
      } catch (error) {
        console.error('Failed to load game state:', error);
        setGameState({
          grid: createEmptyGrid(),
          history: [],
          windowStart: 0,
          totalPredictions: 0,
          correctPredictions: 0,
          isViewingHistory: false,
          predictionStats: [],
        });
        setNextPosition({ row: 0, col: 0 });
        setLastPosition(null);
        
        // 提供更详细的错误信息
        let errorMessage = '加载游戏状态失败';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        setAlertMessage(errorMessage);
        setAlertType('error');
        setShowAlert(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadState();
  }, [selectedDate, today]);

  const handleCellClick = async (position: Position) => {
    if (!isRecordMode || gameState.isViewingHistory) return;

    const newHistory = [...gameState.history];
    const move: Move = {
      position,
      color: selectedColor,
      timestamp: Date.now(),
    };

    // 如果有预测，记录预测结果
    if (predictedPosition && predictedColor && 
        position.row === predictedPosition.row && 
        position.col === predictedPosition.col) {
      move.prediction = {
        color: predictedColor,
        isCorrect: predictedColor === selectedColor,
        probability: predictedProbability || 0
      };
      
      // 更新预测统计
      const newState = {
        ...gameState,
        totalPredictions: gameState.totalPredictions + 1,
        correctPredictions: gameState.correctPredictions + (predictedColor === selectedColor ? 1 : 0)
      };
      setGameState(newState);
    }

    newHistory.push(move);
    
    // 更新游戏状态
    const newState = {
      ...gameState,
      history: newHistory,
      grid: calculateGrid(newHistory, gameState.windowStart)
    };

    setGameState(newState);
    
    // 更新预测器的历史记录
    predictor.updateHistory(newHistory);
    
    // 找到下一个空位置
    const nextEmpty = findNextEmptyPosition(newState.grid);
    if (nextEmpty) {
      setNextPosition(nextEmpty);
      
      // 更新预测
      if (newHistory.length >= predictor.config.length && predictor.config.isEnabled) {
        const prediction = predictor.predictNextColor();
        if (prediction) {
          setPredictedColor(prediction.color);
          setPredictedPosition(nextEmpty);
          setPredictedProbability(prediction.probability);
        } else {
          setPredictedColor(null);
          setPredictedPosition(null);
          setPredictedProbability(null);
        }
      }
    }

    // 保存状态
    try {
      await storage.saveGameStateByDate(newState, selectedDate);
    } catch (error) {
      console.error('Failed to save game state:', error);
      setAlertMessage('保存游戏状态失败');
      setAlertType('error');
      setShowAlert(true);
    }
  };

  const findNextEmptyPosition = (grid: (DotColor | null)[][]): Position | null => {
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row < GRID_SIZE; row++) {
        if (grid[row][col] === null) {
          return { row, col };
        }
      }
    }
    return { row: 0, col: 0 };
  };

  const updatePrediction = useCallback((history: Move[]) => {
    if (history.length >= 2) {
      const lastTwo = history.slice(-2);
      const prediction = predictNextColor(lastTwo);
      if (prediction) {
        setPredictedColor(prediction.color);
        setPredictedPosition(nextPosition);
        setPredictedProbability(prediction.probability);
      } else {
        setPredictedColor(null);
        setPredictedPosition(null);
        setPredictedProbability(null);
      }
    } else {
      setPredictedColor(null);
      setPredictedPosition(null);
      setPredictedProbability(null);
    }
  }, [nextPosition]);

  const updatePredictionStats = useCallback((
    totalPredictions: number,
    correctPredictions: number
  ) => {
    const accuracy = totalPredictions > 0
      ? (correctPredictions / totalPredictions) * 100
      : 0;

    const newStats = {
      timestamp: Date.now(),
      accuracy,
      totalPredictions,
    };

    setGameState(prev => ({
      ...prev,
      predictionStats: Array.isArray(prev.predictionStats)
        ? [...prev.predictionStats, newStats]
        : [newStats],
    }));
  }, []);

  const handleColorSelect = useCallback((color: DotColor) => {
    if (!isRecordMode) {
      setAlertMessage('预览模式下不能修改数据');
      setAlertType('warning');
      setShowAlert(true);
      return;
    }
    
    setSelectedColor(color);
    
    if (nextPosition) {
      const position = nextPosition;
      
      // 创建一个新的处理函数，使用新的颜色值
      const handleClick = async () => {
        if (!isRecordMode || gameState.isViewingHistory) return;

        const newHistory = [...gameState.history];
        const move: Move = {
          position,
          color,  // 使用传入的新颜色
          timestamp: Date.now(),
        };

        // 如果有预测，记录预测结果
        if (predictedPosition && predictedColor && 
            position.row === predictedPosition.row && 
            position.col === predictedPosition.col) {
          move.prediction = {
            color: predictedColor,
            isCorrect: predictedColor === color,  // 使用新颜色比较
            probability: predictedProbability || 0
          };
          
          // 更新预测统计
          const newState = {
            ...gameState,
            totalPredictions: gameState.totalPredictions + 1,
            correctPredictions: gameState.correctPredictions + (predictedColor === color ? 1 : 0)
          };
          setGameState(newState);
        }

        newHistory.push(move);
        
        // 更新游戏状态
        const newState = {
          ...gameState,
          history: newHistory,
          grid: calculateGrid(newHistory, gameState.windowStart)
        };

        setGameState(newState);
        
        // 更新预测器的历史记录
        predictor.updateHistory(newHistory);
        
        // 找到下一个空位置
        const nextEmpty = findNextEmptyPosition(newState.grid);
        if (nextEmpty) {
          setNextPosition(nextEmpty);
          
          // 更新预测
          if (newHistory.length >= 2) {
            const prediction = predictor.predictNextColor();
            if (prediction) {
              setPredictedColor(prediction.color);
              setPredictedPosition(nextEmpty);
              setPredictedProbability(prediction.probability);
            } else {
              setPredictedColor(null);
              setPredictedPosition(null);
              setPredictedProbability(null);
            }
          }
        }

        // 保存状态
        try {
          await storage.saveGameStateByDate(newState, selectedDate);
        } catch (error) {
          console.error('Failed to save game state:', error);
          setAlertMessage('保存游戏状态失败');
          setAlertType('error');
          setShowAlert(true);
        }
      };
      
      // 执行新的处理函数
      handleClick();
    }
  }, [
    isRecordMode, 
    nextPosition, 
    gameState, 
    predictedPosition, 
    predictedColor, 
    predictedProbability,
    predictor,
    selectedDate
  ]);

  const handleUndo = useCallback(async () => {
    if (gameState.history.length === 0 || gameState.isViewingHistory) return;

    const newHistory = [...gameState.history];
    const lastMove = newHistory.pop();
    if (!lastMove) return;

    let newTotalPredictions = gameState.totalPredictions;
    let newCorrectPredictions = gameState.correctPredictions;

    if (lastMove.prediction) {
      newTotalPredictions--;
      if (lastMove.prediction.isCorrect) {
        newCorrectPredictions--;
      }
    }

    const currentPage = Math.floor((newHistory.length - 1) / WINDOW_SIZE);
    const newWindowStart = currentPage * WINDOW_SIZE;

    const newGrid = updateDisplayGrid(newHistory, newWindowStart);

    const newGameState = {
      ...gameState,
      grid: newGrid,
      history: newHistory,
      windowStart: newWindowStart,
      totalPredictions: newTotalPredictions,
      correctPredictions: newCorrectPredictions,
      isViewingHistory: false,
      predictionStats: gameState.predictionStats.slice(0, -1), // 移除最后一个统计记录
    };

    setGameState(newGameState);
    setNextPosition(lastMove.position);
    setLastPosition(newHistory.length > 0 ? newHistory[newHistory.length - 1].position : null);

    updatePrediction(newHistory);

    try {
      // 保存更新后的状态到数据库
      await storage.saveGameStateByDate(newGameState, selectedDate);
    } catch (error) {
      console.error('Failed to save game state after undo:', error);
    }
  }, [gameState, updateDisplayGrid, selectedDate]);

  const handleCellDelete = useCallback(async (position: Position) => {
    if (gameState.isViewingHistory) return;

    const index = gameState.history.findIndex(
      move => move.position.row === position.row && move.position.col === position.col
    );

    if (index === -1) return;

    const newHistory = gameState.history.slice(0, index);

    let newTotalPredictions = gameState.totalPredictions;
    let newCorrectPredictions = gameState.correctPredictions;

    const deletedMove = gameState.history[index];
    if (deletedMove.prediction) {
      newTotalPredictions--;
      if (deletedMove.prediction.isCorrect) {
        newCorrectPredictions--;
      }
    }

    const newWindowStart = Math.max(0, Math.min(gameState.windowStart, newHistory.length - WINDOW_SIZE));
    const newGrid = updateDisplayGrid(newHistory, newWindowStart);

    const newGameState = {
      ...gameState,
      grid: newGrid,
      history: newHistory,
      windowStart: newWindowStart,
      totalPredictions: newTotalPredictions,
      correctPredictions: newCorrectPredictions,
      isViewingHistory: false,
    };

    setGameState(newGameState);
    setNextPosition(position);
    setLastPosition(newHistory.length > 0 ? newHistory[newHistory.length - 1].position : null);

    updatePrediction(newHistory);

    try {
      // 保存更新后的状态到数据库
      await storage.saveGameStateByDate(newGameState, selectedDate);
    } catch (error) {
      console.error('Failed to save game state after cell delete:', error);
    }
  }, [gameState, updateDisplayGrid, selectedDate]);

  const handleWindowChange = useCallback((newStart: number) => {
    // 计算总页数
    const totalPages = Math.ceil(gameState.history.length / WINDOW_SIZE);

    // 计算目标页码
    const targetPage = Math.floor(newStart / WINDOW_SIZE);

    // 确保页码在有效范围内
    const validPage = Math.min(targetPage, totalPages - 1);

    // 计算实际的起始位置
    const validStart = validPage * WINDOW_SIZE;

    console.log('Page change:', {
      historyLength: gameState.history.length,
      totalPages,
      targetPage,
      validPage,
      validStart
    });

    // 更新游戏状态
    setGameState(prev => ({
      ...prev,
      windowStart: validStart,
      grid: updateDisplayGrid(prev.history, validStart),
      isViewingHistory: validStart < prev.history.length - WINDOW_SIZE
    }));
  }, [gameState.history.length]);

  const handleReturnToLatest = useCallback(() => {
    const maxStart = Math.max(0, gameState.history.length - WINDOW_SIZE);
    const newGrid = updateDisplayGrid(gameState.history, maxStart);

    setGameState(prev => ({
      ...prev,
      grid: newGrid,
      windowStart: maxStart,
      isViewingHistory: false,
    }));
  }, [gameState.history, updateDisplayGrid]);

  const handleClear = async () => {
    try {
      setIsLoading(true);
      await storage.clearAllData();
      setGameState({
        grid: createEmptyGrid(),
        history: [],
        windowStart: 0,
        totalPredictions: 0,
        correctPredictions: 0,
        isViewingHistory: false,
        predictionStats: []
      });
      setNextPosition({ row: 0, col: 0 });
      setLastPosition(null);
      setAlertMessage('游戏数据已清空');
      setAlertType('success');
      setShowAlert(true);
    } catch (error) {
      console.error('Failed to clear data:', error);
      setAlertMessage('清空数据失败');
      setAlertType('error');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  // 计算预测准确率
  const calculateAccuracy = useCallback(() => {
    if (gameState.totalPredictions === 0) return 0;
    return (gameState.correctPredictions / gameState.totalPredictions) * 100;
  }, [gameState.correctPredictions, gameState.totalPredictions]);

  // 处理序列配置变更
  const handleSequenceConfigChange = useCallback((config: Partial<SequenceConfig>) => {
    // 更新 predictor 配置
    predictor.updateConfig(config);
    
    // 更新 UI 状态
    setCurrentSequenceConfig(prev => ({
      ...prev,
      ...config
    }));
    
    // 如果禁用了预测，清除预测状态
    if (config.isEnabled === false) {
      setPredictedColor(null);
      setPredictedPosition(null);
      setPredictedProbability(null);
    } else if (config.isEnabled === true && gameState.history.length >= predictor.config.length) {
      // 如果启用预测，且有足够的历史记录，立即进行预测
      const prediction = predictor.predictNextColor();
      if (prediction && nextPosition) {
        setPredictedColor(prediction.color);
        setPredictedPosition(nextPosition);
        setPredictedProbability(prediction.probability);
      }
    }
  }, [gameState.history.length, nextPosition, predictor]);

  // 在历史记录更新时更新预测器
  useEffect(() => {
    predictor.updateHistory(gameState.history);
    // 如果在录入模式且有下一个位置，尝试预测
    if (isRecordMode && nextPosition) {
      const prediction = predictor.predictNextColor();
      if (prediction) {
        setPredictedColor(prediction.color);
        setPredictedPosition(nextPosition);
      } else {
        setPredictedColor(null);
        setPredictedPosition(null);
      }
    }
  }, [gameState.history, isRecordMode, nextPosition, predictor]);

  const accuracy = calculateAccuracy();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">点阵预测游戏</h1>
          <p className="text-gray-600">
            选择颜色，点击按钮自动填充下一个位置！从左边第一列开始，从上往下依次填充。
            <br />
            <span className="text-sm text-gray-500">
              提示：点击已放置的点可以删除，或使用撤销按钮撤销上一步。
            </span>
          </p>
        </header>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2">
              <div className="max-w-2xl mx-auto">
                <div className="p-4">
                  <DateSelector
                    selectedDate={selectedDate}
                    onDateChange={handleDateChange}
                    isRecordMode={isRecordMode}
                    onModeChange={handleModeChange}
                  />
                </div>
                <GameBoard
                  grid={gameState.grid}
                  onCellClick={handleCellClick}
                  onCellDelete={handleCellDelete}
                  predictedPosition={predictedPosition}
                  predictedColor={predictedColor}
                  nextPosition={nextPosition}
                  lastPosition={lastPosition}
                  windowStart={gameState.windowStart}
                  totalMoves={gameState.history.length}
                  onWindowChange={handleWindowChange}
                  onReturnToLatest={handleReturnToLatest}
                  isViewingHistory={gameState.isViewingHistory}
                  isRecordMode={isRecordMode}
                />
              </div>
            </div>

            <div className="xl:col-span-1">
              <div className="sticky top-8">
                <ControlPanel
                  selectedColor={selectedColor}
                  onColorSelect={handleColorSelect}
                  onUndo={handleUndo}
                  onClear={handleClear}
                  onShowStats={() => setShowStats(true)}
                  accuracy={accuracy}
                  totalPredictions={gameState.totalPredictions}
                  predictedColor={predictedColor}
                  probability={predictedProbability}
                  isRecordMode={!gameState.isViewingHistory}
                  onSequenceConfigChange={handleSequenceConfigChange}
                  sequenceConfig={currentSequenceConfig}
                  className="mb-4"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <StatsPanel
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        history={gameState.history}
      />

      <AlertDialog
        isOpen={showAlert}
        message={alertMessage}
        type={alertType}
        onClose={() => setShowAlert(false)}
      />

      {isLoading && <LoadingScreen />}
    </div>
  );
};

export default App;
