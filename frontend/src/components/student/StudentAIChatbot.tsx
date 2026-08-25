'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PageHeader, Card, Badge, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { dataService } from '@/lib/dataService';
import { MarkdownMessage } from './MarkdownMessage';
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Lightbulb,
  Zap,
  Globe,
  CheckCircle2,
  Trash2,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  GraduationCap,
  Layers,
  Search,
  MessageSquare,
  ArrowRight,
  Radio,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  citations?: Array<{ source: string; page?: number; url: string; tier: string; license?: string }>;
  keyTerms?: string[];
  isStreaming?: boolean;
  mode?: 'grounded_llm' | 'extractive' | 'no_context';
}

const PRESET_QUESTIONS = [
  { text: 'Explain the Pythagoras Theorem with geometric proof and NCERT similarity relation.', board: 'CBSE', subject: 'Mathematics' },
  { text: 'Explain the mirror formula and sign conventions for concave mirrors in Class 10 Science.', board: 'CBSE', subject: 'Science' },
  { text: 'State the Fundamental Theorem of Arithmetic and explain the relation between HCF and LCM.', board: 'CBSE', subject: 'Mathematics' },
  { text: 'What are the main constitutional powers and jurisdictions of the Supreme Court in ICSE Civics?', board: 'ICSE', subject: 'History & Civics' },
  { text: 'What is the blueprint difference between GSEB Class 10 Mathematics Standard Code 12 and Basic Code 18?', board: 'GSEB', subject: 'Mathematics' },
  { text: 'Explain Gujarat Board Class 10 Gujarati Pratham Bhasha Vyakaran Samas and Chhand syllabus.', board: 'GSEB', subject: 'Gujarati' },
];

const BOARDS = ['ALL', 'CBSE', 'ICSE', 'GSEB'];

