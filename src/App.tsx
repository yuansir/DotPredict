import React, { useEffect, useState, useCallback } from 'react';
import { DotColor, Position, GameState, Move } from './types';
import { GameBoard } from './components/GameBoard';
import { ControlPanel } from './components/ControlPanel';
import { StatsPanel } from './components/StatsPanel';
import { storageService } from './services/storage';
import { predictNextColor } from './utils/gameLogic';

const GRID_SIZE = 8;
const WINDOW_SIZE = GRID_SIZE * GRID_SIZE;

const createEmptyGrid = () =>
  Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(null));

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const initialState: GameState = {
      grid: createEmptyGrid(),
      history: [],
      windowStart: 0,
      totalPredictions: 0,
      correctPredictions: 0,
      isViewingHistory: false,
      predictionStats: [], // 确保初始化为空数组
    };
    return initialState;
  });

  const [selectedColor, setSelectedColor] = useState<DotColor>('red');
  const [predictedPosition, setPredictedPosition] = useState<Position | null>(null);
  const [predictedColor, setPredictedColor] = useState<DotColor | null>(null);
  const [probability, setProbability] = useState<number | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [nextPosition, setNextPosition] = useState<Position>({ row: 0, col: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [lastPosition, setLastPosition] = useState<Position | null>(null);

  // 键盘快捷键处理
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

  // 加载游戏状态
  useEffect(() => {
    const loadState = async () => {
      try {
        setIsLoading(true);
        const savedState = await storageService.loadGameState();
        console.log('Loaded game state:', savedState);
        
        if (savedState) {
          // 确保 predictionStats 存在
          const stateWithStats = {
            ...savedState,
            predictionStats: savedState.predictionStats || [],
          };
          setGameState(stateWithStats);
          
          // 找到下一个空位置
          const nextEmpty = findNextEmptyPosition(savedState.grid);
          if (nextEmpty) {
            setNextPosition(nextEmpty);
          }
          // 设置最后一个位置
          if (savedState.history.length > 0) {
            setLastPosition(savedState.history[savedState.history.length - 1].position);
          }
        }
      } catch (error) {
        console.error('Failed to load game state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadState();
  }, []);

  // 加载游戏历史
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await storageService.getGameHistory();
        console.log('Loaded game history:', history);
        setGameHistory(history);
      } catch (error) {
        console.error('Failed to load game history:', error);
      }
    };

    loadHistory();
  }, []);

  // 自动保存游戏状态
  useEffect(() => {
    const saveState = async () => {
      try {
        console.log('Saving game state:', gameState);
        await storageService.saveGameState(gameState);
      } catch (error) {
        console.error('Failed to save game state:', error);
      }
    };

    // 只有在游戏状态加载完成后才开始保存
    if (!isLoading) {
      saveState();
    }
  }, [gameState, isLoading]);

  // 更新显示的网格
  const updateDisplayGrid = useCallback((history: Move[], windowStart: number) => {
    const newGrid = createEmptyGrid();
    const windowEnd = Math.min(windowStart + WINDOW_SIZE, history.length);
    const displayMoves = history.slice(windowStart, windowEnd);

    displayMoves.forEach((move, index) => {
      // 在页面内计算位置
      const positionInPage = index;
      const row = positionInPage % GRID_SIZE;
      const col = Math.floor(positionInPage / GRID_SIZE);
      if (col < GRID_SIZE) {
        newGrid[row][col] = move.color;
      }
    });

    return newGrid;
  }, []);

  const findNextEmptyPosition = (grid: (DotColor | null)[][]): Position | null => {
    // 从左往右，每列从上往下遍历
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row < GRID_SIZE; row++) {
        if (grid[row][col] === null) {
          return { row, col };
        }
      }
    }

    // 如果当前页面已满，返回新页面的第一个位置
    return { row: 0, col: 0 };
  };

  const updatePrediction = useCallback((history: Move[]) => {
    if (history.length >= 2) {
      const lastTwo = history.slice(-2);
      const prediction = predictNextColor(lastTwo);
      if (prediction) {
        setPredictedColor(prediction.color);
        setPredictedPosition(nextPosition);
        setProbability(prediction.probability);
      } else {
        setPredictedColor(null);
        setPredictedPosition(null);
        setProbability(null);
      }
    } else {
      setPredictedColor(null);
      setPredictedPosition(null);
      setProbability(null);
    }
  }, [nextPosition]);

  // 更新预测统计
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

  const handleColorSelect = async (color: DotColor) => {
    if (!nextPosition || gameState.isViewingHistory) return;

    let newTotalPredictions = gameState.totalPredictions;
    let newCorrectPredictions = gameState.correctPredictions;

    // 创建新的移动记录
    const newMove: Move = {
      position: nextPosition,
      color,
      timestamp: Date.now(),
    };

    // 如果有预测，记录预测结果
    if (
      predictedPosition &&
      predictedColor &&
      nextPosition.row === predictedPosition.row &&
      nextPosition.col === predictedPosition.col
    ) {
      newTotalPredictions++;
      if (color === predictedColor) {
        newCorrectPredictions++;
      }

      newMove.prediction = {
        color: predictedColor,
        isCorrect: color === predictedColor,
        probability: probability || 0,
      };
    }

    const newHistory = [...gameState.history, newMove];

    // 计算当前页号和页内位置
    const currentPage = Math.floor(newHistory.length / WINDOW_SIZE);
    const positionInPage = newHistory.length % WINDOW_SIZE;
    const isPageFull = positionInPage === 0 && newHistory.length > 0;
    
    const newWindowStart = isPageFull
      ? currentPage * WINDOW_SIZE
      : Math.floor(newHistory.length / WINDOW_SIZE) * WINDOW_SIZE;

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
    setLastPosition(nextPosition);

    // 更新下一个位置
    const nextEmpty = findNextEmptyPosition(newGrid);
    if (nextEmpty) {
      setNextPosition(nextEmpty);
    }

    // 更新预测
    updatePrediction(newHistory);

    // 更新预测统计
    updatePredictionStats(newTotalPredictions, newCorrectPredictions);

    // 保存游戏历史
    if (newTotalPredictions > 0 && newTotalPredictions % 10 === 0) {
      try {
        await storageService.saveGameHistory(newGameState);
        const history = await storageService.getGameHistory();
        setGameHistory(history);
      } catch (error) {
        console.error('Failed to save game history:', error);
      }
    }
  };

  const handleUndo = useCallback(() => {
    if (gameState.history.length === 0 || gameState.isViewingHistory) return;

    const newHistory = [...gameState.history];
    const lastMove = newHistory.pop();
    if (!lastMove) return;

    // 更新预测统计
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

    // 更新预测
    updatePrediction(newHistory);
  }, [gameState, updateDisplayGrid, updatePrediction]);

  const handleCellDelete = useCallback((position: Position) => {
    if (gameState.isViewingHistory) return;

    const index = gameState.history.findIndex(
      move => move.position.row === position.row && move.position.col === position.col
    );

    if (index === -1) return;

    const newHistory = gameState.history.slice(0, index);
    
    // 更新预测统计
    let newTotalPredictions = gameState.totalPredictions;
    let newCorrectPredictions = gameState.correctPredictions;

    // 如果删除的点有预测记录，更新统计
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
      predictionStats: gameState.predictionStats.slice(0, index), // 移除被删除点之后的统计记录
    };

    setGameState(newGameState);
    setNextPosition(position);
    setLastPosition(newHistory.length > 0 ? newHistory[newHistory.length - 1].position : null);

    // 更新预测
    updatePrediction(newHistory);
  }, [gameState, updateDisplayGrid, updatePrediction]);

  const handleWindowChange = useCallback((newStart: number) => {
    const maxStart = Math.max(0, gameState.history.length - WINDOW_SIZE);
    const validStart = Math.max(0, Math.min(newStart, maxStart));
    
    const newGrid = updateDisplayGrid(gameState.history, validStart);
    
    setGameState(prev => ({
      ...prev,
      grid: newGrid,
      windowStart: validStart,
      isViewingHistory: validStart < maxStart,
    }));
  }, [gameState.history, updateDisplayGrid]);

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

  const handleClearData = useCallback(async () => {
    // 重置所有状态
    const initialState: GameState = {
      grid: createEmptyGrid(),
      history: [],
      windowStart: 0,
      totalPredictions: 0,
      correctPredictions: 0,
      isViewingHistory: false,
      predictionStats: [],
    };

    setGameState(initialState);
    setSelectedColor('red');
    setPredictedColor(null);
    setPredictedPosition(null);
    setProbability(null);
    setShowStats(false);
    setGameHistory([]);
    setNextPosition({ row: 0, col: 0 });
    setLastPosition(null);

    // 清除本地存储
    try {
      await storageService.clearAllData();
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }, []);

  const accuracy =
    gameState.totalPredictions > 0
      ? (gameState.correctPredictions / gameState.totalPredictions) * 100
      : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-600">加载游戏数据中...</div>
      </div>
    );
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
              提示：点击已放置的点可以删除，或使用撤销按钮（Ctrl+Z）撤销上一步。使用方向键或时间轴查看历史记录。
            </span>
          </p>
        </header>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* 游戏面板 */}
            <div className="xl:col-span-2">
              <div className="max-w-2xl mx-auto">
                <GameBoard
                  grid={gameState.grid}
                  onCellClick={() => {}} // 禁用直接点击
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
                />
              </div>
            </div>

            {/* 控制面板 */}
            <div className="xl:col-span-1">
              <div className="sticky top-8">
                <ControlPanel
                  onColorSelect={handleColorSelect}
                  selectedColor={selectedColor}
                  onShowStats={() => setShowStats(true)}
                  onUndo={handleUndo}
                  onClearData={handleClearData}
                  canUndo={gameState.history.length > 0 && !gameState.isViewingHistory}
                  accuracy={accuracy}
                  totalPredictions={gameState.totalPredictions}
                  predictedColor={predictedColor}
                  probability={probability}
                />
              </div>
            </div>
          </div>
        </div>

        <StatsPanel
          isOpen={showStats}
          onClose={() => setShowStats(false)}
          history={gameHistory}
        />
      </div>
    </div>
  );
};

export default App;
