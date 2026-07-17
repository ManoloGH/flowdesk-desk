'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  RefreshCw, ChevronLeft, DollarSign, Users, TrendingUp, Zap,
  Plus, Play, Pause, Trash2, X, Check, AlertCircle, Lightbulb,
  TrendingUp as TrendUp, Target, Calendar, FileText, CreditCard,
  ClipboardList, MessageSquare, BarChart2,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Cliente {
  id: string; empresa: string; contacto_nombre: string; contacto_cargo: string;
  industria: string; status: string; ejecutivo_asignado: string;
  fecha_inicio: string; precio: number; fase_actual: 0 | 1 | 2 | 3;
  areas_diagnosticadas: string[];
}

interface Diagnostico  { id: string; area: string; procesado: boolean; created_at: string; datos: any; }
interface Hallazgo     { id: string; area: string; tipo: string; titulo: string; descripcion?: string; impacto?: string; created_at: string; }
interface AccionPlan   { id: string; titulo: string; area: string; prioridad: string; status: string; responsable?: string; fecha_estimada?: string; notas?: string; hallazgo?: { titulo: string; tipo: string } | null; }
interface Sesion       { id: string; fecha: string; tipo: string; titulo: string; notas?: string; acciones?: string; }
interface Pago         { id: string; fecha: string; monto: number; concepto: string; status: string; }

interface ClienteDetail extends Cliente {
  checks:       { check_id: string; checked: boolean }[];
  notas:        string;
  diagnosticos: Diagnostico[];
  hallazgos:    Hallazgo[];
  plan:         AccionPlan[];
  sesiones:     Sesion[];
  pagos:        Pago[];
}

interface Automatizacion {
  id: string; nombre: string; area: string; descripcion: string | null;
  tipo: string; status: 'pendiente' | 'activa' | 'pausada' | 'inactiva';
  cliente: { id: string; empresa: string } | null; created_at: string;
}

// ── Phases ────────────────────────────────────────────────────────────────────

const PHASES = [
  { num: 0, label: 'Mapeo técnico',  duracion: '2 semanas', color: '#6c4de6', items: [
    { id: 'accesos',      label: 'Accesos recibidos (sistemas, usuarios, APIs)' },
    { id: 'inventario',   label: 'Inventario de herramientas documentado' },
    { id: 'discovery',    label: 'Sesión de discovery completada' },
    { id: 'configurador', label: 'Configurador de diagnóstico ejecutado' },
    { id: 'bpmn_asis',    label: 'BPMNs AS-IS generados y revisados' },
    { id: 'hallazgos',    label: 'Hallazgos documentados con /analizar' },
  ]},
  { num: 1, label: 'Quick Wins',    duracion: '4 semanas', color: '#f59e0b', items: [
    { id: 'cuestionarios', label: 'Cuestionarios de diagnóstico completados' },
    { id: 'matriz',        label: 'Matriz de impacto generada y aprobada' },
    { id: 'auto1',         label: 'Automatización #1 implementada y probada' },
    { id: 'auto2',         label: 'Automatización #2 implementada y probada' },
    { id: 'auto3',         label: 'Automatización #3 implementada y probada' },
    { id: 'informe',       label: 'Informe de diagnóstico entregado' },
  ]},
  { num: 2, label: 'Expansión',     duracion: '8 semanas', color: '#3b82f6', items: [
    { id: 'bpmn_tobe',    label: 'BPMNs TO-BE implementados' },
    { id: 'crm',          label: 'CRM configurado e integrado' },
    { id: 'agente',       label: 'Agente IA configurado para el cliente' },
    { id: 'dashboard',    label: 'Dashboard de métricas conectado' },
    { id: 'capacitacion', label: 'Capacitación al equipo realizada' },
  ]},
  { num: 3, label: 'Optimización',  duracion: 'Ongoing',   color: '#22c55e', items: [
    { id: 'revision_mes', label: 'Revisión mensual de métricas completada' },
    { id: 'ajustes',      label: 'Ajustes y mejoras aplicados este mes' },
    { id: 'nuevas_opps',  label: 'Nuevas oportunidades identificadas' },
    { id: 'renovacion',   label: 'Renovación / upsell evaluada' },
  ]},
] as { num: number; label: string; duracion: string; color: string; items: { id: string; label: string }[] }[];

