import { DotColor, Move, PredictionResult } from '../types';

export interface SequenceConfig {
  length: number;
  isEnabled: boolean;
}

export class SequencePredictor {
  private config: SequenceConfig;
  private history: Move[];

  constructor(config: SequenceConfig = { length: 3, isEnabled: true }) {
    this.config = config;
    this.history = [];
  }

  /**
   * 更新历史数据
   * @param history 完整的历史数据序列，包含所有天数的数据
   */
  public updateHistory(history: Move[]): void {
    if (!Array.isArray(history)) {
      console.warn('Invalid history data provided');
      this.history = [];
      return;
    }
    this.history = history;
  }

  /**
   * 更新配置
   * @param config 配置更新
   */
  public updateConfig(config: Partial<SequenceConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }

  /**
   * 预测下一个颜色
   * 基于完整的历史数据序列进行匹配和预测
   * @returns 预测结果，包含颜色、概率和匹配次数
   */
  public predictNextColor(): PredictionResult | null {
    // 检查是否有足够的历史数据进行预测
    if (!this.config.isEnabled || this.history.length < this.config.length) {
      // 只在调试模式下输出
      if (process.env.NODE_ENV === 'development') {
        console.log('历史数据不足或预测未启用');
      }
      return null;
    }

    // 获取当前序列（最后 N-1 个颜色）
    const currentSequence = this.history.slice(-(this.config.length - 1)).map(move => move.color);
    
    // 在所有历史数据中查找匹配序列
    const matches: { color: DotColor; gameId?: string; date?: string }[] = [];
    
    // 遍历所有可能的历史序列（排除最后 config.length-1 个，因为它们是当前序列）
    const searchEndIndex = this.history.length - (this.config.length - 1); // 排除当前序列
    
    // 对于每个可能的起始位置
    for (let i = 0; i < searchEndIndex; i++) {
      // 获取当前位置的序列（长度为 config.length - 1）
      const historySequence = this.history.slice(i, i + this.config.length - 1).map(move => move.color);
      
      // 检查序列是否匹配当前序列
      if (this.sequencesMatch(historySequence, currentSequence)) {
        // 如果匹配，获取下一个颜色
        const nextMove = this.history[i + this.config.length - 1];
        if (nextMove) { // 确保存在下一个颜色
          matches.push({
            // @ts-ignore
            color: nextMove.color,
            // @ts-ignore
            gameId: nextMove.gameId,
            // @ts-ignore
            date: nextMove.date
          });
        }
      }
    }

    // 如果没有找到匹配的序列
    if (matches.length === 0) {
      return null;
    }

    // 统计每种颜色的出现次数
    const colorCounts = matches.reduce((acc, match) => {
      acc[match.color] = (acc[match.color] || 0) + 1;
      return acc;
    }, {} as Record<DotColor, number>);

    // 找出出现次数最多的颜色
    let maxCount = 0;
    let predictedColor: DotColor = 'black';
    
    for (const [color, count] of Object.entries(colorCounts)) {
      if (count > maxCount) {
        maxCount = count;
        predictedColor = color as DotColor;
      }
    }

    const probability = maxCount / matches.length;
    
    // 只在调试模式下输出简化的预测结果
    if (process.env.NODE_ENV === 'development') {
      console.log('预测结果:', {
        predictedColor,
        probability: probability.toFixed(2),
        matchCount: matches.length
      });
    }

    // 返回预测结果
    return {
      color: predictedColor,
      probability,
      matchCount: matches.length,
      pattern: ''
    };
  }

  /**
   * 辅助函数：检查两个序列是否匹配
   * @param seq1 序列1
   * @param seq2 序列2
   * @returns 是否匹配
   */
  private sequencesMatch(seq1: DotColor[], seq2: DotColor[]): boolean {
    if (seq1.length !== seq2.length) return false;
    return seq1.every((color, index) => color === seq2[index]);
  }

  /**
   * 获取当前统计信息
   * @returns 统计信息，包含总预测次数和正确预测次数
   */
  public getStats(): { totalPredictions: number; correctPredictions: number } {
    return {
      totalPredictions: this.history.filter(move => move.prediction).length,
      correctPredictions: this.history.filter(
        move => move.prediction && move.prediction.isCorrect
      ).length
    };
  }
}
