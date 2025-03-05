import { supabase } from '../lib/supabase';
import { GameState, Move, DotColor, Position, Session } from '../types';

/**
 * GameService - 封装所有游戏相关的数据操作
 * 提供清晰的API接口与Supabase交互
 */
export class GameService {
  /**
   * 加载指定日期和会话的游戏状态
   */
  async loadGameStateByDateAndSession(date: string, sessionId?: number): Promise<GameState | null> {
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
      
      // 执行查询
      const { data: moves, error: movesError } = await query;

      if (movesError) throw movesError;

      // 加载该日期的统计数据
      const { data: record, error: recordError } = await supabase
        .from('daily_records')
        .select('*')
        .eq('date', date)
        .maybeSingle();

      if (recordError) throw recordError;

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
   */
  async saveGameState(state: GameState, date: string, sessionId: number): Promise<void> {
    try {
      // 1. 保存或更新日期记录
      const { error: recordError } = await supabase
        .from('daily_records')
        .upsert(
          {
            date,
            total_predictions: state.totalPredictions,
            correct_predictions: state.correctPredictions,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'date',
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
          session_id: sessionId
        };
      });

      // 3. 删除当前会话的所有记录，然后重新插入
      const { error: deleteError } = await supabase
        .from('moves')
        .delete()
        .eq('date', date)
        .eq('session_id', sessionId);

      if (deleteError) throw deleteError;

      // 4. 插入新记录
      if (moves.length > 0) {
        console.log('保存游戏状态，使用会话ID:', sessionId, '总记录数:', moves.length);
        
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
   * 获取可用的会话列表
   */
  async getAvailableSessions(date: string): Promise<Session[]> {
    try {
      // 获取指定日期的所有不同的会话ID
      const { data, error } = await supabase
        .from('moves')
        .select('session_id, created_at')
        .eq('date', date)
        .order('session_id', { ascending: true });

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
        label: '新一轮输入中'
      });

      return sessions;
    } catch (error) {
      console.error('Error getting available sessions:', error);
      return [];
    }
  }

  /**
   * 获取最新的会话ID
   */
  async getLatestSessionId(date: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('moves')
        .select('session_id')
        .eq('date', date)
        .order('session_id', { ascending: false })
        .limit(1);

      if (error) throw error;

      return data?.length ? data[0].session_id : 0;
    } catch (error) {
      console.error('Error getting latest session ID:', error);
      return 0;
    }
  }

  /**
   * 终止当前会话
   */
  async endSession(date: string, sessionId: number): Promise<void> {
    try {
      console.log('正在终止会话:', { date, sessionId });
      
      // 1. 更新daily_records表，设置latest_session_id
      const { error: recordError } = await supabase
        .from('daily_records')
        .upsert({
          date,
          latest_session_id: sessionId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'date'
        });

      if (recordError) throw recordError;
      
      // 2. 记录会话结束状态
      const { error: sessionError } = await supabase
        .from('sessions')
        .upsert({
          date,
          session_id: sessionId,
          is_completed: true,
          end_time: new Date().toISOString()
        });

      if (sessionError) throw sessionError;
      
      console.log('会话终止成功:', { date, sessionId });
    } catch (error) {
      console.error('终止会话出错:', error);
      throw error;
    }
  }

  /**
   * 清空当前会话的所有数据
   */
  async clearSessionData(date: string, sessionId: number): Promise<void> {
    try {
      console.log('正在清空会话数据:', { date, sessionId });
      
      // 1. 首先删除moves表中的记录
      const { error: movesError } = await supabase
        .from('moves')
        .delete()
        .eq('date', date)
        .eq('session_id', sessionId);
        
      if (movesError) throw movesError;
      
      // 2. 更新daily_records表中的计数
      // 注意：我们不删除daily_records记录，只是将计数归零
      const { error: recordError } = await supabase
        .from('daily_records')
        .upsert({
          date,
          total_predictions: 0,
          correct_predictions: 0,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'date'
        });
        
      if (recordError) throw recordError;
      
      console.log('会话数据清空成功:', { date, sessionId });
    } catch (error) {
      console.error('清空会话数据出错:', error);
      throw error;
    }
  }

  /**
   * 初始化日期记录，确保daily_records表中存在对应日期的记录
   */
  async initializeDailyRecord(date: string, sessionId: number): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('daily_records')
        .upsert({
          date,
          latest_session_id: sessionId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'date'
        });
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error initializing daily record:', error);
      return false;
    }
  }
}

// 导出单例实例
export const gameService = new GameService();
