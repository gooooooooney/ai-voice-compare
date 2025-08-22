/**
 * 双服务转录结果显示组件
 * 实时显示AssemblyAI和Deepgram的转录结果对比
 */

import { useEffect, useRef } from 'react';
import { ServiceType, TranscriptionResult } from '@/types';

interface TranscriptionDisplayProps {
  transcriptions: {
    assemblyai: TranscriptionResult[];
    deepgram: TranscriptionResult[];
  };
  isRecording: boolean;
  volume?: number;
}

interface ServicePanelProps {
  service: ServiceType;
  results: TranscriptionResult[];
  isRecording: boolean;
  volume?: number;
}

function ServicePanel({ service, results, isRecording, volume = 0 }: ServicePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // 自动滚动到最新内容
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [results]);

  const getServiceDisplayName = (service: ServiceType) => {
    return service === 'assemblyai' ? 'AssemblyAI' : 'Deepgram';
  };

  const getServiceColor = (service: ServiceType) => {
    return service === 'assemblyai' ? 'blue' : 'purple';
  };


  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + `.${Math.floor((timestamp % 1000) / 100)}`;
  };

  // 获取最新的完整句子
  const getLatestFinalText = () => {
    const finalResults = results.filter(r => r.isFinal && r.text.trim());
    if (finalResults.length === 0) return '';
    return finalResults[finalResults.length - 1].text;
  };

  // 获取当前的临时文本
  const getCurrentPartialText = () => {
    const partialResults = results.filter(r => !r.isFinal && r.text.trim());
    if (partialResults.length === 0) return '';
    return partialResults[partialResults.length - 1].text;
  };

  const color = getServiceColor(service);
  const latestFinalText = getLatestFinalText();
  const currentPartialText = getCurrentPartialText();
  const totalWords = results.filter(r => r.isFinal).reduce((total, r) => total + r.text.split(' ').length, 0);

  return (
    <div className={`bg-white rounded-lg shadow-md border-t-4 border-${color}-500 h-full flex flex-col`}>
      {/* 头部信息 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            {getServiceDisplayName(service)}
          </h3>
          <div className="flex items-center space-x-2">
            {isRecording && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-red-600 font-medium">录制中</span>
              </div>
            )}
          </div>
        </div>
        
        {/* 统计信息 */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-500">词汇数</div>
            <div className="text-sm font-semibold text-gray-700">{totalWords}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">音量</div>
            <div className="text-sm font-semibold text-gray-700">
              {Math.round(volume * 100)}%
            </div>
          </div>
        </div>

        {/* 音量指示器 */}
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`bg-${color}-500 h-2 rounded-full transition-all duration-150`}
              style={{ width: `${Math.min(volume * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 转录结果显示区域 */}
      <div className="flex-1 p-4 overflow-hidden">
        {/* 当前转录内容 */}
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-1">当前转录</div>
          <div className="min-h-[60px] p-3 bg-gray-50 rounded-md border-2 border-dashed border-gray-200">
            {latestFinalText && (
              <div className="text-gray-900 mb-2">
                {latestFinalText}
              </div>
            )}
            {currentPartialText && (
              <div className="text-gray-500 italic">
                {currentPartialText}
                <span className="animate-pulse ml-1">|</span>
              </div>
            )}
            {!latestFinalText && !currentPartialText && (
              <div className="text-gray-400 text-center">
                {isRecording ? '等待语音输入...' : '点击开始录制'}
              </div>
            )}
          </div>
        </div>

        {/* 历史记录滚动区域 */}
        <div className="flex-1">
          <div className="text-sm text-gray-600 mb-2">转录历史</div>
          <div 
            ref={scrollRef}
            className="h-64 overflow-y-auto p-3 bg-gray-50 rounded-md space-y-2"
          >
            {results.filter(r => r.isFinal && r.text.trim()).length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                暂无历史记录
              </div>
            ) : (
              results
                .filter(r => r.isFinal && r.text.trim())
                .slice(-20) // 只显示最近20条记录
                .map((result, index) => (
                  <div 
                    key={`${result.timestamp}-${index}`}
                    className="p-2 bg-white rounded border border-gray-200 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(result.timestamp)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-900">
                      {result.text}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TranscriptionDisplay({ transcriptions, isRecording, volume = 0 }: TranscriptionDisplayProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      <ServicePanel
        service="assemblyai"
        results={transcriptions.assemblyai}
        isRecording={isRecording}
        volume={volume}
      />
      
      <ServicePanel
        service="deepgram"
        results={transcriptions.deepgram}
        isRecording={isRecording}
        volume={volume}
      />
    </div>
  );
}