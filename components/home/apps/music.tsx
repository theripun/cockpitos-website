"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useDragControls, useMotionValue } from "framer-motion";
import {
    Music as MusicIcon,
    X,
    Maximize2,
    Play,
    SkipBack,
    SkipForward,
    Volume2,
    Repeat,
    Shuffle,
    ListMusic,
    Mic2,
    Search,
    LayoutGrid,
    Heart,
    MoreHorizontal,
    Disc,
    Radio,
    User,
    Library,
    Clock,
    Plus,
    Volume1,
    Pause
} from "lucide-react";
import { WINDOW_CONSTANTS } from "../window-constants";
import { GlassInterface } from "@/components/common/glass-interface";
import Image from "next/image";

interface MusicAppProps {
    isOpen: boolean;
    onClose: () => void;
    onMinimize?: () => void;
}

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const SIDEBAR_ITEMS = [
    {
        section: "Reglook Music", items: [
            { icon: Play, label: "Listen Now", active: true },
            { icon: LayoutGrid, label: "Browse" },
            { icon: Radio, label: "Radio" },
        ]
    },
    {
        section: "Library", items: [
            { icon: Clock, label: "Recently Added" },
            { icon: User, label: "Artists" },
            { icon: Disc, label: "Albums" },
            { icon: MusicIcon, label: "Songs" },
        ]
    },
    {
        section: "Playlists", items: [
            { icon: ListMusic, label: "Top Hits 2024" },
            { icon: ListMusic, label: "Chill Vibes" },
            { icon: ListMusic, label: "Workout Mix" },
        ]
    }
];

const ALBUMS = [
    { title: "After Hours", artist: "The Weeknd", cover: "/music/after-hours.jpg", color: "bg-red-500" },
    { title: "Midnights", artist: "Taylor Swift", cover: "/music/midnights.jpg", color: "bg-blue-800" },
    { title: "SOS", artist: "SZA", cover: "/music/sos.jpg", color: "bg-blue-500" },
    { title: "Harry's House", artist: "Harry Styles", cover: "/music/harrys-house.jpg", color: "bg-amber-300" },
    { title: "Renaissance", artist: "Beyoncé", cover: "/music/renaissance.jpg", color: "bg-zinc-800" },
    { title: "Un Verano Sin Ti", artist: "Bad Bunny", cover: "/music/un-verano.jpg", color: "bg-orange-400" },
    { title: "Planet Her", artist: "Doja Cat", cover: "/music/planet-her.jpg", color: "bg-pink-400" },
    { title: "Future Nostalgia", artist: "Dua Lipa", cover: "/music/future.jpg", color: "bg-purple-600" },
];

