# n8n Workflow Builder - Guía de Eficiencia Máxima

## INSTRUCCIÓN OBLIGATORIA

**ANTES de cualquier trabajo con n8n:**
1. Leer el skill relevante en `n8n-skills/skills/`
2. Seguir el flujo de 6 pasos (abajo)
3. VERIFICAR cada cambio con `n8n_get_workflow`

---

## FLUJO DE 6 PASOS (OBLIGATORIO)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. CONSULTAR SKILL                                              │
│    Leer n8n-skills/skills/[skill]/SKILL.md según la tarea      │
├─────────────────────────────────────────────────────────────────┤
│ 2. DISEÑAR                                                      │
│    - Identificar patrón (webhook, API, DB, AI Agent, schedule)  │
│    - search_nodes() para encontrar nodos                        │
│    - get_node() para ver configuración requerida               │
├─────────────────────────────────────────────────────────────────┤
│ 3. IMPLEMENTAR                                                  │
│    - n8n_create_workflow o n8n_update_partial_workflow          │
│    - Usar smart parameters (branch="true", case=0)              │
│    - Incluir intent en cada operación                           │
├─────────────────────────────────────────────────────────────────┤
│ 4. VERIFICAR (después de CADA cambio)                           │
│    - n8n_get_workflow({id, mode: "structure"})                  │
│    - Confirmar que los campos cambiaron                         │
│    - Si no cambió → reportar y corregir                        │
├─────────────────────────────────────────────────────────────────┤
│ 5. VALIDAR                                                      │
│    - n8n_validate_workflow({id, options: {profile: "runtime"}}) │
│    - Ciclo: validar → leer error → corregir → validar          │
│    - Normal: 2-3 iteraciones                                    │
├─────────────────────────────────────────────────────────────────┤
│ 6. ACTIVAR                                                      │
│    - operations: [{type: "activateWorkflow"}]                   │
│    - Monitorear primeras ejecuciones                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## MAPA DE SKILLS

| Tarea | Skill | Archivo Principal |
|-------|-------|-------------------|
| Buscar nodos, usar MCP | n8n-mcp-tools-expert | `SKILL.md`, `WORKFLOW_GUIDE.md` |
| Arquitectura de workflow | n8n-workflow-patterns | `SKILL.md`, `ai_agent_workflow.md` |
| Configurar nodo | n8n-node-configuration | `SKILL.md` |
| Escribir expresiones | n8n-expression-syntax | `SKILL.md`, `COMMON_MISTAKES.md` |
| Código JavaScript | n8n-code-javascript | `SKILL.md`, `ERROR_PATTERNS.md` |
| Código Python | n8n-code-python | `SKILL.md` |
| Errores de validación | n8n-validation-expert | `SKILL.md`, `ERROR_CATALOG.md` |

---

## 5 PATRONES DE WORKFLOW

### 1. Webhook Processing (35% de workflows)
```
Webhook → Validar → Transformar → Acción → Responder
```
**Usar cuando:** Recibir datos externos (forms, payments, chat)

### 2. HTTP API Integration (45% de outputs)
```
Trigger → HTTP Request → Transform → Store/Notify
```
**Usar cuando:** Sincronizar con APIs externas

### 3. Database Operations
```
Schedule → Query → Transform → Write → Verify
```
**Usar cuando:** ETL, sincronización de datos

### 4. AI Agent Workflow
```
Trigger → AI Agent ← Model + Memory + Tools → Output
```
**Usar cuando:** Chatbots, asistentes con acceso a datos

### 5. Scheduled Tasks (28% de triggers)
```
Schedule → Fetch → Process → Deliver → Log
```
**Usar cuando:** Reportes, tareas recurrentes

---

## REGLAS CRÍTICAS

### 1. nodeType: DOS FORMATOS
```javascript
// Para search_nodes, get_node, validate_node:
"nodes-base.slack"
"nodes-langchain.agent"

// Para n8n_create_workflow, n8n_update_partial_workflow:
"n8n-nodes-base.slack"
"@n8n/n8n-nodes-langchain.agent"
```

### 2. Webhook: DATOS EN .body
```javascript
// ❌ NUNCA funciona
{{$json.email}}

// ✅ SIEMPRE así
{{$json.body.email}}
```

### 3. Code Node: FORMATO DE RETORNO
```javascript
// ✅ CORRECTO
return [{json: {field: "value"}}];

// ❌ INCORRECTO
return {json: {...}};  // falta array
```

### 4. Expresiones Mixtas: EMPEZAR CON =
```javascript
// ❌ INCORRECTO
"Hola {{ $json.name }}"

// ✅ CORRECTO
"=Hola {{ $json.body.name }}"
```

