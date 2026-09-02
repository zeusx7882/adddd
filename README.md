# Free Drop Keys — Admin Panel

Painel administrativo para geração e gerenciamento de activation keys de jogos, com autenticação Discord OAuth2.

## Persistência e compatibilidade com a API externa (byzeuskeys)

Este repositório contém **apenas o painel admin**. A geração de keys grava diretamente na tabela
`activation_keys` (modelo Prisma `ActivationKey`) do banco apontado por `DATABASE_URL`:

| Campo | Tipo | Regra |
|---|---|---|
| `key` | `String @unique` | sempre `key.trim().toUpperCase()` antes de persistir |
| `appId` | `String` | obrigatório, sempre salvo/retornado como `string` (mesmo se o `Game.appId` vier numérico) |
| `gameName` | `String?` | opcional |
| `used` | `Boolean` | default `false` |
| `usedBy` | `String?` | `null` na criação |
| `usedAt` | `DateTime?` | `null` na criação |
| `createdAt` | `DateTime` | `now()` |

A criação é feita em uma transação (`prisma.$transaction`) que insere via `createMany` e em
seguida busca os registros criados, para poder devolvê-los completos na resposta do endpoint
(`POST /api/keys/generate` retorna `{ success, generated, keys, records }`).

### Limitação conhecida: `/api/keys/redeem` e `/api/keys/activated`

Os endpoints `POST /api/keys/redeem` e `GET /api/keys/activated?discordId=...` mencionados nos
requisitos **pertencem à API externa `https://byzeuskeys.shardweb.app`, que não faz parte deste
repositório**. Não foi possível localizar sua implementação, nem existe forma segura de
inspecioná-la ou chamá-la a partir deste ambiente sandbox (sem credenciais/rede liberada para o
host de produção). Por isso, **não foi inventada uma implementação desses endpoints aqui**.

O que este PR garante, do lado do admin, para que esses endpoints (quando implementados na API
externa) consigam funcionar corretamente:

- toda key gerada é persistida em `activation_keys` já em UPPERCASE/trim, com `appId` como
  `string`, e `used=false` / `usedBy=null` / `usedAt=null` — o formato que uma implementação de
  `redeem`/`activated` precisa para localizar e marcar a key como usada;
- o admin usa o **mesmo `DATABASE_URL`** configurado na API (ver seção de variáveis abaixo);
- os proxies existentes (`POST /api/keys/check` e `POST /api/keys/validate`, em
  `lib/api-client.ts`) já normalizam a key com `trim()` antes de enviar à API externa;
- uma rota de diagnóstico admin-only (`GET /api/keys/diagnostics`) permite conferir, sem expor
  segredos, quantas keys existem, quantas estão disponíveis/usadas e a última gerada — útil para
  confirmar que o admin e a API estão de fato lendo o mesmo banco.

Exemplos de verificação manual (apenas ilustrativos — **não foram executados** neste ambiente por
falta de acesso à API/banco de produção; substitua pelos seus valores reais e nunca cole
`DATABASE_URL` ou tokens em tickets/PRs):

```sql
-- Confirma que a key foi persistida em UPPERCASE com os defaults corretos
SELECT key, "appId", used, "usedBy", "usedAt", "createdAt"
FROM activation_keys
WHERE key = 'REDEADR-XXXX-XXXX';
```

```bash
# Ilustrativo — requer que a API externa exponha /api/keys/redeem
curl -v -X POST "https://byzeuskeys.shardweb.app/api/keys/redeem" \
  -H "Content-Type: application/json" \
  -d '{"key":"SUA_KEY","discordId":"SEU_DISCORD_ID"}'
```

Se o `curl` acima retornar `500` ou corpo vazio, o próximo passo é revisar os logs da própria API
externa (fora deste repositório) — o painel admin não tem acesso a esses logs.

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
- `GET /api/keys/diagnostics` (admin-only) resume a saúde da tabela `activation_keys` (contagens
  de total/disponíveis/usadas, breakdown por jogo, última key gerada) sem nunca retornar
  `DATABASE_URL`, tokens ou outras credenciais
