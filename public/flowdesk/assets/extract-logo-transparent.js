// extract-logo-transparent.js
// Uses Puppeteer canvas to remove white background from logo JPEG
// Outputs transparent PNG embedded in the form HTML

const puppeteer = require('puppeteer');
const fs   = require('fs');
const path = require('path');

const dir      = __dirname;
const logoPath = path.join(dir, 'logo-mentoria.jpeg');
const htmlPath = path.join(dir, 'onboarding-form.html');

async function run() {
  const logoB64 = fs.readFileSync(logoPath).toString('base64');
  const logoSrc = 'data:image/jpeg;base64,' + logoB64;

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Process image in browser canvas: remove white bg with smooth edges
  const pngDataUrl = await page.evaluate(async (src) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = src; });

    const canvas = document.createElement('canvas');
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imageData.data;

    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i+1], b = d[i+2];
      // "Whiteness" = how close all channels are to 255
      const whiteness = Math.min(r, g, b);
      const high = 230; // above this → transparent
      const low  = 180; // below this → fully opaque
      if (whiteness >= high) {
        // Pure white / near-white → fully transparent
        d[i+3] = 0;
      } else if (whiteness > low) {
        // Anti-aliased edge → partially transparent for smooth edges
        d[i+3] = Math.round((high - whiteness) / (high - low) * 255);
      }
      // Below low → keep fully opaque (colored parts of logo)
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  }, logoSrc);

  await browser.close();
  console.log('✅ White background removed');

  // Patch the HTML: replace logo-wrap with <img> using transparent PNG
  let html = fs.readFileSync(htmlPath, 'utf8');

  const NEW_WRAP = `<div style="text-align:center;margin-bottom:24px;">
    <img src="${pngDataUrl}" alt="MentorIA Systems" style="height:110px;width:auto;object-fit:contain;display:inline-block;">
  </div>`;

  // Replace the whole logo-wrap block (SVG or img version)
  const regex = /<div class="logo-wrap"[\s\S]*?<\/div>/;
  if (regex.test(html)) {
    html = html.replace(regex, NEW_WRAP);
    console.log('✅ Logo patched in HTML');
  } else {
    console.log('❌ Could not find logo-wrap');
    process.exit(1);
  }

  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('✅ HTML saved, size:', fs.statSync(htmlPath).size, 'bytes');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
