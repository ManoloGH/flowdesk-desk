// patch-form-logo-materiales.js
// 1. Embeds real MentorIA logo in header
// 2. Adds Step 6 "Materiales" with multiple upload zones
// 3. Updates progress bar from 5 to 6 steps

const fs = require('fs');
const path = require('path');

const dir = __dirname;
const htmlPath  = path.join(dir, 'onboarding-form.html');
const logoPath  = path.join(dir, 'logo-mentoria.jpeg');

const logoB64  = fs.readFileSync(logoPath).toString('base64');
const logoSrc  = 'data:image/jpeg;base64,' + logoB64;

let html = fs.readFileSync(htmlPath, 'utf8');

// ── 1. Replace emoji logo with real image ─────────────────────────────────────
const OLD_LOGO = [
  '  <div class="logo-wrap">',
  '    <div class="logo-icon">🧠</div>',
  '    <div class="logo-text">Mentor<span>IA</span> Systems</div>',
  '  </div>'
].join('\n');

const NEW_LOGO = [
  '  <div class="logo-wrap" style="background:transparent;border:none;padding:0;margin-bottom:20px;">',
  '    <img src="' + logoSrc + '" alt="MentorIA Systems" style="height:90px;width:auto;object-fit:contain;">',
  '  </div>'
].join('\n');

if (!html.includes('logo-icon')) {
  console.log('NOTE: logo-icon not found, may already be patched');
} else {
  html = html.replace(
    /<div class="logo-wrap">[\s\S]*?<\/div>\s*<\/div>/,
    NEW_LOGO
  );
  console.log('✅ Logo replaced with real image');
}

// ── 2. Add dot6 + lbl6 to progress bar ───────────────────────────────────────
if (!html.includes('id="dot6"')) {
  html = html.replace(
    '<div class="step-dot" id="dot5"><span>5</span></div>',
    '<div class="step-dot" id="dot5"><span>5</span></div>\n    <div class="step-dot" id="dot6"><span>6</span></div>'
  );
  html = html.replace(
    '<span class="step-label" id="lbl5">Operativo</span>',
    '<span class="step-label" id="lbl5">Operativo</span>\n    <span class="step-label" id="lbl6">Archivos</span>'
  );
  console.log('✅ Progress bar extended to 6 steps');
}

// ── 3. Remove upload zone from step 2 (brand manual will be in step 6) ────────
const OLD_UPLOAD_STEP2 = `      <div class="field-group">
        <label>Sube tu manual de marca <span class="hint">PDF, AI, PNG — opcional pero recomendado</span></label>
        <div class="upload-zone" onclick="document.getElementById('manualUpload').click()">
          <div class="up-icon">📎</div>
          <p id="uploadText">Arrastra tu archivo aquí o haz clic para subir</p>
          <span>PDF, AI, PNG, ZIP — máx 20 MB</span>
          <input type="file" id="manualUpload" accept=".pdf,.ai,.png,.zip,.jpg" onchange="handleUpload(this)">
        </div>
      </div>

      <div class="section-title">Paleta de Colores</div>`;

const NEW_STEP2_START = '      <div class="section-title">Paleta de Colores</div>';

if (html.includes('manualUpload')) {
  html = html.replace(OLD_UPLOAD_STEP2, NEW_STEP2_START);
  console.log('✅ Removed upload zone from step 2 (moved to step 6)');
}

// ── 4. Change step 5 submit button to go to step 6 ────────────────────────────
if (html.includes('onclick="submitForm()">✓') && html.includes('btn-submit')) {
  html = html.replace(
    '<button class="btn btn-primary btn-submit" onclick="submitForm()">✓ &nbsp;Completar Onboarding</button>',
    '<button class="btn btn-primary" onclick="goTo(6)">Siguiente → Archivos</button>'
  );
  console.log('✅ Step 5 button changed to goTo(6)');
}

