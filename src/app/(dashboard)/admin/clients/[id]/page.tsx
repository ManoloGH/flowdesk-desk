'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ArrowLeft, Building2, Users, Brain, MessageSquare, CheckCircle, XCircle,
  Phone, FileText, DollarSign, Bot, User, Loader2, RefreshCw, Activity,
} from 'lucide-react';

interface TeamSlotRow {
  id: string; name: string; email: string | null; role: string; type: string; status: string; agent_role: string | null;
}

interface TenantDetail {
  id: string; name: string; slug: string; plan: string; status: string;
  account_type: string; mission: string | null; tagline: string | null;
  created_at: string; mrr: number;
  health: { score: number; label: string; active_humans: number; active_agents: number; completed_today: number; overdue_tasks: number; recent_conversations: number };
  team_slots: TeamSlotRow[];
  secretary_config: { enabled: boolean; owner_phone: string; morning_brief_time: string; morning_brief_enabled: boolean } | null;
  billing_config: { enabled: boolean; rfc: string | null; facturapi_org_id: string | null; stripe_account_id: string | null } | null;
  _count: { team_slots: number; brain_documents: number; agent_conversations: number; contacts: number; tasks: number };
  open_deals: number;
  pipeline_value: number;
  onboarding: { current_step: number; completed_at: string | null; steps_completed: string[] } | null;
}

const PLAN_BADGE: Record<string, string> = {
  enterprise:   'bg-violet-500/20 text-violet-300 border-violet-500/30',
  professional: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  starter:      'bg-gray-700/50 text-gray-400 border-gray-600/30',
  internal:     'bg-gray-800 text-gray-600 border-gray-700/30',
};

