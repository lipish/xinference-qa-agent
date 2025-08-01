import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PaperAirplaneIcon,
  XMarkIcon,
  PhotoIcon,
  DocumentIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { useQuery } from '../contexts/QueryContext';
import { translatePopularQuestion } from '../utils/translationUtils';

const QuestionInput = ({ onSubmit, placeholder = "Ask anything about Xinference..." }) => {
  const [question, setQuestion] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);
  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const logInputRef = useRef(null);
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
    if (question.trim() || uploadedFiles.length > 0) {
      onSubmit({
        text: question.trim(),
        files: uploadedFiles
      });
      setQuestion('');
      setUploadedFiles([]);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    handleFiles(imageFiles);
    e.target.value = ''; // Reset input
  };

  const handleDocumentSelect = (e) => {
    const files = Array.from(e.target.files);
    const documentFiles = files.filter(file =>
      file.type === 'application/pdf' ||
      file.type === 'text/plain' ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md')
    );
    handleFiles(documentFiles);
    e.target.value = ''; // Reset input
  };

  const handleLogSelect = (e) => {
    const files = Array.from(e.target.files);
    const logFiles = files.filter(file =>
      file.type === 'application/json' ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.log')
    );
    handleFiles(logFiles);
    e.target.value = ''; // Reset input
  };

  const handleFiles = (files) => {
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') ||
                         file.type === 'application/pdf' ||
                         file.type === 'text/plain' ||
                         file.type === 'application/json' ||
                         file.name.endsWith('.log') ||
                         file.name.endsWith('.txt');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });

    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the container
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuestion(suggestion);
    setShowSuggestions(false);
    onSubmit({
      text: suggestion,
      files: []
    });
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuestion(value);
    setShowSuggestions(value.length > 0);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
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
    setUploadedFiles([]);
    setShowSuggestions(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(question.toLowerCase())
  );

  const popularQuestions = state.popularQuestions.slice(0, 5);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`relative bg-white border rounded-2xl shadow-sm transition-all duration-200 ${
            isDragging
              ? 'border-blue-300 bg-blue-50 shadow-md'
              : 'border-gray-200 hover:shadow-md focus-within:border-gray-300 focus-within:shadow-md'
          } ${state.isLoading ? 'opacity-50' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* File Upload Area */}
          {uploadedFiles.length > 0 && (
            <div className="p-4 border-b border-gray-100">
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => {
                  const getFileIcon = () => {
                    if (file.type.startsWith('image/')) {
                      return <PhotoIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />;
                    } else if (file.type === 'application/json' || file.name.endsWith('.json') || file.name.endsWith('.log')) {
                      return <ClipboardDocumentListIcon className="h-4 w-4 text-purple-500 flex-shrink-0" />;
                    } else {
                      return <DocumentIcon className="h-4 w-4 text-green-500 flex-shrink-0" />;
                    }
                  };

                  const getBgColor = () => {
                    if (file.type.startsWith('image/')) {
                      return 'bg-blue-50 hover:bg-blue-100 border-blue-200';
                    } else if (file.type === 'application/json' || file.name.endsWith('.json') || file.name.endsWith('.log')) {
                      return 'bg-purple-50 hover:bg-purple-100 border-purple-200';
                    } else {
                      return 'bg-green-50 hover:bg-green-100 border-green-200';
                    }
                  };

                  return (
                    <div key={index} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm border transition-colors ${getBgColor()}`}>
                      {getFileIcon()}
                      <span className="truncate max-w-32 text-gray-700">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-1"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Text Input Area */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={question}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder={placeholder}
              rows={1}
              className="block w-full px-4 py-4 text-base border-0 rounded-2xl resize-none placeholder-gray-500 focus:outline-none focus:ring-0 bg-transparent text-gray-900 leading-6"
              style={{ minHeight: '56px', maxHeight: '200px' }}
              disabled={state.isLoading}
            />

            {/* Bottom Toolbar */}
            <div className="flex items-center justify-between px-4 pb-3 pt-1">
              <div className="flex items-center gap-1 relative">
                {/* Image Upload */}
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  title={t('input.tools.image')}
                >
                  <PhotoIcon className="h-5 w-5" />
                </button>

                {/* Document Upload */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => documentInputRef.current?.click()}
                    onMouseEnter={() => setHoveredButton('document')}
                    onMouseLeave={() => setHoveredButton(null)}
                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                    title={t('input.tools.document')}
                  >
                    <DocumentIcon className="h-5 w-5" />
                  </button>
                  {hoveredButton === 'document' && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
                      {t('input.labels.document')}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
                </div>

                {/* Log/JSON Upload */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => logInputRef.current?.click()}
                    onMouseEnter={() => setHoveredButton('log')}
                    onMouseLeave={() => setHoveredButton(null)}
                    className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                    title={t('input.tools.log')}
                  >
                    <ClipboardDocumentListIcon className="h-5 w-5" />
                  </button>
                  {hoveredButton === 'log' && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
                      {t('input.labels.log')}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={(!question.trim() && uploadedFiles.length === 0) || state.isLoading}
                className={`p-2 rounded-lg transition-all ${
                  (!question.trim() && uploadedFiles.length === 0) || state.isLoading
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                }`}
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={imageInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            ref={documentInputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.md,.doc,.docx"
            onChange={handleDocumentSelect}
            className="hidden"
          />
          <input
            ref={logInputRef}
            type="file"
            multiple
            accept=".json,.log"
            onChange={handleLogSelect}
            className="hidden"
          />
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
