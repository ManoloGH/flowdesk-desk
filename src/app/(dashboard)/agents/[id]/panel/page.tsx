'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  LayoutDashboard, MessageSquare, Zap, BookOpen, Users, GitBranch,
  Package, Clock, UserCheck, ArrowUpRight, Brain, Settings, FileText,
  User2, HelpCircle, ChevronLeft, Loader2, Plus, Trash2, Check, X,
  RefreshCw, AlertCircle, CheckCircle, BarChart3, Bot, Pencil,
  ChevronRight, ChevronDown, Send, Search, Tag, Library,
  ThumbsUp, ThumbsDown, Sparkles,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AgentSlot {
  id: string;
  name: string;
  agent_role: string | null;
  agent_config: Record<string, any> | null;
  status: string;
}

interface DashboardData {
  total_conversations: number;
  conversations_this_month: number;
  corrections_total: number;
  active_skills: number;
  agent_role: string | null;
  handoffs_total?: number;
  active_conversations?: number;
  volume_30_days?: { date: string; count: number }[];
  mode_distribution?: { mode: string; count: number }[];
}

interface Conversation {
  id: string;
  phone?: string;
  contact_name?: string | null;
  mode?: string;
  last_message_at?: string | null;
  messages_count?: number;
  created_at: string;
}

interface Correction {
  id: string;
  source: string;
  verdict: string;
  original_text?: string;
  corrected_text?: string;
  note?: string;
  created_at: string;
}

interface Skill {
  id: string;
  name: string;
  trigger_condition: string;
  response_instructions: string;
  example_conversation?: string;
  action_type: string;
  action_config?: Record<string, string> | null;
  status: string;
  created_at: string;
}

interface CalibratorData {
  calibrated_at: string | null;
  last_evolved_at: string | null;
  current_instructions: string | null;
  coverage: {
    founder_profile: boolean;
    brain_docs: number;
    culture_blueprint: boolean;
    operating_map: boolean;
    communication_profile: boolean;
  };
  pending_evolution: {
    id: string;
    description: string;
    context: any;
    created_at: string;
  } | null;
}

interface BotMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface ConvDetail {
  conversation: {
    id: string;
    phone: string;
    contact_name: string | null;
    mode: string;
    instance_name: string;
    last_message_at: string | null;
  };
  messages: BotMessage[];
}

interface AvailableModel {
  id: string;
  provider: string;
  model_id: string;
  display_name: string;
  tier: string;
}

interface AgentCase {
  id: string;
  name: string;
  linea?: string | null;
  area?: string | null;
  content: string;
  disposition: string;
  status: string;
  created_at: string;
}

interface AgentClassification {
  id: string;
  source: string;
  message_text?: string | null;
  resolution: string;
  caso?: string | null;
  feedback?: string | null;
  created_at: string;
}

interface DeliverableQuestion {
  field: string;
  question: string;
  order: number;
}

interface DeliverableSection {
  title: string;
  prompt: string;
}

interface Deliverable {
  id: string;
  name: string;
  description: string;
  offer_text: string;
  questions: DeliverableQuestion[];
  sections: DeliverableSection[];
  status: string;
  created_at: string;
}

interface DeliverableResponse {
  id: string;
  token: string;
  prospect_name?: string | null;
  answers: Record<string, string>;
  created_at: string;
}

// ── Nav Structure ──────────────────────────────────────────────────────────────

type SectionId =
  | 'inicio' | 'conversaciones' | 'probar' | 'clasificaciones'
  | 'skills' | 'base-conocimiento' | 'catalogo'
  | 'prospectos' | 'journey' | 'entregable' | 'seguimiento'
  | 'agentes-humanos' | 'escalacion'
  | 'calibrador'
  | 'configuracion' | 'auditoria' | 'usuarios' | 'manual';

