const N8N_API = 'https://prueba-digisaurios-n8n.4jvoco.easypanel.host/api/v1';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmY5MjkzMC0yYjk1LTRmNjAtODViOC0xZjYwNTFkNzhjMGUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc1NjEyODI0fQ.s4_wwDB_Xjwlg29cdfePqLZYZ0sDma9IBhsH1PNL5X4';
const WF_ID = 'fiU0ac3bSRkLGhaC';

const AIRTABLE_KEY = process.env.AIRTABLE_API_KEY || 'YOUR_AIRTABLE_API_KEY';
const BASE = 'appgS6jdmiMsGQyIF';
const ONBOARDING_TABLE = 'tbl45sIHzsJtNix3M';

// ─── HTML TEMPLATE PROMPT ────────────────────────────────────────────────────
const htmlPrompt = `=Eres un diseñador gráfico digital experto en brand guidelines. Genera un Manual de Identidad de Marca completo en HTML con CSS inline, listo para convertir a PDF.

MANUAL DE IDENTIDAD:
{{ $json.manualIdentidad }}

MANUAL DE REDES:
{{ $json.manualRedes }}

MARCA: {{ $json.marca }}
PALETA: Azul profundo #1B4FD8, Azul claro #5BC8F5, Gris carbón #4A4A4A, Blanco #FFFFFF, Azul noche #1A1A2E
TIPOGRAFÍA: Montserrat (headlines), Inter (body)

Genera un HTML completo (con <!DOCTYPE html>) que incluya:

1. PORTADA con nombre de marca, tagline, fecha
2. ÍNDICE visual
3. ESENCIA DE MARCA (misión, visión, valores en tarjetas)
4. PALETA DE COLORES (swatches con hex, RGB, uso)
5. TIPOGRAFÍA (muestras visuales de cada fuente con ejemplos)
6. LOGOTIPO (descripción, versiones, usos correctos e incorrectos)
7. PERSONALIDAD DE MARCA (arquetipo, adjetivos, voz)
8. VOZ Y TONO (ejemplos comparativos bien/mal)
9. REDES SOCIALES (estrategia por red con íconos emoji)
10. PILARES DE CONTENIDO (tarjetas visuales)
11. APLICACIONES DE MARCA — deja 3 espacios reservados con este formato exacto:
    <img src="{{MOCKUP_1}}" style="width:100%;max-width:600px;border-radius:12px;margin:16px 0;" alt="Tarjeta de presentación">
    <img src="{{MOCKUP_2}}" style="width:100%;max-width:600px;border-radius:12px;margin:16px 0;" alt="LinkedIn Banner">
    <img src="{{MOCKUP_3}}" style="width:100%;max-width:600px;border-radius:12px;margin:16px 0;" alt="Post Instagram">
12. CONTRAPORTADA

REGLAS CSS:
- Usa Google Fonts: Montserrat + Inter (link en head)
- Fondo general: #FFFFFF
- Secciones alternas: fondo #F0F4FF
- Headers de sección: fondo #1B4FD8, texto blanco, padding 24px
- Tarjetas: border-radius 12px, box-shadow sutil
- Page breaks: cada sección principal tiene style="page-break-before:always"
- Ancho máximo: 800px centrado
- Paleta de colores: cuadros de 80x80px con el color, nombre y hex debajo
- Tipografía elegante y profesional
- NO uses JavaScript
- Responde SOLO con el HTML completo, sin explicaciones`;

// ─── FLUX PRO PROMPTS para mockups de marca ──────────────────────────────────
const mockupPrompts = {
  tarjeta: `Professional business card design for MentorIA Systems technology company. Deep blue #1B4FD8 background, white Montserrat typography, brain-circuit logo on left, name and title in clean layout. Premium matte finish, studio lighting, flat lay on white marble surface, 4K commercial photography. No watermark.`,

  linkedin: `LinkedIn profile banner for MentorIA Systems AI technology company. Wide 1584x396 pixels format mockup. Deep blue gradient #1B4FD8 to #1A1A2E background, white bold Montserrat headline "inteligencia humana, potencia artificial", subtle circuit brain graphic right side, professional and premium. Clean minimal tech aesthetic. Studio mockup view.`,

  instagram: `Instagram post mockup for MentorIA Systems. Square 1:1 format, deep blue #1B4FD8 background, white Montserrat Bold headline text overlay, brain-circuit icon, clean minimal tech design, professional premium look. Shown on iPhone screen in hand, lifestyle business setting, warm lighting.`
};