### 5. Conexiones AI: 8 TIPOS
```javascript
"ai_languageModel"  // Model → Agent
"ai_tool"           // Tool → Agent
"ai_memory"         // Memory → Agent
"ai_outputParser"   // Parser → Agent
"ai_embedding"      // Embeddings
"ai_vectorStore"    // Vector Store
"ai_document"       // Document Loader
"ai_textSplitter"   // Text Splitter
```

### 6. HTTP Request: typeVersion 4.2 (NO 4.4)
```javascript
// ⚠️ CRÍTICO: typeVersion 4.4 CORROMPE el nodo
// El nodo aparece como "Install this node to use it"

// ❌ NUNCA usar
{
  type: "n8n-nodes-base.httpRequest",
  typeVersion: 4.4  // CORROMPE EL NODO
}

// ✅ SIEMPRE usar
{
  type: "n8n-nodes-base.httpRequest",
  typeVersion: 4.2  // Funciona correctamente
}
```

### 7. Google Sheets Update: REQUIERE range
```javascript
// ❌ INCORRECTO - falta range
{
  operation: "update",
  documentId: {...},
  sheetName: {...},
  columns: {...}
}

// ✅ CORRECTO
{
  operation: "update",
  documentId: {...},
  sheetName: {...},
  columns: {...},
  range: "NombreHoja!A:Z"  // ⚠️ REQUERIDO para update
}
```

---

## NODOS ESPECIALES (NO EN SKILLS)

### Evolution API (WhatsApp)
```javascript
{
  type: "n8n-nodes-evolution-api.evolutionApi",
  typeVersion: 1,
  parameters: {
    resource: "messages-api",
    instanceName: "={{ $json.instanceName }}",
    remoteJid: "={{ $json.phone }}@s.whatsapp.net",
    messageText: "={{ $json.text }}",  // ⚠️ REQUERIDO
    options_message: {}
  }
}
```

### $fromAI() para AI Tools
```javascript
// Sintaxis: $fromAI('nombre', 'descripcion', 'tipo')

// En Calendar Tool:
timeMin: "={{ $fromAI('After', 'Fecha ISO', 'string') }}"

// En Sheets Tool:
lookupValue: "={{ $fromAI('telefono', 'Teléfono a buscar', 'string') }}"

// Con manipulación de fecha:
start: "={{ DateTime.fromISO($fromAI('Start', '', 'string')).plus({hours: 1}).toISO() }}"
```

### Google Sheets Tool (AI)
```javascript
{
  type: "n8n-nodes-base.googleSheetsTool",
  typeVersion: 4.5,
  parameters: {
    descriptionType: "manual",
    toolDescription: "Busca pacientes por teléfono",  // ⚠️ REQUERIDO
    documentId: { __rl: true, value: "SHEET_ID", mode: "id" },
    sheetName: { __rl: true, value: "Pacientes", mode: "name" },
    filtersUI: {
      values: [{
        lookupColumn: "Telefono",
        lookupValue: "={{ $fromAI('telefono', 'Teléfono', 'string') }}"
      }]
    }
  }
}
```

### Google Calendar Tool (AI)
```javascript
{
  type: "n8n-nodes-base.googleCalendarTool",
  typeVersion: 1.3,
  parameters: {
    toolDescription: "Ver/crear citas",  // ⚠️ REQUERIDO
    operation: "getAll",  // o "create", "delete"
    calendar: { __rl: true, value: "email@gmail.com", mode: "list" },
    timeMin: "={{ $fromAI('After', '', 'string') }}",
    timeMax: "={{ $fromAI('Before', '', 'string') }}"
  }
}
```

### Guardrails (LangChain)
```javascript
{
  type: "@n8n/n8n-nodes-langchain.guardrails",
  typeVersion: 2,
  parameters: {
    operation: "sanitize",
    text: "={{ $json.output }}",
    guardrails: {
      pii: { value: { type: "all" } },
      secretKeys: { value: { permissiveness: "balanced" } }
    }
  }
}
// ⚠️ 2 OUTPUTS: [0]=sanitizado, [1]=rechazado
```

---

## HERRAMIENTAS MCP - USO EFICIENTE

### Búsqueda de Nodos
```javascript
// 1. Buscar
search_nodes({query: "slack", limit: 10})

// 2. Ver detalles (standard = 95% de casos)
get_node({nodeType: "nodes-base.slack"})

// 3. Solo si necesitas más:
get_node({nodeType: "nodes-base.slack", mode: "search_properties", propertyQuery: "auth"})
```

