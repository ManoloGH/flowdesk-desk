'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { Building2, Palette, Loader2, Check, Lock, User, Cpu, Phone } from 'lucide-react';

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

  // Motor de IA — CEO Digital (siempre Claude)
  const [ceoAi, setCeoAi] = useState({ ceo_ai_provider: 'anthropic', ceo_model: 'claude-sonnet-4-6', ceo_api_key: '' });
  // Motor de IA — Agentes de la empresa (OpenRouter free por defecto)
  const [agentAi, setAgentAi] = useState({ ai_provider: 'openrouter', model: 'meta-llama/llama-3.3-70b-instruct:free', api_key: '', base_url: '' });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);
  const [aiLoaded, setAiLoaded] = useState(false);

  // Agente de Comunicación
  const [pbx, setPbx] = useState({
    enabled: false, main_number: '', greeting_text: '', stt_provider: 'whisper',
    tts_provider: 'piper', deployment: 'local', asterisk_url: 'http://asterisk:8088',
    asterisk_user: 'flowdesk', asterisk_password: '',
  });
  const [pbxLoading, setPbxLoading] = useState(false);
  const [pbxSaved, setPbxSaved] = useState(false);
  const [pbxLoaded, setPbxLoaded] = useState(false);

  const canEdit = user?.role === 'owner' || user?.role === 'admin';

  useEffect(() => {
    api.get<CompanyData>('/tenants/mine').then(setCompany).finally(() => setLoading(false));

    api.get<any>('/integrations/ai-config').then(data => {
      if (data?.configured) {
        setCeoAi(prev => ({ ...prev,
          ceo_ai_provider: data.ceo_ai_provider ?? data.ai_provider ?? 'anthropic',
          ceo_model: data.ceo_model ?? data.model ?? 'claude-sonnet-4-6',
        }));
        setAgentAi(prev => ({ ...prev,
          ai_provider: data.ai_provider ?? 'openrouter',
          model: data.model ?? 'meta-llama/llama-3.3-70b-instruct:free',
          base_url: data.base_url ?? '',
        }));
      }
      setAiLoaded(true);
    }).catch(() => setAiLoaded(true));

    api.get<any>('/integrations/conmutador').then(data => {
      if (data?.configured) {
        setPbx(prev => ({ ...prev,
          enabled:       data.enabled ?? false,
          main_number:   data.main_number ?? '',
          greeting_text: data.greeting_text ?? '',
          stt_provider:  data.stt_provider ?? 'whisper',
          tts_provider:  data.tts_provider ?? 'piper',
          deployment:    data.deployment ?? 'local',
          asterisk_url:  data.asterisk_url ?? 'http://asterisk:8088',
          asterisk_user: data.asterisk_user ?? 'flowdesk',
        }));
      }
      setPbxLoaded(true);
    }).catch(() => setPbxLoaded(true));
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

  const handleSaveAi = async () => {
    setAiLoading(true); setAiSaved(false);
    try {
      await api.post('/integrations/ai-config', {
        // CEO Digital
        ceo_ai_provider: ceoAi.ceo_ai_provider,
        ceo_model: ceoAi.ceo_model || undefined,
        ceo_api_key: ceoAi.ceo_api_key || undefined,
        // Agentes de la empresa
        ai_provider: agentAi.ai_provider,
        model: agentAi.model || undefined,
        api_key: agentAi.api_key || undefined,
        base_url: agentAi.base_url || undefined,
        deployment: agentAi.ai_provider === 'ollama' ? 'local' : 'cloud',
      });
      setAiSaved(true);
      setCeoAi(prev => ({ ...prev, ceo_api_key: '' }));
      setAgentAi(prev => ({ ...prev, api_key: '' }));
      setTimeout(() => setAiSaved(false), 2500);
    } catch {}
    setAiLoading(false);
  };

  const handleSavePbx = async () => {
    setPbxLoading(true); setPbxSaved(false);
    try {
      await api.post('/integrations/conmutador', {
        enabled:           pbx.enabled,
        main_number:       pbx.main_number || undefined,
        greeting_text:     pbx.greeting_text || undefined,
        stt_provider:      pbx.stt_provider,
        tts_provider:      pbx.tts_provider,
        deployment:        pbx.deployment,
        asterisk_url:      pbx.asterisk_url || undefined,
        asterisk_user:     pbx.asterisk_user || undefined,
        asterisk_password: pbx.asterisk_password || undefined,
      });
      setPbxSaved(true);
      setPbx(prev => ({ ...prev, asterisk_password: '' }));
      setTimeout(() => setPbxSaved(false), 2500);
    } catch {}
    setPbxLoading(false);
  };

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

        {/* Motor de IA */}
        {canEdit && (
          <Section title="Motor de IA" icon={Cpu}>
            <div className="space-y-6">
              {/* CEO Digital — siempre Claude */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">CEO Digital (Atlas)</span>
                  <span className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded-full">Máxima calidad</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'anthropic', label: 'Claude (Anthropic)' },
                    { value: 'openai',    label: 'GPT-4o (OpenAI)' },
                    { value: 'openrouter',label: 'OpenRouter' },
                  ].map(opt => (
                    <button key={opt.value}
                      onClick={() => setCeoAi(p => ({ ...p, ceo_ai_provider: opt.value, ceo_model: '', ceo_api_key: '' }))}
                      className={`py-2 text-xs font-medium rounded-lg border transition-colors ${ceoAi.ceo_ai_provider === opt.value ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="API Key del CEO Digital">
                    <input type="password" value={ceoAi.ceo_api_key}
                      onChange={e => setCeoAi(p => ({ ...p, ceo_api_key: e.target.value }))}
                      placeholder={ceoAi.ceo_ai_provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
                      className={INPUT} />
                  </Field>
                  <Field label="Modelo del CEO Digital">
                    <input value={ceoAi.ceo_model}
                      onChange={e => setCeoAi(p => ({ ...p, ceo_model: e.target.value }))}
                      placeholder={ceoAi.ceo_ai_provider === 'anthropic' ? 'claude-sonnet-4-6' : 'gpt-4o'}
                      className={INPUT} />
                  </Field>
                </div>
              </div>

              <div className="border-t border-gray-800" />

              {/* Agentes de la empresa — OpenRouter free */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Agentes de la empresa</span>
                  <span className="text-xs bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded-full">Todos los demás agentes</span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { value: 'openrouter', label: 'OpenRouter (free)' },
                    { value: 'ollama',     label: 'Ollama (local)' },
                    { value: 'anthropic',  label: 'Claude' },
                    { value: 'openai',     label: 'OpenAI' },
                  ].map(opt => (
                    <button key={opt.value}
                      onClick={() => setAgentAi(p => ({ ...p, ai_provider: opt.value, model: '', api_key: '' }))}
                      className={`py-2 text-xs font-medium rounded-lg border transition-colors ${agentAi.ai_provider === opt.value ? 'bg-emerald-700 border-emerald-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={agentAi.ai_provider === 'ollama' ? 'URL de Ollama' : 'API Key de agentes'}>
                    <input
                      type={agentAi.ai_provider === 'ollama' ? 'text' : 'password'}
                      value={agentAi.ai_provider === 'ollama' ? agentAi.base_url : agentAi.api_key}
                      onChange={e => setAgentAi(p => agentAi.ai_provider === 'ollama' ? { ...p, base_url: e.target.value } : { ...p, api_key: e.target.value })}
                      placeholder={agentAi.ai_provider === 'ollama' ? 'http://localhost:11434/v1' : 'sk-or-... (gratis en openrouter.com)'}
                      className={INPUT} />
                  </Field>
                  <Field label="Modelo de agentes">
                    <input value={agentAi.model}
                      onChange={e => setAgentAi(p => ({ ...p, model: e.target.value }))}
                      placeholder={
                        agentAi.ai_provider === 'openrouter' ? 'meta-llama/llama-3.3-70b-instruct:free' :
                        agentAi.ai_provider === 'ollama' ? 'qwen2.5:7b' :
                        agentAi.ai_provider === 'anthropic' ? 'claude-haiku-4-5-20251001' : 'gpt-4o-mini'
                      }
                      className={INPUT} />
                  </Field>
                </div>
                {agentAi.ai_provider === 'openrouter' && (
                  <p className="text-xs text-gray-500">
                    Con el modelo <code className="text-gray-400">:free</code> de OpenRouter no necesitas tarjeta. Regístrate en{' '}
                    <span className="text-indigo-400">openrouter.com</span> y copia tu API key.
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <button onClick={handleSaveAi} disabled={aiLoading}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                  {aiLoading ? <Loader2 size={13} className="animate-spin" /> : aiSaved ? <Check size={13} /> : <Cpu size={13} />}
                  {aiLoading ? 'Guardando...' : aiSaved ? 'Guardado' : 'Guardar configuración de IA'}
                </button>
              </div>
            </div>
          </Section>
        )}

        {/* Agente de Comunicación */}
        {canEdit && (
          <Section title="Agente de Comunicación" icon={Phone}>
            <div className="space-y-5">
              {/* Toggle activar */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-medium">Activar Agente de Comunicación</p>
                  <p className="text-xs text-gray-400 mt-0.5">Recibe llamadas con IA y redirecciónalas a tu equipo</p>
                </div>
                <button
                  onClick={() => setPbx(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${pbx.enabled ? 'bg-indigo-600' : 'bg-gray-700'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${pbx.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {pbx.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Número principal (DID)">
                      <input
                        value={pbx.main_number}
                        onChange={e => setPbx(prev => ({ ...prev, main_number: e.target.value }))}
                        placeholder="+52155..."
                        className={INPUT}
                      />
                    </Field>
                    <Field label="Despliegue">
                      <div className="flex gap-2">
                        {['local', 'cloud'].map(d => (
                          <button
                            key={d}
                            onClick={() => setPbx(prev => ({ ...prev, deployment: d }))}
                            className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                              pbx.deployment === d
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                            }`}
                          >
                            {d === 'local' ? '🖥 Local' : '☁️ Cloud'}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <div className="col-span-2">
                      <Field label="Texto de bienvenida">
                        <input
                          value={pbx.greeting_text}
                          onChange={e => setPbx(prev => ({ ...prev, greeting_text: e.target.value }))}
                          placeholder="Bienvenido a Empresa X. ¿En qué le puedo ayudar?"
                          className={INPUT}
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Transcripción de voz (STT)">
                      <div className="flex gap-2">
                        {[{ v: 'whisper', l: 'Whisper local' }, { v: 'deepgram', l: 'Deepgram' }].map(opt => (
                          <button key={opt.v} onClick={() => setPbx(prev => ({ ...prev, stt_provider: opt.v }))}
                            className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${pbx.stt_provider === opt.v ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'}`}>
                            {opt.l}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label="Voz (TTS)">
                      <div className="flex gap-2">
                        {[{ v: 'piper', l: 'Piper local' }, { v: 'none', l: 'Ninguno' }].map(opt => (
                          <button key={opt.v} onClick={() => setPbx(prev => ({ ...prev, tts_provider: opt.v }))}
                            className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${pbx.tts_provider === opt.v ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'}`}>
                            {opt.l}
                          </button>
                        ))}
                      </div>
                    </Field>
                  </div>

                  {pbx.deployment === 'local' && (
                    <div className="grid grid-cols-2 gap-4 pt-1 border-t border-gray-800">
                      <Field label="URL de Asterisk ARI">
                        <input value={pbx.asterisk_url} onChange={e => setPbx(prev => ({ ...prev, asterisk_url: e.target.value }))}
                          placeholder="http://asterisk:8088" className={INPUT} />
                      </Field>
                      <Field label="Usuario ARI">
                        <input value={pbx.asterisk_user} onChange={e => setPbx(prev => ({ ...prev, asterisk_user: e.target.value }))}
                          placeholder="flowdesk" className={INPUT} />
                      </Field>
                      <div className="col-span-2">
                        <Field label="Contraseña ARI">
                          <input type="password" value={pbx.asterisk_password}
                            onChange={e => setPbx(prev => ({ ...prev, asterisk_password: e.target.value }))}
                            placeholder="Dejar vacío para no cambiar" className={INPUT} />
                        </Field>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleSavePbx}
                  disabled={pbxLoading}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  {pbxLoading ? <Loader2 size={13} className="animate-spin" /> : pbxSaved ? <Check size={13} /> : <Phone size={13} />}
                  {pbxLoading ? 'Guardando...' : pbxSaved ? 'Guardado' : 'Guardar configuración'}
                </button>
              </div>
            </div>
          </Section>
        )}

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
