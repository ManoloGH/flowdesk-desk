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
] satisfies { num: number; label: string; duracion: string; color: string; items: { id: string; label: string }[] }[];

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
  const [tab, setTab]           = useState<'sesiones_cuestionarios' | 'cubo' | 'entregables'>('sesiones_cuestionarios');
  const [editing, setEditing]   = useState(false);
  const [checks, setChecks]     = useState<Record<string, boolean>>({});
  const [sesiones, setSesiones]         = useState<Sesion[]>([]);
  const [pagos, setPagos]               = useState<Pago[]>([]);
  const [sesionesDiag, setSesionesDiag] = useState<any[]>([]);
  const [showPicker, setShowPicker]     = useState(false);
  const [pickerForm, setPickerForm]     = useState({ tipo: 'director', interlocutor: '', cargo: '', area: '' });
  const [creandoSesion, setCreandoSesion] = useState(false);
  const [generandoCuestionario, setGenerandoCuestionario] = useState<string | null>(null);
  const [cuestionarioVista, setCuestionarioVista] = useState<any | null>(null);
  const [legacyChatLen, setLegacyChatLen] = useState(0);
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
        setSesionesDiag(data.sesiones_diagnostico || []);
        setLegacyChatLen(((data.chat_history ?? []) as any[]).filter((m: any) => m.role === 'user').length);
      } catch {
        if (id === 'c-primer') {
          setCliente(MOCK_CLIENTE);
          setNotas(MOCK_CLIENTE.notas || '');
        }
        // Para clientes reales: no mostrar datos mock — dejar cliente null y que el spinner muestre error
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

  async function saveEdit(datos: Partial<Cliente>) {
    const updated = { ...cliente, ...datos } as Cliente;
    try { await api.patch(`/mentoria/clientes/${id}`, datos); } catch {}
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
      setTab('cubo');
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

  const TIPOS_SESION_DIAG = [
    { key: 'dg',       label: 'Director General', icon: '🏆' },
    { key: 'director', label: 'Director de área', icon: '🏛️' },
    { key: 'gerente',  label: 'Gerente',           icon: '🏢' },
    { key: 'operador', label: 'Operador',           icon: '⚙️' },
    { key: 'otro',     label: 'Otro',               icon: '👤' },
  ];

  async function crearYEntrarSesion() {
    if (!pickerForm.interlocutor.trim()) return;
    setCreandoSesion(true);
    const newId = `s-${Date.now()}`;
    const tipoLabel = TIPOS_SESION_DIAG.find(t => t.key === pickerForm.tipo)?.label ?? pickerForm.tipo;
    const titulo = pickerForm.tipo === 'dg'
      ? `Sesión DG — ${pickerForm.interlocutor}`
      : `Sesión ${pickerForm.cargo || tipoLabel} — ${pickerForm.interlocutor}`;
    try {
      await api.post(`/mentoria/clientes/${id}/sesiones-diag`, {
        id: newId, titulo, tipo: pickerForm.tipo,
        interlocutor: pickerForm.interlocutor,
        cargo: pickerForm.cargo, area: pickerForm.area,
        fecha: new Date().toISOString().split('T')[0],
      });
    } catch {}
    setCreandoSesion(false);
    setShowPicker(false);
    router.push(`/mentoria/${id}/sesion?sesionId=${newId}`);
  }

  async function handleGenerarCuestionario(sesionId: string, area: string, rolDestino: 'gerente' | 'operador') {
    setGenerandoCuestionario(sesionId);
    try {
      const result = await api.post<any>(`/mentoria/clientes/${id}/sesiones-diag/${sesionId}/generar-cuestionario`, { rolDestino, area });
      setSesionesDiag(prev => prev.map(s => s.id === sesionId
        ? { ...s, cuestionarios_generados: [...(s.cuestionarios_generados ?? []), result] }
        : s
      ));
      setCuestionarioVista(result);
    } catch (e: any) {
      alert(e?.message ?? 'Error al generar cuestionario');
    } finally {
      setGenerandoCuestionario(null);
    }
  }

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid #6c4de6', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
  if (!cliente) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 14, color: 'var(--text-3)' }}>No se pudo cargar el cliente</div>
      <button onClick={() => window.location.reload()} style={{ fontSize: 12, padding: '6px 14px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, cursor: 'pointer', color: 'var(--text)' }}>Reintentar</button>
    </div>
  );

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
                <button onClick={() => setEditing(true)} style={btnGhost}><Edit2 size={12} /> Editar</button>
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
            { key: 'sesiones_cuestionarios', label: '🎙️ Sesiones y cuestionarios' },
            { key: 'cubo',                   label: '🎯 Cubo de información' },
            { key: 'entregables',            label: '📦 Entregables' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => {
              setTab(t.key);
              if (t.key === 'cubo') {
                api.get<any>(`/mentoria/clientes/${id}`)
                  .then(data => setCliente(data))
                  .catch(() => {});
              }
            }} style={{ padding: '9px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: tab === t.key ? 'var(--text)' : 'var(--text-3)', borderBottom: tab === t.key ? '2px solid #6c4de6' : '2px solid transparent', marginBottom: -1, transition: 'color 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>

        {/* ── SESIONES Y CUESTIONARIOS ── */}
        {tab === 'sesiones_cuestionarios' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Sesiones de diagnóstico</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{sesionesDiag.length} sesión{sesionesDiag.length !== 1 ? 'es' : ''} registrada{sesionesDiag.length !== 1 ? 's' : ''}</div>
              </div>
              <button onClick={() => setShowPicker(true)} style={btnPrimary}><Plus size={12} /> Iniciar sesión</button>
            </div>

            {/* Lista de sesiones */}
            {sesionesDiag.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sesionesDiag.map((s: any) => {
                  const intercambios = (s.mensajes ?? []).filter((m: any) => m.role === 'user').length;
                  const cuestionarios = s.cuestionarios_generados ?? [];
                  const tipoIcon = TIPOS_SESION_DIAG.find(t => t.key === s.tipo)?.icon ?? '🎙️';
                  return (
                    <div key={s.id} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
                      {/* Sesión header */}
                      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 16 }}>{tipoIcon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.titulo}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                            {intercambios} intercambio{intercambios !== 1 ? 's' : ''} · {s.area || s.cargo || '—'} · {s.fecha}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button
                            onClick={() => router.push(`/mentoria/${id}/sesion?sesionId=${s.id}`)}
                            style={{ fontSize: 11, padding: '5px 10px', background: 'rgba(108,77,230,0.1)', color: '#6c4de6', border: '1px solid rgba(108,77,230,0.3)', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                          >
                            🎙️ Continuar
                          </button>
                          {s.area && (
                            <button
                              onClick={() => handleGenerarCuestionario(s.id, s.area, 'gerente')}
                              disabled={generandoCuestionario === s.id}
                              style={{ fontSize: 11, padding: '5px 10px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 6, cursor: 'pointer', fontWeight: 600, opacity: generandoCuestionario === s.id ? 0.6 : 1 }}
                            >
                              {generandoCuestionario === s.id ? '⏳…' : '📋 Generar cuestionario'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Cuestionarios generados */}
                      {cuestionarios.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--line)', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {cuestionarios.map((cq: any) => (
                            <div key={cq.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 7 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6' }}>📋 {cq.titulo}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{(cq.preguntas ?? []).length} preguntas</div>
                              </div>
                              <button onClick={() => setCuestionarioVista(cq)} style={{ fontSize: 10, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', flexShrink: 0 }}>Ver</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sesión previa legacy */}
            {legacyChatLen > 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 16 }}>🕓</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Sesión anterior (sin registrar)</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{legacyChatLen} intercambios · pre-nueva versión</div>
                </div>
                <button onClick={() => router.push(`/mentoria/${id}/sesion`)} style={{ fontSize: 11, padding: '5px 10px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                  🎙️ Continuar
                </button>
              </div>
            )}

            {/* Empty state */}
            {sesionesDiag.length === 0 && legacyChatLen === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 32px', color: 'var(--text-3)', fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🎙️</div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Sin sesiones registradas</div>
                <div style={{ marginBottom: 20, fontSize: 12 }}>Inicia con la sesión del Director General y avanza área por área.</div>
                <button onClick={() => { setPickerForm({ tipo: 'dg', interlocutor: '', cargo: 'Director General', area: '' }); setShowPicker(true); }} style={btnPrimary}>
                  <Plus size={12} /> Iniciar primera sesión
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── CUBO DE INFORMACIÓN ── */}
        {tab === 'cubo' && (
          <TabCubo clienteId={id} empresa={cliente.empresa} sesiones={sesiones} cubo={(cliente as any).cubo ?? {}} />
        )}

        {/* ── ENTREGABLES ── */}
        {tab === 'entregables' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '2px 0' }}>
              Cada entregable se genera desde el cubo de información. Ábrelos y revísalos con el cliente.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {ENTREGABLES.map(e => (
                <a
                  key={e.id}
                  href={`${e.path}?clienteId=${id}&empresa=${encodeURIComponent(cliente.empresa)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 8,
                    background: 'var(--surface)', border: '1px solid var(--line)',
                    borderRadius: 12, padding: '18px 20px', textDecoration: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#6c4de650'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 16px rgba(108,77,230,0.1)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 26 }}>{e.icon}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', background: 'var(--bg)', padding: '2px 7px', borderRadius: 99, border: '1px solid var(--line)' }}>#{e.num}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>{e.titulo}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>{e.desc}</div>
                  <div style={{ fontSize: 10, color: '#8b6ef5', marginTop: 2 }}>📥 {e.fuente}</div>
                </a>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Session Picker Modal */}
      {showPicker && (
        <>
          <div onClick={() => setShowPicker(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 60 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, zIndex: 70, padding: '28px 32px', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.02em' }}>¿Qué sesión vas a iniciar?</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>Organiza y genera cuestionarios personalizados desde cada sesión.</div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Tipo</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {TIPOS_SESION_DIAG.map(t => (
                  <button key={t.key} onClick={() => setPickerForm(p => ({ ...p, tipo: t.key }))} style={{ padding: '5px 11px', borderRadius: 7, border: `2px solid ${pickerForm.tipo === t.key ? '#6c4de6' : 'var(--line)'}`, background: pickerForm.tipo === t.key ? 'rgba(108,77,230,0.1)' : 'transparent', color: pickerForm.tipo === t.key ? '#6c4de6' : 'var(--text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div><label style={labelSt}>Con quién *</label><input value={pickerForm.interlocutor} onChange={e => setPickerForm(p => ({ ...p, interlocutor: e.target.value }))} placeholder="Nombre completo" style={inputSt} /></div>
              <div><label style={labelSt}>Cargo</label><input value={pickerForm.cargo} onChange={e => setPickerForm(p => ({ ...p, cargo: e.target.value }))} placeholder="Director de Operaciones…" style={inputSt} /></div>
            </div>
            <div style={{ marginBottom: 20 }}><label style={labelSt}>Área</label><input value={pickerForm.area} onChange={e => setPickerForm(p => ({ ...p, area: e.target.value }))} placeholder="Operaciones, Comercial, Administración…" style={{ ...inputSt, width: '100%' }} /></div>

            <button onClick={crearYEntrarSesion} disabled={!pickerForm.interlocutor.trim() || creandoSesion} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', fontSize: 14, padding: '11px', opacity: !pickerForm.interlocutor.trim() ? 0.5 : 1 }}>
              {creandoSesion ? 'Creando…' : '🎙️ Iniciar sesión'}
            </button>
          </div>
        </>
      )}

      {/* Cuestionario Vista Modal */}
      {cuestionarioVista && (
        <>
          <div onClick={() => setCuestionarioVista(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 60 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 640, maxHeight: '80vh', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, zIndex: 70, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{cuestionarioVista.titulo}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{(cuestionarioVista.preguntas ?? []).length} preguntas generadas con IA</div>
              </div>
              <button onClick={() => setCuestionarioVista(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 18, lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {Object.entries(
                ((cuestionarioVista.preguntas ?? []) as any[]).reduce((acc: Record<string, any[]>, p: any) => {
                  const sec = p.seccion || 'General';
                  if (!acc[sec]) acc[sec] = [];
                  acc[sec].push(p);
                  return acc;
                }, {})
              ).map(([seccion, preguntas]) => (
                <div key={seccion} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#3b82f6', marginBottom: 8 }}>{seccion}</div>
                  {(preguntas as any[]).map((p: any, i: number) => (
                    <div key={i} style={{ padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 8, marginBottom: 6 }}>
                      <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, marginBottom: 4 }}>{i + 1}. {p.pregunta}</div>
                      {p.contexto_empresa && <div style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic' }}>{p.contexto_empresa}</div>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {showSesion    && <NuevaSesionModal onClose={() => setShowSesion(false)} onSave={addSesion} />}
      {showPago      && <NuevoPagoModal onClose={() => setShowPago(false)} onSave={addPago} precio={cliente.precio} />}
      {showHallazgo  && <NuevoHallazgoModal onClose={() => setShowHallazgo(false)} onSave={addHallazgo} areasCliente={[...new Set([...hallazgos.map(h => h.area), ...(cliente.areas_diagnosticadas ?? [])].filter(Boolean))]} />}
      {showAccion    && <NuevaAccionModal onClose={() => setShowAccion(false)} onSave={addAccion} hallazgos={hallazgos} areasCliente={[...new Set([...hallazgos.map(h => h.area), ...(cliente.areas_diagnosticadas ?? [])].filter(Boolean))]} />}
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
function EditForm({ cliente, onSave, onCancel }: {
  cliente: Cliente;
  onSave: (datos: Partial<Cliente>) => void;
  onCancel: () => void;
}) {
  const [f, setF] = useState({
    empresa:             cliente.empresa,
    contacto_nombre:     cliente.contacto_nombre,
    contacto_cargo:      cliente.contacto_cargo,
    email:               cliente.email ?? '',
    whatsapp:            cliente.whatsapp ?? '',
    industria:           cliente.industria,
    tamano:              cliente.tamano,
    ejecutivo_asignado:  cliente.ejecutivo_asignado,
    precio:              String(cliente.precio),
    fecha_inicio:        cliente.fecha_inicio,
    fecha_fin:           cliente.fecha_fin ?? '',
    drive_url:           cliente.drive_url ?? '',
  });
  const u = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }));

  function handleSave() {
    onSave({
      empresa:            f.empresa,
      contacto_nombre:    f.contacto_nombre,
      contacto_cargo:     f.contacto_cargo,
      email:              f.email || null,
      whatsapp:           f.whatsapp || null,
      industria:          f.industria,
      tamano:             f.tamano,
      ejecutivo_asignado: f.ejecutivo_asignado,
      precio:             parseInt(f.precio) || cliente.precio,
      fecha_inicio:       f.fecha_inicio,
      fecha_fin:          f.fecha_fin || null,
      drive_url:          f.drive_url || undefined,
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#8b6ef5', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Editando datos del cliente
      </div>

      {/* Empresa */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
        <div><label style={labelSt}>Empresa *</label><input value={f.empresa} onChange={e => u('empresa', e.target.value)} style={inputSt} /></div>
        <div><label style={labelSt}>Industria</label><input value={f.industria} onChange={e => u('industria', e.target.value)} placeholder="Logística, Salud…" style={inputSt} /></div>
        <div><label style={labelSt}>Tamaño empresa</label>
          <select value={f.tamano} onChange={e => u('tamano', e.target.value)} style={{ ...inputSt, cursor: 'pointer' } as any}>
            <option value="<10">Menos de 10</option>
            <option value="10-100">10 – 100 empleados</option>
            <option value=">100">Más de 100</option>
          </select>
        </div>
      </div>

      {/* Contacto */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
        <div><label style={labelSt}>Nombre contacto</label><input value={f.contacto_nombre} onChange={e => u('contacto_nombre', e.target.value)} style={inputSt} /></div>
        <div><label style={labelSt}>Cargo</label><input value={f.contacto_cargo} onChange={e => u('contacto_cargo', e.target.value)} placeholder="CEO, Director…" style={inputSt} /></div>
        <div><label style={labelSt}>Email</label><input value={f.email} onChange={e => u('email', e.target.value)} type="email" placeholder="correo@empresa.mx" style={inputSt} /></div>
        <div><label style={labelSt}>WhatsApp</label><input value={f.whatsapp} onChange={e => u('whatsapp', e.target.value)} placeholder="+52 55 0000 0000" style={inputSt} /></div>
      </div>

      {/* Contrato */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 2fr', gap: 10 }}>
        <div><label style={labelSt}>Precio MXN</label><input value={f.precio} onChange={e => u('precio', e.target.value)} type="number" style={inputSt} /></div>
        <div><label style={labelSt}>Fecha inicio</label><input value={f.fecha_inicio} onChange={e => u('fecha_inicio', e.target.value)} type="date" style={inputSt} /></div>
        <div><label style={labelSt}>Fecha fin</label><input value={f.fecha_fin} onChange={e => u('fecha_fin', e.target.value)} type="date" style={inputSt} /></div>
        <div><label style={labelSt}>Ejecutivo</label><input value={f.ejecutivo_asignado} onChange={e => u('ejecutivo_asignado', e.target.value)} style={inputSt} /></div>
        <div><label style={labelSt}>Google Drive del cliente</label><input value={f.drive_url} onChange={e => u('drive_url', e.target.value)} placeholder="https://drive.google.com/…" style={inputSt} /></div>
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSave} style={btnPrimary}><Check size={12} /> Guardar cambios</button>
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

// ── Tab Cubo & Entregables ─────────────────────────────────────────────────────
const CUESTIONARIOS_SRC = [
  { id: 'dg',        label: 'Sesión DG',                   icon: '👤', path: '/flowdesk/diagnosticos/cuestionario-dg.html',        color: '#6c4de6' },
  { id: 'director',  label: 'Sesión Directores',           icon: '🏛️', path: '/flowdesk/diagnosticos/sesion-director.html',        color: '#8b5cf6' },
  { id: 'gerente',   label: 'Cuestionario Gerentes',       icon: '🏢', path: '/flowdesk/diagnosticos/cuestionario-gerente.html',   color: '#3b82f6' },
  { id: 'operador',  label: 'Cuestionario Operadores',     icon: '⚙️', path: '/flowdesk/diagnosticos/cuestionario-operador.html',  color: '#f59e0b' },
  { id: 'encuestas', label: 'Encuestas Diagnóstico',       icon: '📋', path: '/flowdesk/diagnosticos/encuestas-diagnostico.html',  color: '#10b981' },
] as const;

const ENTREGABLES = [
  { id: 'flujo_asis',  num: 1, titulo: 'Mapa de Procesos AS-IS',      desc: 'Swimlane + tabla de procesos actuales',     fuente: 'Áreas + Procesos + Brechas',      icon: '🗺️',  path: '/flowdesk/diagnosticos/mapa-procesos.html'        },
  { id: 'org_actual',  num: 2, titulo: 'Organigrama actual',           desc: 'Roles, tareas y herramientas por cargo',   fuente: 'Áreas + Roles + Herramientas',    icon: '👥',  path: '/flowdesk/diagnosticos/organigrama-actual.html'   },
  { id: 'flujo_tobe',  num: 3, titulo: 'Flujo TO-BE por fases',        desc: 'Procesos optimizados con IA',              fuente: 'Procesos + Agentes IA + Fases',   icon: '✨',  path: '/flowdesk/diagnosticos/flujo-tobe.html'           },
  { id: 'org_nuevo',   num: 4, titulo: 'Organigrama nuevo + costo $',  desc: 'Ahorro de headcount con agentes IA',       fuente: 'Roles + Agentes IA + Headcount',  icon: '💰',  path: '/flowdesk/diagnosticos/organigrama-nuevo.html'    },
  { id: 'propuesta',   num: 5, titulo: 'Propuesta agentes IA',         desc: 'Descripción, ROI y especificaciones',      fuente: 'Agentes IA + Costos + ROI',       icon: '🤖',  path: '/flowdesk/diagnosticos/propuesta-agentes.html'    },
  { id: 'roadmap',     num: 6, titulo: 'Roadmap 24 meses',             desc: 'Fases e hitos de implementación',          fuente: 'Fases + Hitos + Entregables',     icon: '🚀',  path: '/flowdesk/diagnosticos/roadmap-24m.html'          },
] as const;

type CuboKey = 'contexto' | 'areas_procesos' | 'organigrama' | 'sistemas' | 'brechas' | 'agentes';

interface CuboSection {
  key: CuboKey;
  titulo: string;
  desc: string;
  fuente: string;
  fuenteColor: string;
  placeholder: string;
}

const CUBO_SECTIONS: CuboSection[] = [
  {
    key: 'contexto',
    titulo: 'Empresa & Contexto estratégico',
    desc: 'Descripción del negocio, objetivos del DG, prioridades 12 meses',
    fuente: 'Cuestionario DG',
    fuenteColor: '#6c4de6',
    placeholder: 'Empresa: ___\nActividad principal: ___\n# Empleados: ___\nFacturación estimada: ___\n\nObjetivos del DG para los próximos 12 meses:\n—\n\nPrioridades más urgentes:\n—',
  },
  {
    key: 'areas_procesos',
    titulo: 'Áreas & Procesos principales',
    desc: 'Por cada área: función, procesos clave, problemas actuales',
    fuente: 'Cuestionario Gerentes',
    fuenteColor: '#3b82f6',
    placeholder: 'VENTAS\nFunción: ___\nProcesos: captación → calificación → propuesta → cierre\nProblemas: ___\n\nOPERACIONES\nFunción: ___\nProcesos: ___\nProblemas: ___\n\nADMINISTRACIÓN\n...',
  },
  {
    key: 'organigrama',
    titulo: 'Organigrama & Roles',
    desc: 'Personas por área, cargo, sueldo estimado, herramientas que usan',
    fuente: 'Cuestionario Gerentes + Operadores',
    fuenteColor: '#f59e0b',
    placeholder: 'NOMBRE · Cargo · Área · $sueldo/mes\nHerramientas: Excel, WhatsApp, Contpaq…\nPrincipal tarea repetitiva: ___\n\n...',
  },
  {
    key: 'sistemas',
    titulo: 'Sistemas & Herramientas actuales',
    desc: 'Software, plataformas, licencias y costos mensuales',
    fuente: 'Cuestionario Operadores',
    fuenteColor: '#f59e0b',
    placeholder: 'SISTEMA · Tipo · Licencia/mes · # usuarios\n\nEjemplo:\nContpaq · ERP/Contabilidad · $2,500/mes · 3 usuarios\nWhatsApp Business · Comunicación · Gratis · todos\nExcel · Gestión · O365 $150/usuario · 8 usuarios\n\n...',
  },
  {
    key: 'brechas',
    titulo: 'Brechas & Diagnóstico del asesor',
    desc: 'Gaps detectados, ineficiencias, observaciones de sesión',
    fuente: 'Sesión asesor',
    fuenteColor: '#ef4444',
    placeholder: 'BRECHA CRÍTICA\nDescripción: ___\nÁrea afectada: ___\nImpacto estimado: ___ horas/semana · $___ pérdida\n\nBRECHA IMPORTANTE\n...\n\nOBSERVACIONES DEL ASESOR\n—',
  },
  {
    key: 'agentes',
    titulo: 'Agentes IA propuestos',
    desc: 'Automatizaciones identificadas, ROI estimado por agente',
    fuente: 'Sesión asesor + análisis',
    fuenteColor: '#8b5cf6',
    placeholder: 'AGENTE 1 · Nombre descriptivo\nFunción: ___\nÁrea que libera: ___\nTareas que reemplaza: ___\nAhorro estimado: ___ horas/semana = $___ MXN/mes\nFase de implementación: Quick Win / Expansión\n\nAGENTE 2\n...',
  },
];

const CUBO_SHORT: Record<CuboKey, string> = {
  contexto:       'Contexto',
  areas_procesos: 'Áreas',
  organigrama:    'Organigrama',
  sistemas:       'Sistemas',
  brechas:        'Brechas',
  agentes:        'Agentes IA',
};

const ENTREGABLE_NEEDS: Record<string, CuboKey[]> = {
  flujo_asis: ['areas_procesos', 'brechas', 'sistemas'],
  org_actual: ['organigrama', 'contexto'],
  flujo_tobe: ['agentes', 'areas_procesos'],
  org_nuevo:  ['agentes', 'organigrama'],
  propuesta:  ['agentes', 'brechas', 'contexto'],
  roadmap:    ['contexto', 'areas_procesos', 'organigrama', 'sistemas', 'brechas', 'agentes'],
};

function TabCubo({ clienteId, empresa, sesiones, cubo: initialCubo }: { clienteId: string; empresa: string; sesiones: Sesion[]; cubo?: Record<string, string> }) {
  const entKey  = `mentoria_ent_${clienteId}`;

  const [cubo, setCubo] = React.useState<Record<CuboKey, string>>(() => {
    return (initialCubo ?? {}) as Record<CuboKey, string>;
  });

  React.useEffect(() => {
    if (initialCubo && Object.keys(initialCubo).length > 0) {
      setCubo(initialCubo as Record<CuboKey, string>);
    }
  }, [initialCubo]);
  const [entStatus, setEntStatus] = React.useState<Record<string, 'borrador' | 'revision' | 'aprobado'>>(() => {
    try { return JSON.parse(localStorage.getItem(entKey) || '{}'); } catch { return {}; }
  });
  const [saving, setSaving] = React.useState(false);
  const [openSection, setOpenSection] = React.useState<CuboKey | null>('contexto');

  const totalFilled = CUBO_SECTIONS.filter(s => cubo[s.key]?.trim()).length;
  const pctCubo = Math.round(totalFilled / CUBO_SECTIONS.length * 100);

  async function saveSection(key: CuboKey, value: string) {
    const next = { ...cubo, [key]: value };
    setCubo(next);
    try { await api.patch(`/mentoria/clientes/${clienteId}/cubo`, { cubo: next }); } catch {}
  }

  async function loadDemo() {
    // Función de demo eliminada — no exponer datos de clientes reales en producción
    return;
    const demo: Record<CuboKey, string> = {
      contexto: `Empresa: Textiles Anáhuac — División 2–7 (sede Puebla / CDMX)
Giro: Manufactura textil — hilatura, tejido, índigo, acabado y distribución de telas
Empleados: ~350 (7 divisiones operativas)
Facturación estimada: $80–120M MXN anuales
ERP principal: SAP (módulos SD, MM; PP parcial sin digitalizar)

Objetivos del DG (próximos 12 meses):
1. Reducir tiempo de respuesta de cotización de 4–8 hrs a <30 min
2. Mejorar cumplimiento de programa de producción de ~80% a >95%
3. Digitalizar control de calidad e inventario en planta
4. Reducir cartera vencida >30 días en 35%

Prioridades urgentes:
— Comercialización: cotización manual pierde pedidos ante competencia
— Planeación: programa semanal en Excel + reuniones S&OP de 3+ hrs
— Cobranza: seguimiento manual a deudores, DSO ~52 días`,

      areas_procesos: `COMERCIALIZACIÓN (División 2)
Función: captación → cotización → confirmación OV → seguimiento post-venta
Procesos clave:
  • Cotización al cliente: Coord. Comercial, Excel, 4–8 hrs/cot., Bajo demanda
  • Confirmación de pedido: SAP OV, Diario
  • Seguimiento post-venta: WhatsApp/teléfono, Semanal
Problemas: Cotización lenta sin visibilidad de disponibilidad de producción en SAP

PLANEACIÓN & LOGÍSTICA (División 4a)
Función: programación → verif. inventario → lib. programa → recepción APT
Procesos clave:
  • Programación semanal (Excel, 1 día completo de trabajo)
  • Verificación inventario PT/MP en SAP
  • Coord. plantas (WhatsApp/verbal, Diario)
Problemas: 1 día/semana en Excel de programación, cambios urgentes frecuentes no planeados

COMPRAS (División 3 CxP)
Función: requisición → OC → recepción MP → pago proveedor
Sistemas: SAP MM, Excel, Email
Problemas: ~40% OC sin trazabilidad en Excel; cotizaciones a proveedores por correo manual

PRODUCCIÓN (División 4b)
Función: hilatura OE/anillo → tejido/índigo → acabado → empaque/etiquetado
Sistemas: Físico (papel), Excel ocasional
Problemas: Control diario de producción en papel, comunicación entre turnos por verbal

CALIDAD (División 5)
Función: inspección → liberación → No Conformidades
Sistemas: Excel rudimentario, papel
Problemas: NC en Word/Excel 45 min c/u, sin trazabilidad digital por lote

EMBARQUES (División 6)
Función: APT → embarque nacional/exportación
Problemas: Liberación depende de notificación manual de Calidad

FINANZAS / CxC (División 7)
Función: cobranza → estado cuenta → pago → conciliación SAP
Problemas: Cartera vencida gestionada 100% manual por teléfono, DSO ~52 días`,

      organigrama: `DG · Director General · $120,000/mes · SAP, Excel, WhatsApp

COMERCIALIZACIÓN — 7 personas
  Dir. Comercial · $60,000/mes
  3 Ejecutivos de Ventas · $18,000/mes c/u · Excel, WhatsApp, teléfono
  2 Soporte Comercial · $12,000/mes c/u · SAP, Excel
  1 Coord. Export. · $20,000/mes · Excel, SAP

PLANEACIÓN & LOGÍSTICA — 5 personas
  Dir. Planeación · $55,000/mes
  2 Planeadores · $18,000/mes c/u · Excel, SAP
  2 Almacenistas · $8,000/mes c/u · SAP parcial, papel

COMPRAS — 4 personas
  Gerente Compras · $40,000/mes
  2 Compradores · $20,000/mes c/u · SAP MM, Excel, Email
  1 Asistente CxP · $10,000/mes

PRODUCCIÓN — ~280 personas
  Dir. Producción · $65,000/mes
  4 Jefes de Planta · $30,000/mes c/u · Físico, Excel ocasional
  ~270 Operarios · $5,500–7,000/mes prom.

CALIDAD — 8 personas
  Gerente Calidad · $45,000/mes
  5 Inspectores · $10,000/mes c/u · Excel, papel
  2 Anal. Aseg. Calidad · $15,000/mes c/u

EMBARQUES — 6 personas
  Gerente Embarques · $38,000/mes
  5 Operativos · $9,000/mes c/u

FINANZAS / CxC — 5 personas
  Dir. Finanzas · $70,000/mes
  2 Analistas CxC · $15,000/mes c/u · SAP, teléfono
  1 Tesorero · $25,000/mes
  1 Asistente · $9,000/mes

⚠️ DATO PENDIENTE: confirmar sueldos con RRHH (Dir. Talento)`,

      sistemas: `SAP ERP (SD, MM; PP parcial) · ERP · ~$45,000/mes · 25 usuarios activos
Microsoft 365 (Excel/Outlook) · Ofimática · $150/usuario/mes · ~40 usuarios = $6,000/mes
WhatsApp Business (sin API) · Comunicación · $0 · Toda la empresa
Gmail (cuentas adicionales) · Email · $0
Papel + formatos físicos · Control calidad en planta · $0 · Sin trazabilidad

BRECHAS DE SISTEMAS:
— Sin WMS: inventario en Excel y papel → diferencia fís./SAP ~5%
— Sin CRM: seguimiento comercial en WhatsApp y Excel sin histórico
— Sin trazabilidad de lotes digital en Calidad
— SAP PP no implementado completamente → Producción sin visibilidad en tiempo real
— Sin API WhatsApp Business → mensajería masiva imposible actualmente`,

      brechas: `BRECHA CRÍTICA 1 — Cotización manual en Excel
Área: Comercialización
Impacto: 4–8 hrs por cotización → clientes se van con la competencia si no responden ese día
Costo estimado: 3 personas × 4 hrs × $200/hr × 22 días = $52,800/mes perdido
Quick fix: Agente Comercial Digital que responde en <5 min

BRECHA CRÍTICA 2 — Programación de producción 100% manual
Área: Planeación
Impacto: 1 día completo/semana para 2 planeadores, cumplimiento ~80%, cambios urgentes constantes
Costo estimado: 2 planeadores × 8 hrs/semana × $225/hr = $3,600/sem de coordinación reactiva
Quick fix: Agente S&OP que genera el programa automáticamente cada lunes

BRECHA CRÍTICA 3 — Inventario fís. vs SAP diverge ~5%
Área: Planeación & Almacén
Impacto: OC duplicadas, paros de producción por faltantes, conciliaciones 8+ hrs/semana
Costo estimado: Paros de planta + 2 almacenistas × 8 hrs/sem = $2,400/sem

BRECHA IMPORTANTE 4 — Cobranza 100% manual
Área: Finanzas/CxC
Impacto: DSO ~52 días, cartera vencida >30 días ≈ 15% de cartera
Costo: 2 personas × 40 hrs/semana de seguimiento manual

BRECHA IMPORTANTE 5 — Control de calidad en papel
Área: Calidad
Impacto: Sin trazabilidad digital, NC tardan 45 min c/u en Word/Excel

OBSERVACIONES DEL ASESOR:
— SAP subutilizado: funciona como repositorio, no como cerebro operativo
— Comunicación inter-depto ~80% WhatsApp/verbal → riesgo alto de errores no registrados
— Resistencia esperada en producción (270 operarios): mayor reto es cultural, no tecnológico
— DG tiene visión clara de transformación pero necesita ROI concreto para convencer a su consejo`,

      agentes: `AGENTE 1 · Agente Comercial Digital
Función: Atiende cotizaciones y captura pedidos por WhatsApp Business 24/7
Área: Comercialización — libera 3 personas en 60% del tiempo operativo
Reemplaza: Cotización manual Excel (4–8 hrs → <5 min), captura OV en SAP, seguimiento tel.
Ahorro: 450 hrs/mes × $200/hr = $90,000 MXN/mes
Costo impl.: $20,000/mes · ROI neto: $70,000/mes
Fase: Quick Win (Fase 1)

AGENTE 2 · Bot de Cobranza
Función: Monitorea cartera vencida en SAP, envía recordatorios WhatsApp/email, aplica pagos
Área: Finanzas/CxC — libera 2 personas de 80% tiempo operativo
Reemplaza: Llamadas manuales, estados de cuenta en Excel, aplicación manual de pagos
Ahorro: DSO -10 días = $1.2M más liquidez + 80 hrs/mes × $200/hr = $16,000/mes
Costo impl.: $5,500/mes · ROI neto: $10,500/mes + liquidez
Fase: Quick Win (Fase 1)

AGENTE 3 · Monitor de Almacén SAP
Función: Digitaliza inventario en tiempo real con tablets + QR/barras en planta
Área: Almacén — 4 personas eliminan conciliaciones (8 hrs → 0 hrs/semana)
Reemplaza: Captura en papel, conciliaciones semanales, conteos físicos periódicos
Ahorro: 32 hrs/sem × $150/hr = $19,200/mes + elimina diferencia fís/SAP
Costo impl.: $7,000/mes · ROI neto: $12,200/mes
Fase: Quick Win (Fase 1)

AGENTE 4 · Planeación S&OP Automática
Función: Genera programa semanal de producción automáticamente cada lunes a las 6am
Área: Planeación — 2 planeadores recuperan 1 día/semana c/u
Reemplaza: Excel de programación (1 día), reuniones S&OP 3+ hrs, actualizaciones urgentes
Ahorro: 64 hrs/mes × $225/hr = $14,400/mes + cumplimiento programa de 80% a >95%
Costo impl.: $14,000/mes · ROI neto: $400/mes + 15pts cumplimiento
Fase: Expansión (Fase 2)

AGENTE 5 · Agente de Compras
Función: Genera OC automáticamente al detectar necesidades del programa de producción
Área: Compras — 2 compradores liberan 50% del tiempo operativo
Reemplaza: Cotizaciones manuales email, seguimiento OC en Excel, generación OC SAP
Ahorro: 5–8% ahorro sobre precio spot + 80 hrs/mes administrativas
Costo impl.: $12,000/mes
Fase: Expansión (Fase 2)

AGENTE 6 · Agente de Calidad
Función: Inspección digital en tablet, NC automáticas con foto, predicción de fallo por lote
Área: Calidad — 5 inspectores liberan 40% del tiempo en papelería
Reemplaza: Registro manual papel, NC Word/Excel (45 min → <2 min), notificaciones manuales
Ahorro: 5 × 16 hrs/mes × $150/hr = $12,000/mes + eliminación rechazos en cliente
Costo impl.: $15,000/mes
Fase: Expansión (Fase 2)`,
    };
    setCubo(demo);
    try { await api.patch(`/mentoria/clientes/${clienteId}/cubo`, { cubo: demo }); } catch {}
    setOpenSection('contexto');
  }

  function cycleStatus(id: string) {
    const order: Array<'borrador' | 'revision' | 'aprobado'> = ['borrador', 'revision', 'aprobado'];
    const cur = entStatus[id] ?? 'borrador';
    const next = order[(order.indexOf(cur) + 1) % order.length];
    const updated = { ...entStatus, [id]: next };
    setEntStatus(updated);
    localStorage.setItem(entKey, JSON.stringify(updated));
  }

  const statusCfg = {
    borrador:  { label: 'Borrador',      color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
    revision:  { label: 'En revisión',   color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    aprobado:  { label: 'Aprobado ✓',   color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  };

  return (
    <div style={{ display: 'flex', gap: 18 }}>

      {/* ── Cubo de información ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Header cubo */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Cubo de información — {empresa}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Fuente única para los 6 entregables. Edita durante la reunión de verificación.</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: pctCubo === 100 ? '#22c55e' : '#6c4de6' }}>{pctCubo}%</div>
            </div>
          </div>
          <div style={{ height: 5, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: pctCubo + '%', background: 'linear-gradient(90deg,#6c4de6,#22c55e)', borderRadius: 99, transition: 'width 0.4s' }} />
          </div>

          {sesiones.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-3)' }}>
              💬 {sesiones.length} sesión{sesiones.length > 1 ? 'es' : ''} registrada{sesiones.length > 1 ? 's' : ''} · datos sincronizados automáticamente
            </div>
          )}
        </div>

        {/* Secciones del cubo */}
        {CUBO_SECTIONS.map(section => {
          const isOpen = openSection === section.key;
          const value  = cubo[section.key] ?? '';
          const filled = !!value.trim();
          return (
            <div key={section.key} style={{ background: 'var(--surface)', border: `1px solid ${filled ? 'rgba(34,197,94,0.25)' : 'var(--line)'}`, borderRadius: 11, overflow: 'hidden' }}>
              <button
                onClick={() => setOpenSection(isOpen ? null : section.key)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: filled ? '#22c55e' : 'var(--line)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{section.titulo}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{section.desc}</div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: section.fuenteColor, background: `${section.fuenteColor}15`, border: `1px solid ${section.fuenteColor}30`, padding: '2px 8px', borderRadius: 99, flexShrink: 0 }}>
                  {section.fuente}
                </span>
                <span style={{ color: 'var(--text-3)', fontSize: 12, flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
              </button>
              {isOpen && (
                <div style={{ padding: '0 18px 16px' }}>
                  <textarea
                    value={value}
                    onChange={e => saveSection(section.key, e.target.value)}
                    placeholder={section.placeholder}
                    style={{ width: '100%', minHeight: 180, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 12, fontFamily: 'var(--font-mono, monospace)', lineHeight: 1.7, outline: 'none', resize: 'vertical' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Cobertura de entregables ── */}
      <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Secciones del cubo — estado rápido */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 11, padding: '14px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Secciones del cubo</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {CUBO_SECTIONS.map(s => {
              const filled = !!(cubo[s.key]?.trim());
              return (
                <button key={s.key} onClick={() => setOpenSection(s.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '3px 0' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: filled ? '#22c55e' : 'var(--line)' }} />
                  <span style={{ fontSize: 12, flex: 1, color: filled ? 'var(--text)' : 'var(--text-3)', fontWeight: filled ? 600 : 400 }}>
                    {CUBO_SHORT[s.key]}
                  </span>
                  {filled
                    ? <span style={{ fontSize: 9, color: '#22c55e', fontWeight: 700 }}>✓</span>
                    : <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 700 }}>Falta</span>
                  }
                </button>
              );
            })}
          </div>
        </div>

        {/* Por entregable — cobertura visual */}
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 0' }}>
          Listo para generar
        </div>

        {ENTREGABLES.map(e => {
          const needed  = ENTREGABLE_NEEDS[e.id] ?? [];
          const filledK = needed.filter(k => !!(cubo[k]?.trim()));
          const missing = needed.filter(k => !(cubo[k]?.trim()));
          const ready   = missing.length === 0;
          return (
            <div key={e.id} style={{
              background: 'var(--surface)',
              border: `1px solid ${ready ? 'rgba(34,197,94,0.35)' : missing.length === needed.length ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.3)'}`,
              borderRadius: 11, padding: '12px 14px',
            }}>
              {/* Título + badge */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 8 }}>
                <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1 }}>{e.icon}</span>
                <div style={{ flex: 1, fontSize: 11, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>{e.titulo}</div>
                <span style={{
                  fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99, flexShrink: 0,
                  background: ready ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.08)',
                  color: ready ? '#22c55e' : '#ef4444',
                  border: `1px solid ${ready ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.2)'}`,
                }}>
                  {ready ? '✓ Listo' : `${filledK.length}/${needed.length}`}
                </span>
              </div>

              {/* Chips de secciones necesarias */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {needed.map(k => {
                  const ok = !!(cubo[k]?.trim());
                  return (
                    <button key={k} onClick={() => setOpenSection(k)} style={{
                      fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99, cursor: 'pointer',
                      background: ok ? 'rgba(34,197,94,0.1)'  : 'rgba(239,68,68,0.07)',
                      color:      ok ? '#22c55e'               : '#ef4444',
                      border:     `1px solid ${ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.25)'}`,
                    }}>
                      {ok ? '✓' : '○'} {CUBO_SHORT[k]}
                    </button>
                  );
                })}
              </div>

              {/* Link abrir */}
              <a href={`${e.path}?empresa=${encodeURIComponent(empresa)}&clienteId=${clienteId}`} target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 9, fontSize: 10, textDecoration: 'none', fontWeight: ready ? 700 : 400, color: ready ? '#22c55e' : 'var(--text-3)' }}>
                <ExternalLink size={9} /> {ready ? 'Abrir entregable →' : 'Ver HTML (parcial)'}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
function NuevoHallazgoModal({ onClose, onSave, areasCliente }: { onClose: () => void; onSave: (h: Omit<Hallazgo, 'id'>) => void; areasCliente: string[] }) {
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
          <input list="areas-hall" value={f.area} onChange={e => u('area', e.target.value)} placeholder="Ej. Ventas, Operaciones…" style={{ ...inputSt, width: '100%' }} />
          <datalist id="areas-hall">{areasCliente.map(a => <option key={a} value={a} />)}</datalist>
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
function NuevaAccionModal({ onClose, onSave, hallazgos, areasCliente }: { onClose: () => void; onSave: (a: Omit<AccionPlan, 'id'>) => void; hallazgos: Hallazgo[]; areasCliente: string[] }) {
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
          <input list="areas-acc" value={f.area} onChange={e => u('area', e.target.value)} placeholder="Ej. Ventas, Operaciones…" style={{ ...inputSt, width: '100%' }} />
          <datalist id="areas-acc">{areasCliente.map(a => <option key={a} value={a} />)}</datalist>
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
