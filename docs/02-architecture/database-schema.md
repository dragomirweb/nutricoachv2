# Database Schema

This document outlines the database schema for NutriCoach v2 using Drizzle ORM with PostgreSQL.

## Schema Overview

The database is designed around core entities: users, meals, food items, and nutritional data. All schemas use TypeScript for type safety and Drizzle ORM for database interactions.

## Core Tables

### Users Table

```typescript
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
```

### Sessions Table (Better Auth)

```typescript
export const sessions = pgTable("session", {
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
});
```

### Accounts Table (OAuth Providers)

```typescript
export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  expiresAt: timestamp("expires_at"),
  password: text("password"),
});
```

### User Profiles Table

```typescript
import { integer, decimal, text as pgEnum } from "drizzle-orm/pg-core";

export const activityLevelEnum = pgEnum("activity_level", [
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
  "extra_active",
]);

export const userProfiles = pgTable("user_profile", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  age: integer("age"),
  gender: text("gender"),
  height: decimal("height", { precision: 5, scale: 2 }), // in cm
  weight: decimal("weight", { precision: 5, scale: 2 }), // in kg
  activityLevel: activityLevelEnum("activity_level"),
  dietaryRestrictions: text("dietary_restrictions").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
```

### Goals Table

```typescript
export const goalTypeEnum = pgEnum("goal_type", [
  "weight_loss",
  "weight_gain",
  "maintain",
  "muscle_gain",
]);

export const goals = pgTable("goal", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: goalTypeEnum("type").notNull(),
  targetWeight: decimal("target_weight", { precision: 5, scale: 2 }),
  targetDate: timestamp("target_date"),
  dailyCalories: integer("daily_calories"),
  dailyProtein: integer("daily_protein"),
  dailyCarbs: integer("daily_carbs"),
  dailyFat: integer("daily_fat"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
```

### Meals Table

```typescript
export const mealTypeEnum = pgEnum("meal_type", [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
]);

export const meals = pgTable("meal", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  type: mealTypeEnum("type"),
  loggedAt: timestamp("logged_at").notNull().defaultNow(),
  totalCalories: integer("total_calories"),
  totalProtein: decimal("total_protein", { precision: 8, scale: 2 }),
  totalCarbs: decimal("total_carbs", { precision: 8, scale: 2 }),
  totalFat: decimal("total_fat", { precision: 8, scale: 2 }),
  totalFiber: decimal("total_fiber", { precision: 8, scale: 2 }),
  aiParsed: boolean("ai_parsed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
```

### Food Items Table

```typescript
export const foodItems = pgTable("food_item", {
  id: text("id").primaryKey(),
  mealId: text("meal_id")
    .notNull()
    .references(() => meals.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  brand: text("brand"),
  quantity: decimal("quantity", { precision: 8, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  calories: integer("calories"),
  protein: decimal("protein", { precision: 8, scale: 2 }),
  carbs: decimal("carbs", { precision: 8, scale: 2 }),
  fat: decimal("fat", { precision: 8, scale: 2 }),
  fiber: decimal("fiber", { precision: 8, scale: 2 }),
  sodium: decimal("sodium", { precision: 8, scale: 2 }),
  sugar: decimal("sugar", { precision: 8, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
```

### Weight Entries Table

```typescript
export const weightEntries = pgTable("weight_entry", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  weight: decimal("weight", { precision: 5, scale: 2 }).notNull(), // in kg
  loggedAt: timestamp("logged_at").notNull().defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

## Relations

Define relationships between tables for easier querying:

```typescript
import { relations } from "drizzle-orm";

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  sessions: many(sessions),
  accounts: many(accounts),
  goals: many(goals),
  meals: many(meals),
  weightEntries: many(weightEntries),
}));

export const mealsRelations = relations(meals, ({ one, many }) => ({
  user: one(users, {
    fields: [meals.userId],
    references: [users.id],
  }),
  foodItems: many(foodItems),
}));

export const foodItemsRelations = relations(foodItems, ({ one }) => ({
  meal: one(meals, {
    fields: [foodItems.mealId],
    references: [meals.id],
  }),
}));
```

## Database Migrations

Using Drizzle Kit for migrations:

```bash
# Generate migration
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate

# Push schema changes (development)
npx drizzle-kit push
```

## Configuration

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import { env } from "@/config/env";

export default defineConfig({
  schema: "./src/server/db/schema/index.ts",
  out: "./src/server/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
```

## Query Examples

### Get User with Profile

```typescript
const userWithProfile = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    profile: true,
    goals: {
      where: eq(goals.active, true),
    },
  },
});
```

### Get Meals with Food Items

```typescript
const mealsWithItems = await db.query.meals.findMany({
  where: eq(meals.userId, userId),
  with: {
    foodItems: true,
  },
  orderBy: desc(meals.loggedAt),
  limit: 10,
});
```

### Insert Meal with Food Items

```typescript
await db.transaction(async (tx) => {
  const [meal] = await tx
    .insert(meals)
    .values({
      id: createId(),
      userId,
      name: mealData.name,
      type: mealData.type,
      totalCalories: calculateTotalCalories(mealData.items),
      // ... other fields
    })
    .returning();

  await tx.insert(foodItems).values(
    mealData.items.map((item) => ({
      id: createId(),
      mealId: meal.id,
      ...item,
    }))
  );
});
```
