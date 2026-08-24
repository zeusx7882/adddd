# Free Drop Keys — Admin Panel

Painel administrativo para cadastro de jogos e geração de keys. Acesso exclusivo via Discord OAuth2.

## Stack

- Next.js 16 (App Router) + TypeScript
- TailwindCSS
- NextAuth.js (Discord provider)
- Prisma + PostgreSQL (servidor/admin apenas)
- API externa de keys: `https://byzeuskeys.shardweb.app`

## Arquitetura de segurança

| Camada | Acesso ao banco | Acesso à API externa |
|---|---|---|
| Componentes client-side (`"use client"`) | ❌ Nunca | Via rotas internas `/api/keys/*` |
| Rotas de API Next.js (`/api/games`, `/api/keys/generate`) | ✅ Servidor apenas | — |
| `/api/keys/check` e `/api/keys/validate` | ❌ | ✅ Proxy para API externa |

A variável `DATABASE_URL` **nunca** é exposta ao navegador. Apenas `NEXT_PUBLIC_API_BASE_URL` (sem segredo) pode aparecer no bundle cliente.

## Endpoints externos utilizados

| Método | Endpoint | Ação |
|---|---|---|
| `POST` | `/api/keys/check` | Consulta key **sem consumir** |
| `POST` | `/api/keys/validate` | Valida e **consome** key |

Body de ambos: `{ "key": "..." }`

## Limitação administrativa (documentada)

O painel ainda usa Prisma/PostgreSQL no servidor para cadastrar jogos e gerar keys, pois a API externa (`byzeuskeys.shardweb.app`) não expõe endpoints administrativos de criação de jogos ou geração de keys. Enquanto esses endpoints não existirem na API externa, as operações administrativas continuam no banco local — **exclusivamente no servidor, sem exposição ao browser**. Os únicos endpoints de keys que o browser pode acionar são `/api/keys/check` e `/api/keys/validate`, que fazem proxy para a API externa.

Para remover o Prisma completamente, a API externa precisaria disponibilizar:
- `POST /api/admin/games` — cadastrar jogo
- `GET /api/admin/games` — listar jogos
- `POST /api/admin/keys/generate` — gerar keys

## Configuração

### 1) Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha para desenvolvimento local:

```bash
cp .env.example .env.local
```

| Variável | Valor para produção (Shard Cloud) |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://byzeuskeys.shardweb.app` |
| `DATABASE_URL` | String PostgreSQL **apenas no servidor** (admin) |
| `NEXTAUTH_URL` | `https://laucherfreedrop.shardweb.app` |
| `NEXTAUTH_SECRET` | Gere um segredo **novo e privado** (`openssl rand -base64 32`) |
| `DISCORD_CLIENT_ID` | Client ID do app Discord |
| `DISCORD_CLIENT_SECRET` | Client Secret do app Discord |
| `LAUNCHER_DISCORD_REDIRECT_URI` | Opcional. Padrão: `https://laucherfreedrop.shardweb.app/api/auth/callback/launcher` |
| `ADMIN_DISCORD_ID` | Discord ID do administrador autorizado |

> Não comite `.env`, senhas ou tokens. Use apenas placeholders no `.env.example`.
>
> **Segurança:** se algum `DISCORD_CLIENT_SECRET` já foi exposto em chat, README, logs ou prints, revogue-o e gere outro no Discord Developer Portal antes do deploy.

### 2) Configurar Discord OAuth2

