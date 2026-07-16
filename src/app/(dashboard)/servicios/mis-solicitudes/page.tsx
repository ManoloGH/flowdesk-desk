'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Clock, AlertTriangle, ChevronRight } from 'lucide-react';

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
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Borrador', PENDING: 'Pendiente', APPROVED: 'Aprobado',
  IN_PROGRESS: 'En proceso', WAITING_INFO: 'Esperando info',
  IN_REVIEW: 'En revisión', ACCEPTED: 'Aceptado', CLOSED: 'Cerrado',
  REJECTED: 'Rechazado', CANCELLED: 'Cancelado',
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'text-gray-400 bg-gray-800',
  PENDING: 'text-amber-400 bg-amber-500/10',
  APPROVED: 'text-blue-400 bg-blue-500/10',
  IN_PROGRESS: 'text-indigo-400 bg-indigo-500/10',
  WAITING_INFO: 'text-orange-400 bg-orange-500/10',
  IN_REVIEW: 'text-purple-400 bg-purple-500/10',
  ACCEPTED: 'text-emerald-400 bg-emerald-500/10',
  CLOSED: 'text-gray-400 bg-gray-800',
  REJECTED: 'text-red-400 bg-red-500/10',
  CANCELLED: 'text-gray-500 bg-gray-800',
};

const PRIORITY_DOT: Record<string, string> = {
  LOW: 'bg-gray-500', NORMAL: 'bg-blue-500',
  HIGH: 'bg-amber-500', URGENT: 'bg-red-500',
};

const ACTIVE_STATUSES = ['PENDING', 'APPROVED', 'IN_PROGRESS', 'WAITING_INFO', 'IN_REVIEW'];

export default function MisSolicitudesPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<SocRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'history'>('active');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<SocRequest[]>('/soc/requests?view=mine');
      setRequests(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  const active = requests.filter(r => ACTIVE_STATUSES.includes(r.status));
  const history = requests.filter(r => !ACTIVE_STATUSES.includes(r.status));
  const shown = tab === 'active' ? active : history;

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  }

  function slaLabel(r: SocRequest) {
    if (!r.due_date) return null;
    const diff = new Date(r.due_date).getTime() - Date.now();
    if (r.sla_breached || diff < 0) return { text: 'Vencida', cls: 'text-red-400' };
    if (diff < 3_600_000 * 4) return { text: 'Vence pronto', cls: 'text-amber-400' };
    return { text: `Vence ${formatDate(r.due_date)}`, cls: 'text-gray-500' };
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <button onClick={() => router.push('/servicios')} className="text-xs text-gray-500 hover:text-gray-300 mb-2">
          ← Catálogo
        </button>
        <h1 className="text-2xl font-bold text-white">Mis solicitudes</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1 w-fit mb-6">
        {([['active', `Activas (${active.length})`], ['history', `Historial (${history.length})`]] as const).map(
          ([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === key ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ),
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : shown.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-2">{tab === 'active' ? 'Sin solicitudes activas' : 'Sin historial aún'}</p>
          {tab === 'active' && (
            <button
              onClick={() => router.push('/servicios')}
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              Ir al catálogo →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {shown.map(r => {
            const sla = slaLabel(r);
            return (
              <button
                key={r.id}
                onClick={() => router.push(`/servicios/${r.id}`)}
                className="w-full text-left bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-indigo-500 transition-colors flex items-center gap-4"
              >
                {/* Icono del servicio */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: `${r.service.color ?? '#6366F1'}20` }}
                >
                  {r.service.icon ?? '📋'}
                </div>

                {/* Info principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-gray-500 font-mono">{r.request_number}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[r.priority]}`} />
                  </div>
                  <p className="font-medium text-white text-sm truncate">{r.title}</p>
                  <p className="text-xs text-gray-500">
                    {r.service.department.name} · {r.service.name}
                  </p>
                </div>

                {/* Estado + SLA */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                  {sla && (
                    <span className={`flex items-center gap-1 text-xs ${sla.cls}`}>
                      {r.sla_breached && <AlertTriangle size={11} />}
                      {!r.sla_breached && <Clock size={11} />}
                      {sla.text}
                    </span>
                  )}
                </div>

                <ChevronRight size={16} className="text-gray-600 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
