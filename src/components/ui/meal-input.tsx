"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { VoiceInputButton } from "./voice-input-button";

interface MealInputProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onVoiceInput?: (transcript: string) => void;
  voiceEnabled?: boolean;
}

export function MealInput({
  className,
  placeholder = "Describe your meal in natural language...\ne.g., 'I had a grilled chicken salad with olive oil dressing and a side of brown rice'",
  onVoiceInput,
  voiceEnabled = true,
  ...props
}: MealInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isRecording, setIsRecording] = React.useState(false);

  const handleStartRecording = () => {
    setIsRecording(true);
    // Voice recording logic would go here
    // For now, just simulate with a timeout
    setTimeout(() => {
      const mockTranscript =
        "Grilled chicken breast with quinoa and steamed broccoli";
      if (textareaRef.current) {
        textareaRef.current.value = mockTranscript;
        textareaRef.current.dispatchEvent(
          new Event("input", { bubbles: true })
        );
      }
      onVoiceInput?.(mockTranscript);
      setIsRecording(false);
    }, 2000);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        className={cn(
          "w-full min-h-[120px] p-4",
          "border-2 border-input rounded-xl",
          "text-base leading-relaxed",
          "placeholder:text-muted-foreground placeholder:italic",
          "resize-none",
          "transition-all duration-200",
          "focus:outline-none focus:border-primary",
          "focus:ring-3 focus:ring-primary/10",
          "disabled:cursor-not-allowed disabled:opacity-50",
          voiceEnabled && "pr-20",
          className
        )}
        placeholder={placeholder}
        aria-label="Meal description"
        {...props}
      />
      {voiceEnabled && (
        <div className="absolute bottom-4 right-4">
          <VoiceInputButton
            isRecording={isRecording}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            disabled={props.disabled}
          />
        </div>
      )}
    </div>
  );
}
