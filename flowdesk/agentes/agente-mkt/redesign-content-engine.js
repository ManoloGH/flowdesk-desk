/**
 * REDISEÑO: Motor de Contenido Orgánico + Pauta + Revisión Mensual
 *
 * Cambios:
 * 1. contenido: → genera calendario orgánico + propuestas de pauta
 * 2. resultados: → DC alimenta métricas de pauta y CRM
 * 3. reporte: → genera presentación mensual con mejoras
 * 4. revision: → agente hace preguntas clave al DC
 * 5. Airtable: nuevos campos para pauta y tabla Resultados Mensuales
 */

const N8N_API = 'https://prueba-digisaurios-n8n.4jvoco.easypanel.host/api/v1';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmY5MjkzMC0yYjk1LTRmNjAtODViOC0xZjYwNTFkNzhjMGUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc1NjEyODI0fQ.s4_wwDB_Xjwlg29cdfePqLZYZ0sDma9IBhsH1PNL5X4';
const WF_ID = 'fiU0ac3bSRkLGhaC';
const AIRTABLE_KEY = process.env.AIRTABLE_API_KEY || 'YOUR_AIRTABLE_API_KEY';
const BASE = 'appgS6jdmiMsGQyIF';
const PLAN_TABLE = 'tblSrW7hpZzIFkfZ2';

// ─── NUEVO PROMPT: ORGÁNICO + PAUTA ──────────────────────────────────────────
const PROMPT_CONTENIDO = `=Eres el Director de Estrategia de Contenido de una agencia premium. Tu trabajo es proponer el mejor calendario posible combinando contenido orgánico y pauta pagada.

BRIEF DEL CLIENTE:
{{ $json.text.replace(/contenido:/gi, '').trim() }}

Genera una semana de contenido con DOS secciones:

━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECCIÓN 1: CALENDARIO ORGÁNICO (7 piezas, una por día)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contenido que construye comunidad, posicionamiento y confianza. Sin inversión publicitaria.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECCIÓN 2: PROPUESTAS DE PAUTA (3 campañas)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contenido diseñado para convertir. Cada campaña con objetivo claro, audiencia y presupuesto recomendado.

Responde SOLO con este JSON exacto:
{
  "organico": [
    {
      "numero": 1,
      "dia": "Lunes",
      "tipo": "Reel|Post|Carrusel|Story|YouTube",
      "tema": "Título del tema",
      "hora": "18:00",
      "pilar": "Educación|Prueba social|Marca personal|Detrás de cámaras|Oferta",
      "copies": {
        "instagram": "Copy completo. Máx 2200 chars. Emojis. CTA. Saltos de línea.",
        "facebook": "Copy narrativo 300-500 palabras. Cuenta una historia.",
        "linkedin": "Copy profesional. Sin exceso de emojis. Insight de valor. 150-300 palabras.",
        "tiktok": "Hook en primera línea. Máx 150 chars. Tono casual.",
        "twitter": "Máx 280 caracteres. Directo. Un emoji máximo.",
        "pinterest": "Descripción SEO 200-500 palabras. Keywords naturales."
      },
      "hashtags": {
        "instagram": ["#tag1","#tag2","#tag3","#tag4","#tag5"],
        "linkedin": ["#tag1","#tag2","#tag3"],
        "tiktok": ["#tag1","#tag2","#tag3"]
      },
      "script_narracion": "Texto 30-60 segundos para narración. Natural y conversacional.",
      "descripcion_visual": "Descripción de la imagen o video ideal.",
      "instrucciones_disenador": "1) HERRAMIENTA: Flux Pro (orgánico) o Kling (reel/video). 2) CONCEPTO: qué transmite en 2 segundos. 3) COMPOSICIÓN: elemento principal, fondo, texto overlay máx 7 palabras con fuente y color hex. 4) CANVA: plantilla, colores de paleta, posición logo esquina inferior derecha. 5) EXPORTAR: formato y resolución.",
      "midjourney_prompt": ""
    }
  ],
  "pauta": [
    {
      "numero": 1,
      "nombre_campana": "Nombre descriptivo de la campaña",
      "objetivo": "Awareness|Tráfico|Leads|Conversión",
      "plataforma": "Meta|TikTok Ads|LinkedIn Ads|Google",
      "formato": "Video|Imagen|Carrusel|Stories",
      "audiencia": "Descripción detallada del público objetivo",
      "presupuesto_diario_usd": 10,
      "duracion_dias": 7,
      "presupuesto_total_usd": 70,
      "copy_anuncio": {
        "headline": "Título del anuncio (máx 40 caracteres)",
        "texto_principal": "Cuerpo del anuncio. Directo, beneficio claro, urgencia.",
        "descripcion": "Texto debajo del headline (máx 30 caracteres)",
        "cta": "Más información|Comprar|Registrarse|Contactar"
      },
      "descripcion_visual": "Descripción del video o imagen para el diseñador.",
      "midjourney_prompt": "Prompt completo para Midjourney. Estilo profesional, marca, composición, iluminación, ratio --ar 9:16 o 1:1.",
      "kpis_objetivo": {
        "cpm_estimado_usd": 8,
        "ctr_objetivo": "2.5%",
        "cpl_objetivo_usd": 15,
        "alcance_estimado": 5000
      },
      "instrucciones_disenador": "Instrucciones específicas para el diseñador. Diferencia visual respecto al orgánico. Elementos de urgencia o prueba social a incluir."
    }
  ]
}`;

