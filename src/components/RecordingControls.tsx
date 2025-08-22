/**
 * 录制控制界面组件
 * 提供开始/停止录制和状态显示功能
 */

import { useState } from 'react';
import { ConnectionStatus, RecordingStatus } from '@/types';

interface RecordingControlsProps {
  isRecording: boolean;
  audioStatus: RecordingStatus;
  connections: {
    assemblyai: { status: ConnectionStatus; reconnectAttempts: number };
    deepgram: { status: ConnectionStatus; reconnectAttempts: number };
  };
  volume: number;
  onConnectServices: () => Promise<void>;
  onDisconnectServices: () => Promise<void>;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => Promise<void>;
  onExportResults: () => void;
  onClearHistory: () => void;
  hasTranscriptions: boolean;
}

export function RecordingControls({
  isRecording,
  audioStatus,
  connections,
  volume,
  onConnectServices,
  onDisconnectServices,
  onStartRecording,
  onStopRecording,
  onExportResults,
  onClearHistory,
  hasTranscriptions
}: RecordingControlsProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      await onStartRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await onStopRecording();
    } catch (error) {
      console.error('Failed to stop recording:', error);
    } finally {
      setIsStopping(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await onConnectServices();
    } catch (error) {
      console.error('Failed to connect services:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await onDisconnectServices();
    } catch (error) {
      console.error('Failed to disconnect services:', error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const getConnectionStatusColor = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50 border-green-200';
      case 'connecting': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'disconnected': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-400 bg-gray-50 border-gray-200';
    }
  };

  const getConnectionStatusIcon = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'disconnected': return '⚫';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  const getAudioStatusText = (status: RecordingStatus) => {
    switch (status) {
      case 'recording': return '录制中';
      case 'starting': return '启动中...';
      case 'stopping': return '停止中...';
      case 'idle': return '待机';
      default: return '未知';
    }
  };

  const getAudioStatusColor = (status: RecordingStatus) => {
    switch (status) {
      case 'recording': return 'text-red-600';
      case 'starting':
      case 'stopping': return 'text-yellow-600';
      case 'idle': return 'text-gray-600';
      default: return 'text-gray-400';
    }
  };

  // 检查服务连接状态
  const servicesConnected = connections.assemblyai.status === 'connected' && connections.deepgram.status === 'connected';
  const anyServiceDisconnected = connections.assemblyai.status === 'disconnected' || connections.deepgram.status === 'disconnected';

  const canConnectServices = anyServiceDisconnected && !isConnecting && !isDisconnecting && !isRecording;
  const canDisconnectServices = servicesConnected && !isConnecting && !isDisconnecting && !isRecording;
  const canStartRecording = servicesConnected && audioStatus === 'idle' && !isStarting && !isStopping && !isConnecting;
  const canStopRecording = (audioStatus === 'recording' || isRecording) && !isStarting && !isStopping;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">录制控制</h2>
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-medium ${getAudioStatusColor(audioStatus)}`}>
            {getAudioStatusText(audioStatus)}
          </span>
          {isRecording && (
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          )}
        </div>
      </div>

      {/* 服务连接控制按钮 */}
      <div className="flex items-center justify-center space-x-3 mb-6">
        <button
          onClick={handleConnect}
          disabled={!canConnectServices}
          className={`
            flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
            ${canConnectServices 
              ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isConnecting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              连接中...
            </>
          ) : (
            <>
              🔗 启动服务
            </>
          )}
        </button>

        <button
          onClick={handleDisconnect}
          disabled={!canDisconnectServices}
          className={`
            flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
            ${canDisconnectServices 
              ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-md' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isDisconnecting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              断开中...
            </>
          ) : (
            <>
              🔌 断开服务
            </>
          )}
        </button>
      </div>

      {/* 主控制按钮区域 */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <button
          onClick={handleStart}
          disabled={!canStartRecording}
          className={`
            flex items-center justify-center w-16 h-16 rounded-full text-white font-semibold text-lg transition-all duration-200
            ${canStartRecording 
              ? 'bg-green-500 hover:bg-green-600 hover:scale-105 shadow-lg' 
              : 'bg-gray-300 cursor-not-allowed'
            }
          `}
        >
          {isStarting ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 4a3 3 0 016 0v6a3 3 0 01-6 0V4zM5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5H10.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z"/>
            </svg>
          )}
        </button>

        <button
          onClick={handleStop}
          disabled={!canStopRecording}
          className={`
            flex items-center justify-center w-16 h-16 rounded-full text-white font-semibold text-lg transition-all duration-200
            ${canStopRecording 
              ? 'bg-red-500 hover:bg-red-600 hover:scale-105 shadow-lg' 
              : 'bg-gray-300 cursor-not-allowed'
            }
          `}
        >
          {isStopping ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      {/* 音量指示器 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">音量水平</span>
          <span className="text-sm text-gray-600">{Math.round(volume * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-150"
            style={{ width: `${Math.min(volume * 100, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>静音</span>
          <span>适中</span>
          <span>过载</span>
        </div>
      </div>

      {/* AI服务状态 */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">AI服务状态</h3>
        <div className="space-y-3">
          {/* 整体连接状态指示 */}
          <div className={`p-3 rounded-lg border-2 ${
            servicesConnected 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : anyServiceDisconnected 
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">
                  {servicesConnected ? '✅' : anyServiceDisconnected ? '❌' : '⏳'}
                </span>
                <span className="font-medium">
                  {servicesConnected ? '服务已就绪' : anyServiceDisconnected ? '服务未连接' : '连接中...'}
                </span>
              </div>
              <div className="text-sm opacity-75">
                {servicesConnected ? '可以开始录制' : '请先启动服务'}
              </div>
            </div>
          </div>

          {/* 各服务详细状态 */}
          <div className="grid grid-cols-2 gap-3">
            {(['assemblyai', 'deepgram'] as const).map(service => {
              const connection = connections[service];
              const serviceName = service === 'assemblyai' ? 'AssemblyAI' : 'Deepgram';
              
              return (
                <div key={service} className="relative">
                  {/* 服务状态卡片 */}
                  <div className={`p-3 rounded-lg border transition-all duration-200 ${getConnectionStatusColor(connection.status)}`}>
                    {/* 状态指示点 */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          connection.status === 'connected' ? 'bg-green-500' :
                          connection.status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                          connection.status === 'error' ? 'bg-red-500' :
                          'bg-gray-400'
                        }`}></div>
                        <span className="font-semibold text-xs truncate">{serviceName}</span>
                      </div>
                      <span className="text-xl flex-shrink-0">
                        {getConnectionStatusIcon(connection.status)}
                      </span>
                    </div>
                    
                    {/* 状态文字 */}
                    <div className="text-xs font-medium capitalize mb-1">
                      {connection.status === 'connected' ? '已连接' :
                       connection.status === 'connecting' ? '连接中' :
                       connection.status === 'error' ? '连接错误' :
                       connection.status === 'disconnected' ? '已断开' : connection.status}
                    </div>
                    
                    {/* 重连次数 */}
                    {connection.reconnectAttempts > 0 && (
                      <div className="text-xs opacity-75">
                        重试: {connection.reconnectAttempts}次
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 操作按钮区域 */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
        <button
          onClick={onExportResults}
          disabled={!hasTranscriptions}
          className={`
            flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200
            ${hasTranscriptions
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          📊 导出结果
        </button>

        <button
          onClick={onClearHistory}
          disabled={!hasTranscriptions}
          className={`
            flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200
            ${hasTranscriptions
              ? 'bg-gray-500 text-white hover:bg-gray-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          🗑️ 清空记录
        </button>
      </div>

      {/* 使用说明 */}
      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">使用说明：</p>
          <ul className="text-xs space-y-1">
            <li>• 确保麦克风权限已开启</li>
            <li>• 保持网络连接稳定</li>
            <li>• 在安静环境下获得最佳效果</li>
            <li>• 清晰发音，避免过快语速</li>
          </ul>
        </div>
      </div>
    </div>
  );
}