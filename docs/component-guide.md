# 组件使用指南

## 概述

本文档提供AI语音对比工具所有UI组件的使用指南，包括HTML结构、CSS类名、JavaScript接口和无障碍属性。

## 核心组件

### 1. 状态指示器 (Status Indicator)

用于显示API连接状态、麦克风状态等系统状态。

#### HTML结构
```html
<span class="status [connected|disconnected|connecting]">状态文本</span>
```

#### 状态类型
- `connected` - 绿色，表示正常连接
- `disconnected` - 红色，表示断开或错误
- `connecting` - 黄色，表示连接中或等待

#### 使用示例
```html
<div class="status-indicators">
    <div class="status-item">
        <span class="status-label">Deepgram:</span>
        <span id="deepgram-status" class="status connected">已连接</span>
    </div>
</div>
```

#### JavaScript接口
```javascript
// 更新状态
function updateStatus(elementId, status, text) {
    const element = document.getElementById(elementId);
    element.className = `status ${status}`;
    element.textContent = text;
}

// 使用示例
updateStatus('deepgram-status', 'connected', '已连接');
```

### 2. 按钮系统 (Button System)

提供不同层级和状态的按钮组件。

#### 按钮类型
```html
<!-- 主要按钮 -->
<button class="btn primary">开始录音</button>

<!-- 次要按钮 -->
<button class="btn secondary">停止录音</button>

<!-- 轮廓按钮 -->
<button class="btn outline">清除结果</button>
```

#### 按钮状态
```html
<!-- 禁用状态 -->
<button class="btn primary" disabled>无法使用</button>

<!-- 加载状态（需要JavaScript） -->
<button class="btn primary loading">处理中...</button>
```

#### 无障碍属性
```html
<button 
    class="btn primary"
    aria-describedby="button-help"
    aria-pressed="false">
    开始录音
</button>
<div id="button-help" class="sr-only">开始录音测试，需要麦克风权限</div>
```

### 3. 转录面板 (Transcription Panel)

显示实时转录结果的主要组件。

#### HTML结构
```html
<div class="transcription-panel [deepgram-panel|assemblyai-panel]">
    <div class="panel-header">
        <h3>API名称</h3>
        <div class="panel-metrics">
            <span class="latency">延迟: <span id="latency-value">--</span>ms</span>
            <span class="word-count">词数: <span id="word-count">0</span></span>
        </div>
    </div>
    <div class="transcription-content">
        <div class="partial-text" aria-label="临时转录结果"></div>
        <div class="final-text" aria-label="最终转录结果"></div>
    </div>
</div>
```

#### 主题样式
- `deepgram-panel` - 蓝色主题
- `assemblyai-panel` - 橙色主题

#### JavaScript接口
```javascript
class TranscriptionPanel {
    constructor(apiName, elementId) {
        this.apiName = apiName;
        this.element = document.getElementById(elementId);
        this.partialElement = this.element.querySelector('.partial-text');
        this.finalElement = this.element.querySelector('.final-text');
        this.latencyElement = this.element.querySelector('#latency-value');
        this.wordCountElement = this.element.querySelector('#word-count');
    }
    
    updatePartial(text) {
        this.partialElement.textContent = text;
    }
    
    updateFinal(text) {
        this.finalElement.textContent += text + ' ';
        this.partialElement.textContent = '';
        this.updateWordCount();
    }
    
    updateLatency(ms) {
        this.latencyElement.textContent = ms;
        // 添加颜色指示
        if (ms < 100) {
            this.latencyElement.className = 'latency-good';
        } else if (ms < 200) {
            this.latencyElement.className = 'latency-medium';
        } else {
            this.latencyElement.className = 'latency-poor';
        }
    }
    
    updateWordCount() {
        const words = this.finalElement.textContent.trim().split(/\s+/).length;
        this.wordCountElement.textContent = words;
    }
    
    clear() {
        this.partialElement.textContent = '';
        this.finalElement.textContent = '';
        this.wordCountElement.textContent = '0';
        this.latencyElement.textContent = '--';
    }
}
```

