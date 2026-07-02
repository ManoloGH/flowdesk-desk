const https = require('https');
const crypto = require('crypto');

const API_URL = 'https://prueba-digisaurios-n8n.4jvoco.easypanel.host';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmY5MjkzMC0yYjk1LTRmNjAtODViOC0xZjYwNTFkNzhjMGUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc1NjEyODI0fQ.s4_wwDB_Xjwlg29cdfePqLZYZ0sDma9IBhsH1PNL5X4';

const SYSTEM_PROMPT = `Eres un experto en marketing digital y branding con 15 años de experiencia ayudando marcas a crear su identidad y estrategia de contenidos.

TUS CAPACIDADES:

1. MANUAL DE IDENTIDAD DE MARCA
   Crea manuales completos: misión, visión, valores, personalidad de marca, paleta de colores (con HEX), tipografías recomendadas, tono de voz, arquetipos de marca y guías de uso.

2. PLAN DE CONTENIDOS
   Diseña calendarios editoriales mensuales para Instagram, Facebook, TikTok, LinkedIn y YouTube con temas, formatos, horarios óptimos y KPIs por publicación.

3. GENERACIÓN DE CONTENIDO
   Redacta copies persuasivos, captions con emojis, hashtags estratégicos, descripciones de productos, bio de perfiles y textos de anuncios.

4. IMÁGENES (herramienta: Generar Imagen DALL-E 3)
   Genera imágenes profesionales. SIEMPRE escribe el prompt en inglés con estilo visual detallado. Especifica: estilo, iluminación, colores, composición.

5. VIDEOS (herramienta: Generar Video Luma AI)
   Genera videos cortos para reels, stories o anuncios. El video tarda 2-5 minutos. Escribe el prompt en inglés.

6. INVESTIGACIÓN (herramienta: Buscar en Google)
   Investiga tendencias, competidores, hashtags populares y mejores prácticas antes de crear contenido.

7. GUARDAR CONTENIDO
   - "Guardar en Airtable": registra posts, planes y calendarios editoriales
   - "Guardar en Google Drive": almacena manuales, reportes e imágenes

DIRECTRICES:
- Si no conoces la marca, PREGUNTA: nombre, industria, público objetivo, tono de comunicación
- Mantén coherencia con la identidad de marca en toda la conversación
- Para imágenes y videos, crea prompts detallados en inglés
- Los planes de contenido deben incluir: día, hora, red social, formato, tema, caption y hashtags
- Sugiere guardar el trabajo en Airtable o Drive cuando generes algo importante
- Cuando el usuario mencione su marca, memoriza los detalles para usarlos en toda la sesión`;

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: new URL(API_URL).hostname,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': API_KEY,
        ...(data && { 'Content-Length': Buffer.byteLength(data) })
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          res.statusCode < 300 ? resolve(parsed) : reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
        } catch(e) {
          reject(new Error(`Parse error: ${body.substring(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log('🚀 Creando Agente Experto en Marketing...\n');

  const workflow = {
    name: "Agente Experto en Marketing",
    nodes: [
      // 1. Chat Trigger
      {
        id: crypto.randomUUID(),
        name: "Chat",
        type: "@n8n/n8n-nodes-langchain.chatTrigger",
        typeVersion: 1.1,
        position: [240, 300],
        webhookId: crypto.randomUUID(),
        parameters: { options: {} }
      },

      // 2. AI Agent
      {
        id: crypto.randomUUID(),
        name: "Agente de Marketing",
        type: "@n8n/n8n-nodes-langchain.agent",
        typeVersion: 1.7,
        position: [500, 300],
        parameters: {
          promptType: "define",
          text: "={{ $json.chatInput }}",
          options: {
            systemMessage: SYSTEM_PROMPT,
            needsFallback: true
          }
        }
      },

      // 3. Claude Sonnet 4.6 (modelo principal)
      {
        id: crypto.randomUUID(),
        name: "Claude Sonnet 4.6",
        type: "@n8n/n8n-nodes-langchain.lmChatAnthropic",
        typeVersion: 1.3,
        position: [100, 520],
        parameters: {
          model: "claude-sonnet-4-6",
          options: {}
        }
      },

      // 4. GPT-4o (fallback)
      {
        id: crypto.randomUUID(),
        name: "GPT-4o Fallback",
        type: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
        typeVersion: 1.1,
        position: [340, 520],
        parameters: {
          model: "gpt-4o",
          options: {}
        }
      },

      // 5. Window Buffer Memory
      {
        id: crypto.randomUUID(),
        name: "Memoria de Conversación",
        type: "@n8n/n8n-nodes-langchain.memoryBufferWindow",
        typeVersion: 1.3,
        position: [580, 520],
        parameters: {
          contextWindowLength: 10
        }
      },

      // 6. DALL-E 3 Tool
      {
        id: crypto.randomUUID(),
        name: "Generar Imagen DALL-E 3",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.2,
        position: [820, 100],
        parameters: {
          method: "POST",
          url: "https://api.openai.com/v1/images/generations",
          sendHeaders: true,
          headerParameters: {
            parameters: [
              { name: "Authorization", value: "Bearer CONFIGURAR_OPENAI_KEY" },
              { name: "Content-Type", value: "application/json" }
            ]
          },
          sendBody: true,
          specifyBody: "json",
          jsonBody: "={{ JSON.stringify({ model: 'dall-e-3', prompt: $fromAI('prompt', 'Detailed image description in English, include style, lighting, colors and composition', 'string'), n: 1, size: $fromAI('size', 'Image size: 1024x1024 (square), 1792x1024 (landscape), 1024x1792 (portrait)', 'string') || '1024x1024', quality: 'hd' }) }}",
          toolDescription: "Genera imágenes profesionales con DALL-E 3. Úsala cuando el usuario pida crear imágenes, diseños visuales, ilustraciones o contenido gráfico. SIEMPRE escribe el prompt en inglés con estilo visual detallado (estilo artístico, iluminación, colores, composición).",
          options: {}
        }
      },

      // 7. Luma AI Video Tool
      {
        id: crypto.randomUUID(),
        name: "Generar Video Luma AI",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.2,
        position: [820, 300],
        parameters: {
          method: "POST",
          url: "https://api.lumalabs.ai/dream-machine/v1/generations",
          sendHeaders: true,
          headerParameters: {
            parameters: [
              { name: "Authorization", value: "Bearer CONFIGURAR_LUMA_KEY" },
              { name: "Content-Type", value: "application/json" }
            ]
          },
          sendBody: true,
          specifyBody: "json",
          jsonBody: "={{ JSON.stringify({ prompt: $fromAI('prompt', 'Detailed video description in English, describe movement, scene, style and mood', 'string'), aspect_ratio: $fromAI('aspect_ratio', 'Video aspect ratio: 9:16 (stories/reels), 16:9 (YouTube), 1:1 (feed)', 'string') || '9:16', loop: false }) }}",
          toolDescription: "Genera videos cortos con Luma AI Dream Machine para redes sociales. Úsala para reels, stories o videos publicitarios. IMPORTANTE: el video tarda 2-5 minutos en generarse. Retorna un ID de generación que el usuario puede usar para verificar el estado en lumalabs.ai.",
          options: {}
        }
      },

      // 8. Serper Search Tool
      {
        id: crypto.randomUUID(),
        name: "Buscar en Google",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.2,
        position: [820, 500],
        parameters: {
          method: "POST",
          url: "https://google.serper.dev/search",
          sendHeaders: true,
          headerParameters: {
            parameters: [
              { name: "X-API-KEY", value: "CONFIGURAR_SERPER_KEY" },
              { name: "Content-Type", value: "application/json" }
            ]
          },
          sendBody: true,
          specifyBody: "json",
          jsonBody: "={{ JSON.stringify({ q: $fromAI('query', 'Search query for Google to research trends, competitors or marketing best practices', 'string'), num: 5, hl: 'es', gl: 'es' }) }}",
          toolDescription: "Busca información actualizada en Google. Úsala para investigar tendencias de marketing, competidores, hashtags populares, mejores prácticas y cualquier información relevante antes de crear contenido.",
          options: {}
        }
      },

      // 9. Airtable Tool
      {
        id: crypto.randomUUID(),
        name: "Guardar en Airtable",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.2,
        position: [820, 700],
        parameters: {
          method: "POST",
          url: "https://api.airtable.com/v0/CONFIGURAR_BASE_ID/Contenido",
          sendHeaders: true,
          headerParameters: {
            parameters: [
              { name: "Authorization", value: "Bearer CONFIGURAR_AIRTABLE_TOKEN" },
              { name: "Content-Type", value: "application/json" }
            ]
          },
          sendBody: true,
          specifyBody: "json",
          jsonBody: "={{ JSON.stringify({ fields: $fromAI('fields', 'JSON object with fields to save. Include: Titulo (string), Contenido (string), Red_Social (string: Instagram/TikTok/Facebook/LinkedIn), Fecha (string: YYYY-MM-DD), Tipo (string: post/reel/story/carrusel), Estado (string: borrador/listo)', 'json') }) }}",
          toolDescription: "Guarda contenido en Airtable (base de datos del calendario editorial). Úsala para registrar posts, copies, planes de contenido e ideas generadas durante la sesión.",
          options: {}
        }
      },

      // 10. Google Drive Tool
      {
        id: crypto.randomUUID(),
        name: "Guardar en Google Drive",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.2,
        position: [820, 900],
        parameters: {
          method: "POST",
          url: "https://www.googleapis.com/upload/drive/v3/files?uploadType=media",
          sendHeaders: true,
          headerParameters: {
            parameters: [
              { name: "Authorization", value: "Bearer CONFIGURAR_GOOGLE_TOKEN" },
              { name: "Content-Type", value: "text/plain" },
              { name: "X-Upload-Content-Type", value: "text/plain" }
            ]
          },
          sendBody: true,
          specifyBody: "json",
          jsonBody: "={{ JSON.stringify({ name: $fromAI('filename', 'Filename with extension (.md, .txt)', 'string'), content: $fromAI('content', 'Text content to save in the file', 'string') }) }}",
          toolDescription: "Guarda documentos en Google Drive. Úsala para almacenar manuales de identidad de marca, planes de contenido, reportes y cualquier documento generado en la sesión.",
          options: {}
        }
      }
    ],

    connections: {
      "Chat": {
        "main": [[{ "node": "Agente de Marketing", "type": "main", "index": 0 }]]
      },
      "Claude Sonnet 4.6": {
        "ai_languageModel": [[{ "node": "Agente de Marketing", "type": "ai_languageModel", "index": 0 }]]
      },
      "GPT-4o Fallback": {
        "ai_languageModel": [[{ "node": "Agente de Marketing", "type": "ai_languageModel", "index": 1 }]]
      },
      "Memoria de Conversación": {
        "ai_memory": [[{ "node": "Agente de Marketing", "type": "ai_memory", "index": 0 }]]
      },
      "Generar Imagen DALL-E 3": {
        "ai_tool": [[{ "node": "Agente de Marketing", "type": "ai_tool", "index": 0 }]]
      },
      "Generar Video Luma AI": {
        "ai_tool": [[{ "node": "Agente de Marketing", "type": "ai_tool", "index": 0 }]]
      },
      "Buscar en Google": {
        "ai_tool": [[{ "node": "Agente de Marketing", "type": "ai_tool", "index": 0 }]]
      },
      "Guardar en Airtable": {
        "ai_tool": [[{ "node": "Agente de Marketing", "type": "ai_tool", "index": 0 }]]
      },
      "Guardar en Google Drive": {
        "ai_tool": [[{ "node": "Agente de Marketing", "type": "ai_tool", "index": 0 }]]
      }
    },

    settings: {
      executionOrder: "v1"
    }
  };

  try {
    const result = await request('POST', '/api/v1/workflows', workflow);
    console.log('✅ Workflow creado exitosamente!');
    console.log('📋 ID:', result.id);
    console.log('📛 Nombre:', result.name);
    console.log('🔗 URL:', `${API_URL}/workflow/${result.id}`);
    console.log('\n⚠️  CREDENCIALES PENDIENTES DE CONFIGURAR EN n8n UI:');
    console.log('   1. Claude Sonnet 4.6  → Anthropic API Key');
    console.log('   2. GPT-4o Fallback    → OpenAI API Key');
    console.log('   3. Generar Imagen     → OpenAI API Key (en el header)');
    console.log('   4. Generar Video      → Luma AI API Key');
    console.log('   5. Buscar en Google   → Serper API Key');
    console.log('   6. Guardar Airtable   → Airtable Token + Base ID');
    console.log('   7. Google Drive       → Google OAuth Token');
  } catch(err) {
    console.error('❌ Error al crear workflow:', err.message);
  }
}

main();
