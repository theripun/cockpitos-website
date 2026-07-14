"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, Mail, Search, Shield, UserRound } from "lucide-react";
import { BASE_URL } from "@/lib/baseURL";
import { mapApiUserToPilotRow, type PilotUserTableRow } from "./pilot-users-table";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

function roleBadgeClass(role: string) {
  const r = role.toLowerCase();
  if (r.includes("admin")) return "bg-[#141414] text-neutral-300 border-[#1a1a1a]";
  return "bg-[#141414] text-neutral-500 border-[#1a1a1a]";
}

export default function ActAs() {
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/users/all`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (Array.isArray(data)) setAllUsers(data);
    } catch (e) {
      console.error("Failed to fetch users:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const rows: PilotUserTableRow[] = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const filtered = allUsers.filter((u) => {
      if (!q) return true;
      const name = (u.name || u.username || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const user = (u.username || "").toLowerCase();
      return name.includes(q) || email.includes(q) || user.includes(q);
    });
    return [...filtered]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .map(mapApiUserToPilotRow);
  }, [allUsers, searchTerm]);

  const verifiedCount = useMemo(() => rows.filter((r) => r.verified).length, [rows]);

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-black p-6 sm:p-8">
      <div className="mb-6 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Act as user</h2>
          <p className="mt-1 text-sm text-neutral-500">Live directory · open a session or moderate access</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex gap-3">
            <div className="flex flex-col items-center rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-5 py-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Users</span>
              <span className="text-lg font-semibold text-white tabular-nums">{loading ? "—" : rows.length}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-5 py-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Verified</span>
              <span className="text-lg font-semibold text-neutral-400 tabular-nums">{loading ? "—" : verifiedCount}</span>
            </div>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" strokeWidth={2} />
            <input
              type="search"
              placeholder="Search…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-zinc-600 focus:border-[#262626] focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#1a1a1a] bg-[#0a0a0a] py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#262626] border-t-neutral-400" />
            <p className="mt-3 text-xs text-neutral-500">Loading users…</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] py-16 text-center">
            <UserRound className="mx-auto h-9 w-9 text-neutral-600" strokeWidth={1.5} />
            <p className="mt-3 text-sm text-neutral-400">{searchTerm.trim() ? "No matching users" : "No users yet"}</p>
            {searchTerm.trim() ? (
              <p className="mt-1 text-xs text-neutral-600">Try a different search term.</p>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((u) => (
              <article
                key={u.id}
                className="group flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-4 transition-colors hover:border-[#262626]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#1a1a1a] bg-[#141414] text-[12px] font-bold text-neutral-200"
                    aria-hidden
                  >
                    {initialsFromName(u.name)}
                  </div>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${roleBadgeClass(u.role)}`}
                  >
                    {u.role}
                  </span>
                </div>

                <h3 className="mt-3 truncate text-[15px] font-semibold text-white">{u.name}</h3>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-500">
                  <Mail className="h-3 w-3 shrink-0" strokeWidth={2} />
                  <span className="truncate">{u.email || (u.username ? `@${u.username}` : "—")}</span>
                </div>
                {u.username && u.email ? (
                  <p className="mt-0.5 truncate text-[11px] text-neutral-600">@{u.username}</p>
                ) : null}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={
                      u.verified
                        ? "rounded-md border border-[#1a1a1a] bg-[#141414] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-neutral-400"
                        : "rounded-md border border-[#1a1a1a] bg-[#141414] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-neutral-600"
                    }
                  >
                    {u.verified ? "Verified" : "Unverified"}
                  </span>
                  {u.deviceCount > 0 ? (
                    <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-600 tabular-nums">
                      {u.deviceCount} {u.deviceCount === 1 ? "device" : "devices"}
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-neutral-500">
                  <Clock className="h-3 w-3 shrink-0" strokeWidth={2} />
                  <span className="tabular-nums">{u.registered}</span>
                </div>

                <p className="mt-2 line-clamp-2 break-all font-mono text-[11px] leading-relaxed text-neutral-600">{u.id}</p>

                <div className="mt-4 flex flex-col gap-2 border-t border-[#1a1a1a] pt-3">
                  <button
                    type="button"
                    className="w-full rounded-lg bg-zinc-900/60 py-2 text-[11px] font-medium text-zinc-200 transition-colors hover:bg-zinc-800/80 hover:text-white"
                  >
                    Open User
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="flex flex-1 items-center justify-center rounded-lg bg-black/20 py-2 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-[#141414] hover:text-zinc-200"
                    >
                      Temporary Block
                    </button>
                    <button
                      type="button"
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-black/20 py-2 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-[#141414] hover:text-amber-200/90"
                    >
                      <Shield className="h-3 w-3 opacity-70" strokeWidth={2} />
                      Suspend
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
