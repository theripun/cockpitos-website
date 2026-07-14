"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Download, RefreshCw, Search, ChevronRight,
    CheckCircle2, AlertTriangle, XCircle, Info,
    X, Clock, Server, Tag,
} from "lucide-react";
import { mockLogs, logStyle, type MockLog } from "./admin-data";
import { StatCard } from "./admin-ui";

type Level = "all" | "info" | "warn" | "error";

/* ── extend mock logs for a richer display ── */
const EXTENDED_LOGS: MockLog[] = [
    ...mockLogs,
    { id: "l9", level: "info", time: "08:44:00", service: "auth", message: "Password reset email sent to ripun@cockpit.io" },
    { id: "l10", level: "warn", time: "08:41:38", service: "network", message: "High latency detected on vps-uk-01 (>400ms)" },
    { id: "l11", level: "info", time: "08:39:05", service: "system", message: "Auto-snapshot created for vps-sg-01" },
    { id: "l12", level: "error", time: "08:35:21", service: "cron", message: "Log rotation job failed: insufficient disk space" },
    { id: "l13", level: "info", time: "08:32:44", service: "agent", message: "Agent v2.4.1 deployed to vps-jp-01 successfully" },
    { id: "l14", level: "warn", time: "08:28:09", service: "auth", message: "5 failed login attempts from IP 192.168.1.44" },
    { id: "l15", level: "info", time: "08:25:00", service: "system", message: "Scheduled maintenance window started" },
    { id: "l16", level: "error", time: "08:21:15", service: "network", message: "vps-eu-01 unreachable — all pings lost" },
    { id: "l17", level: "info", time: "08:18:02", service: "auth", message: "User 'priya' session refreshed" },
    { id: "l18", level: "warn", time: "08:14:40", service: "disk", message: "Disk usage on vps-uk-01 crossed 90% threshold" },
];

const levelColors: Record<string, { bg: string; text: string; border: string }> = {
    info: { bg: "bg-white/[0.04]", text: "text-white", border: "border-white/10" },
    warn: { bg: "bg-amber-500/[0.06]", text: "text-amber-300", border: "border-amber-500/20" },
    error: { bg: "bg-rose-500/[0.06]", text: "text-rose-300", border: "border-rose-500/20" },
};

const LevelIcon: Record<string, React.ElementType> = {
    info: CheckCircle2, warn: AlertTriangle, error: XCircle,
};

/* ── Detail drawer ── */
function LogDrawer({ log, onClose }: { log: MockLog; onClose: () => void }) {
    const s = logStyle[log.level as keyof typeof logStyle];
    const c = levelColors[log.level];
    return (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className="relative z-10 w-[400px] h-full bg-zinc-950 border-l border-white/5 flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${s.text}`}>{s.label}</span>
                    <span className="text-white/20">·</span>
                    <span className="text-[11px] text-white/40 font-mono">{log.time}</span>
                    <button onClick={onClose} className="ml-auto p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 flex-1 overflow-y-auto">
                    {/* Message */}
                    <div className={`p-4 rounded-xl border ${c.bg} ${c.border}`}>
                        <p className={`text-[13px] font-medium leading-relaxed ${c.text}`}>{log.message}</p>
                    </div>

                    {/* Meta fields */}
                    {[
                        { icon: Tag, label: "Log ID", value: log.id },
                        { icon: Server, label: "Service", value: log.service },
                        { icon: Clock, label: "Timestamp", value: `Today at ${log.time}` },
                        { icon: Info, label: "Level", value: log.level.toUpperCase() },
                    ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-start gap-3">
                            <Icon className="w-4 h-4 text-white/25 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">{label}</p>
                                <p className="text-[13px] text-white font-mono">{value}</p>
                            </div>
                        </div>
                    ))}

                    {/* Raw payload mockup */}
                    <div>
                        <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Raw Payload</p>
                        <pre className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-[11px] text-white/60 font-mono leading-relaxed overflow-x-auto">{JSON.stringify(
                            { id: log.id, level: log.level, time: log.time, service: log.service, message: log.message, host: "cockpit-prod-01", pid: 12348 },
                            null, 2
                        )}</pre>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-white/5 flex gap-2">
                    <button className="flex-1 py-2 rounded-xl text-[12px] font-medium text-white bg-white/[0.06] hover:bg-white/[0.1] transition-all">Copy ID</button>
                    <button className="flex-1 py-2 rounded-xl text-[12px] font-medium text-white bg-white/[0.06] hover:bg-white/[0.1] transition-all">Export</button>
                </div>
            </motion.div>
        </div>
    );
}