export const StudentAIChatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: "Hello Aarav! I am your **EduOS Class 10 AI Study Tutor**.\n\nI am connected directly to your official curriculum knowledge base spanning **NCERT, CBSE, CISCE, and GSEB** textbooks, syllabi, and sample question blueprints.\n\nAsk me any concept, formula, numerical method, or grammar rule, and I'll provide a live streamed explanation with exact verified citations! You can also tap the 🎙️ **Microphone** to ask questions with your voice.",
      timestamp: 'Just now',
      keyTerms: ['NCERT Official Textbooks', 'CBSE 2026 Curriculum', 'ICSE Treasure Chest', 'GSEB Standard vs Basic'],
      citations: [
        {
          source: 'NCERT Class 10 Official Textbooks',
          page: 1,
          url: 'https://ncert.nic.in',
          tier: 'official',
          license: 'Government Open Access (NCERT Public Domain)',
        },
      ],
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [selectedBoard, setSelectedBoard] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-IN'; // Optimized for Indian English/Hindi

        recognition.onstart = () => {
          setIsListening(true);
          toast('Listening...', 'info', 'Speak your question clearly');
        };

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setInputQuery(transcript);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error !== 'no-speech') {
            toast('Voice recognition error', 'error', event.error);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!speechSupported || !recognitionRef.current) {
      toast('Speech-to-Text Not Supported', 'warning', 'Please use Chrome, Edge, or Safari for voice input.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const q = textToSend || inputQuery;
    if (!q.trim() || loading) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMsgId = `user-${Date.now()}`;
    const aiMsgId = `ai-${Date.now()}`;

    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: q.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const initialAiMsg: ChatMessage = {
      id: aiMsgId,
      sender: 'ai',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, initialAiMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const response = await dataService.streamRagTutor(
        q,
        (_token, fullText) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === aiMsgId ? { ...msg, text: fullText } : msg)),
          );
        },
        {
          board: selectedBoard !== 'ALL' ? selectedBoard : undefined,
          subject: selectedSubject !== 'ALL' ? selectedSubject : undefined,
        },
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                text: response.synthesized_answer,
                citations: response.citations,
                keyTerms: response.key_formulae_or_terms,
                mode: response.mode,
                isStreaming: false,
              }
            : msg,
        ),
      );
    } catch (err) {
      console.error('Streaming Chatbot error:', err);
      toast('Failed to get response', 'error', 'Could not query RAG knowledge base.');
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                text: "I encountered an issue synthesizing the answer. Please try again or rephrase your topic.",
                isStreaming: false,
              }
            : msg,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast('Copied to clipboard', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text: string, id: string) => {
    if (!('speechSynthesis' in window)) {
      toast('Speech not supported', 'warning', 'Your browser does not support text-to-speech.');
      return;
    }

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#$]/g, '').replace(/\[.*?\]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
    toast('Narrating explanation...', 'info');
  };

  const handleClearChat = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeakingId(null);
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'ai',
        text: "Chat cleared! What Class 10 topic would you like to study next?",
        timestamp: 'Just now',
      },
    ]);
    toast('Chat reset', 'info');
  };

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-140px)]">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <PageHeader
          title="Class 10 AI Study Chatbot & Voice Tutor"
          subtitle="Answers grounded in official NCERT, CBSE, ICSE & GSEB textbooks — every claim carries a verified page citation"
          actions={
            <div className="flex items-center gap-2">
              <Badge tone="success" className="gap-1.5 shadow-2xs">
                <CheckCircle2 size={12} /> Verified Sources
              </Badge>
              <button
                onClick={handleClearChat}
                className="btn-tertiary text-xs gap-1.5 py-1 px-2.5 text-text-tertiary hover:text-danger"
              >
                <Trash2 size={13} /> Clear
              </button>
            </div>
          }
        />

        {/* Board Selector */}
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-surface p-1 shadow-2xs">
          <span className="text-micro font-bold text-text-tertiary px-2 uppercase">Board:</span>
          {BOARDS.map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBoard(b)}
              className={cn(
                'rounded-lg px-2.5 py-1 text-micro font-bold transition-colors',
                selectedBoard === b
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-text-secondary hover:bg-muted',
              )}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Conversation Thread */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-3 max-w-[90%]',
              msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start flex-row',
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                'grid h-9 w-9 shrink-0 place-items-center rounded-xl font-bold shadow-2xs text-white text-xs',
                msg.sender === 'user' ? 'bg-primary' : 'bg-linear-to-br from-primary to-info',
              )}
            >
              {msg.sender === 'user' ? 'AS' : <Bot size={18} />}
            </div>

            {/* Message Bubble Card */}
            <div
              className={cn(
                'flex flex-col gap-2.5 rounded-2xl p-4.5 shadow-2xs text-body leading-relaxed transition-all',
                msg.sender === 'user'
                  ? 'bg-primary text-white rounded-tr-xs'
                  : 'bg-surface border border-border/80 text-foreground rounded-tl-xs',
              )}
            >
              <div className="flex items-center justify-between gap-2 border-b border-border/20 pb-1.5 text-micro opacity-80">
                <span className="flex items-center gap-1.5 font-bold">
                  {msg.sender === 'user' ? 'Aarav Sharma (You)' : 'EduOS AI Tutor'}
                  {msg.sender === 'ai' && msg.mode && !msg.isStreaming && (
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-semibold not-italic',
                        msg.mode === 'grounded_llm' && 'bg-primary-soft text-primary',
                        msg.mode === 'extractive' && 'bg-info-soft text-info',
                        msg.mode === 'no_context' && 'bg-warning-soft text-warning',
                      )}
                    >
                      {msg.mode === 'grounded_llm' ? 'AI Synthesis' : msg.mode === 'extractive' ? 'Textbook Excerpts' : 'Not in Knowledge Base'}
                    </span>
                  )}
                </span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Body — plain while streaming (avoids half-parsed
                  markdown flicker), rendered Markdown + LaTeX once complete */}
              <div className="text-meta">
                {!msg.text && msg.isStreaming && (
                  <span className="text-text-tertiary">Searching official textbooks…</span>
                )}
                {msg.text && (msg.sender === 'user' || msg.isStreaming) && (
                  <span className="whitespace-pre-wrap">{msg.text}</span>
                )}
                {msg.text && msg.sender === 'ai' && !msg.isStreaming && (
                  <MarkdownMessage content={msg.text} />
                )}
                {msg.isStreaming && msg.text && (
                  <span className="inline-block w-2 h-4 ml-0.5 bg-primary animate-pulse align-middle" />
                )}
              </div>

              {/* Key Formulae / Terms */}
              {msg.keyTerms && msg.keyTerms.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1.5 pt-2 border-t border-border/30">
                  {msg.keyTerms.map((term, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-0.5 text-micro font-bold text-primary"
                    >
                      <Sparkles size={11} /> {term}
                    </span>
                  ))}
                </div>
              )}

              {/* Verified Citations Drawer */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2 rounded-xl border border-primary/20 bg-surface-muted p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-micro font-bold text-text-tertiary uppercase">
                    <span className="flex items-center gap-1 text-primary">
                      <BookOpen size={13} /> Verified Citations ({msg.citations.length})
                    </span>
                    <Badge tone="success" className="text-[10px]">
                      <CheckCircle2 size={10} /> 100% Curated Source
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {msg.citations.map((cit, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-2 rounded-lg bg-surface p-2 border border-border/50 text-micro"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge tone={cit.tier === 'official' ? 'primary' : 'neutral'}>
                            {cit.tier === 'official' ? 'Official' : 'Reference'}
                          </Badge>
                          <span className="font-bold text-foreground truncate">{cit.source}</span>
                          <span className="text-text-tertiary shrink-0">· Page {cit.page}</span>
                        </div>

                        <a
                          href={cit.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary font-bold hover:underline shrink-0"
                        >
                          <span>Open</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bubble Action Controls for AI Messages */}
              {msg.sender === 'ai' && !msg.isStreaming && msg.text && (
                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <button
                    onClick={() => handleSpeak(msg.text, msg.id)}
                    className={cn(
                      'btn-tertiary text-micro py-1 px-2 gap-1 text-text-tertiary hover:text-foreground transition-colors',
                      speakingId === msg.id && 'bg-primary-soft text-primary font-bold',
                    )}
                    title={speakingId === msg.id ? 'Stop Narration' : 'Read Aloud'}
                  >
                    {speakingId === msg.id ? (
                      <>
                        <VolumeX size={13} className="animate-pulse" /> Stop Voice
                      </>
                    ) : (
                      <>
                        <Volume2 size={13} /> Read Aloud
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleCopy(msg.text, msg.id)}
                    className="btn-tertiary text-micro py-1 px-2 gap-1 text-text-tertiary hover:text-foreground"
                    title="Copy Answer"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check size={13} className="text-success" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={13} /> Copy
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && messages.length > 0 && !messages[messages.length - 1]?.text && (
          <div className="flex items-center gap-3 self-start">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-linear-to-br from-primary to-info text-white">
              <Bot size={18} className="animate-spin" />
            </div>
            <div className="rounded-2xl bg-surface border border-border p-3.5 shadow-2xs text-meta text-text-secondary flex items-center gap-2">
              <Search size={15} className="text-primary animate-pulse" />
              <span>Searching official textbook chunks…</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Inquiries / Prompt Chips */}
      <div className="flex flex-col gap-2 pt-1 border-t border-border">
        <span className="text-micro font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1">
          <Lightbulb size={12} /> Suggested Topics:
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {PRESET_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => {
                setSelectedBoard(q.board);
                handleSendMessage(q.text);
              }}
              className="shrink-0 group inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-surface px-3 py-1.5 text-micro font-medium text-text-secondary transition-all hover:border-primary/50 hover:bg-primary-soft hover:text-primary shadow-2xs"
            >
              <Badge tone={q.board === 'CBSE' ? 'primary' : q.board === 'ICSE' ? 'info' : 'warning'}>
                {q.board}
              </Badge>
              <span className="truncate max-w-[280px]">{q.text}</span>
              <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>

      {/* Voice Recognition Active Bar */}
      {isListening && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-danger/40 bg-danger-soft px-3.5 py-2 text-danger animate-pulse">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Mic size={16} className="animate-bounce text-danger" />
            <span>Listening to your voice in real time... Speak your question.</span>
          </div>
          <button
            onClick={toggleVoiceInput}
            className="rounded-md bg-danger text-white text-[11px] font-bold px-2 py-0.5 hover:opacity-90"
          >
            Stop
          </button>
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-2 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask a question about any Class 10 subject, formula, or theorem (or tap Mic)..."
          className="flex-1 bg-transparent px-3 py-2 text-body text-foreground placeholder:text-text-tertiary focus:outline-hidden"
        />

        {/* Microphone Voice Button */}
        <button
          type="button"
          onClick={toggleVoiceInput}
          className={cn(
            'grid h-9 w-9 place-items-center rounded-xl transition-all',
            isListening
              ? 'bg-danger text-white ring-4 ring-danger/20 animate-pulse'
              : 'text-text-tertiary hover:bg-muted hover:text-foreground',
          )}
          title={isListening ? 'Stop Listening' : 'Speak Question (Voice Input)'}
          aria-label="Voice Input"
        >
          {isListening ? <MicOff size={17} /> : <Mic size={17} />}
        </button>

        {/* Submit Button */}
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputQuery.trim() || loading}
          className="btn-primary shrink-0 gap-1.5 px-4 py-2 text-meta font-bold shadow-xs disabled:opacity-50"
        >
          <Send size={15} />
          <span>Ask AI</span>
        </button>
      </div>
    </div>
  );
};
