'use client';
import { useEffect, useState } from 'react';
import {
  MessageSquare, CheckCircle2, XCircle, AlertCircle,
  Bot, User, Save, ExternalLink, ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

// ─── tipos ────────────────────────────────────────────────────────────────────

type ChannelStatus = 'connected' | 'disconnected' | 'unconfigured';

interface Channel {
  id: string;
  name: string;
  detail: string;
  status: ChannelStatus;
  number: string | null;
  configHref: string;
  routing_type?: 'agent' | 'human' | null;
  routing_agent_id?: string | null;
}

interface Agent {
  id: string;
  name: string;
  role?: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ChannelStatus }) {
  if (status === 'connected') return (
    <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full whitespace-nowrap">
      <CheckCircle2 className="w-3 h-3" /> Conectado
    </span>
  );
  if (status === 'disconnected') return (
    <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full whitespace-nowrap">
      <XCircle className="w-3 h-3" /> Desconectado
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[10px] text-gray-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full whitespace-nowrap">
      <AlertCircle className="w-3 h-3" /> Sin configurar
    </span>
  );
}

// ─── channel card ─────────────────────────────────────────────────────────────

interface ChannelCardProps {
  channel: Channel;
  agents: Agent[];
  onSave: (id: string, type: 'agent' | 'human' | null, agentId: string | null) => Promise<void>;
}

