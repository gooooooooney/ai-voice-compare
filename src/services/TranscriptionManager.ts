/**
 * 转录服务管理器
 * 统一管理 AssemblyAI、Deepgram 和 OpenAI 服务，协调多服务并行工作
 */

import { AudioRecorder } from './AudioRecorder';
import { AssemblyAIService } from './AssemblyAIService';
import { DeepgramService } from './DeepgramService';
import { OpenAIRealtimeService } from './OpenAIRealtimeService';
import { getConfig, getMissingConfig, initConfig } from '@/config/env';
import { 
  ServiceType, 
  ConnectionStatus, 
  TranscriptionResult, 
  AppState, 
  ServiceConnection,
  RecordingStatus,
  RawTranscriptData
} from '@/types';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';

export interface TranscriptionManagerOptions {
  enableAssemblyAI?: boolean;
  enableDeepgram?: boolean;
  enableOpenAI?: boolean;
  audioOptions?: {
    sampleRate?: number;
    channels?: number;
  };
}

export interface ServiceStatusCallback {
  (service: ServiceType, status: ConnectionStatus): void;
}

export interface TranscriptCallback {
  (service: ServiceType, result: TranscriptionResult): void;
}

export interface ErrorCallback {
  (service: ServiceType, error: Error): void;
}

export interface AudioVolumeCallback {
  (volume: number): void;
}

export interface StateUpdateCallback {
  (state: Partial<AppState>): void;
}

export class TranscriptionManager {
  private audioRecorder: AudioRecorder;
  private assemblyAIService: AssemblyAIService | null = null;
  private deepgramService: DeepgramService | null = null;
  private openaiService: OpenAIRealtimeService | null = null;
  
  private isInitialized = false;
  private isRecording = false;
  
  // 回调函数
  private serviceStatusCallbacks: ServiceStatusCallback[] = [];
  private transcriptCallbacks: TranscriptCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private volumeCallbacks: AudioVolumeCallback[] = [];
  private stateUpdateCallbacks: StateUpdateCallback[] = [];
  
  // 应用状态
  private currentState: AppState;
  
  constructor(options: TranscriptionManagerOptions = {}) {
    // 初始化音频录制器
    this.audioRecorder = new AudioRecorder(options.audioOptions);
    
    // 初始化应用状态
    this.currentState = this.createInitialState();
    
    // 异步初始化服务
    this.initializeServices(options);
  }
  
  /**
   * 异步初始化服务
   */
  private async initializeServices(options: TranscriptionManagerOptions): Promise<void> {
    // 初始化配置
    await initConfig();
    const config = await getConfig();
    
    // 检查配置
    const missingConfig = await getMissingConfig();
    if (missingConfig.length > 0) {
      console.warn('⚠️ Missing API configuration:', missingConfig);
    }
    
    // 初始化 AssemblyAI 服务
    if (options.enableAssemblyAI !== false && config.api.assemblyAI.apiKey) {
      try {
        this.assemblyAIService = new AssemblyAIService({
          apiKey: config.api.assemblyAI.apiKey,
          sampleRate: options.audioOptions?.sampleRate,
        });
      } catch (error) {
        console.error('❌ Failed to initialize AssemblyAI service:', error);
      }
    }
    
    // 初始化 Deepgram 服务
    if (options.enableDeepgram !== false && config.api.deepgram.apiKey) {
      try {
        this.deepgramService = new DeepgramService({
          apiKey: config.api.deepgram.apiKey,
        });
      } catch (error) {
        console.error('❌ Failed to initialize Deepgram service:', error);
      }
    }
    
    // 初始化 OpenAI 服务
    if (options.enableOpenAI !== false && config.api.openai.apiKey) {
      try {
        this.openaiService = new OpenAIRealtimeService({
          apiKey: config.api.openai.apiKey,
          sampleRate: options.audioOptions?.sampleRate,
        });
      } catch (error) {
        console.error('❌ Failed to initialize OpenAI service:', error);
      }
    }
    
    // 更新状态
    this.updateState(this.createInitialState());
    
    // 设置事件监听器
    this.setupEventListeners();
  }

