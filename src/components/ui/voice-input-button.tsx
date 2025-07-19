"use client";

import * as React from "react";
import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceInputButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isRecording?: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
}

export function VoiceInputButton({
  className,
  isRecording = false,
  onStartRecording,
  onStopRecording,
  disabled,
  ...props
}: VoiceInputButtonProps) {
  const handleClick = () => {
    if (isRecording) {
      onStopRecording?.();
    } else {
      onStartRecording?.();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={isRecording ? "Stop recording" : "Start voice recording"}
      className={cn(
        "touch-target inline-flex items-center justify-center",
        "h-16 w-16 rounded-full",
        "bg-primary text-primary-foreground",
        "shadow-lg hover:shadow-xl",
        "transition-all duration-200",
        "active:scale-95",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        isRecording && [
          "recording bg-destructive hover:bg-destructive/90",
          "scale-110",
        ],
        className
      )}
      {...props}
    >
      <Mic
        className={cn("h-6 w-6", isRecording && "animate-pulse")}
        aria-hidden="true"
      />
    </button>
  );
}