// ─── PARSEAR PDF node ─────────────────────────────────────────────────────────
const parsearPdfCode = `const items = $input.all();
const phone = $('Extraer Aplicaciones').first().json.phone;
const marca = $('Extraer Aplicaciones').first().json.marca;

// Collect all mockup URLs from parallel Flux calls
const mockup1 = items.find(i => i.json.mockupType === 'tarjeta')?.json?.imageUrl || '';
const mockup2 = items.find(i => i.json.mockupType === 'linkedin')?.json?.imageUrl || '';
const mockup3 = items.find(i => i.json.mockupType === 'instagram')?.json?.imageUrl || '';

// Get HTML from Claude call (separate item)
const htmlItem = items.find(i => i.json.text);
let html = htmlItem?.json?.text || '';

// Replace image placeholders
html = html.replace('{{MOCKUP_1}}', mockup1);
html = html.replace('{{MOCKUP_2}}', mockup2);
html = html.replace('{{MOCKUP_3}}', mockup3);

// Clean up if Claude wrapped in code blocks
html = html.replace(/^\`\`\`html\\n?/i, '').replace(/\`\`\`$/,'').trim();

return [{ json: { phone, marca, html, mockup1, mockup2, mockup3 } }];`;

// ─── CONVERT HTML TO PDF via html2pdf.it (free, no API key) ─────────────────
const convertPdfCode = `// html2pdf.it free API — converts HTML to PDF binary
const html = $input.first().json.html;
const marca = $input.first().json.marca;
const phone = $input.first().json.phone;

const response = await $http.request({
  method: 'POST',
  url: 'https://api.html2pdf.it/v1/generate',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    html,
    apiKey: 'free',
    landscape: false,
    printBackground: true,
    format: 'A4',
    marginTop: '0',
    marginBottom: '0',
    marginLeft: '0',
    marginRight: '0'
  }),
  returnFullResponse: true,
  responseType: 'arraybuffer'
});

// Convert ArrayBuffer to base64
const buffer = Buffer.from(response.body);
const base64 = buffer.toString('base64');
const fileName = 'manual-' + marca.toLowerCase().replace(/\\s+/g, '-') + '.pdf';

return [{ json: { phone, marca, pdfBase64: base64, fileName, pdfSize: buffer.length } }];`;

// ─── SEND PDF via Evolution API ───────────────────────────────────────────────
const sendPdfCode = `const { phone, pdfBase64, fileName, marca } = $input.first().json;
const EVOLUTION_URL = 'https://prueba-digisaurios-n8n.4jvoco.easypanel.host';
const INSTANCE = 'mentoria-manolo';
const API_KEY = 'B6D711FCDE4D4FD5936544120E713976';

const response = await $http.request({
  method: 'POST',
  url: EVOLUTION_URL + '/message/sendMedia/' + INSTANCE,
  headers: {
    'Content-Type': 'application/json',
    'apikey': API_KEY
  },
  body: JSON.stringify({
    number: phone + '@s.whatsapp.net',
    mediatype: 'document',
    media: 'data:application/pdf;base64,' + pdfBase64,
    mimetype: 'application/pdf',
    caption: '📘 Manual de Identidad de Marca — ' + marca + '\\n\\nGenerado por MentorIA Systems ✨',
    fileName
  })
});

return [{ json: { sent: true, phone, fileName } }];`;