### Validación
```javascript
// Nodo individual
validate_node({
  nodeType: "nodes-base.slack",
  config: {...},
  profile: "runtime"  // SIEMPRE especificar
})

// Workflow completo
n8n_validate_workflow({
  id: "workflow-id",
  options: { profile: "runtime" }
})
```

### Actualización con Smart Parameters
```javascript
n8n_update_partial_workflow({
  id: "workflow-id",
  intent: "Conectar IF a handlers",  // SIEMPRE incluir
  operations: [
    {
      type: "addConnection",
      source: "IF",
      target: "Success Handler",
      branch: "true"  // En lugar de sourceIndex: 0
    },
    {
      type: "addConnection",
      source: "IF",
      target: "Error Handler",
      branch: "false"  // En lugar de sourceIndex: 1
    }
  ]
})
```

### Conexiones AI
```javascript
{
  type: "addConnection",
  source: "OpenAI Chat Model",
  target: "AI Agent",
  sourceOutput: "ai_languageModel"  // NO "main"
}

{
  type: "addConnection",
  source: "My Tool",
  target: "AI Agent",
  sourceOutput: "ai_tool"  // NO "main"
}
```

---

## VERIFICACIÓN POST-CAMBIO

**OBLIGATORIO después de cada `n8n_update_partial_workflow`:**

```javascript
// 1. Aplicar cambio
await n8n_update_partial_workflow({
  id: "xyz",
  intent: "Añadir messageText",
  operations: [{
    type: "updateNode",
    nodeName: "Enviar texto",
    updates: { parameters: { messageText: "={{ $json.text }}" } }
  }]
})

// 2. VERIFICAR
const wf = await n8n_get_workflow({ id: "xyz", mode: "structure" })
const node = wf.nodes.find(n => n.name === "Enviar texto")

// 3. Confirmar
if (node.parameters.messageText) {
  console.log("✅ Cambio aplicado:", node.parameters.messageText)
} else {
  console.log("❌ Cambio NO aplicado - investigar")
}
```

---

## CHECKLIST PRE-ACTIVACIÓN

```
□ Consulté skill relevante en n8n-skills/
□ Usé el patrón correcto (webhook/API/DB/AI/schedule)
□ Todos los nodos tienen typeVersion
□ HTTP Request usa typeVersion 4.2 (NO 4.4)
□ Google Sheets update tiene campo range
□ Expresiones con .body para webhooks
□ Code nodes retornan [{json: {...}}]
□ Expresiones mixtas empiezan con =
□ AI Tools tienen toolDescription
□ Conexiones AI usan sourceOutput correcto
□ Verifiqué CADA cambio con n8n_get_workflow
□ n8n_validate_workflow sin errores
□ Credenciales configuradas en n8n UI
```

---

## ERRORES FRECUENTES Y SOLUCIÓN RÁPIDA

| Error | Causa | Solución |
|-------|-------|----------|
| "Node not found" | Formato nodeType incorrecto | `nodes-base.X` para search/validate |
| "Cannot read property" | Datos no en .body | `{{$json.body.field}}` |
| "Code returns nothing" | Falta return | `return [{json: {...}}]` |
| "Expression as text" | Falta = al inicio | `"=Texto {{expr}}"` |
| Evolution no envía | Falta messageText | Añadir `messageText: "={{ $json.text }}"` |
| Tool con ? | Falta toolDescription | Añadir `toolDescription: "..."` |
| Conexión AI falla | Usando "main" | Usar `ai_tool`, `ai_languageModel`, etc. |
| "Install this node to use it" | HTTP Request con typeVersion 4.4 | Recrear nodo con `typeVersion: 4.2` |
| "Range is required" | Google Sheets update sin range | Añadir `range: "Hoja!A:Z"` |

---

## MÉTRICAS DE EFICIENCIA

**Tiempos promedio observados:**
- search → get_node: 18s
- validate → fix → validate: 23s pensando, 58s corrigiendo
- Entre edits de workflow: 56s
- Iteraciones de validación: 2-3 ciclos

**Tasas de éxito:**
- n8n_update_partial_workflow: 99%
- Auto-sanitización: Automática en cada update

---

## RECURSOS

**Skills:** `n8n-skills/skills/[nombre]/SKILL.md`

**Repositorios:**
- MCP Server: github.com/czlonkowski/n8n-mcp
- Skills: github.com/czlonkowski/n8n-skills

---

*Skills de n8n por Romuald Czlonkowski - [aiadvisors.pl/en](https://www.aiadvisors.pl/en)*
