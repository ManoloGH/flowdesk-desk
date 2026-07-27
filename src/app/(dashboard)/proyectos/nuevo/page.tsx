'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

const DOC_TYPES = [
  { value: 'MEJORA', label: 'Mejora' },
  { value: 'NUEVO_DESARROLLO', label: 'Nuevo desarrollo' },
  { value: 'CORRECCION', label: 'Corrección' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
];

const AREAS_SOC = ['Marketing', 'Networking', 'Hipotecaria', 'Seguros', 'Pymes', 'Tecnología'];

export default function NuevoRequerimientoPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const [form, setForm] = useState({
    title: '',
    doc_type: 'MEJORA',
    requested_by: '',
    requested_by_email: '',
    responsible_business: '',
    responsible_systems: '',
    current_situation: '',
    problem_statement: '',
    objective: '',
    related_systems: '',
    estimated_duration: '',
    intake_source: 'FORMULARIO',
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError('El título es obligatorio.'); return; }
    setSaving(true);
    setError('');
    try {
      const req = await api.post<{ id: string }>('/proyectos-soc/requirements', form);
      router.push(`/proyectos/${req.id}`);
    } catch (err: any) {
      setError(err?.message ?? 'Error al crear el requerimiento');
    } finally {
      setSaving(false);
    }
  }

  const field = (label: string, key: string, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <input
        type={type}
        value={(form as any)[key]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
      />
    </div>
  );

  const textarea = (label: string, key: string, placeholder = '', rows = 3) => (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <textarea
        value={(form as any)[key]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
      />
    </div>
  );

  return (
    <div style={{ padding: '28px 32px', maxWidth: 800 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={() => router.back()} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={14} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>Nuevo requerimiento</h1>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)' }}>Intake manual — el agente IA enriquecerá el documento después</p>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#dc2626', fontSize: 13, border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Sección: Meta */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 18px', fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>Identificación</h2>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo de documento</label>
            <select
              value={form.doc_type}
              onChange={(e) => set('doc_type', e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
            >
              {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {field('Título del requerimiento *', 'title', 'text', 'Ej: Automatización de reporte mensual de cartera hipotecaria')}
        </div>

        {/* Sección: Responsables */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 18px', fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>Responsables (Sección 2)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              {field('Solicitado por', 'requested_by', 'text', 'Nombre del solicitante')}
              {field('Email del solicitante', 'requested_by_email', 'email', 'nombre@soc.mx')}
            </div>
            <div>
              {field('Responsable de negocio', 'responsible_business', 'text', 'Área o persona de negocio')}
              {field('Responsable de sistemas', 'responsible_systems', 'text', 'Área o persona de TI')}
            </div>
          </div>
        </div>

        {/* Sección: Contexto */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>Contexto</h2>
          <p style={{ margin: '0 0 18px', fontSize: 12, color: 'var(--text-3)' }}>El agente IA completará y enriquecerá estas secciones. Agrega lo que sepas.</p>

          {textarea('Situación actual (Sección 1)', 'current_situation', 'Describe cómo se hace hoy este proceso…', 3)}
          {textarea('Planteamiento del problema', 'problem_statement', 'Qué problema o necesidad origina este requerimiento…', 3)}
          {textarea('Objetivo (Sección 3)', 'objective', 'Qué se quiere lograr con este desarrollo…', 2)}
          {textarea('Sistemas relacionados (Sección 5)', 'related_systems', 'SISEC, Excel, otros sistemas involucrados…', 2)}
        </div>

        {/* Sección: Planeación */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 18px', fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>Planeación (Sección 7)</h2>
          {field('Duración estimada', 'estimated_duration', 'text', 'Ej: 2 semanas, 1 sprint')}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => router.back()} style={{ padding: '9px 18px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg, var(--fd-cyan), var(--fd-blue))', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
            {saving ? 'Guardando…' : 'Crear requerimiento'}
          </button>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
