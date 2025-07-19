# Development Best Practices

This document outlines coding standards, architectural patterns, and best practices for developing NutriCoach v2.

## Code Organization

### Module Structure

Follow a feature-based modular architecture:

```
src/modules/
├── meals/                    # Feature module
│   ├── schemas/             # Zod schemas & types
│   │   ├── create-meal.ts
│   │   └── index.ts
│   ├── server/              # Server-side code
│   │   ├── router.ts        # tRPC router
│   │   ├── service.ts       # Business logic
│   │   └── repository.ts    # Data access
│   └── ui/                  # Client-side code
│       ├── components/      # React components
│       ├── hooks/           # Custom hooks
│       └── utils/           # UI utilities
```

### File Naming Conventions

```typescript
// Components: PascalCase
MealCard.tsx;
CreateMealDialog.tsx;

// Hooks: camelCase with 'use' prefix
useMeals.ts;
useCreateMeal.ts;

// Utilities: camelCase
formatCalories.ts;
calculateMacros.ts;

// Schemas: kebab-case
create - meal.schema.ts;
update - profile.schema.ts;

// Server files: descriptive names
meals.router.ts;
meals.service.ts;
meals.repository.ts;
```

## TypeScript Best Practices

### Type Safety

```typescript
// ❌ Avoid 'any'
const processData = (data: any) => {
  return data.value;
};

// ✅ Use specific types
interface ProcessableData {
  value: string;
  metadata?: Record<string, unknown>;
}

const processData = (data: ProcessableData) => {
  return data.value;
};
```

### Type Inference

```typescript
// ❌ Redundant type annotations
const meals: Meal[] = await getMeals();
const count: number = meals.length;

// ✅ Let TypeScript infer
const meals = await getMeals(); // Type is inferred
const count = meals.length; // Type is inferred
```

### Discriminated Unions

```typescript
// Use discriminated unions for state management
type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

// Usage with exhaustive checks
function handleState<T>(state: AsyncState<T>) {
  switch (state.status) {
    case "idle":
      return <EmptyState />;
    case "loading":
      return <LoadingState />;
    case "success":
      return <SuccessState data={state.data} />;
    case "error":
      return <ErrorState error={state.error} />;
  }
}
```

### Utility Types

```typescript
// Use built-in utility types
type MealUpdate = Partial<Meal>;
type RequiredMeal = Required<Pick<Meal, "id" | "name">>;
type MealWithoutDates = Omit<Meal, "createdAt" | "updatedAt">;

// Create custom utility types
type Nullable<T> = T | null;
type AsyncData<T> = Promise<T>;
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
```

## React Patterns

### Component Composition

```typescript
// ❌ Prop drilling
function App() {
  const user = useUser();
  return <Dashboard user={user} />;
}

function Dashboard({ user }) {
  return <Header user={user} />;
}

function Header({ user }) {
  return <UserMenu user={user} />;
}

// ✅ Use composition or context
function App() {
  return (
    <UserProvider>
      <Dashboard />
    </UserProvider>
  );
}

function UserMenu() {
  const user = useUser(); // From context
  return <div>{user.name}</div>;
}
```

### Custom Hooks

```typescript
// Extract complex logic into custom hooks
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Usage
function SearchMeals() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const { data } = trpc.meals.search.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length > 0 }
  );
}
```

### Error Boundaries

```typescript
// Create error boundary for feature sections
class MealErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Meal section error:", error, errorInfo);
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return <MealErrorFallback />;
    }

    return this.props.children;
  }
}
```

## API Design

### tRPC Router Organization

