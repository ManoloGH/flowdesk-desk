'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Download, Upload, RefreshCw, ShieldAlert, Key, Wifi, WifiOff,
  Eye, EyeOff, CheckCircle, AlertTriangle, User, Copy, Check,
} from 'lucide-react';
import { api } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Tenant {
  id: string;
  name: string;
  plan: string;
  status: string;
}

interface Slot {
  id: string;
  name: string;
  email: string | null;
  role: string;
  status: string;
}

interface Integration {
  id: string;
  provider: string;
  status: string;
  integration_scope: string;
  connected_at: string | null;
  last_sync_at: string | null;
  config: Record<string, any> | null;
  owner_slot: { id: string; name: string; email: string } | null;
}

interface ResetResult {
  slot_id: string;
  name: string;
  email: string;
  new_password: string;
}

interface RestoreResult {
  tenant_id: string;
  restored_at: string;
  summary: Record<string, number>;
  warnings?: string[];
}

type Tab = 'backup' | 'passwords' | 'integrations';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google Workspace',
  microsoft365: 'Microsoft 365',
  gohighlevel: 'GoHighLevel',
  whatsapp: 'WhatsApp',
  chatwoot: 'Chatwoot',
  evolution: 'Evolution API',
  stripe: 'Stripe',
  n8n: 'n8n',
};

