# Central de Comunicaciones — Spec de diseño
**Fecha:** 2026-06-22  
**Estado:** Aprobado — listo para implementar

---

## Contexto

FlowDesk necesita un sistema de comunicaciones unificado que permita a cada negocio manejar WhatsApp y llamadas desde un solo lugar, con agentes IA conectados por tipo de contacto.

Inspirado en el SOC Helpdesk (soc-helpdesk-staging.onrender.com) — arquitectura de 3 capas: canales → routing → agentes.

---

## Arquitectura: Opción C — Capa de Canales

```
CANALES          →    ROUTING ENGINE    →    AGENTES (slots)
WhatsApp              Directorio             [Empleado: HOS]
Teléfono (Asterisk)   Identidad              [Cliente: Servicio al Cliente]
(futuro: IG, email)   Reglas                 [Desconocido: Prospección]
```

Cada capa es independiente. Agregar un canal nuevo no toca los agentes. Los agentes no saben por qué canal llegó el mensaje.

---

## Componentes v1

### 1. Flag por tenant: `communications_enabled`

- Nuevo campo booleano en el modelo de tenant (igual que `web_builder_enabled`)
- Solo superadmin puede activarlo desde `/admin/clients`
- Cuando está inactivo, la sección no aparece en el sidebar del tenant

### 2. Toggle en super admin

- En `/admin/clients` junto al toggle de `🌐 Web`
- Label: `📡 Comms`
- PATCH a `/platform/network/{id}/communications` con `{ enabled: bool }`
- Mismo patrón visual que `web_builder_enabled`

### 3. Rename: "Software" → "Herramientas"

- En `src/app/(dashboard)/admin/layout.tsx` línea 32
- Solo cambio de label y href: `Software` → `Herramientas`, `/admin/software` → `/admin/herramientas`

### 4. Sección "Herramientas" en sidebar del tenant

- Nueva entrada en BASE_NAV en `src/app/(dashboard)/layout.tsx`
- Solo visible si `tenant.communications_enabled === true`
- Requiere leer el flag desde el contexto de auth o una llamada al perfil del tenant
- Icono: `Radio` de lucide-react
- href: `/herramientas/comunicaciones`

### 5. Rutas y páginas de Central de Comunicaciones

```
src/app/(dashboard)/herramientas/
└── comunicaciones/
    ├── layout.tsx          ← sidebar interno + tabs
    ├── page.tsx            ← redirect a /bandeja
    ├── bandeja/
    │   └── page.tsx        ← inbox de conversaciones activas
    ├── canales/
    │   └── page.tsx        ← WhatsApp + Teléfono
    ├── directorio/
    │   └── page.tsx        ← empleados / clientes / leads
    └── ruteo/
        └── page.tsx        ← 3 slots configurables
```

---

## Datos y API (frontend consume, backend ya existe o se agrega)

### TenantRow (admin/clients)
```typescript
interface TenantRow {
  // ... existentes
  web_builder_enabled: boolean;
  communications_enabled: boolean;  // NUEVO
}
```

### Contacto del Directorio
```typescript
interface CommunicationsContact {
  id: string;
  name: string;
  type: 'employee' | 'client' | 'lead';
  phone_numbers: string[];
  status: 'active' | 'inactive';
  // empleados:
  employee_role?: string;
  employee_permissions?: string[];
  // clientes:
  crm_id?: string;
}
```

### Slot de Ruteo
```typescript
interface RoutingSlot {
  contact_type: 'employee' | 'client' | 'unknown';
  agent_type: 'hos' | 'service' | 'prospecting' | null;
  agent_id: string | null;
  fallback_message: string;
  is_active: boolean;
}
```

---

## UI: Bandeja (pantalla de uso diario)

Tabla de conversaciones con columnas:
- Contacto (nombre + número)
- Canal (WhatsApp / Teléfono)
- Slot (empleado / cliente / lead)
- Último mensaje (preview)
- Estado (con bot / con humano / cerrada)
- Tiempo

Filtros: canal, slot, estado. Clic en fila → transcripción completa.

---

## UI: Canales

Dos tarjetas:
1. **WhatsApp** — muestra instancia Evolution conectada, estado, número
2. **Teléfono** — migra configuración del conmutador desde Settings

Cada tarjeta: estado visual (activo/inactivo/sin configurar) + botón configurar.

---

## UI: Directorio

Tabla: nombre, tipo (badge), números, estado. Buscador + filtro por tipo.
Botones: nuevo contacto, editar, activar/desactivar.
Sin eliminación — solo desactivación (soft delete).

---

## UI: Ruteo

Tres filas fijas (no se agregan ni eliminan — son los 3 slots):

| Tipo de contacto | Agente conectado | Mensaje fallback | Estado |
|---|---|---|---|
| Empleado | HOS (auto) | configurable | on/off |
| Cliente | Sin conectar | configurable | on/off |
| Desconocido | Sin conectar | configurable | on/off |

Botón "Conectar agente" por slot cuando está vacío.

---

## Orden de implementación

1. Rename Software → Herramientas en admin/layout.tsx
2. Agregar `communications_enabled` a TenantRow + toggle en admin/clients
3. Agregar entrada condicional en BASE_NAV del dashboard
4. Crear estructura de rutas `/herramientas/comunicaciones/`
5. Layout interno con tabs (Bandeja / Canales / Directorio / Ruteo)
6. Página Canales (estática con estado de conexión)
7. Página Directorio (tabla + CRUD básico)
8. Página Ruteo (3 slots con fallback message)
9. Página Bandeja (tabla de conversaciones)

---

## Piloto

Primer tenant a activar: **MentorIA**  
Acceso: superadmin activa el toggle desde `/admin/clients`
