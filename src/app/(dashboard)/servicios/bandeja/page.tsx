'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { AlertTriangle, Clock, ChevronRight, BarChart2 } from 'lucide-react';

interface SocRequest {
  id: string;
  request_number: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  sla_breached: boolean;
  created_at: string;
  service: {
    name: string;
    icon: string | null;
    color: string | null;
    department: { name: string };
  };
  requester: { name: string; avatar_url: string | null };
  assigned_to: { id: string; name: string } | null;
}

interface Analytics {
  total: number;
  sla_breached: number;
  sla_compliance_pct: number;
  avg_resolution_hours: number;
  by_status: { status: string; count: number }[];
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Borrador', PENDING: 'Pendiente', APPROVED: 'Aprobado',
  IN_PROGRESS: 'En proceso', WAITING_INFO: 'Esperando info',
  IN_REVIEW: 'En revisión', ACCEPTED: 'Aceptado', CLOSED: 'Cerrado',
  REJECTED: 'Rechazado', CANCELLED: 'Cancelado',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'text-amber-400 bg-amber-500/10',
  APPROVED: 'text-blue-400 bg-blue-500/10',
  IN_PROGRESS: 'text-indigo-400 bg-indigo-500/10',
  WAITING_INFO: 'text-orange-400 bg-orange-500/10',
  IN_REVIEW: 'text-purple-400 bg-purple-500/10',
  CLOSED: 'text-gray-400 bg-gray-800',
};

const TABS = [
  { key: 'inbox', label: 'Bandeja', statuses: ['PENDING', 'APPROVED', 'WAITING_INFO'] },
  { key: 'progress', label: 'En proceso', statuses: ['IN_PROGRESS'] },
  { key: 'review', label: 'Por revisar', statuses: ['IN_REVIEW'] },
  { key: 'breached', label: 'Vencidas', statuses: [] },
];

const PRIORITY_DOT: Record<string, string> = {
  LOW: 'bg-gray-500', NORMAL: 'bg-blue-500',
  HIGH: 'bg-amber-500', URGENT: 'bg-red-500',
};

export default function BandejaPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<SocRequest[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('inbox');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [data, stats] = await Promise.all([
        api.get<SocRequest[]>('/soc/requests?view=inbox'),
        api.get<Analytics>('/soc/requests/analytics'),
      ]);
      setRequests(Array.isArray(data) ? data : []);
      setAnalytics(stats);
    } finally {
      setLoading(false);
    }
  }

  const shown = (() => {
    const tabDef = TABS.find(t => t.key === tab);
    if (!tabDef) return requests;
    if (tab === 'breached') return requests.filter(r => r.sla_breached && !['CLOSED', 'CANCELLED'].includes(r.status));
    return requests.filter(r => tabDef.statuses.includes(r.status));
  })();

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Bandeja del departamento</h1>
        <p className="text-gray-400 mt-1 text-sm">Solicitudes entrantes para tu área</p>
      </div>

      {/* KPIs */}
      {analytics && (
        <div className="grid grid-cols-2 gap-3 mb-8 sm:grid-cols-4">
          {[
            { label: 'Total activas', value: analytics.total, cls: 'text-white' },
            { label: 'Cumplimiento SLA', value: `${analytics.sla_compliance_pct}%`, cls: analytics.sla_compliance_pct >= 90 ? 'text-emerald-400' : 'text-amber-400' },
            { label: 'Vencidas', value: analytics.sla_breached, cls: analytics.sla_breached > 0 ? 'text-red-400' : 'text-emerald-400' },
            { label: 'Tiempo promedio', value: analytics.avg_resolution_hours ? `${analytics.avg_resolution_hours}h` : '—', cls: 'text-white' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
              <p className={`text-2xl font-bold ${kpi.cls}`}>{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1 w-fit mb-6 overflow-x-auto">
        {TABS.map(t => {
          const count = t.key === 'breached'
            ? requests.filter(r => r.sla_breached && !['CLOSED', 'CANCELLED'].includes(r.status)).length
            : requests.filter(r => t.statuses.includes(r.status)).length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                tab === t.key ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t.label}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  t.key === 'breached' ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-300'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : shown.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <BarChart2 size={32} className="mx-auto mb-3 opacity-30" />
          <p>Sin solicitudes en esta bandeja</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shown.map(r => (
            <button
              key={r.id}
              onClick={() => router.push(`/servicios/${r.id}`)}
              className="w-full text-left bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-indigo-500 transition-colors flex items-center gap-4"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                style={{ background: `${r.service.color ?? '#6366F1'}20` }}
              >
                {r.service.icon ?? '📋'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-gray-500 font-mono">{r.request_number}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[r.priority]}`} />
                  {r.sla_breached && <AlertTriangle size={12} className="text-red-400" />}
                </div>
                <p className="font-medium text-white text-sm truncate">{r.title}</p>
                <p className="text-xs text-gray-500">
                  {r.requester.name} · {r.service.name}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[r.status] ?? 'text-gray-400 bg-gray-800'}`}>
                  {STATUS_LABEL[r.status]}
                </span>
                {r.due_date && (
                  <span className={`flex items-center gap-1 text-xs ${r.sla_breached ? 'text-red-400' : 'text-gray-500'}`}>
                    <Clock size={11} />
                    {r.sla_breached ? 'Vencida' : formatDate(r.due_date)}
                  </span>
                )}
                {r.assigned_to && (
                  <span className="text-xs text-gray-500">{r.assigned_to.name}</span>
                )}
              </div>

              <ChevronRight size={16} className="text-gray-600 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
