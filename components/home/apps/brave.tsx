"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, useDragControls, useMotionValue } from "framer-motion";
import { SiBrave } from "@icons-pack/react-simple-icons";
import { Search, RotateCcw, ChevronLeft, ChevronRight, Share, Box, Shield, Lock, ExternalLink, X, Maximize2 } from "lucide-react";
import { WINDOW_CONSTANTS } from "../window-constants";

interface BraveProps {
    isOpen: boolean;
    onClose: () => void;
    onMinimize?: () => void;
}

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export function Brave({ isOpen, onClose, onMinimize }: BraveProps) {
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
    // Tuned URL for Brave Search
    const [url, setUrl] = useState("https://search.brave.com/");
    const [isLoaded, setIsLoaded] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const iframeRef = React.useRef<HTMLIFrameElement>(null);

    // Reset when opened
    useEffect(() => {
        if (!isOpen) return;

        // Trick: Open external search in new tab immediately
        window.open("https://search.brave.com", "_blank");

        // Optionally close the window immediately if you don't want a "ghost" window
        onClose();
    }, [isOpen, onClose]);

    const handleBack = () => {
        try {
            const win = iframeRef.current?.contentWindow;
            if (win) win.history.back();
        } catch (e) {
            // alert("Navigation restricted by browser security policy.");
        }
    };

    const handleForward = () => {
        try {
            const win = iframeRef.current?.contentWindow;
            if (win) win.history.forward();
        } catch (e) {
            // alert("Navigation restricted by browser security policy.");
        }
    };

    const handleReload = () => {
        setIsLoaded(false);
        if (iframeRef.current) {
            const currentSrc = iframeRef.current.src;
            iframeRef.current.src = "";
            setTimeout(() => {
                if (iframeRef.current) iframeRef.current.src = currentSrc;
            }, 10);
        }
    };

    const goHome = () => {
        setIsLoaded(false);
        setUrl("https://search.brave.com/?t=" + Date.now());
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
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        style={{ x, y, width: size.width, height: size.height }}
                        className={[
                            "pointer-events-auto bg-zinc-900 border border-white/10 shadow-3xl flex flex-col overflow-hidden relative",
                            isMaximized ? "rounded-xl" : "rounded-3xl",
                            isResizing ? "select-none" : "",
                        ].join(" ")}
                    >
                        {/* Title Bar & Address Bar */}
                        <div
                            className="shrink-0 h-16 bg-zinc-800/80 border-b border-white/5 flex flex-col justify-center px-4 select-none"
                            onPointerDown={(e) => dragControls.start(e)}
                            onDoubleClick={toggleMaximize}
                        >
                            <div className="flex items-center justify-between w-full h-8 px-2">
                                <div className="flex items-center gap-2 w-1/4">
                                    <button onClick={onClose} className="w-3 h-3 rounded-full bg-[#FF5F57] group/btn flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
                                        <X className="w-2 h-2 opacity-0 group-hover/btn:opacity-100 text-black/40" />
                                    </button>
                                    <button onClick={onMinimize} className="w-3 h-3 rounded-full bg-[#FEBC2E] group/btn flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
                                        <div className="w-1.5 h-[1.5px] bg-black/40 opacity-0 group-hover/btn:opacity-100" />
                                    </button>
                                    <button onClick={toggleMaximize} className="w-3 h-3 rounded-full bg-[#28C840] group/btn flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
                                        <Maximize2 className="w-1.5 h-1.5 opacity-0 group-hover/btn:opacity-100 text-black/40" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-4 text-zinc-400">
                                        <button onClick={handleBack} className="hover:text-white transition-colors active:scale-90" title="Back"><ChevronLeft className="w-4 h-4" /></button>
                                        <button onClick={handleForward} className="hover:text-white transition-colors active:scale-90" title="Forward"><ChevronRight className="w-4 h-4" /></button>
                                        <button onClick={handleReload} className="hover:text-white transition-colors active:scale-90" title="Reload"><RotateCcw className="w-3.5 h-3.5" /></button>
                                        <button onClick={goHome} className="hover:text-white transition-colors active:scale-90" title="Home"><SiBrave className="w-3.5 h-3.5" /></button>
                                    </div>
                                    <div className="flex items-center gap-2 bg-black/40 rounded-lg px-4 py-1.5 border border-white/5 w-[450px]">
                                        <Lock className="w-3 h-3 text-emerald-400" />
                                        <span className="text-[12px] text-zinc-300 font-medium truncate flex-1 leading-none pt-0.5">search.brave.com</span>
                                        <div
                                            onClick={() => setIsDarkMode(!isDarkMode)}
                                            className={`
                                                px-2 py-0.5 rounded text-[9px] font-black cursor-pointer transition-all active:scale-95
                                                ${isDarkMode ? "bg-orange-600 text-white shadow-lg shadow-orange-500/20" : "bg-zinc-700 text-zinc-400"}
                                            `}
                                        >
                                            {isDarkMode ? "DARK ON" : "DARK OFF"}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-zinc-400">
                                        <Share className="w-3.5 h-3.5 hover:text-white transition-colors cursor-pointer" />
                                        <a href="https://search.brave.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors cursor-pointer">
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                </div>

                                <div className="w-1/4 flex justify-end">
                                    <div className="p-1.5 bg-orange-600 rounded-lg">
                                        <SiBrave className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 bg-white relative">
                            {/* Dark Mode Overlay/Filter Container */}
                            <div className={`absolute inset-0 ${isDarkMode ? "bg-[#0a0a0a]" : "bg-white"}`}>
                                {!isLoaded && (
                                    <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 ${isDarkMode ? "bg-[#0a0a0a]" : "bg-white"}`}>
                                        <motion.div
                                            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                        >
                                            <SiBrave className={`w-16 h-16 ${isDarkMode ? "text-white" : "text-orange-600"}`} />
                                        </motion.div>
                                        <div className={`w-48 h-1 ${isDarkMode ? "bg-white/10" : "bg-zinc-100"} rounded-full overflow-hidden`}>
                                            <motion.div
                                                className="h-full bg-orange-600"
                                                initial={{ width: "0%" }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                            />
                                        </div>
                                    </div>
                                )}
                                <iframe
                                    ref={iframeRef}
                                    src={url}
                                    className={`
                                        w-full h-full border-none transition-opacity duration-500
                                        ${isLoaded ? "opacity-100" : "opacity-0"}
                                    `}
                                    onLoad={() => setIsLoaded(true)}
                                    title="Brave Search"
                                    style={{
                                        filter: isDarkMode
                                            ? "invert(0.9) hue-rotate(180deg) brightness(1.1) contrast(0.9)"
                                            : "none",
                                        backgroundColor: "#fff"
                                    }}
                                />

                                {/* Overlay warning if iframe fails to load or shows CSP error */}
                                <div className="absolute bottom-4 left-4 right-4 p-3 bg-zinc-900/90 backdrop-blur-md rounded-xl border border-white/5 text-[10px] text-zinc-400 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-3 h-3 text-orange-400" />
                                        <span>Brave Search may restrict embedding. Use the external link if the page is blank.</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={handleReload} className="text-white hover:underline">RETRY</button>
                                        <a href="https://search.brave.com" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">OPEN EXTERNAL</a>
                                    </div>
                                </div>
                            </div>
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
