"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Plus, MoreVertical, ShieldCheck, ShieldOff,
    Trash2, Edit2, Lock, Users, UserCheck, UserX, Crown,
    Mail, Clock, Key, X, ChevronRight, Globe, Laptop,
    Shield, AlertTriangle, CheckCircle2, Activity, LogOut,
    Copy, RefreshCw, Eye, EyeOff, Smartphone, MonitorCheck,
    Filter, ChevronDown, Save, Server, Loader2,
} from "lucide-react";
import { StatCard } from "./admin-ui";
import { BASE_URL } from "@/lib/baseURL";

/* ─── Extended user type ─── */
interface User {
    id: string;
    name: string;
    username: string;
    email: string;
    isEmailVerified: boolean;
    role: string;
    status?: string;
    lastSeen?: string;
    avatar?: string;
    devices?: any[];
    [key: string]: any;
}

type FilterType = "all" | "active" | "admin" | "suspended";
const ROLE_CONFIG: Record<string, { icon: React.ElementType; pill: string; dot: string }> = {
    "Super Admin": { icon: Crown, pill: "bg-amber-400/10 text-amber-400 border border-amber-400/20", dot: "bg-amber-400" },
    "Admin": { icon: ShieldCheck, pill: "bg-blue-400/10  text-blue-400  border border-blue-400/20", dot: "bg-blue-400" },
    "Viewer": { icon: Users, pill: "bg-white/5      text-white/50  border border-white/10", dot: "bg-white/30" },
};

const STATUS_CONFIG: Record<string, { dot: string; text: string; badge: string }> = {
    active: { dot: "bg-emerald-400 shadow-[0_0_6px_#34d399]", text: "text-emerald-400", badge: "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20" },
    suspended: { dot: "bg-rose-500 shadow-[0_0_6px_#f43f5e]", text: "text-rose-400", badge: "bg-rose-500/10   text-rose-400    border border-rose-400/20" },
};

/* ─── Activity bar ─── */
function ActivityBar({ score }: { score: number }) {
    const color = score > 70 ? "bg-emerald-400" : score > 40 ? "bg-amber-400" : "bg-rose-400";
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${color}`}
                />
            </div>
            <span className={`text-[10px] font-mono w-6 text-right ${score > 70 ? "text-emerald-400" : score > 40 ? "text-amber-400" : "text-rose-400"}`}>
                {score}
            </span>
        </div>
    );
}

/* ─── Row action menu ─── */
function ActionMenu({ user, onClose, onViewProfile }: {
    user: User; onClose: () => void; onViewProfile: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.93, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 top-8 z-50 w-48 bg-zinc-950/98 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="p-1">
                {[
                    { icon: Eye, label: "View Profile", action: onViewProfile, color: "text-white" },
                    { icon: Edit2, label: "Edit User", action: onClose, color: "text-white" },
                    { icon: Lock, label: "Reset Password", action: onClose, color: "text-white" },
                    { icon: Key, label: "Manage API Keys", action: onClose, color: "text-white" },
                    { icon: ShieldOff, label: "Suspend", action: onClose, color: "text-amber-400" },
                    { icon: Trash2, label: "Delete User", action: onClose, color: "text-rose-400" },
                ].map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.label}
                            onClick={() => { item.action(); onClose(); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] font-medium hover:bg-white/[0.05] rounded-xl transition-colors ${item.color}`}
                        >
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            {item.label}
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
}

