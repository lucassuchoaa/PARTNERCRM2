# Como Fazer Deploy no Replit

## ⚠️ IMPORTANTE: Diferença entre Dev e Deploy

- **Servidor Local (Dev)**: Roda ao clicar no botão "Run" - **NÃO é público**
- **Deploy (Produção)**: Versão publicada que as pessoas acessam - **É público**

## Passos para Deploy no Replit:

### 1. Parar o servidor local (se estiver rodando)
- Clique no botão "Stop" no topo

### 2. Fazer o Deploy
- Clique no botão **"Deploy"** no topo da tela do Replit
- Ou vá em: **Tools → Deployments**

### 3. Criar/Atualizar o deployment
- Se for a primeira vez: **"Create deployment"**
- Se já existe: **"Redeploy"** ou **"Deploy latest version"**

### 4. Aguardar o build
- O Replit vai executar `npm run build`
- Depois vai executar `npm run start`
- Aguarde 2-5 minutos

### 5. Acessar a URL de produção
- Após o deploy, clique em **"Open"** ao lado do deployment
- A URL será algo como: `https://seu-projeto.repl.co`

## Como Verificar se Funcionou:

1. Acesse a URL de produção (não o webview do Dev)
2. Faça login com um usuário gerente:
   - **Email**: lucas.uchoa@somapay.com.br
   - **Senha**: [sua senha]

3. No dashboard, você **DEVE VER**:
   - Card azul "Recrute Novos Parceiros"
   - Link: `https://seu-projeto.repl.co/#gerente/lucas`
   - Estatísticas: Total, Pendentes, Aprovados, Rejeitados

## Se ainda não aparecer:

### Opção 1: Limpar cache do navegador
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### Opção 2: Verificar se o usuário tem manager_slug
Execute no Shell do Replit:
```bash
PGPASSWORD='npg_tQTsRLA9yFr5' psql postgresql://neondb_owner:npg_tQTsRLA9yFr5@ep-snowy-moon-ah9gkdw9.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require -c "SELECT name, email, role, manager_slug FROM users WHERE email = 'SEU-EMAIL@AQUI';"
```

### Opção 3: Verificar logs do deployment
- Vá em Tools → Deployments
- Clique no deployment ativo
- Veja os logs para encontrar erros

## Usuários de Teste:

Todos esses gerentes já têm `manager_slug` configurado:

| Nome | Email | Slug |
|------|-------|------|
| lucas | lucas.uchoa@somapay.com.br | lucas |
| Ana Costa | ana.costa@somapay.com.br | ana-costa |
| Roberto Lima | roberto.lima@somapay.com.br | roberto-lima |
| gerente | gerente@gmail.com | gerente |
| gerente1 | gerente1@gmail.com | gerente1 |

---

**Status atual**: ✅ Código commitado e pronto para deploy
**Próximo passo**: Fazer deploy no Replit usando os passos acima
