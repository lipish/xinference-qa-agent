import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const Header = () => {
  const { t } = useTranslation();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Xinference Logo"
                className="h-12 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {t('header.title')}
              </h1>
            </div>
          </Link>

          {/* Simplified Navigation - Hidden for cleaner look */}
          <div className="hidden"></div>

          {/* Minimal right side - Only essential elements */}
          <div className="flex items-center space-x-3">
            {/* GitHub Link - Keep for open source visibility */}
            <a
              href="https://github.com/xorbitsai/inference"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              GitHub
            </a>

            {/* Language Switcher - Keep for i18n */}
            <LanguageSwitcher />
          </div>
        </div>
      </div>


    </header>
  );
};

export default Header;
