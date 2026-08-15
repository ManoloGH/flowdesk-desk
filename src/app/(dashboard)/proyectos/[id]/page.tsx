'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Download, CheckCircle2, Loader2, FileText,
  MessageSquare, Send, X, Clock, Check, AlertCircle,
} from 'lucide-react';
import { socFetch } from '@/lib/soc-api';

interface Pantalla {
  id: string;
  titulo: string;
  htmlContenido: string | null;
}

interface RequerimientoDetalle {
  id: string;
  folio: { completo: string };
  tipo: number;
  estado: number;
  nombreProyecto: string | null;
  area: string | null;
  introduccion: string | null;
  objetivoGeneral: string | null;
  beneficios: string | null;
  creadoEn: string;
  documentoWordPath: string | null;
  notionPageId: string | null;
  pantallas: Pantalla[];
}

interface VoBo {
  id: string;
  area: string;
  responsableNombre: string;
  responsableEmail: string;
  estado: number; // 0=Pendiente,1=Aprobado,2=Rechazado,3=Comentado
  nota: string | null;
  fechaSolicitud: string;
  fechaRespuesta: string | null;
  comentario: string | null;
}

const ESTADOS: Record<number, string> = {
  0: 'Borrador', 1: 'En Revisión PM', 2: 'Aprobado PM',
  3: 'En Revisión Sistemas', 4: 'Con Observaciones', 5: 'Aprobado Sistemas',
  6: 'En Desarrollo', 7: 'En QA', 8: 'Liberado', 9: 'Cancelado',
};

const VOBO_ESTADO: Record<number, { label: string; icon: React.ReactNode; cls: string }> = {
  0: { label: 'Pendiente', icon: <Clock className="w-3 h-3" />, cls: 'text-yellow-400 bg-yellow-400/10' },
  1: { label: 'Aprobado', icon: <Check className="w-3 h-3" />, cls: 'text-emerald-400 bg-emerald-400/10' },
  2: { label: 'Rechazado', icon: <X className="w-3 h-3" />, cls: 'text-red-400 bg-red-400/10' },
  3: { label: 'Comentado', icon: <MessageSquare className="w-3 h-3" />, cls: 'text-blue-400 bg-blue-400/10' },
};

