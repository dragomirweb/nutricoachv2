# Local Development Setup

This guide walks through setting up NutriCoach v2 for local development, including all dependencies and configuration.

## Prerequisites

### Required Software

- **Node.js** v20.x or higher (LTS recommended)
- **pnpm** v8.x or higher
- **PostgreSQL** v15.x or higher
- **Redis** v7.x or higher (for background jobs)
- **Git** for version control

### Optional Tools

- **Docker** and **Docker Compose** (for containerized services)
- **TablePlus** or **pgAdmin** (database GUI)
- **RedisInsight** (Redis GUI)
- **ngrok** (for testing webhooks locally)

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/nutricoach-v2.git
cd nutricoach-v2
```

### 2. Install Dependencies

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install project dependencies
pnpm install
```

### 3. Environment Configuration

Create a `.env.local` file from the template:

```bash
cp .env.example .env.local
```

Update the following environment variables:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/nutricoach_dev"

# Authentication
AUTH_SECRET="your-secret-key-here" # Generate with: openssl rand -base64 32

# OAuth Providers (optional for development)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Redis (for background jobs)
REDIS_URL="redis://localhost:6379"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# OpenAI (for AI features)
OPENAI_API_KEY="your-openai-api-key"

# Email (optional for development)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@nutricoach.local"
```

## Database Setup

### Option 1: Local PostgreSQL

1. Install PostgreSQL:

   ```bash
   # macOS with Homebrew
   brew install postgresql@15
   brew services start postgresql@15

   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql-15
   sudo systemctl start postgresql
   ```

2. Create database:

   ```bash
   createdb nutricoach_dev
   ```

3. Run migrations:
   ```bash
   pnpm db:push
   ```

### Option 2: Docker PostgreSQL

1. Start PostgreSQL container:

   ```bash
   docker run --name nutricoach-postgres \
     -e POSTGRES_PASSWORD=password \
     -e POSTGRES_DB=nutricoach_dev \
     -p 5432:5432 \
     -v nutricoach_postgres_data:/var/lib/postgresql/data \
     -d postgres:15-alpine
   ```

2. Run migrations:
   ```bash
   pnpm db:push
   ```

## Redis Setup (for Background Jobs)

### Option 1: Local Redis

```bash
# macOS with Homebrew
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
```

### Option 2: Docker Redis

```bash
docker run --name nutricoach-redis \
  -p 6379:6379 \
  -v nutricoach_redis_data:/data \
  -d redis:7-alpine
```

## Development Workflow

### 1. Start Development Server

```bash
# Start Next.js development server
pnpm dev

# In a separate terminal, start the background job workers
pnpm workers:dev
```

The application will be available at:

- Main app: http://localhost:3000
- API routes: http://localhost:3000/api
- tRPC playground: http://localhost:3000/api/trpc-playground (dev only)

### 2. Database Management

```bash
# Generate migrations after schema changes
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Push schema changes directly (development only)
pnpm db:push

# Open Drizzle Studio (database GUI)
pnpm db:studio
```

### 3. Type Generation

TypeScript types are automatically generated from:

- tRPC routers (automatic inference)
- Database schema (via Drizzle)
- Environment variables (via t3-env)

### 4. Code Quality Tools

```bash
# Run linter
pnpm lint

# Run linter with auto-fix
pnpm lint:fix

# Run type checking
pnpm typecheck

# Run formatter
pnpm format

# Run all checks
pnpm check
```

## Docker Compose Setup

For a complete local environment:

```yaml
# docker-compose.yml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: nutricoach_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025" # SMTP
      - "8025:8025" # Web UI

volumes:
  postgres_data:
  redis_data:
```

Start all services:

```bash
docker-compose up -d
```

## OAuth Setup (Optional)

### GitHub OAuth

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App:
   - Application name: `NutriCoach Dev`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
3. Copy Client ID and Client Secret to `.env.local`

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Client Secret to `.env.local`

## Seeding Test Data

Create a seed script for development:

```typescript
// src/scripts/seed.ts
import { db } from "@/server/db";
import { users, meals, foodItems } from "@/server/db/schema";
import { hash } from "better-auth";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create test user
  const [user] = await db
    .insert(users)
    .values({
      id: "test-user-1",
      email: "test@example.com",
      name: "Test User",
      emailVerified: true,
    })
    .returning();

  // Create password
  await db.insert(accounts).values({
    id: "test-account-1",
    userId: user.id,
    accountId: user.email,
    providerId: "credential",
    password: await hash("password123"),
  });

  // Create sample meals
  const meals = await db
    .insert(meals)
    .values([
      {
        id: "meal-1",
        userId: user.id,
        name: "Breakfast",
        type: "breakfast",
        totalCalories: 450,
        totalProtein: 25,
        totalCarbs: 55,
        totalFat: 15,
      },
      // ... more meals
    ])
    .returning();

  console.log("✅ Seeding complete!");
}

seed().catch(console.error);
```

Run the seed script:

```bash
pnpm tsx src/scripts/seed.ts
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify PostgreSQL is running
   - Check DATABASE_URL format
   - Ensure database exists

2. **Port Conflicts**
   - Change ports in `.env.local` if needed
   - Check for other services using ports 3000, 5432, 6379

3. **TypeScript Errors**
   - Run `pnpm typecheck` to see all errors
   - Restart TS server in VS Code: Cmd+Shift+P > "TypeScript: Restart TS Server"

4. **Module Resolution Issues**
   - Clear Next.js cache: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules pnpm-lock.yaml && pnpm install`

### Debug Mode

Enable debug logging:

```env
# .env.local
DEBUG=app:*
LOG_LEVEL=debug
```

### VS Code Setup

Recommended extensions:

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma (for schema highlighting)
- Thunder Client (API testing)

Settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

## Next Steps

1. Review the [Architecture Documentation](../02-architecture/README.md)
2. Set up your [Testing Environment](./testing-strategy.md)
3. Read the [Best Practices Guide](./best-practices.md)
4. Explore the [Implementation Patterns](../03-implementation/README.md)