function HealthBar({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? '#10B981' : score >= 55 ? '#F59E0B' : '#EF4444';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-gray-500">Health</span>
        <span className="text-[11px] font-semibold" style={{ color }}>{label} · {score}/100</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold tracking-widest text-gray-600 uppercase">{label}</p>
        <Icon className={`w-3.5 h-3.5 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function ConfigRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-white">{value}</span>
        {ok ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-gray-600" />}
      </div>
    </div>
  );
}

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  async function load() {
    setLoading(true);
    const d = await api.get<TenantDetail>(`/platform/network/${id}`).catch(() => null);
    setTenant(d);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function setStatus(status: string) {
    if (!tenant) return;
    setUpdating(true);
    await api.patch(`/platform/network/${id}/status`, { status }).catch(() => {});
    await load();
    setUpdating(false);
  }

  async function setPlan(plan: string) {
    if (!tenant) return;
    setUpdating(true);
    await api.patch(`/platform/network/${id}/plan`, { plan }).catch(() => {});
    await load();
    setUpdating(false);
  }

  if (loading) {
    return <div className="min-h-screen bg-[#050a14] flex items-center justify-center"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div>;
  }

  if (!tenant) {
    return <div className="min-h-screen bg-[#050a14] flex items-center justify-center text-gray-500 text-sm">Empresa no encontrada</div>;
  }

  const humans = tenant.team_slots.filter(s => s.type === 'HUMAN');
  const agents = tenant.team_slots.filter(s => s.type === 'AI_AGENT');

  return (
    <div className="min-h-screen bg-[#050a14] p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">{tenant.name}</h1>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${PLAN_BADGE[tenant.plan] ?? PLAN_BADGE.starter}`}>{tenant.plan}</span>
            <span className={`text-[10px] font-medium ${tenant.status === 'active' ? 'text-emerald-400' : 'text-red-400'}`}>● {tenant.status}</span>
          </div>
          {tenant.tagline && <p className="text-xs text-gray-500 mt-0.5">{tenant.tagline}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load()} disabled={updating} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${updating ? 'animate-spin' : ''}`} />
          </button>
          {tenant.status === 'active' ? (
            <button onClick={() => setStatus('suspended')} disabled={updating}
              className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/20 transition-colors">
              Suspender
            </button>
          ) : (
            <button onClick={() => setStatus('active')} disabled={updating}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/20 transition-colors">
              Activar
            </button>
          )}
          <select value={tenant.plan} onChange={e => setPlan(e.target.value)} disabled={updating}
            className="bg-[#0a0f1e] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-400 focus:outline-none focus:border-indigo-500">
            {['starter', 'professional', 'enterprise', 'internal'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        <div className="col-span-2 sm:col-span-4 lg:col-span-2 bg-[#0a0f1e] border border-white/5 rounded-xl p-4">
          <HealthBar score={tenant.health.score} label={tenant.health.label} />
          <div className="grid grid-cols-2 gap-2 mt-3">
            {[
              { label: 'Humanos', value: tenant.health.active_humans },
              { label: 'Agentes', value: tenant.health.active_agents },
              { label: 'Completadas', value: tenant.health.completed_today },
              { label: 'Vencidas', value: tenant.health.overdue_tasks },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-lg font-bold text-white">{value}</p>
                <p className="text-[9px] text-gray-600">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <StatCard label="Team" value={tenant._count.team_slots} icon={Users} color="text-blue-400" />
        <StatCard label="Brain" value={tenant._count.brain_documents} icon={Brain} color="text-amber-400" />
        <StatCard label="Chats" value={tenant._count.agent_conversations} icon={MessageSquare} color="text-pink-400" />
        <StatCard label="Contactos" value={tenant._count.contacts} icon={Building2} color="text-violet-400" />
        <StatCard label="Deals abiertos" value={tenant.open_deals} icon={Activity} color="text-indigo-400" />
        <StatCard label="Pipeline MXN" value={`$${(tenant.pipeline_value || 0).toLocaleString()}`} icon={DollarSign} color="text-emerald-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Equipo */}
        <div className="bg-[#0a0f1e] border border-white/5 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Equipo humano</h3>
          {humans.length === 0 ? (
            <p className="text-xs text-gray-600">Sin usuarios humanos</p>
          ) : (
            <div className="space-y-2">
              {humans.map(s => (
                <div key={s.id} className="flex items-center gap-3 py-1.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600/40 to-violet-600/40 flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-indigo-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white">{s.name}</p>
                    <p className="text-[10px] text-gray-600 truncate">{s.email ?? s.role}</p>
                  </div>
                  <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 border border-white/5">{s.role}</span>
                </div>
              ))}
            </div>
          )}

          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-5 mb-4">Agentes IA</h3>
          {agents.length === 0 ? (
            <p className="text-xs text-gray-600">Sin agentes</p>
          ) : (
            <div className="space-y-2">
              {agents.map(s => (
                <div key={s.id} className="flex items-center gap-3 py-1.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-600/30 to-teal-600/30 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white">{s.name}</p>
                    <p className="text-[10px] text-gray-600">{s.agent_role ?? 'agent'}</p>
                  </div>
                  <span className={`ml-auto text-[9px] w-1.5 h-1.5 rounded-full ${s.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Atlas + Onboarding */}
        <div className="space-y-4">
          <div className="bg-[#0a0f1e] border border-white/5 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Atlas — Secretario</h3>
            {tenant.secretary_config ? (
              <>
                <ConfigRow label="Estado" value={tenant.secretary_config.enabled ? 'Activo' : 'Inactivo'} ok={tenant.secretary_config.enabled} />
                <ConfigRow label="WhatsApp" value={tenant.secretary_config.owner_phone || '—'} ok={!!tenant.secretary_config.owner_phone} />
                <ConfigRow label="Morning Brief" value={tenant.secretary_config.morning_brief_enabled ? `${tenant.secretary_config.morning_brief_time}` : 'Desactivado'} ok={tenant.secretary_config.morning_brief_enabled} />
              </>
            ) : (
              <p className="text-xs text-gray-600">Sin configurar — pendiente onboarding Cap 0</p>
            )}
          </div>

          <div className="bg-[#0a0f1e] border border-white/5 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Onboarding</h3>
            {tenant.onboarding ? (
              <>
                <ConfigRow label="Progreso" value={`${tenant.onboarding.steps_completed.length} / 6 pasos`} ok={!!tenant.onboarding.completed_at} />
                <ConfigRow label="Completado" value={tenant.onboarding.completed_at ? new Date(tenant.onboarding.completed_at).toLocaleDateString('es-MX') : 'En progreso'} ok={!!tenant.onboarding.completed_at} />
              </>
            ) : (
              <p className="text-xs text-gray-600">Sin iniciar</p>
            )}
          </div>
        </div>

        {/* Billing */}
        <div className="bg-[#0a0f1e] border border-white/5 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Facturación</h3>
          {tenant.billing_config ? (
            <>
              <ConfigRow label="Estado" value={tenant.billing_config.enabled ? 'Configurado' : 'Pendiente'} ok={tenant.billing_config.enabled} />
              <ConfigRow label="RFC" value={tenant.billing_config.rfc || '—'} ok={!!tenant.billing_config.rfc} />
              <ConfigRow label="Facturapi" value={tenant.billing_config.facturapi_org_id ? 'Conectado' : '—'} ok={!!tenant.billing_config.facturapi_org_id} />
              <ConfigRow label="Stripe" value={tenant.billing_config.stripe_account_id ? 'Conectado' : '—'} ok={!!tenant.billing_config.stripe_account_id} />
            </>
          ) : (
            <p className="text-xs text-gray-600">Sin configurar</p>
          )}

          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-5 mb-3">Datos</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-gray-500">Alta</span><span className="text-white">{new Date(tenant.created_at).toLocaleDateString('es-MX')}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Slug</span><span className="text-gray-400 font-mono">{tenant.slug}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">ID</span><span className="text-gray-600 font-mono text-[10px] truncate max-w-[120px]">{tenant.id}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">MRR</span><span className="text-emerald-400 font-medium">${(tenant.mrr || 0).toLocaleString()}/mes</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
