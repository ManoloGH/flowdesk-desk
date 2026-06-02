'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { GitBranch, ChevronDown, ChevronRight, FileText, Loader2 } from 'lucide-react';

interface SopStep {
  order: number;
  action: string;
  responsible?: string;
  tool?: string;
  duration_min?: number;
}

interface Sop {
  id: string;
  name: string;
  description?: string;
  category: string;
  frequency?: string;
  product_line?: string;
  steps: SopStep[];
  checklist: string[];
  bpmn_xml?: string;
  updated_at?: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  client_onboarding: 'Onboarding cliente',
  delivery: 'Entrega',
  internal: 'Interno',
  admin: 'Administración',
};

const CATEGORY_COLOR: Record<string, string> = {
  client_onboarding: 'bg-blue-500/20 text-blue-300',
  delivery: 'bg-emerald-500/20 text-emerald-300',
  internal: 'bg-gray-500/20 text-gray-400',
  admin: 'bg-amber-500/20 text-amber-300',
};

function BpmnViewer({ xml }: { xml: string }) {
  const safe = xml
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');

  const srcdoc = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<script src="https://unpkg.com/bpmn-js@17/dist/bpmn-navigated-viewer.production.min.js"></script>
<style>*{margin:0;padding:0}body{background:#0a0f1e;height:100vh}#c{width:100%;height:100vh}</style>
</head><body><div id="c"></div><script>
var v=new BpmnJS({container:'#c'});
v.importXML(\`${safe}\`).then(function(){v.get('canvas').zoom('fit-viewport');})
.catch(function(e){document.body.innerHTML='<p style="color:#ef4444;padding:12px;font-size:12px">'+e.message+'</p>';});
</script></body></html>`;

  return (
    <iframe
      srcDoc={srcdoc}
      className="w-full rounded-lg border border-white/10"
      style={{ height: '380px' }}
      sandbox="allow-scripts"
      title="BPMN diagram"
    />
  );
}

function SopCard({ sop }: { sop: Sop }) {
  const [open, setOpen] = useState(false);
  const [showBpmn, setShowBpmn] = useState(false);

  return (
    <div className="rounded-xl bg-[#0a0f1e] border border-white/5 overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left"
        onClick={() => setOpen(!open)}
      >
        <GitBranch className="w-4 h-4 text-indigo-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{sop.name}</p>
          {sop.description && (
            <p className="text-xs text-gray-500 truncate mt-0.5">{sop.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {sop.product_line && (
            <span className="text-[10px] text-gray-600 hidden sm:block">{sop.product_line}</span>
          )}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${CATEGORY_COLOR[sop.category] ?? 'bg-gray-500/20 text-gray-400'}`}>
            {CATEGORY_LABEL[sop.category] ?? sop.category}
          </span>
          {sop.bpmn_xml && (
            <span className="text-[10px] text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded">
              BPMN ✓
            </span>
          )}
          {open
            ? <ChevronDown className="w-4 h-4 text-gray-500" />
            : <ChevronRight className="w-4 h-4 text-gray-500" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/5 p-4 space-y-4">
          {sop.steps.length > 0 && (
            <div>
              <p className="text-[10px] font-bold tracking-widest text-gray-600 uppercase mb-2">
                Pasos ({sop.steps.length})
              </p>
              <ol className="space-y-1.5">
                {sop.steps.map((step) => (
                  <li key={step.order} className="flex items-start gap-2 text-xs">
                    <span className="text-gray-700 font-bold w-4 shrink-0">{step.order}.</span>
                    <span className="text-gray-300">{step.action}</span>
                    {step.responsible && <span className="text-gray-600">· {step.responsible}</span>}
                    {step.tool && <span className="text-indigo-500 ml-1">[{step.tool}]</span>}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {sop.checklist.length > 0 && (
            <div>
              <p className="text-[10px] font-bold tracking-widest text-gray-600 uppercase mb-2">
                Checklist
              </p>
              <ul className="space-y-1">
                {sop.checklist.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="w-3 h-3 border border-gray-700 rounded-sm shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sop.bpmn_xml && (
            <div>
              <button
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mb-3"
                onClick={() => setShowBpmn(!showBpmn)}
              >
                <GitBranch className="w-3 h-3" />
                {showBpmn ? 'Ocultar diagrama' : 'Ver diagrama BPMN'}
              </button>
              {showBpmn && <BpmnViewer xml={sop.bpmn_xml} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SopsPage() {
  const [sops, setSops] = useState<Sop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ sops: Sop[] }>('/tenants/mine/sops')
      .then(r => setSops(r.sops ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Procesos y SOPs</h1>
        <p className="text-xs text-gray-500 mt-1">
          {sops.length === 0
            ? 'Sin procesos documentados — Atlas los captura durante el onboarding.'
            : `${sops.length} proceso${sops.length !== 1 ? 's' : ''} documentado${sops.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {sops.length === 0 ? (
        <div className="rounded-xl bg-[#0a0f1e] border border-white/5 p-12 text-center">
          <FileText className="w-8 h-8 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            Dile a Atlas &quot;quiero documentar un proceso&quot; o pega un reporte de auditoría.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sops.map(sop => (
            <SopCard key={sop.id} sop={sop} />
          ))}
        </div>
      )}
    </div>
  );
}
