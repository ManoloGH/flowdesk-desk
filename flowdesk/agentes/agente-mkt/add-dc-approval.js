const N8N_API = 'https://prueba-digisaurios-n8n.4jvoco.easypanel.host/api/v1';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmY5MjkzMC0yYjk1LTRmNjAtODViOC0xZjYwNTFkNzhjMGUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc1NjEyODI0fQ.s4_wwDB_Xjwlg29cdfePqLZYZ0sDma9IBhsH1PNL5X4';
const WF_ID = 'fiU0ac3bSRkLGhaC';

// ─── CODE STRINGS ─────────────────────────────────────────────────────────────

// Updated extract node — adds isApproval and isChange detection
const extractCode = `const body = $input.first().json.body;
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
const t = text.toLowerCase().trim();

return [{
  json: {
    text: text.trim(),
    phone,
    from,
    isGroup,
    pushName,
    isBrief: t.startsWith('brief:') || t.startsWith('brief '),
    isContentRequest: t.startsWith('contenido:') || t.includes('genera contenido'),
    isApproval: t.startsWith('apruebo'),
    isChange: t.startsWith('cambio'),
    messageType: msg.conversation ? 'text' : (msg.extendedTextMessage ? 'text' : 'other'),
    raw: body
  }
}];`;

// Parse "apruebo 3" or "apruebo todo"
const extraerAprobacionCode = `const msg = $input.first().json;
const t = msg.text.toLowerCase().trim();
// Remove "apruebo" prefix
const rest = t.replace(/^apruebo\s*/i, '').trim();
const esTodo = rest === 'todo' || rest === '' || rest === 'todos';
const numero = esTodo ? null : parseInt(rest, 10);
return [{ json: {
  tipo: esTodo ? 'todo' : 'numero',
  numero: isNaN(numero) ? null : numero,
  phone: msg.phone
}}];`;

// Filter pieces to approve: all or Nth
const filtrarPiezasCode = `const cmd = $('Extraer Nro Aprobacion').first().json;
const items = $input.all();

if (items.length === 0) {
  // No pending pieces
  return [{ json: { recordId: null, noPending: true, phone: cmd.phone } }];
}

if (cmd.tipo === 'todo') {
  // Return all items for batch update
  return items.map(i => ({ json: { recordId: i.json.id, titulo: i.json.fields['Título'] || i.json.fields['Concepto / Tema'] || '', phone: cmd.phone } }));
} else {
  // Return only the Nth item (1-indexed)
  const idx = (cmd.numero || 1) - 1;
  const item = items[idx] || items[0];
  return [{ json: { recordId: item.json.id, titulo: item.json.fields['Título'] || item.json.fields['Concepto / Tema'] || '', phone: cmd.phone } }];
}`;

// Guard: only fire WA once after batch update
const guardAprobacionCode = `if ($itemIndex !== 0) return [];
const cmd = $('Extraer Nro Aprobacion').first().json;
const phone = $input.first().json.phone || cmd.phone || '';
const tipo = cmd.tipo;
const numero = cmd.numero;
let texto = tipo === 'todo'
  ? '7 piezas aprobadas por DC ✅'
  : 'Pieza ' + numero + ' aprobada por DC ✅';
return [{ json: { phone, texto } }];`;

// Parse "cambio 3: instrucciones del cambio"
const extraerCambioCode = `const msg = $input.first().json;
const t = msg.text.trim();
// Pattern: "cambio N: instrucciones" or "cambio N instrucciones"
const match = t.match(/^cambio\s+(\\d+)\s*[:\\-]?\s*(.+)/i);
const numero = match ? parseInt(match[1], 10) : 1;
const instrucciones = match ? match[2].trim() : t.replace(/^cambio\s+/i, '').trim();
return [{ json: { numero, instrucciones, phone: msg.phone } }];`;

// Prepare prompt context from Airtable record
const prepararPromptCambioCode = `const cmd = $('Extraer Nro Cambio').first().json;
const items = $input.all();

if (items.length === 0) {
  return [{ json: { error: 'No hay piezas pendientes', phone: cmd.phone } }];
}

const idx = (cmd.numero || 1) - 1;
const pieza = items[idx] || items[0];
const f = pieza.json.fields || {};

return [{
  json: {
    recordId: pieza.json.id,
    instrucciones: cmd.instrucciones,
    phone: cmd.phone,
    numero: cmd.numero,
    dia: f['Día'] || f['Dia'] || '',
    red: f['Red Social'] || '',
    tipo: f['Tipo'] || '',
    tema: f['Concepto / Tema'] || f['Título'] || '',
    copy: f['Copy'] || '',
    hashtags: f['Hashtags'] || '',
    hora: f['Hora'] || '18:00'
  }
}];`;

