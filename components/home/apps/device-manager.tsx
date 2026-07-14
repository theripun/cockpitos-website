"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useDragControls, useMotionValue } from "framer-motion";
import {
    Server,
    Trash2,
    X,
    Maximize2,
    RefreshCw,
    Wifi,
    Cpu,
    Globe,
    Shield,
    AlertTriangle,
    CheckCircle2,
    Clock,
    HardDrive,
    Loader2,
    Minus,
    MoreHorizontal,
} from "lucide-react";
import { BASE_URL } from "@/lib/baseURL";
import { cn } from "@/lib/utils";
import { WINDOW_CONSTANTS } from "../window-constants";
import { AppHorizontalAdRibbon } from "@/components/ads";

interface DeviceManagerProps {
    isOpen: boolean;
    onClose: () => void;
    onMinimize?: () => void;
}

interface DeviceItem {
    device: {
        id: string;
        name: string;
        status: string;
        lastSeenAt: string | null;
        enrolledAt: string | null;
        os: string | null;
        arch: string | null;
        hostname: string | null;
        lastIp: string | null;
        agentVersion: string | null;
        createdAt: string;
    };
    vps: {
        id: string;
        name: string;
        host: string;
        username: string;
    } | null;
}

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

function timeAgo(dateStr: string | null): string {
    if (!dateStr) return "Never";
    const diff = Date.now() - new Date(dateStr).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function isOnline(lastSeenAt: string | null): boolean {
    if (!lastSeenAt) return false;
    return Date.now() - new Date(lastSeenAt).getTime() <= 35_000;
}

function statusLabel(device: DeviceItem["device"]): {
    label: string;
    color: string;
    dot: string;
    pill: string;
} {
    if (device.status === "enrolling")
        return {
            label: "Enrolling",
            color: "text-[#ff9f0a]",
            dot: "bg-[#ff9f0a]",
            pill: "bg-[#ff9f0a]/12",
        };
    if (device.status === "disabled")
        return {
            label: "Disabled",
            color: "text-white/35",
            dot: "bg-white/35",
            pill: "bg-white/[0.06]",
        };
    if (isOnline(device.lastSeenAt))
        return {
            label: "Online",
            color: "text-[#30d158]",
            dot: "bg-[#30d158]",
            pill: "bg-[#30d158]/14",
        };
    return {
        label: "Offline",
        color: "text-[#ff453a]",
        dot: "bg-[#ff453a]",
        pill: "bg-[#ff453a]/12",
    };
}

export function DeviceManager({ isOpen, onClose, onMinimize }: DeviceManagerProps) {
    const [size, setSize] = useState({ width: 780, height: 540 });
    const [isMaximized, setIsMaximized] = useState(false);
    const [preMaximizeState, setPreMaximizeState] = useState<{
        size: { width: number; height: number };
        pos: { x: number; y: number };
    } | null>(null);

    const dragControls = useDragControls();
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const [isResizing, setIsResizing] = useState(false);

    const [devices, setDevices] = useState<DeviceItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState<DeviceItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Success toast
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Portal mount target
    const [portalMounted, setPortalMounted] = useState(false);
    useEffect(() => { setPortalMounted(true); }, []);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    };

    const fetchDevices = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${BASE_URL}/cockpit/cocktail/devices`, {
                credentials: "include",
            });
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();
            setDevices(data || []);
        } catch (e: any) {
            setError(e.message || "Failed to load devices");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) fetchDevices();
    }, [isOpen, fetchDevices]);

    useEffect(() => {
        if (!isOpen) return;
        x.set(0);
        y.set(0);
        setSize({ width: 780, height: 540 });
        setIsMaximized(false);
    }, [isOpen]);

    // Cleanup toast on unmount
    useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

    const openDeleteModal = (item: DeviceItem) => {
        setDeleteError(null);
        setDeleteTarget(item);
    };

    const closeDeleteModal = () => {
        if (isDeleting) return;
        setDeleteTarget(null);
        setDeleteError(null);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        setDeleteError(null);

        const deletedId = deleteTarget.device.id;
        const deletedName = deleteTarget.device.name || deleteTarget.vps?.name || "Device";

        try {
            const res = await fetch(
                `${BASE_URL}/cockpit/cocktail/devices/${deletedId}`,
                { method: "DELETE", credentials: "include" }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || `Delete failed (${res.status})`);
            }

            // Close modal first
            setDeleteTarget(null);
            setDeleteError(null);

            // Optimistically remove from list with animation
            setDevices(prev => prev.filter(d => d.device.id !== deletedId));

            // Show success toast
            showToast(`"${deletedName}" deleted successfully`, "success");

            // Fresh fetch after a short delay to confirm server state
            setTimeout(() => fetchDevices(), 800);

        } catch (e: any) {
            setDeleteError(e.message || "Delete failed. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleMaximize = () => {
        const springConfig = { type: "spring" as const, stiffness: 400, damping: 30 };

        if (isMaximized) {
            if (preMaximizeState) {
                setSize(preMaximizeState.size);
                import("framer-motion").then(({ animate }) => {
                    animate(x, preMaximizeState.pos.x, springConfig);
                    animate(y, preMaximizeState.pos.y, springConfig);
                });
            } else {
                setSize({ width: 780, height: 540 });
                import("framer-motion").then(({ animate }) => {
                    animate(x, 0, springConfig);
                    animate(y, 0, springConfig);
                });
            }
            setIsMaximized(false);
            return;
        }

        setPreMaximizeState({ size: { width: size.width, height: size.height }, pos: { x: x.get(), y: y.get() } });

        const { MENU_HEIGHT, DOCK_HEIGHT, HORIZONTAL_PADDING } = WINDOW_CONSTANTS;
        const availableW = window.innerWidth - HORIZONTAL_PADDING * 2;
        const availableH = window.innerHeight - MENU_HEIGHT - DOCK_HEIGHT;

        setSize({ width: availableW, height: availableH });

        const targetY = MENU_HEIGHT - window.innerHeight / 2 + availableH / 2;
        import("framer-motion").then(({ animate }) => {
            animate(x, 0, springConfig);
            animate(y, targetY, springConfig);
        });

        setIsMaximized(true);
    };

    const handleResizeStart = (e: React.PointerEvent, dir: ResizeDir) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        const startX = e.clientX;
        const startY = e.clientY;
        const startW = size.width;
        const startH = size.height;
        const startPosX = x.get();
        const startPosY = y.get();

        const onMove = (ev: PointerEvent) => {
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;
            let newW = startW;
            let newH = startH;
            let newX = startPosX;
            let newY = startPosY;
            if (dir.includes("e")) newW = Math.max(600, startW + dx);
            if (dir.includes("s")) newH = Math.max(400, startH + dy);
            if (dir.includes("w")) { newW = Math.max(600, startW - dx); newX = startPosX + dx; }
            if (dir.includes("n")) { newH = Math.max(400, startH - dy); newY = startPosY + dy; }
            setSize({ width: newW, height: newH });
            x.set(newX);
            y.set(newY);
        };

        const onUp = () => {
            setIsResizing(false);
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
    };

    if (!isOpen) return null;

    const resizeDirs: ResizeDir[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
    const resizeStyles: Record<ResizeDir, React.CSSProperties> = {
        n: { top: 0, left: 8, right: 8, height: 8, cursor: "n-resize" },
        s: { bottom: 0, left: 8, right: 8, height: 8, cursor: "s-resize" },
        e: { right: 0, top: 8, bottom: 8, width: 8, cursor: "e-resize" },
        w: { left: 0, top: 8, bottom: 8, width: 8, cursor: "w-resize" },
        ne: { top: 0, right: 0, width: 16, height: 16, cursor: "ne-resize" },
        nw: { top: 0, left: 0, width: 16, height: 16, cursor: "nw-resize" },
        se: { bottom: 0, right: 0, width: 16, height: 16, cursor: "se-resize" },
        sw: { bottom: 0, left: 0, width: 16, height: 16, cursor: "sw-resize" },
    };

    const modalContent = (
        <>
            {/* Delete Confirm Modal — rendered via portal to escape pointer-events-none layers */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div
                        key="delete-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-6 backdrop-blur-[24px] backdrop-saturate-150"
                        onClick={closeDeleteModal}
                    >
                        <motion.div
                            key="delete-card"
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 8 }}
                            transition={{ type: "spring", stiffness: 420, damping: 34 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-[400px] overflow-hidden rounded-[14px] bg-black/95 shadow-[0_25px_80px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.1]"
                        >
                            <div className="border-b border-white/[0.08] px-5 pt-5 pb-4">
                                <div className="flex gap-4">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#ff453a]/14">
                                        <AlertTriangle className="h-5 w-5 text-[#ff6961]" strokeWidth={1.75} />
                                    </div>
                                    <div className="min-w-0 pt-0.5">
                                        <h3 className="text-[17px] font-semibold leading-snug tracking-[-0.02em] text-white">
                                            Delete This Device?
                                        </h3>
                                        <p className="mt-1.5 text-[13px] leading-relaxed text-white/45">
                                            This will permanently remove{" "}
                                            <span className="font-medium text-white/85">
                                                {deleteTarget.device.name || deleteTarget.vps?.name || "this device"}
                                            </span>
                                            . This can&apos;t be undone.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-b border-white/[0.08] bg-white/[0.03] px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] bg-white/[0.06]">
                                        <Server className="h-[18px] w-[18px] text-white/35" strokeWidth={1.5} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[15px] font-medium tracking-[-0.01em] text-white/92">
                                            {deleteTarget.device.hostname || deleteTarget.device.name || "Unknown"}
                                        </p>
                                        <p className="mt-0.5 text-[12px] text-white/35">
                                            {deleteTarget.vps?.host || deleteTarget.device.lastIp || "No IP recorded"}
                                        </p>
                                    </div>
                                    {(() => {
                                        const s = statusLabel(deleteTarget.device);
                                        return (
                                            <div
                                                className={cn(
                                                    "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1",
                                                    s.pill
                                                )}
                                            >
                                                <div className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
                                                <span className={cn("text-[11px] font-medium", s.color)}>{s.label}</span>
                                            </div>
                                        );
                                    })()}
                                </div>
                                <ul className="mt-4 space-y-2 border-t border-white/[0.08] pt-4">
                                    {["All metrics history", "Pending and running tasks", "Agent credentials", "File cache"].map(w => (
                                        <li key={w} className="flex items-center gap-2 text-[12px] text-white/40">
                                            <span className="h-1 w-1 shrink-0 rounded-full bg-white/25" />
                                            {w}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <AnimatePresence>
                                {deleteError && (
                                    <motion.div
                                        key="delete-err"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="flex items-start gap-2 border-b border-[#ff453a]/15 bg-[#ff453a]/08 px-5 py-3">
                                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff6961]" strokeWidth={2} />
                                            <p className="text-[12px] font-medium leading-snug text-[#ff9f94]">{deleteError}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex gap-2 p-4">
                                <button
                                    type="button"
                                    onClick={closeDeleteModal}
                                    disabled={isDeleting}
                                    className="flex-1 rounded-[10px] bg-white/[0.1] py-2.5 text-[13px] font-semibold text-white/92 transition-colors hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteConfirm}
                                    disabled={isDeleting}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-[#ff453a] py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#ff3b30] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                                            Deleting…
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4" strokeWidth={2} />
                                            Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Success / Error Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        key="toast"
                        initial={{ opacity: 0, y: 16, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        className={cn(
                            "fixed bottom-24 left-1/2 z-[10000] flex max-w-[min(90vw,360px)] -translate-x-1/2 items-center gap-2.5 rounded-[12px] border border-white/[0.08] bg-black/90 px-4 py-3 shadow-[0_12px_48px_rgba(0,0,0,0.75)] backdrop-blur-xl backdrop-saturate-150",
                            toast.type === "success"
                                ? "ring-1 ring-[#30d158]/30"
                                : "ring-1 ring-[#ff453a]/28"
                        )}
                    >
                        {toast.type === "success" ? (
                            <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-[#30d158]" strokeWidth={2} />
                        ) : (
                            <AlertTriangle className="h-[18px] w-[18px] shrink-0 text-[#ff6961]" strokeWidth={2} />
                        )}
                        <span
                            className={cn(
                                "text-[13px] font-medium leading-snug tracking-[-0.01em]",
                                toast.type === "success" ? "text-[#8ef4a8]" : "text-[#ffb4ab]"
                            )}
                        >
                            {toast.message}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );

    return (
        <>
            <motion.div
                drag={!isResizing && !isMaximized}
                dragControls={dragControls}
                dragMomentum={false}
                dragListener={false}
                style={{ x, y, width: size.width, height: size.height, touchAction: "none" }}
                className="absolute flex select-none flex-col overflow-hidden rounded-[12px] border border-white/[0.1] bg-black shadow-[0_24px_80px_rgba(0,0,0,0.85)] pointer-events-auto ring-1 ring-white/[0.06]"
            >
                {/* Resize handles */}
                {!isMaximized && resizeDirs.map(dir => (
                    <div
                        key={dir}
                        className="absolute z-50"
                        style={resizeStyles[dir]}
                        onPointerDown={e => handleResizeStart(e, dir)}
                    />
                ))}

                {/* Title bar — macOS-style traffic lights + centered title */}
                <div
                    className="grid h-[52px] shrink-0 cursor-default grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-white/[0.08] bg-black/85 px-4 backdrop-blur-2xl"
                    onPointerDown={e => { if (!isMaximized) dragControls.start(e); }}
                    onDoubleClick={toggleMaximize}
                >
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="group flex h-3 w-3 items-center justify-center rounded-full bg-[#ff5f57] transition-transform hover:scale-105"
                        >
                            <X className="h-2 w-2 text-[#460000]/0 transition-colors group-hover:text-[#460000]/90" strokeWidth={3} />
                        </button>
                        <button
                            type="button"
                            onClick={onMinimize}
                            aria-label="Minimize"
                            className="group flex h-3 w-3 items-center justify-center rounded-full bg-[#febc2e] transition-transform hover:scale-105"
                        >
                            <Minus className="h-2 w-2 text-[#460000]/0 transition-colors group-hover:text-[#460000]/90" strokeWidth={3} />
                        </button>
                        <button
                            type="button"
                            onClick={toggleMaximize}
                            aria-label="Zoom"
                            className="group flex h-3 w-3 items-center justify-center rounded-full bg-[#28c840] transition-transform hover:scale-105"
                        >
                            <Maximize2 className="h-1.5 w-1.5 text-[#003200]/0 transition-colors group-hover:text-[#003200]/90" strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className="pointer-events-none flex items-center justify-center">
                        <span className="text-[13px] font-semibold tracking-[-0.02em] text-white/88">
                            Device Manager
                        </span>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={fetchDevices}
                            disabled={loading}
                            title="Refresh"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-white/45 transition-colors hover:bg-white/[0.12] hover:text-white/85 disabled:opacity-50"
                        >
                            <RefreshCw className={cn("h-[15px] w-[15px]", loading && "animate-spin")} strokeWidth={2} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-black">
                    {/* Large title + summary — iOS Settings–style hierarchy */}
                    <div className="shrink-0 px-5 pb-2 pt-5">
                        <h1 className="text-[28px] font-bold leading-[1.15] tracking-[-0.03em] text-white">
                            Devices
                        </h1>
                        <p className="mt-1 text-[15px] leading-snug text-white/40">
                            {loading
                                ? "Updating list…"
                                : devices.length === 0
                                  ? "No devices connected"
                                  : `${devices.length} registered · ${devices.filter(d => isOnline(d.device.lastSeenAt) && d.device.status !== "enrolling" && d.device.status !== "disabled").length} online`}
                        </p>
                    </div>

                    <div className="shrink-0 border-b border-white/[0.08] bg-black px-5 py-2.5">
                        <AppHorizontalAdRibbon />
                    </div>

                    {/* Content — inset grouped list */}
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-4">
                        <AnimatePresence mode="popLayout">
                            {loading && (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex h-52 flex-col items-center justify-center gap-4"
                                >
                                    <Loader2 className="h-9 w-9 animate-spin text-white/25" strokeWidth={1.5} />
                                    <p className="text-[15px] text-white/35">Loading devices…</p>
                                </motion.div>
                            )}

                            {!loading && error && (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex h-52 flex-col items-center justify-center gap-4 rounded-[12px] bg-[#0a0a0a] px-6 ring-1 ring-white/[0.08]"
                                >
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ff453a]/12">
                                        <AlertTriangle className="h-7 w-7 text-[#ff6961]" strokeWidth={1.5} />
                                    </div>
                                    <p className="text-center text-[15px] font-medium text-[#ff9f94]">{error}</p>
                                    <button
                                        type="button"
                                        onClick={fetchDevices}
                                        className="rounded-full bg-[#0a84ff] px-5 py-2 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
                                    >
                                        Try Again
                                    </button>
                                </motion.div>
                            )}

                            {!loading && !error && devices.length === 0 && (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center gap-3 rounded-[12px] bg-[#0a0a0a] py-14 ring-1 ring-white/[0.08]"
                                >
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.08]">
                                        <Server className="h-8 w-8 text-white/25" strokeWidth={1.25} />
                                    </div>
                                    <p className="text-[17px] font-semibold tracking-[-0.02em] text-white/75">No Devices</p>
                                    <p className="max-w-[260px] text-center text-[13px] leading-relaxed text-white/35">
                                        When you connect a VPS, it will show up in this list.
                                    </p>
                                </motion.div>
                            )}

                            {!loading && !error && devices.length > 0 && (
                                <motion.div
                                    key="device-group"
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="overflow-hidden rounded-[12px] bg-[#0a0a0a] ring-1 ring-white/[0.1]"
                                >
                                    {devices.map((item, index) => {
                                        const { label, color, dot, pill } = statusLabel(item.device);
                                        const online =
                                            isOnline(item.device.lastSeenAt) &&
                                            item.device.status !== "enrolling" &&
                                            item.device.status !== "disabled";

                                        return (
                                            <motion.div
                                                key={item.device.id}
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className={cn(
                                                    "group relative border-white/[0.08] transition-colors hover:bg-white/[0.06]",
                                                    index !== 0 && "border-t"
                                                )}
                                            >
                                                <div className="flex items-start gap-3.5 px-4 py-3.5">
                                                    <div
                                                        className={cn(
                                                            "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px]",
                                                            online
                                                                ? "bg-[#0a84ff]/18 text-[#64b5ff]"
                                                                : "bg-white/[0.08] text-white/35"
                                                        )}
                                                    >
                                                        <Server className="h-[22px] w-[22px]" strokeWidth={1.35} />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2 gap-y-1">
                                                            <span className="truncate text-[17px] font-semibold tracking-[-0.02em] text-white">
                                                                {item.device.name || item.vps?.name || "Unnamed Device"}
                                                            </span>
                                                            <div
                                                                className={cn(
                                                                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5",
                                                                    pill
                                                                )}
                                                            >
                                                                <span className={cn("h-1.5 w-1.5 rounded-full", dot, online ? "animate-pulse" : "")} />
                                                                <span className={cn("text-[11px] font-semibold", color)}>
                                                                    {label}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="mt-2 flex flex-col gap-1.5">
                                                            {item.device.hostname ? (
                                                                <div className="flex items-center gap-2 text-[13px] text-white/40">
                                                                    <HardDrive className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.5} />
                                                                    <span className="truncate">{item.device.hostname}</span>
                                                                </div>
                                                            ) : null}
                                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-white/32">
                                                                {item.vps?.host ? (
                                                                    <span className="inline-flex items-center gap-1.5">
                                                                        <Globe className="h-3 w-3 opacity-70" strokeWidth={1.5} />
                                                                        {item.vps.host}
                                                                    </span>
                                                                ) : null}
                                                                {item.device.lastIp ? (
                                                                    <span className="inline-flex items-center gap-1.5">
                                                                        <Wifi className="h-3 w-3 opacity-70" strokeWidth={1.5} />
                                                                        {item.device.lastIp}
                                                                    </span>
                                                                ) : null}
                                                                {item.device.os ? (
                                                                    <span className="inline-flex items-center gap-1.5">
                                                                        <Cpu className="h-3 w-3 opacity-70" strokeWidth={1.5} />
                                                                        {item.device.os} {item.device.arch || ""}
                                                                    </span>
                                                                ) : null}
                                                                <span className="inline-flex items-center gap-1.5">
                                                                    <Clock className="h-3 w-3 opacity-70" strokeWidth={1.5} />
                                                                    {item.device.lastSeenAt
                                                                        ? timeAgo(item.device.lastSeenAt)
                                                                        : "Never seen"}
                                                                </span>
                                                                {item.device.agentVersion ? (
                                                                    <span className="inline-flex items-center gap-1.5">
                                                                        <Shield className="h-3 w-3 opacity-70" strokeWidth={1.5} />
                                                                        v{item.device.agentVersion}
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </div>

                                                        {item.vps ? (
                                                            <div className="mt-3 flex items-center gap-2 border-t border-white/[0.08] pt-3 text-[12px] text-white/30">
                                                                <MoreHorizontal className="h-3.5 w-3.5 shrink-0 opacity-50" />
                                                                <span className="font-medium text-white/45">{item.vps.name}</span>
                                                                <span className="text-white/20">·</span>
                                                                <span className="truncate">
                                                                    {item.vps.username}@{item.vps.host}
                                                                </span>
                                                            </div>
                                                        ) : null}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            openDeleteModal(item);
                                                        }}
                                                        title="Remove device"
                                                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-transparent text-[#ff6961] opacity-100 transition-all hover:bg-[#ff453a]/12 md:opacity-0 md:group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>

            {/* Portal: modal + toast rendered at document.body to escape all parent z-index/pointer-events constraints */}
            {portalMounted && createPortal(modalContent, document.body)}
        </>
    );
}