export function MusicApp({ isOpen, onClose, onMinimize }: MusicAppProps) {
    const [size, setSize] = useState({ width: 1000, height: 680 });
    const [isMaximized, setIsMaximized] = useState(false);
    const [preMaximizeState, setPreMaximizeState] = useState<{
        size: { width: number; height: number };
        pos: { x: number; y: number };
    } | null>(null);

    const dragControls = useDragControls();
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const [isResizing, setIsResizing] = useState(false);
    const [activeTab, setActiveTab] = useState("Listen Now");
    const [isPlaying, setIsPlaying] = useState(true);
    const [volume, setVolume] = useState(80);

    // Initial positioning
    useEffect(() => {
        if (isOpen) {
            setSize({ width: 1000, height: 680 });
            x.set(0);
            y.set(-20);
            setIsMaximized(false);
        }
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
                setSize({ width: 1000, height: 680 });
                import("framer-motion").then(({ animate }) => {
                    animate(x, 0, springConfig);
                    animate(y, -20, springConfig);
                });
            }
            setIsMaximized(false);
        } else {
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
        }
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

        const MIN_W = 750;
        const MIN_H = 500;

        let raf = 0;
        const apply = (ev: PointerEvent) => {
            raf = 0;
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;
            let w = startW;
            let h = startH;
            let mx = startMX;
            let my = startMY;

            if (dir.includes("e")) w = startW + dx;
            if (dir.includes("s")) h = startH + dy;
            if (dir.includes("w")) { w = startW - dx; mx = startMX + dx; }
            if (dir.includes("n")) { h = startH - dy; my = startMY + dy; }

            if (w < MIN_W) { if (dir.includes("w")) mx -= MIN_W - w; w = MIN_W; }
            if (h < MIN_H) { if (dir.includes("n")) my -= MIN_H - h; h = MIN_H; }

            setSize({ width: w, height: h });
            x.set(mx);
            y.set(my);
        };
        const onMove = (ev: PointerEvent) => { if (!raf) raf = requestAnimationFrame(() => apply(ev)); };
        const onUp = (ev: PointerEvent) => {
            try { target.releasePointerCapture(ev.pointerId); } catch { }
            setIsResizing(false);
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            if (raf) cancelAnimationFrame(raf);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    drag={!isResizing && !isMaximized}
                    dragMomentum={false}
                    dragListener={false}
                    dragControls={dragControls}
                    onDragEnd={handleDragEnd}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    style={{ x, y, width: size.width, height: size.height }}
                    className={[
                        "pointer-events-auto bg-[#1e1e1e]/95 border border-white/10 shadow-3xl flex flex-col overflow-hidden relative font-sans backdrop-blur-2xl",
                        isMaximized ? "rounded-xl" : "rounded-[14px]",
                        isResizing ? "select-none" : "",
                    ].join(" ")}
                >
                    {/* Main Container */}
                    <div className="flex flex-1 overflow-hidden">

                        {/* Sidebar */}
                        <div className="w-[260px] shrink-0 bg-[#282828]/50 border-r border-white/5 flex flex-col pt-10 pb-4 px-4 overflow-y-auto no-scrollbar"
                            onPointerDown={(e) => dragControls.start(e)}
                            onDoubleClick={toggleMaximize}
                        >
                            <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
                                <button onClick={onClose} className="w-3 h-3 rounded-full bg-[#FF5F57] group/btn flex items-center justify-center hover:scale-110 transition-transform">
                                    <X className="w-1.5 h-1.5 text-black/40 opacity-0 group-hover/btn:opacity-100" />
                                </button>
                                <button onClick={onMinimize} className="w-3 h-3 rounded-full bg-[#FEBC2E] group/btn flex items-center justify-center hover:scale-110 transition-transform">
                                    <div className="w-1.5 h-[1.5px] bg-black/40 opacity-0 group-hover/btn:opacity-100" />
                                </button>
                                <button onClick={toggleMaximize} className="w-3 h-3 rounded-full bg-[#28C840] group/btn flex items-center justify-center hover:scale-110 transition-transform">
                                    <Maximize2 className="w-1.5 h-1.5 text-black/40 opacity-0 group-hover/btn:opacity-100" />
                                </button>
                            </div>

                            <div className="space-y-6 mt-4">
                                <div className="px-2">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1.5 w-4 h-4 text-zinc-500" />
                                        <input
                                            placeholder="Search"
                                            className="w-full bg-[#1c1c1c] border border-white/5 rounded-[6px] py-1 pl-9 pr-3 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
                                        />
                                    </div>
                                </div>

                                {SIDEBAR_ITEMS.map((section, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <h3 className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">{section.section}</h3>
                                        <div className="space-y-0.5">
                                            {section.items.map((item, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setActiveTab(item.label)}
                                                    className={`
                                                        w-full flex items-center gap-3 px-3 py-1.5 rounded-[6px] text-sm font-medium transition-colors
                                                        ${activeTab === item.label
                                                            ? "bg-rose-500 text-white shadow-sm"
                                                            : "text-zinc-400 hover:text-white hover:bg-white/5"}
                                                    `}
                                                >
                                                    <item.icon className="w-4 h-4" />
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 bg-[#1e1e1e] flex flex-col relative min-w-0">
                            {/* Controls Top Bar (Drag Area) */}
                            <div className="h-14 shrink-0 flex items-center justify-between px-8 border-b border-white/5 bg-[#1e1e1e]/90 select-none z-10"
                                onPointerDown={(e) => dragControls.start(e)}
                                onDoubleClick={toggleMaximize}
                            >
                                <div className="flex items-center gap-4 text-zinc-400">
                                    <button className="hover:text-white transition-colors"><Shuffle className="w-4 h-4" /></button>
                                    <button className="hover:text-white transition-colors" onClick={() => setIsPlaying(!isPlaying)}>
                                        <Play className="w-5 h-5 fill-current" />
                                    </button>
                                    <button className="hover:text-white transition-colors"><Repeat className="w-4 h-4" /></button>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-2 bg-[#2a2a2a] px-1 py-1 rounded-[6px] border border-white/5">
                                        <button className="px-6 py-0.5 text-xs font-medium bg-[#3a3a3a] text-zinc-200 rounded-[4px] shadow-sm">Reglook Music</button>
                                        <button className="px-6 py-0.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors">Your Library</button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 w-32 justify-end">
                                    <Volume2 className="w-4 h-4 text-zinc-400" />
                                    <div className="w-20 h-1 bg-zinc-700 rounded-full overflow-hidden relative group cursor-pointer">
                                        <div className="absolute top-0 left-0 bottom-0 bg-white w-[80%] rounded-full" />
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto no-scrollbar p-8">
                                {/* Hero Section */}
                                <div className="mb-10">
                                    <h2 className="text-3xl font-bold text-white mb-1">Listen Now</h2>
                                    <p className="text-zinc-400 text-sm mb-6">Top picks for you based on your listening</p>

                                    <div className="grid grid-cols-2 gap-6 pb-6 border-b border-white/5 border-dashed">
                                        <div className="relative aspect-[2/1] bg-gradient-to-br from-rose-900 to-rose-600 rounded-xl overflow-hidden group cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]">
                                            <div className="absolute inset-0 p-6 flex flex-col justify-end">
                                                <span className="text-xs font-bold text-rose-200 tracking-wider uppercase mb-2">New Release</span>
                                                <h3 className="text-2xl font-bold text-white mb-1">Starboy</h3>
                                                <p className="text-rose-100/80 text-sm">The Weeknd • Daft Punk</p>
                                            </div>
                                            <div className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-xl">
                                                <Play className="w-5 h-5 fill-current ml-0.5" />
                                            </div>
                                        </div>
                                        <div className="relative aspect-[2/1] bg-gradient-to-br from-indigo-900 to-blue-800 rounded-xl overflow-hidden group cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]">
                                            <div className="absolute inset-0 p-6 flex flex-col justify-end">
                                                <span className="text-xs font-bold text-indigo-200 tracking-wider uppercase mb-2">Made For You</span>
                                                <h3 className="text-2xl font-bold text-white mb-1">Chill Mix</h3>
                                                <p className="text-indigo-100/80 text-sm">Relaxing beats to study/work to</p>
                                            </div>
                                            <div className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-xl">
                                                <Play className="w-5 h-5 fill-current ml-0.5" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recently Played */}
                                <div className="mb-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-bold text-white">Recently Played</h3>
                                        <button className="text-xs font-medium text-rose-500 hover:text-rose-400">See All</button>
                                    </div>
                                    <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6">
                                        {ALBUMS.map((album, idx) => (
                                            <div key={idx} className="group cursor-pointer">
                                                <div className={`aspect-square rounded-[8px] mb-3 overflow-hidden relative shadow-lg ${album.color}`}>
                                                    {/* Placeholder for real images */}
                                                    <div className="absolute inset-0 flex items-center justify-center text-white/20 font-bold text-4xl select-none">
                                                        {album.title.charAt(0)}
                                                    </div>
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                                    <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/90 text-black flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                                    </div>
                                                </div>
                                                <h4 className="text-sm font-medium text-white truncate group-hover:text-rose-500 transition-colors">{album.title}</h4>
                                                <p className="text-xs text-zinc-500 truncate">{album.artist}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Footer Player */}
                    <div className="shrink-0 h-[84px] bg-[#1c1c1c] border-t border-white/5 flex items-center justify-between px-4 z-20">
                        {/* Playing Info */}
                        <div className="flex items-center gap-4 w-[30%]">
                            <div className="w-14 h-14 rounded-[6px] bg-zinc-800 relative overflow-hidden group shadow-md shrink-0">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-rose-500" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity">
                                    <Maximize2 className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-sm font-medium text-white truncate cursor-default hover:underline">Blinding Lights</h4>
                                <p className="text-xs text-zinc-400 truncate cursor-default hover:underline hover:text-zinc-300">The Weeknd</p>
                            </div>
                            <button className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-rose-500 transition-colors ml-2">
                                <Heart className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Center Controls */}
                        <div className="flex flex-col items-center gap-2 max-w-[40%] w-full">
                            <div className="flex items-center gap-6">
                                <button className="text-zinc-400 hover:text-white transition-colors"><Shuffle className="w-4 h-4" /></button>
                                <button className="text-zinc-200 hover:text-white transition-colors"><SkipBack className="w-5 h-5 fill-current" /></button>

                                <button className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
                                    onClick={() => setIsPlaying(!isPlaying)}
                                >
                                    <Play className="w-4 h-4 text-black fill-current ml-0.5" />
                                </button>

                                <button className="text-zinc-200 hover:text-white transition-colors"><SkipForward className="w-5 h-5 fill-current" /></button>
                                <button className="text-zinc-400 hover:text-white transition-colors"><Repeat className="w-4 h-4" /></button>
                            </div>
                            <div className="w-full flex items-center gap-2 text-[10px] font-medium text-zinc-500 font-mono">
                                <span>2:14</span>
                                <div className="flex-1 h-1 bg-zinc-800 rounded-full relative group cursor-pointer">
                                    <div className="absolute left-0 top-0 bottom-0 bg-zinc-500 w-[65%] rounded-full group-hover:bg-rose-500 transition-colors" />
                                    <div className="absolute left-[65%] top-1/2 -translate-y-1/2 w-2.5 h-2.5  shadow-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <span>3:20</span>
                            </div>
                        </div>

                        {/* Volume & Right Controls */}
                        <div className="flex items-center gap-3 w-[30%] justify-end">
                            <button className="text-zinc-400 hover:text-white transition-colors"><Mic2 className="w-4 h-4" /></button>

                            <div className="flex items-center gap-2 w-28 group">
                                <Volume1 className="w-4 h-4 text-zinc-400" />
                                <div className="flex-1 h-1 bg-zinc-800 rounded-full relative cursor-pointer overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 bg-white group-hover:bg-rose-500 w-[80%] rounded-full transition-colors" />
                                </div>
                            </div>

                            <button className="text-zinc-400 hover:text-white transition-colors ml-1"><ListMusic className="w-4 h-4" /></button>
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
            )}
        </AnimatePresence>
    );
}

export default MusicApp;
