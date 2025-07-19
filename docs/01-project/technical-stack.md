# Technical Stack

## Core Technologies

### Frontend Framework

- **Next.js 15.4.1** - React framework with App Router
  - Server Components for improved performance
  - Server Actions for form handling
  - Middleware for authentication
  - Built-in optimization features

### Styling

- **Tailwind CSS v4** - Utility-first CSS framework
  - New `@utility` directive for custom utilities
  - Improved theme configuration
  - Vite plugin integration

### Type Safety

- **TypeScript 5.x** - Static type checking
  - Strict mode enabled
  - Path aliases configured
  - Type inference throughout

## Backend & API

### API Layer

- **tRPC v11** - End-to-end typesafe APIs
  - Procedures with input validation
  - Context for authentication
  - Middleware for authorization
  - Error handling with proper codes

### Database

- **Drizzle ORM** - TypeScript-first ORM
  - Type-safe queries
  - Migration management
  - Schema validation
  - Relational queries

### Authentication

- **Better Auth v1.2.9** - Comprehensive auth solution
  - Database sessions
  - Multiple providers support
  - Session management
  - Cookie caching for performance

## Form Management

### Forms

- **React Hook Form** - Performant form library
  - TypeScript support
  - Field-level validation
  - Custom hooks integration

### Validation

- **Zod 3.x** - Schema validation
  - Runtime validation
  - Type inference
  - Composable schemas
  - Integration with React Hook Form

## Development Tools

### Build Tools

- **Vite** - Fast build tool
- **ESLint** - Code linting
- **Prettier** - Code formatting

### Database Tools

- **Drizzle Kit** - Migration CLI
- **Drizzle Studio** - Database GUI

## Infrastructure

### Deployment

- **Vercel** - Hosting platform
  - Edge Functions support
  - Automatic deployments
  - Environment variables

### External Services

- **OpenAI API** - AI-powered meal parsing
- **Nutrition APIs** - Food database integration

## Package Management

```json
{
  "dependencies": {
    "next": "^15.4.1",
    "@trpc/server": "^11.0.0",
    "@trpc/client": "^11.0.0",
    "@trpc/react-query": "^11.0.0",
    "@trpc/next": "^11.0.0",
    "better-auth": "^1.2.9",
    "drizzle-orm": "latest",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "@hookform/resolvers": "^3.x"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "drizzle-kit": "latest",
    "typescript": "^5.x"
  }
}
```
