import {
  pgTable,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

// Standard meal types following industry conventions
export const mealTypeEnum = pgEnum("meal_type", [
  "breakfast",
  "brunch",
  "lunch", 
  "dinner",
  "snack",
  "dessert",
]);

export const meals = pgTable(
  "meal",
  {
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
    // Essential minerals
    totalIron: decimal("total_iron", { precision: 8, scale: 2 }), // mg
    totalMagnesium: decimal("total_magnesium", { precision: 8, scale: 2 }), // mg
    totalCalcium: decimal("total_calcium", { precision: 8, scale: 2 }), // mg
    totalZinc: decimal("total_zinc", { precision: 8, scale: 2 }), // mg
    totalPotassium: decimal("total_potassium", { precision: 8, scale: 2 }), // mg
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdIdx: index("meal_user_id_idx").on(table.userId),
    loggedAtIdx: index("meal_logged_at_idx").on(table.loggedAt),
    typeIdx: index("meal_type_idx").on(table.type),
  })
);

export const foodItems = pgTable(
  "food_item",
  {
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
    // Essential minerals
    iron: decimal("iron", { precision: 8, scale: 2 }), // mg
    magnesium: decimal("magnesium", { precision: 8, scale: 2 }), // mg
    calcium: decimal("calcium", { precision: 8, scale: 2 }), // mg
    zinc: decimal("zinc", { precision: 8, scale: 2 }), // mg
    potassium: decimal("potassium", { precision: 8, scale: 2 }), // mg
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    mealIdIdx: index("food_item_meal_id_idx").on(table.mealId),
  })
);

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
