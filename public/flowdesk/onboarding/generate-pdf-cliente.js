const { mdToPdf } = require('md-to-pdf');

const css = `
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 11.5px;
    color: #1a1a1a;
    line-height: 1.75;
    max-width: 100%;
  }

  /* PORTADA */
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
    font-size: 28px;
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

  /* ENCABEZADOS */
  h1 {
    color: #1a1a2e;
    font-size: 22px;
    border-bottom: 3px solid #4A90D9;
    padding-bottom: 8px;
    margin-top: 40px;
  }
  h2 {
    color: #1a1a2e;
    font-size: 16px;
    border-bottom: 1px solid #dee2e6;
    padding-bottom: 5px;
    margin-top: 30px;
  }
  h3 {
    color: #0f3460;
    font-size: 13.5px;
    margin-top: 22px;
  }

  /* TABLAS */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 10.5px;
  }
  th {
    background-color: #1a1a2e;
    color: white;
    padding: 9px 12px;
    text-align: left;
    font-weight: 600;
  }
  td {
    padding: 8px 12px;
    border-bottom: 1px solid #e9ecef;
    vertical-align: top;
  }
  tr:nth-child(even) td {
    background-color: #f8f9fa;
  }

  /* CÓDIGO / BLOQUES */
  pre {
    background: #f0f4ff;
    color: #1a1a2e;
    padding: 16px 18px;
    border-radius: 8px;
    font-size: 10.5px;
    border-left: 4px solid #4A90D9;
    font-family: 'Segoe UI', Arial, sans-serif;
    line-height: 1.8;
    white-space: pre-wrap;
  }
  code {
    background: #f0f4ff;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    color: #0f3460;
  }

  /* BLOCKQUOTE — para el tip de resultados */
  blockquote {
    border-left: 4px solid #4CAF50;
    margin: 16px 0;
    padding: 10px 18px;
    background: #f1fbf2;
    color: #2E7D32;
    border-radius: 0 6px 6px 0;
    font-style: italic;
  }

  /* LISTAS */
  ul, ol { padding-left: 22px; }
  li { margin-bottom: 5px; }
  strong { color: #1a1a2e; }
  a { color: #4A90D9; text-decoration: none; }

  hr {
    border: none;
    border-top: 2px solid #dee2e6;
    margin: 28px 0;
  }

  /* SEPARADOR DE SECCIÓN */
  h1 + p, h2 + p { margin-top: 8px; }
`;

(async () => {
  try {
    await mdToPdf(
      { path: 'MANUAL-CLIENTE.md' },
      {
        dest: 'MANUAL-CLIENTE.pdf',
        pdf_options: {
          format: 'A4',
          margin: { top: '22mm', bottom: '22mm', left: '22mm', right: '22mm' },
          printBackground: true,
          displayHeaderFooter: true,
          headerTemplate: '<div></div>',
          footerTemplate: '<div style="font-size:8px;color:#aaa;width:100%;text-align:center;padding-bottom:5px;">MentorIA Systems \u2014 inteligencia humana, potencia artificial \u2014 P\u00e1g. <span class="pageNumber"></span> de <span class="totalPages"></span></div>'
        },
        css: css,
        launch_options: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
      }
    );
    console.log('PDF del cliente generado exitosamente');
  } catch(e) {
    console.error('Error:', e.message);
  }
})();
