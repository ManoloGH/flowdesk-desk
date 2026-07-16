'use client';
import { useState, useEffect } from 'react';
import { Bot, Save, AlertCircle, CheckCircle2, Plug, Info } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface AgentConfig {
  configured: boolean;
  // Stage 1-2: Identity
  nombre: string | null;
  actividad: string | null;
  propuesta_valor: string | null;
  // Stage 3: Gancho
  gancho: string | null;
  // Stage 4: 5 preguntas
  preguntas_microdiagnostico: string[];
  // Stage 6: Cierre
  cierre_calificado: string | null;
  cierre_no_calificado: string | null;
  criterios_buen_lead: string | null;
  criterios_mal_lead: string | null;
  cal_booking_url: string | null;
  // Connection
  evolution_instance: string | null;
}

const DEFAULTS: AgentConfig = {
  configured: false,
  nombre: '',
  actividad: '',
  propuesta_valor: '',
  gancho: '',
  preguntas_microdiagnostico: ['', '', '', '', ''],
  cierre_calificado: '',
  cierre_no_calificado: '',
  criterios_buen_lead: '',
  criterios_mal_lead: '',
  cal_booking_url: '',
  evolution_instance: '',
};

const PREGUNTA_PLACEHOLDERS = [
  '¿A qué se dedica la empresa y cuántos años lleva operando?',
  '¿Cuántos empleados tiene?',
  '¿Qué software o herramientas digitales usan hoy en día?',
  '¿Tienen área de programación?',
  '¿Qué tarea o proceso les genera cuello de botella?',
];

