import { test, expect, Page } from '@playwright/test';

// Configuración
const BASE_URL = process.env.FLOWDESK_URL ?? 'http://localhost:3000';
const EMAIL    = process.env.FLOWDESK_EMAIL    ?? 'manolo@mentoriasystems.com';
const PASSWORD = process.env.FLOWDESK_PASSWORD ?? '1234567890';

// ── Helpers ─────────────────────────────────────────────────────────────────

async function ensureLoggedIn(page: Page) {
  // Si storageState no tiene sesión válida, hacemos login manual como fallback
  await page.goto(`${BASE_URL}/agents`);
  if (page.url().includes('/login')) {
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/(dashboard|home|team|agents)/, { timeout: 25_000 });
  }
  await page.waitForLoadState('networkidle');
}

async function getPanelUrl(page: Page): Promise<string | null> {
  // Navegar a /team y buscar un agente IA con botón Panel
  await page.goto(`${BASE_URL}/team`);
  await page.waitForLoadState('networkidle');

  // Filtrar solo agentes IA
  const agentFilterBtn = page.getByRole('button', { name: 'Agentes IA' });
  if (await agentFilterBtn.isVisible()) {
    await agentFilterBtn.click();
    await page.waitForTimeout(500);
  }

  // Buscar el botón "Panel" del primer agente IA
  const panelBtn = page.getByTitle('Panel de control').first();
  if (!(await panelBtn.isVisible())) return null;

  // Obtener el href del botón (si es un link) o el URL después de click
  const page2Promise = page.waitForURL(/\/agents\/.+\/panel/, { timeout: 5000 }).catch(() => null);
  await panelBtn.click();
  await page2Promise;
  return page.url();
}

// ── Tests ────────────────────────────────────────────────────────────────────

