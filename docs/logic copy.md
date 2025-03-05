1. 会话管理逻辑
会话基本概念
会话(Session): 一次完整的输入过程，每个会话有唯一的ID
当前会话: 正在进行输入的会话（currentSessionId）
历史会话: 已终止的会话，由latest_session_id记录
会话状态: 分为"录入模式"和"预览模式"
会话初始化流程
每次打开应用或切换日期时，会触发初始化流程：

CopyInsert
1. 查询当前日期是否有daily_records记录
2. 若有记录且latest_session_id不为null：
   - 新会话ID = latest_session_id + 1
3. 若无记录或latest_session_id为null：
   - 新会话ID = 1
4. 设置currentSessionId为新会话ID
5. 重置游戏状态(清空history, grid等)
实例：用户选择2025-02-28日期

查询daily_records表，发现该日期latest_session_id=3
设置currentSessionId=4（3+1）
界面显示"新一轮输入中..."，ID=4
会话切换逻辑
用户在下拉菜单选择不同会话时：

CopyInsert
1. 设置selectedSession为选中值
2. 如果是当前会话(新一轮输入中)：
   - 查询moves表中大于latest_session_id的记录
   - 加载这些未终止的记录到界面
3. 如果是历史会话：
   - 查询指定session_id的全部记录
   - 切换到预览模式(isRecordMode=false)
   - 禁用编辑功能
实例：当前在会话4，用户切换到会话2

设置selectedSession=2
查询moves表中date=2025-02-28且session_id=2的记录
加载这些记录并切换到预览模式
禁用所有编辑功能
2. 小球加载和查询逻辑
数据加载流程
初始加载：
CopyInsert
- 根据selectedDate和selectedSession加载数据
- 转换数据格式，更新gameState.history和grid
- 初始化矩阵数据(3x16)
会话数据转换：
CopyInsert
- moves表数据 → gameState.history
- history → 计算grid(16x16网格)
- history → 计算矩阵数据(3x16)
矩阵数据处理
CopyInsert
1. 从历史记录中提取最多48个点(3行x16列)
2. 创建空矩阵
3. 按顺序填充矩阵:
   - col = Math.floor(index / PATTERN_ROWS)
   - row = index % PATTERN_ROWS
实例：加载了60个点的历史记录

提取最后48个点
创建3x16空矩阵
第1个点放置在(0,0)，第2个点在(1,0)，第3个点在(2,0)
第4个点放置在(0,1)，依此类推
3. 录入和预览模式逻辑
模式判断逻辑
CopyInsert
const shouldBeRecordMode = selectedDate === today && sessionId === currentSessionId;
录入模式特性
可编辑: 允许添加、删除、清空、撤销操作
数据保存: 所有操作实时保存到数据库
预测功能: 可根据历史数据预测下一步
实例：用户在录入模式点击网格

CopyInsert
1. 检查是否是录入模式 - 是
2. 创建move对象，包含位置、颜色、时间戳
3. 如果点击位置与预测位置相同，记录预测结果
4. 保存move到数据库
5. 更新本地状态(history, grid)
6. 尝试预测下一步
预览模式特性
只读: 禁止任何修改操作
历史浏览: 可查看历史会话的完整记录
错误提示: 尝试编辑时显示"预览模式下不能修改数据"
实例：用户在预览模式尝试点击网格

CopyInsert
1. 检查是否是录入模式 - 否
2. 直接返回，不执行任何操作
3. 可能显示警告提示
4. 终止输入业务逻辑
终止会话流程
CopyInsert
1. 检查daily_records表中是否有当日记录
2. 若有:
   - 更新记录，设置latest_session_id = currentSessionId
3. 若无:
   - 插入新记录，设置date和latest_session_id
4. 更新状态:
   - setLatestSessionId(currentSessionId)
   - setCurrentSessionId(prev => prev + 1)
   - 重置界面(清空history, grid等)
实例：用户点击"终止输入"按钮

CopyInsert
1. 检查daily_records，发现有2025-02-28的记录
2. 更新记录，设置latest_session_id=4(当前会话)
3. 更新状态:
   - latestSessionId = 4
   - currentSessionId = 5
4. 清空所有数据，开始新的会话5
5. 关键操作实现细节
添加点操作(handleCellClick)
CopyInsert
1. 检查是否为录入模式
2. 创建move对象
3. 检查预测情况并记录
4. 保存到数据库
5. 更新状态和界面
撤销操作(handleUndo)
CopyInsert
1. 检查是否为录入模式
2. 从历史记录中移除最后一个操作
3. 从数据库删除对应记录
4. 更新状态和界面
删除点操作(handleCellDelete)
CopyInsert
1. 检查是否为录入模式
2. 查找要删除的点在历史记录中的索引
3. 从历史记录中移除该操作
4. 从数据库删除对应记录
5. 更新状态和界面
清空操作(handleClear)
CopyInsert
1. 检查是否为录入模式
2. 弹出确认对话框
3. 从数据库删除当前会话的所有记录
4. 重置所有状态和界面
通过这些机制，确保了应用在不同模式下的数据一致性和用户操作的准确响应。需要特别注意的是模式切换和会话管理的逻辑，因为它们决定了用户能够执行哪些操作，以及数据如何在本地和远程存储之间同步。

您对这些逻辑还有什么具体问题吗？我可以更详细地解释特定部分。