```typescript
// Organize procedures logically
export const mealsRouter = router({
  // Queries - read operations
  list: protectedProcedure.input(listSchema).query(listHandler),
  get: protectedProcedure.input(getSchema).query(getHandler),
  search: protectedProcedure.input(searchSchema).query(searchHandler),

  // Mutations - write operations
  create: protectedProcedure.input(createSchema).mutation(createHandler),
  update: protectedProcedure.input(updateSchema).mutation(updateHandler),
  delete: protectedProcedure.input(deleteSchema).mutation(deleteHandler),

  // Specialized operations
  parseWithAI: protectedProcedure
    .input(parseSchema)
    .mutation(parseWithAIHandler),

  // Nested routers for sub-resources
  foodItems: foodItemsRouter,
});
```

### Input Validation

```typescript
// Always validate inputs with Zod
const createMealSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  loggedAt: z
    .date()
    .optional()
    .default(() => new Date()),
  foodItems: z.array(foodItemSchema).min(1),
});

// Reuse schemas for consistency
const updateMealSchema = createMealSchema.partial().extend({
  id: z.string().cuid2(),
});
```

### Error Handling

```typescript
// Use consistent error patterns
import { TRPCError } from "@trpc/server";

// Service layer
export class MealService {
  async getMeal(id: string, userId: string) {
    const meal = await this.repository.findById(id);

    if (!meal) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Meal not found",
      });
    }

    if (meal.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have access to this meal",
      });
    }

    return meal;
  }
}
```

## Database Patterns

### Query Optimization

```typescript
// ❌ N+1 queries
const meals = await db.query.meals.findMany({
  where: eq(meals.userId, userId),
});

for (const meal of meals) {
  const items = await db.query.foodItems.findMany({
    where: eq(foodItems.mealId, meal.id),
  });
  meal.items = items;
}

// ✅ Use relations
const mealsWithItems = await db.query.meals.findMany({
  where: eq(meals.userId, userId),
  with: {
    foodItems: true,
  },
});
```

### Transaction Management

```typescript
// Use transactions for data consistency
async function createMealWithItems(data: CreateMealInput) {
  return await db.transaction(async (tx) => {
    // Create meal
    const [meal] = await tx
      .insert(meals)
      .values({
        id: createId(),
        userId: data.userId,
        name: data.name,
      })
      .returning();

    // Create food items
    if (data.foodItems.length > 0) {
      await tx.insert(foodItems).values(
        data.foodItems.map((item) => ({
          ...item,
          mealId: meal.id,
        }))
      );
    }

    return meal;
  });
}
```

## Performance Optimization

### React Optimization

```typescript
// Memoize expensive computations
const MealStats = memo(({ meals }: { meals: Meal[] }) => {
  const stats = useMemo(() => {
    return meals.reduce(
      (acc, meal) => ({
        totalCalories: acc.totalCalories + meal.totalCalories,
        totalProtein: acc.totalProtein + meal.totalProtein,
        count: acc.count + 1,
      }),
      { totalCalories: 0, totalProtein: 0, count: 0 }
    );
  }, [meals]);

  return <StatsDisplay stats={stats} />;
});

// Use React.lazy for code splitting
const HeavyComponent = lazy(() => import("./HeavyComponent"));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### Data Fetching Optimization

```typescript
// Parallel data fetching
function useDashboardData() {
  // These queries run in parallel
  const [profile, stats, recentMeals] = trpc.useQueries((t) => [
    t.user.getProfile(),
    t.nutrition.getDailyStats({ date: new Date() }),
    t.meals.list({ limit: 5 }),
  ]);

  return { profile, stats, recentMeals };
}

// Prefetch predictable navigation
function MealLink({ mealId }: { mealId: string }) {
  const utils = trpc.useContext();

  return (
    <Link
      href={`/meals/${mealId}`}
      onMouseEnter={() => {
        utils.meals.get.prefetch({ id: mealId });
      }}
    >
      View Meal
    </Link>
  );
}
```

## Security Best Practices

### Input Sanitization

```typescript
// Always validate and sanitize user input
const sanitizeHtml = (dirty: string) => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong"],
    ALLOWED_ATTR: [],
  });
};

