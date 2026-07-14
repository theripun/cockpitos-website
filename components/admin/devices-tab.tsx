"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Server, HardDrive, Cpu, MemoryStick,
    Globe, Clock, Plus, Search, RefreshCw,
    Wifi, WifiOff, AlertTriangle, UserCircle,
    X, Power, RotateCcw, Terminal, Download, Trash2,
    ShieldAlert, Lock, Unlock, Copy, CheckCheck,
} from "lucide-react";
import {
    ResponsiveContainer, AreaChart, Area,
    XAxis, Tooltip, CartesianGrid,
} from "recharts";
import { mockDevices, type MockDevice, statusDot } from "./admin-data";
import { StatCard, Pill } from "./admin-ui";

/* ── Fake historical data per device ── */
function makeHistory(base: number, len = 24) {
    const pts = [];
    let v = Math.max(5, Math.min(90, base));
    for (let i = 0; i < len; i++) {
        v = Math.max(3, Math.min(99, v + (Math.random() - 0.46) * 12));
        pts.push({ t: `${i}`, cpu: Math.round(v) });
    }
    return pts;
}

const histories = mockDevices.map((d) => ({
    cpu: makeHistory(d.cpu),
    ram: makeHistory(d.ram),
    disk: makeHistory(d.disk),
}));

/* ── Metric row ── */
function MetricRow({ icon: Icon, label, value }: {
    icon: React.ElementType; label: string; value: number;
}) {
    const pct = Math.min(100, value);
    return (
        <div className="flex items-center gap-2.5">
            <Icon className="w-3 h-3 shrink-0 text-white" />
            <span className="text-[10px] text-white/40 w-7 uppercase tracking-wider shrink-0">{label}</span>
            <div className="flex-1 h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    className="h-full rounded-full bg-white"
                />
            </div>
            <span className="text-[10px] font-mono w-8 text-right tabular-nums text-white">
                {value}%
            </span>
        </div>
    );
}

/* ── Custom tooltip ── */
function ChartTip({ active, payload }: { active?: boolean; payload?: { value: number; name: string; color: string }[] }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-black/80 backdrop-blur border border-white/10 text-[10px] text-white px-2.5 py-1.5 rounded-lg shadow-xl space-y-0.5">
            {payload.map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.color }} />
                    <span className="text-white/50 capitalize">{p.name}</span>
                    <span className="font-mono ml-auto">{p.value}%</span>
                </div>
            ))}
        </div>
    );
}

type MetricKey = "cpu" | "ram" | "disk";
const metricMeta: Record<MetricKey, { color: string; stroke: string; grad: string }> = {
    cpu: { color: "text-blue-400", stroke: "#ffffffff", grad: "cpuGrad" },
    ram: { color: "text-violet-400", stroke: "#ffffffff", grad: "ramGrad" },
    disk: { color: "text-amber-400", stroke: "#ffffffff", grad: "diskGrad" },
};