// ─── PARSEAR CONTENIDO (orgánico + pauta) ────────────────────────────────────
const PARSEAR_CODE = `const raw = $input.first().json.text;
const prev = $('Extraer Datos del Mensaje').first().json;
let organico = [];
let pauta = [];

try {
  const clean = raw.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
  const match = clean.match(/\\{[\\s\\S]*\\}/);
  const obj = match ? JSON.parse(match[0]) : {};
  organico = obj.organico || [];
  pauta = obj.pauta || [];
} catch(e) {
  organico = [];
  pauta = [];
}

const organicoPiezas = organico.map((p, idx) => ({
  json: {
    ...p,
    numero: p.numero || (idx + 1),
    phone: prev.phone,
    tipo_contenido: 'Orgánico',
    copy_instagram:  p.copies?.instagram || '',
    copy_facebook:   p.copies?.facebook  || '',
    copy_linkedin:   p.copies?.linkedin  || '',
    copy_tiktok:     p.copies?.tiktok    || '',
    copy_twitter:    p.copies?.twitter   || '',
    copy_pinterest:  p.copies?.pinterest || '',
    copys_redes_json: JSON.stringify(p.copies || {}),
    hashtags_json:    JSON.stringify(p.hashtags || {}),
    hashtags_instagram: (p.hashtags?.instagram || []).join(' '),
    script_narracion:   p.script_narracion || '',
    instrucciones_disenador: p.instrucciones_disenador || '',
    midjourney_prompt: p.midjourney_prompt || '',
  }
}));

const pautaPiezas = pauta.map((p, idx) => ({
  json: {
    numero: (organico.length + idx + 1),
    dia: 'Pauta',
    tipo: p.formato || 'Video',
    tema: p.nombre_campana || '',
    hora: '',
    tipo_contenido: 'Pauta',
    plataforma_pauta: p.plataforma || '',
    objetivo_pauta: p.objetivo || '',
    presupuesto_diario: p.presupuesto_diario_usd || 0,
    presupuesto_total: p.presupuesto_total_usd || 0,
    duracion_dias: p.duracion_dias || 7,
    audiencia_pauta: p.audiencia || '',
    copy_instagram: p.copy_anuncio?.headline || '',
    copy_facebook: p.copy_anuncio?.texto_principal || '',
    copy_linkedin: '',
    copy_tiktok: '',
    copy_twitter: '',
    copy_pinterest: '',
    copys_redes_json: JSON.stringify(p.copy_anuncio || {}),
    hashtags_json: '{}',
    hashtags_instagram: '',
    script_narracion: '',
    descripcion_visual: p.descripcion_visual || '',
    instrucciones_disenador: p.instrucciones_disenador || '',
    midjourney_prompt: p.midjourney_prompt || '',
    kpis_json: JSON.stringify(p.kpis_objetivo || {}),
    phone: prev.phone,
    pilar: 'Pauta',
    cta_pauta: p.copy_anuncio?.cta || '',
  }
}));

return [...organicoPiezas, ...pautaPiezas];`;