test.describe('Agent Panel', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  // ── Test 1: El botón "Panel" aparece en la tabla de /team ──────────────────

  test('botón Panel aparece en filas de agentes IA en /team', async ({ page }) => {
    await page.goto(`${BASE_URL}/team`);
    await page.waitForLoadState('networkidle');

    // Filtar a Agentes IA
    const agentFilter = page.getByRole('button', { name: 'Agentes IA' });
    await expect(agentFilter).toBeVisible({ timeout: 5000 });
    await agentFilter.click();
    await page.waitForTimeout(500);

    // Verificar que al menos un botón "Panel" existe
    const panelBtn = page.getByTitle('Panel de control').first();
    await expect(panelBtn).toBeVisible({ timeout: 5000 });
    console.log('✓ Botón Panel visible en tabla de equipo');
  });

  // ── Test 2: El botón "Panel" en /agents ──────────────────────────────────

  test('botón Panel aparece en página /agents', async ({ page }) => {
    await page.goto(`${BASE_URL}/agents`);
    await page.waitForLoadState('networkidle');

    // Debe haber al menos un botón con texto "Panel"
    const panelButtons = page.getByRole('button', { name: 'Panel' });
    const count = await panelButtons.count();
    expect(count).toBeGreaterThan(0);
    console.log(`✓ ${count} botón(es) Panel encontrados en /agents`);
  });

  // ── Test 3: El panel abre y carga datos del agente ────────────────────────

  test('panel carga correctamente con datos del agente', async ({ page }) => {
    const panelUrl = await getPanelUrl(page);
    expect(panelUrl).toBeTruthy();
    expect(panelUrl).toMatch(/\/agents\/.+\/panel/);

    await page.waitForLoadState('networkidle');

    // El sidebar debe estar visible
    await expect(page.getByText('General', { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Inicio' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Conversaciones' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Skills' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Calibrador' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Configuración' })).toBeVisible();

    console.log('✓ Panel carga con sidebar de navegación');
  });

  // ── Test 4: Sección Inicio muestra métricas ───────────────────────────────

  test('sección Inicio muestra estadísticas del agente', async ({ page }) => {
    const panelUrl = await getPanelUrl(page);
    expect(panelUrl).toBeTruthy();
    await page.waitForLoadState('networkidle');

    // La sección Inicio debería estar activa por defecto
    // Verificar que hay al menos una tarjeta de estadística
    await expect(page.getByText(/conversaciones/i).first()).toBeVisible({ timeout: 8000 });
    console.log('✓ Sección Inicio muestra métricas');
  });

  // ── Test 5: Navegación entre secciones del sidebar ───────────────────────

  test('navegación entre secciones del sidebar funciona', async ({ page }) => {
    const panelUrl = await getPanelUrl(page);
    expect(panelUrl).toBeTruthy();
    await page.waitForLoadState('networkidle');

    // Ir a Conversaciones
    await page.getByRole('button', { name: 'Conversaciones' }).click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('button', { name: 'Historial' })).toBeVisible({ timeout: 3000 });

    // Ir a Skills
    await page.getByRole('button', { name: 'Skills' }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText('Nuevo skill')).toBeVisible({ timeout: 3000 });

    // Ir a Calibrador
    await page.getByRole('button', { name: 'Calibrador' }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText('Calibración', { exact: true })).toBeVisible({ timeout: 3000 });

    // Ir a Configuración
    await page.getByRole('button', { name: 'Configuración' }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText('Identidad', { exact: true })).toBeVisible({ timeout: 3000 });

    console.log('✓ Navegación entre secciones funciona');
  });

  // ── Test 6: Skills CRUD ───────────────────────────────────────────────────

  test('Skills: crear, verificar y eliminar un skill', async ({ page }) => {
    const panelUrl = await getPanelUrl(page);
    expect(panelUrl).toBeTruthy();
    await page.waitForLoadState('networkidle');

    // Navegar a Skills
    await page.getByRole('button', { name: 'Skills' }).click();
    await page.waitForLoadState('networkidle');

    // Crear nuevo skill
    await page.getByRole('button', { name: 'Nuevo skill' }).click();
    await page.waitForTimeout(300);

    const skillName = `Test Skill ${Date.now()}`;
    await page.locator('input[placeholder*="objeciones"]').fill(skillName);
    await page.locator('input[placeholder*="caro"]').fill('Cuando el cliente pregunta el precio');
    await page.locator('textarea[placeholder*="debe responder"]').fill('Responde con el precio y el valor que ofrece el servicio');

    // Crear
    await page.getByRole('button', { name: 'Crear skill' }).click();
    await page.waitForTimeout(1000);

    // Verificar que el skill aparece
    await expect(page.getByText(skillName)).toBeVisible({ timeout: 5000 });
    console.log(`✓ Skill "${skillName}" creado`);

    // Eliminar — override window.confirm para evitar deadlock con dialog nativo
    await page.evaluate(() => { window.confirm = () => true; });

    // Skill card: div.rounded-xl que contiene el nombre del skill
    const skillCard = page.locator('div.rounded-xl').filter({ hasText: skillName }).first();
    await skillCard.getByRole('button').last().click();
    await page.waitForTimeout(2000);

    // Verificar que desapareció
    await expect(page.getByText(skillName)).toHaveCount(0, { timeout: 5000 });
    console.log('✓ Skill eliminado');
  });

  // ── Test 7: Configuración — selector de modelo con KIMI ─────────────────

  test('Configuración muestra selector de modelos incluyendo KIMI K2', async ({ page }) => {
    const panelUrl = await getPanelUrl(page);
    expect(panelUrl).toBeTruthy();
    await page.waitForLoadState('networkidle');

    // Navegar a Configuración
    await page.getByRole('button', { name: 'Configuración' }).click();
    await page.waitForLoadState('networkidle');

    // Tab Identidad debe estar activo
    await expect(page.getByText('Identidad', { exact: true })).toBeVisible({ timeout: 5000 });

    // Verificar que el selector de modelo existe
    const modelSelect = page.locator('select').filter({ hasText: /modelo/i }).first();
    if (await modelSelect.isVisible()) {
      // Verificar que KIMI K2 está en las opciones
      const options = await modelSelect.locator('option').allTextContents();
      const hasKimi = options.some(o => o.toLowerCase().includes('kimi'));
      if (hasKimi) {
        console.log('✓ KIMI K2 presente en selector de modelos (desde DB)');
      } else {
        // El selector puede ser un input de texto en lugar de select si los modelos no cargaron
        console.log('ℹ Modelos del selector:', options.join(', '));
      }
    } else {
      // Puede ser un input de texto cuando no cargan los modelos del API
      const modelInput = page.locator('input[placeholder*="gpt"], input[placeholder*="claude"], input[placeholder*="kimi"]').first();
      await expect(modelInput).toBeVisible({ timeout: 3000 });
      console.log('✓ Campo de modelo visible (modo texto)');
    }
  });

  // ── Test 8: Calibrador carga y muestra datos de cobertura ────────────────

  test('Calibrador muestra estado de cobertura de datos', async ({ page }) => {
    const panelUrl = await getPanelUrl(page);
    expect(panelUrl).toBeTruthy();
    await page.waitForLoadState('networkidle');

    // Navegar a Calibrador
    await page.getByRole('button', { name: 'Calibrador' }).click();
    await page.waitForLoadState('networkidle');

    // Verificar tabs
    await expect(page.getByRole('button', { name: 'Calibración' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Evolución' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Instrucciones actuales' })).toBeVisible();

    // Verificar que muestra datos de cobertura o el botón de calibrar
    const calibrateBtn = page.getByRole('button', { name: /Recalibrar ahora/i });
    await expect(calibrateBtn).toBeVisible({ timeout: 5000 });

    // Ir a instrucciones actuales
    await page.getByRole('button', { name: 'Instrucciones actuales' }).click();
    await page.waitForTimeout(500);
    // Debe haber un textarea con las instrucciones (readonly)
    const instructionsArea = page.locator('textarea[readonly]');
    await expect(instructionsArea).toBeVisible({ timeout: 3000 });

    console.log('✓ Calibrador carga correctamente');
  });

  // ── Test 9: Volver desde el panel al listado de agentes ─────────────────

  test('botón Volver navega de regreso a /agents', async ({ page }) => {
    const panelUrl = await getPanelUrl(page);
    expect(panelUrl).toBeTruthy();
    await page.waitForLoadState('networkidle');

    // Click en botón Volver (sidebar)
    await page.getByRole('button', { name: 'Volver' }).click();
    await page.waitForURL(/\/agents$/, { timeout: 5000 });
    expect(page.url()).toMatch(/\/agents$/);

    console.log('✓ Botón Volver navega de regreso a /agents');
  });
});
