import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name"),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    role: text("role").notNull().default("user"),
    twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
    twoFactorSecret: text("two_factor_secret"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    emailIdx: index("user_email_idx").on(table.email),
  })
);

export const sessions = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fresh: boolean("fresh").notNull().default(true),
    deviceId: text("device_id"),
    deviceName: text("device_name"),
    deviceType: text("device_type"),
    lastActiveAt: timestamp("last_active_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("session_user_id_idx").on(table.userId),
    tokenIdx: uniqueIndex("session_token_idx").on(table.token),
    deviceIdIdx: index("session_device_id_idx").on(table.deviceId),
  })
);

export const accounts = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdIdx: index("account_user_id_idx").on(table.userId),
    providerIdx: index("account_provider_idx").on(
      table.providerId,
      table.accountId
    ),
  })
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    valueIdx: uniqueIndex("verification_value_idx").on(table.value),
    identifierValueIdx: index("verification_identifier_value_idx").on(
      table.identifier,
      table.value
    ),
  })
);

// Keep old table name as alias for backward compatibility
export const verificationTokens = verification;

export const passwordResetTokens = pgTable(
  "password_reset_token",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    tokenIdx: uniqueIndex("password_reset_token_idx").on(table.token),
    userIdIdx: index("password_reset_user_id_idx").on(table.userId),
  })
);

export const loginAttempts = pgTable(
  "login_attempt",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    ipAddress: text("ip_address").notNull(),
    userAgent: text("user_agent"),
    success: boolean("success").notNull(),
    attemptedAt: timestamp("attempted_at").notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index("login_attempt_email_idx").on(table.email),
    ipIdx: index("login_attempt_ip_idx").on(table.ipAddress),
    attemptedAtIdx: index("login_attempt_attempted_at_idx").on(
      table.attemptedAt
    ),
  })
);

export const deviceFingerprints = pgTable(
  "device_fingerprint",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fingerprint: text("fingerprint").notNull(),
    deviceName: text("device_name"),
    deviceType: text("device_type"),
    lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
    trusted: boolean("trusted").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("device_fingerprint_user_id_idx").on(table.userId),
    fingerprintIdx: index("device_fingerprint_idx").on(table.fingerprint),
  })
);

export const auditLogs = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("audit_log_user_id_idx").on(table.userId),
    actionIdx: index("audit_log_action_idx").on(table.action),
    createdAtIdx: index("audit_log_created_at_idx").on(table.createdAt),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  passwordResetTokens: many(passwordResetTokens),
  deviceFingerprints: many(deviceFingerprints),
  auditLogs: many(auditLogs),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(
  passwordResetTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [passwordResetTokens.userId],
      references: [users.id],
    }),
  })
);

export const deviceFingerprintsRelations = relations(
  deviceFingerprints,
  ({ one }) => ({
    user: one(users, {
      fields: [deviceFingerprints.userId],
      references: [users.id],
    }),
  })
);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
