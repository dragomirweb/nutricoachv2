import { db } from "@/server/db";
import * as schema from "@/server/db/schema";
import { and, gte, eq, desc, lte } from "drizzle-orm";
import crypto from "crypto";
import { subMinutes } from "date-fns";

export async function checkRateLimit(
  identifier: string,
  maxAttempts = 5,
  windowMinutes = 5
): Promise<{ allowed: boolean; remainingAttempts: number }> {
  const windowStart = subMinutes(new Date(), windowMinutes);

  const attempts = await db
    .select()
    .from(schema.loginAttempts)
    .where(
      and(
        eq(schema.loginAttempts.email, identifier),
        gte(schema.loginAttempts.attemptedAt, windowStart),
        eq(schema.loginAttempts.success, false)
      )
    );

  const failedAttempts = attempts.length;
  const allowed = failedAttempts < maxAttempts;
  const remainingAttempts = Math.max(0, maxAttempts - failedAttempts);

  return { allowed, remainingAttempts };
}

export async function getDeviceFingerprint(
  userId: string,
  fingerprint: string
): Promise<typeof schema.deviceFingerprints.$inferSelect | null> {
  const [device] = await db
    .select()
    .from(schema.deviceFingerprints)
    .where(
      and(
        eq(schema.deviceFingerprints.userId, userId),
        eq(schema.deviceFingerprints.fingerprint, fingerprint)
      )
    )
    .limit(1);

  return device || null;
}

export async function createOrUpdateDeviceFingerprint(
  userId: string,
  fingerprint: string,
  deviceInfo: {
    deviceName?: string;
    deviceType?: string;
  }
) {
  const existing = await getDeviceFingerprint(userId, fingerprint);

  if (existing) {
    await db
      .update(schema.deviceFingerprints)
      .set({
        lastSeenAt: new Date(),
        ...deviceInfo,
      })
      .where(eq(schema.deviceFingerprints.id, existing.id));

    return existing;
  }

  const [newDevice] = await db
    .insert(schema.deviceFingerprints)
    .values({
      id: crypto.randomUUID(),
      userId,
      fingerprint,
      ...deviceInfo,
    })
    .returning();

  return newDevice;
}

export async function logAuditEvent(
  action: string,
  metadata?: Record<string, unknown>,
  userId?: string,
  request?: Request
) {
  const ipAddress = request
    ? request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown"
    : undefined;

  const userAgent = request
    ? request.headers.get("user-agent") || undefined
    : undefined;

  await db.insert(schema.auditLogs).values({
    id: crypto.randomUUID(),
    userId,
    action,
    metadata,
    ipAddress,
    userAgent,
  });
}

export async function cleanupExpiredTokens() {
  const now = new Date();

  await db
    .delete(schema.verificationTokens)
    .where(lte(schema.verificationTokens.expiresAt, now));

  await db
    .delete(schema.passwordResetTokens)
    .where(lte(schema.passwordResetTokens.expiresAt, now));
}

export async function getRecentSessions(
  userId: string,
  limit = 10
): Promise<(typeof schema.sessions.$inferSelect)[]> {
  return db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.userId, userId))
    .orderBy(desc(schema.sessions.lastActiveAt))
    .limit(limit);
}

export function generateSecureToken(length = 32): string {
  return crypto.randomBytes(length).toString("base64url");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getDeviceInfo(userAgent?: string | null) {
  if (!userAgent) {
    return { deviceType: "unknown", deviceName: "Unknown Device" };
  }

  let deviceType = "desktop";
  let deviceName = "Unknown Device";

  if (/Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)) {
    deviceType = "mobile";

    if (/iPhone|iPad|iPod/i.test(userAgent)) {
      deviceName = "iOS Device";
    } else if (/Android/i.test(userAgent)) {
      deviceName = "Android Device";
    } else {
      deviceName = "Mobile Device";
    }
  } else if (/Tablet/i.test(userAgent)) {
    deviceType = "tablet";
    deviceName = "Tablet";
  } else {
    if (/Mac/i.test(userAgent)) {
      deviceName = "Mac";
    } else if (/Windows/i.test(userAgent)) {
      deviceName = "Windows PC";
    } else if (/Linux/i.test(userAgent)) {
      deviceName = "Linux PC";
    }
  }

  return { deviceType, deviceName };
}
