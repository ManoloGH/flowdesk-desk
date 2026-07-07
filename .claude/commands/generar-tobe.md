# /generar-tobe — Generar diagramas BPMN TO-BE

**Cuándo usar:** Después de revisar y aprobar los BPMNs AS-IS con /generar-bpmn.

**Tu tarea como Claude:**

Para cada proceso que tenga un AS-IS aprobado, genera el BPMN TO-BE: cómo debería funcionar el proceso **con la implementación de IA y automatizaciones**.

**Antes de generar, confirma:**
- ¿Qué hallazgos de la matriz se resuelven en este TO-BE?
- ¿Qué tecnología se propone? (n8n, Claude API, WhatsApp Business API, RPA, etc.)

**Diferencias clave AS-IS → TO-BE:**
- Las tareas manuales repetitivas se convierten en `serviceTask` (automatizadas)
- Los cuellos de botella se eliminan o se bypasean con lógica automática
- Se agregan agentes IA donde antes había tareas humanas de procesamiento
- Se muestran las integraciones (CRM, WhatsApp, email) como `serviceTask` con el nombre del sistema
- Los humanos solo aparecen en decisiones de alto nivel o excepciones

**Notación para TO-BE:**
- 🤖 en el nombre del task = ejecutado por IA/agente
- ⚡ en el nombre del task = automatizado (sin IA, solo reglas)
- 👤 en el nombre del task = humano (solo en lo que realmente requiere humano)
- Los `serviceTask` representan integraciones y automatizaciones
- Muestra el flujo ideal, no el posible — el cliente necesita ver la visión completa

**Mismo formato XML que /generar-bpmn** pero con:
- `id="[nombre-proceso]-to-be"` en el `definitions`
- Nombre del diagrama incluye "TO-BE"

**Después de cada TO-BE:**
1. Muestra un resumen de cambios:
```
## Cambios AS-IS → TO-BE: [nombre del proceso]
| Antes | Después |
|-------|---------|
| Tarea manual X (20 min) | 🤖 Automatizada por n8n (0 min) |
| Espera de aprobación (2 días) | ⚡ Regla automática (< 1 min) |
```
2. Di: "✅ TO-BE de [nombre] generado. Responde 'listo [nombre]' para continuar, o ajusta lo que necesites."

**Reglas:**
- Máximo 20 elementos por diagrama
- El flujo debe ser realista para el contexto del cliente (no proponer tecnología que no pueden costear/implementar)
- Si el cliente usa cierta herramienta (ej. GHL, SAP), úsala en el TO-BE
- Mantener los swimlanes del AS-IS para facilitar la comparación visual
