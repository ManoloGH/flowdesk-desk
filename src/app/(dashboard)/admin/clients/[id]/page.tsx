'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import {
  ArrowLeft, Building2, Users, Brain, MessageSquare, CheckCircle, XCircle,
  Phone, DollarSign, Bot, User, Loader2, RefreshCw, Activity,
  Server, Download, PackageOpen, AlertTriangle, ShieldCheck, ClipboardList,
  Wifi, WifiOff, ChevronDown, ChevronUp, Globe, Plus, Copy, Check,
} from 'lucide-react';

interface TeamSlotRow {
  id: string; name: string; email: string | null; role: string; type: string; status: string; agent_role: string | null;
}
interface ExportStat { table: string; count: number }
interface MigrationBundle {
  tenant_name: string; tenant_slug: string; docker_compose: string; env_content: string;
  setup_sh: string; verify_sh: string; install_md: string; migration_manual: string;
  data_sql: string; export_stats: ExportStat[]; generated_at: string;
}
type CheckStatus = 'pass' | 'fail' | 'warning' | 'info';
interface AuditCheck {
  id: string; category: string; name: string; status: CheckStatus; detail: string;
  count?: number; expected?: number; fix?: string;
}
interface AuditReport {
  tenant_id: string; tenant_name: string; tenant_slug: string; audited_at: string;
  overall: CheckStatus; score: number; checks: AuditCheck[];
  table_stats: ExportStat[]; errors: string[]; warnings: string[];
}
interface PingResult {
  reachable: boolean; status_code: number | null; response_ms: number | null; error: string | null;
  checks: Array<{ name: string; status: CheckStatus; detail: string }>;
}
interface TenantDetail {
  id: string; name: string; slug: string; plan: string; status: string;
  account_type: string; mission: string | null; tagline: string | null;
  created_at: string; mrr: number; web_builder_enabled: boolean;
  migration_status: string | null; migration_at: string | null; self_hosted_url: string | null;
  health: { score: number; label: string; active_humans: number; active_agents: number; completed_today: number; overdue_tasks: number; recent_conversations: number };
  team_slots: TeamSlotRow[];
  secretary_config: { enabled: boolean; owner_phone: string; morning_brief_time: string; morning_brief_enabled: boolean } | null;
  billing_config: { enabled: boolean; rfc: string | null; facturapi_org_id: string | null; stripe_account_id: string | null } | null;
  _count: { team_slots: number; brain_documents: number; agent_conversations: number; contacts: number; tasks: number };
  open_deals: number; pipeline_value: number;
  onboarding: { current_step: number; completed_at: string | null; steps_completed: string[] } | null;
}

const PLAN_BADGE: Record<string, string> = {
  nano: 'bg-gray-700/50 text-gray-400 border-gray-600/30',
  small: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  medium: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  large: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  enterprise: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  internal: 'bg-gray-800 text-gray-600 border-gray-700/30',
};
const PLAN_OPTS = [
  { value: 'nano', label: '-10 empleados' }, { value: 'small', label: '10–50 empleados' },
  { value: 'medium', label: '50–100 empleados' }, { value: 'large', label: '+100 empleados' },
  { value: 'enterprise', label: '+1000 empleados' },
];
const ACCOUNT_OPTS = [
  { value: 'HOLDING', label: 'Clientes MentorIA' }, { value: 'PARTNERSHIP', label: 'Partner MentorIA' },
  { value: 'DIRECT', label: 'Cliente FlowDesk' },
];

function ConfigRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-white">{value}</span>
        {ok ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-gray-600" />}
      </div>
    </div>
  );
}

