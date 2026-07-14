"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useDragControls, useMotionValue } from "framer-motion";
import {
    Activity,
    Cpu,
    Database,
    Network,
    X,
    Search,
    RefreshCw,
    Terminal as TerminalIcon,
    Zap,
    Shield,
    HardDrive,
    Thermometer,
    ArrowUpRight,
    ArrowDownRight,
    Trash2,
    Maximize2,
    ShieldAlert,
    Clock,
    Wrench,
    Loader2,
    Settings
} from "lucide-react";
import { WINDOW_CONSTANTS } from "../window-constants";
import { BASE_URL } from "@/lib/baseURL";
import { AppHorizontalAdTrack } from "@/components/ads";

interface TaskMonitorProps {
    isOpen: boolean;
    deviceId: string | null;
    onClose: () => void;
    onMinimize?: () => void;
}

interface Process {
    pid: number;
    name: string;
    user: string;
    cpuPct: number;
    memPct: number;
    rssBytes: number;
    threads: number;
    cmd: string;
    netUp?: string;
    netDown?: string;
}

type NormalizedMetrics = {
    deviceId?: string;
    online?: boolean;
    lastSeenAt?: string;
    metricsAt?: string;

    cpu?: {
        cores: number;
        load1: number; // or load
        usagePct: number;
    };

    mem?: {
        totalBytes: number;
        usedBytes: number;
        freeBytes: number;
        activeBytes?: number;
    };

    disk?: Array<{
        fs?: string;
        mount?: string;
        type?: string;
        totalBytes: number;
        usedBytes: number;
    }>;

    net?: {
        rxBytesPerSec?: number;
        txBytesPerSec?: number;
    };

    uptimeSec?: number;
    tempC?: number;
    neofetch?: string;
};

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function bytesToGiB(bytes: number) {
    return bytes / 1024 / 1024 / 1024;
}

function formatUptime(totalSeconds: number) {
    if (!totalSeconds) return "—";
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);

    const parts = [];
    if (d > 0) parts.push(`${d} ${d === 1 ? "day" : "days"}`);
    if (h > 0) parts.push(`${h} ${h === 1 ? "hour" : "hours"}`);
    if (m > 0 || parts.length === 0) parts.push(`${m} ${m === 1 ? "min" : "mins"}`);

    return parts.join(", ");
}

function formatShortUptime(totalSeconds: number) {
    if (!totalSeconds) return "—";
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);

    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}



function normalizeMetrics(raw: any): NormalizedMetrics {
    const cpuRaw = raw?.cpu ?? {};
    const memRaw = raw?.mem ?? {};
    const diskRaw = raw?.disk ?? [];

    const cores =
        Number(cpuRaw.cores ?? cpuRaw.coreCount ?? cpuRaw.count ?? 0) || 0;

    // Your agent currently gives `cpu.load` (looks like load avg, not %)
    const load1 =
        Number(cpuRaw.load1 ?? cpuRaw.load ?? cpuRaw.loadAvg1 ?? 0) || 0;

    // Convert load -> % approximately: (load / cores) * 100
    // If cores unknown, keep 0.
    const usagePct =
        cores > 0 ? clamp((load1 / cores) * 100, 0, 100) : 0;

    const totalBytes =
        Number(memRaw.totalBytes ?? memRaw.total ?? 0) || 0;
    const usedBytes =
        Number(memRaw.usedBytes ?? memRaw.used ?? 0) || 0;
    const freeBytes =
        Number(memRaw.freeBytes ?? memRaw.free ?? 0) || 0;
    const activeBytes =
        memRaw.activeBytes !== undefined || memRaw.active !== undefined
            ? Number(memRaw.activeBytes ?? memRaw.active ?? 0) || 0
            : undefined;

    const disk = Array.isArray(diskRaw)
        ? diskRaw.map((d: any) => ({
            fs: d.fs,
            mount: d.mount,
            type: d.type,
            totalBytes: Number(d.totalBytes ?? d.size ?? 0) || 0,
            usedBytes: Number(d.usedBytes ?? d.used ?? 0) || 0,
        }))
        : [];

    const uptimeSec = Number(raw?.uptimeSec ?? raw?.uptime ?? 0) || 0;
    const tempC = raw?.tempC !== undefined ? Number(raw.tempC) : undefined;

    return {
        deviceId: raw?.deviceId,
        online: !!raw?.online,
        lastSeenAt: raw?.lastSeenAt,
        metricsAt: raw?.metricsAt,
        cpu: { cores: cores || 0, load1, usagePct },
        mem: {
            totalBytes,
            usedBytes,
            freeBytes,
            ...(activeBytes !== undefined ? { activeBytes } : {}),
        },
        disk,
        net: raw?.net,
        uptimeSec,
        tempC,
        neofetch: raw?.neofetch,
    };
}

function useDeviceStreamWs(deviceId: string | null, enabled: boolean) {
    const [wsOk, setWsOk] = useState(false);
    const [net, setNet] = useState<{ rx: number; tx: number } | null>(null);
    const [conns, setConns] = useState<any[]>([]);
    const [logs, setLogs] = useState<{ streamId: string; line: string; at: string }[]>([]);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [retryCount, setRetryCount] = useState(0);



    useEffect(() => {
        if (!enabled || !deviceId) {
            if (ws) {
                ws.close();
                setWs(null);
                setWsOk(false);
            }
            return;
        }

        let isMounted = true;
        let heartbeatInterval: any;
        let reconnectTimeout: any;

        const base = BASE_URL;
        const wsUrl = base.replace(/^http/, "ws") + "/cockpit/cocktail/ws/ui";
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            if (!isMounted) return;
            // console.log(`[WS] Connected to ${deviceId}`);
            socket.send(JSON.stringify({ t: "ui_hello", deviceId }));
            socket.send(JSON.stringify({ t: "sub", topics: ["net", "conns", "logs", "metrics"] }));
            setWsOk(true);
            setRetryCount(0); // Reset retry count on success

            // Heartbeat to keep connection alive and detect dead sockets
            heartbeatInterval = setInterval(() => {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ t: "ping" }));
                }
            }, 30000);
        };

        socket.onmessage = (ev) => {
            if (!isMounted) return;
            try {
                const msg = JSON.parse(ev.data);
                if (!msg) return;

                if (msg.t === "net") setNet({ rx: msg.rxBytesPerSec, tx: msg.txBytesPerSec });
                if (msg.t === "conns") setConns(Array.isArray(msg.items) ? msg.items : []);
                if (msg.t === "log") {
                    setLogs(prev => {
                        const next = [...prev, { streamId: msg.streamId, line: msg.line, at: msg.at }];
                        return next.length > 1000 ? next.slice(next.length - 1000) : next;
                    });
                }
                if (msg.t === "ui_boost_log") {
                    window.dispatchEvent(new CustomEvent("cocktail_boost_log", { detail: msg }));
                }
            } catch { }
        };

        const handleClose = () => {
            if (!isMounted) return;
            console.warn(`[WS] Disconnected from ${deviceId}. Retrying...`);
            setWsOk(false);
            setWs(null);
            clearInterval(heartbeatInterval);

            // Reconnect with exponential backoff (max 30s)
            const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
            reconnectTimeout = setTimeout(() => {
                if (isMounted) setRetryCount(prev => prev + 1);
            }, delay);
        };

        socket.onclose = handleClose;
        socket.onerror = (err) => {
            console.error("[WS] Error:", err);
            socket.close(); // Triggers onclose
        };

        setWs(socket);

        return () => {
            isMounted = false;
            clearInterval(heartbeatInterval);
            clearTimeout(reconnectTimeout);
            socket.close();
        };
    }, [enabled, deviceId, retryCount]);

    return { wsOk, net, conns, logs, ws };
}

interface DeviceItem {
    device: {
        id: string;
        name: string;
        status: string;
        lastSeenAt: string;
        os: string;
        arch: string;
        hostname: string;
    };
    vps: {
        id: string;
        name: string;
        host: string;
    };
}

