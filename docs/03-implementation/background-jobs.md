# Background Jobs & Task Processing

This document outlines patterns for handling background jobs, scheduled tasks, and asynchronous processing in NutriCoach v2.

## Overview

Background job processing is essential for:

- AI-powered meal parsing and analysis
- Nutrition data aggregation
- Daily summary generation
- Email notifications
- Data cleanup and maintenance
- API rate limit management

## Job Queue Setup

### Using BullMQ with Redis

```typescript
// src/server/queue/config.ts
import { Queue, Worker, QueueScheduler } from "bullmq";
import Redis from "ioredis";

// Redis connection
export const connection = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

// Queue definitions
export const queues = {
  mealProcessing: new Queue("meal-processing", { connection }),
  notifications: new Queue("notifications", { connection }),
  dataAggregation: new Queue("data-aggregation", { connection }),
  maintenance: new Queue("maintenance", { connection }),
};

// Queue schedulers for delayed/repeated jobs
export const schedulers = {
  mealProcessing: new QueueScheduler("meal-processing", { connection }),
  notifications: new QueueScheduler("notifications", { connection }),
  dataAggregation: new QueueScheduler("data-aggregation", { connection }),
  maintenance: new QueueScheduler("maintenance", { connection }),
};
```

## Job Types

### AI Meal Processing

```typescript
// src/server/jobs/meal-processing.ts
import { Job } from "bullmq";
import { openai } from "@/lib/openai";
import { db } from "@/server/db";
import { meals, foodItems } from "@/server/db/schema";

interface MealProcessingJob {
  mealId: string;
  description: string;
  userId: string;
}

export async function processMealWithAI(job: Job<MealProcessingJob>) {
  const { mealId, description, userId } = job.data;

  try {
    // Update job progress
    await job.updateProgress(10);

    // Call OpenAI to parse meal
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a nutrition expert. Parse the following meal description 
          and extract food items with their quantities and nutritional information.
          Return a JSON array of food items.`,
        },
        {
          role: "user",
          content: description,
        },
      ],
      response_format: { type: "json_object" },
    });

    await job.updateProgress(50);

    const parsedData = JSON.parse(completion.choices[0].message.content);
    const items = parsedData.items || [];

    // Calculate totals
    const totals = items.reduce(
      (acc, item) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein || 0),
        carbs: acc.carbs + (item.carbs || 0),
        fat: acc.fat + (item.fat || 0),
        fiber: acc.fiber + (item.fiber || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );

    await job.updateProgress(70);

    // Update database
    await db.transaction(async (tx) => {
      // Update meal with totals
      await tx
        .update(meals)
        .set({
          totalCalories: totals.calories,
          totalProtein: totals.protein,
          totalCarbs: totals.carbs,
          totalFat: totals.fat,
          totalFiber: totals.fiber,
          aiParsed: true,
          updatedAt: new Date(),
        })
        .where(eq(meals.id, mealId));

      // Insert food items
      if (items.length > 0) {
        await tx.insert(foodItems).values(
          items.map((item) => ({
            id: createId(),
            mealId,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            fiber: item.fiber,
          }))
        );
      }
    });

    await job.updateProgress(100);

    // Log success
    await job.log(`Successfully processed meal ${mealId}`);

    return { success: true, itemCount: items.length };
  } catch (error) {
    // Log error for debugging
    await job.log(`Error processing meal: ${error.message}`);
    throw error;
  }
}
```

### Daily Summary Generation

```typescript
// src/server/jobs/daily-summary.ts
import { Job } from "bullmq";
import { startOfDay, endOfDay } from "date-fns";
import { and, gte, lte, eq } from "drizzle-orm";

interface DailySummaryJob {
  userId: string;
  date: string;
}

