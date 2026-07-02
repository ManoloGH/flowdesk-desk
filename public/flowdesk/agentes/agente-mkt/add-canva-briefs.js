const N8N_API = 'https://prueba-digisaurios-n8n.4jvoco.easypanel.host/api/v1';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmY5MjkzMC0yYjk1LTRmNjAtODViOC0xZjYwNTFkNzhjMGUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc1NjEyODI0fQ.s4_wwDB_Xjwlg29cdfePqLZYZ0sDma9IBhsH1PNL5X4';
const WF_ID = 'fiU0ac3bSRkLGhaC';

// ─── UPDATED VISUAL BRIEF PROMPT — now includes full Canva instructions ────────
const briefVisualPrompt = `=Eres un director de arte experto en diseño digital y redes sociales. Genera el brief visual completo para esta pieza.

PIEZA:
Número: {{ $json.numero }}
Día: {{ $json.dia }}
Tipo: {{ $json.tipo }}
Tema: {{ $json.tema }}
Copy Instagram: {{ $json.copy_instagram || $json.fields?.['Copy'] || '' }}
Script Narración: {{ $json.script_narracion || $json.fields?.['Script Narración'] || '' }}

Genera este JSON exacto:
{
  "numero": {{ $json.numero || 1 }},
  "tipo": "{{ $json.tipo }}",
  "concepto_visual": "Qué emoción transmite. Qué ve el usuario en los primeros 2 segundos.",
  "paleta": ["#hex1", "#hex2", "#hex3"],
  "texto_overlay": "Máx 7 palabras para superponer",
  "estilo": "minimalista/vibrante/editorial/orgánico/cinematográfico",

  "prompt_flux": "Ultra-detailed English prompt for Flux Pro. Subject, setting, lighting, mood, camera angle, lens, style (photorealistic/editorial/commercial). No text in image. 60-80 words.",

  "canva_instrucciones": {
    "formato": "Post 1080x1080 / Story 1080x1920 / Carrusel 1080x1080 / Banner 1200x628",
    "plantilla_sugerida": "Nombre o descripción del tipo de plantilla a buscar en Canva (ej: 'Real estate luxury minimal' o 'Tech startup bold')",
    "fondo": "Instrucción exacta: color sólido #hex / gradiente de #hex1 a #hex2 / foto de la imagen IA generada / textura sugerida",
    "imagen_principal": "Dónde va la imagen IA: centrada / fondo completo / esquina derecha / círculo recortado. Opacidad si aplica.",
    "texto_headline": "Texto principal exacto, fuente sugerida (ej: Montserrat Bold / Playfair Display), tamaño relativo (grande/mediano), color #hex, posición (arriba centrado / abajo izquierda)",
    "texto_secundario": "Texto secundario o subtítulo, fuente, tamaño, color, posición",
    "logo": "Posición del logo: esquina inferior derecha / superior izquierda, tamaño pequeño/mediano",
    "elementos_graficos": "Formas, líneas, iconos o elementos decorativos a agregar (ej: 'línea dorada horizontal debajo del headline' / 'círculo semitransparente detrás del texto')",
    "filtro_imagen": "Si aplica: oscurecer imagen al 30% / añadir overlay de color #hex al 20% / sin filtro",
    "exportar": "Formato y specs de exportación: JPG 1080x1080 / PNG transparente / MP4 para story"
  },

  "canva_pauta": {
    "diferencia_vs_organico": "Qué cambia para la versión de pauta vs orgánico",
    "formato_ad": "Feed 1:1 / Story 9:16 / Banner 1.91:1",
    "cta_boton": "Texto del botón CTA si aplica (Saber más / Cotizar / Ver proyecto)",
    "elementos_extra": "Elementos adicionales para la versión de pauta: badge de precio / urgencia / garantía"
  },

  "prompt_flux": "Ultra-detailed English prompt for Flux Pro image generation. Include: subject, setting, lighting (golden hour/studio/natural), mood, camera angle, lens, style. No text in image. 60-80 words.",

  "prompt_kling": "English prompt for Kling AI video reel. Cinematic vertical 9:16. Describe: opening scene, camera movement (slow push in/parallax/orbit), subject motion, lighting, atmosphere, ending frame. 50-70 words.",

  "prompt_sora": "English prompt for Sora 2. Cinematic 16:9, 30-second video. Scene description, camera movements, lighting changes. 80-100 words.",

  "elevenlabs_script": "Narration text, 30-45 seconds. Natural, conversational Spanish. No stage directions.",

  "heygen_script": "Full YouTube script. Hook (15s) + Problem (45s) + Value/Solution (4min) + CTA (15s). Include [PAUSA] markers. ~5 min read.",

  "midjourney_prompt": "Midjourney v7 prompt for PAID AD version. Maximum aesthetic quality. --ar 4:5 --v 7 --q 2 --style raw. 80-100 words.",

  "instrucciones_disenador": "Lista numerada de pasos concretos para el diseñador. Qué hacer después de tener la imagen IA: 1) ... 2) ... 3) ... 4) Exportar como ..."
}

Responde SOLO con el JSON.`;