/* ── Logs Tab ── */
export function LogsTab() {
    const [filter, setFilter] = useState<Level>("all");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<MockLog | null>(null);

    const filtered = EXTENDED_LOGS.filter((l) => {
        const matchLevel = filter === "all" || l.level === filter;
        const q = search.toLowerCase();
        const matchSearch = !q || l.message.toLowerCase().includes(q) || l.service.toLowerCase().includes(q);
        return matchLevel && matchSearch;
    });

    const total = EXTENDED_LOGS.length;
    const infoC = EXTENDED_LOGS.filter((l) => l.level === "info").length;
    const warnC = EXTENDED_LOGS.filter((l) => l.level === "warn").length;
    const errorC = EXTENDED_LOGS.filter((l) => l.level === "error").length;

    return (
        <>
            <div className="p-7 flex flex-col gap-5 h-full">

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
                    <StatCard label="Total Events" value={total} sub="all time" icon={Info} color="bg-blue-600/70" />
                    <StatCard label="Info" value={infoC} sub="informational" icon={CheckCircle2} color="bg-blue-600/70" />
                    <StatCard label="Warnings" value={warnC} sub="needs review" icon={AlertTriangle} color="bg-blue-600/70" />
                    <StatCard label="Errors" value={errorC} sub="critical" icon={XCircle} color="bg-blue-600/70" />
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search messages or services…"
                            className="w-full bg-white/[0.04] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all"
                        />
                    </div>

                    {/* Level pills */}
                    <div className="flex gap-1 bg-white/[0.04] border border-white/5 p-1 rounded-xl shrink-0">
                        {(["all", "info", "warn", "error"] as Level[]).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1 rounded-lg text-[12px] font-medium capitalize transition-all ${filter === f ? "bg-white/[0.08] text-white" : "text-white/30 hover:text-white"
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <button className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/[0.05] transition-all border border-white/5">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black hover:bg-zinc-200 transition-colors text-[13px] font-semibold shrink-0">
                        <Download className="w-3.5 h-3.5" /> Export
                    </button>
                </div>

                {/* Log panel */}
                <div className="flex-1 min-h-0 bg-white/[0.03] border border-white/5 backdrop-blur-xl rounded-2xl overflow-hidden flex flex-col">
                    {/* Panel header */}
                    <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2.5 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-[10px] uppercase tracking-widest text-white/40">Live Stream</span>
                        <span className="ml-auto text-[11px] text-white/20">{filtered.length} events</span>
                    </div>

                    {/* Column headers */}
                    <div className="grid grid-cols-[80px_48px_90px_1fr_20px] gap-3 px-5 py-2 border-b border-white/[0.04] shrink-0">
                        {["Time", "Level", "Service", "Message", ""].map((h) => (
                            <span key={h} className="text-[9px] uppercase tracking-widest text-white/20">{h}</span>
                        ))}
                    </div>

                    {/* Rows */}
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                        <AnimatePresence initial={false}>
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 gap-2 text-white/20">
                                    <Search className="w-6 h-6" />
                                    <span className="text-[12px]">No logs match your filter.</span>
                                </div>
                            ) : filtered.map((l, i) => {
                                const s = logStyle[l.level as keyof typeof logStyle];
                                const LIcon = LevelIcon[l.level] ?? Info;
                                return (
                                    <motion.div
                                        key={l.id}
                                        initial={{ opacity: 0, x: -6 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ delay: i * 0.025 }}
                                        onClick={() => setSelected(l)}
                                        className="grid grid-cols-[80px_48px_90px_1fr_20px] gap-3 items-center px-5 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer border-b border-white/[0.03] group font-mono text-[12px]"
                                    >
                                        <span className="text-white/40 tabular-nums">{l.time}</span>
                                        <span className={`flex items-center gap-1 font-bold text-[9px] uppercase tracking-widest ${s.text}`}>
                                            <LIcon className="w-3 h-3 shrink-0" />
                                            {s.label}
                                        </span>
                                        <span className="text-white/30 truncate">[{l.service}]</span>
                                        <span className="text-white truncate">{l.message}</span>
                                        <ChevronRight className="w-3.5 h-3.5 text-white/0 group-hover:text-white/30 transition-colors" />
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Detail Drawer */}
            <AnimatePresence>
                {selected && <LogDrawer key="drawer" log={selected} onClose={() => setSelected(null)} />}
            </AnimatePresence>
        </>
    );
}
