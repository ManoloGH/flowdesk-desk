import { Brain } from 'lucide-react';
import { ComingSoon } from '../_components/ComingSoon';

export default function AIAnalyticsPage() {
  return (
    <ComingSoon
      icon={Brain}
      title="IA Analytics"
      description="Consumo y rentabilidad de IA por empresa y agente"
      features={[
        'Tokens consumidos por empresa y por agente',
        'Costo real de IA por cliente (Anthropic + OpenRouter)',
        'Margen por cliente: ingreso - costo IA',
        'Alertas de clientes con alto consumo',
        'Identificar agentes costosos o ineficientes',
      ]}
    />
  );
}
