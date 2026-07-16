'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { RefreshCw, ExternalLink, ChevronRight, DollarSign, Users, CheckCircle, Clock } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Cliente {
  id: string;
  empresa: string;
  contacto_nombre: string;
  contacto_cargo: string;
  industria: string;
  tamano: string;
  status: 'activo' | 'inactivo';
  ejecutivo_asignado: string;
  fecha_inicio: string;
  precio: number;
  fase_actual: 0 | 1 | 2 | 3;
  areas_diagnosticadas: string[];
  notas: string;
  _count?: { hallazgos: number; plan: number; sesiones: number };
}

// ── Methodology phases ────────────────────────────────────────────────────────
const PHASES = [
  {
    num: 0, label: 'Mapeo técnico', duracion: '2 semanas', color: '#6c4de6', icon: '🗺️',
    descripcion: 'Entendimiento profundo del negocio: herramientas, procesos AS-IS y hallazgos clave.',
    entregables: ['Accesos recibidos', 'Inventario de herramientas', 'Sesión de discovery', 'BPMNs AS-IS', 'Hallazgos documentados'],
  },
  {
    num: 1, label: 'Quick Wins', duracion: '4 semanas', color: '#f59e0b', icon: '⚡',
    descripcion: 'Primeras automatizaciones de alto impacto y entrega del diagnóstico completo.',
    entregables: ['Cuestionarios de diagnóstico', 'Matriz de impacto', '3 automatizaciones implementadas', 'Informe de diagnóstico'],
  },
  {
    num: 2, label: 'Expansión', duracion: '8 semanas', color: '#3b82f6', icon: '📈',
    descripcion: 'Implementación del ecosistema completo: CRM, agente IA, dashboards y capacitación.',
    entregables: ['BPMNs TO-BE', 'CRM configurado', 'Agente IA activo', 'Dashboard de métricas', 'Capacitación al equipo'],
  },
  {
    num: 3, label: 'Optimización', duracion: 'Ongoing', color: '#22c55e', icon: '🔧',
    descripcion: 'Revisión mensual, ajustes continuos y búsqueda de nuevas oportunidades de mejora.',
    entregables: ['Revisión mensual de métricas', 'Ajustes y mejoras', 'Nuevas oportunidades', 'Evaluación de renovación'],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt$(n: number) { return '$' + n.toLocaleString('es-MX') + ' MXN'; }
function fmtFecha(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

const MOCK_CLIENTES: Cliente[] = [
  {
    id: 'c-primer', empresa: 'LogiMex SA de CV', contacto_nombre: 'Carlos Torres',
    contacto_cargo: 'Director de Operaciones', industria: 'Logística', tamano: '10-100',
    status: 'activo', ejecutivo_asignado: 'Manolo', fecha_inicio: '2026-06-01',
    precio: 30000, fase_actual: 1, areas_diagnosticadas: ['ventas', 'operaciones'], notas: '',
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ConsultoriaPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Cliente[]>('/mentoria/clientes?status=activo');
      setClientes(Array.isArray(data) ? data : []);
    } catch {
      setClientes(MOCK_CLIENTES);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const byPhase = (num: number) => clientes.filter(c => c.fase_actual === num);
  const mrr = clientes.reduce((a, c) => a + c.precio, 0);
  const avgPhase = clientes.length
    ? (clientes.reduce((a, c) => a + c.fase_actual, 0) / clientes.length).toFixed(1)
    : '—';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '22px 28px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#6c4de6,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🎓</div>
            <div>
              <h1 style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)' }}>Consultoría · MentorIA Systems</h1>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>Metodología de implementación — 4 fases</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={load} style={btnGhost}><RefreshCw size={13} /></button>
            <button onClick={() => router.push('/mentoria')} style={{ ...btnGhost, fontSize: 12, gap: 6, display: 'flex', alignItems: 'center' }}>
              <ExternalLink size={12} /> Ver CRM
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[
            { icon: <Users size={13} />, label: 'Clientes activos', value: clientes.length, color: '#6c4de6' },
            { icon: <DollarSign size={13} />, label: 'MRR total', value: fmt$(mrr), color: '#f59e0b' },
            { icon: <Clock size={13} />, label: 'Fase promedio', value: avgPhase === '—' ? '—' : `Fase ${avgPhase}`, color: '#3b82f6' },
            { icon: <CheckCircle size={13} />, label: 'En Optimización', value: byPhase(3).length, color: '#22c55e' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '11px 16px', flex: 1, display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ color: s.color }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Journey bar */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
          {PHASES.map((p, i) => (
            <div key={p.num} style={{ flex: 1, padding: '10px 14px', borderRight: i < 3 ? '1px solid var(--line)' : 'none', borderLeft: `3px solid ${p.color}`, cursor: 'pointer', transition: 'background 0.15s', background: expandedPhase === p.num ? `${p.color}10` : 'transparent' }}
              onClick={() => setExpandedPhase(expandedPhase === p.num ? null : p.num)}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: p.color, marginBottom: 2 }}>{p.icon} Fase {p.num} · {p.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{p.duracion}</span>
                <span style={{ background: `${p.color}20`, color: p.color, padding: '0 6px', borderRadius: 99, fontWeight: 700 }}>{byPhase(p.num).length} clientes</span>
              </div>
            </div>
          ))}
        </div>

        {/* Expanded phase detail */}
        {expandedPhase !== null && (() => {
          const p = PHASES[expandedPhase];
          return (
            <div style={{ background: `${p.color}08`, border: `1px solid ${p.color}30`, borderRadius: 10, padding: '14px 18px', marginBottom: 18, animation: 'fadeIn 0.15s ease' }}>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 10, lineHeight: 1.6 }}>{p.descripcion}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {p.entregables.map(e => (
                  <span key={e} style={{ fontSize: 11, background: 'var(--surface)', border: `1px solid ${p.color}40`, color: 'var(--text-2)', padding: '3px 10px', borderRadius: 99 }}>✓ {e}</span>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Kanban por fase */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid #6c4de6', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
          <div style={{ display: 'flex', gap: 14, padding: '4px 28px 20px', minWidth: 'max-content', alignItems: 'flex-start', height: '100%' }}>
            {PHASES.map(phase => {
              const items = byPhase(phase.num);
              return (
                <div key={phase.num} style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                  {/* Column header */}
                  <div style={{ borderRadius: 10, border: `1px solid ${phase.color}40`, borderTop: `3px solid ${phase.color}`, background: `${phase.color}08`, padding: '12px 14px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: phase.color }}>{phase.icon} {phase.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, background: `${phase.color}20`, color: phase.color, padding: '2px 8px', borderRadius: 99 }}>{items.length}</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{phase.duracion}</div>
                  </div>

                  {/* Client cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
                    {items.map(c => (
                      <ClienteCard key={c.id} c={c} color={phase.color} onClick={() => router.push(`/mentoria/${c.id}`)} />
                    ))}
                    {!items.length && (
                      <div style={{ height: 72, border: '1px dashed var(--line)', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <span style={{ fontSize: 18 }}>{phase.icon}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>Sin clientes en esta fase</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Client card ───────────────────────────────────────────────────────────────
function ClienteCard({ c, color, onClick }: { c: Cliente; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ width: '100%', background: 'var(--surface)', border: `1px solid ${color}30`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: '13px 14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}80`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}30`; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>{c.empresa}</div>
        <ChevronRight size={12} style={{ color: 'var(--text-3)', flexShrink: 0, marginTop: 2 }} />
      </div>
      {c.contacto_nombre && (
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>
          {c.contacto_nombre}{c.contacto_cargo ? ` · ${c.contacto_cargo}` : ''}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>${c.precio.toLocaleString('es-MX')}</span>
        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>Desde {fmtFecha(c.fecha_inicio)}</span>
      </div>
      {c.areas_diagnosticadas?.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {c.areas_diagnosticadas.map(a => (
            <span key={a} style={{ fontSize: 9, background: `${color}15`, color: color, padding: '2px 7px', borderRadius: 99, fontWeight: 600, textTransform: 'capitalize' }}>{a}</span>
          ))}
        </div>
      )}
    </button>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const btnGhost: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer' };
