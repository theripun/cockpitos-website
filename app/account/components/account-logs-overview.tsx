"use client";

import React from "react";
import {
  FileSearch,
  Globe,
  Loader2,
  MapPin,
  MonitorSmartphone,
  RefreshCw,
  ScrollText,
} from "lucide-react";
import { BASE_URL } from "@/lib/baseURL";
import { cn } from "@/lib/utils";

type AuditRow = {
  id: string;
  userId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

type SessionRow = {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  startedAt: string;
  lastSeen: string;
  endedAt: string | null;
  isActive: number;
};

type IpRow = {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string | null;
  createdAt: string;
};

type LocationRow = {
  id: string;
  userId: string;
  latitude: number | null;
  longitude: number | null;
  page: string | null;
  city: string | null;
  country: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  createdAt: string;
};

const ACTION_LABELS: Record<string, string> = {
  AUTH_SIGNUP_PASSWORD: "Account created · password",
  AUTH_LOGIN_PASSWORD: "Signed in · password",
  USER_CREATED: "User record created",
};

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function humanizeAction(action: string) {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  return action
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Single-word label for dense tables; full phrase in `title`. */
function eventOneWord(action: string) {
  const phrase = humanizeAction(action).trim();
  if (!phrase) return "—";
  const first = phrase.split(/\s+/)[0]?.replace(/^[·.,;:]+|[·.,;:]+$/g, "") || "—";
  return first;
}

function formatMetadata(meta: unknown): string {
  if (meta == null) return "—";
  if (typeof meta === "string") return meta || "—";
  try {
    return JSON.stringify(meta);
  } catch {
    return String(meta);
  }
}

type TabId = "audit" | "sessions" | "ip" | "location";

const TABS: { id: TabId; label: string; icon: typeof ScrollText }[] = [
  { id: "audit", label: "Audit", icon: ScrollText },
  { id: "sessions", label: "Sessions", icon: MonitorSmartphone },
  { id: "ip", label: "IP", icon: Globe },
  { id: "location", label: "Location", icon: MapPin },
];

type Props = { className?: string };

export function AccountLogsOverview({ className }: Props) {
  const [tab, setTab] = React.useState<TabId>("audit");
  const [query, setQuery] = React.useState("");

  const [audit, setAudit] = React.useState<AuditRow[] | null>(null);
  const [sessions, setSessions] = React.useState<SessionRow[] | null>(null);
  const [ipLogs, setIpLogs] = React.useState<IpRow[] | null>(null);
  const [locations, setLocations] = React.useState<LocationRow[] | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, s, i, l] = await Promise.all([
        fetch(`${BASE_URL}/activity/audit-logs?limit=100`, { credentials: "include" }),
        fetch(`${BASE_URL}/activity/sessions?limit=80`, { credentials: "include" }),
        fetch(`${BASE_URL}/activity/ip-logs?limit=100`, { credentials: "include" }),
        fetch(`${BASE_URL}/activity/location-logs?limit=60`, { credentials: "include" }),
      ]);

      if (a.status === 401 || s.status === 401) {
        setError("Sign in to view activity logs.");
        setAudit(null);
        setSessions(null);
        setIpLogs(null);
        setLocations(null);
        return;
      }

      const errs: string[] = [];
      if (a.ok) setAudit((await a.json()) as AuditRow[]);
      else {
        setAudit(null);
        errs.push("audit");
      }

      if (s.ok) setSessions((await s.json()) as SessionRow[]);
      else {
        setSessions(null);
        errs.push("sessions");
      }

      if (i.ok) setIpLogs((await i.json()) as IpRow[]);
      else {
        setIpLogs(null);
        errs.push("IP history");
      }

      if (l.ok) setLocations((await l.json()) as LocationRow[]);
      else {
        setLocations(null);
        errs.push("location");
      }

      if (errs.length) {
        setError(`Could not load: ${errs.join(", ")}. Try refresh.`);
      }
    } catch {
      setError("Network error. Check your connection and try again.");
      setAudit(null);
      setSessions(null);
      setIpLogs(null);
      setLocations(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load, refreshKey]);

  const q = query.trim().toLowerCase();

  const filteredAudit = React.useMemo(() => {
    if (!audit) return null;
    if (!q) return audit;
    return audit.filter((row) => {
      const blob = [
        row.action,
        row.entityType,
        row.entityId,
        row.ipAddress,
        formatMetadata(row.metadata),
        row.userAgent,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [audit, q]);

  const filteredSessions = React.useMemo(() => {
    if (!sessions) return null;
    if (!q) return sessions;
    return sessions.filter((row) => {
      const blob = [
        row.browser,
        row.os,
        row.device,
        row.ipAddress,
        row.userAgent,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [sessions, q]);

  const filteredIp = React.useMemo(() => {
    if (!ipLogs) return null;
    if (!q) return ipLogs;
    return ipLogs.filter((row) =>
      `${row.ipAddress} ${row.userAgent || ""}`.toLowerCase().includes(q)
    );
  }, [ipLogs, q]);

  const filteredLocations = React.useMemo(() => {
    if (!locations) return null;
    if (!q) return locations;
    return locations.filter((row) => {
      const blob = [
        row.page,
        row.city,
        row.country,
        row.browser,
        row.os,
        row.device,
        row.latitude != null ? String(row.latitude) : "",
        row.longitude != null ? String(row.longitude) : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [locations, q]);

  const countForTab = (t: TabId) => {
    switch (t) {
      case "audit":
        return filteredAudit?.length ?? 0;
      case "sessions":
        return filteredSessions?.length ?? 0;
      case "ip":
        return filteredIp?.length ?? 0;
      case "location":
        return filteredLocations?.length ?? 0;
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-[#050505] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.55)]">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
          aria-hidden
        />

        <div className="relative border-b border-white/[0.06] px-5 py-7 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6">
            <div className="flex gap-4 sm:items-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.1] bg-gradient-to-br from-zinc-500/15 to-transparent text-zinc-400/95">
                <FileSearch className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                  Log viewer
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-zinc-400">
                  Read-only timeline of sign-ins, audit events, IP changes, and optional location
                  check-ins from Cockpit. Data is scoped to your account.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <label className="sr-only" htmlFor="logs-search">
                Filter logs
              </label>
              <input
                id="logs-search"
                type="search"
                autoComplete="off"
                placeholder="Filter…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/[0.1] bg-black/50 px-3.5 text-[13px] text-white placeholder:text-zinc-600 outline-none transition-colors focus:border-white/[0.18] sm:min-w-[220px] sm:max-w-xs sm:flex-1"
              />
              <button
                type="button"
                onClick={() => setRefreshKey((k) => k + 1)}
                disabled={loading}
                className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <RefreshCw
                  className={cn("h-4 w-4", loading && "animate-spin")}
                  strokeWidth={1.75}
                  aria-hidden
                />
                Refresh
              </button>
            </div>
          </div>

          <div
            className="mt-5 flex flex-nowrap items-stretch gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-1.5 [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Log categories"
          >
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  title={t.id === "ip" ? "IP history" : t.label}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold leading-none transition-colors sm:px-2.5 sm:py-1.5 sm:text-[12px]",
                    active
                      ? "bg-white/[0.09] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                      : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
                  )}
                >
                  <Icon className="h-3 w-3 shrink-0 opacity-80 sm:h-3.5 sm:w-3.5" strokeWidth={1.75} />
                  <span className="whitespace-nowrap">{t.label}</span>
                  {!loading && audit != null && (
                    <span className="rounded bg-black/40 px-1 py-px text-[9px] font-bold tabular-nums text-zinc-400 sm:text-[10px]">
                      {countForTab(t.id)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 py-6 sm:px-7 sm:py-8">
          {error && error.startsWith("Sign in") ? (
            <div className="rounded-2xl border border-white/[0.08] bg-black/30 px-5 py-10 text-center text-[14px] text-zinc-400">
              {error}
            </div>
          ) : null}

          {error && !error.startsWith("Sign in") ? (
            <div className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200/95">
              {error}
              <button
                type="button"
                onClick={() => setRefreshKey((k) => k + 1)}
                className="ml-3 font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white/60"
              >
                Retry
              </button>
            </div>
          ) : null}

          {loading ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 py-16">
              <Loader2 className="h-9 w-9 animate-spin text-zinc-500" strokeWidth={1.75} aria-hidden />
              <p className="text-[13px] text-zinc-500">Loading activity…</p>
              <span className="sr-only">Loading logs</span>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/[0.07] bg-black/35">
              {tab === "audit" ? (
                <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-black/40 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                      <th className="px-4 py-3 font-bold">When</th>
                      <th className="w-24 whitespace-nowrap px-4 py-3 font-bold">Event</th>
                      <th className="min-w-[180px] px-4 py-3 font-bold">Target</th>
                      <th className="min-w-[160px] px-4 py-3 font-bold">Network</th>
                    </tr>
                  </thead>
                  <tbody className="text-zinc-300">
                    {!filteredAudit?.length ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-14 text-center text-zinc-500">
                          No audit events yet. Actions like sign-in will appear here.
                        </td>
                      </tr>
                    ) : (
                      filteredAudit.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-white/[0.05] last:border-b-0 hover:bg-white/[0.02]"
                        >
                          <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-zinc-400">
                            {formatWhen(row.createdAt)}
                          </td>
                          <td
                            className="w-24 max-w-24 truncate px-4 py-3.5 font-semibold capitalize text-white"
                            title={humanizeAction(row.action)}
                          >
                            {eventOneWord(row.action)}
                          </td>
                          <td className="max-w-[260px] px-4 py-3.5">
                            <div className="truncate text-zinc-400" title={formatMetadata(row.metadata)}>
                              {[row.entityType, row.entityId].filter(Boolean).join(" · ") || "—"}
                            </div>
                            {row.metadata != null && formatMetadata(row.metadata) !== "—" ? (
                              <div className="mt-0.5 truncate font-mono text-[11px] text-zinc-600" title={formatMetadata(row.metadata)}>
                                {formatMetadata(row.metadata)}
                              </div>
                            ) : null}
                          </td>
                          <td className="max-w-[200px] px-4 py-3.5">
                            <div className="truncate font-mono text-[12px] text-zinc-400">
                              {row.ipAddress || "—"}
                            </div>
                            {row.userAgent ? (
                              <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-zinc-600" title={row.userAgent}>
                                {row.userAgent}
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : null}

              {tab === "sessions" ? (
                <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-black/40 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                      <th className="px-4 py-3 font-bold">Last seen</th>
                      <th className="px-4 py-3 font-bold">Environment</th>
                      <th className="px-4 py-3 font-bold">IP</th>
                      <th className="px-4 py-3 font-bold">Started</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-zinc-300">
                    {!filteredSessions?.length ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-14 text-center text-zinc-500">
                          No sessions recorded. Open Cockpit from a browser to generate session history.
                        </td>
                      </tr>
                    ) : (
                      filteredSessions.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-white/[0.05] last:border-b-0 hover:bg-white/[0.02]"
                        >
                          <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-zinc-400">
                            {formatWhen(row.lastSeen)}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-medium text-white">
                              {[row.browser, row.os].filter(Boolean).join(" · ") || "—"}
                            </div>
                            <div className="text-[12px] text-zinc-500">{row.device || ""}</div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[12px] text-zinc-400">
                            {row.ipAddress || "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-zinc-500">
                            {formatWhen(row.startedAt)}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                                row.isActive === 1
                                  ? "bg-emerald-500/12 text-emerald-400 ring-1 ring-emerald-500/20"
                                  : "bg-zinc-500/10 text-zinc-400 ring-1 ring-white/[0.06]"
                              )}
                            >
                              {row.isActive === 1 ? "Active" : "Ended"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : null}

              {tab === "ip" ? (
                <table className="w-full min-w-[560px] border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-black/40 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                      <th className="px-4 py-3 font-bold">When</th>
                      <th className="px-4 py-3 font-bold">IP address</th>
                      <th className="px-4 py-3 font-bold">Client</th>
                    </tr>
                  </thead>
                  <tbody className="text-zinc-300">
                    {!filteredIp?.length ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-14 text-center text-zinc-500">
                          No IP changes logged yet.
                        </td>
                      </tr>
                    ) : (
                      filteredIp.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-white/[0.05] last:border-b-0 hover:bg-white/[0.02]"
                        >
                          <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-zinc-400">
                            {formatWhen(row.createdAt)}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-[13px] text-white">{row.ipAddress}</td>
                          <td className="max-w-md px-4 py-3.5">
                            <p className="line-clamp-2 text-[12px] leading-snug text-zinc-500" title={row.userAgent || ""}>
                              {row.userAgent || "—"}
                            </p>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : null}

              {tab === "location" ? (
                <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-black/40 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                      <th className="px-4 py-3 font-bold">When</th>
                      <th className="px-4 py-3 font-bold">Place</th>
                      <th className="px-4 py-3 font-bold">Page</th>
                      <th className="px-4 py-3 font-bold">Coordinates</th>
                    </tr>
                  </thead>
                  <tbody className="text-zinc-300">
                    {!filteredLocations?.length ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-14 text-center text-zinc-500">
                          No location check-ins. Cockpit only records approximate location when you allow
                          it from the desktop.
                        </td>
                      </tr>
                    ) : (
                      filteredLocations.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-white/[0.05] last:border-b-0 hover:bg-white/[0.02]"
                        >
                          <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-zinc-400">
                            {formatWhen(row.createdAt)}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-medium text-white">
                              {[row.city, row.country].filter(Boolean).join(", ") || "—"}
                            </div>
                            <div className="text-[12px] text-zinc-500">
                              {[row.browser, row.device].filter(Boolean).join(" · ")}
                            </div>
                          </td>
                          <td className="max-w-[200px] truncate px-4 py-3.5 text-zinc-400" title={row.page || ""}>
                            {row.page || "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[12px] text-zinc-400">
                            {row.latitude != null && row.longitude != null
                              ? `${row.latitude.toFixed(4)}, ${row.longitude.toFixed(4)}`
                              : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
