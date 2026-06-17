'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import {
  Target, TrendingUp, TrendingDown, Minus,
  Star, AlertTriangle, CheckCircle, Users,
  Award, Activity, BarChart2, AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

// ─── Types ───────────────────────────────────────────────────────────────────

type KsfStatus = 'NO_DATA' | 'BELOW_MINIMUM' | 'AT_MINIMUM' | 'IN_PROGRESS' | 'SATISFACTORY' | 'OUTSTANDING';
type KsfCategory = 'OPERATIONAL' | 'COORDINATION' | 'STRATEGIC';
type Trend = 'UP' | 'DOWN' | 'STABLE';
type Tab = 'ksfs' | 'feedback' | 'management' | 'org';

interface Ksf {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  category: KsfCategory;
  minimum_level: number;
  satisfactory_level: number;
  outstanding_level: number;
  last_status: KsfStatus | null;
  last_actual: number | null;
  last_trend: Trend | null;
}

interface FeedbackEntry {
  ksf_id: string;
  name: string;
  actual: number;
  unit: string;
  satisfactory_level?: number;
  minimum_level?: number;
  consecutive_periods?: number;
}

interface FeedbackReport {
  week_start: string;
  positive_results: FeedbackEntry[];
  negative_results: FeedbackEntry[];
}

interface ZoneEntry {
  slot_id: string;
  slot_name: string;
  ksf_id: string;
  ksf_name: string;
  actual: number;
  unit: string;
  consecutive_periods: number;
}

interface ManagementReport {
  week_start: string;
  zone1_outstanding: ZoneEntry[];
  zone2_positives: ZoneEntry[];
  zone3_chronic: ZoneEntry[];
  zone4_negatives: ZoneEntry[];
}

interface HealthIssue {
  type: string;
  message: string;
  target_name: string;
}

interface OrgHealth {
  issues: HealthIssue[];
  score: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<KsfStatus, { label: string; cls: string; bar: string }> = {
  OUTSTANDING:   { label: 'Sobresaliente', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', bar: 'bg-emerald-500' },
  SATISFACTORY:  { label: 'Satisfactorio', cls: 'text-indigo-400  bg-indigo-500/10  border-indigo-500/20',  bar: 'bg-indigo-500'  },
  IN_PROGRESS:   { label: 'En progreso',   cls: 'text-amber-400   bg-amber-500/10   border-amber-500/20',   bar: 'bg-amber-500'   },
  AT_MINIMUM:    { label: 'En mínimo',     cls: 'text-orange-400  bg-orange-500/10  border-orange-500/20',  bar: 'bg-orange-500'  },
  BELOW_MINIMUM: { label: 'Bajo mínimo',   cls: 'text-red-400     bg-red-500/10     border-red-500/20',     bar: 'bg-red-500'     },
  NO_DATA:       { label: 'Sin datos',     cls: 'text-gray-500    bg-gray-800       border-gray-700',       bar: 'bg-gray-700'    },
};

const CAT_CFG: Record<KsfCategory, { label: string; cls: string }> = {
  OPERATIONAL:  { label: 'Operacional',  cls: 'text-blue-400   bg-blue-500/10'   },
  COORDINATION: { label: 'Coordinación', cls: 'text-purple-400 bg-purple-500/10' },
  STRATEGIC:    { label: 'Estratégico',  cls: 'text-amber-400  bg-amber-500/10'  },
};

const ISSUE_LABELS: Record<string, string> = {
  missing_categories:    'Categorías faltantes',
  unset_levels:          'Niveles sin negociar',
  non_unique_manager_ksfs: 'KSFs no únicos para el rol',
  below_minimum_count:   'Menos de 3 KSFs',
  above_maximum_count:   'Más de 7 KSFs',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtWeek(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmt(n: number, unit: string) {
  return `${n.toLocaleString('es-MX')} ${unit}`;
}

// ─── KSF Card ────────────────────────────────────────────────────────────────

function KsfCard({ ksf }: { ksf: Ksf }) {
  const status = ksf.last_status ?? 'NO_DATA';
  const sc = STATUS_CFG[status];
  const cc = CAT_CFG[ksf.category];
  const actual = ksf.last_actual ?? 0;
  const outstanding = ksf.outstanding_level || 1;
  const pct            = Math.min(100, (actual / outstanding) * 100);
  const satisfactoryPct = Math.min(100, (ksf.satisfactory_level / outstanding) * 100);
  const minimumPct      = Math.min(100, (ksf.minimum_level / outstanding) * 100);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{ksf.name}</p>
          {ksf.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{ksf.description}</p>
          )}
        </div>
        <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0', cc.cls)}>
          {cc.label}
        </span>
      </div>

      {/* Valor actual + trend */}
      <div className="flex items-center gap-2 mb-3">
        {ksf.last_trend === 'UP'   && <TrendingUp  size={14} className="text-emerald-400" />}
        {ksf.last_trend === 'DOWN' && <TrendingDown size={14} className="text-red-400"    />}
        {(!ksf.last_trend || ksf.last_trend === 'STABLE') && <Minus size={14} className="text-gray-600" />}
        <span className="text-2xl font-bold text-white">
          {ksf.last_actual !== null ? ksf.last_actual.toLocaleString('es-MX') : '—'}
        </span>
        <span className="text-xs text-gray-500">{ksf.unit}</span>
        <span className={clsx('ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium border', sc.cls)}>
          {sc.label}
        </span>
      </div>

      {/* Progress bar con marcadores */}
      <div className="relative w-full bg-gray-800 rounded-full h-1.5 mb-2 overflow-visible">
        <div className={clsx('h-1.5 rounded-full transition-all', sc.bar)} style={{ width: `${pct}%` }} />
        {minimumPct > 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-orange-400/60 rounded-full"
            style={{ left: `${minimumPct}%` }}
          />
        )}
        {satisfactoryPct > 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-indigo-400/60 rounded-full"
            style={{ left: `${satisfactoryPct}%` }}
          />
        )}
      </div>

      <div className="flex justify-between text-[10px] text-gray-600">
        <span>Mín: {ksf.minimum_level.toLocaleString()}</span>
        <span>Sat: {ksf.satisfactory_level.toLocaleString()}</span>
        <span>Sob: {ksf.outstanding_level.toLocaleString()} {ksf.unit}</span>
      </div>
    </div>
  );
}