function ChannelCard({ channel, agents, onSave }: ChannelCardProps) {
  const [routingType, setRoutingType] = useState<'agent' | 'human' | null>(channel.routing_type ?? null);
  const [agentId, setAgentId] = useState<string | null>(channel.routing_agent_id ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isDirty =
    routingType !== (channel.routing_type ?? null) ||
    agentId !== (channel.routing_agent_id ?? null);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(channel.id, routingType, routingType === 'agent' ? agentId : null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const selectedAgent = agents.find(a => a.id === agentId);

  return (
    <div className="bg-[#0a0f1e] border border-white/5 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 flex-shrink-0 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{channel.name}</p>
            {channel.number && (
              <p className="text-[10px] font-mono text-cyan-300">{channel.number}</p>
            )}
            {!channel.number && (
              <p className="text-[10px] text-gray-600">{channel.detail}</p>
            )}
          </div>
        </div>
        <StatusBadge status={channel.status} />
      </div>

      {/* Routing selector */}
      <div className="space-y-2">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Enrutar mensajes a</p>

        {/* Type selector */}
        <div className="flex gap-2">
          <button
            onClick={() => { setRoutingType(null); setAgentId(null); }}
            className={`flex-1 px-3 py-2 rounded-lg border text-[11px] font-medium transition-colors ${
              routingType === null
                ? 'bg-white/8 border-white/15 text-white'
                : 'bg-transparent border-white/5 text-gray-600 hover:text-gray-400 hover:border-white/10'
            }`}
          >
            Sin asignar
          </button>
          <button
            onClick={() => setRoutingType('agent')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-[11px] font-medium transition-colors ${
              routingType === 'agent'
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                : 'bg-transparent border-white/5 text-gray-600 hover:text-gray-400 hover:border-white/10'
            }`}
          >
            <Bot className="w-3 h-3" /> Agente IA
          </button>
          <button
            onClick={() => { setRoutingType('human'); setAgentId(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-[11px] font-medium transition-colors ${
              routingType === 'human'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-transparent border-white/5 text-gray-600 hover:text-gray-400 hover:border-white/10'
            }`}
          >
            <User className="w-3 h-3" /> Humano
          </button>
        </div>

        {/* Agent picker */}
        {routingType === 'agent' && (
          <div className="relative">
            <select
              value={agentId ?? ''}
              onChange={e => setAgentId(e.target.value || null)}
              className="w-full appearance-none bg-black/30 border border-cyan-500/20 rounded-lg px-3 py-2 pr-8 text-xs text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="">— Seleccionar agente —</option>
              {agents.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          </div>
        )}

        {routingType === 'human' && (
          <p className="text-[11px] text-amber-400/70 bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2">
            Los mensajes de este canal aparecerán en la Bandeja para atención manual.
          </p>
        )}
      </div>

      {/* Current routing summary */}
      {!isDirty && routingType === 'agent' && selectedAgent && (
        <div className="flex items-center gap-2 bg-cyan-500/5 border border-cyan-500/15 rounded-lg px-3 py-2">
          <Bot className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-cyan-300 font-medium">{selectedAgent.name}</p>
            <p className="text-[10px] text-gray-600">El agente sigue su propio journey desde el panel de agentes</p>
          </div>
          <Link
            href={`/agents`}
            className="text-[10px] text-gray-600 hover:text-cyan-400 transition-colors flex items-center gap-0.5 whitespace-nowrap"
          >
            Ver panel <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-1">
        <Link
          href={channel.configHref}
          className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3" />
          {channel.status === 'unconfigured' ? 'Configurar conexión' : 'Ver conexión'}
        </Link>

        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
            saved
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
              : isDirty
              ? 'bg-cyan-500 text-black hover:bg-cyan-400'
              : 'bg-white/5 text-gray-600 cursor-not-allowed'
          }`}
        >
          {saved ? (
            <><CheckCircle2 className="w-3 h-3" /> Guardado</>
          ) : (
            <><Save className="w-3 h-3" /> {saving ? 'Guardando…' : 'Guardar'}</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ConmutadorPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [agents, setAgents]     = useState<Agent[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Channel[]>('/communications/channels').catch(() => [] as Channel[]),
      api.get<Agent[]>('/agents').catch(() => [] as Agent[]),
    ]).then(([ch, ag]) => {
      setChannels(ch);
      setAgents(ag.filter((a: any) => a.type === 'ai' || a.agent_type === 'ai' || !a.type));
    }).finally(() => setLoading(false));
  }, []);

  async function handleSave(
    channelId: string,
    routingType: 'agent' | 'human' | null,
    agentId: string | null,
  ) {
    await api.patch(`/communications/channels/${channelId}`, { routing_type: routingType, routing_agent_id: agentId });
    setChannels(prev => prev.map(c =>
      c.id === channelId ? { ...c, routing_type: routingType, routing_agent_id: agentId } : c
    ));
  }

  return (
    <div className="px-6 py-5 space-y-5">
      <p className="text-xs text-gray-500 leading-relaxed max-w-xl">
        Define a qué agente IA o humano se envían los mensajes de cada canal. El agente IA sigue su propio journey configurado en el panel de agentes — no hay configuración duplicada aquí.
      </p>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[0, 1].map(i => (
            <div key={i} className="bg-[#0a0f1e] border border-white/5 rounded-xl p-5 h-52 animate-pulse" />
          ))}
        </div>
      ) : channels.length === 0 ? (
        <div className="bg-[#0a0f1e] border border-white/5 rounded-xl p-8 text-center space-y-2">
          <MessageSquare className="w-8 h-8 mx-auto text-gray-700" />
          <p className="text-sm text-gray-500">No hay canales configurados</p>
          <p className="text-[11px] text-gray-600">Conecta una instancia de WhatsApp desde la configuración del agente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {channels.map(ch => (
            <ChannelCard key={ch.id} channel={ch} agents={agents} onSave={handleSave} />
          ))}
        </div>
      )}

      {/* Routing logic note */}
      <div className="bg-[#0a0f1e] border border-white/5 rounded-xl p-4">
        <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Cómo funciona el enrutamiento</p>
        <ol className="space-y-1.5 text-xs text-gray-500">
          <li className="flex gap-2">
            <span className="text-cyan-500 font-mono flex-shrink-0">1.</span>
            Llega un mensaje a un canal de WhatsApp
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-500 font-mono flex-shrink-0">2.</span>
            El sistema identifica el canal y aplica el ruteo definido aquí
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-500 font-mono flex-shrink-0">3.</span>
            Si va a un <span className="text-cyan-300 mx-0.5">Agente IA</span> — ese agente responde siguiendo su journey
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-500 font-mono flex-shrink-0">4.</span>
            Si va a <span className="text-amber-300 mx-0.5">Humano</span> — el mensaje aparece en la Bandeja para respuesta manual
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-500 font-mono flex-shrink-0">5.</span>
            Sin asignar — el canal ignora los mensajes entrantes
          </li>
        </ol>
      </div>
    </div>
  );
}
