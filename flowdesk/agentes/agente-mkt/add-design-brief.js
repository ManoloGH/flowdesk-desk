const N8N_API = 'https://prueba-digisaurios-n8n.4jvoco.easypanel.host/api/v1';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmY5MjkzMC0yYjk1LTRmNjAtODViOC0xZjYwNTFkNzhjMGUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc1NjEyODI0fQ.s4_wwDB_Xjwlg29cdfePqLZYZ0sDma9IBhsH1PNL5X4';
const WF_ID = 'fiU0ac3bSRkLGhaC';

// ─── CODE STRINGS ─────────────────────────────────────────────────────────────

// Updated extract: adds isDesign detection
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
    isDesign: t.startsWith('diseño') || t.startsWith('diseno') || t === 'diseño' || t === 'diseno',
    messageType: msg.conversation ? 'text' : (msg.extendedTextMessage ? 'text' : 'other'),
    raw: body
  }
}];`;

// Prepare context per piece for Claude visual brief
const prepararContextoPiezaCode = `const items = $input.all();
const phone = items[0]?.json?.fields ?
  // If coming from Airtable list, phone comes from trigger
  $('Extraer Datos del Mensaje').first().json.phone
  : items[0]?.json?.phone || '';

return items.map((item, idx) => {
  const f = item.json.fields || {};
  return {
    json: {
      recordId: item.json.id,
      numero: idx + 1,
      phone,
      dia: f['Día'] || f['Dia'] || '',
      red: f['Red Social'] || '',
      tipo: f['Tipo'] || '',
      tema: f['Concepto / Tema'] || f['Título'] || '',
      copy: f['Copy'] || '',
      hashtags: f['Hashtags'] || '',
      hora: f['Hora'] || '18:00'
    }
  };
});`;

// Parse visual brief from Claude
const parsearBriefVisualCode = `const raw = $input.first().json.text;
const prev = $('Preparar Contexto Pieza').item.json;
let brief;
try {
  const clean = raw.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
  const match = clean.match(/\\{[\\s\\S]*\\}/);
  brief = match ? JSON.parse(match[0]) : {};
} catch(e) {
  brief = { error: 'Parse error', raw: raw.substring(0, 200) };
}
// Format brief as readable text for Airtable
const briefText = [
  'CONCEPTO: ' + (brief.concepto_visual || ''),
  'FORMATO: ' + (brief.formato || prev.tipo || ''),
  'DIMENSIONES: ' + (brief.dimensiones || '1080x1080'),
  'PALETA: ' + (Array.isArray(brief.paleta_sugerida) ? brief.paleta_sugerida.join(', ') : (brief.paleta_sugerida || '')),
  'COMPOSICIÓN: ' + (brief.composicion || ''),
  'TEXTO OVERLAY: ' + (brief.texto_overlay || ''),
  'ELEMENTOS: ' + (brief.elementos_graficos || ''),
  'ESTILO: ' + (brief.estilo_visual || ''),
  '',
  'PROMPT IA:',
  (brief.prompt_ia || ''),
  '',
  'INSTRUCCIONES DISEÑADOR:',
  (brief.instrucciones_disenador || '')
].join('\\n');

return [{
  json: {
    recordId: prev.recordId,
    numero: prev.numero,
    phone: prev.phone,
    tema: prev.tema,
    dia: prev.dia,
    briefText,
    promptIA: brief.prompt_ia || '',
    instrucciones: brief.instrucciones_disenador || ''
  }
}];`;

// Guard: fire WA notification only on first item
const guardWaDisenioCode = `if ($itemIndex !== 0) return [];
const phone = $input.first().json.phone || $('Extraer Datos del Mensaje').first().json.phone;
return [{ json: { phone } }];`;

// ─── VISUAL BRIEF PROMPT ──────────────────────────────────────────────────────

const briefPrompt = `=Eres un director de arte experto en redes sociales. Necesito que generes el brief visual para una pieza de contenido.

PIEZA:
Dia: {{ $json.dia }}
Red Social: {{ $json.red }}
Tipo: {{ $json.tipo }}
Tema: {{ $json.tema }}
Copy: {{ $json.copy }}
Hashtags: {{ $json.hashtags }}

