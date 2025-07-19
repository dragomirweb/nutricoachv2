import { auth } from "@/server/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";
import { db } from "@/server/db";
import * as schema from "@/server/db/schema";

const { GET: authGET, POST: authPOST } = toNextJsHandler(auth.handler);

async function logAuthAttempt(
  req: NextRequest,
  email: string,
  success: boolean
) {
  const ipAddress =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = req.headers.get("user-agent") || undefined;

  await db.insert(schema.loginAttempts).values({
    id: crypto.randomUUID(),
    email,
    ipAddress,
    userAgent,
    success,
  });
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path.includes("/sign-in") || path.includes("/sign-up")) {
      const body = await req
        .clone()
        .json()
        .catch(() => ({}));
      const email = body.email || "";

      const response = await authPOST(req);
      const responseData = await response
        .clone()
        .json()
        .catch(() => ({}));

      await logAuthAttempt(req, email, !responseData.error);

      return response;
    }

    return authPOST(req);
  } catch (error) {
    console.error("Auth API error:", error);
    return authPOST(req);
  }
}

export { authGET as GET };
