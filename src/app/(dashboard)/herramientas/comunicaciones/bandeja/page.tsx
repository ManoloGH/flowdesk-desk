'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, User, MessageSquare, Trash2, RefreshCw } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';
const POLL_MS = 2000;

// ─── tipos ────────────────────────────────────────────────────────────────────

interface ConvSummary {
  id: string;
  phone: string;
  contactName: string;
  mode: 'AI' | 'HUMAN';
  lastMessage: string;
  lastRole: string | null;
  timeAgo: string;
}

interface BotMessage {
  id: string;
  role: 'user' | 'assistant' | 'human';
  content: string;
  created_at: string;
}

interface ConvDetail {
  conversation: { id: string; phone: string; contactName: string; mode: 'AI' | 'HUMAN' };
  messages: BotMessage[];
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function authHeader(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('fd_access') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...authHeader(), ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

// ─── página ───────────────────────────────────────────────────────────────────

export default function BandejaPage() {
  const [conversations, setConversations] = useState<ConvSummary[]>([]);
  const [selected, setSelected]           = useState<string | null>(null);
  const [detail, setDetail]               = useState<ConvDetail | null>(null);
  const [draft, setDraft]                 = useState('');
  const [sending, setSending]             = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // polling: lista
  const fetchConversations = useCallback(async () => {
    try {
      const data: ConvSummary[] = await apiFetch('/communications/bot/conversations');
      setConversations(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchConversations();
    const id = setInterval(fetchConversations, POLL_MS);
    return () => clearInterval(id);
  }, [fetchConversations]);

  // polling: mensajes del chat activo
  const fetchDetail = useCallback(async () => {
    if (!selected) return;
    try {
      const data: ConvDetail = await apiFetch(`/communications/bot/conversations/${selected}/messages`);
      setDetail(data);
    } catch {}
  }, [selected]);

  useEffect(() => {
    if (!selected) { setDetail(null); return; }
    fetchDetail();
    const id = setInterval(fetchDetail, POLL_MS);
    return () => clearInterval(id);
  }, [selected, fetchDetail]);

  // auto-scroll al fondo
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [detail?.messages.length]);

  // ─── acciones ─────────────────────────────────────────────────────────────

  async function handleModeToggle(mode: 'AI' | 'HUMAN') {
    if (!selected) return;
    try {
      await apiFetch(`/communications/bot/conversations/${selected}/mode`, {
        method: 'POST',
        body: JSON.stringify({ mode }),
      });
      fetchDetail();
      fetchConversations();
    } catch {}
  }

  async function handleSend() {
    if (!selected || !draft.trim() || sending) return;
    setSending(true);
    try {
      await apiFetch(`/communications/bot/conversations/${selected}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: draft.trim() }),
      });
      setDraft('');
      fetchDetail();
      fetchConversations();
    } catch {} finally {
      setSending(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta conversación?')) return;
    try {
      await apiFetch(`/communications/bot/conversations/${id}`, { method: 'DELETE' });
      if (selected === id) { setSelected(null); setDetail(null); }
      fetchConversations();
    } catch {}
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 flex-shrink-0 border-r border-white/5 flex flex-col">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400">
            Conversaciones · {conversations.length}
          </span>
          <button onClick={fetchConversations} className="text-gray-600 hover:text-gray-400 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="px-4 py-8 text-center text-[11px] text-gray-600">
              No hay conversaciones todavía.<br />
              Envía un mensaje al número del agente desde otro WhatsApp.
            </div>
          ) : (
            conversations.map(c => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`w-full text-left px-4 py-3 border-b border-white/[0.04] transition-colors hover:bg-white/5 ${
                  selected === c.id ? 'bg-white/8' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium text-white truncate flex-1 mr-2">
                    {c.contactName}
                  </span>
                  <ModeBadge mode={c.mode} />
                </div>
                {c.phone !== c.contactName && (
                  <p className="text-[10px] text-gray-600 font-mono mb-0.5">+{c.phone}</p>
                )}
                <p className="text-[11px] text-gray-500 truncate">{c.lastMessage || '—'}</p>
                <p className="text-[10px] text-gray-700 mt-0.5">{c.timeAgo}</p>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Panel principal */}
      {!selected || !detail ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-700">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Selecciona una conversación</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex-shrink-0 px-5 py-3 border-b border-white/5 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{detail.conversation.contactName}</p>
              <p className="text-[10px] text-gray-600 font-mono">+{detail.conversation.phone}</p>
            </div>

            {/* Toggle */}
            <div className="flex gap-1 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => handleModeToggle('AI')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  detail.conversation.mode === 'AI'
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Bot className="w-3 h-3" /> Modo IA
              </button>
              <button
                onClick={() => handleModeToggle('HUMAN')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  detail.conversation.mode === 'HUMAN'
                    ? 'bg-amber-600 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <User className="w-3 h-3" /> Modo Humano
              </button>
            </div>

            <button
              onClick={() => handleDelete(selected)}
              className="text-gray-600 hover:text-red-400 transition-colors"
              title="Eliminar conversación"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {detail.messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Footer */}
          {detail.conversation.mode === 'HUMAN' ? (
            <div className="flex-shrink-0 border-t border-white/5 px-4 py-3 flex gap-2 items-end">
              <textarea
                rows={2}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje… (Enter para enviar, Shift+Enter para salto de línea)"
                className="flex-1 bg-white/5 border border-amber-500/40 focus:border-amber-500/70 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 resize-none focus:outline-none transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={sending || !draft.trim()}
                className="flex-shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors"
                style={{ height: 52 }}
              >
                {sending ? '…' : 'Enviar'}
              </button>
            </div>
          ) : (
            <div className="flex-shrink-0 border-t border-white/5 px-4 py-3">
              <p className="text-[11px] text-gray-600 text-center">
                <Bot className="w-3 h-3 inline mr-1 text-emerald-500" />
                El agente IA responde automáticamente. Cambia a Modo Humano para escribir tú.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── subcomponentes ───────────────────────────────────────────────────────────

function ModeBadge({ mode }: { mode: 'AI' | 'HUMAN' }) {
  if (mode === 'AI') {
    return (
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
        AI
      </span>
    );
  }
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/50">
      HU
    </span>
  );
}

function MessageBubble({ msg }: { msg: BotMessage }) {
  const time = new Date(msg.created_at).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (msg.role === 'user') {
    return (
      <div className="flex justify-start">
        <div className="max-w-[75%] bg-white/5 border border-white/8 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
          <p className="text-xs text-gray-200 whitespace-pre-wrap break-words">{msg.content}</p>
          <p className="text-[10px] text-gray-600 mt-1">{time}</p>
        </div>
      </div>
    );
  }

  if (msg.role === 'assistant') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] bg-emerald-900/40 border border-emerald-800/50 rounded-2xl rounded-tr-sm px-3.5 py-2.5">
          <p className="text-[10px] text-emerald-400 font-medium mb-1 flex items-center gap-1">
            <Bot className="w-3 h-3" /> Agente IA
          </p>
          <p className="text-xs text-gray-200 whitespace-pre-wrap break-words">{msg.content}</p>
          <p className="text-[10px] text-gray-600 mt-1">{time}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] bg-amber-900/40 border border-amber-800/50 rounded-2xl rounded-tr-sm px-3.5 py-2.5">
        <p className="text-[10px] text-amber-400 font-medium mb-1 flex items-center gap-1">
          <User className="w-3 h-3" /> Humano
        </p>
        <p className="text-xs text-gray-200 whitespace-pre-wrap break-words">{msg.content}</p>
        <p className="text-[10px] text-gray-600 mt-1">{time}</p>
      </div>
    </div>
  );
}
