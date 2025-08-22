/**
 * 性能指标收集和分析系统
 * 负责收集、计算和分析转录服务的性能数据
 */

import { ServiceType, TranscriptionResult, PerformanceMetrics } from '@/types';
import { average, max, min } from '@/utils';

interface PerformanceData {
  service: ServiceType;
  sessionStartTime: Date;
  transcriptionResults: TranscriptionResult[];
  latencySamples: number[];
  connectionEvents: {
    connected: Date[];
    disconnected: Date[];
    errors: Date[];
  };
  audioQualityScore: number;
}

export class PerformanceTracker {
  private performanceData: Map<ServiceType, PerformanceData> = new Map();
  private sessionStartTime: Date | null = null;
  private isTracking = false;

  constructor() {
    this.reset();
  }

  /**
   * 开始性能跟踪
   */
  startTracking(): void {
    this.sessionStartTime = new Date();
    this.isTracking = true;
    
    // 重置所有数据
    this.performanceData.clear();
    
    console.log('📊 Performance tracking started');
  }

  /**
   * 停止性能跟踪
   */
  stopTracking(): void {
    this.isTracking = false;
    console.log('📊 Performance tracking stopped');
  }

  /**
   * 记录转录结果
   */
  recordTranscription(service: ServiceType, result: TranscriptionResult): void {
    if (!this.isTracking) return;

    const data = this.getOrCreateServiceData(service);
    data.transcriptionResults.push(result);

    // 计算延迟（音频到转录的时间差）
    const now = Date.now();
    const latency = now - result.timestamp;
    if (latency > 0 && latency < 10000) { // 忽略不合理的延迟值
      data.latencySamples.push(latency);
      
      // 保持最近100个样本
      if (data.latencySamples.length > 100) {
        data.latencySamples.shift();
      }
    }
  }

  /**
   * 记录连接事件
   */
  recordConnectionEvent(service: ServiceType, eventType: 'connected' | 'disconnected' | 'error'): void {
    if (!this.isTracking) return;

    const data = this.getOrCreateServiceData(service);
    const now = new Date();
    
    if (eventType === 'error') {
      data.connectionEvents.errors.push(now);
      // 保持最近20个事件
      if (data.connectionEvents.errors.length > 20) {
        data.connectionEvents.errors.shift();
      }
    } else {
      data.connectionEvents[eventType].push(now);
      // 保持最近20个事件
      if (data.connectionEvents[eventType].length > 20) {
        data.connectionEvents[eventType].shift();
      }
    }
  }

  /**
   * 更新音频质量评分
   */
  updateAudioQuality(service: ServiceType, volume: number): void {
    if (!this.isTracking) return;

    const data = this.getOrCreateServiceData(service);
    
    // 基于音量计算音频质量评分（0-100）
    const qualityScore = this.calculateAudioQualityScore(volume);
    data.audioQualityScore = (data.audioQualityScore * 0.9) + (qualityScore * 0.1);
  }

  /**
   * 获取服务的性能指标
   */
  getPerformanceMetrics(service: ServiceType): PerformanceMetrics | null {
    const data = this.performanceData.get(service);
    if (!data || !this.sessionStartTime) {
      return null;
    }

    const now = new Date();
    const sessionDuration = now.getTime() - this.sessionStartTime.getTime();
    
    // 计算准确率指标
    const confidenceScores = data.transcriptionResults
      .filter(r => r.isFinal)
      .map(r => r.confidence);
    
    const accuracy = {
      confidence: confidenceScores,
      wordCount: this.calculateWordCount(data.transcriptionResults),
      characterCount: this.calculateCharacterCount(data.transcriptionResults),
    };

    // 计算延迟指标
    const latency = {
      averageDelay: data.latencySamples.length > 0 ? average(data.latencySamples) : 0,
      maxDelay: data.latencySamples.length > 0 ? max(data.latencySamples) : 0,
      minDelay: data.latencySamples.length > 0 ? min(data.latencySamples) : 0,
      samples: [...data.latencySamples],
    };

    // 计算稳定性指标
    const stability = {
      connectionDrops: data.connectionEvents.disconnected.length + data.connectionEvents.errors.length,
      reconnectTime: this.calculateReconnectTimes(data.connectionEvents),
      errorRate: this.calculateErrorRate(data.connectionEvents),
      uptime: this.calculateUptime(data.connectionEvents, sessionDuration),
    };

    const session = {
      startTime: this.sessionStartTime,
      duration: sessionDuration,
      audioQuality: data.audioQualityScore,
    };

    return {
      service,
      session,
      accuracy,
      latency,
      stability,
    };
  }

