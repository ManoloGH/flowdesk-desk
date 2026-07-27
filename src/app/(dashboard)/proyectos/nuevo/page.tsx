'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Save, Loader2, Sparkles } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ── Types ──────────────────────────────────────────────────────────────────────

type Mode      = 'intake' | 'directo';
type IntakeStep = 'form' | 'processing' | 'reviewing' | 'creating';

interface QAQuestion   { id: string; section: string; field: string | null; question: string; why: string }
interface QAScreen     { id: string; name: string; description: string; html: string }
interface QAAssumption { id: string; text: string; context: string }
interface QADoc        { questions?: QAQuestion[]; screens?: QAScreen[]; assumptions?: QAAssumption[] }

interface ScreenReview     { status: 'pending' | 'approved' | 'changes_requested'; comments: string }
interface AssumptionReview { confirmed: boolean; comments: string }
interface ReviewState {
  question_answers:   Record<string, string>;
  screen_reviews:     Record<string, ScreenReview>;
  assumption_reviews: Record<string, AssumptionReview>;
}

const DOC_TYPES = [
  { value: 'MEJORA',            label: 'Mejora' },
  { value: 'NUEVO_DESARROLLO',  label: 'Nuevo desarrollo' },
  { value: 'CORRECCION',        label: 'Corrección' },
  { value: 'MANTENIMIENTO',     label: 'Mantenimiento' },
];

