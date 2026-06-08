import { Settings } from 'lucide-react';
import { ComingSoon } from '../_components/ComingSoon';

export default function SettingsPage() {
  return (
    <ComingSoon
      icon={Settings}
      title="Configuración"
      description="Configuración global de la plataforma FlowDesk"
      features={[
        'Definir planes: Starter, Growth, Pro, Enterprise',
        'Límites por plan: usuarios, agentes, automatizaciones, almacenamiento, tokens IA',
        'Modelos de IA disponibles por plan',
        'Branding white-label: dominios, logos, correos',
        'Proveedores de IA y costos por modelo',
      ]}
    />
  );
}
