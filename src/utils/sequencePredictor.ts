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

  // 更新历史记录
  public updateHistory(history: Move[]): void {
    this.history = history;
  }

  // 更新配置
  public updateConfig(config: Partial<SequenceConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }

  // 预测下一个颜色
  public predictNextColor(): PredictionResult | null {
    if (!this.config.isEnabled || this.history.length < this.config.length - 1) {
      return {
        color: 'black',
        probability: 0,
        matchCount: 0
      };
    }

    // 获取当前序列（最后 N-1 个颜色）
    const currentSequence = this.history.slice(-(this.config.length - 1)).map(move => move.color);
    
    // 在历史数据中查找匹配序列
    const matches: DotColor[] = [];
    
    // 遍历所有可能的历史序列
    for (let i = 0; i <= this.history.length - this.config.length; i++) {
      const historySequence = this.history.slice(i, i + this.config.length - 1).map(move => move.color);
      
      // 检查序列是否匹配
      if (this.sequencesMatch(historySequence, currentSequence)) {
        // 如果匹配，记录下一个颜色
        const nextColor = this.history[i + this.config.length - 1].color;
        matches.push(nextColor);
      }
    }

    if (matches.length === 0) {
      return {
        color: 'black',
        probability: 0,
        matchCount: 0
      };
    }

    // 统计颜色频率并计算置信度
    const colorCounts = this.calculateColorCounts(matches);
    const { color: predictedColor, count: maxCount } = this.findMostFrequentColor(colorCounts);

    return {
      color: predictedColor,
      probability: maxCount / matches.length,
      matchCount: matches.length
    };
  }

  // 辅助函数：检查两个序列是否匹配
  private sequencesMatch(seq1: DotColor[], seq2: DotColor[]): boolean {
    if (seq1.length !== seq2.length) return false;
    return seq1.every((color, index) => color === seq2[index]);
  }

  // 辅助函数：计算颜色出现次数
  private calculateColorCounts(colors: DotColor[]): Record<DotColor, number> {
    return colors.reduce((acc, color) => {
      acc[color] = (acc[color] || 0) + 1;
      return acc;
    }, {} as Record<DotColor, number>);
  }

  // 辅助函数：找出出现次数最多的颜色
  private findMostFrequentColor(counts: Record<DotColor, number>): { color: DotColor, count: number } {
    let maxCount = 0;
    let mostFrequentColor: DotColor = 'black';

    for (const [color, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequentColor = color as DotColor;
      }
    }

    return { color: mostFrequentColor, count: maxCount };
  }

  // 获取当前统计信息
  public getStats(): { totalPredictions: number; correctPredictions: number } {
    return {
      totalPredictions: this.history.filter(move => move.prediction).length,
      correctPredictions: this.history.filter(
        move => move.prediction && move.prediction.isCorrect
      ).length
    };
  }
}
