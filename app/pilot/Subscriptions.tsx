"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  DollarSign,
  TrendingUp,
  Users,
  FileText,
  CreditCard,
  MoreHorizontal,
  ArrowUpRight,
  RefreshCw,
  Filter,
  Download,
} from "lucide-react";

type SubStatus = "active" | "trialing" | "past_due" | "canceled" | "paused";

type SubscriptionRow = {
  id: string;
  customer: string;
  email: string;
  plan: string;
  status: SubStatus;
  amountUsd: number;
  interval: "month" | "year";
  nextInvoice: string | null;
  mrrUsd: number;
  paymentLast4: string;
  startedAt: string;
};

const MOCK_SUBS: SubscriptionRow[] = [
  {
    id: "sub_8K2m",
    customer: "Acme Design Co.",
    email: "billing@acmedesign.io",
    plan: "Business",
    status: "active",
    amountUsd: 149,
    interval: "month",
    nextInvoice: "2026-04-28",
    mrrUsd: 149,
    paymentLast4: "4242",
    startedAt: "2025-01-14",
  },
  {
    id: "sub_3Nx9",
    customer: "Northwind Labs",
    email: "finance@northwind.dev",
    plan: "Enterprise",
    status: "active",
    amountUsd: 2400,
    interval: "year",
    nextInvoice: "2026-11-02",
    mrrUsd: 200,
    paymentLast4: "1881",
    startedAt: "2024-06-01",
  },
  {
    id: "sub_1Qw4",
    customer: "River Studio",
    email: "hello@river.studio",
    plan: "Pro",
    status: "trialing",
    amountUsd: 49,
    interval: "month",
    nextInvoice: "2026-04-12",
    mrrUsd: 49,
    paymentLast4: "0099",
    startedAt: "2026-03-29",
  },
  {
    id: "sub_7Zp2",
    customer: "Kolkata Relay",
    email: "ops@kolkata-relay.in",
    plan: "Business",
    status: "past_due",
    amountUsd: 149,
    interval: "month",
    nextInvoice: "2026-04-01",
    mrrUsd: 0,
    paymentLast4: "4242",
    startedAt: "2025-08-20",
  },
  {
    id: "sub_4Hm8",
    customer: "Sigma Freelance",
    email: "sigma@example.com",
    plan: "Starter",
    status: "canceled",
    amountUsd: 19,
    interval: "month",
    nextInvoice: null,
    mrrUsd: 0,
    paymentLast4: "5555",
    startedAt: "2024-03-10",
  },
  {
    id: "sub_9Rt1",
    customer: "Gupta Tech",
    email: "accounts@guptatech.in",
    plan: "Pro",
    status: "paused",
    amountUsd: 49,
    interval: "month",
    nextInvoice: null,
    mrrUsd: 0,
    paymentLast4: "6011",
    startedAt: "2025-11-01",
  },
];

const MOCK_INVOICES = [
  { id: "inv_1024", customer: "Acme Design Co.", amountUsd: 149, status: "paid", date: "2026-03-28" },
  { id: "inv_1023", customer: "Northwind Labs", amountUsd: 2400, status: "paid", date: "2026-03-15" },
  { id: "inv_1022", customer: "River Studio", amountUsd: 0, status: "open", date: "2026-04-05" },
  { id: "inv_1021", customer: "Kolkata Relay", amountUsd: 149, status: "uncollectible", date: "2026-03-01" },
];

const PLANS = [
  { name: "Starter", priceUsd: 19, interval: "month", seats: 1, features: ["Core cockpit", "Email support"] },
  { name: "Pro", priceUsd: 49, interval: "month", seats: 5, features: ["Devices API", "Priority queue", "SSO (soon)"] },
  { name: "Business", priceUsd: 149, interval: "month", seats: 25, features: ["Pilot analytics", "SLA", "Audit log"] },
  { name: "Enterprise", priceUsd: 2400, interval: "year", seats: 999, features: ["Dedicated cell", "Custom contracts", "On-prem option"] },
];

