"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useDragControls, useMotionValue } from "framer-motion";
import {
    X,
    Maximize2,
    Search,
    BookOpen,
    MessageSquare,
    HelpCircle,
    ChevronDown,
    ExternalLink,
    Zap,
    Shield,
    Heart,
    MessageCircle,
    LifeBuoy,
    Terminal,
    Database,
    Cpu,
    Globe,
    Layers,
    Lock,
    Settings,
    ChevronRight,
    ArrowUpRight,
    Monitor,
    Info,
    FileText,
    Activity,
    Server,
    HardDrive,
    BadgeCheck
} from "lucide-react";
import { WINDOW_CONSTANTS } from "../window-constants";

interface HelpSupportProps {
    isOpen: boolean;
    onClose: () => void;
    onMinimize?: () => void;
}

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const INFO_SECTIONS = [
    {
        id: "Information",
        icon: Info,
        items: ["About Cockpit", "Build Details", "Specifications"]
    },
    {
        id: "Architecture",
        icon: Layers,
        items: ["Kernel Hub"]
    }
];

const SYSTEM_MANIFEST = {
    version: "2.4.0-LTS",
    build: "CK-449-ALPHA-RELEASE",
    kernel: "Cockpit-RT v4.12.8-stable",
    architecture: "x86_64 Distributed",
    updates: "Automatic (Manual Override Enabled)",
    security: "AES-256-GCM Hardware Encrypted"
};

