'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import type { FocusBrief, FocusPriority } from './focus-types';
import { AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';

/* ── Design constants ── */
const CATEGORY_LABEL: Record<string, string> = {
  strategic: 'Estratégico',
  client:    'Cliente',
  team:      'Equipo',
  admin:     'Admin',
};

const CATEGORY_ACCENT: Record<string, string> = {
  strategic: 'var(--fd-purple)',
  client:    'var(--fd-cyan)',
  team:      'var(--fd-green)',
  admin:     'var(--text-3)',
};

const URGENCY_CONFIG: Record<string, {
  bg: string; border: string; text: string; label: string; shimmer: string;
}> = {
  critical: {
    bg:      'rgba(255, 71, 87, 0.12)',
    border:  'rgba(255, 71, 87, 0.30)',
    text:    'var(--fd-red)',
    label:   'Bloquea ingresos',
    shimmer: 'var(--fd-red)',
  },
  high: {
    bg:      'rgba(233, 30, 122, 0.12)',
    border:  'rgba(233, 30, 122, 0.30)',
    text:    'var(--fd-pink)',
    label:   'Alta prioridad',
    shimmer: 'var(--fd-pink)',
  },
  medium: {
    bg:      'rgba(29, 189, 240, 0.10)',
    border:  'rgba(29, 189, 240, 0.22)',
    text:    'var(--fd-cyan)',
    label:   'Prioridad media',
    shimmer: 'var(--fd-cyan)',
  },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/* ── Skeleton ── */
function Skeleton({ w, h, radius = 6 }: { w: string | number; h: number; radius?: number }) {
  return (
    <div className="fd-pulse" style={{
      width: w, height: h, borderRadius: radius,
      background: 'var(--surface-2)',
    }} />
  );
}

function FocusSkeleton() {
  return (
    <div style={{ padding: '28px clamp(28px, 4vw, 56px) 48px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton w={180} h={12} />
        <Skeleton w={460} h={32} radius={8} />
        <Skeleton w={280} h={14} />
      </div>
      <div style={{ height: 310, borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--line)' }} className="fd-pulse" />
      <div style={{ height: 16, width: 240, borderRadius: 6, background: 'var(--surface-2)' }} className="fd-pulse" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ height: 140, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--line)' }} className="fd-pulse" />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 24 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--fd-cyan)', borderTopColor: 'transparent' }} className="fd-spin" />
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.08em', margin: 0 }}>
          Ada analizando tu día...
        </p>
      </div>
    </div>
  );
}

/* ── Hero task card ── */
function HeroTask({
  priority, hero, onRefresh, refreshing,
}: {
  priority: FocusPriority;
  hero: FocusBrief['hero'];
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const urg = URGENCY_CONFIG[hero.urgency] ?? URGENCY_CONFIG.medium;

  const impactStats = [
    { k: hero.label ?? 'KSF principal', v: hero.value, gradient: true },
    { k: 'Tiempo estimado', v: String(priority.estimated_minutes), unit: 'min' },
    { k: 'Urgencia', v: hero.urgency === 'critical' ? 'Crítica' : hero.urgency === 'high' ? 'Alta' : 'Media', color: urg.text },
    { k: hero.ksf_name ? 'Factor KSF' : 'Impacto', v: priority.ksf_impact ?? '—' },
  ];

  return (
    <div style={{
      position: 'relative', overflow: 'hidden', borderRadius: 20,
      padding: '22px 26px 20px',
      background: `radial-gradient(circle at 90% 10%, ${urg.bg.replace('0.12', '0.15')}, transparent 40%), radial-gradient(circle at 5% 90%, rgba(29, 189, 240, 0.08), transparent 50%), var(--surface)`,
      border: `1px solid ${urg.border}`,
    }}>
      {/* Top shimmer line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${urg.shimmer}, transparent)`,
        opacity: 0.6,
      }} />

      {/* Priority badge + meta tags */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 11px', borderRadius: 999,
          background: urg.bg, border: `1px solid ${urg.border}`,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: urg.text, fontWeight: 600,
        }}>
          <span className="fd-flame" style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', boxShadow: `0 0 8px currentColor`, display: 'inline-block' }} />
          Prioridad 01 · {urg.label}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[CATEGORY_LABEL[priority.category] ?? priority.category, priority.ksf_impact].filter(Boolean).slice(0, 2).map((tag, i) => (
            <span key={i} style={{
              padding: '4px 9px', background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--line)', borderRadius: 6,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
              letterSpacing: '0.08em', color: 'var(--text-2)', textTransform: 'uppercase',
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Title */}
      <h2 style={{
        fontFamily: "'Inter Tight', sans-serif", fontWeight: 700,
        letterSpacing: '-0.03em', lineHeight: 1.02,
        fontSize: 'clamp(22px, 2.6vw, 32px)', color: 'var(--text)',
        maxWidth: '28ch', margin: 0,
      }}>
        {priority.title}
      </h2>

      {/* Why */}
      <p style={{
        fontFamily: "'Fraunces', serif", fontWeight: 400,
        fontSize: 14, letterSpacing: '-0.005em',
        color: 'var(--text-2)', lineHeight: 1.5, maxWidth: '62ch',
        marginTop: 10, marginBottom: 0,
      }}>
        {priority.why}
      </p>

      {/* Impact row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        margin: '14px 0', padding: '12px 0',
        borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)',
      }}>
        {impactStats.map((s, i) => (
          <div key={i} style={{ padding: '0 20px', borderLeft: i > 0 ? '1px solid var(--line)' : 'none' }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--text-3)', marginBottom: 6,
            }}>
              {s.k}
            </div>
            <div style={{
              fontFamily: "'Inter Tight', sans-serif", fontWeight: 700,
              letterSpacing: '-0.025em', lineHeight: 1, fontSize: 22,
              display: 'flex', alignItems: 'baseline', gap: 5,
              ...(s.gradient
                ? { background: 'linear-gradient(100deg, var(--fd-cyan), var(--fd-blue))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }
                : { color: (s as any).color ?? 'var(--text)' }),
            }}>
              {s.v}
              {(s as any).unit && (
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-3)', letterSpacing: 0 }}>
                  {(s as any).unit}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CTA row */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 10 }}>
        <Link
          href="/agents"
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px', borderRadius: 14, textDecoration: 'none', color: 'white',
            background: 'linear-gradient(100deg, var(--fd-cyan) 0%, var(--fd-blue) 60%, var(--fd-magenta) 130%)',
            boxShadow: '0 14px 30px -10px rgba(29, 189, 240, 0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
            transition: 'transform 0.2s',
            fontFamily: "'Inter Tight', sans-serif",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 10,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700,
            }}>F</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>Trabajar con Ada</div>
              <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.85, marginTop: 1 }}>
                Chat · acceso a todas las herramientas
              </div>
            </div>
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
            padding: '5px 9px', borderRadius: 5,
            background: 'rgba(255,255,255,0.18)', letterSpacing: '0.08em',
          }}>
            F
          </div>
        </Link>

        <button
          onClick={onRefresh}
          disabled={refreshing}
          style={{
            padding: '14px 16px', borderRadius: 14,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--line-strong)',
            color: 'var(--text)',
            fontFamily: "'Inter Tight', sans-serif", fontSize: 12, fontWeight: 500,
            cursor: refreshing ? 'not-allowed' : 'pointer',
            letterSpacing: '-0.01em', transition: 'background 0.15s',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
          onMouseEnter={e => { if (!refreshing) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; }}
        >
          <RefreshCw size={13} className={refreshing ? 'fd-spin' : ''} />
          {refreshing ? 'Generando...' : 'Regenerar'}
        </button>
      </div>
    </div>
  );
}

