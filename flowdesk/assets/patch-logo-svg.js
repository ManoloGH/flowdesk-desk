// patch-logo-svg.js — Replace JPEG logo with clean inline SVG

const fs   = require('fs');
const path = require('path');
const htmlPath = path.join(__dirname, 'onboarding-form.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// ─── Inline SVG logo ──────────────────────────────────────────────────────────
// Brain: left half organic (curved folds) / right half circuit (traces + nodes)
// Text: Montserrat bold, transparent bg, crisp at any size
const SVG_LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 130" style="max-width:280px;height:auto;display:block;margin:0 auto;">
  <defs>
    <linearGradient id="bG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#5BC8F5"/>
      <stop offset="100%" stop-color="#1B4FD8"/>
    </linearGradient>
    <linearGradient id="tG" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#5BC8F5"/>
      <stop offset="100%" stop-color="#1B4FD8"/>
    </linearGradient>
  </defs>

  <!-- ── BRAIN ICON (centered at x=150) ── -->
  <g transform="translate(119,2)" fill="none" stroke="url(#bG)" stroke-linecap="round" stroke-linejoin="round">

    <!-- Outer brain silhouette -->
    <path stroke-width="2.5" d="
      M 31 4
      C 45 4 58 14 58 28
      C 58 38 53 47 46 52
      C 41 56 36 60 31 60
      C 26 60 21 56 16 52
      C 9 47 4 38 4 28
      C 4 14 17 4 31 4 Z"/>

    <!-- Center dividing line -->
    <line x1="31" y1="4" x2="31" y2="60" stroke-width="1.5"/>

    <!-- ── Left half: organic brain folds ── -->
    <path stroke-width="2"   d="M 11 19 C 17 14 24 19 26 26"/>
    <path stroke-width="2"   d="M  8 33 C 15 27 22 32 24 40"/>
    <path stroke-width="1.8" d="M 14 48 C 19 43 24 46 26 52"/>
    <path stroke-width="1.5" d="M 18 11 C 21  7 27 10 27 17"/>

    <!-- ── Right half: circuit board traces + nodes ── -->
    <!-- Nodes -->
    <circle cx="41" cy="13" r="2.8" stroke-width="0" fill="url(#bG)"/>
    <circle cx="53" cy="23" r="2.8" stroke-width="0" fill="url(#bG)"/>
    <circle cx="54" cy="39" r="2.8" stroke-width="0" fill="url(#bG)"/>
    <circle cx="45" cy="52" r="2.8" stroke-width="0" fill="url(#bG)"/>
    <circle cx="37" cy="43" r="2.2" stroke-width="0" fill="url(#bG)"/>
    <circle cx="36" cy="28" r="2.2" stroke-width="0" fill="url(#bG)"/>

    <!-- Traces -->
    <polyline stroke-width="1.8" points="41,13 53,13 53,23"/>
    <line     stroke-width="1.8" x1="53" y1="23" x2="54" y2="39"/>
    <line     stroke-width="1.8" x1="54" y1="39" x2="45" y2="52"/>
    <polyline stroke-width="1.8" points="41,13 36,28 37,43 45,52"/>
    <line     stroke-width="1.5" x1="36" y1="28" x2="53" y2="23"/>
    <line     stroke-width="1.5" x1="37" y1="43" x2="54" y2="39"/>
  </g>

  <!-- ── TEXT ── -->
  <!-- MentorIA -->
  <text x="150" y="88"
        text-anchor="middle"
        font-family="Montserrat, sans-serif"
        font-weight="800"
        font-size="28"
        letter-spacing="0.5">
    <tspan fill="#ffffff">Mentor</tspan><tspan fill="url(#tG)">IA</tspan>
  </text>

  <!-- SYSTEMS -->
  <text x="150" y="104"
        text-anchor="middle"
        font-family="Montserrat, sans-serif"
        font-weight="500"
        font-size="11"
        fill="rgba(255,255,255,0.60)"
        letter-spacing="5">SYSTEMS</text>

  <!-- Tagline -->
  <text x="150" y="121"
        text-anchor="middle"
        font-family="Inter, sans-serif"
        font-size="9.5"
        fill="rgba(255,255,255,0.45)">
    <tspan font-style="italic" font-weight="600">inteligencia humana</tspan>
    <tspan font-weight="300">, potencia artificial</tspan>
  </text>
</svg>`;

// ─── Replace any existing logo-wrap (image or emoji version) ─────────────────
// Match the logo-wrap div regardless of what's inside
const OLD_WRAP = /<div class="logo-wrap"[\s\S]*?<\/div>\s*(<\/div>)?/;

const NEW_WRAP = `<div class="logo-wrap" style="background:transparent;border:none;padding:0;margin-bottom:20px;">
    ${SVG_LOGO}
  </div>`;

if (OLD_WRAP.test(html)) {
  // Replace only the first match (the header logo-wrap)
  html = html.replace(OLD_WRAP, NEW_WRAP);
  console.log('✅ Logo-wrap replaced with inline SVG');
} else {
  console.log('⚠️  Could not find logo-wrap — check the pattern');
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('✅ Saved. Size:', fs.statSync(htmlPath).size, 'bytes');
