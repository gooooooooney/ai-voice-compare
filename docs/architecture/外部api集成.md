# 外部API集成

## Deepgram API

- **目的:** 实时语音转文字转录服务
- **文档:** https://developers.deepgram.com/docs
- **基础URL:** wss://api.deepgram.com/v1/listen
- **认证:** API密钥认证
- **速率限制:** 基于订阅计划

**集成说明:** 使用官方@deepgram/sdk处理所有WebSocket通信，支持直接发送音频Blob数据

## AssemblyAI API

- **目的:** 实时语音转文字转录服务
- **文档:** https://www.assemblyai.com/docs
- **基础URL:** wss://api.assemblyai.com/v2/realtime/ws
- **认证:** 临时令牌认证
- **速率限制:** 基于订阅计划

**集成说明:** 使用官方assemblyai SDK，需要ArrayBuffer格式音频数据，临时令牌机制增强安全性