Genera un brief visual detallado en formato JSON:
{
  "concepto_visual": "descripcion del concepto en 2 oraciones (que imagen transmite la emocion del copy)",
  "formato": "estatico/reel/carrusel/story",
  "dimensiones": "1080x1080 o 1080x1920 segun la red y tipo",
  "paleta_sugerida": ["#color1", "#color2", "#color3"],
  "composicion": "descripcion del layout: que va arriba, al centro, abajo, texto superpuesto donde",
  "texto_overlay": "texto exacto que aparece sobre la imagen (maximo 8 palabras)",
  "elementos_graficos": "iconos, formas, ilustraciones, texturas que refuerzan el mensaje",
  "estilo_visual": "estilo estetico: minimalista/vibrante/editorial/organico/corporativo",
  "referencias": "marca o estetica de referencia (ej: IKEA, Apple, Tulum aesthetic)",
  "prompt_ia": "prompt en ingles para DALL-E o Midjourney, 50-80 palabras, ultra detallado, include art style, lighting, colors, composition",
  "instrucciones_disenador": "pasos concretos para el disenador: que debe agregar, quitar o modificar sobre la imagen generada por IA para adaptarla a la marca"
}

Responde SOLO con el JSON.`;

// ─── NEW NODES ────────────────────────────────────────────────────────────────

const newNodes = [
  {
    id: 'listar_aprobadas_dc',
    name: 'Listar Piezas Aprobadas DC',
    type: 'n8n-nodes-base.airtable',
    typeVersion: 2.1,
    position: [1160, 1260],
    parameters: {
      operation: 'list',
      base: { __rl: true, value: 'appgS6jdmiMsGQyIF', mode: 'id' },
      table: { __rl: true, value: 'tblSrW7hpZzIFkfZ2', mode: 'id' },
      filterByFormula: "({Estado}='Aprobado DC')",
      options: {}
    },
    credentials: {
      airtableTokenApi: { id: 'NbV3Gvv9v4DmaR9c', name: 'Airtable MentorIA' }
    }
  },
  {
    id: 'preparar_contexto_pieza',
    name: 'Preparar Contexto Pieza',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [1400, 1260],
    parameters: { jsCode: prepararContextoPiezaCode }
  },
  {
    id: 'claude_model_diseno',
    name: 'Claude — Modelo Diseño',
    type: '@n8n/n8n-nodes-langchain.lmChatAnthropic',
    typeVersion: 1.2,
    position: [1640, 1420],
    parameters: {
      model: 'claude-sonnet-4-5',
      options: { maxTokensToSample: 2000 }
    },
    credentials: {
      anthropicApi: { id: 'z0YdT9oApiWKr4Eq', name: 'Anthropic MentorIA' }
    }
  },
  {
    id: 'generar_brief_visual',
    name: 'Generar Brief Visual',
    type: '@n8n/n8n-nodes-langchain.chainLlm',
    typeVersion: 1.4,
    position: [1640, 1260],
    parameters: {
      promptType: 'define',
      text: briefPrompt
    }
  },
  {
    id: 'parsear_brief_visual',
    name: 'Parsear Brief Visual',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [1880, 1260],
    parameters: { jsCode: parsearBriefVisualCode }
  },
  {
    id: 'guardar_brief_airtable',
    name: 'Guardar Brief en Pieza',
    type: 'n8n-nodes-base.airtable',
    typeVersion: 2.1,
    position: [2120, 1260],
    parameters: {
      operation: 'update',
      base: { __rl: true, value: 'appgS6jdmiMsGQyIF', mode: 'id' },
      table: { __rl: true, value: 'tblSrW7hpZzIFkfZ2', mode: 'id' },
      id: '={{ $json.recordId }}',
      columns: {
        mappingMode: 'defineBelow',
        value: {
          'Brief Visual': '={{ $json.briefText }}',
          'Prompt IA': '={{ $json.promptIA }}',
          'Estado': 'Listo para Diseño'
        }
      }
    },
    credentials: {
      airtableTokenApi: { id: 'NbV3Gvv9v4DmaR9c', name: 'Airtable MentorIA' }
    }
  },
  {
    id: 'guard_wa_diseno',
    name: 'Guard WA Diseño',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [2360, 1260],
    parameters: { jsCode: guardWaDisenioCode }
  },
  {
    id: 'wa_diseno_listo',
    name: 'WhatsApp — Briefs Listos',
    type: 'n8n-nodes-evolution-api.evolutionApi',
    typeVersion: 1,
    position: [2600, 1260],
    parameters: {
      resource: 'messages-api',
      instanceName: 'mentoria-manolo',
      remoteJid: "={{ $json.phone + '@s.whatsapp.net' }}",
      messageText: "=🎨 *Briefs visuales listos* ✅\n\nCada pieza tiene:\n• Concepto visual\n• Paleta de colores\n• Instrucciones de composición\n• Prompt para IA (DALL-E / Midjourney)\n• Instrucciones de edición final\n\n👉 Airtable → Plan de Contenido:\nhttps://airtable.com/appgS6jdmiMsGQyIF/tblSrW7hpZzIFkfZ2\n\nCuando tengas los assets listos, manda *cliente* para enviar al cliente.",
      options_message: {}
    },
    credentials: {
      evolutionApi: { id: '25MBOz6svtSJ3wEE', name: 'Evolution API MentorIA' }
    }
  }
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function fix() {
  const res = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    headers: { 'X-N8N-API-KEY': N8N_KEY }
  });
  const wf = await res.json();
  console.log('Fetched workflow:', wf.name, '— nodes:', wf.nodes.length);

  // 1. Update Extraer Datos del Mensaje (add isDesign)
  const extractNode = wf.nodes.find(n => n.name === 'Extraer Datos del Mensaje');
  if (extractNode) {
    extractNode.parameters.jsCode = extractCode;
    console.log('✅ Updated Extraer Datos del Mensaje (+isDesign)');
  }

  // 2. Update Router: add "diseño" case
  const router = wf.nodes.find(n => n.name === 'Router de Comandos');
  if (router) {
    const existingRules = router.parameters.rules.values.filter(
      r => r.outputKey !== 'diseño'
    );
    router.parameters.rules.values = [
      ...existingRules,
      {
        conditions: {
          options: { caseSensitive: false, leftValue: '', typeValidation: 'loose' },
          conditions: [{ id: 'e', leftValue: '={{ $json.isDesign }}', rightValue: true, operator: { type: 'boolean', operation: 'equals' } }],
          combinator: 'and'
        },
        renameOutput: true,
        outputKey: 'diseño'
      }
    ];
    console.log('✅ Updated Router — now has', router.parameters.rules.values.length, 'routes');
  }

  // 3. Add new nodes
  for (const node of newNodes) {
    const exists = wf.nodes.find(n => n.name === node.name);
    if (!exists) {
      wf.nodes.push(node);
      console.log('➕ Added:', node.name);
    } else {
      Object.assign(exists, node);
      console.log('🔄 Updated:', node.name);
    }
  }

  // 4. Update connections
  const c = wf.connections;

  // Router: rebuild with 5 outputs now (brief, contenido, apruebo, cambio, diseño)
  const r0 = c['Router de Comandos']?.main?.[0] || [{ node: 'Procesar Brief con IA', type: 'main', index: 0 }];
  const r1 = c['Router de Comandos']?.main?.[1] || [{ node: 'Generar Contenido con IA', type: 'main', index: 0 }];
  const r2 = c['Router de Comandos']?.main?.[2] || [{ node: 'Extraer Nro Aprobacion', type: 'main', index: 0 }];
  const r3 = c['Router de Comandos']?.main?.[3] || [{ node: 'Extraer Nro Cambio', type: 'main', index: 0 }];

  c['Router de Comandos'] = {
    main: [
      r0, r1, r2, r3,
      [{ node: 'Listar Piezas Aprobadas DC', type: 'main', index: 0 }]
    ]
  };

  // Design branch connections
  c['Listar Piezas Aprobadas DC'] = { main: [[{ node: 'Preparar Contexto Pieza', type: 'main', index: 0 }]] };
  c['Preparar Contexto Pieza'] = { main: [[{ node: 'Generar Brief Visual', type: 'main', index: 0 }]] };
  c['Claude — Modelo Diseño'] = {
    ai_languageModel: [[{ node: 'Generar Brief Visual', type: 'ai_languageModel', index: 0 }]]
  };
  c['Generar Brief Visual'] = { main: [[{ node: 'Parsear Brief Visual', type: 'main', index: 0 }]] };
  c['Parsear Brief Visual'] = { main: [[{ node: 'Guardar Brief en Pieza', type: 'main', index: 0 }]] };
  c['Guardar Brief en Pieza'] = { main: [[{ node: 'Guard WA Diseño', type: 'main', index: 0 }]] };
  c['Guard WA Diseño'] = { main: [[{ node: 'WhatsApp — Briefs Listos', type: 'main', index: 0 }]] };

  console.log('\nPushing update...');

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
    console.log('\n📱 Nuevo comando disponible:');
    console.log('  diseño    → genera briefs visuales para todas las piezas "Aprobado DC"');
    console.log('\nCada pieza en Airtable tendrá:');
    console.log('  • Campo "Brief Visual" con concepto, paleta, composición, instrucciones');
    console.log('  • Campo "Prompt IA" listo para DALL-E o Midjourney');
    console.log('  • Estado → "Listo para Diseño"');
    console.log('\n⚠️  Recuerda: Unpublish → Publish en n8n UI');
    console.log('\nNota: Los campos "Brief Visual" y "Prompt IA" deben existir en la tabla');
    console.log('Plan de Contenido de Airtable. Si no existen, agrégalos como campos de texto largo.');
  } else {
    console.error('❌ Error:', JSON.stringify(result, null, 2));
  }
}

fix();
