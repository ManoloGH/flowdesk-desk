'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  LayoutDashboard, MessageSquare, Zap, BookOpen, Users, GitBranch,
  Package, Clock, UserCheck, ArrowUpRight, Brain, Settings, FileText,
  User2, HelpCircle, ChevronLeft, Loader2, Plus, Trash2, Check, X,
  RefreshCw, AlertCircle, CheckCircle, BarChart3, Bot, Pencil,
  ChevronRight, Send,
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
}

interface Conversation {
  id: string;
  phone?: string;
  contact_name?: string;
  title?: string;
  status: string;
  stage?: string;
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

// ── Nav Structure ──────────────────────────────────────────────────────────────

type SectionId =
  | 'inicio' | 'conversaciones' | 'skills' | 'base-conocimiento'
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
      { id: 'skills', label: 'Skills', icon: Zap },
    ],
  },
  {
    label: 'Conocimiento',
    items: [
      { id: 'base-conocimiento', label: 'Base de conocimiento', icon: BookOpen },
    ],
  },
  {
    label: 'Clientes',
    items: [
      { id: 'prospectos', label: 'Prospectos', icon: Users, salesOnly: true },
      { id: 'journey', label: 'Journey del cliente', icon: GitBranch, salesOnly: true },
      { id: 'entregable', label: 'Entregable', icon: Package, salesOnly: true },
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
        />
      </main>
    </div>
  );
}

// ── Section Renderer ───────────────────────────────────────────────────────────

function SectionRenderer({
  section, agentId, agent, setAgent,
}: {
  section: SectionId;
  agentId: string;
  agent: AgentSlot;
  setAgent: (a: AgentSlot) => void;
}) {
  switch (section) {
    case 'inicio':         return <SectionInicio agentId={agentId} />;
    case 'conversaciones': return <SectionConversaciones agentId={agentId} />;
    case 'skills':         return <SectionSkills agentId={agentId} />;
    case 'calibrador':     return <SectionCalibrador agentId={agentId} />;
    case 'configuracion':  return <SectionConfiguracion agentId={agentId} agent={agent} setAgent={setAgent} />;
    case 'auditoria':      return <SectionAuditoria agentId={agentId} />;
    case 'prospectos':     return <SectionProspectos agentId={agentId} />;
    case 'journey':        return <SectionJourney agentId={agentId} agent={agent} setAgent={setAgent} />;
    case 'entregable':     return <SectionEntregable agentId={agentId} agent={agent} setAgent={setAgent} />;
    default:               return <SectionStub label={section} />;
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

// ── SECCIÓN: Inicio ────────────────────────────────────────────────────────────

function SectionInicio({ agentId }: { agentId: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardData>(`/agent-panel/${agentId}/dashboard`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [agentId]);

  return (
    <div className="p-8">
      <PageHeader title="Inicio" subtitle="Métricas y resumen del agente" />
      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={20} className="text-indigo-500 animate-spin" /></div>
        ) : data ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Conversaciones totales" value={data.total_conversations} />
            <StatCard label="Este mes" value={data.conversations_this_month} />
            <StatCard label="Correcciones" value={data.corrections_total} sub="Para entrenamiento" />
            <StatCard label="Skills activos" value={data.active_skills} />
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-16">No se pudieron cargar las métricas.</p>
        )}
      </div>
    </div>
  );
}

// ── SECCIÓN: Conversaciones ────────────────────────────────────────────────────