// ── 5. Add Step 6 HTML before SUCCESS screen ──────────────────────────────────
const STEP6_HTML = `
  <!-- ════════════════ STEP 6: MATERIALES ════════════════ -->
  <div class="step-panel" id="step6">
    <div class="card-header">
      <div class="card-icon">📁</div>
      <div>
        <h2>Materiales de Marca</h2>
        <p>Sube tus archivos para que el agente los use al crear contenido</p>
      </div>
    </div>
    <div class="card-body">

      <div class="section-title">🎨 Identidad Visual</div>

      <div class="field-row">
        <div class="field-group">
          <label>Logo principal <span class="hint">PNG, SVG, AI, EPS — fondo transparente ideal</span></label>
          <div class="upload-zone" onclick="document.getElementById('uploadLogo').click()" id="zoneLogo">
            <div class="up-icon">🖼️</div>
            <p id="textLogo">Haz clic para subir tu logo</p>
            <span>PNG, SVG, AI, EPS — máx 20 MB</span>
            <input type="file" id="uploadLogo" accept=".png,.svg,.ai,.eps,.pdf" onchange="handleFile(this,'textLogo','fileLogo')">
          </div>
        </div>
        <div class="field-group">
          <label>Manual de marca <span class="hint">Brand guidelines, guía de estilo</span></label>
          <div class="upload-zone" onclick="document.getElementById('uploadManual').click()" id="zoneManual">
            <div class="up-icon">📄</div>
            <p id="textManual">Haz clic para subir el manual</p>
            <span>PDF, AI, ZIP — máx 20 MB</span>
            <input type="file" id="uploadManual" accept=".pdf,.ai,.zip,.pptx" onchange="handleFile(this,'textManual','fileManual')">
          </div>
        </div>
      </div>

      <div class="section-title">✍️ Tipografías y Referencias</div>

      <div class="field-row">
        <div class="field-group">
          <label>Fuentes / Tipografías <span class="hint">Archivos de las fuentes que usas</span></label>
          <div class="upload-zone" onclick="document.getElementById('uploadFuentes').click()" id="zoneFuentes">
            <div class="up-icon">🔤</div>
            <p id="textFuentes">Haz clic para subir las fuentes</p>
            <span>TTF, OTF, WOFF, ZIP — máx 20 MB</span>
            <input type="file" id="uploadFuentes" accept=".ttf,.otf,.woff,.woff2,.zip" onchange="handleFile(this,'textFuentes','fileFuentes')">
          </div>
        </div>
        <div class="field-group">
          <label>Referencias visuales <span class="hint">Imágenes que te inspiran o ya usas</span></label>
          <div class="upload-zone" onclick="document.getElementById('uploadRefs').click()" id="zoneRefs">
            <div class="up-icon">🖼️</div>
            <p id="textRefs">Haz clic para subir referencias</p>
            <span>JPG, PNG, ZIP — máx 20 MB</span>
            <input type="file" id="uploadRefs" accept=".jpg,.jpeg,.png,.zip,.gif,.webp" multiple onchange="handleFile(this,'textRefs','fileRefs')">
          </div>
        </div>
      </div>

      <div class="section-title">🔗 Carpeta Compartida</div>

      <div class="field-group">
        <label>Link a carpeta de Google Drive, Dropbox o Canva <span class="hint">Opcional — si ya tienes tus archivos en la nube</span></label>
        <input type="url" id="linkCarpeta" placeholder="https://drive.google.com/drive/folders/...">
      </div>

      <div class="field-group">
        <label>Notas sobre los archivos <span class="hint">Instrucciones especiales, passwords, contexto</span></label>
        <textarea id="notasMateriales" placeholder="Ej: El logo azul es para fondo oscuro, el blanco para fondo claro. La carpeta de Drive tiene todas las versiones aprobadas." style="min-height:80px;"></textarea>
      </div>

      <div class="btn-row">
        <button class="btn btn-secondary" onclick="goTo(5)">← Atrás</button>
        <button class="btn btn-primary btn-submit" onclick="submitForm()">✓ &nbsp;Completar Onboarding</button>
      </div>
    </div>
  </div>

`;

if (!html.includes('id="step6"')) {
  html = html.replace(
    '  <!-- ════════════════ SUCCESS ════════════════ -->',
    STEP6_HTML + '  <!-- ════════════════ SUCCESS ════════════════ -->'
  );
  console.log('✅ Step 6 HTML added');
}

// ── 6. Update totalSteps 5 → 6 ────────────────────────────────────────────────
if (html.includes('const totalSteps = 5;')) {
  html = html.replace('const totalSteps = 5;', 'const totalSteps = 6;');
  console.log('✅ totalSteps updated to 6');
}

// ── 7. Fix success screen loop (was 5, now 6) ─────────────────────────────────
if (html.includes('for (let i = 1; i <= 5; i++) {')) {
  html = html.replace('for (let i = 1; i <= 5; i++) {', 'for (let i = 1; i <= 6; i++) {');
  console.log('✅ Success loop updated to 6');
}

// ── 8. Replace handleUpload with new multi-file handler ───────────────────────
const OLD_HANDLE = `function handleUpload(input) {
  if (input.files[0]) {
    document.getElementById('uploadText').textContent = '✅ ' + input.files[0].name;
  }
}`;

const NEW_HANDLE = `// Stored file names for material upload zones
const fileStore = {};

function handleFile(input, textId, storeKey) {
  if (!input.files.length) return;
  const names = Array.from(input.files).map(function(f) { return f.name; }).join(', ');
  document.getElementById(textId).textContent = '✅ ' + names;
  fileStore[storeKey] = names;
  input.closest('.upload-zone').style.borderColor = 'var(--ok)';
  input.closest('.upload-zone').style.background = '#f0fdf4';
}`;

if (html.includes('function handleUpload')) {
  html = html.replace(OLD_HANDLE, NEW_HANDLE);
  console.log('✅ handleUpload replaced with handleFile');
}

// ── 9. Add materiales fields to submitForm data ────────────────────────────────
const OLD_SUBMIT_END = `    notas:        document.getElementById('notas').value,
    fecha:        new Date().toISOString(),
  };`;

const NEW_SUBMIT_END = `    notas:        document.getElementById('notas').value,
    fecha:        new Date().toISOString(),
    materiales: {
      logo:        fileStore['fileLogo']     || '',
      manual:      fileStore['fileManual']   || '',
      fuentes:     fileStore['fileFuentes']  || '',
      referencias: fileStore['fileRefs']     || '',
      linkCarpeta: document.getElementById('linkCarpeta').value,
      notas:       document.getElementById('notasMateriales').value,
    },
  };`;

if (html.includes("notas:        document.getElementById('notas').value,\n    fecha:")) {
  html = html.replace(OLD_SUBMIT_END, NEW_SUBMIT_END);
  console.log('✅ materiales fields added to submitForm');
}

// ── Save ──────────────────────────────────────────────────────────────────────
fs.writeFileSync(htmlPath, html, 'utf8');
console.log('\n✅ Done! File saved: onboarding-form.html');
