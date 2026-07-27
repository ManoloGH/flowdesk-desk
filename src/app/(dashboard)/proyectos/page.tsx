'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Plus, FileText, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, ChevronRight, BookOpen, Search } from 'lucide-react';

interface Requirement {
  id: string;
  folio: string;
  title: string;
  status: string;
  doc_type: string;
  intake_source: string;
  requested_by: string | null;
  due_date: string | null;
  created_at: string;
  pm_slot: { full_name: string; avatar_url: string | null } | null;
  _count: { history: number };
}

const STATUS_LABEL: Record<string, string> = {
  BORRADOR: 'Borrador', EN_REVISION: 'En revisión', APROBADO: 'Aprobado',
  EN_DESARROLLO: 'En desarrollo', EN_PRUEBAS: 'En pruebas', LISTO: 'Listo', CANCELADO: 'Cancelado',
};
const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  BORRADOR:      { bg: 'rgba(107,114,128,0.12)', color: 'var(--text-2)' },
  EN_REVISION:   { bg: 'rgba(245,158,11,0.12)',  color: '#d97706' },
  APROBADO:      { bg: 'rgba(16,185,129,0.12)',  color: '#059669' },
  EN_DESARROLLO: { bg: 'rgba(37,102,232,0.12)',  color: 'var(--fd-blue)' },
  EN_PRUEBAS:    { bg: 'rgba(139,92,246,0.12)',  color: 'var(--fd-purple)' },
  LISTO:         { bg: 'rgba(16,185,129,0.15)',  color: '#059669' },
  CANCELADO:     { bg: 'rgba(239,68,68,0.12)',   color: '#dc2626' },
};
const DOC_TYPE_LABEL: Record<string, string> = {
  MEJORA: 'Mejora', NUEVO_DESARROLLO: 'Nuevo desarrollo', CORRECCION: 'Corrección', MANTENIMIENTO: 'Mantenimiento',
};

const STATUSES = Object.keys(STATUS_LABEL);

export default function ProyectosPage() {
  const router = useRouter();
  const [items, setItems]   = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, [filter]);

  async function load() {
    setLoading(true);
    try {
      const qs = filter ? `?status=${filter}` : '';
      const data = await api.get<Requirement[]>(`/proyectos-soc/requirements${qs}`);
      setItems(Array.isArray(data) ? data : []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }

  const filtered = items.filter((r) =>
    !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.folio.toLowerCase().includes(search.toLowerCase()),
  );

  const counts = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = items.filter((r) => r.status === s).length;
    return acc;
  }, {});

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Proyectos SOC
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-2)' }}>
            Requerimientos de software — ISO/IEC 20000
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => router.push('/proyectos/reglas')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            <BookOpen size={14} /> Reglas de Negocio
          </button>
          <button
            onClick={() => router.push('/proyectos/nuevo')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg, var(--fd-cyan), var(--fd-blue))', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={14} /> Nuevo requerimiento
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilter('')}
          style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)', fontSize: 12, fontWeight: 500, cursor: 'pointer', background: !filter ? 'var(--fd-cyan)' : 'var(--surface)', color: !filter ? '#fff' : 'var(--text-2)' }}
        >
          Todos ({items.length})
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)', fontSize: 12, fontWeight: 500, cursor: 'pointer', background: filter === s ? STATUS_COLOR[s].color : 'var(--surface)', color: filter === s ? '#fff' : 'var(--text-2)' }}
          >
            {STATUS_LABEL[s]} ({counts[s] ?? 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 380 }}>
        <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por folio o título…"
          style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
        />
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-3)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-3)' }}>
          <FileText size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontSize: 14, margin: 0 }}>No hay requerimientos {filter ? 'con este estado' : 'aún'}.</p>
          <button
            onClick={() => router.push('/proyectos/nuevo')}
            style={{ marginTop: 14, padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--fd-cyan)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Crear el primero
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((r) => {
            const sc = STATUS_COLOR[r.status] ?? STATUS_COLOR.BORRADOR;
            return (
              <div
                key={r.id}
                onClick={() => router.push(`/proyectos/${r.id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--fd-cyan)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, rgba(29,189,240,0.12), rgba(37,102,232,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={16} style={{ color: 'var(--fd-cyan)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{r.folio}</span>
                    <span style={{ padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: sc.bg, color: sc.color }}>{STATUS_LABEL[r.status]}</span>
                    <span style={{ padding: '2px 7px', borderRadius: 5, fontSize: 10, background: 'var(--surface-2)', color: 'var(--text-3)' }}>{DOC_TYPE_LABEL[r.doc_type] ?? r.doc_type}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</p>
                  <div style={{ display: 'flex', gap: 12, marginTop: 3, fontSize: 12, color: 'var(--text-3)' }}>
                    {r.requested_by && <span>{r.requested_by}</span>}
                    {r.pm_slot && <span>PM: {r.pm_slot.full_name}</span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} /> {new Date(r.created_at).toLocaleDateString('es-MX')}</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
