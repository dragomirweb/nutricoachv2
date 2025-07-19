# Testing Strategy

This document outlines the comprehensive testing strategy for NutriCoach v2, covering unit tests, integration tests, end-to-end tests, and testing best practices.

## Testing Stack

- **Vitest** - Unit and integration testing
- **React Testing Library** - Component testing
- **Playwright** - End-to-end testing
- **MSW (Mock Service Worker)** - API mocking
- **Testing Library User Event** - User interaction simulation
- **Faker.js** - Test data generation

## Test Structure

```
src/
├── __tests__/              # Global test utilities
│   ├── setup.ts           # Test setup
│   ├── utils.tsx          # Test utilities
│   └── mocks/             # Global mocks
├── modules/
│   └── meals/
│       ├── __tests__/     # Module-specific tests
│       ├── server/
│       │   └── router.test.ts
│       └── ui/
│           └── components/
│               └── __tests__/
│                   └── meal-form.test.tsx
└── e2e/                   # End-to-end tests
    ├── auth.spec.ts
    └── meals.spec.ts
```

## Unit Testing

### Component Testing

```typescript
// src/modules/meals/ui/components/__tests__/meal-item.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MealItem } from "../meal-item";
import { vi } from "vitest";

const mockMeal = {
  id: "meal-1",
  name: "Healthy Breakfast",
  type: "breakfast" as const,
  loggedAt: new Date("2024-01-15T08:00:00"),
  totalCalories: 450,
  totalProtein: 25,
  totalCarbs: 55,
  totalFat: 15,
  foodItems: [
    { id: "item-1", name: "Oatmeal" },
    { id: "item-2", name: "Banana" },
  ],
};

describe("MealItem", () => {
  it("renders meal information correctly", () => {
    render(<MealItem meal={mockMeal} />);

    expect(screen.getByText("Healthy Breakfast")).toBeInTheDocument();
    expect(screen.getByText("breakfast")).toBeInTheDocument();
    expect(screen.getByText("450")).toBeInTheDocument();
    expect(screen.getByText("25g")).toBeInTheDocument();
    expect(screen.getByText("2 items")).toBeInTheDocument();
  });

  it("calls onEdit when edit button is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    render(<MealItem meal={mockMeal} onEdit={onEdit} />);

    const editButton = screen.getByRole("button", { name: /edit/i });
    await user.click(editButton);

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("applies correct styling for meal type", () => {
    const { container } = render(<MealItem meal={mockMeal} />);

    const card = container.firstChild;
    expect(card).toHaveClass("border-l-orange-500");
  });
});
```

### Hook Testing

```typescript
// src/modules/meals/ui/hooks/__tests__/use-create-meal.test.tsx
import { renderHook, waitFor } from "@testing-library/react";
import { useCreateMeal } from "../use-create-meal";
import { createWrapper } from "@/__tests__/utils";
import { server } from "@/__tests__/mocks/server";
import { rest } from "msw";

describe("useCreateMeal", () => {
  it("creates meal successfully", async () => {
    const { result } = renderHook(() => useCreateMeal(), {
      wrapper: createWrapper(),
    });

    const mealData = {
      name: "Test Meal",
      foodItems: [{ name: "Apple", quantity: 1, unit: "piece" }],
    };

    await result.current.mutateAsync(mealData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("handles server errors", async () => {
    server.use(
      rest.post("/api/trpc/meals.create", (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({
            error: {
              message: "Internal server error",
              code: "INTERNAL_SERVER_ERROR",
            },
          })
        );
      })
    );

    const { result } = renderHook(() => useCreateMeal(), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({ name: "Test" })
    ).rejects.toThrow();
  });
});
```

### Utility Function Testing

```typescript
// src/lib/__tests__/nutrition-calculator.test.ts
import {
  calculateMacros,
  calculateBMR,
  calculateTDEE,
} from "../nutrition-calculator";

describe("Nutrition Calculator", () => {
  describe("calculateMacros", () => {
    it("calculates macros correctly for balanced diet", () => {
      const result = calculateMacros({
        calories: 2000,
        proteinRatio: 0.3,
        carbRatio: 0.4,
        fatRatio: 0.3,
      });

      expect(result).toEqual({
        protein: 150, // 2000 * 0.3 / 4
        carbs: 200, // 2000 * 0.4 / 4
        fat: 67, // 2000 * 0.3 / 9
      });
    });

    it("throws error for invalid ratios", () => {
      expect(() =>
        calculateMacros({
          calories: 2000,
          proteinRatio: 0.5,
          carbRatio: 0.6,
          fatRatio: 0.3,
        })
      ).toThrow("Macro ratios must sum to 1");
    });
  });

  describe("calculateBMR", () => {
    it("calculates BMR using Mifflin-St Jeor equation", () => {
      const bmr = calculateBMR({
        weight: 70, // kg
        height: 175, // cm
        age: 30,
        gender: "male",
      });

      expect(bmr).toBeCloseTo(1673.75, 2);
    });
  });
});
```

