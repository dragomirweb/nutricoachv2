import { pgTable, text, timestamp, integer, decimal, boolean, pgEnum, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

export const activityLevelEnum = pgEnum("activity_level", [
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
  "extra_active"
]);

export const goalTypeEnum = pgEnum("goal_type", [
  "weight_loss",
  "weight_gain",
  "maintain",
  "muscle_gain"
]);

export const userProfiles = pgTable("user_profile", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  age: integer("age"),
  gender: text("gender"),
  height: decimal("height", { precision: 5, scale: 2 }),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  activityLevel: activityLevelEnum("activity_level"),
  dietaryRestrictions: text("dietary_restrictions").array(),
  timezone: text("timezone").notNull().default("UTC"),
  locale: text("locale").notNull().default("en"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  userIdIdx: index("user_profile_user_id_idx").on(table.userId),
}));

export const goals = pgTable("goal", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: goalTypeEnum("type").notNull(),
  targetWeight: decimal("target_weight", { precision: 5, scale: 2 }),
  targetDate: timestamp("target_date"),
  dailyCalories: integer("daily_calories"),
  dailyProtein: integer("daily_protein"),
  dailyCarbs: integer("daily_carbs"),
  dailyFat: integer("daily_fat"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  userIdIdx: index("goal_user_id_idx").on(table.userId),
  activeIdx: index("goal_active_idx").on(table.active),
}));

export const weightEntries = pgTable("weight_entry", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  weight: decimal("weight", { precision: 5, scale: 2 }).notNull(),
  loggedAt: timestamp("logged_at").notNull().defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("weight_entry_user_id_idx").on(table.userId),
  loggedAtIdx: index("weight_entry_logged_at_idx").on(table.loggedAt),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
}));

export const weightEntriesRelations = relations(weightEntries, ({ one }) => ({
  user: one(users, {
    fields: [weightEntries.userId],
    references: [users.id],
  }),
}));