export default function AgentePage() {
  const [cfg, setCfg] = useState<AgentConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  useEffect(() => {
    apiFetch<AgentConfig & { preguntas_calificacion?: string[] }>('/communications/sales-agent')
      .then((data) => {
        const rawNew = data.preguntas_microdiagnostico ?? [];
        const rawLegacy = data.preguntas_calificacion ?? [];
        const raw = rawNew.length ? rawNew : rawLegacy;
        const preguntas_microdiagnostico = Array.from({ length: 5 }, (_, i) => raw[i] ?? '');
        setCfg({
          ...DEFAULTS,
          ...data,
          preguntas_microdiagnostico,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function set(field: keyof AgentConfig, value: string) {
    setCfg(prev => ({ ...prev, [field]: value }));
  }

  function setPregunta(index: number, value: string) {
    setCfg(prev => {
      const arr = [...prev.preguntas_microdiagnostico];
      arr[index] = value;
      return { ...prev, preguntas_microdiagnostico: arr };
    });
  }

  async function handleSave() {
    setSaving(true);
    setToast(null);
    try {
      await apiFetch('/communications/sales-agent', {
        method: 'PUT',
        body: JSON.stringify({
          ...cfg,
          preguntas_microdiagnostico: cfg.preguntas_microdiagnostico.filter(p => p.trim()),
        }),
      });
      setToast({ type: 'ok', msg: 'Configuración guardada correctamente.' });
      setCfg(prev => ({ ...prev, configured: true }));
    } catch (err: any) {
      setToast({ type: 'err', msg: err.message ?? 'Error al guardar.' });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-white/5 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bot className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Journey Builder</h2>
          </div>
          <p className="text-[11px] text-gray-500">
            Define las 6 etapas del journey de WhatsApp: presentación, gancho, micro-diagnóstico y cierre.
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

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium ${
          toast.type === 'ok'
            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
            : 'bg-red-500/15 text-red-300 border border-red-500/30'
        }`}>
          {toast.type === 'ok'
            ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Conexión WhatsApp — TOP */}
      <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Plug className="w-3.5 h-3.5 text-gray-400" />
          <h3 className="text-[11px] font-semibold text-white">Conexión WhatsApp</h3>
        </div>
        <p className="text-[10px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          Configura primero la conexión antes de activar el agente.
        </p>
        <Field
          label="Nombre de instancia Evolution API"
          hint="El nombre que pusiste al crear la instancia para este número. El bot solo recibirá mensajes de esa instancia."
        >
          <input
            value={cfg.evolution_instance ?? ''}
            onChange={e => set('evolution_instance', e.target.value)}
            placeholder="Ej: agente-ventas-mentoria"
            className={INPUT}
          />
        </Field>
      </div>

      {/* Etapas 1-2: Presentación e Identidad */}
      <StageSection
        badge="1·2"
        title="Presentación e Identidad"
        subtitle="El agente usa esto para presentarse y entender el negocio del prospecto."
      >
        <Field label="Nombre del agente">
          <input
            value={cfg.nombre ?? ''}
            onChange={e => set('nombre', e.target.value)}
            placeholder="Leo"
            className={INPUT}
          />
        </Field>
        <Field label="¿A qué se dedica tu empresa?">
          <textarea
            rows={2}
            value={cfg.actividad ?? ''}
            onChange={e => set('actividad', e.target.value)}
            placeholder="MentorIA Systems — Implementamos la metodología IA First…"
            className={INPUT}
          />
        </Field>
        <Field label="Propuesta de valor">
          <textarea
            rows={3}
            value={cfg.propuesta_valor ?? ''}
            onChange={e => set('propuesta_valor', e.target.value)}
            placeholder="Somos expertos en simplificar procesos…"
            className={INPUT}
          />
        </Field>
      </StageSection>

      {/* Etapa 3: Gancho */}
      <StageSection
        badge="3"
        title="Oferta del Micro-Diagnóstico"
        subtitle="Texto que el agente usa para ofrecer el diagnóstico gratuito. Se envía cuando ya tiene contexto del negocio."
      >
        <textarea
          rows={4}
          value={cfg.gancho ?? ''}
          onChange={e => set('gancho', e.target.value)}
          placeholder="Me gustaría ofrecerte algo: podemos hacerte un micro-diagnóstico gratuito…"
          className={INPUT}
        />
        <p className="text-[10px] text-gray-600">
          El prospecto debe aceptar antes de que el agente haga las preguntas.
        </p>
      </StageSection>

      {/* Etapa 4: 5 Preguntas del Micro-Diagnóstico */}
      <StageSection
        badge="4"
        title="Preguntas del Diagnóstico"
        subtitle="El agente las hace una por una, esperando respuesta entre cada una. Deben ser siempre exactamente 5."
      >
        <div className="space-y-2">
          {cfg.preguntas_microdiagnostico.map((p, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-[10px] text-gray-600 w-4 flex-shrink-0">{i + 1}.</span>
              <input
                value={p}
                onChange={e => setPregunta(i, e.target.value)}
                placeholder={PREGUNTA_PLACEHOLDERS[i]}
                className={`${INPUT} flex-1`}
              />
            </div>
          ))}
        </div>
      </StageSection>

      {/* Etapa 5: Entrega Automática (info only) */}
      <StageSection
        badge="5"
        title="Entrega Automática"
        subtitle="Esta etapa es automática — el agente genera el diagnóstico con IA y envía el enlace al prospecto."
        info
      >
        <div className="flex items-start gap-2.5 bg-white/[0.03] border border-white/5 rounded-lg px-4 py-3">
          <Info className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-gray-500 leading-relaxed">
            El diagnóstico se genera con IA usando las 5 respuestas y se publica en{' '}
            <span className="text-gray-400 font-mono">app.flowdesk.mx/micro/[token]</span>.
            El CRM se actualiza automáticamente.
          </p>
        </div>
      </StageSection>

      {/* Etapa 6: Cierre y Calificación */}
      <StageSection
        badge="6"
        title="Cierre y Calificación"
        subtitle="Qué dice el agente según el resultado de la calificación."
      >
        <Field label="Lead califica (score ≥ 7)">
          <textarea
            rows={3}
            value={cfg.cierre_calificado ?? ''}
            onChange={e => set('cierre_calificado', e.target.value)}
            placeholder="Creo que hay una oportunidad real…"
            className={`${INPUT} border-l-2 border-l-emerald-500/50 rounded-l-none pl-3`}
          />
        </Field>
        <Field label="Lead no califica">
          <textarea
            rows={2}
            value={cfg.cierre_no_calificado ?? ''}
            onChange={e => set('cierre_no_calificado', e.target.value)}
            placeholder="Gracias por compartirme esto…"
            className={`${INPUT} border-l-2 border-l-amber-500/50 rounded-l-none pl-3`}
          />
        </Field>
        <Field label="Criterios de lead bueno" hint="Lista los atributos que hacen que el prospecto califique.">
          <textarea
            rows={3}
            value={cfg.criterios_buen_lead ?? ''}
            onChange={e => set('criterios_buen_lead', e.target.value)}
            placeholder={"- Empresa con 10+ años\n- 200-1000 empleados\n- Dolor operativo concreto\n- Decisor en la conversación"}
            className={INPUT}
          />
        </Field>
        <Field label="Criterios de lead malo" hint="Cuándo NO agendar.">
          <textarea
            rows={2}
            value={cfg.criterios_mal_lead ?? ''}
            onChange={e => set('criterios_mal_lead', e.target.value)}
            placeholder={"- Startup o empresa < 3 años\n- Menos de 50 empleados\n- Solo curiosidad sin dolor"}
            className={INPUT}
          />
        </Field>
        <Field label="Link de Cal.com" hint="El agente lo envía cuando el prospecto califica.">
          <input
            value={cfg.cal_booking_url ?? ''}
            onChange={e => set('cal_booking_url', e.target.value)}
            placeholder="https://cal.com/tu-usuario/diagnostico"
            className={INPUT}
            type="url"
          />
        </Field>
      </StageSection>
    </div>
  );
}

const INPUT =
  'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/8 transition-colors resize-none';

function StageSection({
  badge,
  title,
  subtitle,
  children,
  info,
}: {
  badge: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  info?: boolean;
}) {
  return (
    <div
      className={`bg-white/[0.03] border rounded-xl p-5 space-y-4 ${
        info ? 'border-white/5' : 'border-white/8'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
            info ? 'bg-white/5 text-gray-500' : 'bg-cyan-500/15 text-cyan-400'
          }`}
        >
          {badge}
        </span>
        <div>
          <h3 className="text-[11px] font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-[10px] text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
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
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-300">{label}</label>
      {hint && <p className="text-[10px] text-gray-600">{hint}</p>}
      {children}
    </div>
  );
}
