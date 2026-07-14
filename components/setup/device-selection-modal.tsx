"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Monitor, Plus, ChevronRight, Wrench, X, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Vps {
    id: string;
    name: string;
    host: string;
    username: string;
    status?: string;
}

interface DeviceSelectionModalProps {
    devices: Vps[];
    onSelect: (device: Vps) => void;
    onConfigureNew: () => void;
}

const REPAIR_STEPS = [
    {
        id: 'step1',
        step: '1',
        title: 'Stop & disable the service',
        code: 'sudo systemctl stop cocktail\nsudo systemctl disable cocktail',
    },
    {
        id: 'step2',
        step: '2',
        title: 'Remove the service file',
        code: 'sudo rm -f /etc/systemd/system/cocktail.service\nsudo systemctl daemon-reload\nsudo systemctl reset-failed',
    },
    {
        id: 'step3',
        step: '3',
        title: 'Delete the agent files',
        code: 'sudo rm -rf /opt/cocktail',
    },
    {
        id: 'step4',
        step: '4',
        title: 'Delete the config directory',
        code: 'sudo rm -rf /etc/cocktail',
    },
    {
        id: 'step5',
        step: '5',
        title: "Verify it's fully removed",
        code: 'systemctl status cocktail\nls /opt/cocktail',
    },
];

export function DeviceSelectionModal({ devices, onSelect, onConfigureNew }: DeviceSelectionModalProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [showRepairModal, setShowRepairModal] = useState(false);
    const [copiedBlock, setCopiedBlock] = useState<string | null>(null);

    const copyBlock = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedBlock(id);
        setTimeout(() => setCopiedBlock(null), 2000);
    };

    // Keep `devices=true` in the query without dropping localized paths like `/in`.
    useEffect(() => {
        if (typeof window === "undefined" || !pathname) return;
        const sp = new URLSearchParams(window.location.search);
        if (sp.get("devices") === "true") return;
        sp.set("devices", "true");
        const qs = sp.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, [pathname, router]);

    return (
        <>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-[480px] bg-black/30 border border-white/5 backdrop-blur-2xl rounded-[32px] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.5)] flex flex-col"
            >
                <div className="mb-6 flex flex-col gap-2">
                    <h1 className="text-[24px] font-semibold text-white tracking-tight">Select Device</h1>
                    <p className="text-white/60 text-[15px]">Choose a device to continue or configure a new one.</p>
                </div>

                <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {devices.filter(d => d.status !== 'failed' && d.status !== 'enrolling').map((device) => (
                        <button
                            key={device.id}
                            onClick={() => onSelect(device)}
                            className="group w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-between transition-all duration-200 text-left cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-zinc-500/10 flex items-center justify-center group-hover:bg-zinc-500/20 transition-colors">
                                    <Monitor className="w-5 h-5 text-white group-hover:text-white transition-colors" />
                                </div>
                                <div>
                                    <div className="text-white font-medium text-[15px]">{device.name}</div>
                                    <div className="text-white/40 text-[13px] font-mono">{device.host}</div>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/60 transition-colors group-hover:translate-x-0.5" />
                        </button>
                    ))}
                </div>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/5"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-black/40 px-2 text-white/40 backdrop-blur-xl">Or</span>
                    </div>
                </div>

                <button
                    onClick={onConfigureNew}
                    className="w-full h-13 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 bg-white/5 text-white hover:bg-white/10"
                >
                    <Plus className="w-5 h-5 opacity-70" />
                    Configure New PC
                </button>

                {/* Repair VPS link */}
                <div className="mt-5 flex justify-center">
                    <button
                        onClick={() => setShowRepairModal(true)}
                        className="text-[12px] text-white/25 hover:text-white/50 underline underline-offset-2 decoration-white/15 hover:decoration-white/35 transition-all flex items-center gap-1.5"
                    >
                        <Wrench className="w-3 h-3" />
                        Repair VPS
                    </button>
                </div>
            </motion.div>

            {/* Repair VPS Modal */}
            <AnimatePresence>
                {showRepairModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/10 backdrop-blur-sm"
                        onClick={() => setShowRepairModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg bg-white text-black rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                                        <Wrench className="w-4 h-4 text-gray-700" />
                                    </div>
                                    <div>
                                        <h3 className="text-[15px] font-bold text-black tracking-tight">Repair VPS Manually</h3>
                                        <p className="text-[11px] text-gray-400 mt-0.5">SSH into your VPS and run these commands</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowRepairModal(false)}
                                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-3.5 h-3.5 text-gray-500" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
                                <p className="text-[13px] text-gray-500 leading-relaxed">
                                    If your VPS is unreachable or has broken services from a previous installation, SSH into it from your own terminal and run the commands below to fully remove the Cocktail agent.
                                </p>

                                {REPAIR_STEPS.map(({ id, step, title, code }) => (
                                    <div key={id} className="group">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="w-5 h-5 rounded-full bg-gray-100 text-[10px] font-black text-gray-500 flex items-center justify-center shrink-0">{step}</span>
                                            <span className="text-[12px] font-semibold text-gray-700">{title}</span>
                                        </div>
                                        <div className="relative">
                                            <pre className="bg-gray-950 text-gray-100 text-[11.5px] font-mono rounded-xl px-4 py-3.5 leading-relaxed overflow-x-auto whitespace-pre">{code}</pre>
                                            <button
                                                onClick={() => copyBlock(id, code)}
                                                className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                                title="Copy"
                                            >
                                                {copiedBlock === id
                                                    ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                    : <Copy className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" />}
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                                    <p className="text-[11.5px] text-gray-500 leading-relaxed">
                                        <span className="font-semibold text-gray-700">After cleanup:</span> the device will go offline in Cockpit since it stops heartbeating. You can then delete it from the Cockpit system interface.
                                    </p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-8 py-5 border-t border-gray-100">
                                <button
                                    onClick={() => setShowRepairModal(false)}
                                    className="w-full py-2.5 bg-black text-white rounded-xl text-[13px] font-semibold hover:bg-black/80 transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
