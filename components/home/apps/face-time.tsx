"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useDragControls, useMotionValue } from "framer-motion";
import {
    Phone, Video, Mic, MicOff, VideoOff, X, Maximize2, Users, MoreHorizontal, ScreenShare, MessageSquare,
    PhoneOff, Settings, Grid, Plus, Search, Clock, User
} from "lucide-react";
import { WINDOW_CONSTANTS } from "../window-constants";

interface FaceTimeProps {
    isOpen: boolean;
    onClose: () => void;
    onMinimize?: () => void;
}

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const RECENT_CALLS = [
    { id: 1, name: "Ripun Bose", time: "10:45 AM", type: "RegCall Video" },
    { id: 2, name: "Sarah Connor", time: "Yesterday", type: "RegCall Audio" },
    { id: 3, name: "John Doe", time: "Tuesday", type: "RegCall Video" },
    { id: 4, name: "Alice Smith", time: "Monday", type: "RegCall Video" },
];

export function FaceTime({ isOpen, onClose, onMinimize }: FaceTimeProps) {
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
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Reset when opened
    useEffect(() => {
        if (!isOpen) {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
            return;
        }
        setIsMaximized(false);
        setSize({ width: 900, height: 600 });
        x.set(0);
        y.set(-15); // Centered accounting for dock space

        // Start Camera
        const startCamera = async () => {
            try {
                const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setStream(s);
                if (videoRef.current) videoRef.current.srcObject = s;
            } catch (err) {
                console.error("Error accessing webcam:", err);
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isOpen, x, y]);

    // Handle video state change (e.g. videoRef might be available later)
    useEffect(() => {
        if (isOpen && stream && videoRef.current && !videoRef.current.srcObject) {
            videoRef.current.srcObject = stream;
        }
    }, [isOpen, stream]);

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

        const MIN_W = 600;
        const MIN_H = 400;

        let raf = 0;
        const applyAction = (moveEvent: PointerEvent) => {
            raf = 0;
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

            if (w < MIN_W) { if (dir.includes("w")) mx -= MIN_W - w; w = MIN_W; }
            if (h < MIN_H) { if (dir.includes("n")) my -= MIN_H - h; h = MIN_H; }

            setSize({ width: w, height: h });
            x.set(mx);
            y.set(my);
        };

        const onMove = (ev: PointerEvent) => {
            if (!raf) raf = window.requestAnimationFrame(() => applyAction(ev));
        };

        const onUp = (ev: PointerEvent) => {
            try { target.releasePointerCapture(ev.pointerId); } catch { }
            setIsResizing(false);
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            if (raf) window.cancelAnimationFrame(raf);
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
                            "pointer-events-auto bg-zinc-950 border border-white/5 flex flex-row overflow-hidden relative backdrop-blur-3xl text-white",
                            isMaximized ? "rounded-none" : "rounded-2xl",
                            isResizing ? "select-none" : "",
                        ].join(" ")}
                    >
                        {/* Sidebar */}
                        <div className="w-72 border-r border-white/5 flex flex-col bg-black/40">
                            {/* Window Controls (macOS style) */}
                            <div
                                className="h-14 flex items-center px-4 gap-2 shrink-0 select-none"
                                onPointerDown={(e) => dragControls.start(e)}
                            >
                                <button onClick={onClose} className="w-3 h-3 rounded-full bg-[#FF5F57] group/btn flex items-center justify-center transition-transform hover:scale-110">
                                    <X className="w-2 h-2 opacity-0 group-hover/btn:opacity-100 text-black/40" />
                                </button>
                                <button onClick={onMinimize} className="w-3 h-3 rounded-full bg-[#FEBC2E] group/btn flex items-center justify-center transition-transform hover:scale-110">
                                    <div className="w-1.5 h-[1.5px] bg-black/40 opacity-0 group-hover/btn:opacity-100" />
                                </button>
                                <button onClick={toggleMaximize} className="w-3 h-3 rounded-full bg-[#28C840] group/btn flex items-center justify-center transition-transform hover:scale-110">
                                    <Maximize2 className="w-1.5 h-1.5 opacity-0 group-hover/btn:opacity-100 text-black/40" />
                                </button>
                            </div>

                            <div className="px-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h1 className="text-xl font-bold tracking-tight">RegCall</h1>
                                    <button className="p-1.5 hover:bg-white/5 rounded-full transition-colors">
                                        <Plus className="w-5 h-5 text-green-500" />
                                    </button>
                                </div>

                                <div className="relative group">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search contacts"
                                        className="w-full bg-zinc-900/50 border border-white/5 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-zinc-600 focus:bg-zinc-800/80"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button className="flex-1 flex flex-col items-center gap-1 p-3 bg-zinc-900/50 hover:bg-zinc-900 rounded-xl transition-all border border-white/5 group">
                                        <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center mb-1 group-active:scale-95 transition-transform">
                                            <Video className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-[11px] font-medium text-zinc-300">New Video</span>
                                    </button>
                                    <button className="flex-1 flex flex-col items-center gap-1 p-3 bg-zinc-900/50 hover:bg-zinc-900 rounded-xl transition-all border border-white/5 group">
                                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center mb-1 group-active:scale-95 transition-transform">
                                            <Phone className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-[11px] font-medium text-zinc-300">New RegCall</span>
                                    </button>
                                </div>
                            </div>

                            <div className="mt-8 flex-1 overflow-y-auto no-scrollbar px-2 space-y-1">
                                <div className="flex items-center gap-2 px-3 mb-2 text-zinc-500 text-[11px] font-bold uppercase tracking-wider">
                                    <Clock className="w-3 h-3" />
                                    Recent calls
                                </div>
                                {RECENT_CALLS.map((call) => (
                                    <button
                                        key={call.id}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
                                            <User className="w-5 h-5 text-zinc-400" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="text-[13px] font-medium group-hover:text-white transition-colors">{call.name}</div>
                                            <div className="text-[11px] text-zinc-500">{call.type} • {call.time}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="p-4 border-t border-white/5 flex items-center justify-between">
                                <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 transition-colors">
                                    <Settings className="w-4 h-4" />
                                </button>
                                {/* <span className="text-[11px] text-zinc-600 font-medium">RegCall is available</span> */}
                            </div>
                        </div>

                        {/* Camera Content */}
                        <div className="flex-1 relative bg-black flex flex-col">
                            {/* Drag handle for the camera area */}
                            <div
                                className="absolute inset-x-0 top-0 h-14 z-10 select-none cursor-default"
                                onPointerDown={(e) => dragControls.start(e)}
                                onDoubleClick={toggleMaximize}
                            />

                            <div className="absolute inset-0 flex items-center justify-center">
                                {isVideoOff ? (
                                    <div className="w-32 h-32 rounded-full bg-zinc-900 flex items-center justify-center">
                                        <VideoOff className="w-12 h-12 text-zinc-600" />
                                    </div>
                                ) : (
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted={true}
                                        className="w-full h-full object-cover mirror transform scale-x-[-1]"
                                    />
                                )}
                            </div>

                            {/* Camera UI Overlay */}
                            {/* <div className="absolute top-8 right-8 z-20">
                                <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/5 text-[11px] font-medium text-white/80 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    Active Camera
                                </div>
                            </div> */}

                            {/* Control Bar Overlay */}
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30">
                                <motion.div
                                    className="flex items-center gap-6 p-4 rounded-3xl bg-black/30 backdrop-blur-sm border border-white/10 shadow-2xl"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                >
                                    <button
                                        onClick={() => setIsVideoOff(!isVideoOff)}
                                        className={`p-3.5 rounded-full transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                    >
                                        {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={() => setIsMuted(!isMuted)}
                                        className={`p-3.5 rounded-full transition-all ${isMuted ? 'bg-zinc-800 text-red-500' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                    >
                                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                    </button>
                                    <div className="w-px h-6 bg-white/10 mx-2" />
                                    <button className="p-3.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all">
                                        <Users className="w-5 h-5" />
                                    </button>
                                    <button className="p-3.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all">
                                        <Grid className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="p-3.5 rounded-full bg-red-600 text-white hover:bg-red-500 hover:rotate-90 transition-all"
                                    >
                                        <PhoneOff className="w-5 h-5" />
                                    </button>
                                </motion.div>
                            </div>

                            {/* Info Box Overlay */}
                            {/* <div className="absolute bottom-10 left-10 z-20 hidden md:block">
                                <div className="p-4 bg-zinc-900/40 backdrop-blur-lg rounded-2xl border border-white/5 space-y-1">
                                    <div className="text-[13px] font-semibold text-white">Your Camera</div>
                                    <div className="text-[11px] text-zinc-400">Integrated RegCall HD</div>
                                </div>
                            </div> */}
                        </div>

                        {/* Resize handles */}
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
