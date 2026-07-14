"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useDragControls, useMotionValue } from "framer-motion";
import { Terminal as TerminalIcon, X, Maximize2, Plus, Server, RefreshCw, Database, Search } from "lucide-react";
import { getNewZIndex } from "@/lib/z-index-manager";
import "@xterm/xterm/css/xterm.css";

import { WINDOW_CONSTANTS } from "../window-constants";
import { BASE_URL } from "@/lib/baseURL";
import { AppHorizontalAdTrack } from "@/components/ads";

interface TerminalProps {
    isOpen: boolean;
    onClose: () => void;
    onMinimize?: () => void;
    initialPath?: string;
    vpsId?: string;
    requestId?: number; // Unique ID per open-request (timestamp)
}

interface TerminalTab {
    id: string;
    name: string;
    vpsId?: string;
    initialPath?: string;
    createdAt?: number;
}

function uid() {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

/**
 * Fixes:
 * - xterm blank space on right/bottom after maximize: fit after animation + after resize ends.
 * - Keeps nano/.env friendly ctrl keys: only intercept Ctrl+C when selection exists.
 * - Full-bleed terminal area: no padding -> no fake gaps.
 */

// -- Terminal Session Component --
const TerminalSession = ({
    tabId,
    vpsId,
    isActive,
    setTabName,
    layoutTick,
    initialPath,
}: {
    tabId: string;
    vpsId: string;
    isActive: boolean;
    setTabName: (id: string, name: string) => void;
    layoutTick: number;
    initialPath?: string;
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const termRef = useRef<any>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const fitAddonRef = useRef<any>(null);
    const initializedRef = useRef(false);

    const [status, setStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("connecting");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [errorMsg, setErrorMsg] = useState<string>("");

    const [loadingStep, setLoadingStep] = useState<"init" | "connected" | "done">("init");
    const [progress, setProgress] = useState(0);

    // Progress animation effect
    useEffect(() => {
        if (!isActive) return;

        setProgress(0);

        let raf = 0;
        let last = performance.now();
        const cap = loadingStep === "init" ? 92 : 98;

        const tick = (now: number) => {
            const dt = Math.min(50, now - last);
            last = now;

            setProgress((p) => {
                if (loadingStep === "done") return 100;

                const remaining = cap - p;
                if (remaining <= 0) return p;

                const step = Math.max(0.12, remaining * 0.06) * (dt / 16.67);
                return Math.min(cap, p + step);
            });

            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [isActive, loadingStep]);

    const fit = () => {
        try {
            fitAddonRef.current?.fit?.();
        } catch { }
    };

    const [reconnectAttempts, setReconnectAttempts] = useState(0);

    // Init once per mounted session
    useEffect(() => {
        if (!containerRef.current) return;

        // If we already have a connected terminal for this session, don't re-init
        if (termRef.current && status === "connected") return;

        let isMounted = true;
        let term: any;
        let ws: WebSocket | undefined;
        let pingInterval: ReturnType<typeof setInterval> | undefined;

        const init = async () => {
            // If already initializing or connected, bail
            if (initializedRef.current && status === "connected") return;
            initializedRef.current = true;

            try {
                const { Terminal } = await import("@xterm/xterm");
                const { FitAddon } = await import("@xterm/addon-fit");
                const { WebLinksAddon } = await import("@xterm/addon-web-links");

                // Create terminal
                term = new Terminal({
                    cursorBlink: true,
                    fontSize: 13,
                    fontFamily: '"SF Mono", "Fira Code", "JetBrains Mono", monospace',
                    theme: {
                        background: '#09090b',
                        foreground: '#e4e4e7',
                        cursor: '#a1a1aa',
                        selectionBackground: 'rgba(255, 255, 255, 0.1)',
                        black: '#09090b',
                        red: '#f87171',
                        green: '#4ade80',
                        yellow: '#fbbf24',
                        blue: '#60a5fa',
                        magenta: '#c084fc',
                        cyan: '#22d3ee',
                        white: '#e4e4e7',
                    },
                    allowProposedApi: true,
                    scrollback: 5000,
                });

                if (!isMounted) {
                    term.dispose();
                    return;
                }

                if (containerRef.current) {
                    containerRef.current.innerHTML = "";
                }
                term.open(containerRef.current!);

                const fitAddon = new FitAddon();
                term.loadAddon(fitAddon);
                term.loadAddon(new WebLinksAddon());

                termRef.current = term;
                fitAddonRef.current = fitAddon;

                // Initial fit after mount
                requestAnimationFrame(() => {
                    fit();
                    requestAnimationFrame(fit);
                });

                // 1) Create Session
                const res = await fetch(`${BASE_URL}/cockpit/vps/${vpsId}/terminal/sessions`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.message || "Failed to create session");
                }

                const res1 = await res.json();
                const { sessionId, vps } = res1;

                if (vps?.name) {
                    const folderName = initialPath ? initialPath.split('/').filter(Boolean).pop() || '/' : '';
                    const label = folderName ? `${vps.name}:${folderName}` : vps.name;
                    setTabName(tabId, label);
                }

                // 2) Connect WS
                // Use BASE_URL to determine the correct websocket endpoint (handles local :9100 and prod :443 correctly)
                const wsBase = BASE_URL.replace(/^http/, "ws");
                let fullWsUrl = `${wsBase}/cockpit/terminal/ws?id=${sessionId}`;

                if (initialPath) {
                    fullWsUrl += `&cwd=${encodeURIComponent(initialPath)}`;
                }

                ws = new WebSocket(fullWsUrl);
                wsRef.current = ws;

                ws.onopen = () => {
                    setStatus("connected");
                    setLoadingStep("connected");

                    // Force fit before sending init dimensions to backend
                    try {
                        fitAddon.fit();
                    } catch { }

                    const dims = { cols: term.cols, rows: term.rows };
                    ws!.send(JSON.stringify({ type: "init", ...dims }));
                    ws!.send(JSON.stringify({ type: "resize", ...dims }));

                    pingInterval = setInterval(() => {
                        if (ws && ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({ type: "ping" }));
                        }
                    }, 10000); // 10s ping for better stability
                };

                ws.onmessage = (event) => {
                    try {
                        const msg = JSON.parse(event.data);

                        if (msg.type === "output") {
                            setLoadingStep((prev) => (prev !== "done" ? "done" : prev));
                            term.write(msg.data);
                            return;
                        }

                        if (msg.type === "error") {
                            setLoadingStep("done");
                            term.writeln(`\r\n\x1b[31mError: ${msg.message}\x1b[0m`);
                            if (msg.code === "HOST_KEY_CHANGED") {
                                term.writeln(`\r\nStored: ${msg.storedFingerprint}`);
                                term.writeln(`New:    ${msg.newFingerprint}`);
                            }
                            return;
                        }

                        if (msg.type === "exit") {
                            term.writeln("\r\n\x1b[33mProcess exited.\x1b[0m");
                            setStatus("disconnected");
                            ws?.close();
                            return;
                        }
                    } catch {
                        // ignore
                    }
                };

                ws.onclose = (event) => {
                    if (pingInterval) clearInterval(pingInterval);
                    setStatus("disconnected");
                    if (event.code === 1006) {
                        term.writeln(`\r\n\x1b[33m[System] Connection lost abruptly (Code 1006).\x1b[0m`);
                        term.writeln(`\x1b[38;5;242mThis usually happens if the server restarted or your network dropped.\x1b[0m`);
                    } else {
                        term.writeln(`\r\n\x1b[31mConnection closed. Code: ${event.code}${event.reason ? `, Reason: ${event.reason}` : ""}\x1b[0m`);
                    }
                };

                ws.onerror = () => {
                    if (pingInterval) clearInterval(pingInterval);
                    setStatus("error");
                    term.writeln("\r\n\x1b[31mError connecting to websocket.\x1b[0m");
                };

                term.onData((data: string) => {
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: "input", data }));
                    }
                });

                term.onResize((size: { cols: number; rows: number }) => {
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: "resize", ...size }));
                    }
                });

                // Copy/Paste (nano-friendly)
                term.attachCustomKeyEventHandler((arg: KeyboardEvent) => {
                    const ctrlOrCmd = arg.ctrlKey || arg.metaKey;
                    const shift = arg.shiftKey;
                    const code = arg.code;

                    if (arg.type === "keydown") {
                        // Paste
                        if ((ctrlOrCmd && code === "KeyV") || (shift && code === "Insert")) {
                            arg.preventDefault();
                            arg.stopPropagation();
                            navigator.clipboard.readText().then((text) => {
                                if (ws && ws.readyState === WebSocket.OPEN) {
                                    ws.send(JSON.stringify({ type: "input", data: text }));
                                }
                            });
                            return false;
                        }

                        // Copy (ONLY if selection exists; otherwise allow Ctrl+C)
                        if (ctrlOrCmd && code === "KeyC") {
                            const selection = term.getSelection?.();
                            if (selection) {
                                arg.preventDefault();
                                arg.stopPropagation();
                                navigator.clipboard.writeText(selection);
                                return false;
                            }
                        }
                    }

                    return true;
                });
            } catch (err: any) {
                if (term) term.writeln(`\r\n\x1b[31mFailed: ${err.message}\x1b[0m`);
                setStatus("error");
                setErrorMsg(err.message);
                setLoadingStep("done");
            }
        };

        init();

        return () => {
            isMounted = false;
            initializedRef.current = false;
            try {
                if (pingInterval) clearInterval(pingInterval);
            } catch { }
            try {
                ws?.close();
            } catch { }
            try {
                if (term) term.dispose();
                else if (termRef.current) termRef.current.dispose();
            } catch { }
            termRef.current = null;
        };
    }, [vpsId, initialPath, reconnectAttempts]); // Stay alive in background

    // Fit on activation
    useEffect(() => {
        if (!isActive) return;
        requestAnimationFrame(() => {
            fit();
            requestAnimationFrame(fit);
        });
    }, [isActive]);

    // ✅ Fit after layout changes (maximize animation / resize end)
    useEffect(() => {
        if (!isActive) return;

        const t = window.setTimeout(() => {
            fit();
            requestAnimationFrame(fit);
        }, 80);

        return () => window.clearTimeout(t);
    }, [isActive, layoutTick]);

    // Resize observer
    useEffect(() => {
        if (!isActive || !fitAddonRef.current || !containerRef.current) return;
        const ro = new ResizeObserver(() => fit());
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, [isActive]);

    // Also fit on browser resize
    useEffect(() => {
        if (!isActive) return;
        const onResize = () => fit();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [isActive]);

    // Focus on active or when loading finishes
    useEffect(() => {
        if (!isActive || loadingStep !== "done") return;
        termRef.current?.focus?.();
    }, [isActive, loadingStep]);

    return (
        <div
            className={`relative w-full h-full bg-[#09090b] p-6 ${!isActive ? "hidden" : ""}`}
            onClick={() => termRef.current?.focus?.()}
        >
            <div ref={containerRef} className="w-full h-full overflow-hidden" />

            {loadingStep !== "done" && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#09090b]">
                    <div className="flex flex-col items-center">
                        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-950/10 to-zinc-950/5 shadow-2xl ring-1 ring-white/5 backdrop-blur-md">
                            <TerminalIcon className="h-8 w-8 text-white/90" />
                        </div>

                        <div className="mb-4 text-center">
                            <h3 className="text-sm font-medium tracking-wide text-white/90">
                                {loadingStep === "init" ? "Connecting..." : "Cockpit Terminal"}
                            </h3>
                        </div>

                        <div className="h-[2px] w-32 overflow-hidden rounded-full bg-white/10">
                            <div
                                className="h-full rounded-full bg-white transition-all duration-200 ease-out shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {status === "disconnected" && loadingStep === "done" && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                    <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-transparent shadow-3xl border border-white/10 border-dashed">
                        <div className="text-white text-sm font-bold text-center">
                            <div>Session Disconnected</div>
                            <div className="text-[10px] text-white font-semibold mt-1 opacity-100">Network drop or server restart detected</div>
                        </div>
                        <button
                            onClick={() => {
                                initializedRef.current = false;
                                termRef.current = null;
                                setStatus("connecting");
                                setLoadingStep("init");
                                setReconnectAttempts(prev => prev + 1);
                            }}
                            className="px-4 py-2 bg-white hover:bg-white/80 text-black rounded-lg text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Reconnect Now
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export function Terminal({ isOpen, onClose, onMinimize, initialPath, vpsId, requestId }: TerminalProps) {
    const [tabs, setTabs] = useState<TerminalTab[]>(() => {
        // Start with a connecting tab if vpsId is provided on initial mount
        if (vpsId) {
            const t = { id: uid(), name: "Connecting...", vpsId, initialPath };
            if (requestId) (t as any).requestId = requestId;
            return [t];
        }
        return [{ id: uid(), name: "Select VPS" }];
    });
    const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0].id);
    const activeTab = useMemo(() => tabs.find((t) => t.id === activeTabId), [tabs, activeTabId]);

    const [vpsList, setVpsList] = useState<any[]>([]);
    const verifiedServers = useMemo(() => {
        const seen = new Set();
        return vpsList.filter(v => {
            const isVerified = v.status === "verified";
            if (!isVerified) return false;
            if (seen.has(v.host)) return false;
            seen.add(v.host);
            return true;
        });
    }, [vpsList]);

    const [loadingVps, setLoadingVps] = useState(false);

    const [layoutTick, setLayoutTick] = useState(0);

    const checkAuth = async () => {
        try {
            const res = await fetch(`${BASE_URL}/auth/me`, {
                credentials: "include",
            });
            if (res.ok) {
                fetchVps();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchVps = async () => {
        setLoadingVps(true);
        try {
            const res = await fetch(`${BASE_URL}/cockpit/vps`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();

                // Keep only verified and deduplicate by host to avoid duplicate entries with same IP
                const seenForList = new Set();
                const uniqueVerified = (data || []).filter((v: any) => {
                    const isVerified = v.status === "verified";
                    if (!isVerified) return false;
                    if (seenForList.has(v.host)) return false;
                    seenForList.add(v.host);
                    return true;
                });

                setVpsList(uniqueVerified);

                // Auto-connect if only one unique verified VPS is found and current tab is "Select VPS"
                if (uniqueVerified.length === 1 && activeTab && !activeTab.vpsId) {
                    connectTabToVps(activeTabId, uniqueVerified[0].id, uniqueVerified[0].name);
                }
            }
        } finally {
            setLoadingVps(false);
        }
    };

    // Track handled requests in a ref to persist across re-renders without global state
    const handledRequests = useRef<Set<number>>(new Set());

    useEffect(() => {
        if (!isOpen) return;

        fetchVps();

        if (vpsId && requestId) {
            if (handledRequests.current.has(requestId)) return;
            handledRequests.current.add(requestId);

            setTabs(prev => {
                // If a tab with this requestId already exists (e.g. created in useState), just focus it
                const existing = prev.find(t => (t as any).requestId === requestId);
                if (existing) {
                    setActiveTabId(existing.id);
                    return prev;
                }

                const newTab: TerminalTab = {
                    id: uid(),
                    name: "Connecting...",
                    vpsId,
                    initialPath,
                };
                (newTab as any).requestId = requestId;

                setActiveTabId(newTab.id);
                return [...prev, newTab];
            });
        }
    }, [isOpen, vpsId, initialPath, requestId]);

    const [size, setSize] = useState({ width: 900, height: 600 });
    const [isMaximized, setIsMaximized] = useState(false);
    const [manualId, setManualId] = useState("");
    const [preMaximizeState, setPreMaximizeState] = useState<{
        size: { width: number; height: number };
        pos: { x: number; y: number };
    } | null>(null);

    const dragControls = useDragControls();
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const [isResizing, setIsResizing] = useState(false);

    // Bump layout tick when frame changes
    useEffect(() => {
        setLayoutTick((t) => t + 1);
    }, [size.width, size.height, isMaximized]);

    const createNewTab = () => {
        const newTab: TerminalTab = { id: uid(), name: "Select VPS", initialPath: "/" };
        setTabs((p) => [...p, newTab]);
        setActiveTabId(newTab.id);
    };

    const closeTab = (tabId: string) => {
        if (tabs.length <= 1) {
            onClose();
            return;
        }

        setTabs((prev) => {
            const next = prev.filter((t) => t.id !== tabId);
            if (activeTabId === tabId) {
                const idx = prev.findIndex((t) => t.id === tabId);
                const nextActive = next[Math.max(0, idx - 1)] || next[0];
                if (nextActive) setActiveTabId(nextActive.id);
            }
            return next;
        });
    };

    const connectTabToVps = (tabId: string, vpsId: string, vpsName: string) => {
        setTabs((p) => p.map((t) => (t.id === tabId ? { ...t, vpsId, name: vpsName, initialPath: t.initialPath || "/" } : t)));
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
                    animate(y, 0, springConfig);
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
        const MIN_H = 420;

        const onMove = (ev: PointerEvent) => {
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;

            let w = startW;
            let h = startH;
            let mx = startMX;
            let my = startMY;

            if (dir.includes("e")) w = startW + dx;
            if (dir.includes("s")) h = startH + dy;
            if (dir.includes("w")) {
                w = startW - dx;
                mx = startMX + dx;
            }
            if (dir.includes("n")) {
                h = startH - dy;
                my = startMY + dy;
            }

            if (w < MIN_W) {
                if (dir.includes("w")) mx -= MIN_W - w;
                w = MIN_W;
            }
            if (h < MIN_H) {
                if (dir.includes("n")) my -= MIN_H - h;
                h = MIN_H;
            }

            setSize({ width: w, height: h });
            x.set(mx);
            y.set(my);
        };

        const onUp = (ev: PointerEvent) => {
            target.releasePointerCapture(ev.pointerId);
            setIsResizing(false);
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);

            // ✅ fit after resize finishes
            setLayoutTick((t) => t + 1);
        };

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
    };

    useEffect(() => {
        if (isOpen) {
            setIsMaximized(false);
            setSize({ width: 900, height: 600 });
            x.set(0);
            y.set(-15);
            setLayoutTick((t) => t + 1);
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    drag={!isResizing && !isMaximized}
                    dragMomentum={false}
                    dragListener={false}
                    dragControls={dragControls}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    style={{ x, y, width: size.width, height: size.height }}
                    onClick={(e) => {
                        e.currentTarget.style.zIndex = getNewZIndex().toString();
                    }}
                    onAnimationComplete={() => setLayoutTick((t) => t + 1)}
                    className={[
                        "pointer-events-auto bg-zinc-950 border border-white/5 shadow-3xl flex flex-col overflow-hidden relative",
                        isMaximized ? "rounded-xl" : "rounded-3xl",
                        isResizing ? "select-none" : "",
                    ].join(" ")}
                >
                    {/* Title Bar */}
                    <div
                        className="shrink-0 h-11 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-center px-4 select-none relative"
                        onPointerDown={(e) => dragControls.start(e)}
                        onDoubleClick={toggleMaximize}
                    >
                        <div className="absolute left-4 inset-y-0 flex items-center gap-2">
                            <button onClick={onClose} className="w-3 h-3 rounded-full bg-[#FF5F57] hover:scale-110 transition-transform flex items-center justify-center group">
                                <X className="w-2 h-2 opacity-0 group-hover:opacity-100 text-black/50" />
                            </button>

                            <button onClick={onMinimize} className="w-3 h-3 rounded-full bg-[#FEBC2E] hover:scale-110 transition-transform flex items-center justify-center group">
                                <div className="w-1.5 h-[1.5px] bg-black/50 opacity-0 group-hover:opacity-100" />
                            </button>

                            <button onClick={toggleMaximize} className="w-3 h-3 rounded-full bg-[#28C840] hover:scale-110 transition-transform flex items-center justify-center group">
                                <Maximize2 className="w-1.5 h-1.5 opacity-0 group-hover:opacity-100 text-black/50" />
                            </button>
                        </div>

                        <div className="flex items-center gap-3 text-zinc-400 text-xs font-medium">
                            <TerminalIcon className="w-3.5 h-3.5 text-zinc-500" />
                            <div className="flex items-center gap-2">
                                <span>{activeTab?.name || "Terminal"}</span>
                                {activeTab?.vpsId && (
                                    <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/10">
                                        <button
                                            onClick={() => setTabs(p => p.map(t => t.id === activeTabId ? { ...t, vpsId: undefined, name: "Select VPS" } : t))}
                                            className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-wider text-zinc-500/80 hover:text-white hover:bg-white/10 transition-all"
                                        >
                                            Switch
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tab Bar */}
                    <div className="shrink-0 h-9 bg-zinc-900/50 flex items-end px-2 gap-1 overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => (
                            <div
                                key={tab.id}
                                onClick={() => setActiveTabId(tab.id)}
                                className={[
                                    "group flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-t-md cursor-pointer transition-colors min-w-[120px] max-w-[200px]",
                                    activeTabId === tab.id ? "bg-zinc-950 text-zinc-200" : "bg-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30",
                                ].join(" ")}
                            >
                                <span className="truncate flex-1">{tab.name}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        closeTab(tab.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-zinc-700/50"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}

                        <button onClick={createNewTab} className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded mb-0.5">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="shrink-0 border-b border-white/[0.06] bg-zinc-900/40 px-2 py-1.5">
                        <AppHorizontalAdTrack />
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-zinc-950 relative overflow-hidden">
                        {tabs.map((tab) => {
                            if (!tab.vpsId) {
                                return (
                                    <div
                                        key={tab.id}
                                        style={{ display: activeTabId === tab.id ? "flex" : "none" }}
                                        className="w-full h-full flex flex-col items-center justify-center p-12 bg-[#09090b]"
                                    >
                                        <div className="w-full max-w-2xl flex flex-col">
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex items-center justify-between mb-8 px-2 mt-8"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
                                                        <Server className="w-5 h-5 text-zinc-100" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-black text-white tracking-tight leading-none">Your Servers</h3>
                                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1.5">Select a remote node to connect</p>
                                                    </div>
                                                </div>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={fetchVps}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all"
                                                >
                                                    <RefreshCw className={`w-3 h-3 ${loadingVps ? 'animate-spin text-white' : 'text-zinc-500'}`} />
                                                    <span className="text-[10px] font-black text-zinc-400 group-hover:text-white uppercase tracking-widest">Refresh</span>
                                                </motion.button>
                                            </motion.div>

                                            {/* Table Header */}
                                            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 bg-white/[0.01] rounded-t-2xl">
                                                <div className="col-span-5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Server Node</div>
                                                <div className="col-span-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">SSH Endpoint</div>
                                                <div className="col-span-3 text-right text-[9px] font-black text-zinc-500 uppercase tracking-widest">Status</div>
                                            </div>

                                            {/* Table Body */}
                                            <div className="flex flex-col max-h-[350px] overflow-y-auto no-scrollbar bg-white/[0.01] rounded-b-2xl border-x border-b border-white/5">
                                                {loadingVps && vpsList.length === 0 ? (
                                                    <div className="py-24 flex flex-col items-center justify-center gap-4">
                                                        <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-white/40 animate-spin" />
                                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Scanning Network...</p>
                                                    </div>
                                                ) : verifiedServers.length === 0 ? (
                                                    <div className="py-24 text-center">
                                                        <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto mb-4">
                                                            <Search className="w-6 h-6 text-zinc-800" />
                                                        </div>
                                                        <p className="text-[11px] text-zinc-600 font-bold">No discovered remote nodes.</p>
                                                        <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-tighter">Add one in Settings app</p>
                                                    </div>
                                                ) : (
                                                    verifiedServers.map((v, idx) => (
                                                        <motion.button
                                                            key={v.id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: idx * 0.03 }}
                                                            onClick={() => connectTabToVps(tab.id, v.id, v.name)}
                                                            className="grid grid-cols-12 gap-4 px-6 py-4 items-center group hover:bg-white/[0.02] transition-all border-b border-white/[0.02] last:border-0 relative text-left"
                                                        >
                                                            <div className="col-span-5 flex items-center gap-4 relative">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${v.status === 'verified' ? 'bg-zinc-500/10 text-white' : 'bg-zinc-500/10 text-zinc-500'}`}>
                                                                    <Database className="w-4 h-4" />
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="text-xs font-black text-white group-hover:text-white transition-colors truncate">
                                                                        {v.name}
                                                                    </span>
                                                                    <span className="text-[9px] font-bold text-zinc-600 font-mono tracking-tight truncate">
                                                                        {v.id.split('-')[0]}..
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="col-span-4 relative">
                                                                <span className="text-[11px] font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors">
                                                                    {v.username}@{v.host}
                                                                </span>
                                                            </div>

                                                            <div className="col-span-3 flex justify-end items-center gap-3 relative">
                                                                <div className="flex flex-col items-end">
                                                                    <span className={`text-[10px] font-black uppercase tracking-widest text-white`}>
                                                                        READY
                                                                    </span>
                                                                    <div className="w-12 h-1 bg-white/[0.03] rounded-full mt-1 overflow-hidden">
                                                                        <div className={`h-full bg-white w-full`} />
                                                                    </div>
                                                                </div>
                                                                <div className="w-4 h-4 flex items-center justify-center">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-all scale-0 group-hover:scale-100 shadow-[0_0_8px_white]" />
                                                                </div>
                                                            </div>
                                                        </motion.button>
                                                    ))
                                                )}
                                            </div>

                                            {/* Manual Connection Input */}
                                            {/* <div className="mt-8 flex items-center gap-3 p-2 bg-white/[0.02] border border-white/5 rounded-2xl">
                                                <input
                                                    type="text"
                                                    placeholder="Enter SSH Host manually..."
                                                    value={manualId}
                                                    onChange={(e) => setManualId(e.target.value)}
                                                    className="flex-1 bg-transparent border-0 px-4 py-2 text-xs font-bold text-zinc-300 focus:outline-none placeholder:text-zinc-700"
                                                />
                                                <button
                                                    onClick={() => manualId && connectTabToVps(tab.id, manualId, "Direct Node")}
                                                    className="px-6 py-2 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95"
                                                >
                                                    Connect
                                                </button>
                                            </div> */}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <TerminalSession
                                    key={tab.id}
                                    tabId={tab.id}
                                    vpsId={tab.vpsId}
                                    isActive={activeTabId === tab.id}
                                    layoutTick={layoutTick}
                                    initialPath={tab.initialPath}
                                    setTabName={(id, name) => setTabs((p) => p.map((t) => (t.id === id ? { ...t, name } : t)))}
                                />
                            );
                        })}
                    </div>

                    {!isMaximized && (
                        <>
                            <div onPointerDown={handleResizeStart("n")} className="absolute top-0 left-0 right-0 h-1 cursor-n-resize z-50" />
                            <div onPointerDown={handleResizeStart("s")} className="absolute bottom-0 left-0 right-0 h-1 cursor-s-resize z-50" />
                            <div onPointerDown={handleResizeStart("w")} className="absolute top-0 bottom-0 left-0 w-1 cursor-w-resize z-50" />
                            <div onPointerDown={handleResizeStart("e")} className="absolute top-0 bottom-0 right-0 w-1 cursor-e-resize z-50" />
                            <div onPointerDown={handleResizeStart("se")} className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50" />
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
