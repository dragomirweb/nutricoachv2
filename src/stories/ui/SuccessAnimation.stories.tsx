import type { Meta, StoryObj } from "@storybook/nextjs";
import { SuccessAnimation } from "@/components/ui/success-animation";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const meta = {
  title: "UI/SuccessAnimation",
  component: SuccessAnimation,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
      description: "Size of the animation",
    },
  },
} satisfies Meta<typeof SuccessAnimation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: {
    size: "sm",
  },
};

export const Medium: Story = {
  args: {
    size: "md",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
  },
};

export const WithCallback: Story = {
  render: () => {
    const Component = () => {
      const [showAnimation, setShowAnimation] = useState(false);
      const [message, setMessage] = useState("");

      const handleClick = () => {
        setShowAnimation(true);
        setMessage("");
      };

      const handleComplete = () => {
        setMessage("Animation completed!");
        setTimeout(() => setShowAnimation(false), 1000);
      };

      return (
        <div className="flex flex-col items-center gap-4">
          {showAnimation ? (
            <SuccessAnimation size="md" onComplete={handleComplete} />
          ) : (
            <Button onClick={handleClick}>Show Success Animation</Button>
          )}
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
        </div>
      );
    };

    return <Component />;
  },
};
