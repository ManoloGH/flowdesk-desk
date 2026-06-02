'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Building2, Users, CheckCircle, XCircle, Clock,
  Plus, X, DollarSign, ExternalLink, Loader2
} from 'lucide-react';

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  tenant_type: string;
  created_at: string;
  team_slots: { id: string; name: string; email: string }[];
  _count: { team_slots: number; departments: number; contacts: number };
}

const PLAN_MRR: Record<string, number> = { enterprise: 5000, professional: 2000, starter: 500 };

const PLAN_BADGE: Record<string, string> = {
  enterprise:   'bg-violet-500/20 text-violet-300 border border-violet-500/30',
  professional: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  starter:      'bg-gray-700/50 text-gray-400 border border-gray-600/30',
  internal:     'bg-gray-800 text-gray-600 border border-gray-700/30',
};

const PLAN_LABEL: Record<string, string> = {
  enterprise: 'Enterprise', professional: 'Professional', starter: 'Starter', internal: 'Interno',
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
    active:    { icon: <CheckCircle className="w-3 h-3" />, label: 'Activo',     cls: 'text-emerald-400' },
    suspended: { icon: <XCircle className="w-3 h-3" />,    label: 'Suspendido', cls: 'text-red-400'     },
    pending:   { icon: <Clock className="w-3 h-3" />,       label: 'Pendiente',  cls: 'text-amber-400'  },
  };
  const s = map[status] ?? map.pending;
  return (
    <div className={`flex items-center gap-1.5 ${s.cls}`}>
      {s.icon}
      <span className="text-xs">{s.label}</span>
    </div>
  );
}

function NewTenantModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', slug: '', plan: 'starter', owner_email: '', owner_name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function toSlug(s: string) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function handleName(val: string) {
    setForm(f => ({ ...f, name: val, slug: toSlug(val) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.slug || !form.owner_email || !form.owner_name) {
      setError('Completa todos los campos');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/platform/network', {
        name: form.name,
        slug: form.slug,
        tenant_type: 'NETWORK',
        plan: form.plan,
        owner_email: form.owner_email,
        owner_name: form.owner_name,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear la empresa';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0f1e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white">Nueva empresa</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Nombre de la empresa</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              placeholder="Acme Corp"
              value={form.name}
              onChange={e => handleName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Slug (URL)</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              placeholder="acme-corp"
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Plan</label>
            <select
              className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              value={form.plan}
              onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
            >
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Nombre del owner</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              placeholder="Juan Pérez"
              value={form.owner_name}
              onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Email del owner</label>
            <input
              type="email"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              placeholder="juan@empresa.com"
              value={form.owner_email}
              onChange={e => setForm(f => ({ ...f, owner_email: e.target.value }))}
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {loading ? 'Creando...' : 'Crear empresa'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  function load() {
    setLoading(true);
    api.get<TenantRow[]>('/tenants')
      .then(d => setTenants(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const active = tenants.filter(t => t.status === 'active').length;
  const mrr    = tenants.reduce((s, t) => s + (PLAN_MRR[t.plan] ?? 0), 0);
  const slots  = tenants.reduce((s, t) => s + t._count.team_slots, 0);

  return (
    <div className="min-h-screen bg-[#050a14] p-6">
      {showModal && (
        <NewTenantModal onClose={() => setShowModal(false)} onCreated={load} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white">FlowDesk</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase tracking-wider">
              Platform Admin
            </span>
          </div>
          <p className="text-xs text-gray-500">Vista global de todos los FlowDesks activos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo cliente
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Clientes',       value: tenants.length,               icon: Building2,   color: 'text-violet-400' },
          { label: 'Activos',        value: active,                       icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'MRR estimado',   value: `$${mrr.toLocaleString()}`,   icon: DollarSign,  color: 'text-indigo-400' },
          { label: 'Usuarios total', value: slots,                        icon: Users,       color: 'text-blue-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl bg-[#0a0f1e] border border-white/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold tracking-widest text-gray-600 uppercase">{label}</p>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="rounded-xl bg-[#0a0f1e] border border-white/5 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5">
          <p className="text-xs font-semibold text-gray-400">
            {loading ? 'Cargando...' : `${tenants.length} empresa${tenants.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 className="w-8 h-8 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Sin clientes aún — crea el primero arriba.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Empresa', 'Owner', 'Plan', 'Estado', 'Equipo', 'Alta', ''].map(h => (
                  <th key={h} className="text-left text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tenants.map(t => {
                const owner = t.team_slots?.[0];
                return (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-5 py-3.5 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{t.name}</p>
                      <p className="text-[11px] text-gray-600 truncate">{t.slug}</p>
                    </td>
                    <td className="px-5 py-3.5 min-w-0">
                      {owner ? (
                        <>
                          <p className="text-xs text-gray-300 truncate">{owner.name}</p>
                          <p className="text-[11px] text-gray-600 truncate max-w-[160px]">{owner.email}</p>
                        </>
                      ) : <span className="text-xs text-gray-700">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PLAN_BADGE[t.plan] ?? PLAN_BADGE.starter}`}>
                        {PLAN_LABEL[t.plan] ?? t.plan}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{t._count.team_slots}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">
                      {new Date(t.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => window.location.href = `/admin/clients/${t.id}`}
                        className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Gestionar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
