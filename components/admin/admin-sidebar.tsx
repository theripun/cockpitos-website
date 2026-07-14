"use client";

import React from "react";
import { motion } from "framer-motion";
import { BarChart3, Users, Server, ScrollText, Settings, LogOut } from "lucide-react";
import { Tab } from "./admin-data";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "devices", label: "Devices", icon: Server },
    { id: "logs", label: "Logs", icon: ScrollText },
    { id: "settings", label: "Settings", icon: Settings },
];

interface AdminSidebarProps {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
    return (
        <aside className="w-56 shrink-0 flex flex-col">
            {/* Brand */}
            <div className="px-5 pt-6 pb-5">
                <div className="flex items-center gap-3 pr-4">
                    <img
                        src="/logo/cockpit.svg"
                        alt="Cockpit Logo"
                        className="w-[25px] h-[25px] transition-opacity"
                    />
                    <span className="font-semibold text-white tracking-tight">Cockpit Admin</span>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-2 py-2 space-y-0.5">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all group ${active
                                ? "text-white"
                                : "text-white/50 hover:text-white hover:bg-white/[0.03]"
                                }`}
                        >
                            {active && (
                                <motion.div
                                    layoutId="nav-bg"
                                    className="absolute inset-0 rounded-xl bg-white/[0.07]"
                                    transition={{ type: "spring", stiffness: 480, damping: 36 }}
                                />
                            )}
                            <Icon
                                className={`relative w-4 h-4 shrink-0 ${active ? "text-white" : "text-white/60 group-hover:text-white"
                                    }`}
                            />
                            <span className="relative">{tab.label}</span>
                            {tab.id === "logs" && (
                                <span className="relative ml-auto text-[9px] font-black bg-red-800/60 text-white px-1.5 py-0.5 rounded-full">
                                    2
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* User */}
            <div className="px-2 pb-5 pt-2">
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer group">
                    <div className="w-6 h-6 rounded-full bg-white flex text-black items-center justify-center text-[9px] font-bold shrink-0">
                        RB
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-white truncate">Ripun Basumatary</p>
                        <p className="text-[10px] text-zinc-700 truncate">Super Admin</p>
                    </div>
                    <LogOut className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-400 transition-colors shrink-0" />
                </div>
            </div>
        </aside>
    );
}

export { TABS };
