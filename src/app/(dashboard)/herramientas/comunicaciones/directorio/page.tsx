'use client';
import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, UserCheck, UserX, Pencil } from 'lucide-react';
import { api } from '@/lib/api';

type ContactType = 'employee' | 'client' | 'lead';

interface Contact {
  id: string;
  name: string;
  type: ContactType;
  phone: string;
  status: 'active';
  role?: string;
  source: 'teamslot' | 'contact';
}

const TYPE_LABEL: Record<ContactType, string> = {
  employee: 'Empleado',
  client: 'Cliente',
  lead: 'Lead',
};

const TYPE_COLOR: Record<ContactType, string> = {
  employee: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  client: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  lead: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

const TYPE_FILTERS = [
  { key: 'all',      label: 'Todos' },
  { key: 'employee', label: 'Empleados' },
  { key: 'client',   label: 'Clientes' },
  { key: 'lead',     label: 'Leads' },
];

export default function DirectorioPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchContacts = useCallback((q: string, type: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('search', q);
    if (type !== 'all') params.set('type', type);
    const query = params.toString();
    api.get<Contact[]>(`/communications/contacts${query ? `?${query}` : ''}`)
      .then(setContacts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchContacts(search, typeFilter), 300);
    return () => clearTimeout(t);
  }, [search, typeFilter, fetchContacts]);

  return (
    <div className="px-6 py-5 space-y-4">
      <p className="text-xs text-gray-500">
        El directorio mapea números de teléfono a identidades. El motor de ruteo lo consulta en cada mensaje entrante para decidir a qué agente enviarlo.
      </p>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o teléfono…"
            className="w-full bg-[#0a0f1e] border border-white/5 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <div className="flex gap-1">
          {TYPE_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === key ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/30' : 'bg-[#0a0f1e] border border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Nuevo contacto
        </button>
      </div>

      <div className="bg-[#0a0f1e] border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-4 py-2.5 text-gray-600 font-medium">Nombre</th>
              <th className="text-left px-4 py-2.5 text-gray-600 font-medium">Tipo</th>
              <th className="text-left px-4 py-2.5 text-gray-600 font-medium">Teléfono</th>
              <th className="text-left px-4 py-2.5 text-gray-600 font-medium">Rol / Nota</th>
              <th className="text-left px-4 py-2.5 text-gray-600 font-medium">Estado</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-white/[0.03]">
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-3 bg-white/5 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : contacts.map(c => (
              <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${TYPE_COLOR[c.type]}`}>
                    {TYPE_LABEL[c.type]}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-gray-400">{c.phone}</td>
                <td className="px-4 py-3 text-gray-500">{c.role ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <UserCheck className="w-3 h-3" /> Activo
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="text-gray-600 hover:text-cyan-400 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && contacts.length === 0 && (
          <div className="py-12 text-center text-gray-600 text-xs">Sin contactos que coincidan</div>
        )}
      </div>
    </div>
  );
}
