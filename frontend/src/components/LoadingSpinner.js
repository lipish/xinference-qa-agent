import React from 'react';
import { useTranslation } from 'react-i18next';

const LoadingSpinner = ({ size = 'md', text }) => {
  const { t } = useTranslation();
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  // Use provided text or default to translated text
  const displayText = text || t('common.searching', '正在搜索答案...');

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-8">
      <div className="relative">
        <div className={`${sizeClasses[size]} border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin`}></div>
      </div>
      {displayText && (
        <div className="text-center">
          <p className="text-gray-600 loading-dots">{displayText}</p>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
