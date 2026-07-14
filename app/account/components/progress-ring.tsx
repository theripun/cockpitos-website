"use client";

import { cn } from "@/lib/utils";

type ProgressRingProps = {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

export function ProgressRing({
  progress,
  size = 40,
  strokeWidth = 3,
  className,
}: ProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, progress));
  const dash = c * (1 - clamped);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("shrink-0 -rotate-90", className)}
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={dash}
      />
    </svg>
  );
}
