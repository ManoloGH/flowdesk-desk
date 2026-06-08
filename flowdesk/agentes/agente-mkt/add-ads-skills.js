/**
 * ADS SKILLS — Motor de Pauta Completo
 *
 * Nuevos comandos:
 * - pauta: [brief]   → propone campañas completas para Meta/TikTok/LinkedIn/Google
 * - abtesting: N     → genera 3 variaciones de copy para la pieza N
 * - audiencia: [desc]→ construye audiencias detalladas y lookalike
 * - optimizar: N     → analiza resultados de campaña N y propone mejoras
 */

const N8N_API = 'https://prueba-digisaurios-n8n.4jvoco.easypanel.host/api/v1';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmY5MjkzMC0yYjk1LTRmNjAtODViOC0xZjYwNTFkNzhjMGUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc1NjEyODI0fQ.s4_wwDB_Xjwlg29cdfePqLZYZ0sDma9IBhsH1PNL5X4';
const WF_ID = 'fiU0ac3bSRkLGhaC';
const AIRTABLE_KEY = process.env.AIRTABLE_API_KEY || 'YOUR_AIRTABLE_API_KEY';
const BASE = 'appgS6jdmiMsGQyIF';
const PLAN_TABLE = 'tblSrW7hpZzIFkfZ2';

// ─── PROMPT: PLAN DE PAUTA COMPLETO ─────────────────────────────────────────
const PROMPT_PAUTA = `=Eres un Media Buyer y estratega de pauta digital senior. Genera un plan de pauta completo y específico para convertir.

BRIEF:
{{ $json.text.replace(/pauta:/gi, '').trim() }}

Responde SOLO con este JSON:
{
  "resumen_estrategia": "2-3 líneas del enfoque general y por qué",
  "presupuesto_total_mensual_usd": 500,
  "distribucion": {
    "meta": 50,
    "tiktok": 30,
    "linkedin": 20,
    "google": 0
  },
  "campanas": [
    {
      "id": 1,
      "nombre": "Nombre de la campaña",
      "plataforma": "Meta|TikTok Ads|LinkedIn Ads|Google Ads",
      "objetivo": "Awareness|Tráfico|Leads|Conversión|Retargeting",
      "fase_embudo": "TOFU|MOFU|BOFU",
      "presupuesto_diario_usd": 15,
      "duracion_dias": 14,
      "presupuesto_total_usd": 210,
      "audiencia": {
        "edad": "25-45",
        "genero": "Todos|Hombres|Mujeres",
        "ubicacion": "México - ciudades principales",
        "intereses": ["interés 1", "interés 2", "interés 3"],
        "comportamientos": ["comportamiento 1", "comportamiento 2"],
        "exclusiones": ["excluir audiencia 1"],
        "tipo": "Frío|Retargeting|Lookalike",
        "tamaño_estimado": "500K - 1.5M personas"
      },
      "creatividades": [
        {
          "formato": "Video 9:16|Imagen 1:1|Carrusel|Stories",
          "duracion_seg": 15,
          "copy": {
            "headline": "Título máx 40 chars. Gancho fuerte.",
            "texto_principal": "Cuerpo. Beneficio claro. Urgencia o prueba social. Máx 125 chars antes del ver más.",
            "descripcion": "Texto bajo headline máx 30 chars",
            "cta": "Más información|Comprar ahora|Registrarse|Contactar|Descargar"
          },
          "script_video": "Si es video: guión de 15-30 seg. Hook en 3 seg. Problema, solución, CTA.",
          "midjourney_prompt": "Prompt para Midjourney. Muy específico: composición, iluminación, estilo, personas, colores de marca, ratio --ar 9:16 o 1:1 --style raw --v 6.1",
          "instrucciones_disenador": "Qué debe hacer el diseñador específicamente. Elementos obligatorios: logo, CTA visual, colores exactos, texto overlay."
        }
      ],
      "kpis": {
        "cpm_estimado_usd": 8,
        "ctr_objetivo_pct": 2.5,
        "cpl_objetivo_usd": 12,
        "roas_objetivo": 3.0,
        "alcance_semanal_estimado": 8000,
        "frecuencia_objetivo": 3
      },
      "pixel_eventos": ["ViewContent", "Lead", "Purchase"],
      "remarketing": "Cómo usar esta audiencia para retargeting en la siguiente fase",
      "notas_optimizacion": "Cuándo y cómo optimizar: reglas de presupuesto, señales de apagado."
    }
  ],
  "calendario_lanzamiento": [
    { "semana": 1, "accion": "Qué lanzar y por qué en esta secuencia" },
    { "semana": 2, "accion": "..." }
  ],
  "metricas_semaforo": {
    "verde": "CTR > 2.5%, CPL < $15 → mantener o escalar",
    "amarillo": "CTR 1.5-2.5%, CPL $15-25 → optimizar creatividad",
    "rojo": "CTR < 1.5%, CPL > $25 → pausar y rediseñar"
  }
}`;

