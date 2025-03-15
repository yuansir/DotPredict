import { supabase } from '../lib/supabase';
import { GameState, DotColor, Position, Session } from '../types';

/**
 * GameService - 封装所有游戏相关的数据操作
 * 提供清晰的API接口与Supabase交互
 */
export class GameService {
  /**
   * 加载指定日期和会话的游戏状态
   * @param date 日期
   * @param userId 用户ID，用于数据隔离
   * @param sessionId 会话ID
   */
  async loadGameStateByDateAndSession(date: string, userId: string | null, sessionId?: number): Promise<GameState | null> {
    try {
      // 构建查询条件
      let query = supabase
        .from('moves')
        .select('*')
        .eq('date', date)
        .order('sequence_number', { ascending: true });

      // 如果提供了sessionId，则按会话筛选
      if (sessionId !== undefined) {
        query = query.eq('session_id', sessionId);
      }

      // 如果提供了userId，则按用户ID筛选
      if (userId) {
        query = query.eq('user_id', userId);
      }

      // 执行查询
      const { data: moves, error: movesError } = await query;

      if (movesError) throw movesError;

      // 输出加载的移动数据详情
      // console.log('[DEBUG] 加载会话数据详情:', {
      //   date,
      //   sessionId,
      //   加载的步骤数: moves?.length || 0,
      //   原始数据: moves
      // });

      // 加载该日期的统计数据
      let recordQuery = supabase
        .from('daily_records')
        .select('*')
        .eq('date', date);
      
      // 如果提供了userId，则按用户ID筛选
      if (userId) {
        recordQuery = recordQuery.eq('user_id', userId);
      }
      
      // 使用排序和限制替代 maybeSingle，以确保即使有多条记录也能获取最新的记录
      const { data: records, error: recordError } = await recordQuery
        .order('updated_at', { ascending: false })
        .limit(1);

      if (recordError) throw recordError;
      
      // 获取第一条记录（最新的）
      const record = records && records.length > 0 ? records[0] : null;

      // 构建游戏状态
      const history = (moves || []).map(m => ({
        position: m.position as Position,
        color: m.color as DotColor,
        timestamp: new Date(m.created_at).getTime(),
        prediction: m.prediction
      }));

      return {
        history,
        windowStart: 0,
        totalPredictions: record?.total_predictions || 0,
        correctPredictions: record?.correct_predictions || 0,
        isViewingHistory: false,
        predictionStats: []
      };
    } catch (error) {
      console.error('Error loading game state:', error);
      throw error;
    }
  }

  /**
   * 保存游戏状态
   * @param state 游戏状态
   * @param date 日期
   * @param sessionId 会话ID
   * @param userId 用户ID，用于数据隔离
   */
  async saveGameState(state: GameState, date: string, sessionId: number, userId: string | null): Promise<void> {
    try {
      // 如果没有用户ID，则不保存数据
      if (!userId) {
        console.log('未提供用户ID，跳过数据保存');
        return;
      }

      // 1. 保存或更新日期记录
      const { error: recordError } = await supabase
        .from('daily_records')
        .upsert(
          {
            date,
            total_predictions: state.totalPredictions,
            correct_predictions: state.correctPredictions,
            updated_at: new Date().toISOString(),
            user_id: userId // 添加用户ID
          },
          {
            onConflict: 'date,user_id', // 指定冲突条件，包含用户ID
          }
        );

      if (recordError) throw recordError;

      // 2. 准备移动记录
      const moves = state.history.map((move, index) => {
        // 确保时间戳是有效的
        let createdAt;
        try {
          createdAt = new Date(move.timestamp).toISOString();
        } catch (error) {
          console.warn('Invalid timestamp detected, using current time instead:', move.timestamp);
          createdAt = new Date().toISOString();
        }

        return {
          date,
          position: move.position,
          color: move.color,
          sequence_number: index,
          prediction: move.prediction,
          created_at: createdAt,
          session_id: sessionId,
          user_id: userId // 添加用户ID
        };
      });

      // 3. 删除当前会话的所有记录，然后重新插入
      const { error: deleteError } = await supabase
        .from('moves')
        .delete()
        .eq('date', date)
        .eq('session_id', sessionId)
        .eq('user_id', userId); // 添加用户ID条件

      if (deleteError) throw deleteError;

      // 4. 插入新记录
      if (moves.length > 0) {
        console.log('保存游戏状态，使用会话ID:', sessionId, '用户ID:', userId, '总记录数:', moves.length);

        const { error: movesError } = await supabase
          .from('moves')
          .insert(moves);

        if (movesError) throw movesError;
      }
    } catch (error) {
      console.error('Error saving game state:', error);
      throw error;
    }
  }

