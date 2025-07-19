# Authentication Implementation with Better Auth

This document outlines authentication patterns using Better Auth v1.2.9, including setup, middleware, session management, and integration with Next.js 15.

## Core Configuration

### Server Setup

Configure Better Auth with database sessions and multiple providers:

```typescript
// src/server/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  
  // Email/password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  
  // Social providers
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  
  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes cache
    },
  },
  
  // Custom fields
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
      },
    },
  },
});

// Type exports
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
```

### Client Setup

Configure the auth client with type safety:

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import type { auth } from "@/server/auth";

export const authClient = createAuthClient<typeof auth>({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
});

// Export hooks and utilities
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
```

## Authentication Flows

### Sign Up with Email

```typescript
// src/modules/auth/schemas.ts
import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// src/modules/auth/ui/components/sign-up-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema } from "../../schemas";
import { signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function SignUpForm() {
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    try {
      const { error } = await signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      if (error) {
        if (error.code === "USER_ALREADY_EXISTS") {
          form.setError("email", {
            type: "manual",
            message: "Email already in use",
          });
        } else {
          form.setError("root", {
            type: "manual",
            message: error.message,
          });
        }
        return;
      }

      router.push("/verify-email");
    } catch (error) {
      form.setError("root", {
        type: "manual",
        message: "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### Sign In with Session Management

```typescript
// src/modules/auth/ui/components/sign-in-form.tsx
"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";

export function SignInForm() {
  const [rememberMe, setRememberMe] = useState(false);

  const handleEmailSignIn = async (data: SignInData) => {
    const { error } = await signIn.email({
      email: data.email,
      password: data.password,
      rememberMe, // Extends session duration
    });

    if (error) {
      if (error.code === "INVALID_CREDENTIALS") {
        // Handle invalid credentials
      } else if (error.code === "TOO_MANY_REQUESTS") {
        // Handle rate limiting
      }
    }
  };

  const handleSocialSignIn = async (provider: "github" | "google") => {
    await signIn.social({
      provider,
      callbackURL: "/dashboard",
    });
  };

  return (
    // Form implementation
  );
}
```

## Middleware & Protection

### Next.js Middleware

Protect routes at the edge:

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";

export async function middleware(request: NextRequest) {
  // Check session (Next.js 15.2.0+)
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard");
  const isAuthRoute = ["/login", "/signup"].includes(request.nextUrl.pathname);

  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
```

### Server Components

Access session in React Server Components:

```typescript
// src/app/dashboard/page.tsx
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}!</h1>
      <p>Email: {session.user.email}</p>
    </div>
  );
}
```

### Client Components

Use session hook in client components:

```typescript
// src/modules/user/ui/components/user-menu.tsx
"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function UserMenu() {
  const router = useRouter();
  const { data: session, isPending, error } = useSession();

  if (isPending) return <div>Loading...</div>;
  if (!session) return null;

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div>
      <span>{session.user.email}</span>
      <button onClick={handleSignOut}>Sign Out</button>
    </div>
  );
}
```

## Advanced Features

### Multi-Session Support

Enable users to have multiple active sessions:

```typescript
// src/server/auth.ts
import { multiSession } from "better-auth/plugins";

export const auth = betterAuth({
  // ... other config
  plugins: [
    multiSession({
      maximumSessions: 5,
    }),
  ],
});

// Client usage
import { multiSessionClient } from "better-auth/client/plugins";

const authClient = createAuthClient({
  plugins: [multiSessionClient()],
});

// List all sessions
const sessions = await authClient.multiSession.listDeviceSessions();

// Revoke specific session
await authClient.multiSession.revoke({
  sessionToken: "session-token-to-revoke",
});
```

### Custom Session Data

Extend session with additional data:

```typescript
// src/server/auth.ts
import { customSession } from "better-auth/plugins";

export const auth = betterAuth({
  // ... other config
  plugins: [
    customSession(async ({ user, session }) => {
      const profile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, user.id),
      });

      return {
        user: {
          ...user,
          hasCompletedOnboarding: !!profile,
        },
        session,
      };
    }),
  ],
});
```

### Session Freshness

Require recent authentication for sensitive operations:

```typescript
// Server-side check
export const deleteAccountProcedure = protectedProcedure
  .use(async (opts) => {
    const { ctx } = opts;
    
    // Check if session is fresh (created within last 5 minutes)
    const sessionAge = Date.now() - ctx.session.session.createdAt.getTime();
    const isFresh = sessionAge < 5 * 60 * 1000;
    
    if (!isFresh) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Please re-authenticate to perform this action",
      });
    }
    
    return opts.next();
  })
  .mutation(async ({ ctx }) => {
    // Delete account logic
  });
```

### Rate Limiting

Implement rate limiting for auth endpoints:

```typescript
// src/server/auth.ts
export const auth = betterAuth({
  // ... other config
  rateLimit: {
    window: 60, // 1 minute
    max: 5, // 5 attempts
    storage: "memory", // or "redis" for distributed systems
  },
});
```

## Security Best Practices

1. **Environment Variables**: Store all secrets in `.env.local`
   ```env
   AUTH_SECRET=your-secret-key
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   ```

2. **CSRF Protection**: Better Auth includes built-in CSRF protection

3. **Secure Cookies**: Automatically handled with secure flags in production

4. **Password Requirements**: Enforce strong passwords with Zod validation

5. **Session Security**: Use cookie caching for performance without sacrificing security

## Testing

### Mock Authentication in Tests

```typescript
// src/test/utils/auth.ts
import { createAuthClient } from "better-auth/client";

export const mockAuthClient = createAuthClient({
  baseURL: "http://localhost:3000",
  // Mock session for testing
  session: {
    user: {
      id: "test-user-id",
      email: "test@example.com",
      name: "Test User",
    },
    session: {
      id: "test-session-id",
      userId: "test-user-id",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  },
});
```