## Integration Testing

### API Route Testing

```typescript
// src/server/trpc/__tests__/meals-router.test.ts
import { createInnerTRPCContext } from "../context";
import { mealsRouter } from "@/modules/meals/server/router";
import { db } from "@/server/db";
import { meals, foodItems } from "@/server/db/schema";
import { createId } from "@paralleldrive/cuid2";

describe("Meals Router", () => {
  const mockUser = {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
  };

  const ctx = createInnerTRPCContext({
    session: {
      user: mockUser,
      session: {
        id: "session-id",
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    },
  });

  const caller = mealsRouter.createCaller(ctx);

  beforeEach(async () => {
    // Clean up test data
    await db.delete(meals).where(eq(meals.userId, mockUser.id));
  });

  describe("create", () => {
    it("creates a meal with food items", async () => {
      const input = {
        name: "Test Breakfast",
        type: "breakfast" as const,
        foodItems: [
          {
            name: "Eggs",
            quantity: 2,
            unit: "piece",
            calories: 140,
            protein: 12,
            fat: 10,
            carbs: 2,
          },
          {
            name: "Toast",
            quantity: 2,
            unit: "slice",
            calories: 160,
            protein: 6,
            fat: 2,
            carbs: 30,
          },
        ],
      };

      const result = await caller.create(input);

      expect(result.id).toBeDefined();

      // Verify meal was created
      const meal = await db.query.meals.findFirst({
        where: eq(meals.id, result.id),
        with: { foodItems: true },
      });

      expect(meal).toMatchObject({
        name: "Test Breakfast",
        type: "breakfast",
        totalCalories: 300,
        totalProtein: 18,
        totalFat: 12,
        totalCarbs: 32,
      });

      expect(meal?.foodItems).toHaveLength(2);
    });

    it("validates input data", async () => {
      const invalidInput = {
        name: "", // Invalid: empty name
        foodItems: [], // Invalid: no food items
      };

      await expect(caller.create(invalidInput)).rejects.toThrow();
    });
  });

  describe("list", () => {
    beforeEach(async () => {
      // Create test meals
      const mealIds = [createId(), createId(), createId()];

      await db.insert(meals).values([
        {
          id: mealIds[0],
          userId: mockUser.id,
          name: "Breakfast",
          loggedAt: new Date("2024-01-15T08:00:00"),
        },
        {
          id: mealIds[1],
          userId: mockUser.id,
          name: "Lunch",
          loggedAt: new Date("2024-01-15T12:00:00"),
        },
        {
          id: mealIds[2],
          userId: mockUser.id,
          name: "Dinner",
          loggedAt: new Date("2024-01-15T18:00:00"),
        },
      ]);
    });

    it("lists meals with pagination", async () => {
      const result = await caller.list({ limit: 2 });

      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBeDefined();
      expect(result.items[0].name).toBe("Dinner"); // Most recent first
    });

    it("filters by date range", async () => {
      const result = await caller.list({
        startDate: new Date("2024-01-15T10:00:00"),
        endDate: new Date("2024-01-15T14:00:00"),
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("Lunch");
    });
  });
});
```

### Database Testing

```typescript
// src/server/db/__tests__/repositories/meal-repository.test.ts
import { mealRepository } from "../meal-repository";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

describe("Meal Repository", () => {
  let testUserId: string;

  beforeAll(async () => {
    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        id: createId(),
        email: "repo-test@example.com",
        name: "Repo Test User",
      })
      .returning();

    testUserId = user.id;
  });

  afterAll(async () => {
    // Cleanup
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("aggregates daily nutrition correctly", async () => {
    // Create meals for a specific day
    await mealRepository.createMany([
      {
        userId: testUserId,
        name: "Breakfast",
        totalCalories: 400,
        totalProtein: 20,
        totalCarbs: 50,
        totalFat: 15,
        loggedAt: new Date("2024-01-15T08:00:00"),
      },
      {
        userId: testUserId,
        name: "Lunch",
        totalCalories: 600,
        totalProtein: 30,
        totalCarbs: 70,
        totalFat: 25,
        loggedAt: new Date("2024-01-15T13:00:00"),
      },
    ]);

    const dailyStats = await mealRepository.getDailyStats(
      testUserId,
      new Date("2024-01-15")
    );

    expect(dailyStats).toEqual({
      totalCalories: 1000,
      totalProtein: 50,
      totalCarbs: 120,
      totalFat: 40,
      mealCount: 2,
    });
  });
});
```

## E2E Testing

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

