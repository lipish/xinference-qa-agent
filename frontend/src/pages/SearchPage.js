import React, { useState } from 'react';
import { useQuery } from '../contexts/QueryContext';
import QuestionInput from '../components/QuestionInput';
import AnswerDisplay from '../components/AnswerDisplay';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiService } from '../services/api';
import {
  ClockIcon,
  HeartIcon,
  TrashIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const SearchHistoryItem = ({ item, onSelect, onRemove }) => (
  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
    <button
      onClick={() => onSelect(item.question)}
      className="flex-1 text-left"
    >
      <div className="font-medium text-gray-900 mb-1">{item.question}</div>
      <div className="text-sm text-gray-500 flex items-center space-x-4">
        <span className="flex items-center space-x-1">
          <ClockIcon className="w-4 h-4" />
          <span>{new Date(item.timestamp).toLocaleDateString()}</span>
        </span>
        <span>Confidence: {Math.round(item.confidence * 100)}%</span>
      </div>
    </button>
    {onRemove && (
      <button
        onClick={() => onRemove(item.question)}
        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    )}
  </div>
);

const FavoriteItem = ({ item, onSelect, onRemove }) => (
  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
    <button
      onClick={() => onSelect(item.question)}
      className="flex-1 text-left"
    >
      <div className="font-medium text-gray-900 mb-1">{item.question}</div>
      <div className="text-sm text-gray-600 mb-2 line-clamp-2">
        {item.answer.substring(0, 150)}...
      </div>
      <div className="text-xs text-gray-500">
        Saved on {new Date(item.timestamp).toLocaleDateString()}
      </div>
    </button>
    <button
      onClick={() => onRemove(item.question)}
      className="p-2 text-red-500 hover:text-red-700 transition-colors"
    >
      <HeartIcon className="w-5 h-5 fill-current" />
    </button>
  </div>
);

const SearchPage = () => {
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [activeTab, setActiveTab] = useState('search');
  const { state, actions } = useQuery();

  const handleQuestionSubmit = async (question) => {
    actions.setQuery(question);
    actions.setLoading(true);
    actions.clearResults();
    setCurrentAnswer(null);
    setActiveTab('search');

    try {
      const response = await apiService.askQuestion(question);
      
      // Add to search history
      actions.addToHistory({
        question,
        answer: response.answer,
        timestamp: new Date().toISOString(),
        confidence: response.confidence
      });
      
      setCurrentAnswer(response);
      actions.setResults(response.sources || []);
    } catch (error) {
      actions.setError(error.message);
    } finally {
      actions.setLoading(false);
    }
  };

  const handleFeedback = async (helpful) => {
    if (!currentAnswer) return;
    
    try {
      await apiService.submitFeedback({
        question: currentAnswer.question,
        answer: currentAnswer.answer,
        helpful,
        rating: helpful ? 5 : 2,
        comment: null
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const removeFromHistory = (question) => {
    // This would typically call an API to remove from persistent storage
    // For now, we'll just update the local state
    console.log('Remove from history:', question);
  };

  const tabs = [
    { id: 'search', name: 'Search', icon: MagnifyingGlassIcon },
    { id: 'history', name: 'History', icon: ClockIcon },
    { id: 'favorites', name: 'Favorites', icon: HeartIcon }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Search Input */}
      <div className="mb-8">
        <QuestionInput 
          onSubmit={handleQuestionSubmit}
          placeholder="Search Xinference documentation and issues..."
        />
        
        {state.error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{state.error}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors
                    ${isActive
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                  {tab.id === 'history' && state.searchHistory.length > 0 && (
                    <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {state.searchHistory.length}
                    </span>
                  )}
                  {tab.id === 'favorites' && state.favorites.length > 0 && (
                    <span className="bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                      {state.favorites.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {activeTab === 'search' && (
            <>
              {state.isLoading && <LoadingSpinner />}
              
              {currentAnswer && !state.isLoading && (
                <AnswerDisplay 
                  answer={currentAnswer} 
                  onFeedback={handleFeedback}
                />
              )}
              
              {!currentAnswer && !state.isLoading && (
                <div className="text-center py-12">
                  <MagnifyingGlassIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Search Xinference Knowledge Base
                  </h3>
                  <p className="text-gray-600">
                    Ask any question about Xinference and get answers from documentation, 
                    GitHub issues, and source code.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {activeTab === 'history' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Search History
              </h3>
              {state.searchHistory.length > 0 ? (
                <div className="space-y-3">
                  {state.searchHistory.map((item, index) => (
                    <SearchHistoryItem
                      key={index}
                      item={item}
                      onSelect={handleQuestionSubmit}
                      onRemove={removeFromHistory}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ClockIcon className="w-8 h-8 mx-auto mb-2" />
                  <p>No search history yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Favorite Answers
              </h3>
              {state.favorites.length > 0 ? (
                <div className="space-y-3">
                  {state.favorites.map((item, index) => (
                    <FavoriteItem
                      key={index}
                      item={item}
                      onSelect={handleQuestionSubmit}
                      onRemove={actions.removeFromFavorites}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <HeartIcon className="w-8 h-8 mx-auto mb-2" />
                  <p>No favorites yet</p>
                  <p className="text-sm mt-1">
                    Click the heart icon on answers to save them
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Popular Questions Sidebar */}
          {state.popularQuestions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Popular Questions
              </h3>
              <div className="space-y-3">
                {state.popularQuestions.slice(0, 5).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionSubmit(item.question)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {item.question}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.frequency} asks • {item.category}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
