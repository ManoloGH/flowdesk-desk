'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ArrowLeft, Building2, Users, Brain, MessageSquare, CheckCircle, XCircle,
  Phone, FileText, DollarSign, Bot, User, Loader2, RefreshCw, Activity,
  Server, Download, PackageOpen, AlertTriangle,
} from 'lucide-react';

interface TeamSlotRow {
  id: string; name: string; email: string | null; role: string; type: string; status: string; agent_role: string | null;
}

interface ExportStat { table: string; count: number }

interface MigrationBundle {
  tenant_name: string;
  tenant_slug: string;
  docker_compose: string;
  env_content: string;
  setup_sh: string;
  install_md: string;
  data_sql: string;
  export_stats: ExportStat[];
  generated_at: string;
}

interface TenantDetail {
  id: string; name: string; slug: string; plan: string; status: string;
  account_type: string; mission: string | null; tagline: string | null;
  created_at: string; mrr: number;
  migration_status: string | null; migration_at: string | null; self_hosted_url: string | null;
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
  nano:         'bg-gray-700/50 text-gray-400 border-gray-600/30',
  small:        'bg-sky-500/20 text-sky-300 border-sky-500/30',
  medium:       'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  large:        'bg-violet-500/20 text-violet-300 border-violet-500/30',
  enterprise:   'bg-amber-500/20 text-amber-300 border-amber-500/30',
  starter:      'bg-gray-700/50 text-gray-400 border-gray-600/30',
  professional: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  internal:     'bg-gray-800 text-gray-600 border-gray-700/30',
};

