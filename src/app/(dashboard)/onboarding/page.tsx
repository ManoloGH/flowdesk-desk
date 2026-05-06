'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CheckCircle, Circle, Loader2, Building2, Users, Clock, Map, Rocket, Plus, Trash2, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface OnboardingStatus {
  current_step: number;
  steps_completed: string[];
  total_steps: number;
  completed: boolean;
}

interface HumanRow { name: string; email: string; role: string; department_name: string; }

// ─── Config de pasos ─────────────────────────────────────────────────────────

const STEPS = [
  { key: 'company_created',   label: 'Empresa creada',    icon: Building2 },
  { key: 'departments_set',   label: 'Departamentos',     icon: Building2 },
  { key: 'team_configured',   label: 'Equipo',            icon: Users },
  { key: 'schedule_set',      label: 'Horario',           icon: Clock },
  { key: 'rooms_set',         label: 'Campus',            icon: Map },
  { key: 'launched',          label: 'Lanzar',            icon: Rocket },
];

const ROLES = ['employee', 'admin', 'manager'];
const DEPARTMENTS = ['Dirección', 'Ventas', 'Operaciones', 'RH & AD', 'Hub Técnico'];
const WORK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const WORK_DAYS_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// ─── Paso 2: Departamentos ────────────────────────────────────────────────────

