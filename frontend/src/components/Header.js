import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StarIcon } from '@heroicons/react/24/outline';
import LanguageSwitcher from './LanguageSwitcher';
import { useQuery } from '../contexts/QueryContext';

const Header = () => {
  const { t } = useTranslation();
  const { actions } = useQuery();
  const navigate = useNavigate();
  const [starCount, setStarCount] = useState(null);

  useEffect(() => {
    // Fetch GitHub stars count
    const fetchStarCount = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/xorbitsai/inference');
        const data = await response.json();
        setStarCount(data.stargazers_count);
      } catch (error) {
        console.error('Failed to fetch GitHub stars:', error);
        // Fallback to a reasonable number if API fails
        setStarCount(2800);
      }
    };

    fetchStarCount();
  }, []);

  const formatStarCount = (count) => {
    if (!count) return '';
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    // Clear any current results and navigate to home
    actions.clearResults();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <a
            href="/"
            onClick={handleLogoClick}
            className="flex items-center space-x-3 cursor-pointer"
          >
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
          </a>

          {/* Simplified Navigation - Hidden for cleaner look */}
          <div className="hidden"></div>

          {/* Minimal right side - Only essential elements */}
          <div className="flex items-center space-x-4">
            {/* GitHub Link with Stars - Keep for open source visibility */}
            <a
              href="https://github.com/xorbitsai/inference"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all group"
            >
              {/* GitHub Icon */}
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>

              {/* Star Icon and Count */}
              <div className="flex items-center space-x-1">
                <StarIcon className="w-4 h-4" />
                <span className="font-medium">
                  {starCount ? formatStarCount(starCount) : '...'}
                </span>
              </div>
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
