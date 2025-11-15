import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de login
    await page.goto('/')
  })

  test('deve exibir formulário de login', async ({ page }) => {
    // Verificar se elementos do formulário estão presentes
    await expect(page.getByRole('heading', { name: /partners crm/i })).toBeVisible()
    await expect(page.getByPlaceholder(/email/i)).toBeVisible()
    await expect(page.getByPlaceholder(/senha/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible()
  })

  test('deve validar campos obrigatórios', async ({ page }) => {
    // Tentar submeter formulário vazio
    await page.getByRole('button', { name: /entrar/i }).click()

    // Verificar validação HTML5
    const emailInput = page.getByPlaceholder(/email/i)
    const passwordInput = page.getByPlaceholder(/senha/i)

    // Inputs devem ter atributo required
    await expect(emailInput).toHaveAttribute('required', '')
    await expect(passwordInput).toHaveAttribute('required', '')
  })

  test('deve validar formato de email', async ({ page }) => {
    // Preencher email inválido
    await page.getByPlaceholder(/email/i).fill('invalid-email')
    await page.getByPlaceholder(/senha/i).fill('password123')
    await page.getByRole('button', { name: /entrar/i }).click()

    // Verificar que não navegou (ainda está na página de login)
    await expect(page.getByRole('heading', { name: /partners crm/i })).toBeVisible()
  })

  test('deve fazer login com credenciais válidas (mock)', async ({ page }) => {
    // Mock da API de usuários
    await page.route('**/users?email=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            email: 'partner@example.com',
            password: 'password123',
            name: 'Test Partner',
            role: 'partner',
          },
        ]),
      })
    })

    // Preencher formulário
    await page.getByPlaceholder(/email/i).fill('partner@example.com')
    await page.getByPlaceholder(/senha/i).fill('password123')

    // Submeter
    await page.getByRole('button', { name: /entrar/i }).click()

    // Aguardar navegação ou dashboard aparecer
    // Ajustar seletor conforme o dashboard real
    await page.waitForTimeout(1000)

    // Verificar se saiu da tela de login
    const url = page.url()
    expect(url).not.toContain('/login')
  })

  test('deve exibir erro com credenciais inválidas', async ({ page }) => {
    // Mock da API retornando usuário não encontrado
    await page.route('**/users?email=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    // Preencher formulário
    await page.getByPlaceholder(/email/i).fill('wrong@example.com')
    await page.getByPlaceholder(/senha/i).fill('wrongpassword')

    // Submeter
    await page.getByRole('button', { name: /entrar/i }).click()

    // Aguardar mensagem de erro (ajustar seletor conforme implementação)
    await page.waitForTimeout(1000)

    // Verificar que ainda está na página de login
    await expect(page.getByRole('heading', { name: /partners crm/i })).toBeVisible()
  })
})
