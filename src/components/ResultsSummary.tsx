/**
 * 测试结果汇总和导出组件
 * 显示完整的性能对比报告和导出功能
 */

import React from 'react';
import { ServiceType } from '@/types';
import { PerformanceTracker } from '@/services/PerformanceTracker';

interface ResultsSummaryProps {
  performanceTracker: PerformanceTracker;
  isVisible: boolean;
  onClose: () => void;
}

export function ResultsSummary({ performanceTracker, isVisible, onClose }: ResultsSummaryProps) {
  if (!isVisible) return null;

  const report = performanceTracker.generateReport();
  const comparison = report.metrics;
  const services = Object.keys(comparison) as ServiceType[];

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatLatency = (ms: number) => {
    return `${Math.round(ms)}ms`;
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const exportToJSON = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      summary: report.summary,
      recommendation: report.recommendation,
      metrics: comparison,
      rawData: {
        services: services,
        sessionDuration: services.length > 0 ? comparison[services[0]]?.session.duration : 0,
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-comparison-${new Date().toISOString().slice(0, 19)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    if (services.length === 0) return;

    const headers = [
      'Service',
      'Word Count',
      'Character Count',
      'Average Latency',
      'Max Latency',
      'Min Latency',
      'Connection Drops',
      'Error Rate',
      'Uptime',
      'Audio Quality',
      'Session Duration'
    ];

    const rows = services.map(service => {
      const metrics = comparison[service];
      if (!metrics) return [];

      return [
        service.toUpperCase(),
        metrics.accuracy.wordCount.toString(),
        metrics.accuracy.characterCount.toString(),
        metrics.latency.averageDelay.toFixed(1),
        metrics.latency.maxDelay.toFixed(1),
        metrics.latency.minDelay.toFixed(1),
        metrics.stability.connectionDrops.toString(),
        metrics.stability.errorRate.toFixed(3),
        metrics.stability.uptime.toFixed(3),
        metrics.session.audioQuality.toFixed(1),
        metrics.session.duration.toString()
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-comparison-${new Date().toISOString().slice(0, 19)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const MetricCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>
      {children}
    </div>
  );

  const ServiceComparisonTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              指标
            </th>
            {services.map(service => (
              <th key={service} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {service === 'assemblyai' ? 'AssemblyAI' : service === 'deepgram' ? 'Deepgram' : 'OpenAI'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">平均延迟</td>
            {services.map(service => {
              const metrics = comparison[service];
              return (
                <td key={service} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {metrics ? formatLatency(metrics.latency.averageDelay) : 'N/A'}
                </td>
              );
            })}
          </tr>
          
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">转录词汇数</td>
            {services.map(service => {
              const metrics = comparison[service];
              return (
                <td key={service} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {metrics?.accuracy.wordCount || 0}
                </td>
              );
            })}
          </tr>
          
          <tr className="bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">连接稳定性</td>
            {services.map(service => {
              const metrics = comparison[service];
              return (
                <td key={service} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {metrics ? formatPercentage(metrics.stability.uptime) : 'N/A'}
                </td>
              );
            })}
          </tr>
          
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">连接中断次数</td>
            {services.map(service => {
              const metrics = comparison[service];
              return (
                <td key={service} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {metrics?.stability.connectionDrops || 0}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">测试结果汇总</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 推荐结果 */}
          {report.recommendation.preferred !== 'tie' && (
            <div className={`p-4 rounded-lg border ${getScoreColor(report.recommendation.confidenceScore)}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">🏆 推荐结果</h3>
                <span className="text-sm font-medium px-2 py-1 rounded-full bg-white bg-opacity-50">
                  信心指数: {report.recommendation.confidenceScore}%
                </span>
              </div>
              <p className="text-sm mb-2">
                <strong>{report.recommendation.preferred.toUpperCase()}</strong> 表现更优
              </p>
              <p className="text-sm">{report.recommendation.reasoning}</p>
            </div>
          )}

          {/* 性能摘要 */}
          <MetricCard title="性能摘要">
            <p className="text-sm text-gray-900">{report.summary}</p>
            {services.length > 0 && (
              <div className="mt-3 text-xs text-gray-600">
                测试时长: {comparison[services[0]] ? formatDuration(comparison[services[0]]!.session.duration) : 'N/A'}
              </div>
            )}
          </MetricCard>

          {/* 详细对比表格 */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">详细性能对比</h3>
            </div>
            <ServiceComparisonTable />
          </div>

          {/* 各服务详细指标 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {services.map(service => {
              const metrics = comparison[service];
              if (!metrics) return null;

              return (
                <div key={service} className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                    {service === 'assemblyai' ? 'AssemblyAI' : service === 'deepgram' ? 'Deepgram' : 'OpenAI'} 详细指标
                  </h3>
                  
                  <div className="space-y-4">
                    <MetricCard title="准确性指标">
                      <div className="grid grid-cols-1 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">转录词汇:</span>
                          <br />
                          <span className="font-medium">{metrics.accuracy.wordCount} 词</span>
                        </div>
                      </div>
                    </MetricCard>

                    <MetricCard title="延迟指标">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">平均:</span>
                          <br />
                          <span className="font-medium">{formatLatency(metrics.latency.averageDelay)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">最高:</span>
                          <br />
                          <span className="font-medium">{formatLatency(metrics.latency.maxDelay)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">最低:</span>
                          <br />
                          <span className="font-medium">{formatLatency(metrics.latency.minDelay)}</span>
                        </div>
                      </div>
                    </MetricCard>

                    <MetricCard title="稳定性指标">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">连接稳定性:</span>
                          <br />
                          <span className="font-medium">{formatPercentage(metrics.stability.uptime)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">连接中断:</span>
                          <br />
                          <span className="font-medium">{metrics.stability.connectionDrops} 次</span>
                        </div>
                      </div>
                    </MetricCard>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 导出按钮 */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4 border-t border-gray-200">
            <button
              onClick={exportToJSON}
              className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              📋 导出为 JSON
            </button>
            
            <button
              onClick={exportToCSV}
              className="flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              📊 导出为 CSV
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center justify-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              🖨️ 打印报告
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}