// Use in components
function MealDescription({ description }: { description: string }) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: sanitizeHtml(description),
      }}
    />
  );
}
```

### Authentication Checks

```typescript
// Always verify ownership in mutations
const updateMeal = protectedProcedure
  .input(updateMealSchema)
  .mutation(async ({ ctx, input }) => {
    // Verify ownership first
    const meal = await ctx.db.query.meals.findFirst({
      where: and(eq(meals.id, input.id), eq(meals.userId, ctx.session.user.id)),
    });

    if (!meal) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Meal not found or access denied",
      });
    }

    // Proceed with update
    return ctx.db.update(meals).set(input).where(eq(meals.id, input.id));
  });
```

### Environment Variables

```typescript
// Use t3-env for type-safe environment variables
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    AUTH_SECRET: z.string().min(32),
    OPENAI_API_KEY: z.string().startsWith("sk-"),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});
```

## Testing Standards

### Test Organization

```typescript
// Organize tests next to the code they test
describe("MealService", () => {
  describe("createMeal", () => {
    it("should create a meal with valid data", async () => {
      // Test implementation
    });

    it("should calculate totals correctly", async () => {
      // Test implementation
    });

    it("should throw error for invalid user", async () => {
      // Test implementation
    });
  });
});
```

### Test Data Builders

```typescript
// Create test data builders for consistency
class MealBuilder {
  private meal: Partial<Meal> = {
    id: createId(),
    name: "Test Meal",
    userId: "test-user",
    totalCalories: 500,
  };

  withName(name: string) {
    this.meal.name = name;
    return this;
  }

  withCalories(calories: number) {
    this.meal.totalCalories = calories;
    return this;
  }

  build(): Meal {
    return this.meal as Meal;
  }
}

// Usage in tests
const meal = new MealBuilder()
  .withName("Healthy Breakfast")
  .withCalories(450)
  .build();
```

## Documentation Standards

### Code Comments

```typescript
/**
 * Calculates the recommended daily caloric intake based on user profile
 * and activity level using the Mifflin-St Jeor equation.
 *
 * @param profile - User profile containing age, weight, height, and gender
 * @param activityLevel - User's activity level
 * @returns Recommended daily calories
 *
 * @example
 * const calories = calculateDailyCalories(profile, "moderately_active");
 * // Returns: 2200
 */
export function calculateDailyCalories(
  profile: UserProfile,
  activityLevel: ActivityLevel
): number {
  // Implementation
}
```

### README Files

Each module should have a README:

```markdown
# Meals Module

This module handles all meal-related functionality including:

- CRUD operations for meals
- Food item management
- Nutritional calculations
- AI-powered meal parsing

## Structure

- `schemas/` - Zod schemas and TypeScript types
- `server/` - Backend logic (tRPC router, services, repositories)
- `ui/` - Frontend components and hooks

## Key Features

### AI Meal Parsing

Uses OpenAI to parse natural language meal descriptions...

### Nutritional Tracking

Automatically calculates totals based on food items...
```

## Git Workflow

### Commit Messages

Follow conventional commits:

```bash
# Format: <type>(<scope>): <subject>

feat(meals): add AI meal parsing
fix(auth): resolve session timeout issue
docs(api): update tRPC router documentation
refactor(ui): extract meal form logic to custom hook
test(meals): add integration tests for meal creation
chore(deps): update Next.js to v14.2
```

### Branch Naming

```bash
# Feature branches
feature/meal-ai-parsing
feature/weekly-reports

# Bug fixes
fix/session-timeout
fix/calculation-error

# Improvements
improve/query-performance
improve/mobile-responsiveness
```

## Code Review Checklist

- [ ] Types are properly defined (no `any`)
- [ ] Error handling is comprehensive
- [ ] Security: Input validation and authorization checks
- [ ] Performance: No N+1 queries, proper memoization
- [ ] Tests: Unit tests for business logic
- [ ] Documentation: Complex logic is commented
- [ ] Accessibility: ARIA labels, keyboard navigation
- [ ] Mobile: Responsive design considered
