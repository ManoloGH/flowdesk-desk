'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ChevronLeft, Plus, Trash2, ChevronDown, ChevronUp, Save, Check } from 'lucide-react';

const FIELD_TYPES = ['text','textarea','number','select','multiselect','date','file','checkbox'];

const emptyService = () => ({
  name: '',
  description: '',
  category: '',
  icon: '',
  color: '#6366f1',
  current_process: '',
  pain_points: '',
  requester_profile: '',
  delivered_how: '',
  monthly_volume: '',
  sla_hours: 48,
  requires_approval: false,
  approval_flow: [] as any[],
  form_schema: [] as any[],
  auto_respond: false,
  status: 'BORRADOR',
});

const STATUS_COLOR: Record<string, string> = {
  BORRADOR: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  REVISADO: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  APROBADO: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export default function ServiciosPage() {
  const { requirementId } = useParams<{ requirementId: string }>();
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newSvc, setNewSvc] = useState(emptyService());

  const load = () => {
    api.get(`/erp-areas/requirements/${requirementId}/services`)
      .then((r) => setServices(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [requirementId]);

  const saveNew = async () => {
    setSaving(true);
    try {
      await api.post(`/erp-areas/requirements/${requirementId}/services`, {
        ...newSvc,
        monthly_volume: newSvc.monthly_volume ? parseInt(newSvc.monthly_volume as any) : undefined,
      });
      setNewSvc(emptyService());
      setShowNew(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.patch(`/erp-areas/requirements/${requirementId}/services/${editing.id}`, editing);
      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const deleteSvc = async (id: string) => {
    if (!confirm('¿Eliminar este servicio?')) return;
    await api.delete(`/erp-areas/requirements/${requirementId}/services/${id}`);
    load();
  };

  const addField = (target: any, setTarget: any) => {
    const field = { id: `field_${Date.now()}`, label: '', type: 'text', required: false };
    setTarget({ ...target, form_schema: [...(target.form_schema ?? []), field] });
  };

  const updateField = (target: any, setTarget: any, idx: number, updates: any) => {
    const schema = [...(target.form_schema ?? [])];
    schema[idx] = { ...schema[idx], ...updates };
    setTarget({ ...target, form_schema: schema });
  };

  const removeField = (target: any, setTarget: any, idx: number) => {
    const schema = [...(target.form_schema ?? [])];
    schema.splice(idx, 1);
    setTarget({ ...target, form_schema: schema });
  };

  const ServiceForm = ({ data, onChange }: { data: any; onChange: (d: any) => void }) => (
    <div className="space-y-6 mt-4">
      {/* Info básica */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nombre *</label>
          <input value={data.name} onChange={(e) => onChange({ ...data, name: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Categoría</label>
          <input value={data.category} onChange={(e) => onChange({ ...data, category: e.target.value })}
            placeholder="Ej: Pagos, Recursos Humanos"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Descripción</label>
        <textarea rows={2} value={data.description} onChange={(e) => onChange({ ...data, description: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
      </div>

      {/* AS-IS */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">AS-IS — Proceso actual</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">¿Cómo se hace hoy?</label>
            <textarea rows={2} value={data.current_process} onChange={(e) => onChange({ ...data, current_process: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Dolores o fricciones</label>
            <textarea rows={2} value={data.pain_points} onChange={(e) => onChange({ ...data, pain_points: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">¿Quién lo solicita?</label>
              <input value={data.requester_profile} onChange={(e) => onChange({ ...data, requester_profile: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">¿Cómo se entrega?</label>
              <input value={data.delivered_how} onChange={(e) => onChange({ ...data, delivered_how: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>
      </div>

      {/* TO-BE */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">TO-BE — Configuración del servicio</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">SLA (horas)</label>
              <input type="number" min="1" value={data.sla_hours} onChange={(e) => onChange({ ...data, sla_hours: parseInt(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={data.requires_approval} onChange={(e) => onChange({ ...data, requires_approval: e.target.checked })}
                  className="rounded border-gray-300 dark:border-gray-600 text-indigo-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Requiere aprobación</span>
              </label>
            </div>
          </div>

          {/* Form builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Campos del formulario</label>
              <button type="button" onClick={() => addField(data, onChange)}
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Agregar campo
              </button>
            </div>
            {(data.form_schema ?? []).length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 italic">Sin campos — el servicio no pedirá información al solicitante</p>
            ) : (
              <div className="space-y-2">
                {(data.form_schema ?? []).map((field: any, idx: number) => (
                  <div key={field.id ?? idx} className="grid grid-cols-12 gap-2 items-center">
                    <input value={field.label} onChange={(e) => updateField(data, onChange, idx, { label: e.target.value })}
                      placeholder="Etiqueta"
                      className="col-span-5 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    <select value={field.type} onChange={(e) => updateField(data, onChange, idx, { type: e.target.value })}
                      className="col-span-4 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
                      {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <label className="col-span-2 flex items-center gap-1 justify-center cursor-pointer">
                      <input type="checkbox" checked={field.required} onChange={(e) => updateField(data, onChange, idx, { required: e.target.checked })}
                        className="rounded border-gray-300" />
                      <span className="text-xs text-gray-500">*</span>
                    </label>
                    <button type="button" onClick={() => removeField(data, onChange, idx)}
                      className="col-span-1 text-red-400 hover:text-red-600 flex justify-center">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Estado */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Estado del servicio</label>
            <select value={data.status} onChange={(e) => onChange({ ...data, status: e.target.value })}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="BORRADOR">Borrador</option>
              <option value="REVISADO">Revisado</option>
              <option value="APROBADO">Aprobado</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Servicios del requerimiento</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">AS-IS + TO-BE por servicio</p>
          </div>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo servicio
        </button>
      </div>

      {/* Formulario nuevo */}
      {showNew && (
        <div className="bg-white dark:bg-gray-900 border border-indigo-300 dark:border-indigo-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Nuevo servicio</h3>
            <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600 text-xs">Cancelar</button>
          </div>
          <ServiceForm data={newSvc} onChange={setNewSvc} />
          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowNew(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancelar
            </button>
            <button onClick={saveNew} disabled={saving || !newSvc.name}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm rounded-lg flex items-center gap-2">
              <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* Lista de servicios */}
      {loading ? (
        <div className="space-y-3">
          {[1,2].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
        </div>
      ) : services.length === 0 && !showNew ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
          <p>No hay servicios definidos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((svc) => (
            <div key={svc.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                onClick={() => setExpanded(expanded === svc.id ? null : svc.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">{svc.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[svc.status]}`}>
                      {svc.status}
                    </span>
                    {svc.soc_service_id && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                        En producción
                      </span>
                    )}
                  </div>
                  {svc.category && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{svc.category}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditing({ ...svc }); setExpanded(svc.id); }}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSvc(svc.id); }}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expanded === svc.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              {expanded === svc.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-5">
                  {editing?.id === svc.id ? (
                    <>
                      <ServiceForm data={editing} onChange={setEditing} />
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => setEditing(null)}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                          Cancelar
                        </button>
                        <button onClick={saveEdit} disabled={saving}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm rounded-lg flex items-center gap-2">
                          <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                      {svc.current_process && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Proceso actual</p>
                          <p className="text-gray-900 dark:text-white">{svc.current_process}</p>
                        </div>
                      )}
                      {svc.pain_points && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Dolores</p>
                          <p className="text-gray-900 dark:text-white">{svc.pain_points}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">SLA</p>
                        <p className="text-gray-900 dark:text-white">{svc.sla_hours}h · {svc.requires_approval ? 'Con aprobación' : 'Sin aprobación'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Campos del formulario</p>
                        <p className="text-gray-900 dark:text-white">{svc.form_schema?.length ?? 0} campo{svc.form_schema?.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
