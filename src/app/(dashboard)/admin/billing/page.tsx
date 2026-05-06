'use client';
import { useEffect, useState } from 'react';
import { CreditCard, TrendingUp, AlertCircle, CheckCircle, XCircle, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { api } from '@/lib/api';

interface TenantBilling {
  id: string;
  name: string;
  plan: string;
  status: string;
  stripe_sub_status: string | null;
  current_period_end: string | null;
  billing_email: string | null;
  stripe_customer_id: string | null;
  created_at: string;
}

interface Overview {
  mrr: number;
  total: number;
  active: number;
  past_due: number;
  plans_breakdown: { starter: number; professional: number; enterprise: number };
  tenants: TenantBilling[];
}

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

const PLAN_COLORS: Record<string, string> = {
  starter: 'text-blue-400 bg-blue-500/10',
  professional: 'text-purple-400 bg-purple-500/10',
  enterprise: 'text-amber-400 bg-amber-500/10',
};

const SUB_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: 'Activo', color: 'text-green-400 bg-green-500/10', icon: <CheckCircle size={12} /> },
  trialing: { label: 'Trial', color: 'text-blue-400 bg-blue-500/10', icon: <Clock size={12} /> },
  past_due: { label: 'Pago vencido', color: 'text-red-400 bg-red-500/10', icon: <AlertCircle size={12} /> },
  canceled: { label: 'Cancelado', color: 'text-gray-400 bg-gray-500/10', icon: <XCircle size={12} /> },
  unpaid: { label: 'Sin pagar', color: 'text-red-400 bg-red-500/10', icon: <AlertCircle size={12} /> },
};

export default function BillingPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const overview = await api.get<Overview>('/billing/admin/overview');
      setData(overview);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">MentorIA ERP</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Facturación</h1>
          <p className="text-gray-400 mt-1 text-sm">MRR, planes activos y estado de pagos por cliente</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {data && (
        <>
          {/* Métricas top */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-purple-400" />
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">MRR</span>
              </div>
              <p className="text-3xl font-bold text-white">{fmt(data.mrr)}</p>
              <p className="text-xs text-gray-500 mt-1">Ingreso mensual recurrente</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={14} className="text-green-400" />
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Activos</span>
              </div>
              <p className="text-3xl font-bold text-white">{data.active}</p>
              <p className="text-xs text-gray-500 mt-1">de {data.total} clientes</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={14} className="text-red-400" />
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Vencidos</span>
              </div>
              <p className="text-3xl font-bold text-white">{data.past_due}</p>
              <p className="text-xs text-gray-500 mt-1">requieren atención</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={14} className="text-blue-400" />
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Planes</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Starter</span>
                  <span className="text-blue-400 font-medium">{data.plans_breakdown.starter}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Professional</span>
                  <span className="text-purple-400 font-medium">{data.plans_breakdown.professional}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Enterprise</span>
                  <span className="text-amber-400 font-medium">{data.plans_breakdown.enterprise}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alerta pago vencido */}
          {data.past_due > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-300">
                  {data.past_due} cliente{data.past_due > 1 ? 's' : ''} con pago vencido
                </p>
                <p className="text-xs text-red-500 mt-0.5">
                  Revisa el estado en Stripe y contacta al cliente. Si el pago no se resuelve, el acceso se suspenderá automáticamente.
                </p>
              </div>
            </div>
          )}

          {/* Tabla de clientes */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <h2 className="font-medium text-white text-sm">Clientes ({data.total})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium">Empresa</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">Plan</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">Suscripción</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">Próximo cobro</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">Email billing</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">Stripe</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tenants.map(t => {
                    const subCfg = t.stripe_sub_status ? SUB_STATUS_CONFIG[t.stripe_sub_status] : null;
                    const stripeUrl = t.stripe_customer_id
                      ? `https://dashboard.stripe.com/customers/${t.stripe_customer_id}`
                      : null;

                    return (
                      <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="px-5 py-3">
                          <div>
                            <p className="text-white font-medium">{t.name}</p>
                            <p className="text-xs text-gray-500">{new Date(t.created_at).getFullYear()}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx('text-xs px-2 py-1 rounded-full font-medium', PLAN_COLORS[t.plan] ?? 'text-gray-400 bg-gray-500/10')}>
                            {PLAN_LABELS[t.plan] ?? t.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {subCfg ? (
                            <span className={clsx('flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium w-fit', subCfg.color)}>
                              {subCfg.icon}
                              {subCfg.label}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-600">Sin suscripción</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {fmtDate(t.current_period_end)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {t.billing_email ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          {stripeUrl ? (
                            <a
                              href={stripeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                            >
                              Ver <ExternalLink size={10} />
                            </a>
                          ) : (
                            <span className="text-xs text-gray-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Definición de planes */}
          <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-medium text-white text-sm mb-4">Precios configurados</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { plan: 'starter', price: 49, users: 10, agents: 20 },
                { plan: 'professional', price: 149, users: 50, agents: 100 },
                { plan: 'enterprise', price: 399, users: 999, agents: 999 },
              ].map(({ plan, price, users, agents }) => (
                <div key={plan} className="bg-gray-800 rounded-lg p-4">
                  <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', PLAN_COLORS[plan])}>
                    {PLAN_LABELS[plan]}
                  </span>
                  <p className="text-2xl font-bold text-white mt-3">${price}<span className="text-sm font-normal text-gray-500">/mes</span></p>
                  <p className="text-xs text-gray-500 mt-2">
                    {users === 999 ? 'Usuarios ilimitados' : `${users} usuarios`} · {agents === 999 ? 'Agentes ilimitados' : `${agents} agentes`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