/* ── Priority card (after this) ── */
function PriorityCard({ p, index }: { p: FocusPriority; index: number }) {
  const [hov, setHov] = useState(false);
  const accent = CATEGORY_ACCENT[p.category] ?? 'var(--fd-cyan)';

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'var(--surface-2)' : 'var(--surface)',
        border: `1px solid ${hov ? 'var(--line-strong)' : 'var(--line)'}`,
        borderRadius: 14, padding: '16px 18px',
        display: 'flex', flexDirection: 'column', gap: 12,
        cursor: 'pointer',
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform 0.15s, background 0.15s, border-color 0.15s',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600,
          letterSpacing: '0.1em', color: 'var(--text-3)', textTransform: 'uppercase',
        }}>
          {String(index + 2).padStart(2, '0')} · {CATEGORY_LABEL[p.category] ?? p.category}
        </span>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: accent,
          boxShadow: hov ? `0 0 8px ${accent}` : 'none',
          transition: 'box-shadow 0.2s',
        }} />
      </div>

      <p style={{
        fontFamily: "'Inter Tight', sans-serif", fontSize: 14, fontWeight: 600,
        letterSpacing: '-0.02em', color: 'var(--text)', lineHeight: 1.25, margin: 0,
      }}>
        {p.title}
      </p>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto',
        paddingTop: 10, borderTop: '1px solid var(--line)',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
        color: 'var(--text-2)', letterSpacing: '0.04em',
      }}>
        {p.ksf_impact && (
          <span style={{ color: accent, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>
            {p.ksf_impact}
          </span>
        )}
        {p.estimated_minutes > 0 && (
          <>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-3)', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ flexShrink: 0 }}>~{p.estimated_minutes} min</span>
          </>
        )}
        <ArrowRight size={11} style={{ marginLeft: 'auto', color: 'var(--text-3)', flexShrink: 0 }} />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
export default function FocusModePage() {
  const { user } = useAuth();
  const [brief,      setBrief]      = useState<FocusBrief | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  function load(force = false) {
    if (force) setRefreshing(true); else setLoading(true);
    api.get<FocusBrief>(`/tenants/mine/focus-brief${force ? '?force=true' : ''}`)
      .then(data => { setBrief(data); setError(null); })
      .catch(() => setError('No se pudo generar el Focus Mode'))
      .finally(() => { setLoading(false); setRefreshing(false); });
  }

  useEffect(() => { load(); }, []);

  /* ── Loading ── */
  if (loading) return <FocusSkeleton />;

  /* ── Error ── */
  if (error || !brief) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <AlertCircle size={32} style={{ color: 'var(--fd-red)', display: 'block', margin: '0 auto 12px' }} />
          <p style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 14, color: 'var(--text-2)', margin: '0 0 16px' }}>
            {error ?? 'Error generando Focus Mode'}
          </p>
          <button
            onClick={() => load()}
            style={{
              padding: '9px 18px', borderRadius: 10,
              background: 'var(--surface)', border: '1px solid var(--line)',
              color: 'var(--text)', cursor: 'pointer',
              fontFamily: "'Inter Tight', sans-serif", fontSize: 13, fontWeight: 500,
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const heroPriority  = brief.priorities[0];
  const otherPriorities = brief.priorities.slice(1, 4);
  const firstName = user?.name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'usuario';
  const greeting  = getGreeting();

  /* ── Render ── */
  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        flex: 1, minHeight: 0,
        padding: '18px clamp(20px, 3.5vw, 48px)',
        display: 'flex', flexDirection: 'column', gap: 14,
        maxWidth: 1100, margin: '0 auto', width: '100%',
      }}>

        {/* ── Greeting ── */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
              letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)',
            }}>
              {brief.date}
            </span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-3)', display: 'inline-block' }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
              letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fd-cyan)',
            }}>
              Lista preparada por Ada
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Inter Tight', sans-serif", fontWeight: 700,
            letterSpacing: '-0.03em', lineHeight: 1.0,
            fontSize: 'clamp(24px, 2.8vw, 34px)', color: 'var(--text)', margin: 0,
          }}>
            {greeting},{' '}
            <span style={{
              background: 'linear-gradient(100deg, var(--fd-cyan), var(--fd-blue))',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            }}>
              {firstName}
            </span>
            .{' '}
            {heroPriority ? (
              <>Ada preparó tu día en torno a{' '}
                <em style={{ fontStyle: 'normal', color: 'var(--text)' }}>
                  {CATEGORY_LABEL[heroPriority.category] ?? heroPriority.category}.
                </em>
              </>
            ) : 'Ada preparó tu día.'}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 6 }}>
            <p style={{ fontFamily: "'Fraunces', serif", fontWeight: 400, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.4, margin: 0 }}>
              {brief.priorities.length > 0 ? (
                <><strong style={{ color: 'var(--text)', fontWeight: 500 }}>{brief.priorities.length} {brief.priorities.length === 1 ? 'prioridad' : 'prioridades'}</strong>. Ada maneja el resto.</>
              ) : 'No hay prioridades pendientes hoy.'}
            </p>
            {brief.momentum && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.06em' }}>
                  RACHA
                </span>
                <span style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--fd-green)', letterSpacing: '-0.02em' }}>
                  {brief.momentum.streak_days}d
                </span>
                <div style={{ width: 60, height: 3, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${brief.momentum.weekly_score}%`, background: 'linear-gradient(90deg, var(--fd-cyan), var(--fd-blue))', borderRadius: 99 }} />
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--fd-green)' }}>
                  {brief.momentum.weekly_score}%
                </span>
              </div>
            )}
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-3)', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: 0, transition: 'color 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)'; }}
            >
              <RefreshCw size={11} className={refreshing ? 'fd-spin' : ''} />
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        {/* ── Hero task ── */}
        {heroPriority ? (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <HeroTask
              priority={heroPriority}
              hero={brief.hero}
              onRefresh={() => load(true)}
              refreshing={refreshing}
            />
          </div>
        ) : (
          /* No priorities */
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--line)',
            borderRadius: 20, padding: '32px 26px', textAlign: 'center',
          }}>
            <p style={{ fontFamily: "'Fraunces', serif", fontSize: 18, color: 'var(--text-2)', margin: 0 }}>
              Ada no encontró prioridades urgentes para hoy. Buen momento para trabajar en objetivos a largo plazo.
            </p>
            <button
              onClick={() => load(true)}
              style={{
                marginTop: 16, padding: '9px 18px', borderRadius: 10,
                background: 'var(--surface-2)', border: '1px solid var(--line)',
                color: 'var(--text)', cursor: 'pointer',
                fontFamily: "'Inter Tight', sans-serif", fontSize: 13, fontWeight: 500,
              }}
            >
              Regenerar lista
            </button>
          </div>
        )}

        {/* ── After this ── */}
        {otherPriorities.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{
                fontFamily: "'Inter Tight', sans-serif", fontSize: 15, fontWeight: 600,
                letterSpacing: '-0.02em', color: 'var(--text)', margin: 0,
              }}>
                <span style={{ color: 'var(--text-3)', fontWeight: 500, marginRight: 6 }}>y después</span>
                {otherPriorities.length === 1 ? '1 acción más' : `${otherPriorities.length} acciones más`} que mueven el día
              </p>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)',
              }}>
                ↑↓ para navegar
              </span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(otherPriorities.length, 3)}, 1fr)`,
              gap: 12,
            }}>
              {otherPriorities.map((p, i) => (
                <PriorityCard key={i} p={p} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Momentum — inline en el greeting si hay datos */}

      </div>
    </div>
  );
}
