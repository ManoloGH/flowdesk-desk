'use client';
import { useEffect, useRef, useState, useCallback, CSSProperties } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/store/auth';
import { api, setActiveTenantId, getActiveTenantId } from '@/lib/api';

/* ── Brand types ── */
interface BrandColors { primary: string; secondary: string; tertiary: string; }
interface ModuleCfg { key: string; label: string; enabled: boolean; }
interface BrandConfig { logo_url: string | null; tenant_name: string | null; colors: BrandColors; configured: boolean; modules_config: ModuleCfg[] | null; }

const DEFAULT_BRAND: BrandConfig = {
  logo_url: null,
  tenant_name: null,
  colors: { primary: '#1DBDF0', secondary: '#2566E8', tertiary: '#E91E7A' },
  configured: false,
  modules_config: null,
};
import {
  Users, LogOut, ShieldCheck, Layers,
  Building2, CreditCard, ShieldAlert, Settings, Bell, X, CheckCheck,
  ExternalLink, ChevronLeft, Zap, ChevronDown, Brain, ListChecks, GitBranch,
  Workflow, BarChart2,
} from 'lucide-react';

/* ── Navigation ── */
type NavItem = { href: string; label: string; icon: React.ElementType };

const CORE_NAV: NavItem[] = [
  { href: '/focusmode', label: 'Focus Mode', icon: Zap },
  { href: '/metrics',   label: 'Dashboard',  icon: BarChart2 },
  { href: '/team',      label: 'Equipo',     icon: Users },
];

const MAIN_NAV: NavItem[] = [
  { href: '/mentoria',  label: 'CRM',                 icon: Workflow },
  { href: '/erp',       label: 'ERP',                  icon: GitBranch },
  { href: '/brain',     label: 'Base de conocimiento', icon: Brain },
  { href: '/recursos',  label: 'Recursos',             icon: Layers },
];

const RECURSOS_BASE: NavItem[] = [];

const BOTTOM_NAV: NavItem[] = [
  { href: '/settings',     label: 'Configuración',     icon: Settings },
];

const ADMIN_NAV: NavItem[] = [
  { href: '/admin',              label: 'Overview',         icon: ShieldCheck },
  { href: '/admin/clients',      label: 'Clientes',         icon: Building2 },
  { href: '/admin/billing',      label: 'Facturación',      icon: CreditCard },
  { href: '/admin/recovery',     label: 'Recuperación',     icon: ShieldAlert },
  { href: '/implementaciones',   label: 'Implementaciones', icon: ListChecks },
];

