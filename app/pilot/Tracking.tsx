"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { Search, X, MapPin, ChevronRight, RefreshCw } from "lucide-react";
import { BASE_URL } from "@/lib/baseURL";

const RealMap = dynamic(() => import("./RealMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[280px] w-full items-center justify-center bg-black">
      <p className="text-xs text-neutral-500">Loading map…</p>
    </div>
  ),
});

function isOnlineStatus(status: unknown): boolean {
  const s = String(status ?? "").toLowerCase();
  return s === "online" || s === "active";
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** Activity user row from admin API, normalized with `id` and map `color`. */
type TrackingNode = {
  id: string;
  color: string;
  status?: unknown;
  name?: string;
  username?: string;
  ip?: string;
  lat?: number;
  lng?: number;
  city?: string;
  country?: string;
  todayActiveMinutes?: number;
  os?: string;
  browser?: string;
  device?: string;
};

export default function Tracking() {
  const [nodes, setNodes] = useState<TrackingNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<TrackingNode | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/activity/users`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const mapped: TrackingNode[] = (Array.isArray(data) ? data : []).map((u: Record<string, unknown>) => {
          const raw = u;
          return {
            ...raw,
            id: String(raw.userId ?? raw.id ?? ""),
            color: isOnlineStatus(raw.status) ? "#e5e5e5" : "#525252",
          } as TrackingNode;
        });
        setNodes(mapped);
        setLastSync(new Date());
      }
    } catch (e) {
      console.error("Failed to fetch activity users:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 30_000);
    return () => clearInterval(interval);
  }, [fetchUsers]);

  const onlineNodes = useMemo(() => nodes.filter((n) => isOnlineStatus(n.status)), [nodes]);

  const listNodes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let list = [...onlineNodes];
    if (q) {
      list = list.filter((node) => {
        const name = (node.name || "").toLowerCase();
        const ip = (node.ip || "").toLowerCase();
        return name.includes(q) || ip.includes(q);
      });
    }
    list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return list;
  }, [onlineNodes, searchTerm]);

  useEffect(() => {
    setSelectedNode((prev) => {
      if (!prev) return prev;
      const still = onlineNodes.find((n) => n.id === prev.id);
      return still ?? null;
    });
  }, [onlineNodes]);

  if (loading && nodes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-black px-8">
        <p className="text-sm text-neutral-500">Loading activity…</p>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-black px-8 text-center">
        <MapPin className="h-8 w-8 text-neutral-600" strokeWidth={1.25} />
        <div>
          <p className="text-sm font-medium text-neutral-300">No activity data</p>
          <p className="mx-auto mt-1 max-w-xs text-xs text-neutral-500">
            When users appear in activity data, they will show here and on the map.
          </p>
        </div>
      </div>
    );
  }

  const metrics = selectedNode
    ? [
        {
          label: "Location",
          value:
            selectedNode.city && selectedNode.country
              ? `${selectedNode.city}, ${selectedNode.country}`
              : selectedNode.lat != null && selectedNode.lng != null
                ? `${Math.abs(selectedNode.lat).toFixed(4)}° ${selectedNode.lat >= 0 ? "N" : "S"}, ${Math.abs(selectedNode.lng).toFixed(4)}° ${selectedNode.lng >= 0 ? "E" : "W"}`
                : "—",
        },
        { label: "IP", value: selectedNode.ip || "—" },
        { label: "Active today", value: `${selectedNode.todayActiveMinutes ?? 0} min` },
        { label: "OS", value: selectedNode.os || "—" },
        { label: "Browser", value: selectedNode.browser || "—" },
        { label: "Device", value: selectedNode.device || "—" },
      ]
    : [];

  const initial = (selectedNode?.name || selectedNode?.username || "?").toString().charAt(0).toUpperCase();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-black lg:flex-row">
      {/* Left: online users + details only when selected */}
      <aside className="flex min-h-0 w-full shrink-0 flex-col border-b border-[#1a1a1a] bg-black lg:w-[300px] lg:max-w-[300px] lg:border-b-0 lg:border-r lg:border-[#1a1a1a]">
        <div className="shrink-0 border-b border-[#1a1a1a] p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-medium text-neutral-200">Online</h2>
              <p className="text-[10px] text-neutral-600">
                {listNodes.length} shown
                {lastSync ? ` · ${formatTime(lastSync)}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => fetchUsers()}
              className="flex shrink-0 items-center gap-1 rounded-md border border-[#1a1a1a] bg-[#0a0a0a] px-2 py-1 text-[11px] text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
            >
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
              Refresh
            </button>
          </div>
          <div className="relative" data-tracking-search>
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" strokeWidth={2} />
            <input
              type="search"
              placeholder="Name or IP…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-[#1a1a1a] bg-[#0a0a0a] py-2 pl-9 pr-8 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-neutral-700 focus:outline-none"
            />
            {searchTerm ? (
              <button
                type="button"
                aria-label="Clear"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-neutral-500 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-2 sm:px-4 [scrollbar-width:thin]">
          {onlineNodes.length === 0 ? (
            <li className="rounded-md border border-dashed border-white/10 py-8 text-center text-xs text-zinc-500">
              No one online right now
            </li>
          ) : null}
          {listNodes.length === 0 && onlineNodes.length > 0 ? (
            <li className="rounded-md border border-dashed border-[#1a1a1a] py-6 text-center text-xs text-neutral-500">
              No matches for this filter
            </li>
          ) : null}
          {listNodes.map((node) => {
            const active = selectedNode?.id === node.id;
            const letter = (node.name || node.username || "?").toString().charAt(0).toUpperCase();
            return (
              <li key={node.id}>
                <button
                  type="button"
                  onClick={() => setSelectedNode(node)}
                  className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left ${
                    active ? "border border-[#333] bg-[#0a0a0a]" : "border border-transparent hover:bg-[#0a0a0a]"
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#141414] text-xs font-medium text-neutral-200">
                    {letter}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-neutral-200">{node.name || "—"}</p>
                    <p className="truncate font-mono text-[10px] text-neutral-500">{node.ip || "—"}</p>
                  </div>
                  <ChevronRight className={`h-4 w-4 shrink-0 ${active ? "text-neutral-400" : "text-neutral-600"}`} />
                </button>
              </li>
            );
          })}
        </ul>

        {selectedNode ? (
          <div className="max-h-[min(42vh,320px)] shrink-0 overflow-y-auto border-t border-[#1a1a1a] p-3 sm:p-4">
            <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a]">
              <div className="border-b border-[#1a1a1a] px-3 py-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#1a1a1a] text-xs font-medium text-neutral-200">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-medium text-neutral-100">{selectedNode.name ?? "—"}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wide text-neutral-500">
                        {String(selectedNode.status || "unknown")}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedNode(null)}
                        className="text-[11px] text-neutral-500 underline-offset-2 hover:text-neutral-300 hover:underline"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto px-2 py-2">
                <table className="w-full min-w-0 border-collapse text-left text-xs">
                  <caption className="sr-only">Session details</caption>
                  <tbody>
                    {metrics.map(({ label, value }) => (
                      <tr key={label} className="border-b border-[#1a1a1a] last:border-0">
                        <th
                          scope="row"
                          className="w-[32%] max-w-[7.5rem] py-1.5 pr-3 align-top font-normal text-neutral-500"
                        >
                          {label}
                        </th>
                        <td className="py-1.5 align-top text-neutral-200 break-words">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </aside>

      {/* Right: map */}
      <div className="relative flex min-h-[280px] min-w-0 flex-1 flex-col bg-black p-3 sm:p-4 lg:min-h-0 lg:p-5">
        <div className="pointer-events-none absolute left-5 top-5 z-[500] text-[10px] font-medium uppercase tracking-wide text-neutral-500 lg:left-6 lg:top-6">
          Map
        </div>
        <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-[#1a1a1a] bg-black">
          <RealMap selectedNode={selectedNode} setSelectedNode={setSelectedNode} nodes={onlineNodes} />
        </div>
      </div>
    </div>
  );
}
