# Story 2: 双服务SDK集成与音频录制

## User Story

作为一个**开发者或技术决策者**，
我想要**同时集成AssemblyAI和Deepgram的语音转文字服务，并实现浏览器实时音频录制**，
以便于**能够并行测试两个服务的实时转录性能，为服务选择提供技术基础**。

## Story Context

**依赖关系：** 依赖Story 1（项目基础架构）完成
**技术集成：** AssemblyAI SDK + Deepgram SDK + Web Audio API
**核心挑战：** 浏览器兼容性、实时音频处理、双SDK并行工作
**开发时间：** 第1天下半部分到第2天上午

## Acceptance Criteria

### SDK集成需求：

1. **AssemblyAI实时转录集成**
   - 安装并配置AssemblyAI JavaScript SDK
   - 实现实时音频流连接和认证
   - 创建AssemblyAI服务类，封装连接、断开、错误处理
   - 支持实时转录结果接收和状态管理

2. **Deepgram实时转录集成**
   - 安装并配置Deepgram JavaScript SDK
   - 实现WebSocket连接到Deepgram Streaming API
   - 创建Deepgram服务类，封装连接、断开、错误处理
   - 支持实时转录结果接收和状态管理

3. **双服务并行管理**
   - 创建统一的转录服务管理器
   - 实现同时启动/停止两个服务的协调机制
   - 处理服务间的状态同步和冲突解决
   - 实现服务连接状态的实时监控

### 音频录制需求：

4. **浏览器音频录制**
   - 实现getUserMedia API音频流获取
   - 处理麦克风权限请求和错误情况
   - 创建Web Audio API音频处理管道
   - 实现音频格式转换（适配两个服务要求）

5. **音频流分发**
   - 将单一音频流同时发送到两个转录服务
   - 实现音频数据的实时缓冲和传输
   - 处理音频流的开始、暂停、停止控制
   - 确保音频质量和延迟最小化

6. **设备兼容性**
   - 实现音频设备检测和选择功能
   - 支持不同音频输入设备的切换
   - 处理音频设备权限和可用性检查
   - 提供音频质量和音量监控

### 错误处理和稳定性：

7. **连接管理**
   - 实现自动重连机制（网络中断恢复）
   - 处理API认证失败和额度限制
   - 提供连接状态实时反馈
   - 实现优雅的服务降级（单服务模式）

8. **错误处理**
   - 捕获并处理所有SDK相关错误
   - 提供用户友好的错误信息显示
   - 实现错误日志收集和调试信息
   - 支持手动重试和故障排除

9. **性能优化**
   - 实现音频数据传输的性能监控
   - 优化内存使用和垃圾回收
   - 确保实时性能（延迟<2秒）
   - 实现资源清理和连接释放

## Technical Implementation Details

### 核心服务类设计：

```typescript
// AssemblyAI服务封装
class AssemblyAIService {
  private client: RealtimeService;
  private isConnected: boolean = false;
  
  async connect(apiKey: string): Promise<void> {}
  async disconnect(): Promise<void> {}
  sendAudio(audioData: ArrayBuffer): void {}
  onTranscript(callback: (text: string) => void): void {}
  onError(callback: (error: Error) => void): void {}
}

// Deepgram服务封装
class DeepgramService {
  private connection: LiveTranscription;
  private isConnected: boolean = false;
  
  async connect(apiKey: string): Promise<void> {}
  async disconnect(): Promise<void> {}
  sendAudio(audioData: ArrayBuffer): void {}
  onTranscript(callback: (text: string) => void): void {}
  onError(callback: (error: Error) => void): void {}
}

// 统一转录管理器
class TranscriptionManager {
  private assemblyAI: AssemblyAIService;
  private deepgram: DeepgramService;
  private audioRecorder: AudioRecorder;
  
  async startTranscription(): Promise<void> {}
  async stopTranscription(): Promise<void> {}
  getConnectionStatus(): ServiceStatus {}
}
```

### 音频录制类设计：

```typescript
class AudioRecorder {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext;
  private processor: ScriptProcessorNode;
  
  async requestPermission(): Promise<boolean> {}
  async startRecording(): Promise<void> {}
  stopRecording(): void {}
  onAudioData(callback: (data: ArrayBuffer) => void): void {}
  getAudioLevel(): number {}
}
```

### 状态管理结构：

```typescript
interface TranscriptionState {
  // 服务连接状态
  assemblyAI: {
    connected: boolean;
    error: string | null;
    transcript: string;
    confidence: number;
  };
  deepgram: {
    connected: boolean;
    error: string | null;
    transcript: string;
    confidence: number;
  };
  // 音频录制状态
  audio: {
    isRecording: boolean;
    hasPermission: boolean;
    deviceId: string | null;
    volume: number;
    error: string | null;
  };
}
```

### 依赖包配置：

```json
{
  "dependencies": {
    "@assemblyai/realtime": "^1.0.0",
    "@deepgram/sdk": "^3.0.0",
    "recordrtc": "^5.6.2"
  }
}
```

## Definition of Done

- [ ] AssemblyAI SDK成功集成，实时转录功能正常
- [ ] Deepgram SDK成功集成，实时转录功能正常
- [ ] Web Audio API音频录制实现，支持主流浏览器
- [ ] 双服务可以同时工作，无冲突或干扰
- [ ] 音频流正确分发到两个服务，延迟最小
- [ ] 连接状态实时监控，错误处理完善
- [ ] 自动重连机制工作正常
- [ ] 浏览器兼容性测试通过（Chrome、Firefox、Safari、Edge）
- [ ] 麦克风权限管理用户体验良好
- [ ] 性能满足要求（音频延迟<100ms，转录延迟<2秒）

## Risk Assessment

**主要风险：** 浏览器Web Audio API兼容性问题，特别是Safari的限制
**缓解方案：** 
- 实现浏览器能力检测和降级方案
- 提供详细的浏览器支持说明
- 考虑使用RecordRTC等音频录制库作为备选

**次要风险：** 两个SDK的音频格式要求不一致
**缓解方案：**
- 研究两个服务的音频格式要求
- 实现音频格式转换中间层
- 测试不同音频参数的兼容性

**API风险：** 免费额度限制影响开发测试
**缓解方案：**
- 实现本地模拟模式用于UI开发
- 设置API调用频率限制
- 提供离线演示数据

## Acceptance Testing Scenarios

### 场景1：正常双服务转录
- 用户授权麦克风权限
- 点击开始录制
- 两个服务同时显示连接状态
- 开始说话，两个服务实时显示转录结果
- 点击停止，录制和转录正常结束

### 场景2：网络异常恢复
- 录制过程中暂时断网
- 系统显示连接中断状态
- 网络恢复后自动重连
- 转录功能正常恢复

### 场景3：单服务降级
- 其中一个服务连接失败
- 系统提示错误但继续工作
- 另一个服务正常提供转录
- 用户可以重试失败的服务

## Next Steps

完成此Story后，系统应该具备：
1. 完整的双服务实时转录能力
2. 稳定的音频录制和传输功能
3. 为Story 3的UI界面和性能对比提供数据基础

**预估工作量：** 6-8小时  
**优先级：** High（核心功能）  
**依赖关系：** 依赖Story 1完成