# AI语音转文字对比工具

> 实时对比 AssemblyAI 和 Deepgram 语音转文字服务性能的纯前端工具

## 🎯 项目简介

这是一个基于 React + Vite + TypeScript 开发的纯前端应用，旨在帮助开发者和技术决策者快速对比 AssemblyAI 和 Deepgram 两个主流语音转文字服务的实时性能表现。

### ✨ 核心功能

- 🎤 **实时语音录制** - 支持浏览器麦克风录音
- 🔄 **双服务并行转录** - 同时调用 AssemblyAI 和 Deepgram API
- 📊 **性能指标对比** - 准确率、延迟、稳定性实时监控
- 📱 **响应式界面** - 适配桌面和移动设备
- 📈 **数据可视化** - 清晰的对比图表和指标展示
- 💾 **结果导出** - 支持测试结果截图和数据导出

## 🚀 快速开始

### 环境要求

- Node.js 18+ 
- 现代浏览器（支持 Web Audio API 和 WebRTC）
- AssemblyAI API 密钥
- Deepgram API 密钥

### 安装依赖

\`\`\`bash
npm install
\`\`\`

### 环境配置

1. 复制环境变量模板：
\`\`\`bash
cp .env.example .env
\`\`\`

2. 编辑 `.env` 文件，填入您的API密钥：
\`\`\`bash
VITE_ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
VITE_DEEPGRAM_API_KEY=your_deepgram_api_key_here
\`\`\`

### 获取API密钥

#### AssemblyAI
1. 访问 [AssemblyAI Console](https://www.assemblyai.com/dashboard/)
2. 注册账户并获取免费API密钥
3. 复制密钥到环境变量中

#### Deepgram  
1. 访问 [Deepgram Console](https://console.deepgram.com/)
2. 注册账户并获取免费API密钥
3. 复制密钥到环境变量中

### 启动开发服务器

\`\`\`bash
npm run dev
\`\`\`

应用将在 http://localhost:3000 启动

### 构建生产版本

\`\`\`bash
npm run build
\`\`\`

### 预览生产构建

\`\`\`bash
npm run preview
\`\`\`

## 🏗️ 技术架构

### 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 6
- **UI框架**: Tailwind CSS
- **状态管理**: React Hooks (准备集成 Zustand)
- **API集成**: AssemblyAI SDK + Deepgram SDK
- **音频处理**: Web Audio API + MediaRecorder API

### 项目结构

\`\`\`
src/
├── components/          # React组件
│   ├── ui/             # 基础UI组件
│   └── layout/         # 布局组件
├── config/             # 配置管理
├── constants/          # 常量定义
├── types/              # TypeScript类型
├── utils/              # 工具函数
└── styles/            # 样式文件
\`\`\`

## 📖 使用指南

### 基础使用流程

1. **权限授权** - 允许浏览器访问麦克风
2. **API配置** - 确保已正确配置API密钥
3. **开始测试** - 点击开始录制按钮
4. **实时对比** - 观察两个服务的转录结果和性能指标
5. **查看结果** - 停止录制后查看详细对比报告

### 性能指标说明

- **准确率**: 转录文本的置信度和完整性
- **延迟**: 从说话到显示文本的时间差
- **稳定性**: 连接稳定性和错误恢复能力

## 🔧 开发指南

### 开发命令

\`\`\`bash
# 启动开发服务器
npm run dev

# 代码检查
npm run lint

# 类型检查  
npx tsc --noEmit

# 代码格式化
npx prettier --write .

# 构建项目
npm run build
\`\`\`

### 代码规范

- 使用 ESLint + Prettier 进行代码格式化
- 遵循 TypeScript 严格模式
- 组件使用函数式组件 + Hooks
- 样式使用 Tailwind CSS 类名

## 🌐 浏览器兼容性

| 浏览器 | 版本要求 | 说明 |
|--------|----------|------|
| Chrome | 80+ | ✅ 完全支持 |
| Firefox | 80+ | ✅ 完全支持 |
| Safari | 14+ | ✅ 完全支持 |
| Edge | 80+ | ✅ 完全支持 |

### 必需的浏览器功能

- WebRTC (getUserMedia)
- Web Audio API
- WebSocket
- MediaRecorder API

## 📝 开发进度

### 已完成功能

- [x] 项目基础架构搭建
- [x] Vite + React + TypeScript 配置
- [x] Tailwind CSS 样式系统
- [x] 环境变量和API密钥管理
- [x] 基础组件库和工具函数
- [x] 开发工具配置 (ESLint, Prettier)

### 待实现功能

- [ ] AssemblyAI SDK 集成
- [ ] Deepgram SDK 集成
- [ ] Web Audio API 音频录制
- [ ] 实时转录界面
- [ ] 性能指标收集和显示
- [ ] 对比结果可视化
- [ ] 测试结果导出功能

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (\`git checkout -b feature/AmazingFeature\`)
3. 提交更改 (\`git commit -m 'Add some AmazingFeature'\`)
4. 推送到分支 (\`git push origin feature/AmazingFeature\`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🔗 相关链接

- [AssemblyAI 文档](https://www.assemblyai.com/docs)
- [Deepgram 文档](https://developers.deepgram.com)
- [Vite 文档](https://vitejs.dev)
- [React 文档](https://react.dev)
- [Tailwind CSS 文档](https://tailwindcss.com)

## 📞 支持与反馈

如果您在使用过程中遇到问题或有改进建议，欢迎：

- 提交 [Issue](../../issues)
- 发起 [Pull Request](../../pulls)
- 联系项目维护者

---

**注意**: 本工具使用第三方API服务，请遵守相应的使用条款和额度限制。