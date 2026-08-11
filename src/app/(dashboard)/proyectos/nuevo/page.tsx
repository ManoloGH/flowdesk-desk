'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { socFetch } from '@/lib/soc-api';
import {
  ArrowLeft, Send, Loader2, Monitor,
} from 'lucide-react';

type Tipo = 'Mejora' | 'SistemaNuevo';

interface Mensaje { rol: 'usuario' | 'agente'; texto: string; }

export default function NuevoProyectoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tipo, setTipo] = useState<Tipo | null>(null);
  const [iniciando, setIniciando] = useState(false);

  // ── Chat state ────────────────────────────────────────────────────────────
  const [requerimientoId, setRequerimientoId] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [htmlPantalla, setHtmlPantalla] = useState<string | null>(null);
  const [tituloPantalla, setTituloPantalla] = useState<string>('Vista previa');
  const [documentoListo, setDocumentoListo] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje siempre que cambie la lista
  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [mensajes, enviando]);

  const conPantalla = tipo === 'SistemaNuevo' && !!htmlPantalla;

  // ── Continuar requerimiento existente: ?continuar={id} ───────────────────
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
        // Restaurar última pantalla guardada
        const pantallas = data.pantallas ?? [];
        const ultima = pantallas.filter(p => p.htmlContenido).at(-1);
        if (ultima?.htmlContenido) {
          setHtmlPantalla(ultima.htmlContenido);
          setTituloPantalla(ultima.titulo || 'Vista previa');
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Return from mapeo flow: ?mapeoId=... en URL ───────────────────────────
  useEffect(() => {
    const mapeoId = searchParams.get('mapeoId');
    if (mapeoId) {
      setTipo('SistemaNuevo');
      iniciarConMapeo(mapeoId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Iniciar con mapeo vinculado (URL param legacy) ───────────────────────
  async function iniciarConMapeo(mapeoId: string) {
    setIniciando(true);
    try {
      const res = await socFetch('/api/requerimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'SistemaNuevo', mapeoId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRequerimientoId(data.requerimientoId);
      setMensajes([{ rol: 'agente', texto: data.mensajeBienvenida }]);
    } catch (e) {
      console.error(e);
      alert('Error al iniciar la sesión. Intenta de nuevo.');
      setTipo(null);
    } finally { setIniciando(false); }
  }

  // ── Iniciar sin mapeo (o Mejora) ──────────────────────────────────────────
  async function iniciar(t: Tipo) {
    setTipo(t);
    setIniciando(true);
    try {
      const res = await socFetch('/api/requerimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: t }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRequerimientoId(data.requerimientoId);
      setMensajes([{ rol: 'agente', texto: data.mensajeBienvenida }]);
    } catch (e) {
      console.error(e);
      alert('Error al iniciar la sesión. Intenta de nuevo.');
      setTipo(null);
    } finally { setIniciando(false); }
  }

  // ── Enviar mensaje ────────────────────────────────────────────────────────
  async function enviar() {
    if (!input.trim() || !requerimientoId || enviando) return;
    const texto = input.trim();
    setInput('');
    setMensajes(prev => [...prev, { rol: 'usuario', texto }]);
    setEnviando(true);
    try {
      const res = await socFetch(`/api/requerimientos/${requerimientoId}/mensaje`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: texto }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMensajes(prev => [...prev, { rol: 'agente', texto: data.respuestaAgente }]);
      if (data.nuevaPantalla && data.htmlPantalla) {
        setHtmlPantalla(data.htmlPantalla);
        setTituloPantalla(data.tituloPantalla ?? 'Pantalla 1');
      } else if (data.pantallaActualizada && data.htmlPantalla) {
        setHtmlPantalla(data.htmlPantalla);
        if (data.tituloPantalla) setTituloPantalla(data.tituloPantalla);
      }
      if (data.documentoListo) setDocumentoListo(true);
    } catch (e) {
      console.error(e);
      setMensajes(prev => [...prev, { rol: 'agente', texto: 'Ocurrió un error. Por favor intenta de nuevo.' }]);
    } finally { setEnviando(false); }
  }

  // ── Chat activo ───────────────────────────────────────────────────────────
  if (requerimientoId) {
    return (
      <div className="flex h-full overflow-hidden bg-slate-950">
        <div className="flex flex-col w-[420px] shrink-0 border-r border-white/10 bg-slate-900 min-h-0">
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

          <div className="px-4 py-3 border-t border-white/10">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                placeholder="Escribe tu respuesta..."
                rows={2}
                disabled={enviando || documentoListo}
                className="flex-1 resize-none rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 disabled:opacity-40"
              />
              <button
                onClick={enviar}
                disabled={!input.trim() || enviando || documentoListo}
                className="p-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40 transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            {documentoListo && (
              <button
                onClick={() => requerimientoId && router.push(`/proyectos/${requerimientoId}`)}
                className="w-full mt-2 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors"
              >
                Ver documento final →
              </button>
            )}
          </div>
        </div>

        {conPantalla ? (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-slate-900">
              <Monitor className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-200">{tituloPantalla}</span>
              <span className="text-xs text-slate-500 ml-1">— Vista previa generada</span>
            </div>
            <iframe
              key={htmlPantalla!.length}
              srcDoc={htmlPantalla!}
              sandbox="allow-scripts allow-same-origin"
              className="flex-1 w-full border-none"
              title={tituloPantalla}
            />
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 items-center justify-center text-slate-700 gap-3">
            <Monitor className="w-16 h-16" />
            <p className="text-sm text-slate-500">La pantalla generada aparecerá aquí</p>
          </div>
        )}
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (iniciando) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm text-gray-500">Iniciando sesión...</p>
      </div>
    );
  }

  // ── Step: elegir tipo → va directo al chat ───────────────────────────────
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
