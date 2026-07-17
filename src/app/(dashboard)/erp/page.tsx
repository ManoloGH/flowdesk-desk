'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  RefreshCw, Plus, Play, Pause, Trash2, X, Check,
  Building2, Users, Zap, TrendingUp, Settings2, BarChart3,
  FileText, Layers,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Area {
  id: string;
  nombre: string;
  responsable?: string;
  descripcion?: string;
  kpi_principal?: string;
  kpi_valor?: string;
  color: string;
  sop_count?: number;
  status: 'activa' | 'revision' | 'inactiva';
}

interface Automatizacion {
  id: string;
  nombre: string;
  area: string;
  descripcion: string | null;
  tipo: string;
  status: 'pendiente' | 'activa' | 'pausada' | 'inactiva';
  activada_at: string | null;
  created_at: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_AUTO: Record<string, { label: string; color: string; bg: string }> = {
  pendiente: { label: 'Pendiente', color: '#f59e0b', bg: '#f59e0b18' },
  activa:    { label: 'Activa',    color: '#22c55e', bg: '#22c55e18' },
  pausada:   { label: 'Pausada',   color: '#6b7280', bg: '#6b728018' },
  inactiva:  { label: 'Inactiva',  color: '#ef4444', bg: '#ef444418' },
};

const TIPO_ICON: Record<string, string> = {
  whatsapp_bot: '💬',
  n8n_workflow: '🔄',
  webhook:      '🪝',
  otro:         '⚙️',
};

const AREA_COLORS = ['#6c4de6', '#f59e0b', '#3b82f6', '#22c55e', '#ec4899', '#14b8a6'];

const EMPTY_FORM = {
  nombre: '', area: 'otro', descripcion: '', tipo: 'otro',
  trigger: '', accion: '', canal: '', webhook_url: '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid #6c4de6', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ErpPage() {
  const [tab, setTab] = useState<'areas' | 'automatizaciones'>('areas');

  // Areas
  const [areas, setAreas]       = useState<Area[]>([]);
  const [loadingA, setLoadingA] = useState(true);

  // Automatizaciones
  const [autos, setAutos]         = useState<Automatizacion[]>([]);
  const [loadingAut, setLoadingAut] = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ ...EMPTY_FORM });
  const [savingAut, setSavingAut] = useState(false);
  const [actionId, setActionId]   = useState<string | null>(null);

  const loadAreas = useCallback(async () => {
    setLoadingA(true);
    try {
      const data = await api.get<Area[]>('/erp/areas');
      setAreas(Array.isArray(data) ? data : []);
    } catch {
      setAreas([]);
    }
    setLoadingA(false);
  }, []);

  const loadAutos = useCallback(async () => {
    setLoadingAut(true);
    try {
      const data = await api.get<Automatizacion[]>('/erp/automatizaciones');
      setAutos(Array.isArray(data) ? data : []);
    } catch {
      setAutos([]);
    }
    setLoadingAut(false);
  }, []);

  useEffect(() => { loadAreas(); }, [loadAreas]);
  useEffect(() => { if (tab === 'automatizaciones') loadAutos(); }, [tab, loadAutos]);

  // Stats
  const areasActivas  = areas.filter(a => a.status === 'activa').length;
  const autosActivas  = autos.filter(a => a.status === 'activa').length;

  // Automatizaciones handlers
  async function handleCreateAuto() {
    if (!form.descripcion.trim()) return;
    setSavingAut(true);
    try {
      const nombre = form.nombre.trim() || form.descripcion.trim().slice(0, 80);
      await api.post('/erp/automatizaciones', {
        nombre, area: form.area, tipo: form.tipo,
        descripcion: form.descripcion.trim(),
        trigger: form.trigger || undefined,
        accion:  form.accion  || undefined,
        canal:   form.canal   || undefined,
        webhook_url: form.webhook_url || undefined,
      });
      setForm({ ...EMPTY_FORM });
      setShowForm(false);
      await loadAutos();
    } catch { }
    setSavingAut(false);
  }