/* ─── User Detail Drawer ─── */
function UserDrawer({ user, onClose }: { user: User; onClose: () => void }) {
    const [showKey, setShowKey] = useState(false);
    const [copied, setCopied] = useState(false);
    const [editingRole, setEditingRole] = useState(false);
    const [role, setRole] = useState(user.role);

    const roleConf = ROLE_CONFIG[role] ?? ROLE_CONFIG["Viewer"];
    const statusConf = STATUS_CONFIG[user.status || "active"] ?? STATUS_CONFIG["active"];
    const RoleIcon = roleConf.icon;

    function copyKey() {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    }

    const activityTimeline = [
        { icon: CheckCircle2, label: "Authenticated", time: user.lastSeen, color: "text-emerald-400", bg: "bg-emerald-400/10" },
        { icon: Laptop, label: "New device added", time: "3d ago", color: "text-blue-400", bg: "bg-blue-400/10" },
        { icon: Key, label: "API key rotated", time: "1w ago", color: "text-amber-400", bg: "bg-amber-400/10" },
        { icon: LogOut, label: "Session ended", time: "2w ago", color: "text-white/30", bg: "bg-white/[0.04]" },
        { icon: Shield, label: "2FA enabled", time: "1mo ago", color: "text-blue-400", bg: "bg-blue-400/10" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Drawer panel */}
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 36 }}
                className="relative ml-auto w-full max-w-[420px] h-full bg-zinc-950 border-l border-white/8 flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0">
                    <p className="text-[13px] font-semibold text-white">User Profile</p>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.05] transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">

                    {/* Identity Block */}
                    <div className="px-6 py-6 space-y-4 border-b border-white/5">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/10 flex items-center justify-center text-[16px] font-bold text-white shrink-0">
                                {user.avatar || (user.name ? user.name[0].toUpperCase() : "U")}
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                                <p className="text-[16px] font-semibold text-white truncate">{user.name}</p>
                                <p className="text-[12px] text-white/40 truncate mt-0.5">{user.email}</p>
                                <div className="flex items-center gap-2 mt-2.5">
                                    {/* Status badge */}
                                    <span className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-lg ${statusConf.badge}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                                        {user.status || "active"}
                                    </span>
                                    {/* Role badge */}
                                    <button
                                        onClick={() => setEditingRole(true)}
                                        className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-lg hover:opacity-80 transition-opacity ${roleConf.pill}`}
                                    >
                                        <RoleIcon className="w-3 h-3" />
                                        {role}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Quick stats */}
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { label: "Devices", value: user.devices?.length ?? 0 },
                                { label: "Sessions", value: user.sessions ?? 0 },
                                { label: "Activity", value: `${user.activityScore ?? 0}%` },
                                { label: "Joined", value: user.joined ?? "—" },
                            ].map((s) => (
                                <div key={s.label} className="bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2.5 space-y-1 text-center">
                                    <p className="text-[14px] font-semibold text-white">{s.value}</p>
                                    <p className="text-[9px] text-white/30 uppercase tracking-widest">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Details */}
                    <div className="px-6 py-5 space-y-3 border-b border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1">Details</p>
                        {[
                            { icon: Mail, label: "Email", value: user.email },
                            { icon: Globe, label: "Location", value: user.location ?? "Unknown" },
                            { icon: Clock, label: "Last seen", value: user.lastSeen },
                            { icon: Shield, label: "2FA", value: user.twoFa ? "Enabled" : "Disabled", highlight: user.twoFa },
                        ].map((row) => {
                            const Icon = row.icon;
                            return (
                                <div key={row.label} className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.02] transition-colors">
                                    <Icon className="w-3.5 h-3.5 text-white/20 shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-white/30 mb-0.5">{row.label}</p>
                                        <p className={`text-[12px] font-medium truncate ${("highlight" in row && row.highlight) ? "text-emerald-400" : "text-white"}`}>
                                            {row.value}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Sessions */}
                    <div className="px-6 py-5 space-y-3 border-b border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1">Active Sessions</p>
                        {(user.sessions ?? 0) === 0 ? (
                            <p className="text-[12px] text-white/25 px-3">No active sessions</p>
                        ) : (
                            <div className="space-y-2">
                                {Array.from({ length: user.sessions ?? 0 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                                        {i === 0 ? <Laptop className="w-3.5 h-3.5 text-white/40 shrink-0" /> : <Smartphone className="w-3.5 h-3.5 text-white/40 shrink-0" />}
                                        <div className="flex-1">
                                            <p className="text-[12px] text-white font-medium">{i === 0 ? "Chrome / macOS" : "Safari / iOS"}</p>
                                            <p className="text-[10px] text-white/30">{user.location} · {i === 0 ? "Current" : "2h ago"}</p>
                                        </div>
                                        {i === 0 && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-400/10 text-emerald-400 font-semibold border border-emerald-400/20">
                                                Current
                                            </span>
                                        )}
                                        <button className="p-1 rounded-lg text-white/20 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* API Key */}
                    <div className="px-6 py-5 space-y-3 border-b border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1">API Access</p>
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                            <Key className="w-3.5 h-3.5 text-white/20 shrink-0" />
                            <span className="flex-1 text-[11px] font-mono text-white/50 truncate">
                                {showKey ? (user.apiKey ?? "—") : "sk-cockpit-••••••••"}
                            </span>
                            <button onClick={() => setShowKey((p) => !p)} className="p-1 rounded-md text-white/20 hover:text-white transition-colors">
                                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={copyKey} className="p-1 rounded-md text-white/20 hover:text-white transition-colors">
                                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button className="p-1 rounded-md text-white/20 hover:text-amber-400 transition-colors">
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Activity Timeline */}
                    <div className="px-6 py-5 space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1">Recent Activity</p>
                        <div className="relative pl-4">
                            <div className="absolute left-[7px] top-3 bottom-3 w-px bg-white/5" />
                            <div className="space-y-4">
                                {activityTimeline.map((ev, i) => {
                                    const Icon = ev.icon;
                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.06 }}
                                            className="flex items-start gap-3"
                                        >
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${ev.bg}`}>
                                                <Icon className={`w-3 h-3 ${ev.color}`} />
                                            </div>
                                            <div className="pt-0.5">
                                                <p className="text-[12px] text-white font-medium">{ev.label}</p>
                                                <p className="text-[10px] text-white/30 mt-0.5">{ev.time}</p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer actions */}
                <div className="border-t border-white/5 px-6 py-4 flex gap-2 shrink-0">
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/8 text-[13px] text-white/60 hover:text-white hover:bg-white/[0.08] transition-all">
                        <ShieldOff className="w-3.5 h-3.5" />
                        Suspend
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white text-black text-[13px] font-semibold hover:bg-zinc-200 transition-all">
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit User
                    </button>
                </div>
            </motion.div>

            {/* Role selector flyout */}
            <AnimatePresence>
                {editingRole && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center p-6"
                        onClick={() => setEditingRole(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.94, y: 8 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.94, y: 8 }}
                            transition={{ duration: 0.16 }}
                            className="bg-zinc-950 border border-white/10 rounded-2xl p-5 w-72 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <p className="text-[13px] font-semibold text-white mb-4">Change Role</p>
                            <div className="space-y-1.5">
                                {Object.entries(ROLE_CONFIG).map(([r, cfg]) => {
                                    const Icon = cfg.icon;
                                    return (
                                        <button
                                            key={r}
                                            onClick={() => { setRole(r); setEditingRole(false); }}
                                            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[13px] font-medium transition-all ${role === r ? "bg-white/[0.08] text-white" : "text-white/50 hover:bg-white/[0.04] hover:text-white"}`}
                                        >
                                            <Icon className="w-4 h-4 shrink-0" />
                                            {r}
                                            {role === r && <CheckCircle2 className="w-4 h-4 ml-auto text-emerald-400" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/* ─── Add User Modal ─── */
function AddUserModal({ onClose }: { onClose: () => void }) {
    const [form, setForm] = useState({ name: "", email: "", role: "Viewer", password: "" });
    const [step, setStep] = useState<"form" | "success">("form");

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setStep("success");
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            <motion.div
                initial={{ scale: 0.94, y: 12 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.94, y: 12 }}
                transition={{ duration: 0.18 }}
                className="relative z-10 w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <AnimatePresence mode="wait">
                    {step === "form" ? (
                        <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                                <div>
                                    <p className="text-[14px] font-semibold text-white">Invite User</p>
                                    <p className="text-[11px] text-white/30 mt-0.5">Add a new member to Cockpit</p>
                                </div>
                                <button onClick={onClose} className="p-1.5 text-white/30 hover:text-white rounded-lg hover:bg-white/[0.05] transition-all">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={submit} className="p-6 space-y-4">
                                {[
                                    { label: "Full Name", key: "name", type: "text", placeholder: "John Doe" },
                                    { label: "Email Address", key: "email", type: "email", placeholder: "john@cockpit.io" },
                                    { label: "Password", key: "password", type: "password", placeholder: "••••••••" },
                                ].map((f) => (
                                    <div key={f.key}>
                                        <label className="text-[11px] text-white/40 font-medium mb-1.5 block">{f.label}</label>
                                        <input
                                            type={f.type}
                                            placeholder={f.placeholder}
                                            value={form[f.key as keyof typeof form]}
                                            onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                                            required
                                            className="w-full bg-white/[0.04] border border-white/8 rounded-xl py-2.5 px-4 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/15 transition-all"
                                        />
                                    </div>
                                ))}

                                {/* Role picker */}
                                <div>
                                    <label className="text-[11px] text-white/40 font-medium mb-1.5 block">Role</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {Object.entries(ROLE_CONFIG).map(([r, cfg]) => {
                                            const Icon = cfg.icon;
                                            return (
                                                <button
                                                    type="button"
                                                    key={r}
                                                    onClick={() => setForm((p) => ({ ...p, role: r }))}
                                                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-[11px] font-medium transition-all ${form.role === r ? "bg-white/[0.08] border-white/15 text-white" : "bg-white/[0.02] border-white/5 text-white/40 hover:border-white/10 hover:text-white/60"}`}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    {r}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-2.5 rounded-xl bg-white text-black text-[13px] font-semibold hover:bg-zinc-100 transition-colors mt-1"
                                >
                                    Send Invite
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center px-8 py-14 gap-4"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
                                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                            </div>
                            <div className="text-center">
                                <p className="text-[16px] font-semibold text-white">Invite sent!</p>
                                <p className="text-[12px] text-white/40 mt-1.5">{form.email} will receive an invite email shortly.</p>
                            </div>
                            <button onClick={onClose} className="mt-2 px-6 py-2.5 rounded-xl bg-white text-black text-[13px] font-semibold hover:bg-zinc-100 transition-colors">
                                Close
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}

/* ─── Users Tab ─── */
export function UsersTab() {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FilterType>("all");
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showAddUser, setShowAddUser] = useState(false);
    const [sortBy, setSortBy] = useState<"name" | "role" | "lastSeen" | "activity">("name");

    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = React.useCallback(async () => {
        try {
            const res = await fetch(`${BASE_URL}/users/all`, { credentials: "include" });
            const data = await res.json();
            if (Array.isArray(data)) {
                setAllUsers(data);
            }
        } catch (e) {
            console.error("Failed to fetch users:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const filtered = allUsers
        .filter((u) => {
            const lq = search.toLowerCase();
            const matchSearch = (u.name || "").toLowerCase().includes(lq) || (u.email || "").toLowerCase().includes(lq);
            const matchFilter =
                filter === "all" ? true :
                    filter === "active" ? u.status === "active" :
                        filter === "admin" ? u.role === "Admin" || u.role === "Super Admin" :
                            filter === "suspended" ? u.status === "suspended" : true;
            return matchSearch && matchFilter;
        })
        .sort((a, b) => {
            if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
            if (sortBy === "role") return (a.role || "").localeCompare(b.role || "");
            if (sortBy === "activity") return (b.activityScore ?? 0) - (a.activityScore ?? 0);
            return 0;
        });

    const totalUsers = allUsers.length;
    const activeCount = allUsers.filter((u) => u.status === "active" || !u.status).length;
    const adminCount = allUsers.filter((u) => u.role === "Admin" || u.role === "Super Admin").length;
    const suspendCount = allUsers.filter((u) => u.status === "suspended").length;

    // Close menu on outside click
    useEffect(() => {
        const handler = () => setOpenMenu(null);
        document.addEventListener("click", handler);
        return () => document.removeEventListener("click", handler);
    }, []);

    return (
        <>
            <div className="p-6 flex flex-col gap-4 h-full">

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
                    <StatCard label="Total Users" value={totalUsers} sub="all accounts" icon={Users} color="bg-blue-600/70" />
                    <StatCard label="Active" value={activeCount} sub="currently online" icon={UserCheck} color="bg-blue-600/70" />
                    <StatCard label="Admins" value={adminCount} sub="elevated access" icon={Crown} color="bg-blue-600/70" />
                    <StatCard label="Suspended" value={suspendCount} sub="restricted access" icon={UserX} color="bg-blue-600/70" />
                </div>

                {/* ── Toolbar ── */}
                <div className="flex items-center gap-2.5 shrink-0">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search users…"
                            className="w-full bg-white/[0.04] border border-white/6 rounded-xl py-2 pl-9 pr-4 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all"
                        />
                    </div>

                    {/* Filter pills */}
                    <div className="flex gap-1 bg-white/[0.03] border border-white/6 p-1 rounded-xl shrink-0">
                        {(["all", "active", "admin", "suspended"] as FilterType[]).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium capitalize transition-all ${filter === f ? "bg-white/[0.09] text-white" : "text-white/35 hover:text-white"}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Sort */}
                    <div className="relative group">
                        <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/6 bg-white/[0.03] text-[12px] text-white/40 hover:text-white hover:bg-white/[0.06] transition-all shrink-0">
                            <Filter className="w-3.5 h-3.5" />
                            Sort
                        </button>
                        <div className="absolute right-0 top-10 z-30 hidden group-hover:block w-40 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1">
                            {(["name", "role", "activity", "lastSeen"] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setSortBy(s)}
                                    className={`w-full text-left px-3 py-2 text-[12px] rounded-lg capitalize transition-all ${sortBy === s ? "bg-white/[0.07] text-white" : "text-white/40 hover:bg-white/[0.04] hover:text-white"}`}
                                >
                                    {s === "lastSeen" ? "Last Seen" : s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Invite */}
                    <button
                        onClick={() => setShowAddUser(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-100 transition-colors text-[12px] font-semibold shrink-0"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Invite User
                    </button>
                </div>

                {/* ── Table ── */}
                <div className="border border-white/5 bg-white/[0.03] backdrop-blur-xl rounded-2xl overflow-hidden flex flex-col min-h-0 flex-1">

                    {/* Column headers */}
                    <div className="px-5 py-3 border-b border-white/5 grid grid-cols-[2fr_1.5fr_1fr_1fr_100px_44px] items-center shrink-0">
                        {["User", "Email Config", "Devices", "Role", "Status", ""].map((h) => (
                            <span key={h} className="text-[10px] font-semibold uppercase tracking-widest text-white/25">{h}</span>
                        ))}
                    </div>

                    {/* Rows */}
                    <div className="flex-1 overflow-y-auto divide-y divide-white/[0.025] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                        <AnimatePresence initial={false}>
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <Loader2 className="w-8 h-8 text-white/10 animate-spin" />
                                    <p className="text-[13px] text-white/25">Loading users...</p>
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <Users className="w-8 h-8 text-white/10" />
                                    <p className="text-[13px] text-white/25">No users match your search.</p>
                                </div>
                            ) : filtered.map((u, i) => {
                                const roleConf = ROLE_CONFIG[u.role] ?? ROLE_CONFIG["Viewer"];
                                const statusConf = STATUS_CONFIG[u.status || "active"] ?? STATUS_CONFIG["active"];
                                const RoleIcon = roleConf.icon;
                                const isOpen = openMenu === u.id;

                                return (
                                    <motion.div
                                        key={u.id}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ delay: i * 0.02 }}
                                        className="grid grid-cols-[2fr_1.5fr_1fr_1fr_100px_44px] items-center px-5 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                                        onClick={() => setSelectedUser(u)}
                                    >
                                        {/* User */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="relative shrink-0">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/15 to-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                                    {u.avatar || (u.name ? u.name[0] : "U")}
                                                </div>
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${statusConf.dot}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-semibold text-white truncate group-hover:text-white/90">{u.name || "Unknown User"}</p>
                                                <p className="text-[11px] text-white/40 truncate">@{u.username || "no-username"}</p>
                                            </div>
                                        </div>

                                        {/* Email Config / Working Email */}
                                        <div className="flex flex-col min-w-0 pr-4">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <Mail className="w-3.5 h-3.5 text-white/30 shrink-0" />
                                                <span className="text-[12px] text-white/80 truncate">{u.email}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 pl-5">
                                                {u.isEmailVerified ? (
                                                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                                                        <CheckCircle2 className="w-3 h-3" /> Working (Verified)
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                                                        <AlertTriangle className="w-3 h-3" /> Unverified
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Devices */}
                                        <div className="flex items-center gap-2">
                                            <Server className="w-4 h-4 text-white/30" />
                                            <span className="text-[12px] font-medium text-white/70">
                                                {u.devices?.length ?? 0} {u.devices?.length === 1 ? 'device' : 'devices'}
                                            </span>
                                        </div>

                                        {/* Role */}
                                        <div className="flex items-center gap-1.5">
                                            <RoleIcon className="w-3.5 h-3.5 shrink-0 text-white/30" />
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${roleConf.pill}`}>
                                                {u.role || "Viewer"}
                                            </span>
                                        </div>

                                        {/* Status */}
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg capitalize ${statusConf.badge}`}>
                                                {u.status || "active"}
                                            </span>
                                        </div>

                                        {/* Action menu */}
                                        <div className="relative flex justify-end" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => setOpenMenu(isOpen ? null : u.id)}
                                                className="p-1.5 rounded-lg text-white/20 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-white/[0.05] transition-all"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                            <AnimatePresence>
                                                {isOpen && (
                                                    <ActionMenu
                                                        user={u}
                                                        onClose={() => setOpenMenu(null)}
                                                        onViewProfile={() => { setSelectedUser(u); setOpenMenu(null); }}
                                                    />
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between shrink-0">
                        <span className="text-[11px] text-white/25">
                            {filtered.length} of {totalUsers} users
                        </span>
                        <div className="flex items-center gap-1">
                            {[
                                { icon: ShieldCheck, label: "Bulk promote" },
                                { icon: ShieldOff, label: "Bulk suspend" },
                                { icon: Trash2, label: "Bulk delete" },
                            ].map(({ icon: Icon, label }) => (
                                <button key={label} title={label} className="p-2 rounded-xl text-white/20 hover:text-white hover:bg-white/[0.05] transition-all">
                                    <Icon className="w-3.5 h-3.5" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Drawers & Modals */}
            <AnimatePresence>
                {selectedUser && <UserDrawer key="drawer" user={selectedUser} onClose={() => setSelectedUser(null)} />}
                {showAddUser && <AddUserModal key="add" onClose={() => setShowAddUser(false)} />}
            </AnimatePresence>
        </>
    );
}
