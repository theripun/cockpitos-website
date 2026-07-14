import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type PlanDetailsSectionProps = {
  planName: string;
  /** Short line under the plan name (pricing cadence, features blurb, etc.) */
  description?: string;
  renewalLabel?: string;
  statusLabel?: string;
  className?: string;
};

export function PlanDetailsSection({
  planName,
  description = "Monthly billing · All core features included",
  renewalLabel = "Next renewal · Feb 3, 2026",
  statusLabel = "Active",
  className,
}: PlanDetailsSectionProps) {
  return (
    <section
      className={cn(
        "relative mt-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#050505]",
        className
      )}
      aria-label="Current plan"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        aria-hidden
      />
      <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-7">
        <div className="flex min-w-0 gap-4">
         
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
              Your plan
            </p>
            <h2 className="mt-1.5 truncate text-xl font-bold tracking-tight text-white sm:text-[22px] sm:leading-tight">
              {planName}
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500">{description}</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white animate-pulse">
            <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
            {statusLabel}
          </span>
          <p className="text-[13px] font-medium tabular-nums text-white">{renewalLabel}</p>
        </div>
      </div>
    </section>
  );
}
