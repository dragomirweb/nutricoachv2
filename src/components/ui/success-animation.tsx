"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SuccessAnimationProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  onComplete?: () => void;
}

const sizeMap = {
  sm: 40,
  md: 80,
  lg: 120,
};

export function SuccessAnimation({
  className,
  size = "md",
  onComplete,
  ...props
}: SuccessAnimationProps) {
  React.useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(onComplete, 1100);
      return () => clearTimeout(timer);
    }
  }, [onComplete]);

  const svgSize = sizeMap[size];
  const strokeWidth = size === "sm" ? 3 : 2;

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        "animate-in fade-in-0 zoom-in-50",
        className
      )}
      {...props}
    >
      <svg
        width={svgSize}
        height={svgSize}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Success"
        role="img"
      >
        <circle
          cx="40"
          cy="40"
          r="35"
          stroke="rgb(var(--success))"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray="166"
          strokeDashoffset="166"
          style={{
            animation: "stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards",
          }}
        />
        <path
          d="M25 40 L35 50 L55 30"
          stroke="rgb(var(--success))"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="48"
          strokeDashoffset="48"
          style={{
            animation:
              "stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards",
          }}
        />
      </svg>
    </div>
  );
}
