'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { X, Globe, ExternalLink } from 'lucide-react';

interface Props {
  proyectoId: string;
  nombreCliente: string;
  logoUrl?: string;
  files?: Record<string, string>;
  vercelUrl?: string;
  onClose: () => void;
  onUpdate: () => void;
}

const EMPTY_BRIEF = {
  nombre: '', slogan: '',
  color_primario: '#6366f1', color_secundario: '#4f46e5',
  tipografia_titular: 'Bebas Neue', tono: 'profesional',
  frase_impacto: '', subtitulo: '',
  puntos_clave: ['', '', ''],
  diferenciador: '', prueba_social: '',
  whatsapp: '', mensaje_whatsapp: 'Hola, me interesa saber más',
  logo_url: '', sector: '',
  redes_sociales: { instagram: '', facebook: '', tiktok: '', youtube: '', linkedin: '', twitter: '' },
};

const REDES = [
  { key: 'instagram', label: 'Instagram', ph: 'https://instagram.com/tu_perfil' },
  { key: 'facebook',  label: 'Facebook',  ph: 'https://facebook.com/tu_pagina' },
  { key: 'tiktok',    label: 'TikTok',    ph: 'https://tiktok.com/@tu_perfil' },
  { key: 'youtube',   label: 'YouTube',   ph: 'https://youtube.com/@tu_canal' },
  { key: 'linkedin',  label: 'LinkedIn',  ph: 'https://linkedin.com/company/...' },
  { key: 'twitter',   label: 'X / Twitter', ph: 'https://x.com/tu_perfil' },
];

const TIPOGRAFIAS = ['Bebas Neue', 'Oswald', 'Montserrat', 'Playfair Display', 'Raleway'];
const TONOS = [
  { value: 'profesional', label: 'Profesional' },
  { value: 'gaming',      label: 'Gaming / Impacto' },
  { value: 'filosófico',  label: 'Filosófico / Premium' },
  { value: 'minimalista', label: 'Minimalista' },
];

