# Central de Comunicaciones — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la Central de Comunicaciones de FlowDesk — sección "Herramientas" en el sidebar del tenant con páginas de Bandeja, Canales, Directorio y Ruteo — activable por superadmin por tenant.

**Architecture:** Capa de Canales (Opción C): canales → routing engine → agentes. V1 es el panel de administración con UI completa y datos mockeados listos para conectar a la API. El flag `communications_enabled` por tenant controla visibilidad en el sidebar.

**Tech Stack:** Next.js 15 App Router, React, TypeScript, Tailwind CSS, lucide-react, api client en `@/lib/api`

---

## Mapa de archivos

| Acción | Archivo |
|---|---|
| Modify | `src/app/(dashboard)/admin/layout.tsx` |
| Modify | `src/app/(dashboard)/admin/clients/page.tsx` |
| Modify | `src/app/(dashboard)/layout.tsx` |
| Create | `src/app/(dashboard)/herramientas/comunicaciones/layout.tsx` |
| Create | `src/app/(dashboard)/herramientas/comunicaciones/page.tsx` |
| Create | `src/app/(dashboard)/herramientas/comunicaciones/bandeja/page.tsx` |
| Create | `src/app/(dashboard)/herramientas/comunicaciones/canales/page.tsx` |
| Create | `src/app/(dashboard)/herramientas/comunicaciones/directorio/page.tsx` |
| Create | `src/app/(dashboard)/herramientas/comunicaciones/ruteo/page.tsx` |

---

## Task 1: Rename "Software" → "Herramientas" en admin sidebar

**Files:**
- Modify: `src/app/(dashboard)/admin/layout.tsx:32`

- [ ] **Step 1: Editar el item en NAV_SECTIONS**

En `src/app/(dashboard)/admin/layout.tsx`, línea 32, cambiar:
```tsx
{ label: 'Software',         href: '/admin/software',    icon: Package,       soon: true },
```
por:
```tsx
{ label: 'Herramientas',     href: '/admin/herramientas', icon: Package,      soon: true },
```

- [ ] **Step 2: Verificar en browser**

Abrir `/admin` → sidebar izquierdo → sección RECURSOS → debe decir "Herramientas" con badge "próximo".

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/admin/layout.tsx
git commit -m "feat(admin): rename Software → Herramientas in admin sidebar"
```

---

## Task 2: Toggle `communications_enabled` en panel de clientes

**Files:**
- Modify: `src/app/(dashboard)/admin/clients/page.tsx`

- [ ] **Step 1: Agregar campo a TenantRow**

En `src/app/(dashboard)/admin/clients/page.tsx`, en la interfaz `TenantRow` (línea 7), agregar después de `web_builder_enabled`:
```tsx
interface TenantRow {
  id: string; name: string; slug: string; plan: string; status: string;
  account_type: string; created_at: string; mrr: number;
  web_builder_enabled: boolean;
  communications_enabled: boolean;
  owner: { name: string; email: string } | null;
  secretary_config: { enabled: boolean } | null;
  billing_config: { enabled: boolean; rfc: string | null } | null;
  _count: { team_slots: number; brain_documents: number; agent_conversations: number };
}
```

- [ ] **Step 2: Agregar estado de toggling**

En `ClientsPage`, después de `const [togglingWb, setTogglingWb] = useState<string | null>(null);` (línea 60), agregar:
```tsx
const [togglingComms, setTogglingComms] = useState<string | null>(null);
```

- [ ] **Step 3: Agregar función toggleCommunications**

Después de la función `toggleWebBuilder` (después de línea 70), agregar:
```tsx
const toggleCommunications = async (e: React.MouseEvent, t: TenantRow) => {
  e.stopPropagation();
  setTogglingComms(t.id);
  try {
    await api.patch(`/platform/network/${t.id}/communications`, { enabled: !t.communications_enabled });
    setTenants(prev => prev.map(r => r.id === t.id ? { ...r, communications_enabled: !r.communications_enabled } : r));
  } catch {}
  setTogglingComms(null);
};
```

- [ ] **Step 4: Agregar botón junto al toggle de Web**

En el JSX, justo después del botón `🌐 Web` (después de la línea que cierra ese `</button>`), agregar:
```tsx
<button
  onClick={e => toggleCommunications(e, t)}
  disabled={togglingComms === t.id}
  title={t.communications_enabled ? 'Desactivar Central de Comunicaciones' : 'Activar Central de Comunicaciones'}
  className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
    t.communications_enabled
      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/30'
      : 'bg-white/5 text-gray-600 border-white/5 hover:bg-white/10 hover:text-gray-400'
  } ${togglingComms === t.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}>
  {togglingComms === t.id ? '…' : '📡 Comms'}