export async function generateDailySummary(job: Job<DailySummaryJob>) {
  const { userId, date } = job.data;
  const targetDate = new Date(date);

  // Fetch all meals for the day
  const dayMeals = await db.query.meals.findMany({
    where: and(
      eq(meals.userId, userId),
      gte(meals.loggedAt, startOfDay(targetDate)),
      lte(meals.loggedAt, endOfDay(targetDate))
    ),
    with: {
      foodItems: true,
    },
  });

  // Calculate daily totals
  const dailyTotals = dayMeals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.totalCalories || 0),
      protein: acc.protein + Number(meal.totalProtein || 0),
      carbs: acc.carbs + Number(meal.totalCarbs || 0),
      fat: acc.fat + Number(meal.totalFat || 0),
      fiber: acc.fiber + Number(meal.totalFiber || 0),
      mealCount: acc.mealCount + 1,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, mealCount: 0 }
  );

  // Get user goals
  const activeGoal = await db.query.goals.findFirst({
    where: and(eq(goals.userId, userId), eq(goals.active, true)),
  });

  // Store daily summary
  await db.insert(dailySummaries).values({
    id: createId(),
    userId,
    date: targetDate,
    totalCalories: dailyTotals.calories,
    totalProtein: dailyTotals.protein,
    totalCarbs: dailyTotals.carbs,
    totalFat: dailyTotals.fat,
    totalFiber: dailyTotals.fiber,
    mealCount: dailyTotals.mealCount,
    goalCalories: activeGoal?.dailyCalories,
    goalProtein: activeGoal?.dailyProtein,
    goalCarbs: activeGoal?.dailyCarbs,
    goalFat: activeGoal?.dailyFat,
  });

  // Queue notification if goals are significantly off
  if (activeGoal) {
    const caloriePercentage =
      (dailyTotals.calories / activeGoal.dailyCalories) * 100;

    if (caloriePercentage < 80 || caloriePercentage > 120) {
      await queues.notifications.add("goal-alert", {
        userId,
        type: "GOAL_DEVIATION",
        data: {
          date: targetDate,
          calories: dailyTotals.calories,
          target: activeGoal.dailyCalories,
          percentage: caloriePercentage,
        },
      });
    }
  }

  return dailyTotals;
}
```

## Worker Implementation

### Meal Processing Worker

```typescript
// src/server/workers/meal-processing.worker.ts
import { Worker } from "bullmq";
import { connection } from "../queue/config";
import { processMealWithAI } from "../jobs/meal-processing";

export const mealProcessingWorker = new Worker(
  "meal-processing",
  processMealWithAI,
  {
    connection,
    concurrency: 5, // Process 5 jobs concurrently
    limiter: {
      max: 10,
      duration: 60000, // 10 jobs per minute (rate limit)
    },
  }
);

// Event handlers
mealProcessingWorker.on("completed", (job) => {
  console.log(`Meal ${job.data.mealId} processed successfully`);
});

mealProcessingWorker.on("failed", (job, err) => {
  console.error(`Meal ${job?.data.mealId} processing failed:`, err);
});

mealProcessingWorker.on("stalled", (jobId) => {
  console.warn(`Job ${jobId} stalled and will be retried`);
});
```

### Notification Worker

```typescript
// src/server/workers/notification.worker.ts
import { Worker } from "bullmq";
import { sendEmail } from "@/lib/email";
import { renderEmailTemplate } from "@/lib/email-templates";

export const notificationWorker = new Worker(
  "notifications",
  async (job) => {
    const { userId, type, data } = job.data;

    // Get user preferences
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        profile: true,
      },
    });

    if (!user?.email) {
      throw new Error("User email not found");
    }

    // Render email based on type
    const { subject, html } = renderEmailTemplate(type, {
      user,
      ...data,
    });

    // Send email
    await sendEmail({
      to: user.email,
      subject,
      html,
    });

    // Log notification
    await db.insert(notificationLogs).values({
      id: createId(),
      userId,
      type,
      sentAt: new Date(),
      channel: "EMAIL",
    });
  },
  {
    connection,
    concurrency: 10,
  }
);
```

## Scheduled Jobs

### Cron Job Setup

```typescript
// src/server/scheduler/index.ts
import { Queue } from "bullmq";
import cron from "node-cron";

