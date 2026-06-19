'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import {
  Send, CheckSquare, Target, Zap, AlertTriangle,
  ChevronRight, RefreshCw, BarChart2, ClipboardCheck,
  Bot, User, Loader2, Plus,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message { role: 'user' | 'assistant'; content: string; ts: Date; }
interface Task     { id: string; title: string; status: string; priority: string; due_date?: string; }
interface Ksf      { id: string; name: string; unit: string; last_status: string | null; last_trend: string | null; }
interface Standup  { content: { hice: string; hare: string; bloqueantes?: string; date: string } | null; }
interface Skill    { skill: string; level: number; evidence: string | null; }
interface SkillEntry { id: string; name: string; skills: Skill[]; }

const STATUS_COLOR: Record<string, string> = {
  pending: '#f59e0b', in_progress: '#3b82f6', completed: '#10b981', cancelled: '#6b7280',
};
const KSF_COLOR: Record<string, string> = {
  OUTSTANDING: '#10b981', SATISFACTORY: '#3b82f6', IN_PROGRESS: '#f59e0b',
  AT_MINIMUM: '#f97316', BELOW_MINIMUM: '#ef4444', NO_DATA: '#6b7280',
};
const KSF_LABEL: Record<string, string> = {
  OUTSTANDING: 'Sobresaliente', SATISFACTORY: 'Satisfactorio', IN_PROGRESS: 'En progreso',
  AT_MINIMUM: 'Al mínimo', BELOW_MINIMUM: 'Bajo mínimo', NO_DATA: 'Sin dato',
};
const PRIORITY_DOT: Record<string, string> = {
  urgent: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#6b7280',
};

