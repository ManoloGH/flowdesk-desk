'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Users, Bot, Plus, Search } from 'lucide-react';

interface Slot {
  id: string;
  name: string;
  email: string | null;
  role: string;
  type: 'HUMAN' | 'AI_AGENT';
  status: string;
  department?: { name: string; color: string } | null;
}

export default function TeamPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'HUMAN' | 'AI_AGENT'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/team-slots').then((data) => {
      setSlots(Array.isArray(data) ? data : data.data ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = slots.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.email ?? '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || s.type === filter;
    return matchSearch && matchFilter;
  });

  const humans = slots.filter((s) => s.type === 'HUMAN').length;
  const agents = slots.filter((s) => s.type === 'AI_AGENT').length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Equipo</h1>
          <p className="text-gray-400 mt-1 text-sm">{humans} personas · {agents} agentes IA</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
          <Plus size={15} />
          Añadir
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {(['all', 'HUMAN', 'AI_AGENT'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'HUMAN' ? 'Personas' : 'Agentes IA'}
          </button>
        ))}
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
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Tipo</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Rol</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Departamento</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((slot) => (
                <tr key={slot.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        slot.type === 'HUMAN' ? 'bg-indigo-600 text-white' : 'bg-purple-600 text-white'
                      }`}>
                        {slot.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{slot.name}</p>
                        {slot.email && <p className="text-xs text-gray-500">{slot.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {slot.type === 'HUMAN' ? (
                        <><Users size={13} className="text-indigo-400" /><span className="text-xs text-gray-400">Persona</span></>
                      ) : (
                        <><Bot size={13} className="text-purple-400" /><span className="text-xs text-gray-400">Agente IA</span></>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-gray-400 capitalize">{slot.role}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {slot.department ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300">
                        {slot.department.name}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      slot.status === 'ONLINE'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-gray-700 text-gray-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${slot.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                      {slot.status === 'ONLINE' ? 'Online' : 'Offline'}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-500 text-sm">
                    No hay resultados
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
