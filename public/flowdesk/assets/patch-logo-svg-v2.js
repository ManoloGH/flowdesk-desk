// patch-logo-svg-v2.js — Bigger, more detailed, high-contrast brain SVG logo

const fs   = require('fs');
const path = require('path');
const htmlPath = path.join(__dirname, 'onboarding-form.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// ─── New SVG logo ─────────────────────────────────────────────────────────────
// Brain: 70×68 px, centered in 300-wide SVG
// Left: 5 organic folds | Right: 6 nodes + PCB traces
// Subtle glow circle behind the brain for depth
const SVG_LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 148" style="max-width:290px;height:auto;display:block;margin:0 auto;">
  <defs>
    <linearGradient id="brG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#5BC8F5"/>
      <stop offset="100%" stop-color="#1B4FD8"/>
    </linearGradient>
    <linearGradient id="txtG" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#5BC8F5"/>
      <stop offset="100%" stop-color="#1B4FD8"/>
    </linearGradient>
    <radialGradient id="glowG" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#3A86D4" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#1B4FD8" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Glow backdrop -->
  <ellipse cx="150" cy="38" rx="52" ry="48" fill="url(#glowG)"/>

  <!-- ── BRAIN (translate so it centers at x=150) ── -->
  <g transform="translate(116,4)" stroke="url(#brG)" fill="none" stroke-linecap="round" stroke-linejoin="round">

    <!-- Outer silhouette -->
    <path stroke-width="2.8" d="
      M 34 2
      C 51 2  68 14  68 32
      C 68 46  60 56  50 62
      C 44 66  39 68  34 68
      C 29 68  24 66  18 62
      C 8  56   0 46   0 32
      C 0  14  17  2  34  2 Z"/>

    <!-- Vertical divider -->
    <line x1="34" y1="2" x2="34" y2="68" stroke-width="1.6"/>

    <!-- ── LEFT: organic brain folds ── -->
    <path stroke-width="2.4" d="M 17 13 C 23  8 29 13 31 20"/>
    <path stroke-width="2.4" d="M 10 25 C 18 18 26 24 28 32"/>
    <path stroke-width="2.2" d="M  8 39 C 16 32 25 38 26 47"/>
    <path stroke-width="2.0" d="M 12 53 C 18 47 25 50 26 58"/>
    <path stroke-width="1.8" d="M 21  6 C 25  3 30  5 30 12"/>

    <!-- ── RIGHT: circuit board ── -->
    <!-- Nodes (filled circles) -->
    <circle cx="44" cy="11" r="3.2" fill="url(#brG)" stroke-width="0"/>
    <circle cx="59" cy="20" r="3.2" fill="url(#brG)" stroke-width="0"/>
    <circle cx="63" cy="36" r="3.2" fill="url(#brG)" stroke-width="0"/>
    <circle cx="57" cy="53" r="3.2" fill="url(#brG)" stroke-width="0"/>
    <circle cx="43" cy="62" r="3.2" fill="url(#brG)" stroke-width="0"/>
    <circle cx="42" cy="38" r="2.4" fill="url(#brG)" stroke-width="0"/>

    <!-- Traces (PCB-style: horizontal + vertical + diagonal) -->
    <polyline stroke-width="1.9" points="44,11 59,11 59,20"/>
    <line     stroke-width="1.9" x1="59" y1="20" x2="63" y2="36"/>
    <line     stroke-width="1.9" x1="63" y1="36" x2="57" y2="53"/>
    <line     stroke-width="1.9" x1="57" y1="53" x2="43" y2="62"/>
    <polyline stroke-width="1.9" points="44,11 44,22 42,38 43,62"/>
    <line     stroke-width="1.6" x1="44" y1="22" x2="59" y2="20"/>
    <line     stroke-width="1.6" x1="42" y1="38" x2="63" y2="36"/>
  </g>

  <!-- ── TEXT ── -->
  <text x="150" y="97"
        text-anchor="middle"
        font-family="Montserrat, sans-serif"
        font-weight="800"
        font-size="30"
        letter-spacing="0.5">
    <tspan fill="#ffffff">Mentor</tspan><tspan fill="url(#txtG)">IA</tspan>
  </text>

  <text x="150" y="114"
        text-anchor="middle"
        font-family="Montserrat, sans-serif"
        font-weight="500"
        font-size="11.5"
        fill="rgba(255,255,255,0.58)"
        letter-spacing="5.5">SYSTEMS</text>

  <text x="150" y="133"
        text-anchor="middle"
        font-family="Inter, sans-serif"
        font-size="10"
        fill="rgba(255,255,255,0.42)">
    <tspan font-style="italic" font-weight="600">inteligencia humana</tspan>
    <tspan font-weight="300">, potencia artificial</tspan>
  </text>
</svg>`;

// ─── Replace the logo-wrap section ───────────────────────────────────────────
// Match from <div class="logo-wrap" to the closing </div> of that wrapper
const regex = /<div class="logo-wrap"[\s\S]*?<\/div>/;
const NEW_WRAP = `<div class="logo-wrap" style="background:transparent;border:none;padding:0;margin-bottom:20px;">
    ${SVG_LOGO}
  </div>`;

if (regex.test(html)) {
  html = html.replace(regex, NEW_WRAP);
  console.log('✅ Logo replaced with improved SVG v2');
} else {
  console.log('❌ Could not find logo-wrap');
  process.exit(1);
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('✅ Saved:', htmlPath);
console.log('   Size:', fs.statSync(htmlPath).size, 'bytes');
