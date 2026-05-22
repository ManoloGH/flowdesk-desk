'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/api';
import {
  LayoutDashboard, Users, Map, Plug, BookUser, LogOut, ShieldCheck,
  Building2, CreditCard, ShieldAlert, Settings, Bell, X, CheckCheck, ExternalLink,
  ChevronLeft, Target, Cctv, Sparkles,
} from 'lucide-react';
import clsx from 'clsx';

const BASE_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/team', label: 'Equipo', icon: Users },
  { href: '/goals', label: 'Objetivos', icon: Target },
  { href: '/contacts', label: 'Contactos', icon: BookUser },
  { href: '/campus', label: 'Campus', icon: Map },
  { href: '/spaces', label: 'Espacios', icon: Cctv },
  { href: '/integrations', label: 'Integraciones', icon: Plug },
  { href: '/settings', label: 'Configuración', icon: Settings },
];

const NETWORK_NAV_EXTRA = [
  { href: '/branches', label: 'Sucursales', icon: Building2 },
];

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview', icon: ShieldCheck },
  { href: '/admin/clients', label: 'Clientes', icon: Building2 },
  { href: '/admin/billing', label: 'Facturación', icon: CreditCard },
  { href: '/admin/recovery', label: 'Recuperación', icon: ShieldAlert },
];

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  action_url: string | null;
  read: boolean;
  created_at: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const TYPE_DOT: Record<string, string> = {
  task_assigned: 'bg-indigo-500',
  task_due: 'bg-amber-500',
  meeting_started: 'bg-green-500',
  message_received: 'bg-blue-500',
  integration_connected: 'bg-purple-500',
  system: 'bg-gray-500',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, loadUser, logout, branchContext, exitBranch } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isNetworkOrPlatform = !branchContext && (user?.tenant_type === 'NETWORK' || user?.tenant_type === 'PLATFORM');
  const NAV = isNetworkOrPlatform ? [...BASE_NAV, ...NETWORK_NAV_EXTRA] : BASE_NAV;

  const [bellOpen, setBellOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadUser(); }, [loadUser]);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  // Polling unread count cada 30s
  const fetchCount = useCallback(async () => {
    try {
      const { count } = await api.get<{ count: number }>('/notifications/unread-count');
      setUnread(count);
    } catch {}
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchCount();
    const iv = setInterval(fetchCount, 30_000);
    return () => clearInterval(iv);
  }, [user, fetchCount]);

  // Cerrar el panel al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openBell = async () => {
    setBellOpen(v => !v);
    if (!bellOpen) {
      setNotifLoading(true);
      try {
        const { notifications: list } = await api.get<{ notifications: Notification[]; unread: number }>('/notifications');
        setNotifications(list);
      } catch {}
      setNotifLoading(false);
    }
  };

  const markRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`, {}).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all', {}).catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  const removeNotif = async (id: string, wasUnread: boolean) => {
    await api.delete(`/notifications/${id}`).catch(() => {});
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (wasUnread) setUnread(prev => Math.max(0, prev - 1));
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          {branchContext ? (
            /* Banner de contexto de sucursal */
            <div className="space-y-2">
              <button
                onClick={() => { exitBranch(); router.push('/branches'); }}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft size={13} />
                Salir de sucursal
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                  <Building2 size={13} className="text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-indigo-300 font-semibold truncate">{branchContext.branch_name}</p>
                  <p className="text-[10px] text-gray-600">Modo sucursal</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <span className="text-sm font-bold text-white">F</span>
              </div>
              <span className="font-semibold text-white text-sm">FlowDesk</span>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800',
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}

          {user.role === 'superadmin' && (
            <>
              <div className="pt-4 pb-1 px-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">MentorIA ERP</p>
              </div>
              {ADMIN_NAV.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    pathname === href
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800',
                  )}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Bottom: user info + bell + logout */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center justify-between px-3 py-2 mb-1">
            <div className="min-w-0">
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
              <p className="text-xs text-gray-600 capitalize">{user.role}</p>
            </div>

            {/* Bell */}
            <div ref={bellRef} className="relative">
              <button
                onClick={openBell}
                className="relative p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-700 transition-colors"
                title="Notificaciones"
              >
                <Bell size={15} />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {/* Panel de notificaciones */}
              {bellOpen && (
                <div className="absolute bottom-8 right-0 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                    <span className="text-sm font-semibold text-white">Notificaciones</span>
                    <div className="flex items-center gap-2">
                      {unread > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                          title="Marcar todas como leídas"
                        >
                          <CheckCheck size={12} /> Leer todas
                        </button>
                      )}
                      <button onClick={() => setBellOpen(false)} className="text-gray-500 hover:text-gray-300">
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifLoading ? (
                      <div className="flex items-center justify-center h-20">
                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="text-center py-10">
                        <Bell size={20} className="text-gray-700 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">Sin notificaciones</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={clsx(
                            'flex items-start gap-3 px-4 py-3 border-b border-gray-800/50 group hover:bg-gray-800/40 transition-colors',
                            !n.read && 'bg-indigo-500/5',
                          )}
                        >
                          <span className={clsx('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', TYPE_DOT[n.type] ?? 'bg-gray-500')} />
                          <div className="flex-1 min-w-0">
                            <p className={clsx('text-xs font-medium', n.read ? 'text-gray-400' : 'text-white')}>
                              {n.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.content}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] text-gray-600">{timeAgo(n.created_at)}</span>
                              {!n.read && (
                                <button onClick={() => markRead(n.id)} className="text-[10px] text-indigo-400 hover:text-indigo-300">
                                  Marcar leída
                                </button>
                              )}
                              {n.action_url && (
                                <Link
                                  href={n.action_url}
                                  onClick={() => { markRead(n.id); setBellOpen(false); }}
                                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                                >
                                  Ver <ExternalLink size={9} />
                                </Link>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeNotif(n.id, !n.read)}
                            className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-gray-400 transition-all flex-shrink-0"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors w-full"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Botón flotante — Claude Code */}
      <a
        href="https://claude.ai/code"
        target="_blank"
        rel="noopener noreferrer"
        title="Abrir Claude Code"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#D97706] hover:bg-[#B45309] text-white text-sm font-semibold shadow-lg shadow-amber-900/40 transition-all hover:scale-105 hover:shadow-xl hover:shadow-amber-900/50 group"
      >
        <Sparkles size={15} className="flex-shrink-0" />
        <span>Claude Code</span>
      </a>
    </div>
  );
}
