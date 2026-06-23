'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Bot, Sparkles, ChevronRight, Zap, Globe } from 'lucide-react';
import clsx from 'clsx';

interface Agent {
  id: string;
  name: string;
  type: 'AI_AGENT';
  agent_role: string | null;
  agent_scope: string | null;
  status: string;
  avatar_url: string | null;
  agent_config: {
    instructions?: string;
    model?: string;
  } | null;
}

const ROLE_LABEL: Record<string, string> = {
  ceo:               'CEO Digital',
  focus_agent:       'Agente de Enfoque',
  daily_assistant:   'Asistente Diario',
  department_agent:  'Agente de Área',
  company_agent:     'Agente Empresarial',
};

const ROLE_DESC: Record<string, string> = {
  ceo:             'Socio estratégico con acceso completo: tareas, objetivos, calendario, email, cultura y más.',
  focus_agent:     'Prioriza tus tareas y gestiona tu tiempo con enfoque.',
  daily_assistant: 'Organiza tu jornada y coordina tu agenda del día.',
  department_agent:'Apoya al equipo con información y procesos del área.',
  company_agent:   'Visibilidad completa de la empresa para decisiones informadas.',
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get<any>('/team-slots')
      .then((data) => {
        const list: Agent[] = Array.isArray(data) ? data : (data.data ?? []);
        setAgents(list.filter((s) => s.type === 'AI_AGENT'));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const ceo = agents.find((a) => a.agent_role === 'ceo');
  const rest = agents.filter((a) => a.agent_role !== 'ceo');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Agentes IA</h1>
          <p className="text-sm text-gray-500 mt-1">Tu equipo de inteligencia artificial trabajando para ti.</p>
        </div>

        {/* CEO Agent — tarjeta premium */}
        {ceo && (
          <div className="relative mb-8 rounded-2xl overflow-hidden border border-indigo-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-[#0f172a] to-violet-950" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_60%)]" />

            <div className="relative z-10 p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center flex-shrink-0">
                <Sparkles size={28} className="text-indigo-300" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase">CEO Digital</span>
                  <span className={clsx(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                    ceo.status === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-500'
                  )}>
                    {ceo.status === 'ONLINE' ? 'Activo' : ceo.status}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">{ceo.name}</h2>
                <p className="text-sm text-gray-400 mt-1 max-w-2xl">
                  {ceo.agent_config?.instructions?.slice(0, 120).concat('…') ?? ROLE_DESC['ceo']}
                </p>

                <div className="flex flex-wrap gap-2 mt-3">
                  {['Calendario', 'Email', 'Tareas', 'Cultura', 'AUP', 'Brain'].map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => router.push(`/agents/${ceo.id}`)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors flex-shrink-0"
              >
                <Zap size={15} />
                Abrir
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Agentes custom */}
        {rest.length > 0 && (
          <>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Mis agentes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rest.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => router.push(`/agents/${agent.id}`)}
                  className="group text-left bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-indigo-500/50 hover:bg-gray-800/60 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center group-hover:border-indigo-500/40 transition-colors">
                      <Bot size={18} className="text-gray-400 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <span className={clsx(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                      agent.status === 'ONLINE' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-800 text-gray-600'
                    )}>
                      {agent.status === 'ONLINE' ? 'Activo' : agent.status}
                    </span>
                  </div>

                  <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-0.5">
                    {ROLE_LABEL[agent.agent_role ?? ''] ?? 'Agente IA'}
                  </p>
                  <p className="text-sm font-semibold text-white">{agent.name}</p>
                  <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">
                    {agent.agent_config?.instructions?.slice(0, 90).concat('…') ?? ROLE_DESC[agent.agent_role ?? ''] ?? 'Agente personalizado.'}
                  </p>

                  <div className="flex items-center gap-1 mt-4 text-indigo-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Chatear <ChevronRight size={13} />
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Estado vacío (sin agentes custom aún) */}
        {rest.length === 0 && !loading && (
          <div className="mt-4 rounded-xl border border-dashed border-gray-800 p-8 text-center">
            <Bot size={24} className="text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Aún no tienes agentes personalizados.</p>
            <p className="text-xs text-gray-600 mt-1">Pídele a Atlas que cree uno para ti desde el chat.</p>
          </div>
        )}

        {/* ── Herramientas de IA ── */}
        <div className="mt-10">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Herramientas de IA</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Web Builder */}
            <button
              onClick={() => router.push('/mi-web')}
              className="group text-left bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-indigo-500/50 hover:bg-gray-800/60 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 flex items-center justify-center group-hover:border-indigo-500/60 transition-colors">
                  <Globe size={18} className="text-indigo-400" />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Web Builder
                </span>
              </div>
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-0.5">Herramienta</p>
              <p className="text-sm font-semibold text-white">Crea tu web con IA</p>
              <p className="text-xs text-gray-500 mt-1.5">
                Genera una landing page profesional con animaciones de scroll. Solo describe tu negocio y la IA la construye.
              </p>
              <div className="flex items-center gap-1 mt-4 text-indigo-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Abrir <ChevronRight size={13} />
              </div>
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}
