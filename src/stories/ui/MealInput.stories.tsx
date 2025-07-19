import type { Meta, StoryObj } from "@storybook/nextjs";
import { MealInput } from "@/components/ui/meal-input";
import { useState } from "react";

const meta = {
  title: "UI/MealInput",
  component: MealInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    voiceEnabled: {
      control: "boolean",
      description: "Whether voice input is enabled",
    },
    disabled: {
      control: "boolean",
      description: "Whether the input is disabled",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
  },
} satisfies Meta<typeof MealInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    voiceEnabled: true,
  },
};

export const NoVoice: Story = {
  args: {
    voiceEnabled: false,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    voiceEnabled: true,
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: "Grilled salmon with asparagus and sweet potato",
    voiceEnabled: true,
  },
};

export const Interactive: Story = {
  render: () => {
    const Component = () => {
      const [value, setValue] = useState("");
      const [voiceTranscript, setVoiceTranscript] = useState("");

      return (
        <div className="w-full max-w-lg space-y-4">
          <MealInput
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onVoiceInput={(transcript) => {
              setVoiceTranscript(transcript);
              setValue(transcript);
            }}
          />
          {voiceTranscript && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Voice transcript: &quot;{voiceTranscript}&quot;
              </p>
            </div>
          )}
          {value && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Current value:</p>
              <p className="text-sm text-muted-foreground">{value}</p>
            </div>
          )}
        </div>
      );
    };

    return <Component />;
  },
};