export function initializeScheduledJobs() {
  // Daily summary generation - runs at 11:59 PM
  cron.schedule("59 23 * * *", async () => {
    const activeUsers = await db.query.users.findMany({
      where: eq(users.emailVerified, true),
    });

    for (const user of activeUsers) {
      await queues.dataAggregation.add(
        "daily-summary",
        {
          userId: user.id,
          date: new Date().toISOString(),
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
        }
      );
    }
  });

  // Weekly reports - runs on Sundays at 9 AM
  cron.schedule("0 9 * * 0", async () => {
    await queues.notifications.add("weekly-report", {
      week: getISOWeek(new Date()),
    });
  });

  // Database cleanup - runs daily at 3 AM
  cron.schedule("0 3 * * *", async () => {
    await queues.maintenance.add("cleanup", {
      tasks: ["remove-old-sessions", "cleanup-temp-files", "archive-old-meals"],
    });
  });
}
```

### Repeating Jobs

```typescript
// Add repeating job for checking goals
await queues.dataAggregation.add(
  "check-user-goals",
  { checkType: "daily" },
  {
    repeat: {
      pattern: "0 18 * * *", // 6 PM daily
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep for 24 hours
      count: 10, // Keep last 10
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  }
);
```

## Job Management

### Adding Jobs from API

```typescript
// src/server/trpc/procedures/meals.ts
import { queues } from "@/server/queue/config";

export const mealsRouter = router({
  parseWithAI: protectedProcedure
    .input(
      z.object({
        description: z.string().min(1),
        mealName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create meal placeholder
      const mealId = createId();
      await ctx.db.insert(meals).values({
        id: mealId,
        userId: ctx.session.user.id,
        name: input.mealName || "AI Parsed Meal",
        description: input.description,
        aiParsed: false,
        loggedAt: new Date(),
      });

      // Queue AI processing
      const job = await queues.mealProcessing.add(
        "parse-meal",
        {
          mealId,
          description: input.description,
          userId: ctx.session.user.id,
        },
        {
          priority: 1,
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
        }
      );

      return {
        mealId,
        jobId: job.id,
        status: "processing",
      };
    }),
});
```

### Job Status Tracking

```typescript
// src/modules/meals/ui/hooks/use-job-status.ts
export function useJobStatus(jobId: string) {
  return trpc.jobs.getStatus.useQuery(
    { jobId },
    {
      refetchInterval: (data) => {
        // Poll while job is active
        if (data?.state === "completed" || data?.state === "failed") {
          return false;
        }
        return 1000; // Poll every second
      },
    }
  );
}

// Component usage
export function MealProcessingStatus({ jobId }: { jobId: string }) {
  const { data: job } = useJobStatus(jobId);

  if (!job) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {job.state === "active" && <Spinner />}
        {job.state === "completed" && <CheckIcon />}
        {job.state === "failed" && <XIcon />}
        <span className="text-sm">
          {job.state === "active" && "Processing..."}
          {job.state === "completed" && "Complete!"}
          {job.state === "failed" && "Failed"}
        </span>
      </div>

      {job.progress !== null && (
        <Progress value={job.progress} className="w-full" />
      )}
    </div>
  );
}
```

## Error Handling & Retries

### Retry Configuration

```typescript
// Job with custom retry logic
await queue.add("process-meal", jobData, {
  attempts: 5,
  backoff: {
    type: "custom",
    delay: (attemptsMade) => {
      // Exponential backoff with jitter
      return Math.min(
        Math.pow(2, attemptsMade) * 1000 + Math.random() * 1000,
        30000 // Max 30 seconds
      );
    },
  },
  removeOnComplete: true,
  removeOnFail: false, // Keep failed jobs for debugging
});
```

### Dead Letter Queue

```typescript
// Move failed jobs to DLQ after max attempts
mealProcessingWorker.on("failed", async (job, err) => {
  if (job && job.attemptsMade >= job.opts.attempts) {
    await queues.deadLetter.add("failed-meal-processing", {
      originalJob: job.data,
      error: err.message,
      failedAt: new Date(),
      attempts: job.attemptsMade,
    });
  }
});
```

## Monitoring & Admin

### Bull Board Integration

```typescript
// src/app/api/admin/queues/route.ts
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/api/admin/queues");

createBullBoard({
  queues: Object.values(queues).map((queue) => new BullMQAdapter(queue)),
  serverAdapter,
});

// Protect with authentication
export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session || session.user.role !== "admin") {
    return new Response("Unauthorized", { status: 401 });
  }

  return serverAdapter.getRouter();
}
```

### Queue Metrics

```typescript
// src/server/monitoring/queue-metrics.ts
export async function getQueueMetrics(queueName: string) {
  const queue = queues[queueName];

  const [waiting, active, completed, failed, delayed, paused] =
    await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.getPausedCount(),
    ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    paused,
    total: waiting + active + delayed + paused,
  };
}
```

## Best Practices

1. **Idempotency**: Design jobs to be safely retryable
2. **Error Handling**: Implement proper error handling and logging
3. **Rate Limiting**: Respect third-party API rate limits
4. **Monitoring**: Set up alerts for failed jobs and queue backlogs
5. **Cleanup**: Remove old completed jobs to prevent memory issues
6. **Priority**: Use job priorities for time-sensitive tasks
7. **Graceful Shutdown**: Handle worker shutdown properly

## Testing Jobs

```typescript
// src/server/jobs/__tests__/meal-processing.test.ts
import { processMealWithAI } from "../meal-processing";
import { Job } from "bullmq";

describe("Meal Processing Job", () => {
  it("should parse meal description correctly", async () => {
    const mockJob = {
      data: {
        mealId: "test-meal-id",
        description: "Grilled chicken breast with rice and vegetables",
        userId: "test-user-id",
      },
      updateProgress: jest.fn(),
      log: jest.fn(),
    } as unknown as Job;

    const result = await processMealWithAI(mockJob);

    expect(result.success).toBe(true);
    expect(result.itemCount).toBeGreaterThan(0);
    expect(mockJob.updateProgress).toHaveBeenCalledWith(100);
  });
});
```
