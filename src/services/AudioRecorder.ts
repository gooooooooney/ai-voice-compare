/**
 * Web Audio API 音频录制服务
 * 负责浏览器麦克风访问、音频流处理和数据分发
 */

import { AUDIO_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';
import { debounce } from '@/utils';

export interface AudioRecorderOptions {
  sampleRate?: number;
  channels?: number;
  bitDepth?: number;
}

export interface AudioDataCallback {
  (data: ArrayBuffer): void;
}

export interface VolumeCallback {
  (volume: number): void;
}

export class AudioRecorder {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  
  private isRecording = false;
  private hasPermission = false;
  
  private audioDataCallbacks: AudioDataCallback[] = [];
  private volumeCallbacks: VolumeCallback[] = [];
  
  private options: Required<AudioRecorderOptions>;
  
  // 音量计算相关
  private volumeData: Float32Array = new Float32Array(0);
  private debouncedVolumeUpdate: (volume: number) => void;

  constructor(options: AudioRecorderOptions = {}) {
    this.options = {
      sampleRate: options.sampleRate || AUDIO_CONFIG.sampleRate,
      channels: options.channels || AUDIO_CONFIG.channels,
      bitDepth: options.bitDepth || AUDIO_CONFIG.bitDepth,
    };

    // 防抖的音量更新回调
    this.debouncedVolumeUpdate = debounce((volume: number) => {
      this.volumeCallbacks.forEach(callback => callback(volume));
    }, 100);
  }

  /**
   * 检查浏览器支持
   */
  static checkSupport(): { supported: boolean; missing: string[] } {
    const missing: string[] = [];
    
    if (!navigator.mediaDevices?.getUserMedia) {
      missing.push('getUserMedia');
    }
    
    if (!window.AudioContext && !(window as any).webkitAudioContext) {
      missing.push('AudioContext');
    }
    
    return {
      supported: missing.length === 0,
      missing,
    };
  }

  /**
   * 请求麦克风权限
   */
  async requestPermission(): Promise<boolean> {
    try {
      const support = AudioRecorder.checkSupport();
      if (!support.supported) {
        throw new Error(`${ERROR_MESSAGES.browserNotSupported}: ${support.missing.join(', ')}`);
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.options.sampleRate,
          channelCount: this.options.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.hasPermission = true;
      console.log('✅', SUCCESS_MESSAGES.microphonePermissionGranted);
      return true;
    } catch (error) {
      this.hasPermission = false;
      console.error('❌', ERROR_MESSAGES.microphonePermission, error);
      throw new Error(ERROR_MESSAGES.microphonePermission);
    }
  }

  /**
   * 初始化音频上下文和处理节点
   */
  private async initializeAudioContext(): Promise<void> {
    if (!this.mediaStream) {
      throw new Error('Media stream not available');
    }

    // 创建音频上下文
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass({
      sampleRate: this.options.sampleRate,
    });

    // 恢复音频上下文（某些浏览器需要）
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // 创建音频源
    this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
    
    // 创建分析节点（用于音量监控）
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.volumeData = new Float32Array(this.analyser.frequencyBinCount);
    
    // 创建脚本处理器节点
    this.processor = this.audioContext.createScriptProcessor(
      AUDIO_CONFIG.bufferSize,
      this.options.channels,
      this.options.channels
    );

    // 音频处理回调
    this.processor.onaudioprocess = (event) => {
      if (!this.isRecording) return;

      const inputBuffer = event.inputBuffer;
      const channelData = inputBuffer.getChannelData(0);
      
      // 转换为 ArrayBuffer 格式
      const arrayBuffer = this.float32ToArrayBuffer(channelData);
      
      // 分发音频数据给所有回调
      this.audioDataCallbacks.forEach(callback => {
        try {
          callback(arrayBuffer);
        } catch (error) {
          console.error('Audio data callback error:', error);
        }
      });

      // 更新音量
      this.updateVolume();
    };

    // 连接音频节点
    this.source.connect(this.analyser);
    this.analyser.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  /**
   * 开始录制
   */
  async startRecording(): Promise<void> {
    try {
      if (this.isRecording) {
        console.warn('Recording is already in progress');
        return;
      }

      if (!this.hasPermission) {
        await this.requestPermission();
      }

      if (!this.audioContext) {
        await this.initializeAudioContext();
      }

      this.isRecording = true;
      console.log('🎙️', SUCCESS_MESSAGES.recordingStarted);
    } catch (error) {
      console.error('❌', ERROR_MESSAGES.recordingFailed, error);
      throw new Error(ERROR_MESSAGES.recordingFailed);
    }
  }

  /**
   * 停止录制
   */
  stopRecording(): void {
    this.isRecording = false;
    console.log('⏹️', SUCCESS_MESSAGES.recordingStopped);
  }

  /**
   * 停止媒体流并关闭麦克风
   */
  stopMediaStream(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        track.stop();
        console.log('🎤 麦克风已关闭');
      });
      this.mediaStream = null;
      this.hasPermission = false;
    }
  }

  /**
   * 添加音频数据回调
   */
  onAudioData(callback: AudioDataCallback): void {
    this.audioDataCallbacks.push(callback);
  }

  /**
   * 移除音频数据回调
   */
  offAudioData(callback: AudioDataCallback): void {
    const index = this.audioDataCallbacks.indexOf(callback);
    if (index > -1) {
      this.audioDataCallbacks.splice(index, 1);
    }
  }

  /**
   * 添加音量监控回调
   */
  onVolumeChange(callback: VolumeCallback): void {
    this.volumeCallbacks.push(callback);
  }

  /**
   * 移除音量监控回调
   */
  offVolumeChange(callback: VolumeCallback): void {
    const index = this.volumeCallbacks.indexOf(callback);
    if (index > -1) {
      this.volumeCallbacks.splice(index, 1);
    }
  }

  /**
   * 获取当前录制状态
   */
  getRecordingStatus() {
    return {
      isRecording: this.isRecording,
      hasPermission: this.hasPermission,
      isContextSuspended: this.audioContext?.state === 'suspended',
      sampleRate: this.audioContext?.sampleRate || 0,
    };
  }

  /**
   * 更新音量
   */
  private updateVolume(): void {
    if (!this.analyser) return;

    this.analyser.getFloatTimeDomainData(this.volumeData);
    
    // 计算 RMS (Root Mean Square) 音量
    let sum = 0;
    for (let i = 0; i < this.volumeData.length; i++) {
      sum += this.volumeData[i] * this.volumeData[i];
    }
    
    const rms = Math.sqrt(sum / this.volumeData.length);
    const volume = Math.min(1, rms * 10); // 放大并限制在 0-1 范围

    this.debouncedVolumeUpdate(volume);
  }

  /**
   * Float32Array 转 ArrayBuffer
   */
  private float32ToArrayBuffer(float32Array: Float32Array): ArrayBuffer {
    // 转换为 16-bit PCM
    const length = float32Array.length;
    const arrayBuffer = new ArrayBuffer(length * 2);
    const dataView = new DataView(arrayBuffer);
    
    for (let i = 0; i < length; i++) {
      // 将 float32 [-1, 1] 转换为 int16 [-32768, 32767]
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      const intSample = sample < 0 ? sample * 32768 : sample * 32767;
      dataView.setInt16(i * 2, intSample, true); // little endian
    }
    
    return arrayBuffer;
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.stopRecording();
    
    // 清理音频节点
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    
    // 关闭音频上下文
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    // 停止媒体流
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    // 清理回调
    this.audioDataCallbacks.length = 0;
    this.volumeCallbacks.length = 0;
    
    this.hasPermission = false;
    console.log('🧹 AudioRecorder disposed');
  }
}