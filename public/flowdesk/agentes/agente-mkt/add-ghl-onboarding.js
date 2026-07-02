// add-ghl-onboarding.js
// Inserta nodos GHL entre "Guardar en Airtable" y "Armar Bienvenida"
// Flujo: Buscar contacto → IF existe → Crear/Actualizar → Merge → Nota → continúa

const N8N_API = 'https://prueba-digisaurios-n8n.4jvoco.easypanel.host/api/v1';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmY5MjkzMC0yYjk1LTRmNjAtODViOC0xZjYwNTFkNzhjMGUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc1NjEyODI0fQ.s4_wwDB_Xjwlg29cdfePqLZYZ0sDma9IBhsH1PNL5X4';
const WF_ID  = '4eapm64WqFeNTvNc';

const GHL_KEY      = 'pit-473fe495-aa1f-487b-8b0b-25833a27d9c6';
const GHL_LOCATION = 'ozv1adLnIfP3r3Ftz0Ff';

(async () => {
  // 1. Obtener workflow actual
  const res = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    headers: { 'X-N8N-API-KEY': N8N_KEY }
  });
  const wf = await res.json();
  console.log('✅ Workflow obtenido:', wf.name);

  // 2. Desplazar nodos que van después de "Guardar en Airtable" (+1440px en X)
  const DESPLAZAR = ['Armar Bienvenida', 'WhatsApp Bienvenida', 'Responder OK'];
  for (const node of wf.nodes) {
    if (DESPLAZAR.includes(node.name)) {
      node.position[0] += 1440;
    }
  }

  // 3. Nuevos nodos GHL
  const nuevosNodos = [

    // ── Buscar contacto por email ────────────────────────────────────────────
    {
      id: 'ghl-search',
      name: 'Buscar Contacto GHL',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [720, 340],
      parameters: {
        method: 'GET',
        url: `https://services.leadconnectorhq.com/contacts/search`,
        sendQuery: true,
        queryParameters: {
          parameters: [
            { name: 'locationId', value: GHL_LOCATION },
            { name: 'email', value: '={{ $json.contacto.email }}' }
          ]
        },
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: 'Authorization', value: `Bearer ${GHL_KEY}` },
            { name: 'Version',       value: '2021-07-28' }
          ]
        },
        options: {}
      }
    },

    // ── Preparar payload: decide crear o actualizar ──────────────────────────
    {
      id: 'ghl-prep',
      name: 'Preparar Upsert GHL',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [960, 340],
      parameters: {
        jsCode: `
const form    = $('Parsear Formulario').first().json;
const search  = $input.first().json;

const contactos = search.contacts ?? [];
const existe    = contactos.length > 0;
const contactId = existe ? contactos[0].id : null;

const partes    = (form.contacto?.nombre ?? '').trim().split(' ');
const firstName = partes[0] ?? '';
const lastName  = partes.slice(1).join(' ');

const tags = ['mentoria-cliente', 'onboarding'];
if (form.industria) tags.push(form.industria.toLowerCase().replace(/\\s+/g, '-'));

const payload = {
  locationId:  '${GHL_LOCATION}',
  firstName,
  lastName,
  email:       form.contacto?.email ?? '',
  phone:       form.contacto?.wa ?? '',
  companyName: form.empresa ?? '',
  source:      'Onboarding MentorIA',
  tags,
  customFields: []
};

const nota = [
  '📋 ONBOARDING MENTORIA SYSTEMS',
  '──────────────────────────────',
  \`Empresa: \${form.empresa}\`,
  \`Industria: \${form.industria}\`,
  \`Contacto: \${form.contacto?.nombre} | \${form.contacto?.cargo}\`,
  '',
  '🗣️ VOZ DE MARCA',
  \`Tono: \${(form.tono ?? []).join(', ')}\`,
  \`Personalidad: \${(form.personalidad ?? []).join(', ')}\`,
  \`Tratamiento: \${form.tratamiento}\`,
  \`Qué SÍ decir: \${form.queDecir}\`,
  \`Qué NO decir: \${form.prohibido}\`,
  '',
  '🎯 CLIENTES',
  \`Primario: \${form.clienteIdeal}\`,
  form.clienteSecundarioA ? \`Secundario A: \${form.clienteSecundarioA}\` : '',
  form.clienteSecundarioB ? \`Secundario B: \${form.clienteSecundarioB}\` : '',
  '',
  '📱 REDES Y CRM',
  \`Redes: \${(form.redes ?? []).join(', ')}\`,
  \`CRM: \${form.crm}\`,
  '',
  '👥 EQUIPO',
  \`DC: \${form.equipoDC?.nombre ?? '-'} | \${form.equipoDC?.email ?? ''}\`,
  \`Diseñador: \${form.equipoDisenador?.nombre ?? '-'}\`,
  \`Trafiqueur: \${form.equipoTrafiqueur?.nombre ?? '-'}\`,
  \`Supervisor: \${form.equipoSupervisor?.nombre ?? '-'}\`,
  '',
  \`📁 Drive: \${form.driveUrl ?? 'pendiente'}\`
].filter(Boolean).join('\\n');

return [{ json: { existe, contactId, payload, nota, form } }];
        `.trim()
      }
    },

    // ── IF: ¿existe en GHL? ──────────────────────────────────────────────────
    {
      id: 'ghl-if',
      name: '¿Nuevo en GHL?',
      type: 'n8n-nodes-base.if',
      typeVersion: 2,
      position: [1200, 340],
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
          conditions: [
            {
              id: 'cond1',
              leftValue:  '={{ $json.existe }}',
              rightValue: false,
              operator: { type: 'boolean', operation: 'equals' }
            }
          ],
          combinator: 'and'
        }
      }
    },

    // ── Crear contacto (rama true: no existe) ────────────────────────────────
    {
      id: 'ghl-create',
      name: 'Crear Contacto GHL',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [1440, 220],
      parameters: {
        method: 'POST',
        url: 'https://services.leadconnectorhq.com/contacts/',
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: 'Authorization',  value: `Bearer ${GHL_KEY}` },
            { name: 'Version',        value: '2021-07-28' },
            { name: 'Content-Type',   value: 'application/json' }
          ]
        },
        sendBody: true,
        contentType: 'json',
        body: {
          mode: 'raw',
          raw: '={{ JSON.stringify($json.payload) }}'
        },
        options: {}
      }
    },

    // ── Actualizar contacto (rama false: ya existe) ──────────────────────────
    {
      id: 'ghl-update',
      name: 'Actualizar Contacto GHL',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [1440, 460],
      parameters: {
        method: 'PUT',
        url: '={{ "https://services.leadconnectorhq.com/contacts/" + $json.contactId }}',
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: 'Authorization',  value: `Bearer ${GHL_KEY}` },
            { name: 'Version',        value: '2021-07-28' },
            { name: 'Content-Type',   value: 'application/json' }
          ]
        },
        sendBody: true,
        contentType: 'json',
        body: {
          mode: 'raw',
          raw: '={{ JSON.stringify($json.payload) }}'
        },
        options: {}
      }
    },

    // ── Merge ambas ramas ────────────────────────────────────────────────────
    {
      id: 'ghl-merge',
      name: 'Merge GHL',
      type: 'n8n-nodes-base.merge',
      typeVersion: 3,
      position: [1680, 340],
      parameters: {
        mode: 'passThrough',
        output: 'input1'
      }
    },

    // ── Extraer contactId del response y pasar nota ──────────────────────────
    {
      id: 'ghl-extract',
      name: 'Extraer ID GHL',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [1920, 340],
      parameters: {
        jsCode: `
const prep   = $('Preparar Upsert GHL').first().json;
const merged = $input.first().json;

// El contactId viene del create (contact.id) o del update (contact.id) o del prep si ya existía
const contactId =
  merged?.contact?.id ??
  prep.contactId;

return [{ json: { contactId, nota: prep.nota, form: prep.form } }];
        `.trim()
      }
    },

    // ── Agregar nota de onboarding al contacto ───────────────────────────────
    {
      id: 'ghl-note',
      name: 'Nota Onboarding GHL',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [2160, 340],
      parameters: {
        method: 'POST',
        url: '={{ "https://services.leadconnectorhq.com/contacts/" + $json.contactId + "/notes" }}',
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: 'Authorization',  value: `Bearer ${GHL_KEY}` },
            { name: 'Version',        value: '2021-07-28' },
            { name: 'Content-Type',   value: 'application/json' }
          ]
        },
        sendBody: true,
        contentType: 'json',
        body: {
          mode: 'raw',
          raw: '={{ JSON.stringify({ body: $json.nota }) }}'
        },
        options: {}
      }
    }
  ];

  // 4. Agregar nuevos nodos al array
  wf.nodes.push(...nuevosNodos);

  // 5. Actualizar conexiones
  // Romper: Guardar en Airtable → Armar Bienvenida
  // Nueva cadena: Guardar en Airtable → Buscar Contacto GHL → Preparar Upsert GHL → ¿Nuevo en GHL? → Crear/Actualizar → Merge GHL → Extraer ID GHL → Nota Onboarding GHL → Armar Bienvenida

  wf.connections['Guardar en Airtable'] = {
    main: [[{ node: 'Buscar Contacto GHL', type: 'main', index: 0 }]]
  };
  wf.connections['Buscar Contacto GHL'] = {
    main: [[{ node: 'Preparar Upsert GHL', type: 'main', index: 0 }]]
  };
  wf.connections['Preparar Upsert GHL'] = {
    main: [[{ node: '¿Nuevo en GHL?', type: 'main', index: 0 }]]
  };
  wf.connections['¿Nuevo en GHL?'] = {
    main: [
      [{ node: 'Crear Contacto GHL',     type: 'main', index: 0 }],  // true (no existe)
      [{ node: 'Actualizar Contacto GHL', type: 'main', index: 0 }]  // false (ya existe)
    ]
  };
  wf.connections['Crear Contacto GHL'] = {
    main: [[{ node: 'Merge GHL', type: 'main', index: 0 }]]
  };
  wf.connections['Actualizar Contacto GHL'] = {
    main: [[{ node: 'Merge GHL', type: 'main', index: 1 }]]
  };
  wf.connections['Merge GHL'] = {
    main: [[{ node: 'Extraer ID GHL', type: 'main', index: 0 }]]
  };
  wf.connections['Extraer ID GHL'] = {
    main: [[{ node: 'Nota Onboarding GHL', type: 'main', index: 0 }]]
  };
  wf.connections['Nota Onboarding GHL'] = {
    main: [[{ node: 'Armar Bienvenida', type: 'main', index: 0 }]]
  };

  // 6. PUT al workflow
  const { name, nodes, connections, settings, staticData } = wf;
  const putRes = await fetch(`${N8N_API}/workflows/${WF_ID}`, {
    method: 'PUT',
    headers: {
      'X-N8N-API-KEY': N8N_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, nodes, connections, settings, staticData })
  });

  const result = await putRes.json();
  if (putRes.ok) {
    console.log('✅ Workflow actualizado con nodos GHL');
    console.log('   Nodos totales:', result.nodes?.length);
  } else {
    console.log('❌ PUT falló:', putRes.status, JSON.stringify(result).slice(0, 400));
  }
})().catch(e => { console.error('❌', e.message); process.exit(1); });
