# Data Fetching Patterns

This document outlines data fetching patterns using tRPC with React Query, implementing efficient data loading, caching, and synchronization strategies.

## Overview

NutriCoach uses tRPC with React Query for data fetching, providing:
- Type-safe API calls without code generation
- Automatic caching and background refetching
- Optimistic updates for better UX
- Real-time data synchronization
- Efficient pagination and infinite scrolling

## Basic Query Patterns

### Simple Query

```typescript
// src/modules/meals/ui/hooks/use-meals.ts
import { trpc } from "@/lib/trpc-client";

export function useMeals(filters?: MealFilters) {
  return trpc.meals.list.useQuery({
    limit: 20,
    startDate: filters?.startDate,
    endDate: filters?.endDate,
  });
}

// Component usage
export function MealsList() {
  const { data, isLoading, error } = useMeals();

  if (isLoading) return <MealListSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="space-y-4">
      {data?.items.map((meal) => (
        <MealItem key={meal.id} meal={meal} />
      ))}
    </div>
  );
}
```

### Query with Dependencies

```typescript
// Fetch user profile first, then goals based on profile
export function useUserGoals() {
  const { data: profile } = trpc.user.getProfile.useQuery();
  
  const { data: goals } = trpc.user.getGoals.useQuery(
    { userId: profile?.id },
    {
      enabled: !!profile?.id, // Only run when profile is loaded
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    }
  );

  return { profile, goals };
}
```

### Conditional Queries

```typescript
// Only fetch when user wants to see details
export function MealDetails({ mealId, isOpen }: Props) {
  const { data, isLoading } = trpc.meals.get.useQuery(
    { id: mealId },
    {
      enabled: isOpen && !!mealId,
      // Keep previous data when closing/reopening
      keepPreviousData: true,
    }
  );

  return data;
}
```

## Mutation Patterns

### Basic Mutation

```typescript
// src/modules/meals/ui/hooks/use-create-meal.ts
export function useCreateMeal() {
  const utils = trpc.useContext();
  
  return trpc.meals.create.useMutation({
    onSuccess: () => {
      // Invalidate and refetch meal list
      utils.meals.list.invalidate();
      
      // Show success notification
      toast.success("Meal logged successfully!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Component usage
export function CreateMealForm() {
  const createMeal = useCreateMeal();
  
  const onSubmit = async (data: CreateMealInput) => {
    await createMeal.mutateAsync(data);
    // Mutation succeeded, form can close
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
      <Button 
        type="submit" 
        disabled={createMeal.isLoading}
      >
        {createMeal.isLoading ? "Saving..." : "Save Meal"}
      </Button>
    </form>
  );
}
```

### Optimistic Updates

```typescript
// Immediate UI update before server confirmation
export function useUpdateMeal() {
  const utils = trpc.useContext();
  
  return trpc.meals.update.useMutation({
    onMutate: async (updatedMeal) => {
      // Cancel outgoing refetches
      await utils.meals.get.cancel({ id: updatedMeal.id });
      await utils.meals.list.cancel();
      
      // Snapshot previous value
      const previousMeal = utils.meals.get.getData({ id: updatedMeal.id });
      
      // Optimistically update single meal
      utils.meals.get.setData(
        { id: updatedMeal.id },
        (old) => ({ ...old, ...updatedMeal })
      );
      
      // Optimistically update meal in list
      utils.meals.list.setData(undefined, (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((meal) =>
            meal.id === updatedMeal.id
              ? { ...meal, ...updatedMeal }
              : meal
          ),
        };
      });
      
      return { previousMeal };
    },
    onError: (err, updatedMeal, context) => {
      // Rollback on error
      if (context?.previousMeal) {
        utils.meals.get.setData(
          { id: updatedMeal.id },
          context.previousMeal
        );
      }
      toast.error("Failed to update meal");
    },
    onSettled: () => {
      // Sync with server
      utils.meals.invalidate();
    },
  });
}
```

### Sequential Mutations

```typescript
// Create meal and then add food items
export function useCreateMealWithItems() {
  const createMeal = trpc.meals.create.useMutation();
  const addFoodItems = trpc.meals.addFoodItems.useMutation();
  const utils = trpc.useContext();
  
  const createMealWithItems = async (data: MealWithItemsInput) => {
    try {
      // First create the meal
      const meal = await createMeal.mutateAsync({
        name: data.name,
        type: data.type,
        loggedAt: data.loggedAt,
      });
      
      // Then add food items if any
      if (data.foodItems.length > 0) {
        await addFoodItems.mutateAsync({
          mealId: meal.id,
          items: data.foodItems,
        });
      }
      
      // Invalidate queries
      utils.meals.invalidate();
      
      return meal;
    } catch (error) {
      // Handle error appropriately
      throw error;
    }
  };
  
  return {
    mutate: createMealWithItems,
    isLoading: createMeal.isLoading || addFoodItems.isLoading,
  };
}
```

## Pagination Patterns

### Cursor-Based Pagination

```typescript
// Hook for paginated data
export function usePaginatedMeals(limit = 20) {
  const [cursor, setCursor] = useState<string | null>(null);
  
  const { data, isLoading, isFetching } = trpc.meals.list.useQuery({
    limit,
    cursor,
  });
  
  const hasNextPage = !!data?.nextCursor;
  
  const loadMore = () => {
    if (data?.nextCursor) {
      setCursor(data.nextCursor);
    }
  };
  
  return {
    items: data?.items ?? [],
    isLoading,
    isFetching,
    hasNextPage,
    loadMore,
  };
}
```

### Infinite Scrolling