// ─── RESULTADOS: preguntas clave al DC ───────────────────────────────────────
const PREGUNTAS_REVISION = `=Genera un mensaje de WhatsApp estructurado y amigable para hacer la *Revisión Mensual* de {{ $('Extraer Datos del Mensaje').first().json.text.replace(/revision:/i,'').trim() }}.

El mensaje debe:
1. Saludar calurosamente
2. Hacer 6 preguntas específicas numeradas sobre:
   - Contenido orgánico más exitoso del mes
   - Métricas de alcance, engagement, seguidores ganados
   - Resultados de pauta (leads, CPC, conversiones)
   - Datos del CRM (pipeline generado, clientes nuevos)
   - Campañas o eventos del próximo mes
   - Cambios en producto/servicio/posicionamiento
3. Pedir que responda con el formato: "1) respuesta 2) respuesta..."
4. Tono cercano pero profesional

Máximo 300 palabras. Responde SOLO el texto del mensaje.`;

// ─── CÓDIGO: Parsear resultados del DC ───────────────────────────────────────
const PARSEAR_RESULTADOS_CODE = `const text = $input.first().json.text.replace(/resultados:/i,'').trim();
const phone = $input.first().json.phone;
const pushName = $input.first().json.pushName || '';

// Parse numbered responses "1) ... 2) ..."
const respuestas = {};
const matches = text.match(/(\\d+)\\)\\s*([^\\d)]+)/g) || [];
matches.forEach(m => {
  const num = m.match(/^(\\d+)/)?.[1];
  const val = m.replace(/^\\d+\\)\\s*/, '').trim();
  respuestas['r' + num] = val;
});

const now = new Date();
const mes = now.toLocaleString('es-MX', { month: 'long', year: 'numeric' });

return [{ json: {
  phone,
  pushName,
  mes,
  cliente: pushName,
  texto_completo: text,
  respuesta_1: respuestas.r1 || '',
  respuesta_2: respuestas.r2 || '',
  respuesta_3: respuestas.r3 || '',
  respuesta_4: respuestas.r4 || '',
  respuesta_5: respuestas.r5 || '',
  respuesta_6: respuestas.r6 || '',
  fecha: now.toISOString().split('T')[0]
} }];`;

// ─── REPORTE MENSUAL prompt ───────────────────────────────────────────────────
const PROMPT_REPORTE = `=Eres el Director de Estrategia de una agencia de contenido premium. Genera una Presentación de Resultados Mensual en formato WhatsApp (usa *negritas*, saltos de línea, emojis estratégicos).

DATOS DEL MES:
{{ $json.texto_completo }}

CLIENTE: {{ $json.cliente }}
MES: {{ $json.mes }}

La presentación debe tener estas secciones:

1. *RESUMEN EJECUTIVO* — 3 bullets de los logros más importantes
2. *RESULTADOS ORGÁNICOS* — métricas con contexto (bueno/mejorable)
3. *RESULTADOS PAUTA* — ROI, leads, costo por lead, lo que funcionó y lo que no
4. *INSIGHTS CRM* — relación entre contenido y ventas/pipeline
5. *TOP 3 CONTENIDOS* — qué funcionó mejor y por qué
6. *ANÁLISIS* — patrones encontrados, oportunidades detectadas
7. *PROPUESTAS DE MEJORA* — 5 acciones concretas para el próximo mes con justificación
8. *CALENDARIO SUGERIDO* — enfoque estratégico para el próximo mes

Tono: analítico, directo, orientado a resultados de negocio. No tecnología por tecnología.
Máximo 800 palabras. Responde SOLO el texto del reporte.`;

