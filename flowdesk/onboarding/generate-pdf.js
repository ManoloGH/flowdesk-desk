const { mdToPdf } = require('md-to-pdf');

const css = `
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 11px;
    color: #1a1a1a;
    line-height: 1.7;
  }

  /* PORTADA */
  .cover-page {
    text-align: center;
    padding: 40px 0 30px 0;
    border-bottom: 3px solid #1a1a2e;
    margin-bottom: 30px;
  }
  .cover-logo {
    width: 220px;
    display: block;
    margin: 0 auto 20px auto;
  }
  .cover-page h1 {
    color: #1a1a2e;
    font-size: 26px;
    border: none !important;
    margin: 10px 0 6px 0 !important;
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
    color: #888;
    font-size: 11px;
    font-weight: 400;
    margin: 8px 0 0 0;
  }

  /* ENCABEZADOS */
  h1 {
    color: #1a1a2e;
    font-size: 20px;
    border-bottom: 3px solid #4A90D9;
    padding-bottom: 8px;
    margin-top: 35px;
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
  h4 {
    color: #4A90D9;
    font-size: 11.5px;
    margin-top: 16px;
  }

  /* TABLAS */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    font-size: 10px;
  }
  th {
    background-color: #1a1a2e;
    color: white;
    padding: 8px 10px;
    text-align: left;
    font-weight: 600;
    font-size: 10px;
  }
  td {
    padding: 7px 10px;
    border-bottom: 1px solid #e9ecef;
    vertical-align: top;
  }
  tr:nth-child(even) td {
    background-color: #f8f9fa;
  }

  /* CÓDIGO */
  code {
    background: #f1f3f5;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 9.5px;
    color: #d63384;
    font-family: 'Courier New', monospace;
  }
  pre {
    background: #1e1e2e;
    color: #cdd6f4;
    padding: 14px 16px;
    border-radius: 6px;
    font-size: 9.5px;
    overflow-x: auto;
    border-left: 4px solid #4A90D9;
    font-family: 'Courier New', monospace;
    line-height: 1.5;
  }
  pre code {
    background: none;
    color: inherit;
    padding: 0;
    font-size: inherit;
  }

  /* OTROS */
  blockquote {
    border-left: 4px solid #4A90D9;
    margin: 12px 0;
    padding: 8px 16px;
    background: #f0f4ff;
    color: #555;
    border-radius: 0 4px 4px 0;
  }
  hr {
    border: none;
    border-top: 2px solid #dee2e6;
    margin: 24px 0;
  }
  ul, ol {
    padding-left: 22px;
  }
  li {
    margin-bottom: 4px;
  }
  strong {
    color: #1a1a2e;
  }
  a {
    color: #4A90D9;
    text-decoration: none;
  }
`;

(async () => {
  try {
    await mdToPdf(
      { path: 'MANUAL-IMPLEMENTACION.md' },
      {
        dest: 'MANUAL-IMPLEMENTACION.pdf',
        pdf_options: {
          format: 'A4',
          margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
          printBackground: true,
          displayHeaderFooter: true,
          headerTemplate: '<div></div>',
          footerTemplate: '<div style="font-size:8px;color:#aaa;width:100%;text-align:center;padding-bottom:5px;">MentorIA Systems \u2014 Confidencial \u2014 P\u00e1g. <span class="pageNumber"></span> de <span class="totalPages"></span></div>'
        },
        css: css,
        launch_options: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
      }
    );
    console.log('PDF generado con logo exitosamente');
  } catch(e) {
    console.error('Error:', e.message);
  }
})();
