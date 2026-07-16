"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    Apple,
    Wifi,
    WifiOff,
    BatteryLow,
    BatteryMedium,
    BatteryFull,
    PlugZap2,
    Search,
    ListFilter,
    Command,
    MonitorX,
    Activity,
    ChevronDown,
    Server,
    HardDrive,
    Network,
    Terminal,
    FolderOpen,
    Settings,
    Power,
    RefreshCw,
    Copy,
    ClipboardPaste,
    Scissors,
    Eye,
    EyeOff,
    ZoomIn,
    ZoomOut,
    Home,
    ArrowUp,
    ArrowDown,
    Minus,
    Square,
    X,
    ToggleLeft,
    ToggleRight,
    LucidePuzzle,
    Puzzle,
    Music2,
    Volume2,
    VolumeX,
    Maximize2,
} from "lucide-react";
import { LiquidGlass } from "@/components/common/liquid-glass";
import { BASE_URL } from "@/lib/baseURL";
import { forceCockpitLogout } from "@/lib/force-cockpit-logout";

interface MenubarProps {
    onCalendarClick?: () => void;
    onFinderClick?: () => void;
    onTerminalClick?: () => void;
    onSettingsClick?: () => void;
    onExplorerClick?: () => void;
    showFullMenus?: boolean;
    showSystemMonitor?: boolean;
    showSearch?: boolean;
    transparent?: boolean;
    /** Shimmer plan chip — only desktop `/home`; hidden on setup, login, reset-password, etc. */
    showPlanBadge?: boolean;
    showMusicExperience?: boolean;
    onMusicExperienceReady?: () => void;
}

interface MenuItem {
    label?: string;
    icon?: React.ReactNode;
    shortcut?: string;
    divider?: boolean;
    onClick?: () => void;
    disabled?: boolean;
}