function SectionConversaciones({ agentId }: { agentId: string }) {
  const [tab, setTab] = useState<'real' | 'corrections'>('real');
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [convDetail, setConvDetail] = useState<ConvDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (tab === 'real') {
      setLoading(true);
      api.get<{ items: Conversation[] }>(`/agent-panel/${agentId}/conversations`)
        .then(d => setConvs(d.items ?? []))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(true);
      api.get<Correction[]>(`/agent-panel/${agentId}/corrections`)
        .then(d => setCorrections(Array.isArray(d) ? d : []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [agentId, tab]);

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

  return (
    <div className="p-8">
      <PageHeader title="Conversaciones" subtitle="Historial y correcciones para entrenamiento" />

      {/* Tabs */}
      <div className="flex gap-1 mt-6 border-b border-gray-800 mb-6">
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
        <div className="space-y-2">
          {convs.length === 0 && <p className="text-sm text-gray-500 text-center py-16">Sin conversaciones aún.</p>}
          {convs.map(c => (
            <button
              key={c.id}
              onClick={() => openConv(c.id)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between hover:border-gray-700 hover:bg-gray-800/50 transition-all text-left"
            >
              <div>
                <p className="text-sm font-medium text-white">{c.contact_name ?? c.title ?? c.phone ?? 'Sin nombre'}</p>
                <p className="text-xs text-gray-500 mt-0.5">{(c as any).phone ?? ''} · {new Date(c.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                  {(c as any).mode ?? c.stage ?? c.status ?? 'AI'}
                </span>
                <ChevronRight size={14} className="text-gray-600" />
              </div>
            </button>
          ))}
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

function SectionSkills({ agentId }: { agentId: string }) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', trigger_condition: '', response_instructions: '', example_conversation: '' });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<Skill[]>(`/agent-panel/${agentId}/skills`)
      .then(d => setSkills(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [agentId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name.trim() || !form.trigger_condition.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const updated = await api.patch<Skill>(`/agent-panel/${agentId}/skills/${editingId}`, form);
        setSkills(prev => prev.map(s => s.id === editingId ? updated : s));
      } else {
        const created = await api.post<Skill>(`/agent-panel/${agentId}/skills`, form);
        setSkills(prev => [...prev, created]);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', trigger_condition: '', response_instructions: '', example_conversation: '' });
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
    setForm({ name: s.name, trigger_condition: s.trigger_condition, response_instructions: s.response_instructions, example_conversation: s.example_conversation ?? '' });
    setShowForm(true);
  };

  return (
    <div className="p-8">
      <PageHeader title="Skills" subtitle="Habilidades especiales del agente para situaciones específicas" />

      <div className="mt-6">
        {/* Add button */}
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', trigger_condition: '', response_instructions: '', example_conversation: '' }); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors mb-6"
          >
            <Plus size={14} /> Nuevo skill
          </button>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-gray-900 border border-indigo-500/30 rounded-xl p-6 mb-6">
            <p className="text-sm font-semibold text-white mb-4">{editingId ? 'Editar skill' : 'Nuevo skill'}</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Nombre del skill</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" placeholder="ej. Manejo de objeciones de precio" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">¿Cuándo se activa?</label>
                <input value={form.trigger_condition} onChange={e => setForm(p => ({ ...p, trigger_condition: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" placeholder="ej. Cuando el cliente dice que es muy caro" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Instrucciones de respuesta</label>
                <textarea value={form.response_instructions} onChange={e => setForm(p => ({ ...p, response_instructions: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-indigo-500" rows={3} placeholder="¿Cómo debe responder el agente?" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Ejemplo de conversación (opcional)</label>
                <textarea value={form.example_conversation} onChange={e => setForm(p => ({ ...p, example_conversation: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-indigo-500" rows={2} placeholder="Usuario: 'es muy caro'&#10;Agente: '...'" />
              </div>
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

        {/* List */}
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
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-white">{s.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                        {s.status === 'active' ? 'Activo' : 'Borrador'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500"><span className="text-gray-600">Activa cuando:</span> {s.trigger_condition}</p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{s.response_instructions}</p>
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
  const [tab, setTab] = useState<'identidad' | 'preguntas' | 'criterios'>('identidad');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    instance_name: (cfg.instance_name as string) ?? '',
    cal_com_url: (cfg.cal_com_url as string) ?? '',
    pitch: (cfg.pitch as string) ?? '',
  });

  const rawQs = cfg.qualifying_questions;
  const initialQs: string[] = Array.isArray(rawQs) ? rawQs : [];
  const [questions, setQuestions] = useState<string[]>(initialQs.length ? initialQs : ['', '', '', '']);
  const [goodCriteria, setGoodCriteria] = useState<string>((cfg.good_lead_criteria as string) ?? '');
  const [badCriteria, setBadCriteria] = useState<string>((cfg.bad_lead_criteria as string) ?? '');

  const save = async (extra?: Record<string, unknown>) => {
    setSaving(true);
    try {
      const payload = { ...form, qualifying_questions: questions, good_lead_criteria: goodCriteria, bad_lead_criteria: badCriteria, ...extra };
      await api.patch(`/agent-panel/${agentId}/config`, payload);
      setAgent({ ...agent, agent_config: { ...cfg, ...payload } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) { alert(e?.message ?? 'Error al guardar'); }
    setSaving(false);
  };

  const addQuestion = () => setQuestions(prev => [...prev, '']);
  const removeQuestion = (i: number) => setQuestions(prev => prev.filter((_, idx) => idx !== i));
  const updateQuestion = (i: number, val: string) => setQuestions(prev => prev.map((q, idx) => idx === i ? val : q));

  const SaveBtn = () => (
    <button onClick={() => save()} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
      {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
      {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
    </button>
  );

  return (
    <div className="p-8">
      <PageHeader title="Journey del cliente" subtitle="Flujo de conversación y calificación de leads" />

      {/* Etapas — solo visualización */}
      <div className="mt-6 mb-8">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Flujo del journey</p>
        <div className="flex items-center gap-0 flex-wrap">
          {JOURNEY_STAGES.map((s, i) => (
            <div key={s.n} className="flex items-center">
              <div className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-center min-w-[90px]">
                <p className="text-[10px] text-indigo-400 font-bold">Etapa {s.n}</p>
                <p className="text-xs font-semibold text-white">{s.label}</p>
                <p className="text-[10px] text-gray-600 leading-tight mt-0.5">{s.desc}</p>
              </div>
              {i < JOURNEY_STAGES.length - 1 && (
                <ChevronRight size={12} className="text-gray-700 mx-1 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs de configuración */}
      <div className="flex gap-1 border-b border-gray-800 mb-6">
        {(['identidad', 'preguntas', 'criterios'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-400'}`}>
            {t === 'identidad' ? 'Identidad del bot' : t === 'preguntas' ? 'Preguntas' : 'Criterios de calificación'}
          </button>
        ))}
      </div>

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

      {tab === 'preguntas' && (
        <div className="max-w-lg space-y-4">
          <p className="text-xs text-gray-500">El agente hace estas preguntas en la Etapa 4 (en orden). Agrega o quita según necesites.</p>
          {questions.map((q, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-xs text-indigo-400 font-bold w-5 pt-3.5 flex-shrink-0">{i + 1}.</span>
              <input
                value={q}
                onChange={e => updateQuestion(i, e.target.value)}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                placeholder={`Pregunta ${i + 1}...`}
              />
              <button onClick={() => removeQuestion(i)} className="mt-2.5 text-gray-600 hover:text-red-400 transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}
          <button onClick={addQuestion} className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-400 transition-colors">
            <Plus size={13} /> Agregar pregunta
          </button>
          <SaveBtn />
        </div>
      )}

      {tab === 'criterios' && (
        <div className="max-w-lg space-y-5">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block flex items-center gap-1.5">
              <CheckCircle size={12} className="text-green-400" /> Lead BUENO — agenda cita
            </label>
            <textarea value={goodCriteria} onChange={e => setGoodCriteria(e.target.value)} rows={5} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-green-600" placeholder={`- Más de 10 años operando\n- Más de 100 empleados\n- Sin área de programación suficiente\n- Dolor operativo claro`} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block flex items-center gap-1.5">
              <X size={12} className="text-red-400" /> Lead MALO — responde con calidez, no agendes
            </label>
            <textarea value={badCriteria} onChange={e => setBadCriteria(e.target.value)} rows={5} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-red-700" placeholder={`- Menos de 10 años operando\n- Menos de 100 empleados\n- Sin presupuesto\n- Sin dolor claro identificado`} />
          </div>
          <SaveBtn />
        </div>
      )}
    </div>
  );
}

// ── SECCIÓN: Entregable ────────────────────────────────────────────────────────

function SectionEntregable({ agentId, agent, setAgent }: { agentId: string; agent: AgentSlot; setAgent: (a: AgentSlot) => void }) {
  const cfg = agent.agent_config ?? {};
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    deliverable_type: (cfg.deliverable_type as string) ?? 'micro_diagnostico',
    deliverable_url: (cfg.deliverable_url as string) ?? '',
    deliverable_description: (cfg.deliverable_description as string) ?? '',
  });

  const DELIVERABLE_TYPES = [
    { value: 'micro_diagnostico', label: 'Micro-diagnóstico', desc: 'Página HTML personalizada con análisis del prospecto' },
    { value: 'propuesta', label: 'Propuesta comercial', desc: 'PDF o página con propuesta de servicios' },
    { value: 'informe', label: 'Informe de diagnóstico', desc: 'Diagnóstico completo (versión extendida)' },
    { value: 'ninguno', label: 'Sin entregable', desc: 'El agente solo agenda, sin entregar documento' },
  ];

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/agent-panel/${agentId}/config`, form);
      setAgent({ ...agent, agent_config: { ...cfg, ...form } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) { alert(e?.message ?? 'Error al guardar'); }
    setSaving(false);
  };

  const selected = DELIVERABLE_TYPES.find(d => d.value === form.deliverable_type);

  return (
    <div className="p-8">
      <PageHeader title="Entregable" subtitle="Qué recibe el prospecto al finalizar el journey" />
      <div className="mt-6 max-w-lg space-y-6">

        {/* Tipo de entregable */}
        <div>
          <label className="text-xs text-gray-400 mb-3 block">Tipo de entregable</label>
          <div className="space-y-2">
            {DELIVERABLE_TYPES.map(d => (
              <button
                key={d.value}
                onClick={() => setForm(p => ({ ...p, deliverable_type: d.value }))}
                className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                  form.deliverable_type === d.value
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                  form.deliverable_type === d.value ? 'border-indigo-500 bg-indigo-500' : 'border-gray-600'
                }`} />
                <div>
                  <p className="text-sm font-semibold text-white">{d.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{d.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {form.deliverable_type !== 'ninguno' && (
          <>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">URL base del entregable</label>
              <input
                value={form.deliverable_url}
                onChange={e => setForm(p => ({ ...p, deliverable_url: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                placeholder="https://app.flowdesk.mx/micro/"
              />
              <p className="text-xs text-gray-600 mt-1">El token único del prospecto se agrega al final automáticamente</p>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Descripción del entregable</label>
              <textarea
                value={form.deliverable_description}
                onChange={e => setForm(p => ({ ...p, deliverable_description: e.target.value }))}
                rows={4}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-indigo-500"
                placeholder={`Ej: "Te comparto tu micro-diagnóstico personalizado con los hallazgos clave de tu empresa y las áreas donde podemos generar más valor con IA..."`}
              />
              <p className="text-xs text-gray-600 mt-1">Mensaje que el agente envía junto al link del entregable (Etapa 5)</p>
            </div>

            {/* Preview */}
            {form.deliverable_url && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-2">Vista previa del link que recibirá el prospecto:</p>
                <p className="text-sm text-indigo-400 font-mono break-all">
                  {form.deliverable_url.replace(/\/$/, '')}/[token-prospecto]
                </p>
              </div>
            )}
          </>
        )}

        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
          {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar configuración'}
        </button>
      </div>
    </div>
  );
}
