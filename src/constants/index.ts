/**
 * 应用常量定义
 */

export const APP_CONFIG = {
  name: 'AI语音转文字对比工具',
  version: '1.0.0',
  description: '实时对比 AssemblyAI 和 Deepgram 语音转文字服务性能',
} as const;

export const AUDIO_CONFIG = {
  sampleRate: 16000,
  channels: 1,
  bitDepth: 16,
  maxRecordingTime: 5 * 60 * 1000, // 5分钟
  bufferSize: 4096,
} as const;

export const CONNECTION_CONFIG = {
  maxReconnectAttempts: 3,
  reconnectDelay: 1000,
  connectionTimeout: 10000,
  heartbeatInterval: 30000,
} as const;

export const PERFORMANCE_CONFIG = {
  metricsUpdateInterval: 1000,
  latencySampleSize: 100,
  confidenceHistorySize: 50,
} as const;

export const UI_CONFIG = {
  animationDuration: 300,
  debounceDelay: 300,
  throttleLimit: 100,
} as const;

export const SERVICE_INFO = {
  assemblyai: {
    name: 'AssemblyAI',
    color: '#3B82F6',
    website: 'https://www.assemblyai.com',
    docs: 'https://www.assemblyai.com/docs',
  },
  deepgram: {
    name: 'Deepgram',
    color: '#10B981',
    website: 'https://deepgram.com',
    docs: 'https://developers.deepgram.com',
  },
} as const;

export const LOCAL_STORAGE_KEYS = {
  testHistory: 'ai-voice-compare-history',
  userPreferences: 'ai-voice-compare-preferences',
  lastConfig: 'ai-voice-compare-config',
} as const;

export const ERROR_MESSAGES = {
  microphonePermission: '无法访问麦克风，请检查浏览器权限设置',
  networkConnection: '网络连接失败，请检查网络状态',
  apiKeyInvalid: 'API密钥无效，请检查配置',
  browserNotSupported: '浏览器不支持必要的Web API',
  recordingFailed: '录制失败，请重试',
  serviceConnectionFailed: '服务连接失败',
} as const;

export const SUCCESS_MESSAGES = {
  microphonePermissionGranted: '麦克风权限已获取',
  serviceConnected: '服务连接成功',
  recordingStarted: '开始录制',
  recordingStopped: '录制已停止',
  testCompleted: '测试完成',
} as const;