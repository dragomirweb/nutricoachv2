import type { Meta, StoryObj } from "@storybook/nextjs";
import { MacroRing, MacroLegend } from "@/components/ui/macro-ring";

const meta = {
  title: "UI/MacroRing",
  component: MacroRing,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
      description: "Size of the macro ring",
    },
    totalCalories: {
      control: { type: "number" },
      description: "Total calories to display in center",
    },
  },
} satisfies Meta<typeof MacroRing>;

export default meta;
type Story = StoryObj<typeof meta>;

const balancedData = {
  protein: 30,
  carbs: 40,
  fat: 30,
};

const highProteinData = {
  protein: 50,
  carbs: 25,
  fat: 25,
};

const highCarbData = {
  protein: 20,
  carbs: 60,
  fat: 20,
};

export const Balanced: Story = {
  args: {
    data: balancedData,
    totalCalories: 2000,
    size: "md",
  },
};

export const HighProtein: Story = {
  args: {
    data: highProteinData,
    totalCalories: 1800,
    size: "md",
  },
};

export const HighCarb: Story = {
  args: {
    data: highCarbData,
    totalCalories: 2200,
    size: "md",
  },
};

export const Small: Story = {
  args: {
    data: balancedData,
    totalCalories: 1500,
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    data: balancedData,
    totalCalories: 2500,
    size: "lg",
  },
};

export const WithLegend: Story = {
  args: {
    data: { protein: 35, carbs: 45, fat: 20 },
    totalCalories: 1850,
    size: "md",
  },
  render: (args) => {
    return (
      <div className="flex flex-col items-center gap-6">
        <MacroRing {...args} />
        <MacroLegend data={args.data} />
      </div>
    );
  },
};
