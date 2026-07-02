const N8N_API = 'https://prueba-digisaurios-n8n.4jvoco.easypanel.host/api/v1';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmY5MjkzMC0yYjk1LTRmNjAtODViOC0xZjYwNTFkNzhjMGUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc1NjEyODI0fQ.s4_wwDB_Xjwlg29cdfePqLZYZ0sDma9IBhsH1PNL5X4';
const WF_ID = 'fiU0ac3bSRkLGhaC';

// Split into 2 focused prompts — each under 4000 tokens output

const promptIdentidad = `=Eres un experto en branding. Genera el Manual de Identidad de Marca para esta empresa.

EMPRESA: {{ $json.text.replace(/^marca:/i, '').replace(/^marca /i, '').trim() }}

DATOS DEL LOGO Y MARCA:
- Nombre: MentorIA Systems
- Tagline: "inteligencia humana, potencia artificial"
- Logo: cerebro mitad orgánico + mitad circuitos digitales
- Paleta: Azul profundo #1B4FD8, Azul claro #5BC8F5, Gris carbón #4A4A4A, Blanco #FFFFFF
- Descripción: Ecosistemas digitales inteligentes para empresas. Conecta IA + herramientas actuales + equipo humano. Propuesta: no somos un gasto, somos un ahorro mediante eficiencia operativa.
- Cliente ideal: CEO/Director de empresa mediana en México (50-500 empleados)

Genera el Manual de Identidad completo con estas secciones:

# MANUAL DE IDENTIDAD — MentorIA Systems

## 1. ESENCIA DE MARCA
Misión, Visión, 5 Valores con descripción, Propuesta de valor única, Posicionamiento vs competencia

## 2. PERSONALIDAD DE MARCA
Arquetipo de Jung, 5 adjetivos que SÍ definen la marca, 5 adjetivos que NUNCA la describen, Voz y tono en cada contexto

## 3. IDENTIDAD VISUAL
Paleta primaria (nombre, HEX, RGB, cuándo usar cada color), Paleta secundaria, Tipografía principal y secundaria con usos

## 4. LOGOTIPO
Descripción de elementos, versiones permitidas, tamaño mínimo, zona de respeto, 6 usos incorrectos

## 5. FOTOGRAFÍA E IMÁGENES
Estilo fotográfico, tipos permitidos, tipos prohibidos, tratamiento de color, composición

## 6. VOZ ESCRITA
Nivel de formalidad, longitud por formato, puntuación, frases características, palabras prohibidas

Sé específico y detallado. Todo aplicado a MentorIA Systems.`;

const promptRedes = `=Eres un experto en estrategia de contenido digital. Genera el Manual de Uso de Marca en Redes Sociales.

EMPRESA: MentorIA Systems — Ecosistemas digitales inteligentes para empresas mexicanas
TAGLINE: "inteligencia humana, potencia artificial"
PALETA: #1B4FD8 (azul profundo), #5BC8F5 (azul claro), #4A4A4A (gris), #FFFFFF (blanco)
CLIENTE IDEAL: CEO/Director empresa mediana México
REDES ACTIVAS: LinkedIn, Instagram, YouTube, Facebook, Twitter/X, Blog
TONO: Directo, inteligente, habla de ROI no de tecnología. Como CFO no como ingeniero.

# MANUAL DE REDES SOCIALES — MentorIA Systems

## 1. ESTRATEGIA POR RED

### LinkedIn (prioridad 1)
Objetivo, frecuencia, formatos, tono específico, 5 ejemplos de títulos de posts, qué NO publicar

### Instagram (prioridad 2)
Objetivo, frecuencia, formatos (posts/reels/stories), estética del feed, tono, hashtags, qué NO publicar

### YouTube (prioridad 3)
Objetivo del canal, frecuencia, tipos de videos, estructura recomendada, thumbnails, descripción SEO tipo

### Facebook, Twitter/X
Objetivo, frecuencia, tipo de contenido

## 2. PILARES DE CONTENIDO
5 pilares, cada uno con: nombre, descripción, 3 ejemplos de temas concretos, frecuencia semanal

## 3. CALENDARIO EDITORIAL TIPO
Tabla completa de una semana: día, red, tipo de contenido, tema

## 4. REGLAS DE COMUNIDAD
Responder comentarios positivos, manejar críticas, preguntas de ventas, tiempo de respuesta, qué nunca responder

## 5. CHECKLIST ANTES DE PUBLICAR
10 puntos de verificación

Sé específico y práctico. Todo orientado a MentorIA Systems.`;

