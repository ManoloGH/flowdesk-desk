'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.flowdesk.mx';

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Error ${res.status}`);
  }
  return res.json();
}

interface Mensaje {
  role: 'user' | 'assistant';
  content: string;
}

export default function EntrevistaPublica() {
  const { token } = useParams<{ token: string }>();
  const [sesion, setSesion] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [iniciado, setIniciado] = useState(false);
  const [completada, setCompletada] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch(`/mentoria/publico/sesion/${token}`)
      .then(data => {
        setSesion(data);
        // Si la sesión ya fue completada previamente, mostrarlo directamente
        if (data.sesion?.completada) setCompletada(true);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  async function iniciarEntrevista() {
    setIniciado(true);
    setEnviando(true);
    try {
      const result = await apiFetch(`/mentoria/publico/sesion/${token}/chat`, {
        method: 'POST',
        body: JSON.stringify({ mensaje: 'Hola, estoy listo para comenzar el cuestionario.' }),
      });
      setMensajes([{ role: 'assistant', content: result.text }]);
      if (result.completada) setCompletada(true);
    } catch {
      setMensajes([{ role: 'assistant', content: 'Hubo un error al conectar. Recarga la página e intenta de nuevo.' }]);
    } finally {
      setEnviando(false);
    }
  }

  async function enviarMensaje() {
    if (!input.trim() || enviando) return;
    const msg = input.trim();
    setInput('');
    setMensajes(prev => [...prev, { role: 'user', content: msg }]);
    setEnviando(true);
    try {
      const result = await apiFetch(`/mentoria/publico/sesion/${token}/chat`, {
        method: 'POST',
        body: JSON.stringify({ mensaje: msg }),
      });
      setMensajes(prev => [...prev, { role: 'assistant', content: result.text }]);
      if (result.completada) {
        // Pequeño delay para que el mensaje de despedida se lea antes de la pantalla de cierre
        setTimeout(() => setCompletada(true), 3000);
      }
    } catch {
      setMensajes(prev => [...prev, { role: 'assistant', content: 'Error al procesar tu respuesta. Intenta de nuevo.' }]);
    } finally {
      setEnviando(false);
    }
  }

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f13', color: '#9ca3af', fontSize: 14 }}>
      Cargando…
    </div>
  );

  if (error || !sesion) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f0f13', color: '#9ca3af', gap: 12, fontSize: 14 }}>
      <div style={{ fontSize: 32 }}>🔒</div>
      <div>Enlace inválido o expirado.</div>
    </div>
  );

  // Pantalla de cierre exitoso
  if (completada) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0f0f13', color: '#e5e7eb' }}>
      {/* Header mínimo */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #1f1f2e', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6c4de6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎙️</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f3f4f6' }}>Diagnóstico Organizacional — {sesion.empresa}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{sesion.sesion?.interlocutor ?? ''}{sesion.sesion?.cargo ? ` · ${sesion.sesion.cargo}` : ''}</div>
        </div>
      </div>

      {/* Contenido de éxito */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          {/* Checkmark animado */}
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 24px' }}>
            ✓
          </div>

          <div style={{ fontSize: 22, fontWeight: 800, color: '#f3f4f6', marginBottom: 10, letterSpacing: '-0.02em' }}>
            ¡Cuestionario completado!
          </div>
          <div style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.7, marginBottom: 28 }}>
            Tu información ha quedado guardada en FlowDesk y el consultor de MentorIA
            la revisará para preparar el diagnóstico de <strong style={{ color: '#e5e7eb' }}>{sesion.empresa}</strong>.
          </div>

          <div style={{ background: '#1f1f2e', border: '1px solid #2d2d3d', borderRadius: 12, padding: '16px 20px', marginBottom: 28, textAlign: 'left' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Lo que documentamos hoy</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['Procesos principales del área con metodología SOLICITUD → PROCESO → ENTREGA', 'Herramientas y sistemas utilizados', 'Flujos de información con otras áreas', 'Indicadores y principales retos'].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: '#d1d5db' }}>
                  <span style={{ color: '#22c55e', flexShrink: 0, marginTop: 1 }}>✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 12, color: '#6b7280' }}>
            Ya puedes cerrar esta ventana. Gracias por tu tiempo. 🙌
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0f0f13', color: '#e5e7eb' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #1f1f2e', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6c4de6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎙️</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f3f4f6' }}>Diagnóstico Organizacional — {sesion.empresa}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{sesion.sesion?.interlocutor ?? ''}{sesion.sesion?.cargo ? ` · ${sesion.sesion.cargo}` : ''}{sesion.sesion?.area ? ` · ${sesion.sesion.area}` : ''}</div>
        </div>
      </div>

      {/* Chat */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!iniciado ? (
          <div style={{ margin: 'auto', textAlign: 'center', maxWidth: 480 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>👋</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f3f4f6', marginBottom: 8 }}>
              Hola, {sesion.sesion?.interlocutor?.split(' ')[0] ?? 'bienvenido'}
            </div>
            <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6, marginBottom: 8 }}>
              Vamos a hacer un diagnóstico conversacional de los procesos de tu área en <strong style={{ color: '#e5e7eb' }}>{sesion.empresa}</strong>.
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, marginBottom: 28 }}>
              Solo responde con naturalidad, como si estuviéramos en una llamada. Yo te voy guiando con preguntas.<br />
              La información que compartas se guardará directamente en FlowDesk.
            </div>
            <button
              onClick={iniciarEntrevista}
              style={{ padding: '12px 28px', background: '#6c4de6', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              Comenzar cuestionario
            </button>
          </div>
        ) : (
          <>
            {mensajes.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'assistant' && (
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6c4de6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, marginRight: 8, alignSelf: 'flex-end' }}>
                    🎙️
                  </div>
                )}
                <div style={{
                  maxWidth: '68%',
                  padding: '10px 14px',
                  borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: m.role === 'user' ? '#6c4de6' : '#1f1f2e',
                  color: m.role === 'user' ? 'white' : '#e5e7eb',
                  fontSize: 13,
                  lineHeight: 1.65,
                  border: m.role === 'assistant' ? '1px solid #2d2d3d' : 'none',
                  whiteSpace: 'pre-wrap',
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {enviando && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6c4de6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🎙️</div>
                <div style={{ padding: '10px 14px', borderRadius: '14px 14px 14px 4px', background: '#1f1f2e', border: '1px solid #2d2d3d' }}>
                  <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#6c4de6', display: 'inline-block', animation: `pulse 1.2s ease-in-out ${delay}s infinite` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      {iniciado && !completada && (
        <div style={{ padding: '14px 20px', borderTop: '1px solid #1f1f2e', display: 'flex', gap: 10, flexShrink: 0 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensaje(); } }}
            placeholder="Escribe tu respuesta…"
            disabled={enviando}
            style={{ flex: 1, background: '#1f1f2e', border: '1px solid #2d2d3d', borderRadius: 10, padding: '10px 14px', color: '#e5e7eb', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
          />
          <button
            onClick={enviarMensaje}
            disabled={!input.trim() || enviando}
            style={{ padding: '10px 18px', background: input.trim() && !enviando ? '#6c4de6' : '#2d2d3d', color: input.trim() && !enviando ? 'white' : '#6b7280', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: input.trim() && !enviando ? 'pointer' : 'default', transition: 'background 0.15s' }}
          >
            Enviar
          </button>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100% { opacity: 0.25; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); } }`}</style>
    </div>
  );
}
