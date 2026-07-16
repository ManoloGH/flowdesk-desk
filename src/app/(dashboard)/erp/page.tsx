'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  RefreshCw, ChevronRight, DollarSign, Users, TrendingUp,
  Zap, Plus, Play, Pause, Trash2, X, Check,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Cliente {
  id: string;
  empresa: string;
  contacto_nombre: string;
  contacto_cargo: string;
  industria: string;
  status: 'activo' | 'inactivo';
  ejecutivo_asignado: string;
  fecha_inicio: string;
  precio: number;
  fase_actual: 0 | 1 | 2 | 3;
  areas_diagnosticadas: string[];
}

interface Automatizacion {
  id: string;
  tenant_id: string;
  cliente_id: string | null;
  cliente: { id: string; empresa: string } | null;
  nombre: string;
  area: string;
  descripcion: string | null;
  tipo: string;
  trigger: string | null;
  accion: string | null;
  canal: string | null;
  webhook_url: string | null;
  config: any;
  status: 'pendiente' | 'activa' | 'pausada' | 'inactiva';
  activada_at: string | null;
  created_at: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const FASES = [
  { num: 0, label: 'Mapeo técnico', color: '#6c4de6', pct: 0 },
  { num: 1, label: 'Quick Wins',    color: '#f59e0b', pct: 33 },
  { num: 2, label: 'Expansión',     color: '#3b82f6', pct: 66 },
  { num: 3, label: 'Optimización',  color: '#22c55e', pct: 100 },
];

const WORKSPACE_TABS = ['Proyecto', 'Diagnósticos', 'Hallazgos', 'Plan de Acción', 'Sesiones', 'Facturación'];

const AREAS = ['ventas', 'marketing', 'operaciones', 'administracion', 'atencion_cliente', 'otro'];
const TIPOS = ['whatsapp_bot', 'n8n_workflow', 'webhook', 'otro'];
const CANALES = ['whatsapp', 'email', 'webhook', 'interno'];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pendiente: { label: 'Pendiente',  color: '#f59e0b', bg: '#f59e0b18' },
  activa:    { label: 'Activa',     color: '#22c55e', bg: '#22c55e18' },
  pausada:   { label: 'Pausada',    color: '#6b7280', bg: '#6b728018' },
  inactiva:  { label: 'Inactiva',   color: '#ef4444', bg: '#ef444418' },
};

