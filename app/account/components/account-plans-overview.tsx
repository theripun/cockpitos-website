import Link from "next/link";
import { cn } from "@/lib/utils";

type PlanSpec = {
  id: "free" | "paid";
  name: string;
  eyebrow: string;
  price: string;
  priceNote?: string;
  blurb: string;
  footnote?: string;
  cta?: { href: string; label: string };
  highlighted?: boolean;
};

const PLANS: PlanSpec[] = [
  {
    id: "free",
    name: "Free Forever",
    eyebrow: "Starter",
    price: "$0",
    priceNote: "/ month",
    blurb: "Enough to try Cockpit and run a small footprint.",
    footnote: "Included with every account.",
  },
  {
    id: "paid",
    name: "Paid",
    eyebrow: "Everything unlimited",
    price: "$19",
    priceNote: "/ month",
    blurb: "No ads, higher limits, built for steady use.",
    cta: { href: "/", label: "Subscribe" },
    highlighted: true,
  },
];

const COMPARE: { label: string; free: string; paid: string }[] = [
  { label: "Ads", free: "Ad-supported", paid: "None" },
  { label: "Device capacity", free: "Up to 2", paid: "Unlimited" },
  { label: "Bandwidth", free: "50 GB / mo", paid: "1 TB" },
  { label: "Storage", free: "100 GB", paid: "1,000 GB" },
  { label: "API requests", free: "5,000 / mo", paid: "Unlimited" },
];

const OVERAGE_ROWS: {
  resource: string;
  rate: string;
  billing: string;
}[] = [
  {
    resource: "API requests",
    rate: "$0.02 per 1,000 requests",
    billing: "After OTP approval",
  },
  {
    resource: "Bandwidth",
    rate: "$0.01 per GB",
    billing: "After OTP approval",
  },
  {
    resource: "Storage above plan cap",
    rate: "$0.025 per GB / month",
    billing: "After OTP approval",
  },
];

function PlanCard({ plan }: { plan: PlanSpec }) {
  return (
    <article
      className={cn(
        "flex h-full min-h-0 flex-col rounded-2xl border p-8 sm:p-9",
        plan.highlighted
          ? "border-white/[0.08] bg-[#000]"
          : "border-white/[0.08] bg-[#000]"
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
        {plan.eyebrow}
      </p>
      <h2 className="mt-3 text-lg font-semibold tracking-tight text-white">{plan.name}</h2>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-[2.75rem] font-light leading-none tracking-tight text-white tabular-nums sm:text-5xl">
          {plan.price}
        </span>
        {plan.priceNote ? (
          <span className="text-sm font-normal text-zinc-500">{plan.priceNote}</span>
        ) : null}
      </div>

      <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-zinc-500">{plan.blurb}</p>

      <div className="mt-10 min-h-0 flex-1">
        <div className="flex flex-col">
          {COMPARE.map((row, i) => (
            <div
              key={row.label}
              className={cn(
                "flex items-baseline justify-between gap-6 py-3.5",
                i > 0 && "border-t border-white/[0.06]"
              )}
            >
              <span className="text-[13px] text-zinc-500 font-medium">{row.label}</span>
              <span className="text-right text-[13px] tabular-nums text-white font-semibold">
                {plan.id === "free" ? row.free : row.paid}
              </span>
            </div>
          ))}
        </div>
      </div>

      {plan.footnote ? (
        <p className="mt-8 text-center text-[12px] leading-relaxed text-zinc-600">{plan.footnote}</p>
      ) : null}

      {plan.cta ? (
        <Link
          href={plan.cta.href}
          className={cn(
            "mt-8 flex w-full items-center justify-center rounded-full border border-white/5 bg-black py-3 text-[13px] font-medium text-white transition-colors hover:border-white/10 hover:bg-black"
          )}
        >
          {plan.cta.label}
        </Link>
      ) : null}
    </article>
  );
}

type Props = { className?: string };

export function AccountPlansOverview({ className }: Props) {
  return (
    <div className={cn("mt-12 space-y-10", className)}>
      <div
        id="plan-comparison"
        className="grid gap-4 scroll-mt-8 sm:grid-cols-2 sm:gap-5 sm:items-stretch"
      >
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>

      <section
        className="rounded-2xl border border-white/[0.08] bg-[#000] px-6 py-8 sm:px-8 sm:py-10"
        aria-labelledby="overage-billing-heading"
      >
        <h2
          id="overage-billing-heading"
          className="text-lg font-semibold tracking-tight text-white"
        >
          Overage Billing
        </h2>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-zinc-500">
          If you exceed your included request limit, additional requests will be billed after
          your approval via OTP. No unexpected charges.{" "}
          <Link
            href="#plan-comparison"
            className="font-medium text-zinc-300 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white hover:decoration-white/40"
          >
            View price plans
          </Link>
          .
        </p>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="pb-3 pr-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                  Resource
                </th>
                <th className="pb-3 pr-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                  Overage rate
                </th>
                <th className="pb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                  Billing
                </th>
              </tr>
            </thead>
            <tbody>
              {OVERAGE_ROWS.map((row) => (
                <tr key={row.resource} className="border-b border-white/[0.05] last:border-b-0">
                  <td className="py-3.5 pr-4 text-[13px] font-medium text-zinc-200">
                    {row.resource}
                  </td>
                  <td className="py-3.5 pr-4 text-[13px] tabular-nums text-zinc-400">
                    {row.rate}
                  </td>
                  <td className="py-3.5 text-[13px] text-zinc-500">{row.billing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