  /**
   * 创建初始状态
   */
  private createInitialState(): AppState {
    return {
      audio: {
        status: 'idle',
        hasPermission: false,
        deviceId: null,
        volume: 0,
        error: null,
        stream: null,
      },
      connections: {
        assemblyai: {
          status: 'disconnected',
          reconnectAttempts: 0,
        },
        deepgram: {
          status: 'disconnected',
          reconnectAttempts: 0,
        },
        openai: {
          status: 'disconnected',
          reconnectAttempts: 0,
        },
      },
      transcriptions: {
        assemblyai: [],
        deepgram: [],
        openai: [],
      },
      rawTranscripts: [],
      metrics: {
        assemblyai: {},
        deepgram: {},
        openai: {},
      },
      ui: {
        showMetrics: false,
        activePanel: 'comparison',
        isFullscreen: false,
      },
    };
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 音频录制器事件
    this.audioRecorder.onAudioData((audioData) => {
      this.distributeAudioData(audioData);
    });

    this.audioRecorder.onVolumeChange((volume) => {
      this.updateState({
        audio: { ...this.currentState.audio, volume },
      });
      this.notifyVolumeChange(volume);
    });

    // AssemblyAI 服务事件
    if (this.assemblyAIService) {
      this.assemblyAIService.onConnectionStatusChange((status) => {
        this.updateConnectionStatus('assemblyai', status);
      });

      this.assemblyAIService.onTranscript((result) => {
        this.addTranscriptionResult('assemblyai', result);
        this.storeRawTranscript('assemblyai', null, result); // AssemblyAI doesn't provide raw data in current setup
        this.notifyTranscript('assemblyai', result);
      });

      this.assemblyAIService.onError((error) => {
        this.notifyError('assemblyai', error);
      });
    }

    // Deepgram 服务事件
    if (this.deepgramService) {
      this.deepgramService.onConnectionStatusChange((status) => {
        this.updateConnectionStatus('deepgram', status);
      });

      this.deepgramService.onTranscript((result) => {
        this.addTranscriptionResult('deepgram', result);
        this.storeRawTranscript('deepgram', null, result); // Deepgram doesn't provide raw data in current setup
        this.notifyTranscript('deepgram', result);
      });

      this.deepgramService.onError((error) => {
        this.notifyError('deepgram', error);
      });
    }

    // OpenAI 服务事件
    if (this.openaiService) {
      this.openaiService.onConnectionStatusChange((status) => {
        this.updateConnectionStatus('openai', status);
      });

      this.openaiService.onTranscript((result) => {
        this.addTranscriptionResult('openai', result);
        this.storeRawTranscript('openai', null, result); // OpenAI doesn't provide raw data in current setup
        this.notifyTranscript('openai', result);
      });

      this.openaiService.onError((error) => {
        this.notifyError('openai', error);
      });
    }
  }

  /**
   * 初始化所有服务
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        console.warn('TranscriptionManager is already initialized');
        return;
      }

      console.log('🚀 Initializing TranscriptionManager...');
      
      // 检查浏览器支持
      const browserSupport = AudioRecorder.checkSupport();
      if (!browserSupport.supported) {
        throw new Error(`${ERROR_MESSAGES.browserNotSupported}: ${browserSupport.missing.join(', ')}`);
      }

      // 请求麦克风权限
      const hasPermission = await this.audioRecorder.requestPermission();
      this.updateState({
        audio: { ...this.currentState.audio, hasPermission },
      });

      if (!hasPermission) {
        throw new Error(ERROR_MESSAGES.microphonePermission);
      }

      this.isInitialized = true;
      console.log('✅', SUCCESS_MESSAGES.serviceConnected, '(TranscriptionManager)');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Failed to initialize TranscriptionManager:', error);
      this.updateState({
        audio: { ...this.currentState.audio, error: errorMessage },
      });
      throw error;
    }
  }

  /**
   * 连接到转录服务（不开始录制）
   */
  async connectServices(): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('🔗 Connecting to transcription services...');

      // 并行连接所有服务
      const connectionPromises: Promise<void>[] = [];
      
      if (this.assemblyAIService) {
        connectionPromises.push(this.assemblyAIService.connect());
      }
      
