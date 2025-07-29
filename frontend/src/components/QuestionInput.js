import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon, PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useQuery } from '../contexts/QueryContext';
import { translatePopularQuestion } from '../utils/translationUtils';

const QuestionInput = ({ onSubmit, placeholder = "Ask anything about Xinference..." }) => {
  const [question, setQuestion] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const { state, actions } = useQuery();
  const { t } = useTranslation();
  
  const suggestions = [
    "How to install Xinference?",
    "How to deploy models with Docker?",
    "CUDA out of memory error",
    "How to use vLLM backend?",
    "Model loading fails",
    "How to configure GPU settings?",
    "How to use custom models?",
    "Troubleshooting connection issues"
  ];

  useEffect(() => {
    // Load popular questions when component mounts
    const loadPopularQuestions = async () => {
      try {
        const { apiService } = await import('../services/api');
        const questions = await apiService.getPopularQuestions();
        actions.setPopularQuestions(questions);
      } catch (error) {
        console.error('Failed to load popular questions:', error);
      }
    };
    
    loadPopularQuestions();
  }, [actions]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim()) {
      onSubmit(question.trim());
      setQuestion('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuestion(suggestion);
    setShowSuggestions(false);
    onSubmit(suggestion);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuestion(value);
    setShowSuggestions(value.length > 0);
  };

  const handleInputFocus = () => {
    setShowSuggestions(question.length > 0);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const clearInput = () => {
    setQuestion('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(question.toLowerCase())
  );

  const popularQuestions = state.popularQuestions.slice(0, 5);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            className="block w-full pl-10 pr-20 py-4 text-lg border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            disabled={state.isLoading}
          />
          
          {question && (
            <button
              type="button"
              onClick={clearInput}
              className="absolute inset-y-0 right-16 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
          
          <button
            type="submit"
            disabled={!question.trim() || state.isLoading}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary-600 hover:text-primary-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="h-6 w-6" />
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (question.length > 0 || popularQuestions.length > 0) && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {question.length > 0 && filteredSuggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-3 py-2">
                Suggestions
              </div>
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          
          {question.length === 0 && popularQuestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-3 py-2">
                Popular Questions
              </div>
              {popularQuestions.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(item.question)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span>{translatePopularQuestion(item.question, t)}</span>
                    <span className="text-xs text-gray-400">
                      {item.frequency} {t('home.popular.asks')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {state.searchHistory.length > 0 && question.length === 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-3 py-2">
                Recent Searches
              </div>
              {state.searchHistory.slice(0, 3).map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(item.question)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  {item.question}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionInput;
