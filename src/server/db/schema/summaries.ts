import {
  pgTable,
  text,
  timestamp,
  integer,
  decimal,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

export const dailySummaries = pgTable(
  "daily_summary",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date").notNull(), // The date this summary is for
    
    // Aggregated nutritional totals from all meals
    totalCalories: integer("total_calories").notNull().default(0),
    totalProtein: decimal("total_protein", { precision: 10, scale: 2 }).notNull().default("0"),
    totalCarbs: decimal("total_carbs", { precision: 10, scale: 2 }).notNull().default("0"),
    totalFat: decimal("total_fat", { precision: 10, scale: 2 }).notNull().default("0"),
    totalFiber: decimal("total_fiber", { precision: 10, scale: 2 }).notNull().default("0"),
    
    // Aggregated minerals
    totalIron: decimal("total_iron", { precision: 10, scale: 2 }).notNull().default("0"),
    totalMagnesium: decimal("total_magnesium", { precision: 10, scale: 2 }).notNull().default("0"),
    totalCalcium: decimal("total_calcium", { precision: 10, scale: 2 }).notNull().default("0"),
    totalZinc: decimal("total_zinc", { precision: 10, scale: 2 }).notNull().default("0"),
    totalPotassium: decimal("total_potassium", { precision: 10, scale: 2 }).notNull().default("0"),
    
    // Meal count for the day
    mealCount: integer("meal_count").notNull().default(0),
    
    // AI-generated summary/feedback
    summary: text("summary"), // AI-generated daily feedback
    
    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdIdx: index("daily_summary_user_id_idx").on(table.userId),
    dateIdx: index("daily_summary_date_idx").on(table.date),
    // Ensure only one summary per user per day
    userDateUnique: uniqueIndex("daily_summary_user_date_unique").on(table.userId, table.date),
  })
);

export const dailySummariesRelations = relations(dailySummaries, ({ one }) => ({
  user: one(users, {
    fields: [dailySummaries.userId],
    references: [users.id],
  }),
}));