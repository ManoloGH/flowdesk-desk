'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Plus, Search, RefreshCw, ChevronRight, X, ArrowRight,
  ExternalLink, Users, TrendingUp, Zap, DollarSign,
  Star, MessageSquare,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
type ProspectoStage =
  | 'agente_ia' | 'micro_diagnostico' | 'discovery'
  | 'propuesta' | 'contrato' | 'implementacion';

interface Prospecto {
  id: string; empresa: string; contacto: string;
  email: string | null; whatsapp: string | null;
  industria: string | null; tamano: string | null;
  etapa: ProspectoStage; puntuacion: number | null;
  ejecutivo_asignado: string | null;
  conversacion: Record<string, string> | null;
  micro_diagnostico: string | null; notas: string | null;
  canal?: string; // email | whatsapp (del agente Aria)
  fecha_creacion: string; fecha_ultima_accion: string | null;
}

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
}

// ── Config ─────────────────────────────────────────────────────────────────────
const PROSPECTO_STAGES = [
  { key: 'agente_ia',         label: 'Agente IA',        color: '#6c4de6', icon: '🤖' },
  { key: 'micro_diagnostico', label: 'Micro Diagnóstico', color: '#8b5cf6', icon: '📊' },
  { key: 'discovery',         label: 'Discovery',         color: '#3b82f6', icon: '🔍' },
  { key: 'propuesta',         label: 'Propuesta',         color: '#f59e0b', icon: '📄' },
  { key: 'contrato',          label: 'Contrato',          color: '#10b981', icon: '✍️' },
  { key: 'implementacion',    label: 'Implementación',    color: '#22c55e', icon: '⚡' },
] as const;

const STAGE_MAP = Object.fromEntries(PROSPECTO_STAGES.map(s => [s.key, s]));

const FASE_LABELS = ['Mapeo', 'Quick Wins', 'Expansión', 'Optimización'];
const FASE_COLORS = ['#6c4de6', '#f59e0b', '#3b82f6', '#22c55e'];

const PRECIO_LABEL: Record<string, number> = { '<10': 10000, '10-100': 30000, '>100': 50000 };

