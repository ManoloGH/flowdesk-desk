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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch(`/mentoria/publico/sesion/${token}`)
      .then(data => { setSesion(data); setLoading(false); })
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
        body: JSON.stringify({ mensaje: 'Hola, estoy listo para comenzar la entrevista.' }),
      });
      setMensajes([{ role: 'assistant', content: result.text }]);
    } catch (e: any) {
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
    } catch (e: any) {
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
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f3f4f6', marginBottom: 8 }}>Hola, {sesion.sesion?.interlocutor?.split(' ')[0] ?? 'bienvenido'}</div>
            <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6, marginBottom: 24 }}>
              Vamos a hacer un diagnóstico conversacional de los procesos de tu área en {sesion.empresa}.<br />
              Solo responde con naturalidad — yo te voy guiando.
            </div>
            <button
              onClick={iniciarEntrevista}
              style={{ padding: '12px 28px', background: '#6c4de6', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              Comenzar
            </button>
          </div>
        ) : (
          <>
            {mensajes.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '72%',
                  padding: '10px 14px',
                  borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: m.role === 'user' ? '#6c4de6' : '#1f1f2e',
                  color: m.role === 'user' ? 'white' : '#e5e7eb',
                  fontSize: 13,
                  lineHeight: 1.6,
                  border: m.role === 'assistant' ? '1px solid #2d2d3d' : 'none',
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {enviando && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '10px 14px', borderRadius: '14px 14px 14px 4px', background: '#1f1f2e', border: '1px solid #2d2d3d', color: '#6b7280', fontSize: 13 }}>
                  <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6c4de6', animation: 'pulse 1s ease-in-out infinite' }} />
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6c4de6', animation: 'pulse 1s ease-in-out 0.2s infinite' }} />
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6c4de6', animation: 'pulse 1s ease-in-out 0.4s infinite' }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      {iniciado && (
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

      <style>{`@keyframes pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }`}</style>
    </div>
  );
}
