# /priorizar — Matriz de Priorización Impacto × Facilidad

**Cuándo usar:** Después de ejecutar /analizar. Usa los hallazgos identificados.

**Tu tarea como Claude:**

Toma todos los hallazgos y oportunidades IA del análisis anterior y genera la **Matriz de Priorización** en este formato exacto:

```json
{
  "hallazgos": [
    {
      "nombre": "Nombre corto del hallazgo (máx 60 chars)",
      "area": "Marketing|Ventas|Operaciones|Administración|Entrega de Servicio",
      "tipo": "problema|oportunidad|riesgo",
      "impacto": 4,
      "facilidad": 5,
      "horas": "~20 hrs/mes",
      "notas": "Descripción breve del hallazgo y por qué tiene ese puntaje"
    }
  ]
}
```

**Criterios de puntuación:**

**Impacto (1-5):**
- 5: Impacta directamente en ingresos o en la capacidad de operar
- 4: Impacta significativamente en la experiencia del cliente o eficiencia del equipo
- 3: Mejora relevante pero no urgente
- 2: Nice to have
- 1: Cosmético o muy marginal

**Facilidad (1-5):**
- 5: Se puede implementar en días con herramientas existentes (ej. n8n + WhatsApp)
- 4: 1-2 semanas de implementación, sin integraciones complejas
- 3: 1 mes, requiere alguna integración o configuración moderada
- 2: 2-3 meses, requiere desarrollo o integraciones complejas
- 1: +3 meses o requiere cambio de sistema core

**Estimación de horas ahorradas:**
- Basada en los datos del cuestionario (tareas repetitivas, horas manuales declaradas)
- Si no hay dato, estima conservadoramente basándote en el proceso descrito

**Categorías resultantes:**
- `Impacto ≥3 y Facilidad ≥3` → **Quick Win** ⚡ (hacer primero)
- `Impacto ≥3 y Facilidad <3` → **Alto Impacto** 🏆 (planear a mediano plazo)
- `Impacto <3 y Facilidad ≥3` → **Low Hanging** 🍎 (hacer si hay capacidad)
- `Impacto <3 y Facilidad <3` → **Baja Prioridad** ⬇ (dejar para después)

**Reglas:**
- Incluye TODOS los hallazgos del análisis anterior
- Mínimo 8, máximo 20 hallazgos
- Ordena de mayor a menor score (impacto × facilidad)
- Output: solo el JSON limpio, sin texto extra antes ni después
- Al terminar, di: "✅ Matriz generada. Copia el JSON a matriz-impacto.html o ejecuta /generar-bpmn."