interface Notification {
  id: string; type: string; title: string; content: string;
  action_url: string | null; read: boolean; created_at: string;
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

const NOTIF_COLOR: Record<string, string> = {
  task_assigned:       'var(--fd-purple)',
  task_due:            'var(--fd-orange)',
  meeting_started:     'var(--fd-green)',
  message_received:    'var(--fd-blue)',
  integration_connected:'var(--fd-cyan)',
  system:              'var(--text-3)',
};

const DAYS   = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'];
const MONTHS = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

function fmtDate(d: Date) {
  return `${DAYS[d.getDay()]} · ${d.getDate()} ${MONTHS[d.getMonth()]} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

/* ── Tiny hover helper (avoids inline-onMouseEnter noise) ── */
function useHover(
  base: CSSProperties,
  hovered: CSSProperties,
): [CSSProperties, { onMouseEnter: () => void; onMouseLeave: () => void }] {
  const [over, setOver] = useState(false);
  return [
    over ? { ...base, ...hovered } : base,
    { onMouseEnter: () => setOver(true), onMouseLeave: () => setOver(false) },
  ];
}

/* ── NavItem ── */
function NavItem({
  href, label, icon: Icon, active, onClick, admin = false,
}: {
  href: string; label: string; icon: React.ElementType;
  active: boolean; onClick: () => void; admin?: boolean;
}) {
  const [style, hover] = useHover(
    {
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', borderRadius: 9, marginBottom: 2,
      color: active ? 'var(--text)' : 'var(--text-2)',
      background: active
        ? admin ? 'rgba(155,89,246,0.12)' : 'var(--surface-2)'
        : 'transparent',
      textDecoration: 'none',
      fontFamily: "'Inter Tight', sans-serif", fontSize: 13,
      fontWeight: 500, letterSpacing: '-0.01em',
      transition: 'background 0.15s, color 0.15s',
      position: 'relative',
    },
    active ? {} : { background: 'var(--surface-2)', color: 'var(--text)' },
  );

  return (
    <Link href={href} onClick={onClick} style={style as React.CSSProperties} {...hover}>
      {active && (
        <div style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          width: 3, height: 18, borderRadius: '0 3px 3px 0',
          background: admin
            ? 'linear-gradient(180deg, var(--fd-purple), var(--fd-magenta))'
            : 'linear-gradient(180deg, var(--fd-cyan), var(--fd-blue))',
        }} />
      )}
      <div style={{
        width: 26, height: 26, borderRadius: 7, flexShrink: 0,
        background: active
          ? admin
            ? 'rgba(155,89,246,0.15)'
            : 'linear-gradient(135deg, rgba(29,189,240,0.2), rgba(37,102,232,0.1))'
          : 'var(--surface-3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: active ? (admin ? 'var(--fd-purple)' : 'var(--fd-cyan)') : 'var(--text-3)',
      }}>
        <Icon size={13} />
      </div>
      {label}
    </Link>
  );
}

/* ════════════════════════════════════════════════════════════════ */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, loadUser, logout, branchContext, exitBranch, impersonating, exitCompany } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  const devMockUser = process.env.NODE_ENV === 'development' ? {
    slot_id: 'dev', tenant_id: 'dev', role: 'superadmin',
    type: 'HUMAN', email: 'dev@flowdesk.mx', name: 'Dev Preview',
    tenant_type: 'PLATFORM', platform_admin: true,
  } : null;
  const effectiveUser = user ?? devMockUser;

  const isNetPlatform = !branchContext &&
    (effectiveUser?.tenant_type === 'NETWORK' || effectiveUser?.tenant_type === 'PLATFORM');

  const [brand,      setBrand]      = useState<BrandConfig>(DEFAULT_BRAND);
  const [tenantFeatures, setTenantFeatures] = useState<{ communications_enabled: boolean }>({ communications_enabled: false });

  type NavGroups = { core: NavItem[]; main: NavItem[]; recursos: NavItem[]; bottom: NavItem[] };

  const buildNav = (): NavGroups => {
    const mods = brand.modules_config;
    if (!mods || mods.length === 0) {
      return { core: [...CORE_NAV], main: [...MAIN_NAV], recursos: [...RECURSOS_BASE], bottom: BOTTOM_NAV };
    }
    // modules_config definida → filtrar TODO el nav por las keys habilitadas
    const enabledKeys = new Set(mods.filter((m) => m.enabled).map((m) => m.key));
    const filterByKey = (items: NavItem[]) =>
      items.filter((n) => enabledKeys.has(n.href.replace(/^\//, '')));

    return {
      core:     filterByKey(CORE_NAV),
      main:     filterByKey(MAIN_NAV),
      recursos: filterByKey(RECURSOS_BASE),
      bottom:   BOTTOM_NAV,
    };
  };

  const NAV = buildNav();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bellOpen,   setBellOpen]   = useState(false);
  const [unread,     setUnread]     = useState(0);
  const [notifs,     setNotifs]     = useState<Notification[]>([]);
  const [notifLoad,  setNotifLoad]  = useState(false);
  const [now,        setNow]        = useState(new Date());
  const bellRef = useRef<HTMLDivElement>(null);

  // Tenant switcher para superadmin/platform_admin
  interface TenantOption { id: string; name: string; plan: string; slug: string; }
  const [tenants,           setTenants]           = useState<TenantOption[]>([]);
  const [activeTenantId,    setActiveTenantIdState] = useState<string | null>(null);
  const [tenantSwitcherOpen, setTenantSwitcherOpen] = useState(false);
  const tenantSwitcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveTenantIdState(getActiveTenantId());
  }, []);

  useEffect(() => {
    if (!effectiveUser?.platform_admin) return;
    api.get<any>('/platform/network').then(data => {
      const list = Array.isArray(data) ? data : (data?.tenants ?? []);
      setTenants(list.filter((t: any) => t.id !== effectiveUser.tenant_id).map((t: any) => ({
        id: t.id, name: t.name, plan: t.plan ?? '', slug: t.slug ?? '',
      })));
    }).catch(() => {});
  }, [effectiveUser?.platform_admin, effectiveUser?.tenant_id]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tenantSwitcherRef.current && !tenantSwitcherRef.current.contains(e.target as Node))
        setTenantSwitcherOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleSelectTenant(id: string | null) {
    setActiveTenantId(id);
    setActiveTenantIdState(id);
    setTenantSwitcherOpen(false);
    window.location.reload();
  }

  useEffect(() => { loadUser(); }, [loadUser]);
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);
  useEffect(() => { const iv = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(iv); }, []);

  /* ── Brand: fetch + apply CSS vars ── */
  useEffect(() => {
    if (!user) return;
    api.get<BrandConfig>('/tenants/mine/brand')
      .then(data => {
        setBrand(data);
        if (data.configured) {
          const root = document.documentElement;
          root.style.setProperty('--fd-cyan',    data.colors.primary);
          root.style.setProperty('--fd-blue',    data.colors.secondary);
          root.style.setProperty('--fd-magenta', data.colors.tertiary);
        }
      })
      .catch(() => { /* usa defaults */ });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    api.get<{ communications_enabled: boolean }>('/tenants/mine/features')
      .then(data => setTenantFeatures(data))
      .catch(() => { /* endpoint not yet implemented */ });
  }, [user]);

  const fetchCount = useCallback(async () => {
    try { const { count } = await api.get<{ count: number }>('/notifications/unread-count'); setUnread(count); } catch {}
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchCount();
    const iv = setInterval(fetchCount, 30_000);
    return () => clearInterval(iv);
  }, [user, fetchCount]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setDrawerOpen(false); setBellOpen(false); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const openBell = async () => {
    const opening = !bellOpen;
    setBellOpen(v => !v);
    if (opening) {
      setNotifLoad(true);
      try {
        const { notifications: list } = await api.get<{ notifications: Notification[]; unread: number }>('/notifications');
        setNotifs(list);
      } catch {}
      setNotifLoad(false);
    }
  };

  const markRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`, {}).catch(() => {});
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all', {}).catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  const removeNotif = async (id: string, wasUnread: boolean) => {
    await api.delete(`/notifications/${id}`).catch(() => {});
    setNotifs(prev => prev.filter(n => n.id !== id));
    if (wasUnread) setUnread(prev => Math.max(0, prev - 1));
  };

  const initials = effectiveUser?.name
    ? effectiveUser.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : effectiveUser?.email?.slice(0, 2)?.toUpperCase() ?? 'U';

  /* Admin routes — el admin layout cubre todo con fixed inset-0, no necesita este wrapper */
  if (pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  /* Loading screen */
  if (loading || !effectiveUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid var(--fd-cyan)', borderTopColor: 'transparent' }} className="fd-spin" />
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

      {/* ════ IMPERSONATION BANNER ════ */}
      {impersonating && (
        <div style={{
          flexShrink: 0, height: 36,
          background: 'linear-gradient(90deg, #f59e0b, #d97706)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          fontFamily: "'Inter Tight', sans-serif", fontSize: 12, fontWeight: 600,
          color: '#1c1000', zIndex: 100,
        }}>
          <span>⚡ Estás dentro de: <strong>{impersonating}</strong></span>
          <button
            onClick={() => { exitCompany(); router.push('/admin/clients'); }}
            style={{
              background: 'rgba(0,0,0,0.15)', border: 'none', borderRadius: 6,
              padding: '3px 10px', cursor: 'pointer', fontWeight: 700,
              fontSize: 11, color: '#1c1000',
            }}
          >
            Salir
          </button>
        </div>
      )}

      {/* ════ TOP BAR ════ */}
      <header style={{
        height: 64, flexShrink: 0,
        display: 'grid', gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center', padding: '0 24px',
        background: 'color-mix(in srgb, var(--bg) 85%, transparent)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--line)',
        position: 'relative', zIndex: 50,
      }}>

        {/* Brand button → opens drawer */}
        <BrandButton open={drawerOpen} onClick={() => setDrawerOpen(v => !v)} brand={brand} />

        {/* Center — empty */}
        <div />

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>

          {/* Tenant Switcher — solo para platform_admin */}
          {effectiveUser?.platform_admin && (
            <div ref={tenantSwitcherRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setTenantSwitcherOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 10px', borderRadius: 8, border: '1px solid var(--line)',
                  background: activeTenantId ? '#6c4de618' : 'var(--surface)',
                  color: activeTenantId ? '#6c4de6' : 'var(--text-2)',
                  cursor: 'pointer', fontSize: 12, fontWeight: activeTenantId ? 700 : 400,
                }}
              >
                <Building2 size={12} />
                {activeTenantId
                  ? (tenants.find(t => t.id === activeTenantId)?.name ?? 'Cliente')
                  : 'Propio'}
                <ChevronDown size={11} />
              </button>
              {tenantSwitcherOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 6,
                  minWidth: 200, background: 'var(--surface)', border: '1px solid var(--line)',
                  borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  zIndex: 200, overflow: 'hidden',
                }}>
                  <div style={{ padding: '6px 4px' }}>
                    <button
                      onClick={() => handleSelectTenant(null)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '8px 12px', borderRadius: 7, border: 'none',
                        background: !activeTenantId ? 'var(--surface-2)' : 'transparent',
                        color: !activeTenantId ? '#6c4de6' : 'var(--text-2)',
                        cursor: 'pointer', fontSize: 12, fontWeight: !activeTenantId ? 700 : 400,
                      }}
                    >
                      ⚡ Mi cuenta (FlowDesk)
                    </button>
                    {tenants.map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleSelectTenant(t.id)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '8px 12px', borderRadius: 7, border: 'none',
                          background: activeTenantId === t.id ? 'var(--surface-2)' : 'transparent',
                          color: activeTenantId === t.id ? '#6c4de6' : 'var(--text)',
                          cursor: 'pointer', fontSize: 12, fontWeight: activeTenantId === t.id ? 700 : 400,
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; }}
                        onMouseLeave={e => { if (activeTenantId !== t.id) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        🏢 {t.name}
                        <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--text-3)' }}>{t.plan}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Campus link */}
          <CampusLink active={pathname === '/campus' || pathname.startsWith('/campus')} />

          {/* Bell */}
          <div ref={bellRef} style={{ position: 'relative' }}>
            <BellButton unread={unread} open={bellOpen} onClick={openBell} />

            {bellOpen && (
              <NotifPanel
                loading={notifLoad}
                notifs={notifs}
                unread={unread}
                onMarkAll={markAllRead}
                onClose={() => setBellOpen(false)}
                onMarkRead={markRead}
                onRemove={removeNotif}
                pathname={pathname}
                closeBell={() => setBellOpen(false)}
              />
            )}
          </div>

          {/* Date */}
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.08em',
          }}>
            {fmtDate(now)}
          </span>

          {/* Avatar */}
          <div
            title={`${effectiveUser.email} · ${effectiveUser.role} · Click para cerrar sesión`}
            onClick={logout}
            style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--fd-cyan), var(--fd-magenta))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Inter Tight', sans-serif", fontWeight: 700,
              fontSize: 12, color: 'white', cursor: 'pointer',
            }}
          >
            {initials}
          </div>
        </div>
      </header>

      {/* ════ SIDEBAR DRAWER ════ */}

      {/* Overlay */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
          }}
        />
      )}

      {/* Panel */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 280, zIndex: 50,
        background: 'var(--surface)',
        borderRight: '1px solid var(--line-strong)',
        display: 'flex', flexDirection: 'column',
        transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.26s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '20px 0 60px rgba(0,0,0,0.45)',
      }}>

        {/* Drawer header */}
        <div style={{
          height: 64, padding: '0 16px', borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          {branchContext ? (
            <div>
              <button
                onClick={() => { exitBranch(); router.push('/branches'); setDrawerOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, background: 'none',
                  border: 'none', cursor: 'pointer', color: 'var(--text-2)',
                  fontFamily: "'Inter Tight', sans-serif", fontSize: 12, marginBottom: 4,
                }}
              >
                <ChevronLeft size={13} /> Salir de sucursal
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: 'rgba(29,189,240,0.12)', border: '1px solid rgba(29,189,240,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Building2 size={13} style={{ color: 'var(--fd-cyan)' }} />
                </div>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--fd-cyan)', fontWeight: 600, margin: 0 }}>
                    {(branchContext as any).branch_name}
                  </p>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-3)', margin: 0, letterSpacing: '0.06em' }}>
                    MODO SUCURSAL
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'linear-gradient(135deg, var(--fd-cyan), var(--fd-blue))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 700, fontSize: 15, color: 'white' }}>F</span>
              </div>
              <span style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 700, letterSpacing: '-0.03em', fontSize: 18 }}>
                <span style={{ background: 'linear-gradient(100deg, var(--fd-cyan), var(--fd-blue) 60%, var(--fd-magenta))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Flow</span>
                <span style={{ color: 'var(--text)' }}>desk</span>
              </span>
            </div>
          )}
          <button
            onClick={() => setDrawerOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 6, borderRadius: 7, display: 'flex', transition: 'color 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
          {NAV.core.map(({ href, label, icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <NavItem key={href} href={href} label={label} icon={icon} active={active} onClick={() => setDrawerOpen(false)} />
            );
          })}

          {NAV.main.map(({ href, label, icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <NavItem key={href} href={href} label={label} icon={icon} active={active} onClick={() => setDrawerOpen(false)} />
            );
          })}

          {NAV.recursos.length > 0 && (
            <>
              <div style={{
                padding: '16px 12px 6px',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-3)',
              }}>
                Recursos
              </div>
              {NAV.recursos.map(({ href, label, icon }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                return (
                  <NavItem key={href} href={href} label={label} icon={icon} active={active} onClick={() => setDrawerOpen(false)} />
                );
              })}
            </>
          )}

          {NAV.bottom.map(({ href, label, icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <NavItem key={href} href={href} label={label} icon={icon} active={active} onClick={() => setDrawerOpen(false)} />
            );
          })}

          {(effectiveUser.role === 'superadmin' || (effectiveUser as any).platform_admin) && (
            <>
              <div style={{
                padding: '16px 12px 6px',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-3)',
              }}>
                FlowDesk Admin
              </div>
              {ADMIN_NAV.map(({ href, label, icon }) => {
                const active = pathname === href;
                return (
                  <NavItem key={href} href={href} label={label} icon={icon} active={active} onClick={() => setDrawerOpen(false)} admin />
                );
              })}
            </>
          )}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px' }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--fd-cyan), var(--fd-magenta))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Inter Tight', sans-serif", fontWeight: 700, fontSize: 11, color: 'white',
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 12, fontWeight: 500, color: 'var(--text)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {effectiveUser.name || effectiveUser.email}
              </p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-3)', margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {effectiveUser.role}
              </p>
            </div>
          </div>
          <button
            onClick={() => { logout(); setDrawerOpen(false); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'var(--text-2)',
              fontFamily: "'Inter Tight', sans-serif", fontSize: 13, fontWeight: 500,
              letterSpacing: '-0.01em', transition: 'background 0.15s, color 0.15s', marginTop: 2,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)'; }}
          >
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <LogOut size={13} style={{ color: 'var(--text-3)' }} />
            </div>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ════ CONTENT ════ */}
      <main style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {children}
      </main>

    </div>
  );
}

