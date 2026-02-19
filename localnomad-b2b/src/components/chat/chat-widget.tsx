'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Globe, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useShallow } from 'zustand/react/shallow';
import { useChatStore } from '@/store/chat-store';

const LANGUAGES = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'uz', label: 'Oʻzbekcha' },
  { code: 'mn', label: 'Монгол' },
];

const ROLE_STYLES: Record<string, string> = {
  user: 'bg-brand-500 text-white ml-8',
  assistant: 'bg-gray-100 text-gray-800 mr-8',
  staff: 'bg-emerald-50 text-emerald-800 mr-8 border border-emerald-200',
};

const ROLE_LABELS: Record<string, string> = {
  assistant: 'AI 상담',
  staff: '담당자',
};

export const ChatWidget = () => {
  const {
    messages,
    language,
    isOpen,
    isTyping,
    error,
    setIsOpen,
    setLanguage,
    sendMessage,
    clearSession,
  } = useChatStore(useShallow((s) => ({
    messages: s.messages,
    language: s.language,
    isOpen: s.isOpen,
    isTyping: s.isTyping,
    error: s.error,
    setIsOpen: s.setIsOpen,
    setLanguage: s.setLanguage,
    sendMessage: s.sendMessage,
    clearSession: s.clearSession,
  })));

  const [input, setInput] = useState('');
  const [showLangSelector, setShowLangSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;
    setInput('');
    void sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-brand-700"
        aria-label="상담하기"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[500px] w-[400px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between bg-brand-600 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm font-semibold">AI 유학생 상담</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Language selector */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-brand-500"
              onClick={() => setShowLangSelector(!showLangSelector)}
            >
              <Globe className="h-4 w-4" />
            </Button>
            {showLangSelector && (
              <div className="absolute right-0 top-9 z-10 w-36 rounded-lg border bg-white py-1 shadow-lg">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    className={`flex w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 ${
                      language === lang.code ? 'font-semibold text-brand-600' : 'text-gray-700'
                    }`}
                    onClick={() => {
                      setLanguage(lang.code);
                      setShowLangSelector(false);
                    }}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* New session */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-brand-500"
            onClick={clearSession}
            title="새 대화"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          {/* Close */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-brand-500"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-gray-400">
            <MessageCircle className="mb-2 h-10 w-10 text-gray-300" />
            <p>유학생 비자 관련 질문을 입력해 주세요.</p>
            <p className="mt-1 text-xs">
              비자 연장, 아르바이트, 주소 변경 등
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="max-w-[85%]">
              {msg.role !== 'user' && (
                <span className="mb-0.5 block text-[10px] font-medium text-gray-400">
                  {ROLE_LABELS[msg.role] ?? msg.role}
                </span>
              )}
              <div
                className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  ROLE_STYLES[msg.role] ?? ROLE_STYLES['assistant']
                } ${msg.isEscalated ? 'border-2 border-amber-300 bg-amber-50 text-amber-800' : ''}`}
              >
                {/* Render with line breaks */}
                {msg.content.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < msg.content.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-1 text-[10px] text-gray-400">
                  출처: {msg.sources.join(', ')}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="mr-8 rounded-xl bg-gray-100 px-4 py-2">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center text-xs text-red-500">{error}</div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t bg-white px-3 py-2.5">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="질문을 입력하세요..."
            className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-300 focus:bg-white"
            maxLength={2000}
            disabled={isTyping}
          />
          <Button
            size="icon"
            className="h-9 w-9 rounded-lg bg-brand-600 hover:bg-brand-700"
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">보내기</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
