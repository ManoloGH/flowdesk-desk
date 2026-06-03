'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Building2, Users, CheckCircle, XCircle, Clock,
  Plus, X, DollarSign, Brain, Loader2, MessageSquare,
  ChevronRight, Zap, ShieldCheck, Handshake, Briefcase,
} from 'lucide-react';

interface TenantRow {
  id: string; name: string; slug: string; plan: string; status: string;
  account_type: string; created_at: string; mrr: number;
  owner: { name: string; email: string } | null;
  secretary_config: { enabled: boolean; owner_phone: string } | null;
  billing_config: { enabled: boolean; rfc: string | null } | null;
  _count: { team_slots: number; brain_documents: number; agent_conversations: number };
}

interface Stats {
  total: number; active: number; mrr: number;
  plans: Record<string, number>;
  brain_docs: number; conversations: number;
}

const PLAN_BADGE: Record<string, string> = {
  enterprise:   'bg-violet-500/20 text-violet-300 border border-violet-500/30',
  professional: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  starter:      'bg-gray-700/50 text-gray-400 border border-gray-600/30',
  internal:     'bg-gray-800/80 text-gray-600 border border-gray-700/30',
};

const ACCOUNT_TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  SAAS_ACCOUNT:       { label: 'SaaS interno',       color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',  icon: <Zap className="w-3 h-3" /> },
  PARTNERSHIP:        { label: 'Partner MentorIA',   color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',  icon: <Handshake className="w-3 h-3" /> },
  CONSULTORIA_CLIENT: { label: 'Cliente consultoría',color: 'text-amber-400  bg-amber-500/10  border-amber-500/20',   icon: <Briefcase className="w-3 h-3" /> },
  DIRECT:             { label: 'Cliente FlowDesk',   color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',icon: <ShieldCheck className="w-3 h-3" /> },
  company:            { label: 'Empresa',             color: 'text-gray-400 bg-gray-500/10 border-gray-500/20',        icon: <Building2 className="w-3 h-3" /> },
};

function AccountBadge({ type }: { type: string }) {
  const cfg = ACCOUNT_TYPE_CONFIG[type] ?? ACCOUNT_TYPE_CONFIG.company;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${cfg.color}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = { active: 'bg-emerald-400', suspended: 'bg-red-400', pending: 'bg-amber-400' };
  return <span className={`w-1.5 h-1.5 rounded-full inline-block ${map[status] ?? 'bg-gray-600'}`} />;
}

function NewTenantModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', slug: '', plan: 'starter', owner_email: '', owner_name: '', tenant_type: 'NETWORK' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toSlug = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.owner_email || !form.owner_name) { setError('Completa todos los campos'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/platform/network', { ...form });
      onCreated(); onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la empresa');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0f1e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white">Nueva empresa</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          {[
            { key: 'name', label: 'Nombre', placeholder: 'Acme Corp', onChange: (v: string) => setForm(f => ({ ...f, name: v, slug: toSlug(v) })) },
            { key: 'slug', label: 'Slug (URL)', placeholder: 'acme-corp' },
            { key: 'owner_name', label: 'Nombre del owner', placeholder: 'Juan Pérez' },
            { key: 'owner_email', label: 'Email del owner', placeholder: 'juan@empresa.com' },
          ].map(({ key, label, placeholder, onChange }) => (
            <div key={key}>
              <label className="text-[11px] text-gray-500 block mb-1">{label}</label>
              <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                placeholder={placeholder} value={(form as any)[key]}
                onChange={e => onChange ? onChange(e.target.value) : setForm(f => ({ ...f, [key]: e.target.value }))} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-gray-500 block mb-1">Plan</label>
              <select className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-gray-500 block mb-1">Tipo</label>
              <select className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                value={form.tenant_type} onChange={e => setForm(f => ({ ...f, tenant_type: e.target.value }))}>
                <option value="NETWORK">Network</option>
                <option value="BRANCH">Branch</option>
              </select>
            </div>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {loading ? 'Creando...' : 'Crear empresa'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  async function load() {
    setLoading(true);
    const [t, s] = await Promise.all([
      api.get<TenantRow[]>('/platform/network').catch(() => [] as TenantRow[]),
      api.get<Stats>('/platform/stats').catch(() => null),
    ]);
    setTenants(Array.isArray(t) ? t : []);
    setStats(s);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const kpis = [
    { label: 'Empresas',       value: stats?.total ?? tenants.length,                icon: Building2,    color: 'text-violet-400' },
    { label: 'Activas',        value: stats?.active ?? tenants.filter(t => t.status === 'active').length, icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'MRR',            value: `$${(stats?.mrr ?? 0).toLocaleString()}`,       icon: DollarSign,   color: 'text-indigo-400' },
    { label: 'Usuarios',       value: tenants.reduce((s, t) => s + t._count.team_slots, 0), icon: Users, color: 'text-blue-400' },
    { label: 'Brain docs',     value: stats?.brain_docs ?? tenants.reduce((s, t) => s + t._count.brain_documents, 0), icon: Brain, color: 'text-amber-400' },
    { label: 'Conversaciones', value: stats?.conversations ?? 0,                       icon: MessageSquare, color: 'text-pink-400' },
  ];

  return (
    <div className="min-h-screen bg-[#050a14] p-6">
      {showModal && <NewTenantModal onClose={() => setShowModal(false)} onCreated={load} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white">FlowDesk</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase tracking-wider">
              Super Admin
            </span>
          </div>
          <p className="text-xs text-gray-500">Red global · {tenants.length} empresa{tenants.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Nueva empresa
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl bg-[#0a0f1e] border border-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-bold tracking-widest text-gray-600 uppercase">{label}</p>
              <Icon className={`w-3.5 h-3.5 ${color}`} />
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="rounded-xl bg-[#0a0f1e] border border-white/5 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-400">{loading ? 'Cargando...' : `${tenants.length} empresa${tenants.length !== 1 ? 's' : ''}`}</p>
          <div className="flex items-center gap-4 text-[10px] text-gray-600">
            {Object.entries(ACCOUNT_TYPE_CONFIG).slice(0, 4).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1">{v.icon}{v.label}</span>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /></div>
        ) : tenants.length === 0 ? (
          <div className="py-16 text-center"><Building2 className="w-8 h-8 text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500">Sin empresas — crea la primera.</p></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Empresa', 'Tipo', 'Owner', 'Plan', 'Estado', 'Slots', 'Brain', ''].map(h => (
                  <th key={h} className="text-left text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tenants.map(t => (
                <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  onClick={() => router.push(`/admin/clients/${t.id}`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StatusDot status={t.status} />
                      <div>
                        <p className="text-sm font-medium text-white">{t.name}</p>
                        <p className="text-[10px] text-gray-600">{t.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><AccountBadge type={t.account_type} /></td>
                  <td className="px-4 py-3">
                    {t.owner ? (
                      <div>
                        <p className="text-xs text-gray-300">{t.owner.name}</p>
                        <p className="text-[10px] text-gray-600 max-w-[140px] truncate">{t.owner.email}</p>
                      </div>
                    ) : <span className="text-xs text-gray-700">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${PLAN_BADGE[t.plan] ?? PLAN_BADGE.starter}`}>
                      {t.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-medium ${t.status === 'active' ? 'text-emerald-400' : t.status === 'suspended' ? 'text-red-400' : 'text-amber-400'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{t._count.team_slots}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{t._count.brain_documents}</td>
                  <td className="px-4 py-3">
                    <ChevronRight className="w-3.5 h-3.5 text-gray-700 group-hover:text-indigo-400 transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
