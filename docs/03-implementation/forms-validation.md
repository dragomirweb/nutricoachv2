# Forms & Validation

This document outlines form handling patterns using React Hook Form with Zod for type-safe validation in NutriCoach v2.

## Core Setup

### Dependencies

```bash
npm install react-hook-form zod @hookform/resolvers
```

### Base Form Configuration

Create reusable form types and utilities:

```typescript
// src/lib/forms.ts
import { UseFormReturn, FieldPath, FieldValues } from "react-hook-form";
import { z } from "zod";

// Generic form props type
export type FormProps<TFormValues extends FieldValues> = {
  form: UseFormReturn<TFormValues>;
  onSubmit: (data: TFormValues) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
};

// Form field props type
export type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
};
```

## Validation Schemas

### Common Validation Patterns

```typescript
// src/modules/common/schemas.ts
import { z } from "zod";

// Reusable schema components
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number");

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number");

// Date validation with custom refinement
export const futureDateSchema = z
  .date()
  .refine((date) => date > new Date(), {
    message: "Date must be in the future",
  });

// Numeric validation with precision
export const weightSchema = z
  .number()
  .positive("Weight must be positive")
  .max(999.99, "Weight must be less than 1000")
  .multipleOf(0.01, "Weight must have at most 2 decimal places");
```

### Complex Schema Example

```typescript
// src/modules/meals/schemas.ts
import { z } from "zod";

// Food item schema
export const foodItemSchema = z.object({
  name: z.string().min(1, "Food name is required"),
  brand: z.string().optional(),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.enum(["g", "oz", "cup", "tbsp", "tsp", "piece", "serving"]),
  calories: z.number().int().nonnegative().optional(),
  protein: z.number().nonnegative().optional(),
  carbs: z.number().nonnegative().optional(),
  fat: z.number().nonnegative().optional(),
  fiber: z.number().nonnegative().optional(),
});

// Meal schema with nested items
export const createMealSchema = z.object({
  name: z.string().min(1, "Meal name is required"),
  description: z.string().optional(),
  type: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  loggedAt: z.date().optional(),
  foodItems: z
    .array(foodItemSchema)
    .min(1, "At least one food item is required"),
  aiParsed: z.boolean().optional(),
});

// Update schema (all fields optional except ID)
export const updateMealSchema = createMealSchema.partial().extend({
  id: z.string(),
});

// Type inference
export type CreateMealInput = z.infer<typeof createMealSchema>;
export type UpdateMealInput = z.infer<typeof updateMealSchema>;
export type FoodItem = z.infer<typeof foodItemSchema>;
```

## Form Components

### Basic Form Wrapper

```typescript
// src/components/forms/form.tsx
"use client";

import { FormProvider } from "react-hook-form";
import { cn } from "@/lib/utils";
import type { FormProps } from "@/lib/forms";

export function Form<TFormValues extends FieldValues>({
  form,
  onSubmit,
  children,
  className,
}: FormProps<TFormValues>) {
  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("space-y-6", className)}
      >
        {children}
      </form>
    </FormProvider>
  );
}
```

### Text Input Component

```typescript
// src/components/forms/text-input.tsx
"use client";

import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

interface TextInputProps {
  name: string;
  label?: string;
  type?: "text" | "email" | "password" | "number";
  placeholder?: string;
  description?: string;
  required?: boolean;
  className?: string;
}

export function TextInput({
  name,
  label,
  type = "text",
  placeholder,
  description,
  required,
  className,
}: TextInputProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label htmlFor={name} className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        {...register(name, { valueAsNumber: type === "number" })}
        className={cn(
          "w-full px-3 py-2 border rounded-md",
          error && "border-red-500"
        )}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${name}-error` : description ? `${name}-description` : undefined
        }
      />
      
      {description && !error && (
        <p id={`${name}-description`} className="text-sm text-gray-600">
          {description}
        </p>
      )}
      
      {error && (
        <p id={`${name}-error`} className="text-sm text-red-600">
          {error.message}
        </p>
      )}
    </div>
  );
}
```

### Select Component with Controller

```typescript
// src/components/forms/select-input.tsx
"use client";

