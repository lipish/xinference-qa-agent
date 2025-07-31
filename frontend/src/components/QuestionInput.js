import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PaperAirplaneIcon,
  XMarkIcon,
  PlusIcon,
  PhotoIcon,
  DocumentIcon,
  MicrophoneIcon
} from '@heroicons/react/24/outline';
import { useQuery } from '../contexts/QueryContext';
import { translatePopularQuestion } from '../utils/translationUtils';

const QuestionInput = ({ onSubmit, placeholder = "Ask anything about Xinference..." }) => {
  const [question, setQuestion] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
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

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
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
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
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
          className={`relative border-2 rounded-2xl transition-all duration-200 ${
            isDragging
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-200 hover:border-gray-300 focus-within:border-primary-500'
          } ${state.isLoading ? 'opacity-50' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* File Upload Area */}
          {uploadedFiles.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 text-sm">
                    {file.type.startsWith('image/') ? (
                      <PhotoIcon className="h-4 w-4 text-blue-500" />
                    ) : (
                      <DocumentIcon className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="truncate max-w-32">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
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
              className="block w-full px-4 py-4 text-lg border-0 rounded-2xl resize-none placeholder-gray-400 focus:outline-none focus:ring-0 bg-transparent"
              style={{ minHeight: '60px', maxHeight: '200px' }}
              disabled={state.isLoading}
            />

            {/* Bottom Toolbar */}
            <div className="flex items-center justify-between px-4 pb-3">
              <div className="flex items-center gap-2">
                {/* Add Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                  title="Upload files"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>

                {/* Image Upload */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                  title="Upload image"
                >
                  <PhotoIcon className="h-5 w-5" />
                </button>

                {/* Document Upload */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                  title="Upload document"
                >
                  <DocumentIcon className="h-5 w-5" />
                </button>

                {/* Voice Input (placeholder) */}
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                  title="Voice input"
                  disabled
                >
                  <MicrophoneIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={(!question.trim() && uploadedFiles.length === 0) || state.isLoading}
                className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent rounded-lg transition-all"
              >
                <PaperAirplaneIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.log,.json"
            onChange={handleFileSelect}
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
