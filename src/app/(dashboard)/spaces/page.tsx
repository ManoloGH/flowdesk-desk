'use client';
import { useEffect, useState, useCallback } from 'react';
import { Camera, Plus, Trash2, Wifi, WifiOff, RefreshCw, Settings } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import clsx from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CameraData {
  id: string;
  name: string;
  type: 'MJPEG' | 'SNAPSHOT' | 'RTSP' | 'CLOUD';
  status: 'ONLINE' | 'OFFLINE' | 'ERROR' | 'UNKNOWN';
  refresh_interval_secs: number;
  cloud_embed_url: string | null;
}

interface Space {
  id: string;
  name: string;
  type: string;
  floor: number;
  cameras: CameraData[];
}

interface StreamUrl {
  type: string;
  stream_url: string | null;
  snapshot_url: string | null;
  cloud_embed_url: string | null;
  refresh_interval_secs: number;
}

const SPACE_TYPE_LABELS: Record<string, string> = {
  OFFICE: 'Oficina',
  MEETING_ROOM: 'Sala de juntas',
  RECEPTION: 'Recepción',
  WAREHOUSE: 'Almacén',
  EXTERIOR: 'Exterior',
  OTHER: 'Otro',
};

// ─── CameraFeed ───────────────────────────────────────────────────────────────