function formatUsd(n: number, opts?: { maximumFractionDigits?: number }) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: opts?.maximumFractionDigits ?? 0,
  }).format(n);
}

function statusStyle(s: SubStatus): string {
  switch (s) {
    case "active":
      return "bg-white text-neutral-950 border-white";
    case "trialing":
      return "bg-sky-500/15 text-sky-300 border-sky-500/35";
    case "past_due":
      return "bg-red-600/20 text-red-400 border-red-500/45";
    case "canceled":
      return "bg-neutral-900 text-neutral-500 border-neutral-700";
    case "paused":
      return "bg-amber-500/12 text-amber-200/90 border-amber-500/35";
    default:
      return "bg-neutral-900 text-neutral-400 border-neutral-700";
  }
}

function formatStatusLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type InvoiceStatus = "paid" | "open" | "uncollectible";

function invoiceStatusStyle(s: InvoiceStatus): string {
  switch (s) {
    case "paid":
      return "bg-white text-neutral-950 border-white";
    case "open":
      return "bg-sky-500/15 text-sky-300 border-sky-500/35";
    case "uncollectible":
      return "bg-red-600/20 text-red-400 border-red-500/45";
    default:
      return "bg-neutral-900 text-neutral-400 border-neutral-700";
  }
}

export default function Subscriptions() {
  const [section, setSection] = useState<"subscriptions" | "invoices" | "plans">("subscriptions");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubStatus | "all">("all");

  const filteredSubs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_SUBS.filter((row) => {
      const matchQ =
        !q ||
        row.customer.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.plan.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q);
      const matchS = statusFilter === "all" || row.status === statusFilter;
      return matchQ && matchS;
    });
  }, [query, statusFilter]);

  const kpis = useMemo(() => {
    const active = MOCK_SUBS.filter((s) => s.status === "active" || s.status === "trialing");
    const mrr = active.reduce((acc, s) => acc + s.mrrUsd, 0);
    const arr = mrr * 12;
    const pastDue = MOCK_SUBS.filter((s) => s.status === "past_due").length;
    const openInv = MOCK_INVOICES.filter((i) => i.status === "open" || i.status === "uncollectible").length;
    return { mrr, arr, activeCount: active.length, pastDue, openInv, totalAccounts: MOCK_SUBS.length };
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-black">
      {/* Toolbar */}
      <div className="shrink-0 border-b border-[#1a1a1a] px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="mt-1 text-lg font-semibold text-white sm:text-xl">Subscriptions & revenue</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2 text-xs font-medium text-neutral-300 hover:border-neutral-600 hover:text-white"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2} />
              Export CSV
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-[#1a1a1a] bg-neutral-100 px-3 py-2 text-xs font-semibold text-black hover:bg-white"
            >
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
              Sync billing
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              <DollarSign className="h-3.5 w-3.5" strokeWidth={2} />
              MRR (USD)
            </div>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-white">{formatUsd(kpis.mrr)}</p>
            <p className="mt-0.5 text-[11px] text-neutral-500">Normalized monthly</p>
          </div>
          <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} />
              ARR (run rate)
            </div>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-white">{formatUsd(kpis.arr)}</p>
            <p className="mt-0.5 text-[11px] text-neutral-500">MRR × 12</p>
          </div>
          <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              <Users className="h-3.5 w-3.5" strokeWidth={2} />
              Paying / trialing
            </div>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-white">{kpis.activeCount}</p>
            <p className="mt-0.5 text-[11px] text-neutral-500">of {kpis.totalAccounts} accounts</p>
          </div>
          <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              <FileText className="h-3.5 w-3.5" strokeWidth={2} />
              Attention
            </div>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-white">
              {kpis.pastDue + kpis.openInv}
            </p>
            <p className="mt-0.5 text-[11px] text-neutral-500">
              {kpis.pastDue} past due · {kpis.openInv} invoice{kpis.openInv !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Section tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-[#1a1a1a] pb-px">
          {(
            [
              { id: "subscriptions" as const, label: "Subscriptions" },
              { id: "invoices" as const, label: "Invoices" },
              { id: "plans" as const, label: "Plans & pricing" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSection(t.id)}
              className={`relative -mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                section === t.id
                  ? "border-white text-white"
                  : "border-transparent text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-6 py-6 sm:px-8">
        {section === "subscriptions" && (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-md flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" strokeWidth={2} />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search customer, email, plan, subscription ID…"
                  className="w-full rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] py-2.5 pl-10 pr-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                  <Filter className="h-3.5 w-3.5" strokeWidth={2} />
                  Status
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as SubStatus | "all")}
                  className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2 text-sm text-neutral-200 focus:border-neutral-600 focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="trialing">Trialing</option>
                  <option value="past_due">Past due</option>
                  <option value="paused">Paused</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#1a1a1a]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-[#1a1a1a] bg-[#0a0a0a]">
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Customer</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Plan</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Status</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Price (USD)</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">MRR</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Next invoice</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Payment</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-500"> </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubs.map((row) => (
                      <tr key={row.id} className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#0a0a0a]/80">
                        <td className="px-4 py-3">
                          <p className="font-medium text-neutral-100">{row.customer}</p>
                          <p className="text-[11px] text-neutral-500">{row.email}</p>
                          <p className="mt-0.5 font-mono text-[10px] text-neutral-600">{row.id}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-neutral-300">{row.plan}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${statusStyle(row.status)}`}
                          >
                            {formatStatusLabel(row.status)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-neutral-200">
                          {formatUsd(row.amountUsd)}
                          <span className="text-neutral-500"> /{row.interval}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-neutral-300">{formatUsd(row.mrrUsd)}</td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-neutral-400">
                          {row.nextInvoice ? row.nextInvoice : "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-neutral-400">
                          <span className="inline-flex items-center gap-1.5">
                            <CreditCard className="h-3.5 w-3.5 text-neutral-600" strokeWidth={2} />
                            ···· {row.paymentLast4}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            className="inline-flex rounded-lg border border-[#1a1a1a] p-1.5 text-neutral-500 hover:border-neutral-600 hover:text-white"
                            aria-label="Actions"
                          >
                            <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredSubs.length === 0 ? (
                <p className="py-12 text-center text-sm text-neutral-500">No subscriptions match your filters.</p>
              ) : null}
            </div>
          </>
        )}

        {section === "invoices" && (
          <div className="overflow-hidden rounded-xl border border-[#1a1a1a]">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#1a1a1a] bg-[#0a0a0a]">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Invoice</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Customer</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Amount (USD)</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Status</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Date</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-500"> </th>
                </tr>
              </thead>
              <tbody>
                {MOCK_INVOICES.map((inv) => (
                  <tr key={inv.id} className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#0a0a0a]/80">
                    <td className="px-4 py-3 font-mono text-xs text-neutral-400">{inv.id}</td>
                    <td className="px-4 py-3 text-neutral-200">{inv.customer}</td>
                    <td className="px-4 py-3 tabular-nums text-neutral-100">{formatUsd(inv.amountUsd)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${invoiceStatusStyle(inv.status as InvoiceStatus)}`}
                      >
                        {formatStatusLabel(inv.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-neutral-500">{inv.date}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-white"
                      >
                        PDF
                        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {section === "plans" && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className="flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5 transition-colors hover:border-neutral-600"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">{p.name}</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tabular-nums text-white">{formatUsd(p.priceUsd)}</span>
                  <span className="text-sm text-neutral-500">/{p.interval}</span>
                </div>
                <p className="mt-2 text-xs text-neutral-500">Up to {p.seats === 999 ? "unlimited" : p.seats} seats</p>
                <ul className="mt-4 flex-1 space-y-2 border-t border-[#1a1a1a] pt-4">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-neutral-400">
                      <span className="mt-0.5 text-neutral-600">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="mt-5 w-full rounded-lg border border-[#1a1a1a] py-2.5 text-xs font-semibold text-neutral-200 hover:border-neutral-500 hover:bg-black"
                >
                  View in catalog
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
