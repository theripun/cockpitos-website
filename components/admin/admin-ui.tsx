"use client";

import React from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { statusPill } from "./admin-data";

/* ─── Bar ─── */

export function Bar({ value }: { value: number }) {
    const color = value > 80 ? "bg-red-400" : value > 60 ? "bg-amber-400" : "bg-blue-500";
    const text = value > 80 ? "text-red-400" : value > 60 ? "text-amber-400" : "text-zinc-500";
    return (
        <div className="flex items-center gap-2.5">
            <div className="flex-1 h-[3px] rounded-full bg-white/[0.06]">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    className={`h-full rounded-full ${color}`}
                />
            </div>
            <span className={`text-[11px] font-mono w-7 text-right ${text}`}>{value}%</span>
        </div>
    );
}

/* ─── Pill ─── */

export function Pill({ status }: { status: string }) {
    return (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md tracking-wide ${statusPill[status] ?? "text-zinc-500 bg-zinc-800/60"}`}>
            {status}
        </span>
    );
}

/* ─── SearchBar ─── */

export function SearchBar({ placeholder }: { placeholder: string }) {
    return (
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <input
                placeholder={placeholder}
                className="w-full bg-white/[0.03] rounded-xl py-2 pl-9 pr-4 text-[13px] text-white placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-500/10 transition-all"
            />
        </div>
    );
}

/* ─── StatCard ─── */

export function StatCard({ label, value, sub, icon: Icon, color }: {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ElementType;
    color: string;
}) {
    return (
        <motion.div whileHover={{ y: -2 }} className="rounded-2xl backdrop-blur-3xl p-5 space-y-3">
            {/* <div className={`w-8 h-8 rounded-full flex items-center justify-center ${color}`}>
                <Icon size={16} className="text-white" />
            </div> */}
            <div>
                <p className="text-2xl font-semibold text-white tracking-tight">{value}</p>
                {sub && <p className="text-[11px] text-white/60 mt-0.5">{sub}</p>}
            </div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-white">{label}</p>
        </motion.div>
    );
}

/* ─── Toggle ─── */

export function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
    return (
        <button
            onClick={onChange}
            className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 shrink-0 ${on ? "bg-blue-600" : "bg-white/10"}`}
        >
            <motion.div
                animate={{ x: on ? 20 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm"
            />
        </button>
    );
}