/* ── Sub-components ── */

function BrandButton({ open, onClick, brand }: { open: boolean; onClick: () => void; brand: BrandConfig }) {
  const [hov, setHov] = useState(false);

  const hasBrand = brand.configured && brand.logo_url;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '6px 14px 6px 6px', borderRadius: 999,
        border: 'none', cursor: 'pointer',
        background: open || hov ? 'var(--surface)' : 'transparent',
        transition: 'background 0.15s',
      }}
    >
      {/* Logo — cliente o FlowDesk "F" */}
      {hasBrand ? (
        <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, overflow: 'hidden', background: 'var(--surface-2)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Image src={brand.logo_url!} alt="Logo" width={32} height={32} style={{ objectFit: 'contain', width: '100%', height: '100%' }} unoptimized />
        </div>
      ) : (
        <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, var(--fd-cyan), var(--fd-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 700, fontSize: 15, color: 'white' }}>F</span>
        </div>
      )}

      {/* Nombre — cliente o "FlowDesk" */}
      {hasBrand && brand.tenant_name ? (
        <span style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 700, letterSpacing: '-0.025em', fontSize: 17, color: 'var(--text)', whiteSpace: 'nowrap', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {brand.tenant_name}
        </span>
      ) : (
        <span style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 700, letterSpacing: '-0.03em', fontSize: 18, display: 'flex' }}>
          <span style={{ background: 'linear-gradient(100deg, var(--fd-cyan), var(--fd-blue) 60%, var(--fd-magenta))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Flow</span>
          <span style={{ color: 'var(--text)' }}>desk</span>
        </span>
      )}

      <ChevronDown size={12} style={{ color: open ? 'var(--text)' : 'var(--text-3)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
    </button>
  );
}

