# /analizar — Análisis de hallazgos por área

**Cuándo usar:** Después de recibir el JSON exportado de uno o más cuestionarios de diagnóstico MentorIA.

**Input esperado:** El contenido del archivo JSON (uno o varios concatenados) pegado en la conversación.

**Tu tarea como Claude:**

1. Lee el JSON completo y extrae la información clave de cada área diagnósticada.

2. Para cada área, genera los **hallazgos** en el siguiente formato:

```
## Hallazgos — [ÁREA]

### 🔴 Críticos (impacto alto, urge resolver)
- [Hallazgo]: [descripción breve de la situación y por qué es un problema]

### 🟡 Importantes (impacto medio, atender en 30-60 días)
- [Hallazgo]: [descripción breve]

### 🟢 Positivos (fortalezas o ya tienen algo bien)
- [Hallazgo]: [descripción breve]

### 🤖 Oportunidades IA (procesos candidatos a automatizar)
- [Proceso]: [qué se puede automatizar y cuál sería el beneficio esperado]
```

3. Después de los hallazgos por área, genera una sección:

```
## Patrones Transversales
- [Patrones que aparecen en múltiples áreas]

## Top 3 Problemas del Negocio
1. [El más crítico]
2. [El segundo]
3. [El tercero]
```

4. Detecta gaps — datos que faltan, son ambiguos o tienen baja confianza — y genera el JSON para el formulario de gaps:

```
## ❓ Gaps detectados

Copia este JSON en **gaps-form.html** (campo "Pegar gaps de Claude") para generar el formulario al cliente:

[JSON_GAPS]
```

El JSON debe tener este formato exacto:

```json
[
  { "area": "Ventas", "pregunta": "¿Cuánto tiempo tarda en promedio hacer una cotización?" },
  { "area": "Operaciones", "pregunta": "¿Quién cubre al responsable de X cuando no está disponible?" }
]
```

Criterios para incluir un gap:
- Campo `confianza: "baja"` en el JSON procesado
- Pasos de proceso sin `input`, `output` o `tiempo_estimado`
- Áreas mencionadas en el organigrama pero sin procesos documentados
- Herramientas detectadas sin saber en qué proceso se usan
- Dolores mencionados sin identificar en qué proceso ocurren
- Decisiones o excepciones que se mencionaron pero no se detallaron

Si no hay gaps, escribe: `"gaps": []` y omite la sección.

**Reglas:**
- Sé específico: usa los datos del JSON (números, nombres de herramientas, procesos descritos)
- No inventes información que no esté en los datos
- Si el campo está vacío, omítelo sin mencionar que faltó
- Tono: diagnóstico ejecutivo, directo, sin rodeos
- Idioma: español
- Al terminar, di "✅ Análisis completo. Si hay gaps, envía el formulario al cliente antes de continuar. Cuando los recibas ejecuta **/procesar-entrevista** con el JSON de respuestas. Si no hay gaps, ejecuta **/priorizar** cuando estés listo."
