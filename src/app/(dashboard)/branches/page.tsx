'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import {
  Building2, Plus, Users, Bot, Wifi, BookUser,
  ClipboardList, ArrowRight, X, Loader2,
} from 'lucide-react';
import clsx from 'clsx';

interface Branch {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  status: string;
  created_at: string;
  _count: { team_slots: number; contacts: number; departments: number };
}

interface BranchStats {
  id: string;
  name: string;
  humans: number;
  agents: number;
  online: number;
  contacts: number;
  tasks: number;
}

export default function BranchesPage() {
  const { user, enterBranch } = useAuth();
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stats, setStats] = useState<Record<string, BranchStats>>({});
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', primary_color: '#4F46E5' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const isNetworkOrPlatform = user?.tenant_type === 'NETWORK' || user?.tenant_type === 'PLATFORM';

  useEffect(() => {
    if (!isNetworkOrPlatform) return;
    api.get<Branch[]>('/branches')
      .then(list => {
        setBranches(list);
        setLoading(false);
        // Cargar stats de cada sucursal en paralelo
        list.forEach(b => {
          api.get<BranchStats>(`/branches/${b.id}/stats`)
            .then(s => setStats(prev => ({ ...prev, [b.id]: s })))
            .catch(() => {});
        });
      })
      .catch(() => setLoading(false));
  }, [isNetworkOrPlatform]);

  const handleEnter = async (branch: Branch) => {
    setEntering(branch.id);
    try {
      const res = await api.post<{
        access_token: string;
        refresh_token: string;
        user: any;
        branch: { id: string; name: string };
      }>(`/branches/${branch.id}/enter`, {});

      enterBranch(branch.id, branch.name, res.access_token, res.refresh_token, res.user);
      router.push('/dashboard');
    } catch {
      setEntering(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      const newBranch = await api.post<Branch>('/branches', form);
      setBranches(prev => [...prev, newBranch]);
      setShowCreate(false);
      setForm({ name: '', slug: '', primary_color: '#4F46E5' });
    } catch (err: any) {
      setCreateError(err.message ?? 'Error al crear la sucursal');
    } finally {
      setCreating(false);
    }
  };

  const slugify = (name: string) =>
    name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40);

  if (!isNetworkOrPlatform) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-64 text-center">
        <Building2 size={32} className="text-gray-700 mb-3" />
        <p className="text-gray-400 text-sm">
          Tu cuenta no es de tipo red. Las sucursales solo están disponibles para empresas NETWORK o PLATFORM.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Sucursales</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Gestiona y accede a cada unidad de negocio de forma separada
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          Nueva sucursal
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center border border-dashed border-gray-700 rounded-xl">
          <Building2 size={32} className="text-gray-700 mb-3" />
          <p className="text-gray-400 text-sm mb-1">No hay sucursales aún</p>
          <p className="text-gray-600 text-xs mb-4">Crea tu primera sucursal para empezar</p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={14} />
            Crear sucursal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {branches.map(branch => {
            const s = stats[branch.id];
            const isEntering = entering === branch.id;
            return (
              <div
                key={branch.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col"
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: branch.primary_color + '20', border: `1px solid ${branch.primary_color}40` }}
                  >
                    <Building2 size={18} style={{ color: branch.primary_color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{branch.name}</p>
                    <p className="text-gray-500 text-xs">{branch.slug}</p>
                  </div>
                  <span className={clsx(
                    'text-[10px] px-2 py-0.5 rounded-full font-medium',
                    branch.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-gray-700 text-gray-500',
                  )}>
                    {branch.status === 'active' ? 'Activa' : branch.status}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { icon: Users, label: 'Humanos', value: s?.humans ?? branch._count.team_slots },
                    { icon: BookUser, label: 'Contactos', value: s?.contacts ?? branch._count.contacts },
                    { icon: ClipboardList, label: 'Tareas', value: s?.tasks ?? '—' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-gray-800/60 rounded-lg p-2 text-center">
                      <Icon size={12} className="text-gray-500 mx-auto mb-1" />
                      <p className="text-white text-sm font-bold">{value}</p>
                      <p className="text-gray-600 text-[10px]">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Online indicator */}
                {s && (
                  <div className="flex items-center gap-1.5 mb-4">
                    <Wifi size={11} className={s.online > 0 ? 'text-emerald-400' : 'text-gray-600'} />
                    <span className="text-xs text-gray-500">
                      {s.online > 0 ? `${s.online} online ahora` : 'Sin usuarios online'}
                    </span>
                    {s.agents > 0 && (
                      <>
                        <span className="text-gray-700">·</span>
                        <Bot size={11} className="text-violet-400" />
                        <span className="text-xs text-gray-500">{s.agents} agentes</span>
                      </>
                    )}
                  </div>
                )}

                {/* Enter button */}
                <button
                  onClick={() => handleEnter(branch)}
                  disabled={isEntering}
                  className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-400 hover:text-indigo-300 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEntering ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar a sucursal
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal crear sucursal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-semibold">Nueva sucursal</h2>
              <button
                onClick={() => { setShowCreate(false); setCreateError(''); }}
                className="text-gray-500 hover:text-gray-300"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({
                    ...f,
                    name: e.target.value,
                    slug: slugify(e.target.value),
                  }))}
                  placeholder="Ej. Inmobiliaria Norte"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Slug (URL)</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="inmobiliaria-norte"
                  required
                  pattern="[a-z0-9-]+"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-xs text-gray-600 mt-1">Solo letras minúsculas, números y guiones</p>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Color de marca</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                    className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700 cursor-pointer p-0.5"
                  />
                  <span className="text-sm text-gray-400 font-mono">{form.primary_color}</span>
                </div>
              </div>

              {createError && (
                <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {createError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setCreateError(''); }}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 size={14} className="animate-spin" /> : null}
                  {creating ? 'Creando...' : 'Crear sucursal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
