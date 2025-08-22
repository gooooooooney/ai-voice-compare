/**
 * 环境变量配置和验证
 */

export interface ApiConfig {
  assemblyAI: {
    apiKey: string;
    endpoint: string;
  };
  deepgram: {
    apiKey: string;
    endpoint: string;
  };
}

export interface AppConfig {
  env: 'development' | 'production';
  api: ApiConfig;
}

/**
 * 验证API密钥格式
 */
function validateApiKey(key: string, serviceName: string): boolean {
  if (!key || key.trim() === '' || key.includes('your_') || key.includes('_here')) {
    console.warn(`⚠️ ${serviceName} API密钥未配置或格式无效`);
    return false;
  }
  return true;
}

/**
 * 获取并验证环境配置
 */
export function getConfig(): AppConfig {
  const assemblyAIKey = import.meta.env.VITE_ASSEMBLYAI_API_KEY || '';
  const deepgramKey = import.meta.env.VITE_DEEPGRAM_API_KEY || '';
  
  // 验证API密钥
  const assemblyAIValid = validateApiKey(assemblyAIKey, 'AssemblyAI');
  const deepgramValid = validateApiKey(deepgramKey, 'Deepgram');
  
  if (!assemblyAIValid || !deepgramValid) {
    console.error('❌ API配置检查失败，请检查 .env 文件中的API密钥配置');
  }

  return {
    env: (import.meta.env.VITE_APP_ENV as 'development' | 'production') || 'development',
    api: {
      assemblyAI: {
        apiKey: assemblyAIKey,
        endpoint: import.meta.env.VITE_ASSEMBLYAI_ENDPOINT || 'wss://api.assemblyai.com/v2/realtime/ws',
      },
      deepgram: {
        apiKey: deepgramKey,
        endpoint: import.meta.env.VITE_DEEPGRAM_ENDPOINT || 'wss://api.deepgram.com/v1/listen',
      },
    },
  };
}

/**
 * 检查配置是否有效
 */
export function isConfigValid(): boolean {
  const config = getConfig();
  return Boolean(
    config.api.assemblyAI.apiKey && 
    config.api.deepgram.apiKey &&
    !config.api.assemblyAI.apiKey.includes('your_') &&
    !config.api.deepgram.apiKey.includes('your_')
  );
}

/**
 * 获取缺失的配置项
 */
export function getMissingConfig(): string[] {
  const config = getConfig();
  const missing: string[] = [];
  
  if (!config.api.assemblyAI.apiKey || config.api.assemblyAI.apiKey.includes('your_')) {
    missing.push('VITE_ASSEMBLYAI_API_KEY');
  }
  
  if (!config.api.deepgram.apiKey || config.api.deepgram.apiKey.includes('your_')) {
    missing.push('VITE_DEEPGRAM_API_KEY');
  }
  
  return missing;
}