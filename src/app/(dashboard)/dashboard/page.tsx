'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import {
  Users, Bot, BookUser, Wifi, CheckCircle, Calendar,
  ClipboardList, Zap, ArrowRight, MapPin,
} from 'lucide-react';

interface Stats {
  humans: number;
  agents: number;
  onlineSlots: number;
  departments: number;
  contacts: number;
  tasks_pending: number;
  upcoming_events: { id: string; title: string; start_at: string; end_at: string; location: string | null }[];
  onboarding: { current_step: number; steps_completed: string[] } | null;
}

interface Usage {
  period: string;
  tokens_used: number;
  tokens_limit: number;
  usage_percent: number;
  plan: string;
}

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

const PLAN_COLORS: Record<string, string> = {
  starter: 'text-blue-400 bg-blue-500/10',
  professional: 'text-purple-400 bg-purple-500/10',
  enterprise: 'text-amber-400 bg-amber-500/10',
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function fmtDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return 'Hoy';
  if (d.toDateString() === tomorrow.toDateString()) return 'Mañana';
  return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
}

function fmtTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Stats>('/tenants/mine/stats').catch(() => null),
      api.get<Usage>('/tenants/mine/usage').catch(() => null),
    ]).then(([s, u]) => {
      setStats(s);
      setUsage(u);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const step = stats?.onboarding?.current_step ?? 0;
  const progress = Math.round((step / 6) * 100);
  const usagePct = Math.min(usage?.usage_percent ?? 0, 100);
  const usageColor = usagePct >= 90 ? 'bg-red-500' : usagePct >= 70 ? 'bg-amber-500' : 'bg-indigo-500';

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Bienvenido, <span className="text-indigo-400">{user?.email}</span>
        </p>
      </div>

      {/* Onboarding progress */}
      {stats?.onboarding && step < 6 && (
        <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle size={16} className="text-indigo-400" />
            <span className="font-medium text-white text-sm">Configuración inicial — paso {step} de 6</span>
            <span className="ml-auto text-indigo-400 text-sm font-semibold">{progress}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5 mb-3">
            <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Continuar configuración <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Métricas principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Usuarios humanos', value: stats?.humans ?? 0, icon: Users, color: 'bg-indigo-600' },
          { label: 'Agentes IA', value: stats?.agents ?? 0, icon: Bot, color: 'bg-violet-600' },
          { label: 'Online ahora', value: stats?.onlineSlots ?? 0, icon: Wifi, color: 'bg-emerald-600' },
          { label: 'Contactos CRM', value: stats?.contacts ?? 0, icon: BookUser, color: 'bg-blue-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400">{label}</span>
              <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center`}>
                <Icon size={13} className="text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Segunda fila: Token usage + Tareas pendientes + Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        {/* Token usage */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-indigo-400" />
              <span className="text-sm font-medium text-white">Tokens IA este mes</span>
            </div>
            {usage && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[usage.plan] ?? 'text-gray-400 bg-gray-800'}`}>
                {PLAN_LABELS[usage.plan] ?? usage.plan}
              </span>
            )}
          </div>
          {usage ? (
            <>
              <div className="flex items-end justify-between mb-2">
                <span className="text-2xl font-bold text-white">{fmtTokens(usage.tokens_used)}</span>
                <span className="text-xs text-gray-500">de {fmtTokens(usage.tokens_limit)}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${usageColor}`}
                  style={{ width: `${usagePct}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {usagePct}% utilizado · período {usage.period}
                {usagePct >= 80 && (
                  <Link href="/settings" className="ml-2 text-indigo-400 hover:text-indigo-300">
                    Actualizar plan →
                  </Link>
                )}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500">Sin datos de uso</p>
          )}
        </div>

        {/* Tareas pendientes */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList size={14} className="text-amber-400" />
            <span className="text-sm font-medium text-white">Tareas activas</span>
          </div>
          <p className="text-4xl font-bold text-white mt-1">{stats?.tasks_pending ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1 mb-4">pendientes o en progreso</p>
          <Link
            href="/team"
            className="mt-auto flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            Ver equipo <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Tercera fila: Eventos próximos + Accesos rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Próximos eventos (7 días) */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={14} className="text-blue-400" />
            <span className="text-sm font-medium text-white">Próximos eventos</span>
          </div>
          {stats?.upcoming_events?.length ? (
            <div className="space-y-3">
              {stats.upcoming_events.map(ev => (
                <div key={ev.id} className="flex items-start gap-3">
                  <div className="text-center min-w-[40px]">
                    <p className="text-xs text-indigo-400 font-medium">{fmtDay(ev.start_at)}</p>
                    <p className="text-xs text-gray-500">{fmtTime(ev.start_at)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{ev.title}</p>
                    {ev.location && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={10} />
                        {ev.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-24 text-center">
              <Calendar size={20} className="text-gray-700 mb-2" />
              <p className="text-xs text-gray-500">Sin eventos en los próximos 7 días</p>
              <p className="text-xs text-gray-600 mt-0.5">Conecta Google o Microsoft para ver tu calendario</p>
            </div>
          )}
        </div>

        {/* Accesos rápidos */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-4">Accesos rápidos</h2>
          <div className="space-y-2">
            {[
              { label: 'Ver equipo completo', href: '/team', desc: `${stats?.humans ?? 0} usuarios · ${stats?.agents ?? 0} agentes` },
              { label: 'Contactos CRM', href: '/contacts', desc: `${stats?.contacts ?? 0} contactos` },
              { label: 'Configurar campus', href: '/campus', desc: 'Mapa y salas virtuales' },
              { label: 'Integraciones', href: '/integrations', desc: 'Google, Microsoft, GHL' },
              { label: 'Mi plan y facturación', href: '/settings', desc: usage ? `Plan ${PLAN_LABELS[usage.plan] ?? usage.plan}` : 'Configuración' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors group"
              >
                <div>
                  <p className="text-sm text-gray-300 group-hover:text-white">{item.label}</p>
                  <p className="text-xs text-gray-600">{item.desc}</p>
                </div>
                <ArrowRight size={14} className="text-gray-600 group-hover:text-gray-400" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
