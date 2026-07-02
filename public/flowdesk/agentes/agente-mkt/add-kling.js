const N8N_API = 'https://prueba-digisaurios-n8n.4jvoco.easypanel.host/api/v1';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmY5MjkzMC0yYjk1LTRmNjAtODViOC0xZjYwNTFkNzhjMGUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc1NjEyODI0fQ.s4_wwDB_Xjwlg29cdfePqLZYZ0sDma9IBhsH1PNL5X4';
const WF_ID = 'fiU0ac3bSRkLGhaC';

// Pass KLING_KEY as argument: node add-kling.js YOUR_KEY
const KLING_KEY = process.argv[2] || 'KLING_KEY_PENDING';

const extractKlingCode = `const prev = $('Parsear Brief Visual').item.json;
const body = $input.first().json;
// Kling returns task_id — video needs polling
const taskId = body.data?.task_id || body.task_id || '';
const videoUrl = body.data?.works?.[0]?.video?.url || '';
return [{ json: {
  ...prev,
  klingTaskId: taskId,
  generatedUrl: videoUrl || ('kling:' + taskId),
  videoUrl: videoUrl || ('kling:' + taskId),
  imageUrl: ''
}}];`;

const newNodes = [
  // Kling text-to-video for Reels
  {
    id: 'kling_reel',
    name: 'Kling — Generar Reel',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [1880, 1260],  // Same position as Higgsfield placeholder
    parameters: {
      method: 'POST',
      url: 'https://api.klingai.com/v1/videos/text2video',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'Authorization', value: `Bearer ${KLING_KEY}` },
          { name: 'Content-Type', value: 'application/json' }
        ]
      },
      sendBody: true,
      contentType: 'json',
      bodyParameters: {
        parameters: [
          { name: 'model_name', value: 'kling-v2-master' },
          { name: 'prompt', value: '={{ $json.promptHighsfield || $json.promptFlux }}' },
          { name: 'negative_prompt', value: 'low quality, blurry, watermark, text overlay, distorted' },
          { name: 'cfg_scale', value: '=0.5' },
          { name: 'mode', value: 'std' },
          { name: 'aspect_ratio', value: '9:16' },
          { name: 'duration', value: '=10' }
        ]
      }
    }
  },
  {
    id: 'extraer_kling',
    name: 'Extraer URL Kling',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [2120, 1260],
    parameters: { jsCode: extractKlingCode }
  }
];

async function fix() {
  const res = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    headers: { 'X-N8N-API-KEY': N8N_KEY }
  });
  const wf = await res.json();
  console.log('Fetched:', wf.name, '— nodes:', wf.nodes.length);

  // Replace Higgsfield placeholder with Kling
  wf.nodes = wf.nodes.filter(n =>
    n.name !== 'Higgsfield — Generar Reel' && n.name !== 'Extraer URL Higgsfield'
  );
  console.log('🗑  Removed Higgsfield placeholder nodes');

  for (const node of newNodes) {
    const exists = wf.nodes.find(n => n.name === node.name);
    if (!exists) { wf.nodes.push(node); console.log('➕', node.name); }
    else { Object.assign(exists, node); console.log('🔄', node.name); }
  }

  // Rewire: Reel path → Kling → Extraer URL Kling → ElevenLabs
  const c = wf.connections;
  delete c['Higgsfield — Generar Reel'];
  delete c['Extraer URL Higgsfield'];

  // Router por Tipo index 1 = reel → Kling
  if (c['Router por Tipo de Contenido']) {
    c['Router por Tipo de Contenido'].main[1] = [{ node: 'Kling — Generar Reel', type: 'main', index: 0 }];
  }
  c['Kling — Generar Reel'] = { main: [[{ node: 'Extraer URL Kling', type: 'main', index: 0 }]] };
  c['Extraer URL Kling']    = { main: [[{ node: 'ElevenLabs — Narración', type: 'main', index: 0 }]] };

  const upd = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': N8N_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: { executionOrder: 'v1' } })
  });
  const r = await upd.json();
  if (r.id) {
    console.log('\n✅ Kling conectado —', r.nodes?.length, 'nodes totales');
    if (KLING_KEY === 'KLING_KEY_PENDING') {
      console.log('\n⚠️  Key pendiente. Cuando la tengas ejecuta:');
      console.log('   node add-kling.js TU_KLING_KEY');
    } else {
      console.log('✅ Key configurada');
    }
  } else {
    console.error('❌', JSON.stringify(r, null, 2));
  }
}
fix();
