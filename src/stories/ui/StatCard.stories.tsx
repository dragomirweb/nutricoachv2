import type { Meta, StoryObj } from "@storybook/nextjs";
import { StatCard } from "@/components/ui/stat-card";
import { TrendingUp, Apple, Flame, Target } from "lucide-react";

const meta = {
  title: "UI/StatCard",
  component: StatCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    progressColor: {
      control: { type: "select" },
      options: ["primary", "success", "warning", "destructive"],
      description: "Color of the progress bar",
    },
    progress: {
      control: { type: "range", min: 0, max: 100, step: 1 },
      description: "Progress percentage",
    },
  },
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    label: "Calories Today",
    value: "1,850",
  },
};

export const WithIcon: Story = {
  args: {
    label: "Calories Today",
    value: "1,850",
    icon: Flame,
  },
};

export const WithProgress: Story = {
  args: {
    label: "Daily Goal",
    value: "1,850 / 2,000",
    icon: Target,
    progress: 92.5,
    progressColor: "success",
  },
};

export const WithTrend: Story = {
  args: {
    label: "Average Calories",
    value: "2,150",
    icon: TrendingUp,
    trend: {
      value: 5.2,
      isPositive: true,
    },
  },
};

export const NegativeTrend: Story = {
  args: {
    label: "Weekly Average",
    value: "2,450",
    icon: Flame,
    trend: {
      value: -3.8,
      isPositive: false,
    },
  },
};

export const Complete: Story = {
  args: {
    label: "Protein Intake",
    value: "125g",
    icon: Apple,
    progress: 85,
    progressColor: "primary",
    trend: {
      value: 12,
      isPositive: true,
    },
  },
};

export const Grid: Story = {
  args: {
    label: "Example",
    value: "0",
  },
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
      <StatCard
        label="Calories Today"
        value="1,850"
        icon={Flame}
        progress={92.5}
        progressColor="success"
      />
      <StatCard
        label="Protein"
        value="125g"
        icon={Apple}
        progress={85}
        progressColor="primary"
        trend={{ value: 5, isPositive: true }}
      />
      <StatCard
        label="Weekly Goal"
        value="6 / 7 days"
        icon={Target}
        progress={85.7}
        progressColor="warning"
      />
    </div>
  ),
  parameters: {
    layout: "padded",
  },
};
