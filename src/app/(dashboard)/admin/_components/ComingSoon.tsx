import { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  features?: string[];
}

export function ComingSoon({ icon: Icon, title, description, features }: Props) {
  return (
    <div className="min-h-full p-6 flex flex-col">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-white">{title}</h1>
        <p className="text-[11px] text-gray-600 mt-0.5">{description}</p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-5">
            <Icon className="w-7 h-7 text-gray-600" />
          </div>
          <p className="text-sm font-semibold text-white mb-2">En construcción</p>
          <p className="text-xs text-gray-600 mb-6 leading-relaxed">
            Esta sección está siendo desarrollada. Cuando esté lista, tendrás acceso a:
          </p>
          {features && features.length > 0 && (
            <ul className="text-left space-y-2 mb-6">
              {features.map(f => (
                <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-1 h-1 rounded-full bg-violet-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          )}
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full uppercase">
            Próximamente
          </span>
        </div>
      </div>
    </div>
  );
}