function Toggle({ label, desc, enabled, onChange }: { label: string; desc: string; enabled: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div>
        <p className="text-xs font-medium text-white">{label}</p>
        <p className="text-[10px] text-gray-600 mt-0.5">{desc}</p>
      </div>
      <button onClick={onChange} className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${enabled ? 'bg-indigo-500' : 'bg-white/10'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

type Tab = 'dashboard' | 'equipo' | 'config' | 'migracion';

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { enterCompany } = useAuth();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [migrating, setMigrating] = useState(false);
  const [bundle, setBundle] = useState<MigrationBundle | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<PingResult | null>(null);
  const [selfHostedUrl, setSelfHostedUrl] = useState('');
  const [migrationTab, setMigrationTab] = useState<'bundle' | 'audit' | 'verify'>('bundle');
  const [expandedChecks, setExpandedChecks] = useState<Set<string>>(new Set());
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'employee', worker_type: 'desk', password: '' });
  const [creatingUser, setCreatingUser] = useState(false);
  const [createdUser, setCreatedUser] = useState<{ name: string; email: string; temp_password: string } | null>(null);
  const [createError, setCreateError] = useState('');
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    const d = await api.get<TenantDetail>(`/platform/network/${id}`).catch(() => null);
    setTenant(d);
    setLoading(false);
  }
  useEffect(() => { load(); }, [id]);

  async function patch(path: string, body: object) {
    setUpdating(true);
    await api.patch(`/platform/network/${id}/${path}`, body).catch(() => {});
    await load();
    setUpdating(false);
  }

  async function toggleWebBuilder() {
    if (!tenant) return;
    setUpdating(true);
    try {
      await api.patch(`/platform/network/${id}/web-builder`, { enabled: !tenant.web_builder_enabled });
      await load();
    } catch (e: any) {
      alert(`Error al cambiar Web Builder: ${e?.message ?? 'Error desconocido'}`);
    }
    setUpdating(false);
  }

  async function generateBundle() {
    setMigrating(true);
    try { const r = await api.post<MigrationBundle>(`/platform/network/${id}/migration-bundle`, {}); setBundle(r); await load(); } catch {}
    setMigrating(false);
  }
  async function runAudit() {
    setAuditing(true);
    try { const r = await api.get<AuditReport>(`/platform/network/${id}/migration-audit`); setAuditReport(r); setMigrationTab('audit'); } catch {}
    setAuditing(false);
  }
  async function pingRemote() {
    if (!selfHostedUrl) return;
    setPinging(true);
    try { const r = await api.post<PingResult>(`/platform/network/${id}/migration-ping`, { self_hosted_url: selfHostedUrl }); setPingResult(r); if (r.reachable) await load(); } catch {}
    setPinging(false);
  }
  function toggleCheck(cid: string) {
    setExpandedChecks(prev => { const n = new Set(prev); n.has(cid) ? n.delete(cid) : n.add(cid); return n; });
  }
  async function createUser() {
    if (!newUser.name || !newUser.email) return;
    setCreatingUser(true);
    setCreateError('');
    try {
      const res: any = await api.post(`/platform/network/${id}/team-slots`, {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        worker_type: newUser.worker_type,
        ...(newUser.password ? { password: newUser.password } : {}),
      });
      setCreatedUser({ name: res.name, email: res.email, temp_password: res.temp_password });
      setNewUser({ name: '', email: '', role: 'employee', worker_type: 'desk', password: '' });
      await load();
    } catch (e: any) {
      const msg = typeof e?.message === 'string' ? e.message : JSON.stringify(e?.message ?? 'Error al crear usuario');
      setCreateError(msg);
    }
    setCreatingUser(false);
  }

  function copyPassword(pw: string) {
    navigator.clipboard.writeText(pw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function enterAsCompany() {
    setUpdating(true);
    try {
      const data = await api.post<{ access_token: string; company_name: string; user: any }>(
        `/platform/network/${id}/impersonate`, {}
      );
      enterCompany(data.company_name, data.access_token, data.user);
      router.push('/dashboard');
    } catch (e: any) {
      alert(`Error: ${e?.message ?? 'No se pudo entrar a la empresa'}`);
    }
    setUpdating(false);
  }

  function downloadFile(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  }

  if (loading) return <div className="h-screen bg-[#050a14] flex items-center justify-center"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /></div>;
  if (!tenant) return <div className="h-screen bg-[#050a14] flex items-center justify-center text-gray-500 text-sm">Empresa no encontrada</div>;

  const humans = tenant.team_slots.filter(s => s.type === 'HUMAN');
  const agents = tenant.team_slots.filter(s => s.type === 'AI_AGENT');
  const healthColor = tenant.health.score >= 80 ? '#10B981' : tenant.health.score >= 55 ? '#F59E0B' : '#EF4444';

  const TABS: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'equipo',    label: 'Equipo' },
    { key: 'config',    label: 'Configuración' },
    { key: 'migracion', label: 'Migración' },
  ];

  return (
    <div className="h-screen bg-[#050a14] flex flex-col overflow-hidden font-sans">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-6 py-3 border-b border-white/5">
        <button onClick={() => router.back()} className="text-gray-600 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <h1 className="text-sm font-bold text-white truncate">{tenant.name}</h1>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${PLAN_BADGE[tenant.plan] ?? PLAN_BADGE.nano}`}>
            {PLAN_OPTS.find(p => p.value === tenant.plan)?.label ?? tenant.plan}
          </span>
          <span className={`text-[10px] flex-shrink-0 ${tenant.status === 'active' ? 'text-emerald-400' : 'text-red-400'}`}>● {tenant.status}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={load} disabled={updating} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${updating ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={enterAsCompany} disabled={updating}
            className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium border border-indigo-500/30 transition-colors flex items-center gap-1.5">
            <Globe className="w-3 h-3" /> Entrar como empresa
          </button>
          {tenant.status === 'active'
            ? <button onClick={() => patch('status', { status: 'suspended' })} disabled={updating} className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/20 transition-colors">Suspender</button>
            : <button onClick={() => patch('status', { status: 'active' })} disabled={updating} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/20 transition-colors">Activar</button>
          }
          <select value={tenant.account_type} onChange={e => patch('account-type', { account_type: e.target.value })} disabled={updating}
            className="bg-[#0a0f1e] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-400 focus:outline-none">
            {ACCOUNT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={tenant.plan} onChange={e => patch('plan', { plan: e.target.value })} disabled={updating}
            className="bg-[#0a0f1e] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-400 focus:outline-none">
            {PLAN_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── TABS ───────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex gap-0 px-6 border-b border-white/5">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${tab === t.key ? 'border-indigo-500 text-indigo-300' : 'border-transparent text-gray-600 hover:text-gray-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CONTENT ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden p-6">

        {/* ─ DASHBOARD ─────────────────────────────────────────────────────── */}
        {tab === 'dashboard' && (
          <div className="h-full flex flex-col gap-4">
            {/* Stats row */}
            <div className="grid grid-cols-8 gap-3 flex-shrink-0">
              {/* Health */}
              <div className="col-span-2 bg-[#0a0f1e] border border-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-gray-600">Health</span>
                  <span className="text-[10px] font-semibold" style={{ color: healthColor }}>{tenant.health.label} · {tenant.health.score}/100</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full" style={{ width: `${tenant.health.score}%`, backgroundColor: healthColor }} />
                </div>
                <div className="grid grid-cols-2 gap-y-2">
                  {[['Humanos', tenant.health.active_humans], ['Agentes', tenant.health.active_agents], ['Completadas', tenant.health.completed_today], ['Vencidas', tenant.health.overdue_tasks]].map(([l, v]) => (
                    <div key={l as string} className="text-center">
                      <p className="text-base font-bold text-white">{v}</p>
                      <p className="text-[9px] text-gray-600">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Stat cards */}
              {[
                { label: 'Team',         value: tenant._count.team_slots,           icon: Users,        color: 'text-blue-400' },
                { label: 'Brain',        value: tenant._count.brain_documents,       icon: Brain,        color: 'text-amber-400' },
                { label: 'Chats',        value: tenant._count.agent_conversations,   icon: MessageSquare,color: 'text-pink-400' },
                { label: 'Contactos',    value: tenant._count.contacts,              icon: Building2,    color: 'text-violet-400' },
                { label: 'Deals',        value: tenant.open_deals,                   icon: Activity,     color: 'text-indigo-400' },
                { label: 'Pipeline MXN', value: `$${(tenant.pipeline_value||0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-[#0a0f1e] border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-bold tracking-widest text-gray-600 uppercase">{label}</p>
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                  </div>
                  <p className="text-xl font-bold text-white">{value}</p>
                </div>
              ))}
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
              {/* Onboarding */}
              <div className="bg-[#0a0f1e] border border-white/5 rounded-xl p-4 overflow-hidden">
                <p className="text-[10px] font-bold tracking-widest text-gray-600 uppercase mb-3">Onboarding</p>
                {tenant.onboarding ? (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(tenant.onboarding.steps_completed.length / 6) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-500">{tenant.onboarding.steps_completed.length}/6</span>
                    </div>
                    <ConfigRow label="Completado" value={tenant.onboarding.completed_at ? new Date(tenant.onboarding.completed_at).toLocaleDateString('es-MX') : 'En progreso'} ok={!!tenant.onboarding.completed_at} />
                  </>
                ) : <p className="text-xs text-gray-600">Sin iniciar</p>}
              </div>

              {/* Atlas */}
              <div className="bg-[#0a0f1e] border border-white/5 rounded-xl p-4 overflow-hidden">
                <p className="text-[10px] font-bold tracking-widest text-gray-600 uppercase mb-3">Atlas — Secretario</p>
                {tenant.secretary_config ? (
                  <>
                    <ConfigRow label="Estado" value={tenant.secretary_config.enabled ? 'Activo' : 'Inactivo'} ok={tenant.secretary_config.enabled} />
                    <ConfigRow label="WhatsApp" value={tenant.secretary_config.owner_phone || '—'} ok={!!tenant.secretary_config.owner_phone} />
                    <ConfigRow label="Brief" value={tenant.secretary_config.morning_brief_enabled ? tenant.secretary_config.morning_brief_time : 'Off'} ok={tenant.secretary_config.morning_brief_enabled} />
                  </>
                ) : <p className="text-xs text-gray-600">Sin configurar</p>}
              </div>

              {/* Facturación */}
              <div className="bg-[#0a0f1e] border border-white/5 rounded-xl p-4 overflow-hidden">
                <p className="text-[10px] font-bold tracking-widest text-gray-600 uppercase mb-3">Facturación</p>
                {tenant.billing_config ? (
                  <>
                    <ConfigRow label="RFC" value={tenant.billing_config.rfc || '—'} ok={!!tenant.billing_config.rfc} />
                    <ConfigRow label="Facturapi" value={tenant.billing_config.facturapi_org_id ? 'Conectado' : '—'} ok={!!tenant.billing_config.facturapi_org_id} />
                    <ConfigRow label="Stripe" value={tenant.billing_config.stripe_account_id ? 'Conectado' : '—'} ok={!!tenant.billing_config.stripe_account_id} />
                  </>
                ) : <p className="text-xs text-gray-600">Sin configurar</p>}
                <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[10px] text-gray-600">Ing. Mensual</span>
                  <span className="text-xs font-semibold text-emerald-400">${(tenant.mrr||0).toLocaleString()}/mes</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─ EQUIPO ────────────────────────────────────────────────────────── */}
        {tab === 'equipo' && (
          <div className="h-full grid grid-cols-2 gap-4">
            <div className="bg-[#0a0f1e] border border-white/5 rounded-xl p-5 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <p className="text-[10px] font-bold tracking-widest text-gray-600 uppercase">Equipo humano · {humans.length}</p>
                <button onClick={() => { setShowCreateUser(true); setCreatedUser(null); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-[10px] font-medium border border-indigo-500/30 transition-colors">
                  <Plus className="w-3 h-3" /> Crear usuario
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {humans.length === 0
                  ? <p className="text-xs text-gray-600">Sin usuarios humanos</p>
                  : humans.map(s => (
                    <div key={s.id} className="flex items-center gap-3 py-1.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600/40 to-violet-600/40 flex items-center justify-center flex-shrink-0">
                        <User className="w-3.5 h-3.5 text-indigo-300" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white">{s.name}</p>
                        <p className="text-[10px] text-gray-600 truncate">{s.email ?? s.role}</p>
                      </div>
                      <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 border border-white/5 flex-shrink-0">{s.role}</span>
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="bg-[#0a0f1e] border border-white/5 rounded-xl p-5 flex flex-col overflow-hidden">
              <p className="text-[10px] font-bold tracking-widest text-gray-600 uppercase mb-4 flex-shrink-0">Agentes IA · {agents.length}</p>
              <div className="flex-1 overflow-y-auto space-y-2">
                {agents.length === 0
                  ? <p className="text-xs text-gray-600">Sin agentes</p>
                  : agents.map(s => (
                    <div key={s.id} className="flex items-center gap-3 py-1.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600/30 to-teal-600/30 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white">{s.name}</p>
                        <p className="text-[10px] text-gray-600">{s.agent_role ?? 'agent'}</p>
                      </div>
                      <span className={`ml-auto w-2 h-2 rounded-full flex-shrink-0 ${s.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-gray-700'}`} />
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {/* ─ CONFIGURACIÓN ─────────────────────────────────────────────────── */}
        {tab === 'config' && (
          <div className="h-full grid grid-cols-2 gap-4">
            {/* Módulos */}
            <div className="bg-[#0a0f1e] border border-white/5 rounded-xl p-5 flex flex-col overflow-hidden">
              <p className="text-[10px] font-bold tracking-widest text-gray-600 uppercase mb-4 flex-shrink-0">Módulos</p>
              <div className="flex-1 overflow-y-auto">
                <Toggle
                  label="Web Builder"
                  desc="Permite al cliente crear y publicar su web con IA desde FlowDesk Desk"
                  enabled={tenant.web_builder_enabled}
                  onChange={toggleWebBuilder}
                />
                <Toggle label="IA Analytics" desc="Panel de métricas avanzadas de agentes (próximamente)" enabled={false} onChange={() => {}} />
                <Toggle label="Automatizaciones" desc="Flujos automáticos n8n / Make (próximamente)" enabled={false} onChange={() => {}} />
                <Toggle label="Software" desc="Gestión de licencias de software del equipo (próximamente)" enabled={false} onChange={() => {}} />
              </div>
            </div>

            {/* Datos del tenant */}
            <div className="bg-[#0a0f1e] border border-white/5 rounded-xl p-5 flex flex-col overflow-hidden">
              <p className="text-[10px] font-bold tracking-widest text-gray-600 uppercase mb-4 flex-shrink-0">Datos</p>
              <div className="flex-1 overflow-y-auto space-y-0">
                <ConfigRow label="Alta" value={new Date(tenant.created_at).toLocaleDateString('es-MX')} ok={true} />
                <ConfigRow label="Slug" value={tenant.slug} ok={true} />
                <ConfigRow label="Plan" value={PLAN_OPTS.find(p => p.value === tenant.plan)?.label ?? tenant.plan} ok={true} />
                <ConfigRow label="Tipo de cuenta" value={ACCOUNT_OPTS.find(a => a.value === tenant.account_type)?.label ?? tenant.account_type} ok={true} />
                <ConfigRow label="Ing. Mensual" value={`$${(tenant.mrr||0).toLocaleString()}/mes`} ok={tenant.mrr > 0} />
                <div className="py-2">
                  <p className="text-[10px] text-gray-600">ID</p>
                  <p className="text-[10px] text-gray-500 font-mono break-all mt-0.5">{tenant.id}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─ MIGRACIÓN ─────────────────────────────────────────────────────── */}
        {tab === 'migracion' && (
          <div className="h-full flex flex-col overflow-hidden">
            {/* Cabecera migración */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Migración a servidor propio</span>
                {tenant.migration_status === 'migrated' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Migrado ✓</span>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={runAudit} disabled={auditing} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 text-xs font-medium border border-indigo-500/20 transition-colors disabled:opacity-50">
                  {auditing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  {auditing ? 'Auditando...' : 'Auditoría'}
                </button>
                {!bundle && (
                  <button onClick={generateBundle} disabled={migrating} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-xs font-medium border border-violet-500/20 transition-colors disabled:opacity-50">
                    {migrating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackageOpen className="w-3.5 h-3.5" />}
                    {migrating ? 'Generando...' : 'Generar bundle'}
                  </button>
                )}
              </div>
            </div>

            {/* Info banner (sin bundle) */}
            {!bundle && !auditReport && (
              <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-gray-400 leading-relaxed">
                  <p className="text-amber-300 font-medium mb-1">Genera una copia idéntica de FlowDesk para este cliente</p>
                  <p>El bundle incluye <strong className="text-white">toda la infraestructura</strong> (docker-compose, .env con valores reales, scripts) <strong className="text-white">más exportación completa de datos</strong> en SQL.</p>
                </div>
              </div>
            )}

            {/* Migration tabs */}
            {(bundle || auditReport) && (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex items-center gap-1 border-b border-white/5 flex-shrink-0">
                  {([
                    { key: 'bundle' as const, label: 'Bundle', icon: PackageOpen, disabled: !bundle },
                    { key: 'audit' as const, label: 'Auditoría', icon: ShieldCheck, disabled: !auditReport },
                    { key: 'verify' as const, label: 'Verificar', icon: ClipboardList, disabled: false },
                  ]).map(t => (
                    <button key={t.key} onClick={() => setMigrationTab(t.key)} disabled={t.disabled}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors disabled:opacity-30 ${migrationTab === t.key ? 'border-violet-500 text-violet-300' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                      <t.icon className="w-3.5 h-3.5" />{t.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto pt-4">
                  {/* Bundle tab */}
                  {migrationTab === 'bundle' && bundle && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">Generado el <strong className="text-white">{new Date(bundle.generated_at).toLocaleString('es-MX')}</strong></p>
                        <button onClick={() => { [{ c: bundle.docker_compose, n: 'docker-compose.yml' }, { c: bundle.env_content, n: '.env' }, { c: bundle.setup_sh, n: 'setup.sh' }, { c: bundle.verify_sh, n: 'verify.sh' }, { c: bundle.install_md, n: 'INSTALL.md' }, { c: bundle.migration_manual, n: 'migration_manual.md' }, { c: bundle.data_sql, n: `${bundle.tenant_slug}-data.sql` }].forEach((f, i) => setTimeout(() => downloadFile(f.c, f.n), i * 200)); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs border border-white/10 transition-colors">
                          <Download className="w-3.5 h-3.5" />Descargar todo (7)
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {([
                          { label: 'docker-compose.yml', content: bundle.docker_compose, filename: 'docker-compose.yml', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
                          { label: '.env', content: bundle.env_content, filename: '.env', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                          { label: 'setup.sh', content: bundle.setup_sh, filename: 'setup.sh', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
                          { label: 'verify.sh', content: bundle.verify_sh, filename: 'verify.sh', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
                          { label: 'INSTALL.md', content: bundle.install_md, filename: 'INSTALL.md', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                          { label: 'migration_manual.md', content: bundle.migration_manual, filename: 'migration_manual.md', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
                          { label: `${bundle.tenant_slug}-data.sql`, content: bundle.data_sql, filename: `${bundle.tenant_slug}-data.sql`, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                        ]).map(f => (
                          <button key={f.filename} onClick={() => downloadFile(f.content, f.filename)}
                            className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-colors hover:opacity-90 ${f.bg}`}>
                            <Download className={`w-3.5 h-3.5 ${f.color} flex-shrink-0`} />
                            <span className={`text-xs font-mono ${f.color} truncate`}>{f.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Audit tab */}
                  {migrationTab === 'audit' && auditReport && (() => {
                    const icon = (s: CheckStatus) => s === 'pass' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /> : s === 'fail' ? <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" /> : s === 'warning' ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" /> : <Activity className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />;
                    const cats = [...new Set(auditReport.checks.map(c => c.category))];
                    return (
                      <div className="space-y-4">
                        <div className={`flex items-center gap-3 p-3 rounded-xl border ${auditReport.overall === 'pass' ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400' : auditReport.overall === 'fail' ? 'bg-red-500/15 border-red-500/25 text-red-400' : 'bg-amber-500/15 border-amber-500/25 text-amber-400'}`}>
                          <div className="text-2xl font-bold">{auditReport.score}</div>
                          <div><p className="text-xs font-semibold">{auditReport.overall === 'pass' ? 'Listo para migrar' : auditReport.overall === 'fail' ? 'Hay problemas críticos' : 'Revisar advertencias'}</p></div>
                        </div>
                        {cats.map(cat => (
                          <div key={cat}>
                            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-1.5">{cat}</p>
                            <div className="space-y-1.5">
                              {auditReport.checks.filter(c => c.category === cat).map(check => (
                                <div key={check.id} className="bg-white/[0.02] border border-white/5 rounded-lg overflow-hidden">
                                  <button onClick={() => toggleCheck(check.id)} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-white/[0.02] transition-colors">
                                    {icon(check.status)}
                                    <span className="text-xs text-gray-300 flex-1">{check.name}</span>
                                    {check.fix && (expandedChecks.has(check.id) ? <ChevronUp className="w-3 h-3 text-gray-600" /> : <ChevronDown className="w-3 h-3 text-gray-600" />)}
                                  </button>
                                  <div className="px-3 pb-2 -mt-1"><p className="text-[10px] text-gray-500">{check.detail}</p></div>
                                  {check.fix && expandedChecks.has(check.id) && (
                                    <div className="px-3 pb-3 border-t border-white/5 pt-2">
                                      <p className="text-[10px] text-amber-300/80"><span className="font-semibold text-amber-300">Cómo corregir: </span>{check.fix}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Verify tab */}
                  {migrationTab === 'verify' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <input type="url" value={selfHostedUrl} onChange={e => setSelfHostedUrl(e.target.value)} placeholder="https://flowdesk.tuempresa.com"
                          className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50" />
                        <button onClick={pingRemote} disabled={pinging || !selfHostedUrl}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-xs font-medium border border-violet-500/20 transition-colors disabled:opacity-50">
                          {pinging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
                          {pinging ? 'Verificando...' : 'Verificar'}
                        </button>
                      </div>
                      {pingResult && (
                        <div className={`rounded-xl border p-4 space-y-3 ${pingResult.reachable ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                          <div className="flex items-center gap-2">
                            {pingResult.reachable ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
                            <p className={`text-xs font-semibold ${pingResult.reachable ? 'text-emerald-300' : 'text-red-300'}`}>
                              {pingResult.reachable ? `Servidor accesible · ${pingResult.response_ms}ms` : 'Servidor no accesible'}
                            </p>
                          </div>
                          {pingResult.error && <p className="text-[10px] text-red-400/70">{pingResult.error}</p>}
                          <div className="space-y-1.5">
                            {pingResult.checks.map((c, i) => (
                              <div key={i} className="flex items-center gap-2">
                                {c.status === 'pass' ? <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" /> : c.status === 'warning' ? <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" /> : <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />}
                                <span className="text-[10px] text-gray-400">{c.name}</span>
                                <span className="text-[10px] text-gray-600 ml-auto">{c.detail}</span>
                              </div>
                            ))}
                          </div>
                          {pingResult.reachable && tenant.migration_status !== 'migrated' && (
                            <button onClick={async () => { await api.patch(`/platform/network/${id}/migration-status`, { self_hosted_url: selfHostedUrl }).catch(() => {}); await load(); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium border border-emerald-500/20 transition-colors">
                              <CheckCircle className="w-3.5 h-3.5" />Marcar como migrado
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL CREAR USUARIO ────────────────────────────────────────────── */}
    {showCreateUser && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-[#0a0f1e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-white">Crear usuario — {tenant.name}</h3>
            <button onClick={() => { setShowCreateUser(false); setCreatedUser(null); }} className="text-gray-600 hover:text-white transition-colors">
              <XCircle className="w-4 h-4" />
            </button>
          </div>

          {createdUser ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <p className="text-xs font-medium text-emerald-300 mb-1">✅ Usuario creado correctamente</p>
                <p className="text-[11px] text-gray-400">{createdUser.name} · {createdUser.email}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Contraseña temporal</p>
                <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg">
                  <code className="flex-1 text-sm font-mono text-amber-300">{createdUser.temp_password}</code>
                  <button onClick={() => copyPassword(createdUser.temp_password)}
                    className="text-gray-500 hover:text-white transition-colors flex-shrink-0">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-600 mt-2">Comparte esta contraseña con el empleado. Solo se muestra una vez.</p>
              </div>
              <button onClick={() => setCreatedUser(null)}
                className="w-full px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium border border-indigo-500/30 rounded-lg transition-colors">
                Crear otro usuario
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1.5">Nombre completo *</label>
                <input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Ej: María González"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1.5">Email *</label>
                <input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="empleado@empresa.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1.5">Rol</label>
                <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full bg-[#050a14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50">
                  <option value="employee">Empleado</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-2">¿Cómo accede este usuario? *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'desk',      label: 'Computadora',  desc: 'Acceso completo al desk web' },
                    { value: 'operative', label: 'Teléfono',     desc: 'Solo cédula de resultados por WhatsApp' },
                  ].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setNewUser({ ...newUser, worker_type: opt.value })}
                      className={`p-3 rounded-lg border text-left transition-colors ${newUser.worker_type === opt.value ? 'border-indigo-500/60 bg-indigo-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                      <p className={`text-xs font-medium ${newUser.worker_type === opt.value ? 'text-indigo-300' : 'text-white'}`}>{opt.label}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1.5">Contraseña (opcional — se auto-genera si se deja vacío)</label>
                <input type="text" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Dejar vacío para auto-generar"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50" />
              </div>
              {createError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-xs text-red-400">{createError}</p>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={() => { setShowCreateUser(false); setCreateError(''); }}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 text-xs rounded-lg transition-colors">
                  Cancelar
                </button>
                <button onClick={createUser} disabled={creatingUser || !newUser.name || !newUser.email}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                  {creatingUser ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  {creatingUser ? 'Creando...' : 'Crear usuario'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )}
    </div>
  );
}