export default function WebBuilderModal({
  proyectoId, nombreCliente, logoUrl, files: initFiles, vercelUrl: initVercel, onClose, onUpdate,
}: Props) {
  const hasFiles = !!initFiles && Object.keys(initFiles).length > 0;
  const [step, setStep] = useState<'input' | 'building' | 'preview'>(hasFiles ? 'preview' : 'input');
  const [mode, setMode] = useState<'html' | 'brief' | 'instagram'>('brief');
  const [html, setHtml] = useState('');
  const [logo, setLogo] = useState(logoUrl ?? '');
  const [brief, setBrief] = useState(EMPTY_BRIEF);
  const [ig, setIg] = useState({ handle: '', whatsapp: '', email: '', datos_manuales: '' });

  // Auto-detect WhatsApp from connected FlowDesk instance
  useEffect(() => {
    api.get<{ owner_phone?: string }>('/secretary/config')
      .then(cfg => {
        if (cfg?.owner_phone) {
          setBrief(p => p.whatsapp ? p : { ...p, whatsapp: cfg.owner_phone! });
          setIg(p => p.whatsapp ? p : { ...p, whatsapp: cfg.owner_phone! });
        }
      })
      .catch(() => {});
  }, []);
  const [files, setFiles] = useState<Record<string, string>>(initFiles ?? {});
  const [activeFile, setActiveFile] = useState('index.html');
  const [vercelUrl, setVercelUrl] = useState(initVercel ?? '');
  const [deploying, setDeploying] = useState(false);
  const [building, setBuilding] = useState(false);
  const [dots, setDots] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [buildLog, setBuildLog] = useState<string[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  // Blob preview
  useEffect(() => {
    const content = files[activeFile];
    if (!content) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(new Blob([content], { type: 'text/html' }));
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [files, activeFile]);

  // Animated dots while building
  useEffect(() => {
    if (!building) return;
    const iv = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 600);
    return () => clearInterval(iv);
  }, [building]);

  // Polling — check files every 4s after starting a build
  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const startPoll = useCallback(() => {
    stopPoll();
    pollCountRef.current = 0;
    pollRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      // Timeout: 8 minutos (120 checks × 4s)
      if (pollCountRef.current > 120) {
        stopPoll();
        setBuilding(false);
        setStep('input');
        setError('La generación tardó demasiado. Revisa los logs de Railway y vuelve a intentarlo.');
        return;
      }
      try {
        const r = await api.get<{ files: Record<string, string>; fase: string; build_log?: any[] }>(`/web-builder-agent/${proyectoId}/files`);
        // Actualizar log de progreso
        if (r.build_log?.length) {
          const msgs = r.build_log.map((e: any) => `${e.phase}: ${e.message}`);
          setBuildLog(msgs.slice(-4));
        }
        if (r.files && Object.keys(r.files).length > 0) {
          setFiles(r.files);
          setBuilding(false);
          setStep('preview');
          onUpdate();
          stopPoll();
        }
      } catch {}
    }, 4000);
  }, [proyectoId, onUpdate, stopPoll]);

  useEffect(() => () => stopPoll(), [stopPoll]);

  const canStart = mode === 'html'
    ? !!html.trim()
    : mode === 'instagram'
    ? !!ig.handle.trim()
    : !!brief.nombre.trim() && !!brief.frase_impacto.trim() && !!brief.whatsapp.trim();

  const handleStart = async () => {
    if (!canStart) return;
    setBuilding(true); setError(''); setStep('building');
    try {
      if (mode === 'brief') {
        const redesFiltradas = Object.fromEntries(
          Object.entries(brief.redes_sociales).filter(([, v]) => (v as string).trim())
        );
        await api.post(`/web-builder-agent/${proyectoId}/build-from-brief`, {
          ...brief,
          puntos_clave: brief.puntos_clave.filter((p: string) => p.trim()),
          redes_sociales: Object.keys(redesFiltradas).length ? redesFiltradas : undefined,
        });
      } else if (mode === 'instagram') {
        await api.post(`/web-builder-agent/${proyectoId}/build-from-instagram`, {
          handle: ig.handle.replace('@', ''),
          whatsapp: ig.whatsapp || undefined,
          email: ig.email || undefined,
          datos_manuales: ig.datos_manuales || undefined,
        });
      } else {
        await api.post(`/web-builder-agent/${proyectoId}/build`, {
          html_original: html, logo_url: logo || undefined,
        });
      }
      startPoll();
    } catch (e: any) {
      setBuilding(false); setStep('input');
      setError(e?.message ?? 'Error al iniciar la construcción');
    }
  };

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      const r = await api.post<{ vercel_url: string }>(`/web-builder-agent/${proyectoId}/deploy`, {});
      setVercelUrl(r.vercel_url); onUpdate();
    } catch {}
    setDeploying(false);
  };

  const downloadAll = () => {
    Object.entries(files).forEach(([filename, content]) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([content], { type: 'text/html' }));
      a.download = filename; a.click();
      URL.revokeObjectURL(a.href);
    });
  };

  const setB = (k: string, v: any) => setBrief(p => ({ ...p, [k]: v }));
  const setPunto = (i: number, v: string) => setBrief(p => { const a = [...p.puntos_clave]; a[i] = v; return { ...p, puntos_clave: a }; });

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(6px)', zIndex: 300,
      display: 'flex', alignItems: 'stretch', fontFamily: "'Inter Tight', sans-serif",
    }}>
      <div style={{
        width: '100%', maxWidth: 1100, margin: 'auto',
        background: '#0d0d1f', borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', flexDirection: 'column', maxHeight: '95vh', overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Globe size={16} color="#fff" />
            </div>
            <div>
              <p style={{ margin: 0, color: '#f3f4f6', fontSize: 15, fontWeight: 700 }}>Web Builder</p>
              <p style={{ margin: 0, color: '#4b5563', fontSize: 11 }}>{nombreCliente}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {step === 'preview' && !vercelUrl && (
              <button onClick={handleDeploy} disabled={deploying} style={{
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', border: 'none',
                borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                opacity: deploying ? 0.6 : 1,
              }}>
                {deploying ? 'Publicando...' : '▲ Publicar en Vercel'}
              </button>
            )}
            {vercelUrl && (
              <a href={vercelUrl} target="_blank" rel="noopener noreferrer" style={{
                background: 'rgba(16,185,129,0.12)', color: '#34d399',
                border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8,
                padding: '8px 14px', fontSize: 13, fontWeight: 600, textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <ExternalLink size={12} /> {vercelUrl.replace('https://', '')}
              </a>
            )}
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#9ca3af', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {/* INPUT */}
          {step === 'input' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 22 }}>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#f87171', fontSize: 13 }}>
                  {error}
                </div>
              )}

              {/* Mode tabs */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 4 }}>
                {([
                  { key: 'brief', label: '✏️ Desde cero' },
                  { key: 'instagram', label: '📸 Desde Instagram' },
                  { key: 'html', label: '🌐 Importar HTML' },
                ] as const).map(m => (
                  <button key={m.key} onClick={() => setMode(m.key)} style={{
                    flex: 1, padding: '9px 0', background: mode === m.key ? 'rgba(99,102,241,0.2)' : 'none',
                    border: `1px solid ${mode === m.key ? 'rgba(99,102,241,0.45)' : 'transparent'}`,
                    borderRadius: 7, cursor: 'pointer',
                    color: mode === m.key ? '#a5b4fc' : '#6b7280',
                    fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                  }}>{m.label}</button>
                ))}
              </div>

              {/* BRIEF */}
              {mode === 'brief' && (
                <>
                  <Sec title="Tu marca">
                    <Grid2>
                      <F label="NOMBRE DE TU EMPRESA *"><input value={brief.nombre} onChange={e => setB('nombre', e.target.value)} placeholder="Mi Empresa" style={iSt} /></F>
                      <F label="SECTOR"><input value={brief.sector} onChange={e => setB('sector', e.target.value)} placeholder="restaurante, clínica, gym..." style={iSt} /></F>
                      <F label="COLOR PRINCIPAL">
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="color" value={brief.color_primario} onChange={e => setB('color_primario', e.target.value)} style={{ width: 42, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2, background: 'none' }} />
                          <input value={brief.color_primario} onChange={e => setB('color_primario', e.target.value)} style={{ ...iSt, flex: 1 }} />
                        </div>
                      </F>
                      <F label="TONO">
                        <select value={brief.tono} onChange={e => setB('tono', e.target.value)} style={iSt}>
                          {TONOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </F>
                    </Grid2>
                  </Sec>
                  <Sec title="Mensaje">
                    <F label="FRASE PRINCIPAL * (máx 6 palabras)" style={{ marginBottom: 10 }}>
                      <input value={brief.frase_impacto} onChange={e => setB('frase_impacto', e.target.value)} placeholder="Tu mejor frase de impacto" style={iSt} />
                    </F>
                    <F label="SUBTÍTULO (beneficio en 12 palabras)" style={{ marginBottom: 10 }}>
                      <input value={brief.subtitulo} onChange={e => setB('subtitulo', e.target.value)} placeholder="Lo que el cliente gana" style={iSt} />
                    </F>
                    <F label="DIFERENCIADOR (cierre poderoso)">
                      <input value={brief.diferenciador} onChange={e => setB('diferenciador', e.target.value)} placeholder="Por qué eres diferente" style={iSt} />
                    </F>
                  </Sec>
                  <Sec title="Contacto">
                    <Grid2>
                      <F label="WHATSAPP * (con código de país)">
                        <input value={brief.whatsapp} onChange={e => setB('whatsapp', e.target.value)} placeholder="5218001234567" style={iSt} />
                      </F>
                      <F label="PRUEBA SOCIAL">
                        <input value={brief.prueba_social} onChange={e => setB('prueba_social', e.target.value)} placeholder="+20 clientes satisfechos" style={iSt} />
                      </F>
                    </Grid2>
                    {brief.whatsapp && (
                      <p style={{ margin: '8px 0 0', color: '#4b5563', fontSize: 11 }}>
                        💡 Este es tu número de FlowDesk — los mensajes del sitio web llegarán directo a tu bandeja.
                      </p>
                    )}
                  </Sec>
                  <Sec title="Redes sociales (opcional)">
                    <p style={{ margin: '0 0 10px', color: '#6b7280', fontSize: 11 }}>Solo llena las que tengas. Las demás no aparecen en la web.</p>
                    <Grid2>
                      {REDES.map(r => (
                        <F key={r.key} label={r.label}>
                          <input
                            value={(brief.redes_sociales as any)[r.key] ?? ''}
                            onChange={e => setB('redes_sociales', { ...brief.redes_sociales, [r.key]: e.target.value })}
                            placeholder={r.ph}
                            style={iSt}
                          />
                        </F>
                      ))}
                    </Grid2>
                  </Sec>
                </>
              )}

              {/* INSTAGRAM */}
              {mode === 'instagram' && (
                <>
                  <div style={{ background: 'rgba(225,48,108,0.07)', border: '1px solid rgba(225,48,108,0.18)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                    <p style={{ margin: 0, color: '#f9a8d4', fontSize: 12, lineHeight: 1.6 }}>
                      Intentaremos extraer tu perfil automáticamente. Si no es posible, coloca tus fotos en <code style={{ background: '#1e1b4b', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>assets/instagram/</code> y añade tus datos en el campo de texto.
                    </p>
                  </div>
                  <Sec title="Tu perfil de Instagram">
                    <F label="HANDLE SIN @ *" style={{ marginBottom: 10 }}>
                      <input value={ig.handle} onChange={e => setIg(p => ({ ...p, handle: e.target.value }))} placeholder="miusuario" style={iSt} />
                    </F>
                    <Grid2>
                      <F label="WHATSAPP PARA CTA">
                        <input value={ig.whatsapp} onChange={e => setIg(p => ({ ...p, whatsapp: e.target.value }))} placeholder="5215512345678" style={iSt} />
                      </F>
                      <F label="EMAIL DE CONTACTO">
                        <input value={ig.email} onChange={e => setIg(p => ({ ...p, email: e.target.value }))} placeholder="hola@tudominio.com" style={iSt} />
                      </F>
                    </Grid2>
                  </Sec>
                  <Sec title="Datos manuales (si el scraping falla)">
                    <F label="BIO, SERVICIOS, PRECIOS — PEGA AQUÍ">
                      <textarea value={ig.datos_manuales} onChange={e => setIg(p => ({ ...p, datos_manuales: e.target.value }))}
                        placeholder={'Nombre: Tu nombre\nA qué te dedicas: Coach / Fotógrafo / ...\nServicios y precios: ...\nSeguidores: ...'}
                        rows={5} style={{ ...iSt, resize: 'vertical' }} />
                    </F>
                  </Sec>
                </>
              )}

              {/* HTML */}
              {mode === 'html' && (
                <Sec title="HTML del sitio actual">
                  <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
                    <p style={{ margin: 0, color: '#a5b4fc', fontSize: 12, lineHeight: 1.5 }}>
                      Ve a tu web actual → <strong>Ctrl+U</strong> → selecciona todo → copia → pega aquí.
                    </p>
                  </div>
                  <F label="HTML COMPLETO *" style={{ marginBottom: 12 }}>
                    <textarea value={html} onChange={e => setHtml(e.target.value)} placeholder="Pega el HTML completo aquí..." rows={10} style={{ ...iSt, fontFamily: 'ui-monospace, monospace', fontSize: 11, resize: 'vertical' }} />
                  </F>
                  <F label="URL DEL LOGO (opcional)">
                    <input value={logo} onChange={e => setLogo(e.target.value)} placeholder="https://..." style={iSt} />
                  </F>
                </Sec>
              )}

              <button onClick={handleStart} disabled={!canStart || building} style={{
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', border: 'none',
                borderRadius: 10, padding: '13px 28px', cursor: canStart ? 'pointer' : 'not-allowed',
                fontSize: 14, fontWeight: 700, width: '100%', marginTop: 8,
                opacity: !canStart ? 0.4 : 1,
              }}>
                🤖 {mode === 'instagram' ? '📸 Crear web de marca personal' : mode === 'brief' ? 'Construir mi web con IA' : 'Transformar HTML en web premium'}
              </button>
            </div>
          )}

          {/* BUILDING */}
          {step === 'building' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 40 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#a5b4fc', fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>
                  Construyendo tu web{dots}
                </p>
                <p style={{ color: '#4b5563', fontSize: 12, margin: 0 }}>
                  El agente de IA está generando tu landing page. Esto tarda 2–4 minutos.
                </p>
              </div>
              {buildLog.length > 0 ? (
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, padding: '12px 16px', maxWidth: 420, width: '100%' }}>
                  {buildLog.map((line, i) => (
                    <p key={i} style={{ margin: i === 0 ? 0 : '4px 0 0', color: i === buildLog.length - 1 ? '#a5b4fc' : '#4b5563', fontSize: 11, fontFamily: 'monospace' }}>
                      {i === buildLog.length - 1 ? '▶ ' : '✓ '}{line}
                    </p>
                  ))}
                </div>
              ) : (
                <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 10, padding: '12px 20px', textAlign: 'center', maxWidth: 360 }}>
                  <p style={{ color: '#6b7280', fontSize: 11, margin: 0, lineHeight: 1.6 }}>
                    📄 Generando páginas · 🎬 Efecto scroll · 📈 SEO · ✅ Vista previa lista
                  </p>
                </div>
              )}
            </div>
          )}

          {/* PREVIEW */}
          {step === 'preview' && (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: 4, padding: '10px 22px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, overflowX: 'auto' }}>
                {Object.keys(files).map(f => (
                  <button key={f} onClick={() => setActiveFile(f)} style={{
                    background: activeFile === f ? 'rgba(99,102,241,0.18)' : 'none',
                    border: `1px solid ${activeFile === f ? 'rgba(99,102,241,0.45)' : 'transparent'}`,
                    borderBottom: 'none', color: activeFile === f ? '#a5b4fc' : '#4b5563',
                    borderRadius: '6px 6px 0 0', padding: '6px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  }}>{f}</button>
                ))}
                <div style={{ flex: 1 }} />
                <button onClick={downloadAll} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#6b7280', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 11, marginBottom: 4 }}>⬇ Descargar</button>
                <button onClick={() => setStep('input')} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#6b7280', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 11, marginBottom: 4 }}>← Reconstruir</button>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                {previewUrl
                  ? <iframe key={activeFile + previewUrl} src={previewUrl} style={{ width: '100%', height: '100%', border: 'none' }} title={`Preview ${activeFile}`} />
                  : <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}>Sin vista previa</div>
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Micro helpers ── */
const iSt: React.CSSProperties = {
  width: '100%', background: '#080818', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 6, color: '#f3f4f6', fontSize: 13, padding: '8px 10px',
  outline: 'none', fontFamily: "'Inter Tight', sans-serif", boxSizing: 'border-box',
};

const lblSt: React.CSSProperties = {
  display: 'block', color: '#6b7280', fontSize: 10, fontWeight: 700,
  marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em',
};

function F({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={style}><label style={lblSt}>{label}</label>{children}</div>;
}
function Grid2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{children}</div>;
}
function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14, background: 'rgba(255,255,255,0.015)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.04)' }}>
      <p style={{ margin: '0 0 12px', color: '#6366f1', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</p>
      {children}
    </div>
  );
}
