const N8N_API = 'https://prueba-digisaurios-n8n.4jvoco.easypanel.host/api/v1';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmY5MjkzMC0yYjk1LTRmNjAtODViOC0xZjYwNTFkNzhjMGUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc1NjEyODI0fQ.s4_wwDB_Xjwlg29cdfePqLZYZ0sDma9IBhsH1PNL5X4';
const AIRTABLE_KEY = process.env.AIRTABLE_API_KEY || 'YOUR_AIRTABLE_API_KEY';
const BASE = 'appgS6jdmiMsGQyIF';
const FAL_KEY = 'be5a6483-022d-43fb-8b74-278971c4c880:0f47c8bafb850e34610984c190e990ab';

// ─── BRAND MANUAL EXTRAÍDO DEL LOGO + BRIEF ──────────────────────────────────
const brandManual = {
  // Identidad
  nombre: "MentorIA Systems",
  tagline: "inteligencia humana, potencia artificial",
  descripcion: "Empresa especializada en crear ecosistemas digitales inteligentes a la medida de empresas mexicanas. Conecta agentes de IA con herramientas existentes y colaboradores humanos, eliminando puestos automatizables y repetitivos. Propuesta de valor: no somos un gasto, somos un ahorro mediante eficiencia operativa y comercial.",
  industria: "Tecnología / Inteligencia Artificial / Consultoría Digital",
  pais: "México",

  // Cliente ideal
  cliente_ideal: "Director General, CEO o Director de Operaciones de empresa mediana-grande (50-500 empleados) en México. Industrias: manufactura, retail, servicios financieros, inmobiliario, salud. Frustrado con costos de nómina y procesos repetitivos. Curioso por IA pero no sabe cómo implementarla sin riesgo.",
  dolor_cliente: "Paga nómina por tareas que una IA haría en segundos. Tiene múltiples softwares desconectados. Sus equipos pierden tiempo en tareas repetitivas. Miedos: implementar IA es caro, complejo y puede fracasar.",
  propuesta_valor: "Ecosistemas digitales a la medida que conectan IA + herramientas actuales + equipo humano. Resultados medibles en reducción de costos operativos desde el primer mes.",

  // Paleta de colores — extraída del logo
  paleta: {
    primario: "#1B4FD8",       // Azul profundo IA — circuitos
    secundario: "#5BC8F5",     // Azul claro tecnológico — cerebro
    acento: "#3A86D4",         // Azul medio — gradiente
    neutro_oscuro: "#4A4A4A",  // Gris carbón — tipografía
    neutro_claro: "#F0F4FF",   // Azul muy claro — fondos
    blanco: "#FFFFFF",
    negro_suave: "#1A1A2E"     // Azul noche — fondos oscuros premium
  },

  // Tipografía sugerida (basada en estilo del logo)
  tipografia: {
    headline: "Montserrat Bold / ExtraBold",
    subheadline: "Montserrat SemiBold",
    body: "Inter Regular / Open Sans Regular",
    acento: "Montserrat Light Italic",
    nota: "Canva tiene todas estas fuentes gratis"
  },

  // Estilo visual
  estilo_visual: "Tecnológico premium. Limpio y minimalista con toques de profundidad. Gradientes azules. Elementos de circuitos y datos sutiles. Fotografía de personas en contexto empresarial o abstractos tecnológicos. Nunca recargado.",
  referencias_visuales: "IBM Design Language, Salesforce marketing, McKinsey Digital — profesional pero accesible",

  // Tono de comunicación
  tono: "Directo, inteligente, sin tecnicismos innecesarios. Habla de resultados y ahorro, no de tecnología. Como un CFO que habla de ROI, no como un ingeniero que habla de algoritmos. Inspira confianza. Nunca sobre-prometedor.",
  palabras_clave: ["ecosistema digital", "eficiencia operativa", "automatización inteligente", "ahorro en nómina", "IA a la medida", "inteligencia humana", "transformación digital"],
  palabras_prohibidas: ["disruption", "revolucionar", "cambiar el mundo", "blockchain", "metaverso", "chatbot genérico"],

  // Redes activas
  redes: ["LinkedIn", "Instagram", "YouTube", "Facebook", "Twitter/X", "Blog"],

  // Pilares de contenido
  pilares: [
    "Educación IA: casos reales de automatización en empresas mexicanas",
    "ROI y ahorro: números concretos de lo que cuesta NO automatizar",
    "Detrás del ecosistema: cómo funciona un agente IA en la práctica",
    "Historias de clientes: transformaciones reales (anonimizadas)",
    "Manolo opina: perspectiva del CEO sobre el futuro del trabajo con IA"
  ],

  // Frecuencia
  frecuencia: {
    instagram: "5 posts/semana + 3 reels/semana",
    linkedin: "5 posts/semana + 1 artículo/semana",
    youtube: "1 video largo/semana (10-15 min)",
    facebook: "3 posts/semana + 1 video/semana",
    twitter: "2 tweets/día + 1 thread/semana",
    blog: "2 artículos/semana"
  }
};