// ─── PARSEAR PAUTA ────────────────────────────────────────────────────────────
const PARSEAR_PAUTA_CODE = `const raw = $input.first().json.text;
const phone = $('Extraer Datos del Mensaje').first().json.phone;
let plan = {};
try {
  const clean = raw.replace(/\`\`\`json/g,'').replace(/\`\`\`/g,'').trim();
  const match = clean.match(/\\{[\\s\\S]*\\}/);
  plan = match ? JSON.parse(match[0]) : {};
} catch(e) { plan = {}; }

return [{ json: { phone, plan, planJson: JSON.stringify(plan, null, 2) } }];`;

// ─── FORMATEAR PAUTA PARA WHATSAPP ───────────────────────────────────────────
const FORMATEAR_PAUTA_CODE = `const { plan, phone } = $input.first().json;
if (!plan.campanas) return [{ json: { phone, msg: '❌ No se pudo generar el plan.' } }];

let msg = '*📊 PLAN DE PAUTA*\\n\\n';
msg += '*Estrategia:* ' + (plan.resumen_estrategia || '') + '\\n';
msg += '*Presupuesto mensual:* $' + (plan.presupuesto_total_mensual_usd || 0) + ' USD\\n';
msg += '*Distribución:* Meta ' + (plan.distribucion?.meta||0) + '% | TikTok ' + (plan.distribucion?.tiktok||0) + '% | LinkedIn ' + (plan.distribucion?.linkedin||0) + '%\\n\\n';

plan.campanas.forEach((c, i) => {
  msg += '─────────────────\\n';
  msg += '*Campaña ' + (i+1) + ': ' + c.nombre + '*\\n';
  msg += '📱 ' + c.plataforma + ' | 🎯 ' + c.objetivo + ' | ' + c.fase_embudo + '\\n';
  msg += '💰 $' + c.presupuesto_diario_usd + '/día × ' + c.duracion_dias + ' días = $' + c.presupuesto_total_usd + '\\n';
  msg += '👥 Audiencia: ' + (c.audiencia?.tamaño_estimado || '') + '\\n';
  const cr = c.creatividades?.[0];
  if (cr) {
    msg += '📌 Formato: ' + cr.formato + '\\n';
    msg += '💬 Headline: "' + cr.copy?.headline + '"\\n';
    msg += '📝 Copy: ' + cr.copy?.texto_principal?.substring(0,100) + '...\\n';
  }
  msg += '📈 KPIs objetivo: CTR ' + (c.kpis?.ctr_objetivo_pct||0) + '% | CPL $' + (c.kpis?.cpl_objetivo_usd||0) + ' | ROAS ' + (c.kpis?.roas_objetivo||0) + 'x\\n\\n';
});

msg += '─────────────────\\n';
msg += '*Semáforo:*\\n';
msg += '🟢 ' + (plan.metricas_semaforo?.verde || '') + '\\n';
msg += '🟡 ' + (plan.metricas_semaforo?.amarillo || '') + '\\n';
msg += '🔴 ' + (plan.metricas_semaforo?.rojo || '') + '\\n\\n';
msg += '📋 El detalle completo con prompts Midjourney e instrucciones para el diseñador está guardado en Airtable.';

return [{ json: { phone, msg } }];`;

