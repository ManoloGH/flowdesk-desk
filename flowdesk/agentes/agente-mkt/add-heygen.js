const N8N_API = 'https://prueba-digisaurios-n8n.4jvoco.easypanel.host/api/v1';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmY5MjkzMC0yYjk1LTRmNjAtODViOC0xZjYwNTFkNzhjMGUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc1NjEyODI0fQ.s4_wwDB_Xjwlg29cdfePqLZYZ0sDma9IBhsH1PNL5X4';
const WF_ID = 'fiU0ac3bSRkLGhaC';
const HEYGEN_KEY = 'sk_V2_hgu_kUEGIWEuccK_bU1rK4Cl6ReMt1N68AWrtIvLUeGcnrmB';

const extractHeygenCode = `const prev = $('Parsear Brief Visual').item.json;
const body = $input.first().json;
const videoId = body.data?.video_id || body.video_id || '';
return [{ json: {
  ...prev,
  heygenVideoId: videoId,
  generatedUrl: 'heygen:' + videoId,
  videoUrl: 'heygen:' + videoId,
  imageUrl: ''
}}];`;

const routerTipoCode = `const tipo = ($json.tipo || '').toLowerCase();
const esReel = tipo.includes('reel') || tipo.includes('story');
const esVideo = tipo.includes('video') && !tipo.includes('youtube');
const esYoutube = tipo.includes('youtube') || ($json.esYoutube === true);
// Output index: 0=post, 1=reel, 2=video, 3=youtube
return [{ json: { ...$json } }];`;

const newNodes = [
  {
    id: 'heygen_youtube',
    name: 'HeyGen — Generar Video YouTube',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [1880, 1580],
    parameters: {
      method: 'POST',
      url: 'https://api.heygen.com/v2/video/generate',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'X-Api-Key', value: HEYGEN_KEY },
          { name: 'Content-Type', value: 'application/json' }
        ]
      },
      sendBody: true,
      contentType: 'json',
      bodyParameters: {
        parameters: [
          {
            name: 'video_inputs',
            value: `=[{
              "character": {
                "type": "avatar",
                "avatar_id": "{{ $json.avatarId || 'Abigail_expressive_2024112501' }}",
                "avatar_style": "normal"
              },
              "voice": {
                "type": "text",
                "input_text": "{{ $json.heygenScript }}",
                "voice_id": "{{ $json.voiceId || 'en-US-AriaNeural' }}",
                "speed": 1.0
              },
              "background": {
                "type": "color",
                "value": "#f8f8f8"
              }
            }]`
          },
          { name: 'dimension', value: '={"width": 1280, "height": 720}' },
          { name: 'aspect_ratio', value: '16:9' },
          { name: 'caption', value: '=true' }
        ]
      }
    }
  },
  {
    id: 'extraer_heygen',
    name: 'Extraer ID HeyGen',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [2120, 1580],
    parameters: { jsCode: extractHeygenCode }
  }
];

async function fix() {
  const res = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    headers: { 'X-N8N-API-KEY': N8N_KEY }
  });
  const wf = await res.json();
  console.log('Fetched:', wf.name, '— nodes:', wf.nodes.length);

  // 1. Add HeyGen nodes
  for (const node of newNodes) {
    const exists = wf.nodes.find(n => n.name === node.name);
    if (!exists) { wf.nodes.push(node); console.log('➕', node.name); }
    else { Object.assign(exists, node); console.log('🔄', node.name); }
  }

  // 2. Update Router por Tipo code
  const routerTipo = wf.nodes.find(n => n.name === 'Router por Tipo de Contenido');
  if (routerTipo) {
    routerTipo.parameters.jsCode = routerTipoCode;
    console.log('✅ Updated Router por Tipo de Contenido');
  }

  // 3. Wire HeyGen into connections
  const c = wf.connections;

  // Add youtube to router output (index 3)
  if (c['Router por Tipo de Contenido']) {
    while (c['Router por Tipo de Contenido'].main.length < 4) {
      c['Router por Tipo de Contenido'].main.push([]);
    }
    c['Router por Tipo de Contenido'].main[3] = [{ node: 'HeyGen — Generar Video YouTube', type: 'main', index: 0 }];
  }

  c['HeyGen — Generar Video YouTube'] = { main: [[{ node: 'Extraer ID HeyGen', type: 'main', index: 0 }]] };
  c['Extraer ID HeyGen'] = { main: [[{ node: 'ElevenLabs — Narración', type: 'main', index: 0 }]] };

  const upd = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': N8N_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: { executionOrder: 'v1' } })
  });
  const r = await upd.json();
  if (r.id) {
    console.log('\n✅ HeyGen conectado —', r.nodes?.length, 'nodes totales');
    console.log('\nNotas:');
    console.log('  • 600 créditos API disponibles (~20 videos de 1 min)');
    console.log('  • Para usar tu avatar: graba video en HeyGen → pega el avatar_id aquí');
    console.log('  • HeyGen genera de forma asíncrona — video listo en ~2-5 min');
  } else {
    console.error('❌', JSON.stringify(r, null, 2));
  }
}
fix();
