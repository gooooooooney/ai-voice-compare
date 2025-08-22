import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { initConfig } from './config/env'
import './index.css'

// 初始化配置后再启动应用
async function startApp() {
  // 初始化配置（生产环境会从服务器获取）
  await initConfig();
  
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

startApp();