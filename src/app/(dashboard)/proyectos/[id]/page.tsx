'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Sparkles, RefreshCw, Loader2, Clock, CheckCircle2, FileDown, Edit3, Save, X, FileText } from 'lucide-react';

interface Requirement {
  id: string;
  folio: string;
  title: string;
  status: string;
  doc_type: string;
  doc_version: string;
  intake_source: string;
  requested_by: string | null;
  requested_by_email: string | null;
  responsible_systems: string | null;
  responsible_business: string | null;
  current_situation: string | null;
  problem_statement: string | null;
  objective: string | null;
  business_policies: string | null;
  related_systems: string | null;
  sisec_integrations: any[] | null;
  event_triggers: any[] | null;
  libreta_notes: string | null;
  committed_dates: string | null;
  scope: string | null;
  out_of_scope: string | null;
  assumptions: string | null;
  constraints: string | null;
  estimated_effort_days: number | null;
  estimated_duration: string | null;
  created_at: string;
  ai_generated_doc: any;
  pm_slot: { name: string } | null;
  history: { id: string; action: string; to_value: string | null; notes: string | null; created_at: string; slot: { name: string } | null }[];
}

const STATUS_OPTIONS = ['BORRADOR','EN_REVISION','APROBADO','EN_DESARROLLO','EN_PRUEBAS','LISTO','CANCELADO'];
const STATUS_LABEL: Record<string, string> = {
  BORRADOR: 'Borrador', EN_REVISION: 'En revisión', APROBADO: 'Aprobado',
  EN_DESARROLLO: 'En desarrollo', EN_PRUEBAS: 'En pruebas', LISTO: 'Listo', CANCELADO: 'Cancelado',
};
const STATUS_COLOR: Record<string, string> = {
  BORRADOR: '#6b7280', EN_REVISION: '#d97706', APROBADO: '#059669',
  EN_DESARROLLO: '#2566e8', EN_PRUEBAS: '#7c3aed', LISTO: '#059669', CANCELADO: '#dc2626',
};
const ACTION_LABEL: Record<string, string> = {
  created: 'Creado', status_changed: 'Estado cambiado', ai_generated: 'IA generó documento',
  edited: 'Editado', doc_exported: 'Exportado',
};

function Section({ title, content, empty = '(vacío)' }: { title: string; content: string | null | undefined; empty?: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{title}</h3>
      {content ? (
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{content}</p>
      ) : (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic' }}>{empty}</p>
      )}
    </div>
  );
}

