'use client';
import { MessageSquare, Phone, CheckCircle2, XCircle, AlertCircle, ExternalLink } from 'lucide-react';

type ChannelStatus = 'connected' | 'disconnected' | 'unconfigured';

function StatusBadge({ status }: { status: ChannelStatus }) {
  if (status === 'connected') return (
    <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> Conectado
    </span>
  );
  if (status === 'disconnected') return (
    <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3" /> Desconectado
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[10px] text-gray-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
      <AlertCircle className="w-3 h-3" /> Sin configurar
    </span>
  );
}

const CHANNELS = [
  {
    id: 'whatsapp',
    icon: MessageSquare,
    name: 'WhatsApp',
    description: 'Canal principal para mensajes con prospectos, clientes y equipo.',
    detail: 'Evolution API',
    status: 'connected' as ChannelStatus,
    number: '+52 55 0000 0000',
    configHref: '/integrations',
  },
  {
    id: 'phone',
    icon: Phone,
    name: 'Teléfono',
    description: 'Llamadas entrantes y salientes con IA de voz (Agente Conmutador).',
    detail: 'Asterisk ARI',
    status: 'unconfigured' as ChannelStatus,
    number: null,
    configHref: '/settings',
  },
];

export default function CanalesPage() {
  return (
    <div className="px-6 py-5 space-y-4">
      <p className="text-xs text-gray-500">Los canales son los puntos de entrada de comunicación. Cada mensaje entrante pasa por el canal al motor de ruteo.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CHANNELS.map(({ id, icon: Icon, name, description, detail, status, number, configHref }) => (
          <div key={id} className="bg-[#0a0f1e] border border-white/5 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{name}</p>
                  <p className="text-[10px] text-gray-600">{detail}</p>
                </div>
              </div>
              <StatusBadge status={status} />
            </div>

            <p className="text-xs text-gray-500">{description}</p>

            {number && (
              <p className="text-xs font-mono text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg w-fit">{number}</p>
            )}

            <a
              href={configHref}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-cyan-300 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              {status === 'unconfigured' ? 'Configurar canal' : 'Ver configuración'}
            </a>
          </div>
        ))}
      </div>

      <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-3">
        <p className="text-xs text-amber-400/80">
          <span className="font-semibold">Próximamente:</span> Instagram DM, correo electrónico y SMS como canales adicionales.
        </p>
      </div>
    </div>
  );
}
