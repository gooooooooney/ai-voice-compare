/**
 * 实时性能仪表板组件
 * 显示双服务的实时性能对比数据
 */

import { useEffect, useState } from 'react';
import { ServiceType, PerformanceMetrics } from '@/types';
import { PerformanceTracker } from '@/services/PerformanceTracker';

interface PerformanceDashboardProps {
  performanceTracker: PerformanceTracker;
  isTracking: boolean;
}

interface RealTimeStats {
  assemblyai?: ReturnType<PerformanceTracker['getRealTimeStats']>;
  deepgram?: ReturnType<PerformanceTracker['getRealTimeStats']>;
}

export function PerformanceDashboard({ performanceTracker, isTracking }: PerformanceDashboardProps) {
  const [stats, setStats] = useState<RealTimeStats>({});
  const [comparison, setComparison] = useState<{ [key in ServiceType]?: PerformanceMetrics }>({});

  // 实时更新统计数据
  useEffect(() => {
    if (!isTracking) return;

    const updateInterval = setInterval(() => {
      const newStats: RealTimeStats = {};
      
      const assemblyaiStats = performanceTracker.getRealTimeStats('assemblyai');
      if (assemblyaiStats) {
        newStats.assemblyai = assemblyaiStats;
      }

      const deepgramStats = performanceTracker.getRealTimeStats('deepgram');
      if (deepgramStats) {
        newStats.deepgram = deepgramStats;
      }

      setStats(newStats);
      setComparison(performanceTracker.getPerformanceComparison());
    }, 500); // 每500ms更新一次

    return () => clearInterval(updateInterval);
  }, [performanceTracker, isTracking]);

  const getConnectionStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50';
      case 'connecting': return 'text-yellow-600 bg-yellow-50';
      case 'disconnected': return 'text-gray-600 bg-gray-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-400 bg-gray-50';
    }
  };

  const getConnectionStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'disconnected': return '⚫';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  const formatLatency = (latency: number | undefined) => {
    if (latency === undefined || latency === 0) return '- ms';
    return `${Math.round(latency)}ms`;
  };

  const formatConfidence = (confidence: number | undefined) => {
    if (confidence === undefined || confidence === 0) return '-%';
    return `${Math.round(confidence * 100)}%`;
  };

  const formatAudioQuality = (quality: number | undefined) => {
    if (quality === undefined) return '-';
    if (quality >= 90) return '优秀';
    if (quality >= 70) return '良好';
    if (quality >= 50) return '一般';
    return '较差';
  };

  const ServiceStatsCard = ({ 
    service, 
    stats: serviceStats,
    metrics
  }: { 
    service: ServiceType;
    stats: ReturnType<PerformanceTracker['getRealTimeStats']>;
    metrics?: PerformanceMetrics;
  }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 capitalize">
          {service === 'assemblyai' ? 'AssemblyAI' : 'Deepgram'}
        </h3>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConnectionStatusColor(serviceStats?.connectionStatus)}`}>
          {getConnectionStatusIcon(serviceStats?.connectionStatus)} {serviceStats?.connectionStatus || 'unknown'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 实时指标 */}
        <div className="space-y-2">
          <div className="text-sm text-gray-600">实时延迟</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatLatency(serviceStats?.currentLatencyAvg)}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-gray-600">平均置信度</div>
          <div className="text-2xl font-bold text-green-600">
            {formatConfidence(serviceStats?.recentConfidenceAvg)}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-gray-600">总转录数</div>
          <div className="text-xl font-semibold text-gray-700">
            {serviceStats?.totalTranscriptions || 0}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-gray-600">音频质量</div>
          <div className="text-xl font-semibold text-purple-600">
            {formatAudioQuality(serviceStats?.audioQuality)}
          </div>
        </div>
      </div>

      {/* 会话级别指标 */}
      {metrics && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-500">会话稳定性</div>
              <div className="text-sm font-medium">
                {Math.round(metrics.stability.uptime * 100)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">连接中断</div>
              <div className="text-sm font-medium text-orange-600">
                {metrics.stability.connectionDrops}次
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">错误率</div>
              <div className="text-sm font-medium text-red-600">
                {Math.round(metrics.stability.errorRate * 100)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (!isTracking) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">性能监控未启动</h3>
        <p className="text-gray-600">开始录制以查看实时性能数据</p>
      </div>
    );
  }

  const services = ['assemblyai', 'deepgram'] as const;
  const availableServices = services.filter(service => stats[service] !== null && stats[service] !== undefined);

  if (availableServices.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="text-4xl mb-4">⏳</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">等待数据</h3>
        <p className="text-gray-600">正在收集性能数据...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 服务对比卡片 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {availableServices.map(service => (
          <ServiceStatsCard
            key={service}
            service={service}
            stats={stats[service]!}
            metrics={comparison[service]}
          />
        ))}
      </div>

      {/* 性能对比总览 */}
      {availableServices.length >= 2 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">实时性能对比</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 延迟对比 */}
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">延迟对比</div>
              <div className="space-y-1">
                {availableServices.map(service => {
                  const latency = stats[service]?.currentLatencyAvg || 0;
                  const isWinner = latency > 0 && latency <= Math.min(...availableServices.map(s => stats[s]?.currentLatencyAvg || Infinity));
                  return (
                    <div key={service} className={`flex items-center justify-between p-2 rounded ${isWinner ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                      <span className="text-sm capitalize">{service === 'assemblyai' ? 'AssemblyAI' : 'Deepgram'}</span>
                      <span className={`font-medium ${isWinner ? 'text-green-600' : 'text-gray-600'}`}>
                        {formatLatency(latency)}
                        {isWinner && ' 🏆'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 置信度对比 */}
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">置信度对比</div>
              <div className="space-y-1">
                {availableServices.map(service => {
                  const confidence = stats[service]?.recentConfidenceAvg || 0;
                  const isWinner = confidence >= Math.max(...availableServices.map(s => stats[s]?.recentConfidenceAvg || 0));
                  return (
                    <div key={service} className={`flex items-center justify-between p-2 rounded ${isWinner ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                      <span className="text-sm capitalize">{service === 'assemblyai' ? 'AssemblyAI' : 'Deepgram'}</span>
                      <span className={`font-medium ${isWinner ? 'text-green-600' : 'text-gray-600'}`}>
                        {formatConfidence(confidence)}
                        {isWinner && ' 🏆'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 稳定性对比 */}
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">稳定性对比</div>
              <div className="space-y-1">
                {availableServices.map(service => {
                  const uptime = comparison[service]?.stability.uptime || 0;
                  const isWinner = uptime >= Math.max(...availableServices.map(s => comparison[s]?.stability.uptime || 0));
                  return (
                    <div key={service} className={`flex items-center justify-between p-2 rounded ${isWinner ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                      <span className="text-sm capitalize">{service === 'assemblyai' ? 'AssemblyAI' : 'Deepgram'}</span>
                      <span className={`font-medium ${isWinner ? 'text-green-600' : 'text-gray-600'}`}>
                        {Math.round(uptime * 100)}%
                        {isWinner && ' 🏆'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}