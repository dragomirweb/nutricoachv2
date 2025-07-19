import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { Session } from "@/server/auth.types";

/**
 * Creates the context for tRPC procedures
 * This function is called for each request
 */
export async function createContext(opts: FetchCreateContextFnOptions) {
  const session = (await auth.api.getSession({
    headers: opts.req.headers,
  })) as Session | null;

  return {
    db,
    session,
    req: opts.req,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
