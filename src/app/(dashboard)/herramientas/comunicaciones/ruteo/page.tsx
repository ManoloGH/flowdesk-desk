'use client';
import { useEffect, useState } from 'react';
import { Users, UserCheck, HelpCircle, Plug, Pencil, Check, X } from 'lucide-react';
import { api } from '@/lib/api';

type SlotType = 'employee' | 'client' | 'unknown';

interface RoutingSlot {
  type: SlotType;
  label: string;
  description: string;
  agentLabel: string | null;
  agentConnected: boolean;
  fallbackMessage: string;
  active: boolean;
}

const SLOT_META: Record<SlotType, { icon: React.ElementType; iconColor: string }> = {
  employee: { icon: UserCheck,  iconColor: 'text-violet-400' },
  client:   { icon: Users,      iconColor: 'text-emerald-400' },
  unknown:  { icon: HelpCircle, iconColor: 'text-amber-400' },
};

function SlotCard({ slot }: { slot: RoutingSlot }) {
  const [editingMsg, setEditingMsg] = useState(false);
  const [msg, setMsg] = useState(slot.fallbackMessage);
  const [draft, setDraft] = useState(slot.fallbackMessage);
  const meta = SLOT_META[slot.type];
  const Icon = meta.icon;

  return (
    <div className="bg-[#0a0f1e] border border-white/5 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
            <Icon className={`w-4 h-4 ${meta.iconColor}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{slot.label}</p>
            <p className="text-[10px] text-gray-600 max-w-xs">{slot.description}</p>
          </div>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
          slot.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-gray-600 border-white/5'
        }`}>
          {slot.active ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2.5 bg-black/20">
        <div className="flex items-center gap-2">
          <Plug className={`w-3.5 h-3.5 ${slot.agentConnected ? 'text-cyan-400' : 'text-gray-700'}`} />
          <span className={`text-xs ${slot.agentConnected ? 'text-white' : 'text-gray-600'}`}>
            {slot.agentLabel ?? 'Sin agente conectado'}
          </span>
        </div>
        {!slot.agentConnected && (
          <button className="text-[10px] text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded transition-colors">
            Conectar agente
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-gray-600 uppercase tracking-wider">Mensaje cuando no hay agente</p>
          {!editingMsg
            ? <button onClick={() => { setDraft(msg); setEditingMsg(true); }} className="text-gray-600 hover:text-cyan-400 transition-colors"><Pencil className="w-3 h-3" /></button>
            : (
              <div className="flex gap-1">
                <button onClick={() => { setMsg(draft); setEditingMsg(false); }} className="text-emerald-400 hover:text-emerald-300 transition-colors"><Check className="w-3 h-3" /></button>
                <button onClick={() => setEditingMsg(false)} className="text-gray-600 hover:text-red-400 transition-colors"><X className="w-3 h-3" /></button>
              </div>
            )
          }
        </div>
        {editingMsg
          ? <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={2}
              className="w-full bg-black/30 border border-cyan-500/30 rounded-lg px-3 py-2 text-xs text-white resize-none focus:outline-none focus:border-cyan-500"
            />
          : <p className="text-xs text-gray-400 bg-black/20 rounded-lg px-3 py-2 leading-relaxed">{msg}</p>
        }
      </div>
    </div>
  );
}

export default function RuteoPage() {
  const [slots, setSlots] = useState<RoutingSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<RoutingSlot[]>('/communications/routing')
      .then(setSlots)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-6 py-5 space-y-4">
      <p className="text-xs text-gray-500">
        El motor de ruteo identifica quién escribió y envía el mensaje al agente correcto. Hay tres slots fijos — uno por tipo de contacto. Conecta un agente a cada slot cuando esté listo.
      </p>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-[#0a0f1e] border border-white/5 rounded-xl p-5 h-48 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {slots.map(slot => <SlotCard key={slot.type} slot={slot} />)}
        </div>
      )}

      <div className="bg-[#0a0f1e] border border-white/5 rounded-xl p-4">
        <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Lógica de ruteo</p>
        <ol className="space-y-1.5 text-xs text-gray-500">
          <li className="flex gap-2"><span className="text-cyan-500 font-mono">1.</span> Llega mensaje → se busca el número en el Directorio</li>
          <li className="flex gap-2"><span className="text-cyan-500 font-mono">2.</span> Si es empleado → slot Empleados → Asistente Personal</li>
          <li className="flex gap-2"><span className="text-cyan-500 font-mono">3.</span> Si es cliente → slot Clientes → Agente de Servicio al Cliente</li>
          <li className="flex gap-2"><span className="text-cyan-500 font-mono">4.</span> Si no está registrado → slot Desconocidos → Agente de Prospección</li>
          <li className="flex gap-2"><span className="text-cyan-500 font-mono">5.</span> Si el slot no tiene agente → se envía el mensaje de fallback</li>
        </ol>
      </div>
    </div>
  );
}
