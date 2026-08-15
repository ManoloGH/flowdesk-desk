'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, FileText, CheckCircle2, Clock, AlertCircle,
  FolderKanban, ChevronRight, Trash2, Database,
  BookOpen, Building2, Monitor, Users2, Loader2,
  Send, Check, X, ShieldCheck, ChevronDown, ChevronUp,
  Package, Tag,
} from 'lucide-react';
import { socFetch as rawFetch } from '@/lib/soc-api';

/* ─── Types ─────────────────────────────────────── */

interface Requerimiento {
  id: string;
  folio: string;
  nombreProyecto: string | null;
  area: string | null;
  estado: string;
  creadoEn: string;
  voboResumen?: { total: number; aprobados: number; rechazados: number };
}

interface Catalogo {
  id: string;
  nombre: string;
  descripcion: string | null;
  clave: string | null;
  items: CatalogoItem[];
}

interface CatalogoItem {
  id: string;
  valor: string;
  descripcion: string | null;
  orden: number;
}

interface ReglaDeNegocio {
  Id: string;
  Descripcion: string;
  PreguntaVerificacion: string | null;
  TipoRegla: 'Negocio' | 'Departamento' | 'Sistema';
  AplicaATipo: number | null;
  AplicaAArea: string | null;
  EsObligatoria: boolean;
}

/* ─── Helpers ────────────────────────────────────── */

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await rawFetch(path, opts);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

function estadoColor(e: string) {
  if (e.includes('Aprobado')) return 'text-emerald-400 bg-emerald-400/10';
  if (e.includes('Borrador')) return 'text-amber-400 bg-amber-400/10';
  if (e.includes('Revisión')) return 'text-blue-400 bg-blue-400/10';
  if (e.includes('Observ')) return 'text-orange-400 bg-orange-400/10';
  if (e.includes('Cancelado')) return 'text-red-400 bg-red-400/10';
  return 'text-slate-400 bg-slate-400/10';
}

function estadoIcon(e: string) {
  if (e.includes('Aprobado') || e.includes('Liberado')) return CheckCircle2;
  if (e.includes('Observ') || e.includes('Cancelado')) return AlertCircle;
  return Clock;
}

function VoBoBadge({ r }: { r?: { total: number; aprobados: number; rechazados: number } }) {
  if (!r || r.total === 0) return null;
  const todos = r.aprobados === r.total;
  const hayRechazos = r.rechazados > 0;
  const cls = todos ? 'text-emerald-400 bg-emerald-400/10'
    : hayRechazos ? 'text-red-400 bg-red-400/10'
    : 'text-yellow-400 bg-yellow-400/10';
  return (
    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      <Send className="w-3 h-3" />
      VoBo {r.aprobados}/{r.total}
    </span>
  );
}

const TIPO_REGLA = ['Negocio', 'Departamento', 'Sistema'] as const;
const TIPO_COLOR: Record<string, string> = {
  Negocio:      'text-blue-400 bg-blue-400/10 border-blue-400/20',
  Departamento: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  Sistema:      'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
};
const TIPO_ICON: Record<string, React.ReactNode> = {
  Negocio:      <Tag className="w-3.5 h-3.5" />,
  Departamento: <Building2 className="w-3.5 h-3.5" />,
  Sistema:      <Monitor className="w-3.5 h-3.5" />,
};

/* ─── Blank forms ─────────────────────────────────── */
const blankRegla = { Descripcion: '', PreguntaVerificacion: '', AplicaATipo: '', AplicaAArea: '', EsObligatoria: true };
const blankCatalogo = { nombre: '', descripcion: '', clave: '' };

