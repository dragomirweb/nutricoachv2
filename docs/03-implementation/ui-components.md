# UI Components with Tailwind CSS v4

This document outlines UI component patterns using Tailwind CSS v4, focusing on a component-driven architecture with proper styling organization.

## Tailwind CSS v4 Setup

### Configuration

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        success: {
          50: "#f0fdf4",
          500: "#22c55e",
          600: "#16a34a",
        },
        warning: {
          50: "#fffbeb",
          500: "#f59e0b",
          600: "#d97706",
        },
        error: {
          50: "#fef2f2",
          500: "#ef4444",
          600: "#dc2626",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
        mono: ["var(--font-roboto-mono)"],
      },
    },
  },
  plugins: [],
};

export default config;
```

### Global Styles

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## Component Architecture

### Base Component Pattern

```typescript
// src/components/ui/base-component.tsx
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface BaseComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const BaseComponent = forwardRef<HTMLDivElement, BaseComponentProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          baseVariants({ variant, size }),
          className
        )}
        {...props}
      />
    );
  }
);

BaseComponent.displayName = "BaseComponent";
```

### Utility Functions

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Core Components

### Button Component

```typescript
// src/components/ui/button.tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
```

### Card Component

```typescript
// src/components/ui/card.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

### Input Component

```typescript
// src/components/ui/input.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
```

## Feature-Specific Components

### Nutrition Display Card

```typescript
// src/modules/nutrition/ui/components/nutrition-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface NutritionCardProps {
  title: string;
  value: number;
  unit: string;
  target?: number;
  color?: "primary" | "success" | "warning" | "error";
  className?: string;
}

export function NutritionCard({
  title,
  value,
  unit,
  target,
  color = "primary",
  className,
}: NutritionCardProps) {
  const percentage = target ? (value / target) * 100 : null;
  const isOverTarget = percentage && percentage > 100;

  const colorClasses = {
    primary: "bg-primary/10 text-primary-600",
    success: "bg-success-50 text-success-600",
    warning: "bg-warning-50 text-warning-600",
    error: "bg-error-50 text-error-600",
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className={cn("pb-2", colorClasses[color])}>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">{value}</span>
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>

          {target && (
            <>
              <div className="text-xs text-muted-foreground">
                Target: {target} {unit}
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn(
                    "h-full transition-all",
                    isOverTarget ? "bg-warning-500" : "bg-primary"
                  )}
                  style={{ width: `${Math.min(percentage || 0, 100)}%` }}
                />
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Meal Item Component

```typescript
// src/modules/meals/ui/components/meal-item.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface MealItemProps {
  meal: {
    id: string;
    name: string;
    type?: "breakfast" | "lunch" | "dinner" | "snack";
    loggedAt: Date;
    totalCalories?: number;
    totalProtein?: number;
    totalCarbs?: number;
    totalFat?: number;
    foodItems: Array<{ id: string; name: string }>;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function MealItem({ meal, onEdit, onDelete, className }: MealItemProps) {
  const mealTypeColors = {
    breakfast: "border-l-4 border-l-orange-500",
    lunch: "border-l-4 border-l-blue-500",
    dinner: "border-l-4 border-l-purple-500",
    snack: "border-l-4 border-l-green-500",
  };

  return (
    <Card className={cn(
      "transition-shadow hover:shadow-md",
      meal.type && mealTypeColors[meal.type],
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{meal.name}</h3>
              {meal.type && (
                <span className="text-xs capitalize rounded-full bg-secondary px-2 py-1">
                  {meal.type}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              {format(meal.loggedAt, "h:mm a")}
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              {meal.totalCalories && (
                <div>
                  <span className="font-medium">{meal.totalCalories}</span>
                  <span className="text-muted-foreground"> cal</span>
                </div>
              )}
              {meal.totalProtein && (
                <div>
                  <span className="font-medium">{meal.totalProtein}g</span>
                  <span className="text-muted-foreground"> protein</span>
                </div>
              )}
              {meal.totalCarbs && (
                <div>
                  <span className="font-medium">{meal.totalCarbs}g</span>
                  <span className="text-muted-foreground"> carbs</span>
                </div>
              )}
              {meal.totalFat && (
                <div>
                  <span className="font-medium">{meal.totalFat}g</span>
                  <span className="text-muted-foreground"> fat</span>
                </div>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              {meal.foodItems.length} {meal.foodItems.length === 1 ? "item" : "items"}
            </div>
          </div>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

## Loading States

### Skeleton Component

```typescript
// src/components/ui/skeleton.tsx
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
```

### Loading Patterns

```typescript
// src/modules/meals/ui/components/meal-list-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function MealListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-18" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

## Responsive Design

### Mobile-First Grid Layout

```typescript
// src/components/layouts/dashboard-grid.tsx
interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardGrid({ children, className }: DashboardGridProps) {
  return (
    <div className={cn(
      "grid gap-4",
      "grid-cols-1",
      "sm:grid-cols-2",
      "lg:grid-cols-3",
      "xl:grid-cols-4",
      className
    )}>
      {children}
    </div>
  );
}
```

### Responsive Navigation

```typescript
// src/components/navigation/mobile-nav.tsx
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X /> : <Menu />}
      </Button>

      <nav className={cn(
        "fixed inset-x-0 top-16 z-50 bg-background md:hidden",
        "transform transition-transform duration-200",
        isOpen ? "translate-y-0" : "-translate-y-full"
      )}>
        {/* Navigation items */}
      </nav>
    </>
  );
}
```

## Animation Patterns

### Transition Component

```typescript
// src/components/ui/transition.tsx
import { Transition as HeadlessTransition } from "@headlessui/react";
import { Fragment } from "react";

interface TransitionProps {
  show: boolean;
  children: React.ReactNode;
}

export function FadeTransition({ show, children }: TransitionProps) {
  return (
    <HeadlessTransition
      as={Fragment}
      show={show}
      enter="transition-opacity duration-200"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      {children}
    </HeadlessTransition>
  );
}

export function SlideTransition({ show, children }: TransitionProps) {
  return (
    <HeadlessTransition
      as={Fragment}
      show={show}
      enter="transform transition duration-200"
      enterFrom="translate-y-4 opacity-0"
      enterTo="translate-y-0 opacity-100"
      leave="transform transition duration-150"
      leaveFrom="translate-y-0 opacity-100"
      leaveTo="translate-y-4 opacity-0"
    >
      {children}
    </HeadlessTransition>
  );
}
```

## Best Practices

1. **Component Organization**
   - Keep components small and focused
   - Use composition over inheritance
   - Separate logic from presentation

2. **Styling Patterns**
   - Use Tailwind's utility classes for styling
   - Create component variants with CVA
   - Use CSS variables for theming

3. **Accessibility**
   - Include proper ARIA labels
   - Ensure keyboard navigation
   - Maintain focus management

4. **Performance**
   - Use React.memo for expensive components
   - Implement virtualization for long lists
   - Lazy load heavy components

5. **Type Safety**
   - Define explicit prop types
   - Use discriminated unions for variants
   - Export component prop types
