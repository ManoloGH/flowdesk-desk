'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import {
  TrendingUp, Users, Target, CheckCircle, AlertCircle,
  ArrowUp, ArrowDown, Minus, Brain, MessageSquare,
  Building2, Loader2, RefreshCw,
} from 'lucide-react';

interface KsfRow {
  id: string;
  name: string;
  unit: string;
  level: string;
  satisfactory_level: number;
  outstanding_level: number;
  minimum_level: number;
  measurements?: { actual_value: number; status: string; trend: string }[];
}

interface PlatformMetrics {
  tenants_total: number;
  tenants_activos: number;
  mrr_usd: number;
  brain_documents: number;
  agent_conversations: number;
  plans: Record<string, number>;
}

interface TeamSummary {
  online: number;
  agents_online: number;
  total: number;
}

const STATUS_COLOR: Record<string, string> = {
  OUTSTANDING:  'text-emerald-400',
  SATISFACTORY: 'text-blue-400',
  IN_PROGRESS:  'text-amber-400',
  AT_MINIMUM:   'text-orange-400',
  BELOW_MINIMUM:'text-red-400',
  NO_DATA:      'text-gray-600',
};

const STATUS_BG: Record<string, string> = {
  OUTSTANDING:  'bg-emerald-500/10 border-emerald-500/20',
  SATISFACTORY: 'bg-blue-500/10 border-blue-500/20',
  IN_PROGRESS:  'bg-amber-500/10 border-amber-500/20',
  AT_MINIMUM:   'bg-orange-500/10 border-orange-500/20',
  BELOW_MINIMUM:'bg-red-500/10 border-red-500/20',
  NO_DATA:      'bg-gray-800/50 border-gray-700/30',
};

const STATUS_LABEL: Record<string, string> = {
  OUTSTANDING:  'Outstanding',
  SATISFACTORY: 'Satisfactorio',
  IN_PROGRESS:  'En progreso',
  AT_MINIMUM:   'Mínimo',
  BELOW_MINIMUM:'Bajo mínimo',
  NO_DATA:      'Sin datos',
};

function TrendIcon({ trend }: { trend?: string }) {
  if (trend === 'UP')   return <ArrowUp className="w-3 h-3 text-emerald-400" />;
  if (trend === 'DOWN') return <ArrowDown className="w-3 h-3 text-red-400" />;
  return <Minus className="w-3 h-3 text-gray-600" />;
}

