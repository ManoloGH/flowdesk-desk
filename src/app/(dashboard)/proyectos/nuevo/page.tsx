'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { socFetch } from '@/lib/soc-api';
import { ArrowLeft, Send, Loader2, Monitor } from 'lucide-react';

type Tipo = 'Mejora' | 'SistemaNuevo';

interface Mensaje {
  rol: 'usuario' | 'agente';
  texto: string;
}

export default function NuevoProyectoPage() {
  const router = useRouter();

  // ── Step 1: tipo selector ─────────────────────────────────────────────────
  const [tipo, setTipo] = useState<Tipo | null>(null);
  const [iniciando, setIniciando] = useState(false);

  // ── Step 2: chat ──────────────────────────────────────────────────────────
  const [requerimientoId, setRequerimientoId] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [htmlPantalla, setHtmlPantalla] = useState<string | null>(null);
  const [tituloPantalla, setTituloPantalla] = useState<string>('Vista previa');
  const [documentoListo, setDocumentoListo] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const conPantalla = tipo === 'SistemaNuevo' && !!htmlPantalla;

  // ── Iniciar sesión ────────────────────────────────────────────────────────
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
    } finally {
      setIniciando(false);
    }
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

      setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }), 50);
    } catch (e) {
      console.error(e);
      setMensajes(prev => [...prev, { rol: 'agente', texto: 'Ocurrió un error. Por favor intenta de nuevo.' }]);
    } finally {
      setEnviando(false);
    }
  }

  // ── Render: selector de tipo ──────────────────────────────────────────────
  if (!tipo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-8">
        <button onClick={() => router.back()} className="self-start flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <h1 className="text-2xl font-bold">¿Qué tipo de requerimiento es?</h1>
        <div className="flex gap-6">
          <button
            onClick={() => iniciar('SistemaNuevo')}
            disabled={iniciando}
            className="flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all w-52"
          >
            <Monitor className="w-10 h-10 text-blue-500" />
            <span className="font-semibold">Sistema nuevo</span>
            <span className="text-xs text-gray-500 text-center">Desarrollar una nueva aplicación o módulo desde cero</span>
          </button>
          <button
            onClick={() => iniciar('Mejora')}
            disabled={iniciando}
            className="flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all w-52"
          >
            <span className="text-4xl">⚡</span>
            <span className="font-semibold">Mejora / Cambio</span>
            <span className="text-xs text-gray-500 text-center">Modificar o mejorar un sistema que ya existe</span>
          </button>
        </div>
        {iniciando && <Loader2 className="w-6 h-6 animate-spin text-blue-500" />}
      </div>
    );
  }

  // ── Render: chat + preview ────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* Panel izquierdo — chat */}
      <div className="flex flex-col w-[420px] shrink-0 border-r border-gray-200 bg-white">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="text-xs text-gray-400">Nuevo requerimiento</p>
            <p className="text-sm font-semibold text-gray-800">
              {tipo === 'SistemaNuevo' ? 'Sistema nuevo' : 'Mejora / Cambio'}
            </p>
          </div>
          {documentoListo && (
            <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              Listo ✓
            </span>
          )}
        </div>

        {/* Mensajes */}
        <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {mensajes.map((m, i) => (
            <div key={i} className={`flex ${m.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.rol === 'usuario'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}>
                {m.texto}
              </div>
            </div>
          ))}
          {enviando && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
              placeholder="Escribe tu respuesta..."
              rows={2}
              disabled={enviando || documentoListo}
              className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
            />
            <button
              onClick={enviar}
              disabled={!input.trim() || enviando || documentoListo}
              className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          {documentoListo && (
            <button
              onClick={() => requerimientoId && router.push(`/proyectos/${requerimientoId}`)}
              className="w-full mt-2 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700"
            >
              Ver documento final →
            </button>
          )}
        </div>
      </div>

      {/* Panel derecho — preview iframe */}
      {conPantalla ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-white">
            <Monitor className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">{tituloPantalla}</span>
            <span className="text-xs text-gray-400 ml-1">— Vista previa generada</span>
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
        <div className="flex flex-col flex-1 items-center justify-center text-gray-300 gap-3">
          <Monitor className="w-16 h-16" />
          <p className="text-sm">La pantalla generada aparecerá aquí</p>
        </div>
      )}
    </div>
  );
}