export function Menubar({
    onCalendarClick,
    onFinderClick,
    onTerminalClick,
    onSettingsClick,
    onExplorerClick,
    showFullMenus = true,
    showSystemMonitor = true,
    showSearch = true,
    transparent = false,
    showPlanBadge = false,
    showMusicExperience = false,
    onMusicExperienceReady,
}: MenubarProps) {
    const [time, setTime] = useState<Date | null>(null);
    const [isOnline, setIsOnline] = useState(true);
    const [battery, setBattery] = useState<{
        level: number;
        charging: boolean;
        supported: boolean;
    }>({
        level: 100,
        charging: false,
        supported: false,
    });

    const [showDropdown, setShowDropdown] = useState(false);
    const [showMusicDropdown, setShowMusicDropdown] = useState(false);
    const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
    const [musicStatus, setMusicStatus] = useState<"checking" | "prompt" | "playing" | "paused" | "denied">("checking");
    const [musicExperienceReady, setMusicExperienceReady] = useState(!showMusicExperience);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const [cpuUsage, setCpuUsage] = useState(0);
    const [memoryUsage, setMemoryUsage] = useState(0);
    const [diskUsage, setDiskUsage] = useState(0);
    const [networkSpeed, setNetworkSpeed] = useState({ up: 0, down: 0 });

    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
    const [devices, setDevices] = useState<Array<{ id: string; name: string }>>([]);
    const [isVpsOnline, setIsVpsOnline] = useState(false);

    // Internet speed detection for browser
    const [internetSpeed, setInternetSpeed] = useState<{
        download: number;
        connectionType: string;
        effectiveType: string;
        testing: boolean;
    }>({
        download: 0,
        connectionType: "unknown",
        effectiveType: "4g",
        testing: false,
    });

    // Global copy/paste control
    const [copyEnabled, setCopyEnabled] = useState(false);
    const [pasteEnabled, setPasteEnabled] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize state from localStorage
    useEffect(() => {
        const savedCopy = localStorage.getItem('cockpit_copyEnabled');
        if (savedCopy !== null) setCopyEnabled(savedCopy === 'true');

        const savedPaste = localStorage.getItem('cockpit_pasteEnabled');
        if (savedPaste !== null) setPasteEnabled(savedPaste === 'true');

        const savedZoom = localStorage.getItem('cockpit_zoom');
        if (savedZoom) {
            (document.body.style as any).zoom = savedZoom;
        }
        setIsInitialized(true);
    }, []);

    // Persist state
    useEffect(() => {
        if (isInitialized && typeof window !== 'undefined') {
            localStorage.setItem('cockpit_copyEnabled', String(copyEnabled));
        }
    }, [copyEnabled, isInitialized]);

    useEffect(() => {
        if (isInitialized && typeof window !== 'undefined') {
            localStorage.setItem('cockpit_pasteEnabled', String(pasteEnabled));
        }
    }, [pasteEnabled, isInitialized]);

    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const musicDropdownRef = React.useRef<HTMLDivElement>(null);
    const musicButtonRef = React.useRef<HTMLButtonElement>(null);
    const musicAudioRef = React.useRef<HTMLAudioElement | null>(null);
    const musicReadyCallbackRef = React.useRef(onMusicExperienceReady);

    // NOTE: menuRefs are kept but we no longer use them to close menus,
    // because portal menus are not inside these refs.
    const menuRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
    const setMenuRef = (key: string) => (el: HTMLDivElement | null) => {
        menuRefs.current[key] = el;
    };

    // Used to ignore outside-click closing when clicking INSIDE portal menus.
    const PORTAL_MENU_CLASS = "cockpit-portal-menu";

    useEffect(() => {
        musicReadyCallbackRef.current = onMusicExperienceReady;
    }, [onMusicExperienceReady]);

    const finishMusicExperience = React.useCallback(() => {
        setMusicExperienceReady(true);
        musicReadyCallbackRef.current?.();
    }, []);

    const openMusicPrompt = React.useCallback(() => {
        setMusicStatus("prompt");
        setShowMusicDropdown(true);
    }, []);

    const playMusic = React.useCallback(async () => {
        const audio = musicAudioRef.current;
        if (!audio) return false;

        try {
            await audio.play();
            setMusicStatus("playing");
            localStorage.setItem("cockpit_music_experience", "allowed");
            finishMusicExperience();
            return true;
        } catch {
            openMusicPrompt();
            return false;
        }
    }, [finishMusicExperience, openMusicPrompt]);

    const continueToMusicExperience = React.useCallback(() => {
        setShowFullscreenPrompt(false);
        const savedPreference = localStorage.getItem("cockpit_music_experience");
        if (savedPreference === "allowed") {
            void playMusic();
        } else {
            openMusicPrompt();
        }
    }, [openMusicPrompt, playMusic]);

    const handleEnterFullscreen = React.useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            }
        } catch (err) {
            console.error("Error attempting to enable fullscreen:", err);
        } finally {
            continueToMusicExperience();
        }
    }, [continueToMusicExperience]);

    useEffect(() => {
        if (!showMusicExperience) {
            finishMusicExperience();
            return;
        }

        const audio = new Audio("/music/new-intro.mp3");
        audio.loop = true;
        audio.volume = 0.36;
        audio.preload = "auto";
        musicAudioRef.current = audio;

        setShowFullscreenPrompt(true);

        return () => {
            audio.pause();
            audio.src = "";
            musicAudioRef.current = null;
        };
    }, [finishMusicExperience, showMusicExperience]);

    const handleAllowMusic = async () => {
        const started = await playMusic();
        if (started) setShowMusicDropdown(false);
    };

    const handleContinueWithoutMusic = () => {
        musicAudioRef.current?.pause();
        setMusicStatus("denied");
        setShowMusicDropdown(false);
        finishMusicExperience();
    };

    const handleMusicToggle = async () => {
        const audio = musicAudioRef.current;
        if (!audio) return;

        if (musicStatus === "playing") {
            audio.pause();
            setMusicStatus("paused");
            return;
        }

        await handleAllowMusic();
    };



    const getBatteryIcon = () => {
        if (battery.charging) return <PlugZap2 className="w-4 h-4 text-white fill-white" />;
        if (battery.level > 80) return <BatteryFull className="w-4 h-4 fill-white" />;
        if (battery.level > 30) return <BatteryMedium className="w-4 h-4 fill-white" />;
        return <BatteryLow className="w-4 h-4 text-red-500 fill-red-500" />;
    };

    const closeAllMenus = () => {
        setActiveMenu(null);
        setShowDropdown(false);
        if (musicExperienceReady) setShowMusicDropdown(false);
    };

    // Real-time internet speed detection - downloads actual data to measure true bandwidth
    useEffect(() => {
        let isMounted = true;

        const measureSpeed = async () => {
            if (!isMounted) return;
            setInternetSpeed(prev => ({ ...prev, testing: true }));

            try {
                // Use Navigator Connection API for connection info
                const connection = (navigator as any).connection ||
                    (navigator as any).mozConnection ||
                    (navigator as any).webkitConnection;

                if (connection) {
                    setInternetSpeed(prev => ({
                        ...prev,
                        connectionType: connection.type || "unknown",
                        effectiveType: connection.effectiveType || "4g",
                    }));
                }

                // Download a larger file from our own server to measure real bandwidth
                // We'll use a 100KB chunk for accurate measurement
                const testUrl = `${BASE_URL}/cockpit/speedtest?size=102400&t=${Date.now()}`;

                const startTime = performance.now();

                const response = await fetch(testUrl, {
                    cache: "no-store",
                    credentials: "include",
                });

                if (response.ok) {
                    // Read the actual response data to measure real download
                    const blob = await response.blob();
                    const endTime = performance.now();

                    const durationSeconds = (endTime - startTime) / 1000;
                    const bytesDownloaded = blob.size;
                    const bitsDownloaded = bytesDownloaded * 8;
                    const speedBps = bitsDownloaded / durationSeconds;
                    const speedMbps = speedBps / 1_000_000;

                    if (isMounted) {
                        setInternetSpeed(prev => ({
                            ...prev,
                            download: parseFloat(speedMbps.toFixed(1)),
                            testing: false,
                        }));
                    }
                } else {
                    // Fallback: use a public CDN resource for testing
                    const cdnUrl = `https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js?t=${Date.now()}`;
                    const fallbackStart = performance.now();

                    const fallbackRes = await fetch(cdnUrl, { cache: "no-store" });
                    const fallbackBlob = await fallbackRes.blob();
                    const fallbackEnd = performance.now();

                    const duration = (fallbackEnd - fallbackStart) / 1000;
                    const bytes = fallbackBlob.size; // ~87KB for jQuery
                    const bits = bytes * 8;
                    const mbps = (bits / duration) / 1_000_000;

                    if (isMounted) {
                        setInternetSpeed(prev => ({
                            ...prev,
                            download: parseFloat(mbps.toFixed(1)),
                            testing: false,
                        }));
                    }
                }
            } catch (error) {
                // Final fallback: estimate from ping time
                try {
                    const pingUrl = `https://www.cloudflare.com/cdn-cgi/trace?t=${Date.now()}`;
                    const pingStart = performance.now();
                    await fetch(pingUrl, { mode: "no-cors", cache: "no-store" });
                    const pingEnd = performance.now();
                    const pingMs = pingEnd - pingStart;

                    // Rough estimate: lower ping = faster connection
                    let estimated = 0;
                    if (pingMs < 50) estimated = 100;
                    else if (pingMs < 100) estimated = 50;
                    else if (pingMs < 200) estimated = 25;
                    else if (pingMs < 500) estimated = 10;
                    else estimated = 5;

                    if (isMounted) {
                        setInternetSpeed(prev => ({
                            ...prev,
                            download: estimated,
                            testing: false,
                        }));
                    }
                } catch {
                    if (isMounted) {
                        setInternetSpeed(prev => ({
                            ...prev,
                            download: 0,
                            testing: false,
                        }));
                    }
                }
            }
        };

        // Initial measurement
        measureSpeed();

        // Re-measure every 10 seconds for more real-time updates
        const interval = setInterval(measureSpeed, 10000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    // Global copy/paste blocking
    useEffect(() => {
        const getTargetElement = (target: EventTarget | null): HTMLElement | null => {
            if (!target) return null;
            if (target instanceof HTMLElement) return target;
            // Handle text nodes
            if (target instanceof Node && target.nodeType === Node.TEXT_NODE) {
                return (target.parentElement as HTMLElement);
            }
            return null;
        };

        const handleCopy = (e: ClipboardEvent) => {
            const target = getTargetElement(e.target);
            if (!target) return;

            // Allow copy/paste in inputs, textareas, and contentEditable
            if (target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable) {
                return;
            }

            // Allow copy/paste in terminal (xterm)
            if (target.closest && target.closest('.xterm')) {
                return;
            }

            if (!copyEnabled) {
                e.preventDefault();
                console.log("Copy disabled");
            }
        };

        const handlePaste = (e: ClipboardEvent) => {
            const target = getTargetElement(e.target);
            if (!target) return;

            // Allow copy/paste in inputs, textareas, and contentEditable
            if (target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable) {
                return;
            }

            // Allow copy/paste in terminal (xterm)
            if (target.closest && target.closest('.xterm')) {
                return;
            }

            if (!pasteEnabled) {
                e.preventDefault();
                console.log("Paste disabled");
            }
        };

        // Block selection
        const handleSelect = (e: Event) => {
            const target = getTargetElement(e.target);
            if (!target) return;

            // Allow selection in inputs, textareas, and contentEditable
            if (target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable) {
                return;
            }

            // Allow selection in terminal
            if (target.closest && target.closest('.xterm')) {
                return;
            }

            if (!copyEnabled) {
                e.preventDefault();
            }
        };

        // Block context menu (right click)
        const handleContextMenu = (e: MouseEvent) => {
            const target = getTargetElement(e.target);
            if (!target) return;

            // Allow context menu in inputs, textareas, and contentEditable
            if (target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable) {
                return;
            }

            // Allow context menu in terminal
            if (target.closest && target.closest('.xterm')) {
                return;
            }

            if (!copyEnabled) {
                e.preventDefault();
            }
        }

        document.addEventListener('copy', handleCopy);
        document.addEventListener('paste', handlePaste);
        document.addEventListener('selectstart', handleSelect);
        document.addEventListener('contextmenu', handleContextMenu);

        // Inject CSS to control selection visually
        const styleId = 'cockpit-copy-protection';
        let styleEl = document.getElementById(styleId);

        if (!copyEnabled) {
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = styleId;
                document.head.appendChild(styleEl);
            }
            styleEl.innerHTML = `
                body {
                    user-select: none !important;
                    -webkit-user-select: none !important;
                }
                input, textarea, [contenteditable], .xterm, .xterm * {
                    user-select: text !important;
                    -webkit-user-select: text !important;
                }
                img {
                    -webkit-user-drag: none;
                    user-drag: none;
                    user-select: none;
                    -webkit-user-select: none;
                }
            `;
        } else {
            if (styleEl) {
                styleEl.remove();
            }
        }

        return () => {
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('paste', handlePaste);
            document.removeEventListener('selectstart', handleSelect);
            document.removeEventListener('contextmenu', handleContextMenu);

            // Clean up styles
            const cleanupStyle = document.getElementById(styleId);
            if (cleanupStyle) cleanupStyle.remove();
        };
    }, [copyEnabled, pasteEnabled]);

    // Fetch available devices

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const res = await fetch(`${BASE_URL}/cockpit/cocktail/devices`, { credentials: "include" });
                if (res.ok) {
                    const data = await res.json();
                    const deviceList = (data || [])
                        .map((d: any) => ({
                            id: d.device?.id,
                            name: d.device?.name || d.device?.hostname || "Unknown",
                        }))
                        .filter((d: any) => d.id);

                    setDevices(deviceList);

                    if (deviceList.length > 0 && !selectedDeviceId) {
                        setSelectedDeviceId(deviceList[0].id);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch devices:", e);
            }
        };

        fetchDevices();
        const interval = setInterval(fetchDevices, 30000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch real metrics from selected device
    useEffect(() => {
        if (!selectedDeviceId) return;

        const fetchMetrics = async () => {
            try {
                const res = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${selectedDeviceId}/metrics/latest`, {
                    credentials: "include",
                    cache: "no-store",
                });

                if (res.ok) {
                    const raw = await res.json();
                    setIsVpsOnline(!!raw?.online);

                    // CPU
                    const cpuRaw = raw?.cpu || {};
                    const cores = Number(cpuRaw.cores ?? cpuRaw.coreCount ?? 1) || 1;
                    const load1 = Number(cpuRaw.load1 ?? cpuRaw.load ?? 0) || 0;
                    const cpuPct = Math.min(100, Math.max(0, (load1 / cores) * 100));
                    setCpuUsage(Math.round(cpuPct));

                    // Memory
                    const memRaw = raw?.mem || {};
                    const totalMem = Number(memRaw.totalBytes ?? memRaw.total ?? 0) || 1;
                    const usedMem = Number(memRaw.usedBytes ?? memRaw.used ?? 0) || 0;
                    const memPct = (usedMem / totalMem) * 100;
                    setMemoryUsage(Math.round(memPct));

                    // Disk
                    const diskRaw = raw?.disk || [];
                    if (Array.isArray(diskRaw) && diskRaw.length > 0) {
                        const totalDisk = diskRaw.reduce(
                            (sum: number, d: any) => sum + (Number(d.totalBytes ?? d.size ?? 0) || 0),
                            0
                        );
                        const usedDisk = diskRaw.reduce((sum: number, d: any) => sum + (Number(d.usedBytes ?? d.used ?? 0) || 0), 0);
                        const diskPct = totalDisk > 0 ? (usedDisk / totalDisk) * 100 : 0;
                        setDiskUsage(Math.round(diskPct));
                    }

                    // Network
                    const netRaw = raw?.net || {};
                    const rxBps = Number(netRaw.rxBytesPerSec ?? 0) || 0;
                    const txBps = Number(netRaw.txBytesPerSec ?? 0) || 0;
                    setNetworkSpeed({
                        up: parseFloat((txBps / 1024 / 1024).toFixed(1)),
                        down: parseFloat((rxBps / 1024 / 1024).toFixed(1)),
                    });
                } else {
                    setIsVpsOnline(false);
                }
            } catch (e) {
                console.error("Failed to fetch metrics:", e);
                setIsVpsOnline(false);
            }
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 2000);
        return () => clearInterval(interval);
    }, [selectedDeviceId]);

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => setTime(new Date()), 1000);

        // Connectivity status
        setIsOnline(navigator.onLine);
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Battery status
        if ("getBattery" in navigator) {
            (navigator as any).getBattery().then((batt: any) => {
                const updateBattery = () => {
                    setBattery({
                        level: batt.level * 100,
                        charging: batt.charging,
                        supported: true,
                    });
                };
                updateBattery();
                batt.addEventListener("chargingchange", updateBattery);
                batt.addEventListener("levelchange", updateBattery);
            });
        }

        // ✅ Robust outside click handling for portal menus + dropdown
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;

            // If clicking inside any portal menu, do nothing (don't close before item click)
            if (target?.closest?.(`.${PORTAL_MENU_CLASS}`)) return;

            // If clicking inside system dropdown, do nothing
            if (showDropdown && dropdownRef.current && dropdownRef.current.contains(event.target as Node)) return;
            if (showMusicDropdown && musicDropdownRef.current && musicDropdownRef.current.contains(event.target as Node)) return;

            // If clicking the activity button itself, do nothing (toggle handles it)
            if (buttonRef.current && buttonRef.current.contains(event.target as Node)) return;
            if (musicButtonRef.current && musicButtonRef.current.contains(event.target as Node)) return;

            // Otherwise close any open menus
            if (activeMenu || showDropdown || (showMusicDropdown && musicExperienceReady)) closeAllMenus();
        };

        document.addEventListener("click", handleClickOutside);

        return () => {
            clearInterval(timer);
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            document.removeEventListener("click", handleClickOutside);
        };
    }, [activeMenu, showDropdown, showMusicDropdown, musicExperienceReady]);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
        });
    };

    const toggleDropdown = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDropdown((v) => !v);
        // if opening system dropdown, close the top menus
        setActiveMenu(null);
        if (musicExperienceReady) setShowMusicDropdown(false);
    };

    const toggleMusicDropdown = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMusicDropdown((v) => !v);
        setActiveMenu(null);
        setShowDropdown(false);
    };

    const toggleMenu = (menu: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveMenu((prev) => (prev === menu ? null : menu));
        // if opening a top menu, close system dropdown
        setShowDropdown(false);
    };

    // Menu items configuration
    const fileMenuItems: MenuItem[] = [
        {
            label: "New Terminal",
            icon: <Terminal className="w-4 h-4" />,
            onClick: () => {
                window.dispatchEvent(new CustomEvent("cockpit:open-app", { detail: { app: "Terminal" } }));
                closeAllMenus();
            },
        },
        {
            label: "File Explorer",
            icon: <FolderOpen className="w-4 h-4" />,
            onClick: () => {
                window.dispatchEvent(new CustomEvent("cockpit:open-app", { detail: { app: "Explorer" } }));
                closeAllMenus();
            },
        },
        { divider: true },
        {
            label: "Settings",
            icon: <Settings className="w-4 h-4" />,
            onClick: () => {
                window.dispatchEvent(new CustomEvent("cockpit:open-app", { detail: { app: "Settings" } }));
                closeAllMenus();
            },
        },
        { divider: true },
        {
            label: "Exit",
            icon: <Power className="w-4 h-4" />,
            onClick: () => {
                closeAllMenus();
                void forceCockpitLogout();
            },
        },
    ];


    const editMenuItems: MenuItem[] = [
        {
            label: "Global Copy",
            icon: copyEnabled ? <ToggleRight className="w-5 h-5 text-white" /> : <ToggleLeft className="w-5 h-5 text-white/40" />,
            onClick: () => {
                setCopyEnabled(!copyEnabled);
                // Don't close menu so user can toggle both
            }
        },
        {
            label: "Global Paste",
            icon: pasteEnabled ? <ToggleRight className="w-5 h-5 text-white" /> : <ToggleLeft className="w-5 h-5 text-white/40" />,
            onClick: () => {
                setPasteEnabled(!pasteEnabled);
                // Don't close menu
            }
        },
    ];

    const viewMenuItems: MenuItem[] = [
        {
            label: "Toggle Fullscreen",
            icon: <MonitorX className="w-4 h-4" />,
            shortcut: "F11",
            onClick: () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch((err) => {
                        console.error(`Error attempting to enable fullscreen: ${err.message}`);
                    });
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    }
                }
            }
        },
        {
            label: "Zoom In",
            icon: <ZoomIn className="w-4 h-4" />,
            shortcut: "Ctrl+Plus",
            onClick: () => {
                const currentZoom = parseFloat((document.body.style as any).zoom || "1");
                const newZoom = Math.min(currentZoom + 0.1, 3).toString();
                (document.body.style as any).zoom = newZoom;
                localStorage.setItem('cockpit_zoom', newZoom);
            }
        },
        // {
        //     label: "Zoom Out",
        //     icon: <ZoomOut className="w-4 h-4" />,
        //     onClick: () => {
        //         const currentZoom = parseFloat((document.body.style as any).zoom || "1");
        //         const newZoom = Math.max(currentZoom - 0.1, 0.5).toString();
        //         (document.body.style as any).zoom = newZoom;
        //         localStorage.setItem('cockpit_zoom', newZoom);
        //     }
        // },
        {
            label: "Reset Zoom",
            icon: <RefreshCw className="w-4 h-4" />,
            onClick: () => {
                (document.body.style as any).zoom = "1";
                localStorage.setItem('cockpit_zoom', "1");
            }
        },
        { divider: true },
        {
            label: "Show Widgets",
            icon: <Puzzle className="w-4 h-4" />,
            onClick: () => {
                window.dispatchEvent(new CustomEvent("cockpit:open-app", { detail: { app: "ToggleWidgets" } }));
            }
        },
    ];

    const renderMenuItems = (items: MenuItem[]) => (
        <>
            {items.map((item, index) =>
                item.divider ? (
                    <div key={index} className="h-px bg-white/10 my-1" />
                ) : (
                    <button
                        key={index}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-white/10 rounded transition-colors ${item.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                            }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (!item.disabled && item.onClick) item.onClick();
                        }}
                        disabled={item.disabled}
                    >
                        {item.icon && <span className="text-white/80">{item.icon}</span>}
                        <span className="flex-1 text-white/90">{item.label}</span>
                        {item.shortcut && <span className="text-white/60 text-[10px] font-mono tracking-wider">{item.shortcut}</span>}
                    </button>
                )
            )}
        </>
    );

    const ProgressBar = ({ value, max = 100, color = "bg-green-500" }: { value: number; max?: number; color?: string }) => (
        <div className="w-full bg-white/10 rounded-full h-1.5">
            <div className={`${color} h-1.5 rounded-full transition-all duration-300`} style={{ width: `${(value / max) * 100}%` }} />
        </div>
    );

    return (
        <div
            className={`fixed top-0 p-5 left-0 right-0 h-8 flex items-center justify-between px-4 z-50 text-[13px] font-medium text-white/90 ${transparent ? "bg-transparent border-transparent" : "bg-white/10 backdrop-blur-3xl border-b border-white/10"
                }`}
        >
            <div className="flex items-center gap-1">
                <div className="flex items-center gap-3 pr-4">
                    <img src="/logo/cockpit.svg" alt="Cockpit Logo" className="w-[25px] h-[25px] hover:opacity-100 transition-opacity" />
                    <span className="font-semibold text-white tracking-tight">CockpitOS</span>
                </div>

                {showPlanBadge && (
                    <>
                        <span className="mx-1.5 h-4 w-px shrink-0 bg-white/20" aria-hidden />
                        <div
                            className="relative isolate overflow-hidden rounded-full bg-gradient-to-b from-white/10 via-white/[0.07] to-white/40 px-3 py-0.5 "
                            role="status"
                            aria-label="Current plan: Paid Plan"
                        >
                            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full" aria-hidden>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-shimmer" />
                            </div>
                            <span className="relative z-[1] text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-50/95">
                                Pro Plan
                            </span>
                        </div>
                    </>
                )}

                {showFullMenus && (
                    <span className="mx-1.5 h-4 w-px shrink-0 bg-white/20" aria-hidden />
                )}

                <div className="flex items-center">
                    {showFullMenus && (
                        <>
                            {/* File Menu */}
                            <div className="relative" ref={setMenuRef("file")}>
                                <button
                                    className={`px-3 py-1 text-xs font-medium transition-colors ${activeMenu === "file" ? "bg-white/20 text-white" : "text-white/90 hover:text-white hover:bg-white/10"
                                        }`}
                                    onClick={(e) => toggleMenu("file", e)}
                                >
                                    File
                                </button>

                                {activeMenu === "file" &&
                                    createPortal(
                                        <div className={`${PORTAL_MENU_CLASS} fixed top-8 left-0 z-[10000] bg-white/5 rounded-3xl backdrop-blur-md border border-white/10 shadow-xl ml-20 mt-1`}>
                                            <LiquidGlass variant="menu" className="py-1 min-w-[240px]" includeSvgFilter>
                                                {renderMenuItems(fileMenuItems)}
                                            </LiquidGlass>
                                        </div>,
                                        document.body
                                    )}
                            </div>

                            {/* Edit Menu */}
                            <div className="relative" ref={setMenuRef("edit")}>
                                <button
                                    className={`px-3 py-1 text-xs font-medium transition-colors ${activeMenu === "edit" ? "bg-white/20 text-white" : "text-white/90 hover:text-white hover:bg-white/10"
                                        }`}
                                    onClick={(e) => toggleMenu("edit", e)}
                                >
                                    Edit
                                </button>

                                {activeMenu === "edit" &&
                                    createPortal(
                                        <div className={`${PORTAL_MENU_CLASS} fixed top-8 left-0 z-[10000] bg-white/5 rounded-3xl backdrop-blur-md border border-white/10 shadow-xl ml-28 mt-1`}>
                                            <LiquidGlass variant="menu" className="py-1 min-w-[220px]" includeSvgFilter>
                                                {renderMenuItems(editMenuItems)}
                                            </LiquidGlass>
                                        </div>,
                                        document.body
                                    )}
                            </div>

                            {/* View Menu */}
                            <div className="relative" ref={setMenuRef("view")}>
                                <button
                                    className={`px-3 py-1 text-xs font-medium transition-colors ${activeMenu === "view" ? "bg-white/20 text-white" : "text-white/90 hover:text-white hover:bg-white/10"
                                        }`}
                                    onClick={(e) => toggleMenu("view", e)}
                                >
                                    View
                                </button>

                                {activeMenu === "view" &&
                                    createPortal(
                                        <div className={`${PORTAL_MENU_CLASS} fixed top-8 left-0 z-[10000] bg-white/5 rounded-3xl backdrop-blur-md border border-white/10 shadow-xl ml-36 mt-1`}>
                                            <LiquidGlass variant="menu" className="py-1 min-w-[200px]" includeSvgFilter>
                                                {renderMenuItems(viewMenuItems)}
                                            </LiquidGlass>
                                        </div>,
                                        document.body
                                    )}
                            </div>

                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 mr-2">
                    {showMusicExperience && (
                        <button
                            ref={musicButtonRef}
                            type="button"
                            onClick={toggleMusicDropdown}
                            className={`flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors ${
                                showMusicDropdown ? "bg-white/10 text-white" : "text-white/90 hover:text-white"
                            }`}
                            title="Music experience"
                            aria-label="Music experience"
                            aria-expanded={showMusicDropdown}
                        >
                            {musicStatus === "playing" ? (
                                <Volume2 className="w-3.5 h-3.5" />
                            ) : musicStatus === "denied" || musicStatus === "paused" ? (
                                <VolumeX className="w-3.5 h-3.5" />
                            ) : (
                                <Music2 className="w-3.5 h-3.5" />
                            )}
                        </button>
                    )}

                    {/* Internet Speed Indicator */}
                    <div className="flex items-center gap-1.5 hover:bg-white/10 px-2 py-0.5 rounded transition-colors cursor-default">
                        {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5 text-red-400" />}
                        {isOnline && (
                            <span className="text-[10px] tabular-nums text-white/80 flex items-center h-4">
                                {internetSpeed.testing ? (
                                    <div className="w-14 h-3 bg-white/10 rounded-full overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                    </div>
                                ) : (
                                    `${internetSpeed.download} Mbps`
                                )}
                            </span>
                        )}
                        <div className={`w-1.5 h-1.5 rounded-full ${!isOnline ? 'bg-red-400' :
                            internetSpeed.download >= 50 ? 'bg-white' :
                                internetSpeed.download >= 10 ? 'bg-white' :
                                    'bg-white'
                            }`} />
                    </div>

                    {battery.supported && (
                        <div className="flex items-center gap-1.5 hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors cursor-default">
                            <span className="text-[10px] opacity-100 tabular-nums">{Math.round(battery.level)}%</span>
                            {getBatteryIcon()}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => void forceCockpitLogout()}
                        className="flex items-center gap-1 hover:bg-white/10 px-2 py-0.5 rounded transition-colors text-[10px] font-medium text-white/90 hover:text-white"
                        title="Reset to clear session and local data"
                    >
                        <Power className="w-3.5 h-3.5 shrink-0 opacity-95" aria-hidden />
                        <span className="tabular-nums">Reset</span>
                    </button>

                    {showSystemMonitor && (

                        <button
                            ref={buttonRef}
                            className="flex items-center gap-1.5 hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors"
                            onClick={toggleDropdown}
                        >
                            <Activity className="w-4 h-4" />
                            <ChevronDown className={`w-3 h-3 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
                        </button>
                    )}
                </div>

                <div
                    className="flex items-center gap-2 tabular-nums hover:bg-white/10 px-2 py-1 rounded-3xl transition-colors cursor-pointer"
                    onClick={onCalendarClick}
                >
                    <span>{time ? formatDate(time) : "..."}</span>
                    <span>{time ? formatTime(time) : "--:--"}</span>
                </div>
            </div>

            {/* System Info Dropdown - Rendered via Portal */}
            {showDropdown &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        className="fixed top-20 right-4 z-[9999] bg-white/5 rounded-3xl backdrop-blur-md"
                        style={{ position: "fixed", top: "3rem", right: "1rem", zIndex: 9999 }}
                    >
                        <LiquidGlass variant="menu" className="w-80" includeSvgFilter>
                            {/* Title Section */}
                            <div className="px-4 py-3 border-b border-white/10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Server className="w-4 h-4 text-white" />
                                        <span className="text-sm font-semibold text-white">System Monitor</span>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${isVpsOnline ? "bg-white animate-pulse" : "bg-zinc-500"}`} />
                                </div>

                                {/* Device Selector */}
                                {devices.length > 0 && (
                                    <div className="mt-3 relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <HardDrive className="w-3.5 h-3.5 text-white/50" />
                                        </div>
                                        <select
                                            value={selectedDeviceId || ""}
                                            onChange={(e) => setSelectedDeviceId(e.target.value)}
                                            className="w-full appearance-none bg-white/5 hover:bg-white/10 border border-white/10 rounded-md pl-8 pr-8 py-2 text-xs text-white font-medium outline-none focus:border-white/20 transition-all cursor-pointer"
                                        >
                                            {devices.map((device) => (
                                                <option key={device.id} value={device.id} className="bg-zinc-900 py-2">
                                                    {device.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <ChevronDown className="w-3.5 h-3.5 text-white/50" />
                                        </div>
                                    </div>
                                )}

                                {devices.length === 0 && (
                                    <div className="mt-3 flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                        <span className="text-[11px] text-white/60">Waiting for VPS agents...</span>
                                    </div>
                                )}
                            </div>

                            {/* Content Section - Vertical Layout */}
                            <div className="p-4 space-y-4">
                                {/* CPU */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-white/80 font-medium">CPU</div>
                                        <div className="text-xs text-white/90 font-medium tabular-nums">{cpuUsage}%</div>
                                    </div>
                                    <ProgressBar value={cpuUsage} color={"bg-white"} />
                                </div>

                                {/* Memory */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-white/80 font-medium">Memory</div>
                                        <div className="text-xs text-white/90 font-medium tabular-nums">{memoryUsage}%</div>
                                    </div>
                                    <ProgressBar value={memoryUsage} color={"bg-white"} />
                                </div>

                                {/* Disk */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-white/80 font-medium">Disk</div>
                                        <div className="text-xs text-white/90 font-medium tabular-nums">{diskUsage}%</div>
                                    </div>
                                    <ProgressBar value={diskUsage} color={"bg-white"} />
                                </div>

                                {/* VPS Network */}
                                <div className="pt-3 mt-1 border-t border-white/10 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Network className="w-3.5 h-3.5 text-white" />
                                        <span className="text-xs font-medium text-white">VPS Network</span>
                                    </div>

                                    <div className="flex justify-between text-xs text-white/80 tabular-nums">
                                        <div className="flex items-center gap-1">
                                            <span className="text-white/60 text-[10px]">↑</span>
                                            <span>{networkSpeed.up} MB/s</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-white/60 text-[10px]">↓</span>
                                            <span>{networkSpeed.down} MB/s</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Browser Internet Speed */}
                                <div className="pt-3 mt-1 border-t border-white/10 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Wifi className="w-3.5 h-3.5 text-white" />
                                            <span className="text-xs font-medium text-white">Internet</span>
                                        </div>
                                        {internetSpeed.testing && (
                                            <span className="text-[10px] text-white/40 animate-pulse">Initializing...</span>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-white/80 tabular-nums">
                                                ~{internetSpeed.download} Mbps
                                            </span>
                                            <span className="text-[10px] text-white/40 uppercase">
                                                {internetSpeed.effectiveType}
                                            </span>
                                        </div>
                                        <div className={`w-2 h-2 rounded-full ${internetSpeed.download >= 50 ? 'bg-white' :
                                            internetSpeed.download >= 10 ? 'bg-white' :
                                                'bg-red-400'
                                            }`} />
                                    </div>
                                </div>
                            </div>

                        </LiquidGlass>
                    </div>,
                    document.body
                )}
            {showMusicExperience &&
                showFullscreenPrompt &&
                createPortal(
                    <div className="fixed right-4 top-12 z-[10000] w-[320px] bg-white text-neutral-950 shadow-2xl">
                        <div className="border-b border-neutral-200 px-5 py-4">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <div className="text-sm font-semibold">Fullscreen Experience</div>
                                    <div className="mt-1 text-xs leading-relaxed text-neutral-500">
                                        Use CockpitOS in fullscreen before starting the music experience.
                                    </div>
                                </div>
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-neutral-950 text-white">
                                    <Maximize2 className="h-4 w-4" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 px-5 py-4">
                            <button
                                type="button"
                                onClick={() => void handleEnterFullscreen()}
                                className="w-full bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                            >
                                Go Full Screen
                            </button>
                            <button
                                type="button"
                                onClick={continueToMusicExperience}
                                className="w-full border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-100"
                            >
                                Continue Without Fullscreen
                            </button>
                        </div>
                    </div>,
                    document.body
                )}
            {showMusicExperience &&
                showMusicDropdown &&
                createPortal(
                    <div
                        ref={musicDropdownRef}
                        className="fixed right-4 top-12 z-[10000] w-[320px] bg-white text-neutral-950 shadow-2xl"
                    >
                        <div className="border-b border-neutral-200 px-5 py-4">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <div className="text-sm font-semibold">Music Experience</div>
                                    <div className="mt-1 text-xs leading-relaxed text-neutral-500">
                                        {musicStatus === "playing"
                                            ? "Ambient setup music is playing."
                                            : musicStatus === "paused"
                                              ? "Music is paused for this session."
                                              : "Turn on the music experience and feel the platform come alive."}
                                    </div>
                                </div>
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-neutral-950 text-white">
                                    <Music2 className="h-4 w-4" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 px-5 py-4">
                            {musicStatus === "prompt" || musicStatus === "checking" ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => void handleAllowMusic()}
                                        className="w-full bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                                    >
                                        Allow Music
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleContinueWithoutMusic}
                                        className="w-full border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-100"
                                    >
                                        Continue Without Music
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => void handleMusicToggle()}
                                        className="w-full bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                                    >
                                        {musicStatus === "playing" ? "Pause Music" : "Play Music"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowMusicDropdown(false)}
                                        className="w-full border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-100"
                                    >
                                        Close
                                    </button>
                                </>
                            )}
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}
