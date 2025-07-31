import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ClipboardDocumentIcon,
  HeartIcon,
  ShareIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  LinkIcon,
  HomeIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useQuery } from '../contexts/QueryContext';

const SourceBadge = ({ sourceType }) => {
  const badges = {
    documentation: { color: 'bg-blue-100 text-blue-800', label: 'Docs' },
    github_issue: { color: 'bg-green-100 text-green-800', label: 'GitHub' },
    source_code: { color: 'bg-purple-100 text-purple-800', label: 'Code' },
    faq: { color: 'bg-yellow-100 text-yellow-800', label: 'FAQ' }
  };
  
  const badge = badges[sourceType] || { color: 'bg-gray-100 text-gray-800', label: 'Other' };
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
      {badge.label}
    </span>
  );
};

const ConfidenceIndicator = ({ confidence }) => {
  const getConfidenceColor = (score) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getConfidenceLabel = (score) => {
    if (score >= 0.8) return 'High confidence';
    if (score >= 0.6) return 'Medium confidence';
    return 'Low confidence';
  };
  
  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${getConfidenceColor(confidence).replace('text-', 'bg-')}`} />
      <span className={`text-sm ${getConfidenceColor(confidence)}`}>
        {getConfidenceLabel(confidence)} ({Math.round(confidence * 100)}%)
      </span>
    </div>
  );
};

const SourceCard = ({ source, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const truncatedContent = source.content.length > 200 
    ? source.content.substring(0, 200) + '...'
    : source.content;
  
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
          <SourceBadge sourceType={source.source_type} />
          <div className="w-2 h-2 rounded-full bg-gray-300" />
          <span className="text-xs text-gray-500">
            Score: {Math.round(source.relevance_score * 100)}%
          </span>
        </div>
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:text-primary-700 transition-colors"
        >
          <LinkIcon className="w-4 h-4" />
        </a>
      </div>
      
      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
        {source.title}
      </h4>
      
      <p className="text-sm text-gray-600 mb-3">
        {isExpanded ? source.content : truncatedContent}
      </p>
      
      {source.content.length > 200 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
      
      {source.metadata && Object.keys(source.metadata).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            {source.metadata.labels && source.metadata.labels.map((label, idx) => (
              <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                {label}
              </span>
            ))}
            {source.metadata.author && (
              <span className="text-xs text-gray-500">
                by {source.metadata.author}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AnswerDisplay = ({ answer, onFeedback, onClearAnswer }) => {
  const [copied, setCopied] = useState(false);
  const { state, actions } = useQuery();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const isFavorited = state.favorites.some(fav => fav.question === answer.question);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(answer.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };
  
  const handleFavorite = () => {
    if (isFavorited) {
      actions.removeFromFavorites(answer.question);
    } else {
      actions.addToFavorites({
        question: answer.question,
        answer: answer.answer,
        timestamp: new Date().toISOString()
      });
    }
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Xinference Q&A',
          text: `Q: ${answer.question}\n\nA: ${answer.answer}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    } else {
      // Fallback to copying URL
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleNewQuestion = () => {
    console.log('New Question button clicked');
    // Clear current answer and navigate to home
    if (onClearAnswer) {
      onClearAnswer();
    } else {
      actions.clearResults();
    }
    navigate('/');
  };

  const handleBackToHome = () => {
    console.log('Back to Home button clicked');
    navigate('/');
  };

  return (
    <div className="space-y-6">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBackToHome}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <HomeIcon className="w-4 h-4" />
          <span className="text-sm font-medium">{t('common.back', '返回主页')}</span>
        </button>

        <button
          onClick={handleNewQuestion}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          <span className="text-sm font-medium">{t('common.newQuestion', '新问题')}</span>
        </button>
      </div>

      {/* Answer Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex-1">
            {answer.question}
          </h2>
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleCopy}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Copy answer"
            >
              {copied ? (
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
              ) : (
                <ClipboardDocumentIcon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={handleFavorite}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              {isFavorited ? (
                <HeartSolidIcon className="w-5 h-5 text-red-500" />
              ) : (
                <HeartIcon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={handleShare}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Share"
            >
              <ShareIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Answer Content */}
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {answer.answer}
          </ReactMarkdown>
        </div>
        
        {/* Answer Metadata */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <ConfidenceIndicator confidence={answer.confidence} />
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <ClockIcon className="w-4 h-4" />
              <span>{Math.round(answer.response_time * 1000)}ms</span>
            </div>
          </div>
          
          {onFeedback && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Was this helpful?</span>
              <button
                onClick={() => onFeedback(true)}
                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
              >
                👍
              </button>
              <button
                onClick={() => onFeedback(false)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              >
                👎
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Sources */}
      {answer.sources && answer.sources.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sources ({answer.sources.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {answer.sources.map((source, index) => (
              <SourceCard key={index} source={source} index={index} />
            ))}
          </div>
        </div>
      )}
      
      {/* Low Confidence Warning */}
      {answer.confidence < 0.6 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">
                Low Confidence Answer
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                This answer has low confidence. Please verify the information with the official documentation 
                or consider asking a more specific question.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnswerDisplay;
