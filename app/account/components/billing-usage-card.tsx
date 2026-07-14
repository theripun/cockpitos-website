"use client";

import { CheckCircle2 } from "lucide-react";
import { ProgressRing } from "./progress-ring";
import { cn } from "@/lib/utils";

type UsageRow = {
  product: string;
  usageLabel: string;
  charge: string;
  progress: number;
};

const rows: UsageRow[] = [
  { product: "Device Capacity", usageLabel: "2 of 5 active", charge: "$2.15", progress: 2 / 5 },
  { product: "Bandwidth Usage", usageLabel: "320 GB of 1 TB transferred", charge: "$0.85", progress: 1 / 4},
  { product: "Storage Utilization", usageLabel: "483 GB of 2,000 GB used", charge: "$0.85", progress: 483 / 2000 },
  { product: "API Requests", usageLabel: "483 of 2,000 requests", charge: "$0.34", progress: 483 / 2000 },
];

type BillingUsageCardProps = {
  className?: string;
};

const thClass =
  "border-b border-white/[0.06] px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600";

export function BillingUsageCard({ className }: BillingUsageCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-white/[0.08] bg-[#000]",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] table-fixed border-separate border-spacing-0">
          <colgroup>
            <col className="w-[42%]" />
            <col className="w-[38%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead>
            <tr>
              <th className={thClass}>Usage Overview</th>
              <th className={thClass}>Current</th>
              <th className={cn(thClass, "text-right")}>Charge</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.product}>
                <td className="align-middle border-b border-white/[0.06] px-6 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex w-[38px] shrink-0 justify-center">
                      <ProgressRing progress={row.progress} size={28} strokeWidth={2.5} />
                    </div>
                    <span className="min-w-0 truncate text-[14px] font-medium text-white">
                      {row.product}
                    </span>
                  </div>
                </td>
                <td className="align-middle border-b border-white/[0.06] px-6 py-4">
                  <span className="block text-[13px] leading-snug text-white">{row.usageLabel}</span>
                </td>
                <td className="align-middle border-b border-white/[0.06] px-6 py-4 text-right">
                  <div className="inline-flex items-center justify-end gap-2">
                    <span className="whitespace-nowrap text-[14px] font-medium tabular-nums text-white">
                      {row.charge}
                    </span>
                    <CheckCircle2
                      className="h-[18px] w-[18px] shrink-0 text-emerald-500"
                      strokeWidth={2}
                      aria-hidden
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-white/[0.06] px-6 py-5">
        <div className="flex flex-col gap-1">
          <p className="text-[15px] text-white">
            Total: <span className="font-semibold tabular-nums">$19 / month</span>
          </p>
          <p className="text-[13px] text-zinc-500">Next payment due on May 3</p>
        </div>
      </div>

      <div className="border-t border-white/[0.06] bg-black/[0.15] px-6 py-5">
        <p className="text-[13px] font-semibold text-white">Overage Billing</p>
        <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-zinc-500">
        If you exceed your included request limit, additional requests will be billed after your approval via OTP. No unexpected charges.{" "}
          <button type="button" className="font-medium text-white underline-offset-4 hover:underline">
            View price plans.
          </button>
        </p>
      </div>
    </div>
  );
}