// ─── Feedback tab ─────────────────────────────────────────────────────────────

function FeedbackTab() {
  const [data, setData] = useState<FeedbackReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<FeedbackReport>('/goals/reports/feedback')
      .then(d => setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return (
    <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm">
      <AlertCircle size={14} />{error}
    </div>
  );

  const pos = data?.positive_results ?? [];
  const neg = data?.negative_results ?? [];

  if (!pos.length && !neg.length) {
    return (
      <EmptyState
        icon={BarChart2}
        title="Sin excepciones esta semana"
        subtitle="Todo dentro de los rangos esperados. El informe se actualiza cada lunes."
      />
    );
  }

  return (
    <div className="space-y-6">
      {data?.week_start && (
        <p className="text-xs text-gray-500">Semana del {fmtWeek(data.week_start)}</p>
      )}

      {pos.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={14} className="text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400">Resultados positivos ({pos.length})</span>
          </div>
          <div className="space-y-2">
            {pos.map(e => (
              <div key={e.ksf_id} className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{e.name}</p>
                  {(e.consecutive_periods ?? 0) > 1 && (
                    <p className="text-xs text-emerald-400 mt-0.5">{e.consecutive_periods} períodos consecutivos</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400">{fmt(e.actual, e.unit)}</p>
                  {e.satisfactory_level != null && (
                    <p className="text-[10px] text-gray-500">meta: {e.satisfactory_level.toLocaleString()} {e.unit}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {neg.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-red-400" />
            <span className="text-sm font-semibold text-red-400">Requieren atención ({neg.length})</span>
          </div>
          <div className="space-y-2">
            {neg.map(e => (
              <div key={e.ksf_id} className="flex items-center justify-between bg-red-500/5 border border-red-500/10 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{e.name}</p>
                  {(e.consecutive_periods ?? 0) > 1 && (
                    <p className="text-xs text-red-400 mt-0.5">{e.consecutive_periods} períodos por debajo del mínimo</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-400">{fmt(e.actual, e.unit)}</p>
                  {e.minimum_level != null && (
                    <p className="text-[10px] text-gray-500">mín: {e.minimum_level.toLocaleString()} {e.unit}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Management tab ───────────────────────────────────────────────────────────

function ManagementTab() {
  const [data, setData] = useState<ManagementReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ManagementReport>('/goals/reports/management')
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data) return (
    <EmptyState
      icon={Users}
      title="Sin informe de administración"
      subtitle="Necesitas tener colaboradores directos con KSFs configurados. Se actualiza cada lunes."
    />
  );

  const zones = [
    { key: 'zone1_outstanding', label: 'Zona 1 — Excelencia sostenida', entries: data.zone1_outstanding, border: 'border-emerald-500/20', head: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400', icon: Star },
    { key: 'zone2_positives',   label: 'Zona 2 — Positivos esta semana', entries: data.zone2_positives,   border: 'border-indigo-500/20',  head: 'text-indigo-400',  badge: 'bg-indigo-500/10 text-indigo-400',  icon: CheckCircle },
    { key: 'zone3_chronic',     label: 'Zona 3 — Problemas crónicos',    entries: data.zone3_chronic,     border: 'border-amber-500/20',   head: 'text-amber-400',   badge: 'bg-amber-500/10 text-amber-400',   icon: AlertTriangle },
    { key: 'zone4_negatives',   label: 'Zona 4 — Negativos esta semana', entries: data.zone4_negatives,   border: 'border-red-500/20',     head: 'text-red-400',     badge: 'bg-red-500/10 text-red-400',     icon: AlertTriangle },
  ];

  return (
    <div className="space-y-4">
      {data.week_start && (
        <p className="text-xs text-gray-500">Semana del {fmtWeek(data.week_start)}</p>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {zones.map(z => (
          <div key={z.key} className={clsx('bg-gray-900 border rounded-xl p-5', z.border)}>
            <div className="flex items-center gap-2 mb-4">
              <z.icon size={14} className={z.head} />
              <span className={clsx('text-sm font-semibold', z.head)}>{z.label}</span>
              <span className={clsx('ml-auto text-xs px-2 py-0.5 rounded-full font-medium', z.badge)}>
                {z.entries.length}
              </span>
            </div>
            {z.entries.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-6">Sin entradas esta semana</p>
            ) : (
              <div className="space-y-0 divide-y divide-gray-800">
                {z.entries.map((e, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-xs font-medium text-white">{e.slot_name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{e.ksf_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-white">{fmt(e.actual, e.unit)}</p>
                      {e.consecutive_periods > 0 && (
                        <p className="text-[10px] text-gray-500">{e.consecutive_periods}p consec.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Org tab ──────────────────────────────────────────────────────────────────

function OrgTab() {
  const [health, setHealth] = useState<OrgHealth | null>(null);
  const [pending, setPending] = useState<ZoneEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<OrgHealth>('/goals/org/health'),
      api.get<ZoneEntry[]>('/goals/recognition/pending'),
    ]).then(([h, p]) => {
      setHealth(h);
      setPending(Array.isArray(p) ? p : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const recognize = async (r: ZoneEntry) => {
    const key = r.slot_id + r.ksf_id;
    setSending(key);
    await api.post('/goals/recognition/send', {
      recognized_id: r.slot_id,
      ksf_id: r.ksf_id,
      channel: 'IN_APP',
    }).catch(() => {});
    setPending(prev => prev.filter(x => x.slot_id !== r.slot_id || x.ksf_id !== r.ksf_id));
    setSending(null);
  };

  if (loading) return <Spinner />;

  const score = health?.score ?? 0;
  const scoreColor = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';
  const barColor   = score >= 80 ? 'bg-emerald-500'   : score >= 60 ? 'bg-amber-500'   : 'bg-red-500';

  return (
    <div className="space-y-6">
      {/* Health score */}
      {health && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-gray-400" />
              <span className="text-sm font-semibold text-white">Salud organizacional</span>
            </div>
            <span className={clsx('text-4xl font-bold', scoreColor)}>{score}</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
            <div className={clsx('h-2 rounded-full transition-all', barColor)} style={{ width: `${score}%` }} />
          </div>

          {health.issues.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle size={13} />
              <span className="text-xs">Todos los objetivos correctamente configurados</span>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 font-medium">{health.issues.length} problema{health.issues.length !== 1 ? 's' : ''} detectado{health.issues.length !== 1 ? 's' : ''}:</p>
              {health.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-3 bg-gray-800/50 rounded-lg p-3">
                  <AlertCircle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-amber-300">
                      {ISSUE_LABELS[issue.type] ?? issue.type}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      <span className="text-gray-300">{issue.target_name}:</span> {issue.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending recognitions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Award size={14} className="text-amber-400" />
          <span className="text-sm font-semibold text-white">Reconocimientos pendientes</span>
          {pending.length > 0 && (
            <span className="ml-1 bg-amber-500/10 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-medium">
              {pending.length}
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-6">Sin reconocimientos pendientes esta semana</p>
        ) : (
          <div className="space-y-2">
            {pending.map(r => (
              <div key={r.slot_id + r.ksf_id} className="flex items-center justify-between bg-amber-500/5 border border-amber-500/10 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{r.slot_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {r.ksf_name} — {r.consecutive_periods} períodos sobresaliente
                  </p>
                </div>
                <button
                  onClick={() => recognize(r)}
                  disabled={sending === r.slot_id + r.ksf_id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-40"
                >
                  <Award size={11} />
                  {sending === r.slot_id + r.ksf_id ? 'Enviando...' : 'Reconocer'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GoalsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('ksfs');
  const [ksfs, setKsfs] = useState<Ksf[]>([]);
  const [ksfLoading, setKsfLoading] = useState(true);

  const isManager      = ['manager', 'admin', 'owner', 'superadmin'].includes(user?.role ?? '');
  const isOwnerOrAdmin = ['admin', 'owner', 'superadmin'].includes(user?.role ?? '');

  useEffect(() => {
    api.get<Ksf[]>('/goals/ksf/mine')
      .then(d => setKsfs(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setKsfLoading(false));
  }, []);

  const tabs = [
    { id: 'ksfs'       as Tab, label: 'Mis KSFs',          icon: Target,   show: true           },
    { id: 'feedback'   as Tab, label: 'Retroalimentación',  icon: BarChart2, show: true           },
    { id: 'management' as Tab, label: 'Administración',     icon: Users,    show: isManager      },
    { id: 'org'        as Tab, label: 'Organización',       icon: Activity, show: isOwnerOrAdmin },
  ].filter(t => t.show);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Objetivos</h1>
        <p className="text-gray-400 mt-1 text-sm">Administración en Una Página — seguimiento automático de KSFs</p>
      </div>

      {/* KSF counter strip */}
      {!ksfLoading && ksfs.length > 0 && (
        <div className="flex gap-3 mb-6 flex-wrap">
          {(['OUTSTANDING', 'SATISFACTORY', 'IN_PROGRESS', 'AT_MINIMUM', 'BELOW_MINIMUM', 'NO_DATA'] as KsfStatus[]).map(s => {
            const count = ksfs.filter(k => (k.last_status ?? 'NO_DATA') === s).length;
            if (!count) return null;
            return (
              <div key={s} className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium', STATUS_CFG[s].cls)}>
                <span>{count}</span>
                <span>{STATUS_CFG[s].label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === t.id
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800',
            )}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'ksfs' && (
        ksfLoading ? <Spinner /> :
        ksfs.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Sin KSFs configurados"
            subtitle="Habla con el CEO Digital para definir tus Factores Clave de Éxito usando la metodología AUP."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {ksfs.map(k => <KsfCard key={k.id} ksf={k} />)}
          </div>
        )
      )}

      {activeTab === 'feedback'   && <FeedbackTab />}
      {activeTab === 'management' && isManager      && <ManagementTab />}
      {activeTab === 'org'        && isOwnerOrAdmin && <OrgTab />}
    </div>
  );
}
