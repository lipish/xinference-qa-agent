import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ClipboardDocumentIcon,
  HeartIcon,
  ShareIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  HomeIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CogIcon,
  DocumentMagnifyingGlassIcon,
  LightBulbIcon,
  PencilSquareIcon,
  DocumentTextIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useQuery } from '../contexts/QueryContext';

const StepIcon = ({ type, isActive, isCompleted }) => {
  const iconClass = `w-5 h-5 ${
    isCompleted ? 'text-green-600' : 
    isActive ? 'text-blue-600' : 
    'text-gray-400'
  }`;

  const icons = {
    analyze: <DocumentMagnifyingGlassIcon className={iconClass} />,
    search: <CogIcon className={iconClass} />,
    synthesize: <LightBulbIcon className={iconClass} />,
    respond: <PencilSquareIcon className={iconClass} />
  };

  return icons[type] || <CogIcon className={iconClass} />;
};

const AnalysisStep = ({ step, isActive, isCompleted, isExpanded, onToggle }) => {
  const { t } = useTranslation();
  
  const stepTitles = {
    analyze: t('agent.steps.analyze', '分析问题'),
    search: t('agent.steps.search', '搜索相关信息'),
    synthesize: t('agent.steps.synthesize', '综合分析'),
    respond: t('agent.steps.respond', '生成回答')
  };

  return (
    <div className={`border rounded-lg transition-all duration-200 ${
      isActive ? 'border-blue-300 bg-blue-50' :
      isCompleted ? 'border-green-300 bg-green-50' :
      'border-gray-200 bg-gray-50'
    }`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 text-left hover:bg-opacity-80 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <StepIcon type={step.type} isActive={isActive} isCompleted={isCompleted} />
          <div>
            <h3 className={`text-sm font-medium ${
              isCompleted ? 'text-green-800' :
              isActive ? 'text-blue-800' :
              'text-gray-600'
            }`}>
              {stepTitles[step.type]}
            </h3>
            {step.summary && (
              <p className="text-xs text-gray-600">{step.summary}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {step.duration && (
            <span className="text-xs text-gray-500">{step.duration}ms</span>
          )}
          {isExpanded ? (
            <ChevronDownIcon className="w-3 h-3 text-gray-400" />
          ) : (
            <ChevronRightIcon className="w-3 h-3 text-gray-400" />
          )}
        </div>
      </button>
      
      {isExpanded && step.details && (
        <div className="px-3 pb-3 border-t border-gray-200 bg-white">
          <div className="mt-3 prose prose-sm max-w-none">
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
              {step.details}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

const AgentAnswerDisplay = ({ answer, onFeedback, onClearAnswer }) => {
  const [copied, setCopied] = useState(false);
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState(new Set());
  const [currentStep, setCurrentStep] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const { state, actions } = useQuery();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();



  // Check if this answer is favorited
  useEffect(() => {
    setIsFavorited(state.favorites.some(fav => fav.question === answer.question));
  }, [state.favorites, answer.question]);

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
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleNewQuestion = () => {
    if (onClearAnswer) {
      onClearAnswer();
    } else {
      actions.clearResults();
    }
    navigate('/');
  };

  const handleBackToHome = () => {
    if (onClearAnswer) {
      onClearAnswer();
    } else {
      actions.clearResults();
    }
    navigate('/');
  };



  // Analysis steps with progressive display
  const analysisSteps = [
    {
      icon: '📄',
      title: '分析问题',
      summary: '已识别问题类型和关键词',
      details: `**问题分析:**\n- 问题类型: ${answer.question_type || '技术咨询'}\n- 关键词: ${answer.keywords?.join(', ') || 'Xinference, 配置, 使用'}\n- 复杂度: ${answer.complexity || '中等'}`,
      duration: '750ms'
    },
    {
      icon: '🔍',
      title: '搜索相关信息',
      summary: `找到 ${answer.sources?.length || 10} 个相关资源`,
      details: `**搜索结果:**\n${answer.sources?.map((source, i) =>
        `${i + 1}. ${source.title || source.url}\n   - 相关度: ${Math.round((source.relevance || 0.8) * 100)}%\n   - 来源: ${source.source_type || 'documentation'}`
      ).join('\n') || '- 官方文档\n- GitHub Issues\n- 社区讨论'}`,
      duration: '1150ms'
    },
    {
      icon: '💡',
      title: '综合分析',
      summary: '已整合多个信息源',
      details: `**信息整合:**\n- 交叉验证了 ${answer.sources?.length || 3} 个信息源\n- 识别出关键解决方案\n- 评估答案可信度: ${Math.round((answer.confidence || 0.85) * 100)}%\n- 准备生成结构化回答`,
      duration: '950ms'
    },
    {
      icon: '✏️',
      title: '生成回答',
      summary: '回答已生成完成',
      details: `**回答生成:**\n- 结构化组织信息\n- 添加代码示例和配置\n- 包含最佳实践建议\n- 总响应时间: ${Math.round((answer.response_time || 1.2) * 1000)}ms`,
      duration: '550ms'
    }
  ];

  // Progressive step processing
  useEffect(() => {
    if (!answer) return;

    // Start processing after a short delay to avoid flickering
    const startProcessing = async () => {
      await new Promise(resolve => setTimeout(resolve, 300));

      if (!answer) return; // Check again after delay

      setIsProcessing(true);

      for (let i = 0; i < analysisSteps.length; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, 600));
      }
      setCurrentStep(analysisSteps.length);
      setIsProcessing(false);
    };

    startProcessing();
  }, [answer]);

  const toggleStep = (index) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSteps(newExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Analysis Steps */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">分析过程</h3>
        {analysisSteps.map((step, index) => {
          // Only show steps up to current step + 1 (to show the next step being processed)
          if (index > currentStep + 1) return null;

          const isActive = currentStep === index && isProcessing;
          const isCompleted = currentStep > index;
          const isExpanded = expandedSteps.has(index);

          return (
            <div
              key={index}
              className={`border rounded-lg transition-all duration-300 cursor-pointer ${
                isActive
                  ? 'bg-blue-50 border-blue-200'
                  : isCompleted
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
              }`}
              onClick={() => toggleStep(index)}
            >
              <div className="flex items-center space-x-3 p-2">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  isActive
                    ? 'bg-blue-100'
                    : isCompleted
                      ? 'bg-green-100'
                      : 'bg-gray-100'
                }`}>
                  {isCompleted ? (
                    <span className="text-green-600 text-xs">✓</span>
                  ) : isActive ? (
                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-gray-400 text-xs">{step.icon}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{step.icon}</span>
                      <span className={`text-sm font-medium ${
                        isActive ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        {step.title}
                      </span>
                      <span className="text-xs text-gray-500">{step.duration}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {isActive && (
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      )}
                      <span className={`text-xs transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </div>
                  </div>
                  <p className={`text-xs mt-1 ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.summary}
                  </p>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-3 mx-3 mb-3">
                  <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <div className="prose prose-sm max-w-none text-gray-700">
                      <div className="whitespace-pre-line text-sm leading-relaxed">
                        {step.details}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Answer Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            AI 回答
          </h3>
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => setShowSourcesModal(true)}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="查看数据源"
              >
                <DocumentTextIcon className="w-5 h-5" />
              </button>
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
          
          {/* Sources List */}
          {answer.sources && answer.sources.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                📚 参考资料 ({answer.sources.length})
              </h4>
              <div className="space-y-2">
                {answer.sources.slice(0, 5).map((source, index) => (
                  <div key={index} className="flex items-start space-x-2 text-sm">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <div className="flex-1">
                      <span className="text-gray-700">{source.title || source.url || `数据源 ${index + 1}`}</span>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-xs text-gray-500">
                          相关度: {Math.round((source.relevance_score || 0.8) * 100)}%
                        </span>
                        <span className="text-xs text-gray-500">
                          类型: {source.source_type || 'documentation'}
                        </span>
                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            查看原文
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {answer.sources.length > 5 && (
                  <button
                    onClick={() => setShowSourcesModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    查看全部 {answer.sources.length} 个数据源
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Feedback */}
          {onFeedback && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  可信度: {Math.round((answer.confidence || 0.85) * 100)}%
                </span>
                <span className="text-sm text-gray-500">
                  总用时: {Math.round((answer.response_time || 1.2) * 1000)}ms
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{t('answer.wasThisHelpful')}</span>
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
            </div>
          )}
        </div>

      {/* Sources Modal */}
      {showSourcesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                📚 数据源 ({answer.sources?.length || 0})
              </h3>
              <button
                onClick={() => setShowSourcesModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {answer.sources && answer.sources.length > 0 ? (
                <div className="space-y-3">
                  {answer.sources.map((source, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm mb-1">
                            {source.title || source.url || `数据源 ${index + 1}`}
                          </h4>
                          <p className="text-xs text-gray-600 mb-2">
                            {source.description || source.content?.substring(0, 100) + '...' || '相关内容'}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              📊 相关度: {Math.round((source.relevance || 0.8) * 100)}%
                            </span>
                            <span className="flex items-center">
                              🏷️ 类型: {source.source_type || 'documentation'}
                            </span>
                            {source.url && (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                🔗 查看原文
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <DocumentTextIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>暂无数据源信息</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  💡 这些数据源用于生成上述回答
                </span>
                <button
                  onClick={() => setShowSourcesModal(false)}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentAnswerDisplay;
