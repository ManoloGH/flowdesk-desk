'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ArrowLeft, Send, Bot, User, Loader2, FileText, Plus, Trash2,
  ChevronRight, ChevronDown, Copy, Check, ExternalLink,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CheckItem { id: string; check_id: string; phase: number; checked: boolean; }
interface Note      { id: string; phase: number; content: string; created_at: string; }
interface Message   { id: string; role: 'user' | 'assistant'; content: string; created_at: string; }
interface Impl {
  id: string; client_name: string; phase: number; status: string;
  client_info: any; check_items: CheckItem[]; notes: Note[]; messages: Message[];
}

// ─── Protocol data ───────────────────────────────────────────────────────────

const PHASES = [
  { id: 0, label: 'Diagnóstico',          time: '2–3 sesiones' },
  { id: 1, label: 'Diseño ecosistema',    time: '1 sesión' },
  { id: 2, label: 'Provisioning técnico', time: '45 min' },
  { id: 3, label: 'Equipo humano',        time: '60–90 min' },
  { id: 4, label: 'Agentes IA',           time: '60–90 min' },
  { id: 5, label: 'Verificación',         time: '30–45 min' },
  { id: 6, label: 'Entrega',              time: '60 min' },
];

const TOOLS: Record<number, { icon: string; label: string; href: string }[]> = {
  0: [
    { icon: '📋', label: 'Onboarding Form',     href: '/flowdesk/onboarding/onboarding-form.html' },
    { icon: '✅', label: 'Checklist cliente',   href: '/flowdesk/diagnosticos/checklist-cliente.html' },
    { icon: '🎙️', label: 'Entrevista 1',        href: '/flowdesk/diagnosticos/guia-entrevista-1.html' },
    { icon: '📊', label: 'Diagnóstico Ventas',  href: '/flowdesk/diagnosticos/diagnostico-ventas.html' },
    { icon: '📣', label: 'Diag. Marketing',     href: '/flowdesk/diagnosticos/diagnostico-marketing.html' },
    { icon: '⚙️', label: 'Diag. Operaciones',  href: '/flowdesk/diagnosticos/diagnostico-operaciones.html' },
    { icon: '🏢', label: 'Diag. Administración', href: '/flowdesk/diagnosticos/diagnostico-administracion.html' },
    { icon: '🎯', label: 'Diag. Entrega Valor', href: '/flowdesk/diagnosticos/diagnostico-entrega-servicio.html' },
    { icon: '🎙️', label: 'Entrevista 2',        href: '/flowdesk/diagnosticos/guia-entrevista-2.html' },
    { icon: '🔍', label: 'Gaps Form',           href: '/flowdesk/diagnosticos/gaps-form.html' },
    { icon: '🎯', label: 'Matriz de impacto',   href: '/flowdesk/diagnosticos/matriz-impacto.html' },
  ],
  1: [
    { icon: '🗂️', label: 'Organigrama',         href: '/flowdesk/organigrama.html' },
    { icon: '👁️', label: 'Visualizador',        href: '/flowdesk/diagnosticos/visualizador.html' },
    { icon: '🤖', label: 'Manual de agentes',   href: '/flowdesk/manual-agentes.html' },
  ],
  2: [],
  3: [
    { icon: '👥', label: 'Manual empleados',    href: '/flowdesk/manual-sistema-empleados.html' },
  ],
  4: [
    { icon: '🤖', label: 'Manual de agentes',   href: '/flowdesk/manual-agentes.html' },
    { icon: '💰', label: 'Blueprint Ventas',    href: '/flowdesk/agentes/agente-ventas.md' },
    { icon: '📣', label: 'Blueprint Marketing', href: '/flowdesk/agentes/agente-marketing.md' },
    { icon: '⚙️', label: 'Blueprint Ops',       href: '/flowdesk/agentes/agente-operaciones.md' },
    { icon: '🏢', label: 'Blueprint Admin',     href: '/flowdesk/agentes/agente-administracion.md' },
  ],
  5: [],
  6: [
    { icon: '🤖', label: 'Sensei',             href: '/flowdesk/agentes/sensei.md' },
  ],
};

