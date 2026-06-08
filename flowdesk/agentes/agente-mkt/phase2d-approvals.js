const N8N_API = 'https://prueba-digisaurios-n8n.4jvoco.easypanel.host/api/v1';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmY5MjkzMC0yYjk1LTRmNjAtODViOC0xZjYwNTFkNzhjMGUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc1NjEyODI0fQ.s4_wwDB_Xjwlg29cdfePqLZYZ0sDma9IBhsH1PNL5X4';
const WF_ID = 'fiU0ac3bSRkLGhaC';

// ─── UPDATED EXTRACT NODE — all commands ──────────────────────────────────────
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
  // Production commands
  isBrief:          t.startsWith('brief:') || t.startsWith('brief '),
  isContentRequest: t.startsWith('contenido:') || t.includes('genera contenido'),
  isApproval:       t.startsWith('apruebo') && !t.startsWith('apruebo plan'),
  isChange:         t.startsWith('cambio') && !t.startsWith('cambio dc'),
  isDesign:         t === 'diseño' || t === 'diseno',
  // Designer commands
  isDisenoListo:    t.startsWith('diseño listo') || t.startsWith('diseno listo'),
  // DC final approval
  isDcOk:           t.startsWith('dc ok') || t.startsWith('dc apruebo'),
  isDcCambio:       t.startsWith('dc cambio'),
  // Client flow
  isCliente:        t === 'cliente',
  // Content creation
  isBlog:           t.startsWith('blog:'),
  isScript:         t.startsWith('script:'),
  isEstrategia:     t === 'estrategia',
  // Status
  isEstado:         t === 'estado',
  raw: body
}}];`;

// ─── PARSE "diseño listo N" ───────────────────────────────────────────────────
const extraerDisenoListoCode = `const t = $input.first().json.text.toLowerCase();
const match = t.match(/(?:dise[nñ]o\\s+listo|listo)\\s+(\\d+)/i);
const numero = match ? parseInt(match[1]) : null;
return [{ json: { numero, phone: $input.first().json.phone } }];`;

// ─── PARSE "dc ok N" ─────────────────────────────────────────────────────────
const extraerDcOkCode = `const t = $input.first().json.text.toLowerCase();
const match = t.match(/dc\\s+(?:ok|apruebo)\\s+(\\d+|todo|todos)/i);
const val = match ? match[1] : 'todo';
const numero = (val === 'todo' || val === 'todos') ? null : parseInt(val);
return [{ json: { numero, tipo: numero ? 'numero' : 'todo', phone: $input.first().json.phone } }];`;

// ─── PARSE "dc cambio N: instrucción" ────────────────────────────────────────
const extraerDcCambioCode = `const msg = $input.first().json;
const t = msg.text;
const match = t.match(/dc\\s+cambio\\s+(\\d+)\\s*[:\\-]?\\s*(.+)/i);
const numero = match ? parseInt(match[1]) : 1;
const instruccion = match ? match[2].trim() : '';
return [{ json: { numero, instruccion, phone: msg.phone } }];`;

// ─── GET PIECE BY NUMBER ──────────────────────────────────────────────────────
const buscarPiezaCode = `const cmd = $('Extraer Nro Diseño Listo').first().json;
const items = $input.all();
const idx = cmd.numero ? cmd.numero - 1 : 0;
const pieza = items[idx] || items[0];
if (!pieza) return [{ json: { error: 'Pieza no encontrada', phone: cmd.phone } }];
return [{ json: {
  recordId: pieza.json.id,
  numero: cmd.numero,
  phone: cmd.phone,
  tema: pieza.json.fields?.['Concepto / Tema'] || pieza.json.fields?.['Título'] || '',
  tipo: pieza.json.fields?.['Tipo'] || ''
}}];`;

// ─── FILTER PIECES DC OK ──────────────────────────────────────────────────────
const filtrarDcOkCode = `const cmd = $('Extraer Nro DC Ok').first().json;
const items = $input.all();
if (!items.length) return [{ json: { noPending: true, phone: cmd.phone } }];
if (cmd.tipo === 'todo') {
  return items.map(i => ({ json: {
    recordId: i.json.id,
    titulo: i.json.fields?.['Concepto / Tema'] || '',
    phone: cmd.phone
  }}));
}
const idx = (cmd.numero || 1) - 1;
const pieza = items[idx] || items[0];
return [{ json: { recordId: pieza.json.id, titulo: pieza.json.fields?.['Concepto / Tema'] || '', phone: cmd.phone } }];`;

// ─── WA DESIGNER NOTIFICATION (after visual generation) ──────────────────────
// This replaces "WhatsApp — Briefs Listos" with a designer-specific message
const waDesignerMessage = `=🎨 *Nueva tarea de diseño* — Pieza {{ $json.numero || '' }}