// ─── GUARDAR PLAN PAUTA EN AIRTABLE ──────────────────────────────────────────
const GUARDAR_PAUTA_CODE = `const { plan, phone } = $input.first().json;
const AIRTABLE_KEY = '${AIRTABLE_KEY}';
const BASE = '${BASE}';
const TABLE = '${PLAN_TABLE}';

const campanas = plan.campanas || [];
const results = [];

for (const c of campanas) {
  const cr = c.creatividades?.[0] || {};
  const body = {
    fields: {
      'Tipo Contenido': 'Pauta',
      'Tipo': cr.formato?.split(' ')[0] || 'Video',
      'Concepto / Tema': c.nombre || '',
      'Objetivo Pauta': c.objetivo || '',
      'Plataforma Pauta': c.plataforma || '',
      'Presupuesto Total USD': c.presupuesto_total_usd || 0,
      'Audiencia Pauta': JSON.stringify(c.audiencia || {}),
      'KPIs Objetivo': JSON.stringify(c.kpis || {}),
      'Copy': cr.copy?.headline || '',
      'Copy Facebook': cr.copy?.texto_principal || '',
      'Script Narración': cr.script_video || '',
      'Prompt Midjourney': cr.midjourney_prompt || '',
      'Instrucciones Diseñador': cr.instrucciones_disenador || '',
      'Estado': 'Propuesta Pauta',
      'Día': 'Pauta',
      'Pilar': 'Pauta'
    }
  };

  const r = await $http.request({
    method: 'POST',
    url: 'https://api.airtable.com/v0/' + BASE + '/' + TABLE,
    headers: { Authorization: 'Bearer ' + AIRTABLE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  results.push(r.id);
}

return [{ json: { phone, savedIds: results, count: results.length } }];`;

// ─── PROMPT: A/B TESTING ─────────────────────────────────────────────────────
const PROMPT_ABTESTING = `=Eres un experto en copywriting de alta conversión. Genera 3 variaciones de A/B testing para el anuncio número {{ $json.numeroPieza }}.

COPY ORIGINAL:
{{ $json.copyOriginal }}

CONTEXTO:
Plataforma: {{ $json.plataforma }}
Objetivo: {{ $json.objetivo }}

Genera 3 variaciones que prueben ángulos DISTINTOS (no solo cambiar palabras):
- Variación A: Ángulo de PROBLEMA (pain point fuerte)
- Variación B: Ángulo de BENEFICIO (resultado deseado)
- Variación C: Ángulo de PRUEBA SOCIAL (quién lo usa, resultados reales)

Para cada variación incluye:
1. Hipótesis: por qué este ángulo podría ganar
2. Headline (máx 40 chars)
3. Texto principal (máx 125 chars antes del "ver más")
4. CTA específico
5. Qué elemento visual reforzaría este copy

Responde en formato WhatsApp con *negritas* y saltos de línea. Máx 600 palabras.`;

// ─── PARSEAR PIEZA PARA ABTESTING ────────────────────────────────────────────
const PARSEAR_ABTESTING_CODE = `const text = $input.first().json.text;
const phone = $input.first().json.phone;
const match = text.match(/abtesting:\\s*(\\d+)/i);
const numeroPieza = match?.[1] ? parseInt(match[1]) : null;

if (!numeroPieza) return [{ json: { error: 'Formato: abtesting: 3', phone } }];
return [{ json: { numeroPieza, phone } }];`;

// ─── BUSCAR PIEZA PARA ABTESTING ─────────────────────────────────────────────
const BUSCAR_PIEZA_ABTESTING_CODE = `const records = $input.first().json.records || [];
const phone = $('Parsear AbTesting').first().json.phone;
const numeroPieza = $('Parsear AbTesting').first().json.numeroPieza;

const pieza = records.find(r => r.fields['Número Pieza'] == numeroPieza && r.fields['Tipo Contenido'] === 'Pauta');
if (!pieza) return [{ json: { error: 'No encontré la pieza ' + numeroPieza + ' de pauta', phone } }];

return [{ json: {
  phone, numeroPieza,
  copyOriginal: pieza.fields['Copy'] || pieza.fields['Copy Facebook'] || '',
  plataforma: pieza.fields['Plataforma Pauta'] || 'Meta',
  objetivo: pieza.fields['Objetivo Pauta'] || 'Leads',
  tema: pieza.fields['Concepto / Tema'] || ''
} }];`;

