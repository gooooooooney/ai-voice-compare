# OpenAI Realtime API 语音模型

## 当前支持的 Realtime 模型

### 1. GPT-4o Realtime Preview (推荐)
- **模型名称**: `gpt-4o-realtime-preview-2024-12-17`
- **功能**: 实时语音转文字和语音对话
- **特点**: 
  - 低延迟直接语音处理
  - 支持情感、语调和口音识别
  - 支持双向音频流
  - 可以同时处理文本和音频输入/输出

### 2. 即将发布的模型

#### GPT-4o Audio Preview
- **模型名称**: `gpt-4o-audio-preview`
- **状态**: 即将在 Chat Completions API 中发布
- **功能**: 支持音频输入和输出，但不需要 Realtime API 的低延迟特性

#### GPT-4o Mini Audio Preview
- **模型名称**: `gpt-4o-mini-audio-preview-2024-12-17`
- **功能**: 轻量级版本，适合成本敏感的应用

### 3. 新的转录专用模型

#### GPT-4o Transcribe
- **模型名称**: `gpt-4o-transcribe`
- **功能**: 专门优化的语音转文字模型
- **特点**: 
  - 更低的词错误率 (WER)
  - 更好的语言识别和准确性
  - 在口音、噪音环境和不同语速下表现更好

#### GPT-4o Mini Transcribe
- **模型名称**: `gpt-4o-mini-transcribe`
- **功能**: 轻量级转录模型

## 模型选择建议

1. **实时对话应用**: 使用 `gpt-4o-realtime-preview-2024-12-17`
2. **纯转录任务**: 使用 `gpt-4o-transcribe` 或 `gpt-4o-mini-transcribe`
3. **成本优先**: 考虑使用 mini 版本的模型

## 价格信息

### Realtime API 定价
- **文本输入**: $5 / 1M tokens
- **文本输出**: $20 / 1M tokens
- **音频输入**: $100 / 1M tokens (约 $0.06 / 分钟)
- **音频输出**: $200 / 1M tokens (约 $0.24 / 分钟)

## 使用示例

```javascript
// 在 OpenAIRealtimeService 中配置模型
const service = new OpenAIRealtimeService({
  apiKey: 'your-api-key',
  model: 'gpt-4o-realtime-preview-2024-12-17', // 推荐的实时模型
  sampleRate: 16000
});
```

## 注意事项

1. **模型可用性**: 某些模型可能需要特定的 API 访问权限
2. **区域限制**: Realtime API 目前可能有地区限制
3. **更新频率**: OpenAI 会定期发布新版本，建议关注官方文档获取最新信息

## 参考链接

- [OpenAI Realtime API 文档](https://platform.openai.com/docs/guides/realtime)
- [OpenAI 定价页面](https://openai.com/pricing)