*Tema:* {{ $json.tema || '' }}
*Tipo:* {{ $json.tipo || '' }}
*Día:* {{ $json.dia || '' }}

━━━━━━━━━━━━━━━
*ASSET GENERADO POR IA:*
{{ $json.imageUrl ? '📸 Imagen: ' + $json.imageUrl : ($json.videoUrl ? '🎬 Video: ' + $json.videoUrl : 'Ver Airtable') }}

*TEXTO OVERLAY:* {{ $json.textoOverlay || '' }}
*PALETA:* {{ $json.paleta || '' }}

━━━━━━━━━━━━━━━
*TU TAREA:*
{{ $json.instruccionesDisenador || 'Ver brief completo en Airtable' }}

━━━━━━━━━━━━━━━
*BRIEF COMPLETO + PROMPT MIDJOURNEY (para pauta):*
👉 https://airtable.com/appgS6jdmiMsGQyIF/tblSrW7hpZzIFkfZ2

Cuando termines responde: *diseño listo {{ $json.numero }}*`;

// ─── WA DC FINAL OK ──────────────────────────────────────────────────────────
const guardDcOkCode = `if ($itemIndex !== 0) return [];
const cmd = $('Extraer Nro DC Ok').first().json;
const tipo = cmd.tipo;
const numero = cmd.numero;
const text = tipo === 'todo' ? 'Todas las piezas aprobadas ✅' : 'Pieza ' + numero + ' aprobada ✅';
return [{ json: { phone: $input.first().json.phone || cmd.phone, texto: text } }];`;

// ─── WA DC CAMBIO → NOTIFY DESIGNER ─────────────────────────────────────────
const waDcCambioDesignerMessage = `=🔄 *Ajuste solicitado — Pieza {{ $('Extraer Nro DC Cambio').first().json.numero }}*

*Instrucción del DC:*
{{ $('Extraer Nro DC Cambio').first().json.instruccion }}

*Pieza:*
{{ $json.fields?.['Concepto / Tema'] || '' }}

Por favor aplica el cambio y vuelve a subir el asset a Airtable.
Luego responde: *diseño listo {{ $('Extraer Nro DC Cambio').first().json.numero }}*

👉 https://airtable.com/appgS6jdmiMsGQyIF/tblSrW7hpZzIFkfZ2`;

// ─── GENERATE CLIENT SUMMARY ─────────────────────────────────────────────────
const generarResumenClienteCode = `const items = $input.all();
const pieces = items.map((i, idx) => {
  const f = i.json.fields || {};
  return (idx + 1) + '. ' + (f['Tipo'] || '') + ' — ' + (f['Concepto / Tema'] || f['Título'] || '');
});
const phone = $('Extraer Datos del Mensaje').first().json.phone;
return [{ json: {
  phone,
  piezas: pieces.join('\\n'),
  total: items.length
}}];`;

