// src/app/entregable/[token]/page.tsx — Server Component

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.flowdesk.mx/api/v1';

interface DeliverableSection { title: string; prompt: string }

interface DeliverableData {
  id: string;
  token: string;
  prospect_name: string | null;
  answers: Record<string, string>;
  content: Record<string, string> | null;
  created_at: string;
  deliverable: {
    name: string;
    description: string;
    sections: DeliverableSection[];
  };
}

async function getEntregable(token: string): Promise<DeliverableData | null> {
  try {
    const res = await fetch(`${API_BASE}/agent-panel/public/deliverable/${token}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getEntregable(token);
  const title = data
    ? `${data.deliverable.name}${data.prospect_name ? ` — ${data.prospect_name}` : ''}`
    : 'Entregable';
  return {
    title,
    robots: { index: false, follow: false },
  };
}

const CSS = `
  *,*::before,*::after{box-sizing:border-box;}
  body{margin:0;background:#fff;font-family:'Inter',system-ui,sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased;}
  .wrap{max-width:640px;margin:0 auto;padding-bottom:64px;}
  .stripe{height:4px;background:linear-gradient(90deg,#6366f1 0%,#818cf8 60%,#c7d2fe 100%);}
  .header{padding:28px 24px 24px;border-bottom:1px solid #e2e8f0;}
  .eyebrow{font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#6366f1;margin:0 0 6px;}
  .title{font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-.025em;line-height:1.25;margin:0 0 20px;text-wrap:balance;}
  .meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .meta-cell{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;}
  .meta-label{font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;margin:0 0 2px;}
  .meta-value{font-size:13px;font-weight:600;color:#0f172a;line-height:1.35;margin:0;}
  .sections{padding:20px 24px 0;display:flex;flex-direction:column;gap:14px;}
  .card{background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid #6366f1;border-radius:0 8px 8px 0;padding:20px;}
  .card-title{font-size:16px;font-weight:700;color:#0f172a;letter-spacing:-.02em;margin:0 0 12px;}
  .card-body{font-size:14px;line-height:1.75;color:#334155;margin:0;white-space:pre-wrap;}
  .footer{margin:32px 24px 0;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center;}
  .footer-note{font-size:12px;color:#94a3b8;margin:0;}
  .notfound{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;text-align:center;}
  .notfound h1{font-size:20px;font-weight:700;margin:0 0 8px;}
  .notfound p{font-size:14px;color:#64748b;line-height:1.65;max-width:300px;margin:0 auto;}
`;

export default async function EntregablePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getEntregable(token);

  if (!data || !data.content) {
    return (
      <>
        <style>{CSS}</style>
        <div className="notfound">
          <h1>Entregable no encontrado</h1>
          <p>El enlace puede haber expirado o ser incorrecto. Contacta a tu asesor.</p>
        </div>
      </>
    );
  }

  const formattedDate = new Date(data.created_at).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const sectionOrder = data.deliverable.sections.map(s => s.title);

  return (
    <>
      <style>{CSS}</style>
      <div className="wrap">
        <div className="stripe" />
        <header className="header">
          <p className="eyebrow">{data.deliverable.name}</p>
          <h1 className="title">
            {data.prospect_name
              ? `Reporte para ${data.prospect_name}`
              : data.deliverable.name}
          </h1>
          <div className="meta-grid">
            {data.prospect_name && (
              <div className="meta-cell">
                <p className="meta-label">Preparado para</p>
                <p className="meta-value">{data.prospect_name}</p>
              </div>
            )}
            <div className="meta-cell">
              <p className="meta-label">Fecha</p>
              <p className="meta-value">{formattedDate}</p>
            </div>
          </div>
        </header>

        <div className="sections">
          {sectionOrder.map(title => {
            const text = data.content?.[title];
            if (!text) return null;
            return (
              <div key={title} className="card">
                <p className="card-title">{title}</p>
                <p className="card-body">{text}</p>
              </div>
            );
          })}
        </div>

        <footer className="footer">
          <p className="footer-note">
            Generado automáticamente con base en la información proporcionada. · {formattedDate}
          </p>
        </footer>
      </div>
    </>
  );
}
