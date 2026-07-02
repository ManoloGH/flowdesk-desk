const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const logoPath = path.resolve(__dirname, 'logo-mentoria.jpeg');
const logoBase64 = fs.readFileSync(logoPath).toString('base64');
const logoSrc = `data:image/jpeg;base64,${logoBase64}`;

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    background: #ffffff;
    width: 1122px;
    height: 794px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: 28px 36px 20px 36px;
  }

  /* HEADER */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
    padding-bottom: 14px;
    border-bottom: 2.5px solid #1a1a2e;
  }
  .header img { height: 52px; }
  .header-text { text-align: right; }
  .header-text h1 { font-size: 18px; color: #1a1a2e; font-weight: 700; }
  .header-text p { font-size: 10px; color: #888; margin-top: 2px; }

  /* COLUMNAS */
  .columns {
    display: flex;
    gap: 10px;
    flex: 1;
    align-items: stretch;
  }

  .col {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* TÍTULOS DE COLUMNA */
  .col-title {
    text-align: center;
    padding: 9px 10px;
    border-radius: 10px;
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 0.3px;
    text-transform: uppercase;
  }
  .col-title.cliente  { background: #EBF5FF; color: #1565C0; border: 2px solid #4A90D9; }
  .col-title.mentoria { background: #1a1a2e; color: #ffffff; }
  .col-title.recibe   { background: #E8F5E9; color: #2E7D32; border: 2px solid #4CAF50; }

  .col-title .icon { font-size: 18px; display: block; margin-bottom: 3px; }

  /* CARDS */
  .card {
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 10px;
    line-height: 1.5;
    position: relative;
  }
  .card.cliente  { background: #F0F7FF; border-left: 4px solid #4A90D9; }
  .card.mentoria { background: #F5F5F8; border-left: 4px solid #1a1a2e; }
  .card.recibe   { background: #F1FBF2; border-left: 4px solid #4CAF50; }

  .card .card-title {
    font-weight: 700;
    font-size: 10.5px;
    margin-bottom: 5px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .card .card-title .dot {
    width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  }
  .dot.blue  { background: #4A90D9; }
  .dot.dark  { background: #1a1a2e; }
  .dot.green { background: #4CAF50; }

  .card ul { padding-left: 14px; }
  .card ul li { margin-bottom: 2px; color: #333; }

  /* FLECHA CENTRAL */
  .arrows-col {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
    width: 36px;
    padding-top: 44px;
  }
  .arrow {
    font-size: 20px;
    color: #4A90D9;
    line-height: 1;
  }

  /* FOOTER */
  .footer {
    margin-top: 14px;
    padding-top: 10px;
    border-top: 1.5px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer-promise {
    background: linear-gradient(135deg, #1a1a2e, #0f3460);
    color: white;
    border-radius: 10px;
    padding: 8px 20px;
    font-size: 10px;
    font-weight: 600;
    text-align: center;
    flex: 1;
    margin: 0 10px;
  }
  .footer-promise span {
    font-size: 13px;
    font-weight: 700;
    display: block;
    margin-bottom: 2px;
    color: #4A90D9;
  }
  .footer-note {
    font-size: 9px;
    color: #aaa;
    text-align: right;
    width: 160px;
  }
  .footer-left {
    font-size: 9px;
    color: #aaa;
    width: 160px;
  }

  /* TIMELINE BADGE */
  .badge {
    display: inline-block;
    background: #4A90D9;
    color: white;
    font-size: 8.5px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 20px;
    margin-bottom: 5px;
  }
  .badge.green { background: #4CAF50; }
  .badge.dark  { background: #1a1a2e; }

</style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <img src="${logoSrc}" alt="MentorIA Systems"/>
    <div class="header-text">
      <h1>¿Cómo funciona tu Agente de Marketing IA?</h1>
      <p>Una página. Todo lo que necesitas saber.</p>
    </div>
  </div>

  <!-- COLUMNAS -->
  <div class="columns">

    <!-- COLUMNA 1: LO QUE NECESITAMOS DE TI -->
    <div class="col">
      <div class="col-title cliente">
        <span class="icon">🤝</span>
        Lo que necesitamos de ti
      </div>

      <div class="card cliente">
        <div class="badge">Una sola vez</div>
        <div class="card-title"><span class="dot blue"></span> Videollamada de onboarding</div>
        <ul>
          <li>Cuéntanos sobre tu marca y negocio</li>
          <li>Tu cliente ideal y competencia</li>
          <li>Meta de ventas y presupuesto</li>
          <li>Logo, colores y ejemplos que te gusten</li>
          <li>Acceso a tu CRM</li>
          <li>Acceso a tu Meta Business Suite</li>
        </ul>
      </div>

      <div class="card cliente">
        <div class="badge">Cada semana</div>
        <div class="card-title"><span class="dot blue"></span> Fotos y videos reales</div>
        <ul>
          <li>Grabas lo que el agente te especifica</li>
          <li>Con tu celular es suficiente</li>
          <li>Instrucciones precisas de encuadre y luz</li>
          <li>Máximo 2 horas de tu tiempo</li>
        </ul>
      </div>
    </div>

    <!-- FLECHAS -->
    <div class="arrows-col">
      <div class="arrow">➜</div>
      <div class="arrow">➜</div>
      <div class="arrow">➜</div>
    </div>

    <!-- COLUMNA 2: LO QUE HACEMOS NOSOTROS -->
    <div class="col" style="flex: 1.3">
      <div class="col-title mentoria">
        <span class="icon">⚙️</span>
        Lo que hacemos nosotros
      </div>

      <!-- SUB-BADGES de roles -->
      <div style="display:flex; gap:5px; justify-content:center; margin-bottom:2px; flex-wrap:wrap;">
        <span style="background:#4A90D9;color:white;font-size:8px;font-weight:700;padding:3px 9px;border-radius:20px;">🤖 Agente IA</span>
        <span style="background:#6C3483;color:white;font-size:8px;font-weight:700;padding:3px 9px;border-radius:20px;">🎨 Director Creativo</span>
        <span style="background:#1a6b3c;color:white;font-size:8px;font-weight:700;padding:3px 9px;border-radius:20px;">✂️ Diseñador</span>
        <span style="background:#C0392B;color:white;font-size:8px;font-weight:700;padding:3px 9px;border-radius:20px;">💬 Asesor de Servicio</span>
      </div>

      <div class="card mentoria">
        <div class="badge dark">Días 1-2 — Solo una vez</div>
        <div class="card-title"><span class="dot dark"></span> Configuramos tu sistema</div>
        <ul>
          <li><strong>🤖 IA:</strong> Procesa tu brief e investiga tu industria</li>
          <li><strong>🎨 Dir. Creativo:</strong> Aprueba tu línea de comunicación</li>
          <li><strong>💬 Asesor:</strong> Configura tu dashboard y accesos</li>
        </ul>
      </div>

      <div class="card mentoria">
        <div class="badge dark">Cada semana</div>
        <div class="card-title"><span class="dot dark"></span> Producimos y publicamos</div>
        <ul>
          <li><strong>🤖 IA:</strong> Genera copies, imágenes y videos</li>
          <li><strong>✂️ Diseñador:</strong> Edita videos y ajusta piezas finales</li>
          <li><strong>🎨 Dir. Creativo:</strong> Revisión de calidad y aprobación ✅</li>
          <li><strong>💬 Asesor:</strong> Envía contenido al cliente para aprobación final</li>
          <li><strong>🤖 IA:</strong> Cliente aprueba → programa en horario óptimo</li>
        </ul>
      </div>

      <div class="card mentoria">
        <div class="badge dark">Cada mes</div>
        <div class="card-title"><span class="dot dark"></span> Analizamos y optimizamos</div>
        <ul>
          <li><strong>🤖 IA:</strong> Genera reporte de métricas y ROI</li>
          <li><strong>💬 Asesor:</strong> Llamada de resultados contigo (30 min)</li>
          <li><strong>🤖 IA:</strong> Ajusta el plan del mes siguiente</li>
        </ul>
      </div>
    </div>

    <!-- FLECHAS -->
    <div class="arrows-col">
      <div class="arrow">➜</div>
      <div class="arrow">➜</div>
      <div class="arrow">➜</div>
    </div>

    <!-- COLUMNA 3: LO QUE RECIBES -->
    <div class="col">
      <div class="col-title recibe">
        <span class="icon">🎁</span>
        Lo que recibes
      </div>

      <div class="card recibe">
        <div class="badge green">Al inicio</div>
        <div class="card-title"><span class="dot green"></span> Tu sistema listo</div>
        <ul>
          <li>Dashboard personalizado con tu marca</li>
          <li>Plan de contenido para 3 meses</li>
          <li>Estrategia de pauta lista para activar</li>
          <li>Copy completo de tu landing page</li>
        </ul>
      </div>

      <div class="card recibe">
        <div class="badge green">Cada semana</div>
        <div class="card-title"><span class="dot green"></span> Control total antes de publicar</div>
        <ul>
          <li>👁 <strong>Revisas y apruebas</strong> todo el contenido antes de que salga</li>
          <li>✅ <strong>Apruebas →</strong> el agente publica automáticamente en Instagram, Facebook, LinkedIn, TikTok, YouTube, Pinterest, Blog y Email en el horario óptimo</li>
          <li>📲 <strong>Tu turno (2 min):</strong> Twitter/X, WhatsApp Status, Threads y stories interactivas — texto e imagen listos para copiar y pegar</li>
        </ul>
      </div>

      <div class="card recibe">
        <div class="badge green">Cada mes</div>
        <div class="card-title"><span class="dot green"></span> Inteligencia de negocio</div>
        <ul>
          <li>Reporte de ROI con semáforo de metas</li>
          <li>Análisis de qué funcionó y por qué</li>
          <li>Plan ajustado para el mes siguiente</li>
          <li>Investigación de mercado actualizada</li>
        </ul>
      </div>
    </div>

  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-left">
      Soporte directo con tu<br>ejecutivo de cuenta<br>Lun–Vie 9am–6pm
    </div>
    <div class="footer-promise">
      <span>IA + talento humano. Juntos.</span>
      Tecnología que produce, creativos que aprueban, asesores que acompañan.<br>
      <span style="font-size:9px;color:#cdd6f4;font-weight:400;">No es solo software. Es tu equipo de marketing completo.</span>
    </div>
    <div class="footer-note">
      mentoriasystems.com<br>
      © 2025 MentorIA Systems
    </div>
  </div>

</body>
</html>`;

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1122, height: 794 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: 'FLUJOGRAMA-CLIENTE.pdf',
    width: '297mm',
    height: '210mm',
    printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 }
  });
  await browser.close();
  console.log('Flujograma generado exitosamente');
})();
