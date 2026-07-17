'use client';
import React, { useState, useEffect, useRef, useId, type ReactNode } from 'react';
import {
  Bot, Save, AlertCircle, CheckCircle2, Plug, Info, Plus, X,
  MessageSquare, HelpCircle, Package, GitBranch,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

// ─── Node types ───────────────────────────────────────────────────────────────

interface DialogoNode {
  id: string;
  type: 'dialogo';
  label: string;
  mensaje: string;
  branching: boolean;
  si: JourneyNode[];
  no: JourneyNode[];
}

interface PreguntaNode {
  id: string;
  type: 'pregunta';
  label: string;
  pregunta: string;
  answerType: 'open' | 'multiple';
  options: string[];
}

interface EntregableNode {
  id: string;
  type: 'entregable';
  label: string;
  entregable: 'microdiagnostico';
}

type JourneyNode = DialogoNode | PreguntaNode | EntregableNode;

// ─── Config ───────────────────────────────────────────────────────────────────

interface AgentConfig {
  configured: boolean;
  nombre: string;
  actividad: string;
  propuesta_valor: string;
  evolution_instance: string;
  criterios_buen_lead: string;
  criterios_mal_lead: string;
  cal_booking_url: string;
  journey: JourneyNode[];
}

// ─── ID generator ─────────────────────────────────────────────────────────────

let _nc = 0;
function uid() { return `n${++_nc}`; }

// ─── Default journey ──────────────────────────────────────────────────────────

function makeDefaultJourney(): JourneyNode[] {
  return [
    {
      id: uid(), type: 'dialogo', label: 'Bienvenida',
      mensaje: '¡Hola! Soy Leo, agente de MentorIA Systems. ¿Con quién tengo el gusto?',
      branching: false, si: [], no: [],
    },
    { id: uid(), type: 'pregunta', label: 'Nombre del prospecto', pregunta: '¿Cuál es tu nombre?', answerType: 'open', options: [] },
    { id: uid(), type: 'pregunta', label: 'Empresa del prospecto', pregunta: '¿Cuál es el nombre de tu empresa?', answerType: 'open', options: [] },
    { id: uid(), type: 'pregunta', label: 'Actividad de la empresa', pregunta: '¿A qué se dedica tu empresa?', answerType: 'open', options: [] },
    {
      id: uid(), type: 'dialogo', label: 'Oferta — Micro-Diagnóstico',
      mensaje: 'Me gustaría ofrecerte algo completamente gratuito: un micro-diagnóstico de automatización para tu empresa. En menos de 5 minutos te doy un análisis de dónde podrías ahorrar más tiempo y dinero. ¿Te interesaría?',
      branching: true,
      si: [
        { id: uid(), type: 'pregunta', label: 'Años de operación', pregunta: '¿A qué se dedica la empresa y cuántos años lleva operando?', answerType: 'open', options: [] },
        { id: uid(), type: 'pregunta', label: 'Tamaño del equipo', pregunta: '¿Cuántos empleados tiene aproximadamente?', answerType: 'open', options: [] },
        { id: uid(), type: 'pregunta', label: 'Herramientas digitales', pregunta: '¿Qué software o herramientas digitales usan hoy en día?', answerType: 'open', options: [] },
        { id: uid(), type: 'pregunta', label: 'Área de programación', pregunta: '¿Tienen área de programación propia?', answerType: 'multiple', options: ['Sí, equipo propio', 'Solo outsourcing', 'No tenemos'] },
        { id: uid(), type: 'pregunta', label: 'Cuello de botella', pregunta: '¿Qué tarea o proceso les genera más cuello de botella?', answerType: 'open', options: [] },
        { id: uid(), type: 'entregable', label: 'Micro-Diagnóstico', entregable: 'microdiagnostico' },
      ],
      no: [
        {
          id: uid(), type: 'dialogo', label: 'Oferta de Llamada',
          mensaje: 'Entiendo, no hay problema. Si prefieres, puedo conectarte con un asesor para una llamada rápida de 15 minutos. ¿Te gustaría?',
          branching: false, si: [], no: [],
        },
      ],
    },
    {
      id: uid(), type: 'dialogo', label: 'Cierre',
      mensaje: 'Fue un gusto conocerte. Quedo al pendiente para cualquier duda.',
      branching: false, si: [], no: [],
    },
  ];
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULTS: AgentConfig = {
  configured: false,
  nombre: '',
  actividad: '',
  propuesta_valor: '',
  evolution_instance: '',
  criterios_buen_lead: '',
  criterios_mal_lead: '',
  cal_booking_url: '',
  journey: [],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgentePage() {
  const [cfg, setCfg] = useState<AgentConfig>({ ...DEFAULTS, journey: makeDefaultJourney() });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    apiFetch<any>('/communications/sales-agent')
      .then((data) => {
        let journey: JourneyNode[] = [];
        if (Array.isArray(data.journey) && data.journey.length > 0) {
          journey = data.journey as JourneyNode[];
        } else {
          journey = makeDefaultJourney();
        }
        setCfg({
          configured: data.configured ?? false,
          nombre: data.nombre ?? '',
          actividad: data.actividad ?? '',
          propuesta_valor: data.propuesta_valor ?? '',
          evolution_instance: data.evolution_instance ?? '',
          criterios_buen_lead: data.criterios_buen_lead ?? '',
          criterios_mal_lead: data.criterios_mal_lead ?? '',
          cal_booking_url: data.cal_booking_url ?? '',
          journey,
        });
      })
      .catch((err) => {
        if (!(err instanceof Error && /not found/i.test(err.message))) {
          setLoadError(true);
        }
      })
      .finally(() => setLoading(false));

    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  function setField(field: keyof Omit<AgentConfig, 'journey' | 'configured'>, value: string) {
    setCfg(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setToast(null);
    try {
      await apiFetch('/communications/sales-agent', {
        method: 'PUT',
        body: JSON.stringify({
          nombre: cfg.nombre,
          actividad: cfg.actividad,
          propuesta_valor: cfg.propuesta_valor,
          evolution_instance: cfg.evolution_instance,
          criterios_buen_lead: cfg.criterios_buen_lead,
          criterios_mal_lead: cfg.criterios_mal_lead,
          cal_booking_url: cfg.cal_booking_url,
          journey: cfg.journey,
        }),
      });
      setToast({ type: 'ok', msg: 'Configuración guardada correctamente.' });
      setCfg(prev => ({ ...prev, configured: true }));
    } catch (err) {
      setToast({ type: 'err', msg: err instanceof Error ? err.message : 'Error al guardar.' });
    } finally {
      setSaving(false);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 4000);
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-5 min-h-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bot className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Journey Builder</h2>
          </div>
          <p className="text-[11px] text-gray-500">
            Define el flujo de conversación del agente en WhatsApp. Agrega diálogos, preguntas y entregables en cualquier parte del journey.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-50 transition-colors flex-shrink-0"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>

      {toast && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium ${
          toast.type === 'ok'
            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
            : 'bg-red-500/15 text-red-300 border border-red-500/30'
        }`}>
          {toast.type === 'ok' ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}

      {loadError && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium bg-red-500/15 text-red-300 border border-red-500/30">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          No se pudo cargar la configuración actual.
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-[380px_1fr] gap-5 items-start">

        {/* Left column — config cards */}
        <div className="space-y-4">
          {/* Conexión WhatsApp */}
          <ConfigCard icon={<Plug className="w-3.5 h-3.5 text-gray-400" />} title="Conexión WhatsApp">
            <p className="text-[10px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              Configura primero la conexión antes de activar el agente.
            </p>
            <Field label="Instancia Evolution API" hint="Nombre exacto que pusiste al crear la instancia para este número.">
              <input value={cfg.evolution_instance} onChange={e => setField('evolution_instance', e.target.value)} placeholder="Ej: agente-ventas-mentoria" className={INPUT} />
            </Field>
          </ConfigCard>

          {/* Identidad */}
          <ConfigCard icon={<Bot className="w-3.5 h-3.5 text-gray-400" />} title="Identidad del Agente">
            <Field label="Nombre del agente">
              <input value={cfg.nombre} onChange={e => setField('nombre', e.target.value)} placeholder="Leo" className={INPUT} />
            </Field>
            <Field label="¿A qué se dedica la empresa?">
              <textarea rows={2} value={cfg.actividad} onChange={e => setField('actividad', e.target.value)} placeholder="MentorIA Systems — Implementamos la metodología IA First…" className={INPUT} />
            </Field>
            <Field label="Propuesta de valor">
              <textarea rows={3} value={cfg.propuesta_valor} onChange={e => setField('propuesta_valor', e.target.value)} placeholder="Somos expertos en simplificar procesos…" className={INPUT} />
            </Field>
          </ConfigCard>

          {/* Calificación */}
          <ConfigCard icon={<Info className="w-3.5 h-3.5 text-gray-400" />} title="Calificación y Cierre">
            <Field label="Criterios de lead bueno" hint="Atributos que hacen que el prospecto califique para una llamada.">
              <textarea rows={3} value={cfg.criterios_buen_lead} onChange={e => setField('criterios_buen_lead', e.target.value)} placeholder={"- Empresa con 10+ años\n- 200-1000 empleados\n- Dolor operativo concreto"} className={INPUT} />
            </Field>
            <Field label="Criterios de lead malo" hint="Cuándo NO agendar llamada.">
              <textarea rows={2} value={cfg.criterios_mal_lead} onChange={e => setField('criterios_mal_lead', e.target.value)} placeholder={"- Startup < 3 años\n- Menos de 50 empleados"} className={INPUT} />
            </Field>
            <Field label="Link de Cal.com" hint="Se envía cuando el prospecto califica.">
              <input value={cfg.cal_booking_url} onChange={e => setField('cal_booking_url', e.target.value)} placeholder="https://cal.com/tu-usuario/diagnostico" className={INPUT} type="url" />
            </Field>
          </ConfigCard>
        </div>

        {/* Right column — journey */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1 mb-1">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Journey de conversación</span>
            <span className="text-[10px] text-gray-600">— edita el nombre de cada paso o agrega nuevos</span>
          </div>
          <JourneyEditor
            nodes={cfg.journey}
            onChange={(journey) => setCfg(prev => ({ ...prev, journey }))}
            depth={0}
          />
        </div>

      </div>
    </div>
  );
}

// ─── Journey Editor ───────────────────────────────────────────────────────────

function JourneyEditor({
  nodes,
  onChange,
  depth = 0,
}: {
  nodes: JourneyNode[];
  onChange: (nodes: JourneyNode[]) => void;
  depth?: number;
}) {
  function insertAt(index: number, node: JourneyNode) {
    const next = [...nodes];
    next.splice(index, 0, node);
    onChange(next);
  }

  function removeAt(index: number) {
    onChange(nodes.filter((_, i) => i !== index));
  }

  function updateAt(index: number, updated: JourneyNode) {
    const next = [...nodes];
    next[index] = updated;
    onChange(next);
  }

  return (
    <div>
      <AddNodePicker onAdd={(node) => insertAt(0, node)} depth={depth} />
      {nodes.map((node, i) => (
        <React.Fragment key={node.id}>
          <NodeCard
            node={node}
            onUpdate={(updated) => updateAt(i, updated)}
            onDelete={() => removeAt(i)}
            depth={depth}
          />
          <AddNodePicker onAdd={(node) => insertAt(i + 1, node)} depth={depth} />
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Node Card ────────────────────────────────────────────────────────────────

const NODE_COLORS = {
  dialogo:    { badge: 'bg-sky-500/15 text-sky-400',        border: 'border-sky-500/20',     icon: 'text-sky-400'     },
  pregunta:   { badge: 'bg-violet-500/15 text-violet-400',  border: 'border-violet-500/20',  icon: 'text-violet-400'  },
  entregable: { badge: 'bg-emerald-500/15 text-emerald-400', border: 'border-emerald-500/20', icon: 'text-emerald-400' },
} as const;

const NODE_ICONS: Record<JourneyNode['type'], React.ReactNode> = {
  dialogo:    <MessageSquare className="w-3 h-3" />,
  pregunta:   <HelpCircle className="w-3 h-3" />,
  entregable: <Package className="w-3 h-3" />,
};

const NODE_LABELS: Record<JourneyNode['type'], string> = {
  dialogo: 'Diálogo',
  pregunta: 'Pregunta',
  entregable: 'Entregable',
};

function NodeCard({
  node,
  onUpdate,
  onDelete,
  depth,
}: {
  node: JourneyNode;
  onUpdate: (n: JourneyNode) => void;
  onDelete: () => void;
  depth: number;
}) {
  const colors = NODE_COLORS[node.type];

  return (
    <div className={`bg-white/[0.03] border ${colors.border} rounded-xl p-4 space-y-3`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${colors.badge}`}>
          <span className={colors.icon}>{NODE_ICONS[node.type]}</span>
          {NODE_LABELS[node.type]}
        </span>
        <input
          value={node.label}
          onChange={e => onUpdate({ ...node, label: e.target.value })}
          placeholder="Nombre del paso"
          className="flex-1 bg-transparent border-b border-white/10 focus:border-white/30 text-[11px] text-white placeholder-gray-600 outline-none pb-0.5 transition-colors"
        />
        <button
          onClick={onDelete}
          className="text-gray-700 hover:text-red-400 transition-colors flex-shrink-0 ml-1"
          aria-label="Eliminar nodo"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {node.type === 'dialogo'    && <DialogoBody    node={node} onUpdate={onUpdate} depth={depth} />}
      {node.type === 'pregunta'   && <PreguntaBody   node={node} onUpdate={onUpdate} />}
      {node.type === 'entregable' && <EntregableBody node={node} />}
    </div>
  );
}

// ─── Dialogo Body ─────────────────────────────────────────────────────────────

function DialogoBody({
  node,
  onUpdate,
  depth,
}: {
  node: DialogoNode;
  onUpdate: (n: JourneyNode) => void;
  depth: number;
}) {
  return (
    <div className="space-y-3">
      <textarea
        rows={3}
        value={node.mensaje}
        onChange={e => onUpdate({ ...node, mensaje: e.target.value })}
        placeholder="Escribe el mensaje que enviará el agente…"
        className={INPUT}
      />

      <button
        onClick={() => onUpdate({ ...node, branching: !node.branching })}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors border ${
          node.branching
            ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
            : 'bg-white/5 text-gray-500 border-white/8 hover:text-gray-300'
        }`}
      >
        <GitBranch className="w-3 h-3" />
        {node.branching ? 'Con bifurcación Sí / No' : 'Agregar bifurcación Sí / No'}
      </button>

      {node.branching && depth < 2 && (
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="space-y-1.5">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400/60 flex-shrink-0" />
              Si acepta
            </span>
            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2">
              <JourneyEditor nodes={node.si} onChange={(si) => onUpdate({ ...node, si })} depth={depth + 1} />
            </div>
          </div>
          <div className="space-y-1.5">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400/60 flex-shrink-0" />
              Si rechaza
            </span>
            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2">
              <JourneyEditor nodes={node.no} onChange={(no) => onUpdate({ ...node, no })} depth={depth + 1} />
            </div>
          </div>
        </div>
      )}

      {node.branching && depth >= 2 && (
        <p className="text-[10px] text-gray-600">Profundidad máxima de bifurcación alcanzada.</p>
      )}
    </div>
  );
}

// ─── Pregunta Body ────────────────────────────────────────────────────────────

function PreguntaBody({
  node,
  onUpdate,
}: {
  node: PreguntaNode;
  onUpdate: (n: JourneyNode) => void;
}) {
  return (
    <div className="space-y-3">
      <input
        value={node.pregunta}
        onChange={e => onUpdate({ ...node, pregunta: e.target.value })}
        placeholder="¿Cuál es la pregunta que hará el agente?"
        className={INPUT}
      />

      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-600">Tipo:</span>
        <button
          aria-pressed={node.answerType === 'open'}
          onClick={() => onUpdate({ ...node, answerType: 'open', options: [] })}
          className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors border ${
            node.answerType === 'open'
              ? 'bg-violet-500/15 text-violet-300 border-violet-500/30'
              : 'bg-white/5 text-gray-500 border-white/8 hover:text-gray-300'
          }`}
        >
          Texto libre
        </button>
        <button
          aria-pressed={node.answerType === 'multiple'}
          onClick={() => onUpdate({ ...node, answerType: 'multiple', options: node.options.length ? node.options : [''] })}
          className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors border ${
            node.answerType === 'multiple'
              ? 'bg-violet-500/15 text-violet-300 border-violet-500/30'
              : 'bg-white/5 text-gray-500 border-white/8 hover:text-gray-300'
          }`}
        >
          Opción múltiple
        </button>
      </div>

      {node.answerType === 'multiple' && (
        <div className="space-y-2 pl-2">
          {node.options.map((opt, j) => (
            <div key={j} className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600 w-4 flex-shrink-0">{j + 1}.</span>
              <input
                value={opt}
                onChange={e => {
                  const next = [...node.options];
                  next[j] = e.target.value;
                  onUpdate({ ...node, options: next });
                }}
                placeholder={`Opción ${j + 1}`}
                className={`${INPUT} flex-1`}
              />
              {node.options.length > 1 && (
                <button
                  onClick={() => onUpdate({ ...node, options: node.options.filter((_, i) => i !== j) })}
                  className="text-gray-600 hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => onUpdate({ ...node, options: [...node.options, ''] })}
            className="flex items-center gap-1.5 text-[10px] text-violet-400 hover:text-violet-300 transition-colors mt-1"
          >
            <Plus className="w-3 h-3" />
            Agregar opción
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Entregable Body ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function EntregableBody({ node: _node }: { node: EntregableNode }) {
  return (
    <div className="flex items-start gap-2.5 bg-white/[0.03] border border-white/5 rounded-lg px-4 py-3">
      <Info className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
      <p className="text-[11px] text-gray-500 leading-relaxed">
        El agente genera el diagnóstico con IA y envía el enlace a{' '}
        <span className="text-gray-400 font-mono">app.flowdesk.mx/micro/[token]</span>.
        El CRM se actualiza automáticamente.
      </p>
    </div>
  );
}

// ─── Add Node Picker ──────────────────────────────────────────────────────────

function AddNodePicker({
  onAdd,
  depth,
}: {
  onAdd: (node: JourneyNode) => void;
  depth: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function add(type: JourneyNode['type']) {
    let node: JourneyNode;
    if (type === 'dialogo') {
      node = { id: uid(), type: 'dialogo', label: 'Nuevo diálogo', mensaje: '', branching: false, si: [], no: [] };
    } else if (type === 'pregunta') {
      node = { id: uid(), type: 'pregunta', label: 'Nueva pregunta', pregunta: '', answerType: 'open', options: [] };
    } else {
      node = { id: uid(), type: 'entregable', label: 'Micro-Diagnóstico', entregable: 'microdiagnostico' };
    }
    onAdd(node);
    setOpen(false);
  }

  return (
    <div className="relative flex justify-center py-1" ref={ref}>
      <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-px ${depth === 0 ? 'bg-white/5' : 'bg-white/[0.03]'}`} />
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative z-10 flex items-center justify-center w-5 h-5 rounded-full bg-[#111] border border-white/10 text-gray-600 hover:text-gray-300 hover:border-white/20 transition-colors"
        aria-label="Agregar nodo"
      >
        <Plus className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute z-50 top-7 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl p-2 flex gap-1.5 w-max">
          {(['dialogo', 'pregunta', 'entregable'] as JourneyNode['type'][]).map(type => (
            <NodeTypeButton key={type} type={type} onClick={() => add(type)} />
          ))}
        </div>
      )}
    </div>
  );
}

function NodeTypeButton({ type, onClick }: { type: JourneyNode['type']; onClick: () => void }) {
  const colors = NODE_COLORS[type];
  const desc: Record<JourneyNode['type'], string> = { dialogo: 'Diálogo', pregunta: 'Pregunta', entregable: 'Entregable' };
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border text-[10px] font-medium transition-colors hover:bg-white/5 ${colors.badge} ${colors.border}`}
    >
      <span className={colors.icon}>{NODE_ICONS[type]}</span>
      {desc[type]}
    </button>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────

const INPUT =
  'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/8 transition-colors resize-none';

function ConfigCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-[11px] font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  const id = useId();
  const childWithId = React.Children.map(children, (child, index) =>
    index === 0 && React.isValidElement(child)
      ? React.cloneElement(child as React.ReactElement<{ id?: string }>, { id })
      : child
  );
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium text-gray-300">{label}</label>
      {hint && <p className="text-[10px] text-gray-600">{hint}</p>}
      {childWithId}
    </div>
  );
}