export function Finder({ isOpen, onClose, onMinimize }: HelpSupportProps) {
    const [size, setSize] = useState({ width: 850, height: 580 });
    const [isMaximized, setIsMaximized] = useState(false);
    const [preMaximizeState, setPreMaximizeState] = useState<{
        size: { width: number; height: number };
        pos: { x: number; y: number };
    } | null>(null);

    const dragControls = useDragControls();
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const [isResizing, setIsResizing] = useState(false);
    const [activeSection, setActiveSection] = useState("About Cockpit");
    const [activeChapter, setActiveChapter] = useState("Information");
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedChapters, setExpandedChapters] = useState<string[]>(["Information", "Architecture", "Assistance"]);

    const toggleChapter = (id: string) => {
        setExpandedChapters(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    // Reset when opened
    useEffect(() => {
        if (!isOpen) return;
        setIsMaximized(false);
        setSize({ width: 850, height: 580 });
        x.set(0);
        y.set(-15);
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
                setSize({ width: 850, height: 580 });
                import("framer-motion").then(({ animate }) => {
                    animate(x, 0, springConfig);
                    animate(y, -15, springConfig);
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

    const handleResizeStart = (dir: ResizeDir) => (e: React.PointerEvent) => {
        if (isMaximized) return;
        e.preventDefault(); e.stopPropagation();
        const target = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);
        setIsResizing(true);
        const startX = e.clientX; const startY = e.clientY;
        const startW = size.width; const startH = size.height;
        const startMX = x.get(); const startMY = y.get();

        const onMove = (moveEvent: PointerEvent) => {
            const dx = moveEvent.clientX - startX; const dy = moveEvent.clientY - startY;
            let w = startW; let h = startH; let mx = startMX; let my = startMY;
            if (dir.includes("e")) w = startW + dx;
            if (dir.includes("s")) h = startH + dy;
            if (dir.includes("w")) { w = startW - dx; mx = startMX + dx; }
            if (dir.includes("n")) { h = startH - dy; my = startMY + dy; }
            setSize({ width: Math.max(750, w), height: Math.max(500, h) });
            x.set(mx); y.set(my);
        };
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
        <AnimatePresence mode="wait">
            {isOpen && (
                <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
                    <motion.div
                        drag={!isResizing && !isMaximized}
                        dragMomentum={false} dragListener={false}
                        dragControls={dragControls}
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 20 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        style={{ x, y, width: size.width, height: size.height }}
                        className={[
                            "pointer-events-auto bg-[#09090b] border border-white/5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden relative text-white selection:bg-zinc-500/30 selection:text-white",
                            isMaximized ? "rounded-none" : "rounded-2xl",
                            isResizing ? "select-none" : "",
                        ].join(" ")}
                    >
                        {/* Header */}
                        <div
                            className="shrink-0 h-14 flex items-center justify-between px-6 select-none relative bg-zinc-950/50 border-b border-white/5"
                            onPointerDown={(e) => dragControls.start(e)}
                            onDoubleClick={toggleMaximize}
                        >
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-1.5">
                                    <button onClick={onClose} className="w-3 h-3 rounded-full bg-[#FF5F57] group/btn flex items-center justify-center transition-all">
                                        <X className="w-2 h-2 opacity-0 group-hover/btn:opacity-100 text-black/50" />
                                    </button>
                                    <button onClick={onMinimize} className="w-3 h-3 rounded-full bg-[#FEBC2E] group/btn flex items-center justify-center transition-all">
                                        <div className="w-1 h-[1px] bg-black/50 opacity-0 group-hover/btn:opacity-100" />
                                    </button>
                                    <button onClick={toggleMaximize} className="w-3 h-3 rounded-full bg-[#28C840] group/btn flex items-center justify-center transition-all">
                                        <Maximize2 className="w-2 h-2 opacity-0 group-hover/btn:opacity-100 text-black/50" />
                                    </button>
                                </div>
                                <div className="h-4 w-px bg-white/5" />
                                <div className="flex items-center gap-2">
                                    <Info className="w-3.5 h-3.5 text-zinc-500" />
                                    <span className="text-[11px] font-medium text-zinc-400 tracking-wider">System Info</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="p-1 px-3 bg-zinc-500/10 border border-zinc-500/20 rounded-full">
                                    <h1 className="text-[9px] font-medium text-zinc-400 uppercase tracking-widest">{SYSTEM_MANIFEST.build}</h1>
                                </div>
                            </div>
                        </div>

                        {/* Main Layout */}
                        <div className="flex-1 flex min-h-0 bg-zinc-950">
                            {/* Sidebar - Tree Structure */}
                            <div className="w-56 border-r border-white/5 flex flex-col pt-8 pb-6 bg-[#0c0c0e]">
                                <div className="px-6 mb-6">
                                    <div className="relative group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 group-focus-within:text-zinc-400 transition-colors" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search Module..."
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-[11px] placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                {INFO_SECTIONS.map((section) => {
                                    const filteredItems = section.items.filter(item =>
                                        item.toLowerCase().includes(searchQuery.toLowerCase())
                                    );

                                    if (searchQuery && filteredItems.length === 0) return null;

                                    return (
                                        <div key={section.id} className="mb-2">
                                            <button
                                                onClick={() => toggleChapter(section.id)}
                                                className="w-full flex items-center gap-2 px-6 py-2 group hover:bg-white/[0.02] transition-all"
                                            >
                                                <ChevronRight className={`w-3 h-3 text-zinc-600 transition-transform duration-200 ${expandedChapters.includes(section.id) || searchQuery ? 'rotate-90' : ''}`} />
                                                <section.icon className="w-3.5 h-3.5 text-zinc-500" />
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">{section.id}</span>
                                            </button>

                                            <AnimatePresence initial={false}>
                                                {(expandedChapters.includes(section.id) || searchQuery) && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="mt-1 space-y-0.5 ml-8 pr-4">
                                                            {filteredItems.map((item) => (
                                                                <button
                                                                    key={item}
                                                                    onClick={() => {
                                                                        setActiveSection(item);
                                                                        setActiveChapter(section.id);
                                                                    }}
                                                                    className={`
                                                                            w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all group
                                                                            ${activeSection === item ? 'bg-white/[0.05] text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'}
                                                                        `}
                                                                >
                                                                    <FileText className={`w-3 h-3 ${activeSection === item ? 'text-zinc-400' : 'text-zinc-700 group-hover:text-zinc-500'}`} />
                                                                    <span>{item}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}

                                <div className="mt-auto px-6 pt-4 border-t border-white/5">
                                    <div className="p-3 bg-zinc-900/50 border border-white/5 rounded-2xl">
                                        <BadgeCheck className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-tight block text-center">Device Secured</span>
                                    </div>
                                </div>
                            </div>

                            {/* Content Pane */}
                            <div className="flex-1 overflow-y-auto no-scrollbar relative">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeSection}
                                        initial={{ opacity: 0, scale: 0.99, y: 4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.99, y: -4 }}
                                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                                        className="min-h-full"
                                    >
                                        {activeSection === "About Cockpit" && (
                                            <div className="p-12 space-y-12">
                                                <div className="flex items-center gap-10">
                                                    <div className="w-32 h-32 rounded-[30px] bg-gradient-to-br from-zinc-900 to-zinc-900 flex items-center justify-center relative group">
                                                        <div className="absolute inset-2 border-2 border-white/20 rounded-[30px] transition-all" />
                                                        <Layers className="w-14 h-14 text-white" />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <h1 className="text-4xl font-bold text-white">Cockpit OS</h1>
                                                        <p className="text-zinc-500 font-bold text-[14px]">The Cloud Operating Surface for Distant Worlds.</p>
                                                        <div className="flex items-center gap-4">
                                                            <div className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg">
                                                                <h1 className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">{SYSTEM_MANIFEST.version}</h1>
                                                            </div>
                                                            <div className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg">
                                                                <h1 className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">STABLE RELEASE</h1>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    {[
                                                        { label: "Kernel Version", value: SYSTEM_MANIFEST.kernel, icon: Terminal },
                                                        { label: "Architecture", value: SYSTEM_MANIFEST.architecture, icon: Cpu },
                                                        { label: "Encryption", value: "AES-256-GCM Hardware", icon: Lock },
                                                        { label: "Local Identity", value: "Node_04 (Verified)", icon: Server }
                                                    ].map((item, i) => (
                                                        <div key={i} className="p-5 bg-white/[0.02] border border-white/5 rounded-[24px] flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-500">
                                                                <item.icon className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-0.5">{item.label}</span>
                                                                <span className="text-[13px] font-bold text-white tracking-tight">{item.value}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="p-8 bg-zinc-900/40 border border-white/5 rounded-[32px]">
                                                    <p className="text-zinc-500 text-[12px] leading-loose font-medium">
                                                        Cockpit OS is a distributed micro-kernel platform designed for zero-latency cloud infrastructure management.
                                                        This environment is running as an authorized administrative node with full E2E encryption and global VPS synchronization.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {activeSection === "Build Details" && (
                                            <div className="p-12 space-y-10">
                                                <div>
                                                    <h2 className="text-2xl font-bold text-white">Software Manifest</h2>
                                                    <p className="text-zinc-500 text-[12px] mt-2 font-medium">Current build metadata and component versioning.</p>
                                                </div>

                                                <div className="border border-white/5 rounded-3xl overflow-hidden bg-zinc-950">
                                                    <table className="w-full text-left text-[12px]">
                                                        <thead>
                                                            <tr className="bg-white/[0.02] border-b border-white/5">
                                                                <th className="px-6 py-4 font-black uppercase text-[9px] text-zinc-500 tracking-widest">Component</th>
                                                                <th className="px-6 py-4 font-black uppercase text-[9px] text-zinc-500 tracking-widest">Identifier</th>
                                                                <th className="px-6 py-4 font-black uppercase text-[9px] text-zinc-500 tracking-widest">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/5">
                                                            {[
                                                                { name: "Cockpit UI", id: "v2.4.0-A", status: "Operational", color: "text-white" },
                                                                { name: "Cockpit Engine", id: "v1.12.4-RT", status: "Secure", color: "text-white" },
                                                                { name: "Distributed File System", id: "FS-X2", status: "Active", color: "text-white" },
                                                                { name: "Kernel Interface", id: "KR-88", status: "Locked", color: "text-white" },
                                                                { name: "Handshake Protocol", id: "AES-E2E", status: "Verified", color: "text-white" }
                                                            ].map((row, i) => (
                                                                <tr key={i} className="hover:bg-white/[0.01]">
                                                                    <td className="px-6 py-4 font-bold text-zinc-300">{row.name}</td>
                                                                    <td className="px-6 py-4 font-mono text-zinc-500">{row.id}</td>
                                                                    <td className={`px-6 py-4 ${row.color} font-black uppercase text-[9px] tracking-widest`}>{row.status}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {activeSection === "Kernel Hub" && (
                                            <div className="p-12 space-y-10">
                                                <div>
                                                    <h2 className="text-2xl font-bold text-white">Kernel Hub</h2>
                                                    <p className="text-zinc-500 text-[12px] mt-2 font-medium">Core system processes and distributed kernel status.</p>
                                                </div>

                                                <div className="grid grid-cols-3 gap-4">
                                                    {[
                                                        { label: "Memory Management", status: "98.2%", color: "text-white" },
                                                        { label: "Task Scheduling", status: "Optimal", color: "text-white" },
                                                        { label: "I/O Distribution", status: "Active", color: "text-white" }
                                                    ].map((item, i) => (
                                                        <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl relative overflow-hidden group">
                                                            <div className="absolute top-0 right-0 p-4">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                            </div>
                                                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-2">{item.label}</span>
                                                            <span className={`text-xl font-bold tracking-tight ${item.color}`}>{item.status}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="aspect-video w-full bg-zinc-900/40 border border-white/5 rounded-[40px] flex items-center justify-center relative overflow-hidden">
                                                    <div className="flex gap-4 items-end h-24">
                                                        {[...Array(12)].map((_, i) => (
                                                            <motion.div
                                                                key={i}
                                                                animate={{
                                                                    height: [20, 60, 15, 80, 20],
                                                                    opacity: [0.3, 0.8, 0.3]
                                                                }}
                                                                transition={{
                                                                    duration: 1.2 + i * 0.1,
                                                                    repeat: Infinity,
                                                                    ease: "easeInOut"
                                                                }}
                                                                className="w-2 bg-gradient-to-t from-zinc-800 to-zinc-400 rounded-full"
                                                            />
                                                        ))}
                                                    </div>
                                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                                                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">Real-time Visualization Active</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeSection === "Node Topography" && (
                                            <div className="p-12 h-full flex flex-col">
                                                <div className="mb-8">
                                                    <h2 className="text-2xl font-bold text-white">Node Topography</h2>
                                                    <p className="text-zinc-500 text-[12px] mt-2 font-medium">Visualization of distributed administrative nodes.</p>
                                                </div>

                                                <div className="flex-1 min-h-[400px] w-full bg-zinc-900/40 border border-white/5 rounded-[40px] relative overflow-hidden flex items-center justify-center">
                                                    {/* Scanning Effect */}
                                                    <motion.div
                                                        animate={{
                                                            scale: [1, 1.2, 1],
                                                            opacity: [0.05, 0.15, 0.05]
                                                        }}
                                                        transition={{ duration: 4, repeat: Infinity }}
                                                        className="absolute w-[500px] h-[500px] rounded-full border border-white/10"
                                                    />

                                                    {/* Center Hub */}
                                                    <div className="relative z-10">
                                                        <motion.div
                                                            animate={{
                                                                boxShadow: ["0 0 20px rgba(255,255,255,0.05)", "0 0 40px rgba(255,255,255,0.1)", "0 0 20px rgba(255,255,255,0.05)"]
                                                            }}
                                                            transition={{ duration: 2, repeat: Infinity }}
                                                            className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center relative border border-white/10"
                                                        >
                                                            <Globe className="w-8 h-8 text-white" />
                                                            {/* Ping rings */}
                                                            <motion.div
                                                                animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                                                                transition={{ duration: 2, repeat: Infinity }}
                                                                className="absolute inset-0 rounded-full border border-white/20"
                                                            />
                                                        </motion.div>
                                                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[9px] font-black text-white uppercase tracking-widest whitespace-nowrap opacity-50">Global Control Hub</span>
                                                    </div>

                                                    {/* Orbiting Nodes */}
                                                    {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                                                        <motion.div
                                                            key={i}
                                                            initial={{ rotate: angle }}
                                                            animate={{ rotate: angle + 360 }}
                                                            transition={{ duration: 30 + i * 5, repeat: Infinity, ease: "linear" }}
                                                            className="absolute w-full h-full flex items-center justify-center pointer-events-none"
                                                        >
                                                            <div className="w-[320px] h-px bg-white/5 relative">
                                                                <motion.div
                                                                    animate={{ rotate: -(angle + 360) }}
                                                                    transition={{ duration: 30 + i * 5, repeat: Infinity, ease: "linear" }}
                                                                    className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-center pointer-events-auto hover:border-zinc-500/50 transition-colors"
                                                                >
                                                                    <Database className="w-4 h-4 text-zinc-600" />
                                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-zinc-900 border border-white/5 rounded text-[8px] font-black text-zinc-500 whitespace-nowrap">NODE_{i + 1}</div>
                                                                </motion.div>
                                                            </div>
                                                        </motion.div>
                                                    ))}

                                                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                                                </div>

                                                <div className="mt-8 flex items-center justify-center gap-10">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-zinc-500" />
                                                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Master Node</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-zinc-800" />
                                                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Slave Nodes</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeSection === "Specifications" && (
                                            <div className="p-12 space-y-8">
                                                <h2 className="text-2xl font-bold text-white tracking-tight">Device Profile</h2>

                                                <div className="space-y-4">
                                                    {[
                                                        { label: "Hardware Node", value: "Cockpit-Workstation-G2", icon: HardDrive },
                                                        { label: "Display Adapter", value: "Virtual Glass Interface Engine", icon: Monitor },
                                                        { label: "Storage Engine", value: "Distributed Block Stream (2TB Cap)", icon: Database },
                                                        { label: "Memory Pool", value: "32GB High-Fidelity Swap", icon: Activity }
                                                    ].map((spec, i) => (
                                                        <div key={i} className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-3xl group hover:border-zinc-500/20 transition-all">
                                                            <div className="flex items-center gap-5">
                                                                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-600 group-hover:text-white group-hover:scale-110 transition-all">
                                                                    <spec.icon className="w-5 h-5" />
                                                                </div>
                                                                <span className="text-[13px] font-bold text-zinc-400">{spec.label}</span>
                                                            </div>
                                                            <span className="text-[13px] font-black text-white/80">{spec.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Resize Handles */}
                        {!isMaximized && (
                            <>
                                <div onPointerDown={handleResizeStart("n")} className="absolute top-0 left-2 right-2 h-1.5 cursor-n-resize" />
                                <div onPointerDown={handleResizeStart("s")} className="absolute bottom-0 left-2 right-2 h-1.5 cursor-s-resize" />
                                <div onPointerDown={handleResizeStart("w")} className="absolute left-0 top-2 bottom-2 w-1.5 cursor-w-resize" />
                                <div onPointerDown={handleResizeStart("e")} className="absolute right-0 top-2 bottom-2 w-1.5 cursor-e-resize" />
                                <div onPointerDown={handleResizeStart("nw")} className="absolute top-0 left-0 w-3.5 h-3.5 cursor-nw-resize" />
                                <div onPointerDown={handleResizeStart("ne")} className="absolute top-0 right-0 w-3.5 h-3.5 cursor-ne-resize" />
                                <div onPointerDown={handleResizeStart("sw")} className="absolute bottom-0 left-0 w-3.5 h-3.5 cursor-sw-resize" />
                                <div onPointerDown={handleResizeStart("se")} className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-se-resize" />
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