// ─── NEW NODES ────────────────────────────────────────────────────────────────
const newNodes = [
  // Designer notifies DC that piece is ready
  {
    id: 'extraer_nro_diseno_listo',
    name: 'Extraer Nro Diseño Listo',
    type: 'n8n-nodes-base.code',
    typeVersion: 2, position: [1160, 1540],
    parameters: { jsCode: extraerDisenoListoCode }
  },
  {
    id: 'listar_en_diseno',
    name: 'Listar Piezas En Diseño',
    type: 'n8n-nodes-base.airtable',
    typeVersion: 2.1, position: [1400, 1540],
    parameters: {
      operation: 'list',
      base: { __rl: true, value: 'appgS6jdmiMsGQyIF', mode: 'id' },
      table: { __rl: true, value: 'tblSrW7hpZzIFkfZ2', mode: 'id' },
      filterByFormula: "({Estado}='En diseño')", options: {}
    },
    credentials: { airtableTokenApi: { id: 'NbV3Gvv9v4DmaR9c', name: 'Airtable MentorIA' } }
  },
  {
    id: 'buscar_pieza_lista',
    name: 'Buscar Pieza Lista',
    type: 'n8n-nodes-base.code',
    typeVersion: 2, position: [1640, 1540],
    parameters: { jsCode: buscarPiezaCode }
  },
  {
    id: 'marcar_revision_dc',
    name: 'Marcar Revisión DC',
    type: 'n8n-nodes-base.airtable',
    typeVersion: 2.1, position: [1880, 1540],
    parameters: {
      operation: 'update',
      base: { __rl: true, value: 'appgS6jdmiMsGQyIF', mode: 'id' },
      table: { __rl: true, value: 'tblSrW7hpZzIFkfZ2', mode: 'id' },
      id: '={{ $json.recordId }}',
      columns: { mappingMode: 'defineBelow', value: { 'Estado': 'Revisión DC' } }
    },
    credentials: { airtableTokenApi: { id: 'NbV3Gvv9v4DmaR9c', name: 'Airtable MentorIA' } }
  },
  {
    id: 'wa_dc_pieza_lista',
    name: 'WhatsApp — Pieza Lista para DC',
    type: 'n8n-nodes-evolution-api.evolutionApi',
    typeVersion: 1, position: [2120, 1540],
    parameters: {
      resource: 'messages-api', instanceName: 'mentoria-manolo',
      remoteJid: "={{ $json.phone + '@s.whatsapp.net' }}",
      messageText: "=👀 *Pieza {{ $json.numero }} lista para revisión DC*\n\nTema: {{ $json.tema }}\nTipo: {{ $json.tipo }}\n\n👉 https://airtable.com/appgS6jdmiMsGQyIF/tblSrW7hpZzIFkfZ2\n\nResponde *dc ok {{ $json.numero }}* para aprobar o *dc cambio {{ $json.numero }}: [instrucción]* para ajustar.",
      options_message: {}
    },
    credentials: { evolutionApi: { id: '25MBOz6svtSJ3wEE', name: 'Evolution API MentorIA' } }
  },

  // DC final approval
  {
    id: 'extraer_nro_dc_ok',
    name: 'Extraer Nro DC Ok',
    type: 'n8n-nodes-base.code',
    typeVersion: 2, position: [1160, 1760],
    parameters: { jsCode: extraerDcOkCode }
  },
  {
    id: 'listar_revision_dc',
    name: 'Listar En Revisión DC',
    type: 'n8n-nodes-base.airtable',
    typeVersion: 2.1, position: [1400, 1760],
    parameters: {
      operation: 'list',
      base: { __rl: true, value: 'appgS6jdmiMsGQyIF', mode: 'id' },
      table: { __rl: true, value: 'tblSrW7hpZzIFkfZ2', mode: 'id' },
      filterByFormula: "({Estado}='Revisión DC')", options: {}
    },
    credentials: { airtableTokenApi: { id: 'NbV3Gvv9v4DmaR9c', name: 'Airtable MentorIA' } }
  },
  {
    id: 'filtrar_piezas_dc_ok',
    name: 'Filtrar Piezas DC Ok',
    type: 'n8n-nodes-base.code',
    typeVersion: 2, position: [1640, 1760],
    parameters: { jsCode: filtrarDcOkCode }
  },
  {
    id: 'marcar_aprobado_dc_final',
    name: 'Marcar Aprobado DC Final',
    type: 'n8n-nodes-base.airtable',
    typeVersion: 2.1, position: [1880, 1760],
    parameters: {
      operation: 'update',
      base: { __rl: true, value: 'appgS6jdmiMsGQyIF', mode: 'id' },
      table: { __rl: true, value: 'tblSrW7hpZzIFkfZ2', mode: 'id' },
      id: '={{ $json.recordId }}',
      columns: { mappingMode: 'defineBelow', value: {
        'Estado': 'Aprobado DC',
        'Fecha Aprobación DC': '={{ $now.toISODate() }}'
      }}
    },
    credentials: { airtableTokenApi: { id: 'NbV3Gvv9v4DmaR9c', name: 'Airtable MentorIA' } }
  },
  {
    id: 'guard_dc_ok',
    name: 'Guard WA DC Ok',
    type: 'n8n-nodes-base.code',
    typeVersion: 2, position: [2120, 1760],
    parameters: { jsCode: guardDcOkCode }
  },
  {
    id: 'wa_dc_ok_confirmado',
    name: 'WhatsApp — DC Ok Confirmado',
    type: 'n8n-nodes-evolution-api.evolutionApi',
    typeVersion: 1, position: [2360, 1760],
    parameters: {
      resource: 'messages-api', instanceName: 'mentoria-manolo',
      remoteJid: "={{ $json.phone + '@s.whatsapp.net' }}",
      messageText: "={{ $json.texto + '\\n\\nCuando tengas todo listo → manda *cliente* para enviar al cliente.' }}",
      options_message: {}
    },
    credentials: { evolutionApi: { id: '25MBOz6svtSJ3wEE', name: 'Evolution API MentorIA' } }
  },

  // DC requests change → notify designer
  {
    id: 'extraer_nro_dc_cambio',
    name: 'Extraer Nro DC Cambio',
    type: 'n8n-nodes-base.code',
    typeVersion: 2, position: [1160, 1960],
    parameters: { jsCode: extraerDcCambioCode }
  },
  {
    id: 'obtener_pieza_dc_cambio',
    name: 'Obtener Pieza DC Cambio',
    type: 'n8n-nodes-base.airtable',
    typeVersion: 2.1, position: [1400, 1960],
    parameters: {
      operation: 'list',
      base: { __rl: true, value: 'appgS6jdmiMsGQyIF', mode: 'id' },
      table: { __rl: true, value: 'tblSrW7hpZzIFkfZ2', mode: 'id' },
      filterByFormula: "({Estado}='Revisión DC')", options: {}
    },
    credentials: { airtableTokenApi: { id: 'NbV3Gvv9v4DmaR9c', name: 'Airtable MentorIA' } }
  },
  {
    id: 'marcar_volver_diseno',
    name: 'Marcar Volver a Diseño',
    type: 'n8n-nodes-base.airtable',
    typeVersion: 2.1, position: [1640, 1960],
    parameters: {
      operation: 'update',
      base: { __rl: true, value: 'appgS6jdmiMsGQyIF', mode: 'id' },
      table: { __rl: true, value: 'tblSrW7hpZzIFkfZ2', mode: 'id' },
      id: '={{ $json[($("Extraer Nro DC Cambio").first().json.numero - 1)]?.id || $json[0]?.id }}',
      columns: { mappingMode: 'defineBelow', value: {
        'Estado': 'En diseño',
        'Comentarios DC': '={{ $("Extraer Nro DC Cambio").first().json.instruccion }}'
      }}
    },
    credentials: { airtableTokenApi: { id: 'NbV3Gvv9v4DmaR9c', name: 'Airtable MentorIA' } }
  },
  {
    id: 'wa_diseno_ajuste',
    name: 'WhatsApp — Ajuste al Diseñador',
    type: 'n8n-nodes-evolution-api.evolutionApi',
    typeVersion: 1, position: [1880, 1960],
    parameters: {
      resource: 'messages-api', instanceName: 'mentoria-manolo',
      remoteJid: "={{ $('Extraer Datos del Mensaje').first().json.phone + '@s.whatsapp.net' }}",
      messageText: waDcCambioDesignerMessage,
      options_message: {}
    },
    credentials: { evolutionApi: { id: '25MBOz6svtSJ3wEE', name: 'Evolution API MentorIA' } }
  },

  // Send to client
  {
    id: 'listar_aprobadas_dc_cliente',
    name: 'Listar Aprobadas Para Cliente',
    type: 'n8n-nodes-base.airtable',
    typeVersion: 2.1, position: [1160, 2160],
    parameters: {
      operation: 'list',
      base: { __rl: true, value: 'appgS6jdmiMsGQyIF', mode: 'id' },
      table: { __rl: true, value: 'tblSrW7hpZzIFkfZ2', mode: 'id' },
      filterByFormula: "({Estado}='Aprobado DC')", options: {}
    },
    credentials: { airtableTokenApi: { id: 'NbV3Gvv9v4DmaR9c', name: 'Airtable MentorIA' } }
  },
  {
    id: 'generar_resumen_cliente',
    name: 'Generar Resumen Cliente',
    type: 'n8n-nodes-base.code',
    typeVersion: 2, position: [1400, 2160],
    parameters: { jsCode: generarResumenClienteCode }
  },
  {
    id: 'marcar_pendiente_cliente',
    name: 'Marcar Pendiente Cliente',
    type: 'n8n-nodes-base.airtable',
    typeVersion: 2.1, position: [1640, 2160],
    parameters: {
      operation: 'update',
      base: { __rl: true, value: 'appgS6jdmiMsGQyIF', mode: 'id' },
      table: { __rl: true, value: 'tblSrW7hpZzIFkfZ2', mode: 'id' },
      id: '={{ $("Listar Aprobadas Para Cliente").all()[$itemIndex]?.json?.id || "" }}',
      columns: { mappingMode: 'defineBelow', value: { 'Estado': 'Pendiente Cliente' } }
    },
    credentials: { airtableTokenApi: { id: 'NbV3Gvv9v4DmaR9c', name: 'Airtable MentorIA' } }
  },
  {
    id: 'wa_cliente_revision',
    name: 'WhatsApp — Enviar a Cliente',
    type: 'n8n-nodes-evolution-api.evolutionApi',
    typeVersion: 1, position: [1880, 2160],
    parameters: {
      resource: 'messages-api', instanceName: 'mentoria-manolo',
      remoteJid: "={{ $json.phone + '@s.whatsapp.net' }}",
      messageText: `=📋 *Contenido de esta semana listo para tu revisión* ✅

{{ $json.piezas }}

👉 Revisa cada pieza aquí:
https://airtable.com/appgS6jdmiMsGQyIF/tblSrW7hpZzIFkfZ2

Responde:
✅ *apruebo todo* — si todo está perfecto
✏️ *cambio [número]: [qué cambiar]* — para ajustar una pieza`,
      options_message: {}
    },
    credentials: { evolutionApi: { id: '25MBOz6svtSJ3wEE', name: 'Evolution API MentorIA' } }
  }
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function fix() {
  const res = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    headers: { 'X-N8N-API-KEY': N8N_KEY }
  });
  const wf = await res.json();
  console.log('Fetched:', wf.name, '— nodes:', wf.nodes.length);

  // 1. Update extract node with all new commands
  const extractNode = wf.nodes.find(n => n.name === 'Extraer Datos del Mensaje');
  if (extractNode) {
    extractNode.parameters.jsCode = extractCode;
    console.log('✅ Updated Extraer Datos del Mensaje (all commands)');
  }

  // 2. Update WhatsApp Briefs Listos → now becomes designer notification
  const waBriefs = wf.nodes.find(n => n.name === 'WhatsApp — Briefs Listos');
  if (waBriefs) {
    waBriefs.parameters.messageText = waDesignerMessage;
    console.log('✅ Updated WhatsApp — Briefs Listos → designer notification');
  }

  // 3. Update Router — add all new commands
  const router = wf.nodes.find(n => n.name === 'Router de Comandos');
  if (router) {
    const existing = router.parameters.rules.values.filter(r =>
      !['diseñolisto','dcok','dccambio','cliente','blog','script','estado'].includes(r.outputKey)
    );
    router.parameters.rules.values = [
      ...existing,
      { conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'loose' },
          conditions: [{ id: 'f', leftValue: '={{ $json.isDisenoListo }}', rightValue: true, operator: { type: 'boolean', operation: 'equals' } }],
          combinator: 'and' }, renameOutput: true, outputKey: 'diseñolisto' },
      { conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'loose' },
          conditions: [{ id: 'g', leftValue: '={{ $json.isDcOk }}', rightValue: true, operator: { type: 'boolean', operation: 'equals' } }],
          combinator: 'and' }, renameOutput: true, outputKey: 'dcok' },
      { conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'loose' },
          conditions: [{ id: 'h', leftValue: '={{ $json.isDcCambio }}', rightValue: true, operator: { type: 'boolean', operation: 'equals' } }],
          combinator: 'and' }, renameOutput: true, outputKey: 'dccambio' },
      { conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'loose' },
          conditions: [{ id: 'i', leftValue: '={{ $json.isCliente }}', rightValue: true, operator: { type: 'boolean', operation: 'equals' } }],
          combinator: 'and' }, renameOutput: true, outputKey: 'cliente' },
    ];
    console.log('✅ Router updated —', router.parameters.rules.values.length, 'routes');
  }

  // 4. Add new nodes
  for (const node of newNodes) {
    const exists = wf.nodes.find(n => n.name === node.name);
    if (!exists) { wf.nodes.push(node); console.log('➕', node.name); }
    else { Object.assign(exists, node); console.log('🔄', node.name); }
  }

  // 5. Wire new connections
  const c = wf.connections;

  // Get current router outputs
  const r0 = c['Router de Comandos']?.main?.[0] || [{ node: 'Procesar Brief con IA',      type: 'main', index: 0 }];
  const r1 = c['Router de Comandos']?.main?.[1] || [{ node: 'Generar Contenido con IA',   type: 'main', index: 0 }];
  const r2 = c['Router de Comandos']?.main?.[2] || [{ node: 'Extraer Nro Aprobacion',      type: 'main', index: 0 }];
  const r3 = c['Router de Comandos']?.main?.[3] || [{ node: 'Extraer Nro Cambio',          type: 'main', index: 0 }];
  const r4 = c['Router de Comandos']?.main?.[4] || [{ node: 'Listar Piezas Aprobadas DC',  type: 'main', index: 0 }];

  c['Router de Comandos'] = {
    main: [
      r0, r1, r2, r3, r4,
      [{ node: 'Extraer Nro Diseño Listo', type: 'main', index: 0 }],  // 5: diseñolisto
      [{ node: 'Extraer Nro DC Ok',         type: 'main', index: 0 }],  // 6: dcok
      [{ node: 'Extraer Nro DC Cambio',     type: 'main', index: 0 }],  // 7: dccambio
      [{ node: 'Listar Aprobadas Para Cliente', type: 'main', index: 0 }], // 8: cliente
    ]
  };

  // Diseño listo branch
  c['Extraer Nro Diseño Listo']   = { main: [[{ node: 'Listar Piezas En Diseño',         type: 'main', index: 0 }]] };
  c['Listar Piezas En Diseño']    = { main: [[{ node: 'Buscar Pieza Lista',               type: 'main', index: 0 }]] };
  c['Buscar Pieza Lista']         = { main: [[{ node: 'Marcar Revisión DC',               type: 'main', index: 0 }]] };
  c['Marcar Revisión DC']         = { main: [[{ node: 'WhatsApp — Pieza Lista para DC',   type: 'main', index: 0 }]] };

  // DC ok branch
  c['Extraer Nro DC Ok']          = { main: [[{ node: 'Listar En Revisión DC',            type: 'main', index: 0 }]] };
  c['Listar En Revisión DC']      = { main: [[{ node: 'Filtrar Piezas DC Ok',             type: 'main', index: 0 }]] };
  c['Filtrar Piezas DC Ok']       = { main: [[{ node: 'Marcar Aprobado DC Final',         type: 'main', index: 0 }]] };
  c['Marcar Aprobado DC Final']   = { main: [[{ node: 'Guard WA DC Ok',                  type: 'main', index: 0 }]] };
  c['Guard WA DC Ok']             = { main: [[{ node: 'WhatsApp — DC Ok Confirmado',      type: 'main', index: 0 }]] };

  // DC cambio branch
  c['Extraer Nro DC Cambio']      = { main: [[{ node: 'Obtener Pieza DC Cambio',          type: 'main', index: 0 }]] };
  c['Obtener Pieza DC Cambio']    = { main: [[{ node: 'Marcar Volver a Diseño',           type: 'main', index: 0 }]] };
  c['Marcar Volver a Diseño']     = { main: [[{ node: 'WhatsApp — Ajuste al Diseñador',  type: 'main', index: 0 }]] };

  // Cliente branch
  c['Listar Aprobadas Para Cliente'] = { main: [[{ node: 'Generar Resumen Cliente',        type: 'main', index: 0 }]] };
  c['Generar Resumen Cliente']       = { main: [[{ node: 'WhatsApp — Enviar a Cliente',    type: 'main', index: 0 }]] };

  console.log('\nPushing...');
  const upd = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': N8N_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: { executionOrder: 'v1' } })
  });
  const result = await upd.json();
  if (result.id) {
    console.log('\n✅ Phase 2D done —', result.nodes?.length, 'nodes');
  } else {
    console.error('❌', JSON.stringify(result, null, 2));
  }
}
fix();
