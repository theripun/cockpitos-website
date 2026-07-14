"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useDragControls, useMotionValue } from "framer-motion";
import {
    X,
    Maximize2,
    Cloud,
    Shield,
    Clock,
    Star,
    Share2,
    Download,
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    Settings,
    HardDrive,
    Trash2,
    Users,
    File,
    Folder,
    MoreVertical,
    CheckCircle2,
    RefreshCw
} from "lucide-react";
import { WINDOW_CONSTANTS } from "../window-constants";

interface XCloudProps {
    isOpen: boolean;
    onClose: () => void;
    onMinimize?: () => void;
}

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const CLOUD_ITEMS = [
    { name: "Family Photos", type: "folder", size: "12.4 GB", status: "synced", date: "Jan 28, 2024" },
    { name: "Project Alpha", type: "folder", size: "4.2 GB", status: "syncing", date: "Today" },
    { name: "Backup_2024.dmg", type: "file", size: "8.1 GB", status: "synced", date: "Feb 1, 2024" },
    { name: "Work Documents", type: "folder", size: "512 MB", status: "synced", date: "Yesterday" },
    { name: "Trip Video.mp4", type: "file", size: "1.2 GB", status: "synced", date: "Jan 15, 2024" },
    { name: "Shared Resources", type: "folder", size: "2.5 GB", status: "synced", date: "Jan 10, 2024" },
];

