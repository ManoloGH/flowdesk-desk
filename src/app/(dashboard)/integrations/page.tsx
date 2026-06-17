'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CheckCircle, Circle, RefreshCw, Link, Unlink, ExternalLink, AlertCircle } from 'lucide-react';

interface Integration {
  id: string;
  provider: string;
  status: string;
}

interface GhlForm {
  api_key: string;
  location_id: string;
}

const INTEGRATIONS = [
  {
    key: 'ghl',
    name: 'GoHighLevel',
    desc: 'CRM, oportunidades, calendario y contactos',
    color: 'from-orange-500 to-yellow-500',
    letter: 'G',
    type: 'apikey' as const,
  },
  {
    key: 'google',
    name: 'Google Workspace',
    desc: 'Gmail y Google Calendar para el CEO Digital',
    color: 'from-red-500 to-orange-400',
    letter: 'G',
    type: 'oauth' as const,
    connectUrlPath: '/integrations/google/connect-url',
    testPath: '/integrations/google/test',
  },
  {
    key: 'microsoft365',
    name: 'Microsoft 365',
    desc: 'Outlook y calendario Teams para el CEO Digital',
    color: 'from-blue-600 to-cyan-500',
    letter: 'M',
    type: 'oauth' as const,
    connectUrlPath: '/integrations/microsoft/connect-url',
    testPath: '/integrations/microsoft/test',
  },
  {
    key: 'evolution',
    name: 'Evolution API (WhatsApp)',
    desc: 'Mensajería WhatsApp bidireccional',
    color: 'from-green-500 to-emerald-500',
    letter: 'W',
    type: 'soon' as const,
  },
  {
    key: 'chatwoot',
    name: 'Chatwoot',
    desc: 'Bandeja compartida de atención al cliente',
    color: 'from-indigo-500 to-blue-500',
    letter: 'C',
    type: 'soon' as const,
  },
];

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [ghlForm, setGhlForm] = useState<GhlForm>({ api_key: '', location_id: '' });
  const [ghlSaving, setGhlSaving] = useState(false);
  const [ghlImporting, setGhlImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get<Integration[]>('/integrations');
      setIntegrations(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Manejar ?success= o ?error= del callback OAuth
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    if (success) {
      setBanner({ type: 'success', msg: `${success === 'google' ? 'Google Workspace' : 'Microsoft 365'} conectado correctamente.` });
      load();
      router.replace('/integrations');
    } else if (error) {
      setBanner({ type: 'error', msg: `Error al conectar: ${error.replace(/_/g, ' ')}` });
      router.replace('/integrations');
    }
  }, [searchParams]);

  const getConnected = (provider: string) =>
    integrations.find((i) => i.provider === provider && i.status === 'connected');

  const handleOAuth = async (int: typeof INTEGRATIONS[number]) => {
    if (int.type !== 'oauth' || !int.connectUrlPath) return;
    setConnecting(int.key);
    try {
      const { url } = await api.get<{ url: string }>(int.connectUrlPath);
      window.location.href = url;
    } catch (e: any) {
      setBanner({ type: 'error', msg: e.message });
      setConnecting(null);
    }
  };

  const handleDisconnect = async (int: typeof INTEGRATIONS[number]) => {
    const connected = getConnected(int.key);
    if (!connected) return;
    setDisconnecting(int.key);
    try {
      await api.delete(`/integrations/${connected.id}`);
      await load();
    } catch {}
    setDisconnecting(null);
  };

  const handleTest = async (int: typeof INTEGRATIONS[number]) => {
    if (!int.testPath) return;
    setConnecting(int.key);
    try {
      const res = await api.get<any>(int.testPath);
      setTestResult(prev => ({
        ...prev,
        [int.key]: res.ok
          ? { ok: true, msg: `Conexión activa${res.email ? ` · ${res.email}` : ''}${res.today_events !== undefined ? ` · ${res.today_events} eventos hoy` : ''}` }
          : { ok: false, msg: res.error ?? 'Sin conexión' },
      }));
    } catch (e: any) {
      setTestResult(prev => ({ ...prev, [int.key]: { ok: false, msg: e.message } }));
    }
    setConnecting(null);
  };

  async function connectGhl() {
    setGhlSaving(true);
    try {
      await api.post('/integrations/ghl/connect', ghlForm);
      await load();
      setGhlForm({ api_key: '', location_id: '' });
    } catch (e: any) {
      setBanner({ type: 'error', msg: e.message });
    } finally {
      setGhlSaving(false);
    }
  }

  async function importGhlContacts() {
    setGhlImporting(true);
    setImportResult(null);
    try {
      const result = await api.get<any>('/integrations/ghl/contacts');
      setImportResult(`${result.total} contactos — ${result.created} nuevos, ${result.updated} actualizados`);
    } catch (e: any) {
      setBanner({ type: 'error', msg: e.message });
    } finally {
      setGhlImporting(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Integraciones</h1>
        <p className="text-gray-400 mt-1 text-sm">Conecta FlowDesk con tus herramientas</p>
      </div>

      {/* Banner de éxito/error del callback OAuth */}
      {banner && (
        <div className={`flex items-start gap-3 rounded-xl p-4 mb-6 ${
          banner.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/30'
            : 'bg-red-500/10 border border-red-500/30'
        }`}>
          {banner.type === 'success'
            ? <CheckCircle size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
            : <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />}
          <p className={`text-sm ${banner.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>
            {banner.msg}
          </p>
          <button onClick={() => setBanner(null)} className="ml-auto text-gray-500 hover:text-gray-300 text-lg leading-none">×</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {INTEGRATIONS.map((int) => {
            const connected = getConnected(int.key);
            const result = testResult[int.key];
            const isBusy = connecting === int.key || disconnecting === int.key;

            return (
              <div key={int.key} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${int.color} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-sm font-bold text-white">{int.letter}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white text-sm">{int.name}</h3>
                        {connected
                          ? <CheckCircle size={14} className="text-emerald-400" />
                          : <Circle size={14} className="text-gray-600" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{int.desc}</p>
                      {result && (
                        <p className={`text-xs mt-1 ${result.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                          {result.ok ? '✓ ' : '✗ '}{result.msg}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${
                      connected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-500'
                    }`}>
                      {connected ? 'Conectado' : int.type === 'soon' ? 'Próximamente' : 'Sin conectar'}
                    </span>

                    {/* Botones según tipo */}
                    {int.type === 'oauth' && connected && (
                      <>
                        <button
                          onClick={() => handleTest(int)}
                          disabled={isBusy}
                          className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                          {connecting === int.key ? 'Probando...' : 'Probar'}
                        </button>
                        <button
                          onClick={() => handleDisconnect(int)}
                          disabled={isBusy}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title="Desconectar"
                        >
                          <Unlink size={14} />
                        </button>
                      </>
                    )}

                    {int.type === 'oauth' && !connected && (
                      <button
                        onClick={() => handleOAuth(int)}
                        disabled={isBusy}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50"
                      >
                        <ExternalLink size={12} />
                        {connecting === int.key ? 'Redirigiendo...' : 'Conectar'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Panel expandido GHL */}
                {int.key === 'ghl' && (
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    {connected ? (
                      <div className="flex items-center gap-3 flex-wrap">
                        <button
                          onClick={importGhlContacts}
                          disabled={ghlImporting}
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                        >
                          <RefreshCw size={12} className={ghlImporting ? 'animate-spin' : ''} />
                          {ghlImporting ? 'Importando...' : 'Sincronizar contactos'}
                        </button>
                        <button
                          onClick={() => handleDisconnect(int)}
                          disabled={!!disconnecting}
                          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-gray-700 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          <Unlink size={12} />
                          Desconectar
                        </button>
                        {importResult && (
                          <span className="text-xs text-emerald-400">{importResult}</span>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">API Key (Private Integration)</label>
                          <input
                            type="password"
                            placeholder="pit-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            value={ghlForm.api_key}
                            onChange={(e) => setGhlForm((f) => ({ ...f, api_key: e.target.value }))}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Location ID</label>
                          <input
                            type="text"
                            placeholder="ozv1adLnIfP3r3Ftz0Ff"
                            value={ghlForm.location_id}
                            onChange={(e) => setGhlForm((f) => ({ ...f, location_id: e.target.value }))}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <button
                            onClick={connectGhl}
                            disabled={ghlSaving || !ghlForm.api_key || !ghlForm.location_id}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                          >
                            <Link size={12} />
                            {ghlSaving ? 'Conectando...' : 'Conectar GHL'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Info OAuth personal */}
                {int.type === 'oauth' && (
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <p className="text-xs text-gray-600">
                      Integración personal — FlowDesk accederá a tu cuenta para que el CEO Digital pueda leer tu calendario y email.
                      Solo se almacena el token de actualización cifrado.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