</button>
```

- [ ] **Step 5: Verificar en browser**

Abrir `/admin/clients` → cada empresa debe mostrar `📡 Comms` apagado junto a `🌐 Web`. Click debe cambiar el color a cyan (la llamada a la API fallará hasta que el backend lo implemente — es esperado).

- [ ] **Step 6: Commit**

```bash
git add src/app/(dashboard)/admin/clients/page.tsx
git commit -m "feat(admin): add communications_enabled toggle to clients list"
```

---

## Task 3: Entrada condicional "Comunicaciones" en sidebar del tenant

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Agregar import de Radio**

En las líneas de imports de lucide-react (línea 22), agregar `Radio`:
```tsx
import {
  LayoutDashboard, Users, Map, Plug, BookUser, LogOut, ShieldCheck,
  Building2, CreditCard, ShieldAlert, Settings, Bell, X, CheckCheck,
  ExternalLink, ChevronLeft, Target, Cctv, Zap, Sparkles, ChevronDown, Brain, Globe, GraduationCap, BotMessageSquare, ListChecks, Radio,
} from 'lucide-react';
```

- [ ] **Step 2: Agregar estado tenantFeatures**

En `DashboardLayout`, después de `const [brand, setBrand] = useState<BrandConfig>(DEFAULT_BRAND);` (línea 163), agregar:
```tsx
const [tenantFeatures, setTenantFeatures] = useState<{ communications_enabled: boolean }>({ communications_enabled: false });
```

- [ ] **Step 3: Fetch de features del tenant**

Después del `useEffect` que fetcha el brand (después de línea 192), agregar:
```tsx
useEffect(() => {
  if (!user) return;
  api.get<{ communications_enabled: boolean }>('/tenants/mine/features')
    .then(data => setTenantFeatures(data))
    .catch(() => { /* endpoint aún no existe — silencioso */ });
}, [user]);
```

- [ ] **Step 4: Construir NAV dinámico con Herramientas**

Reemplazar la línea donde se construye `NAV` (línea 161):
```tsx
const NAV = isNetPlatform ? [...BASE_NAV, ...NETWORK_NAV_EXTRA] : BASE_NAV;
```
por:
```tsx
const HERRAMIENTAS_NAV = tenantFeatures.communications_enabled
  ? [{ href: '/herramientas/comunicaciones', label: 'Comunicaciones', icon: Radio }]
  : [];

const NAV = [
  ...(isNetPlatform ? [...BASE_NAV, ...NETWORK_NAV_EXTRA] : BASE_NAV),
  ...HERRAMIENTAS_NAV,
];
```

- [ ] **Step 5: Verificar en browser**

El item "Comunicaciones" no debe aparecer en el sidebar porque el endpoint `/tenants/mine/features` aún no existe (retorna 404 → silencioso). Confirmado que no hay errores en consola.

- [ ] **Step 6: Commit**

```bash
git add src/app/(dashboard)/layout.tsx
git commit -m "feat(dashboard): add conditional Comunicaciones nav item from tenant features"
```

---

## Task 4: Estructura de rutas `/herramientas/comunicaciones/`

**Files:**
- Create: `src/app/(dashboard)/herramientas/comunicaciones/page.tsx`

- [ ] **Step 1: Crear page.tsx raíz (redirect a bandeja)**

Crear `src/app/(dashboard)/herramientas/comunicaciones/page.tsx`:
```tsx
import { redirect } from 'next/navigation';

