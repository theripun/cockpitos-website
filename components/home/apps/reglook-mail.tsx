"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useDragControls, useMotionValue } from "framer-motion";
import { MailOpen, RotateCcw, ChevronLeft, ChevronRight, Share, Box, Lock, ExternalLink, Shield, X, Maximize2, MoreVertical, Send } from "lucide-react";
import { WINDOW_CONSTANTS } from "../window-constants";

interface ReglookMailProps {
    isOpen: boolean;
    onClose: () => void;
    onMinimize?: () => void;
}

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export function ReglookMail({ isOpen, onClose, onMinimize }: ReglookMailProps) {
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
    const [isLoaded, setIsLoaded] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const mailUrl = "https://ripun-mail.airnode1.reglook.com/gravity";

    // Reset when opened
    useEffect(() => {
        if (!isOpen) return;
        setIsMaximized(false);
        setSize({ width: 900, height: 600 });
        x.set(0);
        y.set(-15); // Centered accounting for dock space
        setIsLoaded(false);
    }, [isOpen, x, y]);

    const handleReload = () => {
        setIsLoaded(false);
        if (iframeRef.current) {
            iframeRef.current.src = mailUrl;
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
                        initial={{ opacity: 0, scale: 0.95, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 40 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        style={{ x, y, width: size.width, height: size.height }}
                        className={[
                            "pointer-events-auto bg-zinc-900 border border-white/10 shadow-3xl flex flex-col overflow-hidden relative font-sans",
                            isMaximized ? "rounded-xl" : "rounded-3xl",
                            isResizing ? "select-none" : "",
                        ].join(" ")}
                    >
                        {/* Title Bar - macOS style */}
                        <div
                            className="shrink-0 h-12 bg-zinc-800/90 border-b border-white/5 flex items-center px-4 select-none backdrop-blur-md"
                            onPointerDown={(e) => dragControls.start(e)}
                            onDoubleClick={toggleMaximize}
                        >
                            <div className="flex items-center justify-between w-full">
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

                                <div className="flex-1 flex justify-center items-center gap-2">
                                    <MailOpen className="w-4 h-4 text-blue-400" />
                                    <span className="text-[13px] font-semibold text-zinc-200 tracking-tight">Reglook Mail</span>
                                </div>

                                <div className="w-1/4 flex justify-end">
                                    <button
                                        onClick={handleReload}
                                        className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-all mr-1"
                                        title="Refresh"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                    </button>

                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 bg-white relative">
                            {!isLoaded && (
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-zinc-950">
                                    <motion.div
                                        animate={{
                                            rotate: [0, 10, -10, 0],
                                            scale: [1, 1.1, 1]
                                        }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                    >
                                        <MailOpen className="w-16 h-16 text-blue-500" />
                                    </motion.div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                                initial={{ width: "0%" }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                            />
                                        </div>
                                        {/* <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Enabling Secure Channel</span> */}
                                    </div>
                                </div>
                            )}
                            <iframe
                                ref={iframeRef}
                                src={mailUrl}
                                className={`
                                    w-full h-full border-none transition-opacity duration-700
                                    ${isLoaded ? "opacity-100" : "opacity-0"}
                                `}
                                onLoad={() => setIsLoaded(true)}
                                title="Reglook Mail"
                            />

                            {/* Guard Rail / Status Info */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/5 rounded-full flex items-center gap-3 opacity-0 hover:opacity-100 transition-opacity duration-300">
                                <Shield className="w-3 h-3 text-blue-400" />
                                <span className="text-[10px] text-zinc-400 font-medium">End-to-End Encrypted Gravity Channel</span>
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