const CHECKLISTS: Record<number, { id: string; text: string; sub?: string }[]> = {
  0: [
    { id: 'c0_1', text: 'Onboarding form completado', sub: 'Nombre, industria, tamaño, departamentos' },
    { id: 'c0_2', text: 'Entrevista 1 realizada y documentada' },
    { id: 'c0_3', text: 'Diagnósticos por área completados', sub: 'Ventas, Marketing, Ops, Admin, Entrega' },
    { id: 'c0_4', text: 'Entrevista 2 de validación realizada' },
    { id: 'c0_5', text: 'Gaps Form completado' },
    { id: 'c0_6', text: 'Matriz de impacto construida y prioridades definidas' },
    { id: 'c0_7', text: 'Cliente validó el diagnóstico' },
  ],
  1: [
    { id: 'c1_1', text: 'Personas clasificadas por nivel', sub: 'Director, Gerente, Empleado, Operativo' },
    { id: 'c1_2', text: 'Organigrama digital creado' },
    { id: 'c1_3', text: 'Agentes de área definidos según gaps' },
    { id: 'c1_4', text: 'Cliente aprobó el blueprint' },
    { id: 'c1_5', text: 'Número de WhatsApp Business confirmado' },
  ],
  2: [
    { id: 'c2_1', text: 'Tenant creado y activo en FlowDesk' },
    { id: 'c2_2', text: 'Owner slot tiene CEO Agent y Asistente Diario' },
    { id: 'c2_3', text: 'Instancia Evolution API creada y WhatsApp conectado' },
    { id: 'c2_4', text: 'Integración registrada en FlowDesk' },
    { id: 'c2_5', text: 'Secretario del dueño configurado' },
    { id: 'c2_6', text: 'Prueba del dueño exitosa' },
  ],
  3: [
    { id: 'c3_1', text: 'Todos los usuarios creados con el wizard' },
    { id: 'c3_2', text: 'Contraseñas temporales guardadas y entregadas' },
    { id: 'c3_3', text: 'Mensajes de bienvenida enviados a Directores/Gerentes' },
    { id: 'c3_4', text: 'Mensajes de bienvenida enviados a Empleados' },
    { id: 'c3_5', text: 'Mensajes de bienvenida enviados a Operativos' },
    { id: 'c3_6', text: 'Al menos un empleado probó su asistente' },
    { id: 'c3_7', text: 'Al menos un operativo completó la cédula de prueba' },
  ],
  4: [
    { id: 'c4_1', text: 'Agentes de área prioritarios creados' },
    { id: 'c4_2', text: 'System prompts revisados con el gerente del área' },
    { id: 'c4_3', text: 'Prueba en vivo con cada agente — cliente participó' },
    { id: 'c4_4', text: 'Ajustes post-prueba aplicados' },
    { id: 'c4_5', text: 'Gerentes saben cómo usar los agentes de su workspace' },
  ],
  5: [
    { id: 'c5_1', text: 'Flujo operativo verificado de extremo a extremo' },
    { id: 'c5_2', text: 'Flujo empleado verificado' },
    { id: 'c5_3', text: 'Flujo gerente verificado' },
    { id: 'c5_4', text: 'Flujo dueño verificado' },
    { id: 'c5_5', text: 'Flujo cliente externo → Chatwoot (no activa asistentes)' },
    { id: 'c5_6', text: 'Todos los agentes de área probados' },
  ],
  6: [
    { id: 'c6_1', text: 'Sesión de entrega realizada con el dueño' },
    { id: 'c6_2', text: 'Mensaje de cierre enviado por WhatsApp' },
    { id: 'c6_3', text: 'Dueño sabe cómo agregar nuevos empleados' },
    { id: 'c6_4', text: 'Gerentes saben revisar reportes de su equipo' },
    { id: 'c6_5', text: 'Tenant registrado en el radar de Sensei' },
    { id: 'c6_6', text: 'Revisión de 30 días agendada' },
  ],
};