export default function ComunicacionesRoot() {
  redirect('/herramientas/comunicaciones/bandeja');
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(dashboard)/herramientas/comunicaciones/page.tsx
git commit -m "feat(comunicaciones): add root redirect to bandeja"
```

---

## Task 5: Layout interno de Central de Comunicaciones

**Files:**
- Create: `src/app/(dashboard)/herramientas/comunicaciones/layout.tsx`

- [ ] **Step 1: Crear layout con tabs**

Crear `src/app/(dashboard)/herramientas/comunicaciones/layout.tsx`:
```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Inbox, Radio, BookUser, GitFork } from 'lucide-react';

const TABS = [
  { href: '/herramientas/comunicaciones/bandeja',   label: 'Bandeja',    icon: Inbox },
  { href: '/herramientas/comunicaciones/canales',   label: 'Canales',    icon: Radio },
  { href: '/herramientas/comunicaciones/directorio',label: 'Directorio', icon: BookUser },
  { href: '/herramientas/comunicaciones/ruteo',     label: 'Ruteo',      icon: GitFork },
];

export default function ComunicacionesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="h-full flex flex-col bg-[#050a14]">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-0 border-b border-white/5">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-4 h-4 text-cyan-400" />
            <h1 className="text-base font-bold text-white">Central de Comunicaciones</h1>
          </div>
          <p className="text-[11px] text-gray-600">Canales, directorio y ruteo de mensajes y llamadas</p>
        </div>
        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors ${
                  active
                    ? 'text-cyan-300 border-cyan-400 bg-cyan-500/10'
                    : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar en browser**

Navegar a `/herramientas/comunicaciones/bandeja` — debe mostrar el header con tabs. Cada tab debe resaltarse al hacer clic. La página muestra pantalla vacía (sin contenido aún).

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/herramientas/comunicaciones/layout.tsx
git commit -m "feat(comunicaciones): add tabbed layout with Bandeja/Canales/Directorio/Ruteo"
```

---

## Task 6: Página Canales

**Files:**
- Create: `src/app/(dashboard)/herramientas/comunicaciones/canales/page.tsx`

- [ ] **Step 1: Crear página de Canales**

Crear `src/app/(dashboard)/herramientas/comunicaciones/canales/page.tsx`:
```tsx
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
```

- [ ] **Step 2: Verificar en browser**

Navegar a `/herramientas/comunicaciones/canales` → deben aparecer dos tarjetas: WhatsApp (verde "Conectado") y Teléfono (gris "Sin configurar").

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/herramientas/comunicaciones/canales/page.tsx
git commit -m "feat(comunicaciones): add Canales page with WhatsApp and Phone channel cards"
```

---

## Task 7: Página Directorio

**Files:**
- Create: `src/app/(dashboard)/herramientas/comunicaciones/directorio/page.tsx`

- [ ] **Step 1: Crear página de Directorio**

Crear `src/app/(dashboard)/herramientas/comunicaciones/directorio/page.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { Search, Plus, UserCheck, UserX, Pencil } from 'lucide-react';

type ContactType = 'employee' | 'client' | 'lead';
type ContactStatus = 'active' | 'inactive';

interface Contact {
  id: string;
  name: string;
  type: ContactType;
  phone: string;
  status: ContactStatus;
  role?: string;
}

const TYPE_LABEL: Record<ContactType, string> = {
  employee: 'Empleado',
  client: 'Cliente',
  lead: 'Lead',
};

const TYPE_COLOR: Record<ContactType, string> = {
  employee: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  client: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  lead: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

const MOCK_CONTACTS: Contact[] = [
  { id: '1', name: 'Ana García',       type: 'employee', phone: '+52 55 1111 0001', status: 'active',   role: 'Ventas' },
  { id: '2', name: 'Carlos López',     type: 'employee', phone: '+52 55 1111 0002', status: 'active',   role: 'Operaciones' },
  { id: '3', name: 'Empresa Acme SA',  type: 'client',   phone: '+52 55 2222 0001', status: 'active' },
  { id: '4', name: 'Juan Pérez',       type: 'client',   phone: '+52 55 2222 0002', status: 'inactive' },
  { id: '5', name: 'María Rodríguez',  type: 'lead',     phone: '+52 55 3333 0001', status: 'active' },
];

const TYPE_FILTERS: { key: string; label: string }[] = [
  { key: 'all',      label: 'Todos' },
  { key: 'employee', label: 'Empleados' },
  { key: 'client',   label: 'Clientes' },
  { key: 'lead',     label: 'Leads' },
];

export default function DirectorioPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [contacts] = useState<Contact[]>(MOCK_CONTACTS);

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.phone.includes(q);
    const matchType = typeFilter === 'all' || c.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="px-6 py-5 space-y-4">
      <p className="text-xs text-gray-500">
        El directorio mapea números de teléfono a identidades. El motor de ruteo lo consulta en cada mensaje entrante para decidir a qué agente enviarlo.
      </p>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o teléfono…"
            className="w-full bg-[#0a0f1e] border border-white/5 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <div className="flex gap-1">
          {TYPE_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === key ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/30' : 'bg-[#0a0f1e] border border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Nuevo contacto
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#0a0f1e] border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-4 py-2.5 text-gray-600 font-medium">Nombre</th>
              <th className="text-left px-4 py-2.5 text-gray-600 font-medium">Tipo</th>
              <th className="text-left px-4 py-2.5 text-gray-600 font-medium">Teléfono</th>
              <th className="text-left px-4 py-2.5 text-gray-600 font-medium">Rol / Nota</th>
              <th className="text-left px-4 py-2.5 text-gray-600 font-medium">Estado</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${TYPE_COLOR[c.type]}`}>
                    {TYPE_LABEL[c.type]}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-gray-400">{c.phone}</td>
                <td className="px-4 py-3 text-gray-500">{c.role ?? '—'}</td>
                <td className="px-4 py-3">
                  {c.status === 'active'
                    ? <span className="flex items-center gap-1 text-emerald-400"><UserCheck className="w-3 h-3" /> Activo</span>
                    : <span className="flex items-center gap-1 text-gray-600"><UserX className="w-3 h-3" /> Inactivo</span>
                  }
                </td>
                <td className="px-4 py-3">
                  <button className="text-gray-600 hover:text-cyan-400 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-600 text-xs">Sin contactos que coincidan</div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar en browser**