```typescript
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("user can sign up, sign in, and sign out", async ({ page }) => {
    // Go to sign up page
    await page.goto("/sign-up");

    // Fill sign up form
    await page.fill('input[name="name"]', "Test User");
    await page.fill('input[name="email"]', "e2e@example.com");
    await page.fill('input[name="password"]', "TestPassword123!");
    await page.fill('input[name="confirmPassword"]', "TestPassword123!");

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("text=Welcome, Test User")).toBeVisible();

    // Sign out
    await page.click('button[aria-label="User menu"]');
    await page.click("text=Sign out");

    // Should redirect to home
    await expect(page).toHaveURL("/");

    // Sign in again
    await page.goto("/sign-in");
    await page.fill('input[name="email"]', "e2e@example.com");
    await page.fill('input[name="password"]', "TestPassword123!");
    await page.click('button[type="submit"]');

    // Should be signed in
    await expect(page).toHaveURL("/dashboard");
  });
});

// e2e/meals.spec.ts
test.describe("Meal Management", () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto("/sign-in");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  });

  test("user can create and view a meal", async ({ page }) => {
    // Navigate to meals page
    await page.click('a[href="/meals"]');

    // Click add meal button
    await page.click("text=Add Meal");

    // Fill meal form
    await page.fill('input[name="name"]', "Healthy Lunch");
    await page.selectOption('select[name="type"]', "lunch");

    // Add food item
    await page.click("text=Add Food Item");
    await page.fill('input[name="foodItems.0.name"]', "Grilled Chicken");
    await page.fill('input[name="foodItems.0.quantity"]', "150");
    await page.selectOption('select[name="foodItems.0.unit"]', "g");
    await page.fill('input[name="foodItems.0.calories"]', "250");

    // Submit form
    await page.click('button[type="submit"]');

    // Verify meal appears in list
    await expect(page.locator("text=Healthy Lunch")).toBeVisible();
    await expect(page.locator("text=250 cal")).toBeVisible();
  });
});
```

## Test Utilities

### Test Wrapper

```typescript
// src/__tests__/utils.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import { ReactNode } from "react";
import superjson from "superjson";

export function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: "http://localhost:3000/api/trpc",
        transformer: superjson,
      }),
    ],
  });

  return ({ children }: { children: ReactNode }) => (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

### Mock Data Factories

```typescript
// src/__tests__/factories/meal.factory.ts
import { faker } from "@faker-js/faker";
import { Meal, FoodItem } from "@/types";

export const mealFactory = {
  create: (overrides?: Partial<Meal>): Meal => ({
    id: faker.string.uuid(),
    name: faker.helpers.arrayElement([
      "Healthy Breakfast",
      "Protein Lunch",
      "Light Dinner",
    ]),
    type: faker.helpers.arrayElement(["breakfast", "lunch", "dinner", "snack"]),
    loggedAt: faker.date.recent(),
    totalCalories: faker.number.int({ min: 200, max: 800 }),
    totalProtein: faker.number.int({ min: 10, max: 50 }),
    totalCarbs: faker.number.int({ min: 20, max: 100 }),
    totalFat: faker.number.int({ min: 5, max: 40 }),
    foodItems: [],
    ...overrides,
  }),

  createMany: (count: number, overrides?: Partial<Meal>): Meal[] => {
    return Array.from({ length: count }, () => mealFactory.create(overrides));
  },
};

export const foodItemFactory = {
  create: (overrides?: Partial<FoodItem>): FoodItem => ({
    id: faker.string.uuid(),
    name: faker.helpers.arrayElement([
      "Chicken Breast",
      "Brown Rice",
      "Broccoli",
      "Apple",
    ]),
    quantity: faker.number.int({ min: 50, max: 200 }),
    unit: faker.helpers.arrayElement(["g", "oz", "cup", "piece"]),
    calories: faker.number.int({ min: 50, max: 300 }),
    ...overrides,
  }),
};
```

## Testing Best Practices

### 1. Test Structure

```typescript
// Follow AAA pattern
test("should calculate total calories correctly", () => {
  // Arrange
  const meal = createMealWithItems();

  // Act
  const totalCalories = calculateTotalCalories(meal);

  // Assert
  expect(totalCalories).toBe(450);
});
```

### 2. Descriptive Test Names

```typescript
// ❌ Bad
test("meal test", () => {});

// ✅ Good
test("displays error message when meal creation fails due to network error", () => {});
```

### 3. Test Isolation

```typescript
// Each test should be independent
beforeEach(() => {
  // Reset state
  vi.clearAllMocks();
  cleanup();
});

afterEach(() => {
  // Clean up
  server.resetHandlers();
});
```

### 4. Avoid Implementation Details

```typescript
// ❌ Bad - testing implementation
expect(component.state.isLoading).toBe(true);

// ✅ Good - testing behavior
expect(screen.getByText("Loading...")).toBeInTheDocument();
```

### 5. Use Data Attributes for Testing

```typescript
// Component
<button data-testid="submit-meal-form">Save Meal</button>

// Test
const submitButton = screen.getByTestId("submit-meal-form");
```

## CI/CD Testing

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile

      - run: pnpm typecheck

      - run: pnpm lint

      - run: pnpm test:unit
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - run: pnpm test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Test Coverage

### Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/__tests__/", "*.config.*"],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
```

### Running Coverage

```bash
# Run tests with coverage
pnpm test:coverage

# View coverage report
open coverage/index.html
```
