import { test, expect } from '@playwright/test'

test.describe('Application Health', () => {
  test('aplicação deve carregar sem erros de console críticos', async ({ page }) => {
    const errors: string[] = []

    // Capturar erros do console
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Filtrar erros conhecidos/aceitáveis se necessário
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes('favicon') && // Ignorar erros de favicon
        !error.includes('DevTools') // Ignorar avisos de DevTools
    )

    // Verificar que não há erros críticos
    expect(criticalErrors.length).toBe(0)
  })

  test('página deve ter título correto', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/partners/i)
  })

  test('assets principais devem carregar', async ({ page }) => {
    const responses: string[] = []

    page.on('response', (response) => {
      const status = response.status()
      const url = response.url()

      // Registrar falhas de recursos
      if (status >= 400 && !url.includes('favicon')) {
        responses.push(`${status}: ${url}`)
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Verificar que assets críticos carregaram
    expect(responses.length).toBe(0)
  })

  test('aplicação deve ser acessível (básico)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Verificar que há um heading principal
    const headings = page.getByRole('heading')
    const headingCount = await headings.count()
    expect(headingCount).toBeGreaterThan(0)

    // Verificar estrutura semântica básica
    const main = page.locator('main')
    if (await main.count() > 0) {
      await expect(main.first()).toBeVisible()
    }
  })

  test('deve funcionar com JavaScript desabilitado (SSR/básico)', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
    })

    const page = await context.newPage()

    try {
      await page.goto('/')

      // Verificar que pelo menos a estrutura HTML carrega
      await expect(page.locator('body')).toBeVisible()
    } finally {
      await context.close()
    }
  })
})
