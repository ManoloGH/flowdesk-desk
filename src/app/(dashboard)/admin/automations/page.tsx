import { Zap } from 'lucide-react';
import { ComingSoon } from '../_components/ComingSoon';

export default function AutomationsPage() {
  return (
    <ComingSoon
      icon={Zap}
      title="Automatizaciones"
      description="Vista global de todas las automatizaciones del ecosistema"
      features={[
        'Ver todas las automatizaciones activas por empresa',
        'Estado: activa, pausada, con errores',
        'Ejecuciones y tasa de error por workflow',
        'Reiniciar, clonar o pausar desde aquí',
        'Diagnosticar automatizaciones fallidas',
      ]}
    />
  );
}