function CameraFeed({ spaceId, camera }: { spaceId: string; camera: CameraData }) {
  const [streamUrl, setStreamUrl] = useState<StreamUrl | null>(null);
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [ts, setTs] = useState(Date.now());

  const loadStream = useCallback(async () => {
    setLoading(true);
    setImgError(false);
    try {
      const data = await api.get<StreamUrl>(`/spaces/${spaceId}/cameras/${camera.id}/stream-url`);
      setStreamUrl(data);
    } catch {
      // silencioso — mostrará placeholder
    } finally {
      setLoading(false);
    }
  }, [spaceId, camera.id]);

  useEffect(() => { loadStream(); }, [loadStream]);

  // Refresca snapshot periódicamente
  useEffect(() => {
    if (camera.type !== 'SNAPSHOT' || !streamUrl?.snapshot_url) return;
    const iv = setInterval(() => setTs(Date.now()), (streamUrl.refresh_interval_secs ?? 5) * 1000);
    return () => clearInterval(iv);
  }, [camera.type, streamUrl]);

  const statusColor = {
    ONLINE: 'bg-emerald-500',
    OFFLINE: 'bg-gray-600',
    ERROR: 'bg-red-500',
    UNKNOWN: 'bg-amber-500',
  }[camera.status];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden group">
      {/* Feed */}
      <div className="relative aspect-video bg-gray-950 flex items-center justify-center">
        {loading ? (
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        ) : camera.type === 'RTSP' ? (
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <Camera size={28} className="text-gray-700" />
            <p className="text-xs text-gray-500">Requiere Vision Agent</p>
            <p className="text-[10px] text-gray-700">Fase 2</p>
          </div>
        ) : camera.type === 'CLOUD' && streamUrl?.cloud_embed_url ? (
          <iframe
            src={streamUrl.cloud_embed_url}
            className="w-full h-full border-0"
            allow="autoplay"
            title={camera.name}
          />
        ) : camera.type === 'MJPEG' && streamUrl?.stream_url && !imgError ? (
          <img
            src={streamUrl.stream_url}
            alt={camera.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : camera.type === 'SNAPSHOT' && streamUrl?.snapshot_url && !imgError ? (
          <img
            src={`${streamUrl.snapshot_url}?t=${ts}`}
            alt={camera.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <WifiOff size={24} className="text-gray-700" />
            <p className="text-xs text-gray-600">Sin señal</p>
          </div>
        )}

        {/* Badge de status */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 rounded-full px-2 py-0.5">
          <span className={clsx('w-1.5 h-1.5 rounded-full', statusColor)} />
          <span className="text-[10px] text-gray-300">{camera.status}</span>
        </div>

        {/* Botón refrescar (snapshot) */}
        {camera.type === 'SNAPSHOT' && streamUrl?.snapshot_url && (
          <button
            onClick={() => setTs(Date.now())}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-black/60 rounded-full text-gray-400 hover:text-white"
          >
            <RefreshCw size={12} />
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2.5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-200">{camera.name}</p>
          <p className="text-[10px] text-gray-600 mt-0.5">{camera.type}</p>
        </div>
        <Wifi size={13} className={camera.status === 'ONLINE' ? 'text-emerald-500' : 'text-gray-700'} />
      </div>
    </div>
  );
}

// ─── AddCameraModal ───────────────────────────────────────────────────────────

function AddCameraModal({ spaceId, onClose, onAdded }: {
  spaceId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [form, setForm] = useState({
    name: '', type: 'MJPEG', stream_url: '', snapshot_url: '',
    rtsp_url: '', cloud_embed_url: '', refresh_interval_secs: 5,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      await api.post(`/spaces/${spaceId}/cameras`, {
        name: form.name,
        type: form.type,
        stream_url: form.stream_url || undefined,
        snapshot_url: form.snapshot_url || undefined,
        rtsp_url: form.rtsp_url || undefined,
        cloud_embed_url: form.cloud_embed_url || undefined,
        refresh_interval_secs: form.refresh_interval_secs,
      });
      onAdded();
    } catch {
      // error silencioso por ahora
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white">Agregar cámara</h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Nombre</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej. Cámara recepción"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Tipo de stream</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="MJPEG">MJPEG (HTTP) — recomendado</option>
              <option value="SNAPSHOT">Snapshot (se refresca)</option>
              <option value="CLOUD">Cloud (embed externo)</option>
              <option value="RTSP">RTSP (requiere Vision Agent)</option>
            </select>
          </div>

          {form.type === 'MJPEG' && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">URL del stream MJPEG</label>
              <input
                value={form.stream_url}
                onChange={e => setForm(f => ({ ...f, stream_url: e.target.value }))}
                placeholder="http://192.168.1.100/mjpeg"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {form.type === 'SNAPSHOT' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">URL del snapshot</label>
                <input
                  value={form.snapshot_url}
                  onChange={e => setForm(f => ({ ...f, snapshot_url: e.target.value }))}
                  placeholder="http://192.168.1.100/snapshot.jpg"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Refresco (segundos)</label>
                <input
                  type="number" min={1} max={60}
                  value={form.refresh_interval_secs}
                  onChange={e => setForm(f => ({ ...f, refresh_interval_secs: +e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {form.type === 'CLOUD' && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">URL del embed (iframe)</label>
              <input
                value={form.cloud_embed_url}
                onChange={e => setForm(f => ({ ...f, cloud_embed_url: e.target.value }))}
                placeholder="https://..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {form.type === 'RTSP' && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">URL RTSP (cifrada, para Vision Agent)</label>
              <input
                value={form.rtsp_url}
                onChange={e => setForm(f => ({ ...f, rtsp_url: e.target.value }))}
                placeholder="rtsp://usuario:pass@192.168.1.100:554/stream"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[10px] text-amber-600 mt-1">Requiere Vision Agent para reproducir</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving || !form.name}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors"
          >
            {saving ? 'Guardando...' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AddSpaceModal ────────────────────────────────────────────────────────────

function AddSpaceModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ name: '', type: 'OFFICE', floor: 1 });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      await api.post('/spaces', form);
      onAdded();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white">Nuevo espacio</h3>
        <div className="space-y-3">
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Ej. Recepción principal"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
          />
          <select
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            {Object.entries(SPACE_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 whitespace-nowrap">Piso</label>
            <input
              type="number" min={1} max={99}
              value={form.floor}
              onChange={e => setForm(f => ({ ...f, floor: +e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 transition-colors">
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving || !form.name}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors"
          >
            {saving ? 'Guardando...' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SpacesPage() {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingSpace, setAddingSpace] = useState(false);
  const [addingCameraTo, setAddingCameraTo] = useState<string | null>(null);

  const isAdmin = ['admin', 'owner', 'superadmin'].includes(user?.role ?? '');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Space[]>('/spaces');
      setSpaces(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteSpace = async (spaceId: string) => {
    if (!confirm('¿Eliminar este espacio y todas sus cámaras?')) return;
    await api.delete(`/spaces/${spaceId}`).catch(() => {});
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-white">Espacios y Cámaras</h1>
          <p className="text-xs text-gray-500 mt-1">Monitorea tu oficina en tiempo real</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setAddingSpace(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={15} /> Nuevo espacio
          </button>
        )}
      </div>

      {spaces.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="Sin espacios configurados"
          subtitle="Crea un espacio y agrega las cámaras de seguridad de tu empresa"
        />
      ) : (
        <div className="space-y-10">
          {spaces.map(space => (
            <section key={space.id}>
              {/* Space header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-white">{space.name}</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                    {SPACE_TYPE_LABELS[space.type] ?? space.type}
                  </span>
                  {space.floor > 1 && (
                    <span className="text-[10px] text-gray-600">Piso {space.floor}</span>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAddingCameraTo(space.id)}
                      className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <Plus size={13} /> Cámara
                    </button>
                    <button
                      onClick={() => deleteSpace(space.id)}
                      className="text-gray-700 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Camera grid */}
              {space.cameras.length === 0 ? (
                <div
                  className="border-2 border-dashed border-gray-800 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-800 transition-colors"
                  onClick={() => isAdmin && setAddingCameraTo(space.id)}
                >
                  <Camera size={20} className="text-gray-700 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Sin cámaras — {isAdmin ? 'agregar primera' : 'pendiente de configurar'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {space.cameras.map(cam => (
                    <CameraFeed key={cam.id} spaceId={space.id} camera={cam} />
                  ))}
                  {isAdmin && (
                    <button
                      onClick={() => setAddingCameraTo(space.id)}
                      className="aspect-video border-2 border-dashed border-gray-800 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-indigo-700 hover:bg-indigo-950/20 transition-all group"
                    >
                      <Plus size={18} className="text-gray-700 group-hover:text-indigo-500 transition-colors" />
                      <span className="text-xs text-gray-700 group-hover:text-indigo-400 transition-colors">Agregar cámara</span>
                    </button>
                  )}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {addingSpace && (
        <AddSpaceModal onClose={() => setAddingSpace(false)} onAdded={() => { setAddingSpace(false); load(); }} />
      )}
      {addingCameraTo && (
        <AddCameraModal
          spaceId={addingCameraTo}
          onClose={() => setAddingCameraTo(null)}
          onAdded={() => { setAddingCameraTo(null); load(); }}
        />
      )}
    </div>
  );
}
