'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, FileText, CheckCircle2, Clock, AlertCircle,
  FolderKanban, ChevronRight, Trash2, Database,
  BookOpen, Building2, Monitor, Users2, Loader2,
  Send, Check, X, ShieldCheck,
} from 'lucide-react';
import { socFetch as rawFetch } from '@/lib/soc-api';

interface Requerimiento {
  id: string;
  folio: string;
  nombreProyecto: string | null;
  area: string | null;
  estado: string;
  creadoEn: string;
  voboResumen?: { total: number; aprobados: number; rechazados: number };
}

interface ReglaDeNegocio {
  Id: string;
  Descripcion: string;
  PreguntaVerificacion: string | null;
  AplicaATipo: number | null;
  AplicaAArea: string | null;
  EsObligatoria: boolean;
  Activa: boolean;
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

function VoBoBadge({ resumen }: { resumen: Requerimiento['voboResumen'] }) {
  if (!resumen || resumen.total === 0) return null;
  const todos = resumen.aprobados === resumen.total;
  const hayRechazos = resumen.rechazados > 0;
  const cls = todos
    ? 'text-emerald-400 bg-emerald-400/10'
    : hayRechazos
    ? 'text-red-400 bg-red-400/10'
    : 'text-yellow-400 bg-yellow-400/10';
  const icon = todos ? <Check className="w-3 h-3" /> : hayRechazos ? <X className="w-3 h-3" /> : <Send className="w-3 h-3" />;
  return (
    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {icon}
      VoBo {resumen.aprobados}/{resumen.total}
    </span>
  );
}

export default function ProyectosPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'reqs' | 'info'>('reqs');
  const [infoTab, setInfoTab] = useState<'catalogos' | 'reglas'>('catalogos');

  // Requerimientos
  const [reqs, setReqs] = useState<Requerimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [eliminando, setEliminando] = useState<string | null>(null);