Navegar a `/herramientas/comunicaciones/directorio` → tabla con 5 contactos mock. Filtros por tipo funcionan. Buscador filtra en tiempo real.

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/herramientas/comunicaciones/directorio/page.tsx
git commit -m "feat(comunicaciones): add Directorio page with contact table and filters"
```

---

## Task 8: Página Ruteo (3 slots)

**Files:**
- Create: `src/app/(dashboard)/herramientas/comunicaciones/ruteo/page.tsx`

- [ ] **Step 1: Crear página de Ruteo**

Crear `src/app/(dashboard)/herramientas/comunicaciones/ruteo/page.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { Users, UserCheck, HelpCircle, Plug, Pencil, Check, X } from 'lucide-react';

type SlotType = 'employee' | 'client' | 'unknown';

interface RoutingSlot {
  type: SlotType;
  label: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  agentLabel: string | null;
  agentConnected: boolean;
  fallbackMessage: string;
  active: boolean;
}

const INITIAL_SLOTS: RoutingSlot[] = [
  {
    type: 'employee',
    label: 'Empleados',
    description: 'Números registrados como empleados en el Directorio.',
    icon: UserCheck,
    iconColor: 'text-violet-400',
    agentLabel: 'Asistente Personal (HOS)',
    agentConnected: true,
    fallbackMessage: 'Hola {nombre}, ¿en qué te puedo ayudar?',
    active: true,
  },
  {
    type: 'client',
    label: 'Clientes',
    description: 'Números registrados como clientes activos en el Directorio.',
    icon: Users,
    iconColor: 'text-emerald-400',
    agentLabel: null,
    agentConnected: false,
    fallbackMessage: 'Recibimos tu mensaje. Un asesor te atenderá en breve.',
    active: true,
  },
  {
    type: 'unknown',
    label: 'Desconocidos / Leads',
    description: 'Cualquier número que no esté registrado en el Directorio.',
    icon: HelpCircle,
    iconColor: 'text-amber-400',
    agentLabel: null,
    agentConnected: false,
    fallbackMessage: 'Gracias por escribirnos. En breve te atendemos.',
    active: true,
  },
];

