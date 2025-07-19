import type { auth } from "./auth";

export type Auth = typeof auth;

export interface User {
  id: string;
  email: string;
  name?: string | null;
  emailVerified: boolean;
  image?: string | null;
  role?: string;
  twoFactorEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
  };
  user: User;
}
