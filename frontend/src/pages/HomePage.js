import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import QuestionInput from '../components/QuestionInput';
import AnswerDisplay from '../components/AnswerDisplay';
import AgentAnswerDisplay from '../components/AgentAnswerDisplay';
import LoadingSpinner from '../components/LoadingSpinner';
import { useQuery } from '../contexts/QueryContext';
import { apiService } from '../services/api';
import { translatePopularQuestion, translateCategory } from '../utils/translationUtils';
import {
  BookOpenIcon,
  CodeBracketIcon,
  BugAntIcon,
  CpuChipIcon,
  CloudIcon,
  CommandLineIcon,
  CogIcon,
  DocumentTextIcon,
  PlusIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

const FeatureCard = ({ icon: Icon, title, description, examples, onQuestionClick }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center space-x-3 mb-4">
      <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-lg">
        <Icon className="w-6 h-6 text-primary-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
    <p className="text-gray-600 mb-4">{description}</p>
    <div className="space-y-2">
      {examples.map((example, index) => (
        <button
          key={index}
          onClick={() => onQuestionClick(example)}
          className="w-full text-left text-sm text-gray-600 bg-gray-50 hover:bg-primary-50 hover:text-primary-700 rounded px-3 py-2 transition-all duration-200 cursor-pointer border border-transparent hover:border-primary-200 active:bg-primary-100 active:scale-[0.98]"
        >
          "{example}"
        </button>
      ))}
    </div>
  </div>
);

const HomePage = () => {
  const [currentAnswer, setCurrentAnswer] = useState(null);
  // Always use Agent mode - no toggle needed
  const [conversationHistory, setConversationHistory] = useState([]); // Multi-turn conversation
  const { state, actions } = useQuery();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Clear local answer when QueryContext is cleared
  useEffect(() => {
    if (state.searchResults.length === 0 && state.currentQuery === '') {
      setCurrentAnswer(null);
      setConversationHistory([]); // Clear conversation when navigating back to home
    }
  }, [state.searchResults, state.currentQuery]);

  const handleQuestionSubmit = async (input) => {
    // Handle both string (legacy) and object (new) input formats
    const questionText = typeof input === 'string' ? input : input.text;
    const files = typeof input === 'object' && input.files ? input.files : [];

    // Add question to conversation history immediately
    const newQuestion = {
      id: Date.now(),
      type: 'question',
      content: questionText,
      files: files.length > 0 ? files.map(f => ({ name: f.name, size: f.size, type: f.type })) : [],
      timestamp: new Date().toISOString()
    };

    setConversationHistory(prev => [...prev, newQuestion]);

    // Set loading state but don't clear current answer yet (for multi-turn)
    actions.setQuery(questionText);
    actions.setLoading(true);

    // Force a small delay to ensure UI updates are visible
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // For now, we'll just use the text. File handling can be added later
      const response = await apiService.askQuestion(questionText);

      // Add answer to conversation history
      const newAnswer = {
        id: Date.now() + 1,
        type: 'answer',
        content: response.answer,
        confidence: response.confidence,
        sources: response.sources || [],
        response_time: response.response_time,
        timestamp: new Date().toISOString()
      };

      setConversationHistory(prev => [...prev, newAnswer]);

      // Add to global history
      actions.addToHistory({
        question: questionText,
        answer: response.answer,
        timestamp: new Date().toISOString(),
        confidence: response.confidence,
        files: files.length > 0 ? files.map(f => f.name) : undefined
      });

      setCurrentAnswer(response);
      actions.setResults(response.sources || []);
    } catch (error) {
      // Add error to conversation history
      const errorAnswer = {
        id: Date.now() + 1,
        type: 'error',
        content: error.message,
        timestamp: new Date().toISOString()
      };
      setConversationHistory(prev => [...prev, errorAnswer]);
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

  const handleClearAnswer = () => {
    setCurrentAnswer(null);
    actions.clearResults();
  };

  const handleNewConversation = () => {
    setCurrentAnswer(null);
    setConversationHistory([]);
    actions.clearResults();
  };

  const handleBackToHome = () => {
    setCurrentAnswer(null);
    setConversationHistory([]);
    actions.clearResults();
    // This will trigger the welcome interface to show
  };

  const features = [
    {
      icon: BookOpenIcon,
      title: t('home.features.installation.title'),
      description: t('home.features.installation.description'),
      examples: t('home.features.installation.examples', { returnObjects: true })
    },
    {
      icon: CpuChipIcon,
      title: t('home.features.deployment.title'),
      description: t('home.features.deployment.description'),
      examples: t('home.features.deployment.examples', { returnObjects: true })
    },
    {
      icon: CodeBracketIcon,
      title: t('home.features.api.title'),
      description: t('home.features.api.description'),
      examples: t('home.features.api.examples', { returnObjects: true })
    },
    {
      icon: BugAntIcon,
      title: t('home.features.troubleshooting.title'),
      description: t('home.features.troubleshooting.description'),
      examples: t('home.features.troubleshooting.examples', { returnObjects: true })
    },
    {
      icon: CloudIcon,
      title: t('home.features.production.title'),
      description: t('home.features.production.description'),
      examples: t('home.features.production.examples', { returnObjects: true })
    },
    {
      icon: CommandLineIcon,
      title: t('home.features.advanced.title'),
      description: t('home.features.advanced.description'),
      examples: t('home.features.advanced.examples', { returnObjects: true })
    }
  ];

  // Show chat interface if there's conversation history or current answer
  const showChatInterface = conversationHistory.length > 0 || currentAnswer || state.isLoading;

  if (showChatInterface) {
    return (
      <div className="h-screen flex flex-col">
        {/* Chat Messages Area - Scrollable */}
        <div className="flex-1 overflow-y-auto pb-4" style={{ paddingBottom: '120px' }}>
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {/* Conversation History */}
            {conversationHistory.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'question' ? 'justify-end' : 'justify-start'}`}>
                {message.type === 'question' ? (
                  <div className="max-w-3xl bg-blue-600 text-white rounded-2xl px-4 py-3">
                    <p className="text-sm">{message.content}</p>
                    {message.files && message.files.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {message.files.map((file, idx) => (
                          <span key={idx} className="text-xs bg-blue-500 rounded px-2 py-1">
                            📎 {file.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : message.type === 'error' ? (
                  <div className="max-w-3xl bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                    <p className="text-red-700 text-sm">{message.content}</p>
                  </div>
                ) : (
                  <div className="max-w-3xl w-full">
                    <AgentAnswerDisplay
                      answer={{
                        question: conversationHistory.find(m => m.id === message.id - 1)?.content || '',
                        answer: message.content,
                        confidence: message.confidence,
                        sources: message.sources,
                        response_time: message.response_time
                      }}
                      onFeedback={handleFeedback}
                      onClearAnswer={handleBackToHome} // Enable navigation back to home
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Loading State */}
            {state.isLoading && (
              <div className="flex justify-center px-4">
                <LoadingSpinner
                  type="analysis"
                  question={state.currentQuery}
                />
              </div>
            )}
          </div>
        </div>

        {/* Fixed Input Area */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-4">
            {/* Input with Navigation Controls */}
            <div className="flex items-center space-x-3">
              {/* Input - takes most space */}
              <div className="flex-1">
                <QuestionInput
                  onSubmit={handleQuestionSubmit}
                  placeholder={t('home.hero.placeholder')}
                />
              </div>

              {/* Navigation Buttons - stacked vertically */}
              <div className="flex flex-col space-y-2">
                <button
                  onClick={handleBackToHome}
                  className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm whitespace-nowrap"
                >
                  <HomeIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('common.back', '返回主页')}</span>
                </button>

                <button
                  onClick={handleNewConversation}
                  className="flex items-center space-x-1 px-3 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors text-sm whitespace-nowrap"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('common.newQuestion', '新问题')}</span>
                </button>
              </div>
            </div>

            {/* Error Display */}
            {state.error && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{state.error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default welcome interface
  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Search Section */}
      <div className="text-center space-y-6">
        <div className="max-w-4xl mx-auto">
          <QuestionInput
            onSubmit={handleQuestionSubmit}
            placeholder={t('home.hero.placeholder')}
          />
        </div>

        {state.error && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{state.error}</p>
            </div>
          </div>
        )}
      </div>



      {/* Features Grid */}
      {!state.isLoading && (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('home.features.title')}
            </h2>
            <p className="text-lg text-gray-600">
              {t('home.features.subtitle')}
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} onQuestionClick={handleQuestionSubmit} />
            ))}
          </div>
        </div>
      )}

      {/* Popular Questions */}
      {state.popularQuestions.length > 0 && !state.isLoading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {t('home.popular.title')}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {state.popularQuestions.slice(0, 6).map((item, index) => (
              <button
                key={index}
                onClick={() => handleQuestionSubmit(item.question)}
                className="text-left p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 active:bg-primary-100 active:scale-[0.98] active:border-primary-400"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 font-medium">
                    {translatePopularQuestion(item.question, t)}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    {item.frequency} {t('home.popular.asks')}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {t('home.popular.category')}: {translateCategory(item.category, t)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