import { useController, useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectInputProps {
  name: string;
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
}

export function SelectInput({
  name,
  label,
  options,
  placeholder = "Select an option",
  required,
}: SelectInputProps) {
  const { control } = useFormContext();
  const {
    field,
    fieldState: { error },
  } = useController({ name, control });

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={name} className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        id={name}
        {...field}
        className={cn(
          "w-full px-3 py-2 border rounded-md",
          error && "border-red-500"
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p id={`${name}-error`} className="text-sm text-red-600">
          {error.message}
        </p>
      )}
    </div>
  );
}
```

## Form Implementation Examples

### User Profile Form

```typescript
// src/modules/user/schemas.ts
import { z } from "zod";

export const userProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z
    .number()
    .int("Age must be a whole number")
    .min(13, "Must be at least 13 years old")
    .max(120, "Invalid age"),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  height: z
    .number()
    .positive("Height must be positive")
    .max(300, "Invalid height"),
  weight: z
    .number()
    .positive("Weight must be positive")
    .max(500, "Invalid weight"),
  activityLevel: z.enum([
    "sedentary",
    "lightly_active",
    "moderately_active",
    "very_active",
    "extra_active",
  ]),
  dietaryRestrictions: z.array(z.string()).optional(),
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;

// src/modules/user/ui/components/profile-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userProfileSchema, UserProfileInput } from "../../schemas";
import { Form } from "@/components/forms/form";
import { TextInput } from "@/components/forms/text-input";
import { SelectInput } from "@/components/forms/select-input";
import { trpc } from "@/lib/trpc-client";

interface ProfileFormProps {
  initialData?: Partial<UserProfileInput>;
  onSuccess?: () => void;
}

export function ProfileForm({ initialData, onSuccess }: ProfileFormProps) {
  const form = useForm<UserProfileInput>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      name: "",
      activityLevel: "moderately_active",
      dietaryRestrictions: [],
      ...initialData,
    },
  });

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      onSuccess?.();
    },
    onError: (error) => {
      form.setError("root", {
        message: error.message,
      });
    },
  });

  const onSubmit = async (data: UserProfileInput) => {
    await updateProfile.mutateAsync(data);
  };

  return (
    <Form form={form} onSubmit={onSubmit}>
      <TextInput
        name="name"
        label="Full Name"
        required
        placeholder="John Doe"
      />

      <div className="grid grid-cols-2 gap-4">
        <TextInput
          name="age"
          label="Age"
          type="number"
          required
          placeholder="25"
        />

        <SelectInput
          name="gender"
          label="Gender"
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "other", label: "Other" },
            { value: "prefer_not_to_say", label: "Prefer not to say" },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextInput
          name="height"
          label="Height (cm)"
          type="number"
          required
          placeholder="175"
        />

        <TextInput
          name="weight"
          label="Weight (kg)"
          type="number"
          required
          placeholder="70"
        />
      </div>

      <SelectInput
        name="activityLevel"
        label="Activity Level"
        required
        options={[
          { value: "sedentary", label: "Sedentary (little or no exercise)" },
          { value: "lightly_active", label: "Lightly Active (1-3 days/week)" },
          { value: "moderately_active", label: "Moderately Active (3-5 days/week)" },
          { value: "very_active", label: "Very Active (6-7 days/week)" },
          { value: "extra_active", label: "Extra Active (very hard exercise)" },
        ]}
      />

      {form.formState.errors.root && (
        <div className="text-sm text-red-600">
          {form.formState.errors.root.message}
        </div>
      )}

      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {form.formState.isSubmitting ? "Saving..." : "Save Profile"}
      </button>
    </Form>
  );
}
```

### Dynamic Form Arrays

Example with meal food items:

```typescript
// src/modules/meals/ui/components/meal-form.tsx
"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMealSchema, CreateMealInput } from "../../schemas";
import { Plus, Trash2 } from "lucide-react";

