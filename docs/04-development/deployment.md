# Deployment Guide

This guide covers deployment strategies for NutriCoach v2, including production configuration, CI/CD pipelines, and various deployment platforms.

## Deployment Options

### Recommended: Vercel (Next.js Optimized)

Vercel provides the best experience for Next.js applications with:

- Automatic deployments
- Edge functions support
- Built-in analytics
- Preview deployments
- Automatic HTTPS

### Alternative Options

- **Railway** - Simple deployment with PostgreSQL and Redis
- **Fly.io** - Global edge deployment
- **AWS (Amplify/ECS)** - Enterprise scale
- **Google Cloud Run** - Containerized deployment
- **Self-hosted** - VPS or bare metal

## Pre-Deployment Checklist

### 1. Environment Variables

Ensure all production environment variables are set:

```env
# Production .env
NODE_ENV=production

# Database
DATABASE_URL="postgresql://user:pass@host:5432/nutricoach_prod?sslmode=require"

# Authentication
AUTH_SECRET="[generate-with-openssl-rand-base64-32]"

# OAuth (Production URLs)
GITHUB_CLIENT_ID="prod-github-client-id"
GITHUB_CLIENT_SECRET="prod-github-client-secret"
GOOGLE_CLIENT_ID="prod-google-client-id"
GOOGLE_CLIENT_SECRET="prod-google-client-secret"

# Redis
REDIS_URL="rediss://default:password@host:6379"

# Application
NEXT_PUBLIC_APP_URL="https://nutricoach.app"

# External Services
OPENAI_API_KEY="sk-..."
SENTRY_DSN="https://..."
POSTHOG_API_KEY="phc_..."

# Email
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="SG..."
SMTP_FROM="noreply@nutricoach.app"
```

### 2. Database Migrations

```bash
# Run migrations before deployment
pnpm db:migrate

# Verify migrations
pnpm db:studio
```

### 3. Build Optimization

```bash
# Test production build locally
pnpm build
pnpm start

# Analyze bundle size
pnpm analyze
```

## Vercel Deployment

### Initial Setup

1. Install Vercel CLI:

   ```bash
   npm i -g vercel
   ```

2. Link project:

   ```bash
   vercel link
   ```

3. Configure project:

   ```json
   // vercel.json
   {
     "buildCommand": "pnpm build",
     "outputDirectory": ".next",
     "devCommand": "pnpm dev",
     "installCommand": "pnpm install",
     "framework": "nextjs",
     "regions": ["iad1"],
     "functions": {
       "app/api/trpc/[trpc]/route.ts": {
         "maxDuration": 10
       },
       "app/api/jobs/[...path]/route.ts": {
         "maxDuration": 300
       }
     },
     "crons": [
       {
         "path": "/api/cron/daily-summary",
         "schedule": "0 0 * * *"
       }
     ]
   }
   ```

4. Set environment variables:
   ```bash
   vercel env add DATABASE_URL production
   vercel env add AUTH_SECRET production
   # ... add all production variables
   ```

### Deployment Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Deploy specific branch
vercel --prod --scope=your-team
```

### Database Setup (Vercel Postgres)

```bash
# Create Vercel Postgres database
vercel postgres create nutricoach-db

# Link to project
vercel link

# Pull env vars
vercel env pull .env.production.local
```

## Railway Deployment

### Setup with Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add PostgreSQL
railway add postgresql

# Add Redis
railway add redis

# Deploy
railway up
```

### Railway Configuration

```toml
# railway.toml
[build]
builder = "nixpacks"
buildCommand = "pnpm install && pnpm build"

[deploy]
startCommand = "pnpm start"
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "on-failure"
restartPolicyMaxRetries = 10

[[services]]
name = "web"
port = 3000

[[services]]
name = "worker"
startCommand = "pnpm workers:start"
```

## Docker Deployment

### Multi-Stage Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable
RUN corepack prepare pnpm@latest --activate

# Copy dependency files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
RUN corepack enable
RUN corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application
ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose Production

```yaml
# docker-compose.prod.yml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/nutricoach
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped

  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/nutricoach
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=nutricoach
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile

      - run: pnpm typecheck

      - run: pnpm lint

      - run: pnpm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile

      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Run Migrations
        run: |
          pnpm db:migrate
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
```

### Preview Deployments

```yaml
# .github/workflows/preview.yml
name: Preview Deployment

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  deploy-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile

      - name: Deploy to Vercel
        id: deploy
        run: |
          DEPLOYMENT_URL=$(vercel deploy --token=${{ secrets.VERCEL_TOKEN }} --yes)
          echo "url=$DEPLOYMENT_URL" >> $GITHUB_OUTPUT

      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview deployment ready at: ${{ steps.deploy.outputs.url }}'
            })
```

## Production Configuration

### Next.js Configuration

```typescript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,

  images: {
    domains: ["images.nutricoach.app"],
    formats: ["image/avif", "image/webp"],
  },

  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["lucide-react", "@headlessui/react"],
  },

  headers: async () => [
    {
      source: "/:path*",
      headers: [
        {
          key: "X-DNS-Prefetch-Control",
          value: "on",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-XSS-Protection",
          value: "1; mode=block",
        },
        {
          key: "Referrer-Policy",
          value: "origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ],
    },
  ],

  async rewrites() {
    return [
      {
        source: "/api/health",
        destination: "/api/monitoring/health",
      },
    ];
  },
};

export default nextConfig;
```

### Security Headers

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel-insights.com; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' blob: data: https:; " +
      "font-src 'self'; " +
      "connect-src 'self' https://api.openai.com wss://; " +
      "frame-ancestors 'none';"
  );

  return response;
}
```

## Monitoring & Observability

### Health Check Endpoint

```typescript
// app/api/monitoring/health/route.ts
import { db } from "@/server/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Check database
    await db.execute(sql`SELECT 1`);

    // Check Redis
    const redis = await import("@/server/redis");
    await redis.ping();

    return Response.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",
    });
  } catch (error) {
    return Response.json(
      {
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
```

### Error Tracking (Sentry)

```typescript
// app/layout.tsx
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Analytics (PostHog)

```typescript
// providers/analytics.tsx
"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
      capture_pageview: false, // Disable automatic pageview capture, we'll do it manually
    });
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
```

## Post-Deployment

### 1. Database Migrations

```bash
# Run any pending migrations
pnpm db:migrate --env production

# Verify migrations
pnpm db:studio --env production
```

### 2. DNS Configuration

```
# A Records
@ -> 76.76.21.21
www -> 76.76.21.21

# CNAME (if using subdomain)
app -> cname.vercel-dns.com
```

### 3. SSL Certificate

Vercel and most platforms handle SSL automatically. For self-hosted:

```bash
# Using Let's Encrypt
certbot --nginx -d nutricoach.app -d www.nutricoach.app
```

### 4. Monitoring Setup

- Set up Vercel Analytics
- Configure Sentry alerts
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Configure log aggregation (Datadog, LogDNA)

## Rollback Strategy

### Vercel Rollback

```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback <deployment-url>
```

### Database Rollback

```bash
# Rollback last migration
pnpm db:rollback

# Rollback to specific version
pnpm db:rollback --to 20240115120000_add_meals_table
```

### Emergency Procedures

1. **Application Issues**
   - Rollback deployment immediately
   - Check error logs in Sentry
   - Review recent commits

2. **Database Issues**
   - Stop write operations
   - Backup current state
   - Rollback migrations
   - Restore from backup if needed

3. **Performance Issues**
   - Scale up instances
   - Check database connections
   - Review Redis memory usage
   - Enable emergency caching