  // Reglas
  const [reglas, setReglas] = useState<ReglaDeNegocio[]>([]);
  const [reglasLoading, setReglasLoading] = useState(false);
  const [reglasLoaded, setReglasLoaded] = useState(false);
  const [creandoRegla, setCreandoRegla] = useState(false);
  const [reglaForm, setReglaForm] = useState({
    Descripcion: '', PreguntaVerificacion: '', AplicaATipo: '', AplicaAArea: '', EsObligatoria: true,
  });

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await socFetch<Requerimiento[]>('/api/requerimientos');
      setReqs(data);
    } catch {
      setError('No se pudo conectar con el servicio de requerimientos.');
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarReglas = useCallback(async () => {
    if (reglasLoaded) return;
    setReglasLoading(true);
    try {
      const res = await rawFetch(`/api/entrenamiento/reglas`);
      if (res.ok) setReglas(await res.json());
      setReglasLoaded(true);
    } finally {
      setReglasLoading(false);
    }
  }, [reglasLoaded]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (tab === 'info') cargarReglas();
  }, [tab, cargarReglas]);

  async function eliminar(e: React.MouseEvent, id: string, folio: string) {
    e.stopPropagation();
    if (!confirm(`¿Eliminar ${folio}? Esta acción no se puede deshacer.`)) return;
    setEliminando(id);
    try {
      const res = await rawFetch(`/api/requerimientos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setReqs(prev => prev.filter(r => r.id !== id));
    } catch {
      alert('No se pudo eliminar. Intenta de nuevo.');
    } finally {
      setEliminando(null);
    }
  }

  async function crearRegla() {
    if (!reglaForm.Descripcion.trim()) return;
    setCreandoRegla(true);
    try {
      const res = await rawFetch(`/api/entrenamiento/reglas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Descripcion: reglaForm.Descripcion,
          PreguntaVerificacion: reglaForm.PreguntaVerificacion || null,
          AplicaATipo: reglaForm.AplicaATipo || null,
          AplicaAArea: reglaForm.AplicaAArea || null,
          EsObligatoria: reglaForm.EsObligatoria,
        }),
      });
      if (res.ok) {
        setReglaForm({ Descripcion: '', PreguntaVerificacion: '', AplicaATipo: '', AplicaAArea: '', EsObligatoria: true });
        setReglasLoaded(false);
        await cargarReglas();
        setReglasLoaded(true);
      }
    } finally {
      setCreandoRegla(false);
    }
  }

  async function eliminarRegla(id: string) {
    await rawFetch(`/api/entrenamiento/reglas/${id}`, { method: 'DELETE' });
    setReglas(prev => prev.filter(r => r.Id !== id));
  }

  const borradores = reqs.filter(r => r.estado.includes('Borrador') || r.estado.includes('Revisión')).length;
  const aprobados = reqs.filter(r => r.estado.includes('Aprobado') || r.estado.includes('Liberado')).length;
  const filtrados = busqueda.trim()
    ? reqs.filter(r =>
        r.folio.toLowerCase().includes(busqueda.toLowerCase()) ||
        (r.nombreProyecto ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (r.area ?? '').toLowerCase().includes(busqueda.toLowerCase())
      )
    : reqs;

  // Datos derivados para catálogos
  const areasUnicas = [...new Set(reqs.map(r => r.area).filter(Boolean) as string[])].sort();
  const tipoLabel = (t: number | null) => t === 1 ? 'Mejora' : t === 2 ? 'Sistema Nuevo' : 'Ambos';

  return (
    <div className="h-full flex flex-col gap-0 overflow-hidden">

      {/* Header fijo */}
      <div className="px-6 pt-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00614E]/20 flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-[#00614E]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Proyectos SOC</h1>
              <p className="text-sm text-slate-400">Requerimientos ISO/IEC 20000</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/proyectos/nuevo')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#00614E] hover:bg-[#00614E]/80 text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo requerimiento
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/10">
          {[
            { key: 'reqs' as const, label: 'Requerimientos', count: reqs.length },
            { key: 'info' as const, label: 'Información', count: null },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t.key
                  ? 'text-white border-[#00614E]'
                  : 'text-slate-400 border-transparent hover:text-slate-300'
              }`}
            >
              {t.label}
              {t.count !== null && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-[#00614E]/30 text-[#00614E]' : 'bg-white/5 text-slate-500'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">

        {/* ── TAB: REQUERIMIENTOS ── */}
        {tab === 'reqs' && (
          <div className="flex flex-col gap-5 pt-4">

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

            {/* Buscador */}
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por folio o nombre de proyecto…"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
            />

            {/* Lista */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
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
                  <button onClick={() => router.push('/proyectos/nuevo')} className="text-sm text-[#00614E] hover:underline">
                    Crear el primero
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filtrados.map(req => {
                    const Icon = estadoIcon(req.estado);
                    return (
                      <div
                        key={req.id}
                        onClick={() => router.push(`/proyectos/${req.id}`)}
                        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <FileText className="w-5 h-5 text-slate-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm text-[#00614E] font-medium">{req.folio}</span>
                            {req.area && (
                              <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                                {req.area}
                              </span>
                            )}
                            <VoBoBadge resumen={req.voboResumen} />
                          </div>
                          <p className="text-sm text-slate-300 truncate mt-0.5">
                            {req.nombreProyecto ?? 'Sin nombre de proyecto'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${estadoColor(req.estado)}`}>
                            <Icon className="w-3 h-3" />
                            {req.estado}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(req.creadoEn).toLocaleDateString('es-MX')}
                          </span>
                          <button
                            onClick={e => eliminar(e, req.id, req.folio)}
                            disabled={eliminando === req.id}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: INFORMACIÓN ── */}
        {tab === 'info' && (
          <div className="flex flex-col gap-5 pt-4">

            {/* Sub-tabs */}
            <div className="flex gap-1">
              {[
                { key: 'catalogos' as const, icon: <Database className="w-3.5 h-3.5" />, label: 'Catálogos' },
                { key: 'reglas' as const, icon: <BookOpen className="w-3.5 h-3.5" />, label: `Reglas${reglas.length > 0 ? ` (${reglas.length})` : ''}` },
              ].map(st => (
                <button
                  key={st.key}
                  onClick={() => setInfoTab(st.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    infoTab === st.key
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {st.icon}
                  {st.label}
                </button>
              ))}
            </div>

            {/* CATÁLOGOS */}
            {infoTab === 'catalogos' && (
              <div className="grid gap-4">

                {/* Departamentos SOC */}
                <div className="bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                    <Building2 className="w-4 h-4 text-[#00614E]" />
                    <p className="text-sm font-medium text-white">Departamentos SOC</p>
                    <span className="text-xs text-slate-500 ml-auto">Derivado de requerimientos</span>
                  </div>
                  {areasUnicas.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-slate-500 text-xs">
                      Se poblará automáticamente cuando se creen requerimientos con área asignada
                    </div>
                  ) : (
                    <div className="p-4 flex flex-wrap gap-2">
                      {areasUnicas.map(area => (
                        <div
                          key={area}
                          className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2"
                        >
                          <span className="w-2 h-2 rounded-full bg-[#00614E] shrink-0" />
                          <span className="text-sm text-slate-200">{area}</span>
                          <span className="text-xs text-slate-500 ml-1">
                            {reqs.filter(r => r.area === area).length} req.
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sistemas */}
                <div className="bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                    <Monitor className="w-4 h-4 text-blue-400" />
                    <p className="text-sm font-medium text-white">Sistemas</p>
                    <span className="text-xs text-slate-500 ml-auto">Recopilado en requerimientos</span>
                  </div>
                  <div className="p-4 space-y-2">
                    {reqs.filter(r => r.nombreProyecto).map(r => (
                      <div
                        key={r.id}
                        onClick={() => router.push(`/proyectos/${r.id}`)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <Monitor className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="text-sm text-slate-200 flex-1 truncate">{r.nombreProyecto}</span>
                        {r.area && (
                          <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full shrink-0">{r.area}</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${estadoColor(r.estado)}`}>{r.estado}</span>
                      </div>
                    ))}
                    {reqs.filter(r => r.nombreProyecto).length === 0 && (
                      <p className="text-center text-xs text-slate-500 py-4">
                        Los sistemas se registran al crear requerimientos de sistema nuevo
                      </p>
                    )}
                  </div>
                </div>

                {/* Responsables de VoBo */}
                <div className="bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                    <Users2 className="w-4 h-4 text-purple-400" />
                    <p className="text-sm font-medium text-white">Responsables</p>
                    <span className="text-xs text-slate-500 ml-auto">De solicitudes VoBo</span>
                  </div>
                  <div className="flex items-center justify-center py-8 text-slate-500 text-xs">
                    Se registran automáticamente al enviar solicitudes de VoBo a otras áreas
                  </div>
                </div>

                {/* Aprobaciones globales */}
                <div className="bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <p className="text-sm font-medium text-white">Estatus de aprobación</p>
                    <span className="text-xs text-slate-500 ml-auto">Por área</span>
                  </div>
                  <div className="p-4 space-y-2">
                    {areasUnicas.length === 0 ? (
                      <p className="text-center text-xs text-slate-500 py-4">
                        Aparece cuando hay requerimientos con área asignada
                      </p>
                    ) : (
                      areasUnicas.map(area => {
                        const count = reqs.filter(r => r.area === area).length;
                        const aprobadosArea = reqs.filter(r => r.area === area && (r.estado.includes('Aprobado') || r.estado.includes('Liberado'))).length;
                        return (
                          <div key={area} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
                            <span className="text-sm text-slate-200 flex-1">{area}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#00614E] rounded-full transition-all"
                                  style={{ width: count > 0 ? `${(aprobadosArea / count) * 100}%` : '0%' }}
                                />
                              </div>
                              <span className="text-xs text-slate-400 w-12 text-right">
                                {aprobadosArea}/{count}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* REGLAS */}
            {infoTab === 'reglas' && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-slate-400">
                  El agente carga estas reglas como checklist en cada sesión. Agrega políticas o validaciones que debe verificar antes de generar el documento.
                </p>

                {/* Formulario */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/10 space-y-3">
                  <p className="text-sm font-medium text-white">Nueva regla</p>
                  <textarea
                    value={reglaForm.Descripcion}
                    onChange={e => setReglaForm(p => ({ ...p, Descripcion: e.target.value }))}
                    placeholder="Descripción de la regla (ej: Toda mejora debe incluir el nombre del campo afectado)"
                    rows={2}
                    className="w-full resize-none bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00614E]/50"
                  />
                  <input
                    value={reglaForm.PreguntaVerificacion}
                    onChange={e => setReglaForm(p => ({ ...p, PreguntaVerificacion: e.target.value }))}
                    placeholder="Pregunta de verificación para el agente (opcional)"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00614E]/50"
                  />
                  <div className="flex gap-3">
                    <select
                      value={reglaForm.AplicaATipo}
                      onChange={e => setReglaForm(p => ({ ...p, AplicaATipo: e.target.value }))}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none"
                    >
                      <option value="">Aplica a todos los tipos</option>
                      <option value="Mejora">Solo R-ISO-147 (Mejora)</option>
                      <option value="SistemaNuevo">Solo R-ISO-81 (Sistema Nuevo)</option>
                    </select>
                    <input
                      value={reglaForm.AplicaAArea}
                      onChange={e => setReglaForm(p => ({ ...p, AplicaAArea: e.target.value }))}
                      placeholder="Área específica (opcional)"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reglaForm.EsObligatoria}
                        onChange={e => setReglaForm(p => ({ ...p, EsObligatoria: e.target.checked }))}
                        className="accent-[#00614E]"
                      />
                      Obligatoria
                    </label>
                    <button
                      onClick={crearRegla}
                      disabled={!reglaForm.Descripcion.trim() || creandoRegla}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#00614E] hover:bg-[#00614E]/80 text-white disabled:opacity-40"
                    >
                      {creandoRegla ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Agregar
                    </button>
                  </div>
                </div>

                {/* Lista de reglas */}
                {reglasLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                  </div>
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
                          <div className="flex gap-2 mt-2 flex-wrap">
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
                          onClick={() => eliminarRegla(r.Id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
