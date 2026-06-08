import { AlertTriangle } from 'lucide-react';
import { ComingSoon } from '../_components/ComingSoon';

export default function IncidentsPage() {
  return (
    <ComingSoon
      icon={AlertTriangle}
      title="Incidentes"
      description="Centro de alertas y respuesta a incidentes de la plataforma"
      features={[
        'API caída o con alta latencia',
        'WhatsApp desconectado en algún cliente',
        'Error de facturación o cobro fallido',
        'Automatización detenida o en loop',
        'Resolver, asignar o escalar incidentes',
      ]}
    />
  );
}