  /**
   * 获取所有服务的性能对比
   */
  getPerformanceComparison(): { [key in ServiceType]?: PerformanceMetrics } {
    const comparison: { [key in ServiceType]?: PerformanceMetrics } = {};
    
    for (const service of this.performanceData.keys()) {
      const metrics = this.getPerformanceMetrics(service);
      if (metrics) {
        comparison[service] = metrics;
      }
    }
    
    return comparison;
  }

  /**
   * 获取实时统计信息
   */
  getRealTimeStats(service: ServiceType) {
    const data = this.performanceData.get(service);
    if (!data) return null;

    const recentResults = data.transcriptionResults.slice(-10);
    const recentLatencies = data.latencySamples.slice(-10);
    
    return {
      totalTranscriptions: data.transcriptionResults.length,
      recentConfidenceAvg: recentResults.length > 0 
        ? average(recentResults.map(r => r.confidence)) 
        : 0,
      currentLatencyAvg: recentLatencies.length > 0 
        ? average(recentLatencies) 
        : 0,
      connectionStatus: this.getConnectionStatus(data.connectionEvents),
      audioQuality: Math.round(data.audioQualityScore),
    };
  }

  /**
   * 生成性能报告
   */
  generateReport(): {
    summary: string;
    metrics: { [key in ServiceType]?: PerformanceMetrics };
    recommendation: {
      preferred: ServiceType | 'tie';
      reasoning: string;
      confidenceScore: number;
    };
  } {
    const metrics = this.getPerformanceComparison();
    const services = Object.keys(metrics) as ServiceType[];
    
    if (services.length === 0) {
      return {
        summary: '暂无性能数据',
        metrics: {},
        recommendation: {
          preferred: 'tie',
          reasoning: '需要更多数据才能进行对比',
          confidenceScore: 0,
        },
      };
    }

    // 生成推荐
    const recommendation = this.generateRecommendation(metrics);
    
    // 生成摘要
    const summary = this.generateSummary(metrics);

    return {
      summary,
      metrics,
      recommendation,
    };
  }

  /**
   * 重置所有数据
   */
  reset(): void {
    this.performanceData.clear();
    this.sessionStartTime = null;
    this.isTracking = false;
  }

  // 私有辅助方法

  private getOrCreateServiceData(service: ServiceType): PerformanceData {
    if (!this.performanceData.has(service)) {
      this.performanceData.set(service, {
        service,
        sessionStartTime: this.sessionStartTime || new Date(),
        transcriptionResults: [],
        latencySamples: [],
        connectionEvents: {
          connected: [],
          disconnected: [],
          errors: [],
        },
        audioQualityScore: 75, // 默认评分
      });
    }
    
    return this.performanceData.get(service)!;
  }

  private calculateAudioQualityScore(volume: number): number {
    // 基于音量计算音频质量评分
    if (volume < 0.1) return 30; // 音量太低
    if (volume > 0.9) return 60; // 音量太高可能削波
    if (volume >= 0.3 && volume <= 0.7) return 100; // 理想音量
    return 80; // 可接受的音量
  }

  private calculateWordCount(results: TranscriptionResult[]): number {
    return results
      .filter(r => r.isFinal && r.text.trim())
      .reduce((total, r) => total + r.text.trim().split(/\s+/).length, 0);
  }

  private calculateCharacterCount(results: TranscriptionResult[]): number {
    return results
      .filter(r => r.isFinal && r.text.trim())
      .reduce((total, r) => total + r.text.length, 0);
  }

  private calculateReconnectTimes(events: PerformanceData['connectionEvents']): number[] {
    const reconnectTimes: number[] = [];
    
    for (let i = 0; i < events.disconnected.length; i++) {
      const disconnectTime = events.disconnected[i];
      const nextConnectTime = events.connected.find(c => c > disconnectTime);
      
      if (nextConnectTime) {
        reconnectTimes.push(nextConnectTime.getTime() - disconnectTime.getTime());
      }
    }
    
    return reconnectTimes;
  }

  private calculateErrorRate(events: PerformanceData['connectionEvents']): number {
    const totalEvents = events.connected.length + events.disconnected.length + events.errors.length;
    return totalEvents > 0 ? events.errors.length / totalEvents : 0;
  }