const WA_TEMPLATES: Record<number, { role: string; color: string; text: string }[]> = {
  3: [
    {
      role: 'Director / Owner', color: '#7c3aed',
      text: `Hola [NOMBRE] 👋\n\nTe doy la bienvenida a *FlowDesk*. Soy tu secretario ejecutivo personal.\n\nPuedo ayudarte con:\n📋 Estado de tus equipos\n✅ Aprobaciones pendientes\n📊 Resumen de indicadores\n\nEscríbeme cuando quieras. ¿Qué quieres revisar primero hoy?`,
    },
    {
      role: 'Gerente', color: '#3b82f6',
      text: `Hola [NOMBRE] 👋\n\nSoy tu asistente en *FlowDesk*. Te ayudo a coordinar tu día y tu equipo.\n\nAccede a la app: *app.flowdesk.io*\nUsuario: *[EMAIL]* · Contraseña: *[PASSWORD]*\n\nEscríbeme cuando quieras empezar 🚀`,
    },
    {
      role: 'Empleado', color: '#22c55e',
      text: `Hola [NOMBRE] 👋\n\nSoy tu asistente en *FlowDesk*. Estoy aquí para ayudarte a organizar tu trabajo.\n\n🌐 *app.flowdesk.io*\n👤 *[EMAIL]* · 🔑 *[PASSWORD]*\n\n¿Qué tienes pendiente hoy?`,
    },
    {
      role: 'Operativo', color: '#f59e0b',
      text: `Hola [NOMBRE] 👋\n\nA partir de hoy reportas tus actividades por aquí. Al terminar tu turno escribe *reporte* y te haré 3 preguntas.\n\nPruébalo ahora: escribe *reporte* 👇`,
    },
  ],
  6: [
    {
      role: 'Mensaje de cierre al dueño', color: '#00d4ff',
      text: `✅ *Tu ecosistema FlowDesk está activo*\n\n👥 *Equipo:* [N] personas activas\n🤖 *Agentes:* [N] agentes de área funcionando\n📱 *WhatsApp:* [NÚMERO]\n\n🌐 app.flowdesk.io\n\n¡Bienvenido al equipo FlowDesk! 🚀`,
    },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function MarkdownText({ text }: { text: string }) {
  const html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:12px">$1</code>')
    .replace(/\n/g, '<br/>');
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ImplWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [impl, setImpl] = useState<Impl | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhase, setActivePhase] = useState(0);

  // Chat
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Notes
  const [noteInput, setNoteInput] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  // Copies
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Script expand
  const [scriptOpen, setScriptOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<Impl>(`/implementations/${id}`);
      setImpl(data);
      setActivePhase(data.phase);
      setLocalMessages(data.messages ?? []);
    } catch {}
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  // ── Checks ────────────────────────────────────────────────────────────────

  const toggleCheck = async (checkId: string, phase: number, currentlyChecked: boolean) => {
    if (!impl) return;
    const newChecked = !currentlyChecked;
    setImpl(prev => {
      if (!prev) return prev;
      const existing = prev.check_items.find(c => c.check_id === checkId);
      if (existing) {
        return { ...prev, check_items: prev.check_items.map(c => c.check_id === checkId ? { ...c, checked: newChecked } : c) };
      }
      return { ...prev, check_items: [...prev.check_items, { id: checkId, check_id: checkId, phase, checked: newChecked }] };
    });
    try {
      await api.post(`/implementations/${id}/checks`, { check_id: checkId, phase, checked: newChecked });
    } catch {}
  };

  // ── Phase progress ────────────────────────────────────────────────────────

  const completePhase = async (phaseId: number) => {
    if (!impl) return;
    const nextPhase = phaseId + 1;
    const isLast = phaseId === 6;
    try {
      await api.patch(`/implementations/${id}`, isLast ? { status: 'completed', phase: phaseId } : { phase: nextPhase });
      setImpl(prev => prev ? { ...prev, phase: isLast ? prev.phase : nextPhase, status: isLast ? 'completed' : prev.status } : prev);
      if (!isLast) setActivePhase(nextPhase);
    } catch {}
  };

  // ── Notes ────────────────────────────────────────────────────────────────

  const addNote = async () => {
    if (!noteInput.trim() || noteLoading) return;
    setNoteLoading(true);
    try {
      const note = await api.post<Note>(`/implementations/${id}/notes`, { phase: activePhase, content: noteInput.trim() });
      setImpl(prev => prev ? { ...prev, notes: [...prev.notes, note] } : prev);
      setNoteInput('');
    } catch {}
    setNoteLoading(false);
  };

  const deleteNote = async (noteId: string) => {
    try {
      await api.delete(`/implementations/${id}/notes/${noteId}`);
      setImpl(prev => prev ? { ...prev, notes: prev.notes.filter(n => n.id !== noteId) } : prev);
    } catch {}
  };

  // ── Chat ─────────────────────────────────────────────────────────────────

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput('');
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg, created_at: new Date().toISOString() };
    setLocalMessages(prev => [...prev, userMsg]);
    setChatLoading(true);
    try {
      const { reply } = await api.post<{ reply: string }>(`/implementations/${id}/chat`, { message: msg });
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: reply, created_at: new Date().toISOString() };
      setLocalMessages(prev => [...prev, aiMsg]);
    } catch {
      setLocalMessages(prev => [...prev, { id: 'err', role: 'assistant', content: 'Error de conexión. Intenta de nuevo.', created_at: '' }]);
    }
    setChatLoading(false);
  };

  // ── Copy ─────────────────────────────────────────────────────────────────

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Progress ─────────────────────────────────────────────────────────────

  const totalItems = Object.values(CHECKLISTS).flat().length;
  const checkedItems = impl?.check_items.filter(c => c.checked).length ?? 0;
  const phasePct = Math.round((checkedItems / totalItems) * 100);

  const phaseChecks = CHECKLISTS[activePhase] ?? [];
  const checkedInPhase = phaseChecks.filter(item => impl?.check_items.find(c => c.check_id === item.id && c.checked)).length;
  const allPhaseChecked = checkedInPhase === phaseChecks.length;

  const phaseNotes = impl?.notes.filter(n => n.phase === activePhase) ?? [];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <Loader2 size={28} style={{ color: 'var(--fd-cyan)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!impl) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-2)' }}>Implementación no encontrada.</p>
        <button onClick={() => router.push('/implementaciones')} style={{ marginTop: 16, color: 'var(--fd-cyan)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>← Volver</button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 24px', borderBottom: '1px solid var(--line)', background: 'var(--surface)', flexShrink: 0 }}>
        <button onClick={() => router.push('/implementaciones')} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: "'Inter', sans-serif" }}>
          <ArrowLeft size={13} /> Implementaciones
        </button>
        <span style={{ color: 'var(--line2)' }}>›</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{impl.client_name}</span>
        {impl.client_info?.industry && (
          <span style={{ fontSize: 11, color: 'var(--text-3)', background: 'var(--surface2)', padding: '2px 8px', borderRadius: 20 }}>{impl.client_info.industry}</span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 120, height: 4, background: 'var(--surface3)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${phasePct}%`, background: 'linear-gradient(90deg, var(--fd-blue), var(--fd-cyan))', borderRadius: 4, transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--fd-cyan)', fontWeight: 700 }}>{phasePct}%</span>
          </div>
          <span style={{ fontSize: 11, color: impl.status === 'completed' ? '#22c55e' : 'var(--text-3)', fontWeight: 600 }}>
            {impl.status === 'completed' ? '✓ Completado' : `Fase ${impl.phase}/6`}
          </span>
        </div>
      </div>

      {/* ── Body: phases + chat ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left: Phase nav + content ── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Phase nav */}
          <div style={{ width: 180, flexShrink: 0, borderRight: '1px solid var(--line)', background: 'var(--surface)', overflowY: 'auto', padding: '16px 0' }}>
            {PHASES.map(p => {
              const isDone = p.id < impl.phase || impl.status === 'completed';
              const isActive = p.id === activePhase;
              return (
                <div
                  key={p.id}
                  onClick={() => setActivePhase(p.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px',
                    cursor: 'pointer', borderLeft: `2px solid ${isActive ? 'var(--fd-cyan)' : 'transparent'}`,
                    background: isActive ? 'rgba(0,212,255,0.05)' : 'transparent',
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, flexShrink: 0,
                    background: isDone ? '#22c55e' : isActive ? 'var(--fd-cyan)' : 'var(--surface3)',
                    color: (isDone || isActive) ? '#000' : 'var(--text-3)',
                  }}>
                    {isDone ? '✓' : p.id}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--text)' : 'var(--text-2)', lineHeight: 1.3 }}>{p.label}</p>
                    <p style={{ margin: 0, fontSize: 9, color: 'var(--text-3)', fontFamily: "'JetBrains Mono', monospace" }}>{p.time}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Phase content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              Fase {activePhase} — {PHASES[activePhase]?.label}
            </h2>

            {/* Tools */}
            {(TOOLS[activePhase]?.length ?? 0) > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ margin: '0 0 10px', fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>Herramientas</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {TOOLS[activePhase].map(t => (
                    <a key={t.label} href={t.href} target="_blank" rel="noreferrer" style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px',
                      background: 'var(--surface2)', border: '1px solid var(--line2)', borderRadius: 8,
                      textDecoration: 'none', color: 'var(--text-2)', fontSize: 11, fontWeight: 500, transition: 'all 0.15s',
                    }}>
                      <span>{t.icon}</span>{t.label}<ExternalLink size={9} style={{ opacity: 0.5 }} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* WA Templates */}
            {(WA_TEMPLATES[activePhase]?.length ?? 0) > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ margin: '0 0 10px', fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>Plantillas WhatsApp</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {WA_TEMPLATES[activePhase].map((t, i) => (
                    <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface2)' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: `${t.color}20`, color: t.color }}>{t.role}</span>
                        <button
                          onClick={() => copyText(t.text, `wa_${i}`)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 11, fontFamily: "'Inter', sans-serif" }}
                        >
                          {copiedId === `wa_${i}` ? <Check size={11} style={{ color: '#22c55e' }} /> : <Copy size={11} />}
                          {copiedId === `wa_${i}` ? 'Copiado' : 'Copiar'}
                        </button>
                      </div>
                      <pre style={{ margin: 0, padding: '10px 12px', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: "'Inter', sans-serif" }}>{t.text}</pre>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Checklist */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <p style={{ margin: 0, fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>
                  Checklist de salida · {checkedInPhase}/{phaseChecks.length}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {phaseChecks.map(item => {
                  const isChecked = !!impl.check_items.find(c => c.check_id === item.id && c.checked);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleCheck(item.id, activePhase, isChecked)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 12px',
                        background: isChecked ? 'rgba(34,197,94,0.05)' : 'var(--surface)',
                        border: `1px solid ${isChecked ? 'rgba(34,197,94,0.2)' : 'var(--line)'}`,
                        borderRadius: 8, cursor: 'pointer',
                      }}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${isChecked ? '#22c55e' : 'var(--text-3)'}`,
                        background: isChecked ? '#22c55e' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                      }}>
                        {isChecked && <Check size={10} style={{ color: '#000', strokeWidth: 3 }} />}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 12, color: isChecked ? 'var(--text-3)' : 'var(--text-2)', textDecoration: isChecked ? 'line-through' : 'none' }}>{item.text}</p>
                        {item.sub && <p style={{ margin: '1px 0 0', fontSize: 10, color: 'var(--text-3)' }}>{item.sub}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {allPhaseChecked && activePhase === impl.phase && impl.status !== 'completed' && (
                <button
                  onClick={() => completePhase(activePhase)}
                  style={{ marginTop: 12, width: '100%', padding: '10px', background: '#22c55e', border: 'none', borderRadius: 9, color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif' " }}
                >
                  {activePhase === 6 ? '🎉 Marcar implementación completa' : `Completar Fase ${activePhase} y avanzar →`}
                </button>
              )}
            </div>

            {/* Notes */}
            <div>
              <p style={{ margin: '0 0 10px', fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>
                Notas de esta fase
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                {phaseNotes.map(note => (
                  <div key={note.id} style={{ display: 'flex', gap: 8, padding: '9px 12px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 }}>
                    <FileText size={12} style={{ color: 'var(--text-3)', flexShrink: 0, marginTop: 2 }} />
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)', flex: 1, lineHeight: 1.5 }}>{note.content}</p>
                    <button onClick={() => deleteNote(note.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0, flexShrink: 0 }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && addNote()}
                  placeholder="Agregar nota para esta fase..."
                  style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: 'var(--text)', outline: 'none', fontFamily: "'Inter', sans-serif" }}
                />
                <button
                  onClick={addNote}
                  disabled={!noteInput.trim() || noteLoading}
                  style={{ padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text-2)', cursor: 'pointer' }}
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Chat ── */}
        <div style={{ width: 340, flexShrink: 0, borderLeft: '1px solid var(--line)', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,212,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={13} style={{ color: 'var(--fd-cyan)' }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Agente Implementador</p>
              <p style={{ margin: 0, fontSize: 10, color: 'var(--text-3)' }}>Conoce el protocolo completo</p>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {localMessages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)' }}>
                <Bot size={28} style={{ color: 'var(--fd-cyan)', marginBottom: 10, opacity: 0.6 }} />
                <p style={{ margin: 0, fontSize: 12 }}>Pregúntame cualquier cosa sobre la implementación de <strong style={{ color: 'var(--text-2)' }}>{impl.client_name}</strong>.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 16 }}>
                  {[
                    '¿Qué sigue en esta fase?',
                    'Dame un script para la próxima sesión',
                    '¿Cómo conecto WhatsApp?',
                  ].map(s => (
                    <button
                      key={s}
                      onClick={() => { setChatInput(s); }}
                      style={{ padding: '7px 10px', background: 'var(--surface2)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text-3)', fontSize: 11, cursor: 'pointer', textAlign: 'left', fontFamily: "'Inter', sans-serif" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {localMessages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', gap: 7, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: msg.role === 'user' ? 'var(--fd-blue)' : 'rgba(0,212,255,0.12)',
                }}>
                  {msg.role === 'user' ? <User size={11} style={{ color: '#fff' }} /> : <Bot size={11} style={{ color: 'var(--fd-cyan)' }} />}
                </div>
                <div style={{
                  maxWidth: '78%', padding: '8px 11px', borderRadius: msg.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                  background: msg.role === 'user' ? 'rgba(59,130,246,0.15)' : 'var(--surface2)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(59,130,246,0.2)' : 'var(--line)'}`,
                  fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55,
                }}>
                  <MarkdownText text={msg.content} />
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ display: 'flex', gap: 7 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,212,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={11} style={{ color: 'var(--fd-cyan)' }} />
                </div>
                <div style={{ padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--line)', borderRadius: '4px 12px 12px 12px', display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--fd-cyan)', opacity: 0.6, animation: `bounce 1s ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--line)', flexShrink: 0, display: 'flex', gap: 6 }}>
            <textarea
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
              placeholder="Escribe aquí..."
              rows={2}
              style={{
                flex: 1, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 8,
                padding: '8px 10px', fontSize: 12, color: 'var(--text)', outline: 'none',
                fontFamily: "'Inter', sans-serif", resize: 'none', lineHeight: 1.5,
              }}
            />
            <button
              onClick={sendChat}
              disabled={!chatInput.trim() || chatLoading}
              style={{
                width: 34, background: chatInput.trim() && !chatLoading ? 'var(--fd-cyan)' : 'var(--surface2)',
                border: 'none', borderRadius: 8, cursor: chatInput.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end', height: 34,
              }}
            >
              <Send size={13} style={{ color: chatInput.trim() && !chatLoading ? '#000' : 'var(--text-3)' }} />
            </button>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-4px)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
