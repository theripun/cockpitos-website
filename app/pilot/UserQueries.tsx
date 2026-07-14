"use client";

import React from "react";
import { Clock, Shield, Send, ChevronRight } from "lucide-react";

const QUERIES = [
  {
    id: 1,
    user: "Alpha-Wilson",
    query: "Requesting permission for deep packet inspection on Relay Alpha node.",
    time: "2 mins ago",
    priority: "High",
    status: "Pending",
    avatar: "https://i.pravatar.cc/150?u=a1",
  },
  {
    id: 2,
    user: "Sigma-Connor",
    query: "Anomalous signal frequency detected in Sector 7G. Seeking clarification on protocol.",
    time: "15 mins ago",
    priority: "Medium",
    status: "Open",
    avatar: "https://i.pravatar.cc/150?u=s2",
  },
  {
    id: 3,
    user: "Delta-Brown",
    query: "Hardware maintenance scheduled for Edge Node 4. Requesting secondary uplink.",
    time: "45 mins ago",
    priority: "Low",
    status: "Open",
    avatar: "https://i.pravatar.cc/150?u=d3",
  },
  {
    id: 4,
    user: "Gupta-Tech",
    query: "Encryption mismatch on Kolkata relay. Need system override key.",
    time: "1h ago",
    priority: "Critical",
    status: "Urgent",
    avatar: "https://i.pravatar.cc/150?u=g4",
  },
  {
    id: 5,
    user: "Echo-Unit-7",
    query: "Bandwidth cap warning on uplink B. Request QoS policy review.",
    time: "2h ago",
    priority: "Medium",
    status: "Open",
    avatar: "https://i.pravatar.cc/150?u=e5",
  },
  {
    id: 6,
    user: "Foxtrot-Ops",
    query: "Scheduled failover test for Region EU-West. Need approval window.",
    time: "3h ago",
    priority: "Low",
    status: "Pending",
    avatar: "https://i.pravatar.cc/150?u=f6",
  },
  {
    id: 7,
    user: "Nova-Security",
    query: "Suspicious API key rotation detected on staging. Escalation requested.",
    time: "4h ago",
    priority: "High",
    status: "Open",
    avatar: "https://i.pravatar.cc/150?u=n7",
  },
  {
    id: 8,
    user: "Orbit-Maintenance",
    query: "Certificate renewal batch job failed. Manual re-issue needed.",
    time: "5h ago",
    priority: "Medium",
    status: "Pending",
    avatar: "https://i.pravatar.cc/150?u=o8",
  },
  {
    id: 9,
    user: "Pulse-Analytics",
    query: "Export job stuck at 78%. Requesting operator to clear queue slot.",
    time: "6h ago",
    priority: "Low",
    status: "Open",
    avatar: "https://i.pravatar.cc/150?u=p9",
  },
];

function priorityClass(p: string) {
  if (p === "Critical") return "bg-[#141414] text-neutral-200 border-[#1a1a1a]";
  if (p === "High") return "bg-[#141414] text-neutral-400 border-[#1a1a1a]";
  if (p === "Medium") return "bg-[#141414] text-neutral-500 border-[#1a1a1a]";
  return "bg-[#141414] text-neutral-600 border-[#1a1a1a]";
}

function dotClass(p: string) {
  if (p === "Critical") return "bg-neutral-200";
  if (p === "High") return "bg-neutral-500";
  return "bg-neutral-700";
}

export default function UserQueries() {
  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-black p-6 sm:p-8">
      <div className="mb-6 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Transmission queue</h2>
          <p className="mt-1 text-sm text-neutral-500">Inbound requests and tickets · 3×3 board</p>
        </div>
        <div className="flex gap-3">
          <div className="flex flex-col items-center rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-5 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Active</span>
            <span className="text-lg font-semibold text-white">12</span>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-5 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Resolved</span>
            <span className="text-lg font-semibold text-neutral-400">142</span>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUERIES.map((q) => (
            <article
              key={q.id}
              className="group flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-4 transition-colors hover:border-[#262626]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="relative shrink-0">
                  <img
                    src={q.avatar}
                    alt=""
                    className="h-11 w-11 rounded-full border border-[#1a1a1a] object-cover"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0a0a0a] ${dotClass(q.priority)}`}
                  />
                </div>
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-white/5 hover:text-white"
                  aria-label="More"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>

              <h3 className="mt-3 truncate text-[15px] font-semibold text-white">{q.user}</h3>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-500">
                <Clock className="h-3 w-3 shrink-0" strokeWidth={2} />
                {q.time}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${priorityClass(q.priority)}`}>
                  {q.priority}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-600">{q.status}</span>
              </div>

              <p className="mt-3 line-clamp-3 flex-1 text-[12px] leading-relaxed text-neutral-400">&ldquo;{q.query}&rdquo;</p>

              <div className="mt-4 flex flex-col gap-2 border-t border-[#1a1a1a] pt-3">
                <button
                  type="button"
                  className="w-full rounded-lg bg-zinc-900/60 py-2 text-[11px] font-medium text-zinc-200 transition-colors hover:bg-zinc-800/80 hover:text-white"
                >
                  Open protocol
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-black/20 py-2 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-[#141414] hover:text-zinc-200"
                  >
                    <Send className="h-3 w-3 opacity-70" strokeWidth={2} />
                    Auth
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-lg bg-black/20 px-3 py-2 text-zinc-500 transition-colors hover:bg-[#141414] hover:text-zinc-300"
                    aria-label="Shield"
                  >
                    <Shield className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-center text-[9px] font-semibold uppercase tracking-widest text-neutral-700">#{q.id}42</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
