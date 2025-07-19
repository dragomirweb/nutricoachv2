import type { Meta, StoryObj } from "@storybook/nextjs";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { useState } from "react";

const meta = {
  title: "UI/VoiceInputButton",
  component: VoiceInputButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    isRecording: {
      control: "boolean",
      description: "Whether the button is in recording state",
    },
    disabled: {
      control: "boolean",
      description: "Whether the button is disabled",
    },
  },
} satisfies Meta<typeof VoiceInputButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isRecording: false,
  },
};

export const Recording: Story = {
  args: {
    isRecording: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Interactive: Story = {
  render: () => {
    const Component = () => {
      const [isRecording, setIsRecording] = useState(false);

      return (
        <div className="flex flex-col items-center gap-4">
          <VoiceInputButton
            isRecording={isRecording}
            onStartRecording={() => setIsRecording(true)}
            onStopRecording={() => setIsRecording(false)}
          />
          <p className="text-sm text-muted-foreground">
            {isRecording
              ? "Recording... Click to stop"
              : "Click to start recording"}
          </p>
        </div>
      );
    };

    return <Component />;
  },
};
