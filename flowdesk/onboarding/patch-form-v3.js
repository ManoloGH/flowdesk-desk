// patch-form-v3.js — Multiple form changes:
// 1. Step 2: Remove colors/typography → voice/tone/communication guide
// 2. Step 3: Add secondary client profiles
// 3. Step 4: Add GoHighLevel to CRM
// 4. Step 5: Full team contacts (DC, diseñador, trafiqueur, cliente, supervisor)

const fs   = require('fs');
const path = require('path');
const htmlPath = path.join(__dirname, 'onboarding-form.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// ─── 1. STEP 2: Replace colors + typography with brand voice ─────────────────
const OLD_STEP2_BODY = `    <div class="card-body">

      <div class="section-title">Paleta de Colores</div>

      <div class="field-group">
        <label>Selecciona tus colores de marca</label>
        <div class="color-row">
          <div class="color-item">
            <input type="color" id="color1" value="#1B4FD8">
            <span>Primario</span>
          </div>
          <div class="color-item">
            <input type="color" id="color2" value="#5BC8F5">
            <span>Secundario</span>
          </div>
          <div class="color-item">
            <input type="color" id="color3" value="#FFFFFF">
            <span>Fondo</span>
          </div>
          <div class="color-item">
            <input type="color" id="color4" value="#1A1A2E">
            <span>Oscuro</span>
          </div>
          <div class="color-item">
            <input type="color" id="color5" value="#F0F4FF">
            <span>Claro</span>
          </div>
        </div>
      </div>

      <div class="field-row">
        <div class="field-group">
          <label>Tipografía principal <span class="hint">Headline</span></label>
          <select id="tipoPrincipal">
            <option>Montserrat</option>
            <option>Poppins</option>
            <option>Inter</option>
            <option>Raleway</option>
            <option>Playfair Display</option>
            <option>DM Sans</option>
            <option>Nunito</option>
            <option>Otra</option>
          </select>
        </div>
        <div class="field-group">
          <label>Tipografía secundaria <span class="hint">Body / texto</span></label>
          <select id="tipoSecundaria">
            <option>Inter</option>
            <option>Lato</option>
            <option>Open Sans</option>
            <option>Roboto</option>
            <option>Source Sans Pro</option>
            <option>Mulish</option>
            <option>Otra</option>
          </select>
        </div>
      </div>

      <div class="section-title">Personalidad</div>

      <div class="field-group">
        <label>Tono de comunicación <span class="req">*</span><span class="hint">Selecciona los que aplican</span></label>
        <div class="pill-group">
          <input type="checkbox" id="t1" name="tono" value="Profesional"><label for="t1">Profesional</label>
          <input type="checkbox" id="t2" name="tono" value="Cercano"><label for="t2">Cercano</label>
          <input type="checkbox" id="t3" name="tono" value="Inspirador"><label for="t3">Inspirador</label>
          <input type="checkbox" id="t4" name="tono" value="Educativo"><label for="t4">Educativo</label>
          <input type="checkbox" id="t5" name="tono" value="Directo"><label for="t5">Directo</label>
          <input type="checkbox" id="t6" name="tono" value="Humorístico"><label for="t6">Humorístico</label>
          <input type="checkbox" id="t7" name="tono" value="Exclusivo"><label for="t7">Exclusivo</label>
          <input type="checkbox" id="t8" name="tono" value="Conversacional"><label for="t8">Conversacional</label>
        </div>
      </div>

      <div class="field-group">
        <label>¿Qué NUNCA debe decir o hacer tu marca?</label>
        <textarea id="prohibido" placeholder="Ej: No usar argot. No hablar de precios en redes. No compararnos con competidores por nombre." style="min-height:75px;"></textarea>
      </div>

      <div class="btn-row">
        <button class="btn btn-secondary" onclick="goTo(1)">← Atrás</button>
        <button class="btn btn-primary" onclick="goTo(3)">Siguiente → Contenido</button>
      </div>
    </div>
  </div>`;

const NEW_STEP2_BODY = `    <div class="card-body">

      <div class="section-title">🗣️ Tono de Voz</div>

      <div class="field-group">
        <label>Tono de comunicación <span class="req">*</span><span class="hint">Selecciona todos los que aplican</span></label>
        <div class="pill-group">
          <input type="checkbox" id="t1" name="tono" value="Profesional"><label for="t1">Profesional</label>
          <input type="checkbox" id="t2" name="tono" value="Cercano"><label for="t2">Cercano</label>
          <input type="checkbox" id="t3" name="tono" value="Inspirador"><label for="t3">Inspirador</label>
          <input type="checkbox" id="t4" name="tono" value="Educativo"><label for="t4">Educativo</label>
          <input type="checkbox" id="t5" name="tono" value="Directo"><label for="t5">Directo</label>
          <input type="checkbox" id="t6" name="tono" value="Humorístico"><label for="t6">Humorístico</label>
          <input type="checkbox" id="t7" name="tono" value="Exclusivo"><label for="t7">Exclusivo</label>
          <input type="checkbox" id="t8" name="tono" value="Conversacional"><label for="t8">Conversacional</label>
          <input type="checkbox" id="t9" name="tono" value="Empático"><label for="t9">Empático</label>
          <input type="checkbox" id="t10" name="tono" value="Audaz"><label for="t10">Audaz</label>
        </div>
      </div>

      <div class="field-group">
        <label>Personalidad de marca <span class="hint">¿Cómo describirías a tu marca si fuera una persona?</span></label>
        <div class="pill-group">
          <input type="checkbox" id="per1" name="personalidad" value="Innovadora"><label for="per1">🚀 Innovadora</label>
          <input type="checkbox" id="per2" name="personalidad" value="Confiable"><label for="per2">🤝 Confiable</label>
          <input type="checkbox" id="per3" name="personalidad" value="Disruptiva"><label for="per3">⚡ Disruptiva</label>
          <input type="checkbox" id="per4" name="personalidad" value="Premium"><label for="per4">💎 Premium</label>
          <input type="checkbox" id="per5" name="personalidad" value="Accesible"><label for="per5">🌱 Accesible</label>
          <input type="checkbox" id="per6" name="personalidad" value="Experta"><label for="per6">🎓 Experta</label>
          <input type="checkbox" id="per7" name="personalidad" value="Humana"><label for="per7">❤️ Humana</label>
          <input type="checkbox" id="per8" name="personalidad" value="Elegante"><label for="per8">✨ Elegante</label>
          <input type="checkbox" id="per9" name="personalidad" value="Transparente"><label for="per9">🔍 Transparente</label>
          <input type="checkbox" id="per10" name="personalidad" value="Retadora"><label for="per10">🏆 Retadora</label>
        </div>
      </div>

      <div class="section-title">💬 Guía de Comunicación</div>

      <div class="field-group">
        <label>¿Qué SÍ debe decir o transmitir tu marca? <span class="req">*</span></label>
        <textarea id="queDecir" placeholder="Ej: Empoderamos a las empresas con tecnología real. Somos el aliado estratégico que te da tranquilidad. Hablamos con datos, no con promesas vacías." style="min-height:85px;"></textarea>
      </div>

      <div class="field-group">
        <label>¿Qué NUNCA debe decir o hacer tu marca? <span class="req">*</span></label>
        <textarea id="prohibido" placeholder="Ej: No usar jerga técnica sin explicar. No hablar de precios en redes. No compararnos con competidores por nombre. No sonar desesperados por vender." style="min-height:75px;"></textarea>
      </div>

      <div class="field-group">
        <label>¿Cómo tutea o trata a su audiencia? <span class="hint">Cómo se dirige a las personas</span></label>
        <div class="pill-group">
          <input type="radio" id="trat1" name="tratamiento" value="Tuteo (tú)"><label for="trat1">Tuteo (tú)</label>
          <input type="radio" id="trat2" name="tratamiento" value="Ustedeo (usted)"><label for="trat2">Ustedeo (usted)</label>
          <input type="radio" id="trat3" name="tratamiento" value="Plural (ustedes)"><label for="trat3">Plural (ustedes)</label>
          <input type="radio" id="trat4" name="tratamiento" value="Varía según la red"><label for="trat4">Varía según la red</label>
        </div>
      </div>

      <div class="field-group">
        <label>Palabras o frases clave de tu marca <span class="hint">Las que deberían aparecer seguido en el contenido</span></label>
        <textarea id="frasesKey" placeholder="Ej: 'automatización inteligente', 'ROI comprobado', 'sin fricción', 'resultados reales'..." style="min-height:65px;"></textarea>
      </div>

      <div class="field-group">
        <label>Ejemplo de comunicación que te encanta <span class="hint">Una frase, post o anuncio tuyo o de otra marca que capture el tono ideal</span></label>
        <textarea id="ejemploComunicacion" placeholder="Ej: 'No vendemos software, vendemos tiempo libre para tu equipo.' O: @hubspot porque explican sin vender, y cuando vendes ya confías en ellos." style="min-height:75px;"></textarea>
      </div>

      <div class="btn-row">
        <button class="btn btn-secondary" onclick="goTo(1)">← Atrás</button>
        <button class="btn btn-primary" onclick="goTo(3)">Siguiente → Contenido</button>
      </div>
    </div>
  </div>`;

if (html.includes('Paleta de Colores')) {
  html = html.replace(OLD_STEP2_BODY, NEW_STEP2_BODY);
  // Update card header subtitle too
  html = html.replace(
    '<p>Colores, tipografía y personalidad</p>',
    '<p>Tono de voz, personalidad y guía de comunicación</p>'
  );
  console.log('✅ Step 2 updated: voice + tone + communication guide');
} else {
  console.log('⚠️  Step 2 already patched or not found');
}

// ─── 2. STEP 3: Add secondary client profiles after clienteIdeal ─────────────
const OLD_CLIENT_BLOCK = `      <div class="field-group">
        <label>Cliente ideal <span class="req">*</span><span class="hint">Sé específico/a</span></label>
        <textarea id="clienteIdeal" placeholder="Ej: CEO o Director de operaciones de empresa mediana (50-200 empleados) en México. Entre 35-55 años. Siente que su empresa gasta demasiado en procesos manuales y está abierto a tecnología si le muestran el ROI claro." style="min-height:90px;"></textarea>
      </div>

      <div class="section-title">Pilares de Contenido</div>`;

const NEW_CLIENT_BLOCK = `      <div class="field-group">
        <label>Cliente primario <span class="req">*</span><span class="hint">Tu buyer persona principal — sé muy específico/a</span></label>
        <textarea id="clienteIdeal" placeholder="Ej: CEO o Director de operaciones de empresa mediana (50-200 empleados) en México. Entre 35-55 años. Siente que su empresa gasta demasiado en procesos manuales y está abierto a tecnología si le muestran el ROI claro." style="min-height:90px;"></textarea>
      </div>

      <div class="field-group">
        <label>Cliente secundario A <span class="hint">Opcional — segundo perfil al que también llegas</span></label>
        <textarea id="clienteSecundarioA" placeholder="Ej: Gerente de TI o CTO en empresa grande (200+ empleados) que busca integrar IA sin romper la operación existente. 30-45 años. Evalúa herramientas por seguridad y escalabilidad." style="min-height:80px;"></textarea>
      </div>

      <div class="field-group">
        <label>Cliente secundario B <span class="hint">Opcional — tercer perfil o nicho emergente</span></label>
        <textarea id="clienteSecundarioB" placeholder="Ej: Emprendedor con empresa en crecimiento (5-20 empleados) que lleva 2+ años y quiere profesionalizar su marketing sin contratar un equipo grande." style="min-height:80px;"></textarea>
      </div>

      <div class="section-title">Pilares de Contenido</div>`;

if (html.includes('Cliente ideal')) {
  html = html.replace(OLD_CLIENT_BLOCK, NEW_CLIENT_BLOCK);
  console.log('✅ Step 3 updated: primary + 2 secondary client profiles');
} else {
  console.log('⚠️  Step 3 client block not found');
}

// ─── 3. STEP 4: Add GoHighLevel to CRM options ───────────────────────────────
html = html.replace(
  `          <option>Monday Sales</option>`,
  `          <option>Monday Sales</option>
          <option>GoHighLevel</option>`
);
console.log('✅ CRM: GoHighLevel added');

// ─── 4. STEP 5: Replace single contact with full team contacts ────────────────
const OLD_STEP5_CONTACTS = `      <div class="section-title">Contacto Principal</div>

      <div class="field-row">
        <div class="field-group">
          <label>Nombre completo <span class="req">*</span></label>
          <input type="text" id="contactoNombre" placeholder="Ej: Carlos Mendoza">
        </div>
        <div class="field-group">
          <label>Cargo <span class="req">*</span></label>
          <input type="text" id="contactoCargo" placeholder="Ej: Director de Marketing">
        </div>
      </div>

      <div class="field-row">
        <div class="field-group">
          <label>Email <span class="req">*</span></label>
          <input type="email" id="contactoEmail" placeholder="carlos@tuempresa.com">
        </div>
        <div class="field-group">
          <label>WhatsApp <span class="req">*</span><span class="hint">Con código de país</span></label>
          <input type="tel" id="contactoWA" placeholder="+52 55 1234 5678">
        </div>
      </div>`;

const NEW_STEP5_CONTACTS = `      <div style="background:#FFF9F0;border:1px solid #FDE68A;border-radius:12px;padding:16px;margin-bottom:24px;font-size:13px;color:#92400E;line-height:1.6;">
        <strong>🔄 Flujo de aprobación:</strong> el <strong>DC</strong> revisa y aprueba el contenido → el <strong>Cliente</strong> autoriza el calendario y cada publicación → el <strong>Trafiqueur</strong> ejecuta las pautas → el <strong>Supervisor</strong> monitorea todo el equipo.
      </div>

      <div class="section-title">👤 Contacto Principal (quien llena este formulario)</div>

      <div class="field-row">
        <div class="field-group">
          <label>Nombre completo <span class="req">*</span></label>
          <input type="text" id="contactoNombre" placeholder="Ej: Carlos Mendoza">
        </div>
        <div class="field-group">
          <label>Cargo <span class="req">*</span></label>
          <input type="text" id="contactoCargo" placeholder="Ej: Director de Marketing">
        </div>
      </div>
      <div class="field-row">
        <div class="field-group">
          <label>Email <span class="req">*</span></label>
          <input type="email" id="contactoEmail" placeholder="carlos@tuempresa.com">
        </div>
        <div class="field-group">
          <label>WhatsApp <span class="req">*</span><span class="hint">Con código de país</span></label>
          <input type="tel" id="contactoWA" placeholder="+52 55 1234 5678">
        </div>
      </div>

      <div class="section-title">🎯 Director de Contenido (DC)</div>
      <div style="font-size:12px;color:#6B7280;margin-bottom:12px;">Aprueba el calendario y las piezas antes de que lleguen al cliente.</div>
      <div class="field-row">
        <div class="field-group">
          <label>Nombre</label>
          <input type="text" id="dcNombre" placeholder="Nombre del DC">
        </div>
        <div class="field-group">
          <label>WhatsApp</label>
          <input type="tel" id="dcWA" placeholder="+52 55 1234 5678">
        </div>
      </div>
      <div class="field-group">
        <label>Email</label>
        <input type="email" id="dcEmail" placeholder="dc@tuempresa.com">
      </div>

      <div class="section-title">🎨 Diseñador</div>
      <div style="font-size:12px;color:#6B7280;margin-bottom:12px;">Recibe los briefs de diseño para producir las piezas aprobadas.</div>
      <div class="field-row">
        <div class="field-group">
          <label>Nombre</label>
          <input type="text" id="disenadorNombre" placeholder="Nombre del diseñador">
        </div>
        <div class="field-group">
          <label>WhatsApp</label>
          <input type="tel" id="disenadorWA" placeholder="+52 55 1234 5678">
        </div>
      </div>
      <div class="field-group">
        <label>Email</label>
        <input type="email" id="disenadorEmail" placeholder="diseno@tuempresa.com">
      </div>

      <div class="section-title">📢 Trafiqueur</div>
      <div style="font-size:12px;color:#6B7280;margin-bottom:12px;">Gestiona y ejecuta las campañas de pauta pagada.</div>
      <div class="field-row">
        <div class="field-group">
          <label>Nombre</label>
          <input type="text" id="trafiqueurNombre" placeholder="Nombre del trafiqueur">
        </div>
        <div class="field-group">
          <label>WhatsApp</label>
          <input type="tel" id="trafiqueurWA" placeholder="+52 55 1234 5678">
        </div>
      </div>
      <div class="field-group">
        <label>Email</label>
        <input type="email" id="trafiqueurEmail" placeholder="trafico@tuempresa.com">
      </div>

      <div class="section-title">👔 Cliente (marca)</div>
      <div style="font-size:12px;color:#6B7280;margin-bottom:12px;">Autoriza el calendario mensual y da visto bueno final a cada publicación después del DC.</div>
      <div class="field-row">
        <div class="field-group">
          <label>Nombre</label>
          <input type="text" id="clienteNombre" placeholder="Nombre del contacto en la marca">
        </div>
        <div class="field-group">
          <label>WhatsApp</label>
          <input type="tel" id="clienteNombreWA" placeholder="+52 55 1234 5678">
        </div>
      </div>
      <div class="field-group">
        <label>Email</label>
        <input type="email" id="clienteNombreEmail" placeholder="cliente@sumarca.com">
      </div>

      <div class="section-title">🔍 Supervisor</div>
      <div style="font-size:12px;color:#6B7280;margin-bottom:12px;">Monitorea el funcionamiento del equipo completo, revisa estatus, tareas e interacciones.</div>
      <div class="field-row">
        <div class="field-group">
          <label>Nombre</label>
          <input type="text" id="supervisorNombre" placeholder="Nombre del supervisor">
        </div>
        <div class="field-group">
          <label>WhatsApp</label>
          <input type="tel" id="supervisorWA" placeholder="+52 55 1234 5678">
        </div>
      </div>
      <div class="field-group">
        <label>Email</label>
        <input type="email" id="supervisorEmail" placeholder="supervisor@mentoria.com">
      </div>`;

if (html.includes('Contacto Principal')) {
  html = html.replace(OLD_STEP5_CONTACTS, NEW_STEP5_CONTACTS);
  console.log('✅ Step 5 updated: full team contacts (DC, diseñador, trafiqueur, cliente, supervisor)');
} else {
  console.log('⚠️  Step 5 contacts not found');
}

// ─── 5. Update submitForm to collect new fields ───────────────────────────────
const OLD_SUBMIT_FIELDS = `    colores: {
      primario:    document.getElementById('color1').value,
      secundario:  document.getElementById('color2').value,
      fondo:       document.getElementById('color3').value,
      oscuro:      document.getElementById('color4').value,
      claro:       document.getElementById('color5').value,
    },
    tipoPrincipal:  document.getElementById('tipoPrincipal').value,
    tipoSecundaria: document.getElementById('tipoSecundaria').value,
    tono:          [...document.querySelectorAll('[name="tono"]:checked')].map(e => e.value),
    prohibido:     document.getElementById('prohibido').value,
    clienteIdeal:  document.getElementById('clienteIdeal').value,`;

const NEW_SUBMIT_FIELDS = `    tono:              [...document.querySelectorAll('[name="tono"]:checked')].map(e => e.value),
    personalidad:      [...document.querySelectorAll('[name="personalidad"]:checked')].map(e => e.value),
    tratamiento:       document.querySelector('[name="tratamiento"]:checked')?.value || '',
    queDecir:          document.getElementById('queDecir').value,
    prohibido:         document.getElementById('prohibido').value,
    frasesKey:         document.getElementById('frasesKey').value,
    ejemploComunicacion: document.getElementById('ejemploComunicacion').value,
    clienteIdeal:      document.getElementById('clienteIdeal').value,
    clienteSecundarioA: document.getElementById('clienteSecundarioA').value,
    clienteSecundarioB: document.getElementById('clienteSecundarioB').value,`;

if (html.includes("document.getElementById('color1').value")) {
  html = html.replace(OLD_SUBMIT_FIELDS, NEW_SUBMIT_FIELDS);
  console.log('✅ submitForm: color/typography replaced with voice fields');
} else {
  console.log('⚠️  submitForm color block not found');
}

// Update contacto fields in submitForm
const OLD_CONTACTO = `    contacto: {
      nombre: document.getElementById('contactoNombre').value,
      cargo:  document.getElementById('contactoCargo').value,
      email:  document.getElementById('contactoEmail').value,
      wa:     document.getElementById('contactoWA').value,
    },`;

const NEW_CONTACTO = `    contacto: {
      nombre: document.getElementById('contactoNombre').value,
      cargo:  document.getElementById('contactoCargo').value,
      email:  document.getElementById('contactoEmail').value,
      wa:     document.getElementById('contactoWA').value,
    },
    equipoDC: {
      nombre: document.getElementById('dcNombre').value,
      email:  document.getElementById('dcEmail').value,
      wa:     document.getElementById('dcWA').value,
    },
    equipoDisenador: {
      nombre: document.getElementById('disenadorNombre').value,
      email:  document.getElementById('disenadorEmail').value,
      wa:     document.getElementById('disenadorWA').value,
    },
    equipoTrafiqueur: {
      nombre: document.getElementById('trafiqueurNombre').value,
      email:  document.getElementById('trafiqueurEmail').value,
      wa:     document.getElementById('trafiqueurWA').value,
    },
    equipoCliente: {
      nombre: document.getElementById('clienteNombre').value,
      email:  document.getElementById('clienteNombreEmail').value,
      wa:     document.getElementById('clienteNombreWA').value,
    },
    equipoSupervisor: {
      nombre: document.getElementById('supervisorNombre').value,
      email:  document.getElementById('supervisorEmail').value,
      wa:     document.getElementById('supervisorWA').value,
    },`;

if (html.includes("document.getElementById('contactoNombre').value")) {
  html = html.replace(OLD_CONTACTO, NEW_CONTACTO);
  console.log('✅ submitForm: full team contacts added');
} else {
  console.log('⚠️  submitForm contacto block not found');
}

// ─── Save ─────────────────────────────────────────────────────────────────────
fs.writeFileSync(htmlPath, html, 'utf8');
console.log('\n✅ All patches applied. Size:', fs.statSync(htmlPath).size, 'bytes');
