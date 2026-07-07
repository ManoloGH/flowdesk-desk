# /procesar-entrevista — Procesar transcript de videoconferencia

**Cuándo usar:** Después de la Entrevista 1 de descubrimiento. El ejecutivo pega el transcript de la videollamada (Zoom, Google Meet, Otter.ai, etc.) y Claude extrae toda la información estructurada.

**Importante:** Los transcripts son conversacionales y desordenados. La gente responde cosas fuera de orden, se va por las ramas y se contradice. Extrae los datos correctamente aunque no hayan llegado en secuencia lógica.

---

## Tu tarea como Claude

### Paso 1 — Leer el transcript completo antes de procesar

Lee todo el transcript de principio a fin antes de extraer cualquier dato. Muchas veces una respuesta incompleta al inicio se completa más adelante en la conversación.

### Paso 2 — Identificar a los participantes

Detecta quién habla en cada parte:
- El ejecutivo MentorIA (hace las preguntas)
- El dueño / director (responde sobre el negocio)
- Los responsables de área (responden sobre sus procesos)

Asigna nombre a cada voz para facilitar el mapeo.

### Paso 3 — Extraer y estructurar

Genera el siguiente JSON con todo lo que puedas inferir del transcript:

```json
{
  "empresa": "Nombre detectado",
  "fecha_entrevista": "YYYY-MM-DD",
  "participantes": [
    { "nombre": "Carlos Torres", "rol": "Director de Operaciones" }
  ],
  "contexto_empresa": {
    "giro": "Qué vende / qué hace",
    "cliente_ideal": "A quién le vende",
    "diferenciador": "Qué los hace únicos",
    "empleados_total": 0,
    "objetivos": ["objetivo 1", "objetivo 2"],
    "preocupaciones": ["preocupación 1"]
  },
  "cultura": {
    "jamas_haria": "Lo que mencionaron que nunca harían",
    "excelente_servicio": "Su definición",
    "como_toman_decisiones": "Lo que describieron"
  },
  "organigrama": [
    { "area": "Ventas", "personas": [{ "nombre": "Ana", "puesto": "Ejecutiva" }] }
  ],
  "herramientas_detectadas": ["WhatsApp", "Excel", "GHL"],
  "procesos": [
    {
      "area": "Ventas",
      "nombre": "Gestión de lead entrante",
      "frecuencia": "diario",
      "responsable": "Ana",
      "pasos": [
        {
          "orden": 1,
          "nombre": "Recibir y calificar lead",
          "input": "Mensaje de WhatsApp del prospecto",
          "accion": "Leer, evaluar intención y responder",
          "herramienta": "WhatsApp",
          "habilidad_especial": false,
          "output": "Lead calificado o descartado",
          "tiempo_estimado": "5 min",
          "dolor": "Muchos leads no calificados",
          "confianza": "alta"
        }
      ],
      "dolores_generales": ["Lista de frustraciones mencionadas para esta área"],
      "metricas_mencionadas": ["20 leads al mes", "cierre del 30%"]
    }
  ]
}
```

**Campo `confianza`:**
- `alta` — dato mencionado explícitamente y con claridad
- `media` — inferido lógicamente de lo que se dijo
- `baja` — suposición que necesita confirmarse

**Cuando haya contradicción:** incluye el dato con `confianza: "baja"` y agrega una nota en gaps explicando la inconsistencia.

---

### Paso 4 — Generar reporte de gaps

Después del JSON, genera dos secciones:

```
## ✅ Lo que tenemos con certeza

- [Dato con confianza alta — mencionado explícitamente]
- ...

## ⚠️ Lo que necesita confirmarse (confianza media/baja)

- [Área]: [Dato inferido] → "¿Confirmar que...?"
- ...

## ❓ Gaps — Preguntas para el formulario de gaps

Copia este JSON en gaps-form.html para generar el formulario al cliente:

[
  { "area": "Ventas", "pregunta": "¿Cuánto tiempo tarda en promedio hacer una cotización?" },
  { "area": "Operaciones", "pregunta": "¿Qué pasa cuando el responsable de X no está disponible?" }
]

Total de gaps: [N] preguntas
```

---

### Paso 5 — Calcular tiempo ahorrado

```
## ⏱ Tiempo de entrevista aprovechado

- Información capturada: ~[N] campos del cuestionario
- Gaps pendientes: [N] preguntas
- Tiempo estimado del formulario de gaps para el cliente: [N] min
- Tiempo que ahorrará la Entrevista 2 vs. hacerlo todo en una sesión: ~[N] min
```

---

**Reglas:**
- Usa los nombres exactos que aparecen en el transcript (personas, herramientas, áreas)
- No inventes datos que no estén en el transcript
- Si el transcript tiene ruido (muletillas, conversaciones paralelas), ignóralas
- Procesa todo el transcript, no solo las primeras respuestas
- Idioma: 100% español
- Al terminar di: "✅ Transcript procesado. Copia el JSON de gaps en **gaps-form.html** para enviarlo al cliente. Cuando recibas las respuestas, ejecuta **/procesar-entrevista** de nuevo con el JSON de gaps completado."