export default function RequirementDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [req, setReq]       = useState<Requirement | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [genDone, setGenDone] = useState(false);
  const [tab, setTab] = useState<'doc' | 'datos' | 'historial'>('doc');

  useEffect(() => { load(); }, [id]);

  // Auto-generar si viene de un intake (?generate=true)
  useEffect(() => {
    if (!req || generating) return;
    if (searchParams.get('generate') === 'true') {
      router.replace(`/proyectos/${id}`);
      generate();
    }
  }, [req]);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<Requirement>(`/proyectos-soc/requirements/${id}`);
      setReq(data);
    } catch { router.push('/proyectos'); }
    finally { setLoading(false); }
  }

  async function generate() {
    setGenerating(true);
    try {
      const data = await api.post<Requirement>(`/proyectos-soc/requirements/${id}/generate`, { include_rules: true });
      setReq((prev) => ({ ...prev!, ...data }));
      setGenDone(true);
      setTimeout(() => setGenDone(false), 3000);
    } finally { setGenerating(false); }
  }

  async function changeStatus(status: string) {
    setStatusLoading(true);
    try {
      await api.patch(`/proyectos-soc/requirements/${id}/status`, { status });
      setReq((prev) => prev ? { ...prev, status } : prev);
    } finally { setStatusLoading(false); }
  }

  function openDocument() {
    const html = (req as any)?.ai_generated_doc?.html;
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-3)' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (!req) return null;

  const sc = STATUS_COLOR[req.status] ?? '#6b7280';

  return (
    <div style={{ padding: '28px 32px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 24 }}>
        <button onClick={() => router.push('/proyectos')} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center', marginTop: 2 }}>
          <ArrowLeft size={14} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-3)', fontWeight: 700 }}>{req.folio}</span>
            <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700, background: `${sc}20`, color: sc }}>{STATUS_LABEL[req.status]}</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>v{req.doc_version}</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.3 }}>{req.title}</h1>
        </div>

        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <select
            value={req.status}
            onChange={(e) => changeStatus(e.target.value)}
            disabled={statusLoading}
            style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>

          <button
            onClick={generate}
            disabled={generating}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 9, border: 'none', background: genDone ? '#059669' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: generating ? 'wait' : 'pointer', opacity: generating ? 0.8 : 1 }}
          >
            {generating ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : genDone ? <CheckCircle2 size={13} /> : <Sparkles size={13} />}
            {generating ? 'Generando…' : genDone ? '¡Listo!' : 'Generar con IA'}
          </button>

          {req?.ai_generated_doc?.html && (
            <button
              onClick={openDocument}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <FileText size={13} />
              Ver Documento
            </button>
          )}
        </div>
      </div>

      {/* Meta strip */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 24, fontSize: 12, color: 'var(--text-2)', flexWrap: 'wrap' }}>
        {req.requested_by && <span>Solicitado por: <strong style={{ color: 'var(--text)' }}>{req.requested_by}</strong></span>}
        {req.pm_slot && <span>PM: <strong style={{ color: 'var(--text)' }}>{req.pm_slot.name}</strong></span>}
        {req.responsible_systems && <span>Sistemas: <strong style={{ color: 'var(--text)' }}>{req.responsible_systems}</strong></span>}
        {req.responsible_business && <span>Negocio: <strong style={{ color: 'var(--text)' }}>{req.responsible_business}</strong></span>}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {new Date(req.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {(['doc', 'datos', 'historial'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ padding: '8px 16px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t ? 700 : 500, background: tab === t ? 'var(--surface)' : 'transparent', color: tab === t ? 'var(--fd-cyan)' : 'var(--text-2)', borderBottom: tab === t ? '2px solid var(--fd-cyan)' : '2px solid transparent', marginBottom: -1 }}
          >
            {t === 'doc' ? 'Documento ISO' : t === 'datos' ? 'Datos SISEC' : 'Historial'}
          </button>
        ))}
      </div>

      {/* Generando banner */}
      {generating && (
        <div style={{ marginBottom: 20, padding: '14px 20px', borderRadius: 10, background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(79,70,229,0.05))', border: '1px solid rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: '#7c3aed', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>El agente IA está completando el documento R-ISO…</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>Usa las respuestas del paquete de confirmación para rellenar todas las secciones. Toma ~30 segundos.</div>
          </div>
        </div>
      )}

      {/* Doc tab */}
      {tab === 'doc' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 28 }}>
            <Section title="1. Situación Actual" content={req.current_situation} />
            <Section title="Planteamiento del Problema" content={req.problem_statement} />
            <div style={{ height: 1, background: 'var(--border)', margin: '20px 0' }} />
            <Section title="3. Objetivo" content={req.objective} />
            <div style={{ height: 1, background: 'var(--border)', margin: '20px 0' }} />
            <Section title="4. Políticas y Reglas de Negocio" content={req.business_policies} />
            <div style={{ height: 1, background: 'var(--border)', margin: '20px 0' }} />
            <Section title="5. Sistemas Relacionados" content={req.related_systems} />
            <div style={{ height: 1, background: 'var(--border)', margin: '20px 0' }} />
            <Section title="Libreta Digital (datos del asesor)" content={req.libreta_notes} />
            <div style={{ height: 1, background: 'var(--border)', margin: '20px 0' }} />
            <Section title="7. Compromisos y Fechas" content={req.committed_dates} />
            <div style={{ height: 1, background: 'var(--border)', margin: '20px 0' }} />
            <Section title="Alcance" content={req.scope} />
            <Section title="Fuera de Alcance" content={req.out_of_scope} />
            <Section title="Supuestos" content={req.assumptions} />
            <Section title="Restricciones" content={req.constraints} />
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Planeación</h3>
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
                {req.estimated_duration && <p style={{ margin: '0 0 6px' }}>Duración: <strong style={{ color: 'var(--text)' }}>{req.estimated_duration}</strong></p>}
                {req.estimated_effort_days && <p style={{ margin: '0 0 6px' }}>Esfuerzo: <strong style={{ color: 'var(--text)' }}>{req.estimated_effort_days} días</strong></p>}
                {!req.estimated_duration && !req.estimated_effort_days && <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-3)', fontSize: 12 }}>No estimado aún</p>}
              </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(79,70,229,0.05))', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12, padding: 18 }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Agente IA</h3>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                Completa automáticamente todas las secciones usando las reglas de negocio activas de SOC como contexto.
              </p>
              <button
                onClick={generate}
                disabled={generating}
                style={{ width: '100%', padding: '8px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 600, cursor: generating ? 'wait' : 'pointer' }}
              >
                {generating ? 'Generando…' : 'Generar con IA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Datos SISEC tab */}
      {tab === 'datos' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Integración SISEC</h2>
          {req.sisec_integrations && req.sisec_integrations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {req.sisec_integrations.map((item: any, i: number) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: 12, padding: 14, borderRadius: 9, background: 'var(--surface-2)', fontSize: 13 }}>
                  <div><strong>{item.data_name}</strong></div>
                  <div><span style={{ padding: '2px 7px', borderRadius: 5, fontSize: 11, background: 'rgba(29,189,240,0.12)', color: 'var(--fd-cyan)' }}>{item.direction}</span></div>
                  <div style={{ color: 'var(--text-2)' }}>{item.sync_frequency}</div>
                  <div style={{ color: 'var(--text-2)', fontSize: 12 }}>{item.fallback_behavior ?? '—'}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-3)' }}>
              <p style={{ fontSize: 14, margin: '0 0 10px' }}>Sin datos SISEC definidos aún.</p>
              <p style={{ fontSize: 12, margin: 0 }}>Usa "Generar con IA" para que el agente identifique qué datos provienen de SISEC.</p>
            </div>
          )}

          {req.event_triggers && req.event_triggers.length > 0 && (
            <>
              <h2 style={{ margin: '24px 0 16px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Disparadores de Evento</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {req.event_triggers.map((ev: any, i: number) => (
                  <div key={i} style={{ padding: 14, borderRadius: 9, background: 'var(--surface-2)', fontSize: 13 }}>
                    <strong>{ev.action}</strong>
                    {ev.condition && <span style={{ color: 'var(--text-2)', marginLeft: 8 }}>cuando {ev.condition}</span>}
                    {ev.target_field && <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}>Actualiza: {ev.target_field} → {ev.new_value}</div>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Historial tab */}
      {tab === 'historial' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
          {req.history.length === 0 ? (
            <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Sin historial aún.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {req.history.map((h) => (
                <div key={h.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--fd-cyan)', marginTop: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                      {ACTION_LABEL[h.action] ?? h.action}
                      {h.to_value && <span style={{ fontWeight: 400, color: 'var(--text-2)' }}> → {STATUS_LABEL[h.to_value] ?? h.to_value}</span>}
                    </div>
                    {h.notes && <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-2)' }}>{h.notes}</p>}
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
                      {h.slot?.name ?? 'Sistema'} · {new Date(h.created_at).toLocaleString('es-MX')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