  /**
   * 获取可用会话列表
   * @param date 日期
   * @param userId 用户ID，用于数据隔离
   */
  async getAvailableSessions(date: string, userId: string | null = null): Promise<Session[]> {
    try {
      // 查询条件
      let query = supabase
        .from('moves')
        .select('session_id, created_at')
        .eq('date', date)
        .order('session_id', { ascending: true });
      
      // 如果提供了userId，则按用户ID筛选
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;

      if (error) throw error;

      // 统计每个会话的记录数
      const sessionCounts: Record<number, number> = {};
      const sessionTimes: Record<number, Date> = {};

      data?.forEach(move => {
        const sessionId = move.session_id;
        sessionCounts[sessionId] = (sessionCounts[sessionId] || 0) + 1;

        // 记录最早的时间
        const moveTime = new Date(move.created_at);
        if (!sessionTimes[sessionId] || moveTime < sessionTimes[sessionId]) {
          sessionTimes[sessionId] = moveTime;
        }
      });

      // 构建会话列表
      const sessions: Session[] = Object.keys(sessionCounts).map(sessionIdStr => {
        const sessionId = parseInt(sessionIdStr);
        return {
          id: sessionId,
          moveCount: sessionCounts[sessionId],
          startTime: sessionTimes[sessionId],
          label: `第${sessionId}轮 (${sessionCounts[sessionId]}步)`
        };
      });

      // 添加一个"新输入"会话选项
      const latestSessionId = sessions.length > 0
        ? Math.max(...sessions.map(s => s.id))
        : 0;

      sessions.push({
        id: latestSessionId + 1,
        moveCount: 0,
        startTime: new Date(),
        label: '新一轮输入中...'
      });

      return sessions;
    } catch (error) {
      console.error('Error getting available sessions:', error);
      return [{
        id: 1,
        moveCount: 0,
        startTime: new Date(),
        label: '新一轮输入中...'
      }];
    }
  }

  /**
   * 获取最新会话ID
   * @param date 日期
   * @param userId 用户ID，用于数据隔离
   */
  async getLatestSessionId(date: string, userId: string | null = null): Promise<number> {
    try {
      // 查询条件
      let query = supabase
        .from('daily_records')
        .select('latest_session_id')
        .eq('date', date);
      
      // 如果提供了userId，则按用户ID筛选
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      // 使用排序和限制替代 maybeSingle，以确保即使有多条记录也能获取最新的记录
      const { data: records, error } = await query
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      // 如果找到记录且有最新会话ID，则返回
      if (records && records.length > 0 && records[0].latest_session_id) {
        return records[0].latest_session_id;
      }

      // 否则查询moves表获取最大会话ID
      let movesQuery = supabase
        .from('moves')
        .select('session_id')
        .eq('date', date)
        .order('session_id', { ascending: false })
        .limit(1);
      
      // 如果提供了userId，则按用户ID筛选
      if (userId) {
        movesQuery = movesQuery.eq('user_id', userId);
      }
      
      const { data: movesData, error: movesError } = await movesQuery;

      if (movesError) throw movesError;

      // 如果找到记录，返回最大会话ID
      if (movesData && movesData.length > 0) {
        return movesData[0].session_id;
      }

      // 如果没有找到任何记录，返回0
      return 0;
    } catch (error) {
      console.error('Error getting latest session ID:', error);
      return 0;
    }
  }

  /**
   * 初始化日期记录
   * @param date 日期
   * @param initialSessionId 初始会话ID
   * @param userId 用户ID，用于数据隔离
   */
  async initializeDailyRecord(date: string, initialSessionId: number, userId: string | null = null): Promise<boolean> {
    try {
      // 如果没有用户ID，则不初始化数据
      if (!userId) {
        console.log('未提供用户ID，跳过初始化日期记录');
        return false;
      }

      const { error } = await supabase
        .from('daily_records')
        .upsert(
          {
            date,
            latest_session_id: initialSessionId,
            total_predictions: 0,
            correct_predictions: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: userId // 添加用户ID
          },
          {
            onConflict: 'date,user_id', // 指定冲突条件，包含用户ID
          }
        );

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error initializing daily record:', error);
      return false;
    }
  }

