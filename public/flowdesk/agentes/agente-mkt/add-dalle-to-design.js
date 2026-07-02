const N8N_API = 'https://prueba-digisaurios-n8n.4jvoco.easypanel.host/api/v1';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmY5MjkzMC0yYjk1LTRmNjAtODViOC0xZjYwNTFkNzhjMGUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc1NjEyODI0fQ.s4_wwDB_Xjwlg29cdfePqLZYZ0sDma9IBhsH1PNL5X4';
const WF_ID = 'fiU0ac3bSRkLGhaC';
const OPENAI_KEY = process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY';

// Merge DALL-E URL with brief data from Parsear Brief Visual
const extraerURLCode = `const url = $json.data?.[0]?.url || '';
const prev = $('Parsear Brief Visual').item.json;
return [{
  json: {
    recordId: prev.recordId,
    numero: prev.numero,
    phone: prev.phone,
    tema: prev.tema,
    dia: prev.dia,
    briefText: prev.briefText,
    promptIA: prev.promptIA,
    instrucciones: prev.instrucciones,
    imageUrl: url
  }
}];`;

// Updated WhatsApp message with image URL per piece
const guardWaDisenioCode = `if ($itemIndex !== 0) return [];
const phone = $('Extraer Datos del Mensaje').first().json.phone;
return [{ json: { phone } }];`;

async function fix() {
  const res = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    headers: { 'X-N8N-API-KEY': N8N_KEY }
  });
  const wf = await res.json();
  console.log('Fetched workflow:', wf.name, '— nodes:', wf.nodes.length);

  // 1. Add DALL-E HTTP Request node (after Parsear Brief Visual)
  const dalleNode = wf.nodes.find(n => n.name === 'Generar Imagen DALL-E');
  if (!dalleNode) {
    wf.nodes.push({
      id: 'dalle_generate',
      name: 'Generar Imagen DALL-E',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [2120, 1260],
      parameters: {
        method: 'POST',
        url: 'https://api.openai.com/v1/images/generations',
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: 'Authorization', value: `Bearer ${OPENAI_KEY}` },
            { name: 'Content-Type', value: 'application/json' }
          ]
        },
        sendBody: true,
        contentType: 'json',
        bodyParameters: {
          parameters: [
            { name: 'model', value: 'dall-e-3' },
            { name: 'prompt', value: '={{ $json.promptIA }}' },
            { name: 'n', value: '=1' },
            { name: 'size', value: '1024x1024' },
            { name: 'quality', value: 'standard' },
            { name: 'style', value: 'vivid' }
          ]
        }
      }
    });
    console.log('➕ Added: Generar Imagen DALL-E');
  } else {
    console.log('🔄 Already exists: Generar Imagen DALL-E');
  }

  // 2. Add URL extraction Code node (after DALL-E)
  const extractUrlNode = wf.nodes.find(n => n.name === 'Extraer URL Imagen');
  if (!extractUrlNode) {
    wf.nodes.push({
      id: 'extraer_url_imagen',
      name: 'Extraer URL Imagen',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [2360, 1260],
      parameters: { jsCode: extraerURLCode }
    });
    console.log('➕ Added: Extraer URL Imagen');
  }

  // 3. Shift existing nodes to the right: Guardar Brief en Pieza, Guard WA Diseño, WhatsApp — Briefs Listos
  const toShift = ['Guardar Brief en Pieza', 'Guard WA Diseño', 'WhatsApp — Briefs Listos'];
  for (const name of toShift) {
    const n = wf.nodes.find(nd => nd.name === name);
    if (n) {
      n.position[0] += 480; // shift right to make room for 2 new nodes
      console.log(`📐 Shifted right: ${name} → x=${n.position[0]}`);
    }
  }

  // 4. Update Guardar Brief en Pieza to also save imageUrl
  const saveNode = wf.nodes.find(n => n.name === 'Guardar Brief en Pieza');
  if (saveNode) {
    saveNode.parameters.columns.value['URL Asset Final'] = '={{ $json.imageUrl }}';
    saveNode.parameters.id = '={{ $json.recordId }}';
    console.log('✅ Updated Guardar Brief en Pieza (+URL Asset Final)');
  }

  // 5. Update Guard WA Diseño code (use Extraer Datos del Mensaje reference)
  const guardNode = wf.nodes.find(n => n.name === 'Guard WA Diseño');
  if (guardNode) {
    guardNode.parameters.jsCode = guardWaDisenioCode;
  }

  // 6. Update connections: rewire Parsear Brief Visual → DALL-E → Extraer URL → Guardar Brief
  const c = wf.connections;
  c['Parsear Brief Visual'] = { main: [[{ node: 'Generar Imagen DALL-E', type: 'main', index: 0 }]] };
  c['Generar Imagen DALL-E'] = { main: [[{ node: 'Extraer URL Imagen', type: 'main', index: 0 }]] };
  c['Extraer URL Imagen'] = { main: [[{ node: 'Guardar Brief en Pieza', type: 'main', index: 0 }]] };
  // rest of chain remains: Guardar → Guard → WhatsApp

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
    console.log('\nFlujo de diseño ahora:');
    console.log('  diseño → Claude brief → DALL-E imagen → Airtable (brief + URL) → WA diseñador');
    console.log('\n⚠️  Unpublish → Publish en n8n UI');
    console.log('⚠️  Nota: URL de DALL-E expira en ~1 hora — descargar imagen al recibirla');
  } else {
    console.error('❌ Error:', JSON.stringify(result, null, 2));
  }
}

fix();