// Parse regenerated piece from Claude
const parsearPiezaNuevaCode = `const raw = $input.first().json.text;
const cmd = $('Preparar Prompt Cambio').first().json;
let pieza;
try {
  const clean = raw.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
  const match = clean.match(/\\{[\\s\\S]*\\}/);
  pieza = match ? JSON.parse(match[0]) : {};
} catch(e) {
  pieza = {};
}
return [{
  json: {
    recordId: cmd.recordId,
    phone: cmd.phone,
    numero: cmd.numero,
    dia: pieza.dia || cmd.dia,
    red: pieza.red || cmd.red,
    tipo: pieza.tipo || cmd.tipo,
    tema: pieza.tema || cmd.tema,
    copy: pieza.copy || '',
    hashtags: Array.isArray(pieza.hashtags) ? pieza.hashtags.join(' ') : (pieza.hashtags || ''),
    hora: pieza.hora || cmd.hora
  }
}];`;

// ─── NEW NODES ────────────────────────────────────────────────────────────────

const newNodes = [
  // ── APRUEBO branch ──
  {
    id: 'extraer_nro_aprobacion',
    name: 'Extraer Nro Aprobacion',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [1160, 700],
    parameters: { jsCode: extraerAprobacionCode }
  },
  {
    id: 'listar_piezas_generadas',
    name: 'Listar Piezas Generadas',
    type: 'n8n-nodes-base.airtable',
    typeVersion: 2.1,
    position: [1400, 700],
    parameters: {
      operation: 'list',
      base: { __rl: true, value: 'appgS6jdmiMsGQyIF', mode: 'id' },
      table: { __rl: true, value: 'tblSrW7hpZzIFkfZ2', mode: 'id' },
      filterByFormula: "({Estado}='Generado')",
      options: {}
    },
    credentials: {
      airtableTokenApi: { id: 'NbV3Gvv9v4DmaR9c', name: 'Airtable MentorIA' }
    }
  },
  {
    id: 'filtrar_piezas_aprobar',
    name: 'Filtrar Piezas a Aprobar',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [1640, 700],
    parameters: { jsCode: filtrarPiezasCode }
  },
  {
    id: 'marcar_aprobado_dc',
    name: 'Marcar Aprobado DC',
    type: 'n8n-nodes-base.airtable',
    typeVersion: 2.1,
    position: [1880, 700],
    parameters: {
      operation: 'update',
      base: { __rl: true, value: 'appgS6jdmiMsGQyIF', mode: 'id' },
      table: { __rl: true, value: 'tblSrW7hpZzIFkfZ2', mode: 'id' },
      id: '={{ $json.recordId }}',
      columns: {
        mappingMode: 'defineBelow',
        value: {
          'Estado': 'Aprobado DC'
        }
      }
    },
    credentials: {
      airtableTokenApi: { id: 'NbV3Gvv9v4DmaR9c', name: 'Airtable MentorIA' }
    }
  },
  {
    id: 'guard_wa_aprobacion',
    name: 'Guard WA Aprobacion',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [2120, 700],
    parameters: { jsCode: guardAprobacionCode }
  },
  {
    id: 'wa_dc_aprobado',
    name: 'WhatsApp — DC Aprobado',
    type: 'n8n-nodes-evolution-api.evolutionApi',
    typeVersion: 1,
    position: [2360, 700],
    parameters: {
      resource: 'messages-api',
      instanceName: 'mentoria-manolo',
      remoteJid: '={{ $json.phone + \'@s.whatsapp.net\' }}',
      messageText: '={{ $json.texto + \'\\n\\n📋 Las piezas aprobadas están listas para diseño.\\n\\nCuando el cliente dé su OK, se publicarán automáticamente.\' }}',
      options_message: {}
    },
    credentials: {
      evolutionApi: { id: '25MBOz6svtSJ3wEE', name: 'Evolution API MentorIA' }
    }
  },

  // ── CAMBIO branch ──
  {
    id: 'extraer_nro_cambio',
    name: 'Extraer Nro Cambio',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [1160, 960],
    parameters: { jsCode: extraerCambioCode }
  },
  {
    id: 'obtener_pieza_original',
    name: 'Obtener Pieza Original',
    type: 'n8n-nodes-base.airtable',
    typeVersion: 2.1,
    position: [1400, 960],
    parameters: {
      operation: 'list',
      base: { __rl: true, value: 'appgS6jdmiMsGQyIF', mode: 'id' },
      table: { __rl: true, value: 'tblSrW7hpZzIFkfZ2', mode: 'id' },
      filterByFormula: "({Estado}='Generado')",
      options: {}
    },
    credentials: {
      airtableTokenApi: { id: 'NbV3Gvv9v4DmaR9c', name: 'Airtable MentorIA' }
    }
  },
  {
    id: 'preparar_prompt_cambio',
    name: 'Preparar Prompt Cambio',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [1640, 960],
    parameters: { jsCode: prepararPromptCambioCode }
  },
  {
    id: 'claude_model_cambio',
    name: 'Claude — Modelo Cambio',
    type: '@n8n/n8n-nodes-langchain.lmChatAnthropic',
    typeVersion: 1.2,
    position: [1880, 1120],
    parameters: {
      model: 'claude-sonnet-4-5',
      options: { maxTokensToSample: 4000 }
    },
    credentials: {
      anthropicApi: { id: 'z0YdT9oApiWKr4Eq', name: 'Anthropic MentorIA' }
    }
  },
  {
    id: 'regenerar_pieza',
    name: 'Regenerar Pieza con IA',
    type: '@n8n/n8n-nodes-langchain.chainLlm',
    typeVersion: 1.4,
    position: [1880, 960],
    parameters: {
      promptType: 'define',
      text: `=Eres un experto en marketing de contenidos. Necesito que mejores esta pieza aplicando los cambios solicitados.

PIEZA ORIGINAL:
Dia: {{ $json.dia }}
Red: {{ $json.red }}
Tipo: {{ $json.tipo }}
Tema: {{ $json.tema }}
Copy: {{ $json.copy }}
Hashtags: {{ $json.hashtags }}
Hora: {{ $json.hora }}

CAMBIOS A APLICAR:
{{ $json.instrucciones }}

Genera la pieza mejorada en formato JSON exacto:
{
  "dia": "...",
  "red": "...",
  "tipo": "...",
  "tema": "...",
  "copy": "...",
  "hashtags": ["#..."],
  "hora": "..."
}

Responde SOLO con el JSON, sin texto adicional.`
    }
  },
  {
    id: 'parsear_pieza_nueva',
    name: 'Parsear Pieza Nueva',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [2120, 960],
    parameters: { jsCode: parsearPiezaNuevaCode }
  },
  {
    id: 'actualizar_pieza',
    name: 'Actualizar Pieza en Airtable',
    type: 'n8n-nodes-base.airtable',
    typeVersion: 2.1,
    position: [2360, 960],
    parameters: {
      operation: 'update',
      base: { __rl: true, value: 'appgS6jdmiMsGQyIF', mode: 'id' },
      table: { __rl: true, value: 'tblSrW7hpZzIFkfZ2', mode: 'id' },
      id: '={{ $json.recordId }}',
      columns: {
        mappingMode: 'defineBelow',
        value: {
          'Título': '={{ $json.tema }}',
          'Red Social': '={{ $json.red }}',
          'Tipo': '={{ $json.tipo }}',
          'Copy': '={{ $json.copy }}',
          'Hashtags': '={{ $json.hashtags }}',
          'Concepto / Tema': '={{ $json.tema }}',
          'Estado': 'Generado'
        }
      }
    },
    credentials: {
      airtableTokenApi: { id: 'NbV3Gvv9v4DmaR9c', name: 'Airtable MentorIA' }
    }
  },
  {
    id: 'wa_cambio_aplicado',
    name: 'WhatsApp — Cambio Aplicado',
    type: 'n8n-nodes-evolution-api.evolutionApi',
    typeVersion: 1,
    position: [2600, 960],
    parameters: {
      resource: 'messages-api',
      instanceName: 'mentoria-manolo',
      remoteJid: '={{ $json.phone + \'@s.whatsapp.net\' }}',
      messageText: '=✏️ *Pieza {{ $json.numero }} actualizada* ✅\n\nEl cambio fue aplicado. Revisa en Airtable y vuelve a aprobar cuando esté lista.\n\n👉 https://airtable.com/appgS6jdmiMsGQyIF/tblSrW7hpZzIFkfZ2',
      options_message: {}
    },
    credentials: {
      evolutionApi: { id: '25MBOz6svtSJ3wEE', name: 'Evolution API MentorIA' }
    }
  }
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function fix() {
  // 1. Fetch current workflow
  const res = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    headers: { 'X-N8N-API-KEY': N8N_KEY }
  });
  const wf = await res.json();
  console.log('Fetched workflow:', wf.name, '— nodes:', wf.nodes.length);

  // 2. Update "Extraer Datos del Mensaje" with new detection flags
  const extractNode = wf.nodes.find(n => n.name === 'Extraer Datos del Mensaje');
  if (extractNode) {
    extractNode.parameters.jsCode = extractCode;
    console.log('✅ Updated Extraer Datos del Mensaje');
  } else {
    console.warn('⚠️  Extraer Datos del Mensaje not found');
  }

  // 3. Update Router to add 2 new switch cases (apruebo, cambio)
  const router = wf.nodes.find(n => n.name === 'Router de Comandos');
  if (router) {
    // Remove existing apruebo/cambio cases if already there (idempotent)
    const existingRules = router.parameters.rules.values.filter(
      r => r.outputKey !== 'apruebo' && r.outputKey !== 'cambio'
    );
    router.parameters.rules.values = [
      ...existingRules,
      {
        conditions: {
          options: { caseSensitive: false, leftValue: '', typeValidation: 'loose' },
          conditions: [{ id: 'c', leftValue: '={{ $json.isApproval }}', rightValue: true, operator: { type: 'boolean', operation: 'equals' } }],
          combinator: 'and'
        },
        renameOutput: true,
        outputKey: 'apruebo'
      },
      {
        conditions: {
          options: { caseSensitive: false, leftValue: '', typeValidation: 'loose' },
          conditions: [{ id: 'd', leftValue: '={{ $json.isChange }}', rightValue: true, operator: { type: 'boolean', operation: 'equals' } }],
          combinator: 'and'
        },
        renameOutput: true,
        outputKey: 'cambio'
      }
    ];
    console.log('✅ Updated Router — now has', router.parameters.rules.values.length, 'routes');
  } else {
    console.warn('⚠️  Router de Comandos not found');
  }

  // 4. Add new nodes (skip if already present)
  for (const node of newNodes) {
    const exists = wf.nodes.find(n => n.name === node.name);
    if (!exists) {
      wf.nodes.push(node);
      console.log('➕ Added node:', node.name);
    } else {
      // Update in place
      Object.assign(exists, node);
      console.log('🔄 Updated node:', node.name);
    }
  }

  // 5. Add new connections (preserve existing)
  const c = wf.connections;

  // Router output index: 0=brief, 1=contenido, 2=apruebo, 3=cambio
  // We need to rebuild Router connections to ensure correct indices
  const routerOutputBrief = c['Router de Comandos']?.main?.[0] || [{ node: 'Procesar Brief con IA', type: 'main', index: 0 }];
  const routerOutputContenido = c['Router de Comandos']?.main?.[1] || [{ node: 'Generar Contenido con IA', type: 'main', index: 0 }];

  c['Router de Comandos'] = {
    main: [
      routerOutputBrief,
      routerOutputContenido,
      [{ node: 'Extraer Nro Aprobacion', type: 'main', index: 0 }],
      [{ node: 'Extraer Nro Cambio', type: 'main', index: 0 }]
    ]
  };

  // Apruebo branch
  c['Extraer Nro Aprobacion'] = { main: [[{ node: 'Listar Piezas Generadas', type: 'main', index: 0 }]] };
  c['Listar Piezas Generadas'] = { main: [[{ node: 'Filtrar Piezas a Aprobar', type: 'main', index: 0 }]] };
  c['Filtrar Piezas a Aprobar'] = { main: [[{ node: 'Marcar Aprobado DC', type: 'main', index: 0 }]] };
  c['Marcar Aprobado DC'] = { main: [[{ node: 'Guard WA Aprobacion', type: 'main', index: 0 }]] };
  c['Guard WA Aprobacion'] = { main: [[{ node: 'WhatsApp — DC Aprobado', type: 'main', index: 0 }]] };

  // Cambio branch
  c['Extraer Nro Cambio'] = { main: [[{ node: 'Obtener Pieza Original', type: 'main', index: 0 }]] };
  c['Obtener Pieza Original'] = { main: [[{ node: 'Preparar Prompt Cambio', type: 'main', index: 0 }]] };
  c['Preparar Prompt Cambio'] = { main: [[{ node: 'Regenerar Pieza con IA', type: 'main', index: 0 }]] };
  c['Claude — Modelo Cambio'] = {
    ai_languageModel: [[{ node: 'Regenerar Pieza con IA', type: 'ai_languageModel', index: 0 }]]
  };
  c['Regenerar Pieza con IA'] = { main: [[{ node: 'Parsear Pieza Nueva', type: 'main', index: 0 }]] };
  c['Parsear Pieza Nueva'] = { main: [[{ node: 'Actualizar Pieza en Airtable', type: 'main', index: 0 }]] };
  c['Actualizar Pieza en Airtable'] = { main: [[{ node: 'WhatsApp — Cambio Aplicado', type: 'main', index: 0 }]] };

  console.log('\nPushing update...');

  // 6. PUT updated workflow
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
    console.log('\n✅ Workflow actualizado:', result.id);
    console.log('Nodos totales:', result.nodes?.length);
    console.log('\n📱 Nuevos comandos disponibles por WhatsApp:');
    console.log('  apruebo todo         → aprueba las 7 piezas');
    console.log('  apruebo 3            → aprueba la pieza #3');
    console.log('  cambio 3: [texto]    → Claude regenera la pieza #3');
    console.log('\n⚠️  Recuerda hacer Unpublish → Publish en n8n UI para registrar cambios.');
  } else {
    console.error('❌ Error:', JSON.stringify(result, null, 2));
  }
}

fix();
