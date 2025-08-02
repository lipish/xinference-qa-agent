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
  DocumentTextIcon
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
  const [useAgentMode, setUseAgentMode] = useState(true); // Default to Agent mode
  const { state, actions } = useQuery();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Clear local answer when QueryContext is cleared
  useEffect(() => {
    if (state.searchResults.length === 0 && state.currentQuery === '') {
      setCurrentAnswer(null);
    }
  }, [state.searchResults, state.currentQuery]);

  const handleQuestionSubmit = async (input) => {
    // Handle both string (legacy) and object (new) input formats
    const questionText = typeof input === 'string' ? input : input.text;
    const files = typeof input === 'object' && input.files ? input.files : [];

    // Immediately clear current state and show loading
    setCurrentAnswer(null);
    actions.clearResults();
    actions.setQuery(questionText);
    actions.setLoading(true);

    // Force a small delay to ensure UI updates are visible
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // For now, we'll just use the text. File handling can be added later
      const response = await apiService.askQuestion(questionText);

      // Add to search history
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

      {/* Loading State */}
      {state.isLoading && (
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <LoadingSpinner />
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {t('common.analyzing')}
                </p>
                <p className="text-sm text-gray-600">
                  {state.currentQuery && `"${state.currentQuery}"`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Answer Display Mode Toggle */}
      {currentAnswer && !state.isLoading && (
        <div className="max-w-6xl mx-auto mb-4">
          <div className="flex items-center justify-center space-x-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <span className="text-sm text-gray-600">{t('home.displayMode', '显示模式')}:</span>
            <button
              onClick={() => setUseAgentMode(true)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                useAgentMode
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <CogIcon className="w-4 h-4" />
              <span>{t('home.agentMode', 'Agent 模式')}</span>
            </button>
            <button
              onClick={() => setUseAgentMode(false)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                !useAgentMode
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <DocumentTextIcon className="w-4 h-4" />
              <span>{t('home.classicMode', '经典模式')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Answer Display */}
      {currentAnswer && !state.isLoading && (
        <div className="max-w-6xl mx-auto">
          {useAgentMode ? (
            <AgentAnswerDisplay
              answer={currentAnswer}
              onFeedback={handleFeedback}
              onClearAnswer={handleClearAnswer}
            />
          ) : (
            <AnswerDisplay
              answer={currentAnswer}
              onFeedback={handleFeedback}
              onClearAnswer={handleClearAnswer}
            />
          )}
        </div>
      )}

      {/* Features Grid */}
      {!currentAnswer && !state.isLoading && (
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
      {state.popularQuestions.length > 0 && !currentAnswer && !state.isLoading && (
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
