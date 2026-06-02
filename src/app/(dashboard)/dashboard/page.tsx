'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import type { FocusBrief, FocusMetric, FocusPriority, FocusPulse } from './focus-types';
import {
  TrendingUp, TrendingDown, Minus, AlertCircle,
  Clock, MessageSquare, Zap, Target, ChevronRight,
} from 'lucide-react';

const URGENCY_RING: Record<string, string> = {
  critical: 'ring-2 ring-red-500/60',
  high:     'ring-2 ring-amber-500/40',
  medium:   'ring-1 ring-indigo-500/30',
};

const TREND_ICON: Record<string, React.ReactNode> = {
  up:      <TrendingUp  className="w-3 h-3 text-emerald-400" />,
  down:    <TrendingDown className="w-3 h-3 text-red-400" />,
  flat:    <Minus       className="w-3 h-3 text-gray-400" />,
  unknown: <Minus       className="w-3 h-3 text-gray-600" />,
};

const METRIC_COLOR: Record<string, string> = {
  green: 'border-emerald-500/30 bg-emerald-500/5',
  amber: 'border-amber-500/30 bg-amber-500/5',
  red:   'border-red-500/30 bg-red-500/5',
  blue:  'border-indigo-500/30 bg-indigo-500/5',
};

const CATEGORY_BADGE: Record<string, string> = {
  strategic: 'bg-violet-500/20 text-violet-300',
  client:    'bg-blue-500/20 text-blue-300',
  team:      'bg-emerald-500/20 text-emerald-300',
  admin:     'bg-gray-500/20 text-gray-400',
};

const CATEGORY_LABEL: Record<string, string> = {
  strategic: 'Estratégico',
  client:    'Cliente',
  team:      'Equipo',
  admin:     'Admin',
};

