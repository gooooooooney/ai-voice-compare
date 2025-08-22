/**
 * AssemblyAI 实时转录服务
 * 基于 AssemblyAI JavaScript SDK 的流式转录实现
 */

import { StreamingTranscriber } from 'assemblyai';
import { CONNECTION_CONFIG, ERROR_MESSAGES } from '@/constants';
import { ServiceType, ConnectionStatus, TranscriptionResult } from '@/types';

export interface AssemblyAIServiceOptions {
  apiKey: string;
  sampleRate?: number;
  enableAutomaticPunctuation?: boolean;
  enableSpeakerDiarization?: boolean;
}

export interface TranscriptCallback {
  (result: TranscriptionResult): void;
}

export interface ErrorCallback {
  (error: Error): void;
}

export interface ConnectionCallback {
  (status: ConnectionStatus): void;
}

export class AssemblyAIService {
  private transcriber: StreamingTranscriber | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  
  private transcriptCallbacks: TranscriptCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  
  private options: Required<AssemblyAIServiceOptions>;
  private lastConnectedTime: Date | null = null;

  constructor(options: AssemblyAIServiceOptions) {
    this.options = {
      apiKey: options.apiKey,
      sampleRate: options.sampleRate || 16000,
      enableAutomaticPunctuation: options.enableAutomaticPunctuation ?? true,
      enableSpeakerDiarization: options.enableSpeakerDiarization ?? false,
    };

    this.validateApiKey();
  }

  /**
   * 验证 API 密钥
   */
  private validateApiKey(): void {
    if (!this.options.apiKey || 
        this.options.apiKey.includes('your_') || 
        this.options.apiKey.includes('_here')) {
      throw new Error('Invalid AssemblyAI API key. Please check your environment variables.');
    }
  }

