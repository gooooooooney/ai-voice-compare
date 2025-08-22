/**
 * OpenAI 实时转录服务
 * 基于 OpenAI Realtime API 的流式转录实现
 * 
 * 安全警告：此服务在浏览器环境中运行，使用 dangerouslyAllowBrowser 标志。
 * 请确保：
 * 1. API 密钥不要硬编码在前端代码中
 * 2. 使用环境变量管理敏感信息
 * 3. 考虑通过后端代理来保护 API 密钥
 */

import { OpenAIRealtimeWebSocket } from 'openai/beta/realtime/websocket';
import OpenAI from 'openai';
import { CONNECTION_CONFIG, ERROR_MESSAGES } from '@/constants';
import { ServiceType, ConnectionStatus, TranscriptionResult } from '@/types';

export interface OpenAIRealtimeServiceOptions {
  apiKey: string;
  model?: string;
  sampleRate?: number;
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

export class OpenAIRealtimeService {
  private client: OpenAIRealtimeWebSocket | null = null;
  private openaiClient: OpenAI | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isManualDisconnect = false; // 标记是否为主动断开

  
  private transcriptCallbacks: TranscriptCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  
  private options: Required<OpenAIRealtimeServiceOptions>;
  private lastConnectedTime: Date | null = null;
  private currentText = ''; // 累积的文本内容
  private audioBufferTimeout: ReturnType<typeof setTimeout> | null = null; // 音频缓冲区提交定时器
  private hasUncommittedAudio = false; // 标记是否有未提交的音频数据

  constructor(options: OpenAIRealtimeServiceOptions) {
    this.options = {
      apiKey: options.apiKey,
      model: options.model || 'gpt-4o-realtime-preview-2024-12-17',
      sampleRate: options.sampleRate || 16000,
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
      throw new Error('Invalid OpenAI API key. Please check your environment variables.');
    }
  }

  /**
   * 获取临时会话令牌
   */
  private async getSessionToken(): Promise<{ sessionKey: string }> {
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/openai/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get session token: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get session token:', error);
      throw error;
    }
  }

