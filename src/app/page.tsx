'use client';
import Link from 'next/link';
import { ArrowRight, MessageCircle, Users, Bot, Target, Building2, Zap } from 'lucide-react';

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '521XXXXXXXXXX';
const WA_URL = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hola, me interesa saber más sobre FlowDesk')}`;

const FEATURES = [
  {
    icon: Bot,
    title: 'Humanos + IA en un solo equipo',
    desc: 'Tus agentes de IA trabajan junto a tu equipo humano con las mismas herramientas, tareas y objetivos.',
  },
  {
    icon: Building2,
    title: 'Campus virtual en tiempo real',
    desc: 'Presencia, salas de trabajo, cámaras y estado de cada miembro — todo visible desde tu Desk.',
  },
  {
    icon: Target,
    title: 'Metas AUP integradas',
    desc: 'Administración en Una Página: KPIs, objetivos y reportes automáticos para todo el equipo.',
  },
  {
    icon: Zap,
    title: 'ERP conectado desde el día uno',
    desc: 'Tu base de datos en Airtable se crea automáticamente al configurar tu empresa.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Navbar */}
      <nav className="border-b border-gray-800/60 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#4DBBF0] flex items-center justify-center">
              <span className="text-sm font-bold text-gray-950">F</span>
            </div>
            <span className="font-semibold text-white tracking-tight">FlowDesk</span>
          </div>
          <Link
            href="/login"
            className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            Acceder a mi Desk →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 max-w-4xl mx-auto w-full">

        <div className="inline-flex items-center gap-2 text-xs font-medium text-[#4DBBF0] bg-[#4DBBF0]/10 border border-[#4DBBF0]/20 rounded-full px-4 py-1.5 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4DBBF0] animate-pulse" />
          Sistema operativo para equipos humano-IA
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight mb-6">
          Tu equipo humano y tus{' '}
          <span className="text-[#4DBBF0]">agentes de IA</span>
          <br />en un solo espacio
        </h1>

        <p className="text-lg text-gray-400 max-w-2xl mb-12 leading-relaxed">
          FlowDesk integra a cada persona y cada agente en un campus virtual inteligente.
          Tareas, metas, presencia y comunicación — todo en tu Desk.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/onboarding"
            className="flex items-center gap-2 bg-[#4DBBF0] hover:bg-[#3aabdf] text-gray-950 font-semibold px-8 py-3.5 rounded-xl transition-colors text-sm"
          >
            Configurar mi FlowDesk
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-medium px-8 py-3.5 rounded-xl transition-colors text-sm border border-gray-700"
          >
            <MessageCircle className="w-4 h-4 text-green-400" />
            Pedir información por WhatsApp
          </a>
        </div>

        <p className="text-xs text-gray-600 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-gray-400 hover:text-white transition-colors underline underline-offset-2">
            Inicia sesión aquí
          </Link>
        </p>
      </section>

      {/* Features */}
      <section className="border-t border-gray-800/60 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-medium text-gray-500 uppercase tracking-widest mb-12">
            Todo lo que necesita tu operación
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-[#4DBBF0]" />
                </div>
                <h3 className="font-semibold text-white mb-2 text-sm leading-snug">{f.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/60 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <span>© {new Date().getFullYear()} FlowDesk — MentorIA Systems</span>
          <div className="flex items-center gap-6">
            <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
            <Link href="/login" className="hover:text-gray-400 transition-colors flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Acceder
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
