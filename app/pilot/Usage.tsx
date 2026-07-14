"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { BASE_URL } from "@/lib/baseURL";

type UsageRow = {
  userId: string;
  name: string;
  username: string;
  email: string;
  totalActiveSeconds: number;
  queryCount: number;
};

type AuditLogEntry = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  createdAt: string;
};

function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "—";
  const s = Math.floor(totalSeconds % 60);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const h = Math.floor(totalSeconds / 3600);
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (h === 0 && m === 0) parts.push(`${s}s`);
  return parts.join(" ");
}

export default function Usage() {
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [logsByUser, setLogsByUser] = useState<Record<string, AuditLogEntry[]>>({});
  const [logsLoading, setLogsLoading] = useState<Record<string, boolean>>({});

  const fetchSummary = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/activity/usage-summary`, {
        credentials: "include",
        mode: "cors",
      });
      if (!res.ok) throw new Error("Failed to load usage");
      const data = await res.json();
      if (Array.isArray(data)) setRows(data as UsageRow[]);
      else setRows([]);
    } catch (e) {
      console.error(e);
      const hint =
        typeof window !== "undefined" && window.location.origin
          ? ` Open the app and API on localhost (or set NEXT_PUBLIC_API_BASE_URL to your API). Current page: ${window.location.origin}, API: ${BASE_URL}.`
          : "";
      setError(
        e instanceof TypeError
          ? `Cannot reach the API (network or CORS).${hint} Restart the API after updating CORS if you changed it.`
          : "Could not load usage data.",
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const fetchLogsForUser = useCallback(async (userId: string) => {
    if (logsByUser[userId] !== undefined) return;
    setLogsLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const res = await fetch(`${BASE_URL}/admin/activity/users/${userId}/audit-logs`, {
        credentials: "include",
        mode: "cors",
      });
      if (!res.ok) throw new Error("Failed logs");
      const data = await res.json();
      setLogsByUser((prev) => ({ ...prev, [userId]: Array.isArray(data) ? data : [] }));
    } catch {
      setLogsByUser((prev) => ({ ...prev, [userId]: [] }));
    } finally {
      setLogsLoading((prev) => ({ ...prev, [userId]: false }));
    }
  }, [logsByUser]);

  const toggleExpand = (userId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else {
        next.add(userId);
        void fetchLogsForUser(userId);
      }
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.username.toLowerCase().includes(q)
      );
    });
  }, [rows, searchTerm]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-black">
      <div className="flex shrink-0 flex-col gap-4 border-b border-[#1a1a1a] px-8 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">Usage</h2>
          <p className="text-xs text-zinc-500">
            Total active time from daily heartbeats; queries = audit events logged for the user.
          </p>
        </div>
        <div className="relative w-full shrink-0 sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" strokeWidth={2} />
          <input
            type="search"
            placeholder="Search name, email, username…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-2 pl-10 pr-3 text-sm text-white placeholder:text-zinc-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#1a1a1a] bg-black py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#262626] border-t-neutral-400" />
            <p className="mt-3 text-xs text-neutral-500">Loading usage…</p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] py-12 text-center text-sm text-neutral-400">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-[#1a1a1a] bg-black py-14 text-center">
            <p className="text-sm text-neutral-400">{searchTerm.trim() ? "No matching users" : "No users yet"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#1a1a1a]">
            <table className="w-full min-w-[52rem] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#1a1a1a] bg-[#0a0a0a]">
                  <th className="w-10 px-2 py-3" aria-hidden />
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">User</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    Total time on platform
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Queries</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Activity logs</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const isOpen = expanded.has(r.userId);
                  const logs = logsByUser[r.userId];
                  const logLoading = logsLoading[r.userId];

                  return (
                    <React.Fragment key={r.userId}>
                      <tr className="border-b border-[#1a1a1a] last:border-b-0 hover:bg-[#0a0a0a]">
                        <td className="px-2 py-3 align-middle">
                          <button
                            type="button"
                            onClick={() => toggleExpand(r.userId)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-white/5 hover:text-white"
                            aria-expanded={isOpen}
                            aria-label={isOpen ? "Collapse activity logs" : "Expand activity logs"}
                          >
                            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-neutral-100">{r.name}</div>
                          <div className="truncate text-[12px] text-neutral-500">{r.email}</div>
                          <div className="text-[11px] text-neutral-600">@{r.username}</div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-neutral-300">{formatDuration(r.totalActiveSeconds)}</td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-neutral-400">{r.queryCount}</td>
                        <td className="px-4 py-3 text-neutral-500">
                          <button
                            type="button"
                            onClick={() => toggleExpand(r.userId)}
                            className="text-[12px] font-medium text-neutral-400 underline-offset-2 hover:text-neutral-200 hover:underline"
                          >
                            {isOpen ? "Hide" : "Show"} log history
                          </button>
                        </td>
                      </tr>
                      {isOpen ? (
                        <tr className="border-b border-[#1a1a1a] bg-black">
                          <td colSpan={5} className="px-4 py-0">
                            <div className="border-t border-[#1a1a1a] py-4 pl-10 pr-2">
                              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
                                Activity logs
                              </p>
                              {logLoading ? (
                                <div className="flex items-center gap-2 py-4 text-xs text-neutral-500">
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#262626] border-t-neutral-500" />
                                  Loading…
                                </div>
                              ) : !logs || logs.length === 0 ? (
                                <p className="py-2 text-xs text-neutral-600">No activity logs for this user yet.</p>
                              ) : (
                                <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
                                  {logs.map((log) => (
                                    <li
                                      key={log.id}
                                      className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2 text-[12px]"
                                    >
                                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                                        <span className="font-mono text-[11px] font-medium text-neutral-300">{log.action}</span>
                                        <time className="shrink-0 tabular-nums text-[10px] text-neutral-600">
                                          {new Date(log.createdAt).toLocaleString()}
                                        </time>
                                      </div>
                                      {(log.entityType || log.entityId) && (
                                        <p className="mt-1 text-[11px] text-neutral-500">
                                          {log.entityType ?? "—"}
                                          {log.entityId ? ` · ${log.entityId}` : ""}
                                        </p>
                                      )}
                                      {log.ipAddress ? (
                                        <p className="mt-0.5 font-mono text-[10px] text-neutral-600">{log.ipAddress}</p>
                                      ) : null}
                                      {log.metadata != null && typeof log.metadata === "object" && Object.keys(log.metadata as object).length > 0 ? (
                                        <pre className="mt-2 max-h-24 overflow-auto rounded bg-black/40 p-2 font-mono text-[10px] leading-relaxed text-neutral-500">
                                          {JSON.stringify(log.metadata, null, 2)}
                                        </pre>
                                      ) : null}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