  /**
   * 更新最新会话ID
   * @param date 日期
   * @param sessionId 会话ID
   * @param userId 用户ID，用于数据隔离
   */
  async updateLatestSessionId(date: string, sessionId: number, userId: string | null = null): Promise<void> {
    try {
      // 如果没有用户ID，则不更新数据
      if (!userId) {
        console.log('未提供用户ID，跳过更新最新会话ID');
        return;
      }

      const { error } = await supabase
        .from('daily_records')
        .update({ latest_session_id: sessionId })
        .eq('date', date)
        .eq('user_id', userId); // 添加用户ID条件

      if (error) throw error;
    } catch (error) {
      console.error('Error updating latest session ID:', error);
      throw error;
    }
  }

  /**
   * 清除会话数据
   * @param date 日期
   * @param sessionId 会话ID
   * @param userId 用户ID，用于数据隔离
   * @returns 包含操作成功状态和新会话ID的对象
   */
  async clearSessionData(date: string, sessionId: number, userId: string | null = null): Promise<{ success: boolean, latestSessionId?: number }> {
    try {
      // 如果没有用户ID，则不清除数据
      if (!userId) {
        console.log('未提供用户ID，跳过清除会话数据');
        return { success: false };
      }

      console.log('正在清空会话数据:', { date, sessionId, userId });

      // 1. 首先删除moves表中的记录
      const { error: movesError } = await supabase
        .from('moves')
        .delete()
        .eq('date', date)
        .eq('session_id', sessionId)
        .eq('user_id', userId); // 添加用户ID条件

      if (movesError) throw movesError;

      // 2. 更新daily_records表中的计数
      // 注意：我们不删除daily_records记录，只是将计数归零
      const { error: recordError } = await supabase
        .from('daily_records')
        .upsert({
          date,
          total_predictions: 0,
          correct_predictions: 0,
          updated_at: new Date().toISOString(),
          user_id: userId // 添加用户ID
        }, {
          onConflict: 'date,user_id' // 指定冲突条件，包含用户ID
        });

      if (recordError) throw recordError;

      // 3. 获取当前最大会话ID以生成新的会话ID
      let sessionQuery = supabase
        .from('moves')
        .select('session_id')
        .eq('date', date)
        .order('session_id', { ascending: false })
        .limit(1);
      
      // 如果提供了userId，则按用户ID筛选
      if (userId) {
        sessionQuery = sessionQuery.eq('user_id', userId);
      }
      
      const { data: sessionData, error: sessionError } = await sessionQuery;
      
      if (sessionError) throw sessionError;
      
      // 计算新的会话ID
      let newSessionId = 1; // 默认从1开始
      if (sessionData && sessionData.length > 0) {
        newSessionId = sessionData[0].session_id + 1;
      }

      console.log('会话数据清空成功:', { date, sessionId, userId, newSessionId });
      return { 
        success: true, 
        latestSessionId: newSessionId 
      };
    } catch (error) {
      console.error('清空会话数据出错:', error);
      return { success: false };
    }
  }
  
  /**
   * 终止当前会话
   * @param date 日期
   * @param sessionId 会话ID
   * @param userId 用户ID，用于数据隔离
   */
  async endSession(date: string, sessionId: number, userId: string | null = null): Promise<void> {
    try {
      // 如果没有用户ID，则不终止会话
      if (!userId) {
        console.log('未提供用户ID，跳过终止会话');
        return;
      }
      
      console.log('正在终止会话:', { date, sessionId, userId });

      // 更新daily_records表，设置latest_session_id
      const { error: recordError } = await supabase
        .from('daily_records')
        .upsert({
          date,
          latest_session_id: sessionId,
          updated_at: new Date().toISOString(),
          user_id: userId
        }, {
          onConflict: 'date,user_id'
        });

      if (recordError) throw recordError;

      console.log('会话终止成功:', { date, sessionId, userId });
    } catch (error) {
      console.error('终止会话出错:', error);
      throw error;
    }
  }

  /**
   * 检查指定日期、会话ID和用户ID的 moves 记录是否存在
   * @param date 日期
   * @param sessionId 会话ID
   * @param userId 用户ID，用于数据隔离
   * @returns 是否存在记录
   */
  async hasMovesForSession(date: string, sessionId: number, userId: string | null = null): Promise<boolean> {
    try {
      // 构建查询条件
      let query = supabase
        .from('moves')
        .select('id', { count: 'exact' })
        .eq('date', date)
        .eq('session_id', sessionId);
      
      // 如果提供了userId，则按用户ID筛选
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      // 执行查询
      const { count, error } = await query;
      
      if (error) throw error;
      
      // 如果有记录，返回true；否则返回false
      return count !== null && count > 0;
    } catch (error) {
      console.error('Error checking moves for session:', error);
      return false;
    }
  }
}

export const gameService = new GameService();
