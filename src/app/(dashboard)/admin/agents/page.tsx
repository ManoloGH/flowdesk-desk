import { Bot } from 'lucide-react';
import { ComingSoon } from '../_components/ComingSoon';

export default function AgentsPage() {
  return (
    <ComingSoon
      icon={Bot}
      title="Agentes"
      description="Biblioteca global de agentes IA de la plataforma"
      features={[
        'Biblioteca de plantillas: Setter IA, SDR IA, Cobrador IA, Reclutador IA',
        'Crear y versionar plantillas de agentes',
        'Ver cuántas empresas usan cada agente',
        'Métricas: conversaciones, conversión, costo por agente',
        'Publicar al Marketplace',
      ]}
    />
  );
}
