'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Map, Palette, LayoutGrid, Save } from 'lucide-react';

interface CampusConfig {
  map_source?: string;
  map_template?: string;
  background_color?: string;
}

interface Template {
  key: string;
  background_color: string;
  rooms_count: number;
  preview_url: string;
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

export default function CampusPage() {
  const [config, setConfig] = useState<CampusConfig | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/campus/config'),
      api.get('/campus/templates'),
      api.get('/campus/snapshot'),
    ]).then(([cfg, tmpl, snapshot]) => {
      setConfig(cfg);
      setTemplates(tmpl);
      setRooms(snapshot.rooms ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function saveConfig() {
    if (!config) return;
    setSaving(true);
    try {
      await api.patch('/campus/config', config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      const snapshot = await api.get('/campus/snapshot');
      setRooms(snapshot.rooms ?? []);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const ROOM_TYPES: Record<string, string> = {
    department: 'bg-indigo-500/20 text-indigo-300',
    meeting: 'bg-purple-500/20 text-purple-300',
    desk: 'bg-blue-500/20 text-blue-300',
    break: 'bg-amber-500/20 text-amber-300',
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Campus</h1>
          <p className="text-gray-400 mt-1 text-sm">Configura el mapa de tu oficina virtual</p>
        </div>
        <button
          onClick={saveConfig}
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Save size={15} />
          {saved ? '¡Guardado!' : saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config panel */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <LayoutGrid size={15} className="text-indigo-400" />
              <h2 className="font-medium text-white text-sm">Tipo de mapa</h2>
            </div>
            <div className="space-y-2">
              {[
                { value: 'template', label: 'Template predefinido', desc: 'Salas generadas automáticamente' },
                { value: 'custom', label: 'Mapa personalizado', desc: 'Sube tu propio imagen o JSON' },
              ].map((opt) => (
                <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  config?.map_source === opt.value
                    ? 'border-indigo-500 bg-indigo-600/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}>
                  <input
                    type="radio"
                    name="map_source"
                    value={opt.value}
                    checked={config?.map_source === opt.value}
                    onChange={() => setConfig((c) => ({ ...c, map_source: opt.value }))}
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
                onChange={(e) => setConfig((c) => ({ ...c, background_color: e.target.value }))}
                className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer bg-transparent"
              />
              <span className="text-sm text-gray-400 font-mono">{config?.background_color ?? '#1a1a2e'}</span>
            </div>
          </div>
        </div>

        {/* Templates */}
        <div className="lg:col-span-2 space-y-4">
          {config?.map_source === 'template' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Map size={15} className="text-indigo-400" />
                <h2 className="font-medium text-white text-sm">Template de campus</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {templates.map((t) => (
                  <label
                    key={t.key}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      config?.map_template === t.key
                        ? 'border-indigo-500 bg-indigo-600/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="map_template"
                      value={t.key}
                      checked={config?.map_template === t.key}
                      onChange={() => setConfig((c) => ({ ...c, map_template: t.key, map_source: 'template' }))}
                      className="hidden"
                    />
                    <div
                      className="w-full h-16 rounded-md mb-3"
                      style={{ backgroundColor: t.background_color }}
                    />
                    <p className="text-sm font-medium text-white capitalize">{t.key.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.rooms_count} salas</p>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Rooms preview */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-medium text-white text-sm mb-4">Salas actuales ({rooms.length})</h2>
            {rooms.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">
                Selecciona un template y guarda para generar las salas
              </p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {rooms.map((r) => (
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
    </div>
  );
}