interface NavGroup {
  label: string;
  items: { id: SectionId; label: string; icon: any; salesOnly?: boolean }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'General',
    items: [
      { id: 'inicio', label: 'Inicio', icon: LayoutDashboard },
      { id: 'conversaciones', label: 'Conversaciones', icon: MessageSquare },
      { id: 'clasificaciones', label: 'Clasificaciones', icon: Tag },
      { id: 'skills', label: 'Skills', icon: Zap },
    ],
  },
  {
    label: 'Conocimiento',
    items: [
      { id: 'base-conocimiento', label: 'Base de conocimiento', icon: BookOpen },
      { id: 'catalogo', label: 'Catálogo de casos', icon: Library },
    ],
  },
  {
    label: 'Clientes',
    items: [
      { id: 'prospectos', label: 'Prospectos', icon: Users, salesOnly: true },
      { id: 'journey', label: 'Journey del cliente', icon: GitBranch, salesOnly: true },
      { id: 'seguimiento', label: 'Seguimiento', icon: Clock, salesOnly: true },
    ],
  },
  {
    label: 'Escalación',
    items: [
      { id: 'agentes-humanos', label: 'Agentes humanos', icon: UserCheck },
      { id: 'escalacion', label: 'Configurar escalación', icon: ArrowUpRight },
    ],
  },
  {
    label: 'Aprendizaje',
    items: [
      { id: 'calibrador', label: 'Calibrador', icon: Brain },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { id: 'configuracion', label: 'Configuración', icon: Settings },
      { id: 'auditoria', label: 'Auditoría', icon: FileText },
      { id: 'usuarios', label: 'Usuarios', icon: User2 },
      { id: 'manual', label: 'Manual de uso', icon: HelpCircle },
    ],
  },
];

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AgentPanelPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;

  const [activeSection, setActiveSection] = useState<SectionId>('inicio');
  const [agent, setAgent] = useState<AgentSlot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<AgentSlot>(`/agent-panel/${agentId}`)
      .then(setAgent)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [agentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 size={24} className="text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500">Agente no encontrado</p>
      </div>
    );
  }

  const isSales = agent.agent_role === 'sales';

  const visibleGroups = NAV_GROUPS.map(g => ({
    ...g,
    items: g.items.filter(item => !item.salesOnly || isSales),
  })).filter(g => g.items.length > 0);

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-gray-800 flex flex-col">
        {/* Back + Agent name */}
        <div className="p-4 border-b border-gray-800">
          <button
            onClick={() => router.push('/agents')}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-400 transition-colors mb-3"
          >
            <ChevronLeft size={13} /> Volver
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-indigo-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{agent.name}</p>
              <p className="text-[10px] text-gray-600 capitalize">{agent.agent_role ?? 'agente'}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2">
          {visibleGroups.map(group => (
            <div key={group.label} className="mb-4">
              <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest px-2 mb-1">
                {group.label}
              </p>
              {group.items.map(item => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs font-medium transition-all mb-0.5 ${
                      active
                        ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
                        : 'text-gray-500 hover:text-gray-400 hover:bg-gray-900'
                    }`}
                  >
                    <Icon size={13} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-h-screen">
        <SectionRenderer
          section={activeSection}
          agentId={agentId}
          agent={agent}
          setAgent={setAgent}
          setSection={setActiveSection}
        />
      </main>
    </div>
  );
}

// ── Section Renderer ───────────────────────────────────────────────────────────

function SectionRenderer({
  section, agentId, agent, setAgent, setSection,
}: {
  section: SectionId;
  agentId: string;
  agent: AgentSlot;
  setAgent: (a: AgentSlot) => void;
  setSection: (s: SectionId) => void;
}) {
  switch (section) {
    case 'inicio':           return <SectionInicio agentId={agentId} />;
    case 'conversaciones':   return <SectionConversaciones agentId={agentId} setSection={setSection} />;
    case 'probar':           return <SectionProbar agentId={agentId} />;
    case 'clasificaciones':  return <SectionClasificaciones agentId={agentId} />;
    case 'catalogo':         return <SectionCatalogo agentId={agentId} />;
    case 'skills':           return <SectionSkills agentId={agentId} />;
    case 'base-conocimiento': return <SectionBaseConocimiento agentId={agentId} agent={agent} setAgent={setAgent} />;
    case 'calibrador':       return <SectionCalibrador agentId={agentId} />;
    case 'configuracion':    return <SectionConfiguracion agentId={agentId} agent={agent} setAgent={setAgent} />;
    case 'auditoria':        return <SectionAuditoria agentId={agentId} />;
    case 'prospectos':       return <SectionProspectos agentId={agentId} />;
    case 'journey':          return <SectionJourney agentId={agentId} agent={agent} setAgent={setAgent} />;
    case 'entregable':       return <SectionEntregables agentId={agentId} />;
    default:                 return <SectionStub label={section} />;
  }
}

// ── Shared UI ──────────────────────────────────────────────────────────────────

function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-gray-800 px-8 py-6">
      <h1 className="text-lg font-bold text-white">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}

function SectionStub({ label }: { label: string }) {
  return (
    <div className="p-8">
      <PageHeader title={label.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} />
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center mb-3">
          <AlertCircle size={20} className="text-gray-700" />
        </div>
        <p className="text-sm text-gray-500">Próximamente disponible</p>
        <p className="text-xs text-gray-700 mt-1">Esta sección está en desarrollo.</p>
      </div>
    </div>
  );
}

// ── Conversation helpers ───────────────────────────────────────────────────────

const CONV_MODE: Record<string, { label: string; bg: string; dot: string }> = {
  AI:       { label: 'Bot activo',  bg: 'bg-indigo-500/15 text-indigo-400',  dot: 'bg-indigo-500' },
  ai:       { label: 'Bot activo',  bg: 'bg-indigo-500/15 text-indigo-400',  dot: 'bg-indigo-500' },
  human:    { label: 'Asesor',      bg: 'bg-amber-500/15 text-amber-400',    dot: 'bg-amber-500'  },
  HUMAN:    { label: 'Asesor',      bg: 'bg-amber-500/15 text-amber-400',    dot: 'bg-amber-500'  },
  resolved: { label: 'Resuelto',    bg: 'bg-green-500/15 text-green-400',    dot: 'bg-green-500'  },
  RESOLVED: { label: 'Resuelto',    bg: 'bg-green-500/15 text-green-400',    dot: 'bg-green-500'  },
};
function getConvMode(mode?: string) {
  return CONV_MODE[mode ?? 'AI'] ?? { label: mode ?? 'Bot', bg: 'bg-gray-800 text-gray-400', dot: 'bg-gray-500' };
}
function fmtConvDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

// ── Chart Helpers ──────────────────────────────────────────────────────────────

function VolumeChart({ data }: { data: { date: string; count: number }[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const W = 1000;
  const H = 80;
  const gap = 2;
  const barW = Math.floor((W - gap * (data.length - 1)) / data.length);
  const labelIndices = [0, 6, 13, 20, 29];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height: 80 }}>
        <defs>
          <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const barH = d.count > 0 ? Math.max((d.count / maxCount) * H, 3) : 0;
          return (
            <rect
              key={d.date}
              x={i * (barW + gap)}
              y={H - barH}
              width={barW}
              height={barH}
              rx={1}
              fill="url(#vg)"
            />
          );
        })}
        <line x1={0} y1={H} x2={W} y2={H} stroke="#374151" strokeWidth={1} />
      </svg>
      <div className="flex justify-between mt-2">
        {data
          .filter((_, i) => labelIndices.includes(i))
          .map(d => (
            <span key={d.date} className="text-[10px] text-gray-600">
              {new Date(d.date + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
            </span>
          ))}
      </div>
    </div>
  );
}

function ModeDistribution({ distribution, total }: {
  distribution: { mode: string; count: number }[];
  total: number;
}) {
  const MODE_META: Record<string, { bg: string; text: string; label: string }> = {
    AI: { bg: 'bg-indigo-500', text: 'text-indigo-400', label: 'Bot (IA)' },
    human: { bg: 'bg-amber-500', text: 'text-amber-400', label: 'Asesor humano' },
    HUMAN: { bg: 'bg-amber-500', text: 'text-amber-400', label: 'Asesor humano' },
    qualified: { bg: 'bg-green-500', text: 'text-green-400', label: 'Calificado' },
  };
  const FALLBACK = [
    { bg: 'bg-purple-500', text: 'text-purple-400' },
    { bg: 'bg-cyan-500', text: 'text-cyan-400' },
    { bg: 'bg-rose-500', text: 'text-rose-400' },
  ];
  const sorted = [...distribution].sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-3">
      {sorted.map((item, i) => {
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
        const meta = MODE_META[item.mode] ?? { ...FALLBACK[i % FALLBACK.length], label: item.mode };
        return (
          <div key={item.mode} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-24 flex-shrink-0">{meta.label}</span>
            <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div className={`h-1.5 rounded-full ${meta.bg}`} style={{ width: `${pct}%` }} />
            </div>
            <span className={`text-xs font-semibold ${meta.text} w-9 text-right tabular-nums`}>{pct}%</span>
            <span className="text-xs text-gray-600 w-8 text-right tabular-nums">{item.count}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── SECCIÓN: Inicio ────────────────────────────────────────────────────────────

function SectionInicio({ agentId }: { agentId: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get<DashboardData>(`/agent-panel/${agentId}/dashboard`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [agentId]);

  useEffect(() => { load(); }, [load]);

  const isSales = data?.agent_role === 'sales';
  const total = data?.total_conversations ?? 0;
  const handoffs = data?.handoffs_total ?? 0;
  const handoffPct = total > 0 ? Math.round((handoffs / total) * 100) : 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between border-b border-gray-800 pb-6 mb-6">
        <div>
          <h1 className="text-lg font-bold text-white">Inicio</h1>
          <p className="text-sm text-gray-500 mt-0.5">Métricas y resumen del agente</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-400 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={20} className="text-indigo-500 animate-spin" />
        </div>
      ) : data ? (
        <div className="space-y-5">

          {/* KPI Row 1 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Conversaciones totales" value={data.total_conversations} />
            <StatCard label="Este mes" value={data.conversations_this_month} />
            {isSales ? (
              <>
                <StatCard label="Activas (últimas 24h)" value={data.active_conversations ?? 0} />
                <StatCard
                  label="Turnadas al asesor"
                  value={handoffs}
                  sub={total > 0 ? `${handoffPct}% del total` : undefined}
                />
              </>
            ) : (
              <>
                <StatCard label="Correcciones" value={data.corrections_total} sub="Para entrenamiento" />
                <StatCard label="Skills activos" value={data.active_skills} />
              </>
            )}
          </div>

          {/* Sales — gráficas y análisis */}
          {isSales && (
            <>
              {/* Volumen 30 días */}
              {data.volume_30_days && data.volume_30_days.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
                    Volumen últimos 30 días
                  </p>
                  <VolumeChart data={data.volume_30_days} />
                </div>
              )}

              {/* Distribución + Bot vs Asesor */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {data.mode_distribution && data.mode_distribution.length > 0 && (
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
                      Distribución por modo
                    </p>
                    <ModeDistribution distribution={data.mode_distribution} total={total} />
                  </div>
                )}

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
                    Bot vs. Asesor
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                        <span className="text-xs text-gray-400">Gestionadas por bot</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-white tabular-nums">{total - handoffs}</span>
                        <span className="text-xs text-gray-600 ml-1.5">
                          {total > 0 ? `${100 - handoffPct}%` : '—'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                        <span className="text-xs text-gray-400">Turnadas al asesor</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-white tabular-nums">{handoffs}</span>
                        <span className="text-xs text-gray-600 ml-1.5">
                          {total > 0 ? `${handoffPct}%` : '—'}
                        </span>
                      </div>
                    </div>
                    {/* Stacked bar */}
                    <div className="flex h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-indigo-500 transition-all" style={{ flex: Math.max(total - handoffs, 0) }} />
                      <div className="bg-amber-500 transition-all" style={{ flex: Math.max(handoffs, 0) }} />
                    </div>
                    {/* Secondary stats */}
                    <div className="pt-3 border-t border-gray-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Correcciones de entrenamiento</span>
                        <span className="text-xs font-semibold text-white tabular-nums">{data.corrections_total}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Skills activos</span>
                        <span className="text-xs font-semibold text-white tabular-nums">{data.active_skills}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-16">No se pudieron cargar las métricas.</p>
      )}
    </div>
  );
}

// ── SECCIÓN: Conversaciones ────────────────────────────────────────────────────

function SectionConversaciones({ agentId, setSection }: { agentId: string; setSection: (s: SectionId) => void }) {
  const [tab, setTab] = useState<'real' | 'corrections'>('real');
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [convDetail, setConvDetail] = useState<ConvDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [convTotal, setConvTotal] = useState(0);
  const totalPages = Math.ceil(convTotal / 20) || 1;

  useEffect(() => {
    if (tab === 'real') {
      setLoading(true);
      api.get<{ items: Conversation[]; total: number }>(`/agent-panel/${agentId}/conversations?page=${page}&limit=20`)
        .then(d => {
          setConvs(d.items ?? []);
          setConvTotal(d.total ?? 0);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(true);
      api.get<Correction[]>(`/agent-panel/${agentId}/corrections`)
        .then(d => setCorrections(Array.isArray(d) ? d : []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [agentId, tab, page]);

  const [correctingId, setCorrectingId] = useState<string | null>(null);
  const [correctionForm, setCorrectionForm] = useState({ corrected_text: '', note: '' });
  const [savingCorrection, setSavingCorrection] = useState(false);
  const [savedCorrections, setSavedCorrections] = useState<Set<string>>(new Set());

  const openConv = (convId: string) => {
    setSelectedConvId(convId);
    setDetailLoading(true);
    setConvDetail(null);
    setCorrectingId(null);
    api.get<ConvDetail>(`/agent-panel/${agentId}/conversations/${convId}/messages`)
      .then(setConvDetail)
      .catch(console.error)
      .finally(() => setDetailLoading(false));
  };

  const startCorrection = (msg: BotMessage) => {
    setCorrectingId(msg.id);
    setCorrectionForm({ corrected_text: '', note: '' });
  };

  const saveCorrection = async (msg: BotMessage) => {
    if (!correctionForm.corrected_text.trim()) return;
    setSavingCorrection(true);
    try {
      await api.post(`/agent-panel/${agentId}/corrections`, {
        original_text: msg.content,
        corrected_text: correctionForm.corrected_text,
        note: correctionForm.note || undefined,
        verdict: 'error',
        source: 'conversation',
        conversation_id: convDetail?.conversation.id,
      });
      setSavedCorrections(prev => new Set(prev).add(msg.id));
      setCorrectingId(null);
    } catch (e: any) { alert(e?.message ?? 'Error al guardar'); }
    setSavingCorrection(false);
  };

  // Pantalla de detalle de conversación (full-screen)
  if (selectedConvId) {
    return (
      <div className="flex flex-col h-screen bg-gray-950">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-4 px-6 py-4 border-b border-gray-800 bg-gray-950">
          <button
            onClick={() => { setSelectedConvId(null); setConvDetail(null); setCorrectingId(null); }}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} /> Volver
          </button>
          <div className="h-4 w-px bg-gray-800" />
          <div>
            <p className="text-sm font-semibold text-white">
              {convDetail?.conversation.contact_name ?? convDetail?.conversation.phone ?? 'Conversación'}
            </p>
            <p className="text-xs text-gray-500">
              {convDetail?.conversation.phone}
              {convDetail?.conversation.instance_name && ` · ${convDetail.conversation.instance_name}`}
            </p>
          </div>
          <div className="ml-auto">
            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
              {convDetail?.conversation.mode ?? 'AI'}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {detailLoading ? (
            <div className="flex justify-center pt-20"><Loader2 size={22} className="text-indigo-500 animate-spin" /></div>
          ) : !convDetail || convDetail.messages.length === 0 ? (
            <p className="text-sm text-gray-500 text-center pt-20">Sin mensajes registrados.</p>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              {convDetail.messages.map(m => {
                const isAgent = m.role !== 'user';
                const isCorrecting = correctingId === m.id;
                const alreadyCorrected = savedCorrections.has(m.id);
                return (
                  <div key={m.id} className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}>
                    {/* Role label */}
                    <p className="text-[10px] text-gray-600 mb-1 px-1">
                      {isAgent ? 'Agente' : 'Cliente'}
                    </p>

                    {/* Bubble */}
                    <div className={`group relative max-w-[75%] rounded-2xl px-4 py-3 ${
                      isAgent
                        ? 'bg-gray-800 text-gray-100 rounded-tl-sm'
                        : 'bg-indigo-600 text-white rounded-tr-sm'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      <p className={`text-[10px] mt-1.5 ${isAgent ? 'text-gray-500' : 'text-indigo-300'}`}>
                        {new Date(m.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </p>

                      {/* Botón Corregir — solo mensajes del agente */}
                      {isAgent && !isCorrecting && (
                        <div className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {alreadyCorrected ? (
                            <span className="flex items-center gap-1 text-[10px] text-green-500">
                              <Check size={10} /> Corrección guardada
                            </span>
                          ) : (
                            <button
                              onClick={() => startCorrection(m)}
                              className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 transition-colors"
                            >
                              <Pencil size={10} /> Corregir respuesta
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Formulario de corrección inline */}
                    {isCorrecting && (
                      <div className="mt-6 w-full max-w-[75%] bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Pencil size={12} className="text-amber-400" />
                          <p className="text-xs font-semibold text-amber-400">¿Cómo debería haber respondido el agente?</p>
                        </div>
                        <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-3">
                          <p className="text-[10px] text-gray-500 mb-1">Respuesta original del agente</p>
                          <p className="text-xs text-gray-400 italic">{m.content}</p>
                        </div>
                        <textarea
                          autoFocus
                          value={correctionForm.corrected_text}
                          onChange={e => setCorrectionForm(p => ({ ...p, corrected_text: e.target.value }))}
                          placeholder="Escribe cómo debería haber respondido el agente..."
                          rows={3}
                          className="w-full bg-gray-900 border border-amber-500/40 rounded-lg p-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-amber-400"
                        />
                        <input
                          value={correctionForm.note}
                          onChange={e => setCorrectionForm(p => ({ ...p, note: e.target.value }))}
                          placeholder="Nota adicional (opcional): por qué estaba mal, contexto..."
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gray-600"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveCorrection(m)}
                            disabled={savingCorrection || !correctionForm.corrected_text.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-900 text-sm font-semibold rounded-lg transition-colors"
                          >
                            {savingCorrection ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            Guardar corrección
                          </button>
                          <button
                            onClick={() => setCorrectingId(null)}
                            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-400 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Spacer para que el último mensaje no quede tapado por el botón hover */}
              <div className="h-8" />
            </div>
          )}
        </div>
      </div>
    );
  }

  const uniqueModes = [...new Set(convs.map(c => c.mode).filter((m): m is string => Boolean(m)))];
  const filtered = convs
    .filter(c => modeFilter === 'all' || c.mode === modeFilter)
    .filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (c.contact_name ?? '').toLowerCase().includes(q) || (c.phone ?? '').toLowerCase().includes(q);
    });

  return (
    <div className="p-8">
      <PageHeader title="Conversaciones" subtitle="Historial y correcciones para entrenamiento" />

      {/* Acceso rápido a prueba */}
      <div className="mt-5">
        <button
          onClick={() => setSection('probar')}
          className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 hover:border-indigo-500/30 rounded-lg px-3 py-2 transition-all"
        >
          <Send size={11} />
          Probar agente en vivo
          <span className="text-indigo-500 ml-0.5">→</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mt-5 border-b border-gray-800 mb-6">
        {(['real', 'corrections'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-400'
            }`}
          >
            {t === 'real' ? 'Historial' : 'Correcciones'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={20} className="text-indigo-500 animate-spin" /></div>
      ) : tab === 'real' ? (
        <div>
          {/* Filtros y búsqueda */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <select
                value={modeFilter}
                onChange={e => { setModeFilter(e.target.value); setPage(1); }}
                className="appearance-none bg-gray-900 border border-gray-800 rounded-lg pl-3 pr-8 py-2 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">Todos los estados</option>
                {uniqueModes.map(m => (
                  <option key={m} value={m}>{getConvMode(m).label}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
              <input
                type="text"
                placeholder="Buscar por nombre o teléfono..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-8 pr-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <span className="text-xs text-gray-600 ml-auto">{convTotal} conversación{convTotal !== 1 ? 'es' : ''}</span>
          </div>

          {/* Tabla */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {/* Header columnas */}
            <div className="grid grid-cols-[140px_1fr_120px_70px_150px] gap-0 px-5 py-2.5 border-b border-gray-800">
              {['ÚLTIMA ACT.', 'BROKER', 'ESTADO', 'MSGS', 'INICIO'].map(h => (
                <p key={h} className="text-[10px] font-semibold text-gray-600 tracking-wide uppercase">{h}</p>
              ))}
            </div>

            {/* Filas */}
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-16">Sin conversaciones aún.</p>
            ) : (
              <div className="divide-y divide-gray-800/70">
                {filtered.map(c => {
                  const cm = getConvMode(c.mode);
                  return (
                    <button
                      key={c.id}
                      onClick={() => openConv(c.id)}
                      className="w-full grid grid-cols-[140px_1fr_120px_70px_150px] gap-0 px-5 py-3.5 hover:bg-gray-800/40 transition-colors text-left"
                    >
                      {/* Última actividad */}
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${cm.dot}`} />
                        <span className="text-xs text-gray-300 font-medium tabular-nums">{fmtConvDate(c.last_message_at ?? c.created_at)}</span>
                      </div>
                      {/* Broker (nombre + teléfono) */}
                      <div className="min-w-0 pr-4">
                        <p className="text-sm font-medium text-white truncate">{c.contact_name ?? c.phone ?? 'Sin nombre'}</p>
                        {c.phone && c.contact_name && (
                          <p className="text-xs text-gray-500 truncate">{c.phone}</p>
                        )}
                      </div>
                      {/* Estado */}
                      <div className="flex items-center">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cm.bg}`}>{cm.label}</span>
                      </div>
                      {/* Mensajes */}
                      <div className="flex items-center">
                        <span className="text-sm text-gray-400 tabular-nums">{c.messages_count ?? 0}</span>
                      </div>
                      {/* Inicio */}
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 tabular-nums">{fmtConvDate(c.created_at)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <span className="text-xs text-gray-600">{convTotal} conversaciones</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-xs text-gray-400 hover:text-white disabled:text-gray-700 disabled:cursor-not-allowed transition-colors"
                >
                  ← Anterior
                </button>
                <span className="text-xs text-gray-500">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="text-xs text-gray-400 hover:text-white disabled:text-gray-700 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <CorrectionsPanel agentId={agentId} corrections={corrections} setCorrections={setCorrections} />
      )}
    </div>
  );
}

function CorrectionsPanel({
  agentId, corrections, setCorrections,
}: {
  agentId: string;
  corrections: Correction[];
  setCorrections: (c: Correction[]) => void;
}) {
  const [form, setForm] = useState({ original_text: '', corrected_text: '', note: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.original_text.trim()) return;
    setSaving(true);
    try {
      const created = await api.post<Correction>(`/agent-panel/${agentId}/corrections`, { ...form, verdict: 'error', source: 'real' });
      setCorrections([created, ...corrections]);
      setForm({ original_text: '', corrected_text: '', note: '' });
    } catch (e: any) { alert(e?.message ?? 'Error'); }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      {/* Add correction */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <p className="text-xs font-semibold text-gray-400 mb-3">Nueva corrección</p>
        <textarea
          value={form.original_text}
          onChange={e => setForm(p => ({ ...p, original_text: e.target.value }))}
          placeholder="¿Qué dijo el agente (texto original)?"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-indigo-500 mb-2"
          rows={2}
        />
        <textarea
          value={form.corrected_text}
          onChange={e => setForm(p => ({ ...p, corrected_text: e.target.value }))}
          placeholder="¿Cómo debería haber respondido? (opcional)"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-indigo-500 mb-2"
          rows={2}
        />
        <input
          value={form.note}
          onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
          placeholder="Nota adicional (opcional)"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 mb-3"
        />
        <button onClick={save} disabled={saving || !form.original_text.trim()} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Guardar corrección
        </button>
      </div>

      {corrections.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">Sin correcciones guardadas.</p>
      ) : (
        corrections.map(c => (
          <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${c.verdict === 'error' ? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400'}`}>
                {c.verdict === 'error' ? 'Error detectado' : 'Correcto'}
              </span>
              <span className="text-[10px] text-gray-600">{c.source} · {new Date(c.created_at).toLocaleDateString('es-MX')}</span>
            </div>
            {c.original_text && <p className="text-xs text-gray-400 mb-1"><span className="text-gray-600">Original:</span> {c.original_text}</p>}
            {c.corrected_text && <p className="text-xs text-indigo-400"><span className="text-gray-600">Corrección:</span> {c.corrected_text}</p>}
            {c.note && <p className="text-xs text-gray-500 mt-1 italic">{c.note}</p>}
          </div>
        ))
      )}
    </div>
  );
}

// ── SECCIÓN: Skills ────────────────────────────────────────────────────────────

const ACTION_TYPE_LABELS: Record<string, string> = {
  text: 'Texto',
  entregable: 'Entregable',
  schedule_meeting: 'Agendar reunión',
  webhook: 'Webhook',
  send_image: 'Enviar imagen',
  send_video: 'Enviar video',
  create_crm_contact: 'Crear contacto CRM',
  notify_team: 'Notificar equipo',
  send_custom_buttons: 'Botones personalizados',
};

const ACTION_TYPE_COLORS: Record<string, string> = {
  text: 'bg-gray-800 text-gray-400',
  entregable: 'bg-purple-500/15 text-purple-400',
  schedule_meeting: 'bg-blue-500/15 text-blue-400',
  webhook: 'bg-orange-500/15 text-orange-400',
  send_image: 'bg-pink-500/15 text-pink-400',
  send_video: 'bg-rose-500/15 text-rose-400',
  create_crm_contact: 'bg-green-500/15 text-green-400',
  notify_team: 'bg-yellow-500/15 text-yellow-400',
  send_custom_buttons: 'bg-cyan-500/15 text-cyan-400',
};

const EMPTY_SKILL_FORM = {
  name: '',
  trigger_condition: '',
  response_instructions: '',
  example_conversation: '',
  action_type: 'text',
  cal_url: '',
  webhook_url: '',
  image_url: '',
  video_url: '',
  media_caption: '',
  team_phone: '',
  message_template: '',
  button_labels: '',
  deliverable_id: '',
};

const EMPTY_DELIV_FORM = {
  offer_text: '',
  questions: [] as DeliverableQuestion[],
  sections: [] as DeliverableSection[],
};

function SectionSkills({ agentId }: { agentId: string }) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_SKILL_FORM);
  const [delivForm, setDelivForm] = useState({ ...EMPTY_DELIV_FORM });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([
      api.get<Skill[]>(`/agent-panel/${agentId}/skills`),
      api.get<Deliverable[]>(`/agent-panel/${agentId}/deliverables`),
    ]).then(([s, d]) => {
      setSkills(Array.isArray(s) ? s : []);
      setDeliverables(Array.isArray(d) ? d : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [agentId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name.trim() || !form.trigger_condition.trim()) return;
    if (form.action_type === 'entregable' && !form.deliverable_id) {
      alert('Selecciona un entregable o crea uno primero en el tab Entregables');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        name: form.name,
        trigger_condition: form.trigger_condition,
        response_instructions: form.response_instructions,
        example_conversation: form.example_conversation,
        action_type: form.action_type,
      };
      if (form.action_type === 'entregable') {
        payload.action_config = { deliverable_id: form.deliverable_id };
        // Guardar cambios al entregable en paralelo
        await api.patch(`/agent-panel/${agentId}/deliverables/${form.deliverable_id}`, {
          offer_text: delivForm.offer_text,
          questions: delivForm.questions,
          sections: delivForm.sections,
        });
        setDeliverables(prev => prev.map(d =>
          d.id === form.deliverable_id ? { ...d, ...delivForm } : d
        ));
      } else if (form.action_type === 'schedule_meeting' && form.cal_url.trim()) {
        payload.action_config = { cal_url: form.cal_url.trim() };
      } else if (form.action_type === 'webhook' && form.webhook_url.trim()) {
        payload.action_config = { webhook_url: form.webhook_url.trim() };
      } else if (form.action_type === 'send_image') {
        payload.action_config = { url: form.image_url.trim(), caption: form.media_caption.trim() };
      } else if (form.action_type === 'send_video') {
        payload.action_config = { url: form.video_url.trim(), caption: form.media_caption.trim() };
      } else if (form.action_type === 'notify_team') {
        payload.action_config = { phone: form.team_phone.trim(), message_template: form.message_template.trim() };
      } else if (form.action_type === 'send_custom_buttons') {
        payload.action_config = { button_labels: form.button_labels.trim() };
      }
      if (editingId) {
        const updated = await api.patch<Skill>(`/agent-panel/${agentId}/skills/${editingId}`, payload);
        setSkills(prev => prev.map(s => s.id === editingId ? updated : s));
      } else {
        const created = await api.post<Skill>(`/agent-panel/${agentId}/skills`, payload);
        setSkills(prev => [...prev, created]);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_SKILL_FORM);
      setDelivForm({ ...EMPTY_DELIV_FORM });
    } catch (e: any) { alert(e?.message ?? 'Error'); }
    setSaving(false);
  };

  const deleteSkill = async (id: string) => {
    if (!confirm('¿Eliminar este skill?')) return;
    try {
      await api.delete(`/agent-panel/${agentId}/skills/${id}`);
      setSkills(prev => prev.filter(s => s.id !== id));
    } catch (e: any) { alert(e?.message ?? 'Error'); }
  };

  const startEdit = (s: Skill) => {
    setEditingId(s.id);
    const delivId = (s.action_config as any)?.deliverable_id ?? '';
    setForm({
      name: s.name,
      trigger_condition: s.trigger_condition,
      response_instructions: s.response_instructions,
      example_conversation: s.example_conversation ?? '',
      action_type: s.action_type ?? 'text',
      cal_url: (s.action_config as any)?.cal_url ?? '',
      webhook_url: (s.action_config as any)?.webhook_url ?? '',
      image_url: (s.action_config as any)?.url ?? '',
      video_url: (s.action_config as any)?.url ?? '',
      media_caption: (s.action_config as any)?.caption ?? '',
      team_phone: (s.action_config as any)?.phone ?? '',
      message_template: (s.action_config as any)?.message_template ?? '',
      button_labels: (s.action_config as any)?.button_labels ?? '',
      deliverable_id: delivId,
    });
    if (delivId) {
      const parseJson = (v: any) => Array.isArray(v) ? v : (typeof v === 'string' ? JSON.parse(v) : []);
      const d = deliverables.find(x => x.id === delivId);
      if (d) setDelivForm({ offer_text: d.offer_text ?? '', questions: parseJson(d.questions), sections: parseJson(d.sections) });
    }
    setShowForm(true);
  };

  const selectDeliverable = (id: string) => {
    setForm(p => ({ ...p, deliverable_id: id }));
    if (id) {
      const parseJson = (v: any) => Array.isArray(v) ? v : (typeof v === 'string' ? JSON.parse(v) : []);
      const d = deliverables.find(x => x.id === id);
      if (d) setDelivForm({ offer_text: d.offer_text ?? '', questions: parseJson(d.questions), sections: parseJson(d.sections) });
    } else {
      setDelivForm({ ...EMPTY_DELIV_FORM });
    }
  };

  const addDelivQ = () => setDelivForm(p => ({
    ...p,
    questions: [...p.questions, { field: `pregunta_${p.questions.length + 1}`, question: '', order: p.questions.length + 1 }],
  }));
  const updateDelivQ = (i: number, patch: Partial<DeliverableQuestion>) =>
    setDelivForm(p => ({ ...p, questions: p.questions.map((q, idx) => idx === i ? { ...q, ...patch } : q) }));
  const removeDelivQ = (i: number) =>
    setDelivForm(p => ({ ...p, questions: p.questions.filter((_, idx) => idx !== i).map((q, idx) => ({ ...q, order: idx + 1 })) }));

  const addDelivS = () => setDelivForm(p => ({ ...p, sections: [...p.sections, { title: '', prompt: '' }] }));
  const updateDelivS = (i: number, patch: Partial<DeliverableSection>) =>
    setDelivForm(p => ({ ...p, sections: p.sections.map((s, idx) => idx === i ? { ...s, ...patch } : s) }));
  const removeDelivS = (i: number) =>
    setDelivForm(p => ({ ...p, sections: p.sections.filter((_, idx) => idx !== i) }));

  const isActionSkill = form.action_type !== 'text';

  return (
    <div className="p-8">
      <PageHeader title="Skills" subtitle="Habilidades especiales del agente para situaciones específicas" />

      <div className="mt-6">
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_SKILL_FORM); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors mb-6"
          >
            <Plus size={14} /> Nuevo skill
          </button>
        )}

        {showForm && (
          <div className="bg-gray-900 border border-indigo-500/30 rounded-xl p-6 mb-6">
            <p className="text-sm font-semibold text-white mb-4">{editingId ? 'Editar skill' : 'Nuevo skill'}</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Nombre del skill</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" placeholder="ej. Ofrecer micro-diagnóstico" />
              </div>

              {/* Tipo de acción */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Tipo de skill</label>
                <div className="flex gap-2 flex-wrap">
                  {(['text', 'entregable', 'schedule_meeting', 'webhook', 'send_image', 'send_video', 'create_crm_contact', 'notify_team', 'send_custom_buttons']).map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(p => ({ ...p, action_type: t }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.action_type === t ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' : 'border-gray-700 bg-gray-800 text-gray-500 hover:text-gray-300'}`}
                    >
                      {ACTION_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
                {form.action_type === 'entregable' && (
                  <div className="mt-3 space-y-4 bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                    {/* Selector de entregable */}
                    <div>
                      <label className="text-xs text-purple-300 mb-1.5 block font-medium">Entregable vinculado</label>
                      {deliverables.length === 0 ? (
                        <p className="text-xs text-gray-500">No hay entregables creados. Ve al tab <span className="text-purple-400">Entregables</span> para crear uno primero.</p>
                      ) : (
                        <select
                          value={form.deliverable_id}
                          onChange={e => selectDeliverable(e.target.value)}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                        >
                          <option value="">— Selecciona un entregable —</option>
                          {deliverables.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {form.deliverable_id && (
                      <>
                        {/* Texto de oferta */}
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Texto de oferta (lo que el agente dice para proponer el entregable)</label>
                          <textarea
                            value={delivForm.offer_text}
                            onChange={e => setDelivForm(p => ({ ...p, offer_text: e.target.value }))}
                            rows={2}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm text-white resize-none focus:outline-none focus:border-purple-500"
                            placeholder="¿Te gustaría que preparara un micro-diagnóstico gratuito para tu empresa?"
                          />
                        </div>

                        {/* Preguntas */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-gray-400">Preguntas que hará el agente (una por turno)</label>
                            <button onClick={addDelivQ} className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors">
                              <Plus size={11} /> Agregar
                            </button>
                          </div>
                          <div className="space-y-2">
                            {delivForm.questions.map((q, i) => (
                              <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-2.5 space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-600 w-4">{i + 1}.</span>
                                  <input
                                    value={q.field}
                                    onChange={e => updateDelivQ(i, { field: e.target.value })}
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 font-mono focus:outline-none focus:border-purple-500"
                                    placeholder="nombre_campo"
                                  />
                                  <button onClick={() => removeDelivQ(i)} className="text-gray-600 hover:text-red-400 transition-colors">
                                    <X size={12} />
                                  </button>
                                </div>
                                <textarea
                                  value={q.question}
                                  onChange={e => updateDelivQ(i, { question: e.target.value })}
                                  rows={2}
                                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white resize-none focus:outline-none focus:border-purple-500"
                                  placeholder="¿A qué se dedica tu empresa?"
                                />
                              </div>
                            ))}
                            {delivForm.questions.length === 0 && (
                              <p className="text-xs text-gray-600 italic">Sin preguntas todavía.</p>
                            )}
                          </div>
                        </div>

                        {/* Secciones del documento */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-gray-400">Secciones del documento generado por IA</label>
                            <button onClick={addDelivS} className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors">
                              <Plus size={11} /> Agregar
                            </button>
                          </div>
                          <div className="space-y-2">
                            {delivForm.sections.map((s, i) => (
                              <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-2.5 space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <input
                                    value={s.title}
                                    onChange={e => updateDelivS(i, { title: e.target.value })}
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white font-medium focus:outline-none focus:border-purple-500"
                                    placeholder="Título de sección (ej: Situación actual)"
                                  />
                                  <button onClick={() => removeDelivS(i)} className="text-gray-600 hover:text-red-400 transition-colors">
                                    <X size={12} />
                                  </button>
                                </div>
                                <textarea
                                  value={s.prompt}
                                  onChange={e => updateDelivS(i, { prompt: e.target.value })}
                                  rows={2}
                                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300 resize-none focus:outline-none focus:border-purple-500"
                                  placeholder="Instrucción para la IA: describe la situación actual en 2-3 párrafos..."
                                />
                              </div>
                            ))}
                            {delivForm.sections.length === 0 && (
                              <p className="text-xs text-gray-600 italic">Sin secciones todavía.</p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {form.action_type === 'schedule_meeting' && (
                  <p className="text-xs text-blue-400/70 mt-1.5">El agente enviará el link de Cal.com al prospecto cuando corresponda.</p>
                )}
                {form.action_type === 'webhook' && (
                  <p className="text-xs text-orange-400/70 mt-1.5">El agente llamará a tu URL cuando se active. Puedes conectarlo a n8n, Make o cualquier endpoint.</p>
                )}
                {form.action_type === 'send_image' && (
                  <p className="text-xs text-pink-400/70 mt-1.5">El agente enviará una imagen de WhatsApp al prospecto.</p>
                )}
                {form.action_type === 'send_video' && (
                  <p className="text-xs text-rose-400/70 mt-1.5">El agente enviará un video de WhatsApp al prospecto.</p>
                )}
                {form.action_type === 'create_crm_contact' && (
                  <p className="text-xs text-green-400/70 mt-1.5">El agente creará automáticamente un contacto en el CRM con los datos del prospecto.</p>
                )}
                {form.action_type === 'notify_team' && (
                  <p className="text-xs text-yellow-400/70 mt-1.5">El agente enviará una notificación de WhatsApp a un número de tu equipo.</p>
                )}
                {form.action_type === 'send_custom_buttons' && (
                  <p className="text-xs text-cyan-400/70 mt-1.5">El agente enviará un mensaje con botones interactivos de WhatsApp.</p>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">¿Cuándo se activa?</label>
                <input value={form.trigger_condition} onChange={e => setForm(p => ({ ...p, trigger_condition: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" placeholder="ej. Cuando el prospecto muestre interés en conocer más" />
              </div>

              {/* Cal.com URL solo para schedule_meeting */}
              {form.action_type === 'schedule_meeting' && (
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">URL de Cal.com (opcional — usa la del agente si se deja vacía)</label>
                  <input value={form.cal_url} onChange={e => setForm(p => ({ ...p, cal_url: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" placeholder="https://cal.com/tu-usuario/reunión" />
                </div>
              )}

              {/* Webhook URL */}
              {form.action_type === 'webhook' && (
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">URL del webhook</label>
                  <input value={form.webhook_url} onChange={e => setForm(p => ({ ...p, webhook_url: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" placeholder="https://n8n.tudominio.com/webhook/abc123" />
                  <p className="text-xs text-gray-600 mt-1.5">El webhook recibirá: skill, conversation_id, phone, prospect. Si responde con <code className="text-orange-400/80">{'{ "reply": "..." }'}</code> ese texto se enviará al prospecto.</p>
                </div>
              )}

              {/* Imagen */}
              {form.action_type === 'send_image' && (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">URL de la imagen</label>
                    <input value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" placeholder="https://cdn.tudominio.com/imagen.jpg" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Texto de acompañamiento (opcional)</label>
                    <input value={form.media_caption} onChange={e => setForm(p => ({ ...p, media_caption: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" placeholder="ej. Aquí te comparto nuestro catálogo 👆" />
                  </div>
                </div>
              )}

              {/* Video */}
              {form.action_type === 'send_video' && (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">URL del video</label>
                    <input value={form.video_url} onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" placeholder="https://cdn.tudominio.com/demo.mp4" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Texto de acompañamiento (opcional)</label>
                    <input value={form.media_caption} onChange={e => setForm(p => ({ ...p, media_caption: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" placeholder="ej. Mira nuestro video de presentación 🎥" />
                  </div>
                </div>
              )}

              {/* Notificar equipo */}
              {form.action_type === 'notify_team' && (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Número de WhatsApp del equipo (con código de país)</label>
                    <input value={form.team_phone} onChange={e => setForm(p => ({ ...p, team_phone: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" placeholder="5215512345678" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Mensaje (usa {'{{nombre}}'}, {'{{empresa}}'}, {'{{telefono}}'})</label>
                    <input value={form.message_template} onChange={e => setForm(p => ({ ...p, message_template: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" placeholder="🔔 Nuevo lead: {{nombre}} ({{empresa}}) — {{telefono}}" />
                  </div>
                </div>
              )}

              {/* Botones personalizados */}
              {form.action_type === 'send_custom_buttons' && (
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Opciones de botones (separadas por coma)</label>
                  <input value={form.button_labels} onChange={e => setForm(p => ({ ...p, button_labels: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" placeholder="Sí, me interesa, Más información, No por ahora" />
                  <p className="text-xs text-gray-600 mt-1">Máximo 3 botones. Las instrucciones del skill definen el mensaje de acompañamiento.</p>
                </div>
              )}

              {/* Instrucciones y ejemplo solo para skills de texto */}
              {!isActionSkill && (
                <>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Instrucciones de respuesta</label>
                    <textarea value={form.response_instructions} onChange={e => setForm(p => ({ ...p, response_instructions: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-indigo-500" rows={3} placeholder="¿Cómo debe responder el agente?" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Ejemplo de conversación (opcional)</label>
                    <textarea value={form.example_conversation} onChange={e => setForm(p => ({ ...p, example_conversation: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-indigo-500" rows={2} placeholder="Usuario: 'es muy caro'&#10;Agente: '...'" />
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={save} disabled={saving || !form.name.trim() || !form.trigger_condition.trim()} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} {editingId ? 'Actualizar' : 'Crear skill'}
              </button>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-300 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={20} className="text-indigo-500 animate-spin" /></div>
        ) : skills.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Zap size={24} className="text-gray-700 mb-2" />
            <p className="text-sm text-gray-500">Sin skills definidos</p>
            <p className="text-xs text-gray-600 mt-1">Los skills enseñan al agente a manejar situaciones específicas.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {skills.map(s => (
              <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold text-white">{s.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                        {s.status === 'active' ? 'Activo' : 'Borrador'}
                      </span>
                      {s.action_type && s.action_type !== 'text' && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ACTION_TYPE_COLORS[s.action_type] ?? 'bg-gray-800 text-gray-400'}`}>
                          {ACTION_TYPE_LABELS[s.action_type] ?? s.action_type}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500"><span className="text-gray-600">Activa cuando:</span> {s.trigger_condition}</p>
                    {s.response_instructions && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{s.response_instructions}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <button onClick={() => startEdit(s)} className="p-1.5 rounded-lg text-gray-600 hover:text-gray-400 hover:bg-gray-800 transition-colors">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => deleteSkill(s.id)} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── SECCIÓN: Calibrador ────────────────────────────────────────────────────────

function SectionCalibrador({ agentId }: { agentId: string }) {
  const [data, setData] = useState<CalibratorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [calibrating, setCalibrating] = useState(false);
  const [evolving, setEvolving] = useState(false);
  const [tab, setTab] = useState<'calibracion' | 'evolucion' | 'instrucciones'>('calibracion');

  const load = useCallback(() => {
    api.get<CalibratorData>(`/agent-panel/${agentId}/calibrator`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [agentId]);

  useEffect(() => { load(); }, [load]);

  const calibrate = async () => {
    setCalibrating(true);
    try {
      await api.post(`/agent-panel/${agentId}/calibrate`, {});
      load();
    } catch (e: any) { alert(e?.message ?? 'Error al calibrar'); }
    setCalibrating(false);
  };

  const approveEvolution = async (approvalId: string) => {
    try {
      await api.post(`/agent-panel/${agentId}/evolution/${approvalId}/approve`, {});
      load();
    } catch (e: any) { alert(e?.message ?? 'Error'); }
  };

  const rejectEvolution = async (approvalId: string) => {
    try {
      await api.post(`/agent-panel/${agentId}/evolution/${approvalId}/reject`, {});
      load();
    } catch (e: any) { alert(e?.message ?? 'Error'); }
  };

  const triggerEvolution = async () => {
    setEvolving(true);
    try {
      await api.post(`/agent-panel/${agentId}/evolution/trigger`, {});
      setTimeout(load, 2000);
    } catch (e: any) { alert(e?.message ?? 'Error'); }
    setEvolving(false);
  };

  const coverageItems = data ? [
    { label: 'Perfil del fundador', ok: data.coverage.founder_profile },
    { label: `Documentos Brain (${data.coverage.brain_docs})`, ok: data.coverage.brain_docs > 0 },
    { label: 'Blueprint de cultura', ok: data.coverage.culture_blueprint },
    { label: 'Mapa operativo', ok: data.coverage.operating_map },
    { label: 'Perfil de comunicación', ok: data.coverage.communication_profile },
  ] : [];

  return (
    <div className="p-8">
      <PageHeader title="Calibrador" subtitle="Sistema de calibración y evolución del agente" />

      {/* Tabs */}
      <div className="flex gap-1 mt-6 border-b border-gray-800 mb-6">
        {(['calibracion', 'evolucion', 'instrucciones'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-400'}`}>
            {t === 'calibracion' ? 'Calibración' : t === 'evolucion' ? 'Evolución' : 'Instrucciones actuales'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={20} className="text-indigo-500 animate-spin" /></div>
      ) : !data ? (
        <p className="text-sm text-gray-500 text-center py-16">No se pudo cargar la información.</p>
      ) : (
        <>
          {tab === 'calibracion' && (
            <div className="space-y-6">
              {/* Last calibration */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <p className="text-xs text-gray-500 mb-1">Última calibración</p>
                <p className="text-sm font-semibold text-white">
                  {data.calibrated_at ? new Date(data.calibrated_at).toLocaleString('es-MX') : 'Nunca calibrado'}
                </p>
              </div>

              {/* Coverage */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-400 mb-4">Datos disponibles para calibración</p>
                <div className="space-y-2.5">
                  {coverageItems.map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">{item.label}</span>
                      {item.ok
                        ? <CheckCircle size={15} className="text-green-400" />
                        : <X size={15} className="text-red-400" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <button onClick={calibrate} disabled={calibrating} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
                {calibrating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {calibrating ? 'Calibrando...' : 'Recalibrar ahora'}
              </button>
              <p className="text-xs text-gray-600">La calibración genera instrucciones del agente basadas en los datos de tu empresa.</p>
            </div>
          )}

          {tab === 'evolucion' && (
            <div className="space-y-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <p className="text-xs text-gray-500 mb-1">Última evolución</p>
                <p className="text-sm font-semibold text-white">
                  {data.last_evolved_at ? new Date(data.last_evolved_at).toLocaleString('es-MX') : 'Sin evoluciones aún'}
                </p>
              </div>

              {data.pending_evolution ? (
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle size={15} className="text-indigo-400" />
                    <p className="text-sm font-semibold text-indigo-400">Propuesta de evolución pendiente</p>
                  </div>
                  <p className="text-sm text-gray-300 mb-4">{data.pending_evolution.description}</p>
                  <div className="flex gap-2">
                    <button onClick={() => approveEvolution(data.pending_evolution!.id)} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors">
                      <Check size={13} /> Aprobar
                    </button>
                    <button onClick={() => rejectEvolution(data.pending_evolution!.id)} className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors">
                      <X size={13} /> Rechazar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <p className="text-sm text-gray-500 mb-3">No hay propuestas pendientes. La evolución analiza conversaciones recientes y propone mejoras automáticamente cada lunes.</p>
                  <button onClick={triggerEvolution} disabled={evolving} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 text-sm font-medium rounded-lg transition-colors">
                    {evolving ? <Loader2 size={13} className="animate-spin" /> : <BarChart3 size={13} />}
                    {evolving ? 'Analizando...' : 'Iniciar evolución manual'}
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'instrucciones' && (
            <div>
              <label className="text-xs text-gray-400 mb-2 block">System prompt actual del agente (solo lectura)</label>
              <textarea
                readOnly
                value={data.current_instructions ?? 'Sin instrucciones configuradas aún. Calibra primero el agente.'}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm text-gray-300 font-mono resize-none focus:outline-none"
                rows={20}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── SECCIÓN: Configuración ─────────────────────────────────────────────────────

function SectionConfiguracion({
  agentId, agent, setAgent,
}: {
  agentId: string;
  agent: AgentSlot;
  setAgent: (a: AgentSlot) => void;
}) {
  const cfg = agent.agent_config ?? {};
  const [models, setModels] = useState<AvailableModel[]>([]);
  const [form, setForm] = useState({
    nombre: (cfg.nombre as string) ?? agent.name ?? '',
    model: (cfg.model as string) ?? '',
    ai_provider: (cfg.ai_provider as string) ?? 'openrouter',
    personality: (cfg.personality as string) ?? '',
    stt_provider: (cfg.stt_provider as string) ?? '',
    tts_provider: (cfg.tts_provider as string) ?? '',
    tts_voice_id: (cfg.tts_voice_id as string) ?? '',
  });
  const [tab, setTab] = useState<'identidad' | 'voz' | 'limites'>('identidad');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<AvailableModel[]>('/agent-panel/models')
      .then(d => setModels(Array.isArray(d) ? d : []))
      .catch(console.error);
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch<{ id: string; agent_config: Record<string, any> }>(
        `/agent-panel/${agentId}/config`,
        form
      );
      setAgent({ ...agent, agent_config: { ...cfg, ...form } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) { alert(e?.message ?? 'Error al guardar'); }
    setSaving(false);
  };

  const tierLabel: Record<string, string> = { free: 'Gratis', economy: 'Economy', capable: 'Capaz', premium: 'Premium' };

  return (
    <div className="p-8">
      <PageHeader title="Configuración" subtitle="Identidad, modelo y parámetros del agente" />

      {/* Tabs */}
      <div className="flex gap-1 mt-6 border-b border-gray-800 mb-6">
        {(['identidad', 'voz', 'limites'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-400'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'identidad' && (
        <div className="max-w-lg space-y-5">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Nombre del agente</label>
            <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="Leo, Atlas, Sofía..." />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Personalidad / tono</label>
            <textarea value={form.personality} onChange={e => setForm(p => ({ ...p, personality: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-indigo-500" rows={3} placeholder="Profesional pero cercano. Usa lenguaje claro sin tecnicismos..." />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Proveedor IA</label>
            <select value={form.ai_provider} onChange={e => setForm(p => ({ ...p, ai_provider: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500">
              <option value="openrouter">OpenRouter</option>
              <option value="anthropic">Anthropic (directo)</option>
              <option value="openai">OpenAI (directo)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Modelo de IA</label>
            {models.length > 0 ? (
              <select value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500">
                <option value="">-- Seleccionar modelo --</option>
                {models.map(m => (
                  <option key={m.id} value={m.model_id}>
                    {m.display_name} ({tierLabel[m.tier] ?? m.tier})
                  </option>
                ))}
              </select>
            ) : (
              <input value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="openai/gpt-4o-mini, anthropic/claude-haiku-4-5, moonshotai/kimi-k2..." />
            )}
            {form.model && <p className="text-xs text-gray-600 mt-1.5">Activo: <span className="text-gray-400">{form.model}</span></p>}
          </div>

          <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
            {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar configuración'}
          </button>
        </div>
      )}

      {tab === 'voz' && (
        <div className="max-w-lg space-y-5">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Proveedor STT (Speech to Text)</label>
            <select value={form.stt_provider} onChange={e => setForm(p => ({ ...p, stt_provider: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500">
              <option value="">Sin voz (solo texto)</option>
              <option value="openai_whisper">OpenAI Whisper</option>
              <option value="deepgram">Deepgram</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Proveedor TTS (Text to Speech)</label>
            <select value={form.tts_provider} onChange={e => setForm(p => ({ ...p, tts_provider: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500">
              <option value="">Sin voz (solo texto)</option>
              <option value="elevenlabs">ElevenLabs</option>
              <option value="openai_tts">OpenAI TTS</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Voice ID (ElevenLabs)</label>
            <input value={form.tts_voice_id} onChange={e => setForm(p => ({ ...p, tts_voice_id: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="VoiceId de ElevenLabs" />
          </div>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
            {saving ? <Loader2 size={14} className="animate-spin" /> : 'Guardar configuración de voz'}
          </button>
        </div>
      )}

      {tab === 'limites' && (
        <div className="max-w-lg">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-sm text-gray-400">Configuración de límites (tokens, temperatura, etc.) próximamente.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SECCIÓN: Auditoría ─────────────────────────────────────────────────────────

function SectionAuditoria({ agentId }: { agentId: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any[]>(`/agent-panel/${agentId}/audit`)
      .then(d => setLogs(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [agentId]);

  return (
    <div className="p-8">
      <PageHeader title="Auditoría" subtitle="Registro de cambios y acciones sobre este agente" />
      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={20} className="text-indigo-500 animate-spin" /></div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-16">Sin registros de auditoría.</p>
        ) : (
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{log.action}</p>
                  <p className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString('es-MX')}</p>
                </div>
                <span className="text-xs text-gray-600">{log.actor_id ?? 'Sistema'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── SECCIÓN: Prospectos ────────────────────────────────────────────────────────

function SectionProspectos({ agentId }: { agentId: string }) {
  const [prospects, setProspects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ items: any[] }>(`/agent-panel/${agentId}/prospects`)
      .then(d => setProspects(d.items ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [agentId]);

  return (
    <div className="p-8">
      <PageHeader title="Prospectos" subtitle="Leads captados por el agente comercial" />
      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={20} className="text-indigo-500 animate-spin" /></div>
        ) : prospects.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-16">Sin prospectos aún.</p>
        ) : (
          <div className="space-y-2">
            {prospects.map(p => (
              <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{p.contact_name ?? p.phone ?? 'Sin nombre'}</p>
                  <p className="text-xs text-gray-500">{p.phone} · {new Date(p.created_at).toLocaleDateString('es-MX')}</p>
                </div>
                <div className="flex items-center gap-2">
                  {p.lead_score != null && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400">Score: {p.lead_score}</span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── SECCIÓN: Journey del cliente ───────────────────────────────────────────────

interface JourneyStage {
  n: number;
  label: string;
  desc: string;
  script: string;
  crm_stage: string;
}

const DEFAULT_JOURNEY_STAGES: JourneyStage[] = [
  { n: 1, label: 'Bienvenida',  desc: 'Saludo y presentación del agente',        script: '', crm_stage: '' },
  { n: 2, label: 'Escucha',     desc: 'Detecta necesidad o contexto inicial',     script: '', crm_stage: 'agente_ia' },
  { n: 3, label: 'Gancho',      desc: 'Ofrece el entregable gratuito',            script: '', crm_stage: 'micro_diagnostico' },
  { n: 4, label: 'Preguntas',   desc: 'Recopila respuestas del prospecto',        script: '', crm_stage: '' },
  { n: 5, label: 'Entrega',     desc: 'Envía URL del documento generado por IA',  script: '', crm_stage: 'discovery' },
  { n: 6, label: 'Cierre',      desc: 'Califica y agenda cita o cierra',          script: '', crm_stage: 'propuesta' },
];

const JOURNEY_STAGES = [
  { n: 1, label: 'Bienvenida', desc: 'Saludo + presentación del agente' },
  { n: 2, label: 'Escucha', desc: 'Detecta necesidad o contexto inicial' },
  { n: 3, label: 'Gancho', desc: 'Ofrece el micro-diagnóstico gratuito' },
  { n: 4, label: 'Preguntas', desc: 'Hace las preguntas de calificación' },
  { n: 5, label: 'Entrega', desc: 'Envía el link del micro-diagnóstico' },
  { n: 6, label: 'Cierre', desc: 'Agenda cita o cierra con calidez' },
];

function SectionJourney({ agentId, agent, setAgent }: { agentId: string; agent: AgentSlot; setAgent: (a: AgentSlot) => void }) {
  const cfg = agent.agent_config ?? {};
  const [tab, setTab] = useState<'identidad' | 'journey' | 'criterios' | 'crm'>('identidad');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingStages, setEditingStages] = useState(false);

  const parseStages = (): JourneyStage[] => {
    const raw = cfg.journey_stages;
    if (Array.isArray(raw) && raw.length > 0) return raw as JourneyStage[];
    return DEFAULT_JOURNEY_STAGES;
  };

  const [form, setForm] = useState({
    instance_name: (cfg.instance_name as string) ?? '',
    cal_com_url: (cfg.cal_com_url as string) ?? '',
    pitch: (cfg.pitch as string) ?? '',
  });
  const [stages, setStages] = useState<JourneyStage[]>(parseStages);
  const [goodCriteria, setGoodCriteria] = useState<string>((cfg.good_lead_criteria as string) ?? '');
  const [badCriteria, setBadCriteria] = useState<string>((cfg.bad_lead_criteria as string) ?? '');
  const [crmGeneral, setCrmGeneral] = useState<string>((cfg.crm_instructions as string) ?? '');

  const save = async (extra?: Record<string, unknown>) => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        journey_stages: stages,
        good_lead_criteria: goodCriteria,
        bad_lead_criteria: badCriteria,
        crm_instructions: crmGeneral,
        ...extra,
      };
      await api.patch(`/agent-panel/${agentId}/config`, payload);
      setAgent({ ...agent, agent_config: { ...cfg, ...payload } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) { alert(e?.message ?? 'Error al guardar'); }
    setSaving(false);
  };

  const updateStage = (i: number, patch: Partial<JourneyStage>) =>
    setStages(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s));

  const SaveBtn = ({ extra }: { extra?: Record<string, unknown> }) => (
    <button onClick={() => save(extra)} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
      {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} className="text-white" /> : null}
      {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
    </button>
  );

  const STAGE_COLORS = ['bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500', 'bg-orange-500'];

  return (
    <div className="p-8">
      <PageHeader title="Journey del cliente" subtitle="Flujo de conversación y calificación de leads" />

      {/* ── Flujo visual editable ─────────────────────────────────────── */}
      <div className="mt-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Flujo del journey</p>
          <button
            onClick={() => setEditingStages(p => !p)}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Pencil size={11} /> {editingStages ? 'Cerrar edición' : 'Editar etapas'}
          </button>
        </div>

        {/* Pills visualización */}
        <div className="flex items-center flex-wrap gap-0">
          {stages.map((s, i) => (
            <div key={s.n} className="flex items-center">
              <div className={`rounded-xl px-3 py-2 text-center min-w-[90px] border ${
                s.script ? 'bg-indigo-600/10 border-indigo-500/30' : 'bg-gray-900 border-gray-800'
              }`}>
                <p className="text-[10px] text-indigo-400 font-bold">Etapa {s.n}</p>
                <p className="text-xs font-semibold text-white">{s.label}</p>
                <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{s.desc}</p>
                {s.crm_stage && (
                  <p className="text-[9px] text-green-500 mt-0.5 font-mono">→ {s.crm_stage}</p>
                )}
              </div>
              {i < stages.length - 1 && <ChevronRight size={12} className="text-gray-700 mx-1 flex-shrink-0" />}
            </div>
          ))}
        </div>

        {/* Editor inline de etapas */}
        {editingStages && (
          <div className="mt-4 space-y-2 bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-3">Edita los nombres y descripciones de cada etapa. Los scripts detallados se configuran en el tab <span className="text-indigo-400">Journey completo</span>.</p>
            {stages.map((s, i) => (
              <div key={s.n} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full ${STAGE_COLORS[i] ?? 'bg-gray-600'} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-[9px] text-white font-bold">{s.n}</span>
                </div>
                <input
                  value={s.label}
                  onChange={e => updateStage(i, { label: e.target.value })}
                  className="w-28 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Nombre"
                />
                <input
                  value={s.desc}
                  onChange={e => updateStage(i, { desc: e.target.value })}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
                  placeholder="Descripción corta"
                />
              </div>
            ))}
            <div className="pt-2">
              <SaveBtn />
            </div>
          </div>
        )}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-gray-800 mb-6">
        {(['identidad', 'journey', 'criterios', 'crm'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-400'}`}>
            {t === 'identidad' ? 'Identidad del agente' : t === 'journey' ? 'Journey completo' : t === 'criterios' ? 'Criterios de calificación' : 'Movimiento en CRM'}
          </button>
        ))}
      </div>

      {/* ── Tab: Identidad del agente ─────────────────────────────────── */}
      {tab === 'identidad' && (
        <div className="max-w-lg space-y-5">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Instancia Evolution (WhatsApp)</label>
            <input value={form.instance_name} onChange={e => setForm(p => ({ ...p, instance_name: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="Ej: Mentoriacomercial" />
            <p className="text-xs text-gray-600 mt-1">El nombre exacto de la instancia en Evolution API</p>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">URL de agenda (Cal.com)</label>
            <input value={form.cal_com_url} onChange={e => setForm(p => ({ ...p, cal_com_url: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="https://cal.com/tu-usuario/tu-evento" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Pitch del negocio</label>
            <textarea value={form.pitch} onChange={e => setForm(p => ({ ...p, pitch: e.target.value }))} rows={4} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-indigo-500" placeholder="Somos una empresa de tecnología expertos en..." />
            <p className="text-xs text-gray-600 mt-1">El agente usa este texto para presentarse en la Etapa 1</p>
          </div>
          <SaveBtn />
        </div>
      )}

      {/* ── Tab: Journey completo ─────────────────────────────────────── */}
      {tab === 'journey' && (
        <div className="max-w-2xl space-y-4">
          <p className="text-xs text-gray-500 mb-2">Escribe el script de cada etapa — qué dice el agente, qué preguntas hace, qué acciones toma. Incluye el entregable en las etapas 3-5.</p>
          {stages.map((s, i) => (
            <div key={s.n} className="border border-gray-800 rounded-xl overflow-hidden">
              <div className={`flex items-center gap-3 px-4 py-3 ${s.script ? 'bg-indigo-600/8' : 'bg-gray-900/50'}`}>
                <div className={`w-6 h-6 rounded-full ${STAGE_COLORS[i] ?? 'bg-gray-600'} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-[10px] text-white font-bold">{s.n}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{s.label}</p>
                  <p className="text-xs text-gray-500">{s.desc}</p>
                </div>
                {s.script && <CheckCircle size={14} className="text-indigo-400 shrink-0" />}
              </div>
              <div className="px-4 pb-4 pt-2 bg-gray-950">
                <textarea
                  value={s.script}
                  onChange={e => updateStage(i, { script: e.target.value })}
                  rows={4}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-sm text-white resize-y focus:outline-none focus:border-indigo-500 placeholder-gray-700"
                  placeholder={
                    s.n === 1 ? 'Ej: "¡Hola! Soy Leo de MentorIA. ¿Con quién tengo el gusto?" — Recoge nombre y empresa de forma natural.' :
                    s.n === 2 ? 'Ej: Pregunta qué los trajo aquí. Escucha y muestra interés genuino.' :
                    s.n === 3 ? 'Ej: "Me gustaría regalarte un micro-diagnóstico gratuito de automatización para tu empresa. ¿Te parece bien?" — Usa ofrecerEntregable() cuando acepten.' :
                    s.n === 4 ? 'Ej: Haz las preguntas del entregable una por turno. Espera la respuesta antes de continuar.' :
                    s.n === 5 ? 'Ej: "Listo! Aquí tienes tu diagnóstico: [URL]" — Usa completarEntregable() para generar la URL.' :
                    'Ej: Califica con calificar(). Si score ≥ 7 usa agendar(). Si no califica, cierra con calidez y queda abierto para el futuro.'
                  }
                />
              </div>
            </div>
          ))}
          <SaveBtn />
        </div>
      )}

      {/* ── Tab: Criterios de calificación ───────────────────────────── */}
      {tab === 'criterios' && (
        <div className="max-w-lg space-y-5">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5">
              <CheckCircle size={12} className="text-green-400" /> Lead BUENO — agenda cita
            </label>
            <textarea value={goodCriteria} onChange={e => setGoodCriteria(e.target.value)} rows={5} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-green-600" placeholder={'- Más de 10 años operando\n- Más de 100 empleados\n- Sin área de programación suficiente\n- Dolor operativo claro'} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5">
              <X size={12} className="text-red-400" /> Lead MALO — responde con calidez, no agendes
            </label>
            <textarea value={badCriteria} onChange={e => setBadCriteria(e.target.value)} rows={5} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-red-700" placeholder={'- Menos de 10 años operando\n- Menos de 100 empleados\n- Sin presupuesto\n- Sin dolor claro identificado'} />
          </div>
          <SaveBtn />
        </div>
      )}

      {/* ── Tab: Movimiento en CRM ───────────────────────────────────── */}
      {tab === 'crm' && (
        <div className="max-w-2xl space-y-6">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Instrucciones generales de CRM</label>
            <textarea
              value={crmGeneral}
              onChange={e => setCrmGeneral(e.target.value)}
              rows={3}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-indigo-500"
              placeholder="Ej: Registra el contacto en CRM desde la Etapa 2. Avanza el deal automáticamente a medida que el prospecto progresa en el journey."
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Etapa del pipeline por cada fase del journey</p>
            <div className="space-y-3">
              {stages.map((s, i) => (
                <div key={s.n} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
                  <div className={`w-6 h-6 rounded-full ${STAGE_COLORS[i] ?? 'bg-gray-600'} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-[10px] text-white font-bold">{s.n}</span>
                  </div>
                  <div className="w-24 shrink-0">
                    <p className="text-xs font-semibold text-white">{s.label}</p>
                    <p className="text-[10px] text-gray-600">{s.desc}</p>
                  </div>
                  <ChevronRight size={12} className="text-gray-700 shrink-0" />
                  <div className="flex-1">
                    <input
                      value={s.crm_stage}
                      onChange={e => updateStage(i, { crm_stage: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                      placeholder="etapa_pipeline (ej: micro_diagnostico)"
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-3">Los nombres deben coincidir con las etapas del pipeline en el CRM. Deja vacío si no debe mover el lead automáticamente en esa fase.</p>
          </div>

          <SaveBtn />
        </div>
      )}
    </div>
  );
}

// ── SECCIÓN: Base de conocimiento ─────────────────────────────────────────────

interface KnowledgeSource {
  id: string;
  name: string;
  url: string;
  covers: string;
  notes: string;
  status: 'active' | 'inactive';
}

const EMPTY_SOURCE: Omit<KnowledgeSource, 'id'> = {
  name: '', url: '', covers: '', notes: '', status: 'active',
};

function SectionBaseConocimiento({
  agentId, agent, setAgent,
}: { agentId: string; agent: AgentSlot; setAgent: (a: AgentSlot) => void }) {
  const cfg = (agent.agent_config ?? {}) as Record<string, any>;
  const [sources, setSources] = useState<KnowledgeSource[]>(() => {
    const raw = cfg.knowledge_sources;
    return Array.isArray(raw) ? raw : [];
  });
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_SOURCE });
  const [saving, setSaving] = useState(false);

  const persist = async (next: KnowledgeSource[]) => {
    setSaving(true);
    try {
      await api.patch(`/agent-panel/${agentId}/config`, {
        ...cfg,
        knowledge_sources: next,
      });
      setSources(next);
      setAgent({ ...agent, agent_config: { ...cfg, knowledge_sources: next } });
    } catch (e: any) { alert(e?.message ?? 'Error al guardar'); }
    setSaving(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_SOURCE });
    setView('form');
  };

  const openEdit = (s: KnowledgeSource) => {
    setEditingId(s.id);
    setForm({ name: s.name, url: s.url, covers: s.covers, notes: s.notes, status: s.status });
    setView('form');
  };

  const save = async () => {
    if (!form.name.trim()) { alert('El nombre del sistema es obligatorio'); return; }
    const id = editingId ?? `ks_${Date.now()}`;
    const entry: KnowledgeSource = { id, ...form };
    const next = editingId
      ? sources.map(s => s.id === editingId ? entry : s)
      : [...sources, entry];
    await persist(next);
    setView('list');
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar esta fuente de conocimiento?')) return;
    await persist(sources.filter(s => s.id !== id));
  };

  if (view === 'form') {
    return (
      <div className="p-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setView('list')} className="text-gray-400 hover:text-white transition-colors shrink-0">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">{editingId ? 'Editar sistema' : 'Agregar sistema'}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Define qué información maneja este sistema o fuente</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Nombre del sistema *</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
              placeholder="CRM, ERP, Base de Datos, Portal Clientes..."
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">URL o ubicación</label>
            <input
              value={form.url}
              onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
              placeholder="https://sistema.empresa.com"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">¿Qué información maneja? (el agente sabrá consultar aquí)</label>
            <textarea
              value={form.covers}
              onChange={e => setForm(p => ({ ...p, covers: e.target.value }))}
              rows={3}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-indigo-500"
              placeholder="Historial de clientes, facturas, pedidos pendientes, inventario..."
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Notas adicionales</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={2}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-indigo-500"
              placeholder="Solo lectura, requiere VPN, actualizado diariamente..."
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Estado</label>
            <select
              value={form.status}
              onChange={e => setForm(p => ({ ...p, status: e.target.value as 'active' | 'inactive' }))}
              className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => setView('list')} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-xl transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-white">Base de conocimiento</h1>
          <p className="text-sm text-gray-500 mt-0.5">Sistemas y fuentes de información que el agente puede referenciar</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
        >
          <Plus size={14} /> Agregar sistema
        </button>
      </div>

      {sources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen size={40} className="text-gray-700 mb-4" />
          <p className="text-gray-400 font-medium mb-1">Sin fuentes configuradas</p>
          <p className="text-gray-600 text-sm mb-5 max-w-xs">Agrega los sistemas o bases de datos que el agente debe conocer para responder preguntas de los prospectos.</p>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors">
            <Plus size={14} /> Agregar primer sistema
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50">
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wider">Sistema</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wider">URL</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wider">Información que maneja</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wider">Notas</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sources.map((s, i) => (
                <tr key={s.id} className={`border-b border-gray-800/50 hover:bg-gray-900/40 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-900/20'}`}>
                  <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">{s.name}</td>
                  <td className="px-4 py-3 text-gray-400 max-w-[160px]">
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors truncate">
                        <span className="truncate">{s.url.replace(/^https?:\/\//, '')}</span>
                        <ArrowUpRight size={11} className="shrink-0" />
                      </a>
                    ) : <span className="text-gray-700">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 max-w-[240px]">
                    <p className="line-clamp-2 text-xs">{s.covers || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[160px]">
                    <p className="line-clamp-1 text-xs">{s.notes || '—'}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                      {s.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => remove(s.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── SECCIÓN: Entregables (CRUD) ────────────────────────────────────────────────

const EMPTY_DELIVERABLE = {
  name: '',
  description: '',
  offer_text: '',
  questions: [] as DeliverableQuestion[],
  sections: [] as DeliverableSection[],
  status: 'active',
};

function SectionEntregables({ agentId }: { agentId: string }) {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'form' | 'responses'>('list');
  const [editing, setEditing] = useState<Deliverable | null>(null);
  const [responsesFor, setResponsesFor] = useState<Deliverable | null>(null);
  const [responses, setResponses] = useState<DeliverableResponse[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_DELIVERABLE });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Deliverable[]>(`/agent-panel/${agentId}/deliverables`);
      setDeliverables(data ?? []);
    } catch { setDeliverables([]); }
    setLoading(false);
  }, [agentId]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_DELIVERABLE });
    setView('form');
  };

  const openEdit = (d: Deliverable) => {
    setEditing(d);
    const parseJson = (v: any) => Array.isArray(v) ? v : (typeof v === 'string' ? JSON.parse(v) : []);
    setForm({
      name: d.name,
      description: d.description,
      offer_text: d.offer_text ?? '',
      questions: parseJson(d.questions),
      sections: parseJson(d.sections),
      status: d.status,
    });
    setView('form');
  };

  const openResponses = async (d: Deliverable) => {
    setResponsesFor(d);
    setView('responses');
    try {
      const data = await api.get<DeliverableResponse[]>(`/agent-panel/${agentId}/deliverables/${d.id}/responses`);
      setResponses(data ?? []);
    } catch { setResponses([]); }
  };

  const save = async () => {
    if (!form.name.trim()) { alert('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      if (editing) {
        const updated = await api.patch<Deliverable>(`/agent-panel/${agentId}/deliverables/${editing.id}`, form);
        setDeliverables(prev => prev.map(d => d.id === editing.id ? updated : d));
      } else {
        const created = await api.post<Deliverable>(`/agent-panel/${agentId}/deliverables`, form);
        setDeliverables(prev => [created, ...prev]);
      }
      setView('list');
    } catch (e: any) { alert(e?.message ?? 'Error al guardar'); }
    setSaving(false);
  };

  const remove = async (d: Deliverable) => {
    if (!confirm(`¿Eliminar entregable "${d.name}"?`)) return;
    try {
      await api.delete(`/agent-panel/${agentId}/deliverables/${d.id}`);
      setDeliverables(prev => prev.filter(x => x.id !== d.id));
    } catch (e: any) { alert(e?.message ?? 'Error al eliminar'); }
  };

  const addQuestion = () => {
    setForm(p => ({
      ...p,
      questions: [...p.questions, { field: `pregunta_${p.questions.length + 1}`, question: '', order: p.questions.length + 1 }],
    }));
  };

  const updateQuestion = (i: number, patch: Partial<DeliverableQuestion>) => {
    setForm(p => ({ ...p, questions: p.questions.map((q, idx) => idx === i ? { ...q, ...patch } : q) }));
  };

  const removeQuestion = (i: number) => {
    setForm(p => ({ ...p, questions: p.questions.filter((_, idx) => idx !== i).map((q, idx) => ({ ...q, order: idx + 1 })) }));
  };

  const addSection = () => {
    setForm(p => ({ ...p, sections: [...p.sections, { title: '', prompt: '' }] }));
  };

  const updateSection = (i: number, patch: Partial<DeliverableSection>) => {
    setForm(p => ({ ...p, sections: p.sections.map((s, idx) => idx === i ? { ...s, ...patch } : s) }));
  };

  const removeSection = (i: number) => {
    setForm(p => ({ ...p, sections: p.sections.filter((_, idx) => idx !== i) }));
  };

  if (view === 'form') {
    return (
      <div className="p-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setView('list')} className="text-gray-400 hover:text-white transition-colors shrink-0">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">{editing ? 'Editar entregable' : 'Nuevo entregable'}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Define el flujo de preguntas y las secciones que generará la IA</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Nombre del entregable *</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
              placeholder="Micro-diagnóstico IA"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Descripción interna</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-indigo-500"
              placeholder="Análisis de 5 preguntas que genera un diagnóstico personalizado"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Texto de oferta (lo que el agente dice para proponer el entregable)</label>
            <textarea
              value={form.offer_text}
              onChange={e => setForm(p => ({ ...p, offer_text: e.target.value }))}
              rows={3}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-indigo-500"
              placeholder="¿Te gustaría que preparara un micro-diagnóstico personalizado para tu empresa? Es gratuito y te lo entrego en minutos."
            />
          </div>

          {/* Preguntas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-400">Preguntas de recolección</label>
              <button onClick={addQuestion} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                <Plus size={12} /> Agregar pregunta
              </button>
            </div>
            <div className="space-y-3">
              {form.questions.map((q, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-5">{i + 1}.</span>
                    <input
                      value={q.field}
                      onChange={e => updateQuestion(i, { field: e.target.value })}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 font-mono"
                      placeholder="nombre_campo"
                    />
                    <button onClick={() => removeQuestion(i)} className="text-gray-600 hover:text-red-400 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  <textarea
                    value={q.question}
                    onChange={e => updateQuestion(i, { question: e.target.value })}
                    rows={2}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white resize-none focus:outline-none focus:border-indigo-500"
                    placeholder="¿A qué se dedica tu empresa y cuántos años lleva operando?"
                  />
                </div>
              ))}
              {form.questions.length === 0 && (
                <p className="text-xs text-gray-600 italic">Sin preguntas. Agrega al menos una.</p>
              )}
            </div>
          </div>

          {/* Secciones del documento */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-400">Secciones del documento generado</label>
              <button onClick={addSection} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                <Plus size={12} /> Agregar sección
              </button>
            </div>
            <div className="space-y-3">
              {form.sections.map((s, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={s.title}
                      onChange={e => updateSection(i, { title: e.target.value })}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white font-medium focus:outline-none focus:border-indigo-500"
                      placeholder="Título de la sección (ej: Situación actual)"
                    />
                    <button onClick={() => removeSection(i)} className="text-gray-600 hover:text-red-400 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  <textarea
                    value={s.prompt}
                    onChange={e => updateSection(i, { prompt: e.target.value })}
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 resize-none focus:outline-none focus:border-indigo-500"
                    placeholder="Instrucción para la IA: Describe en 2-3 párrafos la situación actual de la empresa basándote en sus respuestas..."
                  />
                </div>
              ))}
              {form.sections.length === 0 && (
                <p className="text-xs text-gray-600 italic">Sin secciones. La IA generará el contenido del documento por sección.</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Estado</label>
            <select
              value={form.status}
              onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? 'Guardando...' : 'Guardar entregable'}
            </button>
            <button onClick={() => setView('list')} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-xl transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'responses' && responsesFor) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setView('list')} className="text-gray-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <PageHeader title={`Respuestas: ${responsesFor.name}`} subtitle={`${responses.length} respuesta(s) generada(s)`} />
        </div>
        <div className="space-y-4">
          {responses.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">Aún no hay respuestas para este entregable.</div>
          )}
          {responses.map(r => (
            <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{r.prospect_name ?? 'Prospecto'}</p>
                  <p className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <a
                  href={`/entregable/${r.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Ver documento <ArrowUpRight size={12} />
                </a>
              </div>
              <div className="space-y-1">
                {Object.entries(r.answers).map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-xs">
                    <span className="text-gray-500 font-mono shrink-0">{k}:</span>
                    <span className="text-gray-300">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <PageHeader title="Entregables" subtitle="Documentos generados por IA que el agente entrega al prospecto" />
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
        >
          <Plus size={14} /> Nuevo entregable
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm"><Loader2 size={16} className="animate-spin" /> Cargando...</div>
      ) : deliverables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package size={40} className="text-gray-700 mb-4" />
          <p className="text-gray-400 font-medium mb-1">Sin entregables configurados</p>
          <p className="text-gray-600 text-sm mb-5">Crea un entregable para que el agente recopile información del prospecto y genere documentos personalizados con IA.</p>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors">
            <Plus size={14} /> Crear primer entregable
          </button>
        </div>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {deliverables.map(d => (
            <div key={d.id} className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-5 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-white truncate">{d.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      d.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {d.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{d.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                    <span>{d.questions?.length ?? 0} preguntas</span>
                    <span>{d.sections?.length ?? 0} secciones</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openResponses(d)}
                    title="Ver respuestas"
                    className="p-2 text-gray-500 hover:text-indigo-400 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Users size={14} />
                  </button>
                  <button
                    onClick={() => openEdit(d)}
                    title="Editar"
                    className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => remove(d)}
                    title="Eliminar"
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {d.offer_text && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <p className="text-xs text-gray-600 italic line-clamp-1">"{d.offer_text}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SECCIÓN: Probar agente ─────────────────────────────────────────────────────

interface TestMessage {
  role: 'user' | 'assistant';
  content: string;
}

function SectionProbar({ agentId }: { agentId: string }) {
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [phone, setPhone] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    const userMsg: TestMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);
    try {
      const data = await api.post<{ response: string }>(
        `/agent-panel/${agentId}/test-message`,
        { message: text, history: messages.slice(-20), phone: phone || undefined },
      );
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `⚠️ Error: ${e?.message ?? 'No se pudo obtener respuesta'}` },
      ]);
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-800 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Probar agente</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Escribe como si fueras el cliente — el agente responde en vivo
            </p>
          </div>
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-400 border border-gray-800 hover:border-gray-700 rounded-lg px-3 py-2 transition-colors"
          >
            <RefreshCw size={11} /> Nueva conversación
          </button>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+52 1 55 0000 0000 (opcional)"
            className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-700 w-52"
          />
          <span className="text-[10px] text-gray-600">Teléfono de prueba — sin efecto real</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {messages.length === 0 && !sending ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-3">
              <Bot size={20} className="text-indigo-400" />
            </div>
            <p className="text-sm text-gray-500">Escribe el primer mensaje para iniciar la prueba</p>
            <p className="text-xs text-gray-700 mt-1">
              El agente usa sus instrucciones y configuración actuales
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-5">
            {messages.map((m, i) => {
              const isAgent = m.role === 'assistant';
              return (
                <div key={i} className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}>
                  <p className="text-[10px] text-gray-600 mb-1 px-1">
                    {isAgent ? 'Agente' : 'Tú (como cliente)'}
                  </p>
                  <div className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                    isAgent
                      ? 'bg-gray-800 text-gray-100 rounded-tl-sm'
                      : 'bg-indigo-600 text-white rounded-tr-sm'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              );
            })}
            {sending && (
              <div className="flex flex-col items-start">
                <p className="text-[10px] text-gray-600 mb-1 px-1">Agente</p>
                <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3.5">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-800 px-8 py-4">
        <div className="max-w-2xl mx-auto flex gap-3 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe como si fueras el cliente… (Enter envía · Shift+Enter salta línea)"
            rows={2}
            disabled={sending}
            className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-gray-700 disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="flex-shrink-0 w-10 h-10 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors"
          >
            {sending
              ? <Loader2 size={15} className="animate-spin text-white" />
              : <Send size={15} className="text-white" />}
          </button>
        </div>
        <p className="text-[10px] text-gray-700 text-center mt-2 max-w-2xl mx-auto">
          Las conversaciones de prueba no se guardan en el historial del agente
        </p>
      </div>
    </div>
  );
}

// ── SECCIÓN: Clasificaciones ───────────────────────────────────────────────────

const RESOLUTION_MAP: Record<string, { label: string; bg: string }> = {
  reply:      { label: 'Respondido', bg: 'bg-green-500/15 text-green-400' },
  handoff:    { label: 'Turnado', bg: 'bg-amber-500/15 text-amber-400' },
  unresolved: { label: 'Sin resolver', bg: 'bg-red-500/15 text-red-400' },
  clarify:    { label: 'Aclaración', bg: 'bg-blue-500/15 text-blue-400' },
};
const SOURCE_MAP: Record<string, string> = {
  live:      'live',
  simulado:  'simulado',
};

function SectionClasificaciones({ agentId }: { agentId: string }) {
  const [items, setItems] = useState<AgentClassification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('all');
  const [resolution, setResolution] = useState('all');
  const [feedbackF, setFeedbackF] = useState('all');
  const totalPages = Math.ceil(total / 20) || 1;

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (source !== 'all') params.set('source', source);
    if (resolution !== 'all') params.set('resolution', resolution);
    if (feedbackF !== 'all') params.set('feedback', feedbackF);
    api.get<{ items: AgentClassification[]; total: number }>(`/agent-panel/${agentId}/classifications?${params}`)
      .then(d => { setItems(d.items ?? []); setTotal(d.total ?? 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [agentId, page, source, resolution, feedbackF]);

  useEffect(() => { load(); }, [load]);

  const setFeedback = async (id: string, fb: string) => {
    const item = items.find(i => i.id === id);
    const next = item?.feedback === fb ? '' : fb;
    await api.patch(`/agent-panel/${agentId}/classifications/${id}/feedback`, { feedback: next });
    setItems(prev => prev.map(i => i.id === id ? { ...i, feedback: next } : i));
  };

  return (
    <div className="p-8">
      <PageHeader title="Clasificaciones" subtitle="QA de conversaciones — cómo respondió el agente a cada mensaje" />

      {/* Filtros */}
      <div className="flex items-center gap-3 mt-6 mb-4 flex-wrap">
        {[
          { label: 'Fuente', value: source, onChange: setSource, options: [['all','Todas las fuentes'],['live','Live'],['simulado','Simulado']] },
          { label: 'Resultado', value: resolution, onChange: setResolution, options: [['all','Todos los resultados'],['reply','Respondido'],['handoff','Turnado'],['unresolved','Sin resolver'],['clarify','Aclaración']] },
          { label: 'Feedback', value: feedbackF, onChange: setFeedbackF, options: [['all','Todo el feedback'],['positive','Positivo'],['negative','Negativo'],['','Sin feedback']] },
        ].map(f => (
          <div key={f.label} className="relative">
            <select
              value={f.value}
              onChange={e => { f.onChange(e.target.value); setPage(1); }}
              className="appearance-none bg-gray-900 border border-gray-800 rounded-lg pl-3 pr-8 py-2 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        ))}
        <span className="text-xs text-gray-600 ml-auto">{total} resultado{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={20} className="text-indigo-500 animate-spin" /></div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[130px_90px_70px_1fr_140px_90px] gap-0 px-5 py-2.5 border-b border-gray-800">
            {['FECHA', 'RESUELTO', 'FUENTE', 'MENSAJE', 'CASO', 'FEEDBACK'].map(h => (
              <p key={h} className="text-[10px] font-semibold text-gray-600 tracking-wide uppercase">{h}</p>
            ))}
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-16">Sin clasificaciones aún.</p>
          ) : (
            <div className="divide-y divide-gray-800/70">
              {items.map(item => {
                const rm = RESOLUTION_MAP[item.resolution] ?? { label: item.resolution, bg: 'bg-gray-800 text-gray-400' };
                return (
                  <div key={item.id} className="grid grid-cols-[130px_90px_70px_1fr_140px_90px] gap-0 px-5 py-3.5 items-start">
                    <p className="text-xs text-gray-400 tabular-nums pt-0.5">
                      {new Date(item.created_at).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className="flex items-start pt-0.5">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${rm.bg}`}>{rm.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 pt-1">
                      {item.source === 'live' ? 'live' : 'simulado'}
                    </p>
                    <p className="text-sm text-gray-300 pr-4 leading-relaxed line-clamp-3">
                      {item.message_text ?? '—'}
                    </p>
                    <p className="text-xs text-indigo-400 pr-2 pt-0.5 truncate">
                      {item.caso ?? '—'}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setFeedback(item.id, 'positive')}
                        className={`p-1.5 rounded-lg transition-colors ${item.feedback === 'positive' ? 'bg-green-500/20 text-green-400' : 'text-gray-600 hover:text-gray-400'}`}
                      >
                        <ThumbsUp size={13} />
                      </button>
                      <button
                        onClick={() => setFeedback(item.id, 'negative')}
                        className={`p-1.5 rounded-lg transition-colors ${item.feedback === 'negative' ? 'bg-red-500/20 text-red-400' : 'text-gray-600 hover:text-gray-400'}`}
                      >
                        <ThumbsDown size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-xs text-gray-600">{total} registros</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="text-xs text-gray-400 hover:text-white disabled:text-gray-700 disabled:cursor-not-allowed transition-colors">
              ← Anterior
            </button>
            <span className="text-xs text-gray-500">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="text-xs text-gray-400 hover:text-white disabled:text-gray-700 disabled:cursor-not-allowed transition-colors">
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SECCIÓN: Catálogo de casos ─────────────────────────────────────────────────

const DISPOSITION_MAP: Record<string, { label: string; bg: string }> = {
  reply:    { label: 'Responder', bg: 'bg-green-500/15 text-green-400' },
  handoff:  { label: 'Handoff', bg: 'bg-amber-500/15 text-amber-400' },
  schedule: { label: 'Agendar', bg: 'bg-indigo-500/15 text-indigo-400' },
};

const EMPTY_CASE_FORM = { name: '', linea: '', area: '', content: '', disposition: 'reply', status: 'active' };

function SectionCatalogo({ agentId }: { agentId: string }) {
  const [cases, setCases] = useState<AgentCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AgentCase | null>(null);
  const [form, setForm] = useState(EMPTY_CASE_FORM);
  const [saving, setSaving] = useState(false);
  const [testQuery, setTestQuery] = useState('');
  const [testResult, setTestResult] = useState<{ matched: AgentCase | null } | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get<AgentCase[]>(`/agent-panel/${agentId}/cases`)
      .then(d => setCases(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [agentId]);

  useEffect(() => { load(); }, [load]);

  const filtered = cases.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.linea ?? '').toLowerCase().includes(q) || (c.area ?? '').toLowerCase().includes(q);
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY_CASE_FORM); setShowForm(true); };
  const openEdit = (c: AgentCase) => { setEditing(c); setForm({ name: c.name, linea: c.linea ?? '', area: c.area ?? '', content: c.content, disposition: c.disposition, status: c.status }); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const save = async () => {
    if (!form.name.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        const updated = await api.patch<AgentCase>(`/agent-panel/${agentId}/cases/${editing.id}`, form);
        setCases(prev => prev.map(c => c.id === editing.id ? updated : c));
      } else {
        const created = await api.post<AgentCase>(`/agent-panel/${agentId}/cases`, form);
        setCases(prev => [...prev, created]);
      }
      closeForm();
    } catch (e: any) { alert(e?.message ?? 'Error'); }
    setSaving(false);
  };

  const del = async (id: string) => {
    if (!confirm('¿Eliminar este caso?')) return;
    await api.delete(`/agent-panel/${agentId}/cases/${id}`);
    setCases(prev => prev.filter(c => c.id !== id));
  };

  const testSearch = async () => {
    if (!testQuery.trim()) return;
    setTestLoading(true);
    try {
      const r = await api.post<{ matched: AgentCase | null }>(`/agent-panel/${agentId}/cases/search`, { query: testQuery });
      setTestResult(r);
    } catch (e: any) { alert(e?.message ?? 'Error'); }
    setTestLoading(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Catálogo de casos" subtitle="Los ~10 casos que el agente recupera (base de conocimiento)" />
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={14} /> Nuevo caso
        </button>
      </div>

      {/* Probar búsqueda */}
      <div className="bg-gray-900 border border-indigo-500/20 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={14} className="text-indigo-400" />
          <p className="text-xs font-semibold text-indigo-300">Probar búsqueda en el catálogo</p>
        </div>
        <p className="text-xs text-gray-500 mb-3">Escribe un mensaje del broker y observa qué caso recupera y cómo elige el agente.</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ej: ¿Cuánto cuesta el servicio?"
            value={testQuery}
            onChange={e => setTestQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && testSearch()}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={testSearch}
            disabled={testLoading || !testQuery.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            {testLoading ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
            Buscar
          </button>
        </div>
        {testResult && (
          <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
            {testResult.matched ? (
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Caso recuperado</p>
                <p className="text-sm font-semibold text-white">{testResult.matched.name}</p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{testResult.matched.content}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Ningún caso coincide con esa búsqueda.</p>
            )}
          </div>
        )}
      </div>

      {/* Formulario inline */}
      {showForm && (
        <div className="bg-gray-900 border border-indigo-500/30 rounded-xl p-5 mb-6">
          <p className="text-sm font-semibold text-white mb-4">{editing ? 'Editar caso' : 'Nuevo caso'}</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-semibold mb-1 block">Nombre *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                placeholder="Ej: Solicitud de precio" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-semibold mb-1 block">Disposición</label>
              <select value={form.disposition} onChange={e => setForm(p => ({ ...p, disposition: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                <option value="reply">Responder</option>
                <option value="handoff">Handoff</option>
                <option value="schedule">Agendar</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-semibold mb-1 block">Línea</label>
              <input value={form.linea} onChange={e => setForm(p => ({ ...p, linea: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                placeholder="Ej: Objeción, Pregunta, Cierre" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-semibold mb-1 block">Área</label>
              <input value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                placeholder="Ej: Precio, Servicios, Timeline" />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-[10px] text-gray-500 uppercase font-semibold mb-1 block">Instrucciones para el agente *</label>
            <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-indigo-500"
              placeholder="Explica cómo debe responder el agente en este caso..." />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={save} disabled={saving || !form.name.trim() || !form.content.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {editing ? 'Guardar cambios' : 'Crear caso'}
            </button>
            <button onClick={closeForm} className="text-sm text-gray-500 hover:text-gray-400 transition-colors px-2 py-2">Cancelar</button>
            {editing && (
              <div className="ml-auto">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-gray-500">Estado:</span>
                  <button onClick={() => setForm(p => ({ ...p, status: p.status === 'active' ? 'inactive' : 'active' }))}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${form.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                    {form.status === 'active' ? 'Activo' : 'Inactivo'}
                  </button>
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Búsqueda y tabla */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input type="text" placeholder="Buscar caso..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-8 pr-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
        </div>
        <span className="text-xs text-gray-600">{filtered.length} caso{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={20} className="text-indigo-500 animate-spin" /></div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[50px_1fr_120px_120px_120px_80px_60px] gap-0 px-5 py-2.5 border-b border-gray-800">
            {['ID', 'NOMBRE', 'LÍNEA', 'ÁREA', 'DISPOSICIÓN', 'ESTADO', ''].map(h => (
              <p key={h} className="text-[10px] font-semibold text-gray-600 tracking-wide uppercase">{h}</p>
            ))}
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-16">Sin casos en el catálogo. Crea el primero.</p>
          ) : (
            <div className="divide-y divide-gray-800/70">
              {filtered.map((c, idx) => {
                const disp = DISPOSITION_MAP[c.disposition] ?? { label: c.disposition, bg: 'bg-gray-800 text-gray-400' };
                return (
                  <div key={c.id} className="grid grid-cols-[50px_1fr_120px_120px_120px_80px_60px] gap-0 px-5 py-3.5 items-center hover:bg-gray-800/30 transition-colors">
                    <p className="text-xs text-gray-600 tabular-nums font-mono">{String(idx + 1).padStart(4, '0')}</p>
                    <div className="min-w-0 pr-4">
                      <p className="text-sm font-medium text-white truncate">{c.name}</p>
                      <p className="text-xs text-gray-600 truncate mt-0.5 line-clamp-1">{c.content.slice(0, 80)}</p>
                    </div>
                    <p className="text-xs text-gray-400 truncate pr-2">{c.linea ?? '—'}</p>
                    <p className="text-xs text-gray-400 truncate pr-2">{c.area ?? '—'}</p>
                    <div>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${disp.bg}`}>{disp.label}</span>
                    </div>
                    <div>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                        {c.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-gray-600 hover:text-indigo-400 transition-colors rounded">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => del(c.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors rounded">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
