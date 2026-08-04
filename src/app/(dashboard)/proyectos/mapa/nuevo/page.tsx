'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Loader2 } from 'lucide-react';
import { socFetch } from '@/lib/soc-api';

const TIPOS = [
  { value: 'Contabilidad', label: 'Contabilidad', desc: 'Cierres, pólizas, conciliaciones, reportes financieros' },
  { value: 'Auditoria', label: 'Auditoría', desc: 'Papeles de trabajo, hallazgos, evidencias, reportes al consejo' },
  { value: 'RecursosHumanos', label: 'Recursos Humanos', desc: 'Nómina, altas, bajas, vacaciones, evaluaciones' },
  { value: 'Legal', label: 'Legal / Jurídico', desc: 'Contratos, litigios, cumplimiento regulatorio' },
  { value: 'TI', label: 'Tecnologías de Información', desc: 'Soporte, usuarios, cambios, respaldos, incidentes' },
  { value: 'Compras', label: 'Compras / Abastecimiento', desc: 'Proceso de compra, proveedores, autorizaciones, órdenes' },
  { value: 'Ventas', label: 'Ventas / Comercial', desc: 'Ciclo de venta, cotizaciones, descuentos, clientes' },
  { value: 'Direccion', label: 'Dirección General', desc: 'Decisiones estratégicas, aprobaciones, reportes ejecutivos' },
  { value: 'Operaciones', label: 'Operaciones', desc: 'Producción, logística, almacén, calidad' },
  { value: 'Otro', label: 'Otro', desc: 'Área no listada o transversal' },
];

export default function NuevoMapeoPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombreDepartamento: '',
    tipo: '',
    responsableNombre: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function iniciar() {
    if (!form.nombreDepartamento.trim() || !form.tipo || !form.responsableNombre.trim()) {
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
      router.push(`/proyectos/mapa/${data.id}?q=${encodeURIComponent(data.primeraPregunta)}`);
    } catch {
      setError('No se pudo iniciar el mapeo. Verifica la conexión con el servicio SOC.');
      setGuardando(false);
    }
  }

  return (
    <div className="h-full flex flex-col gap-6 p-6 overflow-y-auto">

      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/proyectos/mapa')}
          className="p-1.5 rounded-lg hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </button>
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-violet-400" />
          <h1 className="text-lg font-semibold text-white">Nuevo mapeo de departamento</h1>
        </div>
      </div>

      <p className="text-sm text-slate-400 -mt-2 max-w-lg">
        El agente hará preguntas adaptadas al tipo de departamento para descubrir cómo toman decisiones,
        qué reglas aplican y qué información utilizan.
      </p>

      <div className="max-w-2xl space-y-5">

        {/* Nombre */}
        <div className="space-y-1.5">
          <label className="text-sm text-slate-300 font-medium">Nombre del departamento</label>
          <input
            value={form.nombreDepartamento}
            onChange={e => setForm(p => ({ ...p, nombreDepartamento: e.target.value }))}
            placeholder="ej. Contabilidad, Compras CDMX, Auditoría Interna…"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
          />
        </div>

        {/* Tipo */}
        <div className="space-y-2">
          <label className="text-sm text-slate-300 font-medium">Tipo de departamento</label>
          <div className="grid grid-cols-2 gap-2">
            {TIPOS.map(t => (
              <button
                key={t.value}
                onClick={() => setForm(p => ({ ...p, tipo: t.value }))}
                className={`text-left px-4 py-3 rounded-xl border transition-colors ${
                  form.tipo === t.value
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <p className={`text-sm font-medium ${form.tipo === t.value ? 'text-violet-300' : 'text-slate-200'}`}>
                  {t.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-tight">{t.desc}</p>
              </button>
            ))}
          </div>
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
