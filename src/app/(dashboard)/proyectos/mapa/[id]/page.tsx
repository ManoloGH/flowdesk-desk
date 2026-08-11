'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Send, Loader2, Sparkles, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { socFetch } from '@/lib/soc-api';

interface Turno {
  pregunta: string;
  respuesta?: string;
}

interface Regla {
  descripcion: string;
  condicionFormal: string | null;
}

export default function MapeoSessionPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [preguntaActual, setPreguntaActual] = useState('');
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [completo, setCompleto] = useState(false);
  const [resumenFinal, setResumenFinal] = useState<string | null>(null);
  const [reglas, setReglas] = useState<Regla[]>([]);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Inicializar con la primera pregunta que viene por query param
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setPreguntaActual(decodeURIComponent(q));
  }, [searchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turnos, preguntaActual]);

  async function responder() {
    if (!input.trim() || enviando || !preguntaActual) return;
    const respuesta = input.trim();
    setInput('');
    setEnviando(true);
    setError(null);

    // Agregar el turno con la pregunta y respuesta
    const turnoActual: Turno = { pregunta: preguntaActual, respuesta };
    setTurnos(prev => [...prev, turnoActual]);
    setPreguntaActual('');

    try {
      const res = await socFetch(`/api/mapeo/${id}/respuesta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preguntaAnterior: preguntaActual,
          respuesta,
        }),
      });

      if (!res.ok) throw new Error('Error del servidor');

      const data = await res.json();

      // Acumular reglas detectadas
      if (data.reglasDetectadas?.length) {
        setReglas(prev => [...prev, ...data.reglasDetectadas]);
      }

      if (data.mapeoCompleto) {
        setCompleto(true);
        setResumenFinal(data.resumenFinal ?? null);
      } else {
        setPreguntaActual(data.siguientePregunta ?? '');
      }
    } catch {
      setError('No se pudo procesar la respuesta. Intenta de nuevo.');
      // Revertir: quitar el turno que agregamos
      setTurnos(prev => prev.slice(0, -1));
      setPreguntaActual(preguntaActual);
      setInput(respuesta);
    } finally {
      setEnviando(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      responder();
    }
  }

  return (
    <div className="h-full flex gap-0">

      {/* ── Panel principal de chat ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/10 shrink-0">
          <button
            onClick={() => router.push('/proyectos/mapa')}
            className="p-1.5 rounded-lg hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
          </button>
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-medium text-white">Agente de Mapeo Organizacional</span>
          {completo && (
            <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Mapeo completado
            </span>
          )}
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Intro del agente */}
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[75%]">
              <p className="text-sm text-slate-200 leading-relaxed">
                Hola, soy el Agente de Mapeo Organizacional. Voy a hacerte preguntas para entender
                cómo opera tu departamento: qué decisiones tomas, qué reglas aplicas y qué información
                utilizas. Responde con naturalidad — no hay respuestas incorrectas.
              </p>
            </div>
          </div>

          {/* Turnos completados */}
          {turnos.map((t, i) => (
            <div key={i} className="space-y-3">
              {/* Pregunta del agente */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[75%]">
                  <p className="text-sm text-slate-200 leading-relaxed">{t.pregunta}</p>
                </div>
              </div>
              {/* Respuesta del usuario */}
              {t.respuesta && (
                <div className="flex justify-end">
                  <div className="bg-violet-600/20 border border-violet-500/20 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[75%]">
                    <p className="text-sm text-slate-200 leading-relaxed">{t.respuesta}</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Pregunta actual */}
          {preguntaActual && !completo && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[75%]">
                <p className="text-sm text-slate-200 leading-relaxed">{preguntaActual}</p>
              </div>
            </div>
          )}

          {/* Resumen final */}
          {completo && resumenFinal && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                <p className="text-xs font-medium text-emerald-400 mb-2">Mapeo completado</p>
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {resumenFinal}
                </div>
                <button
                  onClick={() => router.push(`/proyectos/nuevo?mapeoId=${id}`)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Crear requerimiento con este mapeo →
                </button>
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {enviando && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 px-4 py-2.5 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {!completo && (
          <div className="px-5 py-4 border-t border-white/10 shrink-0">
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Escribe tu respuesta…"
                rows={2}
                disabled={enviando || !preguntaActual}
                className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 disabled:opacity-40"
              />
              <button
                onClick={responder}
                disabled={!input.trim() || enviando || !preguntaActual}
                className="self-end px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 transition-colors"
              >
                {enviando
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-2">Enter para enviar · Shift+Enter para nueva línea</p>
          </div>
        )}
      </div>

      {/* ── Panel lateral: reglas descubiertas ── */}
      {reglas.length > 0 && (
        <div className="w-72 shrink-0 border-l border-white/10 flex flex-col">
          <div className="px-4 py-3.5 border-b border-white/10 shrink-0">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
              Reglas descubiertas
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{reglas.length} detectadas</p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {reglas.map((r, i) => (
              <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/8">
                <p className="text-xs text-slate-300 leading-relaxed">{r.descripcion}</p>
                {r.condicionFormal && (
                  <p className="text-xs font-mono text-violet-400/80 mt-2 leading-relaxed bg-violet-500/5 rounded p-2">
                    {r.condicionFormal}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
