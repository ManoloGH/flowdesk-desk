// src/app/micro/[token]/page.tsx
// Server Component — no 'use client'

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://api.flowdesk.mx/api/v1';

// ── Types ──────────────────────────────────────────────────────────────────

interface DiagnosticData {
  situacion_actual: string;
  hallazgos: string[];
  impacto_estimado: string;
  recomendacion: string;
}

interface MicroDiagnostico {
  id: string;
  token: string;
  lead_name: string | null;
  lead_company: string | null;
  responses: {
    actividad_y_antiguedad: string;
    empleados: string;
    herramientas_digitales: string;
    tiene_area_programacion: string;
    cuello_de_botella: string;
  };
  diagnostic_data: DiagnosticData | null;
  cal_booking_url: string | null;
  created_at: string;
}

// ── Data fetching ──────────────────────────────────────────────────────────

async function getMicroDiagnostico(
  token: string,
): Promise<MicroDiagnostico | null> {
  try {
    const res = await fetch(`${API_BASE}/micro-diagnostico/${token}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<MicroDiagnostico>;
  } catch {
    return null;
  }
}

// ── Icons (inline SVG, server-safe) ───────────────────────────────────────

function IconClipboard() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconLightbulb() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="9" y1="18" x2="15" y2="18" />
      <line x1="10" y1="22" x2="14" y2="22" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const CSS = `
  /* ── Reset & base ── */
  .micro-report *,
  .micro-report *::before,
  .micro-report *::after {
    box-sizing: border-box;
  }

  .micro-report {
    background: #ffffff;
    min-height: 100vh;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: #0f172a;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  .micro-report-inner {
    max-width: 600px;
    margin: 0 auto;
    padding-bottom: 56px;
  }

  /* ── Top stripe (document letterhead device) ── */
  .micro-stripe {
    height: 4px;
    background: linear-gradient(90deg, #6366f1 0%, #818cf8 60%, #c7d2fe 100%);
  }

  /* ── Header ── */
  .micro-header {
    padding: 28px 24px 24px;
    border-bottom: 1px solid #e2e8f0;
  }

  .micro-brand-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 24px;
  }

  .micro-brand-mark {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: #6366f1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .micro-brand-letter {
    font-family: 'Inter Tight', 'Inter', sans-serif;
    font-size: 17px;
    font-weight: 800;
    color: #ffffff;
    line-height: 1;
  }

  .micro-brand-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .micro-brand-name {
    font-family: 'Inter Tight', 'Inter', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }

  .micro-brand-tagline {
    font-size: 11px;
    font-weight: 500;
    color: #94a3b8;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    line-height: 1.2;
  }

  .micro-report-eyebrow {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #6366f1;
    margin: 0 0 6px;
  }

  .micro-report-heading {
    font-family: 'Inter Tight', 'Inter', sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.025em;
    line-height: 1.25;
    margin: 0 0 20px;
    text-wrap: balance;
  }

  .micro-meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .micro-meta-cell {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 12px;
  }

  .micro-meta-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #94a3b8;
    margin: 0 0 2px;
  }

  .micro-meta-value {
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
    line-height: 1.35;
    margin: 0;
  }

  /* ── Section cards ── */
  .micro-sections {
    padding: 20px 24px 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .micro-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 3px solid #6366f1;
    border-radius: 0 8px 8px 0;
    padding: 20px;
  }

  .micro-card-head {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 14px;
  }

  .micro-icon-wrap {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: #eef2ff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #6366f1;
  }

  .micro-card-head-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-top: 3px;
  }

  .micro-card-eyebrow {
    font-family: 'Fraunces', Georgia, serif;
    font-style: italic;
    font-size: 11px;
    font-weight: 400;
    color: #6366f1;
    letter-spacing: 0.02em;
    line-height: 1.2;
  }

  .micro-card-title {
    font-family: 'Inter Tight', 'Inter', sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  .micro-body {
    font-size: 14px;
    line-height: 1.72;
    color: #334155;
    margin: 0;
  }

  /* ── Hallazgos list ── */
  .micro-hallazgos {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .micro-hallazgo {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 14px;
    line-height: 1.65;
    color: #334155;
  }

  .micro-check {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #d1fae5;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 2px;
  }

  /* ── CTA block ── */
  .micro-cta {
    margin: 20px 24px 0;
    background: #4f46e5;
    border-radius: 12px;
    padding: 28px 24px;
    text-align: center;
  }

  .micro-cta-eyebrow {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.6);
    margin: 0 0 10px;
  }

  .micro-cta-heading {
    font-family: 'Inter Tight', 'Inter', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.02em;
    line-height: 1.3;
    margin: 0 0 10px;
    text-wrap: balance;
  }

  .micro-cta-desc {
    font-size: 13px;
    line-height: 1.65;
    color: rgba(255, 255, 255, 0.78);
    margin: 0 0 22px;
    max-width: 380px;
    margin-left: auto;
    margin-right: auto;
  }

  .micro-cta-button {
    display: block;
    background: #ffffff;
    color: #4f46e5;
    font-family: 'Inter Tight', 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: -0.01em;
    padding: 14px 24px;
    border-radius: 8px;
    text-decoration: none;
    transition: opacity 0.15s ease;
  }

  .micro-cta-button:hover {
    opacity: 0.92;
  }

  /* ── Footer ── */
  .micro-footer {
    margin: 32px 24px 0;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
    text-align: center;
  }

  .micro-footer-brand {
    font-family: 'Inter Tight', 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
    margin: 0 0 3px;
  }

  .micro-footer-tagline {
    font-size: 12px;
    color: #94a3b8;
    margin: 0 0 14px;
  }

  .micro-footer-note {
    font-size: 11px;
    color: #cbd5e1;
    line-height: 1.65;
    max-width: 360px;
    margin: 0 auto;
  }

  /* ── Not-found state ── */
  .micro-notfound {
    min-height: 100vh;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
    font-family: 'Inter', system-ui, sans-serif;
    color: #0f172a;
    text-align: center;
  }

  .micro-notfound-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    background: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    color: #94a3b8;
  }

  .micro-notfound-title {
    font-family: 'Inter Tight', 'Inter', sans-serif;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0 0 8px;
  }

  .micro-notfound-body {
    font-size: 14px;
    color: #64748b;
    line-height: 1.65;
    max-width: 300px;
    margin: 0 auto;
  }
`;

// ── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<import('next').Metadata> {
  const { token } = await params;
  const data = await getMicroDiagnostico(token);
  const title = data?.lead_company
    ? `Diagnóstico de Automatización — ${data.lead_company}`
    : 'Tu Diagnóstico de Automatización — MentorIA Systems';
  return {
    title,
    description: 'Análisis personalizado de oportunidades de automatización generado por MentorIA Systems.',
    robots: { index: false, follow: false },
  };
}

// ── Page component ──────────────────────────────────────────────────────────

export default async function MicroDiagnosticoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getMicroDiagnostico(token);

  if (!data || !data.diagnostic_data) {
    return (
      <>
        <style>{CSS}</style>
        <div className="micro-notfound">
          <div className="micro-notfound-icon">
            <IconAlert />
          </div>
          <h1 className="micro-notfound-title">Diagnóstico no encontrado</h1>
          <p className="micro-notfound-body">
            El enlace puede haber expirado o ser incorrecto. Contacta a tu
            asesor de MentorIA para obtener uno nuevo.
          </p>
        </div>
      </>
    );
  }

  const d = data.diagnostic_data;

  const formattedDate = new Date(data.created_at).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const recipientName = data.lead_name ?? 'tu empresa';

  const reportTitle = data.lead_company
    ? `Análisis para ${data.lead_company}`
    : 'Tu Diagnóstico de Automatización';

  return (
    <>
      <style>{CSS}</style>
      <div className="micro-report">
        <div className="micro-report-inner">

          {/* Letterhead stripe */}
          <div className="micro-stripe" />

          {/* Header */}
          <header className="micro-header">
            <div className="micro-brand-row">
              <div className="micro-brand-mark">
                <span className="micro-brand-letter">M</span>
              </div>
              <div className="micro-brand-text">
                <span className="micro-brand-name">MentorIA Systems</span>
                <span className="micro-brand-tagline">IA First para empresas</span>
              </div>
            </div>

            <p className="micro-report-eyebrow">Micro-Diagnóstico de Automatización</p>
            <h1 className="micro-report-heading">{reportTitle}</h1>

            <div className="micro-meta-grid">
              <div className="micro-meta-cell">
                <p className="micro-meta-label">Preparado para</p>
                <p className="micro-meta-value">{recipientName}</p>
              </div>
              <div className="micro-meta-cell">
                <p className="micro-meta-label">Fecha</p>
                <p className="micro-meta-value">{formattedDate}</p>
              </div>
            </div>
          </header>

          {/* Content sections */}
          <div className="micro-sections">

            {/* 1 — Situación Actual */}
            <div className="micro-card">
              <div className="micro-card-head">
                <div className="micro-icon-wrap">
                  <IconClipboard />
                </div>
                <div className="micro-card-head-text">
                  <span className="micro-card-eyebrow">diagnóstico</span>
                  <span className="micro-card-title">Situación Actual</span>
                </div>
              </div>
              <p className="micro-body">{d.situacion_actual}</p>
            </div>

            {/* 2 — Hallazgos Clave */}
            {Array.isArray(d.hallazgos) && d.hallazgos.length > 0 && (
            <div className="micro-card">
              <div className="micro-card-head">
                <div className="micro-icon-wrap">
                  <IconSearch />
                </div>
                <div className="micro-card-head-text">
                  <span className="micro-card-eyebrow">análisis</span>
                  <span className="micro-card-title">Hallazgos Clave</span>
                </div>
              </div>
              <ul className="micro-hallazgos">
                {(d.hallazgos ?? []).map((hallazgo, index) => (
                  <li key={index} className="micro-hallazgo">
                    <span className="micro-check" aria-hidden="true">
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 12 12"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M2 6.5l2.8 2.8L10 3"
                          stroke="#10b981"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    {hallazgo}
                  </li>
                ))}
              </ul>
            </div>
            )}

            {/* 3 — Impacto Estimado */}
            <div className="micro-card">
              <div className="micro-card-head">
                <div className="micro-icon-wrap">
                  <IconChart />
                </div>
                <div className="micro-card-head-text">
                  <span className="micro-card-eyebrow">proyección</span>
                  <span className="micro-card-title">Impacto Estimado</span>
                </div>
              </div>
              <p className="micro-body">{d.impacto_estimado}</p>
            </div>

            {/* 4 — Recomendación */}
            <div className="micro-card">
              <div className="micro-card-head">
                <div className="micro-icon-wrap">
                  <IconLightbulb />
                </div>
                <div className="micro-card-head-text">
                  <span className="micro-card-eyebrow">siguiente paso</span>
                  <span className="micro-card-title">Recomendación</span>
                </div>
              </div>
              <p className="micro-body">{d.recomendacion}</p>
            </div>

          </div>

          {/* CTA */}
          {data.cal_booking_url && (
            <div className="micro-cta">
              <p className="micro-cta-eyebrow">Próximo paso</p>
              <h2 className="micro-cta-heading">
                Agendar Diagnóstico Completo Gratuito
              </h2>
              <p className="micro-cta-desc">
                El siguiente paso es una llamada de 30 min donde analizamos en
                detalle cómo implementar la metodología IA First en tu empresa.
              </p>
              <a
                href={data.cal_booking_url}
                className="micro-cta-button"
                target="_blank"
                rel="noopener noreferrer"
              >
                Agendar mi llamada gratuita →
              </a>
            </div>
          )}

          {/* Footer */}
          <footer className="micro-footer">
            <p className="micro-footer-brand">MentorIA Systems</p>
            <p className="micro-footer-tagline">IA First para empresas</p>
            <p className="micro-footer-note">
              Este diagnóstico fue generado automáticamente con base en tus
              respuestas al cuestionario de automatización.
            </p>
          </footer>

        </div>
      </div>
    </>
  );
}