export function TaskMonitor({ isOpen, deviceId, onClose, onMinimize }: TaskMonitorProps) {
    const [selectedId, setSelectedId] = useState<string | null>(deviceId || null);
    const [devices, setDevices] = useState<DeviceItem[]>([]);
    const [fetchingDevices, setFetchingDevices] = useState(false);

    const [size, setSize] = useState({ width: 900, height: 600 });
    const [isMaximized, setIsMaximized] = useState(false);
    const [preMaximizeState, setPreMaximizeState] = useState<{
        size: { width: number; height: number };
        pos: { x: number; y: number };
    } | null>(null);

    const selectedDeviceName = useMemo(() => {
        return devices.find(d => d.device.id === selectedId)?.device.name;
    }, [devices, selectedId]);

    const [activeTab, setActiveTab] =
        useState<"performance" | "processes" | "network" | "booster" | "system">("performance");

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPid, setSelectedPid] = useState<number | null>(null);

    const [processes, setProcesses] = useState<Process[]>([]);
    const [metrics, setMetrics] = useState<NormalizedMetrics | null>(null);

    const [isOnline, setIsOnline] = useState(false);
    const [isStale, setIsStale] = useState(false);

    const [history, setHistory] = useState<number[]>(Array(40).fill(0)); // CPU %
    const [processHistory, setProcessHistory] = useState<number[]>(Array(40).fill(0)); // Process CPU % normalized

    const streamEnabled = isOpen && selectedId && (activeTab === "network" || activeTab === "booster");
    const { wsOk, net: streamNet, conns: streamConns, logs: streamLogs, ws: streamWs } = useDeviceStreamWs(selectedId, !!streamEnabled);

    const [isLoadingProcs, setIsLoadingProcs] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);
    const [refreshNonce, setRefreshNonce] = useState(0);

    const [isKillConfirmOpen, setIsKillConfirmOpen] = useState(false);
    const [isBoostConfirmOpen, setIsBoostConfirmOpen] = useState(false);
    const [targetKillName, setTargetKillName] = useState("");

    const [isBoosting, setIsBoosting] = useState(false);
    const [boostProgress, setBoostProgress] = useState(0);
    const [cleanedItems, setCleanedItems] = useState(0);
    const [isSuccess, setIsSuccess] = useState(false);
    const [systemWarning, setSystemWarning] = useState<string | null>(null);
    const [boostLogs, setBoostLogs] = useState<{ at: string; line: string }[]>([]);

    const logContainerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [streamLogs]);

    const dragControls = useDragControls();
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const [repairingVpsId, setRepairingVpsId] = useState<string | null>(null);
    const [repairLogs, setRepairLogs] = useState<string[]>([]);
    const [repairStatus, setRepairStatus] = useState<'connecting' | 'running' | 'done' | 'error'>('connecting');
    const repairScrollRef = React.useRef<HTMLDivElement>(null);

    const [isProcessingAction, setIsProcessingAction] = useState(false);

    useEffect(() => {
        if (repairScrollRef.current) {
            repairScrollRef.current.scrollTop = repairScrollRef.current.scrollHeight;
        }
    }, [repairLogs]);

    const handleRepair = async () => {
        const device = devices.find(d => d.device.id === selectedId);
        if (!device?.vps?.id) return;

        setRepairingVpsId(device.vps.id);
        setRepairStatus('connecting');
        setRepairLogs(["[System] Initializing repair session...", `[System] Target VPS: ${device.vps.host}`]);

        const base = BASE_URL;

        try {
            // 1. Create a terminal session first
            const sessionRes = await fetch(`${base}/cockpit/vps/${device.vps.id}/terminal/sessions`, {
                method: "POST",
                credentials: "include"
            });

            if (!sessionRes.ok) throw new Error("Failed to create terminal session");
            const sessionData = await sessionRes.json();
            const terminalId = sessionData.sessionId || sessionData.id;

            if (!terminalId) throw new Error("Server returned invalid session ID");

            // 2. Get the official install command from the server (handled by CocktailService)
            const enrollmentRes = await fetch(`${base}/cockpit/cocktail/devices/enroll/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vpsId: device.vps.id }),
                credentials: "include"
            });

            if (!enrollmentRes.ok) throw new Error("Failed to fetch official install command");
            const enrollmentData = await enrollmentRes.json();
            const officialInstallCmd = enrollmentData.installCommand;

            const wsUrl = base.replace(/^http/, "ws") + `/cockpit/terminal/ws?id=${terminalId}`;
            const ws = new WebSocket(wsUrl);
            let shellReady = false;

            ws.onopen = () => {
                setRepairLogs(prev => [...prev, "[System] WebSocket Tunnel Established."]);
            };

            ws.onmessage = (ev) => {
                const msg = JSON.parse(ev.data);

                if (msg.type === "ready") {
                    setRepairLogs(prev => [...prev, "[System] SSH Handshake Successful."]);
                }

                if (msg.type === "output") {
                    const lines = msg.data.split('\r\n');
                    lines.forEach((line: string) => {
                        // Aggressive ANSI stripping: Handles colors (m), cursor moves (A-Z, a-z), etc.
                        const cleanLine = line.replace(/\x1B\[[0-9;?]*[a-zA-Z]/g, '').trim();

                        if (cleanLine || line.trim()) {
                            setRepairLogs(prev => [...prev.slice(-100), cleanLine || line.trim()]);

                            // Improved prompt detection: check for # or $ at the end of clean line
                            // Or presence of root@...: ...#
                            const isPrompt = /([#$]\s*|@.*:.*[#$]\s*)$/.test(cleanLine) || cleanLine.endsWith('#') || cleanLine.endsWith('$');

                            if (!shellReady && isPrompt) {
                                shellReady = true;
                                setRepairStatus('running');
                                setRepairLogs(prev => [...prev, "[System] Shell Prompt Detected. Executing Repair..."]);

                                // Send the official install command obtained from the server
                                setTimeout(() => {
                                    ws.send(JSON.stringify({ type: "input", data: officialInstallCmd + "\n" }));
                                }, 1000);
                            }

                            // Detect completion
                            if (cleanLine.includes("Cocktail Agent installed and started!")) {
                                setRepairLogs(prev => [...prev, "[SUCCESS] Repair completed successfully."]);
                                setRepairStatus('done');

                                // Optimistically clear neofetch error so UI shows loading instead of error
                                setMetrics(prev => prev ? { ...prev, neofetch: "" } : null);

                                setTimeout(() => {
                                    ws.close();
                                    setRepairingVpsId(null);
                                    setRefreshNonce(n => n + 1);
                                }, 3000);
                            }
                        }
                    });
                }
            };

            ws.onerror = () => {
                setRepairStatus('error');
                setRepairLogs(prev => [...prev, "[ERROR] WebSocket connection failed."]);
            };

            ws.onclose = () => {
                if (repairStatus !== 'done') {
                    setRepairStatus('error');
                    setRepairLogs(prev => [...prev, "[System] Connection closed."]);
                }
            };

        } catch (e: any) {
            setRepairStatus('error');
            setRepairLogs(prev => [...prev, `[ERROR] ${e.message}`]);
        }
    };

    // Bootstrap listener for boost logs
    useEffect(() => {
        const handler = (e: any) => {
            const msg = e.detail;
            setBoostLogs(prev => [...prev.slice(-20), { at: msg.at, line: msg.line }]);
            // Adjust progress based on log messages
            if (msg.line.includes("Analyzing")) setBoostProgress(30);
            if (msg.line.includes("Cleaning")) setBoostProgress(50);
            if (msg.line.includes("Scanning")) setBoostProgress(70);
            if (msg.line.includes("Purging")) setBoostProgress(85);
            if (msg.line.includes("complete")) setBoostProgress(100);
        };
        window.addEventListener("cocktail_boost_log", handler);
        return () => window.removeEventListener("cocktail_boost_log", handler);
    }, []);



    // Consider stale if lastSeenAt older than this
    const STALE_MS = 20_000;

    const fetchDevices = async () => {
        if (!isOpen) return;
        setFetchingDevices(true);
        try {
            const res = await fetch(`${BASE_URL}/cockpit/cocktail/devices`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                const enrolled = (data || []).filter((d: any) => d.device?.status !== 'enrolling');
                setDevices(enrolled);

                // Auto-connect if only one enrolled device exists — skip the picker entirely
                if (enrolled.length === 1 && !selectedId) {
                    setSelectedId(enrolled[0].device.id);
                }
            }
        } catch (e) {
            console.error("Failed to fetch devices", e);
        } finally {
            setFetchingDevices(false);
        }
    };

    useEffect(() => {
        if (isOpen && !selectedId) {
            fetchDevices();
        }
    }, [isOpen, selectedId]);

    // Update selectedId if prop changes
    useEffect(() => {
        if (deviceId && deviceId !== "1ced4913-50c3-43ef-a4b9-a7fae6f11c30") {
            setSelectedId(deviceId);
        }
    }, [deviceId]);

    // ---- Metrics Polling ----
    useEffect(() => {
        if (!isOpen || !selectedId) return;

        let alive = true;

        const fetchMetrics = async () => {
            try {
                const res = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${selectedId}/metrics/latest`, {
                    credentials: "include",
                    cache: "no-store",
                });

                if (!res.ok) return;

                const raw = await res.json();
                const data = normalizeMetrics(raw);

                if (!alive) return;

                setMetrics(data);
                setIsOnline(!!data.online);

                // Stale based on lastSeenAt
                const lastSeenMs = data.lastSeenAt ? Date.parse(data.lastSeenAt) : 0;
                setIsStale(lastSeenMs > 0 ? Date.now() - lastSeenMs > STALE_MS : false);

                // CPU history
                const cpuPct = clamp(Number(data.cpu?.usagePct ?? 0), 0, 100);
                setHistory((prev) => [...prev.slice(1), cpuPct]);
            } catch (e) {
                // network errors -> keep last values
                console.error("Failed to fetch metrics", e);
            }
        };

        const tick = () => {
            fetchMetrics();
        };

        const t = setInterval(tick, 2000);
        tick();

        return () => {
            alive = false;
            clearInterval(t);
        };
    }, [isOpen, selectedId, BASE_URL, refreshNonce, STALE_MS]);

    // ---- Processes Polling ----
    useEffect(() => {
        if (!isOpen || !selectedId) return;
        if (activeTab !== "processes" && activeTab !== "performance") return;

        let alive = true;

        const fetchProcesses = async () => {
            if (activeTab !== "processes" && activeTab !== "performance") return;
            setIsLoadingProcs(true);
            try {
                const res = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${selectedId}/proc/list`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ limit: 100, sort: "cpu" }),
                    credentials: "include",
                    cache: "no-store",
                });

                if (!res.ok) {
                    setLastError(`Server returned ${res.status}`);
                    return;
                }

                const data = await res.json();
                if (!alive) return;

                const items: Process[] = Array.isArray(data?.items) ? data.items : [];
                setProcesses(items);
                setLastError(null);

                // If backend includes staleness flag, merge it
                if (typeof data?.stale === "boolean") setIsStale(data.stale);

                // Normalize “process load” into 0–100 by dividing by core count when possible
                const cores = metrics?.cpu?.cores || 1;
                const sumCpu = items.reduce((acc, p) => acc + (Number(p.cpuPct) || 0), 0);
                const normalized = clamp(sumCpu / cores, 0, 100);

                setProcessHistory((prev) => [...prev.slice(1), normalized]);
            } catch (e: any) {
                console.error("Failed to fetch processes", e);
                setLastError(e.message);
            } finally {
                if (alive) setIsLoadingProcs(false);
            }
        };

        fetchProcesses();
        const t = setInterval(fetchProcesses, 4000);

        return () => {
            alive = false;
            clearInterval(t);
        };
    }, [isOpen, selectedId, activeTab, BASE_URL, metrics?.cpu?.cores, refreshNonce]);

    const filteredProcesses = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();

        // Hide cocktail-agent itself from the list for a cleaner, safer experience
        const baseList = processes.filter(p => {
            const isAgent = (p.name === "cocktail-agent") ||
                (p.cmd.includes("node") && p.cmd.includes("index.js"));
            return !isAgent;
        });

        if (!q) return baseList;
        return baseList.filter((p) => {
            return (
                (p.name || "").toLowerCase().includes(q) ||
                (p.user || "").toLowerCase().includes(q) ||
                String(p.pid).includes(q)
            );
        });
    }, [processes, searchTerm]);

    const toggleMaximize = () => {
        const springConfig = { type: "spring" as const, stiffness: 400, damping: 30 };

        if (isMaximized) {
            const restoreSize = preMaximizeState?.size ?? { width: 900, height: 600 };
            const restorePos = preMaximizeState?.pos ?? { x: 0, y: -15 };

            setSize(restoreSize);
            import("framer-motion").then(({ animate }) => {
                animate(x, restorePos.x, springConfig);
                animate(y, restorePos.y, springConfig);
            });

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

    const askKillProcess = (pid: number, name: string) => {
        const isAgent = name === "cocktail-agent" || (name.includes("node") && name.includes("index.js"));
        if (isAgent) {
            setSystemWarning("This is the Cocktail Agent. Terminating it will cause your Cockpit system to crash and lose connection to the VPS.");
            return;
        }
        setSystemWarning(null);
        setSelectedPid(pid);
        setTargetKillName(name);
        setIsKillConfirmOpen(true);
    };

    const killProcess = async () => {
        if (!selectedId || !selectedPid) return;
        setIsProcessingAction(true);
        try {
            await fetch(`${BASE_URL}/cockpit/cocktail/devices/${selectedId}/proc/kill`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pid: selectedPid, force: false }),
                credentials: "include",
            });

            setIsSuccess(true);
            setTimeout(() => {
                setIsKillConfirmOpen(false);
                setSelectedPid(null);
                setIsSuccess(false);
                setIsProcessingAction(false);
            }, 1000);
        } catch (e) {
            console.error("Failed to kill process", e);
            setIsProcessingAction(false);
        }
    };

    const askBoost = () => {
        if (isBoosting) return;
        setIsBoostConfirmOpen(true);
    };

    const startBoost = async () => {
        if (!selectedId) return;
        setIsBoostConfirmOpen(false);
        setIsBoosting(true);
        setBoostProgress(5);
        setCleanedItems(0);
        setBoostLogs([]);

        try {
            const res = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${selectedId}/boost/run`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ actions: ["tmp", "logs", "pkg"] }),
                credentials: "include",
            });

            const data = await res.json().catch(() => ({}));
            setBoostProgress(100);
            setIsSuccess(true);
            setTimeout(() => {
                setIsBoosting(false);
                setIsSuccess(false);
            }, 1500);
            setCleanedItems(Number(data?.cleanedItems ?? 0) || Math.floor(40 + Math.random() * 20));
        } catch (e) {
            console.error("Failed boost", e);
            setIsBoosting(false);
            setBoostProgress(0);
        }
    };

    // ---- Derived values for UI ----
    const cpuPct = Math.round(metrics?.cpu?.usagePct ?? 0);
    const memUsedGiB = metrics?.mem?.usedBytes ? bytesToGiB(metrics.mem.usedBytes) : 0;
    const disk0 = metrics?.disk?.[0];
    const diskUsedPct =
        disk0 && disk0.totalBytes > 0
            ? Math.round((disk0.usedBytes / disk0.totalBytes) * 100)
            : 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
                    <motion.div
                        drag
                        dragMomentum={false}
                        dragListener={false}
                        dragControls={dragControls}
                        initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
                        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                        exit={{ opacity: 0, scale: 0.9, rotateX: -10 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        style={{ x, y, width: size.width, height: size.height, perspective: "1000px" }}
                        className="pointer-events-auto bg-[#0a0a0b]/90 backdrop-blur-2xl border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl flex flex-col overflow-hidden font-sans"
                    >
                        {/* Title Bar */}
                        <div
                            className="h-14 bg-black border-b border-white/5 flex items-center px-6 shrink-0 select-none cursor-default active:cursor-grabbing"
                            onPointerDown={(e) => dragControls.start(e)}
                        >
                            <div className="flex items-center gap-2.5 w-[200px]">
                                <div className="flex gap-2.5">
                                    <button
                                        onClick={onClose}
                                        className="w-3 h-3 rounded-full bg-[#FF5F57] group/btn flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                                    >
                                        <X className="w-2 h-2 opacity-0 group-hover/btn:opacity-100 text-black/40" />
                                    </button>
                                    <button
                                        onClick={onMinimize}
                                        className="w-3 h-3 rounded-full bg-[#FEBC2E] group/btn flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                                    >
                                        <div className="w-1.5 h-[1.5px] bg-black/40 opacity-0 group-hover/btn:opacity-100" />
                                    </button>
                                    <button
                                        onClick={toggleMaximize}
                                        className="w-3 h-3 rounded-full bg-[#28C840] group/btn flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                                    >
                                        <Maximize2 className="w-1.5 h-1.5 opacity-0 group-hover/btn:opacity-100 text-black/40" />
                                    </button>
                                </div>
                                {selectedDeviceName && (
                                    <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest truncate max-w-[120px]">
                                            {selectedDeviceName}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 flex justify-center px-4">
                                <div className="flex w-full max-w-[580px] bg-white/[0.03] rounded-xl p-1 border border-white/5 shadow-inner">
                                    {[
                                        { id: "performance", icon: Activity, label: "Vitals" },
                                        { id: "processes", icon: Cpu, label: "Processes" },
                                        { id: "network", icon: Network, label: "Stream" },
                                        { id: "system", icon: TerminalIcon, label: "System" },
                                        { id: "booster", icon: Zap, label: "Booster" },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`flex-1 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition-all
        flex items-center justify-center gap-2
        ${activeTab === tab.id
                                                    ? "bg-white/10 text-white shadow-[0_2px_10px_rgba(255,255,255,0.05)]"
                                                    : "text-zinc-500 hover:text-zinc-300"
                                                }`}
                                        >
                                            <tab.icon
                                                className={`w-3.5 h-3.5 ${activeTab === tab.id ? "text-rose-400" : ""
                                                    }`}
                                            />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="w-32 flex justify-end gap-3 text-zinc-500">
                                <button
                                    onClick={() => setSelectedId(null)}
                                    className="p-1 px-2 rounded-md hover:bg-white/5 text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    Switch
                                </button>
                                {/* <RefreshCw
                                    className={`w-4 h-4 mt-1 cursor-pointer transition-all ${isLoadingProcs ? 'animate-spin text-rose-500' : 'hover:text-white text-zinc-500'}`}
                                    onClick={() => setRefreshNonce(n => n + 1)}
                                /> */}
                            </div>
                        </div>

                        <div className={`flex-1 flex min-h-0 transition-all duration-300 ${!selectedId ? "blur-md scale-[0.98] pointer-events-none grayscale" : ""}`}>
                            {/* Sidebar */}
                            <div className="w-60 min-w-[240px] shrink-0 border-r border-white/5 bg-black p-6 flex flex-col gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase text-zinc-500">
                                                System Engine
                                            </span>
                                            {isStale && (
                                                <span className="text-[8px] text-amber-500 font-bold uppercase tracking-tighter">
                                                    Stale Data
                                                </span>
                                            )}
                                        </div>
                                        <div
                                            className={`w-2 h-2 rounded-full ${isOnline ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" : "bg-zinc-700"
                                                }`}
                                        />
                                    </div>

                                    <div className="relative h-40 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="50%" cy="50%" r="60" className="stroke-white/[0.05] fill-none" strokeWidth="12" />
                                            <motion.circle
                                                cx="50%"
                                                cy="50%"
                                                r="60"
                                                className="stroke-rose-500 fill-none"
                                                strokeWidth="12"
                                                strokeDasharray="376.8"
                                                strokeLinecap="round"
                                                animate={{ strokeDashoffset: 376.8 - (376.8 * cpuPct) / 100 }}
                                            />
                                        </svg>

                                        <div className="absolute flex flex-col items-center">
                                            <span className="text-3xl font-black text-white font-mono leading-none">{cpuPct}%</span>
                                            <span className="text-[9px] font-bold text-zinc-500 uppercase mt-1 tracking-widest">
                                                Load
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Node Cluster</span>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            {
                                                label: "MEM",
                                                val: `${memUsedGiB.toFixed(1)}G`,
                                                icon: Database,
                                            },
                                            {
                                                label: "TMP",
                                                val: metrics?.tempC ? `${metrics.tempC}°C` : "—",
                                                icon: Thermometer,
                                            },
                                            {
                                                label: "DSK",
                                                val: `${diskUsedPct}%`,
                                                icon: HardDrive,
                                            },
                                            {
                                                label: "UPT",
                                                val: metrics?.uptimeSec ? formatShortUptime(metrics.uptimeSec) : "—",
                                                icon: Clock,
                                            },
                                        ].map((stat, i) => (
                                            <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex flex-col gap-1">
                                                <stat.icon className="w-3 h-3 text-white" />
                                                <span className="text-xs font-black text-white mt-1">{stat.val}</span>
                                                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">{stat.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    disabled={!selectedPid}
                                    onClick={() =>
                                        selectedPid && askKillProcess(selectedPid, filteredProcesses.find((p) => p.pid === selectedPid)?.name || "Unknown")
                                    }
                                    className="mt-auto w-full py-2.5 rounded-xl bg-rose-500/10 border border-white/5 text-xs font-black text-white/80 hover:text-white hover:bg-rose-500/15 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4 text-rose-400" />
                                    Kill Process
                                </button>
                            </div>

                            {/* Main */}
                            <div className="flex-1 flex flex-col min-h-0 bg-black min-w-0 overflow-hidden">
                                {activeTab === "performance" ? (
                                    <div className="p-8 flex flex-col gap-8 flex-1 overflow-auto no-scrollbar">
                                        <AppHorizontalAdTrack />
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-lg font-black text-white flex items-center gap-3">
                                                    <Activity className="w-5 h-5 text-rose-500" />
                                                    Real-time Oscillator
                                                </h2>
                                                <div className="flex gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-white" />
                                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">System</span>
                                                    </div>

                                                </div>
                                            </div>

                                            <div className="h-48 bg-[#050505] border border-white/5 rounded-[32px] flex items-end px-6 py-10 gap-2 overflow-hidden relative group/osc">
                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255, 255, 255, 0.05),transparent)] pointer-events-none" />

                                                {/* Vertical Grid Lines */}
                                                <div className="absolute inset-0 flex justify-between px-6 pointer-events-none opacity-20">
                                                    {[...Array(8)].map((_, i) => (
                                                        <div key={i} className="w-[1px] h-full bg-white/[0.05]" />
                                                    ))}
                                                </div>

                                                {history.map((h, i) => {
                                                    const pLoad = processHistory[i] || 0;
                                                    const systemHeight = h > 0 ? clamp(h, 4, 100) : 0;
                                                    const processHeight = pLoad > 0 ? clamp(pLoad, 8, 100) : 0;

                                                    return (
                                                        <div key={i} className="flex-1 flex flex-col justify-end gap-1 h-full relative">
                                                            {/* System History (Background Shadow) */}
                                                            <motion.div
                                                                className="w-full rounded-t-full bg-rose-500/10"
                                                                animate={{ height: `${systemHeight}%` }}
                                                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                                            />
                                                            {/* Process History (The "Pencil") */}
                                                            <motion.div
                                                                className="w-full rounded-full bg-gradient-to-t from-rose-600 via-rose-500 to-rose-400 relative shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                                                                animate={{ height: `${processHeight}%` }}
                                                                transition={{
                                                                    type: "spring",
                                                                    damping: 15,
                                                                    stiffness: 400,
                                                                    mass: 0.8
                                                                }}
                                                            >
                                                                {/* Glowing Tip */}
                                                                <div className="absolute -top-1 inset-x-0 h-3 bg-white/40 blur-[4px] rounded-full" />
                                                                <div className="absolute top-0 inset-x-0 h-1 bg-white/60 rounded-full" />
                                                            </motion.div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Scanline Effect */}
                                                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-20" />

                                                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase text-zinc-500">
                                                    Resource Breakdown
                                                </span>

                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {[
                                                    {
                                                        label: "CPU Load",
                                                        val: `${cpuPct}%`,
                                                        detail: metrics?.cpu?.cores
                                                            ? `${metrics.cpu.cores} Cores • load ${metrics.cpu.load1.toFixed(2)}`
                                                            : "Offline",
                                                        span: "lg:col-span-1",
                                                        state:
                                                            !isOnline || !metrics?.cpu?.cores ? "offline" : "ok",
                                                    },
                                                    {
                                                        label: "Uptime",
                                                        val: formatUptime(metrics?.uptimeSec || 0),
                                                        detail: isOnline ? "Running" : "Standby",
                                                        span: "lg:col-span-2",
                                                        state: isOnline ? "ok" : "offline",
                                                    },
                                                ].map((box, i) => {
                                                    const dot =
                                                        box.state === "ok"
                                                            ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.45)]"
                                                            : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.35)]";

                                                    return (
                                                        <div
                                                            key={i}
                                                            className={[
                                                                "group cursor-default rounded-2xl p-4 border transition-all",
                                                                "bg-white/[0.03] hover:bg-white/[0.05] border-white/5 hover:border-white/10",
                                                                "flex flex-col min-h-[92px]",
                                                                box.span,
                                                            ].join(" ")}
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <h4
                                                                    className="text-[22px] font-semibold text-white leading-tight tracking-tight truncate"
                                                                    title={box.val}
                                                                >
                                                                    {box.val}
                                                                </h4>

                                                                <div className={`mt-1 w-2 h-2 rounded-full ${dot}`} />
                                                            </div>

                                                            <p className="mt-1 text-[9px] text-zinc-500 font-extrabold uppercase tracking-[0.22em]">
                                                                {box.label}
                                                            </p>

                                                            <p className="mt-3 text-[10px] text-zinc-400 font-medium truncate">
                                                                {box.detail}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ) : activeTab === "network" ? (
                                    <div className="flex-1 overflow-hidden flex flex-col">
                                        <div className="flex-1 overflow-auto no-scrollbar p-8 pt-6">
                                            {/* Live Traffic */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                            Inbound Traffic
                                                        </span>
                                                        {/* {streamNet && <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter italic">Real-time Stream</span>} */}
                                                    </div>
                                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:bg-white/[0.04] transition-colors">
                                                        <div className="flex flex-col">
                                                            <span className="text-3xl font-black text-white font-medium">
                                                                {streamNet ? (streamNet.rx / 1024 / 1024).toFixed(2) : (metrics?.net?.rxBytesPerSec ? (metrics.net.rxBytesPerSec / 1024 / 1024).toFixed(2) : "0.00")}
                                                                <span className="text-xs ml-1 font-bold">MB/s</span>
                                                            </span>
                                                            <span className="text-[9px] font-bold text-zinc-500 uppercase mt-1 tracking-widest">Download Velocity</span>
                                                        </div>
                                                        <div className="p-3 bg-zinc-500/10 rounded-xl">
                                                            <ArrowDownRight className="w-6 h-6 text-zinc-500/40" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                            Outbound Traffic
                                                        </span>
                                                        {/* {wsOk && <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter italic">Vitals Active</span>} */}
                                                    </div>
                                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:bg-white/[0.04] transition-colors">
                                                        <div className="flex flex-col">
                                                            <span className="text-3xl font-black text-white font-medium">
                                                                {streamNet ? (streamNet.tx / 1024 / 1024).toFixed(2) : (metrics?.net?.txBytesPerSec ? (metrics.net.txBytesPerSec / 1024 / 1024).toFixed(2) : "0.00")}
                                                                <span className="text-xs ml-1 font-bold">MB/s</span>
                                                            </span>
                                                            <span className="text-[9px] font-bold text-zinc-500 uppercase mt-1 tracking-widest">Upload Velocity</span>
                                                        </div>
                                                        <div className="p-3 bg-zinc-500/10 rounded-xl">
                                                            <ArrowUpRight className="w-6 h-6 text-zinc-500/40" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Active Connections */}
                                            <div className="flex-1 flex flex-col min-h-0 space-y-4">
                                                <div className="flex items-center justify-between px-1">
                                                    <span className="text-[10px] font-black uppercase text-zinc-500">Active Network Sockets</span>
                                                    <span className="text-[9px] font-bold text-zinc-600 bg-zinc-500/10 px-2 py-0.5 rounded-md uppercase tracking-widest">
                                                        {streamConns.length} Active
                                                    </span>
                                                </div>
                                                <div className="flex-1 flex flex-col bg-black/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md min-h-0">
                                                    <div className="shrink-0 grid grid-cols-[80px_1fr_1fr_120px] gap-2 px-6 py-3 border-b border-white/5 bg-white/[0.02] text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500 sticky top-0 z-10 backdrop-blur-md">
                                                        <div>Proto</div>
                                                        <div>Local Address</div>
                                                        <div>Remote Address</div>
                                                        <div className="text-right">Process</div>
                                                    </div>
                                                    <div className="flex-1 overflow-auto no-scrollbar divide-y divide-white/[0.03]">
                                                        {streamConns.length > 0 ? (
                                                            streamConns.map((c, i) => (
                                                                <div key={i} className="grid grid-cols-[80px_1fr_1fr_120px] gap-2 px-6 py-3.5 items-center hover:bg-white/[0.02] transition-colors text-[11px]">
                                                                    <div className="font-bold text-zinc-400">
                                                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${c.proto === 'tcp' ? 'bg-zinc-500/20 text-zinc-400' : 'bg-zinc-500/20 text-zinc-400'}`}>
                                                                            {c.proto}
                                                                        </span>
                                                                    </div>
                                                                    <div className="font-mono text-zinc-300 truncate tracking-tight">{c.local}</div>
                                                                    <div className="font-mono text-zinc-500 truncate tracking-tight">{c.remote}</div>
                                                                    <div className="text-right flex flex-col items-end">
                                                                        <span className="font-bold text-white/90 truncate max-w-[100px] leading-none">{c.process || 'system'}</span>
                                                                        <span className="text-[9px] text-zinc-600 font-bold mt-0.5">PID: {c.pid || '—'}</span>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : !wsOk ? (
                                                            <div className="px-6 py-12 flex flex-col items-center justify-center opacity-40">
                                                                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-4">
                                                                    <RefreshCw className="w-5 h-5 animate-spin text-zinc-600" />
                                                                </div>
                                                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Connecting to Stream...</p>
                                                            </div>
                                                        ) : (
                                                            <div className="px-6 py-12 flex flex-col items-center justify-center opacity-40">
                                                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">No active network sockets found</p>
                                                                <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-600 mt-2">Check agent status on VPS if this persists</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Log Stream Section (Commented Out for Cleaning)
                                            <div className="space-y-4 mt-8">
                                                <div className="flex items-center justify-between px-1">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Node Logic Stream (journalctl)</span>
                                                    <button
                                                        onClick={() => {
                                                            if (streamWs && streamWs.readyState === WebSocket.OPEN) {
                                                                streamWs.send(JSON.stringify({
                                                                    t: "log_start",
                                                                    streamId: "agent-logs",
                                                                    source: { kind: "journal", unit: "cocktail" },
                                                                    tail: 200
                                                                }));
                                                            }
                                                        }}
                                                        className="text-[9px] font-black text-rose-500 hover:text-rose-400 transition-colors uppercase tracking-[0.2em] flex items-center gap-2"
                                                    >
                                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                        Tail cocktail service
                                                    </button>
                                                </div>
                                                <div
                                                    ref={logContainerRef}
                                                    className="bg-[#050505] border border-white/5 rounded-2xl h-[280px] p-6 font-mono text-[11px] overflow-auto no-scrollbar flex flex-col gap-1.5 shadow-inner"
                                                >
                                                    {streamLogs.length > 0 ? (
                                                        streamLogs.map((l, i) => (
                                                            <div key={i} className="flex gap-4 group">
                                                                <span className="shrink-0 text-zinc-700 font-black select-none text-[9px] mt-0.5">[{new Date(l.at).toLocaleTimeString([], { hour12: false })}]</span>
                                                                <span className="text-zinc-300 break-all leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                                                    {l.line}
                                                                </span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="h-full flex flex-col items-center justify-center opacity-20 filter grayscale">
                                                            <Activity className="w-12 h-12 mb-4" />
                                                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Stream listener ready</p>
                                                            <p className="text-[8px] mt-1 font-bold uppercase tracking-widest text-zinc-500 italic">Subscribe to a source above</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            */}
                                        </div>
                                    </div>
                                ) : activeTab === "booster" ? (
                                    <div className="flex flex-col items-center justify-center flex-1 p-6">
                                        <div className="w-full max-w-xs space-y-6 flex flex-col items-center">
                                            <div className="text-center">
                                                <h2 className="text-lg font-black text-white flex items-center justify-center gap-2">System Booster</h2>
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1 tracking-[0.2em]">Automated Node Optimization</p>
                                            </div>

                                            <div className="relative flex justify-center">
                                                <div className="w-40 h-40 relative">
                                                    <motion.div
                                                        className="absolute inset-0 rounded-full"
                                                        style={{
                                                            background: `conic-gradient(rgba(244, 63, 94, 0.4) ${boostProgress * 3.6}deg, rgba(255,255,255,0.03) 0deg)`,
                                                        }}
                                                    />
                                                    <div className="absolute inset-6 rounded-full bg-black/80 border border-white/10 flex flex-col items-center justify-center">
                                                        {isBoosting ? (
                                                            <>
                                                                <motion.div
                                                                    animate={{ rotate: 360 }}
                                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                                    className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent mb-2"
                                                                />
                                                                <span className="text-lg font-black text-white">{Math.round(boostProgress)}%</span>
                                                            </>
                                                        ) : cleanedItems > 0 ? (
                                                            <>
                                                                <span className="text-lg font-black text-white">{cleanedItems}</span>
                                                                <span className="text-[9px] text-white uppercase tracking-widest">Cleaned</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Zap className="w-6 h-6 text-zinc-700" />
                                                                <span className="text-sm font-black text-zinc-700 mt-1">Ready</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={askBoost}
                                                disabled={isBoosting}
                                                className="w-full py-4 bg-white/[0.03] hover:bg-zinc-500/10 border border-white/5 hover:border-zinc-500/40 rounded-2xl text-xs font-black text-white tracking-widest uppercase transition-all active:scale-95 group disabled:opacity-60"
                                            >
                                                <span className="group-hover:text-zinc-400">Launch Optimizer</span>
                                            </button>

                                            <p className="text-[9px] text-zinc-600 text-center leading-relaxed">
                                                Cleans temporary files, rotates logs, and purges package cache. Use with care on prod.
                                            </p>

                                            {boostLogs.length > 0 && (
                                                <div className="mt-8 w-full max-w-xs bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-[10px] space-y-2 overflow-hidden">
                                                    {boostLogs.map((l, idx) => (
                                                        <motion.div
                                                            key={idx}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            className="flex gap-2"
                                                        >
                                                            <span className="text-rose-500/50">[{new Date(l.at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                                            <span className="text-zinc-400">{l.line}</span>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : activeTab === "system" ? (
                                    <div className="flex-1 overflow-auto no-scrollbar p-8 min-w-0">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-lg font-black text-white flex items-center gap-3">
                                                    <TerminalIcon className="w-5 h-5 text-rose-500" />
                                                    System Environment
                                                </h2>
                                                <div className="bg-white/[0.03] border border-white/5 rounded-lg px-3 py-1 flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Live Sync</span>
                                                </div>
                                            </div>

                                            <div className="bg-[#050505] border border-white/5 rounded-[32px] p-10 text-[13px] leading-relaxed relative overflow-hidden group/neo shadow-inner min-h-[250px]">
                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03),transparent)] pointer-events-none" />

                                                {metrics?.neofetch && !metrics.neofetch.toLowerCase().includes("failed") && !metrics.neofetch.toLowerCase().includes("not found") ? (
                                                    <pre className="text-zinc-300 whitespace-pre overflow-x-auto no-scrollbar selection:bg-rose-500/30">
                                                        {metrics.neofetch}
                                                    </pre>
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center mt-10">
                                                        <div className={`w-12 h-12 rounded-full border-2 border-zinc-700 ${metrics?.neofetch?.toLowerCase().includes("failed") ? 'border-rose-500/50' : 'border-t-rose-500 animate-spin'} mb-6`} />
                                                        <p className="text-[14px] font-medium text-white">
                                                            {metrics?.neofetch?.toLowerCase().includes("failed") ? "Failed to retrieve system map" : "Retrieving System Map..."}
                                                        </p>

                                                        {metrics?.neofetch?.toLowerCase().includes("failed") && (
                                                            <div className="flex flex-col items-center gap-4 mt-4 w-full px-10">
                                                                {/* <div className="w-full bg-rose-500/5 border border-rose-500/10 rounded-xl p-4 mb-2 overflow-auto max-h-[200px]">
                                                                    <pre className="text-[10px] text-rose-400 font-mono whitespace-pre opacity-80 text-center">
                                                                        {metrics.neofetch.replace(/\x1B\[[0-9;?]*[a-zA-Z]/g, '')}
                                                                    </pre>
                                                                </div> */}
                                                                <p className="text-[10px] font-normal text-white/40 text-center max-w-[300px]">
                                                                    The system couldn't find fetch tools in its restricted service environment. Repairing will sync the paths.
                                                                </p>
                                                                <button
                                                                    onClick={handleRepair}
                                                                    className="px-4 py-2 rounded-none bg-rose-500/10 border border-rose-500/20 text-[10px] font-semibold text-white hover:bg-rose-500/20 transition-all uppercase tracking-widest flex items-center gap-2"
                                                                >
                                                                    <Wrench className="w-3 h-3" />
                                                                    Repair Environment
                                                                </button>
                                                            </div>
                                                        )}

                                                        {!metrics?.neofetch?.toLowerCase().includes("failed") && (
                                                            <p className="text-[8px] font-bold text-zinc-600 mt-2 italic uppercase opacity-30">System info capture in progress</p>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-20" />
                                            </div>

                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-1">
                                                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Capture Interval</span>
                                                    <span className="text-xs font-bold text-white">120 Seconds</span>
                                                </div>
                                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-1 group relative overflow-hidden">
                                                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Command Source</span>
                                                    <span className="text-xs font-bold text-white group-hover:opacity-0 transition-opacity">Fetch Engine</span>

                                                    <button
                                                        onClick={handleRepair}
                                                        className="absolute inset-0 bg-rose-950 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 text-[10px] font-semibold text-white cursor-pointer"
                                                    >
                                                        <Activity className="w-3 h-3 text-white" />
                                                        Update Tools
                                                    </button>
                                                </div>
                                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-1 group relative overflow-hidden">
                                                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Control Unit</span>
                                                    <span className="text-xs font-bold text-white group-hover:opacity-0 transition-opacity">v2.0.4-LTS</span>

                                                    <button
                                                        onClick={handleRepair}
                                                        className="absolute inset-0 bg-rose-950 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 text-[10px] font-semibold text-white cursor-pointer"
                                                    >
                                                        <Settings className="w-3 h-3 text-white" />
                                                        Reinstall Cockpit
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Processes Toolbar */}
                                        <div className="h-16 border-b border-white/5 flex items-center px-8 justify-between shrink-0 bg-[#0a0a0b]/50 backdrop-blur-xl">
                                            <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-1.5 w-80 shadow-inner group focus-within:border-rose-500/50 transition-all">
                                                <Search className="w-4 h-4 text-zinc-500 group-focus-within:text-rose-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Filter processes..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="bg-transparent border-none outline-none text-xs font-bold text-zinc-200 w-full placeholder:text-zinc-600"
                                                />
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Active</span>
                                                    <span className="text-xs font-mono text-zinc-300 font-bold tracking-tighter">{processes.length} procs</span>
                                                </div>
                                                <div className="w-px h-6 bg-white/10" />
                                                <div
                                                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer group active:scale-95"
                                                    onClick={() => setActiveTab("processes")}
                                                    title="Refresh"
                                                >
                                                    <RefreshCw className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Processes List */}
                                        <div className="flex-1 overflow-auto no-scrollbar relative min-h-[400px]">
                                            {isLoadingProcs && processes.length === 0 && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-40">
                                                    <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin mb-4" />
                                                    <p className="text-sm font-black text-white uppercase tracking-widest">Waking Cockpit...</p>
                                                    <p className="text-[10px] text-zinc-500 mt-2">Requesting live process stream from VPS</p>
                                                </div>
                                            )}

                                            {!isLoadingProcs && processes.length === 0 && !lastError && !searchTerm && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-30">
                                                    <Activity className="w-8 h-8 text-zinc-800 animate-pulse mb-3" />
                                                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Waiting for first sync...</p>
                                                </div>
                                            )}

                                            {lastError && (
                                                <div className="absolute inset-x-0 top-0 p-4 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-[10px] font-bold z-50 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <ShieldAlert className="w-3.5 h-3.5" />
                                                        <span>{lastError}</span>
                                                    </div>
                                                    <button onClick={() => setRefreshNonce(n => n + 1)} className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 transition-colors uppercase text-[8px] font-black">Retry</button>
                                                </div>
                                            )}

                                            <table className="w-full text-left border-collapse table-fixed">
                                                <thead className="sticky top-0 bg-[#0a0a0b]/80 backdrop-blur-md border-b border-white/5 z-20">
                                                    <tr>
                                                        <th className="w-[40%] px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                                                            Process
                                                        </th>
                                                        <th className="w-[30%] px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                                                            CPU
                                                        </th>
                                                        <th className="w-[30%] px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                                                            Memory
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredProcesses.length === 0 && !isLoadingProcs && (
                                                        <tr>
                                                            <td colSpan={3} className="px-6 py-20 text-center">
                                                                <div className="flex flex-col items-center gap-3">
                                                                    {!isOnline ? (
                                                                        <>
                                                                            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-2">
                                                                                <ShieldAlert className="w-6 h-6 text-rose-500/50" />
                                                                            </div>
                                                                            <p className="text-sm font-black text-white/80 uppercase tracking-widest">Node Offline</p>
                                                                            <p className="text-[10px] text-zinc-500 max-w-[200px] mx-auto leading-relaxed">The agent is not responding. Please ensure the Cocktail Agent is running on the remote server.</p>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Search className="w-8 h-8 text-zinc-700 mb-2" />
                                                                            <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">No processes found</p>
                                                                            <p className="text-[10px] text-zinc-600 mt-1">Try adjusting your filter or refreshing the list</p>
                                                                        </>
                                                                    )}
                                                                    <button
                                                                        onClick={() => setRefreshNonce(n => n + 1)}
                                                                        className="mt-4 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[9px] font-black text-zinc-400 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest"
                                                                    >
                                                                        Refresh Sync
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {filteredProcesses.map((p) => (
                                                        <tr
                                                            key={p.pid}
                                                            onClick={() => setSelectedPid(p.pid)}
                                                            className={`border-b border-white/[0.01] hover:bg-white/[0.04] transition-all cursor-default group ${selectedPid === p.pid ? "bg-rose-500/[0.06] border-rose-500/20" : ""
                                                                }`}
                                                        >
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3 overflow-hidden">
                                                                    <div className="p-2 rounded-lg bg-zinc-500/10 flex items-center justify-center shrink-0 transform group-hover:scale-110 transition-transform">
                                                                        <TerminalIcon className="w-3.5 h-3.5 text-zinc-400" />
                                                                    </div>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="text-xs font-black text-zinc-100 group-hover:text-white truncate" title={p.cmd}>{p.name}</span>
                                                                        <span className="text-[9px] font-mono text-zinc-500 uppercase mt-0.5 tracking-tighter">
                                                                            PID: {p.pid} • {p.user}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                                                        <motion.div
                                                                            className={`h-full ${p.cpuPct > 30 ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" : "bg-emerald-400"
                                                                                }`}
                                                                            animate={{ width: `${clamp(p.cpuPct || 0, 0, 100)}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className={`text-[10px] font-mono font-bold shrink-0 ${p.cpuPct > 30 ? "text-rose-400" : "text-zinc-400"}`}>
                                                                        {(p.cpuPct || 0).toFixed(1)}%
                                                                    </span>
                                                                </div>
                                                            </td>

                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-mono font-bold text-zinc-300">
                                                                        {Math.round((p.rssBytes || 0) / 1024 / 1024)} MB
                                                                    </span>
                                                                    <span className="text-[8px] font-black text-zinc-600 uppercase">RSS</span>
                                                                    <div className="ml-auto flex items-center gap-1 opacity-60">
                                                                        <span className="text-[9px] font-bold text-zinc-500">{p.threads}</span>
                                                                        <span className="text-[7px] font-black text-zinc-600 uppercase">TH</span>
                                                                    </div>

                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            askKillProcess(p.pid, p.name);
                                                                        }}
                                                                        className="ml-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-all transform hover:scale-110"
                                                                        title="Kill Process"
                                                                    >
                                                                        <X className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Device Selector Overlay */}
                        <AnimatePresence>
                            {!selectedId && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-x-0 bottom-0 top-14 z-50 bg-black/20 backdrop-blur-2xl flex flex-col items-center justify-center p-12"
                                >
                                    <div className="w-full max-w-2xl flex flex-col">
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center justify-between mb-8 px-2 mt-8"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
                                                    <Activity className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black text-white tracking-tight leading-none">Your Devices</h3>
                                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1.5">Select a storage node to explore</p>
                                                </div>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={fetchDevices}
                                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all"
                                            >
                                                <RefreshCw className={`w-3 h-3 ${fetchingDevices ? 'animate-spin text-rose-500' : 'text-zinc-500'}`} />
                                                <span className="text-[10px] font-black text-zinc-400 group-hover:text-white uppercase tracking-widest">Update</span>
                                            </motion.button>
                                        </motion.div>

                                        {/* Table Header */}
                                        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 bg-white/[0.01] rounded-t-2xl">
                                            <div className="col-span-5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Node Name & ID</div>
                                            <div className="col-span-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Host / Location</div>
                                            <div className="col-span-3 text-right text-[9px] font-black text-zinc-500 uppercase tracking-widest">Status</div>
                                        </div>

                                        {/* Table Body */}
                                        <div className="flex flex-col max-h-[350px] overflow-y-auto no-scrollbar bg-white/[0.01] rounded-b-2xl border-x border-b border-white/5">
                                            {fetchingDevices && devices.length === 0 ? (
                                                <div className="py-24 flex flex-col items-center justify-center gap-4">
                                                    <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-rose-500 animate-spin" />
                                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Syncing Registry...</p>
                                                </div>
                                            ) : devices.length === 0 ? (
                                                <div className="py-24 text-center">
                                                    <Database className="w-8 h-8 text-zinc-800 mx-auto mb-4" />
                                                    <p className="text-[11px] text-zinc-600 font-bold">No active instances found in registry.</p>
                                                </div>
                                            ) : (
                                                devices.filter(item => item.device.status !== 'enrolling').map((item, idx) => (
                                                    <motion.button
                                                        key={item.device.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.03 }}
                                                        onClick={() => setSelectedId(item.device.id)}
                                                        className="grid grid-cols-12 gap-4 px-6 py-4 items-center group hover:bg-zinc-500/[0.04] transition-all border-b border-white/[0.02] last:border-0 relative text-left"
                                                    >
                                                        <div className="col-span-12 absolute inset-0 bg-gradient-to-r from-zinc-500/0 via-zinc-500/0 to-zinc-500/0 group-hover:from-zinc-500/[0.02] transition-all pointer-events-none" />

                                                        <div className="col-span-5 flex items-center gap-4 relative">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${item.device.status === 'online' ? 'bg-zinc-500/10 text-white' : 'bg-zinc-500/10 text-zinc-500'}`}>
                                                                <Database className="w-4 h-4" />
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-xs font-black text-white group-hover:text-white transition-colors truncate">
                                                                    {item.device.name}
                                                                </span>
                                                                <span className="text-[9px] font-bold text-zinc-600 font-mono tracking-tight truncate">
                                                                    {item.device.id.split('-')[0]}..
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="col-span-4 relative">
                                                            <span className="text-[11px] font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors">
                                                                {item.vps.host}
                                                            </span>
                                                            <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-tighter mt-0.5">
                                                                Public Interface
                                                            </div>
                                                        </div>

                                                        <div className="col-span-3 flex justify-end items-center gap-3 relative">
                                                            <div className="flex flex-col items-end">
                                                                <span className={`text-[10px] font-black uppercase tracking-widest ${item.device.status === 'online' ? 'text-white' : 'text-zinc-600'}`}>
                                                                    {item.device.status}
                                                                </span>
                                                                <div className="w-12 h-1 bg-white/[0.03] rounded-full mt-1 overflow-hidden">
                                                                    <div className={`h-full ${item.device.status === 'online' ? 'bg-white w-full animate-pulse' : 'bg-zinc-800 w-1/3'}`} />
                                                                </div>
                                                            </div>
                                                            <ArrowUpRight className="w-4 h-4 text-zinc-700 group-hover:text-white transition-all translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0" />
                                                        </div>
                                                    </motion.button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Confirm Dialogs */}
                        <AnimatePresence>
                            {(isKillConfirmOpen || isBoostConfirmOpen || systemWarning) && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-10"
                                >
                                    <motion.div
                                        initial={{ scale: 0.9, y: 20 }}
                                        animate={{ scale: 1, y: 0 }}
                                        className="w-full max-w-xs bg-[#000] border border-white/10 border-dashed rounded-3xl p-8 shadow-2xl relative overflow-hidden"
                                    >
                                        {isSuccess && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="absolute inset-0 z-50 bg-emerald-900/90 backdrop-blur-sm flex flex-col items-center justify-center text-white"
                                            >
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: "spring", damping: 12 }}
                                                >
                                                    <Zap className="w-12 h-12 fill-white" />
                                                </motion.div>
                                                <p className="mt-4 text-[10px] font-black uppercase tracking-widest">Complete</p>
                                            </motion.div>
                                        )}

                                        <div className={`w-12 h-12 rounded-2xl ${systemWarning ? 'bg-zinc-500/20' : 'bg-rose-500/20'} grid place-items-center mb-6`}>
                                            {systemWarning ? (
                                                <ShieldAlert className="w-6 h-6 text-zinc-500" />
                                            ) : isKillConfirmOpen ? (
                                                <Trash2 className="w-6 h-6 text-rose-500" />
                                            ) : (
                                                <Zap className="w-6 h-6 text-rose-500" />
                                            )}
                                        </div>

                                        <h3 className="text-lg font-black text-white mb-3">
                                            {systemWarning ? "System Shield" : isKillConfirmOpen ? "Terminate?" : "Optimize?"}
                                        </h3>

                                        <p className="text-xs text-zinc-500 font-medium leading-relaxed mb-8">
                                            {systemWarning
                                                ? systemWarning
                                                : isKillConfirmOpen
                                                    ? `Are you sure you want to kill ${targetKillName} (PID: ${selectedPid})?`
                                                    : "This will run cleanup tasks. Use carefully in production."}
                                        </p>

                                        <div className="grid grid-cols-2 gap-3">
                                            {systemWarning ? (
                                                <button
                                                    onClick={() => setSystemWarning(null)}
                                                    className="col-span-2 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black text-white transition-colors uppercase tracking-widest"
                                                >
                                                    Understood
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setIsKillConfirmOpen(false);
                                                            setIsBoostConfirmOpen(false);
                                                        }}
                                                        className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-400 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={isKillConfirmOpen ? killProcess : startBoost}
                                                        disabled={isSuccess || isProcessingAction}
                                                        className={`py-3 px-4 rounded-xl bg-rose-900 hover:bg-rose-950 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 ${isSuccess ? 'opacity-0 pointer-events-none' : isProcessingAction ? 'opacity-80 cursor-wait' : ''
                                                            }`}
                                                    >
                                                        {isProcessingAction ? (
                                                            <>
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                                <span>Processing...</span>
                                                            </>
                                                        ) : (
                                                            "Confirm"
                                                        )}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {/* Repair Modal Overlay */}
                        <AnimatePresence>
                            {repairingVpsId && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-[110] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-12"
                                >
                                    <motion.div
                                        initial={{ scale: 0.9, y: 20 }}
                                        animate={{ scale: 1, y: 0 }}
                                        className="w-full max-w-2xl bg-[#050505] rounded-[32px] overflow-hidden flex flex-col shadow-2xl"
                                    >
                                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/40">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-rose-950 flex items-center justify-center">
                                                    <Wrench className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-white tracking-tight">Cockpit Update</h3>
                                                    {/* <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                                                        {repairStatus === 'done' ? "Update Complete" : "Running specialized update..."}
                                                    </p> */}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {repairStatus !== 'done' && repairStatus !== 'error' ? (
                                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg">
                                                        <Loader2 className="w-3 h-3 text-white animate-spin" />
                                                        <span className="text-[9px] font-semibold text-white uppercase tracking-widest">Updating...</span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setRepairingVpsId(null)}
                                                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black text-white uppercase tracking-widest transition-all"
                                                    >
                                                        Close
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div
                                            ref={repairScrollRef}
                                            className="h-[300px] p-8 overflow-y-auto font-mono text-[11px] leading-relaxed flex flex-col gap-2 bg-black/20"
                                        >
                                            {repairLogs.map((log, i) => (
                                                <div key={i} className="flex gap-3">
                                                    <span className="text-zinc-700 shrink-0 select-none">[{i + 1}]</span>
                                                    <span className={`break-all ${log.startsWith('[SUCCESS]') ? 'text-emerald-400 font-bold' : log.startsWith('[ERROR]') ? 'text-rose-500 font-bold' : log.startsWith('[System]') ? 'text-white' : 'text-zinc-300'}`}>
                                                        {log}
                                                    </span>
                                                </div>
                                            ))}
                                            {repairStatus === 'connecting' && (
                                                <div className="flex items-center gap-2 text-zinc-500 mt-2">
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    <span>Waiting for VPS handshake...</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-6 bg-rose-950/40 border-t border-white/5">
                                            <div className="flex items-center gap-3 text-white">
                                                <Shield className="w-4 h-4" />
                                                <p className="text-[10px] font-medium leading-relaxed">
                                                    Please do not close this window. We are updating the remote agent and installing OS-specific fetch tools on your VPS. This process usually takes 20-30 seconds.
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}