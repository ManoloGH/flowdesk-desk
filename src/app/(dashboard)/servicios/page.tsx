'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Search, ChevronRight, Clock, Layers, Zap } from 'lucide-react';

interface SocService {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  icon: string | null;
  color: string | null;
  sla_hours: number | null;
  requires_approval: boolean;
  auto_respond: boolean;
  _count: { requests: number };
}

interface DeptGroup {
  department: {
    id: string;
    name: string;
    color: string;
    icon: string | null;
    dept_type: string | null;
  };
  services: SocService[];
}

const DEPT_ICONS: Record<string, string> = {
  hr: '👥', admin: '🏢', accounting: '💰', sales: '📈',
  ops: '⚙️', marketing: '📣', support: '🎧', it: '💻',
  delivery: '🚚', training: '📚', bi: '📊', management: '🎯',
};

export default function CatalogoPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<DeptGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<DeptGroup[]>('/soc/services/catalog');
      setGroups(Array.isArray(data) ? data : []);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredGroups = groups
    .map(g => ({
      ...g,
      services: g.services.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (s.category ?? '').toLowerCase().includes(search.toLowerCase()),
      ),
    }))
    .filter(g => g.services.length > 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Catálogo de servicios</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Solicita servicios internos de cualquier departamento
        </p>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 gap-3 mb-8 sm:grid-cols-3">
        <button
          onClick={() => router.push('/servicios/mis-solicitudes')}
          className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-indigo-500 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center">
            <Layers size={18} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Mis solicitudes</p>
            <p className="text-xs text-gray-500">Ver historial y activas</p>
          </div>
        </button>
        <button
          onClick={() => router.push('/servicios/bandeja')}
          className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-indigo-500 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Zap size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Bandeja</p>
            <p className="text-xs text-gray-500">Solicitudes de tu área</p>
          </div>
        </button>
      </div>

      {/* Buscador */}
      <div className="relative mb-8">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar servicio..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">Sin servicios disponibles</p>
          <p className="text-sm">Pide a un admin del departamento que configure el catálogo</p>
        </div>
      ) : (
        <div className="space-y-10">
          {filteredGroups.map(group => (
            <section key={group.department.id}>
              {/* Encabezado del departamento */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                  style={{ background: `${group.department.color}20` }}
                >
                  {DEPT_ICONS[group.department.dept_type ?? ''] ?? '🏢'}
                </div>
                <h2 className="font-semibold text-white">{group.department.name}</h2>
                <span className="text-xs text-gray-500 bg-gray-800 rounded-full px-2 py-0.5">
                  {group.services.length} servicio{group.services.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Tarjetas de servicios */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.services.map(svc => (
                  <button
                    key={svc.id}
                    onClick={() => router.push(`/servicios/nueva/${svc.id}`)}
                    className="group text-left bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-indigo-500 hover:bg-gray-900/80 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-base"
                        style={{ background: `${svc.color ?? '#6366F1'}20` }}
                      >
                        {svc.icon ?? '📋'}
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-gray-600 group-hover:text-indigo-400 transition-colors mt-1"
                      />
                    </div>
                    <p className="font-medium text-white text-sm mb-1">{svc.name}</p>
                    {svc.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{svc.description}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {svc.sla_hours && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={11} />
                          {svc.sla_hours < 24
                            ? `${svc.sla_hours}h`
                            : `${Math.round(svc.sla_hours / 24)}d`}
                        </span>
                      )}
                      {svc.requires_approval && (
                        <span className="text-xs bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">
                          Requiere aprobación
                        </span>
                      )}
                      {svc.auto_respond && (
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">
                          IA disponible
                        </span>
                      )}
                      {svc.category && (
                        <span className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                          {svc.category}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
