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
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6 ai-analysis-enter">
      {/* Question Display */}
      {question && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">❓</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900 mb-1">您的问题</h3>
              <p className="text-blue-800 text-sm leading-relaxed">{question}</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Steps */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🤖</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI 智能分析</h3>
            <p className="text-sm text-gray-500">正在为您提供最准确的答案</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="space-y-3">
          {analysisSteps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-500 ${
                index === currentStep
                  ? 'bg-blue-50 border border-blue-200'
                  : index < currentStep
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-gray-50 border border-gray-100'
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                index === currentStep
                  ? 'bg-blue-100 animate-pulse'
                  : index < currentStep
                    ? 'bg-green-100'
                    : 'bg-gray-100'
              }`}>
                {index < currentStep ? (
                  <span className="text-green-600 text-sm">✓</span>
                ) : index === currentStep ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span className="text-gray-400 text-sm">{step.icon}</span>
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm transition-colors duration-300 ${
                  index === currentStep
                    ? 'text-blue-700 font-medium'
                    : index < currentStep
                      ? 'text-green-700'
                      : 'text-gray-500'
                }`}>
                  {step.text}
                </p>
              </div>
              {index === currentStep && (
                <div className="floating-dots">
                  <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                  <div className="w-1 h-1 bg-blue-600 rounded-full mx-0.5"></div>
                  <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>分析进度</span>
            <span>{Math.round(((currentStep + 1) / analysisSteps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="ai-progress-bar h-2 rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${((currentStep + 1) / analysisSteps.length) * 100}%`,
                backgroundSize: '200% 100%'
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
