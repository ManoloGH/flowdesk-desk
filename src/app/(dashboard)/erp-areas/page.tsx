'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Plus, ChevronRight, Layers, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  LEVANTAMIENTO: 'Levantamiento',
  CONFIGURACION: 'Configuración',
  PRUEBA:        'Prueba',
  AJUSTE:        'Ajuste',
  APROBADO:      'Aprobado',
  PRODUCCION:    'En Producción',
  CANCELADO:     'Cancelado',
};

const STATUS_COLOR: Record<string, string> = {
  LEVANTAMIENTO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  CONFIGURACION: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  PRUEBA:        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  AJUSTE:        'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  APROBADO:      'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  PRODUCCION:    'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  CANCELADO:     'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

const PHASES = ['LEVANTAMIENTO','CONFIGURACION','PRUEBA','AJUSTE','APROBADO','PRODUCCION'];

export default function ErpAreasPage() {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [moduleLabel, setModuleLabel] = useState('ERP por Área');

  useEffect(() => {
    api.get('/tenants/mine/brand')
      .then((b: any) => {
        const mod = (b?.modules_config ?? []).find((m: any) => m.key === 'erp-areas');
        if (mod?.label) setModuleLabel(mod.label);
      })
      .catch(() => {});
    api.get('/erp-areas/requirements')
      .then((r) => setRequirements(Array.isArray(r) ? r : []))
      .catch(() => setRequirements([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter
    ? requirements.filter((r) => r.status === filter)
    : requirements;

  const phaseCount = (status: string) => requirements.filter((r) => r.status === status).length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{moduleLabel}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Requerimientos de software interno por departamento
          </p>
        </div>
        <Link
          href="/erp-areas/nuevo"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo requerimiento
        </Link>
      </div>

      {/* Pipeline pills */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filter === '' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          Todos ({requirements.length})
        </button>
        {PHASES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(filter === s ? '' : s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === s ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            {STATUS_LABELS[s]} ({phaseCount(s)})
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <Layers className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No hay requerimientos</p>
          <Link href="/erp-areas/nuevo" className="text-indigo-600 hover:underline text-sm mt-1 inline-block">
            Crear el primero
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <Link
              key={req.id}
              href={`/erp-areas/${req.id}`}
              className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-shadow"
            >
              {/* Icono */}
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white truncate">{req.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[req.status]}`}>
                    {STATUS_LABELS[req.status]}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>{req.department?.name ?? '—'}</span>
                  <span>·</span>
                  <span>{req.erp_services?.length ?? 0} servicio{req.erp_services?.length !== 1 ? 's' : ''}</span>
                  {req.owner && <><span>·</span><span>Dueño: {req.owner.name}</span></>}
                </div>
              </div>

              {/* Mini pipeline */}
              <div className="hidden sm:flex items-center gap-1">
                {PHASES.map((phase, i) => {
                  const currentIdx = PHASES.indexOf(req.status);
                  const done = i < currentIdx;
                  const active = i === currentIdx;
                  return (
                    <div
                      key={phase}
                      className={`w-2 h-2 rounded-full transition-all ${
                        done ? 'bg-green-500' : active ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                      title={STATUS_LABELS[phase]}
                    />
                  );
                })}
              </div>

              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