/* ════════════════════════════════════════════════════ */
export default function ProyectosPage() {
  const router = useRouter();

  const [tab, setTab]         = useState<'reqs' | 'info'>('reqs');
  const [infoTab, setInfoTab] = useState<'catalogos' | 'reglas'>('catalogos');
  const [tipoTab, setTipoTab] = useState<'Negocio' | 'Departamento' | 'Sistema'>('Negocio');

  /* ── Reqs ── */
  const [reqs, setReqs]             = useState<Requerimiento[]>([]);
  const [reqsLoading, setReqsLoading] = useState(true);
  const [reqsError, setReqsError]     = useState<string | null>(null);
  const [busqueda, setBusqueda]       = useState('');
  const [eliminando, setEliminando]   = useState<string | null>(null);

  /* ── Catálogos ── */
  const [catalogos, setCatalogos]         = useState<Catalogo[]>([]);
  const [catLoading, setCatLoading]       = useState(false);
  const [catLoaded, setCatLoaded]         = useState(false);
  const [catExpandido, setCatExpandido]   = useState<string | null>(null);
  const [mostrarFormCat, setMostrarFormCat] = useState(false);
  const [formCat, setFormCat]             = useState(blankCatalogo);
  const [creandoCat, setCreandoCat]       = useState(false);
  const [itemInputs, setItemInputs]       = useState<Record<string, string>>({});
  const [agregandoItem, setAgregandoItem] = useState<string | null>(null);

  /* ── Reglas ── */
  const [reglas, setReglas]               = useState<ReglaDeNegocio[]>([]);
  const [reglasLoading, setReglasLoading] = useState(false);
  const [reglasLoaded, setReglasLoaded]   = useState(false);
  const [creandoRegla, setCreandoRegla]   = useState(false);
  const [reglaForm, setReglaForm]         = useState(blankRegla);

  /* ─── Cargas ──────────────────────────────────── */
  const cargarReqs = useCallback(async () => {
    setReqsLoading(true); setReqsError(null);
    try { setReqs(await apiFetch<Requerimiento[]>('/api/requerimientos')); }
    catch { setReqsError('No se pudo conectar con el servicio.'); }
    finally { setReqsLoading(false); }
  }, []);

  const cargarCatalogos = useCallback(async () => {
    if (catLoaded) return;
    setCatLoading(true);
    try { setCatalogos(await apiFetch<Catalogo[]>('/api/catalogos')); setCatLoaded(true); }
    catch { /* endpoint aún no disponible */ }
    finally { setCatLoading(false); }
  }, [catLoaded]);

  const cargarReglas = useCallback(async () => {
    if (reglasLoaded) return;
    setReglasLoading(true);
    try {
      const res = await rawFetch('/api/entrenamiento/reglas');
      if (res.ok) setReglas(await res.json());
      setReglasLoaded(true);
    } finally { setReglasLoading(false); }
  }, [reglasLoaded]);

  useEffect(() => { cargarReqs(); }, [cargarReqs]);
  useEffect(() => {
    if (tab === 'info') { cargarCatalogos(); cargarReglas(); }
  }, [tab, cargarCatalogos, cargarReglas]);

  /* ─── Actions: reqs ──────────────────────────── */
  async function eliminar(e: React.MouseEvent, id: string, folio: string) {
    e.stopPropagation();
    if (!confirm(`¿Eliminar ${folio}?`)) return;
    setEliminando(id);
    try {
      const res = await rawFetch(`/api/requerimientos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setReqs(p => p.filter(r => r.id !== id));
    } catch { alert('No se pudo eliminar.'); }
    finally { setEliminando(null); }
  }

  /* ─── Actions: catálogos ─────────────────────── */
  async function crearCatalogo() {
    if (!formCat.nombre.trim()) return;
    setCreandoCat(true);
    try {
      const nuevo = await apiFetch<Catalogo>('/api/catalogos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: formCat.nombre, descripcion: formCat.descripcion || null, clave: formCat.clave || null }),
      });
      setCatalogos(p => [...p, nuevo]);
      setFormCat(blankCatalogo);
      setMostrarFormCat(false);
    } catch { alert('No se pudo crear el catálogo.'); }
    finally { setCreandoCat(false); }
  }

  async function eliminarCatalogo(catId: string) {
    if (!confirm('¿Eliminar este catálogo y todos sus ítems?')) return;
    try {
      await rawFetch(`/api/catalogos/${catId}`, { method: 'DELETE' });
      setCatalogos(p => p.filter(c => c.id !== catId));
    } catch { alert('No se pudo eliminar.'); }
  }

  async function agregarItem(catId: string) {
    const val = (itemInputs[catId] ?? '').trim();
    if (!val) return;
    setAgregandoItem(catId);
    try {
      const item = await apiFetch<CatalogoItem>(`/api/catalogos/${catId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor: val }),
      });
      setCatalogos(p => p.map(c => c.id === catId ? { ...c, items: [...c.items, item] } : c));
      setItemInputs(p => ({ ...p, [catId]: '' }));
    } catch { alert('No se pudo agregar el ítem.'); }
    finally { setAgregandoItem(null); }
  }

  async function eliminarItem(catId: string, itemId: string) {
    try {
      await rawFetch(`/api/catalogos/${catId}/items/${itemId}`, { method: 'DELETE' });
      setCatalogos(p => p.map(c => c.id === catId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c));
    } catch { alert('No se pudo eliminar.'); }
  }

  /* ─── Actions: reglas ────────────────────────── */
  async function crearRegla() {
    if (!reglaForm.Descripcion.trim()) return;
    setCreandoRegla(true);
    try {
      const res = await rawFetch('/api/entrenamiento/reglas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Descripcion: reglaForm.Descripcion,
          PreguntaVerificacion: reglaForm.PreguntaVerificacion || null,
          TipoRegla: tipoTab,
          AplicaATipo: reglaForm.AplicaATipo || null,
          AplicaAArea: reglaForm.AplicaAArea || null,
          EsObligatoria: reglaForm.EsObligatoria,
        }),
      });
      if (res.ok) {
        const nueva = await res.json();
        setReglas(p => [...p, nueva]);
        setReglaForm(blankRegla);
      }
    } finally { setCreandoRegla(false); }
  }

  async function eliminarRegla(id: string) {
    await rawFetch(`/api/entrenamiento/reglas/${id}`, { method: 'DELETE' });
    setReglas(p => p.filter(r => r.Id !== id));
  }

  /* ─── Derived ─────────────────────────────────── */
  const borradores = reqs.filter(r => r.estado.includes('Borrador') || r.estado.includes('Revisión')).length;
  const aprobados  = reqs.filter(r => r.estado.includes('Aprobado') || r.estado.includes('Liberado')).length;
  const filtrados  = busqueda.trim()
    ? reqs.filter(r =>
        r.folio.toLowerCase().includes(busqueda.toLowerCase()) ||
        (r.nombreProyecto ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (r.area ?? '').toLowerCase().includes(busqueda.toLowerCase()))
    : reqs;

  const reglasFiltradas = reglas.filter(r => (r.TipoRegla ?? 'Negocio') === tipoTab);

  /* ════════════════════════════════════════════════ */
  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Header */}
      <div className="px-6 pt-6 pb-0 flex-shrink-0">
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
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#00614E] hover:bg-[#00614E]/80 text-white"
          >
            <Plus className="w-4 h-4" /> Nuevo requerimiento
          </button>
        </div>

        {/* Tabs principales */}
        <div className="flex gap-1 border-b border-white/10">
          {([
            { key: 'reqs' as const, label: 'Requerimientos', badge: reqs.length },
            { key: 'info' as const, label: 'Información', badge: null },
          ]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.key ? 'text-white border-[#00614E]' : 'text-slate-400 border-transparent hover:text-slate-300'
              }`}
            >
              {t.label}
              {t.badge !== null && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-[#00614E]/30 text-[#00614E]' : 'bg-white/5 text-slate-500'}`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">

        {/* ══ TAB REQUERIMIENTOS ══ */}
        {tab === 'reqs' && (
          <div className="flex flex-col gap-5 pt-5">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total', value: reqs.length, color: 'text-white' },
                { label: 'En progreso', value: borradores, color: 'text-amber-400' },
                { label: 'Aprobados', value: aprobados, color: 'text-emerald-400' },
              ].map(s => (
                <div key={s.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-sm text-slate-400">{s.label}</p>
                  <p className={`text-3xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por folio o nombre…"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
            />
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              {reqsLoading ? (
                <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Cargando…</div>
              ) : reqsError ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
                  <AlertCircle className="w-8 h-8 text-red-400" /><p className="text-sm">{reqsError}</p>
                </div>
              ) : reqs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
                  <FileText className="w-10 h-10 opacity-30" />
                  <p className="text-sm">No hay requerimientos todavía</p>
                  <button onClick={() => router.push('/proyectos/nuevo')} className="text-sm text-[#00614E] hover:underline">Crear el primero</button>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filtrados.map(req => {
                    const Icon = estadoIcon(req.estado);
                    return (
                      <div key={req.id} onClick={() => router.push(`/proyectos/${req.id}`)}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 cursor-pointer"
                      >
                        <FileText className="w-5 h-5 text-slate-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm text-[#00614E] font-medium">{req.folio}</span>
                            {req.area && <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{req.area}</span>}
                            <VoBoBadge r={req.voboResumen} />
                          </div>
                          <p className="text-sm text-slate-300 truncate mt-0.5">{req.nombreProyecto ?? 'Sin nombre'}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${estadoColor(req.estado)}`}>
                            <Icon className="w-3 h-3" />{req.estado}
                          </span>
                          <span className="text-xs text-slate-500">{new Date(req.creadoEn).toLocaleDateString('es-MX')}</span>
                          <button onClick={e => eliminar(e, req.id, req.folio)} disabled={eliminando === req.id}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-40"
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

        {/* ══ TAB INFORMACIÓN ══ */}
        {tab === 'info' && (
          <div className="flex flex-col gap-5 pt-5">

            {/* Sub-tabs */}
            <div className="flex gap-1">
              {([
                { key: 'catalogos' as const, icon: <Database className="w-3.5 h-3.5" />, label: `Catálogos${catalogos.length > 0 ? ` (${catalogos.length})` : ''}` },
                { key: 'reglas' as const, icon: <BookOpen className="w-3.5 h-3.5" />, label: `Reglas${reglas.length > 0 ? ` (${reglas.length})` : ''}` },
              ]).map(st => (
                <button key={st.key} onClick={() => setInfoTab(st.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    infoTab === st.key ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {st.icon}{st.label}
                </button>
              ))}
            </div>

            {/* ── CATÁLOGOS ── */}
            {infoTab === 'catalogos' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    Define listas de valores reutilizables en formularios (áreas, responsables, estatus, servicios, etc.)
                  </p>
                  <button onClick={() => setMostrarFormCat(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#00614E] hover:bg-[#00614E]/80 text-white shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Nuevo catálogo
                  </button>
                </div>

                {/* Form nuevo catálogo */}
                {mostrarFormCat && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-medium text-white">Nuevo catálogo</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Nombre *</label>
                        <input value={formCat.nombre} onChange={e => setFormCat(p => ({ ...p, nombre: e.target.value }))}
                          placeholder="Ej: Departamentos SOC"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00614E]/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Clave (slug)</label>
                        <input value={formCat.clave} onChange={e => setFormCat(p => ({ ...p, clave: e.target.value }))}
                          placeholder="Ej: departamentos"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00614E]/50"
                        />
                      </div>
                    </div>
                    <input value={formCat.descripcion} onChange={e => setFormCat(p => ({ ...p, descripcion: e.target.value }))}
                      placeholder="Descripción opcional"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00614E]/50"
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setMostrarFormCat(false); setFormCat(blankCatalogo); }}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:bg-white/5 rounded-lg"
                      >Cancelar</button>
                      <button onClick={crearCatalogo} disabled={!formCat.nombre.trim() || creandoCat}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#00614E] text-white disabled:opacity-40"
                      >
                        {creandoCat ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Crear
                      </button>
                    </div>
                  </div>
                )}

                {catLoading && (
                  <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
                )}

                {!catLoading && catalogos.length === 0 && (
                  <div className="flex flex-col items-center gap-3 py-12 text-slate-500">
                    <Package className="w-10 h-10 opacity-20" />
                    <p className="text-sm">No hay catálogos todavía</p>
                    <p className="text-xs text-center max-w-xs">
                      Crea catálogos para gestionar valores de departamentos, responsables, sistemas, estatus y más.
                    </p>
                  </div>
                )}

                {/* Lista de catálogos */}
                <div className="space-y-3">
                  {catalogos.map(cat => {
                    const abierto = catExpandido === cat.id;
                    return (
                      <div key={cat.id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">

                        {/* Header del catálogo */}
                        <div className="flex items-center gap-3 px-4 py-3">
                          <button onClick={() => setCatExpandido(abierto ? null : cat.id)}
                            className="flex items-center gap-3 flex-1 min-w-0 text-left"
                          >
                            <div className="w-7 h-7 rounded-lg bg-[#00614E]/20 flex items-center justify-center shrink-0">
                              <Database className="w-3.5 h-3.5 text-[#00614E]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white">{cat.nombre}</p>
                              {cat.descripcion && <p className="text-xs text-slate-400 truncate">{cat.descripcion}</p>}
                            </div>
                            <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full shrink-0">
                              {cat.items.length} {cat.items.length === 1 ? 'ítem' : 'ítems'}
                            </span>
                            {abierto ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                          </button>
                          <button onClick={() => eliminarCatalogo(cat.id)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 shrink-0"
                            title="Eliminar catálogo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Contenido expandido */}
                        {abierto && (
                          <div className="border-t border-white/10">
                            {cat.items.length === 0 ? (
                              <p className="text-xs text-slate-500 text-center py-4">Sin ítems todavía</p>
                            ) : (
                              <div className="divide-y divide-white/5">
                                {cat.items.map(item => (
                                  <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#00614E] shrink-0" />
                                    <span className="text-sm text-slate-200 flex-1">{item.valor}</span>
                                    {item.descripcion && <span className="text-xs text-slate-500 truncate max-w-[200px]">{item.descripcion}</span>}
                                    <button onClick={() => eliminarItem(cat.id, item.id)}
                                      className="p-1 rounded text-slate-600 hover:text-red-400 shrink-0"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add item row */}
                            <div className="flex gap-2 px-4 py-3 border-t border-white/5">
                              <input
                                value={itemInputs[cat.id] ?? ''}
                                onChange={e => setItemInputs(p => ({ ...p, [cat.id]: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && agregarItem(cat.id)}
                                placeholder="Nuevo ítem…"
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00614E]/50"
                              />
                              <button
                                onClick={() => agregarItem(cat.id)}
                                disabled={!(itemInputs[cat.id] ?? '').trim() || agregandoItem === cat.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#00614E]/20 text-[#00614E] hover:bg-[#00614E]/30 disabled:opacity-40"
                              >
                                {agregandoItem === cat.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                Agregar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── REGLAS ── */}
            {infoTab === 'reglas' && (
              <div className="flex flex-col gap-4">
                <p className="text-xs text-slate-400">
                  Reglas que el agente verifica en cada sesión. Se pueden crear manualmente o se extraen de cada requerimiento.
                </p>

                {/* Tipo tabs */}
                <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
                  {TIPO_REGLA.map(tipo => {
                    const count = reglas.filter(r => (r.TipoRegla ?? 'Negocio') === tipo).length;
                    return (
                      <button key={tipo} onClick={() => setTipoTab(tipo)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          tipoTab === tipo ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        {TIPO_ICON[tipo]}
                        {tipo}
                        {count > 0 && <span className="text-xs opacity-60">({count})</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Form nueva regla */}
                <div className={`bg-white/5 rounded-xl p-4 border space-y-3 ${TIPO_COLOR[tipoTab]}`}>
                  <div className="flex items-center gap-2">
                    {TIPO_ICON[tipoTab]}
                    <p className="text-sm font-medium text-white">Nueva regla de {tipoTab.toLowerCase()}</p>
                  </div>
                  <textarea
                    value={reglaForm.Descripcion}
                    onChange={e => setReglaForm(p => ({ ...p, Descripcion: e.target.value }))}
                    placeholder={
                      tipoTab === 'Departamento' ? 'Ej: El área de Contabilidad requiere autorización del gerente para cambios en catálogos' :
                      tipoTab === 'Sistema' ? 'Ej: El sistema debe validar duplicados antes de guardar un registro' :
                      'Ej: Toda mejora debe especificar el área solicitante y el impacto esperado'
                    }
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
                    <select value={reglaForm.AplicaATipo} onChange={e => setReglaForm(p => ({ ...p, AplicaATipo: e.target.value }))}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none"
                    >
                      <option value="">Todos los tipos de requerimiento</option>
                      <option value="Mejora">Solo Mejora (R-ISO-147)</option>
                      <option value="SistemaNuevo">Solo Sistema Nuevo (R-ISO-81)</option>
                    </select>
                    <input value={reglaForm.AplicaAArea} onChange={e => setReglaForm(p => ({ ...p, AplicaAArea: e.target.value }))}
                      placeholder={tipoTab === 'Departamento' ? 'Departamento' : tipoTab === 'Sistema' ? 'Sistema' : 'Área (opcional)'}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                      <input type="checkbox" checked={reglaForm.EsObligatoria}
                        onChange={e => setReglaForm(p => ({ ...p, EsObligatoria: e.target.checked }))}
                        className="accent-[#00614E]"
                      />
                      Obligatoria
                    </label>
                    <button onClick={crearRegla} disabled={!reglaForm.Descripcion.trim() || creandoRegla}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#00614E] hover:bg-[#00614E]/80 text-white disabled:opacity-40"
                    >
                      {creandoRegla ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Agregar
                    </button>
                  </div>
                </div>

                {/* Lista de reglas filtradas por tipo */}
                {reglasLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
                ) : reglasFiltradas.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-slate-500">
                    <BookOpen className="w-8 h-8 opacity-20" />
                    <p className="text-sm">No hay reglas de {tipoTab.toLowerCase()} todavía</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reglasFiltradas.map(r => (
                      <div key={r.Id} className="flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200">{r.Descripcion}</p>
                          {r.PreguntaVerificacion && (
                            <p className="text-xs text-slate-500 mt-1 italic">"{r.PreguntaVerificacion}"</p>
                          )}
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {r.AplicaATipo && (
                              <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                                {r.AplicaATipo === 1 ? 'Mejora' : r.AplicaATipo === 2 ? 'Sistema Nuevo' : String(r.AplicaATipo)}
                              </span>
                            )}
                            {r.AplicaAArea && (
                              <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{r.AplicaAArea}</span>
                            )}
                            {r.EsObligatoria && (
                              <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">Obligatoria</span>
                            )}
                          </div>
                        </div>
                        <button onClick={() => eliminarRegla(r.Id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 shrink-0"
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
