'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Map, CheckCircle2, Clock, ChevronRight, Building2,
} from 'lucide-react';
import { socFetch } from '@/lib/soc-api';

interface MapeoResumen {
  id: string;
  nombreDepartamento: string;
  tipo: string;
  responsableNombre: string;
  estado: string;
  totalReglas: number;
  creadoEn: string;
  completadoEn: string | null;
}

const TIPO_LABELS: Record<string, string> = {
  Contabilidad: 'Contabilidad',
  Auditoria: 'Auditoría',
  RecursosHumanos: 'Recursos Humanos',
  Legal: 'Legal / Jurídico',
  TI: 'TI',
  Compras: 'Compras',
  Ventas: 'Ventas',
  Direccion: 'Dirección',
  Operaciones: 'Operaciones',
  Otro: 'Otro',
};

export default function MapaPage() {
  const router = useRouter();
  const [mapeos, setMapeos] = useState<MapeoResumen[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await socFetch('/api/mapeo');
      if (res.ok) setMapeos(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const completados = mapeos.filter(m => m.estado === 'Completado').length;
  const totalReglas = mapeos.reduce((s, m) => s + m.totalReglas, 0);

  return (
    <div className="h-full flex flex-col gap-6 p-6 overflow-y-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
            <Map className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Mapa Organizacional</h1>
            <p className="text-sm text-slate-400">Descubrimiento de reglas por departamento</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/proyectos/mapa/nuevo')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Mapear departamento
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Departamentos', value: mapeos.length, color: 'text-white' },
          { label: 'Completados', value: completados, color: 'text-emerald-400' },
          { label: 'Reglas descubiertas', value: totalReglas, color: 'text-violet-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-sm text-slate-400">{s.label}</p>
            <p className={`text-3xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      <div className="flex-1 bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
            Cargando mapeos…
          </div>
        ) : mapeos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
            <Building2 className="w-10 h-10 opacity-30" />
            <p className="text-sm">No hay departamentos mapeados todavía</p>
            <button
              onClick={() => router.push('/proyectos/mapa/nuevo')}
              className="text-sm text-violet-400 hover:underline"
            >
              Mapear el primero
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {mapeos.map(m => (
              <button
                key={m.id}
                onClick={() => router.push(`/proyectos/mapa/${m.id}`)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left"
              >
                <Building2 className="w-5 h-5 text-slate-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{m.nombreDepartamento}</span>
                    <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                      {TIPO_LABELS[m.tipo] ?? m.tipo}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{m.responsableNombre}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {m.totalReglas > 0 && (
                    <span className="text-xs text-violet-400 bg-violet-400/10 px-2.5 py-1 rounded-full font-medium">
                      {m.totalReglas} reglas
                    </span>
                  )}
                  <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                    m.estado === 'Completado'
                      ? 'text-emerald-400 bg-emerald-400/10'
                      : 'text-amber-400 bg-amber-400/10'
                  }`}>
                    {m.estado === 'Completado'
                      ? <CheckCircle2 className="w-3 h-3" />
                      : <Clock className="w-3 h-3" />
                    }
                    {m.estado}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
