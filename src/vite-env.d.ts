/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ASSEMBLYAI_API_KEY: string
  readonly VITE_DEEPGRAM_API_KEY: string
  readonly VITE_APP_ENV: string
  readonly VITE_ASSEMBLYAI_ENDPOINT: string
  readonly VITE_DEEPGRAM_ENDPOINT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 扩展Window接口以支持webkit前缀的AudioContext
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}