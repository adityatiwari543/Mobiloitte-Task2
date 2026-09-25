import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { Button } from '../components/common/Button.js';
import { BackButton } from '../components/common/BackButton.js';
import { Sparkles, Send, Bot, User, Loader2 } from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
}

export const CandidateAIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: "Hello! I am your JobConnect AI Career Assistant. Ask me how to optimize your profile, discover relevant engineering roles, or prepare for technical interviews.",
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');

  const chatMutation = useMutation({
    mutationFn: async (query: string) => {
      const res = await api.post('/ai/chat', { query });
      return res.data?.data?.response;
    },
    onSuccess: (assistantText) => {
      setMessages((prev) => [...prev, { sender: 'assistant', text: assistantText }]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Sorry, I encountered an issue processing your request. Please try again.',
        },
      ]);
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputQuery.trim();
    if (!query || chatMutation.isPending) return;

    setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    setInputQuery('');
    chatMutation.mutate(query);
  };

  const samplePrompts = [
    'How can I improve my profile for senior frontend developer jobs?',
    'What skills are trending for backend engineering roles in 2026?',
    'How should I prepare for a TypeScript and Node.js technical interview?',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <BackButton label="Back to Dashboard" fallbackUrl="/candidate/dashboard" />
      </div>

      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">JobConnect AI Career Assistant</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Context-aware guidance grounded in actual platform listings and verified skills</p>
        </div>
      </div>

      {/* Suggested Prompts Pills */}
      <div className="flex flex-wrap gap-2">
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              setInputQuery(p);
            }}
            className="text-left text-xs bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
          >
            💡 {p}
          </button>
        ))}
      </div>

      {/* Chat Thread Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[520px] overflow-hidden transition-colors">
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs ${
                  m.sender === 'user' ? 'bg-blue-600' : 'bg-purple-600'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl text-xs sm:text-sm max-w-xl leading-relaxed whitespace-pre-line ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-700'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {chatMutation.isPending && (
            <div className="flex items-center space-x-2 text-xs text-slate-400 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              <span>Analyzing profile and preparing advice...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 flex gap-2">
          <input
            type="text"
            placeholder="Ask anything about job search, resume tips, or role preparation..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={chatMutation.isPending}
            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={chatMutation.isPending}
            disabled={!inputQuery.trim() || chatMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
