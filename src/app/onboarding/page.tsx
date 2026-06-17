'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Send, Loader2, Upload, FileText, Users, Palette, GitBranch,
  CheckCircle2, X, ArrowLeft, Bot, Cpu, Phone, ChevronRight,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UploadedDoc {
  type: DocType;
  name: string;
  status: 'uploading' | 'ready' | 'error';
}

type DocType = 'identity' | 'org_chart' | 'brand' | 'processes';

const DOC_TYPES: { type: DocType; icon: any; label: string; desc: string; color: string }[] = [
  {
    type: 'identity',
    icon: FileText,
    label: 'Identidad',
    desc: 'Misión, visión y valores',
    color: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  },
  {
    type: 'org_chart',
    icon: Users,
    label: 'Organigrama',
    desc: 'Departamentos y equipo',
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  },
  {
    type: 'brand',
    icon: Palette,
    label: 'Manual de marca',
    desc: 'Colores, logo y estilo',
    color: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  },
  {
    type: 'processes',
    icon: GitBranch,
    label: 'Procesos',
    desc: 'SOPs y flujos de trabajo',
    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  },
];

// ── Componente principal ───────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [postStep, setPostStep] = useState<null | 'nombre_ceo' | 'ai' | 'conmutador'>(null);
  const [onboardingTenantId, setOnboardingTenantId] = useState<string | null>(null);
  const [postSaving, setPostSaving] = useState(false);
  const [ceoName, setCeoName] = useState('');
  const [ceoForm, setCeoForm] = useState({ ceo_ai_provider: 'anthropic', ceo_model: 'claude-sonnet-4-6', ceo_api_key: '' });
  const [agentForm, setAgentForm] = useState({ ai_provider: 'openrouter', model: 'meta-llama/llama-3.3-70b-instruct:free', api_key: '' });
  const [pbxForm, setPbxForm] = useState({ enabled: false, main_number: '', greeting_text: '', deployment: 'local' });

  // Upload state
  const [uploads, setUploads] = useState<UploadedDoc[]>([]);
  const [dragOver, setDragOver] = useState<DocType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingDocType, setPendingDocType] = useState<DocType | null>(null);

  // Scroll chat al final
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  // Mensaje de bienvenida al cargar
  useEffect(() => {
    sendMessage('Hola, quiero configurar mi FlowDesk', true);
  }, []);

  // ── Chat ───────────────────────────────────────────────────────────────────

  async function sendMessage(text: string, silent = false) {
    if (!text.trim() || chatLoading) return;

    if (!silent) {
      setMessages(prev => [...prev, { role: 'user', content: text }]);
      setInput('');
    }

    setChatLoading(true);
    try {
      const res = await fetch(`${API}/onboarding/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: text }),
      });

      const data = await res.json();
      setSessionId(data.session_id);
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);

      if (data.completed) {
        setCompleted(true);
        if (data.tenant_id) {
          setOnboardingTenantId(data.tenant_id);
          setPostStep('nombre_ceo'); // iniciar pasos opcionales post-onboarding
        } else {
          setTimeout(() => router.push('/login?onboarding=done'), 3000);
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Hubo un problema de conexión. Intenta de nuevo.',
      }]);
    } finally {
      setChatLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  // ── Upload ─────────────────────────────────────────────────────────────────

  function openFilePicker(type: DocType) {
    setPendingDocType(type);
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !pendingDocType) return;
    e.target.value = '';
    await uploadDoc(file, pendingDocType);
  }

  async function handleDrop(e: React.DragEvent, type: DocType) {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (file) await uploadDoc(file, type);
  }

  async function uploadDoc(file: File, type: DocType) {
    const doc: UploadedDoc = { type, name: file.name, status: 'uploading' };
    setUploads(prev => [...prev.filter(u => u.type !== type), doc]);

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('doc_type', type);
      if (sessionId) form.append('session_id', sessionId);

      const res = await fetch(`${API}/onboarding/upload-doc`, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      if (data.session_id) setSessionId(data.session_id);

      setUploads(prev => prev.map(u => u.type === type ? { ...u, status: 'ready' } : u));

      // Notificar al chat lo que se subió
      const labels: Record<DocType, string> = {
        identity: 'mi documento de identidad (misión, visión y valores)',
        org_chart: 'mi organigrama con departamentos y equipo',
        brand: 'el manual de marca',
        processes: 'mis procesos y SOPs',
      };
      sendMessage(`Acabo de subir ${labels[type]}.`, false);

    } catch {
      setUploads(prev => prev.map(u => u.type === type ? { ...u, status: 'error' } : u));
    }
  }

  function removeUpload(type: DocType) {
    setUploads(prev => prev.filter(u => u.type !== type));
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* Header */}
      <header className="border-b border-gray-800/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#4DBBF0] flex items-center justify-center">
              <span className="text-xs font-bold text-gray-950">F</span>
            </div>
            <span className="font-semibold text-white text-sm">Configura tu FlowDesk</span>
          </div>
        </div>
        <Link href="/login" className="text-xs text-gray-500 hover:text-white transition-colors">
          ¿Ya tienes cuenta? Acceder →
        </Link>
      </header>

      {/* Main — dos paneles */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden" style={{ height: 'calc(100vh - 65px)' }}>

        {/* Panel izquierdo — Documentos */}
        <aside className="lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-gray-800/60 p-6 overflow-y-auto flex-shrink-0">
          <div className="mb-6">
            <h2 className="font-semibold text-white text-sm mb-1">Sube tus documentos</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Si ya tienes esto definido, súbelo y Atlas solo te preguntará lo que falte.
              Acepta PDF, Word e imágenes.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            onChange={handleFileSelected}
          />

          <div className="space-y-3">
            {DOC_TYPES.map(({ type, icon: Icon, label, desc, color }) => {
              const uploaded = uploads.find(u => u.type === type);
              return (
                <div
                  key={type}
                  onDragOver={e => { e.preventDefault(); setDragOver(type); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => handleDrop(e, type)}
                  className={`
                    relative rounded-xl border p-4 transition-all cursor-pointer
                    ${uploaded?.status === 'ready'
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : dragOver === type
                        ? 'border-[#4DBBF0]/50 bg-[#4DBBF0]/5'
                        : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                    }
                  `}
                  onClick={() => !uploaded && openFilePicker(type)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                      {uploaded && (
                        <p className="text-xs mt-1.5 truncate">
                          {uploaded.status === 'uploading' && (
                            <span className="text-[#4DBBF0] flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> Procesando…
                            </span>
                          )}
                          {uploaded.status === 'ready' && (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> {uploaded.name}
                            </span>
                          )}
                          {uploaded.status === 'error' && (
                            <span className="text-red-400">Error al subir — intenta de nuevo</span>
                          )}
                        </p>
                      )}
                    </div>
                    {uploaded?.status === 'ready' && (
                      <button
                        onClick={e => { e.stopPropagation(); removeUpload(type); }}
                        className="text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {!uploaded && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-600">
                      <Upload className="w-3 h-3" />
                      <span>Clic para subir o arrastra aquí</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-gray-600 mt-6 text-center leading-relaxed">
            Los documentos son opcionales.<br />
            Puedes responder todo desde el chat.
          </p>
        </aside>

        {/* Panel derecho — Chat con Atlas */}
        <main className="flex-1 flex flex-col min-h-0">

          {/* Sub-header del agente */}
          <div className="border-b border-gray-800/60 px-4 py-3 flex items-center gap-2 flex-shrink-0">
            <AtlasAvatar />
            <div>
              <span className="text-sm font-semibold text-white">Atlas</span>
              <span className="text-xs text-gray-500 ml-2">· Secretario Personal</span>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {messages.length === 0 && chatLoading && (
              <div className="flex items-start gap-3">
                <AtlasAvatar />
                <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'assistant' && <AtlasAvatar />}
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#4DBBF0] text-gray-950 rounded-tr-sm font-medium'
                      : 'bg-gray-800 text-gray-100 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {chatLoading && messages.length > 0 && (
              <div className="flex items-start gap-3">
                <AtlasAvatar />
                <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3.5">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Paso post-onboarding: Nombre del CEO Digital */}
            {postStep === 'nombre_ceo' && (
              <div className="mx-4 my-4 bg-gray-900 border border-indigo-500/30 rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600/20 rounded-xl border border-indigo-500/30 flex items-center justify-center">
                    <Bot size={18} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Ponle nombre a tu CEO Digital</p>
                    <p className="text-gray-500 text-xs">Tú eres el CEO. Él es tu socio digital — dale el nombre que quieras.</p>
                  </div>
                </div>

                <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl px-4 py-3 text-xs text-indigo-300 leading-relaxed">
                  Tu CEO Digital nació como <span className="font-semibold text-white">Atlas</span>. Puedes dejarlo así o ponerle el nombre que mejor represente a tu co-fundador digital — ese nombre es como te va a responder y como lo va a conocer tu equipo.
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-2">Nombre del CEO Digital</label>
                  <input
                    value={ceoName}
                    onChange={e => setCeoName(e.target.value)}
                    placeholder="Atlas"
                    maxLength={40}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  <p className="text-[10px] text-gray-600 mt-1.5">Si lo dejas vacío, quedará como "Atlas"</p>
                </div>

                <div className="flex gap-3">
                  <button
                    disabled={postSaving}
                    onClick={async () => {
                      const nombre = ceoName.trim() || 'Atlas';
                      setPostSaving(true);
                      try {
                        await fetch(`${API}/onboarding/rename-ceo`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ tenantId: onboardingTenantId, name: nombre }),
                        });
                      } catch {}
                      setPostSaving(false);
                      setPostStep('ai');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                  >
                    {postSaving ? <Loader2 size={13} className="animate-spin" /> : <ChevronRight size={13} />}
                    {postSaving ? 'Guardando...' : `Continuar con "${ceoName.trim() || 'Atlas'}"`}
                  </button>
                </div>
              </div>
            )}

            {/* Pasos post-onboarding: Motor de IA */}
            {postStep === 'ai' && (
              <div className="mx-4 my-4 bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                    <Cpu size={16} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Motor de IA</p>
                    <p className="text-gray-400 text-xs">CEO Digital usa Claude. Los demás agentes usan OpenRouter gratis.</p>
                  </div>
                </div>

                {/* CEO Digital */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">CEO Digital — API Key de Claude</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ v: 'anthropic', l: 'Claude' }, { v: 'openai', l: 'GPT-4o' }, { v: 'openrouter', l: 'OpenRouter' }].map(opt => (
                      <button key={opt.v} onClick={() => setCeoForm(p => ({ ...p, ceo_ai_provider: opt.v, ceo_api_key: '' }))}
                        className={`py-2 text-xs font-medium rounded-lg border transition-colors ${ceoForm.ceo_ai_provider === opt.v ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                  <input type="password" value={ceoForm.ceo_api_key}
                    onChange={e => setCeoForm(p => ({ ...p, ceo_api_key: e.target.value }))}
                    placeholder={ceoForm.ceo_ai_provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>

                {/* Agentes de la empresa */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Agentes de la empresa — API Key de OpenRouter</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ v: 'openrouter', l: 'OpenRouter (free ✓)' }, { v: 'ollama', l: 'Ollama local' }].map(opt => (
                      <button key={opt.v} onClick={() => setAgentForm(p => ({ ...p, ai_provider: opt.v, api_key: '' }))}
                        className={`py-2 text-xs font-medium rounded-lg border transition-colors ${agentForm.ai_provider === opt.v ? 'bg-emerald-700 border-emerald-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                  {agentForm.ai_provider !== 'ollama' && (
                    <input type="password" value={agentForm.api_key}
                      onChange={e => setAgentForm(p => ({ ...p, api_key: e.target.value }))}
                      placeholder="sk-or-... (gratis en openrouter.com)"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    disabled={postSaving}
                    onClick={async () => {
                      setPostSaving(true);
                      try {
                        await fetch(`${API}/onboarding/ai-config`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            tenantId: onboardingTenantId,
                            ...ceoForm,
                            ...agentForm,
                          }),
                        });
                      } catch {}
                      setPostSaving(false);
                      setPostStep('conmutador');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                  >
                    {postSaving ? <Loader2 size={13} className="animate-spin" /> : <ChevronRight size={13} />}
                    {postSaving ? 'Guardando...' : 'Guardar y continuar'}
                  </button>
                  <button onClick={() => setPostStep('conmutador')}
                    className="px-4 text-sm text-gray-400 hover:text-white transition-colors">
                    Omitir
                  </button>
                </div>
              </div>
            )}

            {/* Pasos post-onboarding: Agente de Comunicación */}
            {postStep === 'conmutador' && (
              <div className="mx-4 my-4 bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                    <Phone size={16} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Agente de Comunicación</p>
                    <p className="text-gray-400 text-xs">Recibe y redirige llamadas con IA</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">Activar Agente de Comunicación</span>
                  <button
                    onClick={() => setPbxForm(p => ({ ...p, enabled: !p.enabled }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${pbxForm.enabled ? 'bg-indigo-600' : 'bg-gray-700'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${pbxForm.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {pbxForm.enabled && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Número principal (DID)</label>
                      <input value={pbxForm.main_number}
                        onChange={e => setPbxForm(p => ({ ...p, main_number: e.target.value }))}
                        placeholder="+52155..."
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Texto de bienvenida</label>
                      <input value={pbxForm.greeting_text}
                        onChange={e => setPbxForm(p => ({ ...p, greeting_text: e.target.value }))}
                        placeholder="Bienvenido a Empresa X. ¿En qué le puedo ayudar?"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {/* LLM de razonamiento */}
                    <div className="pt-1 border-t border-gray-800">
                      <label className="block text-xs text-gray-400 mb-1.5">LLM de razonamiento</label>
                      <select value={(pbxForm as any).llm_model ?? 'meta-llama/llama-3.3-70b-instruct:free'}
                        onChange={e => setPbxForm(p => ({ ...p, llm_model: e.target.value } as any))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
                        <option value="meta-llama/llama-3.3-70b-instruct:free">Llama 3.3 70B (gratis)</option>
                        <option value="openai/gpt-4o-mini">GPT-4o mini</option>
                        <option value="openai/gpt-4o">GPT-4o</option>
                        <option value="anthropic/claude-haiku-4-5">Claude Haiku (rápido)</option>
                        <option value="anthropic/claude-sonnet-4-6">Claude Sonnet</option>
                      </select>
                    </div>

                    {/* STT */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Transcripción de voz (STT)</label>
                      <div className="flex gap-2">
                        {[{ v: 'whisper', l: 'Whisper local' }, { v: 'deepgram', l: 'Deepgram' }, { v: 'openai', l: 'OpenAI' }].map(opt => (
                          <button key={opt.v} onClick={() => setPbxForm(p => ({ ...p, stt_provider: opt.v }))}
                            className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                              pbxForm.stt_provider === opt.v ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'
                            }`}>{opt.l}</button>
                        ))}
                      </div>
                    </div>

                    {/* TTS */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Síntesis de voz (TTS)</label>
                      <div className="flex gap-2">
                        {[{ v: 'piper', l: 'Piper local' }, { v: 'elevenlabs', l: 'ElevenLabs' }, { v: 'openai', l: 'OpenAI' }].map(opt => (
                          <button key={opt.v} onClick={() => setPbxForm(p => ({ ...p, tts_provider: opt.v }))}
                            className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                              pbxForm.tts_provider === opt.v ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'
                            }`}>{opt.l}</button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Servidor</label>
                      <div className="flex gap-2">
                        {[{ v: 'local', l: '🖥 En tu servidor' }, { v: 'cloud', l: '☁️ En la nube' }].map(opt => (
                          <button key={opt.v} onClick={() => setPbxForm(p => ({ ...p, deployment: opt.v }))}
                            className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                              pbxForm.deployment === opt.v ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'
                            }`}>{opt.l}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    disabled={postSaving}
                    onClick={async () => {
                      setPostSaving(true);
                      try {
                        if (pbxForm.enabled || pbxForm.main_number) {
                          await fetch(`${API}/onboarding/conmutador`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ tenantId: onboardingTenantId, ...pbxForm }),
                          });
                        }
                      } catch {}
                      setPostSaving(false);
                      router.push('/login?onboarding=done');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                  >
                    {postSaving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                    {postSaving ? 'Guardando...' : 'Guardar y finalizar'}
                  </button>
                  <button
                    onClick={() => router.push('/login?onboarding=done')}
                    className="px-4 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Omitir
                  </button>
                </div>
              </div>
            )}

            {/* Pantalla de completado (sin tenant_id — fallback) */}
            {completed && !postStep && (
              <div className="flex justify-center py-4">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-6 py-4 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-emerald-400 font-semibold text-sm">¡Tu FlowDesk está listo!</p>
                  <p className="text-gray-400 text-xs mt-1">Redirigiendo al login…</p>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-800/60 p-4">
            <div className="flex items-end gap-3 bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3 focus-within:border-gray-600 transition-colors">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={completed ? 'Onboarding completado' : 'Escribe tu respuesta…'}
                disabled={chatLoading || completed}
                rows={1}
                className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 resize-none outline-none max-h-32 leading-relaxed disabled:opacity-50"
                style={{ fieldSizing: 'content' } as any}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || chatLoading || completed}
                className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#4DBBF0] hover:bg-[#3aabdf] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-gray-950" />
              </button>
            </div>
            <p className="text-xs text-gray-700 text-center mt-2">Enter para enviar · Shift+Enter para nueva línea</p>
          </div>

        </main>
      </div>
    </div>
  );
}

function AtlasAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-[#4DBBF0]/20 border border-[#4DBBF0]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Bot className="w-3.5 h-3.5 text-[#4DBBF0]" />
    </div>
  );
}
