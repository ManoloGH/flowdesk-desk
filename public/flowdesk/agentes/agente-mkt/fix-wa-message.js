const N8N_API = 'https://prueba-digisaurios-n8n.4jvoco.easypanel.host/api/v1';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmY5MjkzMC0yYjk1LTRmNjAtODViOC0xZjYwNTFkNzhjMGUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc1NjEyODI0fQ.s4_wwDB_Xjwlg29cdfePqLZYZ0sDma9IBhsH1PNL5X4';

async function fix() {
  const res = await fetch(`${N8N_API}/workflows/fiU0ac3bSRkLGhaC`, {
    headers: { 'X-N8N-API-KEY': N8N_KEY }
  });
  const wf = await res.json();

  // Fix message text
  const waNode = wf.nodes.find(n => n.name === 'WhatsApp — Contenido Listo');
  waNode.parameters.messageText = `=🎨 *Contenido semanal listo* ✅

7 piezas generadas y guardadas en Airtable.

👉 Revisar en Plan de Contenido:
https://airtable.com/appgS6jdmiMsGQyIF/tblSrW7hpZzIFkfZ2

Aprueba antes de diseñar.`;

  // Fix: WA fires once from Parsear, not from Airtable (which runs 7 times)
  // Parsear outputs 7 items → Airtable runs 7 times
  // Solution: WA connects from Parsear output 1 (index 1), Airtable from output 0
  // But chainLlm only has 1 output — use a separate path

  // Cleanest fix: add an aggregator Code node before WA
  const aggregatorExists = wf.nodes.find(n => n.name === 'Enviar Notificacion');
  if (!aggregatorExists) {
    wf.nodes.push({
      id: 'aggregator',
      name: 'Enviar Notificacion',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [2120, 240],
      parameters: {
        jsCode: `// Solo ejecutar en el primer item
const index = $itemIndex;
if (index !== 0) return [];
return [{ json: { send: true } }];`
      }
    });
  } else {
    aggregatorExists.parameters.jsCode = `const index = $itemIndex;
if (index !== 0) return [];
return [{ json: { send: true } }];`;
  }

  // Connections: Parsear -> Airtable AND Parsear -> Aggregator -> WA
  wf.connections['Parsear Contenido JSON'] = {
    main: [[{ node: 'Guardar Pieza en Airtable', type: 'main', index: 0 }]]
  };
  wf.connections['Guardar Pieza en Airtable'] = {
    main: [[{ node: 'Enviar Notificacion', type: 'main', index: 0 }]]
  };
  wf.connections['Enviar Notificacion'] = {
    main: [[{ node: 'WhatsApp — Contenido Listo', type: 'main', index: 0 }]]
  };
  delete wf.connections['WhatsApp — Contenido Listo'];

  const upd = await fetch(`${N8N_API}/workflows/fiU0ac3bSRkLGhaC`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': N8N_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: { executionOrder: 'v1' } })
  });
  const result = await upd.json();
  console.log(result.id ? '✅ Actualizado' : 'Error: ' + result.message);
}

fix();
