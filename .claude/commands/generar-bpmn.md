# /generar-bpmn — Generar diagramas BPMN AS-IS

**Cuándo usar:** Después de /priorizar. Genera un diagrama BPMN por cada proceso con hallazgos relevantes.

**Tu tarea como Claude:**

Para cada proceso identificado en el análisis, genera el XML BPMN 2.0 del flujo AS-IS (cómo funciona HOY, con sus problemas visibles).

**Proceso:**
1. Lista los flujos que vas a diagramar (máx 5 por sesión)
2. Pregunta: "¿Empezamos con [nombre del flujo más relevante]? Responde 'listo' para confirmar."
3. Genera el BPMN XML para ese flujo
4. Espera confirmación antes de generar el siguiente

**Formato del XML:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
             xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
             xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
             targetNamespace="http://mentoria.systems/bpmn"
             id="[nombre-proceso]-as-is">
  <process id="proceso-[nombre]" isExecutable="false">
    <!-- Elementos del proceso -->
  </process>
  <bpmndi:BPMNDiagram>
    <!-- Posicionamiento visual -->
  </bpmndi:BPMNDiagram>
</definitions>
```

**Reglas para el BPMN AS-IS:**
- **Máximo 20 elementos** por diagrama (nodos + conexiones)
- Los **problemas/fricciones** se marcan con un `boundaryEvent` de tipo Error o una `intermediateCatchEvent` con un símbolo de advertencia — o simplemente menciónalos en el nombre del nodo con ⚠️
- Incluye **swimlanes** (lanes) para mostrar qué hace cada actor (cliente, ejecutivo, sistema, área X)
- Los **cuellos de botella** se nombran con 🔴 al inicio del label
- Elementos permitidos: startEvent, endEvent, task, userTask, serviceTask, exclusiveGateway, parallelGateway, sequenceFlow, laneSet, lane
- Los `id` deben ser únicos y descriptivos (ej. `task-recibir-lead`, `gw-lead-calificado`)
- **Coordenadas**: usar grid de 100px, empezar en x=100, y=80. Cada tarea: width=120, height=60. Gateways: width=50, height=50

**Ejemplo de estructura típica:**
```
StartEvent → [Tarea 1] → [Tarea 2] → 🔴 [Cuello de botella] → Gateway → [Camino A / Camino B] → EndEvent
```

**Naming conventions:**
- Tasks: verbo + objeto ("Recibir lead", "Enviar cotización")
- Gateways: pregunta ("¿Lead calificado?")
- Lanes: nombre del rol ("Cliente", "Ejecutivo de Ventas", "Sistema CRM")

Al terminar cada diagrama di:
"✅ BPMN AS-IS de [nombre] generado. Cárgalo en visualizador.html para revisarlo. Responde 'listo [nombre]' para confirmar que está correcto, o dime qué ajustar."
