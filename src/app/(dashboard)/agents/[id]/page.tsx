'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ArrowLeft, Bot, Send, Plus, MessageSquare, Sparkles,
  Loader2, ChevronRight, Clock, Mic, MicOff, Volume2, VolumeX,
} from 'lucide-react';
import clsx from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Agent {
  id: string;
  name: string;
  agent_role: string | null;
  status: string;
  avatar_url: string | null;
  agent_config: { instructions?: string; model?: string } | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tokens_used: number | null;
  created_at: string;
}

interface Conversation {
  id: string;
  started_at: string;
  ended_at: string | null;
  messages: Message[];
  agent?: Agent;
  _count?: { messages: number };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function isCeo(agent: Agent | null) {
  return agent?.agent_role === 'ceo';
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AgentChatPage() {
  const { id: agentId } = useParams<{ id: string }>();
  const router = useRouter();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingAgent, setLoadingAgent] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // ── TTS helper ───────────────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    // Limpia markdown básico antes de hablar
    const clean = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/[•·▸]/g, '')
      .slice(0, 900); // límite práctico
    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang = 'es-MX';
    utt.rate = 1.05;
    // Preferir voz en español si está disponible
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang.startsWith('es'));
    if (esVoice) utt.voice = esVoice;
    window.speechSynthesis.speak(utt);
  }, []);

  // ── Load agent info ──────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      api.get<any>('/team-slots'),
      api.get<Conversation[]>(`/agents/${agentId}/conversations`),
    ])
      .then(([slotsData, convs]) => {
        const slots = Array.isArray(slotsData) ? slotsData : (slotsData.data ?? []);
        const found = slots.find((s: any) => s.id === agentId);
        setAgent(found ?? null);
        setConversations(Array.isArray(convs) ? convs : []);
      })
      .catch(() => {})
      .finally(() => setLoadingAgent(false));
  }, [agentId]);

  // ── Load conversation messages ────────────────────────────────────────────
  const openConversation = useCallback(async (conv: Conversation) => {
    setActiveConversation(conv);
    setLoadingMessages(true);
    try {
      const full = await api.get<Conversation>(`/agents/${agentId}/conversations/${conv.id}`);
      setMessages(full.messages ?? []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [agentId]);

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // ── Auto-resize textarea ──────────────────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  // ── Voice input ──────────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Tu browser no soporta reconocimiento de voz. Usa Chrome o Edge.'); return; }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SR();
    recognition.lang = 'es-MX';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results as SpeechRecognitionResultList)
        .map((r: SpeechRecognitionResult) => r[0].transcript)
        .join('');
      setInput(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.start();
  }, [isListening]);

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const optimisticMsg: Message = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content: text,
      tokens_used: null,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInput('');
    setSending(true);

    try {
      const result = await api.post<{
        conversation_id: string;
        response: string;
        tokens_used: number;
      }>(`/agents/${agentId}/conversations/chat`, {
        message: text,
        session_id: activeConversation?.id,
      });

      const assistantMsg: Message = {
        id: `resp-${Date.now()}`,
        role: 'assistant',
        content: result.response,
        tokens_used: result.tokens_used,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (autoSpeak) speak(result.response);

      // Si era conversación nueva, establecerla como activa
      if (!activeConversation) {
        const newConv: Conversation = {
          id: result.conversation_id,
          started_at: new Date().toISOString(),
          ended_at: null,
          messages: [],
        };
        setActiveConversation(newConv);
        setConversations((prev) => [newConv, ...prev]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Error: ${err.message ?? 'No pude responder en este momento.'}`,
          tokens_used: null,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewConversation = () => {
    setActiveConversation(null);
    setMessages([]);
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loadingAgent) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isAtlas = isCeo(agent);

  return (
    <div className="h-screen bg-gray-950 flex overflow-hidden">

      {/* ── Sidebar izquierdo ─────────────────────────────────────────────── */}
      <div className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">

        {/* Agent header */}
        <div className={clsx(
          'p-4 border-b border-gray-800',
          isAtlas && 'bg-gradient-to-b from-indigo-950/60 to-transparent',
        )}>
          <button
            onClick={() => router.push('/agents')}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors mb-3"
          >
            <ArrowLeft size={13} /> Agentes
          </button>

          <div className="flex items-center gap-3">
            <div className={clsx(
              'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
              isAtlas
                ? 'bg-indigo-600/30 border border-indigo-500/40'
                : 'bg-gray-800 border border-gray-700',
            )}>
              {isAtlas
                ? <Sparkles size={16} className="text-indigo-300" />
                : <Bot size={16} className="text-gray-400" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{agent?.name ?? 'Agente'}</p>
              <p className="text-[10px] text-gray-500">
                {isAtlas ? 'CEO Agent' : (agent?.agent_role?.replace('_', ' ') ?? 'Agente IA')}
              </p>
            </div>
          </div>
        </div>

        {/* Nueva conversación */}
        <div className="p-3 border-b border-gray-800">
          <button
            onClick={startNewConversation}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
          >
            <Plus size={14} />
            Nueva conversación
          </button>
        </div>

        {/* Lista de conversaciones */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {conversations.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare size={18} className="text-gray-700 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Sin conversaciones aún.</p>
            </div>
          )}
          {conversations.map((conv) => {
            const isActive = activeConversation?.id === conv.id;
            return (
              <button
                key={conv.id}
                onClick={() => openConversation(conv)}
                className={clsx(
                  'w-full text-left px-3 py-2.5 rounded-lg transition-colors group',
                  isActive
                    ? 'bg-indigo-600/20 border border-indigo-500/30'
                    : 'hover:bg-gray-800 border border-transparent',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={clsx(
                    'text-xs font-medium truncate',
                    isActive ? 'text-indigo-300' : 'text-gray-300',
                  )}>
                    Conversación
                  </p>
                  <span className="text-[10px] text-gray-600 flex-shrink-0 flex items-center gap-0.5">
                    <Clock size={9} />
                    {timeAgo(conv.started_at)}
                  </span>
                </div>
                {conv._count && (
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {conv._count.messages} mensajes
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Área principal de chat ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Barra superior con toggle de voz */}
        <div className="flex-shrink-0 flex items-center justify-end px-4 py-2 border-b border-gray-800/50">
          <button
            onClick={() => {
              setAutoSpeak(v => !v);
              if (autoSpeak) window.speechSynthesis?.cancel();
            }}
            title={autoSpeak ? 'Desactivar voz' : 'Activar voz — Atlas habla sus respuestas'}
            className={clsx(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
              autoSpeak
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40'
                : 'text-gray-600 hover:text-gray-400 hover:bg-gray-800',
            )}
          >
            {autoSpeak ? <Volume2 size={13} /> : <VolumeX size={13} />}
            {autoSpeak ? 'Voz activa' : 'Voz'}
          </button>
        </div>

        {/* Empty state — sin conversación activa */}
        {!activeConversation && messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <div className={clsx(
              'w-16 h-16 rounded-2xl flex items-center justify-center mb-4',
              isAtlas
                ? 'bg-indigo-600/20 border border-indigo-500/30'
                : 'bg-gray-800 border border-gray-700',
            )}>
              {isAtlas
                ? <Sparkles size={26} className="text-indigo-400" />
                : <Bot size={26} className="text-gray-500" />}
            </div>
            <h2 className="text-lg font-bold text-white mb-1">
              {isAtlas ? `Hola, soy ${agent?.name ?? 'Atlas'}` : `Hola, soy ${agent?.name}`}
            </h2>
            <p className="text-sm text-gray-500 max-w-sm mb-6">
              {isAtlas
                ? 'Tu socio estratégico de IA. Puedo ayudarte con tareas, calendar, email, métricas de equipo y mucho más.'
                : (agent?.agent_config?.instructions?.slice(0, 120) ?? 'Escribe algo para comenzar.')}
            </p>

            {isAtlas && (
              <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                {[
                  '¿Cuáles son mis tareas urgentes?',
                  '¿Qué tengo en el calendario hoy?',
                  'Dame un resumen de productividad',
                  '¿Cómo está el pipeline de ventas?',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => { setInput(suggestion); textareaRef.current?.focus(); }}
                    className="text-left px-3 py-2.5 rounded-lg bg-gray-900 border border-gray-800 hover:border-indigo-500/40 hover:bg-gray-800 transition-colors group"
                  >
                    <p className="text-xs text-gray-400 group-hover:text-white transition-colors leading-relaxed">{suggestion}</p>
                    <ChevronRight size={11} className="text-gray-600 group-hover:text-indigo-400 mt-1 transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {(activeConversation || messages.length > 0) && (
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {loadingMessages ? (
              <div className="flex justify-center py-12">
                <Loader2 size={20} className="text-indigo-500 animate-spin" />
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={clsx('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {/* Avatar agente */}
                  {msg.role === 'assistant' && (
                    <div className={clsx(
                      'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                      isAtlas
                        ? 'bg-indigo-600/30 border border-indigo-500/30'
                        : 'bg-gray-800 border border-gray-700',
                    )}>
                      {isAtlas
                        ? <Sparkles size={13} className="text-indigo-400" />
                        : <Bot size={13} className="text-gray-400" />}
                    </div>
                  )}

                  <div className={clsx('max-w-[70%] space-y-1', msg.role === 'user' && 'items-end flex flex-col')}>
                    <div className={clsx(
                      'px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                        : 'bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700/50',
                    )}>
                      {msg.content}
                    </div>
                    <p className="text-[10px] text-gray-600 px-1">
                      {formatTime(msg.created_at)}
                      {msg.tokens_used ? ` · ${msg.tokens_used.toLocaleString()} tokens` : ''}
                    </p>
                  </div>
                </div>
              ))
            )}

            {/* Typing indicator */}
            {sending && (
              <div className="flex gap-3 justify-start">
                <div className={clsx(
                  'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                  isAtlas
                    ? 'bg-indigo-600/30 border border-indigo-500/30'
                    : 'bg-gray-800 border border-gray-700',
                )}>
                  {isAtlas
                    ? <Sparkles size={13} className="text-indigo-400" />
                    : <Bot size={13} className="text-gray-400" />}
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-gray-800 border border-gray-700/50">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-800 bg-gray-950">
          <div className="flex items-end gap-3 bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3 focus-within:border-indigo-500/60 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? '🎙️ Escuchando…' : `Escribe o habla con ${agent?.name ?? 'Atlas'}…`}
              rows={1}
              disabled={sending}
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 resize-none outline-none leading-relaxed disabled:opacity-50"
            />

            {/* Mic button */}
            <button
              onClick={toggleMic}
              disabled={sending}
              title={isListening ? 'Detener' : 'Hablar'}
              className={clsx(
                'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all',
                isListening
                  ? 'bg-red-500 hover:bg-red-400 text-white animate-pulse'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white',
              )}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>

            {/* Send button */}
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className={clsx(
                'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all',
                input.trim() && !sending
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed',
              )}
            >
              {sending
                ? <Loader2 size={14} className="animate-spin" />
                : <Send size={14} />}
            </button>
          </div>
          <p className="text-[10px] text-gray-700 text-center mt-2">
            Enter para enviar · Shift+Enter salto · 🎙️ micrófono para hablar
          </p>
        </div>
      </div>
    </div>
  );
}
