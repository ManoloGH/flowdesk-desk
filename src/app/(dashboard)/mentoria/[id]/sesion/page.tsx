'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ChevronLeft, ChevronDown, ChevronRight, Send, Loader2 } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
const ACCENT = '#6c4de6';

const DEFAULT_GREETING =
  `Hola, soy tu asistente de diagnóstico. Estoy aquí para ayudarte a documentar el cubo de información mientras avanzas con el cliente.\n\nPuedes contarme lo que te dijo el cliente en la sesión, dictar notas en tiempo real, o pedirme que te sugiera qué explorar a continuación.`;

// ── Types ──────────────────────────────────────────────────────────────────────

type CuboKey = 'contexto' | 'areas_procesos' | 'organigrama' | 'sistemas' | 'brechas' | 'agentes';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// ── Config ─────────────────────────────────────────────────────────────────────

const CUBO_SECTIONS: { key: CuboKey; titulo: string; color: string; placeholder: string }[] = [
  {
    key: 'contexto',
    titulo: 'Empresa & Contexto',
    color: ACCENT,
    placeholder: 'Empresa: ___\nActividad: ___\nEmpleados: ___\nFacturación: ___\n\nObjetivos DG:\n—\n\nPrioridades urgentes:\n—',
  },
  {
    key: 'areas_procesos',
    titulo: 'Áreas & Procesos',
    color: '#3b82f6',
    placeholder: 'VENTAS\nFunción: ___\nProcesos: ___\nProblemas: ___\n\nOPERACIONES\n...',
  },
  {
    key: 'organigrama',
    titulo: 'Organigrama & Roles',
    color: '#f59e0b',
    placeholder: 'NOMBRE · Cargo · Área · $sueldo/mes\nHerramientas: ___\nTarea repetitiva principal: ___\n\n...',
  },
  {
    key: 'sistemas',
    titulo: 'Sistemas & Herramientas',
    color: '#f59e0b',
    placeholder: 'SISTEMA · Tipo · Costo/mes · Usuarios\n\nEjemplo:\nContpaq · ERP · $2,500 · 3 usuarios\nWhatsApp · Comunicación · Gratis · todos\n\n...',
  },
  {
    key: 'brechas',
    titulo: 'Brechas & Diagnóstico',
    color: '#ef4444',
    placeholder: 'BRECHA CRÍTICA\nDescripción: ___\nÁrea: ___\nImpacto: ___ hrs/sem · $___/mes\n\nOBSERVACIONES DEL ASESOR\n—',
  },
  {
    key: 'agentes',
    titulo: 'Agentes IA propuestos',
    color: '#8b5cf6',
    placeholder: 'AGENTE 1 · Nombre\nFunción: ___\nLibera área: ___\nAhorro: ___ hrs/sem = $___ MXN/mes\nFase: Quick Win / Expansión\n\nAGENTE 2\n...',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

const TIPOS_SESION = [
  { key: 'dg',        label: 'Director General',   icon: '🏆' },
  { key: 'director',  label: 'Director de área',   icon: '🏛️' },
  { key: 'gerente',   label: 'Gerente',             icon: '🏢' },
  { key: 'operador',  label: 'Operador',            icon: '⚙️' },
  { key: 'otro',      label: 'Otro',                icon: '👤' },
];

export default function SesionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sesionId = searchParams.get('sesionId');

  const [empresa, setEmpresa]         = useState('');
  const [sesionTitulo, setSesionTitulo] = useState('');
  const [cubo, setCubo]               = useState<Partial<Record<CuboKey, string>>>({});
  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState('');
  const [streaming, setStreaming]     = useState(false);
  const [openSection, setOpenSection] = useState<CuboKey | null>('contexto');
  const [flashSection, setFlashSection] = useState<CuboKey | null>(null);
  const [editingSection, setEditingSection] = useState<CuboKey | null>(null);
  const [editText, setEditText]       = useState('');
  const [savingSection, setSavingSection] = useState(false);
  const [loadingClient, setLoadingClient] = useState(true);

  // Session picker state (shown when no sesionId in URL)
  const [pickerForm, setPickerForm] = useState({ tipo: 'director', interlocutor: '', cargo: '', area: '' });
  const [creandoSesion, setCreandoSesion] = useState(false);

  const chatEndRef   = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLTextAreaElement>(null);
  const abortRef     = useRef<AbortController | null>(null);

  // Load cliente + history from DB
  useEffect(() => {
    setLoadingClient(true);
    api.get<any>(`/mentoria/clientes/${id}`)
      .then(c => {
        setEmpresa(c.empresa ?? '');
        if (c.cubo && Object.keys(c.cubo).length > 0) setCubo(c.cubo);

        if (sesionId) {
          // Load from the specific named session
          const sesiones = (c.sesiones_diagnostico ?? []) as any[];
          const sesion = sesiones.find((s: any) => s.id === sesionId);
          setSesionTitulo(sesion?.titulo ?? 'Sesión de diagnóstico');
          const mensajes = (sesion?.mensajes ?? []) as Array<{ role: 'user' | 'assistant'; content: string }>;
          setMessages(mensajes.length > 0
            ? mensajes.map(m => ({ role: m.role, content: m.content }))
            : [{ role: 'assistant', content: DEFAULT_GREETING }]);
        } else {
          // Legacy: flat chat_history
          const history = (c.chat_history ?? []) as Array<{ role: 'user' | 'assistant'; content: string }>;
          setMessages(history.length > 0
            ? history.map(m => ({ role: m.role, content: m.content }))
            : [{ role: 'assistant', content: DEFAULT_GREETING }]);
        }
      })
      .catch(() => setMessages([{ role: 'assistant', content: DEFAULT_GREETING }]))
      .finally(() => setLoadingClient(false));
  }, [id, sesionId]);

  async function crearSesion() {
    if (!pickerForm.interlocutor.trim()) return;
    setCreandoSesion(true);
    const newId = `s-${Date.now()}`;
    const tipoLabel = TIPOS_SESION.find(t => t.key === pickerForm.tipo)?.label ?? pickerForm.tipo;
    const titulo = pickerForm.tipo === 'dg'
      ? `Sesión DG — ${pickerForm.interlocutor}`
      : `Sesión ${pickerForm.cargo || tipoLabel} — ${pickerForm.interlocutor}`;
    try {
      await api.post(`/mentoria/clientes/${id}/sesiones-diag`, {
        id: newId, titulo,
        tipo: pickerForm.tipo,
        interlocutor: pickerForm.interlocutor,
        cargo: pickerForm.cargo,
        area: pickerForm.area,
        fecha: new Date().toISOString().split('T')[0],
      });
    } catch {}
    setCreandoSesion(false);
    router.replace(`/mentoria/${id}/sesion?sesionId=${newId}`);
  }

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || streaming) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setStreaming(true);

    try {
      const result = await api.post<{ text: string; cubo: Record<CuboKey, string>; sections_updated: string[] }>(
        `/mentoria/clientes/${id}/chat`,
        { message: text, sesionId: sesionId ?? undefined },
      );

      if (result.text) {
        setMessages(prev => [...prev, { role: 'assistant', content: result.text }]);
      }

      if (result.cubo) {
        setCubo(result.cubo);
        // Flash updated sections
        for (const sec of result.sections_updated ?? []) {
          setFlashSection(sec as CuboKey);
          setOpenSection(sec as CuboKey);
          setTimeout(() => setFlashSection(null), 2500);
        }
      }
    } catch (e: any) {
      const msg = `⚠️ ${e?.message ?? 'No se pudo conectar con el agente.'}`;
      setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      setStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function saveSection(key: CuboKey) {
    setSavingSection(true);
    const next = { ...cubo, [key]: editText };
    setCubo(next);
    try {
      await api.patch(`/mentoria/clientes/${id}/cubo`, { cubo: next });
    } catch {}
    setEditingSection(null);
    setSavingSection(false);
  }

  const filledCount = CUBO_SECTIONS.filter(s => cubo[s.key]?.trim()).length;
  const pct = Math.round(filledCount / CUBO_SECTIONS.length * 100);
  const userMsgCount = messages.filter(m => m.role === 'user').length;

  // ── Session Picker (shown when no sesionId in URL) ────────────────────────
  if (!loadingClient && !sesionId) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--line)', flexShrink: 0, background: 'var(--surface)' }}>
          <button onClick={() => router.push(`/mentoria/${id}`)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 12, padding: 0 }}>
            <ChevronLeft size={14} /> {empresa || 'Cliente'}
          </button>
          <div style={{ width: 1, height: 16, background: 'var(--line)' }} />
          <span style={{ fontSize: 13, color: ACCENT, fontWeight: 600 }}>🎙️ Nueva sesión de diagnóstico</span>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
          <div style={{ width: '100%', maxWidth: 480, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: '28px 32px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.02em' }}>¿Qué sesión vas a iniciar?</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>
              Esta información permite organizar y generar cuestionarios personalizados desde la sesión.
            </div>

            {/* Tipo de sesión */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Tipo de sesión</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {TIPOS_SESION.map(t => (
                  <button key={t.key} onClick={() => setPickerForm(p => ({ ...p, tipo: t.key }))} style={{ padding: '6px 12px', borderRadius: 8, border: `2px solid ${pickerForm.tipo === t.key ? ACCENT : 'var(--line)'}`, background: pickerForm.tipo === t.key ? `${ACCENT}12` : 'transparent', color: pickerForm.tipo === t.key ? ACCENT : 'var(--text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Con quién */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Con quién *</label>
                <input value={pickerForm.interlocutor} onChange={e => setPickerForm(p => ({ ...p, interlocutor: e.target.value }))} placeholder="Nombre completo" style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Cargo</label>
                <input value={pickerForm.cargo} onChange={e => setPickerForm(p => ({ ...p, cargo: e.target.value }))} placeholder="Ej: Director de Operaciones" style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Área</label>
              <input value={pickerForm.area} onChange={e => setPickerForm(p => ({ ...p, area: e.target.value }))} placeholder="Ej: Operaciones, Administración, Comercial…" style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
            </div>

            <button onClick={crearSesion} disabled={!pickerForm.interlocutor.trim() || creandoSesion} style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: ACCENT, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: !pickerForm.interlocutor.trim() ? 0.5 : 1, transition: 'opacity 0.15s' }}>
              {creandoSesion ? 'Creando sesión…' : '🎙️ Iniciar sesión'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 20px', borderBottom: '1px solid var(--line)',
        flexShrink: 0, background: 'var(--surface)',
      }}>
        <button
          onClick={() => router.push(`/mentoria/${id}`)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 12, padding: 0 }}
        >
          <ChevronLeft size={14} />
          {empresa || 'Cliente'}
        </button>

        <div style={{ width: 1, height: 16, background: 'var(--line)' }} />

        <span style={{ fontSize: 13, color: ACCENT, fontWeight: 600 }}>
          🎙️ {sesionTitulo || 'Sesión de diagnóstico'}
        </span>

        {userMsgCount > 0 && (
          <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 4 }}>
            · {userMsgCount} intercambio{userMsgCount !== 1 ? 's' : ''}
          </span>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Cubo {pct}%</span>
          <div style={{ width: 80, height: 4, background: 'var(--line)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: ACCENT, borderRadius: 2, transition: 'width 0.4s' }} />
          </div>
        </div>
      </div>

      {/* ── Two panels ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* ── LEFT: Chat ── */}
        <div style={{ flex: '0 0 55%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--line)', overflow: 'hidden' }}>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map((m, i) => (
              <ChatBubble key={i} role={m.role} content={m.content} />
            ))}

            {streaming && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', fontSize: 13 }}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Procesando…
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '8px 12px' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={streaming}
                rows={1}
                placeholder="Cuéntame lo que dijo el cliente, dicta notas o pide preguntas de seguimiento… (Enter para enviar)"
                style={{
                  flex: 1, resize: 'none', border: 'none', background: 'transparent',
                  fontSize: 13, color: 'var(--text)', outline: 'none', fontFamily: 'inherit',
                  maxHeight: 120, overflowY: 'auto', lineHeight: 1.5,
                }}
              />
              <button
                onClick={streaming ? () => abortRef.current?.abort() : sendMessage}
                disabled={!streaming && !input.trim()}
                title={streaming ? 'Cancelar' : 'Enviar'}
                style={{
                  flexShrink: 0, width: 32, height: 32, borderRadius: 8,
                  background: streaming ? '#ef4444' : ACCENT,
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: !streaming && !input.trim() ? 0.4 : 1, transition: 'all 0.2s',
                }}
              >
                {streaming
                  ? <span style={{ fontSize: 12, color: '#fff', fontWeight: 700 }}>■</span>
                  : <Send size={14} color="#fff" />
                }
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Cubo ── */}
        <div style={{ flex: '0 0 45%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Cubo header */}
          <div style={{ padding: '14px 20px 10px', flexShrink: 0, borderBottom: '1px solid var(--line)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Cubo de Datos
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
              {filledCount} de {CUBO_SECTIONS.length} secciones documentadas
            </div>
          </div>

          {/* Sections */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {CUBO_SECTIONS.map(section => {
              const isOpen    = openSection === section.key;
              const isFlash   = flashSection === section.key;
              const isEditing = editingSection === section.key;
              const value     = cubo[section.key] ?? '';
              const filled    = !!value.trim();

              return (
                <div
                  key={section.key}
                  style={{
                    borderBottom: '1px solid var(--line)',
                    transition: 'background 0.3s',
                    background: isFlash ? `${section.color}18` : 'transparent',
                  }}
                >
                  <button
                    onClick={() => setOpenSection(isOpen ? null : section.key)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: filled ? section.color : 'var(--line)',
                      flexShrink: 0, transition: 'background 0.3s',
                    }} />
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: filled ? 'var(--text)' : 'var(--text-3)' }}>
                      {section.titulo}
                    </span>
                    {isFlash && (
                      <span style={{ fontSize: 10, color: section.color, fontWeight: 600 }}>actualizado</span>
                    )}
                    {isOpen
                      ? <ChevronDown size={12} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                      : <ChevronRight size={12} style={{ color: 'var(--text-3)', flexShrink: 0 }} />}
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 20px 14px' }}>
                      {isEditing ? (
                        <>
                          <textarea
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            rows={8}
                            style={{
                              width: '100%', fontSize: 12, fontFamily: 'monospace',
                              background: 'var(--surface)', border: `1px solid ${section.color}40`,
                              borderRadius: 8, padding: '8px 10px', color: 'var(--text)',
                              resize: 'vertical', outline: 'none', lineHeight: 1.6,
                            }}
                          />
                          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <button
                              onClick={() => saveSection(section.key)}
                              disabled={savingSection}
                              style={{ fontSize: 11, padding: '5px 12px', background: section.color, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                            >
                              {savingSection ? 'Guardando…' : 'Guardar'}
                            </button>
                            <button
                              onClick={() => setEditingSection(null)}
                              style={{ fontSize: 11, padding: '5px 12px', background: 'var(--surface)', color: 'var(--text-3)', border: '1px solid var(--line)', borderRadius: 6, cursor: 'pointer' }}
                            >
                              Cancelar
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <pre style={{
                            fontSize: 11, lineHeight: 1.7, fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                            color: filled ? 'var(--text)' : 'var(--text-3)',
                            margin: 0, maxHeight: 220, overflowY: 'auto',
                          }}>
                            {value || section.placeholder}
                          </pre>
                          <button
                            onClick={() => { setEditText(value); setEditingSection(section.key); }}
                            style={{ marginTop: 8, fontSize: 11, color: section.color, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            ✏️ Editar manualmente
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
      `}</style>
    </div>
  );
}

// ── Chat Bubble ───────────────────────────────────────────────────────────────

function ChatBubble({ role, content, streaming }: { role: 'user' | 'assistant'; content: string; streaming?: boolean }) {
  const isUser = role === 'user';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 4 }}>
      <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {isUser ? 'Asesor' : 'Asistente IA'}
      </div>
      <div style={{
        maxWidth: '85%', padding: '10px 14px', borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser ? ACCENT : 'var(--surface)',
        color: isUser ? '#fff' : 'var(--text)',
        border: isUser ? 'none' : '1px solid var(--line)',
        fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {content}
        {streaming && <span style={{ display: 'inline-block', width: 8, height: 14, background: ACCENT, marginLeft: 2, borderRadius: 1, animation: 'blink 0.8s step-end infinite', verticalAlign: 'text-bottom' }} />}
      </div>
    </div>
  );
}

