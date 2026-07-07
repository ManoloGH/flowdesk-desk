# /procesar-documentos — Procesar documentos del cliente antes de la entrevista

**Cuándo usar:** Antes de la sesión de diagnóstico. El ejecutivo pega el contenido de los documentos que el cliente subió al Drive (organigrama, flujos, manuales, listas de herramientas, etc.).

**Puede recibir cualquier formato:**
- Texto pegado de un Word/PDF
- Descripción de una imagen o diagrama
- Lista de empleados copiada de un Excel
- Captura de pantalla descrita
- Texto de un mensaje de WhatsApp

**Tu tarea como Claude:**

## Paso 1 — Identificar y clasificar lo recibido

Lee todo el contenido proporcionado e identifica qué tipo de documento es cada parte:
- `organigrama` — lista de personas, roles, jerarquías
- `flujo_proceso` — pasos de un proceso, aunque sea narrativo
- `herramientas` — software, apps, sistemas mencionados
- `metricas` — números, volúmenes, tiempos, tasas
- `sop_manual` — instrucciones de cómo hacer algo
- `contexto_empresa` — información general del negocio

## Paso 2 — Extraer y estructurar

Con base en lo identificado, genera un JSON con todo lo que puedes inferir:

```json
{
  "empresa": "Nombre de la empresa si aparece",
  "documentos_procesados": ["organigrama", "flujo_ventas", "lista_herramientas"],
  "contexto": {
    "giro": "Lo que hace la empresa si se menciona",
    "empleados_total": 0,
    "herramientas_detectadas": ["Tool1", "Tool2"]
  },
  "organigrama": [
    { "area": "Ventas", "personas": [{ "nombre": "Ana", "puesto": "Ejecutiva Comercial" }] }
  ],
  "procesos_detectados": [
    {
      "area": "Ventas",
      "nombre": "Gestión de leads",
      "fuente": "flujo_ventas.pdf",
      "pasos_detectados": [
        {
          "orden": 1,
          "nombre": "Recibir lead",
          "descripcion": "Lo que se pudo inferir del documento",
          "herramienta": "WhatsApp",
          "responsable": "Ana",
          "input": "Mensaje entrante",
          "output": "Lead registrado",
          "tiempo_estimado": "5 min",
          "habilidad_especial": false,
          "confianza": "alta | media | baja"
        }
      ],
      "gaps": ["No se menciona qué pasa si el lead no responde", "Sin información sobre tiempos de seguimiento"]
    }
  ]
}
```

**Campo `confianza`:** qué tan seguros estamos de que ese dato es correcto:
- `alta` — está explícito en el documento
- `media` — se puede inferir con lógica
- `baja` — es una suposición que necesita confirmarse en la entrevista

## Paso 3 — Generar el reporte de gaps

Después del JSON, genera una sección con:

```
## ✅ Lo que ya tenemos

- [Lista de lo que se pudo extraer con confianza alta/media]

## ❓ Lo que falta confirmar en la entrevista

### Por área:

**[Área 1]**
- [ ] [Pregunta específica para llenar el gap]
- [ ] [Pregunta específica para llenar el gap]

**[Área 2]**
- [ ] ...

### General:
- [ ] Tiempos reales por proceso (ningún documento los menciona)
- [ ] Clasificación Humano / IA / Compartido (requiere discusión)
- [ ] Dolores y frustraciones reales (no aparecen en documentos formales)
- [ ] Decisiones que toman y cuándo hacen excepciones
```

## Paso 4 — Dar instrucciones al ejecutivo

```
## 🎯 Cómo usar esto en la sesión

1. Carga el JSON en el cuestionario de diagnóstico correspondiente (botón "Importar datos previos")
2. Los campos con confianza ALTA ya están pre-llenados — confirma con el cliente que son correctos
3. Los campos con confianza BAJA están marcados en amarillo — pregúntalos explícitamente
4. Sigue la lista de gaps arriba para no perder ninguna pregunta crítica
5. Usa el tiempo liberado para profundizar en los dolores reales y la clasificación IA

Tiempo estimado que ahorra este pre-procesamiento: [N] minutos de entrevista.
```

**Reglas:**
- Si el contenido está en varios archivos, procésamlos todos juntos en un solo JSON
- Nunca inventes datos — si no está en el documento, el campo queda vacío o va a gaps
- Usa los nombres exactos que aparecen en los documentos (personas, herramientas, áreas)
- Si detectas inconsistencias entre documentos, márcalas como gaps
- Idioma: 100% español
- Al terminar di: "✅ Documentos procesados. Ejecuta el cuestionario de diagnóstico con estos datos como punto de partida."
