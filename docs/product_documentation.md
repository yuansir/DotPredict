# DotPredict 产品功能说明文档

## 目录

1. [产品概述](#产品概述)
2. [功能模块](#功能模块)
   - [游戏界面](#游戏界面)
   - [矩阵显示与分页](#矩阵显示与分页)
   - [颜色选择](#颜色选择)
   - [历史与预测](#历史与预测)
   - [数据管理](#数据管理)
3. [业务逻辑详解](#业务逻辑详解)
   - [矩阵填充逻辑](#矩阵填充逻辑)
   - [分页逻辑](#分页逻辑)
   - [数据加载逻辑](#数据加载逻辑)
   - [预测逻辑](#预测逻辑)
4. [实例说明](#实例说明)
   - [矩阵填充示例](#矩阵填充示例)
   - [分页导航示例](#分页导航示例)
   - [数据加载示例](#数据加载示例)
5. [功能交互流程](#功能交互流程)

## 产品概述

DotPredict是一个基于React开发的预测游戏应用，核心功能包括记录红黑色球的序列并根据历史数据预测下一个球的颜色。应用采用3x24的矩阵显示历史记录，并提供分页功能以支持大量数据的浏览。

## 功能模块

### 游戏界面

游戏界面由以下主要部分组成：

1. **控制面板**：包含日期选择器、会话选择器、历史/录入模式切换等功能
2. **3x24矩阵区域**：显示历史记录的红黑球
3. **预测列**：显示当前预测结果
4. **颜色选择按钮**：用于选择添加的球的颜色
5. **分页导航**：在历史记录超过单页容量时提供翻页功能

### 矩阵显示与分页

#### 矩阵显示

- **矩阵结构**：3行24列，共可显示72个球
- **球的表示**：红球和黑球分别用不同颜色的圆形表示
- **布局对齐**：左侧矩阵与右侧预测矩阵保持垂直对齐，确保用户体验一致性

#### 分页系统

- **分页计算**：基于历史记录总长度计算总页数
- **导航控件**：提供首页、上一页、下一页、尾页按钮，以及当前页码和总页数显示
- **自动跳转**：在输入模式下，当创建新页面时自动跳转到最新页面
- **手动导航**：允许用户手动浏览历史页面，不受自动跳转影响

### 颜色选择

- **颜色按钮**：提供红色和黑色两个选择按钮
- **选择机制**：点击颜色按钮后，将选定颜色的球添加到当前矩阵中
- **预测触发**：添加球后，系统会根据历史数据进行下一个球颜色的预测

### 历史与预测

- **历史模式**：允许查看历史记录，但不允许添加新球
- **录入模式**：允许添加新球并触发预测
- **预测显示**：在预测列中显示预测的下一个球颜色及概率
- **预测准确率统计**：统计并显示预测的总体准确率

### 数据管理

- **会话管理**：支持创建多个会话，每个会话有独立的数据记录
- **数据持久化**：通过Supabase存储和加载游戏数据
- **历史浏览**：支持查看历史日期的记录，提供日期选择功能

## 业务逻辑详解

### 矩阵填充逻辑

1. **填充顺序**：
   - 矩阵从左上角开始填充（坐标[0,0]）
   - 首先沿着行方向填充（从左到右）
   - 当一行填满后，移至下一行的开始位置
   - 当三行都填满后（即72个球），创建新的页面继续填充

2. **填充规则**：
   - 每次添加新球，都会被放置在历史记录的末尾位置
   - 系统根据历史记录重新计算矩阵的显示内容
   - 在输入模式下，新添加的球总是显示在当前可见的页面中

3. **数据结构**：
   - 历史记录存储为一维数组，包含每个球的位置、颜色和时间戳
   - 矩阵显示则转换为二维结构，方便在界面上渲染

### 分页逻辑

1. **页面计算**：
   ```typescript
   // 每页可容纳的球数量
   const ballsPerPage = rowsPerPage * colsPerPage; // 通常是3*24=72

   // 总页数计算
   const totalPages = Math.max(1, Math.ceil(historyLength / ballsPerPage));
   ```

2. **当前页矩阵数据计算**：
   ```typescript
   // 根据当前页码和历史记录计算当前页应显示的数据
   const currentPageMatrix = useMemo(() => {
     // 计算当前页的起始索引
     const startIndex = (currentPage - 1) * ballsPerPage;
     // 计算当前页的结束索引
     const endIndex = Math.min(startIndex + ballsPerPage, completeHistory.length);
     
     // 填充空矩阵
     const pageMatrix = Array(rowsPerPage).fill(null).map(() => Array(colsPerPage).fill(null));
     
     // 根据历史记录填充矩阵
     for (let i = startIndex; i < endIndex; i++) {
       const move = completeHistory[i];
       const localIndex = i - startIndex;
       const row = Math.floor(localIndex / colsPerPage);
       const col = localIndex % colsPerPage;
       pageMatrix[row][col] = move.color;
     }
     
     return pageMatrix;
   }, [currentPage, completeHistory, ballsPerPage, rowsPerPage, colsPerPage, totalPages]);
   ```

3. **自动分页跳转逻辑**：
   ```typescript
   // 存储上一次的总页数
   const prevTotalPagesRef = useRef(1);
   
   // 自动调整页码的逻辑
   useEffect(() => {
     // 情况1：如果当前页超过了总页数，调整到最后一页
     if (currentPage > totalPages) {
       setCurrentPage(totalPages);
     } 
     // 情况2：在输入模式下，只有在总页数增加时才自动跳转到最新页面
     else if (isInputMode && totalPages > prevTotalPagesRef.current) {
       setCurrentPage(totalPages);
     }
     // 更新存储的总页数
     prevTotalPagesRef.current = totalPages;
   }, [totalPages, currentPage, isInputMode]);
   ```

### 数据加载逻辑

1. **数据来源**：
   - 游戏数据存储在Supabase数据库中
   - 包含多个表：`moves`（记录每个球的信息）、`daily_records`（记录每日统计）、`sessions`（记录会话信息）

2. **加载流程**：
   ```typescript
   // 1. 根据日期和会话ID加载数据
   async loadGameStateByDateAndSession(date: string, sessionId?: number) {
     // 2. 构建查询条件
     let query = supabase
       .from('moves')
       .select('*')
       .eq('date', date)
       .order('sequence_number', { ascending: true });

     // 3. 如果提供了sessionId，则按会话筛选
     if (sessionId !== undefined) {
       query = query.eq('session_id', sessionId);
     }

     // 4. 执行查询获取移动记录
     const { data: moves, error: movesError } = await query;

     // 5. 加载该日期的统计数据
     const { data: record, error: recordError } = await supabase
       .from('daily_records')
       .select('*')
       .eq('date', date)
       .maybeSingle();

     // 6. 构建并返回游戏状态
     return {
       history: (moves || []).map(m => ({
         position: m.position,
         color: m.color,
         timestamp: new Date(m.created_at).getTime(),
         prediction: m.prediction
       })),
       windowStart: 0,
       totalPredictions: record?.total_predictions || 0,
       correctPredictions: record?.correct_predictions || 0,
       isViewingHistory: false,
       predictionStats: []
     };
   }
   ```

3. **数据处理**：
   - 加载的原始数据转换为应用内部使用的格式
   - 历史记录按时间顺序排列
   - 根据历史记录计算矩阵显示和分页

### 预测逻辑

1. **预测触发**：
   - 在录入模式下，每次添加新球后触发预测
   - 预测基于历史数据模式分析

2. **预测机制**：
   - 分析历史序列中的模式
   - 计算不同模式出现的频率
   - 根据频率计算下一个球是红色或黑色的概率
   - 选择概率更高的颜色作为预测结果

## 实例说明

### 矩阵填充示例

**场景1：初始状态**
- 初始矩阵为空
- 用户点击"红色"按钮
- 系统在位置[0,0]（左上角）添加一个红球
- 预测系统由于数据不足，可能不会给出准确预测

**场景2：填充多个球**
- 假设当前有5个球，位于第一行的前5个位置
- 用户继续点击"黑色"按钮
- 系统在位置[0,5]添加一个黑球
- 预测系统分析前6个球的模式，给出下一个球的预测

**场景3：跨行填充**
- 用户持续添加球，直到第一行（24个位置）被填满
- 用户再次点击颜色按钮
- 系统在第二行的第一个位置[1,0]添加新球
- 矩阵显示会自动调整以显示新添加的球

**场景4：跨页填充**
- 用户持续添加球，直到三行（共72个位置）都被填满
- 用户再次点击颜色按钮
- 系统创建新的第二页，并在第二页的位置[0,0]添加新球
- 系统自动跳转到第二页，显示新添加的球

### 分页导航示例

**场景1：手动浏览**
- 当前在第2页，总共有3页
- 用户点击"上一页"按钮
- 系统显示第1页的内容（前72个球）
- 用户可以继续浏览或返回最新页面

**场景2：自动跳转**
- 当前在第1页，总共有1页，且已填入71个球
- 用户再添加1个球，此时第1页填满（72个球）
- 用户再添加1个球，系统创建第2页
- 在输入模式下，系统自动跳转到第2页，显示最新添加的球

**场景3：手动浏览不受自动跳转影响**
- 用户手动导航到第1页
- 持续添加新球，创建了第3页
- 只要用户不手动切换，系统不会自动跳到第3页
- 用户可以继续查看第1页的历史数据

### 数据加载示例

**场景1：加载特定日期数据**
- 用户选择日期：2023-05-15
- 系统从Supabase加载该日期的所有会话
- 默认加载第一个会话的数据
- 界面显示该日期第一个会话的历史记录和统计数据

**场景2：切换会话**
- 当前日期有多个会话
- 用户从下拉菜单选择"会话2"
- 系统加载该会话的历史记录
- 矩阵和分页系统重新计算并显示该会话的数据

**场景3：创建新会话**
- 用户点击"新建会话"按钮
- 系统在数据库创建新会话记录
- 界面重置为空矩阵
- 用户可以开始在新会话中添加球并获取预测

## 功能交互流程

1. **初始加载流程**
   - 应用启动 → 加载今日日期 → 查询该日期会话 → 加载第一个会话或创建新会话 → 显示界面

2. **添加新球流程**
   - 选择颜色 → 系统添加球到历史记录 → 更新矩阵显示 → 触发预测 → 显示预测结果

3. **分页浏览流程**
   - 点击分页按钮 → 计算目标页内容 → 更新矩阵显示 → 保持预测列不变

4. **会话管理流程**
   - 选择/创建会话 → 加载会话数据 → 计算矩阵和分页 → 更新显示 → 准备接收用户输入

5. **预测验证流程**
   - 系统预测下一球 → 用户输入实际球 → 系统比较预测与实际 → 更新预测准确率统计
