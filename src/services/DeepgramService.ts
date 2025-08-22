/**
 * Deepgram 实时转录服务
 * 基于 Deepgram JavaScript SDK 的流式转录实现
 */

import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { CONNECTION_CONFIG, ERROR_MESSAGES } from '@/constants';
import { ServiceType, ConnectionStatus, TranscriptionResult } from '@/types';

export interface DeepgramServiceOptions {
  apiKey: string;
  model?: string;
  language?: string;
  punctuate?: boolean;
  diarize?: boolean;
  smartFormat?: boolean;
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

export class DeepgramService {
  private client: any | null = null;
  private connection: any | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isManualDisconnect = false; // 标记是否为主动断开
  
  private transcriptCallbacks: TranscriptCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  
  private options: Required<DeepgramServiceOptions>;
  private lastConnectedTime: Date | null = null;

  constructor(options: DeepgramServiceOptions) {
    this.options = {
      apiKey: options.apiKey,
      model: options.model || 'nova-2',
      language: options.language || 'zh-cn',
      punctuate: options.punctuate ?? true,
      diarize: options.diarize ?? false,
      smartFormat: options.smartFormat ?? true,
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
      throw new Error('Invalid Deepgram API key. Please check your environment variables.');
    }
  }

  /**
   * 连接到 Deepgram 服务
   */
  async connect(): Promise<void> {
    try {
      if (this.connectionStatus === 'connected') {
        console.warn('Deepgram service is already connected');
        return;
      }

      this.setConnectionStatus('connecting');
      
      // 创建 Deepgram 客户端
      this.client = createClient(this.options.apiKey);
      
      // 建立实时转录连接
      this.connection = this.client.listen.live({
        model: this.options.model,
        language: this.options.language,
        punctuate: this.options.punctuate,
        diarize: this.options.diarize,
        smart_format: this.options.smartFormat,
        encoding: 'linear16',
        sample_rate: 16000,
        channels: 1,
      });

      // 设置事件监听器
      this.setupEventListeners();
      
    } catch (error) {
      console.error('❌ Deepgram connection failed:', error);
      this.setConnectionStatus('error');
      this.notifyError(new Error(`${ERROR_MESSAGES.serviceConnectionFailed}: ${error}`));
      throw error;
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.connection) return;

    // 连接打开
    this.connection.on(LiveTranscriptionEvents.Open, () => {
      console.log('✅ Deepgram connected');
      this.setConnectionStatus('connected');
      this.lastConnectedTime = new Date();
      this.reconnectAttempts = 0;
      this.isManualDisconnect = false; // 重置主动断开标志
      
      // 清除重连定时器
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
    });

    // 接收转录结果
    this.connection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
      try {
        const channel = data.channel;
        const alternatives = channel.alternatives;
        
        if (alternatives && alternatives.length > 0) {
          const alternative = alternatives[0];
          const transcript = alternative.transcript;

          console.log('transcript', transcript);
          
          // 只处理非空转录结果
          if (transcript && transcript.trim() !== '') {
            const result: TranscriptionResult = {
              text: transcript,
              confidence: alternative.confidence || 0,
              isFinal: data.is_final || false,
              timestamp: Date.now(),
              service: 'deepgram',
            };

            this.notifyTranscript(result);
          }
        }
      } catch (error) {
        console.error('❌ Error processing Deepgram transcript:', error);
        this.notifyError(new Error(`Error processing transcript: ${error}`));
      }
    });

    // 连接关闭
    this.connection.on(LiveTranscriptionEvents.Close, (code: number, reason: string) => {
      console.log('⚠️ Deepgram connection closed:', { code, reason, isManual: this.isManualDisconnect });
      this.setConnectionStatus('disconnected');
      
      // 只有在非主动断开且符合重连条件时才尝试重连
      if (!this.isManualDisconnect && code !== 1000 && this.reconnectAttempts < CONNECTION_CONFIG.maxReconnectAttempts) {
        this.scheduleReconnect();
      } else if (this.isManualDisconnect) {
        // 重置主动断开标志
        this.isManualDisconnect = false;
      }
    });

    // 错误处理
    this.connection.on(LiveTranscriptionEvents.Error, (error: Error) => {
      console.error('❌ Deepgram error:', error);
      this.setConnectionStatus('error');
      this.notifyError(error);
      
      // 只有在非主动断开时才尝试重连
      if (!this.isManualDisconnect && this.reconnectAttempts < CONNECTION_CONFIG.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    });

    // 元数据事件
    this.connection.on(LiveTranscriptionEvents.Metadata, (data: any) => {
      console.log('📊 Deepgram metadata:', data);
    });
  }

  /**
   * 发送音频数据
   */
  sendAudio(audioData: ArrayBuffer): void {
    if (!this.connection || this.connectionStatus !== 'connected') {
      console.warn('Deepgram not connected, skipping audio data');
      return;
    }

    try {
      this.connection.send(audioData);
    } catch (error) {
      console.error('❌ Failed to send audio to Deepgram:', error);
      this.notifyError(new Error(`Failed to send audio: ${error}`));
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    try {
      // 标记为主动断开
      this.isManualDisconnect = true;
      
      // 清除重连定时器
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      if (this.connection) {
        this.connection.finish();
        this.connection = null;
      }
      
      this.client = null;
      this.setConnectionStatus('disconnected');
      console.log('👋 Deepgram disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting Deepgram:', error);
      // 即使出错也要重置标志
      this.isManualDisconnect = false;
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
    
    console.log(`🔄 Deepgram scheduling reconnect attempt ${this.reconnectAttempts}/${CONNECTION_CONFIG.maxReconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectTimeout = null;
      try {
        await this.connect();
      } catch (error) {
        console.error('❌ Deepgram reconnect failed:', error);
        
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
      service: 'deepgram' as ServiceType,
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
    
    console.log('🧹 DeepgramService disposed');
  }
}