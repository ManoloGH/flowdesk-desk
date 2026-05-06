'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Search, RefreshCw, Phone, Mail, Tag } from 'lucide-react';

interface Contact {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  ghl_id: string | null;
  last_contact_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  lead: 'bg-yellow-500/20 text-yellow-400',
  prospect: 'bg-blue-500/20 text-blue-400',
  client: 'bg-emerald-500/20 text-emerald-400',
  churned: 'bg-red-500/20 text-red-400',
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ total: number; created: number; updated: number } | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get('/contacts');
      setContacts(Array.isArray(data) ? data : data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function importFromGhl() {
    setImporting(true);
    setImportResult(null);
    try {
      const result = await api.get('/integrations/ghl/contacts');
      setImportResult(result);
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setImporting(false);
    }
  }

  const filtered = contacts.filter((c) => {
    const name = `${c.first_name} ${c.last_name ?? ''}`.toLowerCase();
    return name.includes(search.toLowerCase()) ||
      (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? '').includes(search);
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Contactos</h1>
          <p className="text-gray-400 mt-1 text-sm">{contacts.length} contactos en total</p>
        </div>
        <button
          onClick={importFromGhl}
          disabled={importing}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <RefreshCw size={15} className={importing ? 'animate-spin' : ''} />
          {importing ? 'Importando...' : 'Sincronizar GHL'}
        </button>
      </div>

      {importResult && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6 text-sm text-emerald-400">
          Sincronización completa — {importResult.total} total · {importResult.created} nuevos · {importResult.updated} actualizados
        </div>
      )}

      <div className="relative mb-6">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Nombre</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Contacto</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Estado</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Fuente</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Último contacto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
                        {c.first_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-white">
                        {c.first_name} {c.last_name ?? ''}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="space-y-0.5">
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Mail size={11} />{c.email}
                        </div>
                      )}
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Phone size={11} />{c.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${STATUS_COLORS[c.status] ?? 'bg-gray-700 text-gray-400'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {c.ghl_id ? (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Tag size={11} /> GHL
                      </span>
                    ) : (
                      <span className="text-xs text-gray-600">Manual</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">
                    {c.last_contact_at
                      ? new Date(c.last_contact_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-500 text-sm">
                    {contacts.length === 0 ? 'Sin contactos — sincroniza con GHL para importarlos' : 'Sin resultados'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
