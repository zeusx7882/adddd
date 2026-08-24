# Free Drop Keys — Admin Panel

Painel administrativo para geração e gerenciamento de activation keys de jogos, com autenticação Discord OAuth2.

## Configuração do Discord Developer Portal

1. Acesse https://discord.com/developers/applications
2. Selecione a aplicação **1540905020793290752**
3. Vá em **OAuth2 → General**
4. Em **Redirects**, adicione EXATAMENTE:
   ```
   https://laucherfreedrop.shardweb.app/api/auth/callback/launcher
   https://laucherfreedrop.shardweb.app/api/auth/callback/discord
   ```
5. Em **OAuth2 → Client Secret**, clique em **Reset Secret** para gerar um novo segredo (o anterior foi exposto e deve ser revogado)
6. Copie o novo **Client Secret** para a variável `DISCORD_CLIENT_SECRET`

## Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | PostgreSQL. Use o **mesmo valor** no admin e na API |
| `NEXTAUTH_URL` | URL pública do painel (ex: `https://laucherfreedrop.shardweb.app`) |
| `NEXTAUTH_SECRET` | Gere com: `openssl rand -base64 32` |
| `DISCORD_CLIENT_ID` | `1540905020793290752` |
| `DISCORD_CLIENT_SECRET` | Gere novo no Discord Developer Portal |
| `ADMIN_DISCORD_IDS` | Discord IDs dos admins separados por vírgula |
| `NEXT_PUBLIC_API_BASE_URL` | `https://byzeuskeys.shardweb.app` |

## Deploy na Shard Cloud

### Configuração recomendada

- **Linguagem**: Node.js
- **Arquivo de entrada**: `index.js`
- **Memória**: 2048 MB (mínimo para o build)
- **NÃO** use rótulos no comando (não escreva `Build:`/`Start:` no campo).

### Se houver Build/Start separados (preferido)

```
Build command: npm run build
Start command: npm start
```

### Se houver apenas UM comando de inicialização (Shard com campo único)

```
npm start
```

`npm start` usa `index.js` e:
- inicia o Next em `0.0.0.0:$PORT`;
- só roda build em runtime se `.next/BUILD_ID` não existir (idempotente);
- evita rebuild desnecessário em restarts do mesmo ambiente.

> Se sua plataforma já executa build em etapa separada, mantenha isso (mais rápido e estável).

### Variável de ambiente adicional (build com 2048 MB)

```
NODE_OPTIONS=--max-old-space-size=1536
```

> **Importante**: O script `npm run build` já executa `prisma generate && next build`.  
> Use `npx prisma db push` **somente** com `DATABASE_URL` configurada e apontando para o **mesmo banco da API**.

## Banco de Dados (Prisma)

```bash
# Gerar cliente Prisma
npx prisma generate

# Aplicar schema ao banco (sem destruir dados) - somente com DATABASE_URL correta
npx prisma db push

# Visualizar banco de dados
npx prisma studio
```

## Desenvolvimento local

```bash
npm install
cp .env.example .env
# Edite .env com suas configurações
npx prisma generate
npx prisma db push
npm run dev
```

### Comandos para build/deploy (Windows CMD e Shard Cloud)

```cmd
npm install
npx prisma generate
npm run build
npm start
```

## Troubleshooting

### OUT_OF_MEMORY durante build

- Aumente a memória para **2048 MB** ou mais
- Adicione `NODE_OPTIONS=--max-old-space-size=1536` nas variáveis de ambiente
- Use `npm run build` (o script já gera Prisma Client antes do `next build`)

### 502 Bad Gateway

- Verifique se o build foi concluído com `✓ Compiled successfully`
- Em campo único da Shard, use apenas `npm start` (não `npm run build && npm start`)
- Verifique se `DATABASE_URL` está configurado corretamente
- Teste `/api/health` para confirmar processo ativo sem expor secrets

### Acesso negado no login

- Verifique `ADMIN_DISCORD_IDS` com seu Discord ID (encontre em Discord → Configurações → Avançado → Modo Desenvolvedor → clique com botão direito no seu avatar)
- Certifique-se que os Redirect URIs estão corretos no Discord Developer Portal

### Erro ao carregar jogos em `/dashboard/games`

- Esse erro normalmente indica problema de sessão/admin ou banco desatualizado.
- Confirme que o usuário logado está listado em `ADMIN_DISCORD_IDS` (ou `ADMIN_DISCORD_ID` para compatibilidade).
- Confirme `DATABASE_URL` apontando para o mesmo banco usado pela API externa.
- Aplique o schema no banco antes do deploy final:
  ```bash
  npx prisma generate
  npx prisma db push
  ```
- A rota `/api/games` retorna mensagens de erro detalhadas (sem secrets) para facilitar diagnóstico.

## OAuth2 do Launcher

O launcher desktop usa um fluxo de autenticação separado:

1. Launcher abre o navegador com URL OAuth2 do Discord
2. Usuário autoriza
3. Discord redireciona para `/api/auth/callback/launcher?code=...&state=...`
4. O endpoint troca o código por token e armazena temporariamente (5 min) na memória
5. Launcher faz polling em `/api/launcher/auth-status?state=...` a cada 2 segundos
6. Quando disponível, retorna o token e apaga o registro

> **Nota**: O armazenamento em memória não persiste entre reinicializações do servidor. Em produção com múltiplas instâncias, use Redis ou banco de dados. Documente isso no seu setup.

## Rate Limiting

A geração de keys tem limite de 10 requisições por minuto por admin (implementado em memória, sem Redis). Este limite se reinicia ao reiniciar o servidor.

## Segurança

- Nunca commite o arquivo `.env`
- Nunca exponha `DATABASE_URL`, `NEXTAUTH_SECRET` ou `DISCORD_CLIENT_SECRET`
- Todas as rotas admin verificam autenticação no servidor
- Logs de auditoria são salvos no banco para criação/exclusão de keys
