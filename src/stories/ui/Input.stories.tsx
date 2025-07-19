import type { Meta, StoryObj } from "@storybook/nextjs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Mail, Lock, User } from "lucide-react";

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "tel", "url", "search"],
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
};

export const Email: Story = {
  args: {
    type: "email",
    placeholder: "email@example.com",
  },
};

export const Password: Story = {
  args: {
    type: "password",
    placeholder: "Enter your password",
  },
};

export const SearchInput: Story = {
  args: {
    type: "search",
    placeholder: "Search...",
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Disabled input",
    disabled: true,
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email-error">Email</Label>
      <Input
        type="email"
        id="email-error"
        placeholder="Email"
        className="border-destructive focus-visible:ring-destructive"
      />
      <p className="text-sm text-destructive">
        Please enter a valid email address
      </p>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-10" placeholder="Search foods..." />
      </div>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-10" type="email" placeholder="Email" />
      </div>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-10" type="password" placeholder="Password" />
      </div>
      <div className="relative">
        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-10" placeholder="Username" />
      </div>
    </div>
  ),
};

export const NutritionInputs: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <div>
        <Label htmlFor="meal-description">What did you eat?</Label>
        <Input
          id="meal-description"
          placeholder="e.g., 2 eggs, toast with butter, and orange juice"
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="calories">Calories</Label>
          <Input id="calories" type="number" placeholder="0" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="protein">Protein (g)</Label>
          <Input id="protein" type="number" placeholder="0" className="mt-1" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="carbs">Carbs (g)</Label>
          <Input id="carbs" type="number" placeholder="0" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="fat">Fat (g)</Label>
          <Input id="fat" type="number" placeholder="0" className="mt-1" />
        </div>
      </div>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-sm">
      <Input placeholder="Default input" />
      <Input type="email" placeholder="Email input" />
      <Input type="password" placeholder="Password input" />
      <Input type="number" placeholder="Number input" />
      <Input type="search" placeholder="Search input" />
      <Input disabled placeholder="Disabled input" />
      <Input
        placeholder="Error state"
        className="border-destructive focus-visible:ring-destructive"
      />
    </div>
  ),
};
