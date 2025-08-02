import React from 'react';
import { useTranslation } from 'react-i18next';

const LoadingSpinner = ({ size = 'md', text, question, type = 'simple' }) => {
  const { t } = useTranslation();

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

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

  // AI Analysis loading - Simple version
  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900 mb-1">正在搜索答案</h3>
          {question && (
            <p className="text-sm text-gray-600 line-clamp-2">"{question}"</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
