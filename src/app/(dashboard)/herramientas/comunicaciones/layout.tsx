'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GitFork, Inbox } from 'lucide-react';

const TABS = [
  { href: '/herramientas/comunicaciones',        label: 'Conmutador', icon: GitFork, exact: true },
  { href: '/herramientas/comunicaciones/bandeja', label: 'Bandeja',    icon: Inbox,   exact: false },
];

export default function ComunicacionesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="h-full flex flex-col bg-[#050a14]">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-0 border-b border-white/5">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <GitFork className="w-4 h-4 text-cyan-400" />
            <h1 className="text-base font-bold text-white">Central de Comunicaciones</h1>
          </div>
          <p className="text-[11px] text-gray-600">Conmutador — define a qué agente o humano se enruta cada canal</p>
        </div>
        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
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
