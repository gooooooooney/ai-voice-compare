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
  openai: {
    apiKey: string;
    endpoint: string;
  };
}

export interface AppConfig {
  env: 'development' | 'production';
  api: ApiConfig;
}

// 存储运行时配置
let runtimeConfig: Record<string, string> | null = null;

/**
 * 从服务器获取配置
 */
async function fetchRuntimeConfig(): Promise<Record<string, string>> {
  if (runtimeConfig) {
    return runtimeConfig;
  }

  try {
    const response = await fetch('/api/config');
    if (!response.ok) {
      throw new Error('Failed to fetch config');
    }
    runtimeConfig = await response.json();
    return runtimeConfig!;
  } catch (error) {
    console.error('Failed to fetch runtime config:', error);
    return {};
  }
}

/**
 * 获取环境变量值
 */
function getEnvValue(key: string): string {
  // 开发环境使用 import.meta.env
  if (import.meta.env?.MODE === 'development') {
    return import.meta.env[key] || '';
  }
  
  // 生产环境使用运行时配置
  return runtimeConfig?.[key] || '';
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
export async function getConfig(): Promise<AppConfig> {
  // 生产环境先获取运行时配置
  if (import.meta.env?.MODE !== 'development' && !runtimeConfig) {
    await fetchRuntimeConfig();
  }

  const assemblyAIKey = getEnvValue('VITE_ASSEMBLYAI_API_KEY');
  const deepgramKey = getEnvValue('VITE_DEEPGRAM_API_KEY');
  const openaiKey = getEnvValue('VITE_OPENAI_API_KEY');
  
  // 验证API密钥
  const assemblyAIValid = validateApiKey(assemblyAIKey, 'AssemblyAI');
  const deepgramValid = validateApiKey(deepgramKey, 'Deepgram');
  const openaiValid = validateApiKey(openaiKey, 'OpenAI');
  
  if (!assemblyAIValid || !deepgramValid || !openaiValid) {
    console.error('❌ API配置检查失败，请检查 .env 文件中的API密钥配置');
  }

  return {
    env: import.meta.env?.MODE === 'production' ? 'production' : 'development',
    api: {
      assemblyAI: {
        apiKey: assemblyAIKey,
        endpoint: getEnvValue('VITE_ASSEMBLYAI_ENDPOINT') || 'wss://api.assemblyai.com/v2/realtime/ws',
      },
      deepgram: {
        apiKey: deepgramKey,
        endpoint: getEnvValue('VITE_DEEPGRAM_ENDPOINT') || 'wss://api.deepgram.com/v1/listen',
      },
      openai: {
        apiKey: openaiKey,
        endpoint: getEnvValue('VITE_OPENAI_ENDPOINT') || 'wss://api.openai.com/v1/realtime',
      },
    },
  };
}

/**
 * 检查配置是否有效
 */
export async function isConfigValid(): Promise<boolean> {
  const config = await getConfig();
  return Boolean(
    config.api.assemblyAI.apiKey && 
    config.api.deepgram.apiKey &&
    config.api.openai.apiKey &&
    !config.api.assemblyAI.apiKey.includes('your_') &&
    !config.api.deepgram.apiKey.includes('your_') &&
    !config.api.openai.apiKey.includes('your_')
  );
}

/**
 * 获取缺失的配置项
 */
export async function getMissingConfig(): Promise<string[]> {
  const config = await getConfig();
  const missing: string[] = [];
  
  if (!config.api.assemblyAI.apiKey || config.api.assemblyAI.apiKey.includes('your_')) {
    missing.push('VITE_ASSEMBLYAI_API_KEY');
  }
  
  if (!config.api.deepgram.apiKey || config.api.deepgram.apiKey.includes('your_')) {
    missing.push('VITE_DEEPGRAM_API_KEY');
  }
  
  if (!config.api.openai.apiKey || config.api.openai.apiKey.includes('your_')) {
    missing.push('VITE_OPENAI_API_KEY');
  }
  
  return missing;
}

/**
 * 初始化配置（在应用启动时调用）
 */
export async function initConfig(): Promise<void> {
  if (import.meta.env?.MODE !== 'development') {
    await fetchRuntimeConfig();
  }
}