export default function RequerimientoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [req, setReq] = useState<RequerimientoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [aprobando, setAprobando] = useState(false);
  const [descargandoHtml, setDescargandoHtml] = useState(false);

  // VoBo state
  const [vobos, setVobos] = useState<VoBo[]>([]);
  const [voboModal, setVoboModal] = useState(false);
  const [voboForm, setVoboForm] = useState({ area: '', nombre: '', email: '', nota: '', miEmail: '' });
  const [enviandoVobo, setEnviandoVobo] = useState(false);
  const voboRef = useRef<HTMLDivElement>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [resReq, resVobos] = await Promise.all([
        socFetch(`/api/requerimientos/${id}`),
        socFetch(`/api/requerimientos/${id}/vobos`),
      ]);
      if (!resReq.ok) throw new Error();
      setReq(await resReq.json());
      if (resVobos.ok) setVobos(await resVobos.json());
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  async function aprobar() {
    if (!req || aprobando) return;
    setAprobando(true);
    try {
      const res = await socFetch(`/api/requerimientos/${id}/aprobar`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        alert(body?.error ?? 'No se pudo aprobar el requerimiento.');
        return;
      }
      await cargar();
    } finally {
      setAprobando(false);
    }
  }

  async function descargarHtml() {
    setDescargandoHtml(true);
    try {
      const res = await socFetch(`/api/requerimientos/${id}/html`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${req?.folio.completo ?? id}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('No se pudo descargar el HTML.');
    } finally {
      setDescargandoHtml(false);
    }
  }

  async function solicitarVoBo() {
    if (enviandoVobo) return;
    if (!voboForm.area.trim() || !voboForm.nombre.trim() || !voboForm.email.trim()) {
      alert('Completa todos los campos.');
      return;
    }
    setEnviandoVobo(true);
    try {
      const res = await socFetch(`/api/requerimientos/${id}/vobos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area: voboForm.area,
          responsableNombre: voboForm.nombre,
          responsableEmail: voboForm.email,
          nota: voboForm.nota.trim() || null,
          solicitanteEmail: voboForm.miEmail || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        alert(body?.error ?? 'No se pudo enviar el VoBo.');
        return;
      }
      const nuevo: VoBo = await res.json().then(r => ({
        id: r.voBoId,
        area: r.area,
        responsableNombre: voboForm.nombre,
        responsableEmail: r.responsableEmail,
        estado: 0,
        nota: voboForm.nota.trim() || null,
        fechaSolicitud: new Date().toISOString(),
        fechaRespuesta: null,
        comentario: null,
      }));
      setVobos(prev => [nuevo, ...prev]);
      setVoboModal(false);
      setVoboForm({ area: '', nombre: '', email: '', nota: '', miEmail: '' });
    } finally {
      setEnviandoVobo(false);
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!req) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400">
        <FileText className="w-10 h-10 opacity-30" />
        <p>Requerimiento no encontrado</p>
        <button onClick={() => router.push('/proyectos')} className="text-sm text-[#00614E] hover:underline">
          Volver a la lista
        </button>
      </div>
    );
  }

  const estado = ESTADOS[req.estado] ?? 'Desconocido';
  const esAprobable = req.estado === 0 || req.estado === 1;

  return (
    <div className="h-full flex flex-col gap-6 p-6 overflow-y-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/proyectos')} className="p-1.5 rounded-lg hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-semibold text-[#00614E]">{req.folio.completo}</span>
              <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{estado}</span>
            </div>
            <p className="text-sm text-slate-400">{req.nombreProyecto ?? 'Sin nombre de proyecto'}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/proyectos/nuevo?continuar=${id}`)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5"
          >
            <MessageSquare className="w-4 h-4" />
            Continuar chat
          </button>
          <button
            onClick={() => {
              setVoboModal(true);
              voboRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5"
          >
            <Send className="w-4 h-4" />
            VoBo
            {vobos.length > 0 && (
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                vobos.every(v => v.estado === 1)
                  ? 'bg-emerald-400/15 text-emerald-400'
                  : vobos.some(v => v.estado === 2)
                  ? 'bg-red-400/15 text-red-400'
                  : 'bg-yellow-400/15 text-yellow-400'
              }`}>
                {vobos.filter(v => v.estado === 1).length}/{vobos.length}
              </span>
            )}
          </button>
          <button
            onClick={descargarHtml}
            disabled={descargandoHtml}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 disabled:opacity-40"
          >
            {descargandoHtml ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Descargar
          </button>
          {esAprobable && (
            <button
              onClick={aprobar}
              disabled={aprobando}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#00614E] hover:bg-[#00614E]/80 text-white disabled:opacity-40"
            >
              {aprobando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Aprobar
            </button>
          )}
        </div>
      </div>

      {/* Panel VoBo */}
      <div ref={voboRef} className="bg-white/5 rounded-xl border border-white/10">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">VoBo — Revisión de áreas</p>
            {vobos.length > 0 && (
              <p className="text-xs text-slate-500 mt-0.5">
                {vobos.filter(v => v.estado === 1).length}/{vobos.length} aprobados
              </p>
            )}
          </div>
          <button
            onClick={() => setVoboModal(true)}
            className="flex items-center gap-1.5 text-xs text-[#00614E] hover:text-[#00614E]/80 font-medium"
          >
            <Send className="w-3 h-3" />
            Solicitar VoBo
          </button>
        </div>

        {vobos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-slate-500">
            <AlertCircle className="w-7 h-7 opacity-30" />
            <p className="text-xs">Sin solicitudes de VoBo aún</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {vobos.map(v => {
              const est = VOBO_ESTADO[v.estado] ?? VOBO_ESTADO[0];
              const enviado = new Date(v.fechaSolicitud);
              const respondido = v.fechaRespuesta ? new Date(v.fechaRespuesta) : null;
              const fmt = (d: Date) =>
                d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
                ' ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
              const difMin = respondido
                ? Math.round((respondido.getTime() - enviado.getTime()) / 60000)
                : null;
              const tiempoResp = difMin !== null
                ? difMin < 60 ? `${difMin}m` : difMin < 1440
                  ? `${Math.floor(difMin / 60)}h ${difMin % 60}m`
                  : `${Math.floor(difMin / 1440)}d ${Math.floor((difMin % 1440) / 60)}h`
                : null;
              return (
                <div key={v.id} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{v.area}</p>
                    <p className="text-xs text-slate-500">{v.responsableNombre} · {v.responsableEmail}</p>
                    {v.nota && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        <span className="text-slate-600">Sobre:</span> {v.nota}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                      <span className="text-xs text-slate-500">
                        <span className="text-slate-600">Enviado</span> {fmt(enviado)}
                      </span>
                      {respondido && (
                        <>
                          <span className="text-slate-700">·</span>
                          <span className="text-xs text-slate-500">
                            <span className="text-slate-600">Respondió</span> {fmt(respondido)}
                          </span>
                          {tiempoResp && (
                            <>
                              <span className="text-slate-700">·</span>
                              <span className="text-xs text-emerald-600 font-medium">{tiempoResp}</span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                    {v.comentario && (
                      <p className="text-xs text-slate-400 mt-1 italic">"{v.comentario}"</p>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 ${est.cls}`}>
                    {est.icon}
                    {est.label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detalle del documento */}
      <div className="grid gap-4">
        {[
          { label: 'Área', value: req.area },
          { label: 'Introducción', value: req.introduccion },
          { label: 'Objetivo General', value: req.objetivoGeneral },
          { label: 'Beneficios', value: req.beneficios },
        ].map(campo => (
          <div key={campo.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">{campo.label}</p>
            <p className="text-sm text-slate-200 whitespace-pre-wrap">
              {campo.value ?? <span className="text-slate-500 italic">Pendiente</span>}
            </p>
          </div>
        ))}

        {req.notionPageId && (
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Notion</p>
            <p className="text-sm text-emerald-400">Registrado en Notion ✓</p>
          </div>
        )}

        {req.pantallas && req.pantallas.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">
              Pantallas generadas ({req.pantallas.length})
            </p>
            {req.pantallas.map((p, i) => (
              <div key={p.id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10">
                  <span className="text-xs text-slate-400 font-medium">
                    {i + 1}. {p.titulo || 'Pantalla'}
                  </span>
                </div>
                {p.htmlContenido ? (
                  <iframe
                    srcDoc={p.htmlContenido}
                    sandbox="allow-scripts allow-same-origin"
                    className="w-full border-none"
                    style={{ height: '520px' }}
                    title={p.titulo}
                  />
                ) : (
                  <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                    Sin contenido generado
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Modal Solicitar VoBo */}
      {voboModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] rounded-2xl border border-white/10 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Solicitar VoBo</h2>
              <button onClick={() => setVoboModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-400 mb-5">
              Se enviará un correo al responsable con un enlace para aprobar, rechazar o comentar el requerimiento.
            </p>
            <div className="space-y-3">
              {[
                { label: 'Área / Departamento', key: 'area', type: 'text', placeholder: 'Ej: Contabilidad' },
                { label: 'Nombre del responsable', key: 'nombre', type: 'text', placeholder: 'Ej: Juan Pérez' },
                { label: 'Correo del responsable', key: 'email', type: 'email', placeholder: 'responsable@empresa.com' },
                { label: 'Tu correo (para recibir notificación de respuesta)', key: 'miEmail', type: 'email', placeholder: 'tu@correo.com (opcional)' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-slate-400 block mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={voboForm[f.key as keyof typeof voboForm]}
                    onChange={e => setVoboForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00614E]/40"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nota — ¿Sobre qué se pide aprobación? (opcional)</label>
                <textarea
                  value={voboForm.nota}
                  onChange={e => setVoboForm(prev => ({ ...prev, nota: e.target.value }))}
                  placeholder="Ej: Aprobación del módulo de facturación únicamente"
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00614E]/40 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setVoboModal(false)}
                className="flex-1 py-2 rounded-lg text-sm text-slate-400 hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={solicitarVoBo}
                disabled={enviandoVobo}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium bg-[#00614E] text-white hover:bg-[#00614E]/80 disabled:opacity-40"
              >
                {enviandoVobo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {enviandoVobo ? 'Enviando…' : 'Enviar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
