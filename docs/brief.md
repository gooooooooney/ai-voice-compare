# Project Brief: AI语音对比测试网页应用

## Executive Summary

本项目旨在开发一个纯前端网页应用，用于实时对比测试Deepgram和AssemblyAI两个语音转文字API的性能。该应用将同时连接两个API的实时流服务，对用户的英文语音输入进行转录，并提供延迟分析和准确性对比功能。无需后端服务器支持，直接在浏览器端调用两个服务的JavaScript SDK实现功能。

## Problem Statement

目前市场上缺乏一个便捷的工具来直接对比不同实时语音转文字服务的性能表现。开发者和企业在选择语音API时，往往需要分别测试不同服务，无法进行直观的实时对比。这导致：

- **决策困难**：缺乏客观的性能对比数据
- **测试成本高**：需要分别集成不同API进行测试
- **效率低下**：无法同时评估延迟、准确性等关键指标
- **选择风险**：基于不完整信息做出技术选型决策

这个问题的解决具有紧迫性，因为语音AI技术快速发展，服务提供商众多，企业需要快速做出技术选型决策。

## Proposed Solution

开发一个创新的实时语音API对比工具，具备以下核心能力：

- **双API同步连接**：同时建立与Deepgram和AssemblyAI的WebSocket连接
- **实时转录显示**：并排显示两个服务的转录结果
- **性能指标监控**：实时测量并显示延迟、响应时间等关键指标
- **纯前端架构**：无需服务器，直接通过浏览器调用API
- **用户友好界面**：直观的对比界面和控制功能

该解决方案的关键差异化优势是提供真正的实时同步对比，让用户能够在相同条件下评估两个服务的表现差异。

## Target Users

### Primary User Segment: 技术开发者和决策者
- **用户画像**：软件开发工程师、技术架构师、产品经理
- **当前行为**：正在评估或选择语音转文字API服务
- **具体需求**：
  - 客观的性能对比数据
  - 快速的技术验证工具
  - 成本效益分析支持
  - 实时性能指标
- **目标**：为项目选择最适合的语音API服务

### Secondary User Segment: 研究人员和学者
- **用户画像**：语音识别研究人员、高校学者、技术博主
- **当前行为**：研究语音识别技术发展和性能对比
- **具体需求**：
  - 详细的性能基准测试数据
  - 不同服务的技术特点对比
  - 可重复的测试环境
- **目标**：获得学术研究或技术分析所需的对比数据

## Goals & Success Metrics

### Business Objectives
- 在2周内完成功能完整的对比工具开发
- 提供准确可靠的实时性能对比数据
- 实现无服务器依赖的纯前端解决方案
- 建立可扩展的API对比框架

### User Success Metrics
- 用户获得有意义对比数据的时间：< 2分钟
- API连接成功率：≥ 95%
- 延迟测量精度：± 10ms误差范围内
- 用户界面响应时间：< 100ms

### Key Performance Indicators (KPIs)
- **平均延迟对比**：实时显示两个API的响应延迟差异
- **转录准确性**：通过视觉对比展现转录质量差异
- **连接稳定性**：监控连接中断和重连成功率
- **用户使用时长**：单次测试会话的平均持续时间

## MVP Scope

### Core Features (Must Have)
- **麦克风权限获取**：浏览器麦克风访问和音频捕获功能
- **双API集成**：同时连接Deepgram和AssemblyAI的WebSocket服务
- **实时显示界面**：分屏显示两个服务的实时转录结果
- **延迟跟踪系统**：实时测量和显示API响应时间
- **控制功能**：开始/停止录音的简单界面控制
- **基础配置**：API密钥配置和基本参数设置

### Out of Scope for MVP
- 音频文件上传功能
- 历史对比数据存储
- 多语言支持（仅支持英文）
- 高级音频预处理功能
- 用户认证和数据持久化
- 详细的统计报告导出

### MVP Success Criteria
在单个网页内成功演示同时进行实时转录，并显示可视化的延迟指标对比，用户能够清晰看到两个API的性能差异。

## Post-MVP Vision