  /**
   * 连接到 AssemblyAI 服务
   */
  async connect(): Promise<void> {
    try {
      if (this.connectionStatus === 'connected') {
        console.warn('AssemblyAI service is already connected');
        return;
      }

      this.setConnectionStatus('connecting');
      
      // 直接创建 StreamingTranscriber 实例，适用于浏览器环境
      this.transcriber = new StreamingTranscriber({
        token: this.options.apiKey,
        sampleRate: this.options.sampleRate,
      });

      // 设置事件监听器
      this.setupEventListeners();

      // 连接到服务
      await this.transcriber.connect();
      
    } catch (error) {
      console.error('❌ AssemblyAI connection failed:', error);
      this.setConnectionStatus('error');
      this.notifyError(new Error(`${ERROR_MESSAGES.serviceConnectionFailed}: ${error}`));
      throw error;
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.transcriber) return;

    // 连接打开
    (this.transcriber).on('open', (data) => {
      console.log('✅ AssemblyAI connected:', data);
      this.setConnectionStatus('connected');
      this.lastConnectedTime = new Date();
      this.reconnectAttempts = 0;
      
      // 清除重连定时器
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
    });

    // 接收转录结果 - 使用 'turn' 事件
    (this.transcriber).on('turn', (data) => {
      console.log('turn', data);
      const result: TranscriptionResult = {
        text: data.transcript || '',
        confidence: 0, // AssemblyAI streaming doesn't provide confidence scores
        isFinal: true, // Turn events represent complete turns
        timestamp: Date.now(),
        service: 'assemblyai',
      };

      this.notifyTranscript(result);
    });

    // 连接关闭
    (this.transcriber).on('close', (code: number, reason: string) => {
      console.log('⚠️ AssemblyAI connection closed:', { code, reason });
      this.setConnectionStatus('disconnected');
      
      // 如果不是主动关闭，尝试重连
      if (code !== 1000 && this.reconnectAttempts < CONNECTION_CONFIG.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    });

    // 错误处理
    (this.transcriber).on('error', (error) => {
      console.error('❌ AssemblyAI error:', error);
      this.setConnectionStatus('error');
      this.notifyError(error);
      
      // 尝试重连
      if (this.reconnectAttempts < CONNECTION_CONFIG.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    });
  }

  /**
   * 发送音频数据
   */
  sendAudio(audioData: ArrayBuffer): void {
    if (!this.transcriber || this.connectionStatus !== 'connected') {
      console.warn('AssemblyAI not connected, skipping audio data');
      return;
    }

    try {
      this.transcriber.sendAudio(audioData);
    } catch (error) {
      console.error('❌ Failed to send audio to AssemblyAI:', error);
      this.notifyError(new Error(`Failed to send audio: ${error}`));
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    try {
      // 清除重连定时器
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      if (this.transcriber) {
        await this.transcriber.close();
        this.transcriber = null;
      }
      
      this.setConnectionStatus('disconnected');
      console.log('👋 AssemblyAI disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting AssemblyAI:', error);
    }
  }

  /**
   * 计划重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      return; // 已经有重连计划
    }

    this.reconnectAttempts++;
    const delay = CONNECTION_CONFIG.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // 指数退避
    
    console.log(`🔄 AssemblyAI scheduling reconnect attempt ${this.reconnectAttempts}/${CONNECTION_CONFIG.maxReconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectTimeout = null;
      try {
        await this.connect();
      } catch (error) {
        console.error('❌ AssemblyAI reconnect failed:', error);
        
        if (this.reconnectAttempts < CONNECTION_CONFIG.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else {
          this.notifyError(new Error('Maximum reconnect attempts exceeded'));
        }
      }
    }, delay);
  }

  /**
   * 设置连接状态
   */
  private setConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.connectionCallbacks.forEach(callback => {
        try {
          callback(status);
        } catch (error) {
          console.error('Connection status callback error:', error);
        }
      });
    }
  }

  /**
   * 通知转录结果
   */
  private notifyTranscript(result: TranscriptionResult): void {
    this.transcriptCallbacks.forEach(callback => {
      try {
        callback(result);
      } catch (error) {
        console.error('Transcript callback error:', error);
      }
    });
  }

  /**
   * 通知错误
   */
  private notifyError(error: Error): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (error) {
        console.error('Error callback error:', error);
      }
    });
  }

  /**
   * 添加转录回调
   */
  onTranscript(callback: TranscriptCallback): void {
    this.transcriptCallbacks.push(callback);
  }

  /**
   * 移除转录回调
   */
  offTranscript(callback: TranscriptCallback): void {
    const index = this.transcriptCallbacks.indexOf(callback);
    if (index > -1) {
      this.transcriptCallbacks.splice(index, 1);
    }
  }

  /**
   * 添加错误回调
   */
  onError(callback: ErrorCallback): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * 移除错误回调
   */
  offError(callback: ErrorCallback): void {
    const index = this.errorCallbacks.indexOf(callback);
    if (index > -1) {
      this.errorCallbacks.splice(index, 1);
    }
  }

  /**
   * 添加连接状态回调
   */
  onConnectionStatusChange(callback: ConnectionCallback): void {
    this.connectionCallbacks.push(callback);
  }

  /**
   * 移除连接状态回调
   */
  offConnectionStatusChange(callback: ConnectionCallback): void {
    const index = this.connectionCallbacks.indexOf(callback);
    if (index > -1) {
      this.connectionCallbacks.splice(index, 1);
    }
  }

  /**
   * 获取连接信息
   */
  getConnectionInfo() {
    return {
      status: this.connectionStatus,
      service: 'assemblyai' as ServiceType,
      lastConnected: this.lastConnectedTime,
      reconnectAttempts: this.reconnectAttempts,
      isConnected: this.connectionStatus === 'connected',
    };
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.disconnect();
    
    // 清理回调
    this.transcriptCallbacks.length = 0;
    this.errorCallbacks.length = 0;
    this.connectionCallbacks.length = 0;
    
    console.log('🧹 AssemblyAIService disposed');
  }
}