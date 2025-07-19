# Project Structure and Code Organization

This document outlines the architectural patterns and code organization for NutriCoach v2, following Next.js 15.4.1 best practices and feature-based modular architecture.

## Overview

NutriCoach uses a **feature-based modular architecture** that organizes code by business domains rather than technical layers. This promotes:

- Clear separation of concerns
- Enhanced maintainability
- Improved developer experience
- Type safety throughout the codebase

## Directory Structure

```
/src
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # Authentication routes group
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── (dashboard)/       # Protected routes group
│   │   ├── dashboard/
│   │   ├── meals/
│   │   ├── profile/
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/[...all]/route.ts  # Better Auth handler
│   │   └── trpc/[trpc]/route.ts    # tRPC handler
│   └── layout.tsx         # Root layout
├── modules/               # Feature modules
│   ├── auth/             # Authentication module
│   ├── meals/            # Meal tracking module
│   ├── nutrition/        # Nutrition analysis module
│   └── user/             # User management module
├── components/           # Shared components
│   ├── ui/              # Base UI components (Tailwind)
│   ├── forms/           # Form components (React Hook Form)
│   └── layouts/         # Layout components
├── server/              # Server-side code
│   ├── auth.ts          # Better Auth instance
│   ├── db/
│   │   ├── schema/      # Drizzle schemas
│   │   ├── migrations/  # Database migrations
│   │   └── index.ts     # Database connection
│   └── trpc/
│       ├── router.ts    # Root tRPC router
│       ├── context.ts   # tRPC context
│       └── procedures.ts # Base procedures
├── lib/                 # Utilities and configs
│   ├── auth-client.ts   # Better Auth client
│   ├── trpc-client.ts   # tRPC client
│   └── utils/
├── hooks/               # Global React hooks
├── types/               # Global TypeScript types
└── config/              # Configuration files
    ├── site.ts
    └── env.ts
```

## Feature Module Structure

Each feature module follows a consistent structure that separates concerns and promotes reusability:

```
modules/meals/
├── hooks/              # Feature-specific React hooks
│   ├── use-meals.ts   # Data fetching hooks
│   └── use-meal-form.ts # Form management hooks
├── schemas.ts         # Zod validation schemas
├── types.ts           # TypeScript interfaces
├── server/            # Server-side code
│   ├── router.ts      # tRPC router definition
│   ├── procedures.ts  # tRPC procedures
│   └── service.ts     # Business logic
├── ui/                # Client components
│   ├── components/    # Feature components
│   │   ├── meal-card.tsx
│   │   └── meal-form.tsx
│   └── views/         # Page components
│       ├── meal-list.tsx
│       └── meal-detail.tsx
└── utils/             # Module utilities
    └── meal-parser.ts # Meal parsing logic
```

### Module Organization Principles

1. **Separation of Concerns**
   - Server code is isolated in `/server`
   - Client code is in `/ui`
   - Shared logic in `/utils`

2. **Type Safety**
   - Schemas define validation rules
   - Types are inferred from schemas
   - End-to-end type safety with tRPC

3. **Reusability**
   - Hooks encapsulate stateful logic
   - Components are pure and testable
   - Services contain business logic

- **schemas.ts**: Data validation schemas (e.g., Zod, Yup)
- **types.ts**: TypeScript interfaces and type definitions
- **server/**: Server-side logic, API handlers, database queries
- **ui/**: All client-side code including components and views

## File Naming Conventions

Consistent naming improves code navigation and maintainability:

- **Components**: `kebab-case.tsx` (e.g., `user-profile.tsx`)
- **Views**: `kebab-case-view.tsx` (e.g., `dashboard-view.tsx`)
- **Hooks**: `use-kebab-case.ts` (e.g., `use-auth-state.ts`)
- **API Procedures**: `procedures.ts` or `[feature].procedures.ts`
- **Schemas**: `schemas.ts` or `[entity].schema.ts`
- **Types**: `types.ts` or `[entity].types.ts`
- **Utils**: `kebab-case.util.ts` (e.g., `date-formatter.util.ts`)

## Import Patterns

### Path Aliases

Configure path aliases in `tsconfig.json` for cleaner imports:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/modules/*": ["./src/modules/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  }
}
```

### Import Order

Maintain consistent import ordering:

```typescript
// 1. External dependencies
import { useState } from "react";
import { z } from "zod";

// 2. Internal aliases
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

// 3. Relative imports
import { UserForm } from "./components/user-form";
import type { User } from "./types";
```

## Server vs Client Code Separation

### Server-Only Code

Identify server-only code with these patterns:

- Files importing `'server-only'` package
- `/server/` directories within modules
- Database operations and queries
- API route handlers
- Environment variable access (secrets)
- Server-side authentication logic

### Client-Only Code

Mark client components explicitly:

- Files with `'use client'` directive
- `/ui/` directories within modules
- React hooks and state management
- Browser-specific APIs
- Interactive components

### Shared Code

Code that can run on both server and client:

- Type definitions and interfaces
- Validation schemas
- Pure utility functions
- Constants and configurations
- Business logic without side effects

## Best Practices

### 1. Feature-First Organization

Organize code by business features to improve:

- Code discoverability
- Team collaboration
- Feature isolation
- Easier refactoring

### 2. Consistent Module Structure

Every module should follow the same pattern to:

- Reduce cognitive load
- Simplify onboarding
- Enable code generation
- Improve maintainability

### 3. Clear Boundaries

Maintain clear separation between:

- Features (horizontal separation)
- Layers (vertical separation)
- Server and client code
- Public and private APIs

### 4. Type Safety

Leverage TypeScript throughout:

- Strict mode configuration
- Explicit return types
- Proper generic constraints
- Validation at boundaries

### 5. Progressive Disclosure

Structure modules from high-level to detailed:

- Views → Components → Hooks
- Public API → Implementation
- Types → Logic → UI

## Environment Variables

### Organization

Structure environment variables by purpose:

```bash
# Database
DATABASE_URL=
DATABASE_POOL_SIZE=

# Authentication
AUTH_SECRET=
OAUTH_CLIENT_ID=
OAUTH_CLIENT_SECRET=

# External APIs
API_KEY=
API_ENDPOINT=

# Feature Flags
NEXT_PUBLIC_FEATURE_X_ENABLED=

# Public Configuration
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_API_URL=
```

### Security Considerations

- **Server-only**: Never prefix sensitive variables with `NEXT_PUBLIC_`
- **Client-safe**: Only `NEXT_PUBLIC_*` variables are exposed to the browser
- **Type safety**: Create typed environment variable schemas
- **Validation**: Validate required variables at startup

### Access Patterns

```typescript
// Server-side
const apiKey = process.env.API_KEY;

// Client-side (only NEXT_PUBLIC_*)
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

// With validation
const env = validateEnv({
  DATABASE_URL: z.string().url(),
  API_KEY: z.string().min(1),
});
```

## Scaling Considerations

As the application grows:

1. **Module Splitting**: Break large modules into sub-modules
2. **Shared Modules**: Extract common functionality
3. **Package Organization**: Consider monorepo for very large apps
4. **Code Generation**: Use tools to scaffold consistent modules
5. **Documentation**: Maintain architecture decision records (ADRs)

This structure provides a solid foundation that scales from small prototypes to large enterprise applications while maintaining clarity and developer productivity.
