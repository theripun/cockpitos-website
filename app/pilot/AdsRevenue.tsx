"use client";

import React, { useMemo, useState } from "react";

type Period = "7d" | "30d" | "mtd";

const BY_PERIOD: Record<
  Period,
  {
    revenueUsd: number;
    prevRevenueUsd: number;
    impressions: number;
    clicks: number;
    viewabilityPct: number;
    fillRatePct: number;
    ecpmUsd: number;
    byPlacement: { id: string; label: string; revenuePct: number; revenueUsd: number; impressions: number }[];
  }
> = {
  "7d": {
    revenueUsd: 4287.41,
    prevRevenueUsd: 3912.0,
    impressions: 2_842_000,
    clicks: 41_200,
    viewabilityPct: 71.4,
    fillRatePct: 88.2,
    ecpmUsd: 1.51,
    byPlacement: [
      { id: "lb", label: "Leaderboard", revenuePct: 34, revenueUsd: 1457.72, impressions: 890_000 },
      { id: "int", label: "Interstitial", revenuePct: 28, revenueUsd: 1200.47, impressions: 410_000 },
      { id: "vid", label: "Video", revenuePct: 24, revenueUsd: 1028.98, impressions: 220_000 },
      { id: "idle", label: "Idle / fullscreen", revenuePct: 14, revenueUsd: 600.24, impressions: 180_000 },
    ],
  },
  "30d": {
    revenueUsd: 18432.18,
    prevRevenueUsd: 16210.55,
    impressions: 12_100_000,
    clicks: 178_400,
    viewabilityPct: 69.8,
    fillRatePct: 86.5,
    ecpmUsd: 1.52,
    byPlacement: [
      { id: "lb", label: "Leaderboard", revenuePct: 36, revenueUsd: 6635.58, impressions: 3_800_000 },
      { id: "int", label: "Interstitial", revenuePct: 26, revenueUsd: 4792.37, impressions: 1_720_000 },
      { id: "vid", label: "Video", revenuePct: 22, revenueUsd: 4055.08, impressions: 980_000 },
      { id: "idle", label: "Idle / fullscreen", revenuePct: 16, revenueUsd: 2949.15, impressions: 820_000 },
    ],
  },
  mtd: {
    revenueUsd: 12847.32,
    prevRevenueUsd: 11204.9,
    impressions: 8_420_000,
    clicks: 124_800,
    viewabilityPct: 70.2,
    fillRatePct: 87.1,
    ecpmUsd: 1.53,
    byPlacement: [
      { id: "lb", label: "Leaderboard", revenuePct: 35, revenueUsd: 4496.56, impressions: 2_650_000 },
      { id: "int", label: "Interstitial", revenuePct: 27, revenueUsd: 3468.78, impressions: 1_210_000 },
      { id: "vid", label: "Video", revenuePct: 23, revenueUsd: 2954.88, impressions: 690_000 },
      { id: "idle", label: "Idle / fullscreen", revenuePct: 15, revenueUsd: 1927.1, impressions: 560_000 },
    ],
  },
};

function usd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function AdsRevenue() {
  const [period, setPeriod] = useState<Period>("mtd");
  const data = BY_PERIOD[period];

  const deltaPct = useMemo(() => {
    if (data.prevRevenueUsd <= 0) return 0;
    return ((data.revenueUsd - data.prevRevenueUsd) / data.prevRevenueUsd) * 100;
  }, [data]);

  const ctr = ((data.clicks / data.impressions) * 100).toFixed(2);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-black">
      <header className="shrink-0 border-b border-zinc-800/80 px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[13px] text-zinc-500">Ads revenue</p>
            <p className="mt-1 font-mono text-3xl font-light tracking-tight text-zinc-100 sm:text-4xl">{usd(data.revenueUsd)}</p>
            <p className="mt-2 text-[13px] text-zinc-600">
              <span className="text-zinc-400">{deltaPct >= 0 ? "+" : ""}{deltaPct.toFixed(1)}%</span>
              <span className="mx-2 text-zinc-800">·</span>
              vs prior period
              <span className="mx-2 text-zinc-800">·</span>
              Updated ~2m ago
            </p>
          </div>
          <div className="flex gap-1 rounded-lg bg-zinc-950 p-0.5 ring-1 ring-zinc-800">
            {(["7d", "30d", "mtd"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  period === p ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {p === "mtd" ? "MTD" : p === "7d" ? "7d" : "30d"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-8 sm:px-8">
          {/* Single stats strip */}
          <div className="grid grid-cols-2 gap-y-6 border-b border-zinc-800/80 pb-8 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-8">
            <Stat label="Impressions" value={compact(data.impressions)} />
            <Stat label="Clicks" value={compact(data.clicks)} />
            <Stat label="CTR" value={`${ctr}%`} />
            <Stat label="Fill rate" value={`${data.fillRatePct.toFixed(1)}%`} />
            <Stat label="eCPM" value={usd(data.ecpmUsd)} />
            <Stat label="Viewability" value={`${data.viewabilityPct.toFixed(1)}%`} />
          </div>

          <section className="mt-10">
            <h2 className="text-[13px] font-medium text-zinc-300">By placement</h2>
            <p className="mt-0.5 text-[12px] text-zinc-600">Gross share after rev-share · USD</p>

            <div className="mt-6 overflow-hidden rounded-lg ring-1 ring-zinc-800">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/50 text-left text-[11px] font-medium text-zinc-500">
                    <th className="px-4 py-3 font-normal">Placement</th>
                    <th className="hidden w-[28%] px-4 py-3 font-normal sm:table-cell">Share</th>
                    <th className="px-4 py-3 text-right font-normal">Revenue</th>
                    <th className="hidden px-4 py-3 text-right font-normal md:table-cell">Impressions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byPlacement.map((row) => (
                    <tr key={row.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-950/30">
                      <td className="px-4 py-3.5">
                        <span className="text-zinc-200">{row.label}</span>
                        <span className="ml-2 font-mono text-[11px] text-zinc-600">{row.id}</span>
                        <div className="mt-2 h-px w-full max-w-[200px] bg-zinc-800 sm:hidden">
                          <div className="h-full bg-zinc-500" style={{ width: `${row.revenuePct}%` }} />
                        </div>
                      </td>
                      <td className="hidden px-4 py-3.5 sm:table-cell">
                        <div className="flex items-center gap-3">
                          <span className="w-8 tabular-nums text-zinc-500">{row.revenuePct}%</span>
                          <div className="h-1 flex-1 max-w-[120px] rounded-full bg-zinc-800">
                            <div className="h-full rounded-full bg-zinc-500" style={{ width: `${row.revenuePct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-zinc-200">{usd(row.revenueUsd)}</td>
                      <td className="hidden px-4 py-3.5 text-right tabular-nums text-zinc-500 md:table-cell">
                        {compact(row.impressions)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-zinc-600">{label}</p>
      <p className="mt-1 font-mono text-[15px] tabular-nums text-zinc-200">{value}</p>
    </div>
  );
}
