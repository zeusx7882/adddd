# Free Drop Keys — Admin Panel

Painel administrativo para cadastro de jogos e geração de keys. Acesso exclusivo via Discord OAuth2.

## Stack

- Next.js 14+ (App Router) + TypeScript
- TailwindCSS
- NextAuth.js (Discord provider)
- Prisma + PostgreSQL

## Configuração

### 1. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL |
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
- Proteção de rotas via middleware + verificação server-side
