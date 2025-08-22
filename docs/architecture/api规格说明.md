# API规格说明

## Deepgram实时转录SDK集成

**连接方式**: 使用Deepgram JavaScript SDK，SDK内部管理WebSocket连接

**核心API方法**:
```typescript
// 客户端初始化
const deepgramClient = deepgram.createClient(DEEPGRAM_API_KEY);

// 建立实时连接
const connection = deepgramClient.listen.live({
  model: "nova-2",
  language: "en",
  smart_format: true,
  sample_rate: 48000
});

// 事件监听
connection.on(deepgram.LiveTranscriptionEvents.Transcript, (data) => {
  const transcript = data.channel.alternatives[0].transcript;
  // 处理转录结果
});

// 发送音频数据
connection.send(audioBlob);
```

## AssemblyAI实时转录SDK集成

**连接方式**: 使用AssemblyAI Node SDK的StreamingTranscriber，需要临时令牌认证

**客户端实现**:
```typescript
// 获取临时令牌
async function getAssemblyAIToken() {
  const response = await fetch('https://api.assemblyai.com/v2/realtime/token', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ASSEMBLYAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ expires_in: 3600 })
  });
  const data = await response.json();
  return data.token;
}

// 初始化流转录器
const token = await getAssemblyAIToken();
const rt = new StreamingTranscriber({
  token: token,
  sampleRate: 48000
});

// 事件监听
rt.on("turn", ({ transcript }) => {
  // 处理转录结果
});
```
