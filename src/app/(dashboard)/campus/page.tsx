'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { Map, Palette, LayoutGrid, Save, MapPin, Users, Check } from 'lucide-react';

interface CampusConfig {
  map_source?: string;
  map_template?: string;
  background_color?: string;
}

interface Room {
  id: string;
  name: string;
  room_type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface OfficeBranch {
  id: string;
  name: string;
  address?: string;
  color: string;
  is_main: boolean;
  _count?: { team_slots: number };
}

const ROOM_TYPES: Record<string, string> = {
  department: 'bg-indigo-500/20 text-indigo-300',
  meeting:    'bg-purple-500/20 text-purple-300',
  desk:       'bg-blue-500/20 text-blue-300',
  break:      'bg-amber-500/20 text-amber-300',
};

export default function CampusPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'map' | 'branches'>('branches');

  // Map tab state
  const [config, setConfig]     = useState<CampusConfig | null>(null);
  const [templates, setTemplates] = useState<Array<{ key: string; background_color: string; rooms_count: number; preview_url: string }>>([]);
  const [rooms, setRooms]       = useState<Room[]>([]);
  const [saving, setSaving]     = useState(false);
  const [saved,  setSaved]      = useState(false);

  // Branches tab state
  const [branchesEnabled, setBranchesEnabled] = useState(false);
  const [branches, setBranches]   = useState<OfficeBranch[]>([]);
  const [myBranchId, setMyBranchId] = useState<string | null>(null);
  const [settingBranch, setSettingBranch] = useState(false);
  const [branchSaved, setBranchSaved]     = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/tenants/mine/features').catch(() => ({})),
      api.get('/tenants/mine/office-branches').catch(() => []),
      api.get('/campus/config').catch(() => null),
      api.get('/campus/templates').catch(() => []),
      api.get('/campus/snapshot').catch(() => ({ rooms: [] })),
      api.get('/team-slots/me').catch(() => null),
    ]).then(([features, brs, cfg, tmpl, snapshot, me]) => {
      const enabled = (features as any)?.branches_enabled ?? false;
      setBranchesEnabled(enabled);
      setBranches(Array.isArray(brs) ? brs : []);
      setMyBranchId((me as any)?.office_branch_id ?? null);
      setConfig(cfg as CampusConfig);
      setTemplates(Array.isArray(tmpl) ? tmpl : []);
      setRooms((snapshot as any)?.rooms ?? []);
      setTab(enabled ? 'branches' : 'map');
      setLoading(false);
    });
  }, []);

  async function saveConfig() {
    if (!config) return;
    setSaving(true);
    try {
      await api.patch('/campus/config', config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      const snapshot = await api.get('/campus/snapshot');
      setRooms((snapshot as any)?.rooms ?? []);
    } catch {}
    setSaving(false);
  }

  async function handleSetBranch(branchId: string | null) {
    setSettingBranch(true);
    try {
      await api.patch('/team-slots/me/office-branch', { office_branch_id: branchId });
      setMyBranchId(branchId);
      setBranchSaved(true);
      // update counts locally
      setBranches(prev => prev.map(b => ({
        ...b,
        _count: {
          team_slots:
            branchId === b.id
              ? (b._count?.team_slots ?? 0) + (myBranchId !== b.id ? 1 : 0)
              : b.id === myBranchId
              ? Math.max(0, (b._count?.team_slots ?? 0) - 1)
              : (b._count?.team_slots ?? 0),
        },
      })));
      setTimeout(() => setBranchSaved(false), 2000);
    } catch {}
    setSettingBranch(false);
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header + Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Campus</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {branchesEnabled ? 'Sucursales y mapa de la empresa' : 'Mapa de tu oficina virtual'}
          </p>
        </div>
        {tab === 'map' && (
          <button
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Save size={15} />
            {saved ? '¡Guardado!' : saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        )}
      </div>

      {branchesEnabled && (
        <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
          <button
            onClick={() => setTab('branches')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'branches' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <MapPin size={14} />
            Sucursales
          </button>
          <button
            onClick={() => setTab('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'map' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Map size={14} />
            Mapa
          </button>
        </div>
      )}

      {/* ─── BRANCHES TAB ─── */}
      {tab === 'branches' && (
        <div className="space-y-6">
          {/* Mi sucursal */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={15} className="text-indigo-400" />
              <h2 className="font-semibold text-white text-sm">Mi sucursal</h2>
              {branchSaved && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 ml-auto">
                  <Check size={12} /> Guardado
                </span>
              )}
            </div>
            {branches.length === 0 ? (
              <p className="text-sm text-gray-500">
                No hay sucursales registradas. Ve a{' '}
                <span className="text-indigo-400">Configuración → Sucursales</span> para crear la primera.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {branches.map(b => {
                  const active = myBranchId === b.id;
                  return (
                    <button
                      key={b.id}
                      disabled={settingBranch}
                      onClick={() => handleSetBranch(active ? null : b.id)}
                      className={`relative p-4 rounded-xl border text-left transition-all ${
                        active
                          ? 'border-indigo-500 bg-indigo-600/10'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: b.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white truncate">{b.name}</p>
                            {b.is_main && (
                              <span className="text-xs bg-indigo-900/60 text-indigo-300 px-1.5 py-0.5 rounded flex-shrink-0">Principal</span>
                            )}
                          </div>
                          {b.address && <p className="text-xs text-gray-400 mt-0.5 truncate">{b.address}</p>}
                          {b._count !== undefined && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Users size={10} />
                              {b._count.team_slots} persona{b._count.team_slots !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        {active && (
                          <Check size={14} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                      {active && (
                        <p className="text-xs text-indigo-300 mt-2">Haz clic para desvincular</p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resumen de distribución */}
          {branches.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users size={15} className="text-indigo-400" />
                <h2 className="font-semibold text-white text-sm">Distribución del equipo</h2>
              </div>
              <div className="space-y-3">
                {branches.map(b => {
                  const count = b._count?.team_slots ?? 0;
                  const total = branches.reduce((s, x) => s + (x._count?.team_slots ?? 0), 0);
                  const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={b.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                          <span className="text-sm text-white">{b.name}</span>
                        </div>
                        <span className="text-xs text-gray-400">{count} persona{count !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: b.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── MAP TAB ─── */}
      {tab === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <LayoutGrid size={15} className="text-indigo-400" />
                <h2 className="font-medium text-white text-sm">Tipo de mapa</h2>
              </div>
              <div className="space-y-2">
                {[
                  { value: 'template', label: 'Template predefinido', desc: 'Salas generadas automáticamente' },
                  { value: 'custom',   label: 'Mapa personalizado',    desc: 'Sube tu propio imagen o JSON' },
                ].map((opt) => (
                  <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    config?.map_source === opt.value ? 'border-indigo-500 bg-indigo-600/10' : 'border-gray-700 hover:border-gray-600'
                  }`}>
                    <input
                      type="radio" name="map_source" value={opt.value}
                      checked={config?.map_source === opt.value}
                      onChange={() => setConfig(c => ({ ...c, map_source: opt.value }))}
                      className="mt-0.5 accent-indigo-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-white">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Palette size={15} className="text-indigo-400" />
                <h2 className="font-medium text-white text-sm">Color de fondo</h2>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config?.background_color ?? '#1a1a2e'}
                  onChange={e => setConfig(c => ({ ...c, background_color: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer bg-transparent"
                />
                <span className="text-sm text-gray-400 font-mono">{config?.background_color ?? '#1a1a2e'}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {config?.map_source === 'template' && templates.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Map size={15} className="text-indigo-400" />
                  <h2 className="font-medium text-white text-sm">Template de campus</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {templates.map(t => (
                    <label key={t.key} className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      config?.map_template === t.key ? 'border-indigo-500 bg-indigo-600/10' : 'border-gray-700 hover:border-gray-600'
                    }`}>
                      <input type="radio" name="map_template" value={t.key}
                        checked={config?.map_template === t.key}
                        onChange={() => setConfig(c => ({ ...c, map_template: t.key, map_source: 'template' }))}
                        className="hidden"
                      />
                      <div className="w-full h-16 rounded-md mb-3" style={{ backgroundColor: t.background_color }} />
                      <p className="text-sm font-medium text-white capitalize">{t.key.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t.rooms_count} salas</p>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="font-medium text-white text-sm mb-4">Salas actuales ({rooms.length})</h2>
              {rooms.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">
                  Selecciona un template y guarda para generar las salas
                </p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {rooms.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: r.color }} />
                        <span className="text-sm text-white">{r.name}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ROOM_TYPES[r.room_type] ?? 'bg-gray-700 text-gray-400'}`}>
                        {r.room_type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
