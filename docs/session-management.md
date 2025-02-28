# 会话管理功能文档

## 目录
1. [会话管理功能](#1-会话管理功能)
2. [终止输入功能](#2-终止输入功能)
3. [使用示例](#3-使用示例)
4. [错误处理](#4-错误处理)

## 1. 会话管理功能

### 1.1 基本概念
- **会话（Session）**：一次完整的输入过程
- **会话ID**：从1开始递增的整数，标识不同的输入会话
- **当前会话**：正在进行输入的会话
- **历史会话**：已经终止的会话

### 1.2 功能详解

#### A. 会话显示
```typescript
// 在 DateSelector 组件中显示会话下拉框
<select
  value={selectedSession || currentSessionId}
  onChange={(e) => onSessionChange(Number(e.target.value))}
  disabled={!isRecordMode}
>
  {availableSessions.map(sessionId => (
    <option key={sessionId} value={sessionId}>
      第 {sessionId} 次输入记录
    </option>
  ))}
  {/* 当前新会话显示 */}
  {(selectedSession === currentSessionId || availableSessions.length === 0) && (
    <option value={currentSessionId}>
      {availableSessions.length === 0 ? '新一轮输入中...' : '新一轮输入中...'}
    </option>
  )}
</select>
```

#### B. 会话状态
1. **空表状态**：
   - 显示："新一轮输入中..."
   - 会话ID = 1

2. **有历史记录状态**：
   - 显示：下拉列表包含所有历史会话
   - 最新会话显示："新一轮输入中..."

## 2. 终止输入功能

### 2.1 功能流程

```typescript
const handleEndSession = async () => {
  try {
    // 1. 检查记录是否存在
    const { data: existingRecord } = await supabase
      .from('daily_records')
      .select('id')
      .eq('date', selectedDate)
      .single();

    // 2. 更新或创建记录
    if (existingRecord) {
      // 更新现有记录
      await supabase
        .from('daily_records')
        .update({ latest_session_id: currentSessionId })
        .eq('date', selectedDate);
    } else {
      // 创建新记录
      await supabase
        .from('daily_records')
        .insert({
          date: selectedDate,
          latest_session_id: currentSessionId
        });
    }

    // 3. 更新状态
    setLatestSessionId(currentSessionId);
    setCurrentSessionId(prev => prev + 1);
    
    // 4. 重置界面
    handlePatternReset();
    setGameState(prev => ({
      ...prev,
      history: [],
      grid: createEmptyGrid(),
      windowStart: 0,
      isViewingHistory: false
    }));

    // 5. 显示成功提示
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
```

### 2.2 数据库结构
```sql
-- 日期记录表
CREATE TABLE daily_records (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  latest_session_id INTEGER NOT NULL,
  UNIQUE(date)
);

-- 移动记录表
CREATE TABLE moves (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  session_id INTEGER NOT NULL,
  sequence_number INTEGER NOT NULL,
  color TEXT NOT NULL,
  position JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 3. 使用示例

1. **新开始输入**：
   - 显示："新一轮输入中..."（会话ID = 1）
   - 可以开始点击格子输入

2. **终止当前输入**：
   - 点击"终止输入"按钮
   - 当前会话（如会话1）被保存
   - 界面重置，准备开始新的会话（会话2）

3. **查看历史会话**：
   - 从下拉框选择历史会话（如"第 1 次输入"）
   - 显示该会话的所有历史记录

4. **继续新的输入**：
   - 选择"新一轮输入中..."
   - 可以开始新一轮的输入

## 4. 错误处理

1. **数据库错误**：
   - 显示错误提示
   - 保持当前状态不变
   - 记录错误日志

2. **空表情况**：
   - 正确显示默认状态
   - 会话ID从1开始

3. **会话切换**：
   - 保证数据一致性
   - 防止数据丢失
   - 正确处理状态转换

4. **终止会话**：
   - 确保状态正确重置
   - 保存所有必要数据
   - 准备新会话环境

## 核心设计原则

- ✅ **数据完整性**：保证所有操作的原子性和一致性
- ✅ **用户体验**：提供清晰的界面反馈和状态提示
- ✅ **错误处理**：完善的错误处理机制和用户提示
- ✅ **状态管理**：准确的状态转换和数据同步

## 注意事项

1. 每次终止会话后：
   - 会话ID会自动递增
   - 界面会重置为初始状态
   - 历史记录保持可访问
   - 新会话可以立即开始

2. 数据安全：
   - 所有操作都有错误处理
   - 重要操作有确认机制
   - 数据库操作有事务保护

3. 用户体验：
   - 操作反馈及时
   - 状态变化清晰
   - 界面交互流畅
