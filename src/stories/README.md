# NutriCoach v2 Storybook

This directory contains Storybook stories for NutriCoach v2 components.

## Running Storybook

```bash
npm run storybook
```

This will start Storybook on http://localhost:6006

## Building Storybook

```bash
npm run build-storybook
```

## Component Organization

Stories are organized by component type:

- `/ui` - shadcn/ui components
- `/features` - Feature-specific components (to be added)
- `/layouts` - Layout components (to be added)

## Writing Stories

Each story file follows the Component Story Format (CSF) 3.0:

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { ComponentName } from "@/components/ui/component-name";

const meta = {
  title: "UI/ComponentName",
  component: ComponentName,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // default props
  },
};
```

## Features

- **Theme Support**: Toggle between light and dark themes using the toolbar
- **Viewport Testing**: Test components in different screen sizes
- **Accessibility Testing**: Built-in a11y testing with @storybook/addon-a11y
- **Auto Documentation**: Components are automatically documented using TypeScript types
- **NutriCoach Themed**: Uses our custom color palette and design system

## Available Components

Currently documented components:

- Button - All variants and sizes
- Card - Including nutrition-specific examples
- Input - With form examples and nutrition inputs
- Badge - Including meal types and nutrition labels
- Select - With nutrition-specific options

More components will be added as the project develops.