function StepDepartments({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      await api.post('/onboarding/departments', { use_template: true });
      onDone();
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Configurar departamentos</h2>
        <p className="text-sm text-gray-400">
          FlowDesk usa una arquitectura universal probada. Estos son los departamentos que se crearán:
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { name: 'Dirección', color: '#7C3AED', icon: '🧠', desc: 'Visión estratégica y decisiones clave' },
          { name: 'Ventas', color: '#10B981', icon: '💰', desc: 'Pipeline, prospectos y cierre' },
          { name: 'Operaciones', color: '#F59E0B', icon: '⚙️', desc: 'Procesos, entrega y logística' },
          { name: 'RH & AD', color: '#3B82F6', icon: '👥', desc: 'Personas, contratos y administración' },
          { name: 'Hub Técnico', color: '#6366F1', icon: '🤖', desc: 'Agentes IA y automatizaciones' },
        ].map(d => (
          <div key={d.name} className="flex items-start gap-3 bg-gray-800 rounded-xl p-4 border border-gray-700">
            <span className="text-2xl">{d.icon}</span>
            <div>
              <p className="text-sm font-semibold text-white">{d.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{d.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-600">
        Podrás renombrar, colorear o añadir departamentos personalizados desde la sección Equipo.
      </p>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
        {loading ? 'Configurando...' : 'Crear departamentos'}
      </button>
    </div>
  );
}

// ─── Paso 3: Equipo ───────────────────────────────────────────────────────────

function StepTeam({ onDone }: { onDone: () => void }) {
  const [humans, setHumans] = useState<HumanRow[]>([{ name: '', email: '', role: 'employee', department_name: '' }]);
  const [addAgents, setAddAgents] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addRow = () => setHumans(prev => [...prev, { name: '', email: '', role: 'employee', department_name: '' }]);
  const removeRow = (i: number) => setHumans(prev => prev.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof HumanRow, value: string) =>
    setHumans(prev => prev.map((h, idx) => idx === i ? { ...h, [field]: value } : h));

  const handleSubmit = async () => {
    const validHumans = humans.filter(h => h.name.trim() && h.email.trim());
    setLoading(true); setError('');
    try {
      await api.post('/onboarding/team', {
        humans: validHumans.map(h => ({
          name: h.name.trim(),
          email: h.email.trim(),
          role: h.role,
          department_name: h.department_name || undefined,
        })),
        add_suggested_agents: addAgents,
      });
      onDone();
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Añadir equipo</h2>
        <p className="text-sm text-gray-400">
          Agrega a los miembros de tu equipo. Recibirán sus credenciales por separado.
        </p>
      </div>

      <div className="space-y-3">
        {humans.map((h, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-start bg-gray-800 rounded-xl p-3 border border-gray-700">
            <input
              placeholder="Nombre completo"
              value={h.name}
              onChange={e => updateRow(i, 'name', e.target.value)}
              className="col-span-3 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <input
              placeholder="email@empresa.com"
              type="email"
              value={h.email}
              onChange={e => updateRow(i, 'email', e.target.value)}
              className="col-span-3 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <select
              value={h.role}
              onChange={e => updateRow(i, 'role', e.target.value)}
              className="col-span-2 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select
              value={h.department_name}
              onChange={e => updateRow(i, 'department_name', e.target.value)}
              className="col-span-3 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Sin departamento</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <button
              onClick={() => removeRow(i)}
              disabled={humans.length === 1}
              className="col-span-1 p-2 text-gray-500 hover:text-red-400 disabled:opacity-30 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        <button
          onClick={addRow}
          className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <Plus size={14} /> Añadir persona
        </button>
      </div>

      <label className="flex items-start gap-3 bg-gray-800 border border-gray-700 rounded-xl p-4 cursor-pointer">
        <input
          type="checkbox"
          checked={addAgents}
          onChange={e => setAddAgents(e.target.checked)}
          className="mt-0.5 accent-indigo-500"
        />
        <div>
          <p className="text-sm font-medium text-white">Añadir agentes IA del template</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Se crearán agentes preconfigurados para tu industria (ventas, soporte, ops). Puedes modificarlos después.
          </p>
        </div>
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
        {loading ? 'Configurando...' : 'Guardar equipo'}
      </button>
    </div>
  );
}

// ─── Paso 4: Horario ──────────────────────────────────────────────────────────

function StepSchedule({ onDone }: { onDone: () => void }) {
  const [useTemplate, setUseTemplate] = useState(true);
  const [checkIn, setCheckIn] = useState('09:00');
  const [checkOut, setCheckOut] = useState('18:00');
  const [tolerance, setTolerance] = useState(15);
  const [workDays, setWorkDays] = useState([true, true, true, true, true, false, false]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleDay = (i: number) => setWorkDays(prev => prev.map((v, idx) => idx === i ? !v : v));

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const body = useTemplate
        ? { use_template: true }
        : {
            use_template: false,
            custom_schedule: {
              name: 'Horario principal',
              check_in_time: checkIn,
              check_out_time: checkOut,
              tolerance_minutes: tolerance,
              work_days: WORK_DAYS_KEYS.filter((_, i) => workDays[i]),
            },
          };
      await api.post('/onboarding/schedule', body);
      onDone();
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Horario laboral</h2>
        <p className="text-sm text-gray-400">Define cuándo trabaja tu equipo.</p>
      </div>

      <div className="flex gap-3">
        {[true, false].map(isTemplate => (
          <button
            key={String(isTemplate)}
            onClick={() => setUseTemplate(isTemplate)}
            className={clsx(
              'flex-1 py-3 rounded-xl border text-sm font-medium transition-colors',
              useTemplate === isTemplate
                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600',
            )}
          >
            {isTemplate ? '🕘 Horario estándar (Lun–Vie 9–18h)' : '✏️ Horario personalizado'}
          </button>
        ))}
      </div>

      {!useTemplate && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Entrada</label>
              <input type="time" value={checkIn} onChange={e => setCheckIn(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Salida</label>
              <input type="time" value={checkOut} onChange={e => setCheckOut(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tolerancia (min)</label>
              <input type="number" min={0} max={60} value={tolerance} onChange={e => setTolerance(Number(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Días laborales</label>
            <div className="flex gap-2 flex-wrap">
              {WORK_DAYS.map((day, i) => (
                <button
                  key={day}
                  onClick={() => toggleDay(i)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    workDays[i]
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500',
                  )}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
        {loading ? 'Guardando...' : 'Guardar horario'}
      </button>
    </div>
  );
}

// ─── Paso 5: Campus ───────────────────────────────────────────────────────────

function StepRooms({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      await api.post('/onboarding/rooms', { use_template: true });
      onDone();
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Campus virtual</h2>
        <p className="text-sm text-gray-400">
          El campus es el mapa interactivo donde tu equipo se mueve y colabora en tiempo real.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { name: 'Sala de Juntas', color: '#7F1D1D', icon: '🧠', desc: 'Reuniones estratégicas y war room' },
          { name: 'Dirección', color: '#4C1D95', icon: '👑', desc: 'Despacho del CEO y dirección' },
          { name: 'RH & AD', color: '#1E3A5F', icon: '👥', desc: 'Gestión de personas y contratos' },
          { name: 'Ventas', color: '#064E3B', icon: '💰', desc: 'Pipeline, demos y cierre' },
          { name: 'Operaciones', color: '#451A03', icon: '⚙️', desc: 'Procesos y entrega' },
          { name: 'Hub Técnico', color: '#1E1B4B', icon: '🤖', desc: 'Agentes IA y automatizaciones' },
        ].map(r => (
          <div key={r.name} className="flex items-center gap-3 rounded-xl p-3 border border-gray-700" style={{ background: r.color + '33' }}>
            <span className="text-xl">{r.icon}</span>
            <div>
              <p className="text-sm font-medium text-white">{r.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-600">
        Podrás personalizar colores, posiciones y añadir salas adicionales desde la sección Campus.
      </p>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
        {loading ? 'Configurando...' : 'Crear campus'}
      </button>
    </div>
  );
}

// ─── Paso 6: Lanzar ───────────────────────────────────────────────────────────

function StepLaunch({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleLaunch = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.post('/onboarding/launch', {});
      setResult(res);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  if (result) {
    return (
      <div className="text-center space-y-6 py-4">
        <div className="text-6xl">🚀</div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">¡FlowDesk activado!</h2>
          <p className="text-gray-400 text-sm">Tu empresa está lista. Los empleados ya pueden hacer login.</p>
        </div>
        {result.stats && (
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Usuarios', value: result.stats.humans },
              { label: 'Agentes IA', value: result.stats.agents },
              { label: 'Departamentos', value: result.stats.departments },
              { label: 'Salas', value: result.stats.rooms },
            ].map(s => (
              <div key={s.label} className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={onDone}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Ir al dashboard →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Todo listo para lanzar</h2>
        <p className="text-sm text-gray-400">
          Has completado todos los pasos de configuración. Al lanzar, tu empresa quedará activa y tu equipo podrá acceder.
        </p>
      </div>

      <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-5 space-y-3">
        {[
          '✅ Empresa y owner configurados',
          '✅ Departamentos creados',
          '✅ Equipo añadido',
          '✅ Horario laboral definido',
          '✅ Campus virtual listo',
        ].map(item => (
          <p key={item} className="text-sm text-indigo-200">{item}</p>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        onClick={handleLaunch}
        disabled={loading}
        className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold px-8 py-4 rounded-xl transition-all text-base"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Rocket size={18} />}
        {loading ? 'Activando...' : '🚀 Lanzar FlowDesk'}
      </button>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = async () => {
    try {
      const s = await api.get<OnboardingStatus>('/onboarding/status');
      if (s.completed) { router.replace('/dashboard'); return; }
      setStatus(s);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadStatus(); }, []);

  const advance = async () => {
    setLoading(true);
    await loadStatus();
  };

  const handleLaunchDone = () => router.replace('/dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 size={32} className="text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!status) return null;

  const currentStep = status.current_step; // 0-6

  const renderStep = () => {
    if (currentStep === 0) return (
      <div className="text-center space-y-4 py-8">
        <Building2 size={48} className="text-indigo-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Empresa creada</h2>
        <p className="text-gray-400 text-sm">Tu cuenta fue configurada. Sigue los pasos para completar la configuración.</p>
      </div>
    );
    if (currentStep === 1) return <StepDepartments onDone={advance} />;
    if (currentStep === 2) return <StepTeam onDone={advance} />;
    if (currentStep === 3) return <StepSchedule onDone={advance} />;
    if (currentStep === 4) return <StepRooms onDone={advance} />;
    if (currentStep === 5) return <StepLaunch onDone={handleLaunchDone} />;
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white">Configuración inicial</h1>
          <p className="text-gray-400 mt-1">Completa los pasos para activar tu FlowDesk</p>
        </div>

        <div className="flex gap-8">
          {/* Steps sidebar */}
          <div className="w-52 flex-shrink-0">
            <div className="space-y-1">
              {STEPS.map((step, idx) => {
                const stepNum = idx;
                const isCompleted = stepNum < currentStep;
                const isCurrent = stepNum === currentStep;
                const Icon = step.icon;

                return (
                  <div
                    key={step.key}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-3 rounded-xl transition-colors',
                      isCurrent && 'bg-indigo-600/15 border border-indigo-500/30',
                      isCompleted && 'opacity-70',
                    )}
                  >
                    <div className={clsx(
                      'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                      isCompleted ? 'bg-emerald-600' : isCurrent ? 'bg-indigo-600' : 'bg-gray-800 border border-gray-700',
                    )}>
                      {isCompleted
                        ? <CheckCircle size={14} className="text-white" />
                        : isCurrent
                        ? <Icon size={13} className="text-white" />
                        : <Circle size={13} className="text-gray-600" />}
                    </div>
                    <span className={clsx(
                      'text-sm font-medium',
                      isCompleted ? 'text-emerald-400' : isCurrent ? 'text-white' : 'text-gray-600',
                    )}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="mt-6 px-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Progreso</span>
                <span>{Math.round((currentStep / 6) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div
                  className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${(currentStep / 6) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Step content */}
          <div className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl p-8">
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
}
