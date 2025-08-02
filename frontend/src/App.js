import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QueryProvider } from './contexts/QueryContext';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import AboutPage from './pages/AboutPage';
import './i18n'; // 导入i18n配置
import './index.css';

function AppContent() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // Update document title based on current language
    const updateTitle = () => {
      if (i18n.language === 'zh') {
        document.title = 'Xinference 问答社区';
      } else {
        document.title = 'Xinference Q&A Agent';
      }
    };

    updateTitle();

    // Listen for language changes
    i18n.on('languageChanged', updateTitle);

    return () => {
      i18n.off('languageChanged', updateTitle);
    };
  }, [i18n]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryProvider>
        <Router>
          <AppContent />
        </Router>
      </QueryProvider>
    </AuthProvider>
  );
}

export default App;
