'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Brain, Upload, FileText, FileImage, File, Trash2, Search, ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BrainDoc {
  id: string;
  title: string;
  source_type: string;
  content: string;
  created_at: string;
  metadata?: { original_name?: string; mimetype?: string; size_bytes?: number };
}

interface Stats {
  total_documents: number;
  by_source_type: Record<string, number>;
}

const TYPE_LABEL: Record<string, string> = {
  document: 'Documento',
  sop:      'SOP / Proceso',
  culture:  'Cultura',
  decision: 'Decisión',
  other:    'Otro',
  company_info: 'Info empresa',
  goal:    'Meta',
  onboarding: 'Onboarding',
};

const TYPE_COLOR: Record<string, string> = {
  document: '#4a86e8',
  sop:      '#43d692',
  culture:  '#b694e8',
  decision: '#ffad47',
  other:    '#666',
  company_info: '#4a86e8',
  goal:    '#43d692',
  onboarding: '#16a766',
};

function FileIcon({ mimetype }: { mimetype?: string }) {
  if (!mimetype) return <File size={16} />;
  if (mimetype.startsWith('image/'))       return <FileImage size={16} />;
  if (mimetype === 'application/pdf')      return <FileText size={16} />;
  return <FileText size={16} />;
}

function formatBytes(b?: number) {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default function BrainPage() {
  const [docs, setDocs]       = useState<BrainDoc[]>([]);
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery]     = useState('');
  const [filter, setFilter]   = useState('');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [hint, setHint]       = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [d, s] = await Promise.all([
      api.get('/brain/documents').then(r => r.data).catch(() => []),
      api.get('/brain/stats').then(r => r.data).catch(() => null),
    ]);
    setDocs(d);
    setStats(s);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const uploadFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadMsg(null);
    let ok = 0, fail = 0;
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      if (hint) fd.append('hint', hint);
      try {
        await api.postForm('/brain/upload', fd);
        ok++;
      } catch { fail++; }
    }
    setUploading(false);
    setUploadMsg(
      fail === 0
        ? { type: 'ok',  text: `${ok} archivo${ok !== 1 ? 's' : ''} procesado${ok !== 1 ? 's' : ''} y guardado${ok !== 1 ? 's' : ''} en el Brain` }
        : { type: 'err', text: `${ok} exitoso${ok !== 1 ? 's' : ''}, ${fail} fallido${fail !== 1 ? 's' : ''}` },
    );
    await load();
  }, [hint, load]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    uploadFiles(e.dataTransfer.files);
  }, [uploadFiles]);

  const handleDelete = async (id: string, sourceType: string, sourceId?: string) => {
    if (!sourceId) return;
    await api.delete(`/brain/documents/${sourceType}/${sourceId}`).catch(() => {});
    setDocs(prev => prev.filter(d => d.id !== id));
  };

  const filtered = docs.filter(d => {
    const matchQ = !query || d.title.toLowerCase().includes(query.toLowerCase()) || d.content.toLowerCase().includes(query.toLowerCase());
    const matchF = !filter || d.source_type === filter;
    return matchQ && matchF;
  });

  const allTypes = [...new Set(docs.map(d => d.source_type))];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--fd-bg, #0a0a0a)', color: 'var(--fd-text, #e8e8e8)', fontFamily: "'JetBrains Mono', monospace", padding: '24px 28px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(74,134,232,0.15)', border: '1px solid rgba(74,134,232,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Brain size={18} color="#4a86e8" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>Brain — Base de Conocimiento</h1>
          <p style={{ margin: 0, fontSize: 10, color: '#666', marginTop: 2 }}>
            {stats ? `${stats.total_documents} documento${stats.total_documents !== 1 ? 's' : ''} · los agentes consultan esto automáticamente` : 'Cargando...'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

        {/* Columna izquierda — documentos */}
        <div>
          {/* Barra de búsqueda y filtros */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar documentos..."
                style={{ width: '100%', background: '#111', border: '1px solid #222', borderRadius: 6, padding: '7px 10px 7px 30px', fontSize: 11, color: '#e8e8e8', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            {allTypes.length > 0 && (
              <div style={{ position: 'relative' }}>
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  style={{ appearance: 'none', background: '#111', border: '1px solid #222', borderRadius: 6, padding: '7px 28px 7px 10px', fontSize: 11, color: filter ? '#e8e8e8' : '#555', cursor: 'pointer' }}
                >
                  <option value="">Todos los tipos</option>
                  {allTypes.map(t => <option key={t} value={t}>{TYPE_LABEL[t] ?? t}</option>)}
                </select>
                <ChevronDown size={11} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#555', pointerEvents: 'none' }} />
              </div>
            )}
          </div>

          {/* Lista */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#444', fontSize: 11 }}>Cargando...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#444', fontSize: 11 }}>
              {docs.length === 0 ? 'No hay documentos en el Brain todavía. Sube el primero →' : 'Sin resultados para esa búsqueda.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filtered.map(doc => (
                <div
                  key={doc.id}
                  style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, padding: '12px 14px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#333')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e1e1e')}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }} onClick={() => setExpanded(expanded === doc.id ? null : doc.id)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ color: TYPE_COLOR[doc.source_type] ?? '#666' }}>
                          <FileIcon mimetype={doc.metadata?.mimetype} />
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</span>
                        <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: `${TYPE_COLOR[doc.source_type] ?? '#444'}22`, color: TYPE_COLOR[doc.source_type] ?? '#666', flexShrink: 0 }}>
                          {TYPE_LABEL[doc.source_type] ?? doc.source_type}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 10, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: expanded === doc.id ? 'normal' : 'nowrap', lineHeight: 1.5 }}>
                        {doc.content}
                      </p>
                      {doc.metadata?.size_bytes && (
                        <span style={{ fontSize: 9, color: '#444', marginTop: 4, display: 'block' }}>
                          {formatBytes(doc.metadata.size_bytes)} · {new Date(doc.created_at).toLocaleDateString('es-MX')}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id, doc.source_type, (doc.metadata as any)?.source_id ?? `upload_${doc.id}`)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333', padding: 4, borderRadius: 4, flexShrink: 0, transition: 'color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#e8e8e8')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#333')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Columna derecha — upload */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div style={{ background: dragging ? 'rgba(74,134,232,0.05)' : '#111', border: `2px dashed ${dragging ? '#4a86e8' : '#222'}`, borderRadius: 10, padding: 20, transition: 'border-color 0.15s, background 0.15s' } as any}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(74,134,232,0.12)', border: '1px solid rgba(74,134,232,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <Upload size={20} color="#4a86e8" />
              </div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>Sube un archivo</p>
              <p style={{ margin: '4px 0 0', fontSize: 10, color: '#555' }}>PDF, DOCX, TXT, imagen · máx 20 MB</p>
            </div>

            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.md,.csv,.jpg,.jpeg,.png,.webp"
              style={{ display: 'none' }}
              onChange={e => uploadFiles(e.target.files)}
            />

            <input
              value={hint}
              onChange={e => setHint(e.target.value)}
              placeholder="Contexto opcional (ej: propuesta de ventas, proceso de cobranza)"
              style={{ width: '100%', background: '#0d0d0d', border: '1px solid #222', borderRadius: 6, padding: '7px 10px', fontSize: 10, color: '#e8e8e8', outline: 'none', marginBottom: 10, boxSizing: 'border-box' }}
            />

            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              style={{ width: '100%', padding: '9px 0', background: uploading ? '#1a1a1a' : 'rgba(74,134,232,0.15)', border: '1px solid rgba(74,134,232,0.3)', borderRadius: 6, color: uploading ? '#444' : '#4a86e8', fontSize: 11, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: "'JetBrains Mono', monospace", transition: 'all 0.15s' }}
            >
              {uploading ? 'Procesando...' : 'Seleccionar archivos'}
            </button>

            {uploadMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '8px 10px', borderRadius: 6, background: uploadMsg.type === 'ok' ? 'rgba(67,214,146,0.08)' : 'rgba(251,76,47,0.08)', border: `1px solid ${uploadMsg.type === 'ok' ? 'rgba(67,214,146,0.2)' : 'rgba(251,76,47,0.2)'}` }}>
                {uploadMsg.type === 'ok'
                  ? <CheckCircle2 size={12} color="#43d692" />
                  : <AlertCircle size={12} color="#fb4c2f" />}
                <span style={{ fontSize: 10, color: uploadMsg.type === 'ok' ? '#43d692' : '#fb4c2f' }}>{uploadMsg.text}</span>
              </div>
            )}

            <p style={{ margin: '12px 0 0', fontSize: 9, color: '#444', lineHeight: 1.6 }}>
              Claude extrae y resume el contenido automáticamente. Los agentes buscan en estos documentos con <code style={{ color: '#4a86e8' }}>search_company_brain</code>.
            </p>
          </div>

          {/* Stats */}
          {stats && stats.total_documents > 0 && (
            <div style={{ marginTop: 12, background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, padding: 14 }}>
              <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 600, color: '#666' }}>POR TIPO</p>
              {Object.entries(stats.by_source_type ?? {}).map(([type, count]) => (
                <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: TYPE_COLOR[type] ?? '#444' }} />
                    <span style={{ fontSize: 10, color: '#888' }}>{TYPE_LABEL[type] ?? type}</span>
                  </div>
                  <span style={{ fontSize: 10, color: '#555' }}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
