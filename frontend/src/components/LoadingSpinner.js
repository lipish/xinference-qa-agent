import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LoadingSpinner = ({ size = 'md', text, question, type = 'simple' }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  // AI Analysis steps
  const analysisSteps = [
    { icon: '🔍', text: '正在分析您的问题...', duration: 1000 },
    { icon: '📚', text: '搜索相关文档和资料...', duration: 1500 },
    { icon: '🧠', text: 'AI正在思考最佳答案...', duration: 1200 },
    { icon: '✨', text: '生成专业回答中...', duration: 800 }
  ];

  useEffect(() => {
    if (type === 'analysis') {
      const timer = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % analysisSteps.length);
      }, 2000);
      return () => clearInterval(timer);
    }
  }, [type]);

  // Simple loading spinner
  if (type === 'simple') {
    const displayText = text || t('common.searching', '正在搜索答案...');
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <div className="relative">
          <div className={`${sizeClasses[size]} border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin`}></div>
        </div>
        {displayText && (
          <div className="text-center">
            <p className="text-gray-600 loading-dots">{displayText}</p>
          </div>
        )}
      </div>
    );
  }

  // AI Analysis loading
  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8 ai-analysis-enter">
      {/* Question Display */}
      {question && (
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">❓</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">您的问题</h3>
              <p className="text-blue-800 text-base leading-relaxed">{question}</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Steps */}
      <div className="space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl">🤖</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">AI 智能分析</h3>
            <p className="text-base text-gray-600">正在为您提供最准确的答案</p>
          </div>
        </div>

        {/* Progress Steps - Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysisSteps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center space-x-4 p-5 rounded-xl transition-all duration-500 ${
                index === currentStep
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-md'
                  : index < currentStep
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-sm'
                    : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                index === currentStep
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg animate-pulse'
                  : index < currentStep
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-md'
                    : 'bg-gray-200'
              }`}>
                {index < currentStep ? (
                  <span className="text-white text-lg font-bold">✓</span>
                ) : index === currentStep ? (
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span className="text-gray-500 text-lg">{step.icon}</span>
                )}
              </div>
              <div className="flex-1">
                <p className={`text-base font-medium transition-colors duration-300 ${
                  index === currentStep
                    ? 'text-blue-800'
                    : index < currentStep
                      ? 'text-green-800'
                      : 'text-gray-600'
                }`}>
                  {step.text}
                </p>
              </div>
              {index === currentStep && (
                <div className="floating-dots">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full mx-1"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mt-8 bg-gray-50 rounded-xl p-6">
          <div className="flex justify-between items-center text-base text-gray-700 mb-4">
            <span className="font-semibold">分析进度</span>
            <span className="text-2xl font-bold text-blue-600">
              {Math.round(((currentStep + 1) / analysisSteps.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden shadow-inner">
            <div
              className="ai-progress-bar h-4 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{
                width: `${((currentStep + 1) / analysisSteps.length) * 100}%`,
                backgroundSize: '200% 100%'
              }}
            ></div>
          </div>
          <div className="mt-3 text-sm text-gray-600 text-center">
            正在处理第 {currentStep + 1} 步，共 {analysisSteps.length} 步
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