const SCOPE_LABELS: Record<string, string> = {
  tenant: 'Empresa',
  department: 'Workspace',
  personal: 'Personal',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecoveryPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [tab, setTab] = useState<Tab>('backup');
  const [loadingTenants, setLoadingTenants] = useState(true);

  // Backup / Restore
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
  const [restoreFilename, setRestoreFilename] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Passwords
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [resetResults, setResetResults] = useState<Record<string, ResetResult>>({});
  const [resettingSlot, setResettingSlot] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedSlot, setCopiedSlot] = useState('');

  // Integrations
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);

  // Load tenants on mount
  useEffect(() => {
    api.get('/tenants')
      .then((data: any) => setTenants(Array.isArray(data) ? data : []))
      .finally(() => setLoadingTenants(false));
  }, []);

  // Reload tab data when tenant or tab changes
  useEffect(() => {
    if (!selectedId) return;
    if (tab === 'passwords') loadSlots();
    if (tab === 'integrations') loadIntegrations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, tab]);

  // ── Data loaders ────────────────────────────────────────────────────────────

  async function loadSlots() {
    setLoadingSlots(true);
    setSlots([]);
    try {
      const data: any = await api.get(`/tenants/${selectedId}/slots`);
      setSlots(Array.isArray(data) ? data : []);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function loadIntegrations() {
    setLoadingIntegrations(true);
    setIntegrations([]);
    try {
      const data: any = await api.get(`/tenants/${selectedId}/integrations-summary`);
      setIntegrations(Array.isArray(data) ? data : []);
    } finally {
      setLoadingIntegrations(false);
    }
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function doExport() {
    if (!selectedId) return;
    setExporting(true);
    try {
      const data: any = await api.get(`/tenants/${selectedId}/export`);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flowdesk-export-${selectedId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('Error al exportar: ' + e.message);
    } finally {
      setExporting(false);
    }
  }

  async function doRestore() {
    if (!fileRef.current?.files?.[0] || !selectedId) return;
    const text = await fileRef.current.files[0].text();
    let exportData: any;
    try {
      exportData = JSON.parse(text);
    } catch {
      alert('El archivo no es un JSON válido');
      return;
    }
    setRestoring(true);
    setRestoreResult(null);
    try {
      const result: any = await api.post(`/tenants/${selectedId}/restore`, exportData);
      setRestoreResult(result);
    } catch (e: any) {
      alert('Error al restaurar: ' + e.message);
    } finally {
      setRestoring(false);
    }
  }

  async function resetPassword(slotId: string) {
    setResettingSlot(slotId);
    try {
      const result: any = await api.post(`/tenants/${selectedId}/slots/${slotId}/reset-password`, {});
      setResetResults((prev) => ({ ...prev, [slotId]: result }));
      setVisiblePasswords((prev) => ({ ...prev, [slotId]: true }));
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setResettingSlot('');
    }
  }

  async function copyPassword(slotId: string, password: string) {
    await navigator.clipboard.writeText(password);
    setCopiedSlot(slotId);
    setTimeout(() => setCopiedSlot(''), 2000);
  }

  function selectTenant(t: Tenant) {
    setSelectedId(t.id);
    setSearch(t.name);
    setShowDropdown(false);
    setRestoreResult(null);
    setResetResults({});
    setSlots([]);
    setIntegrations([]);
    setRestoreFilename('');
  }

  function clearTenant() {
    setSelectedId('');
    setSearch('');
    setSlots([]);
    setIntegrations([]);
    setRestoreResult(null);
    setResetResults({});
    setRestoreFilename('');
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const selectedTenant = tenants.find((t) => t.id === selectedId);
  const filteredTenants = tenants.filter((t) =>
    !selectedId && t.name.toLowerCase().includes(search.toLowerCase())
  );

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'backup', label: 'Backup & Restauración', icon: Download },
    { key: 'passwords', label: 'Contraseñas', icon: Key },
    { key: 'integrations', label: 'Integraciones', icon: Wifi },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-5xl">

      {/* Header */}
      <div className="mb-8">
        <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">MentorIA ERP</span>
        <h1 className="text-2xl font-bold text-white mt-1">Recuperación & Seguridad</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Exporta datos, restaura backups, resetea contraseñas e inspecciona integraciones de cualquier cliente
        </p>
      </div>

      {/* Tenant selector */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <label className="block text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">
          Empresa a gestionar
        </label>
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder={loadingTenants ? 'Cargando empresas...' : 'Buscar empresa...'}
              value={search}
              disabled={loadingTenants}
              onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
            />
            {showDropdown && filteredTenants.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden z-20 shadow-2xl">
                {filteredTenants.slice(0, 8).map((t) => (
                  <button
                    key={t.id}
                    onMouseDown={() => selectTenant(t)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">{t.name.charAt(0)}</span>
                      </div>
                      <span>{t.name}</span>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-900 px-2 py-0.5 rounded-full">{t.plan}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedId && (
            <button
              onClick={clearTenant}
              className="bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-sm px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              Cambiar
            </button>
          )}
        </div>

        {selectedTenant && (
          <div className="mt-3 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">{selectedTenant.name.charAt(0)}</span>
            </div>
            <span className="text-sm text-white font-medium">{selectedTenant.name}</span>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{selectedTenant.plan}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              selectedTenant.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {selectedTenant.status}
            </span>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!selectedId ? (
        <div className="text-center py-20 text-gray-600">
          <ShieldAlert size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Selecciona una empresa para acceder a las opciones de recuperación</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  tab === key
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* ══ TAB: Backup & Restauración ══ */}
          {tab === 'backup' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Export card */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Download size={20} className="text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Exportar datos</h3>
                    <p className="text-xs text-gray-500">Descarga un JSON completo del cliente</p>
                  </div>
                </div>

                <ul className="space-y-1.5 mb-4">
                  {[
                    'Usuarios, workspaces y horarios',
                    'Tareas, metas y contactos',
                    'Reuniones + transcripciones completas',
                    'Conversaciones con agentes IA',
                    'Memorias del Segundo Cerebro',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="w-1 h-1 rounded-full bg-indigo-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                <p className="text-xs text-gray-600 italic mb-5">
                  Contraseñas y tokens OAuth no se incluyen por seguridad.
                </p>

                <button
                  onClick={doExport}
                  disabled={exporting}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {exporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download size={15} />
                      Descargar export
                    </>
                  )}
                </button>
              </div>

              {/* Restore card */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Upload size={20} className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Restaurar backup</h3>
                    <p className="text-xs text-gray-500">Recupera datos desde un export previo</p>
                  </div>
                </div>

                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-700 hover:border-gray-600 rounded-xl p-5 text-center cursor-pointer transition-colors mb-4"
                >
                  <Upload size={22} className="mx-auto mb-2 text-gray-600" />
                  <p className="text-xs text-gray-500">
                    {restoreFilename
                      ? <span className="text-indigo-400 font-medium">{restoreFilename}</span>
                      : 'Haz clic para seleccionar el archivo .json'
                    }
                  </p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    setRestoreResult(null);
                    setRestoreFilename(e.target.files?.[0]?.name ?? '');
                  }}
                />

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
                  <p className="text-xs text-amber-400 flex items-start gap-2">
                    <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                    Los registros existentes NO se sobreescriben. Solo se restauran datos faltantes.
                  </p>
                </div>

                <button
                  onClick={doRestore}
                  disabled={restoring || !restoreFilename}
                  className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {restoring ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Restaurando...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={15} />
                      Restaurar datos
                    </>
                  )}
                </button>

                {/* Result */}
                {restoreResult && (
                  <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle size={15} className="text-emerald-400" />
                      <span className="text-sm font-semibold text-emerald-400">Restauración completada</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
                      {Object.entries(restoreResult.summary).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs">
                          <span className="text-gray-500 capitalize">{k.replace(/_/g, ' ')}</span>
                          <span className="text-white font-semibold">{v}</span>
                        </div>
                      ))}
                    </div>
                    {restoreResult.warnings?.map((w, i) => (
                      <p key={i} className="text-xs text-amber-400 flex items-start gap-1.5 mt-1">
                        <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" />
                        {w}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ TAB: Contraseñas ══ */}
          {tab === 'passwords' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Usuarios y contraseñas</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Genera una nueva contraseña segura para cualquier usuario. La contraseña anterior queda invalidada.
                  </p>
                </div>
                <button
                  onClick={loadSlots}
                  className="text-gray-500 hover:text-gray-300 transition-colors p-1"
                  title="Recargar"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              {loadingSlots ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-14 text-gray-600 text-sm">Sin usuarios humanos registrados</div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {slots.map((slot) => {
                    const result = resetResults[slot.id];
                    const visible = visiblePasswords[slot.id];
                    const copied = copiedSlot === slot.id;

                    return (
                      <div key={slot.id} className="p-4 hover:bg-gray-800/30 transition-colors">
                        <div className="flex items-center justify-between gap-4">
                          {/* Slot info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0">
                              <User size={15} className="text-gray-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm text-white font-medium truncate">{slot.name}</p>
                              <p className="text-xs text-gray-500 truncate">{slot.email ?? '—'}</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full capitalize hidden sm:inline">
                              {slot.role}
                            </span>
                            <button
                              onClick={() => resetPassword(slot.id)}
                              disabled={resettingSlot === slot.id}
                              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                            >
                              {resettingSlot === slot.id ? (
                                <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Key size={12} />
                              )}
                              Resetear
                            </button>
                          </div>
                        </div>

                        {/* Password result */}
                        {result && (
                          <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500 mb-1">Nueva contraseña — comparte con {result.name}</p>
                              <code className="text-sm font-mono text-emerald-300 tracking-wider break-all">
                                {visible ? result.new_password : '••••••••••••••'}
                              </code>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                onClick={() => setVisiblePasswords((p) => ({ ...p, [slot.id]: !visible }))}
                                className="text-gray-500 hover:text-gray-300 transition-colors p-1.5"
                                title={visible ? 'Ocultar' : 'Mostrar'}
                              >
                                {visible ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                              <button
                                onClick={() => copyPassword(slot.id, result.new_password)}
                                className={`text-gray-500 hover:text-gray-300 transition-colors p-1.5 ${copied ? 'text-emerald-400' : ''}`}
                                title="Copiar"
                              >
                                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ TAB: Integraciones ══ */}
          {tab === 'integrations' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Estado de integraciones</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Google, Microsoft 365, GHL, WhatsApp y más
                  </p>
                </div>
                <button
                  onClick={loadIntegrations}
                  className="text-gray-500 hover:text-gray-300 transition-colors p-1"
                  title="Recargar"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              {loadingIntegrations ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : integrations.length === 0 ? (
                <div className="text-center py-14 text-gray-600 text-sm">Sin integraciones configuradas</div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {integrations.map((intg) => {
                    const isConnected = intg.status === 'connected';
                    const label = PROVIDER_LABELS[intg.provider] ?? intg.provider;

                    return (
                      <div key={intg.id} className="p-4 hover:bg-gray-800/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isConnected ? 'bg-emerald-500/20' : 'bg-gray-800'
                          }`}>
                            {isConnected
                              ? <Wifi size={16} className="text-emerald-400" />
                              : <WifiOff size={16} className="text-gray-600" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm text-white font-medium">{label}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-500'
                              }`}>
                                {isConnected ? 'Conectado' : 'Desconectado'}
                              </span>
                              <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
                                {SCOPE_LABELS[intg.integration_scope] ?? intg.integration_scope}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                              {intg.owner_slot && (
                                <span>Usuario: {intg.owner_slot.name}</span>
                              )}
                              {intg.connected_at && (
                                <span>Conectado: {new Date(intg.connected_at).toLocaleDateString('es-MX')}</span>
                              )}
                              {intg.last_sync_at && (
                                <span>Último sync: {new Date(intg.last_sync_at).toLocaleDateString('es-MX')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="p-4 border-t border-gray-800 bg-gray-950/50">
                <p className="text-xs text-gray-600 flex items-start gap-2">
                  <AlertTriangle size={12} className="flex-shrink-0 mt-0.5 text-gray-700" />
                  Las credenciales OAuth están cifradas (AES-256-GCM) y no son visibles desde aquí.
                  Si una integración aparece desconectada, el cliente debe reconectarla desde
                  Configuración → Integraciones en su desk.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
