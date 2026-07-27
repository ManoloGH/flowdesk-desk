'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Plus, Upload, BookOpen, ToggleLeft, ToggleRight, Trash2, Loader2, Search } from 'lucide-react';

interface BusinessRule {
  id: string;
  name: string;
  description: string;
  category: string;
  affected_areas: string[] | null;
  related_systems: string[] | null;
  source: string;
  source_file_name: string | null;
  is_active: boolean;
  created_at: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  REGLA_NEGOCIO: 'Regla de Negocio', POLITICA_OPERATIVA: 'Política Operativa',
  CALCULO: 'Cálculo', VALIDACION_DATOS: 'Validación de Datos',
  RESTRICCION_SISTEMA: 'Restricción Sistema', CUMPLIMIENTO: 'Cumplimiento', OTRO: 'Otro',
};
const CATEGORY_COLOR: Record<string, string> = {
  REGLA_NEGOCIO: 'var(--fd-blue)', POLITICA_OPERATIVA: '#d97706',
  CALCULO: 'var(--fd-purple)', VALIDACION_DATOS: '#059669',
  RESTRICCION_SISTEMA: '#dc2626', CUMPLIMIENTO: '#6b7280', OTRO: 'var(--text-3)',
};

export default function ReglasPage() {
  const router = useRouter();
  const [rules, setRules]   = useState<BusinessRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => { load(); }, [catFilter]);

  async function load() {
    setLoading(true);
    try {
      const qs = catFilter ? `?category=${catFilter}` : '';
      const data = await api.get<BusinessRule[]>(`/proyectos-soc/business-rules${qs}`);
      setRules(Array.isArray(data) ? data : []);
    } catch { setRules([]); }
    finally { setLoading(false); }
  }

  async function toggleRule(id: string) {
    setToggling(id);
    try {
      const updated = await api.patch<BusinessRule>(`/proyectos-soc/business-rules/${id}/toggle`, {});
      setRules((prev) => prev.map((r) => r.id === id ? { ...r, is_active: updated.is_active } : r));
    } finally { setToggling(null); }
  }

  async function deleteRule(id: string, name: string) {
    if (!confirm(`¿Eliminar la regla "${name}"?`)) return;
    try {
      await api.delete(`/proyectos-soc/business-rules/${id}`);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch { alert('Error al eliminar'); }
  }

  const filtered = rules.filter((r) =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase()),
  );

  const activeCount   = rules.filter((r) => r.is_active).length;
  const inactiveCount = rules.filter((r) => !r.is_active).length;

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>Reglas de Negocio</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-2)' }}>
            Base de conocimiento del agente IA — {activeCount} activas · {inactiveCount} inactivas
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => router.push('/proyectos/reglas/importar')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            <Upload size={14} /> Importar con IA
          </button>
          <button
            onClick={() => router.push('/proyectos/reglas/nueva')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg, var(--fd-cyan), var(--fd-blue))', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={14} /> Nueva regla
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar reglas…"
            style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
        >
          <option value="">Todas las categorías</option>
          {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-3)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-3)' }}>
          <BookOpen size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontSize: 14, margin: '0 0 10px' }}>No hay reglas de negocio aún.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={() => router.push('/proyectos/reglas/importar')} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Importar con IA</button>
            <button onClick={() => router.push('/proyectos/reglas/nueva')} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Crear manualmente</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((r) => {
            const catColor = CATEGORY_COLOR[r.category] ?? 'var(--text-3)';
            return (
              <div
                key={r.id}
                style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 18px', borderRadius: 11, border: `1px solid ${r.is_active ? 'var(--border)' : 'rgba(107,114,128,0.2)'}`, background: r.is_active ? 'var(--surface)' : 'var(--surface-2)', opacity: r.is_active ? 1 : 0.65 }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700, background: `${catColor}18`, color: catColor }}>{CATEGORY_LABEL[r.category] ?? r.category}</span>
                    {r.source === 'ARCHIVO_IMPORTADO' && <span style={{ padding: '2px 7px', borderRadius: 5, fontSize: 10, background: 'rgba(124,58,237,0.12)', color: '#7c3aed' }}>IA — {r.source_file_name ?? 'importada'}</span>}
                  </div>
                  <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{r.name}</p>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.description}</p>
                  {r.affected_areas && r.affected_areas.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {r.affected_areas.slice(0, 5).map((a) => (
                        <span key={a} style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, background: 'var(--surface-2)', color: 'var(--text-3)' }}>{a}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                  <button
                    onClick={() => toggleRule(r.id)}
                    disabled={toggling === r.id}
                    title={r.is_active ? 'Desactivar' : 'Activar'}
                    style={{ padding: '5px 8px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', color: r.is_active ? 'var(--fd-cyan)' : 'var(--text-3)' }}
                  >
                    {toggling === r.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : r.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </button>
                  <button
                    onClick={() => deleteRule(r.id, r.name)}
                    title="Eliminar"
                    style={{ padding: '5px 8px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', color: '#dc2626' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
