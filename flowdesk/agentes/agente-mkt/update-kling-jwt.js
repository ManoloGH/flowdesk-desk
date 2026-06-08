// Kling requires JWT auth — this script updates the node to generate JWT dynamically
const N8N_API = 'https://prueba-digisaurios-n8n.4jvoco.easypanel.host/api/v1';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmY5MjkzMC0yYjk1LTRmNjAtODViOC0xZjYwNTFkNzhjMGUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc1NjEyODI0fQ.s4_wwDB_Xjwlg29cdfePqLZYZ0sDma9IBhsH1PNL5X4';
const WF_ID = 'fiU0ac3bSRkLGhaC';

const KLING_ACCESS = 'AEBeDrEMApCeYpPGRQhFEFKpnF9f9kLt';
const KLING_SECRET = 'BApgFY9RbT4gLdYRB83mMMHHLkaeYtHe';

// Add a Code node before Kling to generate the JWT token
const generateJwtCode = `const crypto = require('crypto');
const accessKey = '${KLING_ACCESS}';
const secretKey = '${KLING_SECRET}';

const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const payload = Buffer.from(JSON.stringify({ iss: accessKey, exp: now + 1800, nbf: now - 5 })).toString('base64url');
const sig = crypto.createHmac('sha256', secretKey).update(header + '.' + payload).digest('base64url');
const token = header + '.' + payload + '.' + sig;

return [{ json: { ...$input.first().json, klingToken: token } }];`;

async function fix() {
  const res = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    headers: { 'X-N8N-API-KEY': N8N_KEY }
  });
  const wf = await res.json();
  console.log('Fetched:', wf.name, '— nodes:', wf.nodes.length);

  // 1. Add JWT generator node before Kling
  const jwtNode = {
    id: 'kling_jwt',
    name: 'Generar Token Kling',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [1640, 1260],
    parameters: { jsCode: generateJwtCode }
  };

  const exists = wf.nodes.find(n => n.name === 'Generar Token Kling');
  if (!exists) { wf.nodes.push(jwtNode); console.log('➕ Generar Token Kling'); }
  else { Object.assign(exists, jwtNode); console.log('🔄 Generar Token Kling'); }

  // 2. Update Kling node to use the token from previous node
  const klingNode = wf.nodes.find(n => n.name === 'Kling — Generar Reel');
  if (klingNode) {
    klingNode.parameters.headerParameters.parameters = [
      { name: 'Authorization', value: '={{ "Bearer " + $json.klingToken }}' },
      { name: 'Content-Type', value: 'application/json' }
    ];
    klingNode.parameters.bodyParameters.parameters = [
      { name: 'model_name', value: 'kling-v1' },
      { name: 'prompt', value: '={{ $json.promptHighsfield || $json.promptFlux }}' },
      { name: 'negative_prompt', value: 'low quality, blurry, watermark, distorted, text' },
      { name: 'cfg_scale', value: '=0.5' },
      { name: 'mode', value: 'std' },
      { name: 'aspect_ratio', value: '9:16' },
      { name: 'duration', value: '=5' }
    ];
    console.log('✅ Updated Kling node (JWT auth)');
  }

  // 3. Rewire: Router → JWT → Kling → Extraer URL Kling
  const c = wf.connections;
  if (c['Router por Tipo de Contenido']) {
    c['Router por Tipo de Contenido'].main[1] = [{ node: 'Generar Token Kling', type: 'main', index: 0 }];
  }
  c['Generar Token Kling']  = { main: [[{ node: 'Kling — Generar Reel', type: 'main', index: 0 }]] };
  c['Kling — Generar Reel'] = { main: [[{ node: 'Extraer URL Kling', type: 'main', index: 0 }]] };
  c['Extraer URL Kling']    = { main: [[{ node: 'ElevenLabs — Narración', type: 'main', index: 0 }]] };

  const upd = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': N8N_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: { executionOrder: 'v1' } })
  });
  const r = await upd.json();
  if (r.id) {
    console.log('\n✅ Kling JWT configurado —', r.nodes?.length, 'nodes');
    console.log('\nKling listo — solo falta recargar créditos en platform.klingai.com');
  } else {
    console.error('❌', JSON.stringify(r, null, 2));
  }
}
fix();
