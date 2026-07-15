'use client';
import { useState, useEffect } from 'react';
import { Bot, Save, Plus, X, AlertCircle, CheckCircle2, Plug } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

interface AgentConfig {
  configured: boolean;
  nombre: string | null;
  actividad: string | null;
  propuesta_valor: string | null;
  preguntas_calificacion: string[];
  criterios_buen_lead: string | null;
  criterios_mal_lead: string | null;
  cal_booking_url: string | null;
  evolution_instance: string | null;
}

const DEFAULTS: AgentConfig = {
  configured: false,
  nombre: '',
  actividad: '',
  propuesta_valor: '',
  preguntas_calificacion: [''],
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

  useEffect(() => {
    const token = document.cookie.match(/token=([^;]+)/)?.[1];
    fetch(`${API}/communications/sales-agent`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then((data: AgentConfig) => {
        setCfg({
          ...DEFAULTS,
          ...data,
          preguntas_calificacion: data.preguntas_calificacion?.length
            ? data.preguntas_calificacion
            : [''],
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function set(field: keyof AgentConfig, value: any) {
    setCfg(prev => ({ ...prev, [field]: value }));
  }

  function setPregunta(index: number, value: string) {
    setCfg(prev => {
      const arr = [...prev.preguntas_calificacion];
      arr[index] = value;
      return { ...prev, preguntas_calificacion: arr };
    });
  }

  function addPregunta() {
    setCfg(prev => ({ ...prev, preguntas_calificacion: [...prev.preguntas_calificacion, ''] }));
  }

  function removePregunta(index: number) {
    setCfg(prev => ({
      ...prev,
      preguntas_calificacion: prev.preguntas_calificacion.filter((_, i) => i !== index),
    }));
  }

  async function handleSave() {
    setSaving(true);
    setToast(null);
    try {
      const token = document.cookie.match(/token=([^;]+)/)?.[1];
      const res = await fetch(`${API}/communications/sales-agent`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...cfg,
          preguntas_calificacion: cfg.preguntas_calificacion.filter(p => p.trim()),
        }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
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
            <h2 className="text-sm font-bold text-white">Agente de Ventas</h2>
          </div>
          <p className="text-[11px] text-gray-500">
            Configura cómo presenta tu negocio, califica prospectos y agenda reuniones por WhatsApp.
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

      {/* Sección 1: Negocio */}
      <Section title="1. Tu negocio">
        <Field label="Nombre del negocio">
          <input
            value={cfg.nombre ?? ''}
            onChange={e => set('nombre', e.target.value)}
            placeholder="Ej: MentorIA Systems"
            className={INPUT}
          />
        </Field>
        <Field label="¿A qué se dedica?" hint="Una frase directa: qué haces y para quién.">
          <textarea
            rows={2}
            value={cfg.actividad ?? ''}
            onChange={e => set('actividad', e.target.value)}
            placeholder="Ej: Implementamos FlowDesk en empresas medianas que quieren operar con IA."
            className={INPUT}
          />
        </Field>
      </Section>

      {/* Sección 2: Propuesta de valor */}
      <Section title="2. Propuesta de valor">
        <Field label="¿Por qué tu empresa?" hint="2-3 oraciones. Qué transforma, para quién, por qué ahora.">
          <textarea
            rows={4}
            value={cfg.propuesta_valor ?? ''}
            onChange={e => set('propuesta_valor', e.target.value)}
            placeholder="Ej: Tu empresa lleva décadas construyendo algo sólido. FlowDesk conecta tus operaciones…"
            className={INPUT}
          />
        </Field>
      </Section>

      {/* Sección 3: Preguntas de calificación */}
      <Section title="3. Preguntas de calificación">
        <p className="text-[11px] text-gray-500 mb-3">
          El agente las hace una a una para calificar al prospecto. Máximo 5.
        </p>
        <div className="space-y-2">
          {cfg.preguntas_calificacion.map((p, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-[10px] text-gray-600 pt-2.5 w-4 flex-shrink-0">{i + 1}.</span>
              <input
                value={p}
                onChange={e => setPregunta(i, e.target.value)}
                placeholder={`Pregunta ${i + 1}`}
                className={`${INPUT} flex-1`}
              />
              {cfg.preguntas_calificacion.length > 1 && (
                <button
                  onClick={() => removePregunta(i)}
                  className="mt-2 text-gray-600 hover:text-red-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          {cfg.preguntas_calificacion.length < 5 && (
            <button
              onClick={addPregunta}
              className="flex items-center gap-1.5 text-[11px] text-cyan-500 hover:text-cyan-300 transition-colors mt-1"
            >
              <Plus className="w-3 h-3" />
              Agregar pregunta
            </button>
          )}
        </div>
      </Section>

      {/* Sección 0: Conexión WhatsApp */}
      <Section title="0. Conexión WhatsApp">
        <Field
          label="Nombre de instancia Evolution API"
          hint="El nombre que pusiste al crear la instancia para este número en Evolution API. El bot sólo recibirá mensajes de esa instancia."
        >
          <div className="flex gap-2 items-center">
            <Plug className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
            <input
              value={cfg.evolution_instance ?? ''}
              onChange={e => set('evolution_instance', e.target.value)}
              placeholder="Ej: agente-ventas-mentoria"
              className={`${INPUT} flex-1`}
            />
          </div>
          <p className="text-[10px] text-gray-700 mt-1">
            Sin este campo el bot no recibirá mensajes aunque Evolution API esté configurado.
          </p>
        </Field>
      </Section>

      {/* Sección 4: Criterios + Cal.com */}
      <Section title="4. Criterios y acción">
        <Field label="Lead bueno — procede a agendar" hint="Lista los criterios: empresa con X años, N empleados, dolor real…">
          <textarea
            rows={4}
            value={cfg.criterios_buen_lead ?? ''}
            onChange={e => set('criterios_buen_lead', e.target.value)}
            placeholder={"- Empresa con 10+ años\n- 200-1000 empleados\n- Dolor operativo concreto\n- Decisor en la conversación"}
            className={INPUT}
          />
        </Field>
        <Field label="Lead no califica — responde con calidez" hint="Cuándo NO agendar.">
          <textarea
            rows={3}
            value={cfg.criterios_mal_lead ?? ''}
            onChange={e => set('criterios_mal_lead', e.target.value)}
            placeholder={"- Startup o empresa < 3 años\n- Menos de 50 empleados\n- Solo curiosidad sin dolor"}
            className={INPUT}
          />
        </Field>
        <Field label="Link de Cal.com para agendar" hint="El agente lo envía cuando el prospecto califica.">
          <input
            value={cfg.cal_booking_url ?? ''}
            onChange={e => set('cal_booking_url', e.target.value)}
            placeholder="https://cal.com/tu-usuario/diagnostico"
            className={INPUT}
            type="url"
          />
        </Field>
      </Section>
    </div>
  );
}

const INPUT = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/8 transition-colors resize-none';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5 space-y-4">
      <h3 className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-300">{label}</label>
      {hint && <p className="text-[10px] text-gray-600">{hint}</p>}
      {children}
    </div>
  );
}
