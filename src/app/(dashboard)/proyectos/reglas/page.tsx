'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, BookOpen, Loader2 } from 'lucide-react';
import { socFetch } from '@/lib/soc-api';

interface ReglaDeNegocio {
  Id: string;
  Descripcion: string;
  PreguntaVerificacion: string | null;
  AplicaATipo: number | null;
  AplicaAArea: string | null;
  EsObligatoria: boolean;
  Activa: boolean;
}

export default function ReglasPage() {
  const router = useRouter();
  const [reglas, setReglas] = useState<ReglaDeNegocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [creando, setCreando] = useState(false);
  const [form, setForm] = useState({
    Descripcion: '',
    PreguntaVerificacion: '',
    AplicaATipo: '',
    AplicaAArea: '',
    EsObligatoria: true,
  });

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await socFetch(`/api/entrenamiento/reglas`);
      if (res.ok) setReglas(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function crear() {
    if (!form.Descripcion.trim()) return;
    setCreando(true);
    try {
      const res = await socFetch(`/api/entrenamiento/reglas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Descripcion: form.Descripcion,
          PreguntaVerificacion: form.PreguntaVerificacion || null,
          AplicaATipo: form.AplicaATipo || null,
          AplicaAArea: form.AplicaAArea || null,
          EsObligatoria: form.EsObligatoria,
        }),
      });
      if (res.ok) {
        setForm({ Descripcion: '', PreguntaVerificacion: '', AplicaATipo: '', AplicaAArea: '', EsObligatoria: true });
        await cargar();
      }
    } finally {
      setCreando(false);
    }
  }

  async function eliminar(id: string) {
    await socFetch(`/api/entrenamiento/reglas/${id}`, { method: 'DELETE' });
    setReglas(prev => prev.filter(r => r.Id !== id));
  }

  const tipoLabel = (t: number | null) => t === 1 ? 'Mejora' : t === 2 ? 'Sistema Nuevo' : 'Ambos';

  return (
    <div className="h-full flex flex-col gap-6 p-6 overflow-y-auto">

      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/proyectos')} className="p-1.5 rounded-lg hover:bg-white/10">
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </button>
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#00614E]" />
          <h1 className="text-lg font-semibold text-white">Reglas de negocio</h1>
        </div>
        <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
          Panel de entrenamiento
        </span>
      </div>

      <p className="text-sm text-slate-400 -mt-2">
        El agente carga estas reglas como checklist en cada sesión. Agrega aquí cualquier política o validación que debe verificar antes de generar el documento.
      </p>

      {/* Formulario */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/10 space-y-3">
        <p className="text-sm font-medium text-white">Nueva regla</p>
        <textarea
          value={form.Descripcion}
          onChange={e => setForm(p => ({ ...p, Descripcion: e.target.value }))}
          placeholder="Descripción de la regla (ej: Toda mejora debe incluir el nombre del campo afectado)"
          rows={2}
          className="w-full resize-none bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00614E]/50"
        />
        <input
          value={form.PreguntaVerificacion}
          onChange={e => setForm(p => ({ ...p, PreguntaVerificacion: e.target.value }))}
          placeholder="Pregunta de verificación para el agente (opcional)"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00614E]/50"
        />
        <div className="flex gap-3">
          <select
            value={form.AplicaATipo}
            onChange={e => setForm(p => ({ ...p, AplicaATipo: e.target.value }))}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none"
          >
            <option value="">Aplica a todos los tipos</option>
            <option value="Mejora">Solo R-ISO-147 (Mejora)</option>
            <option value="SistemaNuevo">Solo R-ISO-81 (Sistema Nuevo)</option>
          </select>
          <input
            value={form.AplicaAArea}
            onChange={e => setForm(p => ({ ...p, AplicaAArea: e.target.value }))}
            placeholder="Área específica (opcional)"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.EsObligatoria}
              onChange={e => setForm(p => ({ ...p, EsObligatoria: e.target.checked }))}
              className="accent-[#00614E]"
            />
            Obligatoria
          </label>
          <button
            onClick={crear}
            disabled={!form.Descripcion.trim() || creando}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#00614E] hover:bg-[#00614E]/80 text-white disabled:opacity-40"
          >
            {creando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Agregar
          </button>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
      ) : reglas.length === 0 ? (
        <p className="text-center text-slate-500 text-sm py-8">No hay reglas registradas todavía</p>
      ) : (
        <div className="space-y-2">
          {reglas.map(r => (
            <div key={r.Id} className="flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200">{r.Descripcion}</p>
                {r.PreguntaVerificacion && (
                  <p className="text-xs text-slate-500 mt-1 italic">"{r.PreguntaVerificacion}"</p>
                )}
                <div className="flex gap-2 mt-2">
                  <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                    {tipoLabel(r.AplicaATipo)}
                  </span>
                  {r.AplicaAArea && (
                    <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{r.AplicaAArea}</span>
                  )}
                  {r.EsObligatoria && (
                    <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">Obligatoria</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => eliminar(r.Id)}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
