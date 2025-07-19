"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  progress?: number;
  progressColor?:
    | "primary"
    | "success"
    | "warning"
    | "destructive"
    | "secondary";
  trend?: {
    value: number;
    isPositive?: boolean;
    label?: string;
  };
}

export function StatCard({
  className,
  label,
  value,
  icon: Icon,
  progress,
  progressColor = "primary",
  trend,
  ...props
}: StatCardProps) {
  const progressColorMap = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    success: "bg-[rgb(var(--success))]",
    warning: "bg-[rgb(var(--warning))]",
    destructive: "bg-destructive",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        "bg-card rounded-xl p-6",
        "shadow-md hover:shadow-lg",
        "transition-all duration-200",
        "before:absolute before:top-0 before:left-0 before:right-0 before:h-1",
        "before:bg-gradient-to-r before:from-primary before:to-[rgb(var(--success))]",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
        </div>
        {Icon && (
          <div className="p-2 rounded-lg bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>

      {trend && (
        <p
          className={cn(
            "text-sm font-medium mb-3",
            trend.isPositive !== false
              ? "text-[rgb(var(--success))]"
              : "text-destructive"
          )}
        >
          {trend.isPositive ? "+" : ""}
          {trend.value}
          {trend.label ? ` ${trend.label}` : "% from last week"}
        </p>
      )}

      {progress !== undefined && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                progressColorMap[progressColor]
              )}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
