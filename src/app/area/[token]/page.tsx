'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface TokenInfo {
  area_name: string;
  area_email: string;
  is_used: boolean;
  expires_at: string;
  excel_upload: {
    id: string;
    status: string;
    file_name: string | null;
    questionnaire: { qa_document: string; area_answers: any; answered_at: string | null } | null;
  } | null;
}

interface QAQuestion   { id: string; section: string; field: string | null; question: string; why: string }
interface QAScreen     { id: string; name: string; description: string; html: string }
interface QAAssumption { id: string; text: string; context: string }
interface QADoc {
  questions?: QAQuestion[];
  screens?: QAScreen[];
  assumptions?: QAAssumption[];
}

interface ScreenReview     { status: 'pending' | 'approved' | 'changes_requested'; comments: string }
interface AssumptionReview { confirmed: boolean; comments: string }
interface ReviewState {
  question_answers:    Record<string, string>;
  screen_reviews:      Record<string, ScreenReview>;
  assumption_reviews:  Record<string, AssumptionReview>;
}

type Step = 'loading' | 'invalid' | 'expired' | 'upload' | 'processing' | 'reviewing' | 'done';

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'Error');
  }
  return res.json();
}

export default function AreaUploadPage() {
  const { token } = useParams<{ token: string }>();
  const [step, setStep]         = useState<Step>('loading');
  const [info, setInfo]         = useState<TokenInfo | null>(null);
  const [content, setContent]   = useState('');
  const [fileName, setFileName] = useState('');
  const [review, setReview]     = useState<ReviewState>({ question_answers: {}, screen_reviews: {}, assumption_reviews: {} });
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState('');
  const [qaDoc, setQaDoc]       = useState<QADoc | null>(null);

  useEffect(() => { load(); }, [token]);

  async function load() {
    try {
      const data = await apiFetch<TokenInfo>(`/proyectos-soc/intake/area/${token}`);
      setInfo(data);
      if (data.excel_upload?.questionnaire?.area_answers) {
        setStep('done');
      } else if (data.excel_upload?.questionnaire) {
        const doc = parseQaDoc(data.excel_upload.questionnaire.qa_document);
        setQaDoc(doc);
        // Pre-init screen reviews as pending
        const sr: Record<string, ScreenReview> = {};
        doc.screens?.forEach(s => { sr[s.id] = { status: 'pending', comments: '' }; });
        const ar: Record<string, AssumptionReview> = {};
        doc.assumptions?.forEach(a => { ar[a.id] = { confirmed: false, comments: '' }; });
        setReview(prev => ({ ...prev, screen_reviews: sr, assumption_reviews: ar }));
        setStep('reviewing');
      } else if (data.excel_upload?.status && data.excel_upload.status !== 'PENDIENTE_SUBIDA') {
        setStep('processing');
      } else {
        setStep('upload');
      }
    } catch (err: any) {
      const msg = err?.message ?? '';
      setStep(msg.includes('expirado') ? 'expired' : 'invalid');
    }
  }

  function parseQaDoc(raw: string): QADoc {
    try { return JSON.parse(raw) as QADoc; } catch { return {}; }
  }

  async function handleUpload() {
    if (!content.trim()) { setError('Pega el contenido de tu Excel o escribe los datos.'); return; }
    setSending(true); setError('');
    try {
      await apiFetch(`/proyectos-soc/intake/area/${token}/submit`, {
        method: 'POST',
        body: JSON.stringify({ content, file_name: fileName || undefined }),
      });
      setStep('processing');
    } catch (err: any) { setError(err?.message ?? 'Error al enviar'); }
    finally { setSending(false); }
  }

  async function handleReview() {
    setSending(true); setError('');
    try {
      await apiFetch(`/proyectos-soc/intake/area/${token}/answer`, {
        method: 'POST',
        body: JSON.stringify({ area_answers: review }),
      });
      setStep('done');
    } catch (err: any) { setError(err?.message ?? 'Error al enviar'); }
    finally { setSending(false); }
  }

  function setQAnswer(id: string, val: string) {
    setReview(p => ({ ...p, question_answers: { ...p.question_answers, [id]: val } }));
  }
  function setScreenStatus(id: string, status: ScreenReview['status']) {
    setReview(p => ({ ...p, screen_reviews: { ...p.screen_reviews, [id]: { ...p.screen_reviews[id], status } } }));
  }
  function setScreenComment(id: string, comments: string) {
    setReview(p => ({ ...p, screen_reviews: { ...p.screen_reviews, [id]: { ...p.screen_reviews[id], comments } } }));
  }
  function setAssumptionConfirmed(id: string, confirmed: boolean) {
    setReview(p => ({ ...p, assumption_reviews: { ...p.assumption_reviews, [id]: { ...p.assumption_reviews[id], confirmed } } }));
  }
  function setAssumptionComment(id: string, comments: string) {
    setReview(p => ({ ...p, assumption_reviews: { ...p.assumption_reviews, [id]: { ...p.assumption_reviews[id], comments } } }));
  }

  // ── Estilos reutilizables ──────────────────────────────────────────────────

  const s = {
    wrap:    { minHeight: '100vh', background: '#f5f7fb', fontFamily: "'Inter',system-ui,sans-serif", padding: '0 0 60px' } as React.CSSProperties,
    bar:     { padding: '14px 28px', background: '#1a1d23', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky' as const, top: 0, zIndex: 10 },
    logo:    { width: 32, height: 32, borderRadius: 8, background: '#0d6efd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff' },
    content: { maxWidth: 780, margin: '0 auto', padding: '32px 24px' },
    section: { background: '#fff', borderRadius: 12, border: '1px solid #e9ecef', marginBottom: 24, overflow: 'hidden' } as React.CSSProperties,
    secHead: { padding: '16px 24px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', gap: 10 } as React.CSSProperties,
    secBody: { padding: '20px 24px' } as React.CSSProperties,
    badge:   (color: string) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: color, color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }),
    card:    { background: '#f9fafb', borderRadius: 10, padding: 18, border: '1px solid #f0f2f5', marginBottom: 14 } as React.CSSProperties,
    label:   { fontSize: 11, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 4 },
    qText:   { margin: 0, fontSize: 14, fontWeight: 600, color: '#111827', lineHeight: 1.5 } as React.CSSProperties,
    why:     { margin: '4px 0 0', fontSize: 12, color: '#6b7280', fontStyle: 'italic' as const },
    ta:      { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' as const, outline: 'none', resize: 'vertical' as const, fontFamily: 'inherit', lineHeight: 1.5 },
    btn:     (bg: string, active: boolean) => ({ padding: '7px 16px', borderRadius: 7, border: 'none', background: active ? bg : '#f3f4f6', color: active ? '#fff' : '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }),
    submit:  (disabled: boolean) => ({ width: '100%', padding: 13, borderRadius: 9, border: 'none', background: disabled ? '#93c5fd' : '#0d6efd', color: '#fff', fontSize: 15, fontWeight: 700, cursor: disabled ? 'wait' : 'pointer' }),
  };

  // ── Layouts de cada step ──────────────────────────────────────────────────

  if (step === 'loading') return (
    <div style={{ ...s.wrap, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#9ca3af' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #e5e7eb', borderTopColor: '#0d6efd', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ margin: 0, fontSize: 14 }}>Verificando link…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (step === 'invalid' || step === 'expired') return (
    <div style={{ ...s.wrap, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', background: '#fff', padding: 40, borderRadius: 16, border: '1px solid #e9ecef' }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>🔒</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#111827' }}>
          {step === 'expired' ? 'Link expirado' : 'Link no válido'}
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
          {step === 'expired' ? 'Contacta al equipo de Proyectos SOC para recibir un nuevo link.' : 'Este link no existe o ya fue utilizado.'}
        </p>
      </div>
    </div>
  );

  if (step === 'done') return (
    <div style={{ ...s.wrap, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', background: '#fff', padding: 48, borderRadius: 16, border: '1px solid #e9ecef', maxWidth: 460 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>✓</div>
        <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 700, color: '#111827' }}>¡Gracias!</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>
          Tu confirmación fue enviada al equipo de Proyectos SOC. Nos pondremos en contacto si necesitamos algo más.
        </p>
      </div>
    </div>
  );

  if (step === 'processing') return (
    <div style={{ ...s.wrap, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', background: '#fff', padding: 48, borderRadius: 16, border: '1px solid #e9ecef', maxWidth: 460 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #e5e7eb', borderTopColor: '#0d6efd', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 700, color: '#111827' }}>Procesando tu Excel…</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>
          El agente está analizando los datos y preparando las pantallas propuestas. Cuando termine recibirás un nuevo link con el paquete de confirmación.
        </p>
      </div>
    </div>
  );

  // ── Step: upload ───────────────────────────────────────────────────────────
  if (step === 'upload') return (
    <div style={s.wrap}>
      <div style={s.bar}>
        <div style={s.logo}>S</div>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>SOC · Proyectos</span>
      </div>
      <div style={s.content}>
        <div style={{ marginBottom: 28 }}>
          <p style={{ margin: '0 0 4px', ...s.label }}>Área: {info?.area_name}</p>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Enviar información del Excel</h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: '#6b7280' }}>
            Copia y pega el contenido de tu Excel — columnas, datos de ejemplo y cómo se usa cada campo en tu trabajo diario.
          </p>
        </div>

        {error && <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontSize: 13, border: '1px solid #fecaca' }}>{error}</div>}

        <div style={s.section}>
          <div style={s.secBody}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4b5563', marginBottom: 6 }}>Nombre del archivo (opcional)</label>
              <input value={fileName} onChange={e => setFileName(e.target.value)} placeholder="Ej: Reporte_Marketing_Junio2026.xlsx"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4b5563', marginBottom: 6 }}>Contenido del Excel *</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={12}
                placeholder="Pega aquí el contenido de tu Excel: columnas, filas de ejemplo, y una descripción breve de para qué sirve cada campo…"
                style={s.ta} />
              <div style={{ marginTop: 4, fontSize: 11, color: '#9ca3af' }}>{content.length.toLocaleString()} caracteres</div>
            </div>
          </div>
        </div>

        <button onClick={handleUpload} disabled={sending || !content.trim()} style={s.submit(sending || !content.trim())}>
          {sending ? 'Enviando…' : 'Enviar información'}
        </button>
        <p style={{ margin: '14px 0 0', fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
          Esta información solo será usada por el equipo de Proyectos SOC para el desarrollo interno.
        </p>
      </div>
    </div>
  );

  // ── Step: reviewing ────────────────────────────────────────────────────────
  const questions   = qaDoc?.questions   ?? [];
  const screens     = qaDoc?.screens     ?? [];
  const assumptions = qaDoc?.assumptions ?? [];

  const pendingScreens = screens.filter(s => review.screen_reviews[s.id]?.status === 'pending').length;
  const changesScreens = screens.filter(s => review.screen_reviews[s.id]?.status === 'changes_requested').length;

  return (
    <div style={s.wrap}>
      <div style={s.bar}>
        <div style={s.logo}>S</div>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>SOC · Proyectos</span>
        <span style={{ marginLeft: 'auto', color: '#9ca3af', fontSize: 12 }}>Área: {info?.area_name}</span>
      </div>

      <div style={s.content}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: '#111827' }}>Paquete de Confirmación</h1>
          <p style={{ margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
            Revisamos tu Excel y preparamos lo siguiente. Responde las preguntas, revisa las pantallas propuestas y confirma los supuestos para que podamos generar el requerimiento final.
          </p>
        </div>

        {error && <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontSize: 13, border: '1px solid #fecaca' }}>{error}</div>}

        {/* ── Bloque 1: Preguntas ─────────────────────────────────────────── */}
        {questions.length > 0 && (
          <div style={s.section}>
            <div style={s.secHead}>
              <div style={s.badge('#0d6efd')}>1</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Preguntas sobre tu Excel</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{questions.length} pregunta{questions.length !== 1 ? 's' : ''} — responde con el detalle que puedas</div>
              </div>
            </div>
            <div style={s.secBody}>
              {questions.map((q, i) => (
                <div key={q.id} style={s.card}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ ...s.badge('#374151'), width: 22, height: 22, fontSize: 11 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      {(q.section || q.field) && (
                        <div style={s.label}>{q.section}{q.field ? ` — ${q.field}` : ''}</div>
                      )}
                      <p style={s.qText}>{q.question}</p>
                      {q.why && <p style={s.why}>{q.why}</p>}
                    </div>
                  </div>
                  <textarea
                    value={review.question_answers[q.id] ?? ''}
                    onChange={e => setQAnswer(q.id, e.target.value)}
                    placeholder="Tu respuesta…"
                    rows={3}
                    style={s.ta}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Bloque 2: Wireframes ────────────────────────────────────────── */}
        {screens.length > 0 && (
          <div style={s.section}>
            <div style={s.secHead}>
              <div style={s.badge('#7c3aed')}>2</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Pantallas propuestas</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  Así visualizamos el módulo en SISEC. Aprueba o solicita cambios en cada pantalla.
                </div>
              </div>
              {pendingScreens > 0 && (
                <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 12 }}>
                  {pendingScreens} por revisar
                </span>
              )}
            </div>
            <div style={s.secBody}>
              {screens.map((sc) => {
                const rev = review.screen_reviews[sc.id] ?? { status: 'pending', comments: '' };
                const borderColor = rev.status === 'approved' ? '#059669' : rev.status === 'changes_requested' ? '#dc2626' : '#e5e7eb';
                return (
                  <div key={sc.id} style={{ ...s.card, borderColor, borderWidth: 2 }}>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 3 }}>{sc.name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{sc.description}</div>
                    </div>

                    {/* Wireframe HTML */}
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'auto', marginBottom: 14, background: '#fafafa' }}>
                      <div
                        style={{ minHeight: 160, padding: 12 }}
                        dangerouslySetInnerHTML={{ __html: sc.html }}
                      />
                    </div>

                    {/* Botones de aprobación */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: rev.status === 'changes_requested' ? 12 : 0 }}>
                      <button onClick={() => setScreenStatus(sc.id, 'approved')} style={s.btn('#059669', rev.status === 'approved')}>
                        ✓ Aprobado
                      </button>
                      <button onClick={() => setScreenStatus(sc.id, 'changes_requested')} style={s.btn('#dc2626', rev.status === 'changes_requested')}>
                        ✎ Solicitar cambios
                      </button>
                    </div>

                    {rev.status === 'changes_requested' && (
                      <textarea
                        value={rev.comments}
                        onChange={e => setScreenComment(sc.id, e.target.value)}
                        placeholder="¿Qué cambios necesitas en esta pantalla? (columnas, flujo, datos, diseño…)"
                        rows={3}
                        style={s.ta}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Bloque 3: Supuestos ─────────────────────────────────────────── */}
        {assumptions.length > 0 && (
          <div style={s.section}>
            <div style={s.secHead}>
              <div style={s.badge('#d97706')}>3</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Supuestos del agente</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Confirma si estos supuestos son correctos o corrígenos</div>
              </div>
            </div>
            <div style={s.secBody}>
              {assumptions.map((a, i) => {
                const ar = review.assumption_reviews[a.id] ?? { confirmed: false, comments: '' };
                return (
                  <div key={a.id} style={s.card}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ ...s.badge('#d97706'), width: 22, height: 22, fontSize: 11 }}>{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ ...s.qText, marginBottom: 3 }}>{a.text}</p>
                        {a.context && <p style={s.why}>{a.context}</p>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: ar.comments !== undefined ? 10 : 0 }}>
                      <button onClick={() => setAssumptionConfirmed(a.id, true)} style={s.btn('#059669', ar.confirmed)}>
                        ✓ Correcto
                      </button>
                      <button onClick={() => setAssumptionConfirmed(a.id, false)} style={s.btn('#dc2626', !ar.confirmed)}>
                        ✗ No es así
                      </button>
                    </div>
                    {!ar.confirmed && (
                      <textarea
                        value={ar.comments}
                        onChange={e => setAssumptionComment(a.id, e.target.value)}
                        placeholder="¿Cómo es en realidad? Corrígenos aquí…"
                        rows={2}
                        style={s.ta}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Resumen y envío ─────────────────────────────────────────────── */}
        {changesScreens > 0 && (
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#9a3412' }}>
            Tienes {changesScreens} pantalla{changesScreens !== 1 ? 's' : ''} con cambios solicitados. El equipo los revisará y te enviará una versión actualizada.
          </div>
        )}

        <button onClick={handleReview} disabled={sending} style={s.submit(sending)}>
          {sending ? 'Enviando…' : 'Enviar confirmación al equipo SOC'}
        </button>
        <p style={{ margin: '12px 0 0', fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
          Puedes enviar aunque tengas cambios pendientes — el equipo los revisará contigo.
        </p>
      </div>
    </div>
  );
}
