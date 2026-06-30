'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ChevronLeft, Edit2, Check, X, Plus, ExternalLink, Save } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Cliente {
  id: string; empresa: string;
  contacto_nombre: string; contacto_cargo: string;
  email: string | null; whatsapp: string | null;
  industria: string; tamano: string;
  status: 'activo' | 'inactivo';
  ejecutivo_asignado: string;
  fecha_inicio: string; fecha_fin: string | null;
  precio: number; fase_actual: 0 | 1 | 2 | 3;
  areas_diagnosticadas: string[];
  notas: string; prospecto_id: string | null;
  drive_url?: string;
}

interface Sesion {
  id: string; fecha: string;
  tipo: 'discovery' | 'kickoff' | 'revision' | 'entrega' | 'capacitacion' | 'otro';
  titulo: string; notas: string; acciones: string;
}

interface Pago {
  id: string; fecha: string; monto: number;
  concepto: string; status: 'pagado' | 'pendiente' | 'parcial';
}

interface Hallazgo {
  id: string;
  area: string;
  tipo: 'critico' | 'importante' | 'positivo' | 'oportunidad_ia';
  titulo: string;
  descripcion: string;
  impacto?: string;
}

interface AccionPlan {
  id: string;
  titulo: string;
  area: string;
  prioridad: 'alta' | 'media' | 'baja';
  status: 'pendiente' | 'en_progreso' | 'completado' | 'cancelado';
  responsable: string;
  fecha_estimada?: string;
  hallazgo_ref?: string;
  notas?: string;
}

// ── Phases config ──────────────────────────────────────────────────────────────
const PHASES = [
  {
    num: 0, label: 'Mapeo técnico', duracion: '2 semanas', color: '#6c4de6',
    items: [
      { id: 'accesos',       label: 'Accesos recibidos (sistemas, usuarios, APIs)' },
      { id: 'inventario',    label: 'Inventario de herramientas documentado' },
      { id: 'discovery',     label: 'Sesión de discovery completada' },
      { id: 'configurador',  label: 'Configurador de diagnóstico ejecutado' },
      { id: 'bpmn_asis',     label: 'BPMNs AS-IS generados y revisados' },
      { id: 'hallazgos',     label: 'Hallazgos documentados con /analizar' },
    ],
  },
  {
    num: 1, label: 'Quick Wins', duracion: '4 semanas', color: '#f59e0b',
    items: [
      { id: 'cuestionarios', label: 'Cuestionarios de diagnóstico completados' },
      { id: 'matriz',        label: 'Matriz de impacto generada y aprobada' },
      { id: 'auto1',         label: 'Automatización #1 implementada y probada' },
      { id: 'auto2',         label: 'Automatización #2 implementada y probada' },
      { id: 'auto3',         label: 'Automatización #3 implementada y probada' },
      { id: 'informe',       label: 'Informe de diagnóstico entregado' },
    ],
  },
  {
    num: 2, label: 'Expansión', duracion: '8 semanas', color: '#3b82f6',
    items: [
      { id: 'bpmn_tobe',     label: 'BPMNs TO-BE implementados' },
      { id: 'crm',           label: 'CRM configurado e integrado' },
      { id: 'agente',        label: 'Agente IA configurado para el cliente' },
      { id: 'dashboard',     label: 'Dashboard de métricas conectado' },
      { id: 'capacitacion',  label: 'Capacitación al equipo realizada' },
    ],
  },
  {
    num: 3, label: 'Optimización', duracion: 'Ongoing', color: '#22c55e',
    items: [
      { id: 'revision_mes',  label: 'Revisión mensual de métricas completada' },
      { id: 'ajustes',       label: 'Ajustes y mejoras aplicados este mes' },
      { id: 'nuevas_opps',   label: 'Nuevas oportunidades identificadas' },
      { id: 'renovacion',    label: 'Renovación / upsell evaluada' },
    ],
  },
] as const;

const DIAG_FORMS = [
  { key: 'configurador',    label: 'Configurador de sesión', icon: '⚙️', path: '/flowdesk/diagnosticos/configurador.html' },
  { key: 'marketing',       label: 'Diagnóstico Marketing',  icon: '📊', path: '/flowdesk/diagnosticos/diagnostico-marketing.html' },
  { key: 'ventas',          label: 'Diagnóstico Ventas',     icon: '💼', path: '/flowdesk/diagnosticos/diagnostico-ventas.html' },
  { key: 'operaciones',     label: 'Diagnóstico Operaciones',icon: '⚙️', path: '/flowdesk/diagnosticos/diagnostico-operaciones.html' },
  { key: 'administracion',  label: 'Diagnóstico Administración', icon: '📁', path: '/flowdesk/diagnosticos/diagnostico-administracion.html' },
  { key: 'matriz',          label: 'Matriz de impacto',      icon: '🎯', path: '/flowdesk/diagnosticos/matriz-impacto.html' },
  { key: 'visualizador',    label: 'Visualizador BPMN',      icon: '📐', path: '/flowdesk/diagnosticos/visualizador.html' },
];

const TIPO_SESION_LABEL: Record<string, string> = { discovery: 'Discovery', kickoff: 'Kickoff', revision: 'Revisión', entrega: 'Entrega', capacitacion: 'Capacitación', otro: 'Otro' };

// ── Mock client ────────────────────────────────────────────────────────────────
const MOCK_CLIENTE: Cliente = {
  id: 'c-primer', empresa: 'LogiMex SA de CV',
  contacto_nombre: 'Carlos Torres', contacto_cargo: 'Director de Operaciones',
  email: 'carlos.torres@logimex.mx', whatsapp: '+52 55 9876 5432',
  industria: 'Logística y Transporte', tamano: '10-100',
  status: 'activo', ejecutivo_asignado: 'Manolo',
  fecha_inicio: '2026-06-01', fecha_fin: null,
  precio: 30000, fase_actual: 1,
  areas_diagnosticadas: ['ventas', 'operaciones'],
  notas: '45 empleados. Todo por WhatsApp. CEO activo en sesiones. Muy receptivo.',
  prospecto_id: null,
  drive_url: 'https://drive.google.com/drive/folders/ejemplo-logimex',
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt$ = (n: number) => '$' + n.toLocaleString('es-MX') + ' MXN';
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });


