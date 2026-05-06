'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Search, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  tier: string;
  created_at: string;
  team_slots: { id: string; name: string; email: string }[];
  _count: { team_slots: number; departments: number; contacts: number };
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400',
  suspended: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-gray-700 text-gray-500',
  pending: 'bg-yellow-500/20 text-yellow-400',
};

const PLAN_BADGE: Record<string, string> = {
  starter: 'bg-gray-700 text-gray-300',
  professional: 'bg-blue-500/20 text-blue-400',
  enterprise: 'bg-purple-500/20 text-purple-400',
};

export default function ClientsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', owner_name: '', owner_email: '', owner_password: '', plan: 'starter' });
  const [creating, setCreating] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await api.get('/tenants');
      setTenants(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  async function createClient() {
    setCreating(true);
    try {
      await api.post('/tenants', form);
      setShowNew(false);
      setForm({ name: '', slug: '', owner_name: '', owner_email: '', owner_password: '', plan: 'starter' });
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    await api.patch(`/tenants/${id}/status`, { status });
    await load();
  }

  const filtered = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.team_slots[0]?.email ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">MentorIA ERP</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Clientes FlowDesk</h1>
          <p className="text-gray-400 mt-1 text-sm">{tenants.length} empresas registradas</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={15} />
          Nuevo cliente
        </button>
      </div>

      {/* New client form */}
      {showNew && (
        <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-6 mb-6">
          <h3 className="font-medium text-white text-sm mb-4">Crear nuevo cliente</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'name', label: 'Nombre de empresa', placeholder: 'Acme Corp' },
              { key: 'slug', label: 'Slug (URL)', placeholder: 'acme-corp' },
              { key: 'owner_name', label: 'Nombre del owner', placeholder: 'Juan Pérez' },
              { key: 'owner_email', label: 'Email del owner', placeholder: 'juan@acme.com' },
              { key: 'owner_password', label: 'Contraseña temporal', placeholder: 'Mínimo 12 caracteres' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input
                  type={key === 'owner_password' ? 'password' : 'text'}
                  placeholder={placeholder}
                  value={(form as any)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Plan</label>
              <select
                value={form.plan}
                onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={createClient}
              disabled={creating}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {creating ? 'Creando...' : 'Crear cliente'}
            </button>
            <button
              onClick={() => setShowNew(false)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="relative mb-6">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar empresa u owner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => {
            const owner = t.team_slots[0];
            return (
              <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-white">{t.name.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-medium text-white text-sm">{t.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${PLAN_BADGE[t.plan] ?? 'bg-gray-700 text-gray-400'}`}>
                          {t.plan}
                        </span>
                      </div>
                      {owner && (
                        <p className="text-xs text-gray-500">{owner.name} · {owner.email}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                        <span>{t._count.team_slots} usuarios</span>
                        <span>·</span>
                        <span>{t._count.departments} depts</span>
                        <span>·</span>
                        <span>{t._count.contacts} contactos</span>
                        <span>·</span>
                        <span>Alta: {new Date(t.created_at).toLocaleDateString('es-MX')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 ${STATUS_BADGE[t.status] ?? 'bg-gray-700 text-gray-400'}`}>
                      {t.status === 'active' && <CheckCircle size={11} />}
                      {t.status === 'suspended' && <XCircle size={11} />}
                      {t.status === 'pending' && <Clock size={11} />}
                      <span className="capitalize">{t.status}</span>
                    </span>
                    <select
                      value={t.status}
                      onChange={(e) => updateStatus(t.id, e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="active">Activar</option>
                      <option value="suspended">Suspender</option>
                      <option value="cancelled">Cancelar</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">Sin clientes</div>
          )}
        </div>
      )}
    </div>
  );
}
