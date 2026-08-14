'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { socFetch } from '@/lib/soc-api';
import {
  ArrowLeft, Send, Loader2, Monitor, ChevronLeft, ChevronRight,
} from 'lucide-react';

type Tipo = 'Mejora' | 'SistemaNuevo';

interface Mensaje { rol: 'usuario' | 'agente'; texto: string; }
interface Pantalla  { titulo: string; html: string; }

export default function NuevoProyectoPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [tipo,      setTipo]      = useState<Tipo | null>(null);
  const [iniciando, setIniciando] = useState(false);

  // ── Chat state ─────────────────────────────────────────────────────────────
  const [requerimientoId, setRequerimientoId] = useState<string | null>(null);
  const [mensajes,        setMensajes]        = useState<Mensaje[]>([]);
  const [input,           setInput]           = useState('');
  const [enviando,        setEnviando]        = useState(false);
  const [documentoListo,  setDocumentoListo]  = useState(false);

  // ── Pantallas generadas ────────────────────────────────────────────────────
  const [pantallas,    setPantallas]    = useState<Pantalla[]>([]);
  const [pantallaIdx,  setPantallaIdx]  = useState(0);          // pestaña activa
  const [esperaSig,    setEsperaSig]    = useState(false);      // botón "Siguiente"

  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [mensajes, enviando]);

  // Normaliza títulos para comparación insensible a acentos
  const normTitle = (s: string) =>
    s.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase().trim();

  // Escucha clicks de navegación desde los iframes de pantalla
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'soc-nav' && typeof e.data.screenIndex === 'number') {
        setPantallaIdx(e.data.screenIndex);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // ── SOC frame builder ─────────────────────────────────────────────────────
  // Generates the sidebar from React state (always consistent) and wraps the
  // AI-generated content section.  Old "full HTML" screens render as-is.

  const socNavIcon = (titulo: string): string => {
    const t = titulo.toLowerCase().normalize('NFD').replace(/\p{Mn}/gu, '');
    if (/solicitud|request/.test(t))
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/></svg>';
    if (/brief|plan|campa/.test(t))
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>';
    if (/aprobac|aprob|aprov/.test(t))
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>';
    if (/tablero|producci|board|kanban/.test(t))
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>';
    if (/metric|kpi|indicador/.test(t))
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>';
    if (/reporte|informe|report/.test(t))
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>';
    if (/usuario|equipo|team|personal/.test(t))
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
    if (/inventar|producto|catalogo|catalog/.test(t))
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>';
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>';
  };

  const buildSocFrame = (screens: Pantalla[], activeIdx: number, contentHtml: string): string => {
    // Old screens are full HTML pages — render as-is for backward compat
    if (/^\s*<!doctype|^\s*<html/i.test(contentHtml)) return contentHtml;

    const navItems = screens
      .map((p, i) =>
        `<button class="soc-nav-item${i === activeIdx ? ' active' : ''}" onclick="window.parent.postMessage({type:'soc-nav',screenIndex:${i}},'*')">${socNavIcon(p.titulo)}<span>${p.titulo}</span></button>`)
      .join('\n  ');

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden}
body{font-family:'Segoe UI',system-ui,sans-serif;display:flex;background:#f4f6f8;color:#1a2332}
.soc-nav{width:192px;flex-shrink:0;background:#1a2332;display:flex;flex-direction:column;padding:0 8px 16px}
.soc-nav-brand{padding:13px 6px 11px;border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:6px;display:flex;align-items:center;gap:7px}
.soc-nav-brand-dot{width:8px;height:8px;border-radius:50%;background:#00614E;flex-shrink:0}
.soc-nav-brand-label{font-size:10.5px;font-weight:700;color:#fff;letter-spacing:.6px;text-transform:uppercase}
.soc-nav-item{display:flex;align-items:center;gap:9px;padding:8px 10px;cursor:pointer;border:none;background:none;width:100%;text-align:left;color:rgba(255,255,255,.5);font-size:12px;font-family:'Segoe UI',system-ui,sans-serif;border-radius:6px;transition:background .12s,color .12s;line-height:1.25}
.soc-nav-item:hover{background:rgba(255,255,255,.07);color:rgba(255,255,255,.85)}
.soc-nav-item.active{background:#00614E;color:#fff;font-weight:600}
.soc-nav-item.active svg,.soc-nav-item:hover svg{opacity:1}
.soc-nav-item svg{flex-shrink:0;opacity:.45;transition:opacity .12s}
.soc-nav-item span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.soc-main{flex:1;overflow:auto;min-width:0;height:100%}
</style>
</head>
<body>
<nav class="soc-nav">
  <div class="soc-nav-brand"><div class="soc-nav-brand-dot"></div><span class="soc-nav-brand-label">SOC Sistema</span></div>
  ${navItems}
</nav>
<div class="soc-main">${contentHtml}</div>
</body>
</html>`;
  };

  const conPantalla = tipo === 'SistemaNuevo' && pantallas.length > 0;

  // ── Continuar requerimiento existente: ?continuar={id} ────────────────────
  useEffect(() => {
    const continuarId = searchParams.get('continuar');
    if (!continuarId) return;
    socFetch(`/api/requerimientos/${continuarId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: {
        tipo: number;
        mensajes?: { rol: number; contenido: string }[];
        pantallas?: { titulo: string; htmlContenido: string | null }[];
      }) => {
        setRequerimientoId(continuarId);
        const tipoVal: Tipo = data.tipo === 0 ? 'Mejora' : 'SistemaNuevo';
        setTipo(tipoVal);
        const hist: Mensaje[] = (data.mensajes ?? []).map(m => ({
          rol: m.rol === 0 ? 'usuario' : 'agente',
          texto: m.contenido,
        }));
        setMensajes(hist.length > 0 ? hist : [{ rol: 'agente', texto: 'Continuando la sesión…' }]);
        const cargadas = (data.pantallas ?? [])
          .filter(p => p.htmlContenido)
          .map(p => ({ titulo: p.titulo, html: p.htmlContenido! }));
        if (cargadas.length > 0) {
          setPantallas(cargadas);
          setPantallaIdx(cargadas.length - 1);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Return from mapeo flow: ?mapeoId=... ──────────────────────────────────
  useEffect(() => {
    const mapeoId = searchParams.get('mapeoId');
    if (mapeoId) { setTipo('SistemaNuevo'); iniciarConMapeo(mapeoId); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function iniciarConMapeo(mapeoId: string) {
    setIniciando(true);
    try {
      const res  = await socFetch('/api/requerimientos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'SistemaNuevo', mapeoId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRequerimientoId(data.requerimientoId);
      setMensajes([{ rol: 'agente', texto: data.mensajeBienvenida }]);
    } catch { alert('Error al iniciar la sesión. Intenta de nuevo.'); setTipo(null); }
    finally   { setIniciando(false); }
  }

  async function iniciar(t: Tipo) {
    setTipo(t);
    setIniciando(true);
    try {
      const res  = await socFetch('/api/requerimientos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: t }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRequerimientoId(data.requerimientoId);
      setMensajes([{ rol: 'agente', texto: data.mensajeBienvenida }]);
    } catch { alert('Error al iniciar la sesión. Intenta de nuevo.'); setTipo(null); }
    finally   { setIniciando(false); }
  }

  // ── Enviar mensaje (o mensaje automático) ─────────────────────────────────
  async function enviar(textoOverride?: string) {
    const texto = textoOverride ?? input.trim();
    if (!texto || !requerimientoId || enviando) return;
    if (!textoOverride) setInput('');
    setMensajes(prev => [...prev, { rol: 'usuario', texto }]);
    setEnviando(true);
    setEsperaSig(false);
    try {
      const res = await socFetch(`/api/requerimientos/${requerimientoId}/mensaje`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: texto }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMensajes(prev => [...prev, { rol: 'agente', texto: data.respuestaAgente }]);

      if (data.nuevaPantalla && data.htmlPantalla) {
        const titulo = data.tituloPantalla ?? `Pantalla ${pantallas.length + 1}`;
        setPantallas(prev => {
          // si el agente regeneró una pantalla con mismo título → actualizar
          const idx = prev.findIndex(
            p => normTitle(p.titulo) === normTitle(titulo)
          );
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { titulo, html: data.htmlPantalla };
            setPantallaIdx(idx);
            return next;
          }
          const next = [...prev, { titulo, html: data.htmlPantalla }];
          setPantallaIdx(next.length - 1);
          return next;
        });
        // Mostrar botón "Siguiente pantalla" si el doc aún no está listo
        if (!data.documentoListo) setEsperaSig(true);
      } else if (data.pantallaActualizada && data.htmlPantalla) {
        setPantallas(prev => {
          const titulo = data.tituloPantalla;
          if (titulo) {
            const idx = prev.findIndex(p => normTitle(p.titulo) === normTitle(titulo));
            if (idx >= 0) {
              const next = [...prev]; next[idx] = { titulo, html: data.htmlPantalla }; return next;
            }
          }
          // fallback: actualiza la pantalla activa
          if (prev.length === 0) return prev;
          const next = [...prev];
          next[pantallaIdx] = { ...next[pantallaIdx], html: data.htmlPantalla };
          return next;
        });
      }

      if (data.documentoListo) { setDocumentoListo(true); setEsperaSig(false); }
    } catch {
      setMensajes(prev => [...prev, { rol: 'agente', texto: 'Ocurrió un error. Por favor intenta de nuevo.' }]);
    } finally { setEnviando(false); }
  }

  // ── Chat activo ────────────────────────────────────────────────────────────
  if (requerimientoId) {
    const pantallaActual = pantallas[pantallaIdx] ?? null;

    return (
      <div className="flex h-full overflow-hidden bg-slate-950">

        {/* ── Panel izquierdo: chat ──────────────────────────────────────── */}
        <div className="flex flex-col w-[400px] shrink-0 border-r border-white/10 bg-slate-900 min-h-0">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
            <button onClick={() => router.back()} className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <p className="text-xs text-slate-500">Nuevo requerimiento</p>
              <p className="text-sm font-semibold text-white">
                {tipo === 'SistemaNuevo' ? 'Sistema nuevo' : 'Mejora / Cambio'}
              </p>
            </div>
            {documentoListo && (
              <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                Listo ✓
              </span>
            )}
          </div>

          {/* Mensajes */}
          <div ref={chatRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
            {mensajes.map((m, i) => (
              <div key={i} className={`flex ${m.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.rol === 'usuario'
                    ? 'bg-violet-600 text-white rounded-br-sm'
                    : 'bg-white/10 text-slate-200 rounded-bl-sm'
                }`}>
                  {m.texto}
                </div>
              </div>
            ))}
            {enviando && (
              <div className="flex justify-start">
                <div className="bg-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/10 space-y-2">
            {/* Botón "Siguiente pantalla" — aparece tras generar cada pantalla */}
            {esperaSig && !enviando && (
              <button
                onClick={() => enviar('Continuar con la siguiente pantalla')}
                className="w-full py-2 rounded-xl bg-[#00614E]/80 hover:bg-[#00614E] text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <span>Siguiente pantalla →</span>
              </button>
            )}

            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                placeholder={documentoListo ? 'Documento listo' : 'Escribe tu respuesta…'}
                rows={2}
                disabled={enviando || documentoListo}
                className="flex-1 resize-none rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 disabled:opacity-40"
              />
              <button
                onClick={() => enviar()}
                disabled={!input.trim() || enviando || documentoListo}
                className="p-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40 transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {documentoListo && (
              <button
                onClick={() => requerimientoId && router.push(`/proyectos/${requerimientoId}`)}
                className="w-full py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors"
              >
                Ver documento final →
              </button>
            )}
          </div>
        </div>

        {/* ── Panel derecho: pantallas ───────────────────────────────────── */}
        {conPantalla ? (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Tabs de pantallas */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-white/10 bg-slate-900 overflow-x-auto shrink-0">
              <Monitor className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
              {pantallas.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setPantallaIdx(i)}
                  className={`shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    i === pantallaIdx
                      ? 'bg-[#00614E] text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {i + 1}. {p.titulo}
                </button>
              ))}
              {/* Flechas de navegación si hay muchas */}
              {pantallas.length > 1 && (
                <div className="ml-auto flex gap-1 shrink-0">
                  <button
                    onClick={() => setPantallaIdx(i => Math.max(0, i - 1))}
                    disabled={pantallaIdx === 0}
                    className="p-1 rounded text-slate-500 hover:text-white disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPantallaIdx(i => Math.min(pantallas.length - 1, i + 1))}
                    disabled={pantallaIdx === pantallas.length - 1}
                    className="p-1 rounded text-slate-500 hover:text-white disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Iframe de la pantalla activa — sidebar siempre generado por React */}
            {pantallaActual && (
              <iframe
                key={pantallaActual.titulo + pantallaActual.html.length}
                srcDoc={buildSocFrame(pantallas, pantallaIdx, pantallaActual.html)}
                sandbox="allow-scripts allow-same-origin"
                className="flex-1 w-full border-none"
                title={pantallaActual.titulo}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 items-center justify-center text-slate-700 gap-3">
            <Monitor className="w-16 h-16" />
            <p className="text-sm text-slate-500">Las pantallas generadas aparecerán aquí</p>
          </div>
        )}
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (iniciando) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm text-gray-500">Iniciando sesión...</p>
      </div>
    );
  }

  // ── Selector de tipo ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 p-8">
      <button onClick={() => router.back()} className="self-start flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>
      <div className="text-center">
        <h1 className="text-2xl font-bold">¿Qué tipo de requerimiento es?</h1>
        <p className="text-sm text-gray-500 mt-2">El agente se encarga de todo — contexto, pantallas y documento en un solo chat</p>
      </div>
      <div className="flex gap-6">
        <button
          onClick={() => iniciar('SistemaNuevo')}
          className="flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all w-52"
        >
          <Monitor className="w-10 h-10 text-blue-500" />
          <span className="font-semibold">Sistema nuevo</span>
          <span className="text-xs text-gray-500 text-center">Módulo o sistema desde cero</span>
        </button>
        <button
          onClick={() => iniciar('Mejora')}
          className="flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all w-52"
        >
          <span className="text-4xl">⚡</span>
          <span className="font-semibold">Mejora / Cambio</span>
          <span className="text-xs text-gray-500 text-center">Modificar un sistema existente</span>
        </button>
      </div>
    </div>
  );
}
