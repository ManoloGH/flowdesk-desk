'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, XCircle, MessageSquare, Loader2, AlertCircle } from 'lucide-react';

interface VoBoDetalle {
  folio: string;
  nombreRequerimiento: string;
  area: string;
  responsableNombre: string;
  estado: number; // 0=Pendiente,1=Aprobado,2=Rechazado,3=Comentado
  fechaSolicitud: string;
}

interface VoBoRespuesta {
  folio: string;
  nombreRequerimiento: string;
  area: string;
  decision: number;
  comentario: string | null;
}

type Pantalla =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'ya-respondido'; estado: number }
  | { tipo: 'formulario'; detalle: VoBoDetalle }
  | { tipo: 'exito'; respuesta: VoBoRespuesta };

const ESTADO_LABEL: Record<number, string> = {
  0: 'Pendiente', 1: 'Aprobado', 2: 'Rechazado', 3: 'Con comentarios',
};

export default function VoBoPage() {
  const { token } = useParams<{ token: string }>();
  const [pantalla, setPantalla] = useState<Pantalla>({ tipo: 'cargando' });
  const [decision, setDecision] = useState<1 | 2 | 3 | null>(null);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    fetch(`/api/public-vobo/${token}`)
      .then(async r => {
        if (r.status === 404) { setPantalla({ tipo: 'error', mensaje: 'Enlace inválido o ya no disponible.' }); return; }
        if (!r.ok) { setPantalla({ tipo: 'error', mensaje: 'Error al cargar la solicitud.' }); return; }
        const d: VoBoDetalle = await r.json();
        if (d.estado !== 0) {
          setPantalla({ tipo: 'ya-respondido', estado: d.estado });
        } else {
          setPantalla({ tipo: 'formulario', detalle: d });
        }
      })
      .catch(() => setPantalla({ tipo: 'error', mensaje: 'No se pudo conectar al servidor.' }));
  }, [token]);

  async function enviar() {
    if (!decision || enviando) return;
    setEnviando(true);
    try {
      const res = await fetch(`/api/public-vobo/${token}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comentario: comentario.trim() || null }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        alert(body?.error ?? 'Error al enviar la respuesta.');
        return;
      }
      const data: VoBoRespuesta = await res.json();
      setPantalla({ tipo: 'exito', respuesta: data });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-md overflow-hidden">

        {/* Header */}
        <div className="bg-[#00614E] px-8 py-6">
          <p className="text-emerald-200 text-xs font-semibold tracking-widest uppercase">SOC Asesores</p>
          <h1 className="text-white text-xl font-bold mt-1">Sistema de Requerimientos</h1>
        </div>

        <div className="px-8 py-7">
          {pantalla.tipo === 'cargando' && (
            <div className="flex flex-col items-center gap-3 py-8 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Cargando solicitud…</p>
            </div>
          )}

          {pantalla.tipo === 'error' && (
            <div className="flex flex-col items-center gap-3 py-8 text-slate-500">
              <AlertCircle className="w-10 h-10 text-red-400" />
              <p className="text-center text-sm">{pantalla.mensaje}</p>
            </div>
          )}

          {pantalla.tipo === 'ya-respondido' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle2 className="w-12 h-12 text-[#00614E]" />
              <p className="text-lg font-semibold text-slate-800">Solicitud ya respondida</p>
              <p className="text-sm text-slate-500">
                Esta solicitud fue marcada como <strong>{ESTADO_LABEL[pantalla.estado]}</strong>.
                No puedes volver a responderla.
              </p>
            </div>
          )}

          {pantalla.tipo === 'formulario' && (() => {
            const d = pantalla.detalle;
            return (
              <>
                <p className="text-sm text-slate-500 mb-4">
                  Hola <strong className="text-slate-800">{d.responsableNombre}</strong>,
                  se te solicita VoBo del siguiente requerimiento:
                </p>

                <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200 mb-6">
                  {[
                    ['Folio', d.folio],
                    ['Proyecto', d.nombreRequerimiento],
                    ['Área', d.area],
                    ['Fecha', new Date(d.fechaSolicitud).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })],
                  ].map(([label, value]) => (
                    <div key={label} className="flex px-4 py-2.5 gap-3">
                      <span className="text-xs text-slate-400 w-20 pt-0.5 shrink-0">{label}</span>
                      <span className="text-sm font-medium text-slate-800">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Buttons */}
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">Tu decisión</p>
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {([
                    { v: 1 as const, icon: <CheckCircle2 className="w-4 h-4" />, label: 'Aprobar', active: 'bg-emerald-600 text-white', inactive: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
                    { v: 2 as const, icon: <XCircle className="w-4 h-4" />, label: 'Rechazar', active: 'bg-red-600 text-white', inactive: 'bg-red-50 text-red-700 hover:bg-red-100' },
                    { v: 3 as const, icon: <MessageSquare className="w-4 h-4" />, label: 'Comentar', active: 'bg-blue-600 text-white', inactive: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
                  ] as const).map(btn => (
                    <button
                      key={btn.v}
                      onClick={() => setDecision(btn.v)}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-sm font-medium transition-colors ${decision === btn.v ? btn.active : btn.inactive}`}
                    >
                      {btn.icon}
                      {btn.label}
                    </button>
                  ))}
                </div>

                {(decision === 2 || decision === 3) && (
                  <textarea
                    value={comentario}
                    onChange={e => setComentario(e.target.value)}
                    placeholder={decision === 2 ? 'Explica el motivo del rechazo…' : 'Escribe tus comentarios u observaciones…'}
                    rows={3}
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 mb-4 resize-none text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00614E]/30 focus:border-[#00614E]"
                  />
                )}

                <button
                  onClick={enviar}
                  disabled={!decision || enviando}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-[#00614E] text-white hover:bg-[#00614E]/90 disabled:opacity-40 transition-colors"
                >
                  {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {enviando ? 'Enviando…' : 'Enviar respuesta'}
                </button>
              </>
            );
          })()}

          {pantalla.tipo === 'exito' && (() => {
            const r = pantalla.respuesta;
            const labels: Record<number, { icon: React.ReactNode; texto: string; color: string }> = {
              1: { icon: <CheckCircle2 className="w-12 h-12 text-emerald-500" />, texto: 'Aprobado', color: 'text-emerald-600' },
              2: { icon: <XCircle className="w-12 h-12 text-red-500" />, texto: 'Rechazado', color: 'text-red-600' },
              3: { icon: <MessageSquare className="w-12 h-12 text-blue-500" />, texto: 'Comentado', color: 'text-blue-600' },
            };
            const info = labels[r.decision];
            return (
              <div className="flex flex-col items-center gap-4 py-6">
                {info?.icon}
                <p className={`text-2xl font-bold ${info?.color}`}>{info?.texto}</p>
                <div className="text-center text-sm text-slate-600">
                  <p>Tu respuesta para <strong>{r.folio}</strong> fue registrada.</p>
                  {r.comentario && (
                    <p className="mt-2 bg-slate-50 rounded-lg px-4 py-2 text-slate-700 italic">"{r.comentario}"</p>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-2">Puedes cerrar esta ventana.</p>
              </div>
            );
          })()}
        </div>

        <div className="px-8 pb-6">
          <p className="text-xs text-center text-slate-300">
            SOC Asesores · Sistema de Requerimientos de Sistemas
          </p>
        </div>
      </div>
    </div>
  );
}
