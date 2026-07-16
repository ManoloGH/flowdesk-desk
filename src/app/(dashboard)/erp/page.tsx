'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { RefreshCw, ChevronRight, DollarSign, Users, TrendingUp } from 'lucide-react';

interface Cliente {
  id: string;
  empresa: string;
  contacto_nombre: string;
  contacto_cargo: string;
  industria: string;
  status: 'activo' | 'inactivo';
  ejecutivo_asignado: string;
  fecha_inicio: string;
  precio: number;
  fase_actual: 0 | 1 | 2 | 3;
  areas_diagnosticadas: string[];
}

const FASES = [
  { num: 0, label: 'Mapeo técnico',  color: '#6c4de6', pct: 0 },
  { num: 1, label: 'Quick Wins',     color: '#f59e0b', pct: 33 },
  { num: 2, label: 'Expansión',      color: '#3b82f6', pct: 66 },
  { num: 3, label: 'Optimización',   color: '#22c55e', pct: 100 },
];

const WORKSPACE_TABS = ['Proyecto', 'Diagnósticos', 'Hallazgos', 'Plan de Acción', 'Sesiones', 'Facturación'];

function fmt$(n: number) { return '$' + n.toLocaleString('es-MX') + ' MXN'; }
function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

const MOCK: Cliente[] = [
  {
    id: 'c-primer', empresa: 'LogiMex SA de CV', contacto_nombre: 'Carlos Torres',
    contacto_cargo: 'Director de Operaciones', industria: 'Logística', status: 'activo',
    ejecutivo_asignado: 'Manolo', fecha_inicio: '2026-06-01',
    precio: 30000, fase_actual: 1, areas_diagnosticadas: ['ventas', 'operaciones'],
  },
];

export default function ErpPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Cliente[]>('/mentoria/clientes?status=activo');
      setClientes(Array.isArray(data) ? data : []);
    } catch {
      setClientes(MOCK);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const mrr = clientes.reduce((a, c) => a + c.precio, 0);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      <div style={{ padding: '22px 28px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#6c4de6,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🎓</div>
            <div>
              <h1 style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)' }}>ERP · MentorIA Systems</h1>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>Clientes en implementación activa</p>
            </div>
          </div>
          <button onClick={load} style={btnGhost}><RefreshCw size={13} /></button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {[
            { icon: <Users size={13} />, label: 'Clientes activos', value: clientes.length, color: '#6c4de6' },
            { icon: <DollarSign size={13} />, label: 'MRR total', value: fmt$(mrr), color: '#f59e0b' },
            { icon: <TrendingUp size={13} />, label: 'Fase promedio', value: clientes.length ? `Fase ${(clientes.reduce((a,c) => a + c.fase_actual, 0) / clientes.length).toFixed(1)}` : '—', color: '#3b82f6' },
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
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid #6c4de6', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : !clientes.length ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 32 }}>🎓</span>
          <p style={{ fontSize: 14, color: 'var(--text-3)', textAlign: 'center' }}>Sin clientes en implementación.<br />Convierte un prospecto desde el CRM.</p>
          <button onClick={() => router.push('/mentoria')} style={btnPrimary}>Ir al CRM →</button>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {clientes.map(c => {
              const fase = FASES[c.fase_actual];
              return (
                <button key={c.id} onClick={() => router.push(`/mentoria/${c.id}`)}
                  style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 13, padding: 0, cursor: 'pointer', textAlign: 'left', overflow: 'hidden', transition: 'border-color 0.15s, transform 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = fase.color + '80'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                >
                  <div style={{ height: 4, background: 'var(--line)' }}>
                    <div style={{ height: '100%', width: fase.pct + '%', background: fase.color, transition: 'width 0.4s' }} />
                  </div>
                  <div style={{ padding: '16px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{c.empresa}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.industria}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: `${fase.color}20`, color: fase.color, border: `1px solid ${fase.color}40`, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 8 }}>
                        Fase {c.fase_actual} · {fase.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12 }}>
                      {c.contacto_nombre}{c.contacto_cargo ? ` · ${c.contacto_cargo}` : ''}
                    </div>
                    {c.areas_diagnosticadas?.length > 0 && (
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                        {c.areas_diagnosticadas.map(a => (
                          <span key={a} style={{ fontSize: 10, background: `${fase.color}15`, color: fase.color, padding: '2px 8px', borderRadius: 99, fontWeight: 600, textTransform: 'capitalize' }}>✓ {a}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
                      {WORKSPACE_TABS.map(tab => (
                        <span key={tab} style={{ fontSize: 9, color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--line)', padding: '2px 7px', borderRadius: 5 }}>{tab}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{fmt$(c.precio)}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: fase.color, fontWeight: 600 }}>
                        Abrir workspace <ChevronRight size={12} />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const btnGhost: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer' };
const btnPrimary: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8, border: 'none', background: '#6c4de6', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
