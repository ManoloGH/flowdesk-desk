'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Save, Loader2, X } from 'lucide-react';

const CATEGORIES = [
  { value: 'REGLA_NEGOCIO',      label: 'Regla de Negocio' },
  { value: 'POLITICA_OPERATIVA', label: 'Política Operativa' },
  { value: 'CALCULO',            label: 'Cálculo' },
  { value: 'VALIDACION_DATOS',   label: 'Validación de Datos' },
  { value: 'RESTRICCION_SISTEMA',label: 'Restricción Sistema' },
  { value: 'CUMPLIMIENTO',       label: 'Cumplimiento' },
  { value: 'OTRO',               label: 'Otro' },
];

export default function NuevaReglaPage() {
  const router = useRouter();
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const [name,          setName]          = useState('');
  const [description,   setDescription]   = useState('');
  const [category,      setCategory]      = useState('REGLA_NEGOCIO');
  const [originalText,  setOriginalText]  = useState('');
  const [areaInput,     setAreaInput]     = useState('');
  const [areas,         setAreas]         = useState<string[]>([]);
  const [sysInput,      setSysInput]      = useState('');
  const [systems,       setSystems]       = useState<string[]>([]);

  function addTag(value: string, list: string[], setList: (v: string[]) => void, setInput: (v: string) => void) {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) setList([...list, trimmed]);
    setInput('');
  }

  function removeTag(value: string, list: string[], setList: (v: string[]) => void) {
    setList(list.filter((t) => t !== value));
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>, value: string, list: string[], setList: (v: string[]) => void, setInput: (v: string) => void) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(value, list, setList, setInput);
    } else if (e.key === 'Backspace' && !value && list.length > 0) {
      setList(list.slice(0, -1));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim())        { setError('El nombre es obligatorio.'); return; }
    if (!description.trim()) { setError('La descripción es obligatoria.'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/proyectos-soc/business-rules', {
        name: name.trim(),
        description: description.trim(),
        category,
        affected_areas:  areas.length  > 0 ? areas   : undefined,
        related_systems: systems.length > 0 ? systems : undefined,
        original_text:   originalText.trim() || undefined,
      });
      router.push('/proyectos/reglas');
    } catch (err: any) {
      setError(err?.message ?? 'Error al guardar la regla');
    } finally { setSaving(false); }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box', outline: 'none' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' };

  function TagInput({ value, onChange, list, setList, placeholder }: { value: string; onChange: (v: string) => void; list: string[]; setList: (v: string[]) => void; placeholder: string }) {
    return (
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: '6px 8px', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', cursor: 'text' }}
        onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}>
        {list.map((t) => (
          <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 5, background: 'rgba(29,189,240,0.12)', color: 'var(--fd-cyan)', fontSize: 12, fontWeight: 500 }}>
            {t}
            <button type="button" onClick={() => removeTag(t, list, setList)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'flex' }}>
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => handleTagKeyDown(e, value, list, setList, onChange)}
          onBlur={() => value.trim() && addTag(value, list, setList, onChange)}
          placeholder={list.length === 0 ? placeholder : ''}
          style={{ border: 'none', outline: 'none', background: 'transparent', color: 'var(--text)', fontSize: 13, flex: 1, minWidth: 120 }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 720 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={() => router.push('/proyectos/reglas')}
          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={14} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>Nueva regla de negocio</h1>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)' }}>El agente IA la usará como contexto al generar documentos R-ISO</p>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', color: '#dc2626', fontSize: 13, border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 16 }}>
          <div style={{ marginBottom: 18 }}>
            <label style={lbl}>Nombre de la regla <span style={{ color: '#dc2626' }}>*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Regla de aprobación de crédito hipotecario" style={inp} />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={lbl}>Categoría</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inp }}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label style={lbl}>Descripción <span style={{ color: '#dc2626' }}>*</span></label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
              placeholder="Describe la regla con detalle: condiciones, excepciones, criterios de aplicación…"
              style={{ ...inp, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
            />
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Clasificación <span style={{ fontWeight: 400, color: 'var(--text-3)', fontSize: 12 }}>(opcional)</span></h2>

          <div style={{ marginBottom: 18 }}>
            <label style={lbl}>Áreas afectadas</label>
            <TagInput value={areaInput} onChange={setAreaInput} list={areas} setList={setAreas} placeholder="Ej: Hipotecaria, Seguros — Enter para agregar" />
            <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--text-3)' }}>Presiona Enter o coma para agregar cada área</p>
          </div>

          <div>
            <label style={lbl}>Sistemas relacionados</label>
            <TagInput value={sysInput} onChange={setSysInput} list={systems} setList={setSystems} placeholder="Ej: SISEC, Excel, SAT — Enter para agregar" />
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div>
            <label style={lbl}>Texto original <span style={{ fontWeight: 400, color: 'var(--text-3)', fontSize: 12 }}>(opcional)</span></label>
            <textarea
              value={originalText} onChange={(e) => setOriginalText(e.target.value)} rows={3}
              placeholder="Copia aquí el texto del manual, contrato o documento del que se extrajo esta regla…"
              style={{ ...inp, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => router.push('/proyectos/reglas')}
            style={{ padding: '9px 18px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 22px', borderRadius: 9, border: 'none',
              background: saving ? 'var(--surface-2)' : 'linear-gradient(135deg, var(--fd-cyan), var(--fd-blue))',
              color: saving ? 'var(--text-3)' : '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
            {saving ? 'Guardando…' : 'Guardar regla'}
          </button>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
