# DotPredict - 点阵预测游戏

一个基于 React + TypeScript 的交互式预测游戏，玩家通过放置红色和黑色的点，系统会根据规则预测下一个点的颜色。

## 功能特点

- 基于规则的颜色预测
- 优雅的动画和交互效果
- 实时预测准确率统计
- 支持撤销和重做操作
- 响应式设计，支持多种设备
- 自动保存游戏进度

## 技术栈

- React 18
- TypeScript
- Tailwind CSS
- Vite
- Headless UI

## 本地开发

1. 克隆项目
```bash
git clone [your-repository-url]
cd DotPredict
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

4. 构建项目
```bash
npm run build
```

## 游戏规则

游戏包含两种预测规则：

### 75% 规则模式
- 黑黑→红(75%)
- 红红→黑(75%)
- 黑红→红(75%)
- 红黑→黑(75%)

### 25% 规则模式
- 红红→红(25%)
- 黑黑→黑(25%)
- 红黑→红(25%)
- 黑红→黑(25%)

## 项目结构

```
src/
  ├── components/     # React 组件
  ├── services/      # 服务层
  ├── utils/         # 工具函数
  ├── types/         # TypeScript 类型定义
  └── App.tsx        # 主应用组件
```

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交改动 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情
