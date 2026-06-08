// create-onboarding-workflow.js
// Creates n8n workflow to serve onboarding form and process submissions

const fs = require('fs');
const path = require('path');

const N8N_API = 'https://prueba-digisaurios-n8n.4jvoco.easypanel.host/api/v1';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmY5MjkzMC0yYjk1LTRmNjAtODViOC0xZjYwNTFkNzhjMGUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc1NjEyODI0fQ.s4_wwDB_Xjwlg29cdfePqLZYZ0sDma9IBhsH1PNL5X4';
const AIRTABLE_KEY = process.env.AIRTABLE_API_KEY || 'YOUR_AIRTABLE_API_KEY';
const BASE = 'appgS6jdmiMsGQyIF';
const ONBOARDING_TABLE = 'Onboarding';
const EVOLUTION_CRED_ID = '25MBOz6svtSJ3wEE';
const EVOLUTION_INSTANCE = 'mentoria-manolo';

// ─── Step 1: Update HTML form submitForm() to be async + POST ────────────────
const htmlPath = path.join(__dirname, 'onboarding-form.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Make function async
html = html.replace(
  'function submitForm() {',
  'async function submitForm() {'
);

// Replace console.log with actual fetch POST
html = html.replace(
  "  console.log('Onboarding data:', JSON.stringify(data, null, 2));\n\n  // Hide all steps, show success",
  `  // POST to n8n webhook
  try {
    const btn = document.querySelector('.btn-submit');
    if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }
    await fetch('https://prueba-digisaurios-n8n.4jvoco.easypanel.host/webhook/onboarding-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch(e) {
    console.error('Error enviando formulario:', e);
  }

  // Hide all steps, show success`
);

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('✅ HTML form updated with async POST');

// ─── Step 2: Create n8n workflow ─────────────────────────────────────────────
async function createWorkflow() {

  // Read updated HTML — embed as base64 to avoid escaping issues
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const htmlBase64 = Buffer.from(htmlContent).toString('base64');

  // Code node: decode base64 → serve HTML
  const serveHtmlCode = [
    "const htmlBase64 = '" + htmlBase64 + "';",
    "const html = Buffer.from(htmlBase64, 'base64').toString('utf8');",
    "return [{ json: { html } }];"
  ].join('\n');

  const parseFormCode = `const body = $input.first().json.body || $input.first().json;
const contacto = body.contacto || {};
const colores = body.colores || {};
const handles = body.handles || {};
const redes   = Array.isArray(body.redes)   ? body.redes.join(', ')   : '';
const pilares = Array.isArray(body.pilares) ? body.pilares.join(', ') : '';
const tono    = Array.isArray(body.tono)    ? body.tono.join(', ')    : '';
const phone   = (contacto.wa || '').replace(/[^0-9]/g, '');

return [{
  json: {
    empresa:           body.empresa || '',
    industria:         body.industria || '',
    descripcion:       body.descripcion || '',
    propuesta:         body.propuesta || '',
    website:           body.website || '',
    ciudad:            body.ciudad || '',
    competidores:      body.competidores || '',
    colorPrimario:     colores.primario || '',
    colorSecundario:   colores.secundario || '',
    tipoPrincipal:     body.tipoPrincipal || '',
    tipoSecundaria:    body.tipoSecundaria || '',
    tono,
    prohibido:         body.prohibido || '',
    clienteIdeal:      body.clienteIdeal || '',
    pilares,
    eventos:           body.eventos || '',
    referencias:       body.referencias || '',
    redes,
    handleInstagram:   handles.instagram || '',
    handleLinkedin:    handles.linkedin || '',
    objetivo:          body.objetivo || '',
    presupuesto:       body.presupuesto || '',
    crm:               body.crm || '',
    contactoNombre:    contacto.nombre || '',
    contactoCargo:     contacto.cargo || '',
    contactoEmail:     contacto.email || '',
    contactoWA:        contacto.wa || '',
    phone,
    aprueba:           body.aprueba || '',
    frecuencia:        body.frecuencia || '',
    notas:             body.notas || '',
    fecha:             body.fecha || new Date().toISOString()
  }
}];`;

  const buildWelcomeCode = `const d = $input.first().json;
const empresa = d.empresa || 'tu empresa';
const nombre  = d.contactoNombre || '';

const msg = '\\u{1F44B} ' + 'Hola ' + nombre + '! Bienvenido/a a *MentorIA Systems* \\u{1F680}\\n\\n'
  + 'Recibimos el formulario de *' + empresa + '* correctamente. En las pr\\u00F3ximas horas tu equipo de IA estar\\u00E1 listo.\\n\\n'
  + '\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\n'
  + '\\u{1F4CB} *GU\\u00CDA DE COMANDOS*\\n'
  + '\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\n\\n'
  + '\\u{1F5D3}\\uFE0F *CALENDARIO DE CONTENIDO*\\n'
  + '\\u2022 contenido: [mes] \\u2014 Plan mensual org\\u00E1nico + pauta\\n'
  + '  _Ej: contenido: mayo_\\n\\n'
  + '\\u270F\\uFE0F *CREACI\\u00D3N DE PIEZAS*\\n'
  + '\\u2022 copy: [n\\u00FAmero] \\u2014 Copy completo de una pieza\\n'
  + '\\u2022 prompt: [n\\u00FAmero] \\u2014 Prompt para imagen/video\\n\\n'
  + '\\u{1F4E2} *PUBLICIDAD*\\n'
  + '\\u2022 pauta: [mes] \\u2014 Plan completo de pauta pagada\\n'
  + '\\u2022 abtesting: [N] \\u2014 3 variaciones de copy\\n'
  + '\\u2022 optimizar: [N] \\u2014 An\\u00E1lisis de campa\\u00F1a activa\\n\\n'
  + '\\u{1F4CA} *SEGUIMIENTO MENSUAL*\\n'
  + '\\u2022 revision: \\u2014 Check-in mensual\\n'
  + '\\u2022 resultados: [datos] \\u2014 Guarda m\\u00E9tricas\\n'
  + '\\u2022 reporte: \\u2014 Presentaci\\u00F3n de resultados\\n\\n'
  + '\\u{1F3A8} *MARCA*\\n'
  + '\\u2022 manual: \\u2014 Manual de marca y voz\\n'
  + '\\u2022 aplicaciones: [marca] \\u2014 PDF de aplicaciones\\n\\n'
  + '\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\u2501\\n'
  + '\\u{1F4A1} Cualquier duda, escr\\u00EDbeme. Estoy aqu\\u00ED \\u{1F4AA}';

return [{ json: { phone: d.phone, message: msg, empresa: d.empresa } }];`;

  const nodes = [
    // GET webhook: serve form
    {
      id: 'wb-get',
      name: 'GET Onboarding Form',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      position: [0, 0],
      webhookId: 'onb-get-001',
      parameters: {
        httpMethod: 'GET',
        path: 'onboarding',
        responseMode: 'responseNode',
        options: {}
      }
    },
    // Code: serve HTML (base64 decoded)
    {
      id: 'code-html',
      name: 'Servir HTML',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [240, 0],
      parameters: {
        mode: 'runOnceForAllItems',
        jsCode: serveHtmlCode
      }
    },
    // Respond to GET with HTML
    {
      id: 'resp-get',
      name: 'Responder HTML',
      type: 'n8n-nodes-base.respondToWebhook',
      typeVersion: 1,
      position: [480, 0],
      parameters: {
        respondWith: 'text',
        responseBody: '={{ $json.html }}',
        options: {
          responseHeaders: {
            entries: [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }]
          }
        }
      }
    },
    // POST webhook: receive form submission
    {
      id: 'wb-post',
      name: 'POST Onboarding Submit',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      position: [0, 340],
      webhookId: 'onb-post-001',
      parameters: {
        httpMethod: 'POST',
        path: 'onboarding-submit',
        responseMode: 'responseNode',
        options: {}
      }
    },
    // Code: parse form data
    {
      id: 'code-parse',
      name: 'Parsear Formulario',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [240, 340],
      parameters: {
        mode: 'runOnceForAllItems',
        jsCode: parseFormCode
      }
    },
    // HTTP Request: save to Airtable Onboarding table
    {
      id: 'air-save',
      name: 'Guardar en Airtable',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [480, 340],
      parameters: {
        method: 'POST',
        url: 'https://api.airtable.com/v0/' + BASE + '/' + encodeURIComponent(ONBOARDING_TABLE),
        sendHeaders: true,
        headerParameters: {
          parameters: [{ name: 'Authorization', value: 'Bearer ' + AIRTABLE_KEY }]
        },
        sendBody: true,
        contentType: 'json',
        body: {
          fields: {
            'Empresa':           '={{ $json.empresa }}',
            'Industria':         '={{ $json.industria }}',
            'Descripcion':       '={{ $json.descripcion }}',
            'Propuesta Valor':   '={{ $json.propuesta }}',
            'Website':           '={{ $json.website }}',
            'Ciudad':            '={{ $json.ciudad }}',
            'Competidores':      '={{ $json.competidores }}',
            'Color Primario':    '={{ $json.colorPrimario }}',
            'Color Secundario':  '={{ $json.colorSecundario }}',
            'Tipo Principal':    '={{ $json.tipoPrincipal }}',
            'Tono':              '={{ $json.tono }}',
            'Prohibido':         '={{ $json.prohibido }}',
            'Cliente Ideal':     '={{ $json.clienteIdeal }}',
            'Pilares':           '={{ $json.pilares }}',
            'Redes Sociales':    '={{ $json.redes }}',
            'Instagram':         '={{ $json.handleInstagram }}',
            'LinkedIn':          '={{ $json.handleLinkedin }}',
            'Objetivo':          '={{ $json.objetivo }}',
            'Presupuesto':       '={{ $json.presupuesto }}',
            'CRM':               '={{ $json.crm }}',
            'Contacto Nombre':   '={{ $json.contactoNombre }}',
            'Contacto Cargo':    '={{ $json.contactoCargo }}',
            'Contacto Email':    '={{ $json.contactoEmail }}',
            'Contacto WhatsApp': '={{ $json.contactoWA }}',
            'Aprueba':           '={{ $json.aprueba }}',
            'Frecuencia':        '={{ $json.frecuencia }}',
            'Notas':             '={{ $json.notas }}',
            'Fecha Alta':        '={{ $json.fecha }}'
          }
        }
      }
    },
    // Code: build welcome WhatsApp message
    {
      id: 'code-welcome',
      name: 'Armar Bienvenida',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [720, 340],
      parameters: {
        mode: 'runOnceForAllItems',
        jsCode: buildWelcomeCode
      }
    },
    // Evolution API: send WhatsApp welcome
    {
      id: 'wa-welcome',
      name: 'WhatsApp Bienvenida',
      type: 'n8n-nodes-evolution-api.evolutionApi',
      typeVersion: 1,
      position: [960, 340],
      credentials: {
        evolutionApi: { id: EVOLUTION_CRED_ID, name: 'Evolution API MentorIA' }
      },
      parameters: {
        resource: 'messages-api',
        instanceName: EVOLUTION_INSTANCE,
        remoteJid: '={{ $json.phone }}@s.whatsapp.net',
        messageText: '={{ $json.message }}',
        options_message: {}
      }
    },
    // Respond to POST with OK
    {
      id: 'resp-post',
      name: 'Responder OK',
      type: 'n8n-nodes-base.respondToWebhook',
      typeVersion: 1,
      position: [1200, 340],
      parameters: {
        respondWith: 'json',
        responseCode: 200,
        responseBody: '={"ok":true,"empresa":"{{ $json.empresa }}"}',
        options: {}
      }
    }
  ];

  const connections = {
    'GET Onboarding Form':   { main: [[{ node: 'Servir HTML',           type: 'main', index: 0 }]] },
    'Servir HTML':           { main: [[{ node: 'Responder HTML',        type: 'main', index: 0 }]] },
    'POST Onboarding Submit':{ main: [[{ node: 'Parsear Formulario',    type: 'main', index: 0 }]] },
    'Parsear Formulario':    { main: [[{ node: 'Guardar en Airtable',   type: 'main', index: 0 }]] },
    'Guardar en Airtable':   { main: [[{ node: 'Armar Bienvenida',      type: 'main', index: 0 }]] },
    'Armar Bienvenida':      { main: [[{ node: 'WhatsApp Bienvenida',   type: 'main', index: 0 }]] },
    'WhatsApp Bienvenida':   { main: [[{ node: 'Responder OK',          type: 'main', index: 0 }]] }
  };

  const workflowPayload = {
    name: 'Onboarding — Formulario Alta Cliente',
    nodes,
    connections,
    settings: { executionOrder: 'v1' },
    staticData: null
  };

  console.log('Creating n8n workflow...');
  const res = await fetch(`${N8N_API}/workflows`, {
    method: 'POST',
    headers: {
      'X-N8N-API-KEY': N8N_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(workflowPayload)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`n8n create workflow failed ${res.status}: ${err}`);
  }

  const wf = await res.json();
  console.log('✅ Workflow created! ID:', wf.id, '| Name:', wf.name);

  // Activate
  const actRes = await fetch(`${N8N_API}/workflows/${wf.id}/activate`, {
    method: 'POST',
    headers: { 'X-N8N-API-KEY': N8N_KEY }
  });

  if (!actRes.ok) {
    const err = await actRes.text();
    console.warn('⚠️  Activation failed:', err);
  } else {
    console.log('✅ Workflow activated!');
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔗 LINK DEL FORMULARIO PARA EL CLIENTE:');
  console.log('https://prueba-digisaurios-n8n.4jvoco.easypanel.host/webhook/onboarding');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

createWorkflow().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
