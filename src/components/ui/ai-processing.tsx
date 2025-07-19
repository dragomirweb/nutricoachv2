"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface AIProcessingProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  message?: string;
  status?: "processing" | "complete" | "error";
  confidence?: number;
  showConfidence?: boolean;
}

export function AIProcessing({
  className,
  text = "Processing your meal...",
  message,
  status = "processing",
  confidence,
  showConfidence = false,
  ...props
}: AIProcessingProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4",
        "bg-muted/50 rounded-lg",
        "animate-in fade-in-0 slide-in-from-bottom-2",
        className
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      {...props}
    >
      {status === "processing" && (
        <Loader2
          className="h-8 w-8 animate-spin text-primary"
          aria-hidden="true"
        />
      )}
      <div className="flex-1 space-y-1">
        <p className="text-sm text-muted-foreground">{message || text}</p>
        {showConfidence && confidence !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Confidence: {Math.round(confidence)}%
            </span>
            <div className="h-1 w-16 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