// ── Mock data ──────────────────────────────────────────────────────────────────
const MOCK_PROSPECTOS: Prospecto[] = [
  {
    id: 'p-1', empresa: 'Distribuidora Garza', contacto: 'Miguel Garza',
    email: 'mgarza@garza.mx', whatsapp: '+52 81 1234 5678',
    industria: 'Distribución', tamano: '10-100',
    etapa: 'discovery', puntuacion: 72, ejecutivo_asignado: 'Manolo',
    conversacion: {
      empresa: 'Distribuidora Garza, distribución de alimentos, 35 empleados',
      dolores: 'Pedidos por WhatsApp sin trazabilidad, cobranza manual muy tardada',
      herramientas: 'Excel y WhatsApp. Contpaq para facturas',
      intentos: 'Intentamos un ERP pero era muy caro y complicado',
      impacto: 'Creo que unas 25 horas a la semana entre todo el equipo',
    },
    micro_diagnostico: 'Dependencia Excel + gestión por WhatsApp sin CRM. ROI estimado $60k MXN/mes.',
    notas: 'CEO muy motivado. Tiene presupuesto confirmado. Decision maker directo.',
    canal: 'whatsapp',
    fecha_creacion: new Date(Date.now() - 3 * 86400000).toISOString(),
    fecha_ultima_accion: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'p-2', empresa: 'Clínica Bienestar', contacto: 'Dra. Laura Vega',
    email: 'lvega@clinicabienestar.mx', whatsapp: null,
    industria: 'Salud', tamano: '<10',
    etapa: 'micro_diagnostico', puntuacion: 58, ejecutivo_asignado: null,
    conversacion: {
      empresa: 'Clínica Bienestar, consultas médicas generales, 8 personas',
      dolores: 'Agenda manual en libreta, no hay seguimiento de pacientes',
      herramientas: 'Solo WhatsApp y libreta física',
      intentos: 'Nunca hemos intentado nada digital',
      impacto: 'Quizás $20,000 pesos al mes si automatizamos las citas',
    },
    micro_diagnostico: null, notas: null, canal: 'email',
    fecha_creacion: new Date(Date.now() - 86400000).toISOString(),
    fecha_ultima_accion: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
];

const MOCK_CLIENTES: Cliente[] = [
  {
    id: 'c-primer',
    empresa: 'LogiMex SA de CV',
    contacto_nombre: 'Carlos Torres',
    contacto_cargo: 'Director de Operaciones',
    email: 'carlos.torres@logimex.mx',
    whatsapp: '+52 55 9876 5432',
    industria: 'Logística y Transporte',
    tamano: '10-100',
    status: 'activo',
    ejecutivo_asignado: 'Manolo',
    fecha_inicio: '2026-06-01',
    fecha_fin: null,
    precio: 30000,
    fase_actual: 1,
    areas_diagnosticadas: ['ventas', 'operaciones'],
    notas: '45 empleados. Todo por WhatsApp. CEO activo en sesiones. Muy receptivo a cambios.',
    prospecto_id: null,
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function timeAgo(iso: string | null) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora'; if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
function scoreColor(s: number | null) {
  if (!s) return '#44445a';
  return s >= 80 ? '#22c55e' : s >= 60 ? '#f59e0b' : '#ef4444';
}
function fmt$(n: number) { return '$' + n.toLocaleString('es-MX') + ' MXN'; }

function loadLocalLeads(): Prospecto[] {
  try {
    return (JSON.parse(localStorage.getItem('mentoria_preventa_leads') || '[]') as any[]).map((l, i) => ({
      id: l.id || `local-${i}`,
      empresa: (l.answers?.empresa || 'Empresa sin nombre').split(',')[0].substring(0, 40),
      contacto: l.nombre || '',
      email: l.canal === 'email' ? l.contacto : null,
      whatsapp: l.canal === 'whatsapp' ? l.contacto : null,
      industria: null, tamano: null,
      etapa: 'micro_diagnostico' as ProspectoStage,
      puntuacion: null, ejecutivo_asignado: null,
      conversacion: l.answers,
      micro_diagnostico: l.hallazgos ? l.hallazgos.map((h: any) => h.titulo).join(' · ') : null,
      notas: null, canal: l.canal,
      fecha_creacion: l.fecha || new Date().toISOString(),
      fecha_ultima_accion: l.fecha || new Date().toISOString(),
    }));
  } catch { return []; }
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function MentoriaPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'prospectos' | 'activos' | 'desactivados' | 'descartados'>('prospectos');
  const [prospectos, setProspectos]   = useState<Prospecto[]>([]);
  const [clientes, setClientes]       = useState<Cliente[]>([]);
  const [descartados, setDescartados] = useState<Prospecto[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [pView, setPView]           = useState<'pipeline' | 'lista'>('pipeline');
  const [selected, setSelected]     = useState<Prospecto | null>(null);
  const [notes, setNotes]           = useState('');
  const [showAddP, setShowAddP]     = useState(false);
  const [showAddC, setShowAddC]     = useState(false);
  const [showConverting, setShowConverting] = useState<Prospecto | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [psR, csR, dsR] = await Promise.allSettled([
      api.get<Prospecto[]>('/mentoria/prospectos'),
      api.get<Cliente[]>('/mentoria/clientes'),
      api.get<Prospecto[]>('/mentoria/prospectos/descartados'),
    ]);
    // Cada llamada falla de forma independiente — nunca pisamos datos reales con mocks
    if (psR.status === 'fulfilled') setProspectos(Array.isArray(psR.value) ? psR.value : []);
    else { const local = loadLocalLeads(); setProspectos(local); }
    if (csR.status === 'fulfilled') setClientes(Array.isArray(csR.value) ? csR.value : []);
    if (dsR.status === 'fulfilled') setDescartados(Array.isArray(dsR.value) ? dsR.value : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (selected) setNotes(selected.notas ?? ''); }, [selected]);

  async function advanceStage(id: string, etapa: ProspectoStage) {
    try { await api.patch(`/mentoria/prospectos/${id}/etapa`, { etapa }); } catch {}
    setProspectos(prev => prev.map(p => p.id === id ? { ...p, etapa } : p));
    setSelected(prev => prev?.id === id ? { ...prev, etapa } : prev);
  }

  async function saveNotes() {
    if (!selected) return;
    try { await api.patch(`/mentoria/prospectos/${selected.id}/notas`, { notas: notes }); } catch {}
    setProspectos(prev => prev.map(p => p.id === selected.id ? { ...p, notas: notes } : p));
    setSelected(prev => prev ? { ...prev, notas: notes } : prev);
  }

  async function doDescartar(p: Prospecto) {
    try { await api.patch(`/mentoria/prospectos/${p.id}/descartar`, {}); } catch {}
    setProspectos(prev => prev.filter(x => x.id !== p.id));
    setDescartados(prev => [{ ...p }, ...prev]);
    setSelected(null);
  }

  async function doReactivar(p: Prospecto) {
    try { await api.patch(`/mentoria/prospectos/${p.id}/reactivar`, {}); } catch {}
    setDescartados(prev => prev.filter(x => x.id !== p.id));
    setProspectos(prev => [{ ...p, etapa: 'agente_ia' as ProspectoStage }, ...prev]);
  }

  async function doConvertir(p: Prospecto, datos: { empresa: string; contacto_nombre: string; contacto_cargo: string; precio: number; fecha_inicio: string }) {
    const nuevo: Cliente = {
      id: `c-${Date.now()}`,
      empresa: datos.empresa,
      contacto_nombre: datos.contacto_nombre,
      contacto_cargo: datos.contacto_cargo,
      email: p.email,
      whatsapp: p.whatsapp,
      industria: p.industria || '',
      tamano: p.tamano || '',
      status: 'activo',
      ejecutivo_asignado: p.ejecutivo_asignado || '',
      fecha_inicio: datos.fecha_inicio,
      fecha_fin: null,
      precio: datos.precio,
      fase_actual: 0,
      areas_diagnosticadas: [],
      notas: p.notas || '',
      prospecto_id: p.id,
    };
    try { const saved = await api.post<Cliente>('/mentoria/clientes', nuevo); setClientes(prev => [saved, ...prev]); }
    catch { setClientes(prev => [nuevo, ...prev]); }
    setProspectos(prev => prev.filter(x => x.id !== p.id));
    setShowConverting(null);
    setSelected(null);
    router.push(`/mentoria/${nuevo.id}`);
  }

  const filteredP     = prospectos.filter(p => { const q = search.toLowerCase(); return !q || p.empresa.toLowerCase().includes(q) || (p.contacto || '').toLowerCase().includes(q); });
  const activos       = clientes.filter(c => c.status === 'activo').filter(c => !search || c.empresa.toLowerCase().includes(search.toLowerCase()));
  const desactivados  = clientes.filter(c => c.status === 'inactivo').filter(c => !search || c.empresa.toLowerCase().includes(search.toLowerCase()));
  const filteredDesc  = descartados.filter(p => { const q = search.toLowerCase(); return !q || p.empresa.toLowerCase().includes(q) || (p.contacto || '').toLowerCase().includes(q); });

  const mrr = clientes.filter(c => c.status === 'activo').reduce((a, c) => a + c.precio, 0);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '22px 28px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#6c4de6,#00d4ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'white' }}>M</div>
            <div>
              <h1 style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)' }}>CRM · MentorIA Systems</h1>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>Pipeline completo: prospectos → clientes activos</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={load} style={btnGhost}><RefreshCw size={13} /></button>
            <a href="/flowdesk/agente-preventa/index.html" target="_blank" style={{ ...btnGhost, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <ExternalLink size={12} /> Ver Aria
            </a>
            {tab === 'prospectos'
              ? <button onClick={() => setShowAddP(true)} style={btnPrimary}><Plus size={13} /> Prospecto</button>
              : tab === 'activos'
              ? <button onClick={() => setShowAddC(true)} style={btnPrimary}><Plus size={13} /> Cliente</button>
              : null
            }
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          {[
            { icon: <Users size={13} />, label: 'En pipeline', value: prospectos.length, color: '#6c4de6' },
            { icon: <TrendingUp size={13} />, label: 'Clientes activos', value: activos.length, color: '#22c55e' },
            { icon: <DollarSign size={13} />, label: 'MRR', value: fmt$(mrr), color: '#f59e0b' },
            { icon: <Zap size={13} />, label: 'Descartados', value: descartados.length, color: '#ef4444' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '11px 16px', flex: 1, display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ color: s.color }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs + search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--line)', paddingBottom: 0 }}>
          {([
            { key: 'prospectos',  label: 'Pipeline CRM',         count: prospectos.length + activos.length },
            { key: 'activos',     label: 'Clientes activos',     count: activos.length },
            { key: 'desactivados',label: 'Clientes anteriores',  count: desactivados.length },
            { key: 'descartados', label: 'Descartados',          count: descartados.length },
          ] as const).map(t => (
            <button
              key={t.key} onClick={() => setTab(t.key)}
              style={{ padding: '8px 4px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: tab === t.key ? 'var(--text)' : 'var(--text-3)', borderBottom: tab === t.key ? '2px solid #6c4de6' : '2px solid transparent', marginBottom: -1, display: 'flex', alignItems: 'center', gap: 7, transition: 'color 0.15s' }}
            >
              {t.label}
              <span style={{ background: tab === t.key ? 'rgba(108,77,230,0.15)' : 'var(--surface-2)', color: tab === t.key ? '#8b6ef5' : 'var(--text-3)', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99 }}>{t.count}</span>
            </button>
          ))}
          <div style={{ marginLeft: 'auto', position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar…" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, padding: '7px 10px 7px 27px', color: 'var(--text)', fontSize: 12, outline: 'none', width: 180 }} />
          </div>
          {tab === 'prospectos' && (
            <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 7, padding: 2, gap: 1 }}>
              {(['pipeline', 'lista'] as const).map(v => (
                <button key={v} onClick={() => setPView(v)} style={{ padding: '4px 12px', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontWeight: 600, background: pView === v ? 'var(--surface-2)' : 'transparent', color: pView === v ? 'var(--text)' : 'var(--text-3)' }}>
                  {v === 'pipeline' ? 'Kanban' : 'Lista'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid #6c4de6', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : tab === 'prospectos' ? (
        pView === 'pipeline'
          ? <ProspectosPipeline prospectos={filteredP} clientes={activos} onSelect={setSelected} onDescartar={doDescartar} onAdvance={advanceStage} />
          : <ProspectosLista prospectos={filteredP} onSelect={setSelected} onDescartar={doDescartar} />
      ) : tab === 'activos' ? (
        <ClientesGrid clientes={activos} onSelect={id => router.push(`/mentoria/${id}`)} />
      ) : tab === 'desactivados' ? (
        <ClientesGrid clientes={desactivados} onSelect={id => router.push(`/mentoria/${id}`)} inactive />
      ) : (
        <DescartadosLista prospectos={filteredDesc} onReactivar={doReactivar} />
      )}

      {/* Prospect drawer */}
      {selected && (
        <ProspectoDrawer
          p={selected} notes={notes} setNotes={setNotes}
          onSave={saveNotes}
          onAdvance={s => advanceStage(selected.id, s)}
          onConvert={() => setShowConverting(selected)}
          onDescartar={() => doDescartar(selected)}
          onClose={() => setSelected(null)}
        />
      )}

      {showConverting && <ConvertirModal prospecto={showConverting} onClose={() => setShowConverting(null)} onSave={datos => doConvertir(showConverting, datos)} />}
      {showAddP && <AddProspectoModal onClose={() => setShowAddP(false)} onSave={p => { load(); setShowAddP(false); }} />}
      {showAddC && <AddClienteModal onClose={() => setShowAddC(false)} onSave={c => { load(); setShowAddC(false); if (c.id) router.push(`/mentoria/${c.id}`); }} />}
    </div>
  );
}

// ── Prospectos Pipeline ────────────────────────────────────────────────────────
function ProspectosPipeline({ prospectos, clientes, onSelect, onDescartar, onAdvance }: {
  prospectos: Prospecto[];
  clientes: Cliente[];
  onSelect: (p: Prospecto) => void;
  onDescartar: (p: Prospecto) => void;
  onAdvance: (id: string, etapa: ProspectoStage) => void;
}) {
  const pGroups = Object.fromEntries(PROSPECTO_STAGES.map(s => [s.key, prospectos.filter(p => p.etapa === s.key)]));
  const [dragOver, setDragOver] = useState<string | null>(null);

  const handleDrop = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('prospectoId');
    if (id && stageKey !== 'implementacion') onAdvance(id, stageKey as ProspectoStage);
    setDragOver(null);
  };

  return (
    <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
      <div style={{ display: 'flex', gap: 12, padding: '18px 28px', minWidth: 'max-content', alignItems: 'flex-start' }}>
        {PROSPECTO_STAGES.map(stage => {
          const prospects = pGroups[stage.key] ?? [];
          const clients = stage.key === 'implementacion' ? clientes : [];
          const total = prospects.length + clients.length;
          const isOver = dragOver === stage.key;
          const isImpl = stage.key === 'implementacion';

          return (
            <div key={stage.key} style={{ width: 210, flexShrink: 0 }}
              onDragOver={e => { if (!isImpl) { e.preventDefault(); if (dragOver !== stage.key) setDragOver(stage.key); } }}
              onDragEnter={e => { if (!isImpl) { e.preventDefault(); setDragOver(stage.key); } }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null); }}
              onDrop={e => handleDrop(e, stage.key)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9, padding: '0 2px' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: stage.color, boxShadow: `0 0 6px ${stage.color}` }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>{stage.icon} {stage.label}</span>
                {stage.key === 'implementacion' && (
                  <span style={{ fontSize: 9, color: stage.color, background: `${stage.color}20`, padding: '1px 5px', borderRadius: 99, fontWeight: 700 }}>ACTIVOS</span>
                )}
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-3)', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 99, padding: '1px 6px', fontWeight: 600 }}>{total}</span>
              </div>
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 7, minHeight: 60,
                borderRadius: 10, padding: isOver ? '6px' : '0',
                background: isOver ? `${stage.color}10` : 'transparent',
                border: isOver ? `2px dashed ${stage.color}70` : '2px solid transparent',
                transition: 'background 0.15s, border 0.15s',
              }}>
                {prospects.map(p => <ProspectoCard key={p.id} p={p} color={stage.color} onClick={() => onSelect(p)} onDescartar={onDescartar} />)}
                {clients.map(c => <ClientePipelineCard key={c.id} c={c} color={stage.color} />)}
                {!total && !isOver && (
                  <div style={{ height: 56, border: '1px dashed var(--line)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-3)' }}>vacío</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProspectoCard({ p, color, onClick, onDescartar }: { p: Prospecto; color: string; onClick: () => void; onDescartar: (p: Prospecto) => void }) {
  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData('prospectoId', p.id); e.dataTransfer.effectAllowed = 'move'; }}
      onClick={onClick}
      style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 9, padding: '11px 13px', cursor: 'grab', textAlign: 'left', transition: 'border-color 0.15s, opacity 0.15s', boxSizing: 'border-box' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = color + '80'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3, flex: 1 }}>{p.empresa}</span>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }}>
          {p.puntuacion && <span style={{ fontSize: 10, fontWeight: 700, color: scoreColor(p.puntuacion) }}>{p.puntuacion}</span>}
          <button
            onClick={e => { e.stopPropagation(); if (confirm(`¿Descartar a ${p.empresa}? Podrás reactivarlo después.`)) onDescartar(p); }}
            title="Descartar lead"
            style={{ width: 18, height: 18, borderRadius: 4, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0 }}
          >✕</button>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {p.canal && <span style={{ fontSize: 10 }}>{p.canal === 'whatsapp' ? '💬' : '📧'}</span>}
        {p.industria && <span style={{ fontSize: 10, color: 'var(--text-3)', background: 'var(--surface-2)', padding: '1px 6px', borderRadius: 99 }}>{p.industria}</span>}
        <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>{timeAgo(p.fecha_ultima_accion ?? p.fecha_creacion)}</span>
      </div>
    </div>
  );
}

function ClientePipelineCard({ c, color }: { c: Cliente; color: string }) {
  const router = useRouter();
  return (
    <button onClick={() => router.push(`/mentoria/${c.id}`)}
      style={{ width: '100%', background: 'var(--surface)', border: `1px solid ${color}40`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '11px 13px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = color; (e.currentTarget as HTMLButtonElement).style.borderLeftColor = color; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}40`; (e.currentTarget as HTMLButtonElement).style.borderLeftColor = color; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{c.empresa}</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: color, background: `${color}20`, padding: '1px 6px', borderRadius: 99, flexShrink: 0 }}>CLIENTE</span>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', marginBottom: 3 }}>{fmt$(c.precio)}</div>
      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{c.contacto_nombre || '—'} · Fase {c.fase_actual}</div>
    </button>
  );
}

function ProspectosLista({ prospectos, onSelect, onDescartar }: { prospectos: Prospecto[]; onSelect: (p: Prospecto) => void; onDescartar: (p: Prospecto) => void }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 5px' }}>
        <thead>
          <tr>{['Empresa', 'Contacto', 'Etapa', 'Score', 'Canal', 'Última acción', ''].map(h => (
            <th key={h} style={{ textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 12px 8px' }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {prospectos.map(p => {
            const s = STAGE_MAP[p.etapa];
            return (
              <tr key={p.id} onClick={() => onSelect(p)} style={{ cursor: 'pointer' }}>
                <td style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRight: 'none', borderRadius: '9px 0 0 9px', padding: '11px 14px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.empresa}</div>
                  {p.industria && <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{p.industria}</div>}
                </td>
                <td style={tdMid}>{p.contacto || '—'}</td>
                <td style={tdMid}><span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: s?.color, flexShrink: 0 }} /><span style={{ color: 'var(--text-2)' }}>{s?.label}</span></span></td>
                <td style={tdMid}>{p.puntuacion ? <span style={{ fontWeight: 700, color: scoreColor(p.puntuacion), fontSize: 13 }}>{p.puntuacion}</span> : <span style={{ color: 'var(--text-3)', fontSize: 13 }}>—</span>}</td>
                <td style={tdMid}><span style={{ fontSize: 12 }}>{p.canal === 'whatsapp' ? '💬 WA' : p.canal === 'email' ? '📧 Email' : '—'}</span></td>
                <td style={tdMid}><span style={{ fontSize: 11, color: 'var(--text-3)' }}>{timeAgo(p.fecha_ultima_accion ?? p.fecha_creacion)}</span></td>
                <td style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderLeft: 'none', borderRadius: '0 9px 9px 0', padding: '8px 12px' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <ChevronRight size={13} style={{ color: 'var(--text-3)' }} />
                    <button
                      onClick={e => { e.stopPropagation(); if (confirm(`¿Descartar a ${p.empresa}?`)) onDescartar(p); }}
                      title="Descartar"
                      style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 5, padding: '4px 8px', cursor: 'pointer' }}
                    >✕</button>
                  </div>
                </td>
              </tr>
            );
          })}
          {!prospectos.length && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)', fontSize: 13 }}>Sin prospectos — los leads de Aria aparecen aquí automáticamente</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

// ── Clientes Grid ──────────────────────────────────────────────────────────────
function ClientesGrid({ clientes, onSelect, inactive }: { clientes: Cliente[]; onSelect: (id: string) => void; inactive?: boolean }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '18px 28px' }}>
      {!clientes.length ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontSize: 13 }}>
          {inactive ? 'Sin clientes inactivos' : 'Sin clientes activos — convierte un prospecto para empezar'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {clientes.map(c => {
            const faseColor = FASE_COLORS[c.fase_actual];
            const pct = [0, 33, 66, 100][c.fase_actual];
            return (
              <button key={c.id} onClick={() => onSelect(c.id)} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 13, padding: 0, cursor: 'pointer', textAlign: 'left', overflow: 'hidden', transition: 'border-color 0.15s, transform 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = faseColor + '80'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                {/* Top bar fase color */}
                <div style={{ height: 3, background: faseColor, width: pct + '%', transition: 'width 0.4s' }} />
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{c.empresa}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.industria}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: inactive ? 'rgba(100,100,100,0.1)' : `${faseColor}20`, color: inactive ? 'var(--text-3)' : faseColor, border: `1px solid ${inactive ? 'var(--line)' : faseColor + '40'}`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {inactive ? 'Inactivo' : `Fase ${c.fase_actual} · ${FASE_LABELS[c.fase_actual]}`}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 10 }}>
                    {c.contacto_nombre}{c.contacto_cargo ? ` · ${c.contacto_cargo}` : ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>{fmt$(c.precio)}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{c.ejecutivo_asignado || 'Sin asignar'}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Descartados Lista ──────────────────────────────────────────────────────────
function DescartadosLista({ prospectos, onReactivar }: { prospectos: Prospecto[]; onReactivar: (p: Prospecto) => void }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px' }}>
      {!prospectos.length ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontSize: 13 }}>Sin prospectos descartados</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 5px' }}>
          <thead>
            <tr>{['Empresa', 'Contacto', 'Última etapa', 'Canal', ''].map(h => (
              <th key={h} style={{ textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 12px 8px' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {prospectos.map(p => {
              const s = STAGE_MAP[p.etapa as keyof typeof STAGE_MAP];
              return (
                <tr key={p.id}>
                  <td style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRight: 'none', borderRadius: '9px 0 0 9px', padding: '11px 14px', opacity: 0.7 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.empresa}</div>
                    {p.industria && <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{p.industria}</div>}
                  </td>
                  <td style={tdMid}>{p.contacto || '—'}</td>
                  <td style={tdMid}><span style={{ fontSize: 11, color: 'var(--text-3)' }}>{s?.icon} {s?.label ?? p.etapa}</span></td>
                  <td style={tdMid}><span style={{ fontSize: 12 }}>{p.canal === 'whatsapp' ? '💬' : p.canal === 'email' ? '📧' : '—'}</span></td>
                  <td style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderLeft: 'none', borderRadius: '0 9px 9px 0', padding: '8px 12px' }}>
                    <button onClick={() => onReactivar(p)} style={{ fontSize: 11, fontWeight: 600, color: '#6c4de6', background: 'rgba(108,77,230,0.08)', border: '1px solid rgba(108,77,230,0.25)', borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}>
                      Reactivar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Prospect Drawer ────────────────────────────────────────────────────────────
function ProspectoDrawer({ p, notes, setNotes, onSave, onAdvance, onConvert, onDescartar, onClose }: {
  p: Prospecto; notes: string; setNotes: (v: string) => void;
  onSave: () => void; onAdvance: (s: ProspectoStage) => void;
  onConvert: () => void; onDescartar: () => void; onClose: () => void;
}) {
  const stage = STAGE_MAP[p.etapa];
  const stageIdx = PROSPECTO_STAGES.findIndex(s => s.key === p.etapa);
  const nextStage = PROSPECTO_STAGES[stageIdx + 1] ?? null;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 40 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 460, zIndex: 50, background: 'var(--surface)', borderLeft: '1px solid var(--line)', display: 'flex', flexDirection: 'column', overflowY: 'auto', boxShadow: '-20px 0 60px rgba(0,0,0,0.4)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{p.empresa}</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-2)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: stage?.color }} /> {stage?.label}
                </span>
                {p.canal && <span style={{ fontSize: 11 }}>{p.canal === 'whatsapp' ? '💬 vía WhatsApp' : '📧 vía Email'}</span>}
                {p.puntuacion && <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor(p.puntuacion) }}>Score {p.puntuacion}</span>}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}><X size={15} /></button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Convertir a cliente — CTA principal */}
          <div style={{ background: 'rgba(108,77,230,0.06)', border: '1px solid rgba(108,77,230,0.25)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Acción principal</div>
            <button onClick={onConvert} style={{ width: '100%', padding: '11px', borderRadius: 8, border: 'none', background: '#6c4de6', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              ✅ Convertir a cliente activo →
            </button>
            <button onClick={() => { if (confirm(`¿Descartar a ${p.empresa}? Podrás reactivarlo después.`)) onDescartar(); }} style={{ width: '100%', marginTop: 8, padding: '8px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.4)', background: 'transparent', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              ✕ Descartar prospecto
            </button>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, textAlign: 'center' }}>Abre el workspace completo del cliente en Fase 0</p>
          </div>

          {/* Info */}
          <DrawerSection title="Contacto">
            {[
              ['Nombre', p.contacto || '—'], ['Email', p.email || '—'],
              ['WhatsApp', p.whatsapp || '—'], ['Industria', p.industria || '—'],
              ['Tamaño', p.tamano || '—'], ['Ejecutivo', p.ejecutivo_asignado || 'Sin asignar'],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)', width: 80, flexShrink: 0 }}>{l}</span>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{v}</span>
              </div>
            ))}
          </DrawerSection>

          {/* Avanzar etapa */}
          <DrawerSection title="Etapa">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {nextStage && (
                <button onClick={() => onAdvance(nextStage.key as ProspectoStage)} style={{ ...btnPrimary, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ArrowRight size={12} /> Mover a {nextStage.icon} {nextStage.label}
                </button>
              )}
              <select onChange={e => e.target.value && onAdvance(e.target.value as ProspectoStage)} defaultValue="" style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text-2)', fontSize: 12, cursor: 'pointer' }}>
                <option value="">Mover a…</option>
                {PROSPECTO_STAGES.map(s => <option key={s.key} value={s.key}>{s.icon} {s.label}</option>)}
              </select>
            </div>
          </DrawerSection>

          {/* Conversación Aria */}
          {p.conversacion && (
            <DrawerSection title="Respuestas al agente Aria">
              {Object.entries(p.conversacion).map(([k, v]) => {
                const labels: Record<string, string> = { empresa: 'Empresa', dolores: 'Dolores', herramientas: 'Herramientas', intentos: 'Intentos previos', impacto: 'Impacto estimado' };
                return (
                  <div key={k} style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 7, padding: '9px 11px', marginBottom: 7 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>{labels[k] ?? k}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55 }}>{v}</div>
                  </div>
                );
              })}
            </DrawerSection>
          )}

          {/* Micro diagnóstico */}
          {p.micro_diagnostico && (
            <DrawerSection title="Micro diagnóstico">
              <div style={{ background: 'rgba(108,77,230,0.05)', border: '1px solid rgba(108,77,230,0.2)', borderRadius: 8, padding: '11px 13px', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.65 }}>
                {p.micro_diagnostico}
              </div>
            </DrawerSection>
          )}

          {/* Notas */}
          <DrawerSection title="Notas">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Contexto de llamadas, objeciones, próximos pasos…" style={{ width: '100%', minHeight: 100, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 7, padding: '9px 11px', color: 'var(--text)', fontSize: 12, lineHeight: 1.55, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
            <button onClick={onSave} style={{ ...btnPrimary, marginTop: 7, fontSize: 12 }}>Guardar notas</button>
          </DrawerSection>

        </div>
      </div>
    </>
  );
}

// ── Add Modals ─────────────────────────────────────────────────────────────────
function AddProspectoModal({ onClose, onSave }: { onClose: () => void; onSave: (p: Prospecto) => void }) {
  const [f, setF] = useState({ empresa: '', contacto: '', email: '', whatsapp: '', industria: '', tamano: '', etapa: 'discovery' as ProspectoStage });
  const upd = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }));
  async function save() {
    if (!f.empresa.trim()) return;
    try {
      const saved = await api.post<Prospecto>('/mentoria/prospectos', {
        empresa: f.empresa,
        contacto: f.contacto || undefined,
        email: f.email || undefined,
        whatsapp: f.whatsapp || undefined,
        industria: f.industria || undefined,
        tamano: f.tamano || undefined,
        etapa: f.etapa,
      });
      onSave(saved);
    } catch (e: any) {
      alert('Error al guardar prospecto: ' + (e?.message ?? 'Error desconocido'));
    }
  }
  return <SimpleModal title="Nuevo prospecto" onClose={onClose} onSave={save}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {([['empresa','Empresa *',''],['contacto','Contacto',''],['email','Email','correo@empresa.com'],['whatsapp','WhatsApp','+52 55 0000 0000'],['industria','Industria',''],['tamano','Tamaño','<10,10-100,>100']] as [keyof typeof f, string, string][]).map(([k, l, ph]) =>
        k === 'tamano' ? (
          <div key={k}><label style={labelSt}>{l}</label>
            <select value={f[k]} onChange={e => upd(k, e.target.value)} style={inputSt as any}><option value="">—</option><option value="<10">Menos de 10</option><option value="10-100">10-100</option><option value=">100">Más de 100</option></select>
          </div>
        ) : <div key={k}><label style={labelSt}>{l}</label><input value={f[k]} onChange={e => upd(k, e.target.value)} placeholder={ph} style={inputSt} /></div>
      )}
    </div>
    <div style={{ marginTop: 12 }}><label style={labelSt}>Etapa inicial</label>
      <select value={f.etapa} onChange={e => upd('etapa', e.target.value as ProspectoStage)} style={{ ...inputSt, width: '100%' } as any}>
        {PROSPECTO_STAGES.map(s => <option key={s.key} value={s.key}>{s.icon} {s.label}</option>)}
      </select>
    </div>
  </SimpleModal>;
}

function AddClienteModal({ onClose, onSave }: { onClose: () => void; onSave: (c: Cliente) => void }) {
  const [f, setF] = useState({ empresa: '', contacto_nombre: '', contacto_cargo: '', email: '', whatsapp: '', industria: '', tamano: '10-100', ejecutivo_asignado: '', precio: '30000' });
  const upd = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }));
  async function save() {
    if (!f.empresa.trim()) return;
    try {
      const saved = await api.post<Cliente>('/mentoria/clientes', {
        empresa: f.empresa,
        contacto_nombre: f.contacto_nombre || undefined,
        contacto_cargo: f.contacto_cargo || undefined,
        email: f.email || undefined,
        whatsapp: f.whatsapp || undefined,
        industria: f.industria || undefined,
        ejecutivo_asignado: f.ejecutivo_asignado || undefined,
        precio: parseInt(f.precio) || 30000,
      });
      onSave(saved);
    } catch (e: any) {
      alert('Error al crear cliente: ' + (e?.message ?? 'Error desconocido'));
    }
  }
  return <SimpleModal title="Nuevo cliente" onClose={onClose} onSave={save}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {([['empresa','Empresa *',''],['contacto_nombre','Contacto',''],['contacto_cargo','Cargo',''],['email','Email',''],['whatsapp','WhatsApp',''],['industria','Industria',''],['ejecutivo_asignado','Ejecutivo','']] as [keyof typeof f, string, string][]).map(([k, l, ph]) =>
        <div key={k}><label style={labelSt}>{l}</label><input value={f[k]} onChange={e => upd(k, e.target.value)} placeholder={ph} style={inputSt} /></div>
      )}
      <div><label style={labelSt}>Tamaño</label>
        <select value={f.tamano} onChange={e => { upd('tamano', e.target.value); upd('precio', String(PRECIO_LABEL[e.target.value] ?? 30000)); }} style={inputSt as any}>
          <option value="<10">Menos de 10 — $10,000</option><option value="10-100">10-100 — $30,000</option><option value=">100">Más de 100 — $50,000</option>
        </select>
      </div>
      <div><label style={labelSt}>Precio MXN</label><input value={f.precio} onChange={e => upd('precio', e.target.value)} style={inputSt} /></div>
    </div>
  </SimpleModal>;
}

