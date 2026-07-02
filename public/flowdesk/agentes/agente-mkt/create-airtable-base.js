const AIRTABLE_TOKEN = process.env.AIRTABLE_API_KEY || 'YOUR_AIRTABLE_API_KEY';
const WORKSPACE_ID = process.argv[2]; // pasar como argumento: node create-airtable-base.js wspXXXXXX

if (!WORKSPACE_ID) {
  console.error('Uso: node create-airtable-base.js wspXXXXXXXXXX');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
  'Content-Type': 'application/json'
};

const base = {
  name: 'MentorIA Systems — Agente de Marketing',
  workspaceId: WORKSPACE_ID,
  tables: [

    // ─────────────────────────────────────────
    // 1. CLIENTES
    // ─────────────────────────────────────────
    {
      name: 'Clientes',
      description: 'Un registro por cliente activo',
      fields: [
        { name: 'Nombre', type: 'singleLineText' },
        { name: 'Industria', type: 'singleLineText' },
        {
          name: 'Estado', type: 'singleSelect',
          options: { choices: [
            { name: 'Onboarding' },
            { name: 'Activo' },
            { name: 'Pausado' },
            { name: 'Inactivo' }
          ]}
        },
        {
          name: 'Redes Activas', type: 'multipleSelects',
          options: { choices: [
            { name: 'Instagram' }, { name: 'Facebook' }, { name: 'LinkedIn' },
            { name: 'TikTok' }, { name: 'YouTube' }, { name: 'Pinterest' },
            { name: 'Blog' }, { name: 'Email Marketing' },
            { name: 'Twitter/X' }, { name: 'WhatsApp Status' },
            { name: 'Threads' }
          ]}
        },
        { name: 'Meta Ventas Mensual', type: 'currency', options: { precision: 0, symbol: '$' } },
        { name: 'Presupuesto Pauta', type: 'currency', options: { precision: 0, symbol: '$' } },
        {
          name: 'Tono de Marca', type: 'singleSelect',
          options: { choices: [
            { name: 'Formal' }, { name: 'Cercano' },
            { name: 'Serio' }, { name: 'Con humor' }, { name: 'Inspiracional' }
          ]}
        },
        { name: 'WhatsApp Cliente', type: 'phoneNumber' },
        { name: 'Email Cliente', type: 'email' },
        { name: 'Asesor Asignado', type: 'singleLineText' },
        { name: 'Fecha Inicio', type: 'date', options: { dateFormat: { name: 'iso' } } },
        { name: 'Onboarding Completado', type: 'checkbox', options: { color: 'greenBright', icon: 'check' } },
        { name: 'Brief Enriquecido', type: 'multilineText' },
        { name: 'Cliente Ideal', type: 'multilineText' },
        { name: 'Competidores', type: 'multilineText' },
        { name: 'Paleta Colores', type: 'singleLineText' },
        { name: 'Notas Internas', type: 'multilineText' }
      ]
    },

    // ─────────────────────────────────────────
    // 2. PLAN DE CONTENIDO
    // ─────────────────────────────────────────
    {
      name: 'Plan de Contenido',
      description: 'Calendario trimestral — una fila por pieza de contenido',
      fields: [
        { name: 'Título', type: 'singleLineText' },
        {
          name: 'Red Social', type: 'singleSelect',
          options: { choices: [
            { name: 'Instagram' }, { name: 'Facebook' }, { name: 'LinkedIn' },
            { name: 'TikTok' }, { name: 'YouTube' }, { name: 'Pinterest' },
            { name: 'Blog' }, { name: 'Email Marketing' },
            { name: 'Twitter/X' }, { name: 'WhatsApp Status' }, { name: 'Threads' }
          ]}
        },
        {
          name: 'Tipo', type: 'singleSelect',
          options: { choices: [
            { name: 'Post' }, { name: 'Reel' }, { name: 'Story' },
            { name: 'Carrusel' }, { name: 'Video' }, { name: 'Email' }, { name: 'Blog' }
          ]}
        },
        { name: 'Fecha Publicación', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '12hour' }, timeZone: 'America/Mexico_City' } },
        {
          name: 'Estado', type: 'singleSelect',
          options: { choices: [
            { name: 'Por generar' },
            { name: 'Generado' },
            { name: 'En diseño' },
            { name: 'Revisión DC' },
            { name: 'Aprobado DC' },
            { name: 'Pendiente Cliente' },
            { name: 'Aprobado Cliente' },
            { name: 'Programado' },
            { name: 'Publicado' },
            { name: 'Rechazado' }
          ]}
        },
        { name: 'Concepto / Tema', type: 'singleLineText' },
        { name: 'Copy', type: 'multilineText' },
        { name: 'Hashtags', type: 'multilineText' },
        { name: 'Semana', type: 'number', options: { precision: 0 } },
        { name: 'Mes', type: 'number', options: { precision: 0 } },
        { name: 'Trimestre', type: 'number', options: { precision: 0 } },
        { name: 'URL Asset Final', type: 'url' },
        { name: 'Comentarios DC', type: 'multilineText' },
        { name: 'Comentarios Cliente', type: 'multilineText' },
        { name: 'Fecha Aprobación DC', type: 'date', options: { dateFormat: { name: 'iso' } } },
        { name: 'Fecha Aprobación Cliente', type: 'date', options: { dateFormat: { name: 'iso' } } },
        { name: 'Publicado Por', type: 'singleLineText' },
        { name: 'ID Publicación', type: 'singleLineText' }
      ]
    },

    // ─────────────────────────────────────────
    // 3. ASSETS
    // ─────────────────────────────────────────
    {
      name: 'Assets',
      description: 'Archivos multimedia — fotos, videos, gráficos generados',
      fields: [
        { name: 'Nombre', type: 'singleLineText' },
        {
          name: 'Tipo', type: 'singleSelect',
          options: { choices: [
            { name: 'Foto cliente' }, { name: 'Video cliente' },
            { name: 'Imagen IA (DALL-E)' }, { name: 'Video IA (Luma)' },
            { name: 'Video IA (Higgsfield)' }, { name: 'Gráfico (Canva)' },
            { name: 'Logo' }, { name: 'Audio' }
          ]}
        },
        { name: 'Archivo', type: 'multipleAttachments' },
        { name: 'URL Drive', type: 'url' },
        { name: 'URL Generada', type: 'url' },
        {
          name: 'Estado', type: 'singleSelect',
          options: { choices: [
            { name: 'Recibido' },
            { name: 'Procesado' },
            { name: 'Editado' },
            { name: 'Aprobado' },
            { name: 'Descartado' }
          ]}
        },
        { name: 'Semana', type: 'number', options: { precision: 0 } },
        { name: 'Fecha Upload', type: 'date', options: { dateFormat: { name: 'iso' } } },
        { name: 'Subido Por', type: 'singleLineText' },
        { name: 'Notas', type: 'multilineText' }
      ]
    },

    // ─────────────────────────────────────────
    // 4. LISTA DE PRODUCCIÓN SEMANAL
    // ─────────────────────────────────────────
    {
      name: 'Producción Semanal',
      description: 'Instrucciones semanales de grabación para el cliente',
      fields: [
        { name: 'Descripción', type: 'singleLineText' },
        {
          name: 'Tipo', type: 'singleSelect',
          options: { choices: [
            { name: 'Foto' }, { name: 'Video' }, { name: 'Audio' }, { name: 'Texto' }
          ]}
        },
        { name: 'Instrucciones', type: 'multilineText' },
        { name: 'Encuadre', type: 'singleLineText' },
        { name: 'Luz', type: 'singleLineText' },
        { name: 'Mood', type: 'singleLineText' },
        { name: 'Deadline', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '12hour' }, timeZone: 'America/Mexico_City' } },
        { name: 'Semana', type: 'number', options: { precision: 0 } },
        {
          name: 'Estado', type: 'singleSelect',
          options: { choices: [
            { name: 'Pendiente' },
            { name: 'Entregado' },
            { name: 'Vencido' }
          ]}
        },
        { name: 'Asset Entregado', type: 'url' }
      ]
    },

    // ─────────────────────────────────────────
    // 5. MÉTRICAS
    // ─────────────────────────────────────────
    {
      name: 'Métricas',
      description: 'Métricas mensuales por red social',
      fields: [
        { name: 'Período', type: 'singleLineText' },
        {
          name: 'Red Social', type: 'singleSelect',
          options: { choices: [
            { name: 'Instagram' }, { name: 'Facebook' }, { name: 'LinkedIn' },
            { name: 'TikTok' }, { name: 'YouTube' }, { name: 'Pinterest' },
            { name: 'Blog' }, { name: 'Email' }
          ]}
        },
        { name: 'Mes', type: 'date', options: { dateFormat: { name: 'iso' } } },
        { name: 'Seguidores Inicio', type: 'number', options: { precision: 0 } },
        { name: 'Seguidores Fin', type: 'number', options: { precision: 0 } },
        { name: 'Alcance Total', type: 'number', options: { precision: 0 } },
        { name: 'Impresiones', type: 'number', options: { precision: 0 } },
        { name: 'Engagement Rate', type: 'percent', options: { precision: 2 } },
        { name: 'Likes', type: 'number', options: { precision: 0 } },
        { name: 'Comentarios', type: 'number', options: { precision: 0 } },
        { name: 'Compartidos', type: 'number', options: { precision: 0 } },
        { name: 'Clics', type: 'number', options: { precision: 0 } },
        { name: 'Guardados', type: 'number', options: { precision: 0 } },
        { name: 'Mejor Contenido', type: 'singleLineText' },
        { name: 'Notas', type: 'multilineText' }
      ]
    },

    // ─────────────────────────────────────────
    // 6. CAMPAÑAS DE PAUTA
    // ─────────────────────────────────────────
    {
      name: 'Campañas de Pauta',
      description: 'Campañas de publicidad pagada',
      fields: [
        { name: 'Nombre Campaña', type: 'singleLineText' },
        {
          name: 'Red', type: 'singleSelect',
          options: { choices: [
            { name: 'Meta (Facebook/Instagram)' }, { name: 'TikTok Ads' },
            { name: 'Google Ads' }, { name: 'LinkedIn Ads' }, { name: 'Pinterest Ads' }
          ]}
        },
        {
          name: 'Objetivo', type: 'singleSelect',
          options: { choices: [
            { name: 'Alcance' }, { name: 'Tráfico' }, { name: 'Leads' },
            { name: 'Conversiones' }, { name: 'Reconocimiento' }
          ]}
        },
        { name: 'Presupuesto', type: 'currency', options: { precision: 2, symbol: '$' } },
        { name: 'Gasto Real', type: 'currency', options: { precision: 2, symbol: '$' } },
        { name: 'Alcance', type: 'number', options: { precision: 0 } },
        { name: 'Impresiones', type: 'number', options: { precision: 0 } },
        { name: 'Clics', type: 'number', options: { precision: 0 } },
        { name: 'CPC', type: 'currency', options: { precision: 3, symbol: '$' } },
        { name: 'Leads Generados', type: 'number', options: { precision: 0 } },
        { name: 'CPL', type: 'currency', options: { precision: 2, symbol: '$' } },
        { name: 'Conversiones', type: 'number', options: { precision: 0 } },
        { name: 'CPA', type: 'currency', options: { precision: 2, symbol: '$' } },
        { name: 'ROAS', type: 'number', options: { precision: 2 } },
        {
          name: 'Estado', type: 'singleSelect',
          options: { choices: [
            { name: 'Borrador' },
            { name: 'Activa' },
            { name: 'Pausada' },
            { name: 'Finalizada' }
          ]}
        },
        { name: 'Fecha Inicio', type: 'date', options: { dateFormat: { name: 'iso' } } },
        { name: 'Fecha Fin', type: 'date', options: { dateFormat: { name: 'iso' } } },
        { name: 'ID Campaña Meta', type: 'singleLineText' },
        { name: 'URL Creativo', type: 'url' },
        { name: 'Copy Anuncio', type: 'multilineText' }
      ]
    },

    // ─────────────────────────────────────────
    // 7. REPORTES MENSUALES
    // ─────────────────────────────────────────
    {
      name: 'Reportes',
      description: 'Reporte mensual de resultados y ROI',
      fields: [
        { name: 'Título', type: 'singleLineText' },
        { name: 'Mes', type: 'date', options: { dateFormat: { name: 'iso' } } },
        { name: 'Ventas Reportadas', type: 'currency', options: { precision: 2, symbol: '$' } },
        { name: 'Inversión SaaS', type: 'currency', options: { precision: 2, symbol: '$' } },
        { name: 'Inversión Pauta', type: 'currency', options: { precision: 2, symbol: '$' } },
        { name: 'ROI %', type: 'number', options: { precision: 1 } },
        { name: 'Seguidores Ganados Total', type: 'number', options: { precision: 0 } },
        { name: 'Mejor Red', type: 'singleLineText' },
        { name: 'Mejor Contenido', type: 'singleLineText' },
        { name: 'Resumen Ejecutivo', type: 'multilineText' },
        { name: 'Qué funcionó', type: 'multilineText' },
        { name: 'Qué ajustar', type: 'multilineText' },
        { name: 'Plan Mes Siguiente', type: 'multilineText' },
        { name: 'URL PDF Reporte', type: 'url' },
        {
          name: 'Estado', type: 'singleSelect',
          options: { choices: [
            { name: 'Borrador' },
            { name: 'Listo para llamada' },
            { name: 'Presentado' }
          ]}
        },
        { name: 'Fecha Llamada Resultados', type: 'date', options: { dateFormat: { name: 'iso' } } },
        { name: 'Notas Llamada', type: 'multilineText' }
      ]
    },

    // ─────────────────────────────────────────
    // 8. ONBOARDING
    // ─────────────────────────────────────────
    {
      name: 'Onboarding',
      description: 'Proceso de configuración inicial por cliente',
      fields: [
        { name: 'Cliente', type: 'singleLineText' },
        { name: 'Fecha Llamada', type: 'date', options: { dateFormat: { name: 'iso' } } },
        { name: 'URL Grabación', type: 'url' },
        { name: 'Brief Raw (transcripción)', type: 'multilineText' },
        { name: 'Brief Enriquecido IA', type: 'multilineText' },
        { name: 'Estrategia Generada', type: 'multilineText' },
        { name: 'Plan 3 Meses', type: 'multilineText' },
        {
          name: 'Estado', type: 'singleSelect',
          options: { choices: [
            { name: 'Pendiente llamada' },
            { name: 'Llamada realizada' },
            { name: 'IA procesando' },
            { name: 'En revisión DC' },
            { name: 'Aprobado DC' },
            { name: 'Dashboard listo' },
            { name: 'Completado' }
          ]}
        },
        { name: 'Estrategia Aprobada DC', type: 'checkbox', options: { color: 'greenBright', icon: 'check' } },
        { name: 'Dashboard Configurado', type: 'checkbox', options: { color: 'greenBright', icon: 'check' } },
        { name: 'Accesos Meta Recibidos', type: 'checkbox', options: { color: 'greenBright', icon: 'check' } },
        { name: 'Notas Asesor', type: 'multilineText' }
      ]
    },

    // ─────────────────────────────────────────
    // 9. EQUIPO
    // ─────────────────────────────────────────
    {
      name: 'Equipo',
      description: 'Miembros del equipo de MentorIA y sus roles',
      fields: [
        { name: 'Nombre', type: 'singleLineText' },
        {
          name: 'Rol', type: 'singleSelect',
          options: { choices: [
            { name: 'Director Creativo' },
            { name: 'Diseñador' },
            { name: 'Asesor de Servicio' },
            { name: 'Admin' }
          ]}
        },
        { name: 'WhatsApp', type: 'phoneNumber' },
        { name: 'Email', type: 'email' },
        { name: 'Activo', type: 'checkbox', options: { color: 'greenBright', icon: 'check' } },
        { name: 'Clientes Asignados', type: 'multilineText' }
      ]
    }

  ]
};

async function createBase() {
  console.log('Creando base en Airtable...\n');

  const response = await fetch('https://api.airtable.com/v0/meta/bases', {
    method: 'POST',
    headers,
    body: JSON.stringify(base)
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('Error al crear la base:', JSON.stringify(result, null, 2));
    process.exit(1);
  }

  console.log('✅ Base creada exitosamente!');
  console.log(`\nBase ID: ${result.id}`);
  console.log(`Nombre: ${result.name}`);
  console.log(`\nTablas creadas:`);
  result.tables.forEach(t => console.log(`  ✓ ${t.name} (${t.id})`));
  console.log(`\n🔗 https://airtable.com/${result.id}`);
  console.log(`\n⚠️  Guarda este Base ID para configurar n8n:`);
  console.log(`   AIRTABLE_BASE_ID=${result.id}`);
}

createBase();
