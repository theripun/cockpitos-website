"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Server, Globe, Users, Bell, Lock, Zap, Edit2, LogOut,
    Palette, Key, Clock, FileText, Wrench, Mail,
    Webhook, Database, ShieldAlert, Trash2,
    CheckCheck, ChevronRight, Save, X,
} from "lucide-react";
import { Toggle } from "./admin-ui";

/* ── Section heading ── */
function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3 px-1">{children}</p>
    );
}

/* ── Setting row with toggle ── */
function ToggleRow({ icon: Icon, label, sub, value, onChange }: {
    icon: React.ElementType; label: string; sub: string; value: boolean; onChange: () => void;
}) {
    return (
        <div className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/[0.03] transition-colors">
            <Icon className="w-4 h-4 text-white/30 shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-[13px] text-white font-medium">{label}</p>
                <p className="text-[11px] text-white/40 mt-0.5">{sub}</p>
            </div>
            <Toggle on={value} onChange={onChange} />
        </div>
    );
}

/* ── Setting row with value + edit ── */
function ValueRow({ icon: Icon, label, value, onEdit }: {
    icon: React.ElementType; label: string; value: string; onEdit?: () => void;
}) {
    return (
        <div className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/[0.03] transition-colors group">
            <Icon className="w-4 h-4 text-white/30 shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-[11px] text-white/40">{label}</p>
                <p className="text-[13px] text-white font-medium truncate">{value}</p>
            </div>
            {onEdit && (
                <button
                    onClick={onEdit}
                    className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-white p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-all"
                >
                    <Edit2 className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}

/* ── Inline edit modal ── */
function EditModal({ label, value, onSave, onClose }: {
    label: string; value: string; onSave: (v: string) => void; onClose: () => void;
}) {
    const [val, setVal] = useState(value);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={onClose}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }} transition={{ duration: 0.18 }}
                onClick={(e) => e.stopPropagation()}
                className="relative z-10 w-full max-w-sm bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-4"
            >
                <div className="flex items-center justify-between">
                    <p className="text-[14px] font-semibold text-white">Edit {label}</p>
                    <button onClick={onClose} className="text-white/30 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <input
                    autoFocus
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2.5 px-4 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
                />
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2 rounded-xl text-[13px] text-white/50 bg-white/[0.04] hover:bg-white/[0.07] transition-all">Cancel</button>
                    <button onClick={() => { onSave(val); onClose(); }} className="flex-1 py-2 rounded-xl text-[13px] font-semibold text-black bg-white hover:bg-zinc-200 transition-all flex items-center justify-center gap-1.5">
                        <Save className="w-3.5 h-3.5" /> Save
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

/* ── Danger action row ── */
function DangerRow({ icon: Icon, label, sub, actionLabel, onAction }: {
    icon: React.ElementType; label: string; sub: string; actionLabel: string; onAction: () => void;
}) {
    const [done, setDone] = useState(false);
    function handle() {
        setDone(true);
        onAction();
        setTimeout(() => setDone(false), 2500);
    }
    return (
        <div className="flex items-center gap-4 px-4 py-4 rounded-xl border border-rose-500/10 bg-rose-500/[0.03] hover:bg-rose-500/[0.05] transition-colors">
            <Icon className="w-4 h-4 text-rose-400/60 shrink-0" />
            <div className="flex-1">
                <p className="text-[13px] font-medium text-white">{label}</p>
                <p className="text-[11px] text-white/40 mt-0.5">{sub}</p>
            </div>
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handle}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-medium transition-all shrink-0 ${done ? "bg-white/[0.06] text-white" : "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                    }`}
            >
                {done ? <CheckCheck className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                {done ? "Done" : actionLabel}
            </motion.button>
        </div>
    );
}

/* ── Settings Tab ── */
export function SettingsTab() {
    /* toggles */
    const [emailNotif, setEmailNotif] = useState(true);
    const [twoFactor, setTwoFactor] = useState(false);
    const [apiAccess, setApiAccess] = useState(true);
    const [auditLog, setAuditLog] = useState(true);
    const [maintenance, setMaintenance] = useState(false);
    const [webhookAlert, setWebhookAlert] = useState(false);
    const [darkTheme, setDarkTheme] = useState(true);

    /* editable fields */
    const [instanceName, setInstanceName] = useState("cockpit-prod-01");
    const [region, setRegion] = useState("Singapore (ap-se-1)");
    const [adminEmail, setAdminEmail] = useState("ripun@cockpit.io");
    const [smtpHost, setSmtpHost] = useState("smtp.sendgrid.net:587");
    const [sessionLimit, setSessionLimit] = useState("30 minutes");
    const [storageQuota, setStorageQuota] = useState("100 GB");

    /* edit modal */
    const [editing, setEditing] = useState<{ label: string; value: string; onSave: (v: string) => void } | null>(null);

    function edit(label: string, value: string, onSave: (v: string) => void) {
        setEditing({ label, value, onSave });
    }

    return (
        <>
            <div className="p-7 h-full flex flex-col gap-6">
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">

                        {/* ── General ── */}
                        <div className="bg-white/[0.03] border border-white/5 backdrop-blur-xl rounded-2xl p-5 space-y-1">
                            <SectionTitle>General</SectionTitle>
                            <ValueRow icon={Server} label="Instance Name" value={instanceName} onEdit={() => edit("Instance Name", instanceName, setInstanceName)} />
                            <ValueRow icon={Globe} label="Region" value={region} onEdit={() => edit("Region", region, setRegion)} />
                            <ValueRow icon={Users} label="Admin Email" value={adminEmail} onEdit={() => edit("Admin Email", adminEmail, setAdminEmail)} />
                            <ValueRow icon={Clock} label="Session Timeout" value={sessionLimit} onEdit={() => edit("Session Timeout", sessionLimit, setSessionLimit)} />
                            <ValueRow icon={Database} label="Storage Quota" value={storageQuota} onEdit={() => edit("Storage Quota", storageQuota, setStorageQuota)} />
                        </div>

                        {/* ── Appearance ── */}
                        <div className="bg-white/[0.03] border border-white/5 backdrop-blur-xl rounded-2xl p-5 space-y-1">
                            <SectionTitle>Appearance & Access</SectionTitle>
                            <ToggleRow icon={Palette} label="Dark Theme" sub="Use dark mode for admin UI" value={darkTheme} onChange={() => setDarkTheme((p) => !p)} />
                            <ToggleRow icon={Zap} label="API Access" sub="Enable REST API for integrations" value={apiAccess} onChange={() => setApiAccess((p) => !p)} />
                            <ToggleRow icon={Wrench} label="Maintenance Mode" sub="Block all user sessions temporarily" value={maintenance} onChange={() => setMaintenance((p) => !p)} />
                            <ValueRow icon={Key} label="API Key Prefix" value="sk-cockpit-••••••••••••" onEdit={() => { }} />
                        </div>

                        {/* ── Security & Notifications ── */}
                        <div className="bg-white/[0.03] border border-white/5 backdrop-blur-xl rounded-2xl p-5 space-y-1">
                            <SectionTitle>Security &amp; Notifications</SectionTitle>
                            <ToggleRow icon={Bell} label="Email Notifications" sub="Critical alerts sent to admin email" value={emailNotif} onChange={() => setEmailNotif((p) => !p)} />
                            <ToggleRow icon={Lock} label="Two-Factor Auth" sub="Require 2FA for all admin logins" value={twoFactor} onChange={() => setTwoFactor((p) => !p)} />
                            <ToggleRow icon={FileText} label="Audit Log" sub="Record all administrative actions" value={auditLog} onChange={() => setAuditLog((p) => !p)} />
                            <ToggleRow icon={Webhook} label="Webhook Alerts" sub="POST events to a configured endpoint" value={webhookAlert} onChange={() => setWebhookAlert((p) => !p)} />
                            <ValueRow icon={Mail} label="SMTP Host" value={smtpHost} onEdit={() => edit("SMTP Host", smtpHost, setSmtpHost)} />
                        </div>

                        {/* ── Danger Zone ── */}
                        <div className="bg-white/[0.02] border border-rose-500/10 backdrop-blur-xl rounded-2xl p-5 space-y-3">
                            <SectionTitle>Danger Zone</SectionTitle>
                            <DangerRow
                                icon={LogOut} label="Clear All Sessions"
                                sub="Log out all active users immediately"
                                actionLabel="Sign Out All"
                                onAction={() => { }}
                            />
                            <DangerRow
                                icon={Wrench} label="Reset Configuration"
                                sub="Restore all settings to factory defaults"
                                actionLabel="Reset Config"
                                onAction={() => { }}
                            />
                            <DangerRow
                                icon={ShieldAlert} label="Revoke All API Keys"
                                sub="Invalidate every API token immediately"
                                actionLabel="Revoke All"
                                onAction={() => { }}
                            />
                            <DangerRow
                                icon={Trash2} label="Purge Log Data"
                                sub="Permanently delete all event logs"
                                actionLabel="Purge Logs"
                                onAction={() => { }}
                            />
                        </div>

                    </div>
                </div>
            </div>

            {/* Edit modal */}
            <AnimatePresence>
                {editing && (
                    <EditModal
                        key="edit"
                        label={editing.label}
                        value={editing.value}
                        onSave={editing.onSave}
                        onClose={() => setEditing(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
