'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ChevronLeft, Upload, X, FileText } from 'lucide-react';

export default function NuevoRequerimientoPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [form, setForm] = useState({
    name: '',
    current_tools: '',
    tools_file_url: '',
    tools_file_name: '',
    current_usage: '',
    requester_info: '',
    notes: '',
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res: any = await api.postForm('/brain/upload', fd);
      const url = res?.url ?? res?.source_url ?? res?.file_url ?? '';
      setForm((f) => ({ ...f, tools_file_url: url, tools_file_name: file.name }));
    } catch {
      // Si falla el upload, guardamos solo el nombre para referencia
      setForm((f) => ({ ...f, tools_file_name: file.name }));
    } finally {
      setUploadingFile(false);
    }
  };

  const clearFile = () => {
    setForm((f) => ({ ...f, tools_file_url: '', tools_file_name: '' }));
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setLoading(true);
    try {
      const res: any = await api.post('/erp-areas/requirements', {
        name: form.name,
        current_tools: form.current_tools || undefined,
        tools_file_url: form.tools_file_url || undefined,
        current_usage: form.current_usage || undefined,
        requester_info: form.requester_info || undefined,
        notes: form.notes || undefined,
      });
      router.push(`/erp-areas/${res.id}`);
    } finally {
      setLoading(false);
    }
  };

  const field = (label: string, required = false) => (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  );

  const inputCls = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Nuevo Requerimiento</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Levantamiento inicial del área</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">

        {/* Nombre del área */}
        <div>
          {field('Nombre del área', true)}
          <input
            required
            type="text"
            placeholder="Ej: Contabilidad, Recursos Humanos, Logística"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputCls}
          />
        </div>

        {/* Herramientas actuales */}
        <div>
          {field('Herramientas actuales')}
          <input
            type="text"
            placeholder="Ej: Excel, WhatsApp, formulario en papel, correo"
            value={form.current_tools}
            onChange={(e) => setForm({ ...form, current_tools: e.target.value })}
            className={inputCls}
          />
        </div>

        {/* Archivo de herramientas */}
        <div>
          {field('Archivo de referencia')}
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Sube el archivo que usan actualmente (Excel, PDF, captura de pantalla, etc.)
          </p>
          {form.tools_file_name ? (
            <div className="flex items-center gap-3 p-3 border border-green-300 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-900/20">
              <FileText className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-sm text-green-800 dark:text-green-300 truncate flex-1">{form.tools_file_name}</span>
              <button type="button" onClick={clearFile} className="text-green-600 hover:text-red-500 dark:text-green-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors ${uploadingFile ? 'opacity-50 pointer-events-none' : ''}`}>
              <Upload className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {uploadingFile ? 'Subiendo...' : 'Selecciona o arrastra un archivo'}
              </span>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg,.docx,.doc"
              />
            </label>
          )}
        </div>

        {/* Descripción del uso actual */}
        <div>
          {field('Descripción del uso de herramienta actual')}
          <textarea
            rows={4}
            placeholder="Describe paso a paso cómo usan actualmente la herramienta. Ej: El empleado llena un Excel, lo manda por WhatsApp al jefe, el jefe lo imprime y firma..."
            value={form.current_usage}
            onChange={(e) => setForm({ ...form, current_usage: e.target.value })}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Quién solicita y cómo */}
        <div>
          {field('¿Quién solicita el servicio y cómo?')}
          <textarea
            rows={3}
            placeholder="Ej: El empleado manda un WhatsApp al coordinador indicando la fecha, el coordinador llena el formato y lo envía a RH por correo..."
            value={form.requester_info}
            onChange={(e) => setForm({ ...form, requester_info: e.target.value })}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Notas adicionales */}
        <div>
          {field('Notas adicionales')}
          <textarea
            rows={2}
            placeholder="Cualquier contexto relevante para el levantamiento"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !form.name}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
          >
            {loading ? 'Creando...' : 'Crear requerimiento'}
          </button>
        </div>
      </form>
    </div>
  );
}