// ─── UPDATED PARSEAR BRIEF — includes Canva fields ────────────────────────────
const parsearBriefCode = `const raw = $input.first().json.text;
const prev = $('Preparar Contexto Pieza').item.json;
let brief;
try {
  const clean = raw.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
  const match = clean.match(/\\{[\\s\\S]*\\}/);
  brief = match ? JSON.parse(match[0]) : {};
} catch(e) {
  brief = {};
}

const tipo = (prev.tipo || brief.tipo || '').toLowerCase();
const esReel = tipo.includes('reel') || tipo.includes('story');
const esVideo = tipo.includes('video') && !tipo.includes('youtube');
const esYoutube = tipo.includes('youtube');

// Format Canva instructions as readable text
const canva = brief.canva_instrucciones || {};
const canvaText = [
  '━━ CANVA — ORGÁNICO ━━',
  'Formato: ' + (canva.formato || ''),
  'Plantilla: buscar "' + (canva.plantilla_sugerida || '') + '"',
  'Fondo: ' + (canva.fondo || ''),
  'Imagen IA: ' + (canva.imagen_principal || ''),
  'Headline: ' + (canva.texto_headline || ''),
  'Subtítulo: ' + (canva.texto_secundario || ''),
  'Logo: ' + (canva.logo || ''),
  'Elementos: ' + (canva.elementos_graficos || ''),
  'Filtro: ' + (canva.filtro_imagen || ''),
  'Exportar: ' + (canva.exportar || ''),
  '',
  '━━ CANVA — PAUTA ━━',
  (brief.canva_pauta?.diferencia_vs_organico || ''),
  'Formato ad: ' + (brief.canva_pauta?.formato_ad || ''),
  'CTA: ' + (brief.canva_pauta?.cta_boton || ''),
  'Extra: ' + (brief.canva_pauta?.elementos_extra || '')
].filter(Boolean).join('\\n');

const briefText = [
  'CONCEPTO: ' + (brief.concepto_visual || ''),
  'PALETA: ' + (Array.isArray(brief.paleta) ? brief.paleta.join(', ') : ''),
  'TEXTO OVERLAY: ' + (brief.texto_overlay || ''),
  'ESTILO: ' + (brief.estilo || ''),
  '',
  canvaText,
  '',
  '━━ PROMPTS IA ━━',
  'FLUX PRO:',
  (brief.prompt_flux || ''),
  '',
  esReel ? ('KLING REEL:\\n' + (brief.prompt_kling || '')) : '',
  esVideo ? ('SORA 2:\\n' + (brief.prompt_sora || '')) : '',
  '',
  '━━ MIDJOURNEY (PAUTA) ━━',
  (brief.midjourney_prompt || ''),
  '',
  '━━ INSTRUCCIONES DISEÑADOR ━━',
  (brief.instrucciones_disenador || '')
].filter(Boolean).join('\\n');

return [{
  json: {
    recordId: prev.recordId,
    numero: prev.numero || brief.numero || 1,
    phone: prev.phone,
    tema: prev.tema,
    dia: prev.dia,
    tipo: prev.tipo,
    esReel, esVideo, esYoutube,
    promptFlux: brief.prompt_flux || '',
    promptKling: brief.prompt_kling || '',
    promptSora: brief.prompt_sora || '',
    elevenlabsScript: brief.elevenlabs_script || '',
    heygenScript: brief.heygen_script || '',
    midjourneyPrompt: brief.midjourney_prompt || '',
    instruccionesDisenador: brief.instrucciones_disenador || '',
    canvaInstrucciones: canvaText,
    concepto: brief.concepto_visual || '',
    paleta: Array.isArray(brief.paleta) ? brief.paleta.join(', ') : '',
    textoOverlay: brief.texto_overlay || '',
    briefText
  }
}];`;

