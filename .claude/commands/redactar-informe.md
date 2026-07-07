# /redactar-informe — Generar informe de diagnóstico HTML

**Cuándo usar:** Después de aprobar la matriz (/priorizar) y los BPMNs (/generar-bpmn + /generar-tobe).

**Tu tarea como Claude:**

Genera el informe completo de diagnóstico en formato HTML, listo para compartir con el cliente.

**Estructura del informe (9 secciones):**

### 1. Portada y Resumen Ejecutivo
- Nombre de la empresa cliente
- Fecha del diagnóstico
- Implementador MentorIA responsable
- 3-4 bullets con los hallazgos más importantes
- 1 párrafo con la recomendación principal

### 2. Metodología
- Breve descripción del proceso de diagnóstico MentorIA
- Áreas evaluadas y número de preguntas por área
- Escala de evaluación (1-5) y criterios

### 3. Análisis por Área
Para cada área diagnosticada:
- Tabla con autoevaluación (barras de progreso)
- Lista de hallazgos críticos / importantes / positivos
- Herramientas actuales vs. herramientas recomendadas

### 4. Hallazgos Principales
- Top 5 hallazgos críticos con descripción detallada
- Impacto estimado en el negocio de cada uno

### 5. Matriz de Priorización
- Tabla ordenada por score (Impacto × Facilidad)
- Incluir: nombre, área, impacto, facilidad, score, categoría, horas/mes
- Leyenda de colores: Quick Win / Alto Impacto / Low Hanging / Baja Prioridad

### 6. Flujos AS-IS
- Un bloque por proceso diagramado
- Título del proceso + descripción de los problemas identificados
- Placeholder visual: "📐 Ver diagrama en visualizador.html → [nombre-archivo.bpmn]"

### 7. Flujos TO-BE
- Misma estructura que AS-IS
- Tabla de cambios: Antes → Después con tiempo ahorrado
- Tecnología propuesta para cada automatización

### 8. Plan de Implementación
Dividido en fases:
- **Fase 0 — Mapeo técnico** (2 semanas): accesos, APIs, documentación
- **Fase 1 — Quick Wins** (4 semanas): automatizaciones de alto impacto fácil
- **Fase 2 — Expansión** (8 semanas): procesos más complejos
- **Fase 3 — Optimización** (ongoing): mejoras continuas basadas en métricas

Para cada fase: qué se implementa, qué sistemas se integran, resultado esperado.

### 9. Siguiente Paso Recomendado
- Una sola llamada a la acción clara
- Propuesta de implementación (fase, precio según tamaño de empresa)
- Contacto del implementador MentorIA

---

**Estilo HTML del informe:**
- Usa el mismo sistema de diseño que los cuestionarios:
  - Background: `#0a0a14`
  - Superficie: `#13131f`
  - Morado: `#6c4de6`
  - Cyan: `#00d4ff`
  - Fuente: Inter / system-ui
- Barras de progreso para scores (verde ≥4, amarillo 3, rojo ≤2)
- Tabla de hallazgos con semáforo de colores
- Sección de ROI estimado con cálculo de horas × costo hora del equipo

**Pricing a mencionar en el informe (Sección 9):**
- Empresas < 10 empleados: $10,000 MXN + IVA
- Empresas 10-100 empleados: $30,000 MXN + IVA
- Empresas > 100 empleados: $50,000 MXN + IVA

**Reglas:**
- El HTML debe ser un archivo único y autocontenido (sin dependencias externas excepto Google Fonts)
- Debe verse bien tanto en pantalla como al imprimir (CSS print)
- No incluir tiempos estimados de reuniones
- Idioma: 100% español
- Al terminar di: "✅ Informe generado. Guárdalo como reporte-[empresa]-[fecha].html en flowdesk/diagnosticos/"