// ── Config maps ───────────────────────────────────────────────────────────────

const HALLAZGO_TIPO: Record<string, { label: string; color: string; bg: string; icon: typeof AlertCircle }> = {
  critico:        { label: 'Crítico',         color: '#ef4444', bg: '#ef444418', icon: AlertCircle },
  importante:     { label: 'Importante',      color: '#f59e0b', bg: '#f59e0b18', icon: TrendUp },
  positivo:       { label: 'Positivo',        color: '#22c55e', bg: '#22c55e18', icon: Lightbulb },
  oportunidad_ia: { label: 'Oportunidad IA',  color: '#6c4de6', bg: '#6c4de618', icon: Target },
};

const PLAN_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pendiente:   { label: 'Pendiente',    color: '#6b7280', bg: '#6b728018' },
  en_progreso: { label: 'En progreso',  color: '#3b82f6', bg: '#3b82f618' },
  completado:  { label: 'Completado',   color: '#22c55e', bg: '#22c55e18' },
  cancelado:   { label: 'Cancelado',    color: '#ef4444', bg: '#ef444418' },
};

const PLAN_PRIORIDAD: Record<string, { color: string }> = {
  alta:  { color: '#ef4444' },
  media: { color: '#f59e0b' },
  baja:  { color: '#22c55e' },
};

const SESION_TIPO: Record<string, string> = {
  discovery: '🔍', kickoff: '🚀', revision: '📋', entrega: '📦', capacitacion: '🎓', otro: '💬',
};

const PAGO_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pagado:   { label: 'Pagado',   color: '#22c55e', bg: '#22c55e18' },
  pendiente: { label: 'Pendiente', color: '#f59e0b', bg: '#f59e0b18' },
  parcial:  { label: 'Parcial',  color: '#3b82f6', bg: '#3b82f618' },
};

const STATUS_AUTO: Record<string, { label: string; color: string; bg: string }> = {
  pendiente: { label: 'Pendiente', color: '#f59e0b', bg: '#f59e0b18' },
  activa:    { label: 'Activa',    color: '#22c55e', bg: '#22c55e18' },
  pausada:   { label: 'Pausada',   color: '#6b7280', bg: '#6b728018' },
  inactiva:  { label: 'Inactiva',  color: '#ef4444', bg: '#ef444418' },
};

const TIPO_ICON: Record<string, string> = {
  whatsapp_bot: '💬', n8n_workflow: '🔄', webhook: '🪝', otro: '⚙️',
};

const EMPTY_FORM = {
  nombre: '', area: 'otro', descripcion: '', tipo: 'otro',
  trigger: '', accion: '', canal: '', webhook_url: '', cliente_id: '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt$(n: number) { return '$' + n.toLocaleString('es-MX') + ' MXN'; }
function fmtDate(s: string) { return new Date(s).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }); }

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid #6c4de6', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

function EmptyState({ emoji, title, sub }: { emoji: string; title: string; sub?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{emoji}</div>
      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', margin: 0 }}>{title}</p>
      {sub && <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>{sub}</p>}
    </div>
  );
}

// ── Workspace tabs ────────────────────────────────────────────────────────────

type WTab = 'proyecto' | 'diagnosticos' | 'hallazgos' | 'plan' | 'sesiones' | 'facturacion';