// ─── AVATAR GENERATION — stylized executive for HeyGen ───────────────────────
const avatarPrompt = `Professional Latin American male executive, 40s, Mexican business leader, confident and approachable expression, modern tech company aesthetic. Clean short dark hair, light stubble, wearing a premium navy blue business casual shirt, no tie. Neutral professional background with subtle blue gradient reminiscent of tech brand. Sharp professional headshot composition, 85mm portrait lens, studio lighting, photorealistic, 4K quality, LinkedIn profile photo style. No text, no logos.`;

async function run() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SETUP MentorIA Systems — Brand + Avatar');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Save brand manual to Airtable Onboarding table
  console.log('1. Guardando brand manual en Airtable...');
  const airtableRes = await fetch(`https://api.airtable.com/v0/${BASE}/tbl45sIHzsJtNix3M`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${AIRTABLE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        'Cliente': 'MentorIA Systems',
        'Fecha Llamada': new Date().toISOString().split('T')[0],
        'Brief Enriquecido IA': JSON.stringify(brandManual, null, 2),
        'Estado': 'Llamada realizada'
      }
    })
  });
  const airtableData = await airtableRes.json();
  if (airtableData.id) {
    console.log('✅ Brand manual guardado — Record ID:', airtableData.id);
  } else {
    console.log('❌ Error Airtable:', JSON.stringify(airtableData));
  }

  // 2. Generate avatar with Flux Pro
  console.log('\n2. Generando avatar ejecutivo con Flux Pro...');
  const falRes = await fetch('https://fal.run/fal-ai/flux-pro/v1.1', {
    method: 'POST',
    headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: avatarPrompt,
      image_size: 'portrait_4_3',
      num_images: 1,
      output_format: 'jpeg',
      safety_tolerance: 2
    })
  });
  const falData = await falRes.json();
  if (falData.images?.[0]?.url) {
    console.log('✅ Avatar generado');
    console.log('URL:', falData.images[0].url);
    console.log('\n📋 PRÓXIMO PASO — Crear avatar en HeyGen:');
    console.log('1. Entra a heygen.com → Avatars → Create Avatar');
    console.log('2. Selecciona "Photo Avatar"');
    console.log('3. Sube esta imagen:', falData.images[0].url);
    console.log('4. Ponle nombre: "Manolo — MentorIA"');
    console.log('5. Copia el Avatar ID y dámelo para configurarlo en n8n');
  } else {
    console.log('❌ Error Flux:', JSON.stringify(falData));
  }

  // 3. Print brand manual summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('BRAND MANUAL EXTRAÍDO DEL LOGO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nPALETA:');
  Object.entries(brandManual.paleta).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log('\nTIPOGRAFÍA:');
  console.log('  Headline:', brandManual.tipografia.headline);
  console.log('  Body:', brandManual.tipografia.body);
  console.log('\nTONO:', brandManual.tono.substring(0, 100) + '...');
  console.log('\nPILARES DE CONTENIDO:');
  brandManual.pilares.forEach((p, i) => console.log(`  ${i+1}. ${p}`));

  // 4. Prepare WF context — update content prompt with brand awareness
  console.log('\n4. Actualizando workflow con contexto de marca...');
  const wfRes = await fetch(`${N8N_API}/workflows/fiU0ac3bSRkLGhaC`, {
    headers: { 'X-N8N-API-KEY': N8N_KEY }
  });
  const wf = await wfRes.json();

  // Update content generation chain to be brand-aware when client = MentorIA
  const chainContent = wf.nodes.find(n => n.name === 'Generar Contenido con IA');
  if (chainContent) {
    // Add brand context to the prompt prefix
    const brandContext = `MARCA: MentorIA Systems
TAGLINE: "inteligencia humana, potencia artificial"
PALETA: Azules #1B4FD8 / #5BC8F5 / #3A86D4, gris carbón #4A4A4A
TIPOGRAFÍA: Montserrat Bold para headlines, Inter para body
TONO: Directo, inteligente, habla de ROI y ahorro — no de tecnología. Como CFO no como ingeniero.
CLIENTE IDEAL: CEO/Director de empresa mediana en México que quiere reducir costos con IA
PILARES: Educación IA, ROI/ahorro, casos reales, detrás del ecosistema, marca personal Manolo
PROHIBIDO: tecnicismos, disruption, revolucionar, prometer demasiado
ESTILO VISUAL: Tecnológico premium, limpio, gradientes azules, minimalista con profundidad

`;
    // Prepend brand context to existing prompt
    if (!chainContent.parameters.text.includes('MARCA: MentorIA')) {
      chainContent.parameters.text = '=' + brandContext + chainContent.parameters.text.replace(/^=/, '');
      console.log('✅ Brand context added to content generator');
    } else {
      console.log('ℹ️  Brand context already present');
    }
  }

  const upd = await fetch(`${N8N_API}/workflows/fiU0ac3bSRkLGhaC`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': N8N_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: { executionOrder: 'v1' } })
  });
  const updr = await upd.json();
  console.log(updr.id ? '✅ Workflow actualizado con brand context' : '❌ ' + updr.message);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ SETUP COMPLETO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nListo para el primer test. Envía por WhatsApp:');
  console.log('"contenido: semana de contenido para MentorIA Systems,');
  console.log(' empresa de ecosistemas digitales con IA para empresas mexicanas.');
  console.log(' Enfoque en reducción de costos operativos y eficiencia."');
}

run();
