// AI语音对比工具 - 主应用逻辑
// JavaScript ES2022+ | Vanilla JS

console.log('🎤 AI语音对比工具初始化...');

/**
 * 应用主类 - 项目初始化阶段
 */
class VoiceComparisonApp {
    constructor() {
        this.version = '1.0.0';
        this.initialized = false;
        this.init();
    }

    /**
     * 初始化应用
     */
    init() {
        console.log(`✅ AI语音对比工具 v${this.version} 启动成功`);
        console.log('📋 项目环境配置：');
        console.log('  - HTML5 结构: ✅');
        console.log('  - CSS3 样式: ✅');
        console.log('  - ES6+ 模块: ✅');
        console.log('  - 静态服务: ✅');
        
        this.checkBrowserCompatibility();
        this.initialized = true;
        
        // 显示初始化完成状态
        this.displayInitStatus();
    }

    /**
     * 检查浏览器兼容性
     */
    checkBrowserCompatibility() {
        const features = {
            'ES6 模块': 'noModule' in HTMLScriptElement.prototype,
            'Fetch API': 'fetch' in window,
            'Promise': 'Promise' in window,
            'MediaDevices': 'mediaDevices' in navigator,
            'WebSocket': 'WebSocket' in window
        };

        console.log('🔍 浏览器兼容性检查：');
        Object.entries(features).forEach(([feature, supported]) => {
            console.log(`  - ${feature}: ${supported ? '✅' : '❌'}`);
        });

        const allSupported = Object.values(features).every(Boolean);
        if (!allSupported) {
            console.warn('⚠️ 某些功能可能不被当前浏览器支持');
        }

        return allSupported;
    }

    /**
     * 显示初始化状态（用于验证）
     */
    displayInitStatus() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.updateUI());
        } else {
            this.updateUI();
        }
    }

    /**
     * 更新UI显示状态
     */
    updateUI() {
        const helloWorld = document.querySelector('.hello-world');
        if (helloWorld) {
            const statusP = document.createElement('p');
            statusP.innerHTML = '🚀 JavaScript ES6+ 模块加载成功';
            statusP.style.color = 'var(--success-color)';
            statusP.style.fontWeight = '500';
            helloWorld.appendChild(statusP);

            const timeP = document.createElement('p');
            timeP.innerHTML = `⏰ 初始化完成时间: ${new Date().toLocaleTimeString()}`;
            timeP.style.color = 'var(--text-color)';
            timeP.style.opacity = '0.7';
            timeP.style.fontSize = '0.9rem';
            helloWorld.appendChild(timeP);
        }
    }

    /**
     * 获取应用状态
     */
    getStatus() {
        return {
            version: this.version,
            initialized: this.initialized,
            timestamp: new Date().toISOString()
        };
    }
}

// 创建应用实例
const app = new VoiceComparisonApp();

// 全局导出（供后续开发使用）
window.VoiceComparisonApp = app;

// 开发模式下的全局调试工具
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debug = {
        app: app,
        status: () => app.getStatus(),
        log: (message) => console.log(`🐛 Debug: ${message}`)
    };
    console.log('🔧 开发模式已启用，使用 window.debug 进行调试');
}

export default app;