const WTABS: { key: WTab; label: string; icon: typeof FileText }[] = [
  { key: 'proyecto',     label: 'Proyecto',       icon: ClipboardList },
  { key: 'diagnosticos', label: 'Diagnósticos',   icon: BarChart2 },
  { key: 'hallazgos',    label: 'Hallazgos',      icon: AlertCircle },
  { key: 'plan',         label: 'Plan de acción', icon: Target },
  { key: 'sesiones',     label: 'Sesiones',       icon: MessageSquare },
  { key: 'facturacion',  label: 'Facturación',    icon: CreditCard },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ErpPage() {
  const [tab, setTab] = useState<'implementacion' | 'automatizaciones'>('implementacion');

  const [clientes, setClientes]           = useState<Cliente[]>([]);
  const [loadingC, setLoadingC]           = useState(true);
  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [clienteDetail, setClienteDetail] = useState<ClienteDetail | null>(null);
  const [checks, setChecks]               = useState<Record<string, boolean>>({});
  const [loadingW, setLoadingW]           = useState(false);
  const [wTab, setWTab]                   = useState<WTab>('proyecto');

  const [autos, setAutos]       = useState<Automatizacion[]>([]);
  const [loadingA, setLoadingA] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ ...EMPTY_FORM });
  const [savingA, setSavingA]   = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadClientes = useCallback(async () => {
    setLoadingC(true);
    try { const d = await api.get<Cliente[]>('/mentoria/clientes'); setClientes(Array.isArray(d) ? d : []); }
    catch { setClientes([]); }
    setLoadingC(false);
  }, []);

  const loadAutos = useCallback(async () => {
    setLoadingA(true);
    try { const d = await api.get<Automatizacion[]>('/mentoria/automatizaciones'); setAutos(Array.isArray(d) ? d : []); }
    catch { setAutos([]); }
    setLoadingA(false);
  }, []);

  useEffect(() => { loadClientes(); }, [loadClientes]);
  useEffect(() => { if (tab === 'automatizaciones') loadAutos(); }, [tab, loadAutos]);

  async function openWorkspace(id: string) {
    setSelectedId(id); setLoadingW(true); setWTab('proyecto');
    try {
      const data = await api.get<ClienteDetail>(`/mentoria/clientes/${id}`);
      setClienteDetail(data);
      const c: Record<string, boolean> = {};
      (data.checks || []).forEach(ch => { if (ch.checked) c[ch.check_id] = true; });
      setChecks(c);
    } catch {
      const base = clientes.find(c => c.id === id);
      if (base) setClienteDetail({ ...base, checks: [], notas: '', diagnosticos: [], hallazgos: [], plan: [], sesiones: [], pagos: [] });
    }
    setLoadingW(false);
  }

  function toggleCheck(itemId: string, phaseNum: number) {
    if (!selectedId) return;
    const next = !checks[itemId];
    setChecks(prev => ({ ...prev, [itemId]: next }));
    api.post(`/mentoria/clientes/${selectedId}/checks`, { check_id: itemId, phase: phaseNum, checked: next }).catch(() => {});
  }

  const mrr = clientes.filter(c => c.status === 'activo').reduce((a, c) => a + c.precio, 0);
  const autosActivas = autos.filter(a => a.status === 'activa').length;

  async function handleCreateAuto() {
    if (!form.descripcion.trim()) return;
    setSavingA(true);
    try {
      const nombre = form.nombre.trim() || form.descripcion.trim().slice(0, 80);
      await api.post('/mentoria/automatizaciones', { nombre, area: form.area, tipo: form.tipo, descripcion: form.descripcion.trim(), trigger: form.trigger || undefined, accion: form.accion || undefined, canal: form.canal || undefined, webhook_url: form.webhook_url || undefined, cliente_id: form.cliente_id || undefined });
      setForm({ ...EMPTY_FORM }); setShowForm(false); await loadAutos();
    } catch {}
    setSavingA(false);
  }

  async function handleActivar(id: string) {
    setActionId(id);
    try { await api.post(`/mentoria/automatizaciones/${id}/activar`, {}); setAutos(prev => prev.map(a => a.id === id ? { ...a, status: 'activa' } : a)); } catch {}
    setActionId(null);
  }
  async function handlePausar(id: string) {
    setActionId(id);
    try { await api.post(`/mentoria/automatizaciones/${id}/pausar`, {}); setAutos(prev => prev.map(a => a.id === id ? { ...a, status: 'pausada' } : a)); } catch {}
    setActionId(null);
  }
  async function handleDeleteAuto(id: string) {
    if (!confirm('¿Eliminar esta automatización?')) return;
    setActionId(id);
    try { await api.delete(`/mentoria/automatizaciones/${id}`); setAutos(prev => prev.filter(a => a.id !== id)); } catch {}
    setActionId(null);
  }

  const cliente = clienteDetail ?? (selectedId ? clientes.find(c => c.id === selectedId) ?? null : null);
  const fase = cliente ? PHASES[cliente.fase_actual] : null;
  const totalDone  = PHASES.flatMap(p => p.items).filter(i => checks[i.id]).length;
  const totalItems = PHASES.flatMap(p => p.items).length;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '22px 28px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#6c4de6,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🎓</div>
            <div>
              <h1 style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)', margin: 0 }}>ERP · MentorIA Systems</h1>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>Implementación activa y automatizaciones</p>
            </div>
          </div>
          {!selectedId && <button onClick={tab === 'implementacion' ? loadClientes : loadAutos} style={btnGhost}><RefreshCw size={13} /></button>}
        </div>

        {/* Stats — solo en lista */}
        {!selectedId && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            {[
              { icon: <Users size={13} />,     label: 'Clientes en ERP',         value: clientes.length,  color: '#6c4de6' },
              { icon: <DollarSign size={13} />, label: 'MRR activos',             value: fmt$(mrr),        color: '#f59e0b' },
              { icon: <TrendingUp size={13} />, label: 'Fase promedio',           value: clientes.length ? `Fase ${(clientes.reduce((a, c) => a + c.fase_actual, 0) / clientes.length).toFixed(1)}` : '—', color: '#3b82f6' },
              { icon: <Zap size={13} />,        label: 'Automatizaciones activas', value: autosActivas,    color: '#22c55e' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '11px 14px', flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ color: s.color }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main tabs — solo en lista */}
        {!selectedId && (
          <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--line)' }}>
            {[{ key: 'implementacion', label: 'Implementación' }, { key: 'automatizaciones', label: 'Automatizaciones' }].map(t => (
              <button key={t.key} onClick={() => setTab(t.key as any)}
                style={{ padding: '8px 16px', fontSize: 13, fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? '#6c4de6' : 'var(--text-3)', borderBottom: tab === t.key ? '2px solid #6c4de6' : '2px solid transparent', background: 'none', border: 'none', cursor: 'pointer', marginBottom: -1 }}>
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px 28px' }}>

        {tab === 'implementacion' && (
          <>
            {/* ── WORKSPACE (cliente seleccionado) ── */}
            {selectedId && (
              <>
                <button
                  onClick={() => { setSelectedId(null); setClienteDetail(null); setChecks({}); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 12, marginBottom: 16, padding: 0 }}
                >
                  <ChevronLeft size={13} /> Todos los clientes
                </button>

                {loadingW ? <Spinner /> : cliente ? (
                  <>
                    {/* Client header */}
                    <div style={{ background: 'var(--surface)', border: `1px solid ${fase ? fase.color + '50' : 'var(--line)'}`, borderRadius: 13, padding: '18px 22px', marginBottom: 18, position: 'relative', overflow: 'hidden' }}>
                      {fase && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: fase.color }} />}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.025em', marginBottom: 4 }}>{cliente.empresa}</h2>
                          <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 4 }}>{cliente.contacto_nombre}{cliente.contacto_cargo ? ` · ${cliente.contacto_cargo}` : ''}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{cliente.industria}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {fase && (
                            <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 14px' }}>
                              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Fase actual</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: fase.color }}>Fase {fase.num} · {fase.label}</div>
                            </div>
                          )}
                          <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 14px' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Progreso</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#6c4de6' }}>{totalItems > 0 ? Math.round(totalDone / totalItems * 100) : 0}%</div>
                            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{totalDone}/{totalItems}</div>
                          </div>
                          <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 14px' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Contrato</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b' }}>{fmt$(cliente.precio)}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Workspace tabs */}
                    <div style={{ display: 'flex', gap: 1, borderBottom: '1px solid var(--line)', marginBottom: 20, overflowX: 'auto' }}>
                      {WTABS.map(t => {
                        const Icon = t.icon;
                        const active = wTab === t.key;
                        return (
                          <button key={t.key} onClick={() => setWTab(t.key)}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12, fontWeight: active ? 700 : 400, color: active ? '#6c4de6' : 'var(--text-3)', borderBottom: active ? '2px solid #6c4de6' : '2px solid transparent', background: 'none', border: 'none', cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap' }}>
                            <Icon size={12} />
                            {t.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* ── PROYECTO ── */}
                    {wTab === 'proyecto' && (
                      <>
                        <PhaseTracker current={cliente.fase_actual} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
                          {PHASES.map(phase => {
                            const done = phase.items.filter(i => checks[i.id]).length;
                            const pct = Math.round(done / phase.items.length * 100);
                            const isCurrent = phase.num === cliente.fase_actual;
                            const isPast    = phase.num < cliente.fase_actual;
                            return (
                              <div key={phase.num} style={{ background: 'var(--surface)', border: `1px solid ${isCurrent ? phase.color + '50' : 'var(--line)'}`, borderRadius: 12, overflow: 'hidden', opacity: phase.num > cliente.fase_actual ? 0.55 : 1 }}>
                                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid var(--line)' }}>
                                  <div style={{ width: 32, height: 32, borderRadius: 8, background: isPast ? 'rgba(34,197,94,0.12)' : `${phase.color}18`, border: `1px solid ${isPast ? 'rgba(34,197,94,0.3)' : phase.color + '40'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: isPast ? '#22c55e' : phase.color, flexShrink: 0 }}>
                                    {isPast ? '✓' : phase.num}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Fase {phase.num} · {phase.label}</span>
                                      {isCurrent && <span style={{ fontSize: 10, fontWeight: 700, background: `${phase.color}18`, color: phase.color, border: `1px solid ${phase.color}40`, padding: '2px 8px', borderRadius: 99 }}>Actual</span>}
                                      <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{phase.duracion}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <div style={{ flex: 1, height: 4, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: pct + '%', background: isPast ? '#22c55e' : phase.color, borderRadius: 99, transition: 'width 0.4s' }} />
                                      </div>
                                      <span style={{ fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>{done}/{phase.items.length}</span>
                                    </div>
                                  </div>
                                </div>
                                <div style={{ padding: '4px 0' }}>
                                  {phase.items.map(item => (
                                    <label key={item.id}
                                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', cursor: 'pointer', transition: 'background 0.12s' }}
                                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                      <div onClick={() => toggleCheck(item.id, phase.num)}
                                        style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${checks[item.id] ? (isPast ? '#22c55e' : phase.color) : 'var(--line)'}`, background: checks[item.id] ? (isPast ? '#22c55e' : phase.color) : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s', cursor: 'pointer' }}>
                                        {checks[item.id] && <Check size={10} color="white" strokeWidth={3} />}
                                      </div>
                                      <span style={{ fontSize: 13, color: checks[item.id] ? 'var(--text-3)' : 'var(--text)', textDecoration: checks[item.id] ? 'line-through' : 'none', lineHeight: 1.4 }}>{item.label}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {/* ── DIAGNÓSTICOS ── */}
                    {wTab === 'diagnosticos' && (
                      <div>
                        {!clienteDetail?.diagnosticos?.length ? (
                          <EmptyState emoji="📊" title="Sin diagnósticos" sub="Los diagnósticos se generan al correr el configurador con el cliente" />
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                            {clienteDetail.diagnosticos.map(d => (
                              <div key={d.id} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '16px 18px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', textTransform: 'capitalize' }}>{d.area}</span>
                                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: d.procesado ? '#22c55e18' : '#f59e0b18', color: d.procesado ? '#22c55e' : '#f59e0b', fontWeight: 600 }}>
                                    {d.procesado ? 'Procesado' : 'Pendiente'}
                                  </span>
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                                  {Object.keys(d.datos ?? {}).length} campos capturados
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{fmtDate(d.created_at)}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── HALLAZGOS ── */}
                    {wTab === 'hallazgos' && (
                      <div>
                        {!clienteDetail?.hallazgos?.length ? (
                          <EmptyState emoji="🔍" title="Sin hallazgos" sub="Los hallazgos se generan al analizar los diagnósticos con /analizar" />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {(['critico', 'importante', 'oportunidad_ia', 'positivo'] as const).map(tipo => {
                              const items = clienteDetail.hallazgos.filter(h => h.tipo === tipo);
                              if (!items.length) return null;
                              const cfg = HALLAZGO_TIPO[tipo];
                              const Icon = cfg.icon;
                              return (
                                <div key={tipo}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                    <Icon size={13} style={{ color: cfg.color }} />
                                    <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{cfg.label} ({items.length})</span>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {items.map(h => (
                                      <div key={h.id} style={{ background: 'var(--surface)', border: `1px solid ${cfg.color}30`, borderLeft: `3px solid ${cfg.color}`, borderRadius: '0 10px 10px 0', padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: h.descripcion ? 6 : 0 }}>
                                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{h.titulo}</span>
                                          <span style={{ fontSize: 10, color: 'var(--text-3)', flexShrink: 0, background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 99 }}>{h.area}</span>
                                        </div>
                                        {h.descripcion && <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '0 0 6px', lineHeight: 1.5 }}>{h.descripcion}</p>}
                                        {h.impacto && <p style={{ fontSize: 11, color: cfg.color, margin: 0 }}>💡 {h.impacto}</p>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── PLAN DE ACCIÓN ── */}
                    {wTab === 'plan' && (
                      <div>
                        {!clienteDetail?.plan?.length ? (
                          <EmptyState emoji="📋" title="Sin plan de acción" sub="El plan se genera a partir de los hallazgos identificados" />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {clienteDetail.plan.map(a => {
                              const sc = PLAN_STATUS[a.status] ?? PLAN_STATUS.pendiente;
                              const pc = PLAN_PRIORIDAD[a.prioridad] ?? { color: 'var(--text-3)' };
                              return (
                                <div key={a.id} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                  <div style={{ width: 4, height: 44, borderRadius: 99, background: pc.color, flexShrink: 0, marginTop: 2 }} />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{a.titulo}</span>
                                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: sc.bg, color: sc.color, fontWeight: 600, border: `1px solid ${sc.color}30` }}>{sc.label}</span>
                                      <span style={{ fontSize: 10, color: 'var(--text-3)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 99 }}>{a.area}</span>
                                    </div>
                                    {a.hallazgo && <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '0 0 4px' }}>↳ {a.hallazgo.titulo}</p>}
                                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-3)', flexWrap: 'wrap' }}>
                                      {a.responsable && <span>👤 {a.responsable}</span>}
                                      {a.fecha_estimada && <span>📅 {fmtDate(a.fecha_estimada)}</span>}
                                      <span style={{ color: pc.color, fontWeight: 600 }}>Prioridad {a.prioridad}</span>
                                    </div>
                                    {a.notas && <p style={{ fontSize: 11, color: 'var(--text-2)', margin: '6px 0 0', lineHeight: 1.4 }}>{a.notas}</p>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── SESIONES ── */}
                    {wTab === 'sesiones' && (
                      <div>
                        {!clienteDetail?.sesiones?.length ? (
                          <EmptyState emoji="💬" title="Sin sesiones registradas" sub="Las sesiones se registran conforme avanza la implementación" />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {clienteDetail.sesiones.map(s => (
                              <div key={s.id} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 14 }}>
                                <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{SESION_TIPO[s.tipo] ?? '💬'}</div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{s.titulo}</span>
                                    <span style={{ fontSize: 10, color: 'var(--text-3)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 99, textTransform: 'capitalize' }}>{s.tipo}</span>
                                    <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>
                                      <Calendar size={10} style={{ display: 'inline', marginRight: 3 }} />{fmtDate(s.fecha)}
                                    </span>
                                  </div>
                                  {s.notas && <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '0 0 6px', lineHeight: 1.5 }}>{s.notas}</p>}
                                  {s.acciones && (
                                    <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>
                                      <span style={{ fontWeight: 600, color: 'var(--text-3)', marginRight: 4 }}>Acciones:</span>{s.acciones}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── FACTURACIÓN ── */}
                    {wTab === 'facturacion' && (
                      <div>
                        {clienteDetail?.pagos?.length ? (
                          <>
                            {/* Resumen */}
                            <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                              {[
                                { label: 'Total cobrado', value: fmt$(clienteDetail.pagos.filter(p => p.status === 'pagado').reduce((a, p) => a + p.monto, 0)), color: '#22c55e' },
                                { label: 'Pendiente',     value: fmt$(clienteDetail.pagos.filter(p => p.status !== 'pagado').reduce((a, p) => a + p.monto, 0)), color: '#f59e0b' },
                                { label: 'Total pagos',   value: clienteDetail.pagos.length + ' pagos', color: '#6c4de6' },
                              ].map(s => (
                                <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 16px', flex: 1 }}>
                                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>{s.label}</div>
                                  <div style={{ fontSize: 17, fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
                                </div>
                              ))}
                            </div>
                            {/* Lista */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {clienteDetail.pagos.map(p => {
                                const sc = PAGO_STATUS[p.status] ?? PAGO_STATUS.pendiente;
                                return (
                                  <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 9, background: `${sc.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <CreditCard size={15} style={{ color: sc.color }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{p.concepto}</div>
                                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmtDate(p.fecha)}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{fmt$(p.monto)}</span>
                                      <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 99, background: sc.bg, color: sc.color, fontWeight: 700, border: `1px solid ${sc.color}30` }}>{sc.label}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <EmptyState emoji="💳" title="Sin pagos registrados" sub="Los pagos se registran conforme se factura al cliente" />
                        )}
                      </div>
                    )}
                  </>
                ) : null}
              </>
            )}

            {/* ── LISTA DE CLIENTES ── */}
            {!selectedId && (
              loadingC ? <Spinner /> : !clientes.length ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: '60px 0' }}>
                  <span style={{ fontSize: 32 }}>🎓</span>
                  <p style={{ fontSize: 14, color: 'var(--text-3)', textAlign: 'center' }}>Sin clientes en implementación.<br />Convierte un prospecto desde el CRM.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                  {clientes.map(c => {
                    const fase = PHASES[c.fase_actual];
                    const fasePct = [0, 33, 66, 100][c.fase_actual];
                    return (
                      <button key={c.id} onClick={() => openWorkspace(c.id)}
                        style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 13, padding: 0, cursor: 'pointer', textAlign: 'left', overflow: 'hidden', transition: 'border-color 0.15s, transform 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = fase.color + '80'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                        <div style={{ height: 4, background: 'var(--line)' }}>
                          <div style={{ height: '100%', width: fasePct + '%', background: fase.color, transition: 'width 0.4s' }} />
                        </div>
                        <div style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                            <div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{c.empresa}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.industria}</div>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: `${fase.color}20`, color: fase.color, border: `1px solid ${fase.color}40`, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 8 }}>
                              Fase {c.fase_actual} · {fase.label}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12 }}>{c.contacto_nombre}{c.contacto_cargo ? ` · ${c.contacto_cargo}` : ''}</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{fmt$(c.precio)}</span>
                            <span style={{ fontSize: 11, color: fase.color, fontWeight: 600 }}>Ver →</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )
            )}
          </>
        )}

        {tab === 'automatizaciones' && (
          <AutomatizacionesTab
            autos={autos} loading={loadingA} clientes={clientes}
            showForm={showForm} setShowForm={setShowForm}
            form={form} setForm={setForm}
            savingA={savingA} actionId={actionId}
            onSave={handleCreateAuto} onActivar={handleActivar}
            onPausar={handlePausar} onDelete={handleDeleteAuto}
          />
        )}
      </div>
    </div>
  );
}

// ── Phase Tracker ──────────────────────────────────────────────────────────────

function PhaseTracker({ current }: { current: number }) {
  const colors = ['#6c4de6', '#f59e0b', '#3b82f6', '#22c55e'];
  const labels = ['Mapeo', 'Quick Wins', 'Expansión', 'Optimización'];
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {[0, 1, 2, 3].map((n, i) => {
        const done = n < current; const active = n === current;
        const color = colors[n];
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: done ? '#22c55e' : active ? color : 'var(--surface-2)', border: `2px solid ${done ? '#22c55e' : active ? color : 'var(--line)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: done || active ? 'white' : 'var(--text-3)', flexShrink: 0 }}>
                {done ? '✓' : n}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: active ? color : done ? '#22c55e' : 'var(--text-3)', whiteSpace: 'nowrap' }}>{labels[n]}</span>
            </div>
            {i < 3 && <div style={{ flex: 1, height: 2, background: n < current ? '#22c55e' : 'var(--line)', margin: '0 6px', marginBottom: 14, borderRadius: 99 }} />}
          </div>
        );
      })}
    </div>
  );
}

// ── Automatizaciones Tab ──────────────────────────────────────────────────────

function AutomatizacionesTab({ autos, loading, clientes, showForm, setShowForm, form, setForm, savingA, actionId, onSave, onActivar, onPausar, onDelete }: {
  autos: Automatizacion[]; loading: boolean; clientes: Cliente[];
  showForm: boolean; setShowForm: (v: boolean) => void;
  form: typeof EMPTY_FORM; setForm: (v: typeof EMPTY_FORM) => void;
  savingA: boolean; actionId: string | null;
  onSave: () => void; onActivar: (id: string) => void; onPausar: (id: string) => void; onDelete: (id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: 'var(--surface)', border: showForm ? '1px solid #6c4de660' : '1px solid var(--line)', borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s' }}>
        {!showForm ? (
          <button onClick={() => setShowForm(true)} style={{ width: '100%', padding: '16px 20px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#6c4de618', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={15} color="#6c4de6" /></div>
            <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Describe la automatización que quieres crear…</span>
          </button>
        ) : (
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Nueva automatización</span>
              <button onClick={() => { setShowForm(false); setForm({ ...EMPTY_FORM }); }} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 2 }}><X size={14} /></button>
            </div>
            <textarea autoFocus value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value, nombre: e.target.value.split('\n')[0].slice(0, 80) })}
              placeholder="Ej: Al finalizar el diagnóstico, enviar los resultados al email del cliente."
              rows={5} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55, fontSize: 13 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{ fontSize: 11, color: 'var(--text-3)' }}>Cliente:</label>
                <select value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })} style={{ ...inputStyle, width: 'auto', padding: '5px 8px', fontSize: 12 }}>
                  <option value="">— general —</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.empresa}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowForm(false); setForm({ ...EMPTY_FORM }); }} style={btnGhost}>Cancelar</button>
                <button onClick={onSave} disabled={savingA || !form.descripcion.trim()} style={{ ...btnPrimary, opacity: savingA || !form.descripcion.trim() ? 0.5 : 1 }}>
                  {savingA ? '…' : <><Check size={12} /> Guardar</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid #6c4de6', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : !autos.length ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}><div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div><p style={{ fontSize: 14, color: 'var(--text-2)', fontWeight: 600 }}>Sin automatizaciones</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {autos.map(a => {
            const sc = STATUS_AUTO[a.status] ?? STATUS_AUTO.pendiente;
            const busy = actionId === a.id;
            return (
              <div key={a.id} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${sc.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{TIPO_ICON[a.tipo] ?? '⚙️'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{a.nombre}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: sc.bg, color: sc.color, fontWeight: 700, border: `1px solid ${sc.color}40` }}>{sc.label}</span>
                  </div>
                  {a.descripcion && <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55, margin: '0 0 6px' }}>{a.descripcion}</p>}
                  {a.cliente && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>📌 {a.cliente.empresa}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                  {a.status !== 'activa' ? <button onClick={() => onActivar(a.id)} disabled={busy} title="Activar" style={{ ...btnIconGreen, opacity: busy ? 0.5 : 1 }}><Play size={12} /></button>
                    : <button onClick={() => onPausar(a.id)} disabled={busy} title="Pausar" style={{ ...btnIconGray, opacity: busy ? 0.5 : 1 }}><Pause size={12} /></button>}
                  <button onClick={() => onDelete(a.id)} disabled={busy} title="Eliminar" style={{ ...btnIconRed, opacity: busy ? 0.5 : 1 }}><Trash2 size={12} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const btnGhost: React.CSSProperties     = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontSize: 13 };
const btnPrimary: React.CSSProperties   = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: 'none', background: '#6c4de6', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const inputStyle: React.CSSProperties   = { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' };
const btnIconGreen: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: '1px solid #22c55e40', background: '#22c55e18', color: '#22c55e', cursor: 'pointer' };
const btnIconGray: React.CSSProperties  = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--text-3)', cursor: 'pointer' };
const btnIconRed: React.CSSProperties   = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: '1px solid #ef444440', background: '#ef444418', color: '#ef4444', cursor: 'pointer' };