export function XCloud({ isOpen, onClose, onMinimize }: XCloudProps) {
    const [size, setSize] = useState({ width: 900, height: 600 });
    const [isMaximized, setIsMaximized] = useState(false);
    const [preMaximizeState, setPreMaximizeState] = useState<{
        size: { width: number; height: number };
        pos: { x: number; y: number };
    } | null>(null);

    const dragControls = useDragControls();
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const [isResizing, setIsResizing] = useState(false);
    const [activeSection, setActiveSection] = useState("Drive");

    // Reset when opened
    useEffect(() => {
        if (!isOpen) return;
        setIsMaximized(false);
        setSize({ width: 900, height: 600 });
        x.set(0);
        y.set(-15); // Centered accounting for dock space
    }, [isOpen, x, y]);

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
                setSize({ width: 900, height: 600 });
                import("framer-motion").then(({ animate }) => {
                    animate(x, 0, springConfig);
                    animate(y, -15, springConfig); // Maintain slight top offset
                });
            }
            setIsMaximized(false);
            return;
        }

        setPreMaximizeState({ size, pos: { x: x.get(), y: y.get() } });
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

    const handleDragEnd = () => {
        if (isMaximized) return;
        const currentY = y.get();
        const windowTop = (window.innerHeight - size.height) / 2 + currentY;
        if (windowTop < 40) toggleMaximize();
    };

    const handleResizeStart = (dir: ResizeDir) => (e: React.PointerEvent) => {
        if (isMaximized) return;
        e.preventDefault();
        e.stopPropagation();
        const target = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);
        setIsResizing(true);

        const startX = e.clientX;
        const startY = e.clientY;
        const startW = size.width;
        const startH = size.height;
        const startMX = x.get();
        const startMY = y.get();

        const applyAction = (moveEvent: PointerEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;

            let w = startW;
            let h = startH;
            let mx = startMX;
            let my = startMY;

            if (dir.includes("e")) w = startW + dx;
            if (dir.includes("s")) h = startH + dy;
            if (dir.includes("w")) { w = startW - dx; mx = startMX + dx; }
            if (dir.includes("n")) { h = startH - dy; my = startMY + dy; }

            setSize({ width: Math.max(700, w), height: Math.max(450, h) });
            x.set(mx);
            y.set(my);
        };

        const onMove = (ev: PointerEvent) => applyAction(ev);
        const onUp = (ev: PointerEvent) => {
            try { target.releasePointerCapture(ev.pointerId); } catch { }
            setIsResizing(false);
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
                    <motion.div
                        drag={!isResizing && !isMaximized}
                        dragMomentum={false}
                        dragListener={false}
                        dragControls={dragControls}
                        onDragEnd={handleDragEnd}
                        initial={{ opacity: 0, scale: 0.9, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 50 }}
                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                        style={{ x, y, width: size.width, height: size.height }}
                        className={[
                            "pointer-events-auto bg-zinc-950 border border-white/10 flex flex-col overflow-hidden relative backdrop-blur-3xl text-white shadow-3xl",
                            isMaximized ? "rounded-none" : "rounded-3xl",
                            isResizing ? "select-none" : "",
                        ].join(" ")}
                    >
                        {/* Header Area */}
                        <div
                            className="shrink-0 h-16 border-b border-white/5 flex items-center px-6 select-none bg-zinc-900/40"
                            onPointerDown={(e) => dragControls.start(e)}
                            onDoubleClick={toggleMaximize}
                        >
                            <div className="flex items-center gap-2 w-1/4">
                                <button onClick={onClose} className="w-3.5 h-3.5 rounded-full bg-[#FF5F57] group/btn flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
                                    <X className="w-2.5 h-2.5 opacity-0 group-hover/btn:opacity-100 text-black/40" />
                                </button>
                                <button onClick={onMinimize} className="w-3.5 h-3.5 rounded-full bg-[#FEBC2E] group/btn flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
                                    <div className="w-2 h-[1.5px] bg-black/40 opacity-0 group-hover/btn:opacity-100" />
                                </button>
                                <button onClick={toggleMaximize} className="w-3.5 h-3.5 rounded-full bg-[#28C840] group/btn flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
                                    <Maximize2 className="w-2 h-2 opacity-0 group-hover/btn:opacity-100 text-black/40" />
                                </button>
                            </div>

                            <div className="flex-1 flex justify-center items-center gap-3">
                                <div className="p-1.5 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
                                    <Cloud className="w-5 h-5 text-white" />
                                </div>
                                <h1 className="text-[17px] font-bold tracking-tight">xCloud Drive</h1>
                            </div>

                            <div className="w-1/4 flex justify-end items-center gap-4">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-xl border border-white/5 w-48 shadow-inner group">
                                    <Search className="w-4 h-4 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search files"
                                        className="bg-transparent border-none outline-none text-[13px] w-full text-white placeholder:text-zinc-600"
                                    />
                                </div>
                                <button className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 border border-white/5 transition-all">
                                    <Settings className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Main Body */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* Sidebar */}
                            <div className="w-64 border-r border-white/5 flex flex-col py-6 px-4 bg-zinc-950/50 shrink-0">
                                <div className="space-y-6">
                                    <div className="space-y-1">
                                        {[
                                            { icon: HardDrive, label: "Drive", color: "text-blue-500" },
                                            { icon: Clock, label: "Recent", color: "text-purple-500" },
                                            { icon: Star, label: "Starred", color: "text-yellow-500" },
                                            { icon: Share2, label: "Shared", color: "text-emerald-500" },
                                            { icon: Trash2, label: "Trash", color: "text-red-500" },
                                        ].map((item) => (
                                            <button
                                                key={item.label}
                                                onClick={() => setActiveSection(item.label)}
                                                className={`
                                                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] transition-all
                                                    ${activeSection === item.label
                                                        ? "bg-blue-600 text-white font-medium shadow-lg shadow-blue-600/20"
                                                        : "text-zinc-400 hover:bg-white/5"}
                                                `}
                                            >
                                                <item.icon className={`w-4.5 h-4.5 ${activeSection === item.label ? "text-white" : item.color}`} />
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="pt-4 border-t border-white/5">
                                        <div className="flex items-center justify-between mb-3 px-2">
                                            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Storage</span>
                                            <span className="text-[11px] font-medium text-zinc-400">75% used</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden mb-3">
                                            <motion.div
                                                className="h-full bg-blue-500"
                                                initial={{ width: 0 }}
                                                animate={{ width: "75%" }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                            />
                                        </div>
                                        <p className="text-[11px] text-zinc-500 leading-relaxed px-1">
                                            1.5 TB of 2 TB used. Need more? <button className="text-blue-500 hover:underline">Upgrade</button>
                                        </p>
                                    </div>

                                    <div className="pt-2">
                                        <button className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black rounded-xl font-bold text-[14px] hover:bg-zinc-200 transition-all active:scale-95">
                                            <Plus className="w-4.5 h-4.5" />
                                            Upload New
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-auto p-4 bg-zinc-900/30 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Shield className="w-5 h-5 text-emerald-500" />
                                        <span className="text-[13px] font-bold text-zinc-200">Security Check</span>
                                    </div>
                                    <p className="text-[11px] text-zinc-500">Your files are protected with end-to-end encryption.</p>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden relative">
                                <div className="h-12 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10">
                                    <div className="flex items-center gap-4">
                                        <button className="text-zinc-400 hover:text-white transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                                        <button className="text-zinc-400 hover:text-white transition-colors"><ChevronRight className="w-5 h-5" /></button>
                                        <span className="text-[14px] font-semibold text-zinc-200 ml-2">{activeSection}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 rounded-full border border-green-500/20">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                            <span className="text-[11px] font-medium text-green-500">Sync Complete</span>
                                        </div>
                                        <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-500"><RefreshCw className="w-4 h-4" /></button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {CLOUD_ITEMS.map((item, i) => (
                                            <motion.div
                                                key={i}
                                                whileHover={{ y: -5 }}
                                                className="group p-5 bg-zinc-900/30 hover:bg-zinc-900/60 rounded-2xl border border-white/5 transition-all cursor-default"
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className={`p-3 rounded-xl ${item.type === 'folder' ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-800 text-zinc-400'}`}>
                                                        {item.type === 'folder' ? <Folder className="w-6 h-6" fill="currentColor" fillOpacity={0.2} /> : <File className="w-6 h-6" />}
                                                    </div>
                                                    <button className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-white/5 rounded-lg text-zinc-500 transition-all">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-[15px] font-bold text-zinc-200 truncate">{item.name}</h3>
                                                    <div className="flex items-center gap-2 text-[12px] text-zinc-500">
                                                        <span>{item.type === 'folder' ? 'Folder' : item.size}</span>
                                                        <span>•</span>
                                                        <span>{item.date}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        {item.status === 'synced' ? (
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                                                        ) : (
                                                            <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                                                        )}
                                                        <span className="text-[11px] font-medium text-blue-500/80 capitalize">{item.status}</span>
                                                    </div>
                                                    <button className="p-2 hover:bg-blue-500/10 rounded-lg text-zinc-500 hover:text-blue-500 transition-all">
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Floating Action Bar */}
                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-zinc-800/80 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl flex items-center gap-6">
                                    <button className="flex items-center gap-2 text-[13px] font-bold text-white hover:text-blue-400 transition-colors">
                                        <Plus className="w-4 h-4" /> New Folder
                                    </button>
                                    <div className="w-px h-4 bg-white/10" />
                                    <button className="flex items-center gap-2 text-[13px] font-bold text-white hover:text-blue-400 transition-colors">
                                        <Users className="w-4 h-4" /> Shared Link
                                    </button>
                                    <div className="w-px h-4 bg-white/10" />
                                    <button className="flex items-center gap-2 text-[13px] font-bold text-white hover:text-blue-400 transition-colors">
                                        <Trash2 className="w-4 h-4" /> Trash
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Resize handles */}
                        {!isMaximized && (
                            <>
                                <div onPointerDown={handleResizeStart("n")} className="absolute top-0 left-2 right-2 h-1.5 cursor-n-resize" />
                                <div onPointerDown={handleResizeStart("s")} className="absolute bottom-0 left-2 right-2 h-1.5 cursor-n-resize" />
                                <div onPointerDown={handleResizeStart("w")} className="absolute left-0 top-2 bottom-2 w-1.5 cursor-w-resize" />
                                <div onPointerDown={handleResizeStart("e")} className="absolute right-0 top-2 bottom-2 w-1.5 cursor-e-resize" />
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
