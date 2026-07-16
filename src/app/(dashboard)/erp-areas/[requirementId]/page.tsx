'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  ChevronLeft, Check, Clock, AlertTriangle, ArrowRight, Rocket,
  MessageSquare, Settings, ChevronRight, Layers, Plus,
} from 'lucide-react';

const PHASES = ['LEVANTAMIENTO','CONFIGURACION','PRUEBA','AJUSTE','APROBADO','PRODUCCION'];
const PHASE_LABELS: Record<string, string> = {
  LEVANTAMIENTO: 'Levantamiento',
  CONFIGURACION: 'Configuración',
  PRUEBA:        'Prueba',
  AJUSTE:        'Ajuste',
  APROBADO:      'Aprobado',
  PRODUCCION:    'En Producción',
  CANCELADO:     'Cancelado',
};
const NEXT_STATUS: Record<string, string> = {
  LEVANTAMIENTO: 'CONFIGURACION',
  CONFIGURACION: 'PRUEBA',
  PRUEBA:        'APROBADO',
  AJUSTE:        'PRUEBA',
  APROBADO:      'PRODUCCION',
};
const NEXT_LABEL: Record<string, string> = {
  LEVANTAMIENTO: 'Pasar a Configuración',
  CONFIGURACION: 'Iniciar Prueba',
  PRUEBA:        'Aprobar',
  AJUSTE:        'Volver a Prueba',
  APROBADO:      'Desplegar a Producción',
};

const SERVICE_STATUS_COLOR: Record<string, string> = {
  BORRADOR: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  REVISADO: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  APROBADO: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export default function RequirementDetailPage() {
  const { requirementId } = useParams<{ requirementId: string }>();
  const router = useRouter();
  const [req, setReq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [deploying, setDeploying] = useState(false);

  const load = () => {
    api.get(`/erp-areas/requirements/${requirementId}`)
      .then((r) => setReq(r))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [requirementId]);

  const advancePhase = async () => {
    const next = NEXT_STATUS[req.status];
    if (!next) return;
    setTransitioning(true);
    try {
      if (next === 'PRODUCCION') {
        setDeploying(true);
        await api.post(`/erp-areas/requirements/${requirementId}/deploy`, {});
      } else {
        await api.patch(`/erp-areas/requirements/${requirementId}`, { status: next });
      }
      load();
    } finally {
      setTransitioning(false);
      setDeploying(false);
    }
  };

  if (loading) return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      {[1,2,3].map((i) => <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
    </div>
  );
  if (!req) return <div className="p-6 text-gray-500">No encontrado</div>;

  const currentPhaseIdx = PHASES.indexOf(req.status);
  const nextStatus = NEXT_STATUS[req.status];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => router.back()} className="mt-1 text-gray-500 hover:text-gray-700 dark:text-gray-400">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{req.name}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span>{req.department?.name}</span>
              {req.owner && <><span>·</span><span>{req.owner.name}</span></>}
            </div>
          </div>
        </div>
        {nextStatus && (
          <button
            onClick={advancePhase}
            disabled={transitioning}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
              req.status === 'APROBADO'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {req.status === 'APROBADO' ? <Rocket className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            {transitioning ? 'Procesando...' : NEXT_LABEL[req.status]}
          </button>
        )}
      </div>

      {/* Timeline de fases */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-200 dark:bg-gray-700 z-0" />
          {PHASES.map((phase, i) => {
            const done = i < currentPhaseIdx;
            const active = i === currentPhaseIdx;
            return (
              <div key={phase} className="flex flex-col items-center gap-1 z-10 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  done
                    ? 'bg-green-500 border-green-500 text-white'
                    : active
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-400'
                }`}>
                  {done ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs text-center hidden sm:block ${
                  active ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {PHASE_LABELS[phase]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contexto del levantamiento */}
      {(req.current_tools || req.current_pain || req.monthly_volume) && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Contexto del levantamiento</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {req.current_tools && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Herramientas actuales</p>
                <p className="text-sm text-gray-900 dark:text-white">{req.current_tools}</p>
              </div>
            )}
            {req.current_pain && (
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Problema principal</p>
                <p className="text-sm text-gray-900 dark:text-white">{req.current_pain}</p>
              </div>
            )}
            {req.monthly_volume && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Volumen mensual</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{req.monthly_volume} sol/mes</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Servicios identificados */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Servicios identificados ({req.erp_services?.length ?? 0})
          </h2>
          {req.status !== 'PRODUCCION' && req.status !== 'CANCELADO' && (
            <Link
              href={`/erp-areas/${requirementId}/servicios`}
              className="flex items-center gap-1 text-indigo-600 hover:underline text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Gestionar servicios
            </Link>
          )}
        </div>

        {req.erp_services?.length === 0 ? (
          <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>Aún no hay servicios definidos</p>
            <Link href={`/erp-areas/${requirementId}/servicios`} className="text-indigo-600 hover:underline text-xs mt-1 inline-block">
              Agregar el primero
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {req.erp_services.map((svc: any) => (
              <Link
                key={svc.id}
                href={`/erp-areas/${requirementId}/servicios`}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                  <Settings className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{svc.name}</p>
                  {svc.category && <p className="text-xs text-gray-500 dark:text-gray-400">{svc.category}</p>}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SERVICE_STATUS_COLOR[svc.status] ?? ''}`}>
                  {svc.status}
                </span>
                {svc.soc_service_id && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                    En producción
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Retroalimentación */}
      {req.erp_feedbacks?.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Retroalimentación ({req.erp_feedbacks.length})
          </h2>
          <div className="space-y-2">
            {req.erp_feedbacks.map((fb: any) => (
              <div key={fb.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{fb.slot?.name}</span>
                  <span>·</span>
                  <span className={`capitalize ${fb.type === 'approval' ? 'text-green-600' : fb.type === 'rejection' ? 'text-red-600' : ''}`}>
                    {fb.type}
                  </span>
                </div>
                <p className="text-sm text-gray-900 dark:text-white">{fb.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
