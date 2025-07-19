import * as React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton",
        variant === "circular" && "rounded-full",
        variant === "text" && "h-4 rounded",
        variant === "rectangular" && "rounded-md",
        className
      )}
      style={{
        width: width || (variant === "circular" ? height : undefined),
        height: height,
        ...style,
      }}
      aria-busy="true"
      aria-live="polite"
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-card rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <Skeleton height={100} />
      <div className="flex gap-2">
        <Skeleton variant="text" width="30%" />
        <Skeleton variant="text" width="30%" />
      </div>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="bg-card rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton variant="text" width={80} />
          <Skeleton variant="text" width={120} height={32} />
        </div>
        <Skeleton variant="rectangular" width={40} height={40} />
      </div>
      <Skeleton height={8} className="rounded-full" />
    </div>
  );
}