      if (this.deepgramService) {
        connectionPromises.push(this.deepgramService.connect());
      }

      if (this.openaiService) {
        connectionPromises.push(this.openaiService.connect());
      }

      // 等待所有服务连接
      await Promise.allSettled(connectionPromises);
      
      console.log('✅ Services connection completed');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Failed to connect services:', error);
      this.updateState({
        audio: { ...this.currentState.audio, error: errorMessage },
      });
      throw error;
    }
  }

  /**
   * 断开转录服务连接（不停止录制）
   */
  async disconnectServices(): Promise<void> {
    try {
      console.log('🔌 Disconnecting transcription services...');

      // 并行断开所有服务
      const disconnectionPromises: Promise<void>[] = [];
      
      if (this.assemblyAIService) {
        disconnectionPromises.push(this.assemblyAIService.disconnect());
      }
      
      if (this.deepgramService) {
        disconnectionPromises.push(this.deepgramService.disconnect());
      }

      if (this.openaiService) {
        disconnectionPromises.push(this.openaiService.disconnect());
      }

      // 等待所有服务断开
      await Promise.allSettled(disconnectionPromises);
      
      // 关闭麦克风
      this.audioRecorder.stopMediaStream();
      
      console.log('✅ Services disconnected');
      
    } catch (error) {
      console.error('❌ Failed to disconnect services:', error);
      throw error;
    }
  }

  /**
   * 开始录制（假设服务已连接）
   */
  async startRecording(): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (this.isRecording) {
        console.warn('Recording is already in progress');
        return;
      }

      console.log('🎙️ Starting recording...');
      this.updateAudioStatus('starting');

      // 开始音频录制
      await this.audioRecorder.startRecording();
      
      this.isRecording = true;
      this.updateAudioStatus('recording');
      
      console.log('✅', SUCCESS_MESSAGES.recordingStarted);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Failed to start recording:', error);
      this.updateAudioStatus('idle');
      this.updateState({
        audio: { ...this.currentState.audio, error: errorMessage },
      });
      throw error;
    }
  }

  /**
   * 开始转录（连接服务并开始录制）
   */
  async startTranscription(): Promise<void> {
    // 先连接服务
    await this.connectServices();
    
    // 然后开始录制
    await this.startRecording();
  }

  /**
   * 停止转录
   */
  async stopTranscription(): Promise<void> {
    try {
      if (!this.isRecording) {
        console.warn('Transcription is not in progress');
        return;
      }

      console.log('⏹️ Stopping transcription...');
      this.updateAudioStatus('stopping');

      // 停止音频录制
      this.audioRecorder.stopRecording();

      // 并行断开所有服务
      const disconnectionPromises: Promise<void>[] = [];
      
      if (this.assemblyAIService) {
        disconnectionPromises.push(this.assemblyAIService.disconnect());
      }
      
      if (this.deepgramService) {
        disconnectionPromises.push(this.deepgramService.disconnect());
      }

      if (this.openaiService) {
        disconnectionPromises.push(this.openaiService.disconnect());
      }

      // 等待所有服务断开
      await Promise.allSettled(disconnectionPromises);

      // 关闭麦克风
      this.audioRecorder.stopMediaStream();

      this.isRecording = false;
      this.updateAudioStatus('idle');
      
      console.log('✅', SUCCESS_MESSAGES.recordingStopped);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Error stopping transcription:', error);
      this.updateState({
        audio: { ...this.currentState.audio, error: errorMessage },
      });
    }
  }

  /**
   * 分发音频数据到所有服务
   */
  private distributeAudioData(audioData: ArrayBuffer): void {
    if (!this.isRecording) return;

    // 发送到 AssemblyAI
    if (this.assemblyAIService) {
      this.assemblyAIService.sendAudio(audioData);
    }

    // 发送到 Deepgram
    if (this.deepgramService) {
      this.deepgramService.sendAudio(audioData);
    }

    // 发送到 OpenAI
    if (this.openaiService) {
      this.openaiService.sendAudio(audioData);
    }
  }

  /**
   * 更新连接状态
   */
  private updateConnectionStatus(service: ServiceType, status: ConnectionStatus): void {
    let serviceInfo;
    if (service === 'assemblyai') {
      serviceInfo = this.assemblyAIService?.getConnectionInfo();
    } else if (service === 'deepgram') {
      serviceInfo = this.deepgramService?.getConnectionInfo();
    } else if (service === 'openai') {
      serviceInfo = this.openaiService?.getConnectionInfo();
    }

    const connection: ServiceConnection = {
      status,
      lastConnected: serviceInfo?.lastConnected || undefined,
      reconnectAttempts: serviceInfo?.reconnectAttempts || 0,
      error: status === 'error' ? 'Connection error' : undefined,
    };

    this.updateState({
      connections: {
        ...this.currentState.connections,
        [service]: connection,
      },
    });

    this.notifyServiceStatus(service, status);
  }

  /**
   * 添加转录结果
   */
  private addTranscriptionResult(service: ServiceType, result: TranscriptionResult): void {
    const currentResults = this.currentState.transcriptions[service];
    const updatedResults = [...currentResults];
    
    // 保持最近的 50 条结果
    if (updatedResults.length >= 50) {
      updatedResults.shift();
    }
    
    updatedResults.push(result);

    this.updateState({
      transcriptions: {
        ...this.currentState.transcriptions,
        [service]: updatedResults,
      },
    });
  }

  /**
   * 存储原始转录数据
   */
  private storeRawTranscript(service: ServiceType, rawData: any, processedResult: TranscriptionResult): void {
    const rawTranscriptData: RawTranscriptData = {
      id: `${service}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      service,
      timestamp: processedResult.timestamp,
      rawData,
      processedResult,
    };

    const updatedRawTranscripts = [...this.currentState.rawTranscripts];
    
    // 保持最近的 200 条原始记录
    if (updatedRawTranscripts.length >= 200) {
      updatedRawTranscripts.shift();
    }
    
    updatedRawTranscripts.push(rawTranscriptData);

    this.updateState({
      rawTranscripts: updatedRawTranscripts,
    });
  }

  /**
   * 更新音频状态
   */
  private updateAudioStatus(status: RecordingStatus): void {
    this.updateState({
      audio: { ...this.currentState.audio, status },
    });
  }

  /**
   * 更新状态并通知监听器
   */
  private updateState(partialState: Partial<AppState>): void {
    this.currentState = { ...this.currentState, ...partialState };
    this.notifyStateUpdate(partialState);
  }

  /**
   * 通知服务状态变更
   */
  private notifyServiceStatus(service: ServiceType, status: ConnectionStatus): void {
    this.serviceStatusCallbacks.forEach(callback => {
      try {
        callback(service, status);
      } catch (error) {
        console.error('Service status callback error:', error);
      }
    });
  }

  /**
   * 通知转录结果
   */
  private notifyTranscript(service: ServiceType, result: TranscriptionResult): void {
    this.transcriptCallbacks.forEach(callback => {
      try {
        callback(service, result);
      } catch (error) {
        console.error('Transcript callback error:', error);
      }
    });
  }

  /**
   * 通知错误
   */
  private notifyError(service: ServiceType, error: Error): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(service, error);
      } catch (error) {
        console.error('Error callback error:', error);
      }
    });
  }

  /**
   * 通知音量变更
   */
  private notifyVolumeChange(volume: number): void {
    this.volumeCallbacks.forEach(callback => {
      try {
        callback(volume);
      } catch (error) {
        console.error('Volume callback error:', error);
      }
    });
  }

  /**
   * 通知状态更新
   */
  private notifyStateUpdate(partialState: Partial<AppState>): void {
    this.stateUpdateCallbacks.forEach(callback => {
      try {
        callback(partialState);
      } catch (error) {
        console.error('State update callback error:', error);
      }
    });
  }

  // 公共 API - 事件监听器

  onServiceStatus(callback: ServiceStatusCallback): void {
    this.serviceStatusCallbacks.push(callback);
  }

  offServiceStatus(callback: ServiceStatusCallback): void {
    const index = this.serviceStatusCallbacks.indexOf(callback);
    if (index > -1) {
      this.serviceStatusCallbacks.splice(index, 1);
    }
  }

  onTranscript(callback: TranscriptCallback): void {
    this.transcriptCallbacks.push(callback);
  }

  offTranscript(callback: TranscriptCallback): void {
    const index = this.transcriptCallbacks.indexOf(callback);
    if (index > -1) {
      this.transcriptCallbacks.splice(index, 1);
    }
  }

  onError(callback: ErrorCallback): void {
    this.errorCallbacks.push(callback);
  }

  offError(callback: ErrorCallback): void {
    const index = this.errorCallbacks.indexOf(callback);
    if (index > -1) {
      this.errorCallbacks.splice(index, 1);
    }
  }

  onVolumeChange(callback: AudioVolumeCallback): void {
    this.volumeCallbacks.push(callback);
  }

  offVolumeChange(callback: AudioVolumeCallback): void {
    const index = this.volumeCallbacks.indexOf(callback);
    if (index > -1) {
      this.volumeCallbacks.splice(index, 1);
    }
  }

  onStateUpdate(callback: StateUpdateCallback): void {
    this.stateUpdateCallbacks.push(callback);
  }

  offStateUpdate(callback: StateUpdateCallback): void {
    const index = this.stateUpdateCallbacks.indexOf(callback);
    if (index > -1) {
      this.stateUpdateCallbacks.splice(index, 1);
    }
  }

  // 公共 API - 状态查询

  getCurrentState(): AppState {
    return { ...this.currentState };
  }

  getRecordingStatus() {
    return {
      isRecording: this.isRecording,
      isInitialized: this.isInitialized,
      audioStatus: this.audioRecorder.getRecordingStatus(),
      assemblyAI: this.assemblyAIService?.getConnectionInfo() || null,
      deepgram: this.deepgramService?.getConnectionInfo() || null,
      openai: this.openaiService?.getConnectionInfo() || null,
    };
  }

  getAvailableServices(): ServiceType[] {
    const services: ServiceType[] = [];
    if (this.assemblyAIService) services.push('assemblyai');
    if (this.deepgramService) services.push('deepgram');
    if (this.openaiService) services.push('openai');
    return services;
  }

  /**
   * 检查服务是否都已连接
   */
  areServicesConnected(): boolean {
    const assemblyAIConnected = !this.assemblyAIService || this.currentState.connections.assemblyai.status === 'connected';
    const deepgramConnected = !this.deepgramService || this.currentState.connections.deepgram.status === 'connected';
    const openaiConnected = !this.openaiService || this.currentState.connections.openai.status === 'connected';
    return assemblyAIConnected && deepgramConnected && openaiConnected;
  }

  /**
   * 导出原始转录数据为 JSON 文件
   */
  exportRawTranscripts(): void {
    const data = {
      exportTime: new Date().toISOString(),
      sessionInfo: {
        duration: this.isRecording ? Date.now() - (this.currentState.rawTranscripts[0]?.timestamp || Date.now()) : 0,
        totalTranscripts: this.currentState.rawTranscripts.length,
        services: this.getAvailableServices(),
      },
      rawTranscripts: this.currentState.rawTranscripts,
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcripts_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('✅ Raw transcripts exported successfully');
  }

  /**
   * 清理资源
   */
  dispose(): void {
    // 停止转录
    this.stopTranscription();
    
    // 清理服务
    if (this.assemblyAIService) {
      this.assemblyAIService.dispose();
      this.assemblyAIService = null;
    }
    
    if (this.deepgramService) {
      this.deepgramService.dispose();
      this.deepgramService = null;
    }

    if (this.openaiService) {
      this.openaiService.dispose();
      this.openaiService = null;
    }
    
    // 清理音频录制器
    this.audioRecorder.dispose();
    
    // 清理所有回调
    this.serviceStatusCallbacks.length = 0;
    this.transcriptCallbacks.length = 0;
    this.errorCallbacks.length = 0;
    this.volumeCallbacks.length = 0;
    this.stateUpdateCallbacks.length = 0;
    
    this.isInitialized = false;
    console.log('🧹 TranscriptionManager disposed');
  }
}