### 4. 音频电平指示器 (Audio Level Meter)

显示实时音频输入电平。

#### HTML结构
```html
<div class="audio-level">
    <label for="level-meter">音频电平:</label>
    <div class="level-meter" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
        <div id="level-bar" class="level-bar"></div>
    </div>
</div>
```

#### JavaScript接口
```javascript
class AudioLevelMeter {
    constructor(elementId) {
        this.levelBar = document.getElementById(elementId);
        this.meter = this.levelBar.parentElement;
    }
    
    updateLevel(percentage) {
        // 确保值在0-100范围内
        const level = Math.max(0, Math.min(100, percentage));
        
        this.levelBar.style.width = level + '%';
        this.meter.setAttribute('aria-valuenow', Math.round(level));
        
        // 可选：添加颜色变化
        if (level > 80) {
            this.levelBar.style.background = 'var(--error)';
        } else if (level > 60) {
            this.levelBar.style.background = 'var(--warning)';
        } else {
            this.levelBar.style.background = 'var(--success)';
        }
    }
}
```

### 5. 指标卡片 (Metric Card)

显示性能对比数据的卡片组件。

#### HTML结构
```html
<div class="metric-card">
    <h4>指标标题</h4>
    <div class="metric-comparison">
        <div class="metric-item deepgram">
            <span class="api-name">Deepgram</span>
            <span class="metric-value">数值</span>
        </div>
        <div class="metric-item assemblyai">
            <span class="api-name">AssemblyAI</span>
            <span class="metric-value">数值</span>
        </div>
    </div>
</div>
```

#### JavaScript接口
```javascript
class MetricCard {
    constructor(cardId) {
        this.card = document.getElementById(cardId);
        this.deepgramValue = this.card.querySelector('.metric-item.deepgram .metric-value');
        this.assemblyaiValue = this.card.querySelector('.metric-item.assemblyai .metric-value');
    }
    
    updateValues(deepgramValue, assemblyaiValue) {
        this.deepgramValue.textContent = deepgramValue;
        this.assemblyaiValue.textContent = assemblyaiValue;
        
        // 可选：添加比较指示
        if (deepgramValue < assemblyaiValue) {
            this.deepgramValue.classList.add('better');
            this.assemblyaiValue.classList.remove('better');
        } else if (assemblyaiValue < deepgramValue) {
            this.assemblyaiValue.classList.add('better');
            this.deepgramValue.classList.remove('better');
        }
    }
}
```

### 6. 消息组件 (Message Component)

显示系统消息、错误提示等。

#### 消息类型
```html
<!-- 错误消息 -->
<div class="message error">
    <strong>错误标题</strong><br>
    错误详细信息
</div>

<!-- 警告消息 -->
<div class="message warning">
    <strong>警告标题</strong><br>
    警告详细信息
</div>

<!-- 信息消息 -->
<div class="message info">
    <strong>信息标题</strong><br>
    信息详细内容
</div>

<!-- 成功消息 -->
<div class="message success">
    <strong>成功标题</strong><br>
    成功详细信息
</div>
```

#### JavaScript接口
```javascript
class MessageManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }
    
    showMessage(type, title, content, duration = 5000) {
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.innerHTML = `
            <strong>${title}</strong><br>
            ${content}
            <button class="message-close" aria-label="关闭消息">&times;</button>
        `;
        
        // 添加关闭按钮事件
        message.querySelector('.message-close').addEventListener('click', () => {
            this.removeMessage(message);
        });
        
        this.container.appendChild(message);
        
        // 自动移除
        if (duration > 0) {
            setTimeout(() => {
                this.removeMessage(message);
            }, duration);
        }
        
        return message;
    }
    
    removeMessage(message) {
        message.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 300);
    }
    
    clearAll() {
        this.container.innerHTML = '';
    }
    
    // 便捷方法
    error(title, content, duration) {
        return this.showMessage('error', title, content, duration);
    }
    
    warning(title, content, duration) {
        return this.showMessage('warning', title, content, duration);
    }
    
    info(title, content, duration) {
        return this.showMessage('info', title, content, duration);
    }
    
    success(title, content, duration) {
        return this.showMessage('success', title, content, duration);
    }
}
```

## 响应式行为

### 断点系统
```css
/* 移动端优先的媒体查询 */
@media (max-width: 767px) {
    /* 手机端样式 */
}

@media (min-width: 768px) and (max-width: 1023px) {
    /* 平板端样式 */
}

@media (min-width: 1024px) {
    /* 桌面端样式 */
}
```

### 布局适配
- **桌面端**: 左右分屏布局
- **平板端**: 紧凑布局，保持左右分屏
- **手机端**: 垂直堆叠布局

## 无障碍指南

### ARIA标签
```html
<!-- 区域标签 -->
<section aria-label="描述性标签">

<!-- 实时更新区域 -->
<div aria-live="polite"><!-- 礼貌更新 --></div>
<div aria-live="assertive"><!-- 立即更新 --></div>

<!-- 进度条 -->
<div role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100">

<!-- 按钮状态 -->
<button aria-pressed="true">切换按钮</button>
<button aria-expanded="false">折叠按钮</button>

<!-- 描述关系 -->
<input aria-describedby="help-text">
<div id="help-text">帮助文本</div>
```

### 键盘导航
- `Tab` - 下一个可聚焦元素
- `Shift + Tab` - 上一个可聚焦元素
- `Space` - 开始/停止录音（全局快捷键）
- `Enter` - 激活按钮
- `Escape` - 关闭模态对话框

### 焦点管理
```javascript
// 管理焦点的工具函数
class FocusManager {
    static trapFocus(container) {
        const focusableElements = container.querySelectorAll(
            'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        container.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });
    }
    
    static returnFocus(element) {
        if (element && typeof element.focus === 'function') {
            element.focus();
        }
    }
}
```

## 动画和过渡

### CSS动画类
```css
/* 加载动画 */
.loading-pulse {
    animation: pulse 2s infinite;
}

/* 滑入动画 */
.slide-in {
    animation: slideIn 0.3s ease-out;
}

/* 淡入动画 */
.fade-in {
    animation: fadeIn 0.3s ease-out;
}
```

### JavaScript动画控制
```javascript
// 尊重用户的动画偏好
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function animateElement(element, animationClass) {
    if (prefersReducedMotion.matches) {
        // 跳过动画
        return;
    }
    
    element.classList.add(animationClass);
    element.addEventListener('animationend', () => {
        element.classList.remove(animationClass);
    }, { once: true });
}
```

## 性能优化

### CSS优化
```css
/* 启用硬件加速 */
.gpu-accelerated {
    transform: translateZ(0);
    will-change: transform;
}

/* 优化重绘性能 */
.optimized-animation {
    will-change: opacity, transform;
}
```

### JavaScript优化
```javascript
// 使用requestAnimationFrame优化动画
function smoothUpdate(callback) {
    let rafId;
    
    function update() {
        callback();
        rafId = requestAnimationFrame(update);
    }
    
    rafId = requestAnimationFrame(update);
    
    return () => cancelAnimationFrame(rafId);
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
```

## 测试指南

### 视觉测试检查点
- [ ] 所有组件在不同屏幕尺寸下正常显示
- [ ] 颜色对比度符合WCAG AA标准
- [ ] 加载状态和过渡动画流畅
- [ ] 错误状态清晰可见

### 交互测试检查点
- [ ] 所有按钮可通过键盘访问
- [ ] 焦点样式清晰可见
- [ ] 状态变化有适当的视觉反馈
- [ ] 错误消息提供明确的解决方案

### 无障碍测试检查点
- [ ] 屏幕阅读器能正确朗读内容
- [ ] 键盘导航顺序逻辑合理
- [ ] ARIA标签准确描述元素功能
- [ ] 色彩不是传达信息的唯一方式

---

*本组件指南将随项目开发进度持续更新*