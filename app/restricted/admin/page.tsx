"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, RefreshCw, BarChart3, ChevronRight } from "lucide-react";
import NextImage from "next/image";

import { type Tab } from "@/components/admin/admin-data";
import { AdminSidebar, TABS } from "@/components/admin/admin-sidebar";
import { OverviewTab } from "@/components/admin/overview-tab";
import { UsersTab } from "@/components/admin/users-tab";
import { DevicesTab } from "@/components/admin/devices-tab";
import { LogsTab } from "@/components/admin/logs-tab";
import { SettingsTab } from "@/components/admin/settings-tab";

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<Tab>("users");
    const ActiveIcon = TABS.find((t) => t.id === activeTab)?.icon ?? BarChart3;
    const [notifOpen, setNotifOpen] = useState(false);

    return (
        <div className="relative min-h-screen bg-black w-full text-white font-sans overflow-hidden">

            {/* Background */}
            <div className="fixed inset-0 z-0">
                <NextImage
                    src="/wallpaper/11.jpg"
                    alt="background"
                    fill
                    priority
                    className="object-cover"
                    style={{ filter: "blur(40px)", transform: "scale(1.1)" }}
                />
                <div className="absolute inset-0 bg-black/55" />
            </div>

            {/* App shell */}
            <div className="relative z-10 flex h-screen">

                {/* Sidebar */}
                <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

                {/* Main content */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                    {/* ── Header ── */}
                    <header className="shrink-0 px-6 py-4 flex items-center gap-3 border-b border-white/[0.04]">
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 text-[12px]">
                            <span className="text-white/30 font-medium">Cockpit Admin</span>
                            <ChevronRight className="w-3 h-3 text-white/15" />
                            <div className="flex items-center gap-1.5 text-white font-semibold">
                                <ActiveIcon className="w-3.5 h-3.5" />
                                <span className="capitalize">{activeTab}</span>
                            </div>
                        </div>

                        {/* Live pill */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] text-white/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                            Live
                        </div>

                        {/* Actions */}
                        <div className="ml-auto flex items-center gap-1">
                            {/* Notifications */}
                            <div className="relative">
                                <button
                                    onClick={() => setNotifOpen((p) => !p)}
                                    className="relative p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.05] transition-all"
                                >
                                    <Bell className="w-4 h-4" />
                                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
                                </button>
                                <AnimatePresence>
                                    {notifOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.94, y: -4 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.94, y: -4 }}
                                            transition={{ duration: 0.12 }}
                                            className="absolute right-0 top-11 z-50 w-72 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                                        >
                                            <div className="px-4 py-3 border-b border-white/5">
                                                <p className="text-[12px] font-semibold text-white">Notifications</p>
                                            </div>
                                            <div className="divide-y divide-white/[0.04]">
                                                {[
                                                    { title: "High CPU on vps-uk-01", sub: "91% usage · 2m ago", dot: "bg-rose-400" },
                                                    { title: "Disk threshold on vps-in-01", sub: "89% disk · 8m ago", dot: "bg-amber-400" },
                                                    { title: "'carlos' account suspended", sub: "Admin action · 1d ago", dot: "bg-white/20" },
                                                ].map((n, i) => (
                                                    <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer">
                                                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.dot}`} />
                                                        <div>
                                                            <p className="text-[12px] text-white font-medium">{n.title}</p>
                                                            <p className="text-[10px] text-white/30 mt-0.5">{n.sub}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="px-4 py-2.5 border-t border-white/5">
                                                <button className="text-[11px] text-white/30 hover:text-white transition-colors">
                                                    Mark all as read
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <button className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.05] transition-all">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </header>

                    {/* ── Tab content ── */}
                    <div className="flex-1 overflow-hidden min-h-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.16, ease: "easeOut" }}
                                className="h-full"
                            >
                                {activeTab === "overview" && <OverviewTab />}
                                {activeTab === "users" && <UsersTab />}
                                {activeTab === "devices" && <DevicesTab />}
                                {activeTab === "logs" && <LogsTab />}
                                {activeTab === "settings" && <SettingsTab />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
