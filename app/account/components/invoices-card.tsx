"use client";

import { cn } from "@/lib/utils";

type InvoiceRow = {
  number: string;
  dueDate: string;
  status: string;
  statusTone: "paid" | "open";
};

const mockInvoices: InvoiceRow[] = [
  { number: "INV-2026-0142", dueDate: "Jan 3, 2026", status: "Paid", statusTone: "paid" },
  { number: "INV-2025-1188", dueDate: "Dec 3, 2025", status: "Paid", statusTone: "paid" },
  { number: "INV-2025-1044", dueDate: "Nov 3, 2025", status: "Paid", statusTone: "paid" },
];

type InvoicesCardProps = {
  className?: string;
};

export function InvoicesCard({ className }: InvoicesCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-[#000] px-6 py-5",
        className
      )}
    >
      <div className="mb-1">
        <h3 className="text-[15px] font-semibold text-white">Invoices</h3>
        <p className="mt-1 text-[13px] text-zinc-500">
          Your payment history for your subscription
        </p>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[440px]">
          <div className="grid grid-cols-[1fr_120px_100px] gap-4 border-b border-white/[0.06] pb-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
            <span>Invoice number</span>
            <span>Due date</span>
            <span>Status</span>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {mockInvoices.map((inv) => (
              <div
                key={inv.number}
                className="grid grid-cols-[1fr_120px_100px] items-center gap-4 py-3.5 text-[13px]"
              >
                <span className="font-medium text-zinc-200">{inv.number}</span>
                <span className="text-zinc-500">{inv.dueDate}</span>
                <span
                  className={cn(
                    "font-medium",
                    inv.statusTone === "paid" ? "text-emerald-500" : "text-amber-400"
                  )}
                >
                  {inv.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
