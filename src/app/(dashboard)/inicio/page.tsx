'use client';
import { useState, useRef, useEffect } from 'react';
import { Calendar, Bell, Send, Bot, ChevronRight, Clock, Plus } from 'lucide-react';
import { api } from '@/lib/api';

/* ── Types ── */
interface Tarea {
  id: string;
  texto: string;
  done: boolean;
  fecha?: string;
}

interface Mensaje {
  role: 'user' | 'assistant';
  content: string;
}

/* ── Helpers ── */
const DIAS  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function hoy() {
  const d = new Date();
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

/* ── Agenda placeholder ── */
const EVENTOS_DEMO = [
  { hora: '09:00', titulo: 'Revisión semanal con equipo', color: '#6c4de6' },
  { hora: '11:30', titulo: 'Llamada prospecto — Textiles Norte', color: '#3b82f6' },
  { hora: '15:00', titulo: 'Sesión diagnóstico — Cliente activo', color: '#10b981' },
];

/* ══════════════════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function InicioPage() {
  const [tareas, setTareas]     = useState<Tarea[]>([
    { id: '1', texto: 'Enviar propuesta a cliente pendiente', done: false, fecha: 'Hoy' },
    { id: '2', texto: 'Revisar cuestionario diagnóstico',    done: false, fecha: 'Hoy' },
    { id: '3', texto: 'Actualizar cubo — sesión del lunes',  done: true,  fecha: 'Ayer' },
  ]);
  const [nuevaTarea, setNuevaTarea] = useState('');

  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { role: 'assistant', content: 'Hola, soy tu asistente personal. ¿En qué te puedo ayudar hoy?' },
  ]);
  const [input, setInput]     = useState('');
  const [cargando, setCargando] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  function toggleTarea(id: string) {
    setTareas(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  function agregarTarea(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevaTarea.trim()) return;
    setTareas(prev => [{ id: Date.now().toString(), texto: nuevaTarea.trim(), done: false, fecha: 'Hoy' }, ...prev]);
    setNuevaTarea('');
  }

  async function enviarMensaje(e: React.FormEvent) {
    e.preventDefault();
    const txt = input.trim();
    if (!txt || cargando) return;
    const historial = [...mensajes, { role: 'user' as const, content: txt }];
    setMensajes(historial);
    setInput('');
    setCargando(true);
    try {
      const res = await api.post<{ text: string }>('/agente/chat', { message: txt, messages: historial });
      setMensajes(prev => [...prev, { role: 'assistant', content: res.text ?? '...' }]);
    } catch {
      setMensajes(prev => [...prev, {
        role: 'assistant',
        content: 'Este módulo estará disponible próximamente. Por ahora puedo ayudarte desde el CRM.',
      }]);
    } finally {
      setCargando(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  const pendientes = tareas.filter(t => !t.done).length;

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1fr 280px 340px', gap: 0, overflow: 'hidden' }}>

      {/* ── COL 1: AGENDA ── */}
      <div style={{ borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Calendar size={15} style={{ color: 'var(--fd-cyan)' }} />
            <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Agenda</span>
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', margin: 0 }}>{hoy()}</h1>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {EVENTOS_DEMO.map((ev, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
              <div style={{ paddingTop: 2, minWidth: 44, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--text-3)' }}>{ev.hora}</div>
              <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--line)', borderLeft: `3px solid ${ev.color}`, borderRadius: 8, padding: '10px 14px' }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', margin: 0 }}>{ev.titulo}</p>
              </div>
            </div>
          ))}

          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 6, marginTop: 8,
              background: 'none', border: '1px dashed var(--line)', borderRadius: 8,
              padding: '10px 14px', width: '100%', cursor: 'pointer',
              color: 'var(--text-3)', fontSize: 12,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--fd-cyan)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--fd-cyan)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)'; }}
          >
            <Plus size={13} /> Agregar evento
          </button>

          <div style={{ marginTop: 32, padding: '16px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, textAlign: 'center' }}>
            <Clock size={20} style={{ color: 'var(--text-3)', margin: '0 auto 8px', display: 'block' }} />
            <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
              Sincronización con Google Calendar<br />
              <span style={{ color: 'var(--fd-cyan)', cursor: 'pointer' }}>próximamente</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── COL 2: RECORDATORIOS ── */}
      <div style={{ borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Bell size={14} style={{ color: 'var(--fd-magenta)' }} />
            <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Recordatorios</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.04em' }}>{pendientes}</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>pendientes</span>
          </div>
        </div>

        <form onSubmit={agregarTarea} style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', display: 'flex', gap: 6, flexShrink: 0 }}>
          <input
            value={nuevaTarea}
            onChange={e => setNuevaTarea(e.target.value)}
            placeholder="Agregar recordatorio…"
            style={{
              flex: 1, background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 7, padding: '7px 10px', fontSize: 12, color: 'var(--text)',
              outline: 'none', fontFamily: "'Inter Tight', sans-serif",
            }}
            onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--fd-cyan)'; }}
            onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--line)'; }}
          />
          <button
            type="submit"
            style={{
              padding: '7px 10px', borderRadius: 7, border: 'none',
              background: 'var(--fd-cyan)', color: 'white', cursor: 'pointer', display: 'flex',
            }}
          >
            <Plus size={14} />
          </button>
        </form>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
          {tareas.map(t => (
            <button
              key={t.id}
              onClick={() => toggleTarea(t.id)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%',
                padding: '10px 8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'transparent', textAlign: 'left', marginBottom: 2,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: 5, flexShrink: 0, marginTop: 1,
                border: t.done ? 'none' : '1.5px solid var(--line-strong)',
                background: t.done ? 'var(--fd-cyan)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {t.done && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <div>
                <p style={{ fontSize: 12, color: t.done ? 'var(--text-3)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none', margin: 0, lineHeight: 1.4 }}>{t.texto}</p>
                {t.fecha && <p style={{ fontSize: 10, color: 'var(--text-3)', margin: '2px 0 0', fontFamily: "'JetBrains Mono', monospace" }}>{t.fecha}</p>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── COL 3: CHAT AGENTE PERSONAL ── */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Bot size={14} style={{ color: 'var(--fd-blue)' }} />
            <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Agente personal</span>
          </div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>CEO Digital</h2>
        </div>

        {/* Mensajes */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {mensajes.map((m, i) => (
            <div
              key={i}
              style={{
                display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 10,
              }}
            >
              {m.role === 'assistant' && (
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginRight: 8, marginTop: 2,
                  background: 'linear-gradient(135deg, var(--fd-blue), var(--fd-cyan))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Bot size={12} style={{ color: 'white' }} />
                </div>
              )}
              <div style={{
                maxWidth: '78%', padding: '9px 13px', borderRadius: m.role === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                background: m.role === 'user'
                  ? 'linear-gradient(135deg, var(--fd-cyan), var(--fd-blue))'
                  : 'var(--surface)',
                border: m.role === 'user' ? 'none' : '1px solid var(--line)',
                fontSize: 12, color: m.role === 'user' ? 'white' : 'var(--text)',
                lineHeight: 1.55,
              }}>
                {m.content}
              </div>
            </div>
          ))}

          {cargando && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 0 10px' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, var(--fd-blue), var(--fd-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={12} style={{ color: 'white' }} />
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(n => (
                  <div key={n} style={{
                    width: 6, height: 6, borderRadius: '50%', background: 'var(--text-3)',
                    animation: `bounce 1s ease-in-out ${n * 0.15}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={enviarMensaje} style={{ padding: '12px 16px', borderTop: '1px solid var(--line)', display: 'flex', gap: 8, flexShrink: 0 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Escribe algo…"
            disabled={cargando}
            style={{
              flex: 1, background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 10, padding: '9px 12px', fontSize: 12, color: 'var(--text)',
              outline: 'none', fontFamily: "'Inter Tight', sans-serif",
              opacity: cargando ? 0.6 : 1,
            }}
            onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--fd-cyan)'; }}
            onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--line)'; }}
          />
          <button
            type="submit"
            disabled={cargando || !input.trim()}
            style={{
              width: 36, height: 36, borderRadius: 10, border: 'none', flexShrink: 0,
              background: input.trim() && !cargando ? 'var(--fd-cyan)' : 'var(--surface-2)',
              color: input.trim() && !cargando ? 'white' : 'var(--text-3)',
              cursor: input.trim() && !cargando ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
          >
            <Send size={14} />
          </button>
        </form>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
