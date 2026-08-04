'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, FileText, CheckCircle2, Clock, AlertCircle,
  FolderKanban, ChevronRight, BookOpen, Map,
} from 'lucide-react';
import { socFetch as rawFetch } from '@/lib/soc-api';

interface Requerimiento {
  id: string;
  Folio: string;
  NombreProyecto: string | null;
  Area: string | null;
  Estado: string;
  CreadoEn: string;
}

async function socFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await rawFetch(path, opts);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

function estadoColor(estado: string): string {
  if (estado.includes('Aprobado')) return 'text-emerald-400 bg-emerald-400/10';
  if (estado.includes('Borrador')) return 'text-amber-400 bg-amber-400/10';
  if (estado.includes('Revisión')) return 'text-blue-400 bg-blue-400/10';
  if (estado.includes('Observ')) return 'text-orange-400 bg-orange-400/10';
  if (estado.includes('Cancelado')) return 'text-red-400 bg-red-400/10';
  return 'text-slate-400 bg-slate-400/10';
}

function estadoIcon(estado: string) {
  if (estado.includes('Aprobado') || estado.includes('Liberado')) return CheckCircle2;
  if (estado.includes('Observ') || estado.includes('Cancelado')) return AlertCircle;
  return Clock;
}

export default function ProyectosPage() {
  const router = useRouter();
  const [reqs, setReqs] = useState<Requerimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await socFetch<Requerimiento[]>('/api/requerimientos');
      setReqs(data);
    } catch (e) {
      setError('No se pudo conectar con el servicio de requerimientos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const borradores = reqs.filter(r => r.Estado.includes('Borrador') || r.Estado.includes('Revisión')).length;
  const aprobados = reqs.filter(r => r.Estado.includes('Aprobado') || r.Estado.includes('Liberado')).length;

  return (
    <div className="h-full flex flex-col gap-6 p-6 overflow-y-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00614E]/20 flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-[#00614E]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Proyectos SOC</h1>
            <p className="text-sm text-slate-400">Requerimientos ISO/IEC 20000</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/proyectos/mapa')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-colors"
          >
            <Map className="w-4 h-4" />
            Mapa org.
          </button>
          <button
            onClick={() => router.push('/proyectos/reglas')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Reglas
          </button>
          <button
            onClick={() => router.push('/proyectos/nuevo')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#00614E] hover:bg-[#00614E]/80 text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo requerimiento
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: reqs.length, color: 'text-white' },
          { label: 'En progreso', value: borradores, color: 'text-amber-400' },
          { label: 'Aprobados', value: aprobados, color: 'text-emerald-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-sm text-slate-400">{stat.label}</p>
            <p className={`text-3xl font-semibold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      <div className="flex-1 bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
            Cargando requerimientos…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-sm">{error}</p>
          </div>
        ) : reqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
            <FileText className="w-10 h-10 opacity-30" />
            <p className="text-sm">No hay requerimientos todavía</p>
            <button
              onClick={() => router.push('/proyectos/nuevo')}
              className="text-sm text-[#00614E] hover:underline"
            >
              Crear el primero
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {reqs.map(req => {
              const Icon = estadoIcon(req.Estado);
              return (
                <button
                  key={req.id}
                  onClick={() => router.push(`/proyectos/${req.id}`)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left"
                >
                  <FileText className="w-5 h-5 text-slate-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-[#00614E] font-medium">{req.Folio}</span>
                      {req.Area && (
                        <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                          {req.Area}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 truncate mt-0.5">
                      {req.NombreProyecto ?? 'Sin nombre de proyecto'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${estadoColor(req.Estado)}`}>
                      <Icon className="w-3 h-3" />
                      {req.Estado}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(req.CreadoEn).toLocaleDateString('es-MX')}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
