'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare, Phone, Globe, Bot, User, PhoneForwarded,
  RefreshCw, Clock, CheckCircle2, Circle, XCircle,
  ChevronRight,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

const POLL_MS = 5000;

// ─── tipos ────────────────────────────────────────────────────────────────────

type ChannelKind  = 'whatsapp' | 'instagram' | 'webchat' | 'phone' | string;
type RoutedType   = 'agent' | 'user' | 'forward';
type ConvStatus   = 'active' | 'waiting' | 'closed';

interface ConvSummary {
  id: string;
  contact_name: string;
  contact_number: string | null;
  channel: ChannelKind;
  channel_name: string;
  routed_type: RoutedType;
  routed_to: string;
  status: ConvStatus;
  last_message: string;
  time_ago: string;
  message_count: number;
}

interface ConvMessage {
  id: string;
  role: 'contact' | 'agent' | 'human' | 'system';
  content: string;
  created_at: string;
}

interface ConvDetail {
  id: string;
  contact_name: string;
  contact_number: string | null;
  channel: ChannelKind;
  channel_name: string;
  routed_type: RoutedType;
  routed_to: string;
  status: ConvStatus;
  started_at: string;
  messages: ConvMessage[];
}

// ─── meta helpers ─────────────────────────────────────────────────────────────

const CHANNEL_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  whatsapp:  { icon: MessageSquare, color: 'text-emerald-400', label: 'WhatsApp'  },
  instagram: { icon: MessageSquare, color: 'text-pink-400',    label: 'Instagram' },
  webchat:   { icon: Globe,         color: 'text-blue-400',    label: 'WebChat'   },
  phone:     { icon: Phone,         color: 'text-violet-400',  label: 'Teléfono'  },
};

function channelMeta(kind: ChannelKind) {
  const key = Object.keys(CHANNEL_META).find(k => kind.toLowerCase().includes(k));
  return key ? CHANNEL_META[key] : CHANNEL_META.whatsapp;
}

const ROUTE_META: Record<RoutedType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  agent:   { icon: Bot,             color: 'text-cyan-300',   bg: 'bg-cyan-500/10 border-cyan-500/20',   label: 'Agente IA'    },
  user:    { icon: User,            color: 'text-violet-300', bg: 'bg-violet-500/10 border-violet-500/20', label: 'Asesor'       },
  forward: { icon: PhoneForwarded,  color: 'text-amber-300',  bg: 'bg-amber-500/10 border-amber-500/20',  label: 'Reenvío'      },
};

const STATUS_META: Record<ConvStatus, { icon: React.ElementType; color: string; label: string }> = {
  active:  { icon: Circle,       color: 'text-emerald-400', label: 'Activa'    },
  waiting: { icon: Clock,        color: 'text-amber-400',   label: 'En espera' },
  closed:  { icon: CheckCircle2, color: 'text-gray-500',    label: 'Cerrada'   },
};

// ─── RoutedChip ───────────────────────────────────────────────────────────────

