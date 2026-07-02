<div class="cover-page">
<img src="logo-mentoria.jpeg" class="cover-logo" alt="MentorIA Systems"/>

# MANUAL DE IMPLEMENTACIÓN Y OPERACIÓN
## Agente de Marketing IA
### Versión 1.0 — Uso interno

</div>

---

## ÍNDICE

1. [Descripción del producto](#1-descripción-del-producto)
2. [Roles y responsabilidades](#2-roles-y-responsabilidades)
3. [Stack tecnológico](#3-stack-tecnológico)
4. [Proceso de implementación por cliente](#4-proceso-de-implementación-por-cliente)
5. [Llamada de onboarding](#5-llamada-de-onboarding)
6. [Configuración paso a paso de cada herramienta](#6-configuración-paso-a-paso-de-cada-herramienta)
7. [Manual del cliente](#7-manual-del-cliente)
8. [Operación mensual](#8-operación-mensual)
9. [Resolución de problemas frecuentes](#9-resolución-de-problemas-frecuentes)

---

# 1. DESCRIPCIÓN DEL PRODUCTO

## ¿Qué es el Agente de Marketing IA?

Es un sistema de inteligencia artificial que actúa como el departamento de marketing completo de un negocio. No es solo una herramienta — es un equipo virtual que planifica, crea, diseña, reporta y aprende mes a mes sobre la marca del cliente.

## ¿Qué entrega al cliente cada mes?

| Entregable | Descripción |
|---|---|
| Plan de contenido trimestral | Calendario editorial día a día para todos sus canales activos |
| Contenido orgánico | Copies, captions, hashtags y textos listos para publicar |
| Imágenes generadas por IA | Diseños visuales para posts, stories y portadas |
| Videos generados por IA | Reels y videos cortos con Luma AI y Higgsfield |
| Lista de producción humana | Qué fotos y videos reales necesita grabar el cliente ese mes |
| Instrucciones de edición | Guía detallada para el diseñador (CapCut) |
| Diseño de pautas | Anuncios listos con copy, imagen y segmentación de audiencia |
| Material de ventas | Brochures, presentaciones, scripts, one-pagers |
| Investigación de mercado | Tendencias, análisis de competencia, insights del cliente ideal |
| Reporte mensual de resultados | Métricas reales de todas las redes + análisis de ROI |
| Copy de landing page | Estructura y texto completo de la página de conversión |

## Lo que el agente NO hace (servicios adicionales de MentorIA)
- Construcción y publicación de landing pages
- Gestión directa de pauta (el cliente o MentorIA lo hace por separado)
- Fotografía o filmación profesional
- Diseño de identidad visual desde cero (si no tiene marca, se cotiza aparte)
- Integración con sistemas internos del cliente (ERP, CRM, etc.)

---

# 2. ROLES Y RESPONSABILIDADES

## 2.1 EL AGENTE DE IA

El agente es el núcleo del sistema. Opera de forma autónoma dentro de los parámetros configurados en el onboarding.

**Qué hace:**
- Lee el brief de la marca y lo mantiene como memoria base de toda su operación
- Genera el plan de contenido de 3 meses al inicio y lo actualiza mensualmente
- Crea todos los copies, captions y textos del plan
- Genera imágenes con DALL-E 3 basadas en la identidad visual del cliente
- Genera videos cortos con Luma AI y los conecta con Higgsfield para transiciones
- Diseña pautas publicitarias en Canva con copy e imagen
- Investiga tendencias e industria con Serper antes de planificar
- Redacta material de ventas (brochures, scripts, presentaciones)
- Genera el reporte mensual de resultados leyendo métricas reales de Meta y Google
- Calcula el ROI y emite alertas si algún KPI está fuera del objetivo
- Actualiza automáticamente el dashboard del cliente en Bubble

**Cuándo trabaja:**
- Lunes de cada semana: genera el contenido de la semana siguiente
- Día 1 de cada mes: genera el reporte del mes anterior y ajusta el plan
- En tiempo real: responde preguntas del cliente vía chat en el dashboard

**Qué necesita para funcionar bien:**
- Brief de marca completo (sale del onboarding)
- Fotos y videos reales que el cliente sube mensualmente
- Métricas reales conectadas (Meta Business Suite, Google Analytics)
- Retroalimentación del Director Creativo y del cliente

---

## 2.2 DIRECTOR CREATIVO (MentorIA)

Es la figura de control de calidad creativa. Su aprobación es el **primer filtro** obligatorio — ningún contenido llega al cliente sin pasar por él.

**Qué hace:**
- Revisa el brief enriquecido generado por el agente después del onboarding y lo aprueba o ajusta
- Revisa la línea creativa propuesta por el agente para cada cliente (paleta de comunicación, tono visual, estilo de imágenes)
- Aprueba o rechaza el plan de contenido trimestral antes de que el cliente lo vea
- Revisa los entregables finales editados por el diseñador (videos, piezas gráficas, pautas)
- Deja comentarios específicos para que el agente o el diseñador corrijan
- Revisa pautas publicitarias antes de presentarlas al cliente
- Aprueba el material de ventas (brochures, presentaciones)
- Establece estándares de calidad para el diseñador

**Flujo de aprobación semanal:**
```
Agente genera contenido
        ↓
Diseñador edita y sube entregables finales
        ↓
DC revisa calidad → Aprueba ✅ o solicita corrección 🔄
        ↓ (solo si aprueba)
Asesor notifica al cliente para su aprobación final
        ↓ (solo si el cliente aprueba)
Agente programa y publica automáticamente
```

**Tiempo máximo de respuesta:** 24 horas tras recibir notificación

**Lo que NO hace:**
- Configuraciones técnicas de herramientas
- Atención directa al cliente
- Edición de videos

**Acceso en el dashboard:**
- Ve todos los clientes activos
- Ve entregables finales del diseñador antes de que lleguen al cliente
- Botones: "Aprobar ✅" / "Solicitar corrección 🔄" con campo de comentarios obligatorio al rechazar

---

## 2.3 DISEÑADOR (MentorIA)

Es el puente entre el contenido generado por IA y el entregable final de calidad premium.

**Qué hace:**
- Recibe las instrucciones de edición generadas por el agente para cada video
- Descarga los assets de IA (imágenes Luma, Higgsfield, DALL-E) desde el dashboard
- Edita los videos en CapCut siguiendo la guía del agente (cortes, transiciones, música, subtítulos, textos)
- Hace los ajustes finales de diseño en Canva (alineación, tipografía, proporciones)
- Sube los entregables finales al dashboard del cliente
- Reporta al Director Creativo si algo no está acorde a la línea de marca

**Cuándo actúa:**
- Martes y miércoles de cada semana (edición de la semana siguiente)
- Tiempo máximo de entrega: 48 horas después de que el cliente sube su material

**Lo que NO hace:**
- Genera contenido ni copies
- Tiene comunicación directa con el cliente
- Toma decisiones creativas estratégicas

**Acceso en el dashboard:**
- Ve sus tareas pendientes de edición por cliente
- Descarga assets generados por IA
- Ve las instrucciones detalladas del agente
- Sube versiones finales editadas

---

## 2.4 EJECUTIVO DE ATENCIÓN AL CLIENTE (MentorIA)

Es el rostro humano del servicio. Gestiona la relación con el cliente desde la venta hasta la operación diaria.

**Qué hace:**

*Antes del inicio del servicio:*
- Coordina y conduce la llamada de onboarding con el cliente
- Llena la plantilla de captura durante la llamada
- Sube el resumen al sistema para que el agente lo procese
- Configura todas las herramientas del cliente (ver Sección 6)
- Conecta los accesos de redes sociales del cliente
- Da acceso al cliente a su dashboard
- Coordina la llamada de presentación del plan inicial

*Durante la operación mensual:*
- Es el primer contacto para dudas del cliente sobre el SaaS
- Responde preguntas sobre cómo usar el dashboard
- Escala al Director Creativo si el cliente tiene observaciones sobre la línea creativa
- Coordina la llamada mensual de resultados (30 min)
- Recuerda al cliente cuándo debe subir sus fotos y videos
- Gestiona renovaciones y cambios de plan

**Lo que NO hace:**
- Toma decisiones creativas
- Configura el agente de IA (eso lo hace el sistema automáticamente)
- Hace diseño o edición

**Acceso en el dashboard:**
- Ve todos los clientes asignados a su cartera
- Ve el estado de cada entregable
- Tiene acceso al chat de comunicación con el cliente
- Ve alertas de tareas pendientes del cliente

---

## 2.5 EL CLIENTE

El cliente es el proveedor del contexto humano y tiene el **control final** sobre lo que se publica. Nada sale a sus redes sin su aprobación explícita.

**Qué hace:**

*Una sola vez (onboarding):*
- Participa en la llamada de onboarding (60-90 min)
- Entrega logo, colores, tipografías y ejemplos de contenido
- Autoriza acceso a Meta Business Suite y CRM
- Conecta sus cuentas de redes sociales

*Cada semana:*
- Graba o toma las fotos y videos que el agente le especifica
- Sube su material de producción al dashboard (antes del miércoles)
- **Revisa y aprueba el contenido final** antes de que el agente lo publique
- Publica manualmente en: Twitter/X, WhatsApp Status, Threads y stories interactivas (texto e imagen listos para copiar y pegar)

*Cada mes:*
- Proporciona datos de ventas reales para el módulo de ROI
- Participa en la llamada mensual de resultados (30 min)
- Da feedback sobre el contenido del mes

**Flujo de aprobación del cliente:**
```
Recibe notificación: "Tu contenido está listo para revisar"
        ↓
Entra al dashboard → revisa cada pieza
        ↓
Aprueba ✅ → el agente programa y publica automáticamente
Solicita cambio 🔄 → comenta qué ajustar → el asesor escala al equipo
```

**⚠️ SLA de aprobación del cliente:** Si no aprueba ni rechaza en 48 horas, el asesor hace seguimiento. Si no hay respuesta en 72 horas, el contenido se programa con aprobación tácita (acordar esto en el onboarding).

**Lo que el cliente NO necesita saber:**
- Cómo funciona el agente internamente
- Configuraciones técnicas de ninguna herramienta
- Qué herramientas usa MentorIA

**Acceso en el dashboard:**
- Solo ve su propia información
- Ve el plan de contenido aprobado por el DC
- Ve la lista de producción humana (qué debe grabar)
- Sube sus fotos y videos
- **Aprueba o solicita cambios en el contenido final**
- Ve estado de publicaciones (programado / publicado / pendiente tu turno)
- Descarga cualquier asset cuando quiera
- Ve sus reportes de resultados y ROI
- Tiene chat directo con el asesor

---

# 3. STACK TECNOLÓGICO

| Herramienta | Función | Quién la configura | Quién la usa |
|---|---|---|---|
| n8n | Motor del agente IA y automatizaciones | Ejecutivo (con guía de Claude) | Agente IA |
| Airtable | Base de datos de todo el sistema | Ejecutivo (con guía de Claude) | Agente + equipo MentorIA |
| Bubble | Dashboard web del cliente | Diseñador (con guía de Claude) | Cliente + equipo MentorIA |
| Canva Teams | Diseño con brand kit del cliente | Ejecutivo | Agente + diseñador |
| Google Drive | Almacenamiento de assets por cliente | Ejecutivo | Agente + cliente + diseñador |
| DALL-E 3 | Generación de imágenes IA | Configurado en n8n | Agente IA |
| Luma AI | Generación de videos IA | Configurado en n8n | Agente IA |
| Higgsfield | Transiciones cinematográficas | Configurado en n8n | Agente IA |
| Serper | Investigación web | Configurado en n8n | Agente IA |
| Meta Business Suite | Métricas de Facebook e Instagram | Cliente autoriza | Agente IA |
| Google Analytics | Métricas web | Cliente autoriza | Agente IA |
| CapCut | Edición final de videos | — | Diseñador |

---

# 4. PROCESO DE IMPLEMENTACIÓN POR CLIENTE

**Tiempo total estimado: 4-5 horas distribuidas en 5 días**

```
DÍA 1 — Llamada de onboarding (2 horas)
DÍA 2 — Procesamiento del agente + revisión DC (automático + 1 hora DC)
DÍA 3 — Configuración técnica (2 horas ejecutivo)
DÍA 4 — Revisión y pruebas (1 hora)
DÍA 5 — Llamada de entrega al cliente (1 hora)
```

## CHECKLIST DE IMPLEMENTACIÓN

### PRE-LLAMADA (Ejecutivo — 30 min antes)
```
□ Crear carpeta del cliente en Google Drive: "Clientes/[NombreCliente]"
  └── /Brief
  └── /Assets IA
  └── /Producción Cliente
  └── /Entregables Finales
  └── /Reportes

□ Preparar la plantilla de captura de onboarding (ver Sección 5)
□ Tener el link de la videollamada listo
□ Confirmar asistencia del cliente 24 horas antes
```

### DÍA 1 — LLAMADA DE ONBOARDING
```
□ Conducir la llamada (ver Sección 5 para el guión)
□ Llenar la plantilla de captura en tiempo real
□ Solicitar al cliente: logo, colores, tipografías, ejemplos de contenido
□ Acordar canales activos y prioridades
□ Confirmar presupuesto de pauta y meta de ventas
□ Explicar al cliente qué sigue (ver Sección 7)
□ Subir el resumen al campo "Brief Inicial" en Airtable del cliente
□ Subir archivos recibidos (logo, etc.) a Google Drive/Brief
```

### DÍA 2 — PROCESAMIENTO (Automático + Director Creativo)
```
□ El agente procesa el brief automáticamente (n8n se dispara al guardar en Airtable)
□ El agente investiga la industria (Serper)
□ El agente genera el brief enriquecido
□ Notificación automática al Director Creativo
□ Director Creativo revisa y aprueba o deja comentarios (máx 24 horas)
□ Si hay comentarios: el agente ajusta y notifica de nuevo
□ Brief aprobado queda en Airtable como "Configuración base del agente"
```

### DÍA 3 — CONFIGURACIÓN TÉCNICA (Ejecutivo)
```
□ Airtable: crear base del cliente desde template (ver Sección 6.1)
□ Bubble: duplicar dashboard template y conectar a base Airtable (ver Sección 6.2)
□ n8n: duplicar workflow template y configurar variables del cliente (ver Sección 6.3)
□ Canva: crear brand kit del cliente con logo, colores y tipografías (ver Sección 6.4)
□ Google Drive: confirmar estructura de carpetas creada en pre-llamada
□ Invitar al cliente a su dashboard Bubble con su email
□ Conectar Meta Business Suite del cliente (link de autorización)
□ Conectar Google Analytics del cliente (link de autorización)
□ Prueba de funcionamiento: enviar mensaje de prueba al agente
```

### DÍA 4 — REVISIÓN Y PRUEBAS
```
□ Verificar que el dashboard carga correctamente con los datos del cliente
□ Verificar que el agente responde en el chat del dashboard
□ Verificar que las imágenes generadas por DALL-E aparecen correctamente
□ Verificar que las métricas de Meta/Google están conectadas
□ Revisar que el plan de contenido inicial generado es correcto
□ El Director Creativo aprueba el plan inicial
□ Preparar la presentación para la llamada de entrega
```

### DÍA 5 — LLAMADA DE ENTREGA AL CLIENTE (1 hora)
```
□ Presentar el plan de contenido trimestral
□ Mostrar el dashboard y explicar cada sección
□ Explicar la lista de producción humana del primer mes
□ Mostrar los primeros assets generados (imágenes/videos IA)
□ Explicar exactamente qué debe hacer el cliente cada semana
□ Resolver dudas
□ Confirmar fecha de primer reporte de resultados (30 días)
□ Enviar email de bienvenida con accesos y resumen de lo explicado
```

---

# 5. LLAMADA DE ONBOARDING

## Objetivo de la llamada
Obtener toda la información que el agente necesita para operar de forma autónoma. El cliente solo hace este proceso una vez — si falta información, el agente preguntará constantemente. Hacerlo bien desde el inicio es crítico.

## Duración: 60-90 minutos

## Guión para el ejecutivo

### APERTURA (5 min)
*"Hola [nombre], gracias por estar aquí. Esta llamada es el corazón del servicio — toda la información que nos des hoy se convierte en la memoria de tu agente de marketing. Va a trabajar con esto cada día. Entonces no hay respuestas malas ni demasiado detalle. ¿Empezamos?"*

---

### BLOQUE 1 — LA MARCA (15 min)

*"Cuéntame sobre tu empresa como si me la estuvieras explicando a alguien que nunca ha escuchado de ella."*
→ Dejar que hable libremente, tomar nota del lenguaje que usa

*"¿Cuánto tiempo llevan operando?"*

*"¿En qué ciudades o países están?"*

*"Si tuvieras que describir tu marca en solo 3 palabras, ¿cuáles serían?"*

*"¿Por qué existe tu empresa? No me digas qué venden — dime por qué importa que existan."*
→ Aquí sale la misión real

*"¿Por qué un cliente te elige a ti y no a la competencia?"*
→ Aquí sale el diferencial real

*"Cuando se comunican con clientes, ¿cómo hablan? ¿Formal o más cercanos? ¿Serios o pueden hacer bromas?"*

*"¿Hay frases o palabras que nunca usan? ¿Algo que les parezca fuera de tono para su marca?"*

*"¿Tienen manual de marca, logo en buena calidad, paleta de colores?"*
→ Solicitar que los compartan después de la llamada

*"¿Tienen ejemplos de contenido de otras marcas que les guste? No tiene que ser de su industria — puede ser de cualquier marca que admiren visualmente o en comunicación."*

---

### BLOQUE 2 — PRODUCTOS Y SERVICIOS (10 min)

*"Cuéntame qué venden. Dame el nombre de cada producto o servicio, una descripción corta y el precio si se puede compartir."*

*"¿Cuál es el producto que más venden o el que más quieren impulsar este trimestre?"*

*"¿Cómo compra un cliente? ¿Online, en persona, por WhatsApp, por llamada?"*

*"Desde que alguien los conoce hasta que compra, ¿cuánto tiempo suele pasar?"*

---

### BLOQUE 3 — EL CLIENTE IDEAL (20 min)
*Este es el bloque más importante. Tomarse el tiempo necesario.*

*"Descríbeme a tu cliente ideal. No el promedio — el mejor cliente que tienen o que quisieran tener. Edad, a qué se dedica, dónde vive."*

*"¿Qué problema tiene ese cliente que ustedes resuelven? ¿Qué le duele antes de encontrarlos?"*

*"¿Cuáles son las metas o sueños de ese cliente? ¿A qué aspira?"*

*"¿Qué hace que ese cliente dude antes de comprar? ¿Qué objeciones pone?"*

*"¿Qué fue lo que finalmente lo convenció de comprar la última vez?"*

*"¿En qué redes sociales está ese cliente? ¿A qué hora del día crees que las revisa más?"*

*"¿Qué marcas admira ese cliente? ¿A quién sigue?"*

*"Descríbeme a tu mejor cliente actual — el que más compra, el que más recomienda."*

*"¿Qué dicen tus clientes que más valoran de ustedes? ¿Tienes testimonios o reseñas?"*

---

### BLOQUE 4 — COMPETENCIA (10 min)

*"¿Quiénes son sus principales competidores? Los que compiten directamente por el mismo cliente."*

*"¿En qué se diferencian de cada uno de ellos?"*

*"¿Qué hace bien la competencia? Seamos honestos."*

*"¿Qué hace mal la competencia que ustedes sí hacen bien?"*

---

### BLOQUE 5 — NÚMEROS Y OBJETIVOS (10 min)

*"¿Cuál es su meta de ventas mensual en dinero?"*

*"¿Cuántas ventas necesitan al mes para llegar a esa meta?"*

*"¿Cuál es su margen de ganancia aproximado por venta? No necesita ser exacto, un rango está bien."*

*"¿Cuánto tienen disponible para pauta publicitaria al mes?"*

*"¿Cuánto tienen para producción — fotos y videos?"*

*"¿Cuál es el objetivo principal que quieren lograr con el marketing este trimestre? ¿Más ventas directas, más reconocimiento de marca, crecer seguidores, lanzar algo nuevo?"*

---

### BLOQUE 6 — CANALES (10 min)

*"¿En qué canales quieren estar? Les voy a leer la lista y me dicen cuáles sí."*

Leer la lista completa:
- Instagram, TikTok, Facebook, YouTube, Pinterest
- LinkedIn, Twitter/X, Threads
- WhatsApp Status, WhatsApp Broadcast, Telegram
- Blog, Podcast
- Email Marketing, SMS
- Google Business Profile

*"De los que seleccionaron, ¿cuáles son los 3 más importantes para ustedes?"*

*"¿Hay alguno que quieran lanzar desde cero?"*

*"¿Tienen acceso a sus cuentas de redes para conectarlas al sistema?"*

---

### BLOQUE 7 — PRODUCCIÓN (10 min)

*"¿Tienen cámara profesional o usan el celular para fotos y videos?"*

*"¿Hay personas en el equipo dispuestas a aparecer en cámara?"*

*"¿Con qué frecuencia podrían hacer una sesión de fotos o videos? ¿Una vez a la semana, cada dos semanas, una vez al mes?"*

*"¿Tienen un espacio físico fotogénico — oficina bonita, local, estudio?"*

*"¿Prefieren contenido más educativo, entretenido, inspiracional o comercial?"*

*"¿Quieren que el dueño o el equipo aparezca en el contenido, o prefieren que sea más corporativo sin personas?"*

---

### CIERRE (5 min)

*"¿Hay algo más que quieran que el agente sepa sobre su marca? Algo que no deba decir jamás, alguna campaña próxima, algo que hayan intentado y no funcionó."*

*"¿Qué esperan que cambie en su negocio en los próximos 3 meses con este servicio?"*

*"Perfecto. Esto es todo lo que necesitamos. En los próximos 2 días les vamos a enviar el acceso a su dashboard donde van a poder ver el plan de contenido completo para los próximos 3 meses, los primeros diseños y exactamente qué fotos y videos necesitamos que graben. ¿Tienen alguna pregunta sobre el proceso?"*

---

### DESPUÉS DE LA LLAMADA (Ejecutivo — 30 min)
1. Completar cualquier campo faltante en la plantilla de captura
2. Pasar el resumen al campo "Brief Inicial" en Airtable
3. Enviar email al cliente agradeciéndole y recordándole enviar: logo, colores, tipografías, ejemplos de contenido
4. El sistema se dispara automáticamente

---

# 6. CONFIGURACIÓN PASO A PASO DE CADA HERRAMIENTA

## 6.1 AIRTABLE — Crear base del cliente

**Tiempo estimado: 20 minutos**

### Paso 1: Duplicar la base template
1. Ir a Airtable → Bases → "TEMPLATE — Cliente MentorIA"
2. Clic en los tres puntos → "Duplicate base"
3. Renombrar: "[NombreCliente] — MentorIA"
4. Mover a la carpeta "Clientes Activos"

### Paso 2: Configurar las tablas
La base tiene 9 tablas pre-configuradas. Solo debes ajustar:

**Tabla: Brief de Marca**
- Campo "Nombre Cliente": escribir el nombre
- Campo "Fecha Inicio": fecha de hoy
- Campo "Ejecutivo Asignado": seleccionar del dropdown
- Campo "Estado": cambiar a "Onboarding en proceso"
- Pegar el resumen de la llamada en el campo "Brief Inicial"

**Tabla: Configuración de Canales**
- Marcar con ✅ los canales activos del cliente
- Para cada canal activo, completar: usuario, seguidores actuales, objetivo principal

**Tabla: ROI y Objetivos**
- Campo "Meta de ventas mensual": escribir el número
- Campo "Ticket promedio": escribir el número
- Campo "Margen de ganancia %": escribir el porcentaje
- Campo "Presupuesto pauta mensual": escribir el número
- Campo "Objetivo principal": seleccionar del dropdown

### Paso 3: Obtener el ID de la base
1. Abrir la base → copiar la URL
2. El ID es la parte que empieza con "app..." → guardarlo para configurar n8n

---

## 6.2 BUBBLE — Configurar dashboard del cliente

**Tiempo estimado: 30 minutos**

### Paso 1: Duplicar la app template
1. Ir a Bubble → Apps → "TEMPLATE — Dashboard MentorIA"
2. Clic en "Copy app"
3. Nombre: "[NombreCliente] Dashboard"
4. Marcar "Copy with data: No"

### Paso 2: Conectar Airtable
1. Ir a Plugins → Airtable Plugin → Settings
2. Pegar el API Token de Airtable de MentorIA
3. Pegar el ID de la base del cliente (obtenido en 6.1 Paso 3)
4. Clic en "Test connection" → debe aparecer ✅

### Paso 3: Configurar los datos del cliente
1. Ir a Data → App data → Tabla "Configuración"
2. Cambiar los campos:
   - nombre_cliente: [NombreCliente]
   - logo_url: pegar link del logo en Google Drive
   - color_primario: #[HEX del cliente]
   - color_secundario: #[HEX del cliente]

### Paso 4: Configurar los roles de acceso
La app tiene 3 roles pre-configurados. Para el cliente:
1. Ir a Settings → Roles
2. Crear usuario: email del cliente → rol "Cliente"
3. Para el director creativo y diseñador de MentorIA ya existen sus cuentas — solo asignar este cliente a su cartera

### Paso 5: Publicar y probar
1. Clic en "Deploy to live" → "Deploy current version"
2. Copiar el link del dashboard
3. Probar entrando con el email del cliente
4. Verificar que solo ve su información

---

## 6.3 N8N — Configurar workflow del cliente

**Tiempo estimado: 30 minutos**

### Paso 1: Duplicar el workflow template
1. Ir a n8n → Workflows → "TEMPLATE — Agente Marketing"
2. Clic en los tres puntos → "Duplicate"
3. Renombrar: "Agente Marketing — [NombreCliente]"

### Paso 2: Configurar las variables del cliente
El workflow tiene una sección de variables al inicio. Cambiar:
```
NOMBRE_CLIENTE = "[Nombre del cliente]"
AIRTABLE_BASE_ID = "[ID de la base creada en 6.1]"
DRIVE_FOLDER_ID = "[ID de la carpeta de Drive del cliente]"
CANVA_BRAND_KIT_ID = "[ID del brand kit creado en 6.4]"
CLIENTE_INDUSTRIA = "[Industria del cliente]"
CANALES_ACTIVOS = "[Lista separada por comas]"
```

### Paso 3: Verificar credenciales
Todas las credenciales de APIs (Anthropic, OpenAI, Luma, etc.) son de MentorIA y ya están configuradas globalmente. Solo verificar que están activas:
1. Settings → Credentials
2. Verificar que todas muestran ✅ activo
3. Si alguna muestra error → contactar al responsable técnico de MentorIA

### Paso 4: Configurar el trigger de Airtable
1. Abrir el nodo "Detectar nuevo brief"
2. En "Base": seleccionar la base del cliente
3. En "Table": seleccionar "Brief de Marca"
4. Clic en "Test step" → debe aparecer el brief del cliente

### Paso 5: Activar el workflow
1. Toggle en la esquina superior derecha → "Active"
2. Verificar que el estado cambia a "Active" en verde
3. Ir a Airtable → cambiar el campo "Estado" del cliente a "Procesando"
4. El agente debe dispararse automáticamente en los próximos 2 minutos

---

## 6.4 CANVA TEAMS — Crear brand kit del cliente

**Tiempo estimado: 15 minutos**

### Paso 1: Crear el brand kit
1. Ir a Canva Teams → Brand Hub → "+ New brand kit"
2. Nombre: "[NombreCliente] — Brand Kit"

### Paso 2: Subir activos de la marca
1. **Logo**: subir en PNG con fondo transparente
2. **Colores**: añadir cada HEX del cliente
   - Clic en "+ Add color" → pegar HEX
   - Etiquetar cada color: "Primario", "Secundario", "Acento", "Neutro"
3. **Tipografías**: si el cliente tiene fuentes específicas:
   - Subir los archivos .ttf o .otf
   - Si no tiene, asignar tipografías de Canva que mejor correspondan

### Paso 3: Obtener el ID del brand kit
1. Abrir el brand kit → copiar la URL
2. El ID está en la URL → guardarlo para el paso 6.3

### Paso 4: Verificar acceso del agente
El agente accede al brand kit vía Canva API con el token de MentorIA. Verificar que el brand kit recién creado aparece en: Settings → Connected apps → n8n → Canva

---

## 6.5 GOOGLE DRIVE — Preparar estructura de carpetas

**Tiempo estimado: 5 minutos**

La estructura se crea en la pre-llamada. Solo verificar que existe:
```
📁 Clientes/
  └── 📁 [NombreCliente]/
        ├── 📁 Brief/
        ├── 📁 Assets IA/         ← el agente sube aquí automáticamente
        ├── 📁 Producción Cliente/ ← el cliente sube sus fotos/videos aquí
        ├── 📁 Entregables Finales/← el diseñador sube los editados aquí
        └── 📁 Reportes/           ← el agente sube reportes aquí
```

1. Abrir la carpeta del cliente
2. Click derecho en "Producción Cliente" → Compartir → pegar email del cliente → rol "Editor"
3. El cliente podrá subir archivos directamente desde esta carpeta
4. Copiar el ID de cada subcarpeta (está en la URL) y guardarlo en la tabla de configuración en Airtable

---

# 7. MANUAL DEL CLIENTE

*Este es el documento que se envía al cliente después de la llamada de entrega. Está escrito en lenguaje simple, sin tecnicismos.*

---

## ¡Bienvenido a tu Agente de Marketing IA!

Hola [Nombre],

Tu agente de marketing ya está trabajando. Este documento te explica exactamente qué tienes, qué va a hacer por ti y qué necesitamos de tu parte para que los resultados sean increíbles.

---

### LO QUE TIENES

**Tu dashboard personal**
Accede en: [link personalizado]
Usuario: tu email
Contraseña: [temporal — cámbiala en tu primer ingreso]

Desde tu dashboard puedes:
- Ver tu plan de contenido de los próximos 3 meses
- Ver exactamente qué fotos y videos necesitas grabar cada semana
- Descargar todos los diseños, videos e imágenes listos para publicar
- Ver tus reportes de resultados mes a mes
- Chatear con tu ejecutivo de MentorIA si tienes dudas

---

### LO QUE TU AGENTE HACE POR TI

Cada semana, sin que tengas que pedir nada:
- Genera el contenido de la semana siguiente (textos, imágenes y videos)
- Te dice exactamente qué fotos o videos reales necesitas grabar
- Prepara los diseños para tus pautas publicitarias
- Monitorea el desempeño de tu contenido

Cada mes:
- Te entrega un reporte completo de resultados
- Te muestra si vas en camino a tu meta de ventas
- Ajusta el plan del siguiente mes según lo que funcionó

---

### LO QUE NECESITAMOS DE TI

Tu agente genera el 80% del contenido solo. Pero el 20% restante es lo que hace que tu contenido sea auténtico y conecte con tus clientes: las fotos y videos reales de tu marca.

**Cada semana (máximo 2 horas de tu tiempo):**

1. **El lunes**: revisa tu dashboard. Ahí encuentras la lista de lo que necesitas grabar esa semana. Cada item tiene instrucciones precisas: qué grabar, cómo encuadrar, qué luz usar.

2. **El martes**: graba o toma las fotos que indica la lista. No necesitas equipo profesional — un smartphone moderno con buena luz es suficiente.

3. **El miércoles antes de las 12pm**: sube tu material a tu carpeta de Drive. El link está en tu dashboard.

Eso es todo. A partir de ahí, MentorIA hace el resto.

---

### EJEMPLOS DE LO QUE TE PEDIREMOS GRABAR

Para que sepas qué esperar, aquí algunos ejemplos de lo que suele pedir el agente:

- *"Foto del equipo en reunión, ambiente natural, sin posar"*
- *"Video de 15 segundos mostrando el proceso de [tu servicio]"*
- *"Foto de tu producto sobre fondo blanco o de madera"*
- *"Video tuyo saludando a la cámara para un reel de presentación"*
- *"Foto del espacio de trabajo con buena iluminación natural"*

Cada item tiene instrucciones de encuadre, luz y mood para que salga bien.

---

### TUS PRIMEROS 30 DÍAS

| Día | Qué pasa |
|---|---|
| Hoy | Recibes acceso a tu dashboard y ves tu plan trimestral |
| Esta semana | Recibes la primera lista de producción humana |
| Semana 2 | Subes tus primeras fotos/videos — los primeros contenidos quedan listos |
| Día 30 | Llamada de resultados con tu ejecutivo (30 min) |

---

### TU EJECUTIVO DE CUENTA

Tu punto de contacto en MentorIA es [Nombre del Ejecutivo].

- Para dudas sobre el dashboard o el servicio: escríbele por el chat del dashboard
- Para cambios estratégicos o ajustes al plan: coordinar una llamada
- Horario de atención: lunes a viernes, 9am - 6pm

---

### PARA SACAR EL MÁXIMO PROVECHO

✅ **Sube tu material a tiempo** — entre más rápido lo subas, más rápido tienes tu contenido listo

✅ **Da feedback** — si un contenido no te gusta, dilo. El agente aprende y mejora cada mes

✅ **Comparte tus datos de ventas** — el módulo de ROI necesita que nos digas cuánto vendiste ese mes para calcular el retorno real de tu inversión

✅ **Conéctanos tus redes** — el agente necesita acceso a tus métricas para hacer reportes reales. Tu ejecutivo te guía en esto si no lo tienes configurado aún

---

# 8. OPERACIÓN MENSUAL

## Flujo semanal de operación (se repite cada semana)

| Día | Acción | Responsable | Tiempo máximo |
|---|---|---|---|
| **Lunes** | Agente genera contenido de la semana siguiente (copies, imágenes, videos IA) | Agente IA | Automático |
| **Lunes** | Agente envía instrucciones al cliente de qué grabar esa semana | Agente IA | Automático |
| **Martes** | Cliente graba y sube sus fotos/videos al dashboard | Cliente | Antes de las 12pm |
| **Martes-Miércoles** | Diseñador edita videos y ajusta piezas finales con el material del cliente | Diseñador | 48 horas |
| **Miércoles** | Director Creativo revisa entregables finales → Aprueba ✅ o solicita corrección 🔄 | Director Creativo | 24 horas |
| **Miércoles** | Si hay corrección: Diseñador ajusta → DC aprueba | Diseñador + DC | 12 horas |
| **Jueves** | Asesor notifica al cliente: "Tu contenido está listo para aprobar" | Asesor | Inmediato |
| **Jueves-Viernes** | Cliente revisa y aprueba ✅ o solicita cambio 🔄 | Cliente | 48 horas |
| **Viernes-Fin de semana** | Agente programa publicaciones automáticas en horario óptimo por red social | Agente IA | Automático |
| **Fin de semana** | Cliente publica manualmente: Twitter/X, WhatsApp Status, Threads, stories interactivas | Cliente | Con sus tiempos |

## Calendario fijo mensual

| Día del mes | Acción | Responsable |
|---|---|---|
| 1 | Agente genera reporte del mes anterior y ajusta el plan | Agente IA |
| 2 | Director Creativo aprueba el plan del nuevo mes | Director Creativo |
| 3 | Cliente recibe notificación con el plan aprobado del mes | Sistema automático |
| 10 | Llamada mensual de resultados (30 min) | Asesor + Cliente |
| 28 | Agente empieza a planificar el mes siguiente | Agente IA |

---

## Llamada mensual de resultados (guión para el ejecutivo)

**Duración: 30 minutos**

1. **Revisión de KPIs** (10 min)
   - Abrir el reporte en el dashboard del cliente
   - Revisar meta vs. real de ventas
   - Revisar ROI del mes
   - Revisar métricas por canal

2. **Qué funcionó** (5 min)
   - Mostrar los 3 mejores contenidos del mes (más alcance, más engagement)
   - Preguntar al cliente: *"¿Cuál de estos resonó más con tus clientes reales?"*

3. **Qué ajustar** (10 min)
   - Mostrar las recomendaciones del agente para el siguiente mes
   - Preguntar: *"¿Hay algún lanzamiento, evento o campaña especial el próximo mes?"*
   - Confirmar presupuesto de pauta para el siguiente mes

4. **Producción del siguiente mes** (5 min)
   - Mostrar la lista de producción humana del mes siguiente
   - Confirmar disponibilidad del cliente para grabar
   - Resolver dudas

---

# 9. RESOLUCIÓN DE PROBLEMAS FRECUENTES

| Problema | Causa probable | Solución |
|---|---|---|
| El agente no se disparó después del onboarding | El campo "Brief Inicial" en Airtable está vacío o el workflow no está activo | Verificar que el brief está en Airtable y que el workflow en n8n está en "Active" |
| El cliente no ve sus datos en el dashboard | La conexión Airtable-Bubble no está configurada correctamente | Ir a Bubble → Plugins → Airtable → reconfigurar con el ID correcto de la base |
| Las imágenes de DALL-E no aparecen | El crédito de OpenAI está agotado o la API key expiró | Verificar en platform.openai.com → Usage |
| El reporte no tiene métricas reales | La conexión con Meta o Google no está activa | Reconectar la autorización del cliente (el link expira cada 60 días) |
| El cliente dice que el contenido no suena a su marca | El brief inicial fue muy escueto | Agendar 30 min de "Brief de ajuste" para enriquecer el perfil del agente |
| El diseñador no recibe notificación de nueva tarea | El workflow de notificaciones no está activo | Verificar n8n → workflow "Notificaciones Equipo" → estado Active |
| El cliente no sube su material a tiempo | No recuerda o no entiende el proceso | El ejecutivo llama directamente; si es recurrente, simplificar las instrucciones de producción |

---

*Manual versión 1.0 — MentorIA Systems*
*Actualizar con cada mejora del sistema*
