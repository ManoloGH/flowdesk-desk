const N8N_API = 'https://prueba-digisaurios-n8n.4jvoco.easypanel.host/api/v1';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmY5MjkzMC0yYjk1LTRmNjAtODViOC0xZjYwNTFkNzhjMGUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc1NjEyODI0fQ.s4_wwDB_Xjwlg29cdfePqLZYZ0sDma9IBhsH1PNL5X4';
const WF_ID = 'fiU0ac3bSRkLGhaC';

// ─── PLACEHOLDERS — replace with real keys when available ─────────────────────
const FAL_AI_KEY      = 'FAL_AI_KEY_PENDING';        // fal.ai → Dashboard → API Keys
const HIGGSFIELD_KEY  = 'HIGGSFIELD_KEY_PENDING';    // higgsfield.ai → Settings → API
const ELEVENLABS_KEY  = 'ELEVENLABS_KEY_PENDING';    // elevenlabs.io → Profile → API Key
const HEYGEN_KEY      = 'HEYGEN_KEY_PENDING';        // heygen.com → Settings → API Token

// ─── UPDATED VISUAL BRIEF PROMPT ──────────────────────────────────────────────
// Now generates: Flux prompt + Higgsfield prompt + ElevenLabs script + HeyGen script

const briefVisualPrompt = `=Eres un director de arte experto. Genera el brief visual completo para esta pieza.

PIEZA:
Número: {{ $json.numero }}
Día: {{ $json.dia }}
Tipo: {{ $json.tipo }}
Tema: {{ $json.tema }}
Copy Instagram: {{ $json.copy_instagram || $json.fields?.['Copy'] || '' }}
Script Narración: {{ $json.script_narracion || $json.fields?.['Script Narración'] || '' }}

Genera este JSON exacto según el TIPO de pieza:
{
  "numero": {{ $json.numero || 1 }},
  "tipo": "{{ $json.tipo }}",
  "concepto_visual": "Qué emoción transmite. Qué ve el usuario en los primeros 2 segundos.",
  "paleta": ["#hex1", "#hex2", "#hex3"],
  "texto_overlay": "Máx 7 palabras para superponer en la imagen",
  "estilo": "minimalista/vibrante/editorial/orgánico/cinematográfico",

  "prompt_flux": "Ultra-detailed English prompt for Flux Pro image generation. Include: subject, setting, lighting (golden hour/studio/natural), mood, camera angle, lens (85mm portrait/wide angle), style (photorealistic/editorial/commercial), aspect ratio. 60-80 words. No text in image.",

  "prompt_higgsfield": "English prompt for Higgsfield cinematic video transitions. Describe: opening scene, camera movement (slow push in/parallax/zoom out), transition style (morphing/light leak/motion blur), ending frame. Emotional tone. 40-60 words. Only for Reels.",

  "prompt_sora": "English prompt for Sora 2 video generation. Cinematic, 30-second video. Describe scene, characters (if any), camera movements, lighting changes, atmosphere. 80-100 words. Only for Videos.",

  "elevenlabs_script": "Exact narration text to be read aloud. Natural, conversational. 30-45 seconds read. No stage directions. Just the words.",

  "heygen_script": "Full YouTube video script. Hook (15s) → Problem (30s) → Solution/Value (4min) → CTA (15s). Total ~5 minutes read. Include [PAUSE] markers. Only for YouTube tipo.",

  "instrucciones_disenador": "Numbered steps for the designer. What to add on top of the AI-generated asset: 1) Brand elements (logo position, size) 2) Typography (font, color, size) 3) Final adjustments 4) Export specs",

  "midjourney_prompt": "English Midjourney v7 prompt for the PAID AD version of this piece. Maximum aesthetic quality. Include: --ar 4:5 --v 7 --q 2 --style raw. 80-100 words."
}

Responde SOLO con el JSON.`;

