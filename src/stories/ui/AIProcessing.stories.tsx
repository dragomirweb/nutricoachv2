import type { Meta, StoryObj } from "@storybook/nextjs";
import { AIProcessing } from "@/components/ui/ai-processing";

const meta = {
  title: "UI/AIProcessing",
  component: AIProcessing,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    text: {
      control: "text",
      description: "The processing status text",
    },
    confidence: {
      control: { type: "range", min: 0, max: 100, step: 1 },
      description: "AI confidence percentage",
    },
    showConfidence: {
      control: "boolean",
      description: "Whether to show the confidence indicator",
    },
  },
} satisfies Meta<typeof AIProcessing>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    text: "Processing your meal...",
  },
};

export const WithConfidence: Story = {
  args: {
    text: "Analyzing nutritional content...",
    showConfidence: true,
    confidence: 85,
  },
};

export const LowConfidence: Story = {
  args: {
    text: "Uncertain about some items...",
    showConfidence: true,
    confidence: 45,
  },
};

export const CustomText: Story = {
  args: {
    text: "Identifying ingredients and calculating macros...",
    showConfidence: true,
    confidence: 92,
  },
};