No [Discord Developer Portal](https://discord.com/developers/applications), configure o redirect URI de produção:

`https://laucherfreedrop.shardweb.app/api/auth/callback/discord`

Para o launcher desktop, adicione também:

`https://laucherfreedrop.shardweb.app/api/auth/callback/launcher`

### 3) Instalar dependências (local)

```bash
npm install
```

### 4) Banco (somente servidor/admin)

```bash
npx prisma generate
npx prisma db push
```

### 5) Desenvolvimento local

```bash
npm run dev
```

---

## Deploy na Shard Cloud (`https://laucherfreedrop.shardweb.app`)

### O que deve ir no ZIP

Envie os fontes do projeto com os arquivos de runtime/configuração, incluindo:

- `index.js` (Entry Point)
- `package.json` e `package-lock.json`
- `app/`, `components/`, `lib/`, `public/`, `types/`
- `prisma/`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, etc.

Se a Shard Cloud fizer instalação/build no servidor, **não envie**:

- `node_modules/`
- `.next/`
- `.env` real com segredos

### Campos do painel (preencher exatamente)

- **Entry Point:** `index.js`
- **Install command:** `npm install --no-audit --no-fund`
- **Build command:** `npm run build`
- **Start command:** `npm start`

O script `start` usa `index.js` para iniciar `next start` em produção, ouvindo em `0.0.0.0` e respeitando `PORT` da plataforma (fallback seguro: `3000`).

### Variáveis de ambiente na Shard Cloud

```env
NEXTAUTH_URL=https://laucherfreedrop.shardweb.app
NEXTAUTH_SECRET=<gere-um-segredo-novo-e-privado>
DISCORD_CLIENT_ID=<seu-client-id>
DISCORD_CLIENT_SECRET=<seu-client-secret>
LAUNCHER_DISCORD_REDIRECT_URI=https://laucherfreedrop.shardweb.app/api/auth/callback/launcher
ADMIN_DISCORD_ID=<seu-discord-id-admin>
NEXT_PUBLIC_API_BASE_URL=https://byzeuskeys.shardweb.app
DATABASE_URL=<somente-se-o-painel-admin-usar-banco-no-servidor>
```

> `NEXTAUTH_SECRET` deve ser novo e privado.  
> Não exponha `DATABASE_URL`, `DISCORD_CLIENT_SECRET` ou outros segredos no cliente.
> Se o `DISCORD_CLIENT_SECRET` já tiver sido exposto, revogue/rotacione no Discord Developer Portal antes de subir a aplicação.

### Configuração exata na Shard Cloud

Use exatamente:

- **Entry Point:** `index.js`
- **Install command:** `npm install --no-audit --no-fund`
- **Build command:** `npm run build`
- **Start command:** `npm start`

Cadastre estas variáveis de ambiente:

```env
NEXTAUTH_URL=https://laucherfreedrop.shardweb.app
NEXTAUTH_SECRET=<gere-um-segredo-novo-e-privado>
DISCORD_CLIENT_ID=<client-id-do-discord>
DISCORD_CLIENT_SECRET=<client-secret-novo-e-privado>
LAUNCHER_DISCORD_REDIRECT_URI=https://laucherfreedrop.shardweb.app/api/auth/callback/launcher
ADMIN_DISCORD_ID=<discord-id-do-admin>
NEXT_PUBLIC_API_BASE_URL=https://byzeuskeys.shardweb.app
DATABASE_URL=<somente-se-o-painel-admin-usar-banco-no-servidor>
```

No Discord Developer Portal, deixe cadastrados os dois Redirect URIs:

- `https://laucherfreedrop.shardweb.app/api/auth/callback/discord`
- `https://laucherfreedrop.shardweb.app/api/auth/callback/launcher`

---

## OAuth2 do launcher desktop

### Endpoints

#### Callback público

- `GET /api/auth/callback/launcher?code=...&state=...`
- Troca `code` por token em `https://discord.com/api/oauth2/token`
- Não verifica admin e não redireciona para o painel
- Responde HTML simples quando a autenticação termina

#### Polling do launcher

- `GET /api/launcher/auth-status?state=...`
- Sempre responde com headers `no-store`
- Remove o registro temporário após entregar o token

### Fluxo de polling

1. O launcher gera `state` e abre o navegador para o Discord OAuth2.
2. O usuário autoriza.
3. O Discord redireciona para `https://laucherfreedrop.shardweb.app/api/auth/callback/launcher`.
4. O callback troca o `code` por token e salva o resultado temporariamente por 5 minutos.
5. O navegador mostra `✅ Autenticação concluída! Volte para o launcher.`
6. O launcher faz polling em `/api/launcher/auth-status?state=...`.
7. Quando o token estiver disponível, a API responde e apaga o registro.

### Respostas de exemplo

Quando o launcher ainda está aguardando:

```json
{ "status": "pending" }
```

Quando a autenticação já terminou:

```json
{
  "status": "completed",
  "token": {
    "accessToken": "discord-access-token",
    "refreshToken": "discord-refresh-token",
    "expiresIn": 604800
  }
}
```

### Limitação do armazenamento temporário

O fluxo do launcher usa armazenamento temporário **apenas em memória do processo Node.js**, com TTL de 5 minutos e consumo único lógico. Isso simplifica o deploy, mas significa que o token pendente é perdido se o processo reiniciar, escalar horizontalmente para outra instância ou sofrer novo deploy antes de o launcher concluir o polling.

### Troubleshooting de `502 Bad Gateway`

1. Confirme se o processo está online após o deploy.
2. Verifique logs de inicialização: o app deve iniciar com `npm start`.
3. Garanta que o servidor está ouvindo em `0.0.0.0` (já configurado em `index.js`).
4. Garanta que a porta vem de `PORT` da plataforma (não fixar 80 se a plataforma fornecer outra).
5. Confirme que o build (`npm run build`) terminou sem erro antes do start.
6. Se ainda falhar, revise logs da aplicação/proxy da Shard Cloud para conexão recusada ou processo encerrado.

## Comandos úteis

```bash
npm run dev    # Desenvolvimento
npm run build  # Build de produção
npm start      # Produção (via index.js -> next start)
npm run lint   # Lint
npm test       # Testes
```

## Funcionalidades

- **Login** via Discord (somente o admin autorizado)
- **Jogos**: cadastrar e listar jogos com nome e Steam App ID
- **Keys**: gerar de 1 a 100 keys criptograficamente seguras por jogo
- **Check de key**: consulta key na API externa sem consumi-la (`/api/keys/check`)
- **Validação de key**: valida e consome key na API externa (`/api/keys/validate`)
- Proteção de rotas via middleware + verificação server-side
