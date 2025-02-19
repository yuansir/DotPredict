import { supabase } from '../lib/supabase';
import { GameState, Move, DotColor, Position } from '../types';

export class SupabaseStorageService {
  async saveGameStateByDate(state: GameState, date: string): Promise<void> {
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
            onConflict: 'date',  // 指定在 date 字段冲突时更新记录
          }
        );

      if (recordError) throw recordError;

      // 2. 保存移动记录
      const moves = state.history.map((move, index) => ({
        date,
        position: move.position,
        color: move.color,
        sequence_number: index,
        prediction: move.prediction,
        created_at: new Date(move.timestamp).toISOString()
      }));

      // 先删除当天的所有记录，然后重新插入
      const { error: deleteError } = await supabase
        .from('moves')
        .delete()
        .eq('date', date);

      if (deleteError) throw deleteError;

      if (moves.length > 0) {
        const { error: movesError } = await supabase
          .from('moves')
          .insert(moves);

        if (movesError) throw movesError;
      }

      // 3. 更新序列模式（用于预测）
      if (moves.length >= 2) {
        for (let i = 0; i < moves.length - 1; i++) {
          const patternLength = Math.min(5, i + 1); // 最多取5个作为模式
          const pattern = moves.slice(Math.max(0, i - patternLength + 1), i + 1)
            .map(m => m.color);
          const nextColor = moves[i + 1].color;

          const { error: patternError } = await supabase
            .from('sequence_patterns')
            .upsert(
              {
                pattern,
                pattern_length: pattern.length,
                next_color: nextColor,
                last_seen_at: new Date().toISOString()
              },
              {
                onConflict: 'pattern,pattern_length,next_color'
              }
            );

          if (patternError) throw patternError;
        }
      }

    } catch (error) {
      console.error('Error saving game state:', error);
      throw error;
    }
  }

  async loadGameStateByDate(date: string): Promise<GameState | null> {
    try {
      // 1. 获取日期记录
      const { data: record, error: recordError } = await supabase
        .from('daily_records')
        .select('*')
        .eq('date', date)
        .maybeSingle();

      if (recordError) throw recordError;

      // 2. 获取移动记录
      const { data: moves, error: movesError } = await supabase
        .from('moves')
        .select('*')
        .eq('date', date)
        .order('sequence_number', { ascending: true });

      if (movesError) throw movesError;

      // 3. 构建游戏状态
      const grid = this.reconstructGrid(moves || []);
      const history = (moves || []).map(m => ({
        position: m.position as Position,
        color: m.color as DotColor,
        timestamp: new Date(m.created_at).getTime(),
        prediction: m.prediction
      }));

      return {
        grid,
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

  async getPrediction(currentPattern: DotColor[]): Promise<{ color: DotColor; confidence: number } | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_sequence_prediction', {
          current_pattern: currentPattern,
          pattern_length: currentPattern.length
        });

      if (error) throw error;

      if (!data || data.length === 0) return null;

      return {
        color: data[0].predicted_color as DotColor,
        confidence: data[0].confidence
      };

    } catch (error) {
      console.error('Error getting prediction:', error);
      return null;
    }
  }

  async saveGameHistory(state: GameState): Promise<void> {
    // 这里我们可以在 daily_records 表中添加一个标记，表示这是一个历史记录点
    try {
      const { error } = await supabase
        .from('daily_records')
        .update({ is_history_point: true })
        .eq('date', new Date().toISOString().split('T')[0]);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving game history:', error);
      throw error;
    }
  }

  async getGameHistory(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('daily_records')
        .select(`
          date,
          total_predictions,
          correct_predictions
        `)
        .eq('is_history_point', true)
        .order('date', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting game history:', error);
      return [];
    }
  }

  async clearAllData(): Promise<void> {
    try {
      // 按照外键依赖关系的顺序删除数据
      // 1. 先删除依赖于 daily_records 的 moves 表数据
      const { error: movesError } = await supabase
        .from('moves')
        .delete()
        .gte('created_at', '1970-01-01');  // moves 表有 created_at 字段
      
      if (movesError) {
        console.error('Error clearing moves:', movesError);
        throw movesError;
      }

      // 2. 删除序列相关的数据
      const { error: patternsError } = await supabase
        .from('sequence_patterns')
        .delete()
        .gte('last_seen_at', '1970-01-01');  // sequence_patterns 表有 last_seen_at 字段

      if (patternsError) {
        console.error('Error clearing patterns:', patternsError);
        throw patternsError;
      }

      const { error: statsError } = await supabase
        .from('sequence_stats')
        .delete()
        .gte('pattern_length', 0);  // 使用 pattern_length 字段，它不是保留字且所有记录都 >= 0

      if (statsError) {
        console.error('Error clearing stats:', statsError);
        throw statsError;
      }

      // 3. 最后删除 daily_records 表数据
      const { error: recordsError } = await supabase
        .from('daily_records')
        .delete()
        .gte('updated_at', '1970-01-01');  // daily_records 表有 updated_at 字段

      if (recordsError) {
        console.error('Error clearing records:', recordsError);
        throw recordsError;
      }

      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  private reconstructGrid(moves: any[]): (DotColor | null)[][] {
    const grid = Array(8).fill(null).map(() => Array(8).fill(null));
    moves.forEach(move => {
      const { row, col } = move.position;
      grid[row][col] = move.color;
    });
    return grid;
  }
}
