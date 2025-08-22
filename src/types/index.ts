/**
 * 核心类型定义
 */

export type ServiceType = 'assemblyai' | 'deepgram';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export type RecordingStatus = 'idle' | 'starting' | 'recording' | 'stopping';

/**
 * 转录结果接口
 */
export interface TranscriptionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
  timestamp: number;
  service: ServiceType;
}

/**
 * 原始转录数据存储接口
 */
export interface RawTranscriptData {
  id: string;
  service: ServiceType;
  timestamp: number;
  rawData: any; // 保存原始API响应
  processedResult: TranscriptionResult;
}

/**
 * 服务连接状态
 */
export interface ServiceConnection {
  status: ConnectionStatus;
  error?: string;
  lastConnected?: Date;
  reconnectAttempts: number;
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  service: ServiceType;
  session: {
    startTime: Date;
    duration: number;
    audioQuality: number;
  };
  accuracy: {
    confidence: number[];
    wordCount: number;
    characterCount: number;
    userRating?: number; // 1-5星主观评价
  };
  latency: {
    averageDelay: number;
    maxDelay: number;
    minDelay: number;
    samples: number[];
  };
  stability: {
    connectionDrops: number;
    reconnectTime: number[];
    errorRate: number;
    uptime: number;
  };
}

/**
 * 音频录制状态
 */
export interface AudioState {
  status: RecordingStatus;
  hasPermission: boolean;
  deviceId: string | null;
  volume: number;
  error: string | null;
  stream: MediaStream | null;
}

/**
 * 应用状态接口
 */
export interface AppState {
  // 录制状态
  audio: AudioState;
  
  // 服务连接状态
  connections: {
    assemblyai: ServiceConnection;
    deepgram: ServiceConnection;
  };
  
  // 转录结果
  transcriptions: {
    assemblyai: TranscriptionResult[];
    deepgram: TranscriptionResult[];
  };

  // 原始转录数据存储
  rawTranscripts: RawTranscriptData[];
  
  // 性能指标
  metrics: {
    assemblyai: Partial<PerformanceMetrics>;
    deepgram: Partial<PerformanceMetrics>;
  };
  
  // UI状态
  ui: {
    showMetrics: boolean;
    activePanel: 'comparison' | 'history' | 'settings';
    isFullscreen: boolean;
  };
}

/**
 * 对比结果
 */
export interface ComparisonResult {
  timestamp: Date;
  testDuration: number;
  metrics: {
    assemblyai: PerformanceMetrics;
    deepgram: PerformanceMetrics;
  };
  recommendation: {
    preferred: ServiceType | 'tie';
    reasoning: string;
    confidenceScore: number;
  };
}