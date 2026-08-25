'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Badge, Card, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { dataService } from '@/lib/dataService';
import { MarkdownMessage } from './MarkdownMessage';
import {
  Bot,
  Send,
  Sparkles,
  X,
  Maximize2,
  ExternalLink,
  BookOpen,
  Mic,
  MicOff,
} from 'lucide-react';

interface QuickMsg {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  isStreaming?: boolean;
  citations?: Array<{ source: string; page?: number; url: string }>;
}

export const FloatingAIChatbot: React.FC<{ onOpenFullPage?: () => void }> = ({ onOpenFullPage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<QuickMsg[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hi Aarav! I'm your **Class 10 AI Tutor**. Ask me any concept, formula, or textbook question across CBSE, ICSE, or GSEB.",
    },
  ]);

  const endRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Speech Recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setQuery(transcript);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      toast('Voice input not supported', 'warning');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSend = async (customQ?: string) => {
    const q = customQ || query;
    if (!q.trim() || loading) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMsgId = `u-${Date.now()}`;
    const aiMsgId = `ai-${Date.now()}`;

    const userMsg: QuickMsg = {
      id: userMsgId,
      sender: 'user',
      text: q.trim(),
    };

    const initialAiMsg: QuickMsg = {
      id: aiMsgId,
      sender: 'ai',
      text: '',
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, initialAiMsg]);
    setQuery('');
    setLoading(true);

    try {
      const response = await dataService.streamRagTutor(
        q,
        (_token, fullText) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === aiMsgId ? { ...msg, text: fullText } : msg)),
          );
        },
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                text: response.synthesized_answer,
                citations: response.citations,
                isStreaming: false,
              }
            : msg,
        ),
      );
    } catch (e) {
      console.error(e);
      toast('Failed to get answer', 'error');
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                text: "Sorry, I couldn't synthesize a response right now.",
                isStreaming: false,
              }
            : msg,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="mb-3 w-[360px] sm:w-[410px] h-[500px] rounded-2xl border border-border/80 bg-surface shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-linear-to-r from-primary-soft to-info-soft p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white shadow-2xs">
                <Bot size={17} />
              </div>
              <div>
                <h4 className="text-meta font-bold text-foreground flex items-center gap-1.5">
                  EduOS AI Tutor <Badge tone="success" className="text-[10px]">Verified</Badge>
                </h4>
                <p className="text-micro text-text-secondary">Class 10 Syllabus Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {onOpenFullPage && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenFullPage();
                  }}
                  className="rounded-md p-1.5 text-text-tertiary hover:bg-muted hover:text-foreground"
                  title="Expand to Full Page"
                >
                  <Maximize2 size={14} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1.5 text-text-tertiary hover:bg-muted hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-3 text-meta leading-relaxed">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'flex flex-col gap-1.5 max-w-[90%] rounded-xl p-3 shadow-2xs text-meta',
                  m.sender === 'user'
                    ? 'self-end bg-primary text-white rounded-tr-xs'
                    : 'self-start bg-surface-muted border border-border/60 text-foreground rounded-tl-xs',
                )}
              >
                <div>
                  {m.sender === 'user' || m.isStreaming ? (
                    <span className="whitespace-pre-wrap">{m.text}</span>
                  ) : (
                    <MarkdownMessage content={m.text} />
                  )}
                  {m.isStreaming && <span className="inline-block w-1.5 h-3.5 ml-1 bg-primary animate-pulse align-middle" />}
                </div>

                {m.citations && m.citations.length > 0 && !m.isStreaming && (
                  <div className="mt-1 flex flex-col gap-1 border-t border-border/40 pt-1.5 text-micro">
                    <span className="font-bold text-text-tertiary uppercase text-[10px]">Cited Source:</span>
                    {m.citations.map((c, i) => (
                      <a
                        key={i}
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary font-semibold hover:underline truncate"
                      >
                        <BookOpen size={11} /> {c.source} (p. {c.page})
                        <ExternalLink size={10} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && messages[messages.length - 1]?.text === '' && (
              <div className="flex items-center gap-2 self-start rounded-xl bg-surface-muted p-2.5 text-micro text-text-secondary">
                <Bot size={14} className="animate-spin text-primary" />
                <span>Searching official textbooks...</span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick Prompts */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 border-t border-border bg-surface-muted overflow-x-auto scrollbar-none">
            <button
              onClick={() => handleSend('Explain Pythagoras theorem with proof')}
              className="shrink-0 rounded-md bg-surface px-2 py-1 text-micro text-text-secondary border border-border hover:text-primary"
            >
              Pythagoras Theorem
            </button>
            <button
              onClick={() => handleSend('Mirror formula and sign conventions')}
              className="shrink-0 rounded-md bg-surface px-2 py-1 text-micro text-text-secondary border border-border hover:text-primary"
            >
              Mirror Formula
            </button>
            <button
              onClick={() => handleSend('Fundamental Theorem of Arithmetic')}
              className="shrink-0 rounded-md bg-surface px-2 py-1 text-micro text-text-secondary border border-border hover:text-primary"
            >
              Real Numbers
            </button>
          </div>

          {/* Voice bar if listening */}
          {isListening && (
            <div className="flex items-center justify-between bg-danger-soft px-3 py-1 text-danger text-[11px] font-bold animate-pulse border-t border-danger/30">
              <span className="flex items-center gap-1.5"><Mic size={13} className="animate-bounce" /> Listening to voice...</span>
              <button onClick={toggleMic} className="underline">Cancel</button>
            </div>
          )}

          {/* Input Box */}
          <div className="flex items-center gap-2 p-2.5 border-t border-border bg-surface">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask formula, theorem, or question..."
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-meta placeholder:text-text-tertiary focus:outline-hidden focus:border-primary"
            />
            <button
              type="button"
              onClick={toggleMic}
              className={cn(
                'rounded-lg p-2 text-text-tertiary hover:bg-muted transition-colors',
                isListening && 'bg-danger text-white hover:bg-danger animate-pulse',
              )}
              title="Voice Input"
            >
              {isListening ? <MicOff size={15} /> : <Mic size={15} />}
            </button>
            <button
              onClick={() => handleSend()}
              disabled={!query.trim() || loading}
              className="btn-primary py-1.5 px-3 text-micro font-bold shrink-0"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2 rounded-full bg-linear-to-r from-primary to-info px-4 py-3 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105"
      >
        <div className="relative">
          <Bot size={20} />
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-white" />
        </div>
        <span className="text-meta font-bold hidden sm:inline">Ask AI Tutor</span>
        <Sparkles size={14} className="animate-pulse" />
      </button>
    </div>
  );
};