// ─── PROMPT: OPTIMIZAR CAMPAÑA ───────────────────────────────────────────────
const PROMPT_OPTIMIZAR = `=Eres un Media Buyer senior analizando resultados de campaña. Analiza los datos y da instrucciones de optimización específicas y accionables para HOY.

DATOS DE LA CAMPAÑA {{ $json.numeroPieza }}:
{{ $json.datosResultados }}

CONTEXTO ORIGINAL:
Plataforma: {{ $json.plataforma }}
Objetivo: {{ $json.objetivo }}
KPIs objetivo: {{ $json.kpisObjetivo }}

Genera un análisis en formato WhatsApp con:

*🔍 DIAGNÓSTICO*
- Qué está funcionando y qué no (con números)
- Comparación vs KPIs objetivo

*⚡ ACCIONES INMEDIATAS* (hacer hoy)
1. [Acción específica]
2. [Acción específica]
3. [Acción específica]

*📅 PRÓXIMOS 7 DÍAS*
- Ajustes de presupuesto con porcentajes exactos
- Cambios de audiencia recomendados
- Creatividades a pausar / escalar

*📈 PROYECCIÓN*
Si implementas estas mejoras, en 7 días deberías ver: [estimado específico]

Máx 400 palabras. Solo texto WhatsApp, sin código ni JSON.`;

