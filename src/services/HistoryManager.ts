/**
 * 测试历史记录管理器
 * 使用localStorage保存和管理转录测试历史
 */

import { ServiceType, TranscriptionResult } from '@/types';
import { PerformanceTracker } from './PerformanceTracker';

interface TestSession {
  id: string;
  timestamp: number;
  duration: number;
  transcriptions: {
    [key in ServiceType]?: TranscriptionResult[];
  };
  performanceReport: ReturnType<PerformanceTracker['generateReport']>;
  summary: {
    totalWords: number;
    totalCharacters: number;
    averageConfidence: number;
  };
}

interface HistoryStats {
  totalSessions: number;
  totalDuration: number;
  favoriteService: ServiceType | null;
  averageSessionLength: number;
}

export class HistoryManager {
  private readonly STORAGE_KEY = 'ai-voice-compare-history';
  private readonly MAX_SESSIONS = 50; // 最多保存50个会话

  /**
   * 保存测试会话
   */
  saveSession(
    transcriptions: { [key in ServiceType]?: TranscriptionResult[] },
    performanceTracker: PerformanceTracker,
    duration: number
  ): string {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const performanceReport = performanceTracker.generateReport();
    
    // 计算会话摘要
    const allTranscriptions = Object.values(transcriptions).flat();
    const finalTranscriptions = allTranscriptions.filter(t => t.isFinal);
    
    const summary = {
      totalWords: finalTranscriptions.reduce((total, t) => total + t.text.split(/\s+/).length, 0),
      totalCharacters: finalTranscriptions.reduce((total, t) => total + t.text.length, 0),
      averageConfidence: finalTranscriptions.length > 0
        ? finalTranscriptions.reduce((sum, t) => sum + t.confidence, 0) / finalTranscriptions.length
        : 0
    };

    const session: TestSession = {
      id: sessionId,
      timestamp: Date.now(),
      duration,
      transcriptions,
      performanceReport,
      summary
    };

    // 获取现有历史记录
    const history = this.getHistory();
    
    // 添加新会话
    history.unshift(session);
    
    // 保持最大会话数量限制
    if (history.length > this.MAX_SESSIONS) {
      history.splice(this.MAX_SESSIONS);
    }
    
    // 保存到localStorage
    this.saveToStorage(history);
    
    return sessionId;
  }

  /**
   * 获取所有历史记录
   */
  getHistory(): TestSession[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const history = JSON.parse(stored);
      return Array.isArray(history) ? history : [];
    } catch (error) {
      console.error('Failed to load history:', error);
      return [];
    }
  }

  /**
   * 获取指定会话
   */
  getSession(sessionId: string): TestSession | null {
    const history = this.getHistory();
    return history.find(session => session.id === sessionId) || null;
  }

  /**
   * 删除指定会话
   */
  deleteSession(sessionId: string): boolean {
    const history = this.getHistory();
    const index = history.findIndex(session => session.id === sessionId);
    
    if (index === -1) return false;
    
    history.splice(index, 1);
    this.saveToStorage(history);
    return true;
  }

  /**
   * 清空所有历史记录
   */
  clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * 获取历史统计信息
   */
  getHistoryStats(): HistoryStats {
    const history = this.getHistory();
    
    if (history.length === 0) {
      return {
        totalSessions: 0,
        totalDuration: 0,
        favoriteService: null,
        averageSessionLength: 0
      };
    }

    const totalDuration = history.reduce((sum, session) => sum + session.duration, 0);
    const averageSessionLength = totalDuration / history.length;

    // 计算最喜欢的服务（基于推荐次数）
    const serviceRecommendations: { [key in ServiceType]?: number } = {};
    
    history.forEach(session => {
      const preferred = session.performanceReport.recommendation.preferred;
      if (preferred !== 'tie') {
        serviceRecommendations[preferred] = (serviceRecommendations[preferred] || 0) + 1;
      }
    });

    let favoriteService: ServiceType | null = null;
    let maxRecommendations = 0;

    Object.entries(serviceRecommendations).forEach(([service, count]) => {
      if (count > maxRecommendations) {
        maxRecommendations = count;
        favoriteService = service as ServiceType;
      }
    });

    return {
      totalSessions: history.length,
      totalDuration,
      favoriteService,
      averageSessionLength
    };
  }

  /**
   * 导出历史记录为JSON
   */
  exportHistory(): Blob {
    const history = this.getHistory();
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      sessions: history,
      stats: this.getHistoryStats()
    };

    return new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
  }

  /**
   * 从JSON文件导入历史记录
   */
  importHistory(file: File): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const importData = JSON.parse(content);
          
          // 验证数据格式
          if (!importData.sessions || !Array.isArray(importData.sessions)) {
            throw new Error('Invalid import file format');
          }

          // 合并现有历史记录
          const currentHistory = this.getHistory();
          const newSessions = importData.sessions as TestSession[];
          
          // 去重（基于ID）
          const existingIds = new Set(currentHistory.map(s => s.id));
          const uniqueNewSessions = newSessions.filter(s => !existingIds.has(s.id));
          
          // 合并并排序
          const mergedHistory = [...currentHistory, ...uniqueNewSessions]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, this.MAX_SESSIONS);

          this.saveToStorage(mergedHistory);
          resolve(true);
        } catch (error) {
          console.error('Import failed:', error);
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsText(file);
    });
  }

  /**
   * 获取最近的会话
   */
  getRecentSessions(limit: number = 10): TestSession[] {
    return this.getHistory().slice(0, limit);
  }

  /**
   * 根据服务类型过滤会话
   */
  getSessionsByService(service: ServiceType): TestSession[] {
    return this.getHistory().filter(session => 
      session.transcriptions[service] && session.transcriptions[service]!.length > 0
    );
  }

  /**
   * 获取性能趋势数据
   */
  getPerformanceTrends(service: ServiceType, days: number = 30): {
    dates: string[];
    confidenceScores: number[];
    latencyScores: number[];
    stabilityScores: number[];
  } {
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    const recentSessions = this.getHistory()
      .filter(session => session.timestamp > cutoffTime)
      .filter(session => session.performanceReport.metrics[service])
      .sort((a, b) => a.timestamp - b.timestamp);

    return {
      dates: recentSessions.map(session => new Date(session.timestamp).toLocaleDateString()),
      confidenceScores: recentSessions.map(session => {
        const metrics = session.performanceReport.metrics[service];
        return metrics?.accuracy.confidence.length
          ? metrics.accuracy.confidence.reduce((sum, c) => sum + c, 0) / metrics.accuracy.confidence.length
          : 0;
      }),
      latencyScores: recentSessions.map(session => {
        const metrics = session.performanceReport.metrics[service];
        return metrics?.latency.averageDelay || 0;
      }),
      stabilityScores: recentSessions.map(session => {
        const metrics = session.performanceReport.metrics[service];
        return metrics?.stability.uptime || 0;
      })
    };
  }

  /**
   * 保存数据到localStorage
   */
  private saveToStorage(history: TestSession[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save history to localStorage:', error);
      // 如果存储失败，尝试清理旧数据
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.clearOldSessions();
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history.slice(0, this.MAX_SESSIONS / 2)));
        } catch (secondError) {
          console.error('Failed to save even after cleanup:', secondError);
        }
      }
    }
  }

  /**
   * 清理旧的会话数据
   */
  private clearOldSessions(): void {
    const history = this.getHistory();
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 保留7天内的数据
    const recentHistory = history.filter(session => session.timestamp > cutoffTime);
    this.saveToStorage(recentHistory);
  }
}