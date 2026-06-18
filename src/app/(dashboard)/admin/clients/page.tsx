'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Search, Building2, Loader2, ChevronRight, Zap, Handshake, Briefcase, ShieldCheck, Brain, Users, MessageSquare } from 'lucide-react';

interface TenantRow {
  id: string; name: string; slug: string; plan: string; status: string;
  account_type: string; created_at: string; mrr: number;
  web_builder_enabled: boolean;
  owner: { name: string; email: string } | null;
  secretary_config: { enabled: boolean } | null;
  billing_config: { enabled: boolean; rfc: string | null } | null;
  _count: { team_slots: number; brain_documents: number; agent_conversations: number };
}

const ACCOUNT_TYPES = [
  { key: 'all',         label: 'Todos' },
  { key: 'HOLDING',     label: 'Clientes MentorIA' },
  { key: 'PARTNERSHIP', label: 'Partner MentorIA' },
  { key: 'DIRECT',      label: 'Cliente FlowDesk' },
];

const STATUS_FILTERS = [
  { key: 'all',       label: 'Todos' },
  { key: 'active',    label: 'Activos' },
  { key: 'suspended', label: 'Suspendidos' },
];

const PLAN_COLORS: Record<string, string> = {
  nano: 'text-gray-500', small: 'text-sky-400', medium: 'text-indigo-400', large: 'text-violet-400', enterprise: 'text-amber-400',
  starter: 'text-gray-400', professional: 'text-blue-400', internal: 'text-gray-600',
};

const PLAN_LABEL: Record<string, string> = {
  nano: '-10', small: '10–50', medium: '50–100', large: '+100', enterprise: '+1000',
};

const TYPE_LABEL: Record<string, string> = {
  HOLDING:            'Clientes MentorIA',
  PARTNERSHIP:        'Partner MentorIA',
  SAAS_ACCOUNT:       'Partner MentorIA',
  CONSULTORIA_CLIENT: 'Clientes MentorIA',
  DIRECT:             'Cliente FlowDesk',
  company:            'Clientes MentorIA',
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  HOLDING:            <Building2 className="w-3.5 h-3.5 text-violet-400" />,
  PARTNERSHIP:        <Handshake className="w-3.5 h-3.5 text-purple-400" />,
  SAAS_ACCOUNT:       <Handshake className="w-3.5 h-3.5 text-purple-400" />,
  CONSULTORIA_CLIENT: <Briefcase className="w-3.5 h-3.5 text-amber-400" />,
  DIRECT:             <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
};

export default function ClientsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingWb, setTogglingWb] = useState<string | null>(null);

  const toggleWebBuilder = async (e: React.MouseEvent, t: TenantRow) => {
    e.stopPropagation();
    setTogglingWb(t.id);
    try {
      await api.patch(`/platform/network/${t.id}/web-builder`, { enabled: !t.web_builder_enabled });
      setTenants(prev => prev.map(r => r.id === t.id ? { ...r, web_builder_enabled: !r.web_builder_enabled } : r));
    } catch {}
    setTogglingWb(null);
  };
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    api.get<TenantRow[]>('/platform/network')
      .then(d => setTenants(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = tenants.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.name.toLowerCase().includes(q) || (t.owner?.email ?? '').toLowerCase().includes(q);
    const matchType = typeFilter === 'all' || t.account_type === typeFilter;
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <div className="h-screen bg-[#050a14] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-white">Clientes</h1>
            <p className="text-[11px] text-gray-600 mt-0.5">{tenants.length} empresa{tenants.length !== 1 ? 's' : ''} en la red</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2.5 px-6 py-3 border-b border-white/5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <input className="w-full bg-[#0a0f1e] border border-white/5 rounded-lg pl-9 pr-4 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            placeholder="Buscar empresa u owner..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {ACCOUNT_TYPES.map(({ key, label }) => (
            <button key={key}
              onClick={() => setTypeFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${typeFilter === key ? 'bg-indigo-600 text-white' : 'bg-[#0a0f1e] border border-white/5 text-gray-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map(({ key, label }) => (
            <button key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === key ? 'bg-emerald-700 text-white' : 'bg-[#0a0f1e] border border-white/5 text-gray-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List — scrolls internally */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center"><Building2 className="w-8 h-8 text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500">Sin resultados</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => (
            <div key={t.id}
              onClick={() => router.push(`/admin/clients/${t.id}`)}
              className="bg-[#0a0f1e] border border-white/5 hover:border-white/10 rounded-xl p-4 cursor-pointer transition-colors group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600/30 to-violet-600/30 border border-white/5 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-white">{t.name}</p>
                      <span className={`text-[10px] font-medium ${t.status === 'active' ? 'text-emerald-400' : 'text-red-400'}`}>●</span>
                    </div>
                    {t.owner && <p className="text-[11px] text-gray-500 truncate">{t.owner.name} · {t.owner.email}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="hidden sm:flex items-center gap-4 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{t._count.team_slots}</span>
                    <span className="flex items-center gap-1"><Brain className="w-3 h-3" />{t._count.brain_documents}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{t._count.agent_conversations}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {TYPE_ICON[t.account_type]}
                    <span className={`text-[11px] font-medium ${PLAN_COLORS[t.plan] ?? 'text-gray-400'}`}>{PLAN_LABEL[t.plan] ?? t.plan}</span>
                    {t.secretary_config?.enabled && <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/20">Atlas</span>}
                    {t.billing_config?.enabled && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">Factura</span>}
                    <button
                      onClick={e => toggleWebBuilder(e, t)}
                      disabled={togglingWb === t.id}
                      title={t.web_builder_enabled ? 'Desactivar Web Builder' : 'Activar Web Builder'}
                      className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                        t.web_builder_enabled
                          ? 'bg-violet-500/20 text-violet-300 border-violet-500/30 hover:bg-violet-500/30'
                          : 'bg-white/5 text-gray-600 border-white/5 hover:bg-white/10 hover:text-gray-400'
                      } ${togglingWb === t.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}>
                      {togglingWb === t.id ? '…' : '🌐 Web'}
                    </button>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
