'use client';
import { useRouter } from 'next/navigation';
import {
  Workflow, BookUser, GraduationCap, GitBranch, Map,
  Globe, Plug, Settings, ArrowRight,
} from 'lucide-react';

const RECURSOS = [
  {
    href: '/mentoria',
    icon: '📊',
    label: 'CRM',
    descripcion: 'Pipeline de ventas — de prospectos a clientes activos',
    color: '#6c4de6',
    tags: ['Agente IA', 'Propuesta', 'Contrato', 'Implementación'],
  },
  {
    href: '/contacts',
    icon: '📋',
    label: 'Contactos',
    descripcion: 'Directorio completo de contactos y empresas',
    color: '#3b82f6',
    tags: ['Empresas', 'Personas', 'Historial'],
  },
  {
    href: '/erp',
    icon: '🎓',
    label: 'ERP · Consultoría',
    descripcion: 'Workspace de clientes en implementación — proyecto, diagnósticos, hallazgos, plan, sesiones y facturación',
    color: '#22c55e',
    tags: ['Proyecto', 'Diagnósticos', 'Hallazgos', 'Plan de Acción', 'Sesiones', 'Facturación'],
  },
  {
    href: '/erp-areas',
    icon: '🏭',
    label: 'ERP por Área',
    descripcion: 'Gestión operativa por área de la empresa',
    color: '#f97316',
    tags: ['Ventas', 'Operaciones', 'Administración', 'RRHH'],
  },
  {
    href: '/campus',
    icon: '🎒',
    label: 'Campus / Espacios',
    descripcion: 'Formación, espacios de trabajo y aprendizaje del equipo',
    color: '#8b5cf6',
    tags: ['Cursos', 'Espacios', 'Materiales'],
  },
  {
    href: '/mi-web',
    icon: '🌐',
    label: 'Mi Web',
    descripcion: 'Sitio web y presencia digital de la empresa',
    color: '#06b6d4',
    tags: ['Sitio web', 'Landing pages', 'SEO'],
  },
  {
    href: '/integrations',
    icon: '🔌',
    label: 'Integraciones',
    descripcion: 'Conecta tus herramientas — WhatsApp, CRM externo, APIs',
    color: '#64748b',
    tags: ['WhatsApp', 'n8n', 'Webhooks', 'APIs'],
  },
  {
    href: '/settings',
    icon: '⚙️',
    label: 'Configuración',
    descripcion: 'Ajustes de la instancia, usuarios, permisos y personalización',
    color: '#475569',
    tags: ['Usuarios', 'Permisos', 'Marca', 'Módulos'],
  },
];

export default function RecursosPage() {
  const router = useRouter();

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '28px' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 6 }}>Recursos</h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Todas las herramientas y módulos disponibles en tu instancia de FlowDesk</p>
      </div>

      {/* Resource cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {RECURSOS.map(r => (
          <button
            key={r.href}
            onClick={() => router.push(r.href)}
            style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 0, cursor: 'pointer', textAlign: 'left', overflow: 'hidden', transition: 'border-color 0.15s, transform 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = r.color + '60'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
          >
            {/* Color accent bar */}
            <div style={{ height: 3, background: r.color }} />

            <div style={{ padding: '18px 20px' }}>
              {/* Icon + label */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${r.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{r.icon}</div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{r.label}</span>
                </div>
                <ArrowRight size={14} style={{ color: r.color, opacity: 0.7 }} />
              </div>

              {/* Description */}
              <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55, marginBottom: 14 }}>{r.descripcion}</p>

              {/* Tags */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {r.tags.map(tag => (
                  <span key={tag} style={{ fontSize: 10, color: r.color, background: `${r.color}12`, border: `1px solid ${r.color}30`, padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>{tag}</span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