// ── Page ───────────────────────────────────────────────────────────────────────
export default function ClienteWorkspace() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [cliente, setCliente]   = useState<Cliente | null>(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<'proyecto' | 'diagnosticos' | 'hallazgos' | 'plan' | 'sesiones' | 'facturacion'>('proyecto');
  const [editing, setEditing]   = useState(false);
  const [editForm, setEditForm] = useState<Partial<Cliente>>({});
  const [checks, setChecks]     = useState<Record<string, boolean>>({});
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [pagos, setPagos]       = useState<Pago[]>([]);
  const [showSesion, setShowSesion]     = useState(false);
  const [showPago, setShowPago]         = useState(false);
  const [showHallazgo, setShowHallazgo] = useState(false);
  const [showAccion, setShowAccion]     = useState(false);
  const [hallazgos, setHallazgos]       = useState<Hallazgo[]>([]);
  const [plan, setPlan]                 = useState<AccionPlan[]>([]);
  const [notas, setNotas]               = useState('');
  const [savingNotas, setSavingNotas]   = useState(false);
  const [planFilter, setPlanFilter]     = useState<AccionPlan['status'] | 'todos'>('todos');
  const [procesando, setProcesando]     = useState(false);
  const [resumenIA, setResumenIA]       = useState('');
  const [roiIA, setRoiIA]              = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await api.get<any>(`/mentoria/clientes/${id}`);
        setCliente(data);
        setNotas(data.notas || '');

        // Checks vienen como array { check_id, checked } → convertir a Record
        const allChecks: Record<string, boolean> = {};
        (data.checks || []).forEach((c: any) => { if (c.checked) allChecks[c.check_id] = true; });
        setChecks(allChecks);

        setSesiones(data.sesiones || []);
        setPagos(data.pagos || []);
        setHallazgos(data.hallazgos || []);
        setPlan(data.plan || []);
      } catch {
        const c = id === 'c-primer' ? MOCK_CLIENTE : { ...MOCK_CLIENTE, id, empresa: 'Cliente', contacto_nombre: '', contacto_cargo: '', industria: '', status: 'activo' as const };
        setCliente(c);
        setNotas(c.notas || '');
      } finally { setLoading(false); }
    }
    load();
  }, [id]);

  function toggleCheck(itemId: string) {
    const next = !checks[itemId];
    setChecks(prev => ({ ...prev, [itemId]: next }));
    const phase = PHASES.find(p => p.items.some(i => i.id === itemId));
    api.post(`/mentoria/clientes/${id}/checks`, { check_id: itemId, phase: phase?.num ?? 0, checked: next }).catch(() => {});
  }

  async function advanceFase() {
    if (!cliente || cliente.fase_actual >= 3) return;
    const next = (cliente.fase_actual + 1) as 0 | 1 | 2 | 3;
    try { await api.patch(`/mentoria/clientes/${id}/fase`, { fase: next }); } catch {}
    setCliente(prev => prev ? { ...prev, fase_actual: next } : prev);
  }

  async function saveNotas() {
    setSavingNotas(true);
    try { await api.patch(`/mentoria/clientes/${id}/notas`, { notas }); } catch {}
    setCliente(prev => prev ? { ...prev, notas } : prev);
    setSavingNotas(false);
  }

  async function saveEdit() {
    const updated = { ...cliente, ...editForm } as Cliente;
    try { await api.patch(`/mentoria/clientes/${id}`, editForm); } catch {}
    setCliente(updated);
    setEditing(false);
  }

  async function addSesion(s: Omit<Sesion, 'id'>) {
    try {
      const nueva = await api.post<Sesion>(`/mentoria/clientes/${id}/sesiones`, s);
      setSesiones(prev => [nueva, ...prev]);
    } catch {
      setSesiones(prev => [{ ...s, id: `s-${Date.now()}` }, ...prev]);
    }
    setShowSesion(false);
  }

  async function addHallazgo(h: Omit<Hallazgo, 'id'>) {
    try {
      const nuevo = await api.post<Hallazgo>(`/mentoria/clientes/${id}/hallazgos`, h);
      setHallazgos(prev => [...prev, nuevo]);
    } catch {
      setHallazgos(prev => [...prev, { ...h, id: `h-${Date.now()}` }]);
    }
    setShowHallazgo(false);
  }

  function deleteHallazgo(hid: string) {
    setHallazgos(prev => prev.filter(h => h.id !== hid));
    api.delete(`/mentoria/clientes/${id}/hallazgos/${hid}`).catch(() => {});
  }

  async function addAccion(a: Omit<AccionPlan, 'id'>) {
    try {
      const nueva = await api.post<AccionPlan>(`/mentoria/clientes/${id}/plan`, a);
      setPlan(prev => [...prev, nueva]);
    } catch {
      setPlan(prev => [...prev, { ...a, id: `a-${Date.now()}` }]);
    }
    setShowAccion(false);
  }

  function updateAccionStatus(aid: string, status: AccionPlan['status']) {
    setPlan(prev => prev.map(a => a.id === aid ? { ...a, status } : a));
    api.patch(`/mentoria/clientes/${id}/plan/${aid}/status`, { status }).catch(() => {});
  }

  function deleteAccion(aid: string) {
    setPlan(prev => prev.filter(a => a.id !== aid));
    api.delete(`/mentoria/clientes/${id}/plan/${aid}`).catch(() => {});
  }

  async function addPago(p: Omit<Pago, 'id'>) {
    try {
      const nuevo = await api.post<Pago>(`/mentoria/clientes/${id}/pagos`, p);
      setPagos(prev => [nuevo, ...prev]);
    } catch {
      setPagos(prev => [{ ...p, id: `p-${Date.now()}` }, ...prev]);
    }
    setShowPago(false);
  }

  async function procesarConIA() {
    setProcesando(true);
    try {
      const result = await api.post<any>(`/mentoria/clientes/${id}/procesar`, {});
      setHallazgos(prev => [...prev, ...result.hallazgos]);
      setPlan(prev => [...prev, ...result.plan]);
      setResumenIA(result.resumen || '');
      setRoiIA(result.roi || '');
      setTab('hallazgos');
    } catch (e: any) {
      alert(e.message || 'Error al procesar. Verifica que hay diagnósticos guardados.');
    } finally {
      setProcesando(false);
    }
  }

  function toggleStatus() {
    if (!cliente) return;
    const next = cliente.status === 'activo' ? 'inactivo' : 'activo';
    api.patch(`/mentoria/clientes/${id}/status`, { status: next }).catch(() => {});
    setCliente(prev => prev ? { ...prev, status: next } : prev);
  }

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid #6c4de6', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
  if (!cliente) return null;

  const fase = PHASES[cliente.fase_actual];
  const faseItemsDone = PHASES[cliente.fase_actual].items.filter(i => checks[i.id]).length;
  const faseTotal = PHASES[cliente.fase_actual].items.length;
  const fasePct = Math.round(faseItemsDone / faseTotal * 100);
  const totalDone = PHASES.flatMap(p => p.items).filter(i => checks[i.id]).length;
  const totalItems = PHASES.flatMap(p => p.items).length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ padding: '18px 28px 0', flexShrink: 0 }}>

        {/* Breadcrumb */}
        <button onClick={() => router.push('/mentoria')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 12, marginBottom: 14, padding: 0 }}>
          <ChevronLeft size={13} /> Consultoría MentorIA
        </button>

        {/* Client header card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 13, padding: '18px 22px', marginBottom: 18, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: fase.color }} />

          {editing ? (
            <EditForm cliente={cliente} onSave={saveEdit} onCancel={() => setEditing(false)} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
              {/* Identity */}
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.025em' }}>{cliente.empresa}</h1>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: cliente.status === 'activo' ? 'rgba(34,197,94,0.12)' : 'rgba(100,100,100,0.1)', color: cliente.status === 'activo' ? '#22c55e' : 'var(--text-3)', border: `1px solid ${cliente.status === 'activo' ? 'rgba(34,197,94,0.3)' : 'var(--line)'}` }}>
                    {cliente.status === 'activo' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 2 }}>{cliente.contacto_nombre}{cliente.contacto_cargo ? ` · ${cliente.contacto_cargo}` : ''}</div>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-3)', flexWrap: 'wrap' }}>
                  {cliente.email && <span>📧 {cliente.email}</span>}
                  {cliente.whatsapp && <span>💬 {cliente.whatsapp}</span>}
                  <span>🏭 {cliente.industria || '—'}</span>
                  <span>👥 {cliente.tamano === '<10' ? '<10 emp.' : cliente.tamano === '10-100' ? '10-100 emp.' : '>100 emp.'}</span>
                </div>
              </div>

              {/* Phase + financials */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 16px', minWidth: 140 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Fase actual</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: fase.color, marginBottom: 6 }}>Fase {fase.num} · {fase.label}</div>
                  <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: fasePct + '%', background: fase.color, borderRadius: 99, transition: 'width 0.4s' }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 5 }}>{faseItemsDone}/{faseTotal} entregables · {fasePct}%</div>
                </div>
                <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 16px', minWidth: 120 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Contrato</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b', letterSpacing: '-0.02em' }}>{fmt$(cliente.precio)}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>Desde {fmtDate(cliente.fecha_inicio)}</div>
                </div>
                <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Progreso total</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#6c4de6', letterSpacing: '-0.02em' }}>{Math.round(totalDone / totalItems * 100)}%</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>{totalDone}/{totalItems} entregables</div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flexShrink: 0 }}>
                {cliente.drive_url && (
                  <a href={cliente.drive_url} target="_blank" rel="noreferrer" style={{ ...btnGhost, textDecoration: 'none', fontSize: 12 }}>
                    📁 Drive del cliente
                  </a>
                )}
                <button onClick={() => { setEditForm({}); setEditing(true); }} style={btnGhost}><Edit2 size={12} /> Editar</button>
                {cliente.fase_actual < 3 && fasePct === 100 && (
                  <button onClick={advanceFase} style={btnPrimary}>Avanzar a Fase {cliente.fase_actual + 1} →</button>
                )}
                <button onClick={toggleStatus} style={{ ...btnGhost, color: cliente.status === 'activo' ? '#ef4444' : '#22c55e', borderColor: cliente.status === 'activo' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)', fontSize: 12 }}>
                  {cliente.status === 'activo' ? 'Desactivar cliente' : 'Reactivar cliente'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Phase stepper */}
        <PhaseTracker current={cliente.fase_actual} />

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--line)', marginTop: 16 }}>
          {([
            { key: 'proyecto',     label: '📋 Proyecto' },
            { key: 'diagnosticos', label: '🔬 Diagnósticos' },
            { key: 'hallazgos',    label: `🚦 Hallazgos${hallazgos.length ? ` (${hallazgos.length})` : ''}` },
            { key: 'plan',         label: `⚡ Plan de Acción${plan.length ? ` (${plan.filter(a=>a.status==='completado').length}/${plan.length})` : ''}` },
            { key: 'sesiones',     label: `💬 Sesiones (${sesiones.length})` },
            { key: 'facturacion',  label: '💰 Facturación' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '9px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: tab === t.key ? 'var(--text)' : 'var(--text-3)', borderBottom: tab === t.key ? '2px solid #6c4de6' : '2px solid transparent', marginBottom: -1, transition: 'color 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>

        {tab === 'proyecto' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {PHASES.map(phase => {
              const done = phase.items.filter(i => checks[i.id]).length;
              const pct = Math.round(done / phase.items.length * 100);
              const isCurrent = phase.num === cliente.fase_actual;
              const isPast = phase.num < cliente.fase_actual;
              return (
                <div key={phase.num} style={{ background: 'var(--surface)', border: `1px solid ${isCurrent ? phase.color + '50' : 'var(--line)'}`, borderRadius: 12, overflow: 'hidden', opacity: phase.num > cliente.fase_actual ? 0.55 : 1 }}>
                  <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid var(--line)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: isPast ? 'rgba(34,197,94,0.12)' : `${phase.color}18`, border: `1px solid ${isPast ? 'rgba(34,197,94,0.3)' : phase.color + '40'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: isPast ? '#22c55e' : phase.color, flexShrink: 0 }}>
                      {isPast ? '✓' : phase.num}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Fase {phase.num} · {phase.label}</span>
                        {isCurrent && <span style={{ fontSize: 10, fontWeight: 700, background: `${phase.color}18`, color: phase.color, border: `1px solid ${phase.color}40`, padding: '2px 8px', borderRadius: 99 }}>Actual</span>}
                        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{phase.duracion}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                        <div style={{ flex: 1, height: 4, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: pct + '%', background: isPast ? '#22c55e' : phase.color, borderRadius: 99, transition: 'width 0.4s' }} />
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>{done}/{phase.items.length}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '4px 0' }}>
                    {phase.items.map(item => (
                      <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', cursor: 'pointer', transition: 'background 0.12s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLLabelElement).style.background = 'var(--surface-2)'}
                        onMouseLeave={e => (e.currentTarget as HTMLLabelElement).style.background = 'transparent'}
                      >
                        <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${checks[item.id] ? (isPast ? '#22c55e' : phase.color) : 'var(--line)'}`, background: checks[item.id] ? (isPast ? '#22c55e' : phase.color) : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                          {checks[item.id] && <Check size={10} color="white" strokeWidth={3} />}
                        </div>
                        <input type="checkbox" checked={!!checks[item.id]} onChange={() => toggleCheck(item.id)} style={{ display: 'none' }} />
                        <span style={{ fontSize: 13, color: checks[item.id] ? 'var(--text-3)' : 'var(--text)', textDecoration: checks[item.id] ? 'line-through' : 'none', lineHeight: 1.4 }}>
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Notas generales */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '18px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Notas del proyecto</div>
              <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="Notas generales del cliente, contexto importante, restricciones, preferencias del equipo…" style={{ width: '100%', minHeight: 100, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 13, lineHeight: 1.6, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
              <button onClick={saveNotas} disabled={savingNotas} style={{ ...btnPrimary, marginTop: 10, fontSize: 12 }}>
                <Save size={12} /> {savingNotas ? 'Guardando…' : 'Guardar notas'}
              </button>
            </div>
          </div>
        )}

        {tab === 'diagnosticos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <PipelineDiagnostico clienteId={id} empresa={cliente.empresa} ejecutivo={cliente.ejecutivo_asignado} driveUrl={cliente.drive_url} whatsapp={cliente.whatsapp} />
            <div style={{ background: 'rgba(108,77,230,0.05)', border: '1px solid rgba(108,77,230,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--text-2)', marginBottom: 4 }}>
              Los formularios guardan los datos en el navegador donde se abren. Usa el mismo equipo para mantener consistencia entre sesiones.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {DIAG_FORMS.map(form => {
                const isDone = cliente.areas_diagnosticadas.includes(form.key);
                return (
                  <div key={form.key} style={{ background: 'var(--surface)', border: `1px solid ${isDone ? 'rgba(34,197,94,0.3)' : 'var(--line)'}`, borderRadius: 11, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{form.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{form.label}</div>
                      <div style={{ fontSize: 11, color: isDone ? '#22c55e' : 'var(--text-3)' }}>{isDone ? '✅ Completado' : '⬜ Pendiente'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {!isDone && (
                        <button onClick={() => { setCliente(prev => prev ? { ...prev, areas_diagnosticadas: [...prev.areas_diagnosticadas, form.key] } : prev); api.patch(`/mentoria/clientes/${id}/areas`, { area: form.key }).catch(() => {}); }} style={{ ...btnGhost, fontSize: 10, padding: '5px 9px' }}>✓ Marcar</button>
                      )}
                      <a href={`${form.path}?clienteId=${id}`} target="_blank" rel="noreferrer" style={{ ...btnPrimary, fontSize: 11, padding: '6px 12px', textDecoration: 'none' }}>
                        <ExternalLink size={11} /> Abrir
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Procesamiento automático con IA */}
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(108,77,230,0.3)', borderRadius: 11, padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                    🤖 Procesar diagnósticos con IA
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
                    Analiza todos los formularios guardados y genera automáticamente los hallazgos con semáforo y el plan de acción priorizado.
                  </div>
                  {resumenIA && (
                    <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(108,77,230,0.06)', border: '1px solid rgba(108,77,230,0.2)', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#8b6ef5', marginBottom: 4 }}>RESUMEN EJECUTIVO</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{resumenIA}</div>
                      {roiIA && <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: '#22c55e' }}>💰 ROI estimado: {roiIA}</div>}
                    </div>
                  )}
                </div>
                <button
                  onClick={procesarConIA}
                  disabled={procesando}
                  style={{ ...btnPrimary, padding: '12px 22px', fontSize: 13, flexShrink: 0, opacity: procesando ? 0.7 : 1 }}
                >
                  {procesando ? '⏳ Analizando…' : '✨ Generar hallazgos y plan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'hallazgos' && (
          <TabHallazgos
            hallazgos={hallazgos}
            onAdd={() => setShowHallazgo(true)}
            onDelete={deleteHallazgo}
            onAddToPlan={(h) => { setShowAccion(true); }}
          />
        )}

        {tab === 'plan' && (
          <TabPlan
            plan={plan}
            filter={planFilter}
            onFilterChange={setPlanFilter}
            onAdd={() => setShowAccion(true)}
            onStatusChange={updateAccionStatus}
            onDelete={deleteAccion}
          />
        )}

        {tab === 'sesiones' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
              <button onClick={() => setShowSesion(true)} style={btnPrimary}><Plus size={13} /> Nueva sesión</button>
            </div>
            {!sesiones.length ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)', fontSize: 13 }}>Sin sesiones registradas — agrega la primera reunión</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sesiones.map(s => (
                  <div key={s.id} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 11, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                      <div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{s.titulo}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: 'rgba(108,77,230,0.1)', color: '#8b6ef5' }}>{TIPO_SESION_LABEL[s.tipo]}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmtDate(s.fecha)}</div>
                      </div>
                    </div>
                    {s.notas && <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: s.acciones ? 8 : 0 }}>{s.notas}</div>}
                    {s.acciones && (
                      <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 7, padding: '8px 12px', fontSize: 12, color: 'var(--text-2)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Próximos pasos: </span>
                        {s.acciones}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'facturacion' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Resumen contrato */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '20px 22px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Contrato</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                {[
                  { l: 'Empresa', v: cliente.empresa },
                  { l: 'Monto total', v: fmt$(cliente.precio) + ' + IVA' },
                  { l: 'Inicio', v: fmtDate(cliente.fecha_inicio) },
                  { l: 'Fin / Renovación', v: cliente.fecha_fin ? fmtDate(cliente.fecha_fin) : 'Indefinido' },
                  { l: 'Ejecutivo', v: cliente.ejecutivo_asignado || '—' },
                  { l: 'Tamaño empresa', v: cliente.tamano === '<10' ? '<10 empleados' : cliente.tamano === '10-100' ? '10-100 empleados' : '>100 empleados' },
                ].map(r => (
                  <div key={r.l}>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 3 }}>{r.l}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{r.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagos */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pagos</div>
                  {pagos.length > 0 && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                    {fmt$(pagos.filter(p => p.status === 'pagado').reduce((a, p) => a + p.monto, 0))} cobrados de {fmt$(cliente.precio)}
                  </div>}
                </div>
                <button onClick={() => setShowPago(true)} style={btnPrimary}><Plus size={12} /> Registrar pago</button>
              </div>
              {!pagos.length ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-3)', fontSize: 13 }}>Sin pagos registrados</div>
              ) : (
                <table style={{ width: '100%' }}>
                  <thead><tr>
                    {['Fecha', 'Concepto', 'Monto', 'Status'].map(h => <th key={h} style={{ textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 20px' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {pagos.map(p => (
                      <tr key={p.id} style={{ borderTop: '1px solid var(--line)' }}>
                        <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text-2)' }}>{fmtDate(p.fecha)}</td>
                        <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text)' }}>{p.concepto}</td>
                        <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{fmt$(p.monto)}</td>
                        <td style={{ padding: '12px 20px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: p.status === 'pagado' ? 'rgba(34,197,94,0.1)' : p.status === 'parcial' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', color: p.status === 'pagado' ? '#22c55e' : p.status === 'parcial' ? '#f59e0b' : '#ef4444' }}>
                            {p.status === 'pagado' ? 'Pagado' : p.status === 'parcial' ? 'Parcial' : 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Modals */}
      {showSesion    && <NuevaSesionModal onClose={() => setShowSesion(false)} onSave={addSesion} />}
      {showPago      && <NuevoPagoModal onClose={() => setShowPago(false)} onSave={addPago} precio={cliente.precio} />}
      {showHallazgo  && <NuevoHallazgoModal onClose={() => setShowHallazgo(false)} onSave={addHallazgo} />}
      {showAccion    && <NuevaAccionModal onClose={() => setShowAccion(false)} onSave={addAccion} hallazgos={hallazgos} />}
    </div>
  );
}

// ── Phase Tracker ──────────────────────────────────────────────────────────────
function PhaseTracker({ current }: { current: number }) {
  const colors = ['#6c4de6', '#f59e0b', '#3b82f6', '#22c55e'];
  const labels = ['Mapeo', 'Quick Wins', 'Expansión', 'Optimización'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 8 }}>
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

// ── Edit Form ──────────────────────────────────────────────────────────────────
function EditForm({ cliente, onSave, onCancel }: { cliente: Cliente; onSave: () => void; onCancel: () => void }) {
  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>Edición inline — guarda los cambios directamente</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onSave} style={btnPrimary}><Check size={12} /> Guardar</button>
        <button onClick={onCancel} style={btnGhost}><X size={12} /> Cancelar</button>
      </div>
    </div>
  );
}

// ── Session Modal ──────────────────────────────────────────────────────────────
function NuevaSesionModal({ onClose, onSave }: { onClose: () => void; onSave: (s: Omit<Sesion, 'id'>) => void }) {
  const [f, setF] = useState<Omit<Sesion, 'id'>>({ fecha: new Date().toISOString().split('T')[0], tipo: 'revision', titulo: '', notas: '', acciones: '' });
  const u = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }));
  return (
    <Modal title="Nueva sesión" onClose={onClose} onSave={() => { if (f.titulo) onSave(f); }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={labelSt}>Fecha</label><input type="date" value={f.fecha} onChange={e => u('fecha', e.target.value)} style={inputSt} /></div>
        <div><label style={labelSt}>Tipo</label>
          <select value={f.tipo} onChange={e => u('tipo', e.target.value)} style={inputSt as any}>
            {Object.entries(TIPO_SESION_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginTop: 12 }}><label style={labelSt}>Título *</label><input value={f.titulo} onChange={e => u('titulo', e.target.value)} placeholder="Ej. Revisión de Quick Wins — Sem 2" style={{ ...inputSt, width: '100%' }} /></div>
      <div style={{ marginTop: 12 }}><label style={labelSt}>Notas de la sesión</label><textarea value={f.notas} onChange={e => u('notas', e.target.value)} placeholder="Qué se discutió, acuerdos, problemas encontrados…" style={{ ...inputSt, width: '100%', minHeight: 80, resize: 'vertical' } as any} /></div>
      <div style={{ marginTop: 12 }}><label style={labelSt}>Próximos pasos / acciones</label><textarea value={f.acciones} onChange={e => u('acciones', e.target.value)} placeholder="Qué sigue, quién es responsable, para cuándo…" style={{ ...inputSt, width: '100%', minHeight: 60, resize: 'vertical' } as any} /></div>
    </Modal>
  );
}

// ── Payment Modal ──────────────────────────────────────────────────────────────
function NuevoPagoModal({ onClose, onSave, precio }: { onClose: () => void; onSave: (p: Omit<Pago, 'id'>) => void; precio: number }) {
  const [f, setF] = useState<Omit<Pago, 'id'>>({ fecha: new Date().toISOString().split('T')[0], monto: precio, concepto: 'Pago consultoría MentorIA', status: 'pagado' });
  const u = (k: keyof typeof f, v: any) => setF(p => ({ ...p, [k]: v }));
  return (
    <Modal title="Registrar pago" onClose={onClose} onSave={() => onSave(f)}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={labelSt}>Fecha</label><input type="date" value={f.fecha} onChange={e => u('fecha', e.target.value)} style={inputSt} /></div>
        <div><label style={labelSt}>Monto MXN</label><input type="number" value={f.monto} onChange={e => u('monto', parseInt(e.target.value))} style={inputSt} /></div>
      </div>
      <div style={{ marginTop: 12 }}><label style={labelSt}>Concepto</label><input value={f.concepto} onChange={e => u('concepto', e.target.value)} style={{ ...inputSt, width: '100%' }} /></div>
      <div style={{ marginTop: 12 }}><label style={labelSt}>Status</label>
        <select value={f.status} onChange={e => u('status', e.target.value)} style={{ ...inputSt, width: '100%' } as any}>
          <option value="pagado">Pagado</option>
          <option value="pendiente">Pendiente</option>
          <option value="parcial">Parcial</option>
        </select>
      </div>
    </Modal>
  );
}

function Modal({ title, onClose, onSave, children }: { title: string; onClose: () => void; onSave: () => void; children: React.ReactNode }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 60 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 520, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, zIndex: 70, padding: '24px', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={15} /></button>
        </div>
        {children}
        <button onClick={onSave} style={{ ...btnPrimary, width: '100%', marginTop: 18, justifyContent: 'center', fontSize: 14 }}>Guardar</button>
      </div>
    </>
  );
}

// ── Pipeline de diagnóstico ────────────────────────────────────────────────────
const PIPELINE_STAGES = [
  { id: 'checklist_enviado',  label: 'Checklist enviado al cliente',          fase: 'Preparación',  tool: 'checklist-cliente.html' },
  { id: 'docs_recibidos',     label: 'Documentos recibidos en Drive',          fase: 'Preparación',  tool: '' },
  { id: 'proc_docs',          label: '/procesar-documentos ejecutado',         fase: 'Preparación',  tool: '' },
  { id: 'entrevista1',        label: 'Entrevista 1 realizada',                 fase: 'Entrevista 1', tool: 'guia-entrevista-1.html' },
  { id: 'transcript',         label: '/procesar-entrevista ejecutado',         fase: 'Entrevista 1', tool: '' },
  { id: 'gaps_enviados',      label: 'Formulario de gaps enviado al cliente',  fase: 'Gaps',         tool: 'gaps-form.html' },
  { id: 'gaps_procesados',    label: 'Respuestas de gaps procesadas',          fase: 'Gaps',         tool: '' },
  { id: 'entrevista2',        label: 'Entrevista 2 (validación) realizada',    fase: 'Entrevista 2', tool: 'guia-entrevista-2.html' },
  { id: 'asis_validado',      label: 'AS-IS validado por el cliente',          fase: 'Entrevista 2', tool: '' },
  { id: 'tobe_aprobado',      label: 'TO-BE aprobado por el cliente',          fase: 'Entrevista 2', tool: '' },
  { id: 'analizar_ok',        label: '/analizar ejecutado',                    fase: 'Procesamiento', tool: '' },
  { id: 'priorizar_ok',       label: '/priorizar ejecutado',                   fase: 'Procesamiento', tool: '' },
  { id: 'bpmn_ok',            label: '/generar-bpmn ejecutado',                fase: 'Procesamiento', tool: '' },
  { id: 'tobe_ok',            label: '/generar-tobe ejecutado',                fase: 'Procesamiento', tool: '' },
  { id: 'informe_ok',         label: '/redactar-informe ejecutado',            fase: 'Procesamiento', tool: '' },
  { id: 'informe_revisado',   label: 'Informe revisado por el ejecutivo',      fase: 'Entrega',      tool: '' },
  { id: 'informe_presentado', label: 'Informe presentado al cliente',          fase: 'Entrega',      tool: '' },
];

const FASE_COLORS: Record<string, string> = {
  'Preparación':   '#6c4de6',
  'Entrevista 1':  '#00d4ff',
  'Gaps':          '#f59e0b',
  'Entrevista 2':  '#3b82f6',
  'Procesamiento': '#8b5cf6',
  'Entrega':       '#22c55e',
};

function PipelineDiagnostico({ clienteId, empresa, ejecutivo, driveUrl, whatsapp }: { clienteId: string; empresa: string; ejecutivo: string; driveUrl?: string; whatsapp: string | null }) {
  const pipelineKey = `mentoria_pipeline_${clienteId}`;
  const [checks, setChecks] = React.useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(pipelineKey) || '{}'); } catch { return {}; }
  });

  function toggle(id: string) {
    const next = { ...checks, [id]: !checks[id] };
    setChecks(next);
    localStorage.setItem(pipelineKey, JSON.stringify(next));
  }

  const done = Object.values(checks).filter(Boolean).length;
  const pct = Math.round(done / PIPELINE_STAGES.length * 100);

  const byFase: Record<string, typeof PIPELINE_STAGES> = {};
  PIPELINE_STAGES.forEach(s => { if (!byFase[s.fase]) byFase[s.fase] = []; byFase[s.fase].push(s); });

  const basePath = '/flowdesk/diagnosticos/';
  const encEmpresa = encodeURIComponent(empresa);
  const encEjecutivo = encodeURIComponent(ejecutivo);
  const encWa = encodeURIComponent(whatsapp || '');

  function toolUrl(tool: string) {
    if (!tool) return '';
    const params = new URLSearchParams({ empresa: encEmpresa, ejecutivo: encEjecutivo });
    if (whatsapp) params.set('whatsapp', whatsapp);
    if (driveUrl && tool === 'checklist-cliente.html') params.set('drive', driveUrl);
    return `${basePath}${tool}?${params.toString()}`;
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 13, overflow: 'hidden', marginBottom: 4 }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 5 }}>Pipeline de diagnóstico</div>
          <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg,#6c4de6,#22c55e)', borderRadius: 99, transition: 'width 0.4s' }} />
          </div>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0 }}>{done}/{PIPELINE_STAGES.length} · {pct}%</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {Object.entries(byFase).map(([fase, stages]) => (
          <div key={fase} style={{ padding: '12px 16px', borderRight: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: FASE_COLORS[fase], marginBottom: 8 }}>{fase}</div>
            {stages.map(s => (
              <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
                <div onClick={() => toggle(s.id)} style={{ width: 15, height: 15, borderRadius: 4, border: `2px solid ${checks[s.id] ? FASE_COLORS[fase] : 'var(--line)'}`, background: checks[s.id] ? FASE_COLORS[fase] : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                  {checks[s.id] && <Check size={8} color="white" strokeWidth={3} />}
                </div>
                <span style={{ fontSize: 11, color: checks[s.id] ? 'var(--text-3)' : 'var(--text-2)', textDecoration: checks[s.id] ? 'line-through' : 'none', flex: 1, lineHeight: 1.4 }}>{s.label}</span>
                {s.tool && (
                  <a href={toolUrl(s.tool)} target="_blank" rel="noreferrer" style={{ color: FASE_COLORS[fase], opacity: 0.7 }} title={`Abrir ${s.tool}`}>
                    <ExternalLink size={10} />
                  </a>
                )}
              </label>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#6c4de6', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const btnGhost: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', color: 'var(--text-2)', fontSize: 13, cursor: 'pointer' };
const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 4 };
const inputSt: React.CSSProperties = { width: '100%', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 7, padding: '8px 10px', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none' };

// ── Config de tipos de hallazgo ────────────────────────────────────────────────
const HALLAZGO_CONFIG = {
  critico:       { label: '🔴 Crítico',        color: '#ef4444', bg: 'rgba(239,68,68,0.08)',    border: 'rgba(239,68,68,0.25)'   },
  importante:    { label: '🟡 Importante',      color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.25)'  },
  positivo:      { label: '🟢 Positivo',        color: '#22c55e', bg: 'rgba(34,197,94,0.08)',    border: 'rgba(34,197,94,0.25)'   },
  oportunidad_ia:{ label: '🤖 Oportunidad IA',  color: '#8b6ef5', bg: 'rgba(139,110,245,0.08)', border: 'rgba(139,110,245,0.25)' },
} as const;

const PRIORIDAD_CONFIG = {
  alta:  { label: 'Alta',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  media: { label: 'Media', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  baja:  { label: 'Baja',  color: '#6b7280', bg: 'rgba(107,114,128,0.1)'},
} as const;

const STATUS_CONFIG = {
  pendiente:   { label: 'Pendiente',    color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  en_progreso: { label: 'En progreso',  color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
  completado:  { label: 'Completado',   color: '#22c55e', bg: 'rgba(34,197,94,0.1)'   },
  cancelado:   { label: 'Cancelado',    color: '#374151', bg: 'rgba(55,65,81,0.1)'    },
} as const;

// ── Tab Hallazgos ──────────────────────────────────────────────────────────────
function TabHallazgos({ hallazgos, onAdd, onDelete, onAddToPlan }: {
  hallazgos: Hallazgo[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onAddToPlan: (h: Hallazgo) => void;
}) {
  const order: Hallazgo['tipo'][] = ['critico', 'importante', 'oportunidad_ia', 'positivo'];
  const byTipo = order.reduce((acc, t) => {
    acc[t] = hallazgos.filter(h => h.tipo === t);
    return acc;
  }, {} as Record<Hallazgo['tipo'], Hallazgo[]>);

  const counts = { critico: byTipo.critico.length, importante: byTipo.importante.length, oportunidad_ia: byTipo.oportunidad_ia.length, positivo: byTipo.positivo.length };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Resumen */}
      {hallazgos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
          {order.map(t => {
            const cfg = HALLAZGO_CONFIG[t];
            return (
              <div key={t} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{cfg.label.split(' ')[0]}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: cfg.color }}>{counts[t]}</div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{cfg.label.split(' ').slice(1).join(' ')}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
          {hallazgos.length === 0 ? 'Agrega hallazgos del diagnóstico o pégalos desde /analizar' : `${hallazgos.length} hallazgo${hallazgos.length !== 1 ? 's' : ''} registrado${hallazgos.length !== 1 ? 's' : ''}`}
        </div>
        <button onClick={onAdd} style={btnPrimary}><Plus size={13} /> Agregar hallazgo</button>
      </div>

      {/* Estado vacío */}
      {hallazgos.length === 0 && (
        <div style={{ background: 'var(--surface)', border: '1px dashed var(--line)', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🚦</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Sin hallazgos registrados</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 360, margin: '0 auto', marginBottom: 16 }}>
            Ejecuta <code style={{ background: 'rgba(108,77,230,0.1)', color: '#8b6ef5', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>/analizar</code> en el tab de Diagnósticos y luego registra los hallazgos aquí para darles seguimiento.
          </div>
          <button onClick={onAdd} style={btnPrimary}>+ Agregar primer hallazgo</button>
        </div>
      )}

      {/* Hallazgos por tipo */}
      {order.map(tipo => {
        const items = byTipo[tipo];
        if (!items.length) return null;
        const cfg = HALLAZGO_CONFIG[tipo];
        return (
          <div key={tipo}>
            <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              {cfg.label} · {items.length}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map(h => (
                <div key={h.id} style={{ background: 'var(--surface)', border: `1px solid ${cfg.border}`, borderRadius: 11, padding: '14px 18px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: cfg.color }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{h.titulo}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{h.area}</span>
                      </div>
                      {h.descripcion && <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, margin: 0, marginBottom: h.impacto ? 6 : 0 }}>{h.descripcion}</p>}
                      {h.impacto && (
                        <div style={{ fontSize: 11, color: 'var(--text-3)', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 6, padding: '5px 10px', marginTop: 6 }}>
                          <span style={{ fontWeight: 600 }}>Impacto: </span>{h.impacto}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => onAddToPlan(h)} style={{ ...btnGhost, fontSize: 11, padding: '5px 10px' }} title="Crear acción">⚡ Plan</button>
                      <button onClick={() => onDelete(h.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '4px', borderRadius: 5 }} title="Eliminar">
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Tab Plan de Acción ─────────────────────────────────────────────────────────
function TabPlan({ plan, filter, onFilterChange, onAdd, onStatusChange, onDelete }: {
  plan: AccionPlan[];
  filter: AccionPlan['status'] | 'todos';
  onFilterChange: (f: AccionPlan['status'] | 'todos') => void;
  onAdd: () => void;
  onStatusChange: (id: string, s: AccionPlan['status']) => void;
  onDelete: (id: string) => void;
}) {
  const completados = plan.filter(a => a.status === 'completado').length;
  const pct = plan.length ? Math.round(completados / plan.length * 100) : 0;
  const filtered = filter === 'todos' ? plan : plan.filter(a => a.status === filter);

  const filters: { key: AccionPlan['status'] | 'todos'; label: string }[] = [
    { key: 'todos',       label: `Todos (${plan.length})` },
    { key: 'pendiente',   label: `Pendiente (${plan.filter(a=>a.status==='pendiente').length})` },
    { key: 'en_progreso', label: `En progreso (${plan.filter(a=>a.status==='en_progreso').length})` },
    { key: 'completado',  label: `Completado (${completados})` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Progreso global */}
      {plan.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Progreso del plan</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>{completados}/{plan.length} completadas</span>
            </div>
            <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg,#6c4de6,#22c55e)', borderRadius: 99, transition: 'width 0.4s' }} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: pct === 100 ? '#22c55e' : '#6c4de6', minWidth: 52, textAlign: 'right' }}>{pct}%</div>
        </div>
      )}

      {/* Header con filtros */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {filters.map(f => (
            <button key={f.key} onClick={() => onFilterChange(f.key)} style={{ padding: '5px 12px', borderRadius: 99, border: `1px solid ${filter === f.key ? '#6c4de6' : 'var(--line)'}`, background: filter === f.key ? 'rgba(108,77,230,0.12)' : 'transparent', color: filter === f.key ? '#8b6ef5' : 'var(--text-3)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={onAdd} style={btnPrimary}><Plus size={13} /> Nueva acción</button>
      </div>

      {/* Estado vacío */}
      {plan.length === 0 && (
        <div style={{ background: 'var(--surface)', border: '1px dashed var(--line)', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Plan de acción vacío</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 360, margin: '0 auto', marginBottom: 16 }}>
            Crea acciones desde los hallazgos del diagnóstico o agrega iniciativas directamente aquí.
          </div>
          <button onClick={onAdd} style={btnPrimary}>+ Crear primera acción</button>
        </div>
      )}

      {/* Lista de acciones */}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(a => {
            const prCfg = PRIORIDAD_CONFIG[a.prioridad];
            const stCfg = STATUS_CONFIG[a.status];
            return (
              <div key={a.id} style={{ background: 'var(--surface)', border: `1px solid ${a.status === 'completado' ? 'rgba(34,197,94,0.2)' : 'var(--line)'}`, borderRadius: 11, padding: '14px 18px', opacity: a.status === 'cancelado' ? 0.5 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {/* Checkbox visual */}
                  <div
                    onClick={() => onStatusChange(a.id, a.status === 'completado' ? 'en_progreso' : 'completado')}
                    style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${a.status === 'completado' ? '#22c55e' : 'var(--line)'}`, background: a.status === 'completado' ? '#22c55e' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: 1, transition: 'all 0.15s' }}
                  >
                    {a.status === 'completado' && <Check size={11} color="white" strokeWidth={3} />}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: a.status === 'completado' ? 'var(--text-3)' : 'var(--text)', textDecoration: a.status === 'completado' ? 'line-through' : 'none' }}>{a.titulo}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: prCfg.bg, color: prCfg.color }}>{prCfg.label}</span>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'rgba(108,77,230,0.08)', color: '#8b6ef5' }}>{a.area}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 11, color: 'var(--text-3)' }}>
                      {a.responsable && <span>👤 {a.responsable}</span>}
                      {a.fecha_estimada && <span>📅 {new Date(a.fecha_estimada).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</span>}
                      {a.hallazgo_ref && <span>🔗 {a.hallazgo_ref}</span>}
                    </div>
                    {a.notas && <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '6px 0 0', lineHeight: 1.5 }}>{a.notas}</p>}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: stCfg.bg, color: stCfg.color }}>{stCfg.label}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {a.status !== 'en_progreso' && a.status !== 'completado' && (
                        <button onClick={() => onStatusChange(a.id, 'en_progreso')} style={{ ...btnGhost, fontSize: 10, padding: '3px 8px' }}>▶ Iniciar</button>
                      )}
                      <button onClick={() => onDelete(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '3px' }}><X size={12} /></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Modal: Nuevo Hallazgo ──────────────────────────────────────────────────────
function NuevoHallazgoModal({ onClose, onSave }: { onClose: () => void; onSave: (h: Omit<Hallazgo, 'id'>) => void }) {
  const [f, setF] = useState<Omit<Hallazgo, 'id'>>({ area: '', tipo: 'critico', titulo: '', descripcion: '', impacto: '' });
  const u = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }));
  return (
    <Modal title="Nuevo hallazgo" onClose={onClose} onSave={() => { if (f.titulo && f.area) onSave(f); }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelSt}>Tipo *</label>
          <select value={f.tipo} onChange={e => u('tipo', e.target.value)} style={{ ...inputSt, width: '100%' } as any}>
            {Object.entries(HALLAZGO_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelSt}>Área *</label>
          <select value={f.area} onChange={e => u('area', e.target.value)} style={{ ...inputSt, width: '100%' } as any}>
            <option value="">Seleccionar…</option>
            {['Marketing', 'Ventas', 'Operaciones', 'Administración', 'Tecnología', 'RRHH', 'General'].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelSt}>Título *</label>
        <input value={f.titulo} onChange={e => u('titulo', e.target.value)} placeholder="Ej. Proceso de cotización 100% manual" style={{ ...inputSt, width: '100%' }} />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelSt}>Descripción</label>
        <textarea value={f.descripcion} onChange={e => u('descripcion', e.target.value)} placeholder="Qué se detectó, evidencia, contexto…" style={{ ...inputSt, width: '100%', minHeight: 72, resize: 'vertical' } as any} />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelSt}>Impacto estimado</label>
        <input value={f.impacto} onChange={e => u('impacto', e.target.value)} placeholder="Ej. 12 horas/semana perdidas, 40% de leads sin seguimiento…" style={{ ...inputSt, width: '100%' }} />
      </div>
    </Modal>
  );
}

// ── Modal: Nueva Acción ────────────────────────────────────────────────────────
function NuevaAccionModal({ onClose, onSave, hallazgos }: { onClose: () => void; onSave: (a: Omit<AccionPlan, 'id'>) => void; hallazgos: Hallazgo[] }) {
  const [f, setF] = useState<Omit<AccionPlan, 'id'>>({ titulo: '', area: '', prioridad: 'alta', status: 'pendiente', responsable: '', fecha_estimada: '', hallazgo_ref: '', notas: '' });
  const u = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }));
  return (
    <Modal title="Nueva acción del plan" onClose={onClose} onSave={() => { if (f.titulo && f.area) onSave(f); }}>
      <div style={{ marginBottom: 12 }}>
        <label style={labelSt}>Título *</label>
        <input value={f.titulo} onChange={e => u('titulo', e.target.value)} placeholder="Ej. Automatizar envío de cotizaciones vía n8n" style={{ ...inputSt, width: '100%' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelSt}>Área *</label>
          <select value={f.area} onChange={e => u('area', e.target.value)} style={{ ...inputSt, width: '100%' } as any}>
            <option value="">Seleccionar…</option>
            {['Marketing', 'Ventas', 'Operaciones', 'Administración', 'Tecnología', 'RRHH', 'General'].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label style={labelSt}>Prioridad</label>
          <select value={f.prioridad} onChange={e => u('prioridad', e.target.value)} style={{ ...inputSt, width: '100%' } as any}>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>
        <div>
          <label style={labelSt}>Responsable</label>
          <input value={f.responsable} onChange={e => u('responsable', e.target.value)} placeholder="Ej. Manolo / Cliente" style={{ ...inputSt, width: '100%' }} />
        </div>
        <div>
          <label style={labelSt}>Fecha estimada</label>
          <input type="date" value={f.fecha_estimada} onChange={e => u('fecha_estimada', e.target.value)} style={{ ...inputSt, width: '100%' }} />
        </div>
      </div>
      {hallazgos.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <label style={labelSt}>Hallazgo relacionado</label>
          <select value={f.hallazgo_ref} onChange={e => u('hallazgo_ref', e.target.value)} style={{ ...inputSt, width: '100%' } as any}>
            <option value="">Sin referencia</option>
            {hallazgos.map(h => <option key={h.id} value={h.titulo}>{h.titulo}</option>)}
          </select>
        </div>
      )}
      <div style={{ marginTop: 12 }}>
        <label style={labelSt}>Notas</label>
        <textarea value={f.notas} onChange={e => u('notas', e.target.value)} placeholder="Detalles de implementación, dependencias, contexto…" style={{ ...inputSt, width: '100%', minHeight: 60, resize: 'vertical' } as any} />
      </div>
    </Modal>
  );
}
