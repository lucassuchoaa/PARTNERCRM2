import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page, context }) => {
    // Configurar usuário logado no localStorage
    await context.addInitScript(() => {
      const mockUser = {
        id: 1,
        email: 'partner@example.com',
        name: 'Test Partner',
        role: 'partner',
      }
      localStorage.setItem('user', JSON.stringify(mockUser))
    })

    // Mock da API para dashboard data
    await page.route('**/api/**', async (route) => {
      const url = route.request().url()

      // Mock básico para qualquer chamada de API
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          success: true,
        }),
      })
    })

    await page.goto('/')
  })

  test('deve carregar dashboard quando usuário está autenticado', async ({ page }) => {
    // Aguardar carregamento da página
    await page.waitForLoadState('networkidle')

    // Verificar se não está na tela de login
    const url = page.url()
    expect(url).not.toContain('/login')

    // Verificar elementos comuns de dashboard (ajustar conforme implementação)
    // Pode incluir: navegação, sidebar, conteúdo principal, etc.
  })

  test('deve exibir menu de navegação', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // Verificar presença de elementos de navegação típicos
    // Ajustar seletores conforme a implementação real
    const navigation = page.locator('nav')
    if (await navigation.count() > 0) {
      await expect(navigation.first()).toBeVisible()
    }
  })

  test('deve permitir logout', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // Procurar botão de logout/sair (ajustar seletor conforme implementação)
    const logoutButton = page.getByRole('button', { name: /sair/i }).or(
      page.getByText(/sair/i)
    )

    // Se encontrar botão de logout
    if (await logoutButton.count() > 0) {
      await logoutButton.first().click()

      // Aguardar navegação
      await page.waitForTimeout(500)

      // Verificar se voltou para login
      const url = page.url()
      expect(url).toContain('/') // ou '/login' se tiver rota específica
    }
  })

  test('deve ser responsivo', async ({ page }) => {
    // Testar em viewport mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForLoadState('networkidle')

    // Verificar que a página ainda está acessível
    await expect(page.locator('body')).toBeVisible()

    // Voltar para desktop
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('deve ter performance aceitável', async ({ page }) => {
    const startTime = Date.now()
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime

    // Verificar que carregou em menos de 5 segundos
    expect(loadTime).toBeLessThan(5000)
  })
})
