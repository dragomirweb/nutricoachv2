import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  updateUser,
  changeEmail,
  changePassword,
  deleteUser,
  listSessions,
  revokeSession,
  revokeSessions,
  revokeOtherSessions,
} = authClient;

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireFreshAuth(maxAge = 5 * 60 * 1000) {
  const session = await requireAuth();
  const sessionData = session as { session?: { createdAt?: string } };
  const sessionAge = Date.now() - new Date(sessionData.session?.createdAt || Date.now()).getTime();
  
  if (sessionAge > maxAge) {
    throw new Error("Please re-authenticate to perform this action");
  }
  
  return session;
}