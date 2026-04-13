# ZZU Debate Timer

这是一个为郑州大学辩论赛设计的专业计时器。

## 技术栈
- **React 18**: 前端框架
- **Vite**: 构建工具
- **Tailwind CSS**: 样式框架
- **Lucide React**: 图标库

## 目录结构
- `/src`: 源代码 (当前在根目录下)
- `/components`: 可复用的 UI 组件
- `/services`: 业务逻辑服务 (如音频处理)
- `/constants.ts`: 全局常量和辩论流程配置
- `/types.ts`: TypeScript 类型定义
- `/App.tsx`: 主应用逻辑

## 快捷键
- `N`: 上一个环节
- `M`: 下一个环节
- `Space`: 开始/暂停
- `R`: 重置当前环节时间
- `S`: 切换发言方 (在自由辩论/对辩环节)
