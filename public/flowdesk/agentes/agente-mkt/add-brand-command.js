const N8N_API = 'https://prueba-digisaurios-n8n.4jvoco.easypanel.host/api/v1';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmY5MjkzMC0yYjk1LTRmNjAtODViOC0xZjYwNTFkNzhjMGUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc1NjEyODI0fQ.s4_wwDB_Xjwlg29cdfePqLZYZ0sDma9IBhsH1PNL5X4';
const WF_ID = 'fiU0ac3bSRkLGhaC';

// ─── UPDATED EXTRACT — adds isMarca ──────────────────────────────────────────
const extractCode = `const body = $input.first().json.body;
const data = body.data || {};
const msg = data.message || {};

const text = msg.conversation ||
             msg.extendedTextMessage?.text ||
             msg.imageMessage?.caption || '';

const from = data.key?.remoteJid || '';
const phone = from.replace('@s.whatsapp.net','').replace('@g.us','');
const t = text.toLowerCase().trim();

return [{ json: {
  text: text.trim(),
  phone,
  from,
  isGroup: from.includes('@g.us'),
  pushName: data.pushName || 'Sin nombre',
  isBrief:          t.startsWith('brief:') || t.startsWith('brief '),
  isContentRequest: t.startsWith('contenido:') || t.includes('genera contenido'),
  isApproval:       t.startsWith('apruebo') && !t.startsWith('apruebo plan'),
  isChange:         t.startsWith('cambio') && !t.startsWith('cambio dc'),
  isDesign:         t === 'diseño' || t === 'diseno',
  isDisenoListo:    t.startsWith('diseño listo') || t.startsWith('diseno listo'),
  isDcOk:           t.startsWith('dc ok') || t.startsWith('dc apruebo'),
  isDcCambio:       t.startsWith('dc cambio'),
  isCliente:        t === 'cliente',
  isMarca:          t.startsWith('marca:') || t.startsWith('marca '),
  isBlog:           t.startsWith('blog:'),
  isScript:         t.startsWith('script:'),
  isEstado:         t === 'estado',
  raw: body
}}];`;

// ─── BRAND MANUAL PROMPT ──────────────────────────────────────────────────────
const brandPrompt = `=Eres un experto en branding y comunicación de marca con 20 años de experiencia en empresas tecnológicas latinoamericanas.

El cliente te da el siguiente contexto de su empresa:
{{ $json.text.replace(/^marca:/i, '').replace(/^marca /i, '').trim() }}

DATOS ADICIONALES DE LA MARCA (si los tienes):
Nombre: MentorIA Systems
Tagline: inteligencia humana, potencia artificial
Paleta extraída del logo: Azul profundo #1B4FD8, Azul claro #5BC8F5, Azul medio #3A86D4, Gris carbón #4A4A4A, Blanco #FFFFFF
Descripción: Ecosistemas digitales inteligentes para empresas. Conecta IA + herramientas actuales + equipo humano. Elimina puestos automatizables. Propuesta: no somos un gasto, somos un ahorro.

Genera DOS documentos completos en formato texto estructurado:

═══════════════════════════════════════
DOCUMENTO 1 — MANUAL DE IDENTIDAD DE MARCA
═══════════════════════════════════════

## 1. ESENCIA DE MARCA
- Misión (1 oración)
- Visión (1 oración)
- Valores (5 valores con descripción breve)
- Propuesta de valor única (2-3 oraciones)
- Posicionamiento (vs competencia)

## 2. PERSONALIDAD DE MARCA
- Arquetipo de marca (de los 12 arquetipos de Jung)
- 5 adjetivos que definen la personalidad
- 5 adjetivos que NUNCA describe a la marca
- Voz y tono: cómo habla la marca en cada contexto (formal/informal, digital/presencial)

## 3. IDENTIDAD VISUAL
- Paleta de colores primaria: nombre, HEX, RGB, uso
- Paleta de colores secundaria: nombre, HEX, uso
- Tipografía principal: nombre, variantes, cuándo usar
- Tipografía secundaria: nombre, variantes, cuándo usar
- Espaciado y proporciones
- Elementos gráficos de la marca (iconos, patrones, formas)

## 4. LOGOTIPO
- Descripción del logotipo y sus elementos
- Versiones permitidas (positivo, negativo, monocromático)
- Tamaño mínimo
- Zona de respeto (espacio alrededor del logo)
- Usos incorrectos del logotipo (6 ejemplos)

## 5. FOTOGRAFÍA E IMÁGENES
- Estilo fotográfico (3 párrafos)
- Tipos de imágenes permitidas
- Tipos de imágenes prohibidas
- Tratamiento de color en fotos
- Composición recomendada

## 6. VOZ ESCRITA
- Nivel de formalidad
- Longitud de textos por formato
- Puntuación y estilo
- Palabras y frases características
- Palabras y frases prohibidas

═══════════════════════════════════════
DOCUMENTO 2 — MANUAL DE USO DE MARCA EN REDES SOCIALES
═══════════════════════════════════════

## 1. ESTRATEGIA POR RED SOCIAL

### LinkedIn (prioridad 1)
- Objetivo de la red para esta marca
- Frecuencia ideal
- Formatos a usar
- Tono específico para LinkedIn
- Ejemplos de títulos de posts que funcionan para esta marca
- Qué NO publicar en LinkedIn

### Instagram (prioridad 2)
- Objetivo de la red
- Frecuencia ideal
- Formatos a usar (posts, reels, stories, carruseles)
- Estética del feed (coherencia visual, paleta, filtros)
- Tono específico para Instagram
- Estrategia de hashtags (categorías y cantidad)
- Qué NO publicar en Instagram

### YouTube (prioridad 3)
- Objetivo del canal
- Frecuencia ideal
- Tipos de videos (educativo, opinión, caso de estudio, tutorial)
- Estructura recomendada de video
- Thumbnails: estilo, tipografía, colores
- Descripción SEO tipo

### Facebook
- Objetivo y audiencia específica en esta red
- Frecuencia y formatos

### Twitter/X
- Objetivo (thought leadership)
- Frecuencia y tipo de contenido
- Estilo de threads

## 2. PILARES DE CONTENIDO
5 pilares con:
- Nombre del pilar
- Descripción y objetivo
- Tipos de contenido bajo ese pilar
- Ejemplos de temas concretos (3 por pilar)
- Frecuencia semanal sugerida

## 3. CALENDARIO EDITORIAL TIPO (semana estándar)
Tabla día a día: qué publicar, en qué red, qué tipo de contenido

## 4. REGLAS DE COMUNIDAD
- Cómo responder comentarios positivos
- Cómo manejar críticas o comentarios negativos
- Cómo manejar preguntas de ventas en comentarios
- Tiempo máximo de respuesta
- Qué nunca responder

## 5. MÉTRICAS Y KPIs
- KPI principal por red
- Frecuencia de revisión
- Qué hacer si el engagement baja

## 6. CHECKLIST ANTES DE PUBLICAR
Lista de verificación de 10 puntos para cada publicación

Genera ambos documentos completos, detallados y listos para usar por el equipo.`;