const PLAN_LABEL: Record<string, string> = {
  nano: '-10', small: '10–50', medium: '50–100', large: '+100', enterprise: '+1000',
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
  const [migrating, setMigrating] = useState(false);
  const [bundle, setBundle] = useState<MigrationBundle | null>(null);

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

  async function setAccountType(account_type: string) {
    if (!tenant) return;
    setUpdating(true);
    await api.patch(`/platform/network/${id}/account-type`, { account_type }).catch(() => {});
    await load();
    setUpdating(false);
  }

  async function generateMigrationBundle() {
    setMigrating(true);
    try {
      const result = await api.post<MigrationBundle>(`/platform/network/${id}/migration-bundle`, {});
      setBundle(result);
      await load();
    } catch {}
    setMigrating(false);
  }

  function downloadFile(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${PLAN_BADGE[tenant.plan] ?? PLAN_BADGE.nano}`}>{PLAN_LABEL[tenant.plan] ?? tenant.plan}</span>
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
          <select value={tenant.account_type} onChange={e => setAccountType(e.target.value)} disabled={updating}
            className="bg-[#0a0f1e] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-400 focus:outline-none focus:border-indigo-500">
            <option value="HOLDING">Clientes MentorIA</option>
            <option value="PARTNERSHIP">Partner MentorIA</option>
            <option value="DIRECT">Cliente FlowDesk</option>
          </select>
          <select value={tenant.plan} onChange={e => setPlan(e.target.value)} disabled={updating}
            className="bg-[#0a0f1e] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-400 focus:outline-none focus:border-indigo-500">
            <option value="nano">-10 empleados</option>
            <option value="small">10–50 empleados</option>
            <option value="medium">50–100 empleados</option>
            <option value="large">+100 empleados</option>
            <option value="enterprise">+1000 empleados</option>
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
            <div className="flex justify-between"><span className="text-gray-500">Ing. Mensual</span><span className="text-emerald-400 font-medium">${(tenant.mrr || 0).toLocaleString()}/mes</span></div>
          </div>
        </div>
      </div>

      {/* ── Migración a servidor propio ─────────────────────────────────────── */}
      <div className="mt-4 bg-[#0a0f1e] border border-white/5 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4 text-violet-400" />
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Migración a servidor propio</h3>
            {tenant.migration_status === 'bundle_generated' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">Bundle generado</span>
            )}
            {tenant.migration_status === 'migrated' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Migrado</span>
            )}
          </div>

          {!bundle && (
            <button
              onClick={generateMigrationBundle}
              disabled={migrating}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-xs font-medium border border-violet-500/20 transition-colors disabled:opacity-50"
            >
              {migrating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackageOpen className="w-3.5 h-3.5" />}
              {migrating ? 'Generando...' : 'Generar bundle de migración'}
            </button>
          )}
        </div>

        {!bundle && (
          <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/15 rounded-xl p-4">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-400 leading-relaxed">
              <p className="text-amber-300 font-medium mb-1">Genera una copia idéntica de FlowDesk para este cliente</p>
              <p>El bundle incluye <strong className="text-white">toda la infraestructura</strong> (docker-compose, .env con valores reales, script de instalación) <strong className="text-white">más una exportación completa de todos los datos</strong> en SQL listo para importar. El cliente instala en su servidor y queda 100% independiente.</p>
              {tenant.migration_at && (
                <p className="mt-2 text-gray-600">Último bundle: {new Date(tenant.migration_at).toLocaleDateString('es-MX')}</p>
              )}
            </div>
          </div>
        )}

        {bundle && (
          <div className="space-y-4">
            {/* Header del bundle */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500">
                  Generado el <strong className="text-white">{new Date(bundle.generated_at).toLocaleString('es-MX')}</strong>
                  {' · '}<strong className="text-white">{bundle.tenant_name}</strong>
                </p>
                {bundle.export_stats.length > 0 && (
                  <p className="text-[10px] text-gray-600 mt-1">
                    {bundle.export_stats.reduce((s, r) => s + r.count, 0).toLocaleString()} registros exportados
                    en {bundle.export_stats.length} tablas
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  const files = [
                    { c: bundle.docker_compose, n: 'docker-compose.yml' },
                    { c: bundle.env_content, n: `.env` },
                    { c: bundle.setup_sh, n: 'setup.sh' },
                    { c: bundle.install_md, n: 'INSTALL.md' },
                    { c: bundle.data_sql, n: `${bundle.tenant_slug}-data.sql` },
                  ];
                  files.forEach(f => setTimeout(() => downloadFile(f.c, f.n), 200));
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs border border-white/10 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar todo
              </button>
            </div>

            {/* Archivos individuales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                {
                  label: 'docker-compose.yml',
                  desc: 'Stack completo: API, frontend, PostgreSQL + pgvector, Redis',
                  content: bundle.docker_compose,
                  filename: 'docker-compose.yml',
                  color: 'text-cyan-400',
                  bg: 'bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/15',
                },
                {
                  label: '.env',
                  desc: 'Variables de entorno con valores reales del Vault + credenciales',
                  content: bundle.env_content,
                  filename: `.env`,
                  color: 'text-amber-400',
                  bg: 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15',
                },
                {
                  label: 'setup.sh',
                  desc: 'Script automatizado: levanta Docker, aplica schema, importa datos',
                  content: bundle.setup_sh,
                  filename: 'setup.sh',
                  color: 'text-violet-400',
                  bg: 'bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/15',
                },
                {
                  label: 'INSTALL.md',
                  desc: 'Guía paso a paso de instalación y configuración de dominio',
                  content: bundle.install_md,
                  filename: 'INSTALL.md',
                  color: 'text-emerald-400',
                  bg: 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15',
                },
                {
                  label: `${bundle.tenant_slug}-data.sql`,
                  desc: `Exportación completa de BD — ${bundle.export_stats.reduce((s, r) => s + r.count, 0).toLocaleString()} registros en ${bundle.export_stats.length} tablas`,
                  content: bundle.data_sql,
                  filename: `${bundle.tenant_slug}-data.sql`,
                  color: 'text-blue-400',
                  bg: 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15',
                },
              ].map(file => (
                <button key={file.filename} onClick={() => downloadFile(file.content, file.filename)}
                  className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-colors ${file.bg}`}>
                  <Download className={`w-4 h-4 ${file.color} flex-shrink-0 mt-0.5`} />
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold font-mono ${file.color} truncate`}>{file.label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{file.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Resumen de tablas exportadas */}
            {bundle.export_stats.length > 0 && (
              <details className="group">
                <summary className="text-[10px] text-gray-600 hover:text-gray-400 cursor-pointer transition-colors list-none">
                  Ver resumen de tablas exportadas
                </summary>
                <div className="mt-2 p-3 bg-white/[0.02] rounded-lg border border-white/5 flex flex-wrap gap-2">
                  {bundle.export_stats.map(s => (
                    <span key={s.table} className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-gray-500 font-mono">
                      {s.table}: {s.count.toLocaleString()}
                    </span>
                  ))}
                </div>
              </details>
            )}

            <button onClick={() => setBundle(null)} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
