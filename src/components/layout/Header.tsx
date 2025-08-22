import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              AI语音转文字对比工具
            </h1>
            <p className="text-gray-600 mt-2">
              实时对比 AssemblyAI 和 Deepgram 语音转文字服务性能
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>系统就绪</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};