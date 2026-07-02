const { mdToPdf } = require('md-to-pdf');

const css = `
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 11px;
    color: #1a1a1a;
    line-height: 1.75;
    max-width: 100%;
  }

  .cover-page {
    text-align: center;
    padding: 50px 0 35px 0;
    border-bottom: 3px solid #1a1a2e;
    margin-bottom: 35px;
  }
  .cover-logo {
    width: 200px;
    display: block;
    margin: 0 auto 24px auto;
  }
  .cover-page h1 {
    color: #1a1a2e;
    font-size: 26px;
    border: none !important;
    margin: 10px 0 8px 0 !important;
    padding: 0 !important;
  }
  .cover-page h2 {
    color: #4A90D9;
    font-size: 16px;
    border: none !important;
    margin: 4px 0 !important;
    font-weight: 400;
  }
  .cover-page h3 {
    color: #aaa;
    font-size: 11px;
    font-weight: 400;
    margin: 10px 0 0 0;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  h1 {
    color: #1a1a2e;
    font-size: 20px;
    border-bottom: 3px solid #4A90D9;
    padding-bottom: 8px;
    margin-top: 40px;
  }
  h2 {
    color: #1a1a2e;
    font-size: 15px;
    border-bottom: 1px solid #dee2e6;
    padding-bottom: 5px;
    margin-top: 28px;
  }
  h3 {
    color: #0f3460;
    font-size: 13px;
    margin-top: 20px;
  }

  /* Preguntas en blockquote */
  blockquote {
    border-left: 4px solid #4A90D9;
    margin: 12px 0;
    padding: 10px 18px;
    background: #f0f4ff;
    color: #1a1a2e;
    border-radius: 0 6px 6px 0;
    font-style: italic;
  }

  /* Notas en cursiva */
  em {
    color: #888;
    font-size: 10.5px;
  }

  ul, ol { padding-left: 22px; }
  li { margin-bottom: 5px; }
  strong { color: #1a1a2e; }

  hr {
    border: none;
    border-top: 2px solid #dee2e6;
    margin: 24px 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    font-size: 10.5px;
  }
  th {
    background-color: #1a1a2e;
    color: white;
    padding: 8px 12px;
    text-align: left;
    font-weight: 600;
  }
  td {
    padding: 7px 12px;
    border-bottom: 1px solid #e9ecef;
    vertical-align: top;
  }
  tr:nth-child(even) td {
    background-color: #f8f9fa;
  }
`;

(async () => {
  try {
    await mdToPdf(
      { path: 'GUION-ONBOARDING.md' },
      {
        dest: 'GUION-ONBOARDING.pdf',
        pdf_options: {
          format: 'A4',
          margin: { top: '22mm', bottom: '22mm', left: '22mm', right: '22mm' },
          printBackground: true,
          displayHeaderFooter: true,
          headerTemplate: '<div></div>',
          footerTemplate: '<div style="font-size:8px;color:#aaa;width:100%;text-align:center;padding-bottom:5px;">MentorIA Systems \u2014 Uso Interno \u2014 P\u00e1g. <span class="pageNumber"></span> de <span class="totalPages"></span></div>'
        },
        css: css,
        launch_options: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
      }
    );
    console.log('PDF del guion generado exitosamente');
  } catch(e) {
    console.error('Error:', e.message);
  }
})();
