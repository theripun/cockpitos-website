"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserCircle, Hash, AlertOctagon, Terminal, RotateCcw, Power, ScrollText, Activity, Trash2, X, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";
import { mockDevices, statusDot } from "./admin-data";
import { Pill } from "./admin-ui";

/* ── Fake time-series data ── */
function makeSparkData(seed: number, len = 14) {
    const data = [];
    let v = Math.max(5, Math.min(90, seed));
    for (let i = 0; i < len; i++) {
        v = Math.max(4, Math.min(98, v + (Math.random() - 0.48) * 14));
        data.push({ v: Math.round(v) });
    }
    return data;
}

/* Each device gets independent CPU / RAM / Disk series */
const series = mockDevices.map((d) => ({
    cpu: makeSparkData(d.cpu),
    ram: makeSparkData(d.ram),
    disk: makeSparkData(d.disk),
}));

/* ── Sparkline ── */
function Spark({
    data,
    color,
    gradId,
    offline,
    label,
}: {
    data: { v: number }[];
    color: string;
    gradId: string;
    offline: boolean;
    label: string;
}) {
    return (
        <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] uppercase tracking-widest text-white">{label}</span>
            {offline ? (
                <div className="w-[96px] h-[30px] flex items-center justify-center">
                    <span className="text-[9px] text-white">—</span>
                </div>
            ) : (
                <div className="w-[96px] h-[30px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 1, right: 0, left: 0, bottom: 1 }}>
                            <defs>
                                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Tooltip
                                content={({ active, payload }) =>
                                    active && payload?.length ? (
                                        <div className="bg-zinc-900 border border-white/10 text-[10px] text-white px-2 py-1 rounded-lg shadow-xl">
                                            {payload[0].value}%
                                        </div>
                                    ) : null
                                }
                            />
                            <Area
                                type="monotone"
                                dataKey="v"
                                stroke={color}
                                strokeWidth={1.4}
                                fill={`url(#${gradId})`}
                                dot={false}
                                isAnimationActive
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

/* ── Overview Tab ── */
export function OverviewTab() {
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
    const [crashReport, setCrashReport] = useState<typeof mockDevices[0] | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
        setToast({ message, type });
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
    }, []);

    return (
        <div className="p-7 flex flex-col gap-6 h-full relative">
            {/* Nodes — full width */}
            <div className="backdrop-blur-3xl rounded-2xl overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="px-5 py-3.5 flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-white">Nodes</p>
                    <span className="flex items-center gap-1.5 text-[10px] text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                        Live
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                    {mockDevices.map((d, i) => {
                        const isOffline = d.status === "offline";
                        return (
                            <motion.div
                                key={d.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="flex items-center justify-between gap-2 px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                            >
                                {/* Status dot — centered */}
                                <div className="w-8 shrink-0 flex items-center justify-center">
                                    <div className={`w-2.5 h-2.5 rounded-full ${statusDot[d.status]}`} />
                                </div>

                                {/* Name + region — centered */}
                                <div className="w-36 shrink-0 flex flex-col items-center justify-center text-center min-w-0">
                                    <p className="text-[12px] font-medium text-white truncate w-full text-center">{d.name}</p>
                                    <p className="text-[10px] text-white/50 truncate w-full text-center">{d.region}</p>
                                </div>

                                {/* Device ID chip — centered */}
                                <div className="w-[152px] shrink-0 flex items-center justify-center">
                                    <div className="inline-flex items-center gap-1.5">
                                        <Hash className="w-3 h-3 text-white/25 shrink-0" />
                                        <span className="text-[10px] text-white font-semibold tracking-tight">
                                            {d.id.slice(0, 8)}<span className="text-white">…</span>{d.id.slice(-4)}
                                        </span>
                                    </div>
                                </div>

                                {/* Username — centered */}
                                <div className="w-24 shrink-0 flex items-center justify-center">
                                    <div className="inline-flex items-center gap-1">
                                        <UserCircle className="w-3 h-3 text-white shrink-0" />
                                        <span className="text-[11px] text-white font-semibold">{d.user}</span>
                                    </div>
                                </div>

                                {/* Error / Crashed — fixed width column */}
                                <div className="w-[80px] shrink-0 flex items-center justify-center">
                                    {(d.status === "offline" || d.status === "warning") ? (
                                        <button
                                            onClick={() => setCrashReport(d)}
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg cursor-pointer hover:opacity-80 transition-opacity ${d.status === "offline"
                                                ? "bg-rose-500/10 hover:bg-rose-500/20"
                                                : "bg-amber-500/10 hover:bg-amber-500/20"
                                                }`}>
                                            <AlertOctagon className={`w-3 h-3 shrink-0 ${d.status === "offline" ? "text-rose-400" : "text-amber-400"
                                                }`} />
                                            <span className={`text-[10px] font-semibold ${d.status === "offline" ? "text-rose-400" : "text-amber-400"
                                                }`}>
                                                {d.status === "offline" ? "Crashed" : "Error"}
                                            </span>
                                        </button>
                                    ) : (
                                        <span className="text-[10px] text-white/15 pl-1">—</span>
                                    )}
                                </div>

                                {/* Sparklines — centered group */}
                                <div className="flex items-center justify-center gap-4 shrink-0">
                                    <Spark data={series[i].cpu} color="#ffffffff" gradId={`cpu-${d.id}`} offline={isOffline} label="cpu" />
                                    <Spark data={series[i].ram} color="#ffffffff" gradId={`ram-${d.id}`} offline={isOffline} label="mem" />
                                    <Spark data={series[i].disk} color="#ffffffff" gradId={`disk-${d.id}`} offline={isOffline} label="disk" />
                                </div>

                                {/* Status pill — fixed width centered */}
                                <div className="w-[72px] shrink-0 flex items-center justify-center">
                                    <Pill status={d.status} />
                                </div>

                                {/* Action buttons — centered group */}
                                <div className="flex items-center justify-center gap-1 shrink-0">
                                    {([
                                        { icon: Terminal, title: "SSH", cls: "hover:text-cyan-400    hover:bg-cyan-400/10" },
                                        { icon: RotateCcw, title: "Restart", cls: "hover:text-white       hover:bg-white/10" },
                                        { icon: Power, title: "Reboot", cls: "hover:text-amber-400   hover:bg-amber-400/10" },
                                        { icon: ScrollText, title: "Logs", cls: "hover:text-blue-400    hover:bg-blue-400/10" },
                                        { icon: Activity, title: "Monitor", cls: "hover:text-emerald-400 hover:bg-emerald-400/10" },
                                        { icon: Trash2, title: "Delete", cls: "hover:text-rose-400    hover:bg-rose-400/10" },
                                    ] as const).map(({ icon: Icon, title, cls }) => (
                                        <button
                                            key={title}
                                            title={title}
                                            onClick={() => {
                                                if (title === "Delete") {
                                                    showToast(`Device ${d.name} deleted`, "success");
                                                } else {
                                                    showToast(`${title} initiated for ${d.name}`, "info");
                                                }
                                            }}
                                            className={`w-7 h-7 flex items-center justify-center rounded-lg text-white/25 transition-all duration-150 ${cls}`}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Crash Report Modal */}
            <AnimatePresence>
                {crashReport && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
                        onClick={() => setCrashReport(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-[14px] font-semibold text-white">System Diagnostics Report</h3>
                                        <p className="text-[11px] text-zinc-400">Device: {crashReport.name} ({crashReport.id})</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setCrashReport(null)}
                                    className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Body - Logs */}
                            <div className="p-5 flex-1 overflow-y-auto bg-[#0a0a0a]">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[12px] font-medium text-rose-400 mb-2">Fatal Error Details</p>
                                        <div className="bg-black border border-white/5 rounded-xl p-4 font-mono text-[11px] text-zinc-300 leading-relaxed overflow-x-auto">
                                            <p className="text-zinc-500">[2026-02-25 14:32:01 UTC] <span className="text-rose-400">FATAL</span> kernel: BUG: unable to handle kernel NULL pointer dereference at 0000000000000040</p>
                                            <p className="text-zinc-500">[2026-02-25 14:32:01 UTC] <span className="text-rose-400">FATAL</span> kernel: IP: 0xffffffff811a2b3c</p>
                                            <p className="text-zinc-500">[2026-02-25 14:32:01 UTC] <span className="text-rose-400">FATAL</span> kernel: PGD 8000000001800067 P4D 8000000001800067 PUD 1801067 PMD 0 </p>
                                            <p className="text-zinc-500">[2026-02-25 14:32:01 UTC] <span className="text-rose-400">FATAL</span> kernel: Oops: 0000 [#1] SMP NOPTI</p>
                                            <p className="text-zinc-500 mt-2">[2026-02-25 14:32:02 UTC] <span className="text-amber-400">WARN</span>  systemd[1]: systemd-journald.service: Main process exited, code=killed, status=11/SEGV</p>
                                            <p className="text-zinc-500">[2026-02-25 14:32:03 UTC] <span className="text-rose-400">FATAL</span> systemd[1]: systemd-journald.service: Failed with result 'signal'.</p>
                                            <p className="mt-4 text-rose-400">Kernel panic - not syncing: Fatal exception</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                                            <p className="text-[10px] text-zinc-500 mb-1">State before crash</p>
                                            <div className="flex items-center gap-4">
                                                <div>
                                                    <p className="text-[10px] text-zinc-400">CPU</p>
                                                    <p className="text-[13px] font-semibold text-rose-400">100%</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-zinc-400">RAM</p>
                                                    <p className="text-[13px] font-semibold text-rose-400">98.4%</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                                            <p className="text-[10px] text-zinc-500 mb-1">Recommended Action</p>
                                            <p className="text-[12px] text-zinc-300">Hard reboot required. If issue persists, check kernel logs via rescue shell.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-4 border-t border-white/5 bg-zinc-900/50 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setCrashReport(null)}
                                    className="px-4 py-2 rounded-lg text-[12px] font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    Dismiss
                                </button>
                                <button
                                    onClick={() => {
                                        showToast("Initiating remote diagnostics...", "info");
                                        setCrashReport(null);
                                    }}
                                    className="px-4 py-2 rounded-lg text-[12px] font-medium bg-rose-500 text-white hover:bg-rose-600 shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all"
                                >
                                    Run Diagnostics
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast System */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-2 px-4 py-2.5 rounded-xl border backdrop-blur-xl shadow-2xl ${toast.type === "success"
                            ? "bg-emerald-500/10 border-emerald-500/20"
                            : toast.type === "error"
                                ? "bg-rose-500/10 border-rose-500/20"
                                : "bg-blue-500/10 border-blue-500/20"
                            }`}
                    >
                        {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {toast.type === "error" && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                        {toast.type === "info" && <Info className="w-4 h-4 text-blue-400" />}
                        <span className={`text-[12px] font-medium ${toast.type === "success" ? "text-emerald-400" : toast.type === "error" ? "text-rose-400" : "text-blue-400"
                            }`}>
                            {toast.message}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