  async function handleActivar(id: string) {
    setActionId(id);
    try {
      await api.post(`/erp/automatizaciones/${id}/activar`, {});
      setAutos(prev => prev.map(a => a.id === id ? { ...a, status: 'activa' } : a));
    } catch { }
    setActionId(null);
  }

  async function handlePausar(id: string) {
    setActionId(id);
    try {
      await api.post(`/erp/automatizaciones/${id}/pausar`, {});
      setAutos(prev => prev.map(a => a.id === id ? { ...a, status: 'pausada' } : a));
    } catch { }
    setActionId(null);
  }

  async function handleDeleteAuto(id: string) {
    if (!confirm('¿Eliminar esta automatización?')) return;
    setActionId(id);
    try {
      await api.delete(`/erp/automatizaciones/${id}`);
      setAutos(prev => prev.filter(a => a.id !== id));
    } catch { }
    setActionId(null);
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '22px 28px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#6c4de6,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={15} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)', margin: 0 }}>Sistema Operativo</h1>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>Áreas, SOPs y automatizaciones internas</p>
            </div>
          </div>
          <button
            onClick={tab === 'areas' ? loadAreas : loadAutos}
            style={btnGhost}
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          {[
            { icon: <Building2 size={13} />, label: 'Áreas activas',    value: areasActivas,  color: '#6c4de6' },
            { icon: <Zap size={13} />,       label: 'Automatizaciones', value: autosActivas,  color: '#22c55e' },
            { icon: <TrendingUp size={13} />,label: 'Total áreas',      value: areas.length,  color: '#3b82f6' },
            { icon: <BarChart3 size={13} />, label: 'Total autos',      value: autos.length,  color: '#f59e0b' },
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
        <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--line)' }}>
          {[
            { key: 'areas',           label: 'Áreas y SOPs' },
            { key: 'automatizaciones', label: 'Automatizaciones' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              style={{ padding: '8px 16px', fontSize: 13, fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? '#6c4de6' : 'var(--text-3)', borderBottom: tab === t.key ? '2px solid #6c4de6' : '2px solid transparent', background: 'none', border: 'none', cursor: 'pointer', marginBottom: -1 }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px 28px' }}>

        {/* ── ÁREAS TAB ── */}
        {tab === 'areas' && (
          <>
            {loadingA ? <Spinner /> : areas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: '#6c4de618', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Building2 size={28} style={{ color: '#6c4de6' }} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Sin áreas configuradas</p>
                <p style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 300, margin: '0 auto 20px', lineHeight: 1.55 }}>
                  Define las áreas de tu empresa (Ventas, Operaciones, Administración, RRHH) para organizar tus SOPs y KPIs internos.
                </p>
                <a href="/erp-areas" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#6c4de6', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}>
                  <Plus size={14} /> Configurar áreas
                </a>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {areas.map((area, i) => {
                  const color = area.color || AREA_COLORS[i % AREA_COLORS.length];
                  return (
                    <a
                      key={area.id}
                      href={`/erp-areas/${area.id}`}
                      style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 13, padding: 0, cursor: 'pointer', textAlign: 'left', overflow: 'hidden', textDecoration: 'none', display: 'block', transition: 'border-color 0.15s, transform 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color + '80'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                    >
                      <div style={{ height: 4, background: color }} />
                      <div style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Settings2 size={14} style={{ color }} />
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{area.nombre}</span>
                          </div>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: area.status === 'activa' ? '#22c55e18' : '#6b728018', color: area.status === 'activa' ? '#22c55e' : '#6b7280', fontWeight: 600 }}>
                            {area.status === 'activa' ? 'Activa' : area.status === 'revision' ? 'En revisión' : 'Inactiva'}
                          </span>
                        </div>
                        {area.descripcion && (
                          <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12, lineHeight: 1.5 }}>{area.descripcion}</p>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                          {area.responsable && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-3)' }}>
                              <Users size={11} />
                              {area.responsable}
                            </div>
                          )}
                          {area.sop_count !== undefined && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-3)', marginLeft: 'auto' }}>
                              <FileText size={11} />
                              {area.sop_count} SOP{area.sop_count !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                        {area.kpi_principal && (
                          <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 8 }}>
                            <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 2 }}>{area.kpi_principal}</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color, letterSpacing: '-0.02em' }}>{area.kpi_valor ?? '—'}</div>
                          </div>
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── AUTOMATIZACIONES TAB ── */}
        {tab === 'automatizaciones' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Compose */}
            <div style={{ background: 'var(--surface)', border: showForm ? '1px solid #6c4de660' : '1px solid var(--line)', borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s' }}>
              {!showForm ? (
                <button onClick={() => setShowForm(true)} style={{ width: '100%', padding: '16px 20px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#6c4de618', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={15} color="#6c4de6" />
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Describe la automatización interna que quieres crear…</span>
                </button>
              ) : (
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Nueva automatización interna</span>
                    <button onClick={() => { setShowForm(false); setForm({ ...EMPTY_FORM }); }} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 2 }}><X size={14} /></button>
                  </div>
                  <textarea
                    autoFocus value={form.descripcion}
                    onChange={e => setForm({ ...form, descripcion: e.target.value, nombre: e.target.value.split('\n')[0].slice(0, 80) })}
                    placeholder="Ej: Al crear un nuevo empleado, enviar email de bienvenida y asignar onboarding."
                    rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55, fontSize: 13 }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                    <button onClick={() => { setShowForm(false); setForm({ ...EMPTY_FORM }); }} style={btnGhost}>Cancelar</button>
                    <button onClick={handleCreateAuto} disabled={savingAut || !form.descripcion.trim()} style={{ ...btnPrimary, opacity: savingAut || !form.descripcion.trim() ? 0.5 : 1 }}>
                      {savingAut ? '…' : <><Check size={12} /> Guardar</>}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* List */}
            {loadingAut ? <Spinner /> : autos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
                <p style={{ fontSize: 14, color: 'var(--text-2)', fontWeight: 600 }}>Sin automatizaciones internas</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>Crea flujos automáticos para tu operación interna</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {autos.map(a => {
                  const sc   = STATUS_AUTO[a.status] ?? STATUS_AUTO.pendiente;
                  const busy = actionId === a.id;
                  return (
                    <div key={a.id} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${sc.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                        {TIPO_ICON[a.tipo] ?? '⚙️'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{a.nombre}</span>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: sc.bg, color: sc.color, fontWeight: 700, border: `1px solid ${sc.color}40` }}>{sc.label}</span>
                        </div>
                        {a.descripcion && <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55, margin: '0 0 4px' }}>{a.descripcion}</p>}
                        <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Área: {a.area}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                        {a.status !== 'activa' ? (
                          <button onClick={() => handleActivar(a.id)} disabled={busy} title="Activar" style={{ ...btnIconGreen, opacity: busy ? 0.5 : 1 }}><Play size={12} /></button>
                        ) : (
                          <button onClick={() => handlePausar(a.id)} disabled={busy} title="Pausar" style={{ ...btnIconGray, opacity: busy ? 0.5 : 1 }}><Pause size={12} /></button>
                        )}
                        <button onClick={() => handleDeleteAuto(a.id)} disabled={busy} title="Eliminar" style={{ ...btnIconRed, opacity: busy ? 0.5 : 1 }}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const btnGhost: React.CSSProperties    = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontSize: 13 };
const btnPrimary: React.CSSProperties  = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: 'none', background: '#6c4de6', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const inputStyle: React.CSSProperties  = { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' };
const btnIconGreen: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: '1px solid #22c55e40', background: '#22c55e18', color: '#22c55e', cursor: 'pointer' };
const btnIconGray: React.CSSProperties  = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--text-3)', cursor: 'pointer' };
const btnIconRed: React.CSSProperties   = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: '1px solid #ef444440', background: '#ef444418', color: '#ef4444', cursor: 'pointer' };