### Phase 2 Features
- 多语言支持扩展
- 音频文件上传测试功能
- 历史测试数据本地存储
- 更详细的性能分析图表
- 音频质量优化选项

### Long-term Vision
发展成为语音AI服务的综合评测平台，支持更多API提供商，提供详细的性能基准测试报告，成为行业标准的语音API评估工具。

### Expansion Opportunities
- 支持更多语音转文字服务商（Google Cloud Speech、Azure Speech等）
- 添加语音合成API对比功能
- 开发移动端应用版本
- 提供企业级定制化测试方案

## Technical Considerations

### Platform Requirements
- **Target Platforms:** 现代网页浏览器（Chrome、Firefox、Safari、Edge）
- **Browser/OS Support:** 支持WebRTC的桌面和移动浏览器
- **Performance Requirements:** 实时音频处理，额外延迟 < 100ms

### Technology Preferences
- **Frontend:** 原生JavaScript或轻量级框架（React/Vue可选）
- **Backend:** 无需后端，纯前端实现
- **Database:** 无需数据库，使用本地存储
- **Hosting/Infrastructure:** 静态网页托管（GitHub Pages、Netlify等）

### Architecture Considerations
- **Repository Structure:** 单页应用，模块化JavaScript结构
- **Service Architecture:** 纯客户端架构，直接WebSocket连接
- **Integration Requirements:** Deepgram JavaScript SDK + AssemblyAI Node SDK（浏览器兼容版本）
- **Security/Compliance:** API密钥通过环境变量或安全令牌管理

## Constraints & Assumptions

### Constraints
- **Budget:** 使用两个API服务的免费额度进行开发
- **Timeline:** 1-2周开发时间框架
- **Resources:** 单人开发实现
- **Technical:** 浏览器安全限制可能影响直接API访问

### Key Assumptions
- 两个API都支持浏览器端WebSocket直连
- 用户拥有两个服务的有效API密钥
- 仅英文测试足以满足对比需求
- 现代浏览器环境具备麦克风访问能力
- 稳定的网络连接支持实时流传输

## Risks & Open Questions

### Key Risks
- **CORS问题**：浏览器安全策略可能阻止直接API连接
- **API限制**：免费账户的使用限制可能影响测试时长
- **音频质量**：浏览器麦克风质量可能影响转录准确性
- **网络延迟**：用户网络状况可能影响延迟测量准确性

### Open Questions
- 两个API是否都支持无CORS限制的浏览器WebSocket连接？
- 浏览器端实现的具体认证要求是什么？
- 客户端应用中如何安全处理API密钥？
- 什么音频格式和采样率对两个API都最优？

### Areas Needing Further Research
- 两个SDK的浏览器兼容性测试
- 认证流程优化（临时令牌 vs API密钥）
- 音频预处理需求以获得最佳效果
- 错误处理和重连策略设计

## Appendices

### A. Research Summary
通过Context7查询获得的关键技术信息：

**Deepgram实现要点：**
- 浏览器兼容的JavaScript SDK
- 通过`deepgram.listen.live()`建立WebSocket连接
- MediaRecorder API直接集成麦克风
- 实时转录事件和延迟跟踪支持

**AssemblyAI实现要点：**
- 浏览器兼容的流转录器
- 临时令牌认证提升安全性
- `StreamingTranscriber`实现WebSocket流传输
- 实时事件和音频块处理

### B. References
- Deepgram JavaScript SDK文档
- AssemblyAI Node SDK浏览器实现
- WebRTC和Web Audio API规范
- 语音识别性能评估最佳实践

## Next Steps

### Immediate Actions
1. 设置开发环境和API账户
2. 创建基础HTML结构和双面板布局
3. 实现Deepgram WebSocket连接和浏览器SDK集成
4. 实现AssemblyAI流连接和临时令牌认证
5. 添加麦克风捕获和音频流功能
6. 实现延迟测量和显示系统
7. 添加基础样式和响应式设计
8. 进行多种语音样本测试并记录结果

### PM Handoff
本项目简介为AI语音对比网页应用提供了完整的背景信息。下一阶段应重点关注技术实现，从API集成概念验证开始，随后进行UI开发和性能优化。