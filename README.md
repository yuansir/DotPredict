# DotPredict 点阵预测游戏

一个基于概率学习的互动教育游戏，帮助用户理解和掌握概率预测原理。

## 功能特点

- 8x8点阵游戏板
- 实时颜色预测
- 详细的统计分析
- 支持多种预测规则
- 现代化的用户界面

## 技术栈

- React 18
- TypeScript
- Tailwind CSS
- Vite
- IndexedDB (用于本地数据存储)

## 快速开始

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 访问应用：
打开浏览器访问 http://127.0.0.1:3000

## 游戏规则

### 基础规则
1. 在8x8网格中放置红点或黑点
2. 系统会根据已放置的点预测下一个点的颜色
3. 预测基于两种规则模式：
   - 25%规则
   - 75%规则

### 预测规则详解

#### 25%规则
- 三红连续
- 三黑连续
- 红黑红
- 黑红黑

#### 75%规则
- 两黑一红
- 两红一黑
- 黑红黑
- 红黑黑

## 项目结构

```
/DotPredict
├── src/
│   ├── components/     # React组件
│   │   ├── Grid.tsx   # 网格组件
│   │   └── Cell.tsx   # 单元格组件
│   ├── utils/         # 工具函数
│   │   └── gameLogic.ts # 游戏逻辑
│   ├── types.ts       # TypeScript类型定义
│   └── App.tsx        # 主应用组件
├── public/            # 静态资源
└── vite.config.ts     # Vite配置
```

## 开发指南

### 组件说明

#### Grid.tsx
网格组件，负责渲染8x8的游戏板。
- Props:
  - grid: 网格数据
  - selectedCell: 当前选中的单元格
  - onCellClick: 单元格点击处理函数
  - predictedCell: 预测的下一个单元格
  - predictedColor: 预测的颜色

#### Cell.tsx
单元格组件，显示具体的点。
- Props:
  - color: 点的颜色
  - isSelected: 是否被选中
  - isPredicted: 是否是预测单元格
  - onClick: 点击处理函数

### 工具函数

#### gameLogic.ts
包含游戏核心逻辑：
- getLastTwoDots: 获取最近放置的两个点
- predictNextColor: 预测下一个点的颜色
- getNextEmptyCell: 获取下一个空单元格

## 数据存储

使用 IndexedDB 存储：
- 游戏进度
- 统计数据
- 用户设置

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

## 许可证

MIT License
