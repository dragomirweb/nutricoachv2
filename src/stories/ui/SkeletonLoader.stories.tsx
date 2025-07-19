import type { Meta, StoryObj } from "@storybook/nextjs";
import {
  Skeleton,
  SkeletonCard,
  SkeletonStatCard,
} from "@/components/ui/skeleton-loader";

const meta = {
  title: "UI/SkeletonLoader",
  component: Skeleton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["text", "circular", "rectangular"],
      description: "The variant of the skeleton",
    },
    width: {
      control: "text",
      description: "Width of the skeleton",
    },
    height: {
      control: "text",
      description: "Height of the skeleton",
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {
  args: {
    variant: "text",
    width: 200,
  },
};

export const Circular: Story = {
  args: {
    variant: "circular",
    height: 64,
  },
};

export const Rectangular: Story = {
  args: {
    variant: "rectangular",
    width: 300,
    height: 100,
  },
};

export const TextBlock: Story = {
  render: () => (
    <div className="space-y-2 w-80">
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="60%" />
    </div>
  ),
};

export const CardSkeleton: Story = {
  render: () => <SkeletonCard />,
};

export const StatCardSkeleton: Story = {
  render: () => <SkeletonStatCard />,
};

export const GridSkeleton: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  ),
  parameters: {
    layout: "padded",
  },
};

export const DashboardSkeleton: Story = {
  render: () => (
    <div className="space-y-6 max-w-6xl">
      <div className="space-y-2">
        <Skeleton variant="text" width={200} height={32} />
        <Skeleton variant="text" width={300} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  ),
  parameters: {
    layout: "padded",
  },
};