function HeroCard({ hero }: { hero: FocusBrief['hero'] }) {
  return (
    <div className={`relative rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] border border-white/5 p-6 flex flex-col justify-between h-full overflow-hidden ${URGENCY_RING[hero.urgency] ?? ''}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-violet-600/5 pointer-events-none" />
      <div className="relative z-10">
        <p className="text-[10px] font-bold tracking-[0.2em] text-indigo-400 uppercase mb-1">{hero.label}</p>
        {hero.ksf_name && <p className="text-xs text-gray-500 mb-3">{hero.ksf_name}</p>}
        <p className="text-5xl font-black text-white leading-none tracking-tight">{hero.value}</p>
      </div>
      <div className="relative z-10 mt-4">
        <p className="text-sm text-gray-300 leading-relaxed">{hero.description}</p>
        <div className="mt-3">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            hero.urgency === 'critical' ? 'bg-red-500/20 text-red-300' :
            hero.urgency === 'high'     ? 'bg-amber-500/20 text-amber-300' :
                                          'bg-indigo-500/20 text-indigo-300'
          }`}>
            {hero.urgency === 'critical' ? 'ACCIÓN INMEDIATA' :
             hero.urgency === 'high'     ? 'ALTA PRIORIDAD' : 'PRIORIDAD MEDIA'}
          </span>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ metric }: { metric: FocusMetric }) {
  return (
    <div className={`rounded-xl border p-4 ${METRIC_COLOR[metric.color] ?? ''}`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase leading-tight">{metric.label}</p>
        {TREND_ICON[metric.trend]}
      </div>
      <p className="text-2xl font-bold text-white">{metric.current}</p>
      <p className="text-xs text-gray-500 mt-1">meta: {metric.target}</p>
    </div>
  );
}

function PriorityRow({ p, index }: { p: FocusPriority; index: number }) {
  return (
    <div className="flex items-start gap-3 group">
      <span className="text-lg font-black text-gray-700 w-5 shrink-0 mt-0.5">{index + 1}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-white truncate">{p.title}</p>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${CATEGORY_BADGE[p.category] ?? ''}`}>
            {CATEGORY_LABEL[p.category] ?? p.category}
          </span>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">{p.why}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-[10px] text-indigo-400">
            <Target className="w-3 h-3" />{p.ksf_impact}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-gray-500">
            <Clock className="w-3 h-3" />~{p.estimated_minutes}min
          </span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-700 shrink-0 mt-1 group-hover:text-indigo-400 transition-colors" />
    </div>
  );
}

function PulseItem({ item }: { item: FocusPulse }) {
  const colors: Record<string, string> = {
    high:   'text-red-400 bg-red-500/10',
    medium: 'text-amber-400 bg-amber-500/10',
    low:    'text-gray-400 bg-gray-500/10',
  };
  return (
    <div className="flex items-center gap-3">
      <MessageSquare className="w-3.5 h-3.5 text-gray-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-300 truncate">{item.label}</p>
        {item.preview && <p className="text-[10px] text-gray-600 truncate">{item.preview}</p>}
      </div>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${colors[item.urgency] ?? ''}`}>
        {item.count}
      </span>
    </div>
  );
}

function FocusSkeleton() {
  return (
    <div className="h-screen bg-[#050a14] flex flex-col p-6 gap-4 animate-pulse">
      <div className="h-6 w-48 bg-white/5 rounded" />
      <div className="flex gap-4 flex-1">
        <div className="w-80 bg-white/5 rounded-2xl" />
        <div className="flex-1 flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-3 h-24">
            {[0,1,2,3].map(i => <div key={i} className="bg-white/5 rounded-xl" />)}
          </div>
          <div className="flex-1 bg-white/5 rounded-2xl" />
        </div>
        <div className="w-56 bg-white/5 rounded-2xl" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-600 animate-pulse">Atlas analizando tu día...</p>
      </div>
    </div>
  );
}

export default function FocusModePage() {
  const { user } = useAuth();
  const [brief, setBrief] = useState<FocusBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<FocusBrief>('/tenants/mine/focus-brief')
      .then(setBrief)
      .catch(() => setError('No se pudo generar el Focus Mode'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <FocusSkeleton />;

  if (error || !brief) {
    return (
      <div className="h-screen bg-[#050a14] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">{error ?? 'Error generando Focus Mode'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#050a14] flex flex-col overflow-hidden select-none">
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <Zap className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-white">Focus Mode</span>
          <span className="text-xs text-gray-600">·</span>
          <span className="text-xs text-gray-500 capitalize">{brief.date}</span>
        </div>
        <span className="text-xs text-gray-600">{user?.email}</span>
      </header>

      <main className="flex-1 flex gap-4 p-4 min-h-0">
        <section className="w-72 shrink-0">
          <HeroCard hero={brief.hero} />
        </section>

        <section className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="grid grid-cols-4 gap-3 shrink-0">
            {brief.metrics.slice(0, 4).map((m, i) => (
              <MetricCard key={i} metric={m} />
            ))}
          </div>
          <div className="flex-1 rounded-2xl bg-[#0a0f1e] border border-white/5 p-5 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-4 shrink-0">
              <p className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase">Prioridades del día</p>
              <span className="text-[10px] text-gray-700">· por impacto en KSFs</span>
            </div>
            <div className="flex flex-col gap-4 overflow-y-auto pr-1">
              {brief.priorities.map((p, i) => (
                <PriorityRow key={i} p={p} index={i} />
              ))}
            </div>
          </div>
        </section>

        <section className="w-52 shrink-0 flex flex-col gap-4">
          <div className="rounded-2xl bg-[#0a0f1e] border border-white/5 p-4">
            <p className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-3">Momentum</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-black text-white">{brief.momentum.streak_days}</span>
              <span className="text-xs text-gray-500 mb-1">días seguidos</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{brief.momentum.message}</p>
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-gray-600 mb-1">
                <span>Score semanal</span>
                <span>{brief.momentum.weekly_score}%</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${brief.momentum.weekly_score}%` }} />
              </div>
            </div>
          </div>

          <div className="flex-1 rounded-2xl bg-[#0a0f1e] border border-white/5 p-4 flex flex-col">
            <p className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-3">Pulse</p>
            {brief.pulse.length === 0 ? (
              <p className="text-xs text-gray-600 italic">Sin alertas pendientes</p>
            ) : (
              <div className="flex flex-col gap-3 overflow-y-auto">
                {brief.pulse.map((item, i) => <PulseItem key={i} item={item} />)}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
