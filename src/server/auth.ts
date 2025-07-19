import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";
import { nanoid } from "nanoid";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verification,
    },
  }),

  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
  secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET,

  user: {
    modelName: "user",
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
      },
      twoFactorEnabled: {
        type: "boolean",
        defaultValue: false,
      },
    },
    changeEmail: {
      enabled: true,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
    cookieName: "nutricoach-session",
  },

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({
      user,
      url,
    }: {
      user: unknown;
      url: string;
    }) => {
      console.log("Password reset email", { user, url });
    },
    sendVerificationEmail: async ({
      user,
      url,
    }: {
      user: unknown;
      url: string;
    }) => {
      console.log("Verification email", { user, url });
    },
  },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      scopes: ["user:email"],
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scopes: ["email", "profile"],
    },
  },

  rateLimit: {
    window: 60,
    max: 5,
    storage: "memory",
    customRules: {
      login: {
        window: 60 * 5,
        max: 5,
      },
      signup: {
        window: 60 * 60,
        max: 3,
      },
    },
  },

  trustedOrigins:
    process.env.NODE_ENV === "production"
      ? [process.env.NEXT_PUBLIC_APP_URL!]
      : ["http://localhost:3000"],

  advanced: {
    cookiePrefix: "nutricoach",
    database: {
      generateId: () => nanoid(),
    },
    crossSubDomainCookies: {
      enabled: false,
    },
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  plugins: [],

  onError: async (
    error: { message: string; code?: string },
    request: Request
  ) => {
    await db.insert(schema.auditLogs).values({
      id: nanoid(),
      action: "auth_error",
      entityType: "auth",
      metadata: {
        error: error.message,
        code: error.code,
        path: request.url,
      },
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return {
      error: {
        message:
          process.env.NODE_ENV === "production"
            ? "Authentication error occurred"
            : error.message,
        code: error.code,
      },
    };
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
