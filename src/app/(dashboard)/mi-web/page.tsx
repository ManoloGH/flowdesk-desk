'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Globe, Plus, Eye, Rocket, Loader2, RefreshCw, ExternalLink, Trash2 } from 'lucide-react';
import WebBuilderModal from './WebBuilderModal';

interface WebProyecto {
  id: string;
  nombre_cliente: string;
  slug: string;
  fase: string;
  vercel_url: string | null;
  logo_url: string | null;
  files: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

const FASE_LABEL: Record<string, string> = {
  assets: 'En construcción',
  pages: 'Generando páginas',
  scroll: 'Añadiendo scroll',
  seo: 'Optimizando SEO',
  publicado: 'Publicado',
};

const FASE_COLOR: Record<string, string> = {
  assets: '#6366f1',
  pages: '#8b5cf6',
  scroll: '#a855f7',
  seo: '#06b6d4',
  publicado: '#10b981',
};

export default function MiWebPage() {
  const [proyectos, setProyectos] = useState<WebProyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [creando, setCreando] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [selected, setSelected] = useState<WebProyecto | null>(null);

  const fetchProyectos = useCallback(async () => {
    try {
      const data = await api.get<WebProyecto[]>('/web-proyectos');
      setProyectos(Array.isArray(data) ? data : []);
    } catch (e: any) {
      if (e?.status === 400 || e?.message?.includes('Web Builder')) setBlocked(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProyectos(); }, [fetchProyectos]);

  const crearProyecto = async () => {
    if (!newNombre.trim()) return;
    try {
      const p = await api.post<WebProyecto>('/web-proyectos', { nombre_cliente: newNombre.trim() });
      setProyectos(prev => [p, ...prev]);
      setSelected(p);
      setNewNombre('');
      setCreando(false);
    } catch {}
  };

  const eliminarProyecto = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.')) return;
    await api.delete(`/web-proyectos/${id}`).catch(() => {});
    setProyectos(prev => prev.filter(p => p.id !== id));
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} size={24} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (blocked) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <Globe size={40} style={{ color: '#374151', margin: '0 auto 16px' }} />
        <h2 style={{ color: '#f3f4f6', fontSize: 18, fontWeight: 700, margin: '0 0 8px', fontFamily: "'Inter Tight', sans-serif" }}>
          Módulo Web Builder no activado
        </h2>
        <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.6, margin: '0 0 20px' }}>
          Tu empresa aún no tiene acceso al Web Builder de FlowDesk.
          Contacta con tu gestor de cuenta para activarlo.
        </p>
        <a href="mailto:hola@flowdesk.mx" style={{
          display: 'inline-block', padding: '10px 24px',
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600,
          textDecoration: 'none',
        }}>
          Contactar con FlowDesk
        </a>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#050a14', padding: '28px 24px', fontFamily: "'Inter Tight', sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#f3f4f6', fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Mi Web</h1>
          <p style={{ color: '#4b5563', fontSize: 12, margin: '4px 0 0', fontFamily: "'JetBrains Mono', monospace" }}>
            {proyectos.length} proyecto{proyectos.length !== 1 ? 's' : ''} · Web Builder con IA
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchProyectos} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: '8px 12px', cursor: 'pointer', color: '#6b7280',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
          }}>
            <RefreshCw size={13} /> Actualizar
          </button>
          <button onClick={() => setCreando(true)} style={{
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            border: 'none', borderRadius: 8, padding: '8px 16px',
            cursor: 'pointer', color: '#fff', fontWeight: 600, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Plus size={14} /> Nuevo proyecto
          </button>
        </div>
      </div>

      {/* New project inline form */}
      {creando && (
        <div style={{
          background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 12, padding: '16px 20px', marginBottom: 16,
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <input
            autoFocus
            value={newNombre}
            onChange={e => setNewNombre(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') crearProyecto(); if (e.key === 'Escape') setCreando(false); }}
            placeholder="Nombre del proyecto (ej: Web de mi empresa)"
            style={{
              flex: 1, background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, color: '#f3f4f6', fontSize: 13, padding: '9px 12px', outline: 'none',
            }}
          />
          <button onClick={crearProyecto} disabled={!newNombre.trim()} style={{
            background: '#6366f1', border: 'none', borderRadius: 7, padding: '9px 18px',
            color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: newNombre.trim() ? 1 : 0.4,
          }}>Crear</button>
          <button onClick={() => setCreando(false)} style={{
            background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 13,
          }}>Cancelar</button>
        </div>
      )}

      {/* Empty state */}
      {proyectos.length === 0 && !creando && (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <Globe size={36} style={{ color: '#1e1b4b', margin: '0 auto 14px' }} />
          <p style={{ color: '#374151', fontSize: 14, marginBottom: 16 }}>Aún no tienes proyectos web</p>
          <button onClick={() => setCreando(true)} style={{
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            border: 'none', borderRadius: 8, padding: '10px 24px',
            cursor: 'pointer', color: '#fff', fontWeight: 600, fontSize: 13,
          }}>Crear mi primera web</button>
        </div>
      )}

      {/* Project cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {proyectos.map(p => (
          <div
            key={p.id}
            onClick={() => setSelected(p)}
            style={{
              background: '#0a0f1e', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: '16px 18px', cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
          >
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))',
                border: '1px solid rgba(99,102,241,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Globe size={18} style={{ color: '#818cf8' }} />
              </div>
              <button
                onClick={e => eliminarProyecto(e, p.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', padding: 4, borderRadius: 4 }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#f87171'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#374151'}
              >
                <Trash2 size={13} />
              </button>
            </div>

            {/* Name + slug */}
            <p style={{ color: '#f3f4f6', fontSize: 14, fontWeight: 600, margin: '0 0 2px', letterSpacing: '-0.01em' }}>
              {p.nombre_cliente}
            </p>
            <p style={{ color: '#4b5563', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", margin: '0 0 12px' }}>
              {p.slug}
            </p>

            {/* Status + actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
                color: FASE_COLOR[p.fase] ?? '#6b7280',
                background: `${FASE_COLOR[p.fase] ?? '#6b7280'}18`,
                padding: '3px 8px', borderRadius: 20,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {FASE_LABEL[p.fase] ?? p.fase}
              </span>

              <div style={{ display: 'flex', gap: 6 }}>
                {p.files && Object.keys(p.files).length > 0 && (
                  <span title="Ver y construir" style={{ color: '#6366f1' }}><Eye size={14} /></span>
                )}
                {p.vercel_url && (
                  <a href={p.vercel_url} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ color: '#10b981', display: 'flex' }}>
                    <ExternalLink size={14} />
                  </a>
                )}
                {!p.vercel_url && p.fase === 'seo' && (
                  <span title="Listo para publicar" style={{ color: '#f59e0b' }}><Rocket size={14} /></span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Builder modal */}
      {selected && (
        <WebBuilderModal
          proyectoId={selected.id}
          nombreCliente={selected.nombre_cliente}
          files={selected.files ?? undefined}
          vercelUrl={selected.vercel_url ?? undefined}
          logoUrl={selected.logo_url ?? undefined}
          onClose={() => setSelected(null)}
          onUpdate={fetchProyectos}
        />
      )}
    </div>
  );
}
