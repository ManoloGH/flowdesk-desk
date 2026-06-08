const N8N_API = 'https://prueba-digisaurios-n8n.4jvoco.easypanel.host/api/v1';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmY5MjkzMC0yYjk1LTRmNjAtODViOC0xZjYwNTFkNzhjMGUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc1NjEyODI0fQ.s4_wwDB_Xjwlg29cdfePqLZYZ0sDma9IBhsH1PNL5X4';

const fixedCode = `const raw = $input.first().json.text;
let semana = [];
try {
  const clean = raw.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
  const match = clean.match(/\\{[\\s\\S]*\\}/);
  const obj = match ? JSON.parse(match[0]) : {};
  semana = obj.semana || [];
} catch(e) {
  semana = [];
}
const prev = $('Extraer Datos del Mensaje').first().json;
return semana.map(p => ({ json: { ...p, phone: prev.phone } }));`;

async function fix() {
  // Get current workflow
  const res = await fetch(`${N8N_API}/workflows/fiU0ac3bSRkLGhaC`, {
    headers: { 'X-N8N-API-KEY': N8N_KEY }
  });
  const wf = await res.json();

  // Fix parser node
  const parse = wf.nodes.find(n => n.name === 'Parsear Contenido JSON');
  parse.parameters.jsCode = fixedCode;

  // Remove unwanted nodes
  wf.nodes = wf.nodes.filter(n => !['Ignorar Mensajes Propios', 'Por cada pieza'].includes(n.name));

  // Fix connections
  wf.connections['Webhook WhatsApp Entrante'] = { main: [[{ node: 'Extraer Datos del Mensaje', type: 'main', index: 0 }]] };
  wf.connections['Parsear Contenido JSON'] = { main: [[{ node: 'Guardar Pieza en Airtable', type: 'main', index: 0 }]] };
  wf.connections['Guardar Pieza en Airtable'] = { main: [[{ node: 'WhatsApp — Contenido Listo', type: 'main', index: 0 }]] };

  // Update
  const upd = await fetch(`${N8N_API}/workflows/fiU0ac3bSRkLGhaC`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': N8N_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: { executionOrder: 'v1' } })
  });
  const result = await upd.json();
  console.log(result.id ? '✅ Actualizado' : 'Error: ' + result.message);
}

fix();
