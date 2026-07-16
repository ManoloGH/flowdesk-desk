'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/api';
import { Plus, Edit2, ToggleLeft, ToggleRight, Clock, ChevronDown, X, GripVertical, Loader2 } from 'lucide-react';

interface Department { id: string; name: string; color: string; dept_type: string | null }
interface TeamSlotAgent { id: string; name: string }
interface FormField { id: string; label: string; type: string; required: boolean; placeholder?: string; options?: string; helpText?: string }

interface SocService {
  id: string; name: string; description: string | null; category: string | null;
  icon: string | null; color: string | null; is_active: boolean;
  sla_hours: number | null; requires_approval: boolean; auto_respond: boolean;
  auto_agent_id: string | null;
  form_schema: FormField[] | null;
  department: Department;
  _count: { requests: number };
}

const FIELD_TYPES = ['text','textarea','number','select','date','checkbox'];

const EMPTY_FORM: Partial<SocService> & { form_fields: FormField[] } = {
  name: '', description: '', category: '', icon: '📋', color: '#6366F1',
  sla_hours: undefined, requires_approval: false, auto_respond: false,
  visible_to: 'all', auto_agent_id: undefined, department_id: undefined,
  form_fields: [],
} as any;

export default function AdminCatalogoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [services, setServices] = useState<SocService[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [agents, setAgents] = useState<TeamSlotAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({ ...EMPTY_FORM, form_fields: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [svcs, depts] = await Promise.all([
        api.get<SocService[]>('/soc/services?active_only=false'),
        api.get<Department[]>('/departments'),
      ]);
      setServices(Array.isArray(svcs) ? svcs : []);
      const deptList = Array.isArray(depts) ? depts : [];
      setDepartments(deptList);
      if (deptList.length > 0 && !selectedDept) setSelectedDept(deptList[0].id);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, form_fields: [], department_id: selectedDept });
    setError('');
    setShowForm(true);
  }

  function openEdit(svc: SocService) {
    setEditingId(svc.id);
    setForm({
      name: svc.name, description: svc.description ?? '', category: svc.category ?? '',
      icon: svc.icon ?? '📋', color: svc.color ?? '#6366F1',
      sla_hours: svc.sla_hours ?? '', requires_approval: svc.requires_approval,
      auto_respond: svc.auto_respond, auto_agent_id: svc.auto_agent_id ?? '',
      department_id: svc.department.id,
      form_fields: (svc.form_schema ?? []).map((f: any) => ({
        ...f, options: Array.isArray(f.options) ? f.options.join(', ') : '',
      })),
    });
    setError('');
    setShowForm(true);
  }

  async function toggleActive(svc: SocService) {
    try {
      if (svc.is_active) {
        await api.delete(`/soc/services/${svc.id}`);
      } else {
        await api.patch(`/soc/services/${svc.id}`, { is_active: true });
      }
      await load();
    } catch (e: any) { alert(e.message); }
  }

  async function save() {
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return; }
    if (!form.department_id) { setError('Selecciona un departamento'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        department_id: form.department_id,
        name: form.name,
        description: form.description || undefined,
        category: form.category || undefined,
        icon: form.icon || undefined,
        color: form.color || undefined,
        sla_hours: form.sla_hours ? Number(form.sla_hours) : undefined,
        requires_approval: form.requires_approval,
        auto_respond: form.auto_respond,
        auto_agent_id: form.auto_agent_id || undefined,
        form_schema: form.form_fields.map((f: any) => ({
          id: f.id || f.label.toLowerCase().replace(/\s+/g, '_'),
          label: f.label, type: f.type, required: f.required,
          placeholder: f.placeholder || undefined,
          helpText: f.helpText || undefined,
          options: f.options ? f.options.split(',').map((o: string) => o.trim()).filter(Boolean) : undefined,
        })),
      };
      if (editingId) {
        await api.patch(`/soc/services/${editingId}`, payload);
      } else {
        await api.post('/soc/services', payload);
      }
      setShowForm(false);
      await load();
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  function addField() {
    setForm((prev: any) => ({
      ...prev,
      form_fields: [...prev.form_fields, { id: '', label: '', type: 'text', required: false, placeholder: '', options: '', helpText: '' }],
    }));
  }

  function updateField(idx: number, key: string, val: any) {
    setForm((prev: any) => {
      const fields = [...prev.form_fields];
      fields[idx] = { ...fields[idx], [key]: val };
      return { ...prev, form_fields: fields };
    });
  }

  function removeField(idx: number) {
    setForm((prev: any) => ({ ...prev, form_fields: prev.form_fields.filter((_: any, i: number) => i !== idx) }));
  }

  const filteredServices = services.filter(s => !selectedDept || s.department.id === selectedDept);

  if (!['owner','admin','manager'].includes(user?.role ?? '')) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Solo administradores pueden acceder a esta sección
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button onClick={() => router.push('/servicios')} className="text-xs text-gray-500 hover:text-gray-300 mb-2 block">
            ← Catálogo
          </button>
          <h1 className="text-2xl font-bold text-white">Administrar catálogo</h1>
          <p className="text-gray-400 mt-1 text-sm">Configura los servicios que ofrece tu departamento</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={15} />
          Nuevo servicio
        </button>
      </div>

      {/* Filtro por departamento */}
      {departments.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedDept('')}
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${!selectedDept ? 'bg-indigo-600 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'}`}
          >
            Todos
          </button>
          {departments.map(d => (
            <button
              key={d.id}
              onClick={() => setSelectedDept(d.id)}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${selectedDept === d.id ? 'bg-indigo-600 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'}`}
            >
              {d.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-3">Sin servicios en este departamento</p>
          <button onClick={openCreate} className="text-sm text-indigo-400 hover:text-indigo-300">
            Crear el primero →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredServices.map(svc => (
            <div
              key={svc.id}
              className={`flex items-center gap-4 bg-gray-900 border rounded-xl p-4 transition-colors ${svc.is_active ? 'border-gray-800' : 'border-gray-800 opacity-50'}`}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                style={{ background: `${svc.color ?? '#6366F1'}20` }}
              >
                {svc.icon ?? '📋'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-white text-sm">{svc.name}</p>
                  {svc.category && (
                    <span className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">{svc.category}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                  <span>{svc.department.name}</span>
                  {svc.sla_hours && (
                    <span className="flex items-center gap-1"><Clock size={10} /> {svc.sla_hours}h SLA</span>
                  )}
                  {svc.requires_approval && <span>Requiere aprobación</span>}
                  <span>{svc._count.requests} solicitudes</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(svc)}
                  className="p-1.5 text-gray-500 hover:text-white transition-colors"
                  title="Editar"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => toggleActive(svc)}
                  className={`p-1.5 transition-colors ${svc.is_active ? 'text-emerald-400 hover:text-gray-400' : 'text-gray-600 hover:text-emerald-400'}`}
                  title={svc.is_active ? 'Desactivar' : 'Activar'}
                >
                  {svc.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de creación/edición */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-950">
              <h2 className="font-semibold text-white">{editingId ? 'Editar servicio' : 'Nuevo servicio'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Departamento */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Departamento <span className="text-red-400">*</span></label>
                <div className="relative">
                  <select
                    value={form.department_id ?? ''}
                    onChange={e => setForm((p: any) => ({ ...p, department_id: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                  >
                    <option value="">Selecciona...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Nombre + Icono */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Icono</label>
                  <input
                    type="text"
                    value={form.icon ?? ''}
                    onChange={e => setForm((p: any) => ({ ...p, icon: e.target.value }))}
                    placeholder="📋"
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Nombre <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))}
                    placeholder="Alta de proveedor"
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  placeholder="¿Para qué sirve este servicio?"
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Categoría + SLA */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Categoría</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={e => setForm((p: any) => ({ ...p, category: e.target.value }))}
                    placeholder="Ej: Compras, RRHH..."
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">SLA (horas)</label>
                  <input
                    type="number"
                    value={form.sla_hours ?? ''}
                    onChange={e => setForm((p: any) => ({ ...p, sla_hours: e.target.value }))}
                    placeholder="24"
                    min={1}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-4">
                {[
                  { key: 'requires_approval', label: 'Requiere aprobación' },
                  { key: 'auto_respond', label: 'Respuesta IA automática' },
                ].map(toggle => (
                  <button
                    key={toggle.key}
                    type="button"
                    onClick={() => setForm((p: any) => ({ ...p, [toggle.key]: !p[toggle.key] }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                      form[toggle.key]
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                        : 'border-gray-800 bg-gray-900 text-gray-500'
                    }`}
                  >
                    {form[toggle.key] ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    {toggle.label}
                  </button>
                ))}
              </div>

              {/* Formulario dinámico */}
              <div className="border-t border-gray-800 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Campos del formulario</h3>
                  <button
                    type="button"
                    onClick={addField}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    <Plus size={13} /> Agregar campo
                  </button>
                </div>
                {form.form_fields.length === 0 ? (
                  <p className="text-xs text-gray-500">Sin campos — la solicitud solo tendrá título y descripción</p>
                ) : (
                  <div className="space-y-3">
                    {form.form_fields.map((field: any, idx: number) => (
                      <div key={idx} className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <GripVertical size={14} className="text-gray-600" />
                          <button
                            type="button"
                            onClick={() => removeField(idx)}
                            className="text-gray-600 hover:text-red-400"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={field.label}
                            onChange={e => updateField(idx, 'label', e.target.value)}
                            placeholder="Etiqueta del campo"
                            className="bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <div className="relative">
                            <select
                              value={field.type}
                              onChange={e => updateField(idx, 'type', e.target.value)}
                              className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                            >
                              {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                          </div>
                        </div>
                        {(field.type === 'select') && (
                          <input
                            type="text"
                            value={field.options ?? ''}
                            onChange={e => updateField(idx, 'options', e.target.value)}
                            placeholder="Opciones separadas por coma: BBVA, Santander, HSBC"
                            className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        )}
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={e => updateField(idx, 'required', e.target.checked)}
                              className="w-3 h-3"
                            />
                            Obligatorio
                          </label>
                          <input
                            type="text"
                            value={field.placeholder ?? ''}
                            onChange={e => updateField(idx, 'placeholder', e.target.value)}
                            placeholder="Placeholder..."
                            className="flex-1 bg-gray-800 border border-gray-700 rounded px-2.5 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-700 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear servicio'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
