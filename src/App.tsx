import React, { useEffect, useState, useCallback, useRef } from 'react';
import { DotColor, Position, GameState, Move } from './types';
import { ControlPanel } from './components/ControlPanel';
// @ts-ignore
import { StatsPanel } from './components/StatsPanel';
import { SupabaseStorageService } from './services/supabase-storage';
// @ts-ignore
import { predictNextColor } from './utils/gameLogic';
import { DateSelector } from './components/DateSelector';
import LoadingScreen from './components/LoadingScreen';
import AlertDialog from './components/AlertDialog';
import { SequencePredictor, SequenceConfig } from './utils/sequencePredictor';
// @ts-ignore
import { supabase, testConnection } from './lib/supabase';
import { PredictionSequenceDisplay } from './components/PredictionSequenceDisplay';

const App: React.FC = () => {
  // 会话管理相关状态和函数
  const [currentSessionId, setCurrentSessionId] = useState<number>(1);
  const [latestSessionId, setLatestSessionId] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [availableSessions, setAvailableSessions] = useState<number[]>([]);

  const today = new Date().toISOString().slice(0, 10);

  const [selectedDate, setSelectedDate] = useState<string>(today);
  // 初始化时，如果是今天且会话ID为1（新一轮输入），则为录入模式
  const [isRecordMode, setIsRecordMode] = useState<boolean>(selectedDate === today);

  const [gameState, setGameState] = useState<GameState>(() => {
    const initialState: GameState = {
      history: [],
      totalPredictions: 0,
      correctPredictions: 0,
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
  // @ts-ignore
  const [showStats, setShowStats] = useState(false);
  // @ts-ignore
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

  // 75%规则预测状态
  const [rule75Prediction, setRule75Prediction] = useState<{
    predictedColor: DotColor | null;
    currentSequence: DotColor[];
  }>({
    predictedColor: null,
    currentSequence: []
  });

  // 连续模式预测矩阵常量
  const PATTERN_ROWS = 3;
  const PATTERN_COLS = 16;

  // 初始化空矩阵函数
  const createEmptyMatrix = useCallback(() => {
    const newMatrix: (DotColor | null)[][] = Array(PATTERN_ROWS).fill(null).map(() => Array(PATTERN_COLS).fill(null));
    return newMatrix;
  }, []);

  // 矩阵状态
  const [matrixData, setMatrixData] = useState(createEmptyMatrix());

  // 添加新颜色到矩阵
  const addColorToMatrix = useCallback((color: string) => {
    setMatrixData(prevMatrix => {
      // 创建新矩阵副本
      const newMatrix = prevMatrix.map(row => [...row]);

      // 找到第一个空位置（严格按照从左到右，每列从上到下）
      let targetCol = 0;
      let targetRow = 0;
      let found = false;

      // 先找到第一个未满的列
      columnLoop: for (let col = 0; col < PATTERN_COLS; col++) {
        // 检查当前列是否有空位，从上到下检查
        for (let row = 0; row < PATTERN_ROWS; row++) {
          if (newMatrix[row][col] === null) {
            targetCol = col;
            targetRow = row;
            found = true;
            break columnLoop; // 找到第一个空位就停止搜索
          }
        }
      }

      // 如果矩阵已满，执行左移
      if (!found) {
        // 左移所有列
        for (let row = 0; row < PATTERN_ROWS; row++) {
          for (let col = 0; col < PATTERN_COLS - 1; col++) {
            newMatrix[row][col] = newMatrix[row][col + 1];
          }
          // 清空最后一列
          newMatrix[row][PATTERN_COLS - 1] = null;
        }
        // 在最右列第一个位置放入新数据
        targetCol = PATTERN_COLS - 1;
        targetRow = 0;
      }

      // 放入新数据
      newMatrix[targetRow][targetCol] = color;

      return newMatrix;
    });
  }, []);

  // 从矩阵中移除最后一个颜色
  const removeLastColorFromMatrix = useCallback(() => {
    setMatrixData(prevMatrix => {
      // 创建新矩阵副本
      const newMatrix = prevMatrix.map(row => [...row]);

      // 从右到左，从下到上查找最后一个非空位置
      for (let col = PATTERN_COLS - 1; col >= 0; col--) {
        for (let row = PATTERN_ROWS - 1; row >= 0; row--) {
          if (newMatrix[row][col] !== null) {
            newMatrix[row][col] = null;
            return newMatrix;
          }
        }
      }

      return newMatrix;
    });
  }, []);

  // @ts-ignore
  const handlePatternReset = useCallback(() => {
    setMatrixData(createEmptyMatrix());
  }, []); // @ts-ignore

  const storage = new SupabaseStorageService();

  // 初始化序列预测器
  const [predictor] = useState(() => new SequencePredictor(currentSequenceConfig));

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    // 只有当天日期+新一轮输入会话才是录入模式
    const shouldBeRecordMode = date === today && selectedSession === currentSessionId;
    setIsRecordMode(shouldBeRecordMode);
  };

  const handleModeChange = (mode: boolean) => {
    setIsRecordMode(mode);
    if (mode) {
      const nextEmpty = { row: 0, col: 0 };
      if (nextEmpty) {
        setNextPosition(nextEmpty);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      }
      // 移除左右箭头键处理，因为它们用于8x8矩阵的窗口滚动
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);


  useEffect(() => {
    const loadState = async () => {
      setIsLoading(true);
      try {
        const savedState = await storage.loadGameStateByDate(selectedDate);

        if (savedState) {
          // 移除windowStart相关代码
          const stateWithStats = {
            ...savedState,
            predictionStats: savedState.predictionStats || [],
          };

          setGameState(stateWithStats);

          const nextEmpty = { row: 0, col: 0 };
          if (nextEmpty) {
            setNextPosition(nextEmpty);
          }
          if (savedState.history.length > 0) {
            setLastPosition(savedState.history[savedState.history.length - 1].position);
          }
        } else {
          setGameState({
            history: [],
            totalPredictions: 0,
            correctPredictions: 0,
            predictionStats: []
          });
          setNextPosition({ row: 0, col: 0 });
          setLastPosition(null);
        }
      } catch (error) {
        console.error('Failed to load game state:', error);
        setGameState({
          history: [],
          totalPredictions: 0,
          correctPredictions: 0,
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
        (game.history || []).map((move: Move) => ({
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
      // 只在开发环境下输出日志
      if (process.env.NODE_ENV === 'development') {
        console.log('更新预测器的历史数据:', {
          totalLength: updatedHistory.length
        });
      }
      predictor.updateHistory(updatedHistory);
    }
  }, [gameState.history, allGameHistory]);

  // 自定义防抖 Hook
  const useDebouncedCallback = (callback: Function, delay: number) => {
    const timeoutRef = useRef<NodeJS.Timeout>();
    const callbackRef = useRef<Function>();

    // 更新回调引用，避免闭包问题
    useEffect(() => {
      callbackRef.current = callback;
    }, [callback]);

    return useCallback((...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        if (callbackRef.current) {
          callbackRef.current(...args);
        }
      }, delay);
    }, [delay]);
  };

  // 使用防抖的预测函数 - 增加延迟到300ms，减少频繁调用
  const debouncedPredict = useDebouncedCallback((history: Move[], nextPos: Position | null) => {
    if (history.length >= currentSequenceConfig.length && nextPos) {
      // 开始预测时设置loading状态
      setPredictionDetails(prev => ({ ...prev, isLoading: true }));

      const prediction = predictor.predictNextColor();
      if (prediction) {
        // 只在开发环境下输出日志
        if (process.env.NODE_ENV === 'development') {
          console.log('预测结果:', {
            color: prediction.color,
            probability: prediction.probability.toFixed(2)
          });
        }

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
  }, 300); // 增加到300ms减少频繁调用

  // 75%规则预测逻辑
  const predict75Rule = (history: DotColor[]) => {
    if (history.length < 2) {
      return {
        predictedColor: null,
        currentSequence: []
      };
    }

    const lastTwo = history.slice(-2);
    const sequence = lastTwo.join('');

    // 75%规则映射
    const rules: { [key: string]: DotColor } = {
      'blackblack': 'red',
      'redred': 'black',
      'blackred': 'red',
      'redblack': 'black'
    };

    return {
      predictedColor: rules[sequence] || null,
      currentSequence: lastTwo
    };
  };

  // 更新75%规则预测
  useEffect(() => {
    const newPrediction = predict75Rule(gameState.history.map(move => move.color));
    setRule75Prediction(newPrediction);
  }, [gameState.history]);

  // 获取当前应使用的会话ID
  const getSessionIdToUse = useCallback(() => {
    return isRecordMode
      ? currentSessionId
      : (selectedSession || 1);
  }, [isRecordMode, currentSessionId, selectedSession]);

  // 颜色选择处理函数
  const handleColorSelect = useCallback((color: DotColor) => {
    if (!isRecordMode) {
      setAlertMessage('预览模式下不能修改数据');
      setShowAlert(true);
      return;
    }

    // 创建一个新的处理函数，使用新的颜色值
    const handleClick = async () => {
      if (!isRecordMode) return;

      // 使用nextPosition作为当前位置
      const currentPosition = nextPosition;

      const newHistory = [...gameState.history];
      const move: Move = {
        position: currentPosition,
        color,  // 使用传入的新颜色
        timestamp: Date.now(),
      };

      // 如果有预测，记录预测结果
      if (predictedPosition && predictedColor &&
        currentPosition.row === predictedPosition.row &&
        currentPosition.col === predictedPosition.col) {
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
        history: newHistory
      };

      setGameState(newState);

      // 同步更新到3x16矩阵
      addColorToMatrix(color);

      // 找到下一个空位置
      const nextEmpty = { row: 0, col: 0 };
      setNextPosition(nextEmpty);

      // 延迟预测，避免频繁更新
      setTimeout(() => {
        // 使用防抖的预测函数
        debouncedPredict([...allGameHistory, ...newHistory], nextEmpty);
      }, 100);

      // 保存状态
      try {
        const sessionIdToUse = getSessionIdToUse();
        await storage.saveGameStateByDate(newState, selectedDate, sessionIdToUse);
      } catch (error) {
        console.error('Failed to save game state:', error);
        setAlertMessage('保存游戏状态失败');
        setAlertType('error');
        setShowAlert(true);
      }
    };

    // 执行新的处理函数
    handleClick();
  }, [isRecordMode, gameState, nextPosition, predictedPosition, predictedColor, predictedProbability, addColorToMatrix, allGameHistory, debouncedPredict, getSessionIdToUse, selectedDate, storage]);

  // 处理会话选择
  const handleSessionChange = useCallback(async (sessionId: number) => {
    setSelectedSession(sessionId);
    setIsLoading(true);

    // 只有当天日期+新一轮输入会话才是录入模式
    const shouldBeRecordMode = selectedDate === today && sessionId === currentSessionId;
    setIsRecordMode(shouldBeRecordMode);

    try {
      // 如果选择的是"新一轮输入中"会话
      if (sessionId === currentSessionId) {
        // 查询大于latest_session_id的数据（未终止的当前会话数据）
        console.log('查询新一轮输入中的数据, 条件:', {
          selectedDate,
          latestSessionId,
          currentSessionId,
          condition: `session_id > ${latestSessionId || 0}`
        });

        const { data, error } = await supabase
          .from('moves')
          .select('*')
          .eq('date', selectedDate)
          .gt('session_id', latestSessionId || 0)  // 大于latest_session_id的数据
          .order('sequence_number', { ascending: true });

        if (error) throw error;

        // 如果有数据，加载它
        if (data && data.length > 0) {
          console.log('加载未终止的当前会话数据:', data.length, data);
          const moves = data.map(move => ({
            position: move.position,
            color: move.color as DotColor,
            prediction: move.prediction
          }));

          setAllGameHistory(moves);

          // 更新游戏状态
          setGameState(prev => ({
            ...prev,
            history: moves,
            totalPredictions: 0,
            correctPredictions: 0,
            predictionStats: []
          }));
        } else {
          console.log('没有未终止的当前会话数据，显示空矩阵');
          setAllGameHistory([]); // 清空所有游戏历史，确保矩阵不显示历史数据
          setGameState(prev => ({
            ...prev,
            history: [],
            totalPredictions: 0,
            correctPredictions: 0,
            predictionStats: []
          }));
          setMatrixData(createEmptyMatrix()); // 清空3x16矩阵
        }
      } else {
        // 加载选定会话的数据
        const { data, error } = await supabase
          .from('moves')
          .select('*')
          .eq('date', selectedDate)
          .eq('session_id', sessionId)
          .order('sequence_number', { ascending: true });

        if (error) throw error;

        const moves = data.map(move => ({
          position: move.position,
          color: move.color as DotColor,
          prediction: move.prediction
        }));

        setAllGameHistory(moves);

        // 更新游戏状态
        setGameState(prev => ({
          ...prev,
          history: moves,
          totalPredictions: 0,
          correctPredictions: 0,
          predictionStats: []
        }));
      }
    } catch (error) {
      console.error('Error loading session data:', error);
      setAlertMessage('加载会话数据时出错');
      setAlertType('error');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, latestSessionId, currentSessionId]);

  // 在日期变化时获取最新会话ID
  const fetchLatestSessionId = useCallback(async (date: string) => {
    try {
      const { data, error } = await supabase
        .from('daily_records')
        .select('latest_session_id')
        .eq('date', date)
        .maybeSingle();

      if (error) {
        // 如果是没有找到记录，不需要显示错误
        if (error.code === 'PGRST116') {
          setLatestSessionId(null);
          return;
        }
        throw error;
      }

      // 如果没有数据，设置为 null
      if (!data) {
        setLatestSessionId(null);
        return;
      }

      setLatestSessionId(data.latest_session_id);
    } catch (error) {
      console.error('Error fetching latest session ID:', error);
      // 出错时设置为 null，确保 UI 能正确显示
      setLatestSessionId(null);
    }
  }, []);

  useEffect(() => {
    fetchLatestSessionId(selectedDate);
  }, [selectedDate, fetchLatestSessionId]);

  // 获取可用会话列表
  const fetchAvailableSessions = useCallback(async () => {
    try {
      // 1. 从 daily_records 获取 latest_session_id
      const { data: record, error: recordError } = await supabase
        .from('daily_records')
        .select('latest_session_id')
        .eq('date', selectedDate)
        .single();

      if (recordError) throw recordError;

      // 2. 生成会话列表
      let sessions = [];
      if (record && record.latest_session_id !== null) {
        // 当日期有记录，且 latest_session_id 不为 null
        sessions = Array.from(
          { length: record.latest_session_id },
          (_, i) => i + 1
        );
      }
      setAvailableSessions(sessions);

      // 3. 设置选中的会话
      if (sessions.length === 0) {
        // 如果没有历史记录，显示"新一轮输入中..."
        setSelectedSession(currentSessionId);
      } else if (isRecordMode) {
        // 录入模式下，选择当前会话
        setSelectedSession(currentSessionId);
      } else {
        // 预览模式下，默认选择最后一个完成的会话
        setSelectedSession(sessions[sessions.length - 1]);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setAvailableSessions([]);
      setSelectedSession(currentSessionId);
    }
  }, [selectedDate, currentSessionId, isRecordMode]);

  // 加载初始数据 - 主要针对"新一轮输入中"会话
  useEffect(() => {
    const loadInitialData = async () => {
      // 如果是"新一轮输入中"会话，只加载未终止的数据
      if (selectedSession === currentSessionId) {
        setIsLoading(true);
        try {
          console.log('初始化加载数据 - 查询条件:', {
            selectedDate,
            latestSessionId,
            currentSessionId,
            condition: `session_id > ${latestSessionId || 0}`
          });

          // 查询大于latest_session_id的数据（未终止的当前会话数据）
          const { data, error } = await supabase
            .from('moves')
            .select('*')
            .eq('date', selectedDate)
            .gt('session_id', latestSessionId || 0)  // 大于latest_session_id的数据
            .order('sequence_number', { ascending: true });

          if (error) throw error;

          // 如果有数据，加载它
          if (data && data.length > 0) {
            console.log('加载未终止的当前会话数据:', data.length, data);
            const moves = data.map(move => ({
              position: move.position,
              color: move.color as DotColor,
              prediction: move.prediction
            }));

            setAllGameHistory(moves);

            // 更新游戏状态
            setGameState(prev => ({
              ...prev,
              history: moves,
              totalPredictions: 0,
              correctPredictions: 0,
              predictionStats: []
            }));
          } else {
            console.log('没有未终止的当前会话数据，显示空矩阵');
            setAllGameHistory([]); // 清空所有游戏历史，确保矩阵不显示历史数据
            setGameState(prev => ({
              ...prev,
              history: [],
              totalPredictions: 0,
              correctPredictions: 0,
              predictionStats: []
            }));
            setMatrixData(createEmptyMatrix()); // 清空3x16矩阵
          }
        } catch (error) {
          console.error('Error loading initial data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    // 确保latestSessionId已加载完成后再加载数据
    if (latestSessionId !== undefined) {
      loadInitialData();
    }
  }, [selectedDate, selectedSession, currentSessionId, latestSessionId]);

  // 终止当前会话
  const handleEndSession = async () => {
    try {
      console.log('终止会话前状态:', {
        selectedDate,
        currentSessionId,
        latestSessionId
      });

      // 1. 检查记录是否存在
      const { data: existingRecord } = await supabase
        .from('daily_records')
        .select('id')
        .eq('date', selectedDate)
        .single();

      let error;
      if (existingRecord) {
        // 2. 如果存在，使用 update
        const { error: updateError } = await supabase
          .from('daily_records')
          .update({
            latest_session_id: currentSessionId,
            updated_at: new Date()
          })
          .eq('date', selectedDate);
        error = updateError;
      } else {
        // 3. 如果不存在，使用 insert
        const { error: insertError } = await supabase
          .from('daily_records')
          .insert({
            date: selectedDate,
            latest_session_id: currentSessionId,
            total_predictions: 0,
            correct_predictions: 0
          });
        error = insertError;
      }

      if (error) throw error;

      // 更新状态
      setLatestSessionId(currentSessionId);
      setCurrentSessionId(prev => prev + 1);
      setSelectedSession(prev => prev + 1);

      console.log('终止会话后状态:', {
        新latestSessionId: currentSessionId,
        新currentSessionId: currentSessionId + 1,
        新selectedSession: selectedSession + 1
      });

      // 重置状态
      handlePatternReset();
      setGameState(prev => ({
        ...prev,
        history: [],
        totalPredictions: 0,
        correctPredictions: 0,
        predictionStats: []
      }));

      // 清除矩阵数据
      setMatrixData(createEmptyMatrix());

      setAlertMessage('会话已终止，可以开始新的输入');
      setAlertType('info');
      setShowAlert(true);
    } catch (error) {
      console.error('Error ending session:', error);
      setAlertMessage('终止会话时出错');
      setAlertType('error');
      setShowAlert(true);
    }
  };

  // 添加初始化会话的函数
  const initializeSession = useCallback(async () => {
    if (!isRecordMode) return;

    try {
      // 1. 获取当前日期的记录
      const { data: record } = await supabase
        .from('daily_records')
        .select('latest_session_id')
        .eq('date', selectedDate)
        .single();

      let newSessionId = 1;  // 默认为 1

      // 2. 根据不同情况设置会话ID
      if (record && record.latest_session_id !== null) {
        // 当日期有记录，且 latest_session_id 不为 null
        newSessionId = record.latest_session_id + 1;
      }
      // 否则（没有记录或 latest_session_id 为 null）使用默认值 1

      // 3. 设置会话ID
      setCurrentSessionId(newSessionId);
      setSelectedSession(newSessionId);

      // 4. 如果是新日期，创建 daily_records
      if (!record) {
        const { error: insertError } = await supabase
          .from('daily_records')
          .insert({
            date: selectedDate,
            latest_session_id: null,  // 初始为 null
            total_predictions: 0,
            correct_predictions: 0
          });

        if (insertError) throw insertError;
      }

      // 5. 重置游戏状态
      setGameState(prev => ({
        ...prev,
        history: [],
        totalPredictions: 0,
        correctPredictions: 0,
        predictionStats: []
      }));

      return newSessionId;
    } catch (error) {
      console.error('Error initializing session:', error);
      setCurrentSessionId(1);
      setSelectedSession(1);
      return 1;
    }
  }, [selectedDate, isRecordMode]);

  // 在日期变更时初始化会话
  useEffect(() => {
    if (isRecordMode) {
      initializeSession();
    }
  }, [selectedDate, isRecordMode, initializeSession]);

  // 修改 saveMove 函数
  const saveMove = useCallback(async (
    position: Position,
    color: DotColor,
    prediction: any,
    sequenceNumber: number
  ) => {
    const sessionIdToUse = getSessionIdToUse();

    // 只在开发环境下输出日志
    if (process.env.NODE_ENV === 'development') {
      console.log('保存移动记录，使用会话ID:', sessionIdToUse);
    }

    try {
      // 使用upsert代替insert，确保session_id被正确设置
      const { data, error } = await supabase
        .from('moves')
        .upsert({
          date: selectedDate,
          position: position,
          color: color,
          prediction: prediction,
          sequence_number: sequenceNumber,
          session_id: sessionIdToUse  // 明确设置session_id
        });

      if (error) throw error;

      // 验证保存是否成功
      try {
        const { data: verifyData, error: verifyError } = await supabase
          .from('moves')
          .select('session_id')
          .eq('date', selectedDate)
          .eq('sequence_number', sequenceNumber)
          .single();

        if (verifyError) {
          console.error('验证保存时出错:', verifyError);
        } else if (process.env.NODE_ENV === 'development') {
          // 只在开发环境下输出详细验证日志
          console.log('验证保存结果:', {
            实际保存的会话ID: verifyData?.session_id,
            预期会话ID: sessionIdToUse,
            是否一致: verifyData?.session_id === sessionIdToUse ? '✓ 一致' : '✗ 不一致'
          });
        }
      } catch (verifyError) {
        console.error('验证过程出错:', verifyError);
      }

    } catch (error) {
      console.error('保存移动记录时出错:', error);
      setAlertMessage('保存移动时出错');
      setAlertType('error');
      setShowAlert(true);
    }
  }, [selectedDate, getSessionIdToUse]);

  // 序列配置变更
  const handleSequenceConfigChange = useCallback((newConfig: SequenceConfig) => {
    setCurrentSequenceConfig(newConfig);

    // 更新预测器的序列长度
    predictor.updateConfig(newConfig);

    // 如果启用了预测且有历史记录，尝试重新预测
    if (newConfig.isEnabled && gameState.history.length > 0) {
      // 使用固定位置代替findNextEmptyPosition
      debouncedPredict([...allGameHistory, ...gameState.history], { row: 0, col: 0 });
    } else {
      // 如果禁用了预测，清除预测状态
      setPredictedColor(null);
      setPredictedPosition(null);
      setPredictedProbability(null);
    }
  }, [gameState, allGameHistory, debouncedPredict, predictor]);

  // 获取历史记录中最后N个颜色
  const getLastNColors = (history: Move[], n: number): DotColor[] => {
    const colors = history.map(move => move.color);
    return colors.slice(-n);
  };

  // 从当天历史数据初始化矩阵
  useEffect(() => {
    // 确保数据已加载完成
    if (!isLoading && gameState.history.length > 0) {
      const maxBalls = PATTERN_ROWS * PATTERN_COLS; // 48个
      const history = gameState.history;
      const startIndex = Math.max(0, history.length - maxBalls);
      const displayHistory = history.slice(startIndex); // 只取最后48个

      // 只在开发环境下输出日志
      if (process.env.NODE_ENV === 'development') {
        console.log('初始化3x16矩阵:', {
          totalHistory: history.length,
          displayHistory: displayHistory.length
        });
      }

      // 重置矩阵
      const newMatrix = createEmptyMatrix();

      // 按顺序添加每个颜色
      displayHistory.forEach((move, index) => {
        const col = Math.floor(index / PATTERN_ROWS);
        const row = index % PATTERN_ROWS;
        newMatrix[row][col] = move.color;
      });

      setMatrixData(newMatrix);
    }
  }, [gameState.history, isLoading]);

  // 检查行中最后两个颜色的函数
  const checkLastTwoColors = useCallback((row: (DotColor | null)[]) => {
    const nonNullColors = row.filter(color => color !== null) as DotColor[];
    if (nonNullColors.length < 2) return null;

    const lastTwoColors = nonNullColors.slice(-2);

    // 如果最后两个颜色相同，返回该颜色，否则返回null
    return lastTwoColors[0] === lastTwoColors[1] ? lastTwoColors[0] : null;
  }, []);

  // 清除操作
  const handleClear = useCallback(async () => {
    try {
      // 调用清空所有数据的方法
      await storage.clearAllData();

      // 重置本地状态
      setGameState(prev => ({
        ...prev,
        history: [],
        totalPredictions: 0,
        correctPredictions: 0,
        predictionStats: []
      }));

      // 清空矩阵数据
      setMatrixData(createEmptyMatrix());

      // 重置会话ID状态
      setCurrentSessionId(1);
      setLatestSessionId(null);
      setSelectedSession(1);

      console.log('清空数据后重置会话ID:', {
        currentSessionId: 1,
        latestSessionId: null,
        selectedSession: 1
      });

      setAlertMessage('已清空所有数据');
      setAlertType('info');
      setShowAlert(true);
    } catch (error) {
      console.error('Error clearing all data:', error);
      setAlertMessage('清空数据失败');
      setAlertType('error');
      setShowAlert(true);
    }
  }, [setCurrentSessionId, setLatestSessionId, setSelectedSession]);

  // 撤销上一步操作
  const handleUndo = useCallback(async () => {
    if (!isRecordMode) {
      setAlertMessage('预览模式下不能撤销');
      setAlertType('warning');
      setShowAlert(true);
      return;
    }

    if (gameState.history.length === 0) {
      setAlertMessage('没有可撤销的操作');
      setAlertType('info');
      setShowAlert(true);
      return;
    }

    // 1. 更新本地状态
    const newHistory = [...gameState.history];
    newHistory.pop(); // 移除最后一个操作

    setGameState(prev => ({
      ...prev,
      history: newHistory,
      totalPredictions: 0,
      correctPredictions: 0,
      predictionStats: []
    }));

    // 2. 从数据库删除最后一条记录
    try {
      const { error } = await supabase
        .from('moves')
        .delete()
        .eq('date', selectedDate)
        .eq('session_id', currentSessionId)
        .eq('sequence_number', gameState.history.length);

      if (error) throw error;
    } catch (error) {
      console.error('Error undoing move:', error);
      setAlertMessage('撤销操作失败');
      setAlertType('error');
      setShowAlert(true);
    }
  }, [isRecordMode, gameState, selectedDate, currentSessionId]);

  // 当序列配置变更时
  useEffect(() => {
    const newConfig = currentSequenceConfig;
    predictor.updateConfig(newConfig);

    // 如果启用了预测且有历史记录，尝试重新预测
    if (newConfig.isEnabled && gameState.history.length > 0) {
      // 使用固定位置代替findNextEmptyPosition
      debouncedPredict([...allGameHistory, ...gameState.history], { row: 0, col: 0 });
    } else {
      // 如果禁用了预测，清除预测状态
      setPredictedColor(null);
      setPredictedPosition(null);
      setPredictedProbability(null);
    }
  }, [gameState, allGameHistory, debouncedPredict, predictor]);

  // 在日期变化时获取会话列表
  useEffect(() => {
    fetchLatestSessionId(selectedDate);
    fetchAvailableSessions();
  }, [selectedDate, fetchLatestSessionId, fetchAvailableSessions]);

  // 初始化组件
  useEffect(() => {
    // 在组件首次加载时初始化
    fetchLatestSessionId(selectedDate);
    fetchAvailableSessions();
  }, [selectedDate, fetchLatestSessionId, fetchAvailableSessions]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* 标题部分 - 保持不变 */}
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

        {/* 主要内容区 - 改为单列布局 */}
        <div className="max-w-4xl mx-auto">
          {/* 1. 日期选择器 */}
          <div className="mb-6">
            <DateSelector
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              isRecordMode={isRecordMode}
              onModeChange={handleModeChange}
              currentSessionId={currentSessionId}
              latestSessionId={latestSessionId}
              availableSessions={availableSessions}
              selectedSession={selectedSession}
              onSessionChange={handleSessionChange}
              className="w-full"
            />
          </div>

          {/* 2. 连续模式预测矩阵 */}
          <div className="mb-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-lg">
              {/* 主标题单独占一行 */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">连续模式预测</h2>
              </div>

              <div className="p-6">
                {/* 设定和规则标题行 - 与下方内容对齐 */}
                <div className="grid grid-cols-[1fr_52px_52px] gap-[6px] mb-2">
                  <div></div> {/* 空div占位，与矩阵对齐 */}
                  <div className="text-sm font-medium text-gray-600 px-2 py-1 border border-gray-200 rounded text-center w-[52px]">设定</div>
                  <div className="text-sm font-medium text-gray-600 px-2 py-1 border border-gray-200 rounded text-center w-[52px]">规则</div>
                </div>

                {/* 内容区域 */}
                <div className="grid grid-cols-[1fr_52px_52px] gap-[6px]">
                  <div className="grid grid-rows-3 gap-[6px] bg-gray-100/50 p-[6px] rounded-lg">
                    {matrixData.map((row, rowIndex) => (
                      <div key={rowIndex} className="flex items-center gap-[6px]">
                        {row.map((color, colIndex) => (
                          <div
                            key={colIndex}
                            style={{ width: '40px', height: '40px', margin: '0 auto' }}
                            className={`rounded-full cursor-pointer border-2 
                              ${color === 'red'
                                ? 'bg-gradient-to-b from-red-400 to-red-600 border-red-400'
                                : color === 'black'
                                  ? 'bg-gradient-to-b from-gray-700 to-gray-900 border-gray-700'
                                  : 'bg-white border-gray-300'}
                              shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)]
                              hover:shadow-[inset_0_-3px_6px_rgba(0,0,0,0.3)]
                              active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]
                              transition-all duration-200 ease-in-out`}
                            title={color ? `第${colIndex + 1}列, 第${rowIndex + 1}行` : ''}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-rows-3 gap-[6px] bg-gray-100/50 p-[6px] rounded-lg justify-self-center w-[52px]">
                    {matrixData.map((row, rowIndex) => {
                      const predictedColor = checkLastTwoColors(row);
                      return (
                        <div key={rowIndex} className="relative">
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              animation: !predictedColor ? 'borderPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'colorPulse 3s ease-in-out infinite',
                              margin: '0 auto'
                            }}
                            className={`rounded-full cursor-pointer border-2 relative
                              ${predictedColor ?
                                `${predictedColor === 'red' ?
                                  'bg-gradient-to-b from-red-400 to-red-600 border-red-400 hover:from-red-500 hover:to-red-700' :
                                  'bg-gradient-to-b from-gray-700 to-gray-900 border-gray-700 hover:from-gray-800 hover:to-black'}`
                                : 'border-blue-400 bg-gradient-to-b from-gray-50 to-white'}
                              shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)]
                              hover:shadow-[inset_0_-3px_6px_rgba(0,0,0,0.3)]
                              active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]
                              transition-all duration-200 ease-in-out`}
                          />
                          {/* 蓝色方框呼吸灯效果 */}
                          {predictedColor && (
                            <div
                              key="border-pulse"
                              className="absolute inset-[-4px] rounded-full border-2 border-blue-400"
                              style={{
                                animation: 'borderPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* 规则列 */}
                  <div className="grid grid-rows-3 gap-[6px] bg-gray-100/50 p-[6px] rounded-lg justify-self-center w-[52px]">
                    {[0, 1, 2].map((index) => (
                      <div key={index} className="relative">
                        {index === 0 && rule75Prediction.currentSequence[0] ? (
                          // 第一行显示当前序列的第一个小球
                          <div
                            style={{ width: '40px', height: '40px', margin: '0 auto' }}
                            className={`rounded-full cursor-pointer border-2 relative
                              ${rule75Prediction.currentSequence[0] === 'red'
                                ? 'bg-gradient-to-b from-red-400 to-red-600 border-red-400'
                                : 'bg-gradient-to-b from-gray-700 to-gray-900 border-gray-700'}
                              shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)]
                              hover:shadow-[inset_0_-3px_6px_rgba(0,0,0,0.3)]
                              active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]
                              transition-all duration-200 ease-in-out`}
                            title={rule75Prediction.currentSequence[0] ? `第${index + 1}行` : ''}
                          />
                        ) : index === 1 && rule75Prediction.currentSequence[1] ? (
                          // 第二行显示当前序列的第二个小球
                          <div
                            style={{ width: '40px', height: '40px', margin: '0 auto' }}
                            className={`rounded-full cursor-pointer border-2 relative
                              ${rule75Prediction.currentSequence[1] === 'red'
                                ? 'bg-gradient-to-b from-red-400 to-red-600 border-red-400'
                                : 'bg-gradient-to-b from-gray-700 to-gray-900 border-gray-700'}
                              shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)]
                              hover:shadow-[inset_0_-3px_6px_rgba(0,0,0,0.3)]
                              active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]
                              transition-all duration-200 ease-in-out`}
                            title={rule75Prediction.currentSequence[1] ? `第${index + 1}行` : ''}
                          />
                        ) : index === 2 && rule75Prediction.predictedColor ? (
                          // 第三行显示预测的下一个小球
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              animation: 'colorPulse 3s ease-in-out infinite',
                              margin: '0 auto'
                            }}
                            className={`rounded-full cursor-pointer border-2 relative
                              ${rule75Prediction.predictedColor === 'red'
                                ? 'bg-gradient-to-b from-red-400 to-red-600 border-red-400'
                                : 'bg-gradient-to-b from-gray-700 to-gray-900 border-gray-700'}
                              shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)]
                              hover:shadow-[inset_0_-3px_6px_rgba(0,0,0,0.3)]
                              active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]
                              transition-all duration-200 ease-in-out`}
                            title={rule75Prediction.predictedColor ? `第${index + 1}行` : ''}
                          />
                        ) : (
                          // 默认显示空白小球
                          <div
                            style={{ width: '40px', height: '40px', margin: '0 auto' }}
                            className="rounded-full cursor-pointer border-2 border-blue-400 bg-gradient-to-b from-gray-50 to-white
                              shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)]
                              hover:shadow-[inset_0_-3px_6px_rgba(0,0,0,0.3)]
                              active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]
                              transition-all duration-200 ease-in-out"
                            title={index === 2 ? '预测' : ''}
                          />
                        )}
                        {/* 蓝色方框呼吸灯效果 */}
                        {(index === 2 && rule75Prediction.predictedColor) && (
                          <div
                            key="border-pulse"
                            className="absolute inset-[-4px] rounded-full border-2 border-blue-400"
                            style={{
                              animation: 'borderPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. 控制面板 */}
          <div className="mb-6">
            <ControlPanel
              selectedColor={selectedColor}
              onColorSelect={handleColorSelect}
              onUndo={handleUndo}
              onClear={handleClear}
              predictedColor={predictedColor}
              probability={predictedProbability}
              isRecordMode={isRecordMode}
              onSequenceConfigChange={handleSequenceConfigChange}
              sequenceConfig={currentSequenceConfig}
              rule75Prediction={rule75Prediction}
              onEndSession={handleEndSession}
            />
          </div>

          {/* 4. 游戏面板 */}
          <div className="mb-6">
            {/* 注释掉8x8矩阵部分
            
            */}

            {/* 预测序列显示 */}
            {isRecordMode && currentSequenceConfig.isEnabled && gameState.history.length > 0 && (
              <PredictionSequenceDisplay
                historicalColors={getLastNColors(gameState.history, currentSequenceConfig.length)}
                predictedColor={predictionDetails.color}
                matchCount={predictionDetails.matchCount}
                confidence={predictionDetails.probability}
                sequenceLength={currentSequenceConfig.length}
                isLoading={predictionDetails.isLoading}
              />
            )}
          </div>
        </div>
      </div>

      {/* 动画样式 */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes borderPulse {
            0%, 100% {
              border-color: rgb(96 165 250);
              box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.4);
            }
            50% {
              border-color: rgb(59 130 246);
              box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
            }
          }

          @keyframes colorPulse {
            0%, 100% {
              filter: brightness(1) saturate(1);
              transform: scale(1);
            }
            50% {
              filter: brightness(1.1) saturate(1.1);
              transform: scale(1.05);
            }
          }
        `
      }} />

      {/* 弹窗和加载组件 */}
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
