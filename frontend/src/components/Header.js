import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from './auth/UserMenu';
import LoginForm from './auth/LoginForm';
import RegisterForm from './auth/RegisterForm';
import LanguageSwitcher from './LanguageSwitcher';

const Header = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { isAuthenticated, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  
  const navigation = [
    { name: t('header.home'), href: '/', icon: HomeIcon },
    { name: t('header.search'), href: '/search', icon: MagnifyingGlassIcon },
    { name: t('header.about'), href: '/about', icon: InformationCircleIcon },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-24 h-24">
              <img
                src="/logo.png"
                alt="Xinference Logo"
                className="w-24 h-24 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {t('header.title')}
              </h1>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side - Language, Auth and External Links */}
          <div className="flex items-center space-x-4">
            {/* External Links */}
            <a
              href="https://inference.readthedocs.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
            >
              {t('header.documentation')}
            </a>
            <a
              href="https://github.com/xorbitsai/inference"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
            >
              {t('header.github')}
            </a>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Authentication */}
            {!loading && (
              <>
                {isAuthenticated ? (
                  <UserMenu />
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowLogin(true)}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {t('header.login')}
                    </button>
                    <button
                      onClick={() => setShowRegister(true)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      {t('header.register')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modals */}
      {showLogin && (
        <LoginForm
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />
      )}

      {showRegister && (
        <RegisterForm
          onClose={() => setShowRegister(false)}
          onSwitchToLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}
    </header>
  );
};

export default Header;
