/**
 * 语音转录对比测试应用主界面
 * 集成性能监控、转录显示、控制界面等所有Story 3组件
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { TranscriptionManager } from '@/services/TranscriptionManager';
import { PerformanceTracker } from '@/services/PerformanceTracker';
import { HistoryManager } from '@/services/HistoryManager';
import { ServiceType, ConnectionStatus, TranscriptionResult, AppState } from '@/types';
import { isConfigValid, getMissingConfig } from '@/config/env';

// Story 3 新组件导入
import { PerformanceDashboard } from './PerformanceDashboard';
import { TranscriptionDisplay } from './TranscriptionDisplay';
import { RecordingControls } from './RecordingControls';
import { ResultsSummary } from './ResultsSummary';

export const TranscriptionTest = () => {
  // 核心状态
  const [manager, setManager] = useState<TranscriptionManager | null>(null);
  const [performanceTracker] = useState(() => new PerformanceTracker());
  const [historyManager] = useState(() => new HistoryManager());
  const [appState, setAppState] = useState<AppState | null>(null);
  const [configValid, setConfigValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI 状态
  const [activeView, setActiveView] = useState<'dashboard' | 'transcription'>('dashboard');
  const [showResultsSummary, setShowResultsSummary] = useState(false);
  
  // 性能跟踪状态
  const [isTrackingPerformance, setIsTrackingPerformance] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  
  // 用于性能跟踪的回调引用
  const performanceCallbacksRef = useRef({
    onTranscript: (service: ServiceType, result: TranscriptionResult) => {
      performanceTracker.recordTranscription(service, result);
    },
    onConnectionEvent: (service: ServiceType, eventType: 'connected' | 'disconnected' | 'error') => {
      performanceTracker.recordConnectionEvent(service, eventType);
    },
    onVolumeChange: (service: ServiceType, volume: number) => {
      performanceTracker.updateAudioQuality(service, volume);
    }
  });

  // 检查API配置
  useEffect(() => {
    const valid = isConfigValid();
    setConfigValid(valid);
    
    if (!valid) {
      const missing = getMissingConfig();
      setError(`API配置缺失: ${missing.join(', ')}`);
    }
  }, []);

  // 初始化TranscriptionManager
  useEffect(() => {
    if (!configValid) return;

    const newManager = new TranscriptionManager({
      enableAssemblyAI: true,
      enableDeepgram: true,
      audioOptions: {
        sampleRate: 16000,
        channels: 1,
      },
    });

    // 状态更新监听
    newManager.onStateUpdate((partialState: Partial<AppState>) => {
      setAppState(prevState => prevState ? { ...prevState, ...partialState } : null);
    });

    // 转录结果监听（包含性能跟踪）
    newManager.onTranscript((service: ServiceType, result: TranscriptionResult) => {
      performanceCallbacksRef.current.onTranscript(service, result);
    });

    // 服务状态监听（包含性能跟踪）
    newManager.onServiceStatus((service: ServiceType, status: ConnectionStatus) => {
      if (status === 'connected') {
        performanceCallbacksRef.current.onConnectionEvent(service, 'connected');
      } else if (status === 'disconnected') {
        performanceCallbacksRef.current.onConnectionEvent(service, 'disconnected');
      } else if (status === 'error') {
        performanceCallbacksRef.current.onConnectionEvent(service, 'error');
      }
    });

    // 音量监听（包含性能跟踪）
    newManager.onVolumeChange((volume: number) => {
      // 为两个服务都更新音频质量
      if (appState?.connections?.assemblyai?.status === 'connected') {
        performanceCallbacksRef.current.onVolumeChange('assemblyai', volume);
      }
      if (appState?.connections?.deepgram?.status === 'connected') {
        performanceCallbacksRef.current.onVolumeChange('deepgram', volume);
      }
    });

    // 错误监听
    newManager.onError((service: ServiceType, error: Error) => {
      console.error(`${service} 错误:`, error);
      setError(`${service.toUpperCase()}: ${error.message}`);
      performanceCallbacksRef.current.onConnectionEvent(service, 'error');
    });

    // 设置初始状态
    setAppState(newManager.getCurrentState());
    setManager(newManager);

    return () => {
      newManager.dispose();
    };
  }, [configValid]);

  // 连接服务
  const handleConnectServices = useCallback(async () => {
    if (!manager) return;

    try {
      setError(null);
      await manager.connectServices();
    } catch (error) {
      console.error('连接服务失败:', error);
      setError(error instanceof Error ? error.message : '连接服务失败');
    }
  }, [manager]);

  // 断开服务
  const handleDisconnectServices = useCallback(async () => {
    if (!manager) return;

    try {
      setError(null);
      await manager.disconnectServices();
    } catch (error) {
      console.error('断开服务失败:', error);
      setError(error instanceof Error ? error.message : '断开服务失败');
    }
  }, [manager]);

  // 开始录制和性能跟踪
  const handleStartRecording = useCallback(async () => {
    if (!manager) return;

    try {
      setError(null);
      
      // 记录会话开始时间
      setSessionStartTime(Date.now());
      
      // 开始性能跟踪
      performanceTracker.startTracking();
      setIsTrackingPerformance(true);
      
      // 开始录制（假设服务已连接）
      await manager.startRecording();
      
    } catch (error) {
      console.error('开始录制失败:', error);
      setError(error instanceof Error ? error.message : '启动录制失败');
      
      // 停止性能跟踪
      performanceTracker.stopTracking();
      setIsTrackingPerformance(false);
    }
  }, [manager, performanceTracker]);

  // 停止录制和性能跟踪
  const handleStopRecording = useCallback(async () => {
    if (!manager) return;

    try {
      // 停止转录
      await manager.stopTranscription();
      
      // 停止性能跟踪
      performanceTracker.stopTracking();
      setIsTrackingPerformance(false);
      
      // 保存会话到历史记录
      if (sessionStartTime && appState?.transcriptions) {
        const sessionDuration = Date.now() - sessionStartTime;
        const sessionId = historyManager.saveSession(
          appState.transcriptions,
          performanceTracker,
          sessionDuration
        );
        console.log('✅ 会话已保存到历史记录:', sessionId);
      }
      
      setSessionStartTime(null);
      
    } catch (error) {
      console.error('停止录制失败:', error);
      setError(error instanceof Error ? error.message : '停止录制失败');
    }
  }, [manager, performanceTracker]);

  // 导出结果
  const handleExportResults = useCallback(() => {
    if (manager) {
      manager.exportRawTranscripts();
    }
  }, [manager]);

  // 清空记录
  const handleClearHistory = useCallback(() => {
    if (window.confirm('确定要清空所有转录记录和历史数据吗？')) {
      // 清空性能跟踪
      performanceTracker.reset();
      
      // 清空历史记录
      historyManager.clearHistory();
      
      // 重新设置当前状态以触发UI更新
      if (manager) {
        const currentState = manager.getCurrentState();
        setAppState({
          ...currentState,
          transcriptions: {
            assemblyai: [],
            deepgram: [],
          },
          rawTranscripts: [],
        });
      }
    }
  }, [manager, performanceTracker, historyManager]);

  // 配置无效时的显示
  if (!configValid) {
    return (
      <div className="max-w-2xl mx-auto mt-16 p-6">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">API配置无效</h2>
          <p className="text-gray-600 mb-6">
            请确保在 .env 文件中正确配置了以下API密钥：
          </p>
          <div className="bg-gray-100 p-4 rounded-md text-left font-mono text-sm mb-6">
            {getMissingConfig().map(key => (
              <div key={key}>VITE_{key}</div>
            ))}
          </div>
          <p className="text-sm text-gray-500">
            请参考 .env.example 文件获取配置模板
          </p>
        </div>
      </div>
    );
  }

  // 获取当前状态数据
  const isRecording = appState?.audio?.status === 'recording' || false;
  const audioStatus = appState?.audio?.status || 'idle';
  const volume = appState?.audio?.volume || 0;
  const connections = appState?.connections || {
    assemblyai: { status: 'disconnected' as ConnectionStatus, reconnectAttempts: 0 },
    deepgram: { status: 'disconnected' as ConnectionStatus, reconnectAttempts: 0 },
  };
  const transcriptions = appState?.transcriptions || {
    assemblyai: [],
    deepgram: [],
  };
  const hasTranscriptions = transcriptions.assemblyai.length > 0 || transcriptions.deepgram.length > 0;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* 头部导航 */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            AI 语音转录对比测试平台
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'dashboard'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📊 性能监控
            </button>
            <button
              onClick={() => setActiveView('transcription')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'transcription'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💬 转录对比
            </button>
          </div>
        </div>

        {/* 错误显示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            ❌ {error}
          </div>
        )}
      </div>

      {/* 主内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 控制面板 */}
        <div className="lg:col-span-1">
          <RecordingControls
            isRecording={isRecording}
            audioStatus={audioStatus}
            connections={connections}
            volume={volume}
            onConnectServices={handleConnectServices}
            onDisconnectServices={handleDisconnectServices}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onExportResults={handleExportResults}
            onClearHistory={handleClearHistory}
            hasTranscriptions={hasTranscriptions}
          />
        </div>

        {/* 主显示区域 */}
        <div className="lg:col-span-3">
          {activeView === 'dashboard' ? (
            <PerformanceDashboard
              performanceTracker={performanceTracker}
              isTracking={isTrackingPerformance}
            />
          ) : (
            <TranscriptionDisplay
              transcriptions={transcriptions}
              isRecording={isRecording}
              volume={volume}
            />
          )}
        </div>
      </div>

      {/* 结果摘要弹窗 */}
      <ResultsSummary
        performanceTracker={performanceTracker}
        isVisible={showResultsSummary}
        onClose={() => setShowResultsSummary(false)}
      />
    </div>
  );
};