// ─── PARSE BRAND DOCS AND SAVE TO AIRTABLE ───────────────────────────────────
const parseBrandCode = `const raw = $input.first().json.text || '';
const phone = $('Extraer Datos del Mensaje').first().json.phone;

// Split into two documents
const doc1Match = raw.match(/DOCUMENTO 1[\\s\\S]*?(?=DOCUMENTO 2|$)/i);
const doc2Match = raw.match(/DOCUMENTO 2[\\s\\S]*/i);

const manualIdentidad = doc1Match ? doc1Match[0].trim() : raw;
const manualRedes = doc2Match ? doc2Match[0].trim() : '';

return [{
  json: {
    phone,
    manualIdentidad,
    manualRedes,
    totalChars: raw.length
  }
}];`;

// ─── NEW NODES ────────────────────────────────────────────────────────────────
const newNodes = [
  {
    id: 'claude_model_marca',
    name: 'Claude — Modelo Marca',
    type: '@n8n/n8n-nodes-langchain.lmChatAnthropic',
    typeVersion: 1.2,
    position: [1160, 2400],
    parameters: {
      model: 'claude-sonnet-4-5',
      options: { maxTokensToSample: 16000 }
    },
    credentials: { anthropicApi: { id: 'z0YdT9oApiWKr4Eq', name: 'Anthropic MentorIA' } }
  },
  {
    id: 'generar_manuales',
    name: 'Generar Manuales de Marca',
    type: '@n8n/n8n-nodes-langchain.chainLlm',
    typeVersion: 1.4,
    position: [1400, 2400],
    parameters: { promptType: 'define', text: brandPrompt }
  },
  {
    id: 'parsear_manuales',
    name: 'Parsear Manuales',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [1640, 2400],
    parameters: { jsCode: parseBrandCode }
  },
  {
    id: 'guardar_manual_identidad',
    name: 'Guardar Manual Identidad',
    type: 'n8n-nodes-base.airtable',
    typeVersion: 2.1,
    position: [1880, 2400],
    parameters: {
      operation: 'create',
      base: { __rl: true, value: 'appgS6jdmiMsGQyIF', mode: 'id' },
      table: { __rl: true, value: 'tbl45sIHzsJtNix3M', mode: 'id' },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          'Cliente':             '=MentorIA Systems',
          'Fecha Llamada':       '={{ $now.toISODate() }}',
          'Brief Enriquecido IA':'={{ $json.manualIdentidad }}',
          'Estado':              'Llamada realizada'
        }
      }
    },
    credentials: { airtableTokenApi: { id: 'NbV3Gvv9v4DmaR9c', name: 'Airtable MentorIA' } }
  },
  {
    id: 'guardar_manual_redes',
    name: 'Guardar Manual Redes',
    type: 'n8n-nodes-base.airtable',
    typeVersion: 2.1,
    position: [2120, 2400],
    parameters: {
      operation: 'create',
      base: { __rl: true, value: 'appgS6jdmiMsGQyIF', mode: 'id' },
      table: { __rl: true, value: 'tbl45sIHzsJtNix3M', mode: 'id' },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          'Cliente':             '=MentorIA Systems — Manual Redes',
          'Fecha Llamada':       '={{ $now.toISODate() }}',
          'Brief Enriquecido IA':'={{ $json.manualRedes }}',
          'Estado':              'Llamada realizada'
        }
      }
    },
    credentials: { airtableTokenApi: { id: 'NbV3Gvv9v4DmaR9c', name: 'Airtable MentorIA' } }
  },
  {
    id: 'wa_manuales_listos',
    name: 'WhatsApp — Manuales Listos',
    type: 'n8n-nodes-evolution-api.evolutionApi',
    typeVersion: 1,
    position: [2360, 2400],
    parameters: {
      resource: 'messages-api',
      instanceName: 'mentoria-manolo',
      remoteJid: "={{ $json.phone + '@s.whatsapp.net' }}",
      messageText: `=📘 *Manuales de marca generados* ✅

Se crearon 2 documentos completos para MentorIA Systems:

1️⃣ *Manual de Identidad de Marca*
Esencia, personalidad, paleta, tipografía, logotipo, fotografía y voz escrita.

2️⃣ *Manual de Uso en Redes Sociales*
Estrategia por red, pilares de contenido, calendario tipo, reglas de comunidad, métricas y checklist de publicación.

👉 Ambos en Airtable → Onboarding:
https://airtable.com/appgS6jdmiMsGQyIF/tbl45sIHzsJtNix3M

{{ $json.totalChars > 10000 ? '✅ Documentos completos (' + Math.round($json.totalChars/1000) + 'k caracteres)' : '⚠️ Documentos generados' }}`,
      options_message: {}
    },
    credentials: { evolutionApi: { id: '25MBOz6svtSJ3wEE', name: 'Evolution API MentorIA' } }
  }
];

