import { Users } from 'lucide-react';
import { ComingSoon } from '../_components/ComingSoon';

export default function UsersPage() {
  return (
    <ComingSoon
      icon={Users}
      title="Usuarios"
      description="Todos los usuarios del ecosistema FlowDesk"
      features={[
        'Vista global de todos los usuarios por empresa',
        'Filtrar por rol, empresa, último acceso',
        'Bloquear / activar cuentas',
        'Reset de contraseña desde aquí',
        'Suplantar sesión para soporte',
      ]}
    />
  );
}
