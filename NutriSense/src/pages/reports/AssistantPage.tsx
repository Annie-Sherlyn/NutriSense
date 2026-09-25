import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { NutriMote } from '../../components/animations/NutriMote';
import { assistantService } from '../../services/assistant.service';
import type { AssistantMessage } from '../../types';

const INITIAL_MESSAGES: AssistantMessage[] = [
  {
    id: 'msg-1',
    role: 'assistant',
    content:
      'Hello! I am your NutriSense companion. I can help explain your nutrient gaps, suggest snacks under your budget, or break down Indian food choices.',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    suggestions: [
      'What nutrient am I low on today?',
      'Suggest a protein-rich snack.',
      'What can I eat under ₹150?',
      'Why did you recommend this?',
    ],
  },
];

export const AssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<AssistantMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: AssistantMessage = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await assistantService.chat(text);
      const assistantMsg: AssistantMessage = {
        id: `msg-a-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        suggestions: response.suggestions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8.5rem)] pb-4">
      <PageHeader
        title="Ask NutriSense"
        subtitle="Conversational insight into your nutrient gaps, meal budgets, and food choices."
        className="mb-4"
      />

      {/* Chat Messages Log */}
      <Card
        padding="md"
        className="flex-1 overflow-y-auto flex flex-col gap-4 mb-4 border border-black/[0.06] dark:border-white/[0.08]"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-3xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                  isUser
                    ? 'bg-brand-light text-white dark:bg-brand-dark dark:text-ink-light rounded-tr-sm'
                    : 'bg-surface-2-light dark:bg-surface-2-dark text-ink-light dark:text-ink-dark rounded-tl-sm'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-1.5 mb-2 text-brand-light dark:text-brand-dark font-bold text-[11px]">
                    <NutriMote type="protein" mood="idle" size={18} />
                    <span>NutriSense Companion</span>
                  </div>
                )}
                {msg.content}
              </div>
              <span className="text-[10px] text-ink-muted-light dark:text-ink-muted-dark mt-1 px-1">
                {msg.timestamp}
              </span>

              {/* Suggestions chips if provided */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[85%]">
                  {msg.suggestions.map((sug) => (
                    <button
                      key={sug}
                      onClick={() => sendMessage(sug)}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-surface-2-light dark:bg-surface-2-dark hover:bg-brand-light/10 hover:text-brand-light dark:hover:text-brand-dark border border-black/5 dark:border-white/5 transition-all text-left"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-ink-muted-light animate-pulse p-2">
            <NutriMote type="fiber" mood="curious" size={20} />
            <span>Analyzing today's context…</span>
          </div>
        )}
      </Card>

      {/* Input Bar */}
      <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask a nutrition question (e.g. How much iron is in Sattu?)..."
          className="flex-1 px-4 py-3 rounded-full bg-surface-light dark:bg-surface-dark border border-black/10 dark:border-white/10 text-xs sm:text-sm text-ink-light dark:text-ink-dark placeholder:text-ink-muted-light dark:placeholder:text-ink-muted-dark shadow-soft focus:outline-none focus:ring-2 focus:ring-brand-light"
        />
        <Button
          type="submit"
          size="md"
          disabled={!inputText.trim() || isTyping}
          rightIcon={<Send className="w-4 h-4" />}
        >
          Send
        </Button>
      </form>
    </div>
  );
};

export default AssistantPage;