export function MealForm() {
  const form = useForm<CreateMealInput>({
    resolver: zodResolver(createMealSchema),
    defaultValues: {
      name: "",
      foodItems: [{ name: "", quantity: 0, unit: "g" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "foodItems",
  });

  const onSubmit = async (data: CreateMealInput) => {
    console.log(data);
  };

  return (
    <Form form={form} onSubmit={onSubmit}>
      <TextInput name="name" label="Meal Name" required />

      <div className="space-y-4">
        <h3 className="font-medium">Food Items</h3>
        
        {fields.map((field, index) => (
          <div key={field.id} className="border p-4 rounded-md space-y-3">
            <div className="flex justify-between">
              <h4 className="font-medium">Item {index + 1}</h4>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <TextInput
              name={`foodItems.${index}.name`}
              label="Food Name"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <TextInput
                name={`foodItems.${index}.quantity`}
                label="Quantity"
                type="number"
                required
              />

              <SelectInput
                name={`foodItems.${index}.unit`}
                label="Unit"
                required
                options={[
                  { value: "g", label: "Grams" },
                  { value: "oz", label: "Ounces" },
                  { value: "cup", label: "Cup" },
                  { value: "piece", label: "Piece" },
                ]}
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              <TextInput
                name={`foodItems.${index}.calories`}
                label="Calories"
                type="number"
              />
              <TextInput
                name={`foodItems.${index}.protein`}
                label="Protein (g)"
                type="number"
              />
              <TextInput
                name={`foodItems.${index}.carbs`}
                label="Carbs (g)"
                type="number"
              />
              <TextInput
                name={`foodItems.${index}.fat`}
                label="Fat (g)"
                type="number"
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => append({ name: "", quantity: 0, unit: "g" })}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Food Item
        </button>
      </div>

      <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded-md">
        Save Meal
      </button>
    </Form>
  );
}
```

## Advanced Validation

### Async Validation

```typescript
// Check if email is already taken
const emailAvailableSchema = z
  .string()
  .email()
  .refine(
    async (email) => {
      const response = await fetch(`/api/check-email?email=${email}`);
      const { available } = await response.json();
      return available;
    },
    {
      message: "Email is already taken",
    }
  );
```

### Cross-Field Validation

```typescript
// Goal setting with dependent validation
const goalSchema = z
  .object({
    type: z.enum(["weight_loss", "weight_gain", "maintain", "muscle_gain"]),
    currentWeight: z.number().positive(),
    targetWeight: z.number().positive(),
    targetDate: z.date().min(new Date(), "Target date must be in the future"),
  })
  .refine(
    (data) => {
      if (data.type === "weight_loss") {
        return data.targetWeight < data.currentWeight;
      }
      if (data.type === "weight_gain") {
        return data.targetWeight > data.currentWeight;
      }
      return true;
    },
    {
      message: "Target weight doesn't match goal type",
      path: ["targetWeight"],
    }
  );
```

### Custom Error Messages

```typescript
// Nutrition validation with custom messages
const nutritionSchema = z.object({
  calories: z
    .number()
    .int("Calories must be a whole number")
    .nonnegative("Calories cannot be negative")
    .max(10000, "That seems like too many calories"),
  
  macros: z
    .object({
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
    })
    .refine(
      (macros) => {
        const totalCalories = (macros.protein * 4) + (macros.carbs * 4) + (macros.fat * 9);
        return Math.abs(totalCalories - data.calories) < 50;
      },
      {
        message: "Macro calories don't match total calories",
      }
    ),
});
```

## Form State Management

### Optimistic Updates

```typescript
const form = useForm();
const utils = trpc.useContext();

const updateMeal = trpc.meals.update.useMutation({
  onMutate: async (newMeal) => {
    // Cancel outgoing refetches
    await utils.meals.get.cancel({ id: newMeal.id });

    // Snapshot previous value
    const previousMeal = utils.meals.get.getData({ id: newMeal.id });

    // Optimistically update
    utils.meals.get.setData({ id: newMeal.id }, newMeal);

    return { previousMeal };
  },
  onError: (err, newMeal, context) => {
    // Rollback on error
    utils.meals.get.setData(
      { id: newMeal.id },
      context.previousMeal
    );
  },
  onSettled: () => {
    // Sync with server
    utils.meals.get.invalidate();
  },
});
```

## Testing Forms

```typescript
// src/modules/auth/ui/components/__tests__/sign-up-form.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignUpForm } from "../sign-up-form";

describe("SignUpForm", () => {
  it("shows validation errors for invalid input", async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    const submitButton = screen.getByRole("button", { name: /sign up/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it("validates password confirmation", async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    await user.type(screen.getByLabelText(/^password/i), "ValidPass123");
    await user.type(screen.getByLabelText(/confirm password/i), "DifferentPass123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });
});
```