'use client';
import React, { useState, useEffect, useRef, useId, type ReactNode } from 'react';
import { Bot, Save, AlertCircle, CheckCircle2, Plug, Info, Plus, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Pregunta {
  text: string;
  type: 'open' | 'multiple';
  options: string[];
}

interface AgentConfig {
  configured: boolean;
  // Stage 1-2: Identity
  nombre: string | null;
  actividad: string | null;
  propuesta_valor: string | null;
  // Stage 3: Gancho
  gancho: string | null;
  oferta_llamada_sin_diagnostico: string | null;
  // Stage 4: Preguntas dinámicas
  preguntas_microdiagnostico: Pregunta[];
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
  oferta_llamada_sin_diagnostico: '',
  preguntas_microdiagnostico: [
    { text: '', type: 'open', options: [] },
  ],
  cierre_calificado: '',
  cierre_no_calificado: '',
  criterios_buen_lead: '',
  criterios_mal_lead: '',
  cal_booking_url: '',
  evolution_instance: '',
};

export default function AgentePage() {
  const [cfg, setCfg] = useState<AgentConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    apiFetch<AgentConfig & { preguntas_calificacion?: any[] }>('/communications/sales-agent')
      .then((data) => {
        const rawPreguntas = data.preguntas_microdiagnostico ?? data.preguntas_calificacion ?? [];
        const preguntas_microdiagnostico: Pregunta[] = rawPreguntas.length
          ? rawPreguntas.map((q: any) =>
              typeof q === 'string'
                ? { text: q, type: 'open' as const, options: [] }
                : { text: q.text ?? '', type: q.type ?? 'open', options: q.options ?? [] }
            )
          : [{ text: '', type: 'open', options: [] }];
        setCfg({
          ...DEFAULTS,
          ...data,
          preguntas_microdiagnostico,
        });
      })
      .catch((err) => {
        // 404 = first time configuring (not an error), anything else is a real error
        if (!(err instanceof Error && /not found/i.test(err.message))) {
          setLoadError(true);
        }
      })
      .finally(() => setLoading(false));

    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function set(field: keyof AgentConfig, value: string) {
    setCfg(prev => ({ ...prev, [field]: value }));
  }

  function addPregunta() {
    setCfg(prev => ({
      ...prev,
      preguntas_microdiagnostico: [
        ...prev.preguntas_microdiagnostico,
        { text: '', type: 'open', options: [] },
      ],
    }));
  }

  function removePregunta(index: number) {
    setCfg(prev => ({
      ...prev,
      preguntas_microdiagnostico: prev.preguntas_microdiagnostico.filter((_, i) => i !== index),
    }));
  }

  function updatePregunta(index: number, field: keyof Pregunta, value: any) {
    setCfg(prev => {
      const arr = [...prev.preguntas_microdiagnostico];
      arr[index] = { ...arr[index], [field]: value };
      // If switching to 'open', clear options
      if (field === 'type' && value === 'open') {
        arr[index] = { ...arr[index], options: [] };
      }
      // If switching to 'multiple', add one empty option
      if (field === 'type' && value === 'multiple' && arr[index].options.length === 0) {
        arr[index] = { ...arr[index], options: [''] };
      }
      return { ...prev, preguntas_microdiagnostico: arr };
    });
  }

  function addOption(preguntaIndex: number) {
    setCfg(prev => {
      const arr = [...prev.preguntas_microdiagnostico];
      arr[preguntaIndex] = {
        ...arr[preguntaIndex],
        options: [...arr[preguntaIndex].options, ''],
      };
      return { ...prev, preguntas_microdiagnostico: arr };
    });
  }

  function updateOption(preguntaIndex: number, optionIndex: number, value: string) {
    setCfg(prev => {
      const arr = [...prev.preguntas_microdiagnostico];
      const opts = [...arr[preguntaIndex].options];
      opts[optionIndex] = value;
      arr[preguntaIndex] = { ...arr[preguntaIndex], options: opts };
      return { ...prev, preguntas_microdiagnostico: arr };
    });
  }

  function removeOption(preguntaIndex: number, optionIndex: number) {
    setCfg(prev => {
      const arr = [...prev.preguntas_microdiagnostico];
      arr[preguntaIndex] = {
        ...arr[preguntaIndex],
        options: arr[preguntaIndex].options.filter((_, i) => i !== optionIndex),
      };
      return { ...prev, preguntas_microdiagnostico: arr };
    });
  }

  async function handleSave() {
    const emptyQuestion = cfg.preguntas_microdiagnostico.findIndex(q => !q.text.trim());
    if (emptyQuestion !== -1) {
      setToast({ type: 'err', msg: `La pregunta ${emptyQuestion + 1} no tiene texto.` });
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 4000);
      return;
    }

    const emptyOption = cfg.preguntas_microdiagnostico.findIndex(
      q => q.type === 'multiple' && q.options.some(o => !o.trim())
    );
    if (emptyOption !== -1) {
      setToast({ type: 'err', msg: `La pregunta ${emptyOption + 1} tiene opciones vacías.` });
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 4000);
      return;
    }

    setSaving(true);
    setToast(null);
    const { configured: _configured, ...payload } = cfg;
    try {
      await apiFetch('/communications/sales-agent', {
        method: 'PUT',
        body: JSON.stringify({
          ...payload,
          preguntas_microdiagnostico: cfg.preguntas_microdiagnostico,
        }),
      });
      setToast({ type: 'ok', msg: 'Configuración guardada correctamente.' });
      setCfg(prev => ({ ...prev, configured: true }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar.';
      setToast({ type: 'err', msg });
    } finally {
      setSaving(false);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 4000);
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

      {loadError && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium bg-red-500/15 text-red-300 border border-red-500/30">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          No se pudo cargar la configuración actual. Los campos muestran valores por defecto.
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

      {/* Etapa 2.5: Datos del Prospecto (automático) */}
      <StageSection
        badge="2.5"
        title="Datos del Prospecto"
        subtitle="El agente recoge esta información antes de hacer el gancho. Siempre se pregunta una a la vez, en este orden."
        info
      >
        <div className="space-y-2">
          {[
            { n: 1, q: '¿Cuál es tu nombre?' },
            { n: 2, q: '¿Cuál es el nombre de tu empresa?' },
            { n: 3, q: '¿A qué se dedica tu empresa?' },
          ].map(({ n, q }) => (
            <div key={n} className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-lg px-4 py-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-gray-500 font-bold">{n}</span>
              <span className="text-[11px] text-gray-400">{q}</span>
              <span className="ml-auto text-[10px] text-gray-600 font-mono">automático</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-600">
          Estas preguntas son fijas y no se pueden modificar. Las respuestas se usan para personalizar el diagnóstico.
        </p>
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
        <Field label="Si no acepta el diagnóstico — ofrecer llamada" hint="Leo usa este texto cuando el prospecto rechaza el micro-diagnóstico. Si lo acepta, se queda callado.">
          <textarea
            rows={3}
            value={cfg.oferta_llamada_sin_diagnostico ?? ''}
            onChange={e => set('oferta_llamada_sin_diagnostico', e.target.value)}
            placeholder="Entiendo, no hay problema. Si prefieres, podemos agendar una llamada de 15 minutos con uno de nuestros asesores para platicar sobre cómo funcionan nuestros servicios. ¿Te gustaría?"
            className={INPUT}
          />
        </Field>
      </StageSection>

      {/* Etapa 4: Preguntas dinámicas del Micro-Diagnóstico */}
      <StageSection
        badge="4"
        title="Preguntas del Diagnóstico"
        subtitle="El agente las hace una por una. Puedes usar texto libre u opciones para que el prospecto conteste apretando un botón."
      >
        <div className="space-y-4">
          {cfg.preguntas_microdiagnostico.map((pregunta, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/8 rounded-lg p-4 space-y-3">
              {/* Question header */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 flex-shrink-0 w-5">{i + 1}.</span>
                <input
                  value={pregunta.text}
                  onChange={e => updatePregunta(i, 'text', e.target.value)}
                  placeholder={`Pregunta ${i + 1}`}
                  className={`${INPUT} flex-1`}
                  aria-label={`Pregunta ${i + 1}`}
                />
                <button
                  onClick={() => removePregunta(i)}
                  disabled={cfg.preguntas_microdiagnostico.length <= 1}
                  className="text-gray-600 hover:text-red-400 transition-colors disabled:opacity-30"
                  aria-label={`Eliminar pregunta ${i + 1}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Type toggle */}
              <div className="flex items-center gap-2 pl-7">
                <span className="text-[10px] text-gray-600">Tipo:</span>
                <button
                  aria-pressed={pregunta.type === 'open'}
                  onClick={() => updatePregunta(i, 'type', 'open')}
                  className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
                    pregunta.type === 'open'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-white/5 text-gray-500 border border-white/8 hover:text-gray-300'
                  }`}
                >
                  Texto libre
                </button>
                <button
                  aria-pressed={pregunta.type === 'multiple'}
                  onClick={() => updatePregunta(i, 'type', 'multiple')}
                  className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
                    pregunta.type === 'multiple'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-white/5 text-gray-500 border border-white/8 hover:text-gray-300'
                  }`}
                >
                  Opción múltiple
                </button>
              </div>

              {/* Options (only for multiple choice) */}
              {pregunta.type === 'multiple' && (
                <div className="pl-7 space-y-2">
                  {pregunta.options.map((option, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-600 w-4 flex-shrink-0">{j + 1}.</span>
                      <input
                        value={option}
                        onChange={e => updateOption(i, j, e.target.value)}
                        placeholder={`Opción ${j + 1}`}
                        className={`${INPUT} flex-1`}
                        aria-label={`Opción ${j + 1} de pregunta ${i + 1}`}
                      />
                      {pregunta.options.length > 1 && (
                        <button
                          onClick={() => removeOption(i, j)}
                          className="text-gray-600 hover:text-red-400 transition-colors"
                          aria-label={`Eliminar opción ${j + 1} de pregunta ${i + 1}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(i)}
                    className="flex items-center gap-1.5 text-[10px] text-cyan-500 hover:text-cyan-300 transition-colors mt-1"
                  >
                    <Plus className="w-3 h-3" />
                    Agregar opción
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Add question button */}
          <button
            onClick={addPregunta}
            className="flex items-center gap-1.5 text-[10px] text-cyan-500 hover:text-cyan-300 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Agregar pregunta
          </button>
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
            El diagnóstico se genera con IA usando las respuestas y se publica en{' '}
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
  children?: ReactNode;
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
  children: ReactNode;
}) {
  const id = useId();
  const childWithId = React.Children.map(children, (child, index) =>
    index === 0 && React.isValidElement(child)
      ? React.cloneElement(child as React.ReactElement<any>, { id })
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
