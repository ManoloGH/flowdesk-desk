'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Users, Bot, Plus, Search, X, ChevronRight, ChevronLeft,
  Monitor, Smartphone, Crown, UserCog, User, Truck, CheckCircle2,
  Loader2, Copy, Check,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Slot {
  id: string;
  name: string;
  email: string | null;
  role: string;
  type: 'HUMAN' | 'AI_AGENT';
  status: string;
  agent_config?: Record<string, any>;
  department?: { name: string; color: string } | null;
  whatsapp_phone?: string | null;
}

interface Dept { id: string; name: string; color: string; }

type WorkerType = 'desk' | 'operative';
type HierarchyRole = 'employee' | 'manager' | 'admin';

interface WizardState {
  step: 1 | 2 | 3 | 4;
  name: string;
  email: string;
  department_id: string;
  whatsapp_phone: string;
  worker_type: WorkerType | null;
  role: HierarchyRole | null;
  reports_to_id: string;
}

const INIT: WizardState = {
  step: 1, name: '', email: '', department_id: '', whatsapp_phone: '',
  worker_type: null, role: null, reports_to_id: '',
};

const WORKER_LABELS: Record<WorkerType, string> = {
  desk: 'Escritorio / Oficina',
  operative: 'Campo / Operativo',
};
const ROLE_ICON: Record<HierarchyRole, typeof User> = {
  employee: User,
  manager: UserCog,
  admin: Crown,
};
const ROLE_LABEL: Record<HierarchyRole, string> = {
  employee: 'Empleado',
  manager: 'Gerente',
  admin: 'Director',
};
const WORKER_TYPE_LABEL: Record<string, string> = {
  desk: 'Escritorio',
  operative: 'Operativo',
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const [slots,   setSlots]   = useState<Slot[]>([]);
  const [depts,   setDepts]   = useState<Dept[]>([]);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState<'all' | 'HUMAN' | 'AI_AGENT'>('all');
  const [loading, setLoading] = useState(true);

  const [showWizard, setShowWizard]   = useState(false);
  const [wizard,     setWizard]       = useState<WizardState>(INIT);
  const [saving,     setSaving]       = useState(false);
  const [result,     setResult]       = useState<{ temp_password: string; name: string; worker_type: string } | null>(null);
  const [copied,     setCopied]       = useState(false);

  const loadSlots = () => {
    api.get<Slot[]>('/team-slots').then(data => {
      setSlots(Array.isArray(data) ? data : (data as any)?.data ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadSlots();
    api.get<Dept[]>('/departments').then(d => setDepts(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const filtered = slots.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.email ?? '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || s.type === filter;
    return matchSearch && matchFilter;
  });

  const humans  = slots.filter(s => s.type === 'HUMAN').length;
  const agents  = slots.filter(s => s.type === 'AI_AGENT').length;
  const managers = slots.filter(s => s.type === 'HUMAN' && ['manager', 'admin', 'owner'].includes(s.role));

  // ── Wizard helpers ────────────────────────────────────────────────────────

  const set = (patch: Partial<WizardState>) => setWizard(prev => ({ ...prev, ...patch }));

  const canAdvance = () => {
    if (wizard.step === 1) return wizard.name.trim().length >= 2 && wizard.email.includes('@');
    if (wizard.step === 2) return wizard.worker_type !== null && wizard.whatsapp_phone.trim().length >= 8;
    if (wizard.step === 3) return wizard.role !== null;
    return false;
  };

  const next = () => {
    if (!canAdvance()) return;
    if (wizard.step === 2 && wizard.worker_type === 'operative') {
      // Operativo no necesita jerarquía — ir directo a confirmar
      set({ step: 4 });
    } else {
      set({ step: (wizard.step + 1) as any });
    }
  };

  const back = () => {
    if (wizard.step === 4 && wizard.worker_type === 'operative') {
      set({ step: 2 });
    } else {
      set({ step: (wizard.step - 1) as any });
    }
  };

  const submit = async () => {
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        name: wizard.name,
        email: wizard.email,
        department_id: wizard.department_id || undefined,
        whatsapp_phone: wizard.whatsapp_phone || undefined,
        worker_type: wizard.worker_type,
        role: wizard.role ?? 'employee',
        reports_to_id: wizard.reports_to_id || undefined,
      };
      const res = await api.post<{ slot: any; temp_password: string; worker_type: string }>(
        '/team-slots/human', payload
      );
      setResult({ temp_password: res.temp_password, name: wizard.name, worker_type: res.worker_type });
      loadSlots();
    } catch (e: any) {
      alert(e?.message ?? 'Error al crear el usuario');
    }
    setSaving(false);
  };

  const closeWizard = () => {
    setShowWizard(false);
    setWizard(INIT);
    setResult(null);
    setCopied(false);
  };

  const copyPassword = () => {
    if (result) {
      navigator.clipboard.writeText(result.temp_password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '32px', fontFamily: "'Inter Tight', sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em' }}>Equipo</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>{humans} personas · {agents} agentes IA</p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--fd-cyan)', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter Tight', sans-serif" }}
        >
          <Plus size={14} /> Añadir persona
        </button>
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 9, padding: '8px 12px 8px 32px', fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter Tight', sans-serif" }}
          />
        </div>
        {(['all', 'HUMAN', 'AI_AGENT'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid var(--line)', background: filter === f ? 'var(--fd-cyan)' : 'var(--surface)', color: filter === f ? 'white' : 'var(--text-2)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter Tight', sans-serif", transition: 'all 0.15s' }}>
            {f === 'all' ? 'Todos' : f === 'HUMAN' ? 'Personas' : 'Agentes IA'}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160 }}>
          <Loader2 size={24} style={{ color: 'var(--fd-cyan)', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                {['Nombre', 'Tipo', 'Nivel', 'Canal', 'Workspace', 'Estado'].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontSize: 10, fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 16px', fontFamily: "'JetBrains Mono', monospace" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(slot => {
                const workerType = slot.agent_config?.worker_type as string | undefined;
                return (
                  <tr key={slot.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: slot.type === 'HUMAN' ? 'var(--fd-blue)' : 'rgba(139,92,246,0.2)', color: slot.type === 'HUMAN' ? 'white' : '#a78bfa' }}>
                          {slot.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{slot.name}</p>
                          {slot.email && <p style={{ margin: 0, fontSize: 11, color: 'var(--text-3)' }}>{slot.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        {slot.type === 'HUMAN' ? <Users size={12} style={{ color: 'var(--fd-cyan)' }} /> : <Bot size={12} style={{ color: '#a78bfa' }} />}
                        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{slot.type === 'HUMAN' ? 'Persona' : 'Agente IA'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'capitalize' }}>
                        {slot.type === 'HUMAN' ? (ROLE_LABEL[slot.role as HierarchyRole] ?? slot.role) : '—'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {slot.type === 'HUMAN' && workerType ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {workerType === 'operative' ? <Smartphone size={11} style={{ color: '#10b981' }} /> : <Monitor size={11} style={{ color: 'var(--fd-blue)' }} />}
                          <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{WORKER_TYPE_LABEL[workerType] ?? workerType}</span>
                        </div>
                      ) : <span style={{ fontSize: 11, color: 'var(--text-3)' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {slot.department ? (
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: `${slot.department.color}20`, color: slot.department.color }}>
                          {slot.department.name}
                        </span>
                      ) : <span style={{ fontSize: 11, color: 'var(--text-3)' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '3px 8px', borderRadius: 20, background: slot.status === 'ONLINE' ? 'rgba(16,185,129,0.15)' : 'var(--surface-2)', color: slot.status === 'ONLINE' ? '#10b981' : 'var(--text-3)' }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: slot.status === 'ONLINE' ? '#10b981' : 'var(--text-3)' }} />
                        {slot.status === 'ONLINE' ? 'Online' : 'Offline'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                    No hay resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ══ WIZARD MODAL ══ */}
      {showWizard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 16, width: '100%', maxWidth: 480, padding: 28, position: 'relative' }}>

            {/* Close */}
            <button onClick={closeWizard} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
              <X size={18} />
            </button>

            {result ? (
              /* ── Resultado ── */
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle2 size={24} style={{ color: '#10b981' }} />
                </div>
                <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>{result.name} fue añadido</h2>
                <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--text-3)' }}>
                  {result.worker_type === 'operative'
                    ? 'Operativo configurado. Puede reportar su cédula diaria por WhatsApp.'
                    : 'Su asistente personal fue creado automáticamente. Puede acceder a FlowDesk y a su asistente por WhatsApp.'}
                </p>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
                  <p style={{ margin: '0 0 6px', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contraseña temporal</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: 'var(--fd-cyan)', letterSpacing: '0.1em' }}>{result.temp_password}</code>
                    <button onClick={copyPassword} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#10b981' : 'var(--text-3)', fontSize: 12, fontFamily: "'Inter Tight', sans-serif" }}>
                      {copied ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
                    </button>
                  </div>
                </div>
                <p style={{ margin: '0 0 20px', fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic' }}>
                  Solo se muestra una vez. Compártela directamente con el empleado.
                </p>
                <button onClick={closeWizard} style={{ width: '100%', padding: '10px', background: 'var(--fd-cyan)', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter Tight', sans-serif" }}>
                  Listo
                </button>
              </div>
            ) : (
              <>
                {/* Progress */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
                  {([1, 2, 3] as const).map(s => {
                    const steps = wizard.worker_type === 'operative' ? [1, 2] : [1, 2, 3];
                    const active = wizard.step >= s;
                    return (
                      <div key={s} style={{ flex: 1, height: 3, borderRadius: 3, background: active ? 'var(--fd-cyan)' : 'var(--line)', transition: 'background 0.2s' }} />
                    );
                  })}
                </div>

                {/* Step 1 — Basic info */}
                {wizard.step === 1 && (
                  <div>
                    <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>Datos básicos</h2>
                    <p style={{ margin: '0 0 20px', fontSize: 12, color: 'var(--text-3)' }}>Paso 1 de {wizard.worker_type === 'operative' ? 2 : 3}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {[
                        { label: 'Nombre completo', key: 'name', type: 'text', placeholder: 'Ana García López' },
                        { label: 'Email corporativo', key: 'email', type: 'email', placeholder: 'ana@empresa.com' },
                      ].map(f => (
                        <div key={f.key}>
                          <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>{f.label}</label>
                          <input
                            type={f.type}
                            placeholder={f.placeholder}
                            value={(wizard as any)[f.key]}
                            onChange={e => set({ [f.key]: e.target.value } as any)}
                            style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter Tight', sans-serif" }}
                          />
                        </div>
                      ))}
                      <div>
                        <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Workspace (opcional)</label>
                        <select
                          value={wizard.department_id}
                          onChange={e => set({ department_id: e.target.value })}
                          style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text)', outline: 'none', fontFamily: "'Inter Tight', sans-serif" }}
                        >
                          <option value="">Sin workspace</option>
                          {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2 — Worker type + WhatsApp */}
                {wizard.step === 2 && (
                  <div>
                    <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>Tipo de trabajo</h2>
                    <p style={{ margin: '0 0 20px', fontSize: 12, color: 'var(--text-3)' }}>¿Cómo trabaja {wizard.name.split(' ')[0]}?</p>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                      {([
                        { value: 'desk', icon: Monitor, title: 'Escritorio / Oficina', desc: 'Usa la app en computadora. Tiene asistente personal (también por WhatsApp).' },
                        { value: 'operative', icon: Truck, title: 'Campo / Operativo', desc: 'Solo reporta resultados por WhatsApp. No accede a la app.' },
                      ] as const).map(opt => {
                        const Icon = opt.icon;
                        const selected = wizard.worker_type === opt.value;
                        return (
                          <button key={opt.value} onClick={() => set({ worker_type: opt.value })} style={{ flex: 1, padding: '14px 12px', borderRadius: 12, border: `2px solid ${selected ? 'var(--fd-cyan)' : 'var(--line)'}`, background: selected ? 'rgba(0,180,216,0.08)' : 'var(--surface)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                            <Icon size={18} style={{ color: selected ? 'var(--fd-cyan)' : 'var(--text-3)', marginBottom: 8 }} />
                            <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: selected ? 'var(--text)' : 'var(--text-2)', fontFamily: "'Inter Tight', sans-serif" }}>{opt.title}</p>
                            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4, fontFamily: "'Inter Tight', sans-serif" }}>{opt.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                    <div>
                      <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>
                        WhatsApp {wizard.worker_type === 'operative' ? '(requerido para recibir la cédula)' : '(para el asistente en móvil)'}
                      </label>
                      <input
                        type="tel"
                        placeholder="5215512345678 (solo dígitos, sin +)"
                        value={wizard.whatsapp_phone}
                        onChange={e => set({ whatsapp_phone: e.target.value.replace(/\D/g, '') })}
                        style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box', fontFamily: "'JetBrains Mono', monospace" }}
                      />
                    </div>
                  </div>
                )}

                {/* Step 3 — Hierarchy (desk only) */}
                {wizard.step === 3 && (
                  <div>
                    <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>Jerarquía</h2>
                    <p style={{ margin: '0 0 20px', fontSize: 12, color: 'var(--text-3)' }}>¿Cuál es el nivel de {wizard.name.split(' ')[0]} en la empresa?</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                      {([
                        { value: 'employee', title: 'Empleado', desc: 'Gestiona sus propias tareas y objetivos. Asistente personal en WhatsApp y app.', note: 'Asistente Empleado' },
                        { value: 'manager',  title: 'Gerente',  desc: 'Tiene personas a su cargo. Ve el estado de su equipo y coordina actividades.', note: 'Asistente Gerente' },
                        { value: 'admin',    title: 'Director', desc: 'Supervisión de múltiples equipos. Salud organizacional y KSFs estratégicos.', note: 'Asistente Director' },
                      ] as const).map(opt => {
                        const Icon = ROLE_ICON[opt.value];
                        const selected = wizard.role === opt.value;
                        return (
                          <button key={opt.value} onClick={() => set({ role: opt.value })} style={{ padding: '12px 14px', borderRadius: 12, border: `2px solid ${selected ? 'var(--fd-cyan)' : 'var(--line)'}`, background: selected ? 'rgba(0,180,216,0.08)' : 'var(--surface)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 12, transition: 'all 0.15s' }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: selected ? 'rgba(0,180,216,0.2)' : 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Icon size={15} style={{ color: selected ? 'var(--fd-cyan)' : 'var(--text-3)' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: selected ? 'var(--text)' : 'var(--text-2)', fontFamily: "'Inter Tight', sans-serif" }}>{opt.title}</p>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--fd-cyan)', background: 'rgba(0,180,216,0.1)', padding: '2px 6px', borderRadius: 4 }}>{opt.note}</span>
                              </div>
                              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4, fontFamily: "'Inter Tight', sans-serif" }}>{opt.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {['manager', 'admin'].includes(wizard.role ?? '') && (
                      <div>
                        <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Reporta a (opcional)</label>
                        <select value={wizard.reports_to_id} onChange={e => set({ reports_to_id: e.target.value })} style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text)', outline: 'none', fontFamily: "'Inter Tight', sans-serif" }}>
                          <option value="">— Sin gerente asignado —</option>
                          {managers.filter(m => m.role === 'admin' || m.role === 'owner').map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation */}
                <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                  {wizard.step > 1 && (
                    <button onClick={back} style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, padding: '10px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, color: 'var(--text-2)', fontSize: 13, cursor: 'pointer', justifyContent: 'center', fontFamily: "'Inter Tight', sans-serif" }}>
                      <ChevronLeft size={14} /> Atrás
                    </button>
                  )}
                  {wizard.step < (wizard.worker_type === 'operative' ? 2 : 3) ? (
                    <button onClick={next} disabled={!canAdvance()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '10px', background: canAdvance() ? 'var(--fd-cyan)' : 'var(--surface)', border: 'none', borderRadius: 10, color: canAdvance() ? 'white' : 'var(--text-3)', fontSize: 13, fontWeight: 600, cursor: canAdvance() ? 'pointer' : 'not-allowed', fontFamily: "'Inter Tight', sans-serif", transition: 'all 0.15s' }}>
                      Siguiente <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button onClick={submit} disabled={saving || !canAdvance()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', background: 'var(--fd-cyan)', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', fontFamily: "'Inter Tight', sans-serif" }}>
                      {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creando...</> : '✓ Crear usuario'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
