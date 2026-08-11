'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, CheckCircle2, Loader2, FileText, MessageSquare } from 'lucide-react';
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

const ESTADOS: Record<number, string> = {
  0: 'Borrador', 1: 'En Revisión PM', 2: 'Aprobado PM',
  3: 'En Revisión Sistemas', 4: 'Con Observaciones', 5: 'Aprobado Sistemas',
  6: 'En Desarrollo', 7: 'En QA', 8: 'Liberado', 9: 'Cancelado',
};

export default function RequerimientoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [req, setReq] = useState<RequerimientoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [aprobando, setAprobando] = useState(false);
  const [descargandoHtml, setDescargandoHtml] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await socFetch(`/api/requerimientos/${id}`);
      if (!res.ok) throw new Error();
      setReq(await res.json());
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
            onClick={descargarHtml}
            disabled={descargandoHtml}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 disabled:opacity-40"
            title="Descargar documento completo con pantallas"
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
    </div>
  );
}
