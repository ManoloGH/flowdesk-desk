'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Building2, Loader2 } from 'lucide-react';
import { socFetch } from '@/lib/soc-api';

interface Depto { id: string; nombre: string; descripcion: string; orden: number; }

export default function NuevoMapeoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tipoParam = searchParams.get('tipo'); // legacy: nombre del depto pre-seleccionado

  const [deptos, setDeptos] = useState<Depto[]>([]);
  const [cargando, setCargando] = useState(true);

  const [form, setForm] = useState({
    nombreDepartamento: tipoParam ?? '',
    tipo: 'Otro', // el enum en backend — siempre Otro para deptos personalizados
    responsableNombre: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    socFetch('/api/departamentos')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((list: Depto[]) => {
        setDeptos(list);
        // Si viene con ?tipo=NombreDepto, buscar el departamento por nombre y pre-llenar
        if (tipoParam) {
          const match = list.find(d => d.nombre.toLowerCase() === tipoParam.toLowerCase()
            || d.nombre.toLowerCase().includes(tipoParam.toLowerCase()));
          if (match) setForm(p => ({ ...p, nombreDepartamento: match.nombre }));
        }
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function iniciar() {
    if (!form.nombreDepartamento.trim() || !form.responsableNombre.trim()) {
      setError('Completa todos los campos antes de continuar.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const res = await socFetch('/api/mapeo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Error al iniciar el mapeo');
      const data = await res.json();

      const returnTo = searchParams.get('returnTo');
      const destino = returnTo
        ? `/proyectos/mapa/${data.id}?q=${encodeURIComponent(data.primeraPregunta)}&returnTo=${encodeURIComponent(returnTo)}`
        : `/proyectos/mapa/${data.id}?q=${encodeURIComponent(data.primeraPregunta)}`;

      router.push(destino);
    } catch {
      setError('No se pudo iniciar el mapeo. Verifica la conexión con el servicio SOC.');
      setGuardando(false);
    }
  }

  return (
    <div className="h-full flex flex-col gap-6 p-6 overflow-y-auto">

      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/10">
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </button>
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-violet-400" />
          <h1 className="text-lg font-semibold text-white">Nuevo mapeo de departamento</h1>
        </div>
      </div>

      <p className="text-sm text-slate-400 -mt-2 max-w-lg">
        El agente hará preguntas adaptadas al departamento para descubrir cómo toman decisiones,
        qué reglas aplican y qué información utilizan.
      </p>

      <div className="max-w-2xl space-y-5">

        {/* Nombre */}
        <div className="space-y-1.5">
          <label className="text-sm text-slate-300 font-medium">Nombre del departamento</label>
          {cargando ? (
            <div className="h-10 bg-white/5 rounded-lg animate-pulse" />
          ) : deptos.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                {deptos.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setForm(p => ({ ...p, nombreDepartamento: d.nombre }))}
                    className={`text-left px-4 py-3 rounded-xl border transition-colors ${
                      form.nombreDepartamento === d.nombre
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <p className={`text-sm font-medium ${form.nombreDepartamento === d.nombre ? 'text-violet-300' : 'text-slate-200'}`}>
                      {d.nombre}
                    </p>
                    {d.descripcion && (
                      <p className="text-xs text-slate-500 mt-0.5 leading-tight">{d.descripcion}</p>
                    )}
                  </button>
                ))}
              </div>
              <input
                value={form.nombreDepartamento}
                onChange={e => setForm(p => ({ ...p, nombreDepartamento: e.target.value }))}
                placeholder="O escribe un nombre personalizado…"
                className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
              />
            </>
          ) : (
            <input
              value={form.nombreDepartamento}
              onChange={e => setForm(p => ({ ...p, nombreDepartamento: e.target.value }))}
              placeholder="ej. Contabilidad, Compras CDMX, Auditoría Interna…"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
            />
          )}
        </div>

        {/* Responsable */}
        <div className="space-y-1.5">
          <label className="text-sm text-slate-300 font-medium">Nombre del responsable del área</label>
          <input
            value={form.responsableNombre}
            onChange={e => setForm(p => ({ ...p, responsableNombre: e.target.value }))}
            placeholder="Quién va a responder las preguntas del agente"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-400/10 px-4 py-2.5 rounded-lg">{error}</p>
        )}

        <button
          onClick={iniciar}
          disabled={guardando}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 transition-colors"
        >
          {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
          Iniciar mapeo
        </button>
      </div>
    </div>
  );
}