function KsfCard({ ksf }: { ksf: KsfRow }) {
  const last = ksf.measurements?.[0];
  const status = last?.status ?? 'NO_DATA';
  const value  = last?.actual_value;

  return (
    <div className={`rounded-xl border p-4 ${STATUS_BG[status] ?? STATUS_BG.NO_DATA}`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-semibold text-white leading-tight">{ksf.name}</p>
        <div className="flex items-center gap-1">
          <TrendIcon trend={last?.trend} />
          <span className={`text-[10px] font-bold ${STATUS_COLOR[status] ?? 'text-gray-600'}`}>
            {STATUS_LABEL[status] ?? status}
          </span>
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-white">
          {value != null ? value.toLocaleString() : '—'}
        </span>
        <span className="text-xs text-gray-500 mb-0.5">{ksf.unit}</span>
      </div>
      <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-600">
        <span>Min {ksf.minimum_level}</span>
        <span>·</span>
        <span>Sat {ksf.satisfactory_level}</span>
        <span>·</span>
        <span>Out {ksf.outstanding_level}</span>
      </div>
    </div>
  );
}

export default function MetricsPage() {
  const { user } = useAuth();
  const [ksfs, setKsfs]           = useState<KsfRow[]>([]);
  const [platform, setPlatform]   = useState<PlatformMetrics | null>(null);
  const [team, setTeam]           = useState<TeamSummary | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(silent = false) {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [ksfData, teamData] = await Promise.all([
        api.get<KsfRow[]>('/goals/ksf/company').catch(() => [] as KsfRow[]),
        api.get<{ id: string; name: string; type: string; status: string }[]>('/team-slots/mine').catch(() => [] as any[]),
      ]);

      setKsfs(Array.isArray(ksfData) ? ksfData : []);

      const slots = Array.isArray(teamData) ? teamData : [];
      setTeam({
        online:        slots.filter((s: any) => s.status === 'ONLINE' && s.type === 'HUMAN').length,
        agents_online: slots.filter((s: any) => s.status === 'ONLINE' && s.type === 'AI_AGENT').length,
        total:         slots.length,
      });

      if (user?.platform_admin) {
        const pm = await api.get<PlatformMetrics>('/platform/stats').catch(() => null);
        setPlatform(pm);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const companyKsfs = ksfs.filter(k => k.level === 'COMPANY');
  const green = companyKsfs.filter(k => ['SATISFACTORY', 'OUTSTANDING'].includes(k.measurements?.[0]?.status ?? '')).length;
  const red   = companyKsfs.filter(k => ['BELOW_MINIMUM', 'AT_MINIMUM'].includes(k.measurements?.[0]?.status ?? '')).length;

  if (loading) {
    return <div className="min-h-screen bg-[#050a14] flex items-center justify-center"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#050a14] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-xs text-gray-500">Métricas del negocio · {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button onClick={() => load(true)} disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-gray-400 text-xs hover:text-white transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>

      {/* Métricas de plataforma (solo si platform_admin) */}
      {platform && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Tenants activos', value: platform.tenants_activos, icon: Building2, color: 'text-violet-400', sub: `de ${platform.tenants_total} total` },
            { label: 'MRR',            value: `$${platform.mrr_usd.toLocaleString()}`, icon: TrendingUp, color: 'text-indigo-400', sub: 'USD / mes' },
            { label: 'Brain docs',     value: platform.brain_documents, icon: Brain, color: 'text-amber-400', sub: 'documentos totales' },
            { label: 'Conversaciones', value: platform.agent_conversations, icon: MessageSquare, color: 'text-pink-400', sub: 'con agentes' },
            { label: 'Planes activos', value: Object.values(platform.plans).reduce((a, b) => a + b, 0), icon: CheckCircle, color: 'text-emerald-400', sub: Object.entries(platform.plans).filter(([,v]) => v > 0).map(([k,v]) => `${v} ${k}`).join(' · ') || '—' },
          ].map(({ label, value, icon: Icon, color, sub }) => (
            <div key={label} className="bg-[#0a0f1e] border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold tracking-widest text-gray-600 uppercase">{label}</p>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-[10px] text-gray-600 mt-1">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Resumen de equipo */}
      {team && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Humanos online', value: team.online,        icon: Users,  color: 'text-blue-400' },
            { label: 'Agentes online', value: team.agents_online, icon: Target, color: 'text-emerald-400' },
            { label: 'Team total',     value: team.total,         icon: Users,  color: 'text-gray-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-[#0a0f1e] border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold tracking-widest text-gray-600 uppercase">{label}</p>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* KSFs de empresa */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">KSFs de empresa</h2>
        <div className="flex items-center gap-3 text-xs">
          {green > 0 && <span className="flex items-center gap-1 text-emerald-400"><CheckCircle className="w-3 h-3" />{green} en verde</span>}
          {red > 0   && <span className="flex items-center gap-1 text-red-400"><AlertCircle className="w-3 h-3" />{red} en rojo</span>}
        </div>
      </div>

      {companyKsfs.length === 0 ? (
        <div className="bg-[#0a0f1e] border border-white/5 rounded-xl p-8 text-center">
          <Target className="w-8 h-8 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-1">Sin KSFs configurados</p>
          <p className="text-xs text-gray-600">Ve a Objetivos para configurar tus factores clave de éxito</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {companyKsfs.map(k => <KsfCard key={k.id} ksf={k} />)}
        </div>
      )}
    </div>
  );
}
