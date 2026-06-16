'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Building2, Users, CheckCircle,
  Plus, X, DollarSign, Brain, Loader2, MessageSquare,
  ChevronRight, ShieldCheck, Handshake, Briefcase,
  TrendingUp, Bot, AlertCircle, Calendar,
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
  nano:         'bg-gray-700/40 text-gray-500 border border-gray-600/30',
  small:        'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  medium:       'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  large:        'bg-violet-500/20 text-violet-300 border border-violet-500/30',
  enterprise:   'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  starter:      'bg-gray-700/40 text-gray-400 border border-gray-600/30',
  professional: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  internal:     'bg-gray-800/60 text-gray-600 border border-gray-700/30',
};

const PLAN_LABEL: Record<string, string> = {
  nano: '-10', small: '10–50', medium: '50–100', large: '+100', enterprise: '+1000',
};

const ACCOUNT_TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  HOLDING:            { label: 'Holding',           color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',    icon: <Building2 className="w-3 h-3" /> },
  PARTNERSHIP:        { label: 'Partner MentorIA',  color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',   icon: <Handshake className="w-3 h-3" /> },
  SAAS_ACCOUNT:       { label: 'Partner MentorIA',  color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',   icon: <Handshake className="w-3 h-3" /> },
  CONSULTORIA_CLIENT: { label: 'Cliente consultoría', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',    icon: <Briefcase className="w-3 h-3" /> },
  DIRECT:             { label: 'Cliente FlowDesk',  color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: <ShieldCheck className="w-3 h-3" /> },
  company:            { label: 'Holding',           color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',   icon: <Building2 className="w-3 h-3" /> },
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
  return <span className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${map[status] ?? 'bg-gray-600'}`} />;
}

function KpiCard({ label, value, sub, icon: Icon, color, accent }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; accent: string;
}) {
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-2 ${accent}`}>
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-bold tracking-widest text-gray-600 uppercase">{label}</p>
        <Icon className={`w-3.5 h-3.5 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-gray-600">{sub}</p>}
    </div>
  );
}

function NewTenantModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', slug: '', plan: 'small', account_type: 'DIRECT', owner_email: '', owner_name: '', tenant_type: 'NETWORK' });
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#040f20] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white">Nueva empresa</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          {[
            { key: 'name', label: 'Nombre de la empresa', placeholder: 'Acme Corp', onChange: (v: string) => setForm(f => ({ ...f, name: v, slug: toSlug(v) })) },
            { key: 'slug', label: 'Slug (URL)', placeholder: 'acme-corp' },
            { key: 'owner_name', label: 'Nombre del owner', placeholder: 'Juan Pérez' },
            { key: 'owner_email', label: 'Email del owner', placeholder: 'juan@empresa.com' },
          ].map(({ key, label, placeholder, onChange }) => (
            <div key={key}>
              <label className="text-[10px] text-gray-500 block mb-1">{label}</label>
              <input
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.06] transition-all"
                placeholder={placeholder} value={(form as Record<string, string>)[key]}
                onChange={e => onChange ? onChange(e.target.value) : setForm(f => ({ ...f, [key]: e.target.value }))} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Tamaño de empresa</label>
              <select className="w-full bg-[#040f20] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all"
                value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>
                <option value="nano">-10 empleados</option>
                <option value="small">10–50 empleados</option>
                <option value="medium">50–100 empleados</option>
                <option value="large">+100 empleados</option>
                <option value="enterprise">+1000 empleados</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Tipo de cuenta</label>
              <select className="w-full bg-[#040f20] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all"
                value={form.account_type} onChange={e => setForm(f => ({ ...f, account_type: e.target.value }))}>
                <option value="HOLDING">Holding</option>
                <option value="PARTNERSHIP">Partner MentorIA</option>
                <option value="DIRECT">Cliente FlowDesk</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Tipo de tenant</label>
            <select className="w-full bg-[#040f20] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all"
              value={form.tenant_type} onChange={e => setForm(f => ({ ...f, tenant_type: e.target.value }))}>
              <option value="NETWORK">Network</option>
              <option value="BRANCH">Branch</option>
            </select>
          </div>
          {error && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
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

  const totalUsers = tenants.reduce((s, t) => s + t._count.team_slots, 0);
  const activeCount = stats?.active ?? tenants.filter(t => t.status === 'active').length;
  const mrr = stats?.mrr ?? 0;
  const arr = mrr * 12;
  const newThisMonth = tenants.filter(t => {
    const d = new Date(t.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const suspended = tenants.filter(t => t.status === 'suspended').length;
  const whatsappActive = tenants.filter(t => t.secretary_config?.owner_phone).length;

  const row1 = [
    { label: 'MRR',             value: `$${mrr.toLocaleString()}`,       sub: 'Ingresos mensuales',    icon: DollarSign,   color: 'text-emerald-400', accent: 'bg-emerald-500/[0.04] border-emerald-500/10' },
    { label: 'ARR',             value: `$${arr.toLocaleString()}`,        sub: 'MRR × 12',              icon: TrendingUp,   color: 'text-blue-400',    accent: 'bg-blue-500/[0.04] border-blue-500/10' },
    { label: 'Empresas activas',value: activeCount,                       sub: `de ${stats?.total ?? tenants.length} totales`, icon: Building2, color: 'text-violet-400', accent: 'bg-violet-500/[0.04] border-violet-500/10' },
    { label: 'Nuevas este mes', value: newThisMonth,                      sub: 'Onboardings del mes',   icon: Calendar,     color: 'text-indigo-400',  accent: 'bg-indigo-500/[0.04] border-indigo-500/10' },
  ];

  const row2 = [
    { label: 'Usuarios',        value: totalUsers,                        sub: 'Slots activos',         icon: Users,        color: 'text-sky-400',     accent: 'bg-white/[0.02] border-white/[0.05]' },
    { label: 'Brain docs',      value: stats?.brain_docs ?? tenants.reduce((s, t) => s + t._count.brain_documents, 0), sub: 'Documentos cargados', icon: Brain, color: 'text-amber-400', accent: 'bg-white/[0.02] border-white/[0.05]' },
    { label: 'Conversaciones',  value: stats?.conversations ?? 0,         sub: 'Total histórico',       icon: MessageSquare,color: 'text-pink-400',    accent: 'bg-white/[0.02] border-white/[0.05]' },
    { label: 'WhatsApp activos',value: whatsappActive,                    sub: 'Atlas conectados',      icon: Bot,          color: 'text-green-400',   accent: 'bg-white/[0.02] border-white/[0.05]' },
    { label: 'Suspendidas',     value: suspended,                         sub: suspended > 0 ? 'Requieren atención' : 'Sin alertas', icon: AlertCircle, color: suspended > 0 ? 'text-red-400' : 'text-gray-600', accent: suspended > 0 ? 'bg-red-500/[0.04] border-red-500/10' : 'bg-white/[0.02] border-white/[0.05]' },
  ];

  return (
    <div className="min-h-full p-6">
      {showModal && <NewTenantModal onClose={() => setShowModal(false)} onCreated={load} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-white">Panel de Control</h1>
          <p className="text-[11px] text-gray-600 mt-0.5">
            Vista global de la plataforma · actualizado ahora
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Nueva empresa
        </button>
      </div>

      {/* KPI Row 1 — financieros */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {row1.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* KPI Row 2 — uso */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {row2.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Tabla de empresas */}
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-gray-600" />
            <p className="text-xs font-semibold text-gray-400">
              {loading ? 'Cargando...' : `${tenants.length} empresa${tenants.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-3 text-[9px] text-gray-700 font-semibold tracking-wider uppercase">
            {['HOLDING', 'PARTNERSHIP', 'DIRECT'].map(k => {
              const v = ACCOUNT_TYPE_CONFIG[k];
              if (!v) return null;
              return <span key={k} className="flex items-center gap-1">{v.icon} {v.label}</span>;
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="py-20 text-center">
            <Building2 className="w-8 h-8 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Sin empresas — crea la primera.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {['Empresa', 'Tipo', 'Owner', 'Tamaño', 'Estado', 'Usuarios', 'Brain', ''].map(h => (
                  <th key={h} className="text-left text-[9px] font-bold text-gray-700 uppercase tracking-widest px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {tenants.map(t => (
                <tr
                  key={t.id}
                  className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  onClick={() => router.push(`/admin/clients/${t.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StatusDot status={t.status} />
                      <div>
                        <p className="text-xs font-medium text-white">{t.name}</p>
                        <p className="text-[10px] text-gray-600">{t.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><AccountBadge type={t.account_type} /></td>
                  <td className="px-4 py-3">
                    {t.owner
                      ? <div>
                          <p className="text-xs text-gray-300">{t.owner.name}</p>
                          <p className="text-[10px] text-gray-600 max-w-[130px] truncate">{t.owner.email}</p>
                        </div>
                      : <span className="text-xs text-gray-700">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${PLAN_BADGE[t.plan] ?? PLAN_BADGE.nano}`}>
                      {PLAN_LABEL[t.plan] ?? t.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-medium ${t.status === 'active' ? 'text-emerald-400' : t.status === 'suspended' ? 'text-red-400' : 'text-amber-400'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{t._count.team_slots}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{t._count.brain_documents}</td>
                  <td className="px-4 py-3">
                    <ChevronRight className="w-3.5 h-3.5 text-gray-700 group-hover:text-violet-400 transition-colors" />
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
