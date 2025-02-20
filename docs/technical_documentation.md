# DotPredict 技术开发文档

## 1. 模块概述

### 1.1 核心功能模块

#### 游戏逻辑模块 (`utils/gameLogic.ts`)
- **功能**: 管理游戏状态、历史记录和游戏规则
- **输入**: 用户操作（放置点、撤销、清空等）
- **输出**: 更新后的游戏状态

#### 序列预测模块 (`utils/sequencePredictor.ts`)
- **功能**: 分析历史序列并预测下一个点的颜色
- **输入**: 历史序列数据、序列长度配置
- **输出**: 预测结果（颜色和概率）

#### 存储服务模块 (`services/supabase-storage.ts`)
- **功能**: 管理数据持久化和云端同步
- **输入**: 游戏状态数据
- **输出**: 存储确认和检索结果

### 1.2 UI组件模块

#### 游戏面板 (`components/GameBoard.tsx`)
- **功能**: 显示点阵和处理点击事件
- **输入**: 游戏状态、点击事件
- **输出**: 用户交互反馈

#### 控制面板 (`components/ControlPanel.tsx`)
- **功能**: 提供游戏控制和预测显示
- **输入**: 游戏状态、预测结果
- **输出**: 用户操作指令

#### 预测序列显示 (`components/PredictionSequenceDisplay.tsx`)
- **功能**: 展示预测序列和结果
- **输入**: 预测数据和序列
- **输出**: 可视化预测信息

## 2. 矩阵结构

### 2.1 游戏矩阵
- **结构**: 10x10网格
- **数据类型**: `Cell[][]`
- **示例**:
```typescript
interface Cell {
  color: DotColor | null;  // 'red' | 'black' | null
  position: Position;      // { row: number, col: number }
}
```

### 2.2 历史记录矩阵
- **结构**: 线性历史记录数组
- **数据类型**: `Move[]`
- **示例**:
```typescript
interface Move {
  color: DotColor;
  position: Position;
  timestamp: number;
}
```

## 3. 预测序列分析计算规则

### 3.1 基于序列的预测
- **规则描述**: 分析历史序列中的模式，预测下一个可能的颜色
- **计算步骤**:
  1. 获取最近N个点的序列（N为配置的序列长度）
  2. 在历史数据中查找相同模式
  3. 统计模式后续颜色的分布
  4. 计算各颜色的概率

#### 示例分析
假设序列长度为4，当前历史记录如下（R=红色，B=黑色）：
```
历史序列：[R,B,R,B,R,B,R,B,R,B,R,R,B,R,B]
```

**步骤1: 获取当前序列（最后4个）**
```
当前序列：[B,R,B,R]
```

**步骤2: 在历史中查找相同模式**
```
历史中的匹配：
1. [B,R,B,R] -> B (位置: 2-5)
2. [B,R,B,R] -> R (位置: 6-9)
3. [B,R,B,R] -> R (位置: 10-13)
```

**步骤3: 统计后续颜色**
```
在模式 [B,R,B,R] 之后出现的颜色统计：
- 黑色(B): 1次
- 红色(R): 2次
```

**步骤4: 计算概率**
```
预测概率：
- 黑色(B): 1/3 = 33.33%
- 红色(R): 2/3 = 66.67%
```

**最终预测**：
- 预测下一个颜色：红色(R)
- 置信度：66.67%

#### 代码实现
```typescript
class SequencePredictor {
  private findPatterns(sequence: DotColor[]): Pattern[] {
    const patterns: Pattern[] = [];
    const history = this.history;
    
    // 在历史记录中查找匹配的模式
    for (let i = 0; i <= history.length - sequence.length; i++) {
      let isMatch = true;
      for (let j = 0; j < sequence.length; j++) {
        if (history[i + j] !== sequence[j]) {
          isMatch = false;
          break;
        }
      }
      
      // 如果找到匹配且后面还有颜色，记录这个模式
      if (isMatch && i + sequence.length < history.length) {
        patterns.push({
          sequence: sequence.slice(),
          nextColor: history[i + sequence.length],
          position: i
        });
      }
    }
    
    return patterns;
  }

  public predictNextColor(): Prediction {
    const currentSequence = this.history.slice(-this.config.length);
    const patterns = this.findPatterns(currentSequence);
    
    // 统计每种颜色出现的次数
    const colorCounts = patterns.reduce((acc, pattern) => {
      acc[pattern.nextColor] = (acc[pattern.nextColor] || 0) + 1;
      return acc;
    }, {} as Record<DotColor, number>);
    
    // 找出出现次数最多的颜色
    let maxCount = 0;
    let predictedColor: DotColor | null = null;
    
    Object.entries(colorCounts).forEach(([color, count]) => {
      if (count > maxCount) {
        maxCount = count;
        predictedColor = color as DotColor;
      }
    });
    
    // 计算置信度
    const probability = predictedColor 
      ? maxCount / patterns.length 
      : 0;
    
    return {
      color: predictedColor,
      probability
    };
  }
}
```

### 3.2 75%规则预测
- **规则描述**: 基于最近两个点的颜色预测下一个
- **规则映射**:
  - 黑黑 → 红 (75%)
  - 红红 → 黑 (75%)
  - 黑红 → 红 (75%)
  - 红黑 → 黑 (75%)

### 3.3 预测准确度计算
```typescript
准确度 = 正确预测次数 / 总预测次数 * 100%
```

## 4. 关键核心代码位置

### 4.1 预测逻辑
- **文件**: `src/utils/sequencePredictor.ts`
- **核心类**: `SequencePredictor`
- **主要方法**:
  - `predictNextColor()`: 预测下一个颜色
  - `findPatterns()`: 查找历史模式
  - `calculateProbability()`: 计算预测概率

### 4.2 游戏状态管理
- **文件**: `src/App.tsx`
- **核心函数**:
  - `handleCellClick()`: 处理点击事件
  - `handleUndo()`: 处理撤销操作
  - `updatePrediction()`: 更新预测结果

### 4.3 数据持久化
- **文件**: `src/services/supabase-storage.ts`
- **主要方法**:
  - `saveGameState()`: 保存游戏状态
  - `loadGameState()`: 加载游戏状态
  - `syncWithCloud()`: 云端同步

## 5. 使用示例

### 5.1 预测序列分析
```typescript
// 初始化预测器
const predictor = new SequencePredictor(history, {
  length: 4,
  isEnabled: true
});

// 获取预测结果
const prediction = predictor.predictNextColor();
```

### 5.2 75%规则预测
```typescript
const predict75Rule = (history: DotColor[]) => {
  const lastTwo = history.slice(-2);
  const sequence = lastTwo.join('');
  
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
```

## 6. 开发注意事项

### 6.1 性能优化
- 使用防抖处理频繁的预测计算
- 优化历史记录的存储和检索
- 采用虚拟滚动处理大量历史数据

### 6.2 数据同步
- 定期保存游戏状态
- 处理网络异常情况
- 确保数据一致性

### 6.3 UI响应
- 添加适当的加载状态
- 提供清晰的用户反馈
- 确保动画流畅性

## 7. 未来优化方向

### 7.1 功能增强
- 支持更多预测算法
- 添加更详细的统计分析
- 优化预测准确度

### 7.2 性能提升
- 优化数据结构
- 改进算法效率
- 加强缓存策略

### 7.3 用户体验
- 完善错误处理
- 优化移动端适配
- 增强交互反馈