async function publicFetch<T>(path: string, opts?: RequestInit): Promise<T> {
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

// ── Component ──────────────────────────────────────────────────────────────────

export default function NuevoRequerimientoPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('intake');

  // ── Intake state ───────────────────────────────────────────────────────────
  const [intakeStep,  setIntakeStep]  = useState<IntakeStep>('form');
  const [intakeToken, setIntakeToken] = useState('');
  const [uploadId,    setUploadId]    = useState('');
  const [qaDoc,       setQaDoc]       = useState<QADoc | null>(null);

  const [solicitante,    setSolicitante]    = useState('');
  const [areaSol,        setAreaSol]        = useState('');
  const [tipoDesarrollo, setTipoDesarrollo] = useState('');
  const [descripcion,    setDescripcion]    = useState('');
  const [excelFileName,  setExcelFileName]  = useState('');
  const [excelData,      setExcelData]      = useState('');
  const [fileLoading,    setFileLoading]    = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [review,  setReview]  = useState<ReviewState>({ question_answers: {}, screen_reviews: {}, assumption_reviews: {} });
  const [sending, setSending] = useState(false);
  const [error,   setError]   = useState('');

  // ── Directo state ──────────────────────────────────────────────────────────
  const [saving,     setSaving]     = useState(false);
  const [errDirecto, setErrDirecto] = useState('');
  const [form, setForm] = useState({
    title: '', doc_type: 'MEJORA', requested_by: '', requested_by_email: '',
    responsible_business: '', responsible_systems: '', current_situation: '',
    problem_statement: '', objective: '', related_systems: '', estimated_duration: '',
    intake_source: 'FORMULARIO',
  });
  function setF(field: string, value: string) { setForm(p => ({ ...p, [field]: value })); }

  // ── Poll questionnaire (timeout 4 min) ────────────────────────────────────
  useEffect(() => {
    if (intakeStep !== 'processing' || !intakeToken) return;
    const start = Date.now();
    const TIMEOUT_MS = 4 * 60 * 1000;

    const iv = setInterval(async () => {
      if (Date.now() - start > TIMEOUT_MS) {
        clearInterval(iv);
        setError('El análisis tardó demasiado. Por favor intenta de nuevo.');
        setIntakeStep('form');
        return;
      }
      try {
        const data = await publicFetch<any>(`/proyectos-soc/intake/area/${intakeToken}`);
        if (data.excel_upload?.questionnaire) {
          clearInterval(iv);
          const doc: QADoc = JSON.parse(data.excel_upload.questionnaire.qa_document ?? '{}');
          setQaDoc(doc);
          const sr: Record<string, ScreenReview> = {};
          doc.screens?.forEach(s => { sr[s.id] = { status: 'pending', comments: '' }; });
          const ar: Record<string, AssumptionReview> = {};
          doc.assumptions?.forEach(a => { ar[a.id] = { confirmed: false, comments: '' }; });
          setReview(p => ({ ...p, screen_reviews: sr, assumption_reviews: ar }));
          setIntakeStep('reviewing');
        }
      } catch { /* keep polling */ }
    }, 4000);
    return () => clearInterval(iv);
  }, [intakeStep, intakeToken]);

  // ── Intake handlers ────────────────────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileLoading(true);
    setExcelFileName(file.name);
    try {
      if (file.name.match(/\.(csv|txt|tsv)$/i)) {
        setExcelData(await file.text());
      } else {
        const XLSX = await import('xlsx');
        const buf  = await file.arrayBuffer();
        const wb   = XLSX.read(buf, { type: 'array' });
        const lines: string[] = [];
        for (const name of wb.SheetNames) {
          lines.push(`=== Hoja: ${name} ===`);
          lines.push(XLSX.utils.sheet_to_csv(wb.Sheets[name]));
        }
        setExcelData(lines.join('\n\n'));
      }
    } catch { setError('No se pudo leer el archivo.'); }
    finally   { setFileLoading(false); }
  }

  async function handleIntakeSubmit() {
    if (!solicitante.trim()) { setError('El nombre del solicitante es obligatorio.'); return; }
    if (!descripcion.trim()) { setError('La descripción del proceso es obligatoria.'); return; }
    setSending(true); setError('');
    try {
      const { token, upload_id } = await api.post<{ token: string; upload_id: string }>(
        '/proyectos-soc/intake/tokens',
        { area_name: areaSol || solicitante, expires_days: 3 },
      );
      setIntakeToken(token);
      setUploadId(upload_id);

      const content = [
        `Solicitante: ${solicitante}`,
        `Área: ${areaSol || '—'}`,
        `Tipo de desarrollo: ${tipoDesarrollo === 'modificacion' ? 'Modificación a sistema existente' : tipoDesarrollo === 'nuevo' ? 'Nuevo desarrollo' : 'No especificado'}`,
        '',
        '=== Descripción del proceso ===',
        descripcion,
        ...(excelData ? ['', '=== Datos del Excel ===', excelData] : []),
      ].join('\n');

      await publicFetch(`/proyectos-soc/intake/area/${token}/submit`, {
        method: 'POST',
        body: JSON.stringify({ content, file_name: excelFileName || solicitante }),
      });
      setIntakeStep('processing');
    } catch (err: any) { setError(err?.message ?? 'Error al enviar'); }
    finally             { setSending(false); }
  }

  async function handleReviewSubmit() {
    setSending(true); setError('');
    try {
      await publicFetch(`/proyectos-soc/intake/area/${intakeToken}/answer`, {
        method: 'POST',
        body: JSON.stringify({ area_answers: review }),
      });
      setIntakeStep('creating');
      const req = await api.post<{ id: string }>(`/proyectos-soc/requirements/from-intake/${uploadId}`, {});
      router.push(`/proyectos/${req.id}?generate=true`);
    } catch (err: any) {
      setError(err?.message ?? 'Error al crear el requerimiento');
      setIntakeStep('reviewing');
    } finally { setSending(false); }
  }

  function setQAnswer(id: string, val: string)               { setReview(p => ({ ...p, question_answers: { ...p.question_answers, [id]: val } })); }
  function setScreenStatus(id: string, s: ScreenReview['status']) { setReview(p => ({ ...p, screen_reviews: { ...p.screen_reviews, [id]: { ...p.screen_reviews[id], status: s } } })); }
  function setScreenComment(id: string, c: string)           { setReview(p => ({ ...p, screen_reviews: { ...p.screen_reviews, [id]: { ...p.screen_reviews[id], comments: c } } })); }
  function setAssumptionOk(id: string, ok: boolean)         { setReview(p => ({ ...p, assumption_reviews: { ...p.assumption_reviews, [id]: { ...p.assumption_reviews[id], confirmed: ok } } })); }
  function setAssumptionComment(id: string, c: string)       { setReview(p => ({ ...p, assumption_reviews: { ...p.assumption_reviews, [id]: { ...p.assumption_reviews[id], comments: c } } })); }

  // ── Directo handler ────────────────────────────────────────────────────────
  async function handleDirectoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setErrDirecto('El título es obligatorio.'); return; }
    setSaving(true); setErrDirecto('');
    try {
      const req = await api.post<{ id: string }>('/proyectos-soc/requirements', form);
      router.push(`/proyectos/${req.id}`);
    } catch (err: any) { setErrDirecto(err?.message ?? 'Error'); }
    finally             { setSaving(false); }
  }

  // ── Style tokens ───────────────────────────────────────────────────────────
  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box', outline: 'none' };
  const ta:  React.CSSProperties = { ...inp, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' };
  const sec: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 };
  const secHead: React.CSSProperties = { padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 };
  const secBody: React.CSSProperties = { padding: '18px 20px' };
  const card: React.CSSProperties = { background: 'var(--surface-2)', borderRadius: 10, padding: 16, border: '1px solid var(--border)', marginBottom: 12 };
  const badge = (color: string): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: color, color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 });
  const toggleBtn = (active: boolean, color: string): React.CSSProperties => ({ padding: '7px 14px', borderRadius: 7, border: 'none', background: active ? color : 'var(--surface-2)', color: active ? '#fff' : 'var(--text-3)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' });
  const primaryBtn = (disabled: boolean): React.CSSProperties => ({ width: '100%', padding: 12, borderRadius: 9, border: 'none', background: disabled ? 'var(--surface-2)' : 'linear-gradient(135deg, var(--fd-cyan), var(--fd-blue))', color: disabled ? 'var(--text-3)' : '#fff', fontSize: 14, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'opacity .15s' });

  // ── Render: intake steps ───────────────────────────────────────────────────

  function renderIntakeForm() {
    const canSubmit = solicitante.trim() && descripcion.trim();
    return (
      <>
        <div style={sec}>
          <div style={secHead}><div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Datos del solicitante</div></div>
          <div style={secBody}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div>
                <label style={lbl}>Nombre del solicitante <span style={{ color: '#dc2626' }}>*</span></label>
                <input value={solicitante} onChange={e => setSolicitante(e.target.value)} placeholder="Ej: Ana García" style={inp} />
              </div>
              <div>
                <label style={lbl}>Área del solicitante</label>
                <input value={areaSol} onChange={e => setAreaSol(e.target.value)} placeholder="Ej: Marketing Digital" style={inp} />
              </div>
            </div>
            <div>
              <label style={lbl}>¿Modificación a sistema existente o nuevo desarrollo?</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { value: 'modificacion', label: '✎  Modificación a sistema existente' },
                  { value: 'nuevo',        label: '✦  Nuevo desarrollo' },
                ].map(opt => (
                  <button key={opt.value} type="button" onClick={() => setTipoDesarrollo(opt.value)}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      border: tipoDesarrollo === opt.value ? '2px solid var(--fd-cyan)' : '2px solid var(--border)',
                      background: tipoDesarrollo === opt.value ? 'rgba(29,189,240,0.08)' : 'var(--surface-2)',
                      color: tipoDesarrollo === opt.value ? 'var(--fd-cyan)' : 'var(--text-2)', transition: 'all .15s' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={sec}>
          <div style={secHead}><div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Descripción del proceso</div></div>
          <div style={secBody}>
            <label style={lbl}>¿Cómo y cuándo llenan el Excel? ¿De dónde sacan la información? <span style={{ color: '#dc2626' }}>*</span></label>
            <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={6}
              placeholder="Explica el proceso: con qué frecuencia lo llenan, qué información capturan, de qué sistemas o fuentes obtienen los datos, quién más lo usa o consulta…"
              style={ta} />
          </div>
        </div>

        <div style={sec}>
          <div style={secHead}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Adjuntar Excel</div>
            <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 6 }}>(opcional pero recomendado)</span>
          </div>
          <div style={secBody}>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.txt,.tsv" style={{ display: 'none' }} onChange={handleFileChange} />
            <div onClick={() => !fileLoading && fileRef.current?.click()}
              style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '20px', textAlign: 'center', cursor: fileLoading ? 'wait' : 'pointer', background: 'var(--surface-2)', transition: 'border-color .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--fd-cyan)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; }}>
              {fileLoading ? (
                <p style={{ margin: 0, color: 'var(--text-2)', fontSize: 13 }}>Leyendo archivo…</p>
              ) : excelData ? (
                <>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>✅</div>
                  <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{excelFileName}</p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-3)' }}>{excelData.length.toLocaleString()} caracteres · Clic para cambiar</p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>📊</div>
                  <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-2)' }}>Soporta .xlsx, .xls, .csv</p>
                  <div style={{ display: 'inline-block', background: 'var(--surface)', color: 'var(--text-2)', padding: '5px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, border: '1px solid var(--border)' }}>
                    Buscar archivo
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <button onClick={handleIntakeSubmit} disabled={sending || !canSubmit} style={primaryBtn(sending || !canSubmit)}>
          {sending ? 'Enviando…' : 'Analizar con IA →'}
        </button>
        <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>
          El agente analizará el proceso y generará preguntas + wireframes. Toma ~30 segundos.
        </p>
      </>
    );
  }

  function renderProcessing() {
    return (
      <div style={{ textAlign: 'center', padding: '56px 24px', ...sec }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--fd-cyan)', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
        <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Analizando tu solicitud…</h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
          El agente revisa el proceso, genera preguntas y diseña las pantallas propuestas.<br />
          Esta página se actualizará automáticamente cuando esté listo.
        </p>
      </div>
    );
  }

  function renderReviewing() {
    const questions   = qaDoc?.questions   ?? [];
    const screens     = qaDoc?.screens     ?? [];
    const assumptions = qaDoc?.assumptions ?? [];
    const pendingScreens = screens.filter(sc => review.screen_reviews[sc.id]?.status === 'pending').length;
    const changesScreens = screens.filter(sc => review.screen_reviews[sc.id]?.status === 'changes_requested').length;

    return (
      <>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Paquete de Confirmación</h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>
            El agente preparó preguntas, wireframes y supuestos. Revisa y confirma para generar el R-ISO.
          </p>
        </div>

        {questions.length > 0 && (
          <div style={sec}>
            <div style={secHead}>
              <div style={badge('#0d6efd')}>1</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Preguntas sobre el proceso</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{questions.length} pregunta{questions.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
            <div style={secBody}>
              {questions.map((q, i) => (
                <div key={q.id} style={card}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-start' }}>
                    <div style={{ ...badge('#374151'), width: 20, height: 20, fontSize: 10 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      {(q.section || q.field) && <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{q.section}{q.field ? ` — ${q.field}` : ''}</div>}
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.5 }}>{q.question}</p>
                      {q.why && <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>{q.why}</p>}
                    </div>
                  </div>
                  <textarea value={review.question_answers[q.id] ?? ''} onChange={e => setQAnswer(q.id, e.target.value)}
                    placeholder="Tu respuesta…" rows={3} style={ta} />
                </div>
              ))}
            </div>
          </div>
        )}

        {screens.length > 0 && (
          <div style={sec}>
            <div style={secHead}>
              <div style={badge('#7c3aed')}>2</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Pantallas propuestas</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Aprueba o solicita cambios en cada pantalla</div>
              </div>
              {pendingScreens > 0 && (
                <span style={{ background: 'rgba(245,158,11,0.15)', color: '#d97706', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12 }}>
                  {pendingScreens} por revisar
                </span>
              )}
            </div>
            <div style={secBody}>
              {screens.map(sc => {
                const rev = review.screen_reviews[sc.id] ?? { status: 'pending', comments: '' };
                return (
                  <div key={sc.id} style={{ ...card, borderColor: rev.status === 'approved' ? '#059669' : rev.status === 'changes_requested' ? '#dc2626' : 'var(--border)', borderWidth: 2 }}>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>{sc.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{sc.description}</div>
                    </div>
                    <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'auto', marginBottom: 12, background: '#fff' }}>
                      <div style={{ minHeight: 140, padding: 10 }} dangerouslySetInnerHTML={{ __html: sc.html }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: rev.status === 'changes_requested' ? 10 : 0 }}>
                      <button onClick={() => setScreenStatus(sc.id, 'approved')}           style={toggleBtn(rev.status === 'approved', '#059669')}>✓ Aprobado</button>
                      <button onClick={() => setScreenStatus(sc.id, 'changes_requested')}  style={toggleBtn(rev.status === 'changes_requested', '#dc2626')}>✎ Cambios</button>
                    </div>
                    {rev.status === 'changes_requested' && (
                      <textarea value={rev.comments} onChange={e => setScreenComment(sc.id, e.target.value)}
                        placeholder="¿Qué cambios necesitas?" rows={3} style={ta} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {assumptions.length > 0 && (
          <div style={sec}>
            <div style={secHead}>
              <div style={badge('#d97706')}>3</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Supuestos del agente</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Confirma si son correctos</div>
              </div>
            </div>
            <div style={secBody}>
              {assumptions.map((a, i) => {
                const ar = review.assumption_reviews[a.id] ?? { confirmed: false, comments: '' };
                return (
                  <div key={a.id} style={card}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-start' }}>
                      <div style={{ ...badge('#d97706'), width: 20, height: 20, fontSize: 10 }}>{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{a.text}</p>
                        {a.context && <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>{a.context}</p>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: !ar.confirmed ? 10 : 0 }}>
                      <button onClick={() => setAssumptionOk(a.id, true)}  style={toggleBtn(ar.confirmed,  '#059669')}>✓ Correcto</button>
                      <button onClick={() => setAssumptionOk(a.id, false)} style={toggleBtn(!ar.confirmed, '#dc2626')}>✗ No es así</button>
                    </div>
                    {!ar.confirmed && (
                      <textarea value={ar.comments} onChange={e => setAssumptionComment(a.id, e.target.value)}
                        placeholder="¿Cómo es en realidad?" rows={2} style={ta} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {changesScreens > 0 && (
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#d97706' }}>
            Tienes {changesScreens} pantalla{changesScreens !== 1 ? 's' : ''} con cambios solicitados — se incluirán en el requerimiento.
          </div>
        )}

        <button onClick={handleReviewSubmit} disabled={sending} style={primaryBtn(sending)}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {sending ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={15} />}
            {sending ? 'Creando requerimiento…' : 'Confirmar y crear R-ISO'}
          </span>
        </button>
        <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>
          Se creará el requerimiento y podrás generar el documento completo con IA desde la ficha.
        </p>
      </>
    );
  }

  function renderCreating() {
    return (
      <div style={{ textAlign: 'center', padding: '56px 24px', ...sec }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: '#7c3aed', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
        <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Registrando requerimiento…</h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>Creando el R-ISO en el sistema de proyectos.</p>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  const inProgress = mode === 'intake' && intakeStep !== 'form';

  return (
    <div style={{ padding: '28px 32px', maxWidth: 820 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={() => router.push('/proyectos')}
          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={14} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>Nuevo requerimiento</h1>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)' }}>
            Proyectos SOC · {mode === 'intake' ? 'Intake guiado por IA' : 'Formulario directo'}
          </p>
        </div>
      </div>

      {/* Mode tabs — only shown when not mid-intake */}
      {!inProgress && (
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {([
            { key: 'intake',  label: '✦ Intake guiado por IA' },
            { key: 'directo', label: '✎ Formulario directo' },
          ] as const).map(opt => (
            <button key={opt.key} onClick={() => setMode(opt.key)}
              style={{ padding: '8px 20px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all .15s',
                background: mode === opt.key ? 'linear-gradient(135deg, var(--fd-cyan), var(--fd-blue))' : 'transparent',
                color: mode === opt.key ? '#fff' : 'var(--text-3)' }}>
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Errors */}
      {(error || errDirecto) && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', color: '#dc2626', fontSize: 13, border: '1px solid rgba(239,68,68,0.2)' }}>
          {error || errDirecto}
        </div>
      )}

      {/* ── INTAKE MODE ──────────────────────────────────────────────────── */}
      {mode === 'intake' && intakeStep === 'form'       && renderIntakeForm()}
      {mode === 'intake' && intakeStep === 'processing' && renderProcessing()}
      {mode === 'intake' && intakeStep === 'reviewing'  && renderReviewing()}
      {mode === 'intake' && intakeStep === 'creating'   && renderCreating()}

      {/* ── DIRECTO MODE ─────────────────────────────────────────────────── */}
      {mode === 'directo' && (
        <form onSubmit={handleDirectoSubmit}>
          <div style={{ ...sec, padding: 24 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Identificación</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Tipo de documento</label>
              <select value={form.doc_type} onChange={e => setF('doc_type', e.target.value)}
                style={{ ...inp }}>
                {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Título del requerimiento <span style={{ color: '#dc2626' }}>*</span></label>
              <input value={form.title} onChange={e => setF('title', e.target.value)}
                placeholder="Ej: Automatización de reporte mensual de cartera hipotecaria" style={inp} />
            </div>
          </div>

          <div style={{ ...sec, padding: 24 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Responsables</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={lbl}>Solicitado por</label>
                <input value={form.requested_by} onChange={e => setF('requested_by', e.target.value)} placeholder="Nombre del solicitante" style={{ ...inp, marginBottom: 14 }} />
                <label style={lbl}>Email del solicitante</label>
                <input value={form.requested_by_email} onChange={e => setF('requested_by_email', e.target.value)} type="email" placeholder="nombre@soc.mx" style={inp} />
              </div>
              <div>
                <label style={lbl}>Responsable de negocio</label>
                <input value={form.responsible_business} onChange={e => setF('responsible_business', e.target.value)} placeholder="Área o persona de negocio" style={{ ...inp, marginBottom: 14 }} />
                <label style={lbl}>Responsable de sistemas</label>
                <input value={form.responsible_systems} onChange={e => setF('responsible_systems', e.target.value)} placeholder="Área o persona de TI" style={inp} />
              </div>
            </div>
          </div>

          <div style={{ ...sec, padding: 24 }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Contexto</h2>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--text-3)' }}>El agente IA completará y enriquecerá estas secciones.</p>
            {([
              { label: 'Situación actual',          key: 'current_situation',  ph: 'Describe cómo se hace hoy este proceso…',                        rows: 3 },
              { label: 'Planteamiento del problema', key: 'problem_statement',  ph: 'Qué problema origina este requerimiento…',                       rows: 3 },
              { label: 'Objetivo',                  key: 'objective',          ph: 'Qué se quiere lograr…',                                          rows: 2 },
              { label: 'Sistemas relacionados',     key: 'related_systems',    ph: 'SISEC, Excel, otros sistemas…',                                  rows: 2 },
            ] as const).map(({ label, key, ph, rows }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={lbl}>{label}</label>
                <textarea value={(form as any)[key]} onChange={e => setF(key, e.target.value)} placeholder={ph} rows={rows} style={ta} />
              </div>
            ))}
          </div>

          <div style={{ ...sec, padding: 24, marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Planeación</h2>
            <label style={lbl}>Duración estimada</label>
            <input value={form.estimated_duration} onChange={e => setF('estimated_duration', e.target.value)} placeholder="Ej: 2 semanas, 1 sprint" style={inp} />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => router.push('/proyectos')}
              style={{ padding: '9px 18px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 9, border: 'none',
                background: saving ? 'var(--surface-2)' : 'linear-gradient(135deg, var(--fd-cyan), var(--fd-blue))',
                color: saving ? 'var(--text-3)' : '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
              {saving ? 'Guardando…' : 'Crear requerimiento'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
