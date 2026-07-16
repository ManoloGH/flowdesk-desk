'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Clock, AlertCircle, Loader2, ChevronDown } from 'lucide-react';

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  helpText?: string;
}

interface SocService {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sla_hours: number | null;
  requires_approval: boolean;
  auto_respond: boolean;
  form_schema: FormField[] | null;
  department: { name: string; color: string };
}

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Baja', color: 'text-gray-400' },
  { value: 'NORMAL', label: 'Normal', color: 'text-blue-400' },
  { value: 'HIGH', label: 'Alta', color: 'text-amber-400' },
  { value: 'URGENT', label: 'Urgente', color: 'text-red-400' },
];

export default function NuevaSolicitudPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const router = useRouter();
  const [service, setService] = useState<SocService | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => { load(); }, [serviceId]);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<SocService>(`/soc/services/${serviceId}`);
      setService(data);
      if (data.name) setTitle(`Solicitud: ${data.name}`);
    } catch {
      setError('Servicio no encontrado');
    } finally {
      setLoading(false);
    }
  }

  function updateField(id: string, value: any) {
    setFormData(prev => ({ ...prev, [id]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!service) return;
    if (!title.trim()) { setError('El título es obligatorio'); return; }

    // Validar campos requeridos del formulario dinámico
    const fields = service.form_schema ?? [];
    for (const field of fields) {
      if (field.required && !formData[field.id]) {
        setError(`"${field.label}" es obligatorio`);
        return;
      }
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await api.post<{ id: string }>('/soc/requests', {
        service_id: service.id,
        title,
        description: description || undefined,
        priority,
        form_data: Object.keys(formData).length > 0 ? formData : undefined,
      });
      router.push(`/servicios/${res.id}`);
    } catch (e: any) {
      setError(e.message ?? 'Error al enviar la solicitud');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Servicio no disponible
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <button onClick={() => router.push('/servicios')} className="text-xs text-gray-500 hover:text-gray-300 mb-4 block">
        ← Catálogo
      </button>

      {/* Info del servicio */}
      <div className="flex items-start gap-3 mb-8">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${service.color ?? '#6366F1'}20` }}
        >
          {service.icon ?? '📋'}
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">{service.department.name}</p>
          <h1 className="text-xl font-bold text-white">{service.name}</h1>
          {service.description && (
            <p className="text-sm text-gray-400 mt-1">{service.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {service.sla_hours && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock size={12} />
                Tiempo estimado: {service.sla_hours < 24 ? `${service.sla_hours}h` : `${Math.round(service.sla_hours / 24)} días`}
              </span>
            )}
            {service.requires_approval && (
              <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">
                Requiere aprobación
              </span>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Título de la solicitud <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Describe brevemente lo que necesitas"
            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Descripción adicional
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Contexto adicional, fechas importantes, etc."
            rows={3}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Prioridad */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Prioridad</label>
          <div className="relative">
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              {PRIORITY_OPTIONS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Campos del formulario dinámico */}
        {service.form_schema && service.form_schema.length > 0 && (
          <>
            <div className="border-t border-gray-800 pt-5">
              <h2 className="text-sm font-semibold text-white mb-4">Información requerida</h2>
              <div className="space-y-4">
                {service.form_schema.map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      {field.label}
                      {field.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    {field.helpText && (
                      <p className="text-xs text-gray-500 mb-1.5">{field.helpText}</p>
                    )}

                    {field.type === 'textarea' && (
                      <textarea
                        value={formData[field.id] ?? ''}
                        onChange={e => updateField(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                    )}

                    {(field.type === 'text' || field.type === 'number') && (
                      <input
                        type={field.type}
                        value={formData[field.id] ?? ''}
                        onChange={e => updateField(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    )}

                    {field.type === 'date' && (
                      <input
                        type="date"
                        value={formData[field.id] ?? ''}
                        onChange={e => updateField(field.id, e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    )}

                    {field.type === 'select' && field.options && (
                      <div className="relative">
                        <select
                          value={formData[field.id] ?? ''}
                          onChange={e => updateField(field.id, e.target.value)}
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                        >
                          <option value="">Selecciona...</option>
                          {field.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      </div>
                    )}

                    {field.type === 'checkbox' && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formData[field.id]}
                          onChange={e => updateField(field.id, e.target.checked)}
                          className="w-4 h-4 rounded border-gray-700 text-indigo-500 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-300">{field.placeholder ?? 'Sí'}</span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-lg transition-colors"
        >
          {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
          {submitting ? 'Enviando...' : 'Enviar solicitud'}
        </button>
      </form>
    </div>
  );
}