async function fix() {
  const res = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    headers: { 'X-N8N-API-KEY': N8N_KEY }
  });
  const wf = await res.json();
  console.log('Fetched:', wf.name, '— nodes:', wf.nodes.length);

  // 1. Reduce tokens and split into 2 focused prompts
  const modelMarca = wf.nodes.find(n => n.name === 'Claude — Modelo Marca');
  if (modelMarca) {
    modelMarca.parameters.options = { maxTokensToSample: 6000 }; // Reduced from 16000
    console.log('✅ Reduced Claude — Modelo Marca tokens to 6000');
  }

  // Update first chain to generate only identidad manual
  const generarManuales = wf.nodes.find(n => n.name === 'Generar Manuales de Marca');
  if (generarManuales) {
    generarManuales.parameters.text = promptIdentidad;
    console.log('✅ Updated Generar Manuales → only identidad (faster)');
  }

  // Add second Claude model + chain for redes
  const modelRedesExists = wf.nodes.find(n => n.name === 'Claude — Modelo Redes');
  const chainRedesExists = wf.nodes.find(n => n.name === 'Generar Manual Redes');

  if (!modelRedesExists) {
    wf.nodes.push({
      id: 'claude_model_redes',
      name: 'Claude — Modelo Redes',
      type: '@n8n/n8n-nodes-langchain.lmChatAnthropic',
      typeVersion: 1.2,
      position: [1160, 2560],
      parameters: {
        model: 'claude-sonnet-4-5',
        options: { maxTokensToSample: 6000 }
      },
      credentials: { anthropicApi: { id: 'z0YdT9oApiWKr4Eq', name: 'Anthropic MentorIA' } }
    });
    console.log('➕ Claude — Modelo Redes');
  }

  if (!chainRedesExists) {
    wf.nodes.push({
      id: 'chain_redes',
      name: 'Generar Manual Redes',
      type: '@n8n/n8n-nodes-langchain.chainLlm',
      typeVersion: 1.4,
      position: [1400, 2560],
      parameters: { promptType: 'define', text: promptRedes }
    });
    console.log('➕ Generar Manual Redes');
  } else {
    chainRedesExists.parameters.text = promptRedes;
  }

  // Update Parsear Manuales to only handle identidad output
  const parsearNode = wf.nodes.find(n => n.name === 'Parsear Manuales');
  if (parsearNode) {
    parsearNode.parameters.jsCode = `const raw = $input.first().json.text || '';
const phone = $('Extraer Datos del Mensaje').first().json.phone;
return [{ json: { phone, manualIdentidad: raw, totalChars: raw.length } }];`;
    console.log('✅ Updated Parsear Manuales (identidad only)');
  }

  // Add parsear redes node
  const parsearRedesExists = wf.nodes.find(n => n.name === 'Parsear Manual Redes');
  if (!parsearRedesExists) {
    wf.nodes.push({
      id: 'parsear_redes',
      name: 'Parsear Manual Redes',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [1640, 2560],
      parameters: {
        jsCode: `const raw = $input.first().json.text || '';
const phone = $('Extraer Datos del Mensaje').first().json.phone;
return [{ json: { phone, manualRedes: raw, totalChars: raw.length } }];`
      }
    });
    console.log('➕ Parsear Manual Redes');
  }

  // Wire new flow:
  // Router → Generar Manuales (identidad) → Parsear → Guardar Identidad → Generar Manual Redes → Parsear Redes → Guardar Redes → WA
  const c = wf.connections;
  c['Claude — Modelo Redes'] = { ai_languageModel: [[{ node: 'Generar Manual Redes', type: 'ai_languageModel', index: 0 }]] };
  c['Generar Manuales de Marca'] = { main: [[{ node: 'Parsear Manuales', type: 'main', index: 0 }]] };
  c['Parsear Manuales']          = { main: [[{ node: 'Guardar Manual Identidad', type: 'main', index: 0 }]] };
  c['Guardar Manual Identidad']  = { main: [[{ node: 'Generar Manual Redes', type: 'main', index: 0 }]] };
  c['Generar Manual Redes']      = { main: [[{ node: 'Parsear Manual Redes', type: 'main', index: 0 }]] };
  c['Parsear Manual Redes']      = { main: [[{ node: 'Guardar Manual Redes', type: 'main', index: 0 }]] };
  c['Guardar Manual Redes']      = { main: [[{ node: 'WhatsApp — Manuales Listos', type: 'main', index: 0 }]] };

  // Update WA message to use manualRedes field
  const waNode = wf.nodes.find(n => n.name === 'WhatsApp — Manuales Listos');
  if (waNode) {
    waNode.parameters.messageText = `=📘 *Manuales de marca listos* ✅

Se generaron 2 documentos para MentorIA Systems:

1️⃣ Manual de Identidad de Marca
2️⃣ Manual de Uso en Redes Sociales

👉 Revísalos en Airtable → Onboarding:
https://airtable.com/appgS6jdmiMsGQyIF/tbl45sIHzsJtNix3M`;
    console.log('✅ Updated WA message');
  }

  const upd = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': N8N_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: { executionOrder: 'v1' } })
  });
  const r = await upd.json();
  if (r.id) {
    console.log('\n✅ Fixed —', r.nodes?.length, 'nodes');
    console.log('\nCambios:');
    console.log('  • Tokens reducidos: 16k → 6k por documento');
    console.log('  • Dos llamadas separadas en secuencia (no una gigante)');
    console.log('  • Cada manual tarda ~30-45s, total ~90s');
    console.log('\n⚠️  Unpublish → Publish y manda "marca: MentorIA Systems" de nuevo');
  } else {
    console.error('❌', JSON.stringify(r, null, 2));
  }
}
fix();