function SlotCard({ slot }: { slot: RoutingSlot }) {
  const [editingMsg, setEditingMsg] = useState(false);
  const [msg, setMsg] = useState(slot.fallbackMessage);
  const [draft, setDraft] = useState(slot.fallbackMessage);
  const Icon = slot.icon;

  return (
    <div className="bg-[#0a0f1e] border border-white/5 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
            <Icon className={`w-4.5 h-4.5 ${slot.iconColor}`} />
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

      {/* Agent */}
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

      {/* Fallback message */}
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
  const [slots] = useState<RoutingSlot[]>(INITIAL_SLOTS);

  return (
    <div className="px-6 py-5 space-y-4">
      <p className="text-xs text-gray-500">
        El motor de ruteo identifica quién escribió y envía el mensaje al agente correcto. Hay tres slots fijos — uno por tipo de contacto. Conecta un agente a cada slot cuando esté listo.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {slots.map(slot => <SlotCard key={slot.type} slot={slot} />)}
      </div>

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
```

- [ ] **Step 2: Verificar en browser**

Navegar a `/herramientas/comunicaciones/ruteo` → tres tarjetas con los slots. Empleados muestra "Asistente Personal (HOS)" conectado. Clientes y Desconocidos muestran "Sin agente conectado" con botón "Conectar agente". Editar mensaje de fallback debe funcionar con los botones ✓/✗.

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/herramientas/comunicaciones/ruteo/page.tsx
git commit -m "feat(comunicaciones): add Ruteo page with 3 routing slots and fallback messages"
```

---

## Task 9: Página Bandeja

**Files:**
- Create: `src/app/(dashboard)/herramientas/comunicaciones/bandeja/page.tsx`

- [ ] **Step 1: Crear página de Bandeja**

Crear `src/app/(dashboard)/herramientas/comunicaciones/bandeja/page.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { MessageSquare, Phone, UserCheck, Users, HelpCircle, Bot, User, ChevronRight, Search } from 'lucide-react';

type ConvChannel = 'whatsapp' | 'phone';
type ConvSlot = 'employee' | 'client' | 'unknown';
type ConvStatus = 'bot' | 'human' | 'closed';

interface Conversation {
  id: string;
  contactName: string;
  contactPhone: string;
  channel: ConvChannel;
  slot: ConvSlot;
  status: ConvStatus;
  lastMessage: string;
  timeAgo: string;
}

const MOCK_CONVS: Conversation[] = [
  { id: '1', contactName: 'Ana García',      contactPhone: '+52 55 1111 0001', channel: 'whatsapp', slot: 'employee', status: 'bot',    lastMessage: '¿Puedes pasarme el reporte de ventas de esta semana?', timeAgo: '2m' },
  { id: '2', contactName: 'Empresa Acme SA', contactPhone: '+52 55 2222 0001', channel: 'whatsapp', slot: 'client',   status: 'human',  lastMessage: 'Necesito una factura del mes pasado urgente', timeAgo: '8m' },
  { id: '3', contactName: 'Desconocido',     contactPhone: '+52 55 9999 0001', channel: 'whatsapp', slot: 'unknown',  status: 'bot',    lastMessage: 'Hola, vi su anuncio y me gustaría más información', timeAgo: '15m' },
  { id: '4', contactName: 'Carlos López',    contactPhone: '+52 55 1111 0002', channel: 'phone',    slot: 'employee', status: 'closed', lastMessage: 'Llamada de 4 minutos — resuelta', timeAgo: '1h' },
  { id: '5', contactName: 'Juan Pérez',      contactPhone: '+52 55 2222 0002', channel: 'whatsapp', slot: 'client',   status: 'closed', lastMessage: 'Gracias, ya resolví mi duda', timeAgo: '2h' },
];

const CHANNEL_ICON: Record<ConvChannel, React.ElementType> = { whatsapp: MessageSquare, phone: Phone };
const SLOT_ICON: Record<ConvSlot, React.ElementType> = { employee: UserCheck, client: Users, unknown: HelpCircle };
const SLOT_LABEL: Record<ConvSlot, string> = { employee: 'Empleado', client: 'Cliente', unknown: 'Lead' };
const SLOT_COLOR: Record<ConvSlot, string> = {
  employee: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  client:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  unknown:  'text-amber-400 bg-amber-500/10 border-amber-500/20',
};
const STATUS_CONFIG: Record<ConvStatus, { label: string; color: string; icon: React.ElementType }> = {
  bot:    { label: 'Con bot',    color: 'text-cyan-400',   icon: Bot },
  human:  { label: 'Con humano', color: 'text-orange-400', icon: User },
  closed: { label: 'Cerrada',    color: 'text-gray-600',   icon: MessageSquare },
};

const STATUS_FILTERS = [
  { key: 'all',    label: 'Todas' },
  { key: 'bot',    label: 'Con bot' },
  { key: 'human',  label: 'Con humano' },
  { key: 'closed', label: 'Cerradas' },
];

export default function BandejaPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = MOCK_CONVS.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.contactName.toLowerCase().includes(q) || c.contactPhone.includes(q) || c.lastMessage.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const active = MOCK_CONVS.filter(c => c.status !== 'closed').length;

  return (
    <div className="px-6 py-5 space-y-4">
      {/* Stats row */}
      <div className="flex gap-3">
        {[
          { label: 'Activas', value: active, color: 'text-cyan-400' },
          { label: 'Con bot', value: MOCK_CONVS.filter(c => c.status === 'bot').length, color: 'text-cyan-300' },
          { label: 'Con humano', value: MOCK_CONVS.filter(c => c.status === 'human').length, color: 'text-orange-400' },
          { label: 'Cerradas hoy', value: MOCK_CONVS.filter(c => c.status === 'closed').length, color: 'text-gray-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#0a0f1e] border border-white/5 rounded-lg px-3 py-2 min-w-[80px]">
            <p className={`text-lg font-bold ${color}`}>{value}</p>
            <p className="text-[10px] text-gray-600">{label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por contacto o mensaje…"
            className="w-full bg-[#0a0f1e] border border-white/5 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <div className="flex gap-1">
          {STATUS_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === key ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/30' : 'bg-[#0a0f1e] border border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-1.5">
        {filtered.map(conv => {
          const ChanIcon   = CHANNEL_ICON[conv.channel];
          const SlotIcon   = SLOT_ICON[conv.slot];
          const statusConf = STATUS_CONFIG[conv.status];
          const StatusIcon = statusConf.icon;

          return (
            <div
              key={conv.id}
              className="bg-[#0a0f1e] border border-white/5 hover:border-white/10 rounded-xl px-4 py-3 cursor-pointer transition-colors group flex items-center gap-4"
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <ChanIcon className="w-3.5 h-3.5 text-cyan-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-white">{conv.contactName}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${SLOT_COLOR[conv.slot]}`}>
                    <SlotIcon className="w-2.5 h-2.5" />{SLOT_LABEL[conv.slot]}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`flex items-center gap-1 text-[10px] ${statusConf.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusConf.label}
                </span>
                <span className="text-[10px] text-gray-700 font-mono">{conv.timeAgo}</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-700 group-hover:text-cyan-400 transition-colors" />
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <MessageSquare className="w-8 h-8 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Sin conversaciones</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar en browser**

Navegar a `/herramientas/comunicaciones/bandeja` → debe mostrar 4 estadísticas arriba, filtros, y 5 conversaciones mock con badges de canal, slot y estado. Los filtros funcionan.

- [ ] **Step 3: Commit final**

```bash
git add src/app/(dashboard)/herramientas/comunicaciones/bandeja/page.tsx
git commit -m "feat(comunicaciones): add Bandeja page with conversation list and filters"
```

---

## Checklist de verificación final

- [ ] Admin sidebar dice "Herramientas" (no "Software")
- [ ] En `/admin/clients` cada empresa muestra toggle `📡 Comms` junto a `🌐 Web`
- [ ] Sidebar del tenant NO muestra "Comunicaciones" (endpoint features aún no existe)
- [ ] Navegar directamente a `/herramientas/comunicaciones/bandeja` funciona
- [ ] Los 4 tabs del layout interno funcionan y el tab activo se resalta en cyan
- [ ] Canales: 2 tarjetas (WhatsApp conectado, Teléfono sin configurar)
- [ ] Directorio: tabla filtrable con 5 contactos mock
- [ ] Ruteo: 3 slots, empleado conectado a HOS, editar fallback messages funciona
- [ ] Bandeja: 5 conversaciones mock, filtros por estado funcionan
