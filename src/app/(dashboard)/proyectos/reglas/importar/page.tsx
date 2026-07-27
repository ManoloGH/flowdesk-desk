'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Sparkles, Check, Loader2, Upload } from 'lucide-react';

interface ExtractedRule {
  id: string;
  name: string;
  description: string;
  category: string;
  affected_areas: string[];
  related_systems: string[];
}

const CATEGORY_LABEL: Record<string, string> = {
  REGLA_NEGOCIO: 'Regla de Negocio', POLITICA_OPERATIVA: 'Política Operativa',
  CALCULO: 'Cálculo', VALIDACION_DATOS: 'Validación de Datos',
  RESTRICCION_SISTEMA: 'Restricción Sistema', CUMPLIMIENTO: 'Cumplimiento', OTRO: 'Otro',
};

export default function ImportarReglasPage() {
  const router = useRouter();
  const [content, setContent]     = useState('');
  const [fileName, setFileName]   = useState('');
  const [step, setStep]           = useState<'input' | 'preview'>('input');
  const [loading, setLoading]     = useState(false);
  const [imported, setImported]   = useState<ExtractedRule[]>([]);
  const [result, setResult]       = useState<{ imported: number } | null>(null);
  const [error, setError]         = useState('');

  async function handleExtract() {
    if (!content.trim()) { setError('Pega el texto con las reglas de negocio.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ imported: number; rules: ExtractedRule[] }>(
        '/proyectos-soc/business-rules/import',
        { content, source_file_name: fileName || undefined },
      );
      setImported(res.rules ?? []);
      setResult({ imported: res.imported });
      setStep('preview');
    } catch (err: any) {
      setError(err?.message ?? 'Error al importar');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'preview') {
    return (
      <div style={{ padding: '28px 32px', maxWidth: 800 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <button onClick={() => router.push('/proyectos/reglas')} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', color: 'var(--text-2)', display: 'flex' }}>
            <ArrowLeft size={14} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
              <span style={{ color: '#059669' }}>✓</span> {result?.imported} regla{result?.imported !== 1 ? 's' : ''} importada{result?.imported !== 1 ? 's' : ''}
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)' }}>El agente IA las ha guardado en la base de conocimiento</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {imported.map((r, i) => (
            <div key={r.id ?? i} style={{ padding: 16, borderRadius: 10, border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700, background: 'rgba(29,189,240,0.12)', color: 'var(--fd-cyan)' }}>
                  {CATEGORY_LABEL[r.category] ?? r.category}
                </span>
              </div>
              <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{r.name}</p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{r.description}</p>
              {r.affected_areas?.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {r.affected_areas.map((a) => <span key={a} style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, background: 'var(--surface-2)', color: 'var(--text-3)' }}>{a}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => { setStep('input'); setContent(''); setFileName(''); }} style={{ padding: '9px 18px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Importar más
          </button>
          <button onClick={() => router.push('/proyectos/reglas')} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg, var(--fd-cyan), var(--fd-blue))', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Check size={14} /> Ver todas las reglas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={() => router.push('/proyectos/reglas')} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', color: 'var(--text-2)', display: 'flex' }}>
          <ArrowLeft size={14} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>Importar reglas con IA</h1>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)' }}>Pega texto de manuales, políticas, o documentos internos de SOC</p>
        </div>
      </div>

      <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(79,70,229,0.04))', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 12, padding: 16, marginBottom: 22, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Sparkles size={18} style={{ color: '#7c3aed', flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
          El agente IA leerá el texto y extraerá automáticamente reglas de negocio, políticas operativas, cálculos y restricciones de sistema. Las reglas importadas quedan activas para el agente de requerimientos.
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#dc2626', fontSize: 13, border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Nombre de la fuente (opcional)
          </label>
          <input
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Ej: Manual Operativo SOC 2026, Políticas Hipotecaria…"
            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Contenido a analizar *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Pega aquí el texto del manual, política o documento. El agente extraerá las reglas de negocio automáticamente…"
            rows={14}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
          />
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-3)' }}>{content.length.toLocaleString()} caracteres</div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={handleExtract}
            disabled={loading || !content.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 9, border: 'none', background: loading ? '#7c3aed80' : '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 600, cursor: loading ? 'wait' : 'pointer' }}
          >
            {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={14} />}
            {loading ? 'Extrayendo reglas…' : 'Extraer reglas con IA'}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
