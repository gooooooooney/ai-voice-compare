# Story 3: 实时转录对比界面与性能指标

## User Story

作为一个**开发者或技术决策者**，
我想要**通过直观的并排界面实时查看两个语音服务的转录结果和性能数据**，
以便于**能够快速对比服务质量，在15分钟内做出明智的服务选择决策**。

## Story Context

**依赖关系：** 依赖Story 1（基础架构）和Story 2（SDK集成）完成
**用户体验重点：** 简洁直观、实时反馈、明确数据对比
**核心价值：** 将技术数据转化为可操作的业务见解
**开发时间：** 第2天下午到第3天

## Acceptance Criteria

### 对比界面设计：

1. **双栏转录显示**
   - 设计并实现左右分栏布局（AssemblyAI vs Deepgram）
   - 实时显示转录文本，支持流式更新
   - 区分临时结果和最终确认结果
   - 提供清晰的服务标识和品牌元素

2. **录制控制界面**
   - 创建直观的开始/停止录制按钮
   - 显示录制状态指示器（录制中/空闲/连接中）
   - 实现音频音量可视化（实时音量条）
   - 提供录制时长显示

3. **连接状态指示**
   - 实时显示两个服务的连接状态
   - 使用颜色编码（绿色=连接，红色=断开，黄色=连接中）
   - 显示连接质量和稳定性指标
   - 提供重连按钮和故障排除提示

### 性能指标系统：

4. **准确率对比**
   - 实现转录置信度显示（如服务提供）
   - 统计字符数、单词数对比
   - 计算转录完整性指标
   - 提供主观准确率评价界面（用户打分）

5. **延迟性能监控**
   - 测量并显示音频到文本的延迟时间
   - 统计平均延迟、最大延迟、延迟波动
   - 实时显示延迟趋势图或数值
   - 对比两个服务的延迟差异

6. **稳定性指标**
   - 监控连接中断次数和持续时间
   - 统计重连成功率和恢复时间
   - 记录错误发生频率和类型
   - 计算整体服务可靠性评分

### 数据可视化：

7. **实时性能仪表板**
   - 创建性能指标的可视化展示
   - 使用图表显示延迟趋势（简单折线图）
   - 实现准确率和稳定性的对比条形图
   - 提供关键指标的大数字显示

8. **测试结果总结**
   - 生成测试会话的综合报告
   - 突出显示两个服务的主要差异
   - 提供基于数据的服务推荐建议
   - 支持测试结果的截图或文本导出

9. **历史测试对比**
   - 存储最近的测试结果（localStorage）
   - 支持查看历史测试的基础对比
   - 提供清除历史数据的选项
   - 显示测试改进趋势

### 用户体验优化：

10. **响应式设计**
    - 适配桌面和移动设备显示
    - 在小屏幕上优化双栏布局（可切换显示）
    - 确保关键信息在所有设备上清晰可见
    - 优化触摸交互体验

11. **无障碍性支持**
    - 添加适当的ARIA标签和语义化HTML
    - 支持键盘导航和快捷键
    - 提供色盲友好的颜色方案
    - 确保文字对比度符合WCAG标准

12. **加载和错误状态**
    - 实现优雅的加载状态动画
    - 提供友好的错误信息和解决建议
    - 支持一键重试和手动刷新
    - 在网络问题时提供离线体验说明

## Technical Implementation Details

### 核心组件架构：

```typescript
// 主对比界面组件
const ComparisonDashboard: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TranscriptionPanel service="assemblyai" />
      <TranscriptionPanel service="deepgram" />
      <MetricsPanel />
      <ControlPanel />
    </div>
  );
};

// 转录面板组件
const TranscriptionPanel: React.FC<{service: string}> = ({service}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <ServiceHeader service={service} />
      <ConnectionStatus service={service} />
      <TranscriptDisplay service={service} />
      <MetricsDisplay service={service} />
    </div>
  );
};

// 性能指标面板
const MetricsPanel: React.FC = () => {
  return (
    <div className="col-span-full bg-gray-50 rounded-lg p-6">
      <ComparisonChart />
      <MetricsComparison />
      <TestSummary />
    </div>
  );
};
```

### 性能指标数据结构：

