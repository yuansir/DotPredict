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
import { PredictionSequenceDisplay } from './components/PredictionSequenceDisplay';
import debounce from 'lodash/debounce';

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
  const [predictionDetails, setPredictionDetails] = useState<{
    color: DotColor | null;
    probability: number;
    matchCount: number;
    isLoading: boolean;
  }>({
    color: null,
    probability: 0,
    matchCount: 0,
    isLoading: false
  });
  const [showStats, setShowStats] = useState(false);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [nextPosition, setNextPosition] = useState<Position>({ row: 0, col: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [lastPosition, setLastPosition] = useState<Position | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'info' | 'warning' | 'error'>('warning');

  // 所有历史数据
  const [allGameHistory, setAllGameHistory] = useState<Move[]>([]);

  // 序列配置状态
  const [currentSequenceConfig, setCurrentSequenceConfig] = useState<SequenceConfig>({
    length: 5,  // 改为5
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
            predictionStats: []
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
          predictionStats: []
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

  // 加载所有历史数据
  const loadAllHistory = async () => {
    try {
      const allGames = await storage.getAllHistory();
      console.log('获取到的所有历史游戏数据:', allGames);
      
      // 按时间顺序合并所有游戏的历史数据
      const completeHistory = allGames.flatMap(game => 
        (game.history || []).map(move => ({
          ...move,
          gameId: game.id,
          date: game.date
        }))
      );

      console.log('合并后的完整历史数据:', completeHistory);
      setAllGameHistory(completeHistory);
      
      // 更新预测器的历史数据
      if (completeHistory.length > 0) {
        console.log('更新预测器的历史数据，包含当前游戏:', [...completeHistory, ...gameState.history]);
        predictor.updateHistory([...completeHistory, ...gameState.history]);
      }
    } catch (error) {
      console.error('Error loading all history:', error);
    }
  };

  // 组件加载时获取所有历史数据
  useEffect(() => {
    loadAllHistory();
  }, []);

  // 当前游戏历史更新时，只更新预测器的历史数据
  useEffect(() => {
    if (allGameHistory.length > 0) {
      const updatedHistory = [...allGameHistory, ...gameState.history];
      console.log('更新预测器的历史数据:', {
        allGameHistoryLength: allGameHistory.length,
        currentGameHistoryLength: gameState.history.length,
        totalLength: updatedHistory.length
      });
      predictor.updateHistory(updatedHistory);
    }
  }, [gameState.history, allGameHistory]);

  // 使用防抖的预测函数
  const debouncedPredict = useCallback(
    debounce((history: Move[], nextPos: Position | null) => {
      if (history.length >= currentSequenceConfig.length && currentSequenceConfig.isEnabled && nextPos) {
        // 开始预测时设置loading状态
        setPredictionDetails(prev => ({ ...prev, isLoading: true }));
        
        const prediction = predictor.predictNextColor();
        if (prediction) {
          console.log('防抖预测结果:', prediction);
          setPredictionDetails({
            color: prediction.color,
            probability: prediction.probability,
            matchCount: prediction.matchCount,
            isLoading: false  // 预测完成，关闭loading
          });
          setPredictedColor(prediction.color);
          setPredictedPosition(nextPos);
          setPredictedProbability(prediction.probability);
        } else {
          setPredictionDetails({
            color: null,
            probability: 0,
            matchCount: 0,
            isLoading: false  // 预测完成，关闭loading
          });
          setPredictedColor(null);
          setPredictedPosition(null);
          setPredictedProbability(null);
        }
      }
    }, 100),
    [predictor, currentSequenceConfig.length, currentSequenceConfig.isEnabled]
  );

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

    // 找到下一个空位置
    const nextEmpty = findNextEmptyPosition(newState.grid);
    if (nextEmpty) {
      setNextPosition(nextEmpty);
      // 使用防抖的预测函数
      debouncedPredict([...allGameHistory, ...newHistory], nextEmpty);
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

        // 找到下一个空位置
        const nextEmpty = findNextEmptyPosition(newState.grid);
        if (nextEmpty) {
          setNextPosition(nextEmpty);

          // 使用防抖的预测函数
          debouncedPredict([...allGameHistory, ...newHistory], nextEmpty);
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
    allGameHistory
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

    // 保存更新后的状态到数据库
    try {
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

    // 保存更新后的状态到数据库
    try {
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

  // 验证配置是否完整
  const isValidConfig = (config: SequenceConfig): boolean => {
    return typeof config.isEnabled === 'boolean' &&
      typeof config.length === 'number' &&
      config.length >= 4 && config.length <= 9;
  };

  // 序列长度选项
  const sequenceLengthOptions = [
    { value: 4, label: '4' },
    { value: 5, label: '5' },
    { value: 6, label: '6' },
    { value: 7, label: '7' },
    { value: 8, label: '8' },
    { value: 9, label: '9' }
  ];

  // 确保序列长度在有效范围内
  useEffect(() => {
    if (currentSequenceConfig.length < 4) {
      handleSequenceConfigChange({
        ...currentSequenceConfig,
        length: 4
      });
    }
  }, []); // 仅在组件挂载时执行一次

  // 更新序列配置
  const handleSequenceConfigChange = (config: Partial<SequenceConfig>) => {
    // 保持现有配置的其他字段
    const newConfig = {
      ...currentSequenceConfig,
      ...config
    };

    if (!isValidConfig(newConfig)) {
      console.error('Invalid sequence config:', newConfig);
      return;
    }

    setCurrentSequenceConfig(newConfig);
    predictor.updateConfig(newConfig);

    // 每次配置改变都重新计算预测
    if (gameState.history.length >= newConfig.length - 1) {
      const prediction = predictor.predictNextColor();
      if (prediction) {
        setPredictionDetails({
          color: prediction.color,
          probability: prediction.probability,
          matchCount: prediction.matchCount,
          isLoading: false
        });
        setPredictedColor(prediction.color);
        setPredictedPosition(nextPosition);
        setPredictedProbability(prediction.probability);
      } else {
        // 清除预测状态
        setPredictionDetails({
          color: null,
          probability: 0,
          matchCount: 0,
          isLoading: false
        });
        setPredictedColor(null);
        setPredictedPosition(null);
        setPredictedProbability(null);
      }
    } else {
      // 历史记录不足，清除预测状态
      setPredictionDetails({
        color: null,
        probability: 0,
        matchCount: 0,
        isLoading: false
      });
      setPredictedColor(null);
      setPredictedPosition(null);
      setPredictedProbability(null);
    }
  };

  // 监听配置变化
  useEffect(() => {
    if (!isValidConfig(currentSequenceConfig)) {
      return;
    }

    // 配置改变时重新计算预测
    if (currentSequenceConfig.isEnabled && gameState.history.length >= currentSequenceConfig.length - 1) {
      const prediction = predictor.predictNextColor();
      if (prediction) {
        setPredictionDetails({
          color: prediction.color,
          probability: prediction.probability,
          matchCount: prediction.matchCount,
          isLoading: false
        });
        setPredictedColor(prediction.color);
        setPredictedPosition(nextPosition);
        setPredictedProbability(prediction.probability);
      }
    }
  }, [currentSequenceConfig, gameState.history.length, predictor, nextPosition]);

  // 获取最近N-1个颜色的辅助函数
  const getLastNColors = (history: Move[], n: number): DotColor[] => {
    // 获取 n-1 个颜色，因为最后一个是待预测的
    return history.slice(-(n - 1)).map(move => move.color);
  };

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

                {/* 预测序列显示 */}
                {isRecordMode && currentSequenceConfig.isEnabled && (
                  <>
                    {console.log('传递给PredictionSequenceDisplay的值:', {
                      historicalColors: getLastNColors(gameState.history, currentSequenceConfig.length),
                      predictedColor: predictionDetails.color,
                      matchCount: predictionDetails.matchCount,
                      confidence: predictionDetails.probability,
                      sequenceLength: currentSequenceConfig.length,
                      isLoading: predictionDetails.isLoading
                    })}
                    <PredictionSequenceDisplay
                      historicalColors={getLastNColors(gameState.history, currentSequenceConfig.length)}
                      predictedColor={predictionDetails.color}
                      matchCount={predictionDetails.matchCount}
                      confidence={predictionDetails.probability}
                      sequenceLength={currentSequenceConfig.length}
                      isLoading={predictionDetails.isLoading}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="xl:col-span-1">
              <div className="sticky top-8">
                <ControlPanel
                  selectedColor={selectedColor}
                  onColorSelect={handleColorSelect}
                  onUndo={handleUndo}
                  onClear={handleClear}
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