async function fix() {
  const res = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    headers: { 'X-N8N-API-KEY': N8N_KEY }
  });
  const wf = await res.json();
  console.log('Fetched:', wf.name, '— nodes:', wf.nodes.length);

  // 1. Update extract node
  const extractNode = wf.nodes.find(n => n.name === 'Extraer Datos del Mensaje');
  if (extractNode) {
    extractNode.parameters.jsCode = extractCode;
    console.log('✅ Updated Extraer Datos del Mensaje (+isMarca)');
  }

  // 2. Update router
  const router = wf.nodes.find(n => n.name === 'Router de Comandos');
  if (router) {
    const existing = router.parameters.rules.values.filter(r => r.outputKey !== 'marca');
    router.parameters.rules.values = [
      ...existing,
      {
        conditions: {
          options: { caseSensitive: false, leftValue: '', typeValidation: 'loose' },
          conditions: [{ id: 'j', leftValue: '={{ $json.isMarca }}', rightValue: true, operator: { type: 'boolean', operation: 'equals' } }],
          combinator: 'and'
        },
        renameOutput: true,
        outputKey: 'marca'
      }
    ];
    console.log('✅ Router updated —', router.parameters.rules.values.length, 'routes');
  }

  // 3. Add new nodes
  for (const node of newNodes) {
    const exists = wf.nodes.find(n => n.name === node.name);
    if (!exists) { wf.nodes.push(node); console.log('➕', node.name); }
    else { Object.assign(exists, node); console.log('🔄', node.name); }
  }

  // 4. Wire connections
  const c = wf.connections;
  const currentMain = c['Router de Comandos']?.main || [];
  while (currentMain.length < 10) currentMain.push([]);
  currentMain[9] = [{ node: 'Generar Manuales de Marca', type: 'main', index: 0 }];
  c['Router de Comandos'] = { main: currentMain };

  c['Claude — Modelo Marca']    = { ai_languageModel: [[{ node: 'Generar Manuales de Marca', type: 'ai_languageModel', index: 0 }]] };
  c['Generar Manuales de Marca']= { main: [[{ node: 'Parsear Manuales', type: 'main', index: 0 }]] };
  c['Parsear Manuales']         = { main: [[{ node: 'Guardar Manual Identidad', type: 'main', index: 0 }]] };
  c['Guardar Manual Identidad'] = { main: [[{ node: 'Guardar Manual Redes', type: 'main', index: 0 }]] };
  c['Guardar Manual Redes']     = { main: [[{ node: 'WhatsApp — Manuales Listos', type: 'main', index: 0 }]] };

  const upd = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': N8N_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: { executionOrder: 'v1' } })
  });
  const r = await upd.json();
  if (r.id) {
    console.log('\n✅ Comando "marca:" activo —', r.nodes?.length, 'nodes totales');
    console.log('\nUso por WhatsApp:');
    console.log('  marca: MentorIA Systems');
    console.log('\nGenera y guarda en Airtable:');
    console.log('  • Manual de Identidad de Marca (~8,000 palabras)');
    console.log('  • Manual de Uso en Redes Sociales (~5,000 palabras)');
    console.log('\n⚠️  Unpublish → Publish en n8n UI');
  } else {
    console.error('❌', JSON.stringify(r, null, 2));
  }
}
fix();