function ConvertirModal({ prospecto, onClose, onSave }: {
  prospecto: Prospecto;
  onClose: () => void;
  onSave: (datos: { empresa: string; contacto_nombre: string; contacto_cargo: string; precio: number; fecha_inicio: string }) => void;
}) {
  const today = typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : '';
  const [f, setF] = useState({ empresa: prospecto.empresa, contacto_nombre: prospecto.contacto || '', contacto_cargo: '', precio: '', fecha_inicio: today });
  const upd = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }));
  const valid = f.empresa.trim() && f.precio.trim() && parseInt(f.precio) > 0;
  function save() {
    if (!valid) return;
    onSave({ empresa: f.empresa, contacto_nombre: f.contacto_nombre, contacto_cargo: f.contacto_cargo, precio: parseInt(f.precio), fecha_inicio: f.fecha_inicio });
  }
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 60 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, zIndex: 70, padding: '24px', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Convertir a cliente: {prospecto.empresa}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={15} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelSt}>Empresa *</label><input value={f.empresa} onChange={e => upd('empresa', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Nombre del contacto</label><input value={f.contacto_nombre} onChange={e => upd('contacto_nombre', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Cargo</label><input value={f.contacto_cargo} onChange={e => upd('contacto_cargo', e.target.value)} placeholder="CEO, Gerente…" style={inputSt} /></div>
          <div><label style={labelSt}>Fecha inicio</label><input type="date" value={f.fecha_inicio} onChange={e => upd('fecha_inicio', e.target.value)} style={inputSt} /></div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelSt}>Valor del contrato (MXN) *</label>
            <input value={f.precio} onChange={e => upd('precio', e.target.value)} type="number" placeholder="Ingresa el valor acordado" style={{ ...inputSt, borderColor: !f.precio.trim() ? 'rgba(239,68,68,0.5)' : undefined }} />
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>Referencia: &lt;10 empleados → $10,000 · 10-100 → $30,000 · &gt;100 → $50,000</div>
          </div>
        </div>
        <button onClick={save} disabled={!valid} style={{ ...btnPrimary, width: '100%', marginTop: 18, justifyContent: 'center', fontSize: 14, opacity: valid ? 1 : 0.4, cursor: valid ? 'pointer' : 'default' }}>
          ✅ Confirmar conversión a cliente
        </button>
      </div>
    </>
  );
}

function SimpleModal({ title, onClose, onSave, children }: { title: string; onClose: () => void; onSave: () => void; children: React.ReactNode }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 60 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, zIndex: 70, padding: '24px', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
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

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 9 }}>{title}</div>
      {children}
    </div>
  );
}

// ── Style atoms ────────────────────────────────────────────────────────────────
const btnPrimary: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#6c4de6', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const btnGhost: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer' };
const tdMid: React.CSSProperties = { background: 'var(--surface)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '11px 14px', fontSize: 12, color: 'var(--text-2)' };
const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 4 };
const inputSt: React.CSSProperties = { width: '100%', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 7, padding: '8px 10px', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none' };