function CampusLink({ active }: { active: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href="/campus"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: "'Inter Tight', sans-serif", fontSize: 13, fontWeight: 500,
        letterSpacing: '-0.01em', textDecoration: 'none',
        color: active || hov ? 'var(--text)' : 'var(--text-2)',
        padding: '8px 16px', borderRadius: 8,
        background: active ? 'var(--surface)' : 'transparent',
        transition: 'color 0.15s, background 0.15s',
      }}
    >
      Campus
    </Link>
  );
}

function BellButton({ unread, open, onClick }: { unread: number; open: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', padding: 8, borderRadius: 8, border: 'none', cursor: 'pointer',
        background: open || hov ? 'var(--surface)' : 'transparent',
        color: open || hov ? 'var(--text)' : 'var(--text-3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      <Bell size={15} />
      {unread > 0 && (
        <span style={{
          position: 'absolute', top: 4, right: 4,
          width: 14, height: 14, borderRadius: '50%',
          background: 'var(--fd-cyan)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8, fontWeight: 700, color: 'white',
          fontFamily: "'Inter Tight', sans-serif",
        }}>
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}

function NotifPanel({
  loading, notifs, unread, onMarkAll, onClose, onMarkRead, onRemove, pathname, closeBell,
}: {
  loading: boolean; notifs: Notification[]; unread: number;
  onMarkAll: () => void; onClose: () => void;
  onMarkRead: (id: string) => void; onRemove: (id: string, unread: boolean) => void;
  pathname: string; closeBell: () => void;
}) {
  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 340,
      background: 'var(--surface)', border: '1px solid var(--line-strong)',
      borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 30px 60px -20px rgba(0,0,0,0.5), 0 10px 25px -10px rgba(29,189,240,0.1)',
      zIndex: 100,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: '1px solid var(--line)',
      }}>
        <span style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 600, fontSize: 13, color: 'var(--text)', letterSpacing: '-0.01em' }}>
          Notificaciones
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {unread > 0 && (
            <button onClick={onMarkAll} style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--fd-cyan)', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.06em' }}>
              <CheckCheck size={11} /> Todo leído
            </button>
          )}
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
            <X size={14} />
          </button>
        </div>
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 80 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--fd-cyan)', borderTopColor: 'transparent' }} className="fd-spin" />
          </div>
        ) : notifs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <Bell size={18} style={{ color: 'var(--text-3)', display: 'block', margin: '0 auto 8px' }} />
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Sin notificaciones</p>
          </div>
        ) : (
          notifs.map(n => (
            <div key={n.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px',
              borderBottom: '1px solid var(--line)',
              background: !n.read ? 'rgba(29,189,240,0.04)' : 'transparent',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: NOTIF_COLOR[n.type] ?? 'var(--text-3)', flexShrink: 0, marginTop: 5 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: n.read ? 'var(--text-2)' : 'var(--text)', margin: 0 }}>{n.title}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{n.content}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-3)' }}>{timeAgo(n.created_at)}</span>
                  {!n.read && (
                    <button onClick={() => onMarkRead(n.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--fd-cyan)', padding: 0 }}>
                      Marcar leída
                    </button>
                  )}
                  {n.action_url && (
                    <Link href={n.action_url} onClick={() => { onMarkRead(n.id); closeBell(); }} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--fd-cyan)', display: 'flex', alignItems: 'center', gap: 2, textDecoration: 'none' }}>
                      Ver <ExternalLink size={8} />
                    </Link>
                  )}
                </div>
              </div>
              <button onClick={() => onRemove(n.id, !n.read)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-3)', flexShrink: 0, padding: 0, opacity: 0.6, display: 'flex' }}>
                <X size={11} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