async function build() {
  const res = await fetch(`${N8N_API}/workflows/${WF_ID}`, { headers: { 'X-N8N-API-KEY': N8N_KEY } });
  const wf = await res.json();
  console.log('Fetched:', wf.nodes.length, 'nodes');

  const c = wf.connections;

  // ── Add isAbtesting, isPauta, isOptimizar to Extraer Datos ──────────────────
  const extraer = wf.nodes.find(n => n.name === 'Extraer Datos del Mensaje');
  if (extraer && !extraer.parameters.jsCode.includes('isPauta')) {
    extraer.parameters.jsCode = extraer.parameters.jsCode
      .replace("isReporte:        t.startsWith('reporte:') || t === 'reporte',",
        `isReporte:        t.startsWith('reporte:') || t === 'reporte',
  isPauta:          t.startsWith('pauta:'),
  isAbTesting:      t.startsWith('abtesting:'),
  isOptimizar:      t.startsWith('optimizar:'),`);
    console.log('✅ Extraer Datos — isPauta, isAbTesting, isOptimizar agregados');
  }

  // ── NODE: Extraer Pauta Brief ────────────────────────────────────────────────
  if (!wf.nodes.find(n => n.name === 'Extraer Pauta Brief')) {
    wf.nodes.push({
      id: 'extraer_pauta_brief', name: 'Extraer Pauta Brief',
      type: 'n8n-nodes-base.code', typeVersion: 2,
      position: [1400, 4000],
      parameters: {
        jsCode: `const text = $input.first().json.text;
const phone = $input.first().json.phone;
return [{ json: { text, phone } }];`
      }
    });
    console.log('➕ Extraer Pauta Brief');
  }

  // ── NODE: WA Generando Pauta ─────────────────────────────────────────────────
  if (!wf.nodes.find(n => n.name === 'WhatsApp — Generando Pauta')) {
    wf.nodes.push({
      id: 'wa_generando_pauta', name: 'WhatsApp — Generando Pauta',
      type: 'n8n-nodes-evolution-api.evolutionApi', typeVersion: 1,
      position: [1640, 3960],
      parameters: {
        resource: 'messages-api', instanceName: 'mentoria-manolo',
        remoteJid: '={{ $json.phone + "@s.whatsapp.net" }}',
        messageText: '=🎯 *Diseñando plan de pauta...*\n\n⏳ ~45 segundos\nEstoy construyendo:\n• Campañas por objetivo y plataforma\n• Audiencias detalladas\n• Copies con A/B\n• Prompts Midjourney\n• KPIs y semáforo de optimización',
        options_message: {}
      }
    });
    console.log('➕ WhatsApp — Generando Pauta');
  }

  // ── NODE: Claude Modelo Pauta ────────────────────────────────────────────────
  if (!wf.nodes.find(n => n.name === 'Claude — Modelo Pauta')) {
    wf.nodes.push({
      id: 'claude_model_pauta', name: 'Claude — Modelo Pauta',
      type: '@n8n/n8n-nodes-langchain.lmChatAnthropic', typeVersion: 1.2,
      position: [1880, 3960],
      parameters: { model: 'claude-opus-4-6', options: { maxTokensToSample: 6000 } },
      credentials: { anthropicApi: { id: 'z0YdT9oApiWKr4Eq', name: 'Anthropic MentorIA' } }
    });
    console.log('➕ Claude — Modelo Pauta');
  }

  // ── NODE: Generar Plan Pauta ─────────────────────────────────────────────────
  if (!wf.nodes.find(n => n.name === 'Generar Plan Pauta')) {
    wf.nodes.push({
      id: 'generar_plan_pauta', name: 'Generar Plan Pauta',
      type: '@n8n/n8n-nodes-langchain.chainLlm', typeVersion: 1.4,
      position: [1880, 4040],
      parameters: { promptType: 'define', text: PROMPT_PAUTA }
    });
    console.log('➕ Generar Plan Pauta');
  }

  // ── NODE: Parsear Plan Pauta ─────────────────────────────────────────────────
  if (!wf.nodes.find(n => n.name === 'Parsear Plan Pauta')) {
    wf.nodes.push({
      id: 'parsear_plan_pauta', name: 'Parsear Plan Pauta',
      type: 'n8n-nodes-base.code', typeVersion: 2,
      position: [2120, 4040],
      parameters: { jsCode: PARSEAR_PAUTA_CODE }
    });
    console.log('➕ Parsear Plan Pauta');
  }

  // ── NODE: Guardar Pauta Airtable ─────────────────────────────────────────────
  if (!wf.nodes.find(n => n.name === 'Guardar Plan Pauta Airtable')) {
    wf.nodes.push({
      id: 'guardar_plan_pauta', name: 'Guardar Plan Pauta Airtable',
      type: 'n8n-nodes-base.code', typeVersion: 2,
      position: [2360, 4040],
      parameters: { jsCode: GUARDAR_PAUTA_CODE }
    });
    console.log('➕ Guardar Plan Pauta Airtable');
  }

  // ── NODE: Formatear Pauta WhatsApp ───────────────────────────────────────────
  if (!wf.nodes.find(n => n.name === 'Formatear Pauta WhatsApp')) {
    wf.nodes.push({
      id: 'formatear_pauta_wa', name: 'Formatear Pauta WhatsApp',
      type: 'n8n-nodes-base.code', typeVersion: 2,
      position: [2360, 3960],
      parameters: { jsCode: FORMATEAR_PAUTA_CODE }
    });
    console.log('➕ Formatear Pauta WhatsApp');
  }

  // ── NODE: WA Enviar Plan Pauta ───────────────────────────────────────────────
  if (!wf.nodes.find(n => n.name === 'WhatsApp — Plan Pauta')) {
    wf.nodes.push({
      id: 'wa_plan_pauta', name: 'WhatsApp — Plan Pauta',
      type: 'n8n-nodes-evolution-api.evolutionApi', typeVersion: 1,
      position: [2600, 3960],
      parameters: {
        resource: 'messages-api', instanceName: 'mentoria-manolo',
        remoteJid: '={{ $json.phone + "@s.whatsapp.net" }}',
        messageText: '={{ $json.msg }}',
        options_message: {}
      }
    });
    console.log('➕ WhatsApp — Plan Pauta');
  }

  // ── A/B TESTING nodes ────────────────────────────────────────────────────────
  if (!wf.nodes.find(n => n.name === 'Parsear AbTesting')) {
    wf.nodes.push({
      id: 'parsear_abtesting', name: 'Parsear AbTesting',
      type: 'n8n-nodes-base.code', typeVersion: 2,
      position: [1400, 4200],
      parameters: { jsCode: PARSEAR_ABTESTING_CODE }
    });
    console.log('➕ Parsear AbTesting');
  }

  if (!wf.nodes.find(n => n.name === 'Buscar Pieza Pauta')) {
    wf.nodes.push({
      id: 'buscar_pieza_pauta', name: 'Buscar Pieza Pauta',
      type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2,
      position: [1640, 4200],
      parameters: {
        method: 'GET',
        url: `=https://api.airtable.com/v0/${BASE}/${PLAN_TABLE}?filterByFormula=AND({Tipo Contenido}="Pauta",{Número Pieza}={{ $json.numeroPieza }})`,
        headerParameters: { parameters: [{ name: 'Authorization', value: `Bearer ${AIRTABLE_KEY}` }] }
      }
    });
    console.log('➕ Buscar Pieza Pauta');
  }

  if (!wf.nodes.find(n => n.name === 'Preparar AbTesting')) {
    wf.nodes.push({
      id: 'preparar_abtesting', name: 'Preparar AbTesting',
      type: 'n8n-nodes-base.code', typeVersion: 2,
      position: [1880, 4200],
      parameters: { jsCode: BUSCAR_PIEZA_ABTESTING_CODE }
    });
    console.log('➕ Preparar AbTesting');
  }

  if (!wf.nodes.find(n => n.name === 'Claude — Modelo AbTesting')) {
    wf.nodes.push({
      id: 'claude_model_abtesting', name: 'Claude — Modelo AbTesting',
      type: '@n8n/n8n-nodes-langchain.lmChatAnthropic', typeVersion: 1.2,
      position: [2120, 4120],
      parameters: { model: 'claude-opus-4-6', options: { maxTokensToSample: 2000 } },
      credentials: { anthropicApi: { id: 'z0YdT9oApiWKr4Eq', name: 'Anthropic MentorIA' } }
    });
    console.log('➕ Claude — Modelo AbTesting');
  }

  if (!wf.nodes.find(n => n.name === 'Generar Variaciones AbTesting')) {
    wf.nodes.push({
      id: 'generar_abtesting', name: 'Generar Variaciones AbTesting',
      type: '@n8n/n8n-nodes-langchain.chainLlm', typeVersion: 1.4,
      position: [2120, 4200],
      parameters: { promptType: 'define', text: PROMPT_ABTESTING }
    });
    console.log('➕ Generar Variaciones AbTesting');
  }

  if (!wf.nodes.find(n => n.name === 'WhatsApp — AbTesting')) {
    wf.nodes.push({
      id: 'wa_abtesting', name: 'WhatsApp — AbTesting',
      type: 'n8n-nodes-evolution-api.evolutionApi', typeVersion: 1,
      position: [2360, 4200],
      parameters: {
        resource: 'messages-api', instanceName: 'mentoria-manolo',
        remoteJid: '={{ $("Extraer Datos del Mensaje").first().json.phone + "@s.whatsapp.net" }}',
        messageText: '={{ $json.text }}',
        options_message: {}
      }
    });
    console.log('➕ WhatsApp — AbTesting');
  }

  // ── OPTIMIZAR nodes ──────────────────────────────────────────────────────────
  if (!wf.nodes.find(n => n.name === 'Parsear Optimizar')) {
    wf.nodes.push({
      id: 'parsear_optimizar', name: 'Parsear Optimizar',
      type: 'n8n-nodes-base.code', typeVersion: 2,
      position: [1400, 4400],
      parameters: {
        jsCode: `const text = $input.first().json.text;
const phone = $input.first().json.phone;
const match = text.match(/optimizar:\\s*(\\d+)\\s*(.+)?/i);
const numeroPieza = match?.[1] ? parseInt(match[1]) : null;
const datosResultados = match?.[2]?.trim() || text.replace(/optimizar:\\s*\\d+/i,'').trim();
return [{ json: { numeroPieza, datosResultados, phone } }];`
      }
    });
    console.log('➕ Parsear Optimizar');
  }

  if (!wf.nodes.find(n => n.name === 'Buscar Pieza Optimizar')) {
    wf.nodes.push({
      id: 'buscar_pieza_optimizar', name: 'Buscar Pieza Optimizar',
      type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2,
      position: [1640, 4400],
      parameters: {
        method: 'GET',
        url: `=https://api.airtable.com/v0/${BASE}/${PLAN_TABLE}?filterByFormula={Número Pieza}={{ $json.numeroPieza }}`,
        headerParameters: { parameters: [{ name: 'Authorization', value: `Bearer ${AIRTABLE_KEY}` }] }
      }
    });
    console.log('➕ Buscar Pieza Optimizar');
  }

  if (!wf.nodes.find(n => n.name === 'Preparar Datos Optimizar')) {
    wf.nodes.push({
      id: 'preparar_datos_optimizar', name: 'Preparar Datos Optimizar',
      type: 'n8n-nodes-base.code', typeVersion: 2,
      position: [1880, 4400],
      parameters: {
        jsCode: `const records = $input.first().json.records || [];
const { numeroPieza, datosResultados, phone } = $('Parsear Optimizar').first().json;
const pieza = records[0];
if (!pieza) return [{ json: { error: 'No encontré la pieza ' + numeroPieza, phone } }];
return [{ json: {
  phone, numeroPieza, datosResultados,
  plataforma: pieza.fields['Plataforma Pauta'] || 'Meta',
  objetivo: pieza.fields['Objetivo Pauta'] || '',
  kpisObjetivo: pieza.fields['KPIs Objetivo'] || ''
} }];`
      }
    });
    console.log('➕ Preparar Datos Optimizar');
  }

  if (!wf.nodes.find(n => n.name === 'Claude — Modelo Optimizar')) {
    wf.nodes.push({
      id: 'claude_model_optimizar', name: 'Claude — Modelo Optimizar',
      type: '@n8n/n8n-nodes-langchain.lmChatAnthropic', typeVersion: 1.2,
      position: [2120, 4320],
      parameters: { model: 'claude-opus-4-6', options: { maxTokensToSample: 2000 } },
      credentials: { anthropicApi: { id: 'z0YdT9oApiWKr4Eq', name: 'Anthropic MentorIA' } }
    });
    console.log('➕ Claude — Modelo Optimizar');
  }

  if (!wf.nodes.find(n => n.name === 'Generar Análisis Optimización')) {
    wf.nodes.push({
      id: 'generar_optimizacion', name: 'Generar Análisis Optimización',
      type: '@n8n/n8n-nodes-langchain.chainLlm', typeVersion: 1.4,
      position: [2120, 4400],
      parameters: { promptType: 'define', text: PROMPT_OPTIMIZAR }
    });
    console.log('➕ Generar Análisis Optimización');
  }

  if (!wf.nodes.find(n => n.name === 'WhatsApp — Análisis Optimización')) {
    wf.nodes.push({
      id: 'wa_optimizacion', name: 'WhatsApp — Análisis Optimización',
      type: 'n8n-nodes-evolution-api.evolutionApi', typeVersion: 1,
      position: [2360, 4400],
      parameters: {
        resource: 'messages-api', instanceName: 'mentoria-manolo',
        remoteJid: '={{ $("Extraer Datos del Mensaje").first().json.phone + "@s.whatsapp.net" }}',
        messageText: '={{ $json.text }}',
        options_message: {}
      }
    });
    console.log('➕ WhatsApp — Análisis Optimización');
  }

  // ── Router rules ─────────────────────────────────────────────────────────────
  const router = wf.nodes.find(n => n.name === 'Router de Comandos');
  if (router) {
    const rules = router.parameters.rules.values;
    const addRule = (flag, target) => {
      if (!JSON.stringify(rules).includes(flag)) {
        const tmpl = JSON.parse(JSON.stringify(rules[0]));
        tmpl.conditions.conditions[0].leftValue = `={{ $json.${flag} }}`;
        tmpl.conditions.conditions[0].id = flag;
        rules.push(tmpl);
        const idx = rules.length - 1;
        if (!c['Router de Comandos']) c['Router de Comandos'] = { main: [] };
        while (c['Router de Comandos'].main.length <= idx) c['Router de Comandos'].main.push([]);
        c['Router de Comandos'].main[idx] = [{ node: target, type: 'main', index: 0 }];
        console.log(`✅ Router: ${flag} → ${target} [${idx}]`);
      }
    };
    addRule('isPauta',      'Extraer Pauta Brief');
    addRule('isAbTesting',  'Parsear AbTesting');
    addRule('isOptimizar',  'Parsear Optimizar');
  }

  // ── Connections ───────────────────────────────────────────────────────────────
  // Pauta flow
  c['Claude — Modelo Pauta'] = { ai_languageModel: [[{ node: 'Generar Plan Pauta', type: 'ai_languageModel', index: 0 }]] };
  c['Extraer Pauta Brief'] = { main: [[
    { node: 'WhatsApp — Generando Pauta', type: 'main', index: 0 },
    { node: 'Generar Plan Pauta', type: 'main', index: 0 }
  ]] };
  c['Generar Plan Pauta'] = { main: [[{ node: 'Parsear Plan Pauta', type: 'main', index: 0 }]] };
  c['Parsear Plan Pauta'] = { main: [[
    { node: 'Guardar Plan Pauta Airtable', type: 'main', index: 0 },
    { node: 'Formatear Pauta WhatsApp', type: 'main', index: 0 }
  ]] };
  c['Formatear Pauta WhatsApp'] = { main: [[{ node: 'WhatsApp — Plan Pauta', type: 'main', index: 0 }]] };

  // AbTesting flow
  c['Claude — Modelo AbTesting'] = { ai_languageModel: [[{ node: 'Generar Variaciones AbTesting', type: 'ai_languageModel', index: 0 }]] };
  c['Parsear AbTesting'] = { main: [[{ node: 'Buscar Pieza Pauta', type: 'main', index: 0 }]] };
  c['Buscar Pieza Pauta'] = { main: [[{ node: 'Preparar AbTesting', type: 'main', index: 0 }]] };
  c['Preparar AbTesting'] = { main: [[{ node: 'Generar Variaciones AbTesting', type: 'main', index: 0 }]] };
  c['Generar Variaciones AbTesting'] = { main: [[{ node: 'WhatsApp — AbTesting', type: 'main', index: 0 }]] };

  // Optimizar flow
  c['Claude — Modelo Optimizar'] = { ai_languageModel: [[{ node: 'Generar Análisis Optimización', type: 'ai_languageModel', index: 0 }]] };
  c['Parsear Optimizar'] = { main: [[{ node: 'Buscar Pieza Optimizar', type: 'main', index: 0 }]] };
  c['Buscar Pieza Optimizar'] = { main: [[{ node: 'Preparar Datos Optimizar', type: 'main', index: 0 }]] };
  c['Preparar Datos Optimizar'] = { main: [[{ node: 'Generar Análisis Optimización', type: 'main', index: 0 }]] };
  c['Generar Análisis Optimización'] = { main: [[{ node: 'WhatsApp — Análisis Optimización', type: 'main', index: 0 }]] };

  // ── Save ──────────────────────────────────────────────────────────────────────
  const upd = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': N8N_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: { executionOrder: 'v1' } })
  });
  const r = await upd.json();
  if (r.id) {
    console.log('\n✅ Ads Skills completados —', r.nodes?.length, 'nodes');
    console.log('\nComandos disponibles:');
    console.log('  pauta: [brief]      → plan por plataforma + audiencias + KPIs + Midjourney prompts');
    console.log('  abtesting: 3        → 3 variaciones de copy (problema / beneficio / prueba social)');
    console.log('  optimizar: 3 [data] → análisis + acciones inmediatas de mejora');
    console.log('  resultados: [texto] → guarda métricas mensuales en Airtable');
    console.log('  revision: [cliente] → preguntas clave mensuales al DC');
    console.log('  reporte:            → presentación mensual con mejoras propuestas');
  } else {
    console.error('❌', JSON.stringify(r).substring(0, 300));
  }
}

build();