const TIPO_ICON: Record<string, string> = {
  whatsapp_bot:  '💬',
  n8n_workflow:  '🔄',
  webhook:       '🪝',
  otro:          '⚙️',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt$(n: number) { return '$' + n.toLocaleString('es-MX') + ' MXN'; }
function slug(s: string) { return s.replace(/_/g, ' '); }

// ── Empty form ────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  nombre: '', area: 'ventas', descripcion: '', tipo: 'whatsapp_bot',
  trigger: '', accion: '', canal: 'whatsapp', webhook_url: '', cliente_id: '',
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ErpPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'clientes' | 'automatizaciones'>('clientes');

  // ── Clientes ─────────────────────────────────────────────────────────────────
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingC, setLoadingC] = useState(true);

  const loadClientes = useCallback(async () => {
    setLoadingC(true);
    try {
      const data = await api.get<Cliente[]>('/mentoria/clientes?status=activo');
      setClientes(Array.isArray(data) ? data : []);
    } catch { setClientes([]); }
    finally { setLoadingC(false); }
  }, []);

  // ── Automatizaciones ──────────────────────────────────────────────────────────
  const [autos, setAutos] = useState<Automatizacion[]>([]);
  const [loadingA, setLoadingA] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [savingA, setSavingA] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadAutos = useCallback(async () => {
    setLoadingA(true);
    try {
      const data = await api.get<Automatizacion[]>('/mentoria/automatizaciones');
      setAutos(Array.isArray(data) ? data : []);
    } catch { setAutos([]); }
    finally { setLoadingA(false); }
  }, []);

  useEffect(() => { loadClientes(); }, [loadClientes]);
  useEffect(() => { if (tab === 'automatizaciones') loadAutos(); }, [tab, loadAutos]);

  const mrr = clientes.reduce((a, c) => a + c.precio, 0);
  const autosActivas = autos.filter(a => a.status === 'activa').length;

  // ── Acciones Automatizaciones ────────────────────────────────────────────────

  async function handleCreateAuto() {
    if (!form.nombre.trim()) return;
    setSavingA(true);
    try {
      const payload: any = {
        nombre: form.nombre, area: form.area, tipo: form.tipo,
        descripcion: form.descripcion || undefined,
        trigger: form.trigger || undefined, accion: form.accion || undefined,
        canal: form.canal || undefined, webhook_url: form.webhook_url || undefined,
        cliente_id: form.cliente_id || undefined,
      };
      await api.post('/mentoria/automatizaciones', payload);
      setForm({ ...EMPTY_FORM });
      setShowForm(false);
      await loadAutos();
    } catch { }
    finally { setSavingA(false); }
  }

  async function handleActivar(id: string) {
    setActionId(id);
    try {
      await api.post(`/mentoria/automatizaciones/${id}/activar`, {});
      setAutos(prev => prev.map(a => a.id === id ? { ...a, status: 'activa' } : a));
    } catch { }
    finally { setActionId(null); }
  }

  async function handlePausar(id: string) {
    setActionId(id);
    try {
      await api.post(`/mentoria/automatizaciones/${id}/pausar`, {});
      setAutos(prev => prev.map(a => a.id === id ? { ...a, status: 'pausada' } : a));
    } catch { }
    finally { setActionId(null); }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta automatización?')) return;
    setActionId(id);
    try {
      await api.delete(`/mentoria/automatizaciones/${id}`);
      setAutos(prev => prev.filter(a => a.id !== id));
    } catch { }
    finally { setActionId(null); }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '22px 28px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#6c4de6,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🎓</div>
            <div>
              <h1 style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)' }}>ERP · MentorIA Systems</h1>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>Implementación activa y automatizaciones</p>
            </div>
          </div>
          <button onClick={tab === 'clientes' ? loadClientes : loadAutos} style={btnGhost}><RefreshCw size={13} /></button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          {[
            { icon: <Users size={13} />, label: 'Clientes activos', value: clientes.length, color: '#6c4de6' },
            { icon: <DollarSign size={13} />, label: 'MRR total', value: fmt$(mrr), color: '#f59e0b' },
            { icon: <TrendingUp size={13} />, label: 'Fase promedio', value: clientes.length ? `Fase ${(clientes.reduce((a, c) => a + c.fase_actual, 0) / clientes.length).toFixed(1)}` : '—', color: '#3b82f6' },
            { icon: <Zap size={13} />, label: 'Automatizaciones activas', value: autosActivas, color: '#22c55e' },
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

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--line)', marginBottom: 0 }}>
          {[
            { key: 'clientes', label: 'Clientes' },
            { key: 'automatizaciones', label: 'Automatizaciones' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              style={{ padding: '8px 16px', fontSize: 13, fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? '#6c4de6' : 'var(--text-3)', borderBottom: tab === t.key ? '2px solid #6c4de6' : '2px solid transparent', background: 'none', border: 'none', borderBottom: tab === t.key ? '2px solid #6c4de6' : '2px solid transparent', cursor: 'pointer', marginBottom: -1 }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'clientes' ? (
        <ClientesTab clientes={clientes} loading={loadingC} router={router} />
      ) : (
        <AutomatizacionesTab
          autos={autos} loading={loadingA} clientes={clientes}
          showForm={showForm} setShowForm={setShowForm}
          form={form} setForm={setForm}
          savingA={savingA} actionId={actionId}
          onSave={handleCreateAuto} onActivar={handleActivar} onPausar={handlePausar} onDelete={handleDelete}
        />
      )}
    </div>
  );
}

// ── Clientes Tab ──────────────────────────────────────────────────────────────

function ClientesTab({ clientes, loading, router }: { clientes: Cliente[]; loading: boolean; router: any }) {
  if (loading) return <Spinner />;
  if (!clientes.length) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <span style={{ fontSize: 32 }}>🎓</span>
      <p style={{ fontSize: 14, color: 'var(--text-3)', textAlign: 'center' }}>Sin clientes en implementación.<br />Convierte un prospecto desde el CRM.</p>
      <button onClick={() => router.push('/mentoria')} style={btnPrimary}>Ir al CRM →</button>
    </div>
  );
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px 28px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {clientes.map(c => {
          const fase = FASES[c.fase_actual];
          return (
            <button key={c.id} onClick={() => router.push(`/mentoria/${c.id}`)}
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 13, padding: 0, cursor: 'pointer', textAlign: 'left', overflow: 'hidden', transition: 'border-color 0.15s, transform 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = fase.color + '80'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
              <div style={{ height: 4, background: 'var(--line)' }}>
                <div style={{ height: '100%', width: fase.pct + '%', background: fase.color, transition: 'width 0.4s' }} />
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
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12 }}>
                  {c.contacto_nombre}{c.contacto_cargo ? ` · ${c.contacto_cargo}` : ''}
                </div>
                {c.areas_diagnosticadas?.length > 0 && (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                    {c.areas_diagnosticadas.map(a => (
                      <span key={a} style={{ fontSize: 10, background: `${fase.color}15`, color: fase.color, padding: '2px 8px', borderRadius: 99, fontWeight: 600, textTransform: 'capitalize' }}>✓ {a}</span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
                  {WORKSPACE_TABS.map(t => (
                    <span key={t} style={{ fontSize: 9, color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--line)', padding: '2px 7px', borderRadius: 5 }}>{t}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{fmt$(c.precio)}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: fase.color, fontWeight: 600 }}>
                    Abrir workspace <ChevronRight size={12} />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Automatizaciones Tab ──────────────────────────────────────────────────────

function AutomatizacionesTab({
  autos, loading, clientes, showForm, setShowForm,
  form, setForm, savingA, actionId,
  onSave, onActivar, onPausar, onDelete,
}: {
  autos: Automatizacion[]; loading: boolean; clientes: Cliente[];
  showForm: boolean; setShowForm: (v: boolean) => void;
  form: typeof EMPTY_FORM; setForm: (v: typeof EMPTY_FORM) => void;
  savingA: boolean; actionId: string | null;
  onSave: () => void; onActivar: (id: string) => void;
  onPausar: (id: string) => void; onDelete: (id: string) => void;
}) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px 28px' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
          {autos.length} automatización{autos.length !== 1 ? 'es' : ''} · {autos.filter(a => a.status === 'activa').length} activas
        </div>
        <button onClick={() => setShowForm(!showForm)} style={btnPrimary}>
          <Plus size={13} /> Nueva automatización
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid #6c4de640', borderRadius: 14, padding: '20px 22px', marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Nueva Automatización</span>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4 }}><X size={14} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Nombre *">
              <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Bot de seguimiento WhatsApp" style={inputStyle} />
            </Field>
            <Field label="Cliente (opcional)">
              <select value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })} style={inputStyle}>
                <option value="">— Todos / sin cliente —</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.empresa}</option>)}
              </select>
            </Field>
            <Field label="Área">
              <select value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} style={inputStyle}>
                {AREAS.map(a => <option key={a} value={a}>{slug(a)}</option>)}
              </select>
            </Field>
            <Field label="Tipo">
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} style={inputStyle}>
                {TIPOS.map(t => <option key={t} value={t}>{TIPO_ICON[t]} {slug(t)}</option>)}
              </select>
            </Field>
            <Field label="Trigger (qué lo activa)">
              <input value={form.trigger} onChange={e => setForm({ ...form, trigger: e.target.value })} placeholder="Ej: Nuevo lead en CRM" style={inputStyle} />
            </Field>
            <Field label="Acción (qué hace)">
              <input value={form.accion} onChange={e => setForm({ ...form, accion: e.target.value })} placeholder="Ej: Enviar mensaje de bienvenida" style={inputStyle} />
            </Field>
            <Field label="Canal">
              <select value={form.canal} onChange={e => setForm({ ...form, canal: e.target.value })} style={inputStyle}>
                {CANALES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Webhook URL (n8n / Evolution API)">
              <input value={form.webhook_url} onChange={e => setForm({ ...form, webhook_url: e.target.value })} placeholder="https://n8n.xxx.com/webhook/..." style={inputStyle} />
            </Field>
            <Field label="Descripción" style={{ gridColumn: '1 / -1' }}>
              <input value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Notas adicionales..." style={inputStyle} />
            </Field>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button onClick={() => setShowForm(false)} style={btnGhost}>Cancelar</button>
            <button onClick={onSave} disabled={savingA || !form.nombre.trim()} style={{ ...btnPrimary, opacity: savingA || !form.nombre.trim() ? 0.5 : 1 }}>
              {savingA ? '…' : <><Check size={12} /> Guardar</>}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? <Spinner /> : !autos.length ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <span style={{ fontSize: 32 }}>⚡</span>
          <p style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 12 }}>Sin automatizaciones. Crea la primera.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {autos.map(a => {
            const sc = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.pendiente;
            const busy = actionId === a.id;
            return (
              <div key={a.id} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                {/* Icon */}
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${sc.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {TIPO_ICON[a.tipo] ?? '⚙️'}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{a.nombre}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: sc.bg, color: sc.color, fontWeight: 700, border: `1px solid ${sc.color}40` }}>{sc.label}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--line)', textTransform: 'capitalize' }}>{slug(a.tipo)}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--line)', textTransform: 'capitalize' }}>{slug(a.area)}</span>
                  </div>
                  {a.cliente && (
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>📌 {a.cliente.empresa}</div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text-2)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {a.trigger && <span>▶ {a.trigger}</span>}
                    {a.accion && <span>→ {a.accion}</span>}
                    {a.canal && <span>📡 {a.canal}</span>}
                  </div>
                  {a.webhook_url && (
                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>
                      🪝 {a.webhook_url}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                  {a.status !== 'activa' ? (
                    <button onClick={() => onActivar(a.id)} disabled={busy} title="Activar" style={{ ...btnIconGreen, opacity: busy ? 0.5 : 1 }}>
                      <Play size={12} />
                    </button>
                  ) : (
                    <button onClick={() => onPausar(a.id)} disabled={busy} title="Pausar" style={{ ...btnIconGray, opacity: busy ? 0.5 : 1 }}>
                      <Pause size={12} />
                    </button>
                  )}
                  <button onClick={() => onDelete(a.id)} disabled={busy} title="Eliminar" style={{ ...btnIconRed, opacity: busy ? 0.5 : 1 }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid #6c4de6', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
      {children}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const btnGhost: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontSize: 13 };
const btnPrimary: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: 'none', background: '#6c4de6', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' };
const btnIconGreen: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: '1px solid #22c55e40', background: '#22c55e18', color: '#22c55e', cursor: 'pointer' };
const btnIconGray: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--text-3)', cursor: 'pointer' };
const btnIconRed: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: '1px solid #ef444440', background: '#ef444418', color: '#ef4444', cursor: 'pointer' };
