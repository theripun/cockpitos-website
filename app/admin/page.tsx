"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BarChart3, Users, Server, ScrollText, Settings,
    Bell, RefreshCw, ChevronRight, Zap, Shield,
    Activity, LogOut, Command, Cpu, Globe,
} from "lucide-react";

import { type Tab } from "@/components/admin/admin-data";
import { OverviewTab } from "@/components/admin/overview-tab";
import { UsersTab } from "@/components/admin/users-tab";
import { DevicesTab } from "@/components/admin/devices-tab";
import { LogsTab } from "@/components/admin/logs-tab";
import { SettingsTab } from "@/components/admin/settings-tab";

/* ── Nav tab definition ── */
const NAV_TABS: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "devices", label: "Devices", icon: Server },
    { id: "logs", label: "Logs", icon: ScrollText, badge: 2 },
    { id: "settings", label: "Settings", icon: Settings },
];

/* ── Live clock ── */
function LiveClock() {
    const [time, setTime] = useState("");
    useEffect(() => {
        function tick() {
            setTime(new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        }
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);
    return <span className="text-[11px] font-mono text-white/30 tabular-nums">{time}</span>;
}

/* ── Notification panel ── */
const NOTIFS = [
    { dot: "bg-rose-400 shadow-[0_0_6px_#f43f5e]", title: "High CPU on vps-uk-01", sub: "91% usage · 2m ago", read: false },
    { dot: "bg-amber-400 shadow-[0_0_6px_#fbbf24]", title: "Disk threshold on vps-in-01", sub: "89% disk · 8m ago", read: false },
    { dot: "bg-white/20", title: "'carlos' account suspended", sub: "Admin action · 1d ago", read: true },
];

function NotifPanel({ onClose }: { onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -8 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-12 z-50 w-80 bg-zinc-950/98 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="px-4 py-3.5 flex items-center justify-between border-b border-white/5">
                <p className="text-[12px] font-semibold text-white">Notifications</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/20">
                    2 new
                </span>
            </div>
            <div className="divide-y divide-white/[0.04]">
                {NOTIFS.map((n, i) => (
                    <div key={i} className={`flex items-start gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors cursor-pointer ${n.read ? "opacity-50" : ""}`}>
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.dot}`} />
                        <div className="flex-1">
                            <p className="text-[12px] text-white font-medium">{n.title}</p>
                            <p className="text-[10px] text-white/35 mt-0.5">{n.sub}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
                <button className="text-[11px] text-white/30 hover:text-white transition-colors">
                    Mark all as read
                </button>
                <button onClick={onClose} className="text-[11px] text-white/30 hover:text-white transition-colors">
                    Dismiss
                </button>
            </div>
        </motion.div>
    );
}

/* ── Background ── */
function AmbientMesh() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-black" />
        </div>
    );
}

/* ── System health dots ── */
function HealthDot({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
            <span className="text-[10px] text-white/30">{label}</span>
        </div>
    );
}

/* ════════════════════════════════════
   MAIN PAGE
════════════════════════════════════ */
export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [notifOpen, setNotifOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    function handleRefresh() {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 900);
    }

    // close notif on outside click
    useEffect(() => {
        if (!notifOpen) return;
        const handler = () => setNotifOpen(false);
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [notifOpen]);

    const activeTabDef = NAV_TABS.find((t) => t.id === activeTab);

    return (
        <div className="relative min-h-screen w-full text-white font-sans overflow-hidden">
            <AmbientMesh />

            <div className="relative z-10 flex flex-col h-screen">

                {/* ══════════ TOP BAR ══════════ */}
                <header className="shrink-0 h-[56px] flex items-center px-5 gap-4 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">

                    {/* Brand */}
                    <div className="flex items-center gap-2.5 shrink-0">
                        <div className="w-7 h-7 rounded-lg bg-transparent border border-white/10 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/logo/cockpit.svg" alt="Cockpit" className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-semibold text-white">Cockpit Admin</span>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-5 bg-white/[0.07] shrink-0" />

                    {/* Nav tabs */}
                    <nav className="flex items-center gap-0.5 flex-1">
                        {NAV_TABS.map((tab) => {
                            const Icon = tab.icon;
                            const active = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex items-center gap-1.5 px-3.5 py-[7px] rounded-xl text-[12px] font-medium transition-all ${active
                                        ? "text-white"
                                        : "text-white hover:text-white/70 hover:bg-white/[0.03]"
                                        }`}
                                >
                                    {active && (
                                        <motion.div
                                            layoutId="topnav-bg"
                                            className="absolute inset-0 rounded-full bg-transparent border border-white/[0.08]"
                                            transition={{ type: "spring", stiffness: 480, damping: 36 }}
                                        />
                                    )}
                                    <Icon className={`relative w-3.5 h-3.5 shrink-0 ${active ? "text-white" : ""}`} />
                                    <span className="relative">{tab.label}</span>
                                    {tab.badge && (
                                        <span className="relative ml-0.5 text-[8px] font-black bg-rose-500/80 text-white px-1.5 py-px rounded-full leading-none">
                                            {tab.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Right side */}
                    <div className="flex items-center gap-2 shrink-0">


                        {/* Refresh */}
                        <button
                            onClick={handleRefresh}
                            className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/[0.05] transition-all"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 transition-transform duration-700 ${refreshing ? "rotate-[360deg]" : ""}`} />
                        </button>

                        {/* Notifications */}
                        {/* <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => setNotifOpen((p) => !p)}
                                className="relative p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/[0.05] transition-all"
                            >
                                <Bell className="w-3.5 h-3.5" />
                                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" />
                            </button>
                            <AnimatePresence>
                                {notifOpen && <NotifPanel onClose={() => setNotifOpen(false)} />}
                            </AnimatePresence>
                        </div> */}

                        {/* Divider */}
                        <div className="w-px h-5 bg-white/[0.07]" />

                        {/* User avatar */}
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/[0.04] transition-all cursor-pointer group">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-white/30 to-white/10 border border-white/15 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                                RB
                            </div>
                            <div className="hidden md:block">
                                <p className="text-[11px] font-medium text-white leading-none">Ripun</p>
                                <p className="text-[9px] text-white/30 mt-0.5">Super Admin</p>
                            </div>
                            <LogOut className="w-3 h-3 text-white/20 group-hover:text-white/50 transition-colors hidden md:block" />
                        </div>
                    </div>
                </header>

                {/* ══════════ SECONDARY BAR (breadcrumb + context) ══════════ */}
                <div className="shrink-0 h-[38px] flex items-center px-6 gap-2 bg-white/[0.01]">
                    <span className="text-[11px] text-white/20 font-medium">Cockpit Admin</span>
                    <ChevronRight className="w-3 h-3 text-white/10" />
                    {activeTabDef && (
                        <>
                            <activeTabDef.icon className="w-3 h-3 text-white/40" />
                            <span className="text-[11px] text-white/50 font-medium capitalize">{activeTab}</span>
                        </>
                    )}

                </div>

                {/* ══════════ CONTENT AREA ══════════ */}
                <main className="flex-1 min-h-0 overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="h-full"
                        >
                            {activeTab === "overview" && <OverviewTab />}
                            {activeTab === "users" && <UsersTab />}
                            {activeTab === "devices" && <DevicesTab />}
                            {activeTab === "logs" && <LogsTab />}
                            {activeTab === "settings" && <SettingsTab />}
                        </motion.div>
                    </AnimatePresence>
                </main>


            </div>
        </div>
    );
}