```typescript
interface PerformanceMetrics {
  service: 'assemblyai' | 'deepgram';
  session: {
    startTime: Date;
    duration: number;
    audioQuality: number;
  };
  accuracy: {
    confidence: number[];
    wordCount: number;
    characterCount: number;
    userRating?: number; // 1-5星主观评价
  };
  latency: {
    averageDelay: number;
    maxDelay: number;
    minDelay: number;
    samples: number[];
  };
  stability: {
    connectionDrops: number;
    reconnectTime: number[];
    errorRate: number;
    uptime: number;
  };
}

interface ComparisonResult {
  timestamp: Date;
  testDuration: number;
  metrics: {
    assemblyai: PerformanceMetrics;
    deepgram: PerformanceMetrics;
  };
  recommendation: {
    preferred: 'assemblyai' | 'deepgram' | 'tie';
    reasoning: string;
    confidenceScore: number;
  };
}
```

### 状态管理增强：

```typescript
interface UIState {
  // 界面状态
  isRecording: boolean;
  showMetrics: boolean;
  activePanel: 'comparison' | 'history' | 'settings';
  
  // 性能数据
  currentMetrics: PerformanceMetrics[];
  testHistory: ComparisonResult[];
  
  // 用户偏好
  preferredLanguage: string;
  displayMode: 'compact' | 'detailed';
  autoExport: boolean;
}
```

### 可视化组件：

```typescript
// 简单的延迟趋势图
const LatencyChart: React.FC<{data: number[]}> = ({data}) => {
  // 使用Canvas或SVG实现简单折线图
  // 或集成轻量级图表库如recharts
};

// 对比条形图
const ComparisonBars: React.FC<{metrics: ComparisonMetrics}> = ({metrics}) => {
  // 显示准确率、延迟、稳定性的对比条形图
};
```

## Definition of Done

- [ ] 双栏转录结果实时显示，更新流畅无卡顿
- [ ] 录制控制界面直观易用，状态反馈清晰
- [ ] 性能指标准确计算并实时显示
- [ ] 延迟监控功能正常，数据可视化清晰
- [ ] 稳定性指标统计准确，连接状态实时更新
- [ ] 测试结果总结功能完整，提供有价值的对比建议
- [ ] 响应式设计在主流设备上表现良好
- [ ] 无障碍性基本要求满足（ARIA、键盘导航）
- [ ] 历史测试记录和查看功能正常
- [ ] 导出功能可用（截图、文本或JSON）
- [ ] 错误处理和加载状态用户体验良好
- [ ] 整体界面简洁直观，符合用户期望

## Risk Assessment

**主要风险：** 实时性能监控可能影响转录性能
**缓解方案：** 
- 使用Web Workers进行性能计算
- 优化数据采样频率
- 实现性能监控的开关选项

**次要风险：** 移动设备上的双栏布局可用性问题
**缓解方案：**
- 实现标签页切换模式
- 优化关键信息的垂直布局
- 提供横屏模式优化

**数据风险：** localStorage容量限制影响历史记录
**缓解方案：**
- 限制历史记录数量（如最近20次）
- 实现数据压缩存储
- 提供数据清理选项

## Acceptance Testing Scenarios

### 场景1：完整测试流程
- 用户打开应用，看到清晰的双栏界面
- 点击开始录制，两侧显示连接状态
- 开始说话，实时看到转录结果更新
- 观察性能指标实时变化
- 停止录制，查看测试总结和建议

### 场景2：移动设备体验
- 在手机上访问应用
- 界面自动适配小屏幕
- 可以切换查看不同服务的结果
- 录制控制按钮大小合适，易于触摸
- 性能数据清晰可读

### 场景3：网络不稳定场景
- 录制过程中网络波动
- 界面显示连接状态变化
- 稳定性指标正确记录中断
- 用户能理解当前状况并采取行动

## Success Metrics

**用户体验指标：**
- 用户能在5分钟内完成一次完整对比测试
- 95%的用户能正确理解测试结果
- 界面加载时间<3秒，交互响应<200ms

**功能完整性指标：**
- 所有核心功能在主流浏览器中正常工作
- 性能指标计算准确度>95%
- 错误恢复成功率>90%

## Next Steps

完成此Story后，MVP应该：
1. 提供完整的用户端体验
2. 实现项目的核心价值主张
3. 准备好进行真实用户测试和反馈收集

**预估工作量：** 8-10小时  
**优先级：** High（用户价值实现）  
**依赖关系：** 依赖Story 1和Story 2完成