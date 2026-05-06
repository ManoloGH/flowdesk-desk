'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import {
  CreditCard, CheckCircle, AlertCircle, Clock, XCircle,
  ExternalLink, Zap, ArrowUpRight, Building2,
} from 'lucide-react';
import clsx from 'clsx';

interface BillingStatus {
  name: string;
  plan: string;
  status: string;
  stripe_sub_status: string | null;
  current_period_end: string | null;
  billing_email: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

const PLANS = [
  {
    key: 'starter',
    label: 'Starter',
    price: 49,
    users: 10,
    agents: 20,
    color: 'border-blue-500/40 bg-blue-500/5',
    badge: 'text-blue-400 bg-blue-500/10',
    features: ['Campus virtual', 'CEO Agent básico', 'Integraciones GHL', 'Soporte por email'],
  },
  {
    key: 'professional',
    label: 'Professional',
    price: 149,
    users: 50,
    agents: 100,
    color: 'border-purple-500/40 bg-purple-500/5',
    badge: 'text-purple-400 bg-purple-500/10',
    features: ['Todo Starter', 'CEO Agent avanzado + memoria', 'Google & Microsoft', 'Soporte prioritario'],
  },
  {
    key: 'enterprise',
    label: 'Enterprise',
    price: 399,
    users: 999,
    agents: 999,
    color: 'border-amber-500/40 bg-amber-500/5',
    badge: 'text-amber-400 bg-amber-500/10',
    features: ['Todo Professional', 'Usuarios y agentes ilimitados', 'SLA garantizado', 'Onboarding dedicado'],
  },
];

const SUB_STATUS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: 'Activo', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: <CheckCircle size={13} /> },
  trialing: { label: 'Período de prueba', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', icon: <Clock size={13} /> },
  past_due: { label: 'Pago vencido', color: 'text-red-400 bg-red-500/10 border-red-500/30', icon: <AlertCircle size={13} /> },
  canceled: { label: 'Cancelado', color: 'text-gray-400 bg-gray-500/10 border-gray-500/30', icon: <XCircle size={13} /> },
  unpaid: { label: 'Sin pagar', color: 'text-red-400 bg-red-500/10 border-red-500/30', icon: <AlertCircle size={13} /> },
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    api.get<BillingStatus>('/billing/status').then(setBilling).finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (plan: string) => {
    setCheckoutLoading(plan);
    try {
      const { url } = await api.post<{ url: string }>('/billing/checkout', { plan });
      if (url) window.location.href = url;
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { url } = await api.post<{ url: string }>('/billing/portal', {});
      if (url) window.open(url, '_blank');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setPortalLoading(false);
    }
  };

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }) : null;

  const currentPlan = PLANS.find(p => p.key === billing?.plan);
  const subStatus = billing?.stripe_sub_status ? SUB_STATUS[billing.stripe_sub_status] : null;

  const canManage = user?.role === 'owner' || user?.role === 'admin';

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <p className="text-gray-400 mt-1 text-sm">Plan, facturación y datos de tu empresa</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Estado actual */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <Building2 size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">{billing?.name}</h2>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              {subStatus && (
                <span className={clsx('flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium', subStatus.color)}>
                  {subStatus.icon}
                  {subStatus.label}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Plan actual</p>
                <p className="font-semibold text-white">{currentPlan?.label ?? billing?.plan ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Precio</p>
                <p className="font-semibold text-white">
                  {currentPlan ? `$${currentPlan.price}/mes` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Próximo cobro</p>
                <p className="font-semibold text-white">{fmtDate(billing?.current_period_end ?? null) ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Email de facturación</p>
                <p className="font-semibold text-white text-sm truncate">{billing?.billing_email ?? '—'}</p>
              </div>
            </div>

            {/* Alerta pago vencido */}
            {billing?.stripe_sub_status === 'past_due' && (
              <div className="mt-4 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-300">
                  Tu pago está vencido. Actualiza tu método de pago para evitar la suspensión del servicio.
                </p>
              </div>
            )}

            {/* Botón portal Stripe */}
            {billing?.stripe_subscription_id && canManage && (
              <div className="mt-5 pt-5 border-t border-gray-800">
                <button
                  onClick={handlePortal}
                  disabled={portalLoading}
                  className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50"
                >
                  <CreditCard size={14} />
                  {portalLoading ? 'Abriendo...' : 'Gestionar suscripción en Stripe'}
                  <ExternalLink size={12} className="text-gray-500" />
                </button>
              </div>
            )}
          </div>

          {/* Planes disponibles */}
          {canManage && (
            <div>
              <h2 className="font-medium text-white text-sm mb-4 flex items-center gap-2">
                <Zap size={14} className="text-indigo-400" />
                {billing?.stripe_subscription_id ? 'Cambiar de plan' : 'Suscribirse'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PLANS.map(plan => {
                  const isCurrent = billing?.plan === plan.key;
                  const isActive = isCurrent && (billing?.stripe_sub_status === 'active' || billing?.stripe_sub_status === 'trialing');
                  const isLoading = checkoutLoading === plan.key;

                  return (
                    <div
                      key={plan.key}
                      className={clsx(
                        'rounded-xl border p-5 transition-all',
                        isCurrent ? plan.color : 'border-gray-800 bg-gray-900',
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', plan.badge)}>
                          {plan.label}
                        </span>
                        {isActive && (
                          <span className="text-xs text-emerald-400 flex items-center gap-1">
                            <CheckCircle size={11} /> Activo
                          </span>
                        )}
                      </div>

                      <p className="text-2xl font-bold text-white mt-3">
                        ${plan.price}
                        <span className="text-sm font-normal text-gray-500">/mes</span>
                      </p>

                      <p className="text-xs text-gray-500 mt-1 mb-4">
                        {plan.users === 999 ? 'Usuarios ilimitados' : `${plan.users} usuarios`}
                        {' · '}
                        {plan.agents === 999 ? 'Agentes ilimitados' : `${plan.agents} agentes`}
                      </p>

                      <ul className="space-y-1.5 mb-5">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                            <span className={clsx('w-1 h-1 rounded-full flex-shrink-0', plan.badge.split(' ')[0].replace('text', 'bg'))} />
                            {f}
                          </li>
                        ))}
                      </ul>

                      {!isActive && (
                        <button
                          onClick={() => handleUpgrade(plan.key)}
                          disabled={!!checkoutLoading}
                          className={clsx(
                            'w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50',
                            isCurrent && !isActive
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-indigo-600 text-white hover:bg-indigo-500',
                          )}
                        >
                          {isLoading ? 'Redirigiendo...' : (
                            <>
                              {billing?.stripe_subscription_id ? 'Cambiar a este plan' : 'Contratar'}
                              <ArrowUpRight size={12} />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-600 mt-3">
                El pago se procesa de forma segura a través de Stripe. Puedes cambiar o cancelar tu plan en cualquier momento.
              </p>
            </div>
          )}

          {!canManage && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
              <p className="text-sm text-gray-500">Solo el owner puede gestionar el plan y la facturación.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
