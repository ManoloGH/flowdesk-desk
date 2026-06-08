const N8N_API = 'https://prueba-digisaurios-n8n.4jvoco.easypanel.host/api/v1';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmY5MjkzMC0yYjk1LTRmNjAtODViOC0xZjYwNTFkNzhjMGUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc1NjEyODI0fQ.s4_wwDB_Xjwlg29cdfePqLZYZ0sDma9IBhsH1PNL5X4';

const workflow = {
  name: "WhatsApp — Recibir y Rutear Mensajes",
  nodes: [
    {
      id: "webhook",
      name: "Webhook WhatsApp Entrante",
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [200, 300],
      parameters: {
        path: "whatsapp-entrante",
        httpMethod: "POST",
        responseMode: "onReceived",
        options: {}
      }
    },
    {
      id: "filter_own",
      name: "Ignorar Mensajes Propios",
      type: "n8n-nodes-base.filter",
      typeVersion: 2.2,
      position: [440, 300],
      parameters: {
        conditions: {
          options: { caseSensitive: false, leftValue: "", typeValidation: "strict" },
          conditions: [
            {
              id: "a",
              leftValue: "={{ $json.body.data.key.fromMe }}",
              rightValue: true,
              operator: { type: "boolean", operation: "notEquals" }
            }
          ],
          combinator: "and"
        }
      }
    },
    {
      id: "extract",
      name: "Extraer Datos del Mensaje",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [680, 300],
      parameters: {
        jsCode: `const body = $input.first().json.body;
const data = body.data || {};
const msg = data.message || {};

const text = msg.conversation ||
             msg.extendedTextMessage?.text ||
             msg.imageMessage?.caption ||
             '';

const from = data.key?.remoteJid || '';
const phone = from.replace('@s.whatsapp.net', '').replace('@g.us', '');
const isGroup = from.includes('@g.us');
const pushName = data.pushName || 'Sin nombre';

return [{
  json: {
    text: text.trim(),
    phone,
    from,
    isGroup,
    pushName,
    isBrief: text.toLowerCase().includes('brief:') || text.toLowerCase().includes('brief '),
    isContentRequest: text.toLowerCase().includes('contenido:') || text.toLowerCase().includes('genera contenido'),
    messageType: msg.conversation ? 'text' : (msg.extendedTextMessage ? 'text' : 'other'),
    raw: body
  }
}];`
      }
    },
    {
      id: "router",
      name: "Router de Comandos",
      type: "n8n-nodes-base.switch",
      typeVersion: 3.2,
      position: [920, 300],
      parameters: {
        mode: "rules",
        options: {},
        rules: {
          values: [
            {
              conditions: {
                options: { caseSensitive: false, leftValue: "", typeValidation: "loose" },
                conditions: [{ id: "a", leftValue: "={{ $json.isBrief }}", rightValue: true, operator: { type: "boolean", operation: "equals" } }],
                combinator: "and"
              },
              renameOutput: true,
              outputKey: "brief"
            },
            {
              conditions: {
                options: { caseSensitive: false, leftValue: "", typeValidation: "loose" },
                conditions: [{ id: "b", leftValue: "={{ $json.isContentRequest }}", rightValue: true, operator: { type: "boolean", operation: "equals" } }],
                combinator: "and"
              },
              renameOutput: true,
              outputKey: "contenido"
            }
          ]
        },
        fallbackOutput: "extra"
      }
    },
    // ─── RAMA BRIEF ───
    {
      id: "claude_brief",
      name: "Claude — Modelo Brief",
      type: "@n8n/n8n-nodes-langchain.lmChatAnthropic",
      typeVersion: 1.2,
      position: [1160, 100],
      parameters: {
        model: "claude-sonnet-4-5",
        options: { maxTokensToSample: 4000 }
      },
      credentials: {
        anthropicApi: { id: "z0YdT9oApiWKr4Eq", name: "Anthropic MentorIA" }
      }
    },
    {
      id: "chain_brief",
      name: "Procesar Brief con IA",
      type: "@n8n/n8n-nodes-langchain.chainLlm",
      typeVersion: 1.4,
      position: [1160, -60],
      parameters: {
        promptType: "define",
        text: `=Eres un estratega de marketing experto. Analiza este brief de onboarding y extrae la información estructurada.

BRIEF:
{{ $json.text.replace('brief:', '').replace('Brief:', '').trim() }}

Genera un JSON con esta estructura exacta:
{
  "cliente": "nombre del negocio",
  "industria": "industria o sector",
  "descripcion": "descripcion del negocio en 2-3 oraciones",
  "propuesta_valor": "por que los eligen vs competencia",
  "tono_marca": "formal/cercano/serio/humor/inspiracional",
  "producto_estrella": "producto o servicio principal",
  "cliente_ideal": "perfil detallado del mejor cliente",
  "dolor_cliente": "que problema tiene antes de encontrarlos",
  "meta_ventas_mensual": "meta en pesos",
  "presupuesto_pauta": "presupuesto para publicidad pagada",
  "redes_activas": ["lista de redes donde quiere estar"],
  "competidores": ["lista de competidores"],
  "recomendacion_estrategia": "recomendacion para los primeros 3 meses en 3-4 oraciones"
}

Responde SOLO con el JSON, sin texto adicional.`
      }
    },
    {
      id: "parse_brief",
      name: "Parsear Brief JSON",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [1400, -60],
      parameters: {
        jsCode: `const raw = $input.first().json.text;
let brief;
try {
  const match = raw.match(/\\{[\\s\\S]*\\}/);
  brief = match ? JSON.parse(match[0]) : {};
} catch(e) {
  brief = { error: 'No se pudo parsear', raw };
}
const prev = $('Extraer Datos del Mensaje').first().json;
return [{ json: { brief, phone: prev.phone, pushName: prev.pushName } }];`
      }
    },
    {
      id: "airtable_brief",
      name: "Guardar Brief en Airtable",
      type: "n8n-nodes-base.airtable",
      typeVersion: 2.1,
      position: [1640, -60],
      parameters: {
        operation: "create",
        base: { __rl: true, value: "appgS6jdmiMsGQyIF", mode: "id" },
        table: { __rl: true, value: "tbl45sIHzsJtNix3M", mode: "id" },
        columns: {
          mappingMode: "defineBelow",
          value: {
            "Cliente": "={{ $json.brief.cliente || $json.pushName }}",
            "Fecha Llamada": "={{ $now.toISODate() }}",
            "Brief Enriquecido IA": "={{ JSON.stringify($json.brief, null, 2) }}",
            "Estado": "Llamada realizada"
          }
        }
      },
      credentials: {
        airtableTokenApi: { id: "NbV3Gvv9v4DmaR9c", name: "Airtable MentorIA" }
      }
    },
    {
      id: "wa_brief_ok",
      name: "WhatsApp — Brief Recibido",
      type: "n8n-nodes-evolution-api.evolutionApi",
      typeVersion: 1,
      position: [1880, -60],
      parameters: {
        resource: "messages-api",
        instanceName: "mentoria-manolo",
        remoteJid: "={{ $('Extraer Datos del Mensaje').first().json.phone + '@s.whatsapp.net' }}",
        messageText: "=\u2705 *Brief recibido y procesado*\n\nCliente: {{ $json.fields.Cliente }}\n\nEl brief est\u00e1 en Airtable listo para revisar.\n\n\ud83d\udca1 _Responde *contenido: [instrucciones]* para generar el primer contenido._",
        options_message: {}
      },
      credentials: {
        evolutionApi: { id: "25MBOz6svtSJ3wEE", name: "Evolution API MentorIA" }
      }
    },
    // ─── RAMA CONTENIDO ───
    {
      id: "claude_content",
      name: "Claude — Modelo Contenido",
      type: "@n8n/n8n-nodes-langchain.lmChatAnthropic",
      typeVersion: 1.2,
      position: [1160, 500],
      parameters: {
        model: "claude-sonnet-4-5",
        options: { maxTokensToSample: 8000 }
      },
      credentials: {
        anthropicApi: { id: "z0YdT9oApiWKr4Eq", name: "Anthropic MentorIA" }
      }
    },
    {
      id: "chain_content",
      name: "Generar Contenido con IA",
      type: "@n8n/n8n-nodes-langchain.chainLlm",
      typeVersion: 1.4,
      position: [1160, 360],
      parameters: {
        promptType: "define",
        text: `=Eres un experto en marketing de contenidos. Genera una semana completa de contenido para redes sociales.

INSTRUCCIONES: {{ $json.text.replace('contenido:', '').replace('Contenido:', '').trim() }}

Genera exactamente 7 piezas de contenido (una por dia). Para cada pieza incluye:
- Red social
- Tipo (post/reel/story/carrusel)
- Tema del dia
- Copy completo listo para publicar
- 5 hashtags relevantes
- Hora optima de publicacion

Responde en formato JSON:
{
  "semana": [
    {
      "dia": "Lunes",
      "red": "Instagram",
      "tipo": "Reel",
      "tema": "...",
      "copy": "...",
      "hashtags": ["#..."],
      "hora": "18:00"
    }
  ]
}

Responde SOLO con el JSON.`
      }
    },
    {
      id: "parse_content",
      name: "Parsear Contenido JSON",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [1400, 360],
      parameters: {
        jsCode: `const raw = $input.first().json.text;
let contenido;
try {
  const match = raw.match(/\\{[\\s\\S]*\\}/);
  contenido = match ? JSON.parse(match[0]) : { semana: [] };
} catch(e) {
  contenido = { semana: [], error: raw };
}
const prev = $('Extraer Datos del Mensaje').first().json;
return [{ json: { contenido, semana: contenido.semana || [], phone: prev.phone } }];`
      }
    },
    {
      id: "loop_content",
      name: "Por cada pieza",
      type: "n8n-nodes-base.splitInBatches",
      typeVersion: 3,
      position: [1640, 360],
      parameters: {
        batchSize: 1,
        options: {}
      }
    },
    {
      id: "airtable_content",
      name: "Guardar Pieza en Airtable",
      type: "n8n-nodes-base.airtable",
      typeVersion: 2.1,
      position: [1880, 360],
      parameters: {
        operation: "create",
        base: { __rl: true, value: "appgS6jdmiMsGQyIF", mode: "id" },
        table: { __rl: true, value: "tblSrW7hpZzIFkfZ2", mode: "id" },
        columns: {
          mappingMode: "defineBelow",
          value: {
            "Título": "={{ $json.tema }}",
            "Red Social": "={{ $json.red }}",
            "Tipo": "={{ $json.tipo }}",
            "Copy": "={{ $json.copy }}",
            "Hashtags": "={{ ($json.hashtags || []).join(' ') }}",
            "Estado": "Generado",
            "Concepto / Tema": "={{ $json.tema }}"
          }
        }
      },
      credentials: {
        airtableTokenApi: { id: "NbV3Gvv9v4DmaR9c", name: "Airtable MentorIA" }
      }
    },
    {
      id: "wa_content_ok",
      name: "WhatsApp — Contenido Listo",
      type: "n8n-nodes-evolution-api.evolutionApi",
      typeVersion: 1,
      position: [2120, 360],
      parameters: {
        resource: "messages-api",
        instanceName: "mentoria-manolo",
        remoteJid: "={{ $('Extraer Datos del Mensaje').first().json.phone + '@s.whatsapp.net' }}",
        messageText: "=\ud83c\udfa8 *Contenido semanal generado* \u2705\n\n7 piezas listas en Airtable \u2192 tabla *Plan de Contenido*\n\nRevisa, ajusta y aprueba cada pieza antes de publicar.",
        options_message: {}
      },
      credentials: {
        evolutionApi: { id: "25MBOz6svtSJ3wEE", name: "Evolution API MentorIA" }
      }
    }
  ],
  connections: {
    "Webhook WhatsApp Entrante": {
      main: [[{ node: "Ignorar Mensajes Propios", type: "main", index: 0 }]]
    },
    "Ignorar Mensajes Propios": {
      main: [[{ node: "Extraer Datos del Mensaje", type: "main", index: 0 }]]
    },
    "Extraer Datos del Mensaje": {
      main: [[{ node: "Router de Comandos", type: "main", index: 0 }]]
    },
    "Router de Comandos": {
      main: [
        [{ node: "Procesar Brief con IA", type: "main", index: 0 }],
        [{ node: "Generar Contenido con IA", type: "main", index: 0 }]
      ]
    },
    // Brief branch
    "Claude — Modelo Brief": {
      ai_languageModel: [[{ node: "Procesar Brief con IA", type: "ai_languageModel", index: 0 }]]
    },
    "Procesar Brief con IA": {
      main: [[{ node: "Parsear Brief JSON", type: "main", index: 0 }]]
    },
    "Parsear Brief JSON": {
      main: [[{ node: "Guardar Brief en Airtable", type: "main", index: 0 }]]
    },
    "Guardar Brief en Airtable": {
      main: [[{ node: "WhatsApp — Brief Recibido", type: "main", index: 0 }]]
    },
    // Content branch
    "Claude — Modelo Contenido": {
      ai_languageModel: [[{ node: "Generar Contenido con IA", type: "ai_languageModel", index: 0 }]]
    },
    "Generar Contenido con IA": {
      main: [[{ node: "Parsear Contenido JSON", type: "main", index: 0 }]]
    },
    "Parsear Contenido JSON": {
      main: [[{ node: "Por cada pieza", type: "main", index: 0 }]]
    },
    "Por cada pieza": {
      main: [[{ node: "Guardar Pieza en Airtable", type: "main", index: 0 }]]
    },
    "Guardar Pieza en Airtable": {
      main: [
        [{ node: "Por cada pieza", type: "main", index: 0 }],
        [{ node: "WhatsApp — Contenido Listo", type: "main", index: 0 }]
      ]
    }
  },
  settings: { executionOrder: "v1" }
};

async function create() {
  const res = await fetch(`${N8N_API}/workflows`, {
    method: 'POST',
    headers: { 'X-N8N-API-KEY': N8N_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(workflow)
  });
  const j = await res.json();
  if (j.id) {
    console.log('✅ Workflow creado:', j.id);
    const act = await fetch(`${N8N_API}/workflows/${j.id}/activate`, {
      method: 'POST',
      headers: { 'X-N8N-API-KEY': N8N_KEY }
    });
    const aj = await act.json();
    console.log('Activo:', aj.active);
    console.log('\nComandos por WhatsApp:');
    console.log('  brief: [texto del brief]  → procesa onboarding');
    console.log('  contenido: [instrucciones] → genera semana de contenido');
  } else {
    console.error('Error:', JSON.stringify(j, null, 2));
  }
}

create();
