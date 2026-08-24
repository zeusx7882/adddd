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

### 1. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | URL pública da API externa (sem segredo) |
| `DATABASE_URL` | Connection string PostgreSQL (servidor apenas) |
| `NEXTAUTH_URL` | URL base da aplicação (ex: `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Segredo aleatório (`openssl rand -base64 32`) |
| `DISCORD_CLIENT_ID` | Client ID do app Discord |
| `DISCORD_CLIENT_SECRET` | Client Secret do app Discord |
| `ADMIN_DISCORD_ID` | Seu Discord ID (único autorizado) |

### 2. Configurar Discord OAuth2

1. Acesse [Discord Developer Portal](https://discord.com/developers/applications)
2. Crie um aplicativo → seção **OAuth2**
3. Adicione redirect URL: `http://localhost:3000/api/auth/callback/discord`
4. Copie Client ID e Client Secret para `.env.local`

### 3. Instalar dependências

```bash
npm install
```

### 4. Banco de dados

```bash
npx prisma generate
npx prisma db push
```

### 5. Executar

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) — será redirecionado para `/login`.

## Comandos

```bash
npm run dev        # Desenvolvimento
npm run build      # Build de produção
npm run lint       # Lint
npx prisma studio  # Interface visual do banco
```

## Funcionalidades

- **Login** via Discord (somente o admin autorizado)
- **Jogos**: cadastrar e listar jogos com nome e Steam App ID
- **Keys**: gerar de 1 a 100 keys criptograficamente seguras por jogo
- **Check de key**: consulta key na API externa sem consumi-la (`/api/keys/check`)
- **Validação de key**: valida e consome key na API externa (`/api/keys/validate`)
- Proteção de rotas via middleware + verificação server-side