```typescript
// Using React Query's infinite query
export function useInfiniteMeals() {
  return trpc.meals.list.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      staleTime: 5 * 60 * 1000,
    }
  );
}

// Component with infinite scroll
export function InfiniteMealList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteMeals();
  
  const { ref, inView } = useInView();
  
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  if (isLoading) return <MealListSkeleton />;
  
  const meals = data?.pages.flatMap((page) => page.items) ?? [];
  
  return (
    <div className="space-y-4">
      {meals.map((meal) => (
        <MealItem key={meal.id} meal={meal} />
      ))}
      
      {/* Infinite scroll trigger */}
      <div ref={ref} className="h-10">
        {isFetchingNextPage && <Spinner />}
      </div>
    </div>
  );
}
```

## Real-Time Updates

### Polling

```typescript
// Poll for updates every 30 seconds
export function useLiveDashboard() {
  const { data } = trpc.nutrition.getDailyStats.useQuery(
    { date: new Date() },
    {
      refetchInterval: 30 * 1000, // 30 seconds
      refetchIntervalInBackground: true,
    }
  );
  
  return data;
}
```

### WebSocket Subscription (if implemented)

```typescript
// Real-time meal updates
export function useMealSubscription() {
  const utils = trpc.useContext();
  
  trpc.meals.onUpdate.useSubscription(undefined, {
    onData: (meal) => {
      // Update cached data
      utils.meals.get.setData({ id: meal.id }, meal);
      
      // Update meal in list
      utils.meals.list.setData(undefined, (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((m) =>
            m.id === meal.id ? meal : m
          ),
        };
      });
    },
  });
}
```

## Prefetching

### Hover Prefetch

```typescript
// Prefetch meal details on hover
export function MealListItem({ meal }: { meal: Meal }) {
  const utils = trpc.useContext();
  
  const handleMouseEnter = () => {
    utils.meals.get.prefetch({ id: meal.id });
  };
  
  return (
    <div
      onMouseEnter={handleMouseEnter}
      className="cursor-pointer"
    >
      {/* Meal content */}
    </div>
  );
}
```

### Route Prefetch

```typescript
// Prefetch data for next route
export function useRoutePrefetch() {
  const utils = trpc.useContext();
  const router = useRouter();
  
  const prefetchDashboard = async () => {
    await Promise.all([
      utils.nutrition.getDailyStats.prefetch({ date: new Date() }),
      utils.meals.list.prefetch({ limit: 5 }),
      utils.user.getProfile.prefetch(),
    ]);
  };
  
  return { prefetchDashboard };
}
```

## Error Handling

### Global Error Handling

```typescript
// src/lib/trpc-client.ts
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      headers() {
        return {
          // Include auth headers
        };
      },
      // Global error handler
      async onError({ error }) {
        if (error.code === "UNAUTHORIZED") {
          // Redirect to login
          await signOut();
          router.push("/login");
        } else if (error.code === "TOO_MANY_REQUESTS") {
          toast.error("Rate limit exceeded. Please try again later.");
        }
      },
    }),
  ],
});
```

### Query Error Boundaries

```typescript
// Error boundary for data fetching
export function DataErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="p-4 border border-destructive rounded-md">
          <h3 className="font-semibold text-destructive">
            Failed to load data
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {error.message}
          </p>
          <Button
            onClick={resetErrorBoundary}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            Try Again
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
```

## Caching Strategies

### Cache Configuration

```typescript
// Configure query client with sensible defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.data?.code === "NOT_FOUND") return false;
        if (error?.data?.code === "FORBIDDEN") return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
  },
});
```

### Manual Cache Updates

```typescript
// Update cache after related action
export function useDeleteMeal() {
  const utils = trpc.useContext();
  
  return trpc.meals.delete.useMutation({
    onSuccess: (_, variables) => {
      // Remove from cache immediately
      utils.meals.list.setData(undefined, (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.filter((meal) => meal.id !== variables.id),
        };
      });
      
      // Remove individual query
      utils.meals.get.removeQueries({ id: variables.id });
    },
  });
}
```

## Performance Patterns

### Suspense Integration

```typescript
// Enable suspense for queries
export function MealDetailsWithSuspense({ mealId }: { mealId: string }) {
  const { data } = trpc.meals.get.useSuspenseQuery({ id: mealId });
  
  return <MealDetails meal={data} />;
}

// Parent component
export function MealPage() {
  return (
    <Suspense fallback={<MealDetailsSkeleton />}>
      <MealDetailsWithSuspense mealId={mealId} />
    </Suspense>
  );
}
```

### Parallel Queries

```typescript
// Fetch multiple resources in parallel
export function useDashboardData() {
  const [profile, stats, recentMeals, goals] = trpc.useQueries((t) => [
    t.user.getProfile(),
    t.nutrition.getDailyStats({ date: new Date() }),
    t.meals.list({ limit: 5 }),
    t.user.getActiveGoals(),
  ]);
  
  const isLoading = [profile, stats, recentMeals, goals].some(
    (query) => query.isLoading
  );
  
  return {
    profile: profile.data,
    stats: stats.data,
    recentMeals: recentMeals.data,
    goals: goals.data,
    isLoading,
  };
}
```

## Best Practices

1. **Query Keys**: Let tRPC handle query keys automatically
2. **Error States**: Always handle loading and error states
3. **Optimistic Updates**: Use for immediate feedback
4. **Cache Invalidation**: Be strategic about what to invalidate
5. **Prefetching**: Prefetch data for predictable user actions
6. **Suspense**: Use for cleaner loading states
7. **Background Refetch**: Keep data fresh without disrupting UX