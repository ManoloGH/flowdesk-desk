'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { TrendingUp, CheckCircle, AlertCircle, CreditCard, RefreshCw, FileText, Loader2 } from 'lucide-react';

interface TenantBilling {
  id: string; name: string; plan: string; status: string;
  created_at: string; billing_email: string | null; mrr: number;
  billing_config: { enabled: boolean; rfc: string | null; facturapi_org_id: string | null; stripe_account_id: string | null } | null;
}

interface Overview {
  mrr: number; total: number; active: number; past_due: number; billing_configured: number;
  plans_breakdown: Record<string, number>;
  tenants: TenantBilling[];
}

const PLAN_COLORS: Record<string, string> = {
  enterprise: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  professional: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  starter: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  internal: 'text-gray-600 bg-gray-800 border-gray-700/20',
};

export default function BillingPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    const d = await api.get<Overview>('/billing/admin/overview').catch(() => null);
    setData(d);
    setLoading(false); setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#050a14] flex items-center justify-center"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div>;
  }

  const kpis = [
    { label: 'MRR Total', value: `$${(data?.mrr ?? 0).toLocaleString()}`, icon: TrendingUp, color: 'text-indigo-400', sub: 'USD / mes' },
    { label: 'Activos', value: data?.active ?? 0, icon: CheckCircle, color: 'text-emerald-400', sub: `de ${data?.total ?? 0} clientes` },
    { label: 'Fact. configurada', value: data?.billing_configured ?? 0, icon: FileText, color: 'text-amber-400', sub: `de ${data?.total ?? 0} clientes` },
    { label: 'Vencidos', value: data?.past_due ?? 0, icon: AlertCircle, color: 'text-red-400', sub: 'requieren atención' },
  ];

  return (
    <div className="min-h-screen bg-[#050a14] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">Facturación</h1>
          <p className="text-xs text-gray-500">MRR, planes y estado de facturación por cliente</p>
        </div>
        <button onClick={() => load(true)} disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0a0f1e] border border-white/5 text-gray-400 text-xs hover:text-white transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {kpis.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-[#0a0f1e] border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold tracking-widest text-gray-600 uppercase">{label}</p>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-[10px] text-gray-600 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Desglose de planes */}
      <div className="bg-[#0a0f1e] border border-white/5 rounded-xl p-5 mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Distribución de planes (activos)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { plan: 'starter',      price: 49,  users: 10 },
            { plan: 'professional', price: 149, users: 50 },
            { plan: 'enterprise',   price: 399, users: 999 },
            { plan: 'internal',     price: 0,   users: 999 },
          ].map(({ plan, price, users }) => (
            <div key={plan} className="bg-white/[0.02] rounded-xl p-4">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${PLAN_COLORS[plan]}`}>{plan}</span>
              <p className="text-2xl font-bold text-white mt-3">
                {data?.plans_breakdown?.[plan] ?? 0}
                <span className="text-sm font-normal text-gray-600 ml-1">clientes</span>
              </p>
              <p className="text-[10px] text-gray-600 mt-1">${price}/mes · {users === 999 ? '∞' : users} usuarios</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-[#0a0f1e] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5">
          <p className="text-xs font-semibold text-gray-400">{data?.total ?? 0} clientes</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Empresa', 'Plan', 'Estado', 'MRR', 'RFC', 'Facturapi', 'Stripe'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] text-gray-600 font-semibold uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(data?.tenants ?? []).map(t => (
                <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-white">{t.name}</p>
                    <p className="text-[10px] text-gray-600">{t.billing_email ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${PLAN_COLORS[t.plan] ?? PLAN_COLORS.starter}`}>{t.plan}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-medium ${t.status === 'active' ? 'text-emerald-400' : 'text-red-400'}`}>● {t.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-white font-medium">${(t.mrr || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{t.billing_config?.rfc ?? '—'}</td>
                  <td className="px-4 py-3">
                    {t.billing_config?.facturapi_org_id
                      ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Conectado</span>
                      : <span className="text-xs text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {t.billing_config?.stripe_account_id
                      ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Conectado</span>
                      : <span className="text-xs text-gray-600">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
