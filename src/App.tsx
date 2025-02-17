import React, { useEffect, useState, useCallback } from 'react';
import { DotColor, Position, GameState } from './types';
import { GameBoard } from './components/GameBoard';
import { ControlPanel } from './components/ControlPanel';
import { StatsPanel } from './components/StatsPanel';
import { storageService } from './services/storage';
import { predictNextColor } from './utils/gameLogic';

const GRID_SIZE = 8;

const createEmptyGrid = () =>
  Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(null));

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    grid: createEmptyGrid(),
    history: [],
    totalPredictions: 0,
    correctPredictions: 0,
  });

  const [selectedColor, setSelectedColor] = useState<DotColor>('red');
  const [predictedPosition, setPredictedPosition] = useState<Position | null>(null);
  const [predictedColor, setPredictedColor] = useState<DotColor | null>(null);
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
          setGameState(savedState);
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

  const findNextEmptyPosition = (grid: (DotColor | null)[][]): Position | null => {
    // 从左往右，每列从上往下遍历
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row < GRID_SIZE; row++) {
        if (grid[row][col] === null) {
          return { row, col };
        }
      }
    }
    return null;
  };

  const handleColorSelect = async (color: DotColor) => {
    if (!nextPosition) return;

    const newGrid = gameState.grid.map((row) => [...row]);
    newGrid[nextPosition.row][nextPosition.col] = color;

    const newHistory = [
      ...gameState.history,
      { position: nextPosition, color },
    ];

    let newTotalPredictions = gameState.totalPredictions;
    let newCorrectPredictions = gameState.correctPredictions;

    if (
      predictedPosition &&
      predictedColor &&
      nextPosition.row === predictedPosition.row &&
      nextPosition.col === predictedPosition.col
    ) {
      if (color === predictedColor) {
        newCorrectPredictions++;
      }
      newTotalPredictions++;
    }

    const newGameState = {
      grid: newGrid,
      history: newHistory,
      totalPredictions: newTotalPredictions,
      correctPredictions: newCorrectPredictions,
    };

    setGameState(newGameState);
    setLastPosition(nextPosition);

    // 预测下一个位置和颜色
    if (newHistory.length >= 2) {
      const prediction = predictNextColor(newHistory.slice(-2));
      if (prediction) {
        setPredictedColor(prediction.color);
        setPredictedPosition(prediction.position);
      }
    }

    // 更新下一个位置
    const nextEmpty = findNextEmptyPosition(newGrid);
    if (nextEmpty) {
      setNextPosition(nextEmpty);
    }

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
    if (gameState.history.length === 0) return;

    const newHistory = [...gameState.history];
    const lastMove = newHistory.pop();
    if (!lastMove) return;

    const newGrid = gameState.grid.map(row => [...row]);
    newGrid[lastMove.position.row][lastMove.position.col] = null;

    const newGameState = {
      grid: newGrid,
      history: newHistory,
      totalPredictions: gameState.totalPredictions,
      correctPredictions: gameState.correctPredictions,
    };

    setGameState(newGameState);
    setNextPosition(lastMove.position);
    setLastPosition(newHistory.length > 0 ? newHistory[newHistory.length - 1].position : null);

    // 更新预测
    if (newHistory.length >= 2) {
      const prediction = predictNextColor(newHistory.slice(-2));
      if (prediction) {
        setPredictedColor(prediction.color);
        setPredictedPosition(prediction.position);
      } else {
        setPredictedColor(null);
        setPredictedPosition(null);
      }
    } else {
      setPredictedColor(null);
      setPredictedPosition(null);
    }
  }, [gameState]);

  const handleCellDelete = useCallback((position: Position) => {
    const index = gameState.history.findIndex(
      move => move.position.row === position.row && move.position.col === position.col
    );

    if (index === -1) return;

    const newHistory = gameState.history.slice(0, index);
    const newGrid = createEmptyGrid();

    // 重新构建网格
    newHistory.forEach(move => {
      newGrid[move.position.row][move.position.col] = move.color;
    });

    const newGameState = {
      grid: newGrid,
      history: newHistory,
      totalPredictions: gameState.totalPredictions,
      correctPredictions: gameState.correctPredictions,
    };

    setGameState(newGameState);
    setNextPosition(position);
    setLastPosition(newHistory.length > 0 ? newHistory[newHistory.length - 1].position : null);

    // 更新预测
    if (newHistory.length >= 2) {
      const prediction = predictNextColor(newHistory.slice(-2));
      if (prediction) {
        setPredictedColor(prediction.color);
        setPredictedPosition(prediction.position);
      } else {
        setPredictedColor(null);
        setPredictedPosition(null);
      }
    } else {
      setPredictedColor(null);
      setPredictedPosition(null);
    }
  }, [gameState]);

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
              提示：点击已放置的点可以删除，或使用撤销按钮（Ctrl+Z）撤销上一步
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
                  canUndo={gameState.history.length > 0}
                  accuracy={accuracy}
                  totalPredictions={gameState.totalPredictions}
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
