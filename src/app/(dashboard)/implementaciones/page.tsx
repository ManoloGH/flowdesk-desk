'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Plus, ChevronRight, Clock, CheckCircle2, PauseCircle, XCircle, Loader2 } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Implementation {
  id: string;
  client_name: string;
  phase: number;
  status: 'in_progress' | 'completed' | 'paused' | 'cancelled';
  started_at: string;
  completed_at: string | null;
  client_info: any;
  _count: { check_items: number; notes: number; files: number };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PHASE_NAMES = [
  'Diagnóstico',
  'Diseño del ecosistema',
  'Provisioning técnico',
  'Equipo humano',
  'Agentes IA',
  'Verificación',
  'Entrega',
];

const STATUS_CONFIG = {
  in_progress: { label: 'En curso',    Icon: Clock,         color: '#3b82f6' },
  completed:   { label: 'Completado',  Icon: CheckCircle2,  color: '#22c55e' },
  paused:      { label: 'Pausado',     Icon: PauseCircle,   color: '#f59e0b' },
  cancelled:   { label: 'Cancelado',   Icon: XCircle,       color: '#ef4444' },
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ImplementacionesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Implementation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIndustry, setNewIndustry] = useState('');

  const load = async () => {
    try {
      const data = await api.get<Implementation[]>('/implementations');
      setItems(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const impl = await api.post<Implementation>('/implementations', {
        client_name: newName.trim(),
        client_info: { industry: newIndustry.trim() || undefined },
      });
      router.push(`/implementaciones/${impl.id}`);
    } catch {
      setCreating(false);
    }
  };

  const active   = items.filter(i => i.status === 'in_progress');
  const done     = items.filter(i => i.status === 'completed');
  const paused   = items.filter(i => ['paused', 'cancelled'].includes(i.status));

  return (
    <div style={{ padding: '36px 48px', maxWidth: 900 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fd-cyan)', marginBottom: 6 }}>
            MentorIA · Protocolo FlowDesk
          </p>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>
            Implementaciones
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-2)' }}>
            Lleva a cada cliente paso a paso por las 7 fases del ecosistema digital.
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'var(--fd-cyan)', border: 'none', borderRadius: 10, color: '#000', fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          <Plus size={15} /> Nueva implementación
        </button>
      </div>

      {/* New implementation modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line2)', borderRadius: 16, padding: 32, width: 440 }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Nueva implementación</h2>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Nombre del cliente *</label>
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Ej: Distribuidora Torres S.A."
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--line2)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text)', outline: 'none', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Industria (opcional)</label>
              <input
                value={newIndustry}
                onChange={e => setNewIndustry(e.target.value)}
                placeholder="Ej: Distribución, Construcción, Retail..."
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--line2)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text)', outline: 'none', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                style={{ flex: 1, padding: '10px', background: 'var(--fd-cyan)', border: 'none', borderRadius: 9, color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: "'Inter', sans-serif" }}
              >
                {creating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                {creating ? 'Creando...' : 'Crear implementación →'}
              </button>
              <button
                onClick={() => { setShowNew(false); setNewName(''); setNewIndustry(''); }}
                style={{ padding: '10px 16px', background: 'var(--surface2)', border: '1px solid var(--line)', borderRadius: 9, color: 'var(--text-2)', fontSize: 13, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Loader2 size={24} style={{ color: 'var(--fd-cyan)', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--line)' }}>
          <p style={{ fontSize: 36, margin: '0 0 12px' }}>🚀</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: '0 0 6px' }}>Sin implementaciones activas</p>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 24px' }}>Crea la primera implementación para comenzar a guiar a un cliente.</p>
          <button onClick={() => setShowNew(true)} style={{ padding: '10px 22px', background: 'var(--fd-cyan)', border: 'none', borderRadius: 10, color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
            + Nueva implementación
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {[
            { label: 'En curso', list: active },
            { label: 'Pausadas', list: paused },
            { label: 'Completadas', list: done },
          ].filter(g => g.list.length > 0).map(group => (
            <div key={group.label}>
              <p style={{ margin: '0 0 12px', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{group.label} · {group.list.length}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {group.list.map(impl => {
                  const sc = STATUS_CONFIG[impl.status];
                  const started = new Date(impl.started_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
                  return (
                    <div
                      key={impl.id}
                      onClick={() => router.push(`/implementaciones/${impl.id}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, cursor: 'pointer', transition: 'border-color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--line2)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line)')}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,212,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: 'var(--fd-cyan)', flexShrink: 0 }}>
                        {impl.client_name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{impl.client_name}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-3)' }}>
                          {impl.client_info?.industry ? `${impl.client_info.industry} · ` : ''}Iniciado {started}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--fd-cyan)' }}>
                            Fase {impl.phase}/6
                          </p>
                          <p style={{ margin: '1px 0 0', fontSize: 10, color: 'var(--text-3)' }}>{PHASE_NAMES[impl.phase]}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: `${sc.color}18`, border: `1px solid ${sc.color}30` }}>
                          <sc.Icon size={10} style={{ color: sc.color }} />
                          <span style={{ fontSize: 10, color: sc.color, fontWeight: 600 }}>{sc.label}</span>
                        </div>
                        <ChevronRight size={14} style={{ color: 'var(--text-3)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