  /**
   * 连接到 OpenAI Realtime 服务
   */
  async connect(): Promise<void> {
    try {
      if (this.connectionStatus === 'connected') {
        console.warn('OpenAI Realtime service is already connected');
        return;
      }

      this.setConnectionStatus('connecting');
      const { sessionKey } = await this.getSessionToken();
      // 创建 OpenAI 客户端 - 用于后端 API 调用
      this.openaiClient = new OpenAI({
        apiKey: sessionKey,
        dangerouslyAllowBrowser: true, // 允许在浏览器环境中运行
      });
      
      // 创建 OpenAI Realtime WebSocket 客户端
      this.client = new OpenAIRealtimeWebSocket({ 
        model: this.options.model,
      }, this.openaiClient);

      // 设置事件监听器
      this.setupEventListeners();
      
      // WebSocket 连接会自动建立
      
    } catch (error) {
      console.error('❌ OpenAI Realtime connection failed:', error);
      this.setConnectionStatus('error');
      this.notifyError(new Error(`${ERROR_MESSAGES.serviceConnectionFailed}: ${error}`));
      throw error;
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.client) return;

    // 连接打开
    this.client.socket.addEventListener('open', () => {
      console.log('✅ OpenAI Realtime connected');
      this.setConnectionStatus('connected');
      this.lastConnectedTime = new Date();
      this.reconnectAttempts = 0;
      this.isManualDisconnect = false; // 重置主动断开标志
      
      // 清除重连定时器
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      // 配置会话设置
      this.configureSession();
    });

    // 接收转录结果
    this.client.on('response.text.delta', (event) => {
      try {
        console.log('response.text.delta', event);
        
        // 累积文本内容
        this.currentText += event.delta;
        
        // 创建转录结果
        const result: TranscriptionResult = {
          text: event.delta,
          confidence: 0, // OpenAI Realtime 不提供置信度
          isFinal: false, // delta 表示部分结果
          timestamp: Date.now(),
          service: 'openai',
        };

        this.notifyTranscript(result);
      } catch (error) {
        console.error('❌ Error processing OpenAI Realtime transcript:', error);
        this.notifyError(new Error(`Error processing transcript: ${error}`));
      }
    });

    // 接收完整的转录结果
    this.client.on('response.text.done', () => {
      try {
        console.log('response.text.done');
        
        if (this.currentText.trim()) {
          // 创建最终转录结果
          const result: TranscriptionResult = {
            text: this.currentText,
            confidence: 0, // OpenAI Realtime 不提供置信度
            isFinal: true,
            timestamp: Date.now(),
            service: 'openai',
          };

          this.notifyTranscript(result);
        }
        
        // 重置累积文本
        this.currentText = '';
      } catch (error) {
        console.error('❌ Error processing OpenAI Realtime final transcript:', error);
        this.notifyError(new Error(`Error processing final transcript: ${error}`));
      }
    });

    // 连接关闭
    this.client.socket.addEventListener('close', (event) => {
      console.log('⚠️ OpenAI Realtime connection closed:', { code: event.code, reason: event.reason, isManual: this.isManualDisconnect });
      this.setConnectionStatus('disconnected');
      
      // 只有在非主动断开且符合重连条件时才尝试重连
      if (!this.isManualDisconnect && event.code !== 1000 && this.reconnectAttempts < CONNECTION_CONFIG.maxReconnectAttempts) {
        this.scheduleReconnect();
      } else if (this.isManualDisconnect) {
        // 重置主动断开标志
        this.isManualDisconnect = false;
      }
    });

    // 错误处理
    this.client.on('error', (error) => {
      console.error('❌ OpenAI Realtime error:', error);
      this.setConnectionStatus('error');
      this.notifyError(error);
      
      // 只有在非主动断开时才尝试重连
      if (!this.isManualDisconnect && this.reconnectAttempts < CONNECTION_CONFIG.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    });

    // 会话创建事件
    this.client.on('session.created', (event) => {
      console.log('📊 OpenAI Realtime session created:', event.session);
    });
  }

  /**
   * 配置会话设置
   */
  private configureSession(): void {
    if (!this.client) return;

    try {
      // 配置会话以支持音频输入和文本输出
      this.client.send({
        type: 'session.update',
        session: {
          modalities: ["audio",'text'], // 支持音频输入和文本输出
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: {
            model: 'whisper-1',
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 200,
          },
        },
      });

      console.log('📝 OpenAI Realtime session configured');
    } catch (error) {
      console.error('❌ Failed to configure OpenAI Realtime session:', error);
      this.notifyError(new Error(`Failed to configure session: ${error}`));
    }
  }

  /**
   * 发送音频数据
   */
  sendAudio(audioData: ArrayBuffer): void {
    if (!this.client || this.connectionStatus !== 'connected') {
      console.warn('OpenAI Realtime not connected, skipping audio data');
      return;
    }

    try {
      // 将 ArrayBuffer 转换为 base64
      const bytes = new Uint8Array(audioData);
      const base64 = btoa(String.fromCharCode(...bytes));
      
      // 发送音频数据到输入缓冲区
      this.client.send({
        type: 'input_audio_buffer.append',
        audio: base64,
      });
      
      // 标记有未提交的音频
      this.hasUncommittedAudio = true;
      
      // 清除之前的定时器
      if (this.audioBufferTimeout) {
        clearTimeout(this.audioBufferTimeout);
      }
      
      // 设置新的定时器，500ms 后自动提交缓冲区
      this.audioBufferTimeout = setTimeout(() => {
        this.commitAudioBuffer();
      }, 500);
    } catch (error) {
      console.error('❌ Failed to send audio to OpenAI Realtime:', error);
      this.notifyError(new Error(`Failed to send audio: ${error}`));
    }
  }

  /**
   * 提交音频缓冲区
   */
  private commitAudioBuffer(): void {
    if (!this.client || this.connectionStatus !== 'connected' || !this.hasUncommittedAudio) {
      return;
    }

    try {
      // 提交音频缓冲区
      this.client.send({
        type: 'input_audio_buffer.commit',
      });
      
      // 创建响应请求以触发转录
      this.client.send({
        type: 'response.create',
        response: {
          modalities: ['text'], // 只请求文本响应
          instructions: 'Transcribe the audio input.',
        },
      });
      
      this.hasUncommittedAudio = false;
      this.audioBufferTimeout = null;
      
      console.log('📤 OpenAI audio buffer committed');
    } catch (error) {
      console.error('❌ Failed to commit audio buffer:', error);
      this.notifyError(new Error(`Failed to commit audio buffer: ${error}`));
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
      
      // 清除音频缓冲区定时器
      if (this.audioBufferTimeout) {
        clearTimeout(this.audioBufferTimeout);
        this.audioBufferTimeout = null;
      }

      if (this.client) {
        this.client.close();
        this.client = null;
      }
      
      this.setConnectionStatus('disconnected');
      console.log('👋 OpenAI Realtime disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting OpenAI Realtime:', error);
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
    
    console.log(`🔄 OpenAI Realtime scheduling reconnect attempt ${this.reconnectAttempts}/${CONNECTION_CONFIG.maxReconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectTimeout = null;
      try {
        await this.connect();
      } catch (error) {
        console.error('❌ OpenAI Realtime reconnect failed:', error);
        
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
      service: 'openai' as ServiceType,
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
    
    // 清理客户端
    this.openaiClient = null;
    
    // 清理回调
    this.transcriptCallbacks.length = 0;
    this.errorCallbacks.length = 0;
    this.connectionCallbacks.length = 0;
    
    console.log('🧹 OpenAIRealtimeService disposed');
  }
}