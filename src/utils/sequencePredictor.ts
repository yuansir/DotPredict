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
    this.config = { ...this.config, ...config };
  }

  // 预测下一个颜色
  public predictNextColor(): PredictionResult | null {
    if (!this.config.isEnabled || this.history.length < this.config.length) {
      return null;
    }

    // 获取最近的N个颜色序列
    const recentMoves = this.history.slice(-this.config.length);
    const recentColors = recentMoves.map(move => move.color);

    // 统计每种颜色出现的次数
    const colorCounts = recentColors.reduce((acc, color) => {
      acc[color] = (acc[color] || 0) + 1;
      return acc;
    }, {} as Record<DotColor, number>);

    // 找出出现次数最多的颜色
    let maxCount = 0;
    let predictedColor: DotColor | null = null;
    
    for (const [color, count] of Object.entries(colorCounts)) {
      if (count > maxCount) {
        maxCount = count;
        predictedColor = color as DotColor;
      }
    }

    if (!predictedColor) {
      return null;
    }

    // 计算预测的置信度
    const confidence = maxCount / this.config.length;

    return {
      color: predictedColor,
      probability: confidence
    };
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
