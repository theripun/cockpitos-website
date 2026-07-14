"use client";

import { cn } from "@/lib/utils";

function MastercardMark({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-8 w-[42px] shrink-0", className)} aria-hidden>
      <div className="absolute left-0 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-[#eb001b]/90" />
      <div className="absolute left-[14px] top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-[#f79e1b]/90 mix-blend-screen" />
    </div>
  );
}

type PaymentMethodCardProps = {
  className?: string;
};

export function PaymentMethodCard({ className }: PaymentMethodCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-[#000] px-6 py-5",
        className
      )}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-white">Payment method</h3>
          <p className="mt-1 max-w-md text-[13px] leading-relaxed text-zinc-500">
            This is the payment method used for subscription and buying credits
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <MastercardMark />
          <div>
            <p className="text-[14px] font-medium text-white">Mastercard ••••1406</p>
            <p className="mt-0.5 text-[12px] text-zinc-500">Expires 01/2031</p>
          </div>
        </div>
        <button
          type="button"
          className="w-full shrink-0 rounded-full cursor-pointer bg-[#000] border border-white/[0.08] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#fff]/5 sm:w-auto"
        >
          Edit payment method
        </button>
      </div>
    </div>
  );
}
