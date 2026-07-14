"use client";

import React from "react";
import { Users } from "lucide-react";

export type PilotUserTableRow = {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  role: string;
  registered: string;
  verified: boolean;
  deviceCount: number;
};

export function mapApiUserToPilotRow(u: any): PilotUserTableRow {
  const created = new Date(u.createdAt || Date.now());
  const deviceCount = Array.isArray(u.devices) ? u.devices.length : 0;
  return {
    id: typeof u.id === "string" ? u.id : String(u.id ?? "—"),
    name: u.name || u.username || "—",
    email: u.email ? String(u.email) : null,
    username: u.username ? String(u.username) : null,
    role: (u.role || "user").toString(),
    registered: created.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    verified: Boolean(u.isEmailVerified),
    deviceCount,
  };
}

type PilotUsersTableProps = {
  rows: PilotUserTableRow[];
  loading: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function PilotUsersTable({
  rows,
  loading,
  emptyTitle = "No users yet",
  emptyDescription,
}: PilotUsersTableProps) {
  return (
    <>
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#1a1a1a] bg-black py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#262626] border-t-neutral-400" />
          <p className="mt-3 text-xs text-neutral-500">Loading users…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-[#1a1a1a] bg-black py-14 text-center">
          <Users className="mx-auto h-8 w-8 text-neutral-600" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-neutral-400">{emptyTitle}</p>
          {emptyDescription ? <p className="mt-1 text-xs text-neutral-600">{emptyDescription}</p> : null}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#1a1a1a]">
          <table className="w-full min-w-[56rem] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#1a1a1a] bg-[#0a0a0a]">
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Name</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Email / username
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Role</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Registered
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Status</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">User ID</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[#1a1a1a] last:border-b-0 hover:bg-[#0a0a0a]"
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={
                          row.deviceCount > 0
                            ? "inline-flex max-w-[200px] truncate rounded-md bg-white/10 px-2.5 py-1 text-[13px] font-medium text-neutral-200 ring-1 ring-white/10"
                            : "inline-flex max-w-[200px] truncate text-[13px] font-medium text-neutral-100"
                        }
                      >
                        {row.name}
                      </span>
                      {row.deviceCount > 0 ? (
                        <span className="shrink-0 tabular-nums text-[11px] font-semibold text-neutral-400">
                          {row.deviceCount} {row.deviceCount === 1 ? "device" : "devices"}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-neutral-400">
                    {row.email || (row.username ? `@${row.username}` : "—")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-400">{row.role}</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-neutral-500">{row.registered}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        row.verified
                          ? "rounded bg-white/10 px-2 py-0.5 text-[11px] font-medium text-neutral-300"
                          : "rounded bg-[#141414] px-2 py-0.5 text-[11px] font-medium text-neutral-500"
                      }
                    >
                      {row.verified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td className="max-w-[min(28rem,40vw)] break-all px-4 py-3 font-mono text-[12px] leading-snug text-neutral-500">
                    {row.id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
