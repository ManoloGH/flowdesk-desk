'use client';
import { useEffect, useState } from 'react';
import { MessageSquare, Phone, UserCheck, Users, HelpCircle, Bot, User, ChevronRight, Search } from 'lucide-react';
import { api } from '@/lib/api';

type ConvChannel = 'whatsapp' | 'phone';
type ConvSlot = 'employee' | 'client' | 'unknown';
type ConvStatus = 'bot' | 'human' | 'closed';

interface Conversation {
  id: string;
  contactName: string;
  contactPhone: string;
  channel: ConvChannel;
  slot: ConvSlot;
  status: ConvStatus;
  lastMessage: string;
  timeAgo: string;
  agentName: string;
}

const CHANNEL_ICON: Record<string, React.ElementType> = { whatsapp: MessageSquare, phone: Phone };
const SLOT_ICON: Record<string, React.ElementType> = { employee: UserCheck, client: Users, unknown: HelpCircle };
const SLOT_LABEL: Record<string, string> = { employee: 'Empleado', client: 'Cliente', unknown: 'Lead' };
const SLOT_COLOR: Record<string, string> = {
  employee: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  client:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  unknown:  'text-amber-400 bg-amber-500/10 border-amber-500/20',
};
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  bot:    { label: 'Con bot',    color: 'text-cyan-400',   icon: Bot },
  human:  { label: 'Con humano', color: 'text-orange-400', icon: User },
  closed: { label: 'Cerrada',    color: 'text-gray-600',   icon: MessageSquare },
};

const STATUS_FILTERS = [
  { key: 'all',    label: 'Todas' },
  { key: 'bot',    label: 'Con bot' },
  { key: 'human',  label: 'Con humano' },
  { key: 'closed', label: 'Cerradas' },
];

export default function BandejaPage() {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    api.get<Conversation[]>('/communications/conversations')
      .then(setConvs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = convs.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.contactName.toLowerCase().includes(q) || c.contactPhone.includes(q) || c.lastMessage.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const active = convs.filter(c => c.status !== 'closed').length;

  return (
    <div className="px-6 py-5 space-y-4">
      <div className="flex gap-3">
        {[
          { label: 'Activas',      value: active,                                               color: 'text-cyan-400' },
          { label: 'Con bot',      value: convs.filter(c => c.status === 'bot').length,         color: 'text-cyan-300' },
          { label: 'Con humano',   value: convs.filter(c => c.status === 'human').length,       color: 'text-orange-400' },
          { label: 'Cerradas hoy', value: convs.filter(c => c.status === 'closed').length,      color: 'text-gray-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#0a0f1e] border border-white/5 rounded-lg px-3 py-2 min-w-[80px]">
            <p className={`text-lg font-bold ${color}`}>{loading ? '—' : value}</p>
            <p className="text-[10px] text-gray-600">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por contacto o mensaje…"
            className="w-full bg-[#0a0f1e] border border-white/5 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <div className="flex gap-1">
          {STATUS_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === key ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/30' : 'bg-[#0a0f1e] border border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#0a0f1e] border border-white/5 rounded-xl px-4 py-3 h-14 animate-pulse" />
          ))
        ) : filtered.map(conv => {
          const ChanIcon   = CHANNEL_ICON[conv.channel] ?? MessageSquare;
          const SlotIcon   = SLOT_ICON[conv.slot] ?? HelpCircle;
          const statusConf = STATUS_CONFIG[conv.status] ?? STATUS_CONFIG.closed;
          const StatusIcon = statusConf.icon;

          return (
            <div
              key={conv.id}
              className="bg-[#0a0f1e] border border-white/5 hover:border-white/10 rounded-xl px-4 py-3 cursor-pointer transition-colors group flex items-center gap-4"
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <ChanIcon className="w-3.5 h-3.5 text-cyan-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-white">{conv.contactName}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${SLOT_COLOR[conv.slot] ?? ''}`}>
                    <SlotIcon className="w-2.5 h-2.5" />{SLOT_LABEL[conv.slot] ?? conv.slot}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`flex items-center gap-1 text-[10px] ${statusConf.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusConf.label}
                </span>
                <span className="text-[10px] text-gray-700 font-mono">{conv.timeAgo}</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-700 group-hover:text-cyan-400 transition-colors" />
              </div>
            </div>
          );
        })}

        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center">
            <MessageSquare className="w-8 h-8 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Sin conversaciones</p>
          </div>
        )}
      </div>
    </div>
  );
}
