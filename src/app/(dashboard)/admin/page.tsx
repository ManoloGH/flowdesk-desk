'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Building2, Users, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

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

export default function AdminOverviewPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tenants').then((data) => {
      setTenants(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const active = tenants.filter((t) => t.status === 'active').length;
  const suspended = tenants.filter((t) => t.status === 'suspended').length;
  const pending = tenants.filter((t) => t.status === 'pending').length;
  const totalSlots = tenants.reduce((acc, t) => acc + t._count.team_slots, 0);

  const PLAN_COLOR: Record<string, string> = {
    starter: 'bg-gray-700 text-gray-300',
    professional: 'bg-blue-500/20 text-blue-400',
    enterprise: 'bg-purple-500/20 text-purple-400',
    internal: 'bg-gray-800 text-gray-500',
  };

  const STATUS_ICON: Record<string, React.ReactNode> = {
    active: <CheckCircle size={14} className="text-emerald-400" />,
    suspended: <XCircle size={14} className="text-red-400" />,
    pending: <Clock size={14} className="text-yellow-400" />,
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">MentorIA ERP</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Overview del negocio</h1>
        <p className="text-gray-400 mt-1 text-sm">FlowDesk — vista general de todos los clientes</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Clientes totales', value: tenants.length, icon: Building2, color: 'bg-purple-600' },
          { label: 'Activos', value: active, icon: CheckCircle, color: 'bg-emerald-600' },
          { label: 'Suspendidos', value: suspended, icon: XCircle, color: 'bg-red-600' },
          { label: 'Usuarios totales', value: totalSlots, icon: Users, color: 'bg-indigo-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">{label}</span>
              <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
                <Icon size={15} className="text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
          <TrendingUp size={15} className="text-purple-400" />
          <h2 className="font-medium text-white text-sm">Clientes FlowDesk</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              {['Empresa', 'Owner', 'Plan', 'Estado', 'Equipo', 'Contactos', 'Alta'].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {tenants.map((t) => {
              const owner = t.team_slots[0];
              return (
                <tr key={t.id} className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/admin/clients/${t.id}`}>
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-white">{t.name}</p>
                      <p className="text-xs text-gray-600">{t.slug}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {owner ? (
                      <div>
                        <p className="text-xs text-gray-300">{owner.name}</p>
                        <p className="text-xs text-gray-600">{owner.email}</p>
                      </div>
                    ) : <span className="text-xs text-gray-600">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${PLAN_COLOR[t.plan] ?? 'bg-gray-700 text-gray-400'}`}>
                      {t.plan}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {STATUS_ICON[t.status] ?? <Clock size={14} className="text-gray-500" />}
                      <span className="text-xs text-gray-400 capitalize">{t.status}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-400">{t._count.team_slots}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-400">{t._count.contacts}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">
                    {new Date(t.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                </tr>
              );
            })}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-gray-500 text-sm">Sin clientes aún</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
