# OpenAI Realtime API Voice 参数说明

## Voice 参数作用

`voice` 参数用于指定 OpenAI Realtime API 生成语音输出时使用的声音类型。这个参数决定了 AI 助手回复时的声音特征。

## 可用的声音选项

根据 OpenAI SDK 类型定义，当前支持以下 8 种声音：

1. **`alloy`** - 中性、清晰的声音
2. **`ash`** - 较新添加的声音选项
3. **`ballad`** - 较新添加的声音选项
4. **`coral`** - 较新添加的声音选项
5. **`echo`** - 经典声音选项之一
6. **`sage`** - 较新添加的声音选项
7. **`shimmer`** - 经典声音选项之一
8. **`verse`** - 较新添加的声音选项

## 使用示例

```javascript
// 在创建 Realtime 会话时指定声音
const response = await openai.beta.realtime.sessions.create({
  model: 'gpt-4o-realtime-preview-2024-12-17',
  voice: 'alloy',  // 可以更改为其他支持的声音
});
```

## 重要注意事项

1. **声音不可中途更改**: 一旦模型开始生成音频响应，在整个会话期间无法更改声音设置。

2. **默认声音**: 如果不指定 voice 参数，系统会使用默认声音（通常是 'alloy'）。

3. **声音特征**:
   - 每种声音都有独特的音色、语调和说话风格
   - 所有声音都设计得非常自然和类人
   - 适合不同的应用场景和用户偏好

4. **已知问题**: 有报告指出，某些情况下系统可能会忽略指定的声音设置，默认回退到 'alloy' 声音。

## 声音选择建议

- **通用应用**: `alloy` - 最稳定和广泛使用的选项
- **多样性需求**: 可以尝试不同的声音以匹配应用的品牌形象或用户偏好
- **测试建议**: 建议在开发阶段测试不同的声音选项，选择最适合您应用场景的声音

## 与语音转文字的关系

需要注意的是，`voice` 参数只影响 AI 的语音输出（文字转语音），不影响语音输入的识别（语音转文字）。语音识别是由模型本身处理的，不需要指定声音类型。

## 更新历史

- 2024年10月31日：OpenAI 更新了可用的声音选项，添加了 ash、ballad、coral、sage 等新声音
- 原始声音集包括：alloy、echo、fable、onyx、nova、shimmer
- 当前声音集包括：alloy、ash、ballad、coral、echo、sage、shimmer、verse