// ─── UPDATED GUARDAR BRIEF — saves Canva instructions ─────────────────────────
const guardarBriefColumns = {
  mappingMode: 'defineBelow',
  value: {
    'Brief Visual':    '={{ $json.briefText }}',
    'Prompt IA':       '={{ $json.promptFlux }}',
    'URL Asset Final': '={{ $json.imageUrl || "" }}',
    'URL Video':       '={{ $json.videoUrl || "" }}',
    'Estado':          'En diseño'
  }
};

// ─── UPDATED DESIGNER WA — includes Canva instructions ────────────────────────
const waDesignerMessage = `=🎨 *Tarea de diseño — Pieza {{ $json.numero }}*
*{{ $json.tema }}* | {{ $json.tipo }} | {{ $json.dia }}

━━━━━━━━━━━━━━━
*ASSET IA GENERADO:*
{{ $json.imageUrl ? '📸 ' + $json.imageUrl : ($json.videoUrl ? '🎬 ' + $json.videoUrl : 'Pendiente de generación') }}

━━━━━━━━━━━━━━━
*CANVA — INSTRUCCIONES:*
{{ $json.canvaInstrucciones }}

━━━━━━━━━━━━━━━
*TEXTO OVERLAY:* {{ $json.textoOverlay }}
*PALETA:* {{ $json.paleta }}

━━━━━━━━━━━━━━━
*MIDJOURNEY (versión pauta):*
{{ $json.midjourneyPrompt }}

━━━━━━━━━━━━━━━
*INSTRUCCIONES FINALES:*
{{ $json.instruccionesDisenador }}

Brief completo + todos los prompts:
👉 https://airtable.com/appgS6jdmiMsGQyIF/tblSrW7hpZzIFkfZ2

Cuando termines → *diseño listo {{ $json.numero }}*`;

async function fix() {
  const res = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    headers: { 'X-N8N-API-KEY': N8N_KEY }
  });
  const wf = await res.json();
  console.log('Fetched:', wf.name, '— nodes:', wf.nodes.length);

  // 1. Update brief visual prompt
  const briefNode = wf.nodes.find(n => n.name === 'Generar Brief Visual');
  if (briefNode) {
    briefNode.parameters.text = briefVisualPrompt;
    const modelNode = wf.nodes.find(n => n.name === 'Claude — Modelo Diseño');
    if (modelNode) modelNode.parameters.options = { maxTokensToSample: 4000 };
    console.log('✅ Updated Generar Brief Visual (+ Canva instructions)');
  }

  // 2. Update parsear brief
  const parsearNode = wf.nodes.find(n => n.name === 'Parsear Brief Visual');
  if (parsearNode) {
    parsearNode.parameters.jsCode = parsearBriefCode;
    console.log('✅ Updated Parsear Brief Visual');
  }

  // 3. Update guardar brief
  const guardarNode = wf.nodes.find(n => n.name === 'Guardar Brief en Pieza');
  if (guardarNode) {
    guardarNode.parameters.columns = guardarBriefColumns;
    console.log('✅ Updated Guardar Brief en Pieza');
  }

  // 4. Update WA to designer
  const waNode = wf.nodes.find(n => n.name === 'WhatsApp — Briefs Listos');
  if (waNode) {
    waNode.parameters.messageText = waDesignerMessage;
    console.log('✅ Updated WhatsApp al Diseñador (+ Canva steps)');
  }

  // 5. Update Kling prompt field to use promptKling
  const klingNode = wf.nodes.find(n => n.name === 'Kling — Generar Reel');
  if (klingNode) {
    klingNode.parameters.bodyParameters.parameters = klingNode.parameters.bodyParameters.parameters.map(p =>
      p.name === 'prompt' ? { ...p, value: '={{ $json.promptKling || $json.promptFlux }}' } : p
    );
    console.log('✅ Updated Kling prompt field');
  }

  const upd = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': N8N_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: { executionOrder: 'v1' } })
  });
  const r = await upd.json();
  if (r.id) {
    console.log('\n✅ Canva briefs integrados —', r.nodes?.length, 'nodes');
    console.log('\nEl diseñador recibe por WhatsApp:');
    console.log('  • Asset IA generado (URL)');
    console.log('  • Instrucciones Canva paso a paso');
    console.log('  • Plantilla sugerida a buscar');
    console.log('  • Paleta, overlay, logo, filtros, exportación');
    console.log('  • Prompt Midjourney para versión pauta');
    console.log('  • Instrucciones finales numeradas');
  } else {
    console.error('❌', JSON.stringify(r, null, 2));
  }
}
fix();