  private calculateUptime(events: PerformanceData['connectionEvents'], sessionDuration: number): number {
    if (sessionDuration <= 0) return 0;
    
    let uptimeMs = 0;
    let currentConnectionStart: Date | null = null;
    
    // 按时间排序所有事件
    const allEvents = [
      ...events.connected.map(d => ({ type: 'connected', time: d })),
      ...events.disconnected.map(d => ({ type: 'disconnected', time: d })),
      ...events.errors.map(d => ({ type: 'error', time: d })),
    ].sort((a, b) => a.time.getTime() - b.time.getTime());
    
    for (const event of allEvents) {
      if (event.type === 'connected') {
        currentConnectionStart = event.time;
      } else if (event.type === 'disconnected' || event.type === 'error') {
        if (currentConnectionStart) {
          uptimeMs += event.time.getTime() - currentConnectionStart.getTime();
          currentConnectionStart = null;
        }
      }
    }
    
    // 如果会话结束时仍然连接，添加剩余时间
    if (currentConnectionStart) {
      uptimeMs += Date.now() - currentConnectionStart.getTime();
    }
    
    return Math.min(uptimeMs / sessionDuration, 1);
  }

  private getConnectionStatus(events: PerformanceData['connectionEvents']): 'connected' | 'disconnected' | 'error' {
    const recentEvents = [
      ...events.connected.map(d => ({ type: 'connected', time: d })),
      ...events.disconnected.map(d => ({ type: 'disconnected', time: d })),
      ...events.errors.map(d => ({ type: 'error', time: d })),
    ].sort((a, b) => b.time.getTime() - a.time.getTime());
    
    return recentEvents.length > 0 ? recentEvents[0].type as any : 'disconnected';
  }

  private generateRecommendation(metrics: { [key in ServiceType]?: PerformanceMetrics }) {
    const services = Object.keys(metrics) as ServiceType[];
    
    if (services.length < 2) {
      return {
        preferred: services[0] || 'tie' as ServiceType | 'tie',
        reasoning: '仅有一个服务的数据，无法进行对比',
        confidenceScore: 0,
      };
    }

    let bestService: ServiceType = services[0];
    let bestScore = 0;
    const scores: { [key in ServiceType]?: number } = {};

    // 计算综合评分
    for (const service of services) {
      const metric = metrics[service];
      if (!metric) continue;

      let score = 0;
      
      // 准确率评分 (40%)
      const avgConfidence = metric.accuracy.confidence.length > 0 
        ? average(metric.accuracy.confidence) 
        : 0;
      score += avgConfidence * 0.4;

      // 延迟评分 (30%)
      const latencyScore = Math.max(0, 1 - (metric.latency.averageDelay / 3000)); // 3秒为基准
      score += latencyScore * 0.3;

      // 稳定性评分 (30%)
      const stabilityScore = metric.stability.uptime * (1 - metric.stability.errorRate);
      score += stabilityScore * 0.3;

      scores[service] = score;
      
      if (score > bestScore) {
        bestScore = score;
        bestService = service;
      }
    }

    // 生成推荐理由
    let reasoning = '';
    const bestMetric = metrics[bestService];
    const worstService = services.find(s => s !== bestService);
    const worstMetric = worstService ? metrics[worstService] : null;

    if (bestMetric && worstMetric) {
      const confDiff = average(bestMetric.accuracy.confidence) - average(worstMetric.accuracy.confidence);
      const latencyDiff = worstMetric.latency.averageDelay - bestMetric.latency.averageDelay;
      const stabilityDiff = bestMetric.stability.uptime - worstMetric.stability.uptime;

      const reasons: string[] = [];
      if (confDiff > 0.1) reasons.push(`准确率更高(+${Math.round(confDiff * 100)}%)`);
      if (latencyDiff > 200) reasons.push(`延迟更低(-${Math.round(latencyDiff)}ms)`);
      if (stabilityDiff > 0.1) reasons.push(`稳定性更好(+${Math.round(stabilityDiff * 100)}%)`);

      reasoning = reasons.length > 0 
        ? `${bestService.toUpperCase()} 在以下方面表现更好: ${reasons.join(', ')}`
        : `${bestService.toUpperCase()} 综合表现略胜一筹`;
    }

    return {
      preferred: bestService,
      reasoning: reasoning || '基于综合性能评估',
      confidenceScore: Math.round(bestScore * 100),
    };
  }

  private generateSummary(metrics: { [key in ServiceType]?: PerformanceMetrics }): string {
    const services = Object.keys(metrics) as ServiceType[];
    if (services.length === 0) return '暂无测试数据';

    const summaryParts: string[] = [];
    
    for (const service of services) {
      const metric = metrics[service];
      if (!metric) continue;

      const avgConfidence = metric.accuracy.confidence.length > 0 
        ? Math.round(average(metric.accuracy.confidence) * 100)
        : 0;
      const avgLatency = Math.round(metric.latency.averageDelay);
      const uptime = Math.round(metric.stability.uptime * 100);

      summaryParts.push(
        `${service.toUpperCase()}: 准确率 ${avgConfidence}%, 延迟 ${avgLatency}ms, 稳定性 ${uptime}%`
      );
    }

    return summaryParts.join(' | ');
  }
}