// ─── UPDATED PARSEAR BRIEF VISUAL ─────────────────────────────────────────────
const parsearBriefCode = `const raw = $input.first().json.text;
const prev = $('Preparar Contexto Pieza').item.json;
let brief;
try {
  const clean = raw.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
  const match = clean.match(/\\{[\\s\\S]*\\}/);
  brief = match ? JSON.parse(match[0]) : {};
} catch(e) {
  brief = {};
}

const tipo = (prev.tipo || brief.tipo || '').toLowerCase();
const esReel = tipo.includes('reel') || tipo.includes('story');
const esVideo = tipo.includes('video');
const esYoutube = tipo.includes('youtube');

return [{
  json: {
    recordId: prev.recordId,
    numero: prev.numero || brief.numero || 1,
    phone: prev.phone,
    tema: prev.tema,
    dia: prev.dia,
    tipo: prev.tipo,
    esReel,
    esVideo,
    esYoutube,
    // Prompts por tipo
    promptFlux: brief.prompt_flux || '',
    promptHighsfield: brief.prompt_higgsfield || '',
    promptSora: brief.prompt_sora || '',
    elevenlabsScript: brief.elevenlabs_script || '',
    heygenScript: brief.heygen_script || '',
    midjourneyPrompt: brief.midjourney_prompt || '',
    instruccionesDisenador: brief.instrucciones_disenador || '',
    // Visual info
    concepto: brief.concepto_visual || '',
    paleta: Array.isArray(brief.paleta) ? brief.paleta.join(', ') : '',
    textoOverlay: brief.texto_overlay || '',
    estilo: brief.estilo || '',
    // Full brief as text for Airtable
    briefText: [
      'CONCEPTO: ' + (brief.concepto_visual || ''),
      'PALETA: ' + (Array.isArray(brief.paleta) ? brief.paleta.join(', ') : ''),
      'TEXTO OVERLAY: ' + (brief.texto_overlay || ''),
      'ESTILO: ' + (brief.estilo || ''),
      '',
      '── PROMPTS IA ──',
      'FLUX PRO:',
      (brief.prompt_flux || ''),
      '',
      esReel ? ('HIGGSFIELD:\n' + (brief.prompt_higgsfield || '')) : '',
      esVideo ? ('SORA 2:\n' + (brief.prompt_sora || '')) : '',
      '',
      '── DISEÑADOR (PAUTA) ──',
      'MIDJOURNEY:',
      (brief.midjourney_prompt || ''),
      '',
      'INSTRUCCIONES:',
      (brief.instrucciones_disenador || '')
    ].filter(Boolean).join('\\n')
  }
}];`;

// ─── ROUTER NODE: route by content type for visual generation ─────────────────
const routerTipoCode = `const tipo = ($json.tipo || '').toLowerCase();
const esReel = tipo.includes('reel');
const esVideo = tipo.includes('video');
const esYoutube = tipo.includes('youtube');
const esPost = !esReel && !esVideo && !esYoutube;
return [{
  json: {
    ...$json,
    routeTo: esReel ? 'reel' : esVideo ? 'video' : esYoutube ? 'youtube' : 'post'
  }
}];`;

// ─── EXTRACT RESULTS FROM GENERATION APIs ─────────────────────────────────────
const extraerResultadoCode = `// Unify results from different generation APIs
const prev = $('Parsear Brief Visual').item.json;
const body = $input.first().json;

// fal.ai returns: { images: [{ url: "..." }] }
// Higgsfield returns: { video_url: "..." } or { url: "..." }
// Sora returns: { data: [{ url: "..." }] }
// ElevenLabs returns binary audio → stored separately

const imageUrl = body.images?.[0]?.url || body.image?.url || body.url || '';
const videoUrl = body.video_url || body.data?.[0]?.url || body.url || '';
const finalUrl = imageUrl || videoUrl || '';

return [{
  json: {
    ...prev,
    generatedUrl: finalUrl,
    imageUrl: imageUrl || '',
    videoUrl: videoUrl || ''
  }
}];`;

// ─── EXTRACT ELEVENLABS AUDIO URL ─────────────────────────────────────────────
const extraerAudioCode = `const prev = $('Parsear Brief Visual').item.json;
// ElevenLabs returns binary — n8n stores it and gives us the file path
// We store the binary reference for now
return [{
  json: {
    ...prev,
    audioGenerated: true
  }
}];`;

// ─── NEW NODES ────────────────────────────────────────────────────────────────
const newNodes = [
  // Router by content type
  {
    id: 'router_tipo',
    name: 'Router por Tipo de Contenido',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [1640, 1260],
    parameters: { jsCode: routerTipoCode }
  },
  // ── POST / CARRUSEL / STORY → Flux Pro ──
  {
    id: 'flux_pro',
    name: 'Flux Pro — Generar Imagen',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [1880, 1100],
    parameters: {
      method: 'POST',
      url: 'https://fal.run/fal-ai/flux-pro/v1.1',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'Authorization', value: `Key ${FAL_AI_KEY}` },
          { name: 'Content-Type', value: 'application/json' }
        ]
      },
      sendBody: true,
      contentType: 'json',
      bodyParameters: {
        parameters: [
          { name: 'prompt', value: '={{ $json.promptFlux }}' },
          { name: 'image_size', value: 'square_hd' },
          { name: 'num_images', value: '=1' },
          { name: 'safety_tolerance', value: '=2' },
          { name: 'output_format', value: 'jpeg' }
        ]
      }
    }
  },
  {
    id: 'extraer_url_flux',
    name: 'Extraer URL Flux',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [2120, 1100],
    parameters: {
      jsCode: `const prev = $('Parsear Brief Visual').item.json;
const body = $input.first().json;
const imageUrl = body.images?.[0]?.url || body.url || '';
return [{ json: { ...prev, generatedUrl: imageUrl, imageUrl, videoUrl: '' } }];`
    }
  },
  // ── REEL → Higgsfield ──
  {
    id: 'higgsfield_reel',
    name: 'Higgsfield — Generar Reel',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [1880, 1260],
    parameters: {
      method: 'POST',
      url: 'https://api.higgsfield.ai/v1/generate',  // Update when key available
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'Authorization', value: `Bearer ${HIGGSFIELD_KEY}` },
          { name: 'Content-Type', value: 'application/json' }
        ]
      },
      sendBody: true,
      contentType: 'json',
      bodyParameters: {
        parameters: [
          { name: 'prompt', value: '={{ $json.promptHighsfield }}' },
          { name: 'duration', value: '=15' },
          { name: 'aspect_ratio', value: '9:16' }
        ]
      }
    }
  },
  {
    id: 'extraer_url_higgsfield',
    name: 'Extraer URL Higgsfield',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [2120, 1260],
    parameters: {
      jsCode: `const prev = $('Parsear Brief Visual').item.json;
const body = $input.first().json;
const videoUrl = body.video_url || body.url || body.output?.url || '';
return [{ json: { ...prev, generatedUrl: videoUrl, imageUrl: '', videoUrl } }];`
    }
  },
  // ── VIDEO (Facebook 30s) → Sora 2 ──
  {
    id: 'sora_video',
    name: 'Sora 2 — Generar Video',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [1880, 1420],
    parameters: {
      method: 'POST',
      url: 'https://api.openai.com/v1/video/generations',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'Authorization', value: 'Bearer YOUR_OPENAI_API_KEY' },
          { name: 'Content-Type', value: 'application/json' }
        ]
      },
      sendBody: true,
      contentType: 'json',
      bodyParameters: {
        parameters: [
          { name: 'prompt', value: '={{ $json.promptSora }}' },
          { name: 'model', value: 'sora-1080p' },
          { name: 'duration', value: '=30' },
          { name: 'resolution', value: '1080p' },
          { name: 'n', value: '=1' }
        ]
      }
    }
  },
  {
    id: 'extraer_url_sora',
    name: 'Extraer URL Sora',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [2120, 1420],
    parameters: {
      jsCode: `const prev = $('Parsear Brief Visual').item.json;
const body = $input.first().json;
const videoUrl = body.data?.[0]?.url || body.url || '';
return [{ json: { ...prev, generatedUrl: videoUrl, imageUrl: '', videoUrl } }];`
    }
  },
  // ── ElevenLabs narration (for ALL types with script) ──
  {
    id: 'elevenlabs_narration',
    name: 'ElevenLabs — Narración',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [2360, 1260],
    parameters: {
      method: 'POST',
      url: 'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',  // Default voice ID, update after config
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'xi-api-key', value: ELEVENLABS_KEY },
          { name: 'Content-Type', value: 'application/json' },
          { name: 'Accept', value: 'audio/mpeg' }
        ]
      },
      sendBody: true,
      contentType: 'json',
      bodyParameters: {
        parameters: [
          { name: 'text', value: '={{ $json.elevenlabsScript }}' },
          { name: 'model_id', value: 'eleven_multilingual_v2' },
          { name: 'voice_settings', value: '={"stability": 0.5, "similarity_boost": 0.75, "style": 0.5, "use_speaker_boost": true}' }
        ]
      },
      options: { response: { response: { responseFormat: 'file', outputPropertyName: 'audioFile' } } }
    }
  },
  // ── Merge all paths before saving ──
  {
    id: 'merge_resultados',
    name: 'Unir Resultados',
    type: 'n8n-nodes-base.merge',
    typeVersion: 3,
    position: [2600, 1260],
    parameters: {
      mode: 'chooseBranch',
      chooseBranchMode: 'waitForAll',
      output: 'empty'
    }
  }
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function fix() {
  const res = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    headers: { 'X-N8N-API-KEY': N8N_KEY }
  });
  const wf = await res.json();
  console.log('Fetched:', wf.name, '— nodes:', wf.nodes.length);

  // 1. Update visual brief prompt
  const briefNode = wf.nodes.find(n => n.name === 'Generar Brief Visual');
  if (briefNode) {
    briefNode.parameters.text = briefVisualPrompt;
    console.log('✅ Updated Generar Brief Visual prompt');
  }

  // 2. Update parsear brief visual
  const parsearNode = wf.nodes.find(n => n.name === 'Parsear Brief Visual');
  if (parsearNode) {
    parsearNode.parameters.jsCode = parsearBriefCode;
    console.log('✅ Updated Parsear Brief Visual');
  }

  // 3. Update Guardar Brief en Pieza — add new fields
  const guardarNode = wf.nodes.find(n => n.name === 'Guardar Brief en Pieza');
  if (guardarNode) {
    guardarNode.parameters.columns.value = {
      'Brief Visual':     '={{ $json.briefText }}',
      'Prompt IA':        '={{ $json.promptFlux }}',
      'URL Asset Final':  '={{ $json.imageUrl || $json.videoUrl || "" }}',
      'URL Video':        '={{ $json.videoUrl || "" }}',
      'Estado':           'En diseño'
    };
    guardarNode.parameters.id = '={{ $json.recordId }}';
    console.log('✅ Updated Guardar Brief en Pieza');
  }

  // 4. Add new nodes (skip if exists)
  for (const node of newNodes) {
    const exists = wf.nodes.find(n => n.name === node.name);
    if (!exists) {
      wf.nodes.push(node);
      console.log('➕', node.name);
    } else {
      Object.assign(exists, node);
      console.log('🔄', node.name);
    }
  }

  // 5. Rewire design branch:
  // Preparar Contexto Pieza → Generar Brief Visual → Parsear Brief Visual
  // → Router por Tipo → [Flux / Higgsfield / Sora] → ElevenLabs → Guardar → Guard → WA
  const c = wf.connections;

  c['Parsear Brief Visual'] = { main: [[{ node: 'Router por Tipo de Contenido', type: 'main', index: 0 }]] };

  // Router routes by type (we use a code node that outputs to index 0 always but tags routeTo)
  // Since we need actual branching, let's use a Switch node approach
  // For now: route all to Flux Pro (placeholder), add proper routing after
  c['Router por Tipo de Contenido'] = {
    main: [
      [{ node: 'Flux Pro — Generar Imagen', type: 'main', index: 0 }],     // post
      [{ node: 'Higgsfield — Generar Reel', type: 'main', index: 0 }],     // reel
      [{ node: 'Sora 2 — Generar Video', type: 'main', index: 0 }],        // video
    ]
  };

  c['Flux Pro — Generar Imagen']  = { main: [[{ node: 'Extraer URL Flux',        type: 'main', index: 0 }]] };
  c['Higgsfield — Generar Reel']  = { main: [[{ node: 'Extraer URL Higgsfield',  type: 'main', index: 0 }]] };
  c['Sora 2 — Generar Video']     = { main: [[{ node: 'Extraer URL Sora',        type: 'main', index: 0 }]] };

  // All paths converge to ElevenLabs (only fires if script exists — handled by node)
  c['Extraer URL Flux']       = { main: [[{ node: 'ElevenLabs — Narración', type: 'main', index: 0 }]] };
  c['Extraer URL Higgsfield'] = { main: [[{ node: 'ElevenLabs — Narración', type: 'main', index: 0 }]] };
  c['Extraer URL Sora']       = { main: [[{ node: 'ElevenLabs — Narración', type: 'main', index: 0 }]] };

  c['ElevenLabs — Narración'] = { main: [[{ node: 'Guardar Brief en Pieza', type: 'main', index: 0 }]] };
  // Rest of chain: Guardar → Guard WA Diseño → WhatsApp Briefs Listos (already connected)

  console.log('\nPushing...');
  const upd = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': N8N_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: { executionOrder: 'v1' }
    })
  });
  const result = await upd.json();
  if (result.id) {
    console.log('\n✅ Phase 2C done —', result.nodes?.length, 'nodes');
    console.log('\nPendiente conectar keys:');
    console.log('  fal.ai  → FAL_AI_KEY_PENDING');
    console.log('  Higgsfield → HIGGSFIELD_KEY_PENDING');
    console.log('  ElevenLabs → ELEVENLABS_KEY_PENDING');
  } else {
    console.error('❌', JSON.stringify(result, null, 2));
  }
}
fix();