/* ══════════════════════════════════════════
   MANAGE MODAL — control panel
══════════════════════════════════════════ */
function ManageModal({ d, onClose }: { d: MockDevice; onClose: () => void }) {
    const [copied, setCopied] = useState(false);
    const [action, setAction] = useState<string | null>(null);

    function copyIP() {
        navigator.clipboard.writeText(d.ip).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    function confirm(label: string) {
        setAction(label);
        setTimeout(() => setAction(null), 2000);
    }

    const controls = [
        { icon: RotateCcw, label: "Restart", color: "text-amber-400", bg: "hover:bg-amber-400/10" },
        { icon: Power, label: "Shutdown", color: "text-rose-400", bg: "hover:bg-rose-400/10" },
        { icon: Terminal, label: "Open SSH", color: "text-blue-400", bg: "hover:bg-blue-400/10" },
        { icon: Download, label: "Download Logs", color: "text-white/60", bg: "hover:bg-white/[0.05]" },
        { icon: Lock, label: "Lock Access", color: "text-amber-400", bg: "hover:bg-amber-400/10" },
        { icon: ShieldAlert, label: "Run Audit", color: "text-violet-400", bg: "hover:bg-violet-400/10" },
        { icon: Unlock, label: "Unlock Access", color: "text-white/60", bg: "hover:bg-white/[0.05]" },
        { icon: Trash2, label: "Decommission", color: "text-rose-500", bg: "hover:bg-rose-500/10" },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 16 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className="relative z-10 w-full max-w-md bg-black border border-white/5 rounded-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusDot[d.status]}`} />
                    <div className="flex-1">
                        <p className="text-[14px] font-semibold text-white">{d.name}</p>
                        <p className="text-[11px] text-white/40">Management Controls</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Info strip */}
                <div className="px-6 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[11px] text-white/40">
                        <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" />{d.region}</span>
                        <span className="flex items-center gap-1.5"><UserCircle className="w-3 h-3" />{d.user}</span>
                    </div>
                    <button
                        onClick={copyIP}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] transition-all"
                    >
                        {copied ? <CheckCheck className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3 text-white/40" />}
                        <span className={`font-mono ${copied ? "text-white" : "text-white/40"}`}>{copied ? "Copied!" : d.ip}</span>
                    </button>
                </div>

                {/* Action grid */}
                <div className="p-5 grid grid-cols-2 gap-2.5">
                    {controls.map(({ icon: Icon, label, color, bg }) => (
                        <motion.button
                            key={label}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => confirm(label)}
                            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border border-white/[0.05] bg-white/[0.02] ${bg} transition-all text-left group`}
                        >
                            <Icon className={`w-4 h-4 shrink-0 ${color}`} />
                            <span className="text-[12px] font-medium text-white/70 group-hover:text-white transition-colors">{label}</span>
                        </motion.button>
                    ))}
                </div>

                {/* Toast feedback */}
                <AnimatePresence>
                    {action && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/10 backdrop-blur border border-white/10 text-white text-[12px] font-medium px-5 py-2 rounded-full shadow-xl"
                        >
                            ✓ {action} initiated for {d.name}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

/* ── Device Card ── */
function DeviceCard({ d, idx, activeMetric, onManage }: {
    d: MockDevice;
    idx: number;
    activeMetric: MetricKey;
    onManage: () => void;
}) {
    const history = histories[idx];
    const chartData = history[activeMetric];
    const meta = metricMeta[activeMetric];
    const isOffline = d.status === "offline";

    const StatusIcon = d.status === "online" ? Wifi : d.status === "warning" ? AlertTriangle : WifiOff;

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="bg-white/[0.04] border border-white/5 backdrop-blur-xl rounded-2xl overflow-hidden flex flex-col"
        >
            {/* Header */}
            <div className="px-4 pt-4 pb-3 flex items-start justify-between">
                <div className="flex items-start gap-2.5">
                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${statusDot[d.status]}`} />
                    <div>
                        <p className="text-[13px] font-semibold text-white leading-tight">{d.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <Globe className="w-2.5 h-2.5 text-white/30" />
                            <span className="text-[10px] text-white/40">{d.region}</span>
                            <span className="text-white/20">·</span>
                            <span className="text-[10px] text-white/30 font-mono">{d.ip}</span>
                        </div>
                        {/* Username */}
                        <div className="flex items-center gap-1 mt-1.5">
                            <UserCircle className="w-3 h-3 text-white/50 shrink-0" />
                            <span className="text-[11px] font-semibold text-white">{d.user}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                    <Pill status={d.status} />
                    <div className="flex items-center gap-1 text-white/30">
                        <Clock className="w-2.5 h-2.5" />
                        <span className="text-[9px]">{d.uptime}</span>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="px-2 h-[88px]">
                {isOffline ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <WifiOff className="w-5 h-5 text-white mx-auto mb-1" />
                            <p className="text-[10px] text-white">No data — offline</p>
                        </div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                            <defs>
                                <linearGradient id={`${meta.grad}-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={meta.stroke} stopOpacity={0.3} />
                                    <stop offset="100%" stopColor={meta.stroke} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                            <XAxis dataKey="t" hide />
                            <Tooltip content={<ChartTip />} />
                            <Area
                                type="monotone"
                                dataKey="cpu"
                                stroke={meta.stroke}
                                strokeWidth={1.5}
                                fill={`url(#${meta.grad}-${idx})`}
                                dot={false}
                                isAnimationActive
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Metrics */}
            <div className="px-4 pt-1 pb-3 space-y-1.5">
                <MetricRow icon={Cpu} label="CPU" value={d.cpu} />
                <MetricRow icon={MemoryStick} label="RAM" value={d.ram} />
                <MetricRow icon={HardDrive} label="DISK" value={d.disk} />
            </div>

            {/* Footer actions */}
            <div className="px-3 pb-3 pt-1 flex items-center gap-2 border-t border-white/[0.04]">
                <div className="flex items-center gap-1.5 mr-auto">
                    <Server className="w-3 h-3 text-white/25" />
                    <span className="text-[10px] text-white/30 font-mono">{d.os}</span>
                </div>
                <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={onManage}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-white/50 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] transition-all"
                >
                    <StatusIcon className="w-3 h-3" /> Manage
                </motion.button>
            </div>
        </motion.div>
    );
}

/* ── Devices Tab ── */
export function DevicesTab() {
    const [search, setSearch] = useState("");
    const [activeMetric, setActiveMetric] = useState<MetricKey>("cpu");
    const [manageDevice, setManageDevice] = useState<MockDevice | null>(null);

    const totalDevices = mockDevices.length;
    const onlineCount = mockDevices.filter((d) => d.status === "online").length;
    const warningCount = mockDevices.filter((d) => d.status === "warning").length;
    const offlineCount = mockDevices.filter((d) => d.status === "offline").length;

    const filtered = mockDevices.filter((d) =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.region.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <div className="p-7 flex flex-col gap-5 h-full">

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
                    <StatCard label="Total Nodes" value={totalDevices} sub="registered" icon={Server} color="bg-blue-600/70" />
                    <StatCard label="Online" value={onlineCount} sub="actively running" icon={Wifi} color="bg-blue-600/70" />
                    <StatCard label="Warning" value={warningCount} sub="needs attention" icon={AlertTriangle} color="bg-blue-600/70" />
                    <StatCard label="Offline" value={offlineCount} sub="unreachable" icon={WifiOff} color="bg-blue-600/70" />
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or region…"
                            className="w-full bg-white/[0.04] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all"
                        />
                    </div>

                    <div className="flex gap-1 bg-white/[0.04] border border-white/5 p-1 rounded-xl shrink-0">
                        {(["cpu", "ram", "disk"] as MetricKey[]).map((m) => (
                            <button
                                key={m}
                                onClick={() => setActiveMetric(m)}
                                className={`px-3 py-1 rounded-lg text-[12px] font-medium uppercase tracking-wider transition-all ${activeMetric === m
                                    ? `bg-white/[0.08] text-white`
                                    : "text-white/30 hover:text-white"
                                    }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>

                    <button className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/[0.05] transition-all border border-white/5">
                        <RefreshCw className="w-4 h-4" />
                    </button>

                    <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black hover:bg-zinc-200 transition-colors text-[13px] font-semibold shrink-0">
                        <Plus className="w-3.5 h-3.5" /> Add Node
                    </button>
                </div>

                {/* Cards grid */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3">
                            <Server className="w-8 h-8 text-white/10" />
                            <p className="text-[13px] text-white/30">No devices match your search.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-2">
                            {filtered.map((d, i) => {
                                const origIdx = mockDevices.findIndex((x) => x.id === d.id);
                                return (
                                    <DeviceCard
                                        key={d.id}
                                        d={d}
                                        idx={origIdx}
                                        activeMetric={activeMetric}
                                        onManage={() => setManageDevice(d)}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {manageDevice && (
                    <ManageModal
                        key="manage"
                        d={manageDevice}
                        onClose={() => setManageDevice(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
