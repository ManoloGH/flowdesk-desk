const N8N_API = 'https://prueba-digisaurios-n8n.4jvoco.easypanel.host/api/v1';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmY5MjkzMC0yYjk1LTRmNjAtODViOC0xZjYwNTFkNzhjMGUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc1NjEyODI0fQ.s4_wwDB_Xjwlg29cdfePqLZYZ0sDma9IBhsH1PNL5X4';
const WF_ID = 'fiU0ac3bSRkLGhaC';

// ─── UPDATED CONTENT GENERATION PROMPT ────────────────────────────────────────
// Now generates multi-network copy in one shot

const contentPrompt = `=Eres un experto en marketing de contenidos para redes sociales. Genera una semana completa de contenido premium.

INSTRUCCIONES DEL CLIENTE:
{{ $json.text.replace(/contenido:/gi, '').trim() }}

Genera exactamente 7 piezas (una por día). Para cada pieza genera copies adaptados a CADA red social.

Responde SOLO con este JSON exacto:
{
  "semana": [
    {
      "numero": 1,
      "dia": "Lunes",
      "tipo": "Reel",
      "tema": "descripcion del tema",
      "hora": "18:00",
      "copies": {
        "instagram": "Copy completo para Instagram. Máx 2200 chars. Emojis. Llamada a acción. Saltos de línea para lectura. Termina con pregunta o CTA.",
        "facebook": "Copy para Facebook. Más extenso y narrativo que Instagram. Cuenta una historia. 300-500 palabras.",
        "linkedin": "Copy profesional para LinkedIn. Sin exceso de emojis. Insight de valor. Formato con bullets si aplica. 150-300 palabras.",
        "tiktok": "Copy muy corto para TikTok. Hook en primera línea. Máx 150 chars. Tono casual y directo.",
        "twitter": "Tweet de máximo 280 caracteres. Directo al punto. Un solo emoji si aplica.",
        "pinterest": "Descripción SEO para Pinterest. 200-500 palabras. Keywords naturales. Describe la imagen. Beneficio claro."
      },
      "hashtags": {
        "instagram": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
        "linkedin": ["#hashtag1", "#hashtag2", "#hashtag3"],
        "tiktok": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4"],
        "pinterest": ["#hashtag1", "#hashtag2", "#hashtag3"]
      },
      "script_narracion": "Texto de 30-60 segundos para narración en voz. Fluido, natural, conversacional. Solo el texto que se va a leer.",
      "descripcion_visual": "Descripción en español de la imagen o video ideal para esta pieza."
    }
  ]
}`;

// ─── UPDATED PARSER — handles multi-network structure ─────────────────────────
const parseCode = `const raw = $input.first().json.text;
const prev = $('Extraer Datos del Mensaje').first().json;
let semana = [];
try {
  const clean = raw.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
  const match = clean.match(/\\{[\\s\\S]*\\}/);
  const obj = match ? JSON.parse(match[0]) : {};
  semana = obj.semana || [];
} catch(e) {
  semana = [];
}
return semana.map((p, idx) => ({
  json: {
    ...p,
    numero: p.numero || (idx + 1),
    phone: prev.phone,
    // Flatten copies for Airtable fields
    copy_instagram: p.copies?.instagram || '',
    copy_facebook: p.copies?.facebook || '',
    copy_linkedin: p.copies?.linkedin || '',
    copy_tiktok: p.copies?.tiktok || '',
    copy_twitter: p.copies?.twitter || '',
    copy_pinterest: p.copies?.pinterest || '',
    copys_redes_json: JSON.stringify(p.copies || {}),
    hashtags_json: JSON.stringify(p.hashtags || {}),
    hashtags_instagram: (p.hashtags?.instagram || []).join(' '),
    script_narracion: p.script_narracion || '',
  }
}));`;

// ─── UPDATED AIRTABLE SAVE — saves all network copies ─────────────────────────
const airtableSaveColumns = {
  mappingMode: 'defineBelow',
  value: {
    'Número Pieza':     '={{ $json.numero }}',
    'Día':              '={{ $json.dia }}',
    'Hora Publicación': '={{ $json.hora }}',
    'Red Social':       '={{ $json.tipo === "Reel" ? "Instagram" : ($json.copies?.instagram ? "Instagram" : "Instagram") }}',
    'Tipo':             '={{ $json.tipo }}',
    'Concepto / Tema':  '={{ $json.tema }}',
    'Copy':             '={{ $json.copy_instagram }}',
    'Copy Facebook':    '={{ $json.copy_facebook }}',
    'Copy LinkedIn':    '={{ $json.copy_linkedin }}',
    'Copy TikTok':      '={{ $json.copy_tiktok }}',
    'Copy Twitter':     '={{ $json.copy_twitter }}',
    'Copy Pinterest':   '={{ $json.copy_pinterest }}',
    'Copys Redes':      '={{ $json.copys_redes_json }}',
    'Hashtags':         '={{ $json.hashtags_instagram }}',
    'Script Narración': '={{ $json.script_narracion }}',
    'Estado':           'Generado'
  }
};

async function fix() {
  const res = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    headers: { 'X-N8N-API-KEY': N8N_KEY }
  });
  const wf = await res.json();
  console.log('Fetched:', wf.name, '— nodes:', wf.nodes.length);

  // 1. Update content generation prompt
  const chainContent = wf.nodes.find(n => n.name === 'Generar Contenido con IA');
  if (chainContent) {
    chainContent.parameters.text = contentPrompt;
    // Increase tokens for larger output
    const modelContent = wf.nodes.find(n => n.name === 'Claude — Modelo Contenido');
    if (modelContent) modelContent.parameters.options = { maxTokensToSample: 16000 };
    console.log('✅ Updated content generation prompt (multi-network)');
  }

  // 2. Update parser
  const parseNode = wf.nodes.find(n => n.name === 'Parsear Contenido JSON');
  if (parseNode) {
    parseNode.parameters.jsCode = parseCode;
    console.log('✅ Updated Parsear Contenido JSON');
  }

  // 3. Update Airtable save columns
  const airtableNode = wf.nodes.find(n => n.name === 'Guardar Pieza en Airtable');
  if (airtableNode) {
    airtableNode.parameters.columns = airtableSaveColumns;
    console.log('✅ Updated Guardar Pieza en Airtable (all network copies)');
  }

  // 4. Update WA notification message to reflect multi-network
  const waNode = wf.nodes.find(n => n.name === 'WhatsApp — Contenido Listo');
  if (waNode) {
    waNode.parameters.messageText = `=🎨 *Contenido semanal listo* ✅

7 piezas generadas con copies para todas las redes:
📸 Instagram  📘 Facebook  💼 LinkedIn
🎵 TikTok  🐦 Twitter/X  📌 Pinterest

👉 Revisar en Plan de Contenido:
https://airtable.com/appgS6jdmiMsGQyIF/tblSrW7hpZzIFkfZ2

Cuando apruebes el copy → manda *diseño* para generar los visuales.`;
    console.log('✅ Updated WhatsApp notification message');
  }

  // Push update
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
  const result = await upd.json();
  if (result.id) {
    console.log('\n✅ Phase 2B done —', result.nodes?.length, 'nodes');
    console.log('Cada pieza ahora genera copies para 6 redes en un solo llamado a Claude');
  } else {
    console.error('❌', JSON.stringify(result, null, 2));
  }
}
fix();
