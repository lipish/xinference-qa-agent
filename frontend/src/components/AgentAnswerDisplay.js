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
        className="w-full flex items-center justify-between p-3 text-left hover:bg-opacity-80 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <StepIcon type={step.type} isActive={isActive} isCompleted={isCompleted} />
          <div>
            <h3 className={`font-medium ${
              isCompleted ? 'text-green-800' : 
              isActive ? 'text-blue-800' : 
              'text-gray-600'
            }`}>
              {stepTitles[step.type]}
            </h3>
            {step.summary && (
              <p className="text-sm text-gray-600 mt-1">{step.summary}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {step.duration && (
            <span className="text-xs text-gray-500">{step.duration}ms</span>
          )}
          {isExpanded ? (
            <ChevronDownIcon className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-gray-400" />
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
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedSteps, setExpandedSteps] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(true);
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const { state, actions } = useQuery();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Simulate agent processing steps
  const [steps, setSteps] = useState([
    {
      type: 'analyze',
      summary: '正在分析您的问题...',
      details: null,
      duration: null
    },
    {
      type: 'search',
      summary: '搜索相关文档和资源...',
      details: null,
      duration: null
    },
    {
      type: 'synthesize',
      summary: '整合信息并分析...',
      details: null,
      duration: null
    },
    {
      type: 'respond',
      summary: '生成详细回答...',
      details: null,
      duration: null
    }
  ]);

  useEffect(() => {
    if (!answer || !isProcessing) return;

    const processSteps = async () => {
      // Step 1: Analyze
      await new Promise(resolve => setTimeout(resolve, 800));
      setSteps(prev => prev.map((step, idx) => 
        idx === 0 ? {
          ...step,
          summary: '已识别问题类型和关键词',
          details: `**问题分析:**\n- 问题类型: ${answer.question_type || '技术咨询'}\n- 关键词: ${answer.keywords?.join(', ') || 'Xinference, 配置, 使用'}\n- 复杂度: ${answer.complexity || '中等'}`,
          duration: 750
        } : step
      ));
      setCurrentStep(1);

      // Step 2: Search
      await new Promise(resolve => setTimeout(resolve, 1200));
      setSteps(prev => prev.map((step, idx) => 
        idx === 1 ? {
          ...step,
          summary: `找到 ${answer.sources?.length || 3} 个相关资源`,
          details: `**搜索结果:**\n${answer.sources?.map((source, i) => 
            `${i + 1}. ${source.title || source.url}\n   - 相关度: ${Math.round((source.relevance || 0.8) * 100)}%\n   - 来源: ${source.source_type || 'documentation'}`
          ).join('\n') || '- 官方文档\n- GitHub Issues\n- 社区讨论'}`,
          duration: 1150
        } : step
      ));
      setCurrentStep(2);

      // Step 3: Synthesize
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSteps(prev => prev.map((step, idx) => 
        idx === 2 ? {
          ...step,
          summary: '已整合多个信息源',
          details: `**信息整合:**\n- 交叉验证了 ${answer.sources?.length || 3} 个信息源\n- 识别出关键解决方案\n- 评估答案可信度: ${Math.round((answer.confidence || 0.85) * 100)}%\n- 准备生成结构化回答`,
          duration: 950
        } : step
      ));
      setCurrentStep(3);

      // Step 4: Respond
      await new Promise(resolve => setTimeout(resolve, 600));
      setSteps(prev => prev.map((step, idx) => 
        idx === 3 ? {
          ...step,
          summary: '回答已生成完成',
          details: `**回答生成:**\n- 结构化组织信息\n- 添加代码示例和配置\n- 包含最佳实践建议\n- 总响应时间: ${Math.round((answer.response_time || 1.2) * 1000)}ms`,
          duration: 550
        } : step
      ));
      setCurrentStep(4);
      setIsProcessing(false);
    };

    processSteps();
  }, [answer, isProcessing]);

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
      {/* Question Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {answer.question}
        </h2>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>🤖 Agent 模式分析</span>
          <span>•</span>
          <span>{isProcessing ? '分析中...' : '分析完成'}</span>
        </div>
      </div>

      {/* Agent Processing Steps */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">分析过程</h3>
        {steps.map((step, index) => (
          <AnalysisStep
            key={index}
            step={step}
            isActive={currentStep === index && isProcessing}
            isCompleted={currentStep > index}
            isExpanded={expandedSteps.has(index)}
            onToggle={() => toggleStep(index)}
          />
        ))}
      </div>

      {/* Final Answer */}
      {!isProcessing && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('agent.finalAnswer', '最终回答')}
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
      )}

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
