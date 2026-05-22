'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { Building2, Palette, Globe, Loader2, Check, Lock, User } from 'lucide-react';

interface CompanyData {
  name: string;
  slug: string;
  plan: string;
  status: string;
  primary_color: string | null;
  secondary_color: string | null;
  tagline: string | null;
  industry: string | null;
  mission: string | null;
  vision: string | null;
  website: string | null;
  logo_url: string | null;
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Icon size={15} className="text-indigo-400" />
        <h2 className="font-semibold text-white text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const INPUT = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500';

export default function SettingsPage() {
  const { user } = useAuth();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [pwLoading, setPwLoading] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const canEdit = user?.role === 'owner' || user?.role === 'admin';

  useEffect(() => {
    api.get<CompanyData>('/tenants/mine').then(setCompany).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!company) return;
    setSaving(true); setSaved(false);
    try {
      await api.patch('/tenants/mine', {
        name: company.name,
        primary_color: company.primary_color,
        secondary_color: company.secondary_color,
        tagline: company.tagline,
        industry: company.industry,
        mission: company.mission,
        vision: company.vision,
        website: company.website,
        logo_url: company.logo_url,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (newPw !== confirmPw) { setPwError('Las contraseñas no coinciden'); return; }
    if (newPw.length < 8) { setPwError('Mínimo 8 caracteres'); return; }
    setPwLoading(true);
    try {
      await api.post('/auth/change-password', { current_password: currentPw, new_password: newPw });
      setPwSaved(true);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => setPwSaved(false), 3000);
    } catch (e: any) {
      setPwError(e.message ?? 'Error al cambiar contraseña');
    }
    setPwLoading(false);
  };

  const set = (field: keyof CompanyData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setCompany(prev => prev ? { ...prev, [field]: e.target.value } : prev);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-60">
        <Loader2 size={24} className="text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <p className="text-gray-400 mt-1 text-sm">Datos de tu empresa y cuenta</p>
      </div>

      <div className="space-y-6">
        {/* Empresa */}
        <Section title="Empresa" icon={Building2}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre de la empresa">
              <input
                value={company?.name ?? ''}
                onChange={set('name')}
                disabled={!canEdit}
                className={INPUT}
              />
            </Field>
            <Field label="Industria">
              <input
                value={company?.industry ?? ''}
                onChange={set('industry')}
                disabled={!canEdit}
                placeholder="Ej. Tecnología — IA"
                className={INPUT}
              />
            </Field>
            <Field label="Tagline">
              <input
                value={company?.tagline ?? ''}
                onChange={set('tagline')}
                disabled={!canEdit}
                placeholder="Tu slogan en una línea"
                className={INPUT}
              />
            </Field>
            <Field label="Sitio web">
              <input
                value={company?.website ?? ''}
                onChange={set('website')}
                disabled={!canEdit}
                placeholder="https://tuempresa.com"
                className={INPUT}
              />
            </Field>
            <div className="col-span-2">
              <Field label="Misión">
                <textarea
                  value={company?.mission ?? ''}
                  onChange={set('mission')}
                  disabled={!canEdit}
                  rows={3}
                  placeholder="¿Por qué existe tu empresa?"
                  className={INPUT + ' resize-none'}
                />
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Visión">
                <textarea
                  value={company?.vision ?? ''}
                  onChange={set('vision')}
                  disabled={!canEdit}
                  rows={3}
                  placeholder="¿Dónde quieres estar en 5 años?"
                  className={INPUT + ' resize-none'}
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* Identidad visual */}
        <Section title="Identidad visual" icon={Palette}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Color principal">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={company?.primary_color ?? '#4F46E5'}
                  onChange={set('primary_color')}
                  disabled={!canEdit}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  value={company?.primary_color ?? ''}
                  onChange={set('primary_color')}
                  disabled={!canEdit}
                  placeholder="#4F46E5"
                  className={INPUT + ' flex-1'}
                />
              </div>
            </Field>
            <Field label="Color secundario">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={company?.secondary_color ?? '#7C3AED'}
                  onChange={set('secondary_color')}
                  disabled={!canEdit}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  value={company?.secondary_color ?? ''}
                  onChange={set('secondary_color')}
                  disabled={!canEdit}
                  placeholder="#7C3AED"
                  className={INPUT + ' flex-1'}
                />
              </div>
            </Field>
            <div className="col-span-2">
              <Field label="URL del logotipo">
                <input
                  value={company?.logo_url ?? ''}
                  onChange={set('logo_url')}
                  disabled={!canEdit}
                  placeholder="https://cdn.tuempresa.com/logo.png"
                  className={INPUT}
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* Info de cuenta */}
        <Section title="Mi cuenta" icon={User}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email">
              <input value={user?.email ?? ''} disabled className={INPUT + ' opacity-60 cursor-not-allowed'} />
            </Field>
            <Field label="Rol">
              <input value={user?.role ?? ''} disabled className={INPUT + ' opacity-60 cursor-not-allowed capitalize'} />
            </Field>
          </div>
        </Section>

        {/* Cambiar contraseña */}
        <Section title="Cambiar contraseña" icon={Lock}>
          <div className="grid grid-cols-1 gap-4 max-w-sm">
            <Field label="Contraseña actual">
              <input
                type="password"
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                className={INPUT}
              />
            </Field>
            <Field label="Nueva contraseña">
              <input
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                className={INPUT}
              />
            </Field>
            <Field label="Confirmar nueva contraseña">
              <input
                type="password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                className={INPUT}
              />
            </Field>
            {pwError && <p className="text-xs text-red-400">{pwError}</p>}
            {pwSaved && <p className="text-xs text-emerald-400">Contraseña actualizada.</p>}
            <button
              onClick={handleChangePassword}
              disabled={pwLoading || !currentPw || !newPw || !confirmPw}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors w-fit"
            >
              {pwLoading ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
              {pwLoading ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
          </div>
        </Section>

        {/* Guardar cambios empresa */}
        {canEdit && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : null}
              {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
            </button>
            {!canEdit && (
              <p className="text-xs text-gray-500">Solo el owner o admin puede editar la empresa.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
