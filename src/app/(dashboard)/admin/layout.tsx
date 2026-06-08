'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/store/auth';
import {
  LayoutDashboard, Building2, Users, Bot, Zap,
  CreditCard, Brain, AlertTriangle, Settings,
  LogOut, ChevronRight, Shield, Activity,
  Circle, ArrowLeft,
} from 'lucide-react';

function hasAdminAccess(user: { role?: string; platform_admin?: boolean } | null): boolean {
  if (!user) return false;
  return user.role === 'superadmin' || user.platform_admin === true;
}

const NAV_SECTIONS = [
  {
    label: 'PLATAFORMA',
    items: [
      { label: 'Dashboard',        href: '/admin',             icon: LayoutDashboard, exact: true },
      { label: 'Empresas',         href: '/admin/clients',     icon: Building2 },
      { label: 'Usuarios',         href: '/admin/users',       icon: Users,     soon: true },
    ],
  },
  {
    label: 'PRODUCTOS',
    items: [
      { label: 'Agentes',          href: '/admin/agents',      icon: Bot,           soon: true },
      { label: 'Automatizaciones', href: '/admin/automations', icon: Zap,           soon: true },
    ],
  },
  {
    label: 'NEGOCIO',
    items: [
      { label: 'Facturación',      href: '/admin/billing',     icon: CreditCard },
      { label: 'IA Analytics',     href: '/admin/ai-analytics',icon: Brain,         soon: true },
    ],
  },
  {
    label: 'SISTEMA',
    items: [
      { label: 'Incidentes',       href: '/admin/incidents',   icon: AlertTriangle, soon: true },
      { label: 'Configuración',    href: '/admin/settings',    icon: Settings,      soon: true },
    ],
  },
];

function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="w-52 h-full flex flex-col bg-[#040f20] border-r border-white/[0.05] shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-tight">FlowDesk</p>
            <p className="text-[9px] text-violet-400 font-bold tracking-widest uppercase leading-tight">Control Center</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto">
        {NAV_SECTIONS.map(({ label, items }) => (
          <div key={label}>
            <p className="px-3 mb-1 text-[9px] font-bold tracking-widest text-gray-700 uppercase">{label}</p>
            <div className="space-y-0.5">
              {items.map(({ label: itemLabel, href, icon: Icon, exact, soon }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={soon ? '#' : href}
                    onClick={e => soon && e.preventDefault()}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all group
                      ${active
                        ? 'bg-violet-600/20 text-violet-300'
                        : soon
                          ? 'text-gray-700 cursor-default'
                          : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-violet-400' : soon ? 'text-gray-700' : 'text-gray-600 group-hover:text-gray-400'}`} />
                      {itemLabel}
                    </div>
                    {soon
                      ? <span className="text-[8px] font-bold tracking-wider text-gray-700 bg-white/[0.03] px-1 rounded uppercase">soon</span>
                      : active
                        ? <ChevronRight className="w-3 h-3 text-violet-500" />
                        : null
                    }
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/[0.05] space-y-1">
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="w-6 h-6 rounded-full bg-violet-700/40 flex items-center justify-center shrink-0">
            <span className="text-[9px] font-bold text-violet-300">
              {user?.name?.[0]?.toUpperCase() ?? 'S'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-gray-300 truncate">{user?.name ?? 'Super Admin'}</p>
            <p className="text-[9px] text-gray-600 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] text-gray-600 hover:text-gray-400 hover:bg-white/[0.03] transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Salir al dashboard
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [time, setTime] = useState('');

  useEffect(() => {
    if (!loading && user && !hasAdminAccess(user)) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (loading || !user || !hasAdminAccess(user)) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: '#020810' }}>
      {/* Status bar */}
      <div className="h-9 flex items-center justify-between px-4 border-b border-white/[0.05] bg-[#040f20] shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Circle className="w-1.5 h-1.5 fill-emerald-400 text-emerald-400" />
            <span className="text-[10px] text-gray-500">API operando</span>
          </div>
          <div className="w-px h-3 bg-white/[0.08]" />
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-gray-700" />
            <span className="text-[10px] text-gray-600">FlowDesk Platform v2</span>
          </div>
        </div>
        <span className="text-[10px] text-gray-600 font-mono tabular-nums">{time}</span>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