function formatTime(d: Date) {
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MiAsistentePage() {
  const { user } = useAuth();
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [input,      setInput]      = useState('');
  const [sending,    setSending]    = useState(false);
  const [sessionId,  setSessionId]  = useState<string | undefined>();
  const [activeTab,  setActiveTab]  = useState<'chat' | 'skills'>('chat');

  const [tasks,    setTasks]    = useState<Task[]>([]);
  const [ksfs,     setKsfs]     = useState<Ksf[]>([]);
  const [standup,  setStandup]  = useState<Standup | null>(null);
  const [skills,   setSkills]   = useState<SkillEntry[]>([]);
  const [loadCtx,  setLoadCtx]  = useState(true);

  const [standupDraft, setStandupDraft] = useState<{ hice: string; hare: string; bloqueantes: string } | null>(null);
  const [savingStandup, setSavingStandup] = useState(false);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const isManager  = ['manager', 'admin', 'owner', 'superadmin'].includes(user?.role ?? '');

  // ── Load context panel ──────────────────────────────────────────────────────
  const loadContext = useCallback(async () => {
    setLoadCtx(true);
    try {
      const [tasksRes, ksfsRes, standupRes] = await Promise.allSettled([
        api.get<Task[]>('/tasks?status=pending'),
        api.get<Ksf[]>('/goals/ksf/mine'),
        api.get<Standup>('/work-reports/today'),
      ]);
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value ?? []);
      if (ksfsRes.status  === 'fulfilled') setKsfs(ksfsRes.value  ?? []);
      if (standupRes.status === 'fulfilled') setStandup(standupRes.value);
    } catch {}
    setLoadCtx(false);
  }, []);

  const loadSkills = useCallback(async () => {
    try {
      const res = await api.get<SkillEntry[] | Skill[]>('/assistant/skills');
      if (Array.isArray(res) && res.length > 0 && 'skills' in res[0]) {
        setSkills(res as SkillEntry[]);
      } else {
        setSkills([{ id: user?.slot_id ?? 'me', name: user?.name ?? 'Yo', skills: res as Skill[] }]);
      }
    } catch {}
  }, [user]);

  useEffect(() => { loadContext(); }, [loadContext]);
  useEffect(() => { if (activeTab === 'skills') loadSkills(); }, [activeTab, loadSkills]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    setInput('');
    setSending(true);
    setMessages(prev => [...prev, { role: 'user', content: msg, ts: new Date() }]);

    try {
      const res = await api.post<{ text: string; session_id: string }>('/assistant/chat', {
        message: msg,
        session_id: sessionId,
      });
      setSessionId(res.session_id);
      setMessages(prev => [...prev, { role: 'assistant', content: res.text, ts: new Date() }]);
      loadContext();
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ocurrió un error. Intenta de nuevo.', ts: new Date() }]);
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Standup quick form ──────────────────────────────────────────────────────
  const saveStandup = async () => {
    if (!standupDraft) return;
    setSavingStandup(true);
    try {
      await api.post('/work-reports', standupDraft);
      setStandupDraft(null);
      loadContext();
    } catch {}
    setSavingStandup(false);
  };

  const quickActions = [
    { label: 'Ver mis tareas', msg: 'Muéstrame mis tareas pendientes de hoy' },
    { label: 'Estado de mi equipo', msg: 'Dame un resumen del estado de mi equipo', managerOnly: true },
    { label: 'Revisión semanal', msg: 'Dame el reporte semanal de mi equipo por zonas', managerOnly: true },
    { label: 'Mis KSFs', msg: '¿Cómo voy con mis indicadores clave esta semana?' },
  ].filter(a => !a.managerOnly || isManager);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ══ CHAT AREA ══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--line)' }}>

        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--line)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--fd-cyan), var(--fd-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={18} color="white" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontFamily: "'Inter Tight', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                Mi Asistente
              </h1>
              <p style={{ margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {isManager ? (user?.role === 'owner' || user?.role === 'admin' ? 'Director' : 'Gerente') : 'Empleado'} · FlowDesk AI
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', borderRadius: 8, padding: 3 }}>
            {(['chat', 'skills'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontFamily: "'Inter Tight', sans-serif", fontSize: 12, fontWeight: 500,
                background: activeTab === tab ? 'var(--surface-2)' : 'transparent',
                color: activeTab === tab ? 'var(--text)' : 'var(--text-3)',
                transition: 'all 0.15s',
              }}>
                {tab === 'chat' ? 'Chat' : 'Habilidades'}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'chat' ? (
          <>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Welcome */}
              {messages.length === 0 && (
                <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center', paddingTop: 40 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, var(--fd-cyan), var(--fd-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Bot size={26} color="white" />
                  </div>
                  <h2 style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
                    Hola, {user?.name?.split(' ')[0] ?? 'bienvenido'}
                  </h2>
                  <p style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 14, color: 'var(--text-2)', margin: '0 0 28px', lineHeight: 1.5 }}>
                    Soy tu asistente personal. Puedo ayudarte con tus tareas, tu equipo, tus indicadores y tu día a día.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                    {quickActions.map(a => (
                      <button key={a.label} onClick={() => sendMessage(a.msg)} style={{
                        padding: '8px 14px', borderRadius: 20, border: '1px solid var(--line-strong)',
                        background: 'var(--surface)', color: 'var(--text-2)',
                        fontFamily: "'Inter Tight', sans-serif", fontSize: 12, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)'; }}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message list */}
              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: m.role === 'user'
                      ? 'linear-gradient(135deg, var(--fd-cyan), var(--fd-magenta))'
                      : 'linear-gradient(135deg, var(--fd-blue), var(--fd-cyan))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {m.role === 'user' ? <User size={13} color="white" /> : <Bot size={13} color="white" />}
                  </div>
                  <div style={{ maxWidth: '72%' }}>
                    <div style={{
                      padding: '10px 14px', borderRadius: m.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                      background: m.role === 'user' ? 'var(--fd-blue)' : 'var(--surface)',
                      border: m.role === 'assistant' ? '1px solid var(--line)' : 'none',
                      fontFamily: "'Inter Tight', sans-serif", fontSize: 13.5, lineHeight: 1.55,
                      color: m.role === 'user' ? 'white' : 'var(--text)',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {m.content}
                    </div>
                    <p style={{ margin: '3px 4px 0', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-3)', textAlign: m.role === 'user' ? 'right' : 'left' }}>
                      {formatTime(m.ts)}
                    </p>
                  </div>
                </div>
              ))}

              {sending && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--fd-blue), var(--fd-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={13} color="white" />
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: '4px 14px 14px 14px', background: 'var(--surface)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Loader2 size={13} style={{ color: 'var(--fd-cyan)', animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.04em' }}>pensando...</span>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--line-strong)', padding: '10px 14px' }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Escríbeme algo... (Enter para enviar, Shift+Enter para nueva línea)"
                  rows={1}
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none',
                    fontFamily: "'Inter Tight', sans-serif", fontSize: 13.5, color: 'var(--text)',
                    lineHeight: 1.5, maxHeight: 120, overflowY: 'auto',
                  }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || sending}
                  style={{
                    width: 34, height: 34, borderRadius: 10, border: 'none', cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
                    background: input.trim() && !sending ? 'var(--fd-cyan)' : 'var(--surface-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    transition: 'background 0.15s',
                  }}
                >
                  <Send size={14} color={input.trim() && !sending ? 'white' : 'var(--text-3)'} />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Skills tab */
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontFamily: "'Inter Tight', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                  Matriz de Habilidades
                </h2>
                <p style={{ margin: '2px 0 0', fontFamily: "'Inter Tight', sans-serif", fontSize: 12, color: 'var(--text-3)' }}>
                  Construida automáticamente desde tu historial de trabajo
                </p>
              </div>
              <button onClick={loadSkills} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--text-2)', fontFamily: "'Inter Tight', sans-serif", fontSize: 12, cursor: 'pointer' }}>
                <RefreshCw size={12} /> Actualizar
              </button>
            </div>

            {skills.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-3)' }}>
                <BarChart2 size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                <p style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 14, margin: 0 }}>
                  Aún no hay habilidades registradas.
                </p>
                <p style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 12, margin: '6px 0 0', color: 'var(--text-3)' }}>
                  Se irán capturando automáticamente conforme trabajes con tu asistente.
                </p>
              </div>
            ) : (
              skills.map(person => (
                <div key={person.id} style={{ marginBottom: 24 }}>
                  {skills.length > 1 && (
                    <h3 style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--text-2)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {person.name}
                    </h3>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {person.skills.map((s, i) => (
                      <div key={i} style={{ background: 'var(--surface)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--line)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.skill}</span>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: 'var(--fd-cyan)' }}>{s.level}/10</span>
                        </div>
                        <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(s.level / 10) * 100}%`, background: 'linear-gradient(90deg, var(--fd-blue), var(--fd-cyan))', borderRadius: 4, transition: 'width 0.6s ease' }} />
                        </div>
                        {s.evidence && (
                          <p style={{ margin: '6px 0 0', fontFamily: "'Inter Tight', sans-serif", fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic' }}>
                            {s.evidence}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ══ CONTEXT PANEL ══ */}
      <div style={{ width: 300, flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Standup */}
        <div style={{ padding: '18px 16px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ClipboardCheck size={13} style={{ color: 'var(--fd-cyan)' }} />
              <span style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 12, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>Standup de hoy</span>
            </div>
            {!standupDraft && (
              <button onClick={() => setStandupDraft({ hice: '', hare: '', bloqueantes: '' })} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fd-cyan)', fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
                <Plus size={11} /> {standup?.content ? 'Editar' : 'Registrar'}
              </button>
            )}
          </div>

          {standupDraft ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(['hice', 'hare', 'bloqueantes'] as const).map(field => (
                <div key={field}>
                  <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 3 }}>
                    {field === 'hice' ? 'Hice' : field === 'hare' ? 'Haré hoy' : 'Bloqueantes'}
                  </label>
                  <textarea
                    value={standupDraft[field]}
                    onChange={e => setStandupDraft(prev => prev ? { ...prev, [field]: e.target.value } : null)}
                    rows={2}
                    style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 7, padding: '6px 8px', fontFamily: "'Inter Tight', sans-serif", fontSize: 12, color: 'var(--text)', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setStandupDraft(null)} style={{ flex: 1, padding: '6px', borderRadius: 7, border: '1px solid var(--line)', background: 'transparent', color: 'var(--text-2)', fontFamily: "'Inter Tight', sans-serif", fontSize: 11, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={saveStandup} disabled={savingStandup} style={{ flex: 1, padding: '6px', borderRadius: 7, border: 'none', background: 'var(--fd-cyan)', color: 'white', fontFamily: "'Inter Tight', sans-serif", fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {savingStandup ? '...' : 'Guardar'}
                </button>
              </div>
            </div>
          ) : standup?.content ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[{ label: 'Hice', value: standup.content.hice }, { label: 'Haré', value: standup.content.hare }, ...(standup.content.bloqueantes ? [{ label: 'Bloqueantes', value: standup.content.bloqueantes }] : [])].map(item => (
                <div key={item.label}>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--fd-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>{item.label}</p>
                  <p style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 12, color: 'var(--text-2)', margin: 0, lineHeight: 1.45 }}>{item.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <AlertTriangle size={16} style={{ color: 'var(--fd-orange, #f97316)', marginBottom: 4 }} />
              <p style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 11, color: 'var(--text-3)', margin: 0 }}>No registrado</p>
            </div>
          )}
        </div>

        {/* Tasks */}
        <div style={{ padding: '18px 16px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <CheckSquare size={13} style={{ color: 'var(--fd-cyan)' }} />
            <span style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 12, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>Mis tareas</span>
            <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-3)' }}>{tasks.length}</span>
            {loadCtx && <Loader2 size={11} style={{ color: 'var(--text-3)', animation: 'spin 1s linear infinite' }} />}
          </div>
          {tasks.length === 0 ? (
            <p style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 11, color: 'var(--text-3)', margin: 0, textAlign: 'center', padding: '8px 0' }}>
              Sin tareas pendientes
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tasks.slice(0, 6).map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 8px', borderRadius: 8, background: 'var(--surface)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_DOT[t.priority] ?? '#6b7280', flexShrink: 0, marginTop: 5 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 12, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: STATUS_COLOR[t.status] ?? 'var(--text-3)' }}>{t.status}</span>
                      {t.due_date && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-3)' }}>{new Date(t.due_date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}</span>}
                    </div>
                  </div>
                </div>
              ))}
              {tasks.length > 6 && (
                <button onClick={() => sendMessage('Muéstrame todas mis tareas pendientes')} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, padding: '4px 0' }}>
                  Ver {tasks.length - 6} más <ChevronRight size={10} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* KSFs */}
        <div style={{ padding: '18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Target size={13} style={{ color: 'var(--fd-cyan)' }} />
            <span style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 12, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>Mis KSFs</span>
            <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-3)' }}>{ksfs.length}</span>
          </div>
          {ksfs.length === 0 ? (
            <p style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 11, color: 'var(--text-3)', margin: 0, textAlign: 'center', padding: '8px 0' }}>
              Sin KSFs configurados
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ksfs.slice(0, 5).map(k => (
                <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 8, background: 'var(--surface)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: KSF_COLOR[k.last_status ?? 'NO_DATA'], flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 11, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.name}</p>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: KSF_COLOR[k.last_status ?? 'NO_DATA'], margin: '1px 0 0' }}>
                      {KSF_LABEL[k.last_status ?? 'NO_DATA']}
                      {k.last_trend && ` · ${k.last_trend === 'UP' ? '↑' : k.last_trend === 'DOWN' ? '↓' : '→'}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick standup prompt if not done */}
          {!standup?.content && (
            <button
              onClick={() => sendMessage('Quiero registrar mi standup de hoy')}
              style={{
                marginTop: 16, width: '100%', padding: '9px 12px', borderRadius: 10,
                border: '1px dashed var(--line-strong)', background: 'transparent',
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                color: 'var(--text-3)', fontFamily: "'Inter Tight', sans-serif", fontSize: 12,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--fd-cyan)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--fd-cyan)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--line-strong)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)'; }}
            >
              <Zap size={13} />
              Registrar standup del día
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
