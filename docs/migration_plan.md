# IndexedDB 到 Supabase 迁移方案

## 1. 概述

本文档详细说明将现有的 IndexedDB 存储方案迁移到 Supabase 的具体步骤和注意事项。迁移过程设计为平滑过渡，确保用户数据安全和应用功能的连续性。

## 2. 现有系统分析

### 2.1 当前存储接口
```typescript
interface StorageService {
  saveGameState(state: GameState): Promise<void>;
  loadGameState(): Promise<GameState | null>;
  saveGameStateByDate(state: GameState, date: string): Promise<void>;
  loadGameStateByDate(date: string): Promise<GameState | null>;
  saveGameHistory(state: GameState): Promise<void>;
  getGameHistory(): Promise<any[]>;
  clearAllData(): Promise<void>;
}
```

### 2.2 影响范围分析

不需要修改的组件：
- GameBoard.tsx
- ControlPanel.tsx
- DateSelector.tsx
- Timeline.tsx
- StatsPanel.tsx

需要修改的文件：
- storage.ts：替换实现，保持接口不变
- App.tsx：可能需要小幅修改错误处理逻辑

## 3. Supabase 实现方案

### 3.1 新的存储服务实现
```typescript
class SupabaseStorageService implements StorageService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  async saveGameStateByDate(state: GameState, date: string): Promise<void> {
    // 保存日期记录
    const { error: recordError } = await this.supabase
      .from('daily_records')
      .upsert({
        date,
        total_predictions: state.totalPredictions,
        correct_predictions: state.correctPredictions
      });

    if (recordError) throw recordError;

    // 保存移动记录
    const moves = state.history.map((move, index) => ({
      date,
      position: move.position,
      color: move.color,
      sequence_number: index,
      prediction: move.prediction
    }));

    const { error: movesError } = await this.supabase
      .from('moves')
      .upsert(moves);

    if (movesError) throw movesError;
  }

  async loadGameStateByDate(date: string): Promise<GameState | null> {
    // 实现详见代码
  }

  // ... 其他方法实现
}
```

### 3.2 离线支持方案
```typescript
class HybridStorageService implements StorageService {
  constructor(
    private supabase: SupabaseStorageService,
    private indexedDB: IndexedDBStorageService
  ) {}

  async saveGameStateByDate(state: GameState, date: string): Promise<void> {
    try {
      await this.supabase.saveGameStateByDate(state, date);
    } catch (error) {
      console.warn('Falling back to IndexedDB:', error);
      await this.indexedDB.saveGameStateByDate(state, date);
      await this.addToSyncQueue(state, date);
    }
  }
}
```

## 4. 迁移步骤

### 4.1 准备阶段
1. 创建 Supabase 项目
2. 执行数据库架构脚本
3. 配置必要的环境变量
4. 实现并测试 SupabaseStorageService

### 4.2 数据迁移
```typescript
async function migrateData() {
  // 1. 从 IndexedDB 读取所有数据
  const dates = await getAllDates();
  
  // 2. 逐日迁移
  for (const date of dates) {
    const state = await oldStorage.loadGameStateByDate(date);
    if (state) {
      await supabaseStorage.saveGameStateByDate(state, date);
    }
  }
}
```

### 4.3 过渡阶段
1. 部署 HybridStorageService
2. 监控系统运行状况
3. 收集用户反馈
4. 处理同步队列中的数据

### 4.4 完成迁移
1. 验证所有数据已正确迁移
2. 移除 IndexedDB 相关代码
3. 清理旧数据

## 5. 回滚计划

### 5.1 触发条件
- Supabase 服务不可用
- 数据不一致
- 性能问题

### 5.2 回滚步骤
1. 切换回 IndexedDB 实现
2. 从备份恢复数据
3. 移除 Supabase 相关代码

## 6. 测试计划

### 6.1 功能测试
- 数据保存和加载
- 离线操作
- 数据同步
- 错误处理

### 6.2 性能测试
- 响应时间
- 并发操作
- 网络延迟处理

### 6.3 兼容性测试
- 不同浏览器
- 不同设备
- 不同网络条件

## 7. 监控和维护

### 7.1 监控指标
- API 响应时间
- 错误率
- 同步队列长度
- 存储使用量

### 7.2 日常维护
- 日志分析
- 性能优化
- 数据备份
- 安全更新

## 8. 时间线

1. 准备阶段：2 天
   - 环境配置
   - 基础实现

2. 开发阶段：3 天
   - 完整实现
   - 单元测试
   - 集成测试

3. 测试阶段：2 天
   - 功能测试
   - 性能测试
   - 问题修复

4. 迁移阶段：1 天
   - 数据迁移
   - 监控部署
   - 用户通知

总计：8 个工作日

## 9. 风险评估

### 9.1 潜在风险
1. 数据迁移不完整
2. 网络连接不稳定
3. 性能下降
4. 用户体验影响

### 9.2 应对措施
1. 完善的数据验证机制
2. 健壮的错误处理
3. 离线支持
4. 用户反馈渠道