async function build() {
  const res = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    headers: { 'X-N8N-API-KEY': N8N_KEY }
  });
  const wf = await res.json();
  console.log('Fetched:', wf.nodes.length, 'nodes');

  // ── 1. Update contenido: prompt ─────────────────────────────────────────────
  const generar = wf.nodes.find(n => n.name === 'Generar Contenido con IA');
  if (generar) {
    generar.parameters.text = PROMPT_CONTENIDO;
    console.log('✅ Prompt contenido actualizado (orgánico + pauta)');
  }

  // ── 2. Update Parsear Contenido JSON ────────────────────────────────────────
  const parsear = wf.nodes.find(n => n.name === 'Parsear Contenido JSON');
  if (parsear) {
    parsear.parameters.jsCode = PARSEAR_CODE;
    console.log('✅ Parsear actualizado (organico + pauta arrays)');
  }

  // ── 3. Update Guardar Pieza en Airtable — add pauta fields ──────────────────
  const guardar = wf.nodes.find(n => n.name === 'Guardar Pieza en Airtable');
  if (guardar) {
    guardar.parameters.columns.value = {
      'Número Pieza':            '={{ $json.numero }}',
      'Día':                     '={{ $json.dia }}',
      'Hora Publicación':        '={{ $json.hora }}',
      'Tipo':                    '={{ $json.tipo }}',
      'Tipo Contenido':          '={{ $json.tipo_contenido }}',
      'Concepto / Tema':         '={{ $json.tema }}',
      'Pilar':                   '={{ $json.pilar }}',
      'Copy':                    '={{ $json.copy_instagram }}',
      'Copy Facebook':           '={{ $json.copy_facebook }}',
      'Copy LinkedIn':           '={{ $json.copy_linkedin }}',
      'Copy TikTok':             '={{ $json.copy_tiktok }}',
      'Copy Twitter':            '={{ $json.copy_twitter }}',
      'Copy Pinterest':          '={{ $json.copy_pinterest }}',
      'Copys Redes':             '={{ $json.copys_redes_json }}',
      'Hashtags':                '={{ $json.hashtags_instagram }}',
      'Script Narración':        '={{ $json.script_narracion }}',
      'Instrucciones Diseñador': '={{ $json.instrucciones_disenador }}',
      'Prompt Midjourney':       '={{ $json.midjourney_prompt }}',
      'Plataforma Pauta':        '={{ $json.plataforma_pauta }}',
      'Objetivo Pauta':          '={{ $json.objetivo_pauta }}',
      'Presupuesto Total USD':   '={{ $json.presupuesto_total }}',
      'Audiencia Pauta':         '={{ $json.audiencia_pauta }}',
      'KPIs Objetivo':           '={{ $json.kpis_json }}',
      'Estado':                  'Generado',
    };
    console.log('✅ Guardar Pieza — campos pauta agregados');
  }

  // ── 4. Update Extraer Datos — add isResultados, isRevision, isReporte ───────
  const extraer = wf.nodes.find(n => n.name === 'Extraer Datos del Mensaje');
  if (extraer) {
    extraer.parameters.jsCode = `const body = $input.first().json.body;
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
  isGroup:          from.includes('@g.us'),
  pushName:         data.pushName || 'Sin nombre',
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
  isAplicaciones:   t.startsWith('aplicaciones:'),
  isResultados:     t.startsWith('resultados:'),
  isRevision:       t.startsWith('revision:') || t.startsWith('revisión:'),
  isReporte:        t.startsWith('reporte:') || t === 'reporte',
  isBlog:           t.startsWith('blog:'),
  isScript:         t.startsWith('script:'),
  isEstado:         t === 'estado',
  raw: body
}}];`;
    console.log('✅ Extraer Datos — isResultados, isRevision, isReporte agregados');
  }

  // ── 5. Add new nodes ────────────────────────────────────────────────────────

  // WA — Recibiendo Revisión
  if (!wf.nodes.find(n => n.name === 'WhatsApp — Enviando Preguntas')) {
    wf.nodes.push({
      id: 'wa_enviando_preguntas', name: 'WhatsApp — Enviando Preguntas',
      type: 'n8n-nodes-evolution-api.evolutionApi', typeVersion: 1,
      position: [1400, 3400],
      parameters: {
        resource: 'messages-api', instanceName: 'mentoria-manolo',
        remoteJid: '={{ $json.phone + "@s.whatsapp.net" }}',
        messageText: '=⏳ Preparando preguntas de revisión mensual...',
        options_message: {}
      }
    });
    console.log('➕ WhatsApp — Enviando Preguntas');
  }

  // Claude — Modelo Revision
  if (!wf.nodes.find(n => n.name === 'Claude — Modelo Revision')) {
    wf.nodes.push({
      id: 'claude_model_revision', name: 'Claude — Modelo Revision',
      type: '@n8n/n8n-nodes-langchain.lmChatAnthropic', typeVersion: 1.2,
      position: [1640, 3320],
      parameters: { model: 'claude-sonnet-4-6', options: { maxTokensToSample: 1000 } },
      credentials: { anthropicApi: { id: 'z0YdT9oApiWKr4Eq', name: 'Anthropic MentorIA' } }
    });
    console.log('➕ Claude — Modelo Revision');
  }

  // Generar Preguntas Revision
  if (!wf.nodes.find(n => n.name === 'Generar Preguntas Revision')) {
    wf.nodes.push({
      id: 'generar_preguntas_revision', name: 'Generar Preguntas Revision',
      type: '@n8n/n8n-nodes-langchain.chainLlm', typeVersion: 1.4,
      position: [1640, 3400],
      parameters: { promptType: 'define', text: PREGUNTAS_REVISION }
    });
    console.log('➕ Generar Preguntas Revision');
  }

  // WA — Enviar Preguntas
  if (!wf.nodes.find(n => n.name === 'WhatsApp — Preguntas Revision')) {
    wf.nodes.push({
      id: 'wa_preguntas_revision', name: 'WhatsApp — Preguntas Revision',
      type: 'n8n-nodes-evolution-api.evolutionApi', typeVersion: 1,
      position: [1880, 3400],
      parameters: {
        resource: 'messages-api', instanceName: 'mentoria-manolo',
        remoteJid: '={{ $("Extraer Datos del Mensaje").first().json.phone + "@s.whatsapp.net" }}',
        messageText: '={{ $json.text }}',
        options_message: {}
      }
    });
    console.log('➕ WhatsApp — Preguntas Revision');
  }

  // Parsear Resultados DC
  if (!wf.nodes.find(n => n.name === 'Parsear Resultados DC')) {
    wf.nodes.push({
      id: 'parsear_resultados_dc', name: 'Parsear Resultados DC',
      type: 'n8n-nodes-base.code', typeVersion: 2,
      position: [1400, 3600],
      parameters: { jsCode: PARSEAR_RESULTADOS_CODE }
    });
    console.log('➕ Parsear Resultados DC');
  }

  // Guardar Resultados Airtable
  if (!wf.nodes.find(n => n.name === 'Guardar Resultados Mensuales')) {
    wf.nodes.push({
      id: 'guardar_resultados', name: 'Guardar Resultados Mensuales',
      type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2,
      position: [1640, 3600],
      parameters: {
        method: 'POST',
        url: `https://api.airtable.com/v0/${BASE}/Resultados Mensuales`,
        headerParameters: { parameters: [{ name: 'Authorization', value: `Bearer ${AIRTABLE_KEY}` }, { name: 'Content-Type', value: 'application/json' }] },
        sendBody: true, specifyBody: 'json',
        jsonBody: `={"fields":{"Mes":"{{ $json.mes }}","Cliente":"{{ $json.cliente }}","Texto Completo":"{{ $json.texto_completo }}","Orgánico - Resumen":"{{ $json.respuesta_1 }} | {{ $json.respuesta_2 }}","Pauta - Resultados":"{{ $json.respuesta_3 }}","CRM - Pipeline":"{{ $json.respuesta_4 }}","Próximo Mes":"{{ $json.respuesta_5 }}","Cambios Marca":"{{ $json.respuesta_6 }}","Fecha":"{{ $json.fecha }}"}}`,
      }
    });
    console.log('➕ Guardar Resultados Mensuales');
  }

  // Claude — Modelo Reporte
  if (!wf.nodes.find(n => n.name === 'Claude — Modelo Reporte')) {
    wf.nodes.push({
      id: 'claude_model_reporte', name: 'Claude — Modelo Reporte',
      type: '@n8n/n8n-nodes-langchain.lmChatAnthropic', typeVersion: 1.2,
      position: [1880, 3520],
      parameters: { model: 'claude-opus-4-6', options: { maxTokensToSample: 4000 } },
      credentials: { anthropicApi: { id: 'z0YdT9oApiWKr4Eq', name: 'Anthropic MentorIA' } }
    });
    console.log('➕ Claude — Modelo Reporte');
  }

  // Generar Reporte Mensual
  if (!wf.nodes.find(n => n.name === 'Generar Reporte Mensual')) {
    wf.nodes.push({
      id: 'generar_reporte', name: 'Generar Reporte Mensual',
      type: '@n8n/n8n-nodes-langchain.chainLlm', typeVersion: 1.4,
      position: [1880, 3600],
      parameters: { promptType: 'define', text: PROMPT_REPORTE }
    });
    console.log('➕ Generar Reporte Mensual');
  }

  // Buscar Últimos Resultados (para reporte: command)
  if (!wf.nodes.find(n => n.name === 'Buscar Últimos Resultados')) {
    wf.nodes.push({
      id: 'buscar_resultados', name: 'Buscar Últimos Resultados',
      type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2,
      position: [1400, 3800],
      parameters: {
        method: 'GET',
        url: `https://api.airtable.com/v0/${BASE}/Resultados Mensuales?maxRecords=1&sort[0][field]=Fecha&sort[0][direction]=desc`,
        headerParameters: { parameters: [{ name: 'Authorization', value: `Bearer ${AIRTABLE_KEY}` }] }
      }
    });
    console.log('➕ Buscar Últimos Resultados');
  }

  // Preparar Datos Reporte
  if (!wf.nodes.find(n => n.name === 'Preparar Datos Reporte')) {
    wf.nodes.push({
      id: 'preparar_datos_reporte', name: 'Preparar Datos Reporte',
      type: 'n8n-nodes-base.code', typeVersion: 2,
      position: [1640, 3800],
      parameters: {
        jsCode: `const records = $input.first().json.records || [];
const phone = $('Extraer Datos del Mensaje').first().json.phone;
const record = records[0];
if (!record) return [{ json: { error: 'No hay resultados guardados. Primero envía: resultados: [tus métricas]', phone } }];
const f = record.fields;
return [{ json: {
  phone,
  cliente: f['Cliente'] || '',
  mes: f['Mes'] || '',
  texto_completo: f['Texto Completo'] || '',
  organico: f['Orgánico - Resumen'] || '',
  pauta: f['Pauta - Resultados'] || '',
  crm: f['CRM - Pipeline'] || '',
  proximo: f['Próximo Mes'] || '',
  cambios: f['Cambios Marca'] || ''
} }];`
      }
    });
    console.log('➕ Preparar Datos Reporte');
  }

  // WA — Enviando Reporte
  if (!wf.nodes.find(n => n.name === 'WhatsApp — Enviando Reporte')) {
    wf.nodes.push({
      id: 'wa_enviando_reporte', name: 'WhatsApp — Enviando Reporte',
      type: 'n8n-nodes-evolution-api.evolutionApi', typeVersion: 1,
      position: [1640, 3720],
      parameters: {
        resource: 'messages-api', instanceName: 'mentoria-manolo',
        remoteJid: '={{ $json.phone + "@s.whatsapp.net" }}',
        messageText: '=📊 Generando reporte mensual con análisis y propuestas de mejora...\n\n⏳ ~1 minuto',
        options_message: {}
      }
    });
    console.log('➕ WhatsApp — Enviando Reporte');
  }

  // WA — Enviar Reporte Final
  if (!wf.nodes.find(n => n.name === 'WhatsApp — Reporte Mensual')) {
    wf.nodes.push({
      id: 'wa_reporte_mensual', name: 'WhatsApp — Reporte Mensual',
      type: 'n8n-nodes-evolution-api.evolutionApi', typeVersion: 1,
      position: [2120, 3800],
      parameters: {
        resource: 'messages-api', instanceName: 'mentoria-manolo',
        remoteJid: '={{ $("Extraer Datos del Mensaje").first().json.phone + "@s.whatsapp.net" }}',
        messageText: '={{ $json.text }}',
        options_message: {}
      }
    });
    console.log('➕ WhatsApp — Reporte Mensual');
  }

  // WA — Confirmación Resultados
  if (!wf.nodes.find(n => n.name === 'WhatsApp — Resultados Guardados')) {
    wf.nodes.push({
      id: 'wa_resultados_guardados', name: 'WhatsApp — Resultados Guardados',
      type: 'n8n-nodes-evolution-api.evolutionApi', typeVersion: 1,
      position: [1880, 3600],
      parameters: {
        resource: 'messages-api', instanceName: 'mentoria-manolo',
        remoteJid: '={{ $("Extraer Datos del Mensaje").first().json.phone + "@s.whatsapp.net" }}',
        messageText: '=✅ *Resultados guardados*\n\nMes: {{ $json.mes }}\nCliente: {{ $json.cliente }}\n\nCuando quieras el análisis completo manda: *reporte:*',
        options_message: {}
      }
    });
    console.log('➕ WhatsApp — Resultados Guardados');
  }

  // ── 6. Add new router rules ─────────────────────────────────────────────────
  const router = wf.nodes.find(n => n.name === 'Router de Comandos');
  if (router) {
    const rules = router.parameters.rules.values;
    const ruleStr = JSON.stringify(rules);

    const addRuleIfMissing = (flag, nodeTarget, ruleId) => {
      if (!ruleStr.includes(flag)) {
        const template = JSON.parse(JSON.stringify(rules[0]));
        template.conditions.conditions[0].leftValue = `={{ $json.${flag} }}`;
        template.conditions.conditions[0].id = ruleId;
        rules.push(template);
        const idx = rules.length - 1;
        if (!wf.connections['Router de Comandos']) wf.connections['Router de Comandos'] = { main: [] };
        while (wf.connections['Router de Comandos'].main.length <= idx) wf.connections['Router de Comandos'].main.push([]);
        wf.connections['Router de Comandos'].main[idx] = [{ node: nodeTarget, type: 'main', index: 0 }];
        console.log(`✅ Router rule ${flag} → ${nodeTarget} at index ${idx}`);
      }
    };

    addRuleIfMissing('isRevision',   'WhatsApp — Enviando Preguntas', 'r1');
    addRuleIfMissing('isResultados', 'Parsear Resultados DC', 'r2');
    addRuleIfMissing('isReporte',    'Buscar Últimos Resultados', 'r3');
  }

  // ── 7. Wire new connections ─────────────────────────────────────────────────
  const c = wf.connections;

  // Revision flow
  c['Claude — Modelo Revision'] = { ai_languageModel: [[{ node: 'Generar Preguntas Revision', type: 'ai_languageModel', index: 0 }]] };
  c['WhatsApp — Enviando Preguntas'] = { main: [[{ node: 'Generar Preguntas Revision', type: 'main', index: 0 }]] };
  c['Generar Preguntas Revision'] = { main: [[{ node: 'WhatsApp — Preguntas Revision', type: 'main', index: 0 }]] };

  // Resultados flow
  c['Parsear Resultados DC'] = { main: [[{ node: 'Guardar Resultados Mensuales', type: 'main', index: 0 }]] };
  c['Guardar Resultados Mensuales'] = { main: [[{ node: 'WhatsApp — Resultados Guardados', type: 'main', index: 0 }]] };

  // Reporte flow
  c['Claude — Modelo Reporte'] = { ai_languageModel: [[{ node: 'Generar Reporte Mensual', type: 'ai_languageModel', index: 0 }]] };
  c['Buscar Últimos Resultados'] = { main: [[
    { node: 'WhatsApp — Enviando Reporte', type: 'main', index: 0 },
    { node: 'Preparar Datos Reporte', type: 'main', index: 0 }
  ]] };
  c['Preparar Datos Reporte'] = { main: [[{ node: 'Generar Reporte Mensual', type: 'main', index: 0 }]] };
  c['Generar Reporte Mensual'] = { main: [[{ node: 'WhatsApp — Reporte Mensual', type: 'main', index: 0 }]] };

  // ── 8. Save ─────────────────────────────────────────────────────────────────
  const upd = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': N8N_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: { executionOrder: 'v1' } })
  });
  const r = await upd.json();
  if (r.id) {
    console.log('\n✅ Rediseño completado —', r.nodes?.length, 'nodes');
  } else {
    console.error('❌', JSON.stringify(r).substring(0, 300));
  }
}

build();