function RoutedChip({ type, to }: { type: RoutedType; to: string }) {
  const m = ROUTE_META[type];
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${m.bg} ${m.color}`}>
      <Icon className="w-2.5 h-2.5 flex-shrink-0" />
      {to}
    </span>
  );
}

function ChannelChip({ kind, name }: { kind: ChannelKind; name: string }) {
  const m = channelMeta(kind);
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/8 ${m.color}`}>
      <Icon className="w-2.5 h-2.5 flex-shrink-0" />
      {name || m.label}
    </span>
  );
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ConvMessage }) {
  const time = new Date(msg.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  if (msg.role === 'system') {
    return (
      <div className="flex justify-center">
        <span className="text-[10px] text-gray-600 bg-white/5 border border-white/5 px-3 py-1 rounded-full">
          {msg.content}
        </span>
      </div>
    );
  }

  const isContact = msg.role === 'contact';
  const isAgent   = msg.role === 'agent';

  return (
    <div className={`flex ${isContact ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
        isContact ? 'bg-white/5 border border-white/8 rounded-tl-sm'
        : isAgent  ? 'bg-cyan-900/40 border border-cyan-800/50 rounded-tr-sm'
        :            'bg-violet-900/40 border border-violet-800/50 rounded-tr-sm'
      }`}>
        {!isContact && (
          <p className={`text-[10px] font-medium mb-1 flex items-center gap-1 ${isAgent ? 'text-cyan-400' : 'text-violet-400'}`}>
            {isAgent ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
            {isAgent ? 'Agente IA' : 'Asesor'}
          </p>
        )}
        <p className="text-xs text-gray-200 whitespace-pre-wrap break-words">{msg.content}</p>
        <p className="text-[10px] text-gray-600 mt-1">{time}</p>
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function BandejaPage() {
  const [conversations, setConversations] = useState<ConvSummary[]>([]);
  const [selected, setSelected]           = useState<string | null>(null);
  const [detail, setDetail]               = useState<ConvDetail | null>(null);
  const [loading, setLoading]             = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const data = await apiFetch<ConvSummary[]>('/communications/conversations');
      setConversations(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchConversations().finally(() => setLoading(false));
    const id = setInterval(fetchConversations, POLL_MS);
    return () => clearInterval(id);
  }, [fetchConversations]);

  const fetchDetail = useCallback(async () => {
    if (!selected) return;
    try {
      const data = await apiFetch<ConvDetail>(`/communications/conversations/${selected}`);
      setDetail(data);
    } catch {}
  }, [selected]);

  useEffect(() => {
    if (!selected) { setDetail(null); return; }
    fetchDetail();
    const id = setInterval(fetchDetail, POLL_MS);
    return () => clearInterval(id);
  }, [selected, fetchDetail]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [detail?.messages.length]);

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-80 flex-shrink-0 border-r border-white/5 flex flex-col">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400">
            Todas las conversaciones · {conversations.length}
          </span>
          <button
            onClick={() => { setLoading(true); fetchConversations().finally(() => setLoading(false)); }}
            className="text-gray-600 hover:text-gray-400 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-px">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="px-4 py-3 space-y-2 animate-pulse">
                  <div className="h-3 bg-white/5 rounded w-3/4" />
                  <div className="h-2 bg-white/5 rounded w-1/2" />
                  <div className="h-2 bg-white/5 rounded w-full" />
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-4 py-10 text-center text-[11px] text-gray-600">
              No hay conversaciones aún.
            </div>
          ) : (
            conversations.map(c => {
              const sm = STATUS_META[c.status];
              const SIcon = sm.icon;
              const isSelected = selected === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className={`w-full text-left px-4 py-3 border-b border-white/[0.04] transition-colors hover:bg-white/5 ${
                    isSelected ? 'bg-white/8 border-l-2 border-l-cyan-500' : ''
                  }`}
                >
                  {/* Row 1: name + status + arrow */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <SIcon className={`w-2.5 h-2.5 flex-shrink-0 ${sm.color}`} />
                    <span className="text-xs font-medium text-white truncate flex-1">{c.contact_name}</span>
                    {c.contact_number && (
                      <span className="text-[9px] font-mono text-gray-600 flex-shrink-0">{c.contact_number}</span>
                    )}
                    <ChevronRight className="w-3 h-3 text-gray-700 flex-shrink-0" />
                  </div>
                  {/* Row 2: channel + routed chip */}
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <ChannelChip kind={c.channel} name={c.channel_name} />
                    <span className="text-gray-700 text-[10px]">→</span>
                    <RoutedChip type={c.routed_type} to={c.routed_to} />
                  </div>
                  {/* Row 3: last message */}
                  <p className="text-[11px] text-gray-500 truncate leading-relaxed">{c.last_message || '—'}</p>
                  {/* Row 4: time + count */}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-gray-700">{c.time_ago}</span>
                    <span className="text-[10px] text-gray-700">{c.message_count} msgs</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Detail panel ── */}
      {!selected || !detail ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-700 space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto opacity-20" />
            <p className="text-xs">Selecciona una conversación para ver el historial</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex-shrink-0 px-5 py-3 border-b border-white/5 space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{detail.contact_name}</p>
                {detail.contact_number && (
                  <p className="text-[10px] font-mono text-gray-600">+{detail.contact_number}</p>
                )}
              </div>
              <div className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${STATUS_META[detail.status].color} bg-white/5 border-white/10`}>
                {(() => { const S = STATUS_META[detail.status].icon; return <S className="w-2.5 h-2.5" />; })()}
                {STATUS_META[detail.status].label}
              </div>
            </div>
            {/* Routing info */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-gray-600">Canal:</span>
              <ChannelChip kind={detail.channel} name={detail.channel_name} />
              <span className="text-[10px] text-gray-700 mx-1">→</span>
              <span className="text-[10px] text-gray-600">Enrutado a:</span>
              <RoutedChip type={detail.routed_type} to={detail.routed_to} />
            </div>
            {detail.started_at && (
              <p className="text-[10px] text-gray-700">
                Iniciada: {new Date(detail.started_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            )}
          </div>

          {/* Messages — audit view */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {detail.messages.length === 0 ? (
              <p className="text-center text-[11px] text-gray-600 py-8">Sin mensajes registrados.</p>
            ) : (
              detail.messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
            )}
            <div ref={bottomRef} />
          </div>

          {/* Footer note */}
          <div className="flex-shrink-0 border-t border-white/5 px-5 py-2.5">
            <p className="text-[10px] text-gray-700 text-center">
              Vista de auditoría — registro de todas las conversaciones entrantes y su ruteo
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
