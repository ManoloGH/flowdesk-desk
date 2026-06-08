// patch-logo-white.js
// Removes white bg from JPEG logo, turns all visible pixels white → clean white logo on dark bg

const puppeteer = require('puppeteer');
const fs   = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, 'logo-mentoria.jpeg');
const htmlPath = path.join(__dirname, 'onboarding-form.html');

async function run() {
  const logoB64 = fs.readFileSync(logoPath).toString('base64');
  const logoSrc = 'data:image/jpeg;base64,' + logoB64;

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

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
      const whiteness = Math.min(r, g, b);
      const high = 230;
      const low  = 170;

      if (whiteness >= high) {
        // Background white → fully transparent
        d[i] = 255; d[i+1] = 255; d[i+2] = 255; d[i+3] = 0;
      } else if (whiteness > low) {
        // Edge: partially transparent + white
        const alpha = Math.round((high - whiteness) / (high - low) * 255);
        d[i] = 255; d[i+1] = 255; d[i+2] = 255; d[i+3] = alpha;
      } else {
        // Logo pixel → make it solid white
        d[i] = 255; d[i+1] = 255; d[i+2] = 255; d[i+3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  }, logoSrc);

  await browser.close();
  console.log('✅ Logo converted to white PNG');

  // Replace logo section in HTML
  let html = fs.readFileSync(htmlPath, 'utf8');

  const NEW_LOGO = `<div style="text-align:center;margin-bottom:24px;">
    <img src="${pngDataUrl}" alt="MentorIA Systems" style="height:130px;width:auto;object-fit:contain;display:inline-block;">
  </div>`;

  // Match either the old logo-wrap class div or the plain div we put last time
  const regex = /(<div class="logo-wrap"[\s\S]*?<\/div>|<div style="text-align:center;margin-bottom:24px;">[\s\S]*?<\/div>)/;

  if (regex.test(html)) {
    html = html.replace(regex, NEW_LOGO);
    console.log('✅ Logo replaced in HTML');
  } else {
    console.log('❌ Could not find logo section');
    process.exit(1);
  }

  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('✅ Saved. Size:', fs.statSync(htmlPath).size, 'bytes');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
