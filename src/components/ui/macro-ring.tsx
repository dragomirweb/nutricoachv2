"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MacroData {
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

interface MacroRingProps extends React.HTMLAttributes<HTMLDivElement> {
  data: MacroData;
  totalCalories: number;
  size?: "sm" | "md" | "lg";
}

const sizeConfig = {
  sm: { width: 120, strokeWidth: 12, fontSize: "text-lg" },
  md: { width: 200, strokeWidth: 20, fontSize: "text-2xl" },
  lg: { width: 280, strokeWidth: 28, fontSize: "text-3xl" },
};

export function MacroRing({
  className,
  data,
  totalCalories,
  size = "md",
  ...props
}: MacroRingProps) {
  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const total = data.protein + data.carbs + data.fat;
  const proteinPercentage = (data.protein / total) * 100;
  const carbsPercentage = (data.carbs / total) * 100;
  const fatPercentage = (data.fat / total) * 100;

  const proteinDasharray = `${(proteinPercentage / 100) * circumference} ${circumference}`;
  const carbsDasharray = `${(carbsPercentage / 100) * circumference} ${circumference}`;
  const fatDasharray = `${(fatPercentage / 100) * circumference} ${circumference}`;

  const proteinOffset = 0;
  const carbsOffset = -((proteinPercentage / 100) * circumference);
  const fatOffset = -(
    ((proteinPercentage + carbsPercentage) / 100) *
    circumference
  );

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
      {...props}
    >
      <svg
        width={config.width}
        height={config.width}
        viewBox={`0 0 ${config.width} ${config.width}`}
        className="-rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--muted))"
          strokeWidth={config.strokeWidth}
        />

        {/* Protein segment */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--protein))"
          strokeWidth={config.strokeWidth}
          strokeDasharray={proteinDasharray}
          strokeDashoffset={proteinOffset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />

        {/* Carbs segment */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--carbs))"
          strokeWidth={config.strokeWidth}
          strokeDasharray={carbsDasharray}
          strokeDashoffset={carbsOffset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />

        {/* Fat segment */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--fat))"
          strokeWidth={config.strokeWidth}
          strokeDasharray={fatDasharray}
          strokeDashoffset={fatOffset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-bold text-foreground", config.fontSize)}>
          {totalCalories}
        </span>
        <span className="text-xs text-muted-foreground">calories</span>
      </div>
    </div>
  );
}

export function MacroLegend({ data }: { data: MacroData }) {
  const total = data.protein + data.carbs + data.fat;

  return (
    <div className="flex gap-4 text-sm">
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded-full bg-[rgb(var(--protein))]" />
        <span className="text-muted-foreground">
          Protein {Math.round((data.protein / total) * 100)}%
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded-full bg-[rgb(var(--carbs))]" />
        <span className="text-muted-foreground">
          Carbs {Math.round((data.carbs / total) * 100)}%
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded-full bg-[rgb(var(--fat))]" />
        <span className="text-muted-foreground">
          Fat {Math.round((data.fat / total) * 100)}%
        </span>
      </div>
    </div>
  );
}