async function build() {
  const res = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    headers: { 'X-N8N-API-KEY': N8N_KEY }
  });
  const wf = await res.json();
  console.log('Fetched:', wf.name, '— nodes:', wf.nodes.length);

  // ── 1. Update Router to detect "aplicaciones:" ─────────────────────────────
  const router = wf.nodes.find(n => n.name === 'Router de Comandos');
  if (router) {
    const rules = router.parameters?.rules?.values || router.parameters?.conditions?.conditions || [];
    const hasAplicaciones = JSON.stringify(router.parameters).includes('aplicaciones');
    if (!hasAplicaciones) {
      // Add route for aplicaciones (same pattern as existing routes)
      const routerStr = JSON.stringify(router.parameters);
      // Find the marca route and duplicate pattern
      if (routerStr.includes('isMarca') || routerStr.includes('marca:')) {
        console.log('ℹ️  Router needs manual aplicaciones: route — adding via jsCode approach');
      }
    }
  }

  // Check Extraer Datos to see if it handles aplicaciones
  const extraer = wf.nodes.find(n => n.name === 'Extraer Datos del Mensaje');
  if (extraer && extraer.parameters?.jsCode) {
    if (!extraer.parameters.jsCode.includes('isAplicaciones')) {
      extraer.parameters.jsCode = extraer.parameters.jsCode.replace(
        /const isMarca\s*=.+/,
        `const isMarca = /^marca:/i.test(text);
  const isAplicaciones = /^aplicaciones:/i.test(text);`
      ).replace(
        /isMarca[,\s]/,
        `isMarca, isAplicaciones, `
      );
      // Add to return object if not already
      if (!extraer.parameters.jsCode.includes('isAplicaciones')) {
        extraer.parameters.jsCode = extraer.parameters.jsCode.replace(
          /isMarca\s*[,\}]/,
          match => match.includes('}') ? `isMarca, isAplicaciones }` : `isMarca, isAplicaciones,`
        );
      }
      console.log('✅ Extraer Datos — isAplicaciones added');
    }
  }

  // ── 2. Add new nodes ────────────────────────────────────────────────────────

  // WA — Generando PDF (immediate ack)
  const waGenPdfExists = wf.nodes.find(n => n.name === 'WhatsApp — Generando PDF');
  if (!waGenPdfExists) {
    wf.nodes.push({
      id: 'wa_gen_pdf',
      name: 'WhatsApp — Generando PDF',
      type: 'n8n-nodes-evolution-api.evolutionApi',
      typeVersion: 1,
      position: [1640, 3000],
      parameters: {
        resource: 'messages-api',
        instanceName: 'mentoria-manolo',
        remoteJid: '={{ $json.phone + "@s.whatsapp.net" }}',
        messageText: '=📄 *Generando Manual PDF* para {{ $json.marca }}...\n\n⏳ Esto tarda ~2 minutos:\n• Diseñando maquetación\n• Generando mockups visuales\n• Compilando en PDF\n\nTe lo mando enseguida 🎨',
        options_message: {}
      }
    });
    console.log('➕ WhatsApp — Generando PDF');
  }

  // Extraer Aplicaciones (Code node)
  const extraerAplicacionesExists = wf.nodes.find(n => n.name === 'Extraer Aplicaciones');
  if (!extraerAplicacionesExists) {
    wf.nodes.push({
      id: 'extraer_aplicaciones',
      name: 'Extraer Aplicaciones',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [1400, 3000],
      parameters: {
        jsCode: `const text = $input.first().json.text;
const phone = $input.first().json.phone;
const marca = text.replace(/^aplicaciones:/i, '').trim();
return [{ json: { marca, phone } }];`
      }
    });
    console.log('➕ Extraer Aplicaciones');
  }

  // Buscar Manuales en Airtable (HTTP Request to Airtable API)
  const buscarManualesExists = wf.nodes.find(n => n.name === 'Buscar Manuales Marca');
  if (!buscarManualesExists) {
    wf.nodes.push({
      id: 'buscar_manuales',
      name: 'Buscar Manuales Marca',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [1640, 3100],
      parameters: {
        method: 'GET',
        url: `=https://api.airtable.com/v0/${BASE}/${ONBOARDING_TABLE}?filterByFormula=SEARCH("{{ $json.marca }}",{Cliente})&maxRecords=10`,
        headerParameters: {
          parameters: [
            { name: 'Authorization', value: `Bearer ${AIRTABLE_KEY}` }
          ]
        }
      }
    });
    console.log('➕ Buscar Manuales Marca');
  }

  // Preparar Contenido Manual (Code node - combines identity + redes)
  const prepararContenidoExists = wf.nodes.find(n => n.name === 'Preparar Contenido Manual');
  if (!prepararContenidoExists) {
    wf.nodes.push({
      id: 'preparar_contenido_manual',
      name: 'Preparar Contenido Manual',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [1880, 3100],
      parameters: {
        jsCode: `const records = $input.first().json.records || [];
const phone = $('Extraer Aplicaciones').first().json.phone;
const marca = $('Extraer Aplicaciones').first().json.marca;

// Separate identity from redes
const identidad = records.find(r => !r.fields.Cliente.includes('Redes'));
const redes = records.find(r => r.fields.Cliente.includes('Redes'));

if (!identidad) {
  return [{ json: { error: 'No se encontró manual para ' + marca, phone } }];
}

return [{ json: {
  phone,
  marca,
  manualIdentidad: identidad.fields['Brief Enriquecido IA'] || '',
  manualRedes: redes?.fields['Brief Enriquecido IA'] || '',
  fechaManual: identidad.fields['Fecha Llamada'] || ''
} }];`
      }
    });
    console.log('➕ Preparar Contenido Manual');
  }

  // Claude — Modelo PDF
  const modeloPdfExists = wf.nodes.find(n => n.name === 'Claude — Modelo PDF');
  if (!modeloPdfExists) {
    wf.nodes.push({
      id: 'claude_model_pdf',
      name: 'Claude — Modelo PDF',
      type: '@n8n/n8n-nodes-langchain.lmChatAnthropic',
      typeVersion: 1.2,
      position: [2120, 3000],
      parameters: {
        model: 'claude-sonnet-4-5',
        options: { maxTokensToSample: 8000 }
      },
      credentials: { anthropicApi: { id: 'z0YdT9oApiWKr4Eq', name: 'Anthropic MentorIA' } }
    });
    console.log('➕ Claude — Modelo PDF');
  }

  // Generar HTML Manual (Chain LLM)
  const generarHtmlExists = wf.nodes.find(n => n.name === 'Generar HTML Manual');
  if (!generarHtmlExists) {
    wf.nodes.push({
      id: 'generar_html_manual',
      name: 'Generar HTML Manual',
      type: '@n8n/n8n-nodes-langchain.chainLlm',
      typeVersion: 1.4,
      position: [2120, 3100],
      parameters: { promptType: 'define', text: htmlPrompt }
    });
    console.log('➕ Generar HTML Manual');
  }

  // Flux Pro — Mockup Tarjeta
  const fluxTarjetaExists = wf.nodes.find(n => n.name === 'Flux — Mockup Tarjeta');
  if (!fluxTarjetaExists) {
    wf.nodes.push({
      id: 'flux_mockup_tarjeta',
      name: 'Flux — Mockup Tarjeta',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [2360, 2960],
      parameters: {
        method: 'POST',
        url: 'https://fal.run/fal-ai/flux-pro/v1.1',
        headerParameters: {
          parameters: [
            { name: 'Authorization', value: 'Key be5a6483-022d-43fb-8b74-278971c4c880:0f47c8bafb850e34610984c190e990ab' },
            { name: 'Content-Type', value: 'application/json' }
          ]
        },
        sendBody: true,
        bodyParameters: {
          parameters: [
            { name: 'prompt', value: mockupPrompts.tarjeta },
            { name: 'image_size', value: 'landscape_4_3' },
            { name: 'num_images', value: '=1' },
            { name: 'output_format', value: 'jpeg' },
            { name: 'safety_tolerance', value: '=2' }
          ]
        }
      }
    });
    console.log('➕ Flux — Mockup Tarjeta');
  }

  // Flux Pro — Mockup LinkedIn
  const fluxLinkedinExists = wf.nodes.find(n => n.name === 'Flux — Mockup LinkedIn');
  if (!fluxLinkedinExists) {
    wf.nodes.push({
      id: 'flux_mockup_linkedin',
      name: 'Flux — Mockup LinkedIn',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [2360, 3060],
      parameters: {
        method: 'POST',
        url: 'https://fal.run/fal-ai/flux-pro/v1.1',
        headerParameters: {
          parameters: [
            { name: 'Authorization', value: 'Key be5a6483-022d-43fb-8b74-278971c4c880:0f47c8bafb850e34610984c190e990ab' },
            { name: 'Content-Type', value: 'application/json' }
          ]
        },
        sendBody: true,
        bodyParameters: {
          parameters: [
            { name: 'prompt', value: mockupPrompts.linkedin },
            { name: 'image_size', value: 'landscape_16_9' },
            { name: 'num_images', value: '=1' },
            { name: 'output_format', value: 'jpeg' },
            { name: 'safety_tolerance', value: '=2' }
          ]
        }
      }
    });
    console.log('➕ Flux — Mockup LinkedIn');
  }

  // Flux Pro — Mockup Instagram
  const fluxInstagramExists = wf.nodes.find(n => n.name === 'Flux — Mockup Instagram');
  if (!fluxInstagramExists) {
    wf.nodes.push({
      id: 'flux_mockup_instagram',
      name: 'Flux — Mockup Instagram',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [2360, 3160],
      parameters: {
        method: 'POST',
        url: 'https://fal.run/fal-ai/flux-pro/v1.1',
        headerParameters: {
          parameters: [
            { name: 'Authorization', value: 'Key be5a6483-022d-43fb-8b74-278971c4c880:0f47c8bafb850e34610984c190e990ab' },
            { name: 'Content-Type', value: 'application/json' }
          ]
        },
        sendBody: true,
        bodyParameters: {
          parameters: [
            { name: 'prompt', value: mockupPrompts.instagram },
            { name: 'image_size', value: 'square_hd' },
            { name: 'num_images', value: '=1' },
            { name: 'output_format', value: 'jpeg' },
            { name: 'safety_tolerance', value: '=2' }
          ]
        }
      }
    });
    console.log('➕ Flux — Mockup Instagram');
  }

  // Extraer URLs Mockups (Code node - collects all flux results)
  const extraerUrlsMockupsExists = wf.nodes.find(n => n.name === 'Extraer URLs Mockups');
  if (!extraerUrlsMockupsExists) {
    wf.nodes.push({
      id: 'extraer_urls_mockups',
      name: 'Extraer URLs Mockups',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [2600, 3060],
      parameters: {
        jsCode: `// Each Flux node runs separately — get their outputs
const tarjeta = $('Flux — Mockup Tarjeta').first().json?.images?.[0]?.url || '';
const linkedin = $('Flux — Mockup LinkedIn').first().json?.images?.[0]?.url || '';
const instagram = $('Flux — Mockup Instagram').first().json?.images?.[0]?.url || '';

// Get HTML from Claude
let html = $('Generar HTML Manual').first().json?.text || '';
html = html.replace(/^\`\`\`html\\n?/i, '').replace(/\`\`\`$/,'').trim();

// Inject real image URLs
html = html.replace('{{MOCKUP_1}}', tarjeta);
html = html.replace('{{MOCKUP_2}}', linkedin);
html = html.replace('{{MOCKUP_3}}', instagram);

const phone = $('Extraer Aplicaciones').first().json.phone;
const marca = $('Extraer Aplicaciones').first().json.marca;

return [{ json: { phone, marca, html, tarjeta, linkedin, instagram } }];`
      }
    });
    console.log('➕ Extraer URLs Mockups');
  }

  // HTML a PDF (HTTP Request to html2pdf.it)
  const htmlPdfExists = wf.nodes.find(n => n.name === 'HTML a PDF');
  if (!htmlPdfExists) {
    wf.nodes.push({
      id: 'html_a_pdf',
      name: 'HTML a PDF',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [2840, 3060],
      parameters: {
        method: 'POST',
        url: 'https://api.html2pdf.it/v1/generate',
        headerParameters: {
          parameters: [
            { name: 'Content-Type', value: 'application/json' }
          ]
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '={\n  "html": {{ JSON.stringify($json.html) }},\n  "apiKey": "free",\n  "printBackground": true,\n  "format": "A4",\n  "marginTop": "10mm",\n  "marginBottom": "10mm",\n  "marginLeft": "0",\n  "marginRight": "0"\n}',
        options: {
          response: {
            response: {
              responseFormat: 'file',
              outputPropertyName: 'pdfData'
            }
          }
        }
      }
    });
    console.log('➕ HTML a PDF');
  }

  // Preparar Envío PDF (Code node - encode to base64 for Evolution API)
  const prepararEnvioPdfExists = wf.nodes.find(n => n.name === 'Preparar Envío PDF');
  if (!prepararEnvioPdfExists) {
    wf.nodes.push({
      id: 'preparar_envio_pdf',
      name: 'Preparar Envío PDF',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [3080, 3060],
      parameters: {
        jsCode: `const binaryKey = Object.keys($input.first().binary || {})[0] || 'pdfData';
const binaryData = $input.first().binary?.[binaryKey];
const phone = $('Extraer Aplicaciones').first().json.phone;
const marca = $('Extraer Aplicaciones').first().json.marca;
const fileName = 'manual-' + marca.toLowerCase().replace(/\\s+/g,'-') + '.pdf';

if (!binaryData) {
  return [{ json: { error: 'No PDF binary found', phone, marca } }];
}

return [{ json: { phone, marca, fileName, mimeType: 'application/pdf', binaryKey } }];`
      }
    });
    console.log('➕ Preparar Envío PDF');
  }

  // WhatsApp — Enviar PDF (Evolution API sendMedia with binary)
  const waPdfExists = wf.nodes.find(n => n.name === 'WhatsApp — Enviar PDF');
  if (!waPdfExists) {
    wf.nodes.push({
      id: 'wa_enviar_pdf',
      name: 'WhatsApp — Enviar PDF',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [3320, 3060],
      parameters: {
        method: 'POST',
        url: 'https://prueba-digisaurios-n8n.4jvoco.easypanel.host/message/sendMedia/mentoria-manolo',
        headerParameters: {
          parameters: [
            { name: 'Content-Type', value: 'application/json' },
            { name: 'apikey', value: 'B6D711FCDE4D4FD5936544120E713976' }
          ]
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: `={"number":"{{ $json.phone }}@s.whatsapp.net","mediatype":"document","media":"={{ $binary[$json.binaryKey]?.data ? 'data:application/pdf;base64,' + $binary[$json.binaryKey].data : '' }}","mimetype":"application/pdf","caption":"📘 *Manual de Identidad de Marca*\\n\\n✅ {{ $json.marca }}\\n\\nIncluye:\\n• Identidad visual completa\\n• Paleta y tipografía\\n• Personalidad y voz\\n• Estrategia de redes\\n• 3 mockups de aplicación\\n\\n_Generado por MentorIA Systems_ ✨","fileName":"{{ $json.fileName }}"}`
      }
    });
    console.log('➕ WhatsApp — Enviar PDF');
  }

  // ── 3. Wire connections ─────────────────────────────────────────────────────
  const c = wf.connections;

  // Claude model feeds chain
  c['Claude — Modelo PDF'] = {
    ai_languageModel: [[{ node: 'Generar HTML Manual', type: 'ai_languageModel', index: 0 }]]
  };

  // Main flow
  c['Extraer Aplicaciones'] = { main: [[
    { node: 'WhatsApp — Generando PDF', type: 'main', index: 0 },
    { node: 'Buscar Manuales Marca', type: 'main', index: 0 }
  ]] };

  c['Buscar Manuales Marca'] = { main: [[{ node: 'Preparar Contenido Manual', type: 'main', index: 0 }]] };

  c['Preparar Contenido Manual'] = { main: [[
    { node: 'Generar HTML Manual', type: 'main', index: 0 },
    { node: 'Flux — Mockup Tarjeta', type: 'main', index: 0 },
    { node: 'Flux — Mockup LinkedIn', type: 'main', index: 0 },
    { node: 'Flux — Mockup Instagram', type: 'main', index: 0 }
  ]] };

  // All parallel tasks converge at Extraer URLs Mockups
  c['Generar HTML Manual'] = { main: [[{ node: 'Extraer URLs Mockups', type: 'main', index: 0 }]] };
  c['Flux — Mockup Tarjeta'] = { main: [[{ node: 'Extraer URLs Mockups', type: 'main', index: 0 }]] };
  c['Flux — Mockup LinkedIn'] = { main: [[{ node: 'Extraer URLs Mockups', type: 'main', index: 0 }]] };
  c['Flux — Mockup Instagram'] = { main: [[{ node: 'Extraer URLs Mockups', type: 'main', index: 0 }]] };

  c['Extraer URLs Mockups'] = { main: [[{ node: 'HTML a PDF', type: 'main', index: 0 }]] };
  c['HTML a PDF'] = { main: [[{ node: 'Preparar Envío PDF', type: 'main', index: 0 }]] };
  c['Preparar Envío PDF'] = { main: [[{ node: 'WhatsApp — Enviar PDF', type: 'main', index: 0 }]] };

  // ── 4. Update Router to add aplicaciones: route ────────────────────────────
  // Find the Router node and add a new route
  const routerNode = wf.nodes.find(n => n.name === 'Router de Comandos');
  if (routerNode) {
    const params = JSON.stringify(routerNode.parameters);
    if (!params.includes('aplicaciones')) {
      // Add aplicaciones condition — same structure as marca condition
      const conditions = routerNode.parameters?.rules?.values ||
                         routerNode.parameters?.conditions?.conditions || [];

      // Try to find the marca condition to copy its structure
      const marcaCondition = conditions.find(c =>
        JSON.stringify(c).toLowerCase().includes('marca')
      );

      if (marcaCondition) {
        const aplicacionesCondition = JSON.parse(JSON.stringify(marcaCondition));
        // Replace marca with aplicaciones in the condition
        const condStr = JSON.stringify(aplicacionesCondition)
          .replace(/isMarca/g, 'isAplicaciones')
          .replace(/marca:/gi, 'aplicaciones:');
        conditions.push(JSON.parse(condStr));

        // Add the output connection
        const routerOutputIdx = conditions.length - 1;
        if (!c['Router de Comandos']) c['Router de Comandos'] = { main: [] };
        while (c['Router de Comandos'].main.length <= routerOutputIdx) {
          c['Router de Comandos'].main.push([]);
        }
        c['Router de Comandos'].main[routerOutputIdx] = [{ node: 'Extraer Aplicaciones', type: 'main', index: 0 }];
        console.log('✅ Router — aplicaciones: route added at index', routerOutputIdx);
      } else {
        console.log('⚠️  Could not find marca condition to copy — router needs manual update');
        // Ensure Extraer Aplicaciones is connected somewhere
        // Add as last route
        if (!c['Router de Comandos']) c['Router de Comandos'] = { main: [] };
        const lastIdx = c['Router de Comandos'].main.length;
        c['Router de Comandos'].main.push([{ node: 'Extraer Aplicaciones', type: 'main', index: 0 }]);
        console.log('✅ Router — Extraer Aplicaciones added at output', lastIdx);
      }
    } else {
      console.log('ℹ️  Router already has aplicaciones route');
    }
  }

  // ── 5. Update Extraer Datos to flag isAplicaciones ─────────────────────────
  const extraerNode = wf.nodes.find(n => n.name === 'Extraer Datos del Mensaje');
  if (extraerNode?.parameters?.jsCode && !extraerNode.parameters.jsCode.includes('isAplicaciones')) {
    extraerNode.parameters.jsCode = extraerNode.parameters.jsCode
      .replace(/const isMarca\s*=/, 'const isAplicaciones = /^aplicaciones:/i.test(text);\n  const isMarca =')
      .replace(/isMarca(\s*[,\}])/, 'isMarca, isAplicaciones$1');
    console.log('✅ Extraer Datos — isAplicaciones detection added');
  }

  // ── 6. Save ────────────────────────────────────────────────────────────────
  const upd = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': N8N_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: wf.name,
      nodes: wf.nodes,
      connections: wf.connections,
      settings: { executionOrder: 'v1' }
    })
  });
  const r = await upd.json();
  if (r.id) {
    console.log('\n✅ Brand PDF command built —', r.nodes?.length, 'nodes');
    console.log('\nNuevos nodos agregados:');
    console.log('  • Extraer Aplicaciones');
    console.log('  • WhatsApp — Generando PDF (ack inmediato)');
    console.log('  • Buscar Manuales Marca (Airtable)');
    console.log('  • Preparar Contenido Manual');
    console.log('  • Claude — Modelo PDF + Generar HTML Manual');
    console.log('  • Flux — Mockup Tarjeta / LinkedIn / Instagram (paralelo)');
    console.log('  • Extraer URLs Mockups');
    console.log('  • HTML a PDF (html2pdf.it — gratis)');
    console.log('  • Preparar Envío PDF');
    console.log('  • WhatsApp — Enviar PDF');
    console.log('\nHerramientas usadas:');
    console.log('  • Flux Pro: imágenes mockup (ya tienes créditos)');
    console.log('  • html2pdf.it: conversión HTML→PDF (GRATIS, 100/mes)');
    console.log('  • Evolution API: envío del PDF por WhatsApp');
    console.log('\n⚠️  Unpublish → Publish en n8n');
    console.log('Luego manda: "aplicaciones: MentorIA Systems"');
  } else {
    console.error('❌', JSON.stringify(r, null, 2));
  }
}
build();
