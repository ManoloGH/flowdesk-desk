'use client';
import { useEffect, useRef, useState } from 'react';
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
  const [solicitante, setSolicitante]       = useState('');
  const [areaSol, setAreaSol]               = useState('');
  const [tipoDesarrollo, setTipoDesarrollo] = useState('');
  const [descripcion, setDescripcion]       = useState('');
  const [excelFileName, setExcelFileName]   = useState('');
  const [excelData, setExcelData]           = useState('');
  const [review, setReview]     = useState<ReviewState>({ question_answers: {}, screen_reviews: {}, assumption_reviews: {} });
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState('');
  const [qaDoc, setQaDoc]       = useState<QADoc | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [folio, setFolio] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileLoading(true);
    setExcelFileName(file.name);
    try {
      if (file.name.match(/\.(csv|txt|tsv)$/i)) {
        const text = await file.text();
        setExcelData(text);
      } else {
        const XLSX = await import('xlsx');
        const buf  = await file.arrayBuffer();
        const wb   = XLSX.read(buf, { type: 'array' });
        const lines: string[] = [];
        for (const sheetName of wb.SheetNames) {
          lines.push(`=== Hoja: ${sheetName} ===`);
          const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheetName]);
          lines.push(csv);
        }
        setExcelData(lines.join('\n\n'));
      }
    } catch {
      setError('No se pudo leer el archivo. Prueba guardarlo como CSV e inténtalo de nuevo.');
    } finally {
      setFileLoading(false);
    }
  }

  async function handleUpload() {
    if (!solicitante.trim()) { setError('El nombre del solicitante es obligatorio.'); return; }
    if (!descripcion.trim()) { setError('Por favor describe cómo y cuándo usas el Excel.'); return; }
    setSending(true); setError('');

    const content = [
      `Solicitante: ${solicitante}`,
      `Área: ${areaSol || info?.area_name || '—'}`,
      `Tipo de desarrollo: ${tipoDesarrollo === 'modificacion' ? 'Modificación a sistema existente' : tipoDesarrollo === 'nuevo' ? 'Nuevo desarrollo' : 'No especificado'}`,
      '',
      '=== Descripción del proceso ===',
      descripcion,
      ...(excelData ? ['', '=== Datos del Excel ===', excelData] : []),
    ].join('\n');

    try {
      await apiFetch(`/proyectos-soc/intake/area/${token}/submit`, {
        method: 'POST',
        body: JSON.stringify({ content, file_name: excelFileName || solicitante }),
      });
      setStep('processing');
    } catch (err: any) { setError(err?.message ?? 'Error al enviar'); }
    finally { setSending(false); }
  }

  async function handleReview() {
    setSending(true); setError('');
    try {
      const res = await apiFetch<{ requirement?: { id: string; folio: string } }>(`/proyectos-soc/intake/area/${token}/answer`, {
        method: 'POST',
        body: JSON.stringify({ area_answers: review }),
      });
      if (res.requirement) setFolio(res.requirement.folio);
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
    ta:      { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' as const, outline: 'none', resize: 'vertical' as const, fontFamily: 'inherit', lineHeight: 1.5, color: '#fff' },
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
      <div style={{ textAlign: 'center', background: '#fff', padding: 48, borderRadius: 16, border: '1px solid #e9ecef', maxWidth: 480 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>✓</div>
        <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 700, color: '#111827' }}>¡Solicitud registrada!</h2>
        {folio && (
          <div style={{ display: 'inline-block', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 20px', margin: '0 0 16px', fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.05em' }}>
            {folio}
          </div>
        )}
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>
          Tu solicitud fue enviada al equipo de Proyectos SOC.{folio ? ' El folio de seguimiento es el que aparece arriba.' : ''} Nos pondremos en contacto si necesitamos algo más.
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
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Enviar solicitud de requerimiento</h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: '#6b7280' }}>
            Completa los datos del solicitante y describe cómo usas el Excel. El equipo de Proyectos SOC lo analizará y te enviará una propuesta de pantallas para confirmar.
          </p>
        </div>

        {error && <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontSize: 13, border: '1px solid #fecaca' }}>{error}</div>}

        <div style={s.section}>
          <div style={s.secBody}>

            {/* ── Datos del solicitante ────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4b5563', marginBottom: 6 }}>
                  Nombre del solicitante <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  value={solicitante}
                  onChange={e => setSolicitante(e.target.value)}
                  placeholder="Ej: Ana García"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' as const, outline: 'none', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4b5563', marginBottom: 6 }}>
                  Área del solicitante
                </label>
                <input
                  value={areaSol}
                  onChange={e => setAreaSol(e.target.value)}
                  placeholder="Ej: Marketing Digital"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' as const, outline: 'none', color: '#fff' }}
                />
              </div>
            </div>

            {/* ── Tipo de desarrollo ───────────────────────────────── */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4b5563', marginBottom: 8 }}>
                ¿Es modificación a sistema existente o nuevo desarrollo?
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { value: 'modificacion', label: '✎  Modificación a sistema existente' },
                  { value: 'nuevo',        label: '✦  Nuevo desarrollo' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTipoDesarrollo(opt.value)}
                    style={{
                      flex: 1, padding: '10px 14px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      border: tipoDesarrollo === opt.value ? '2px solid #0d6efd' : '2px solid #e5e7eb',
                      background: tipoDesarrollo === opt.value ? '#eff6ff' : '#f9fafb',
                      color: tipoDesarrollo === opt.value ? '#1d4ed8' : '#6b7280',
                      transition: 'all .15s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Descripción del proceso ──────────────────────────── */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4b5563', marginBottom: 6 }}>
                ¿Cómo y cuándo llenas este Excel? ¿De dónde sacas la información para llenarlo? <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                rows={6}
                placeholder="Explica el proceso: con qué frecuencia lo llenas, qué información capturas, de qué sistemas o fuentes obtienes los datos, quién más lo usa o lo consulta…"
                style={s.ta}
              />
            </div>

            {/* ── Archivo Excel (opcional) ─────────────────────────── */}
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv,.txt,.tsv"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4b5563', marginBottom: 8 }}>
                Adjuntar Excel (opcional pero recomendado)
              </label>
              <div
                onClick={() => !fileLoading && fileRef.current?.click()}
                style={{
                  border: '2px dashed #d1d5db', borderRadius: 10, padding: '20px', textAlign: 'center',
                  cursor: fileLoading ? 'wait' : 'pointer', background: '#f9fafb', transition: 'border-color .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#0d6efd')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = excelData ? '#059669' : '#d1d5db')}
              >
                {fileLoading ? (
                  <>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #e5e7eb', borderTopColor: '#0d6efd', animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                    <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Leyendo archivo…</p>
                  </>
                ) : excelData ? (
                  <>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>✅</div>
                    <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: '#111827' }}>{excelFileName}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>{excelData.length.toLocaleString()} caracteres · Haz clic para cambiar</p>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 26, marginBottom: 8 }}>📊</div>
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: '#6b7280' }}>Soporta .xlsx, .xls, .csv</p>
                    <div style={{ display: 'inline-block', background: '#f3f4f6', color: '#374151', padding: '6px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600 }}>
                      Buscar archivo
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>

        <button onClick={handleUpload} disabled={sending || !solicitante.trim() || !descripcion.trim()} style={s.submit(sending || !solicitante.trim() || !descripcion.trim())}>
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
