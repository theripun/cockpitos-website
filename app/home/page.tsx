"use client";

import React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Menubar } from "@/components/home/menubar";
import { Dock } from "@/components/home/dock";
import { WeatherWidget } from "@/components/home/widgets/weather-widget";
import { NoteWidget } from "@/components/home/widgets/note-widget";
import { Terminal } from "@/components/home/apps/terminal";
import { Explorer } from "@/components/home/apps/explorer";
import { TaskMonitor } from "@/components/home/apps/task-monitor";
import { Brave } from "@/components/home/apps/brave";
import { Google } from "@/components/home/apps/google";
import { ReglookMail } from "@/components/home/apps/reglook-mail";
import { Gallery } from "@/components/home/apps/gallery";
import { FaceTime } from "@/components/home/apps/face-time";
import { Calendar } from "@/components/home/apps/calendar";
import { Finder } from "@/components/home/apps/finder";
import { XCloud } from "@/components/home/apps/xCloud";
import { Settings } from "@/components/home/apps/settings";
import { Notepad } from "@/components/home/apps/notepad";
import { MusicApp } from "@/components/home/apps/music";
import { DeviceManager } from "@/components/home/apps/device-manager";
import { AccountApp } from "@/components/home/apps/account";
import { BackgroundChanger } from "@/components/home/action-surface/background";


import { GlassInterface } from "@/components/common/glass-interface";
import { ZIndexProvider, WindowManager } from "@/components/home/window-manager";
import { DesktopContextMenu } from "@/components/home/desktop-context-menu";
import { BoosterWidget } from "@/components/home/widgets/booster-widget";
import { BASE_URL } from "@/lib/baseURL";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import {
    AdVisibilityProvider,
    VideoAdUnit,
    StickyLeftBannerAd,
    IdleScreenAd,
    IntervalScreenAd,
    ClickScreenAd,
    MultiplexScreenAd,
    VignetteAdModal,
} from "@/components/ads";
import { markHomeVignetteDismissed, recordHomeAppOpenForVignette } from "@/lib/home-vignette";

function shouldShowAdsForUser(user: unknown) {
    if (!user || typeof user !== "object") return false;

    const record = user as Record<string, unknown>;
    const explicitAds = record.adsEnabled ?? record.showAds ?? record.adSupported;
    if (typeof explicitAds === "boolean") return explicitAds;

    const plan = String(
        record.plan ??
        record.planName ??
        record.subscriptionPlan ??
        record.subscriptionTier ??
        record.tier ??
        ""
    ).toLowerCase();

    const status = String(
        record.subscriptionStatus ??
        record.planStatus ??
        record.billingStatus ??
        ""
    ).toLowerCase();

    if (plan && ["paid", "pro", "premium", "business", "enterprise"].includes(plan)) {
        return false;
    }

    if (["active", "trialing"].includes(status) && plan && plan !== "free") {
        return false;
    }

    return plan === "free" || plan === "starter";
}

export default function HomePage() {
    useActivityTracker('home');

    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [showAds, setShowAds] = React.useState(false);
    const [isTerminalOpen, setIsTerminalOpen] = React.useState(false);
    const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number } | null>(null);
    const [focusedApp, setFocusedApp] = React.useState<string | null>(null);
    const [isExplorerOpen, setIsExplorerOpen] = React.useState(false);
    const [isTaskMonitorOpen, setIsTaskMonitorOpen] = React.useState(false);
    const [isBraveOpen, setIsBraveOpen] = React.useState(false);
    const [isGoogleOpen, setIsGoogleOpen] = React.useState(false);
    const [isReglookMailOpen, setIsReglookMailOpen] = React.useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = React.useState(false);
    const [isFaceTimeOpen, setIsFaceTimeOpen] = React.useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
    const [isFinderOpen, setIsFinderOpen] = React.useState(false);
    const [isXCloudOpen, setIsXCloudOpen] = React.useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [isNotepadOpen, setIsNotepadOpen] = React.useState(false);
    const [isMusicOpen, setIsMusicOpen] = React.useState(false);
    const [isDeviceManagerOpen, setIsDeviceManagerOpen] = React.useState(false);
    const [isAccountOpen, setIsAccountOpen] = React.useState(false);
    const [idleInterstitialOpen, setIdleInterstitialOpen] = React.useState(false);
    const [intervalInterstitialOpen, setIntervalInterstitialOpen] = React.useState(false);
    const [clickInterstitialOpen, setClickInterstitialOpen] = React.useState(false);
    const [multiplexInterstitialOpen, setMultiplexInterstitialOpen] = React.useState(false);
    const [homeVignetteOpen, setHomeVignetteOpen] = React.useState(false);
    const [backgroundImage, setBackgroundImage] = React.useState("");
    const [terminalConfig, setTerminalConfig] = React.useState<{ vpsId?: string, path?: string, timestamp?: number } | null>(null);



    const [taskMonitorDeviceId, setTaskMonitorDeviceId] = React.useState<string | null>(null);

    const [minimizedApps, setMinimizedApps] = React.useState<string[]>([]);
    const [appClickOrder, setAppClickOrder] = React.useState<string[]>([]);
    const [isWidgetsVisible, setIsWidgetsVisible] = React.useState(true);
    const [isInitialized, setIsInitialized] = React.useState(false);
    const [isShuttingDown, setIsShuttingDown] = React.useState(false);

    // Initialize state from localStorage
    React.useEffect(() => {
        const saved = localStorage.getItem('cockpit_isWidgetsVisible');
        if (saved !== null) setIsWidgetsVisible(saved === 'true');
        setIsInitialized(true);

        // Check authentication status
        const checkAuth = async () => {
            try {
                const res = await fetch(`${BASE_URL}/auth/me`, { credentials: "include" });
                if (!res.ok) {
                    window.location.href = "/";
                } else {
                    const user = await res.json().catch(() => null);
                    setShowAds(shouldShowAdsForUser(user));
                    setIsAuthenticated(true);
                }
            } catch (e) {
                console.error("Auth check failed", e);
                window.location.href = "/";
            }
        };
        checkAuth();
    }, []);

    React.useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('cockpit_isWidgetsVisible', String(isWidgetsVisible));
        }
    }, [isWidgetsVisible, isInitialized]);

    // Listen for shutdown event
    React.useEffect(() => {
        const handleShutdown = () => {
            setIsShuttingDown(true);
            setTimeout(() => {
                window.location.href = '/';
            }, 3000);
        };
        window.addEventListener("cockpit:shutdown", handleShutdown);
        return () => window.removeEventListener("cockpit:shutdown", handleShutdown);
    }, []);

    // Refs to track window managers
    const windowManagerRefs = React.useRef<Record<string, { bringToFront?: () => void } | undefined>>({});

    const tryShowHomeVignette = React.useCallback(() => {
        if (!showAds) {
            return;
        }
        if (
            idleInterstitialOpen ||
            intervalInterstitialOpen ||
            clickInterstitialOpen ||
            multiplexInterstitialOpen
        ) {
            return;
        }
        if (recordHomeAppOpenForVignette()) {
            setHomeVignetteOpen(true);
        }
    }, [
        idleInterstitialOpen,
        intervalInterstitialOpen,
        clickInterstitialOpen,
        multiplexInterstitialOpen,
        showAds,
    ]);

    const dismissHomeVignette = React.useCallback(() => {
        markHomeVignetteDismissed();
        setHomeVignetteOpen(false);
    }, []);

    // Listen for custom events from menubar
    React.useEffect(() => {
        const handleOpenApp = (e: CustomEvent<{ app: string }>) => {
            const appName = e.detail.app;

            if (appName === "ToggleWidgets") {
                setIsWidgetsVisible(prev => !prev);
                return;
            }

            // Open the requested app
            if (appName === "Terminal") {
                setIsTerminalOpen(true);
                setMinimizedApps(prev => prev.filter(a => a !== "Terminal"));
            } else if (appName === "Explorer") {
                setIsExplorerOpen(true);
                setMinimizedApps(prev => prev.filter(a => a !== "Explorer"));
            } else if (appName === "Settings") {
                setIsSettingsOpen(true);
                setMinimizedApps(prev => prev.filter(a => a !== "Settings"));
            } else if (appName === "Task Monitor") {
                setIsTaskMonitorOpen(true);
                setMinimizedApps(prev => prev.filter(a => a !== "Task Monitor"));
            } else if (appName === "Account") {
                setIsAccountOpen(true);
                setMinimizedApps(prev => prev.filter(a => a !== "Account"));
            }

            tryShowHomeVignette();

            // Bring to front
            setTimeout(() => {
                const windowManagerRef = windowManagerRefs.current[appName];
                if (windowManagerRef && typeof windowManagerRef.bringToFront === 'function') {
                    windowManagerRef.bringToFront();
                }
            }, 50);
        };

        window.addEventListener("cockpit:open-app", handleOpenApp as EventListener);

        const handleCloseApp = (e: CustomEvent<{ app: string }>) => {
            const appName = e.detail.app;

            // Remove from minimized apps if present
            setMinimizedApps(prev => prev.filter(a => a !== appName));

            if (appName === "Terminal") setIsTerminalOpen(false);
            else if (appName === "Explorer") setIsExplorerOpen(false);
            else if (appName === "Task Monitor") setIsTaskMonitorOpen(false);
            else if (appName === "Brave") setIsBraveOpen(false);
            else if (appName === "Google") setIsGoogleOpen(false);
            else if (appName === "Reglook Mail") setIsReglookMailOpen(false);
            else if (appName === "Photos") setIsGalleryOpen(false);
            else if (appName === "FaceTime") setIsFaceTimeOpen(false);
            else if (appName === "Calendar") setIsCalendarOpen(false);
            else if (appName === "Finder") setIsFinderOpen(false);
            else if (appName === "xCloud") setIsXCloudOpen(false);
            else if (appName === "Settings") setIsSettingsOpen(false);
            else if (appName === "Notepad") setIsNotepadOpen(false);
            else if (appName === "Music") setIsMusicOpen(false);
            else if (appName === "Device Manager") setIsDeviceManagerOpen(false);
            else if (appName === "Account") setIsAccountOpen(false);
        };

        window.addEventListener("cockpit:close-app", handleCloseApp as EventListener);

        return () => {
            window.removeEventListener("cockpit:open-app", handleOpenApp as EventListener);
            window.removeEventListener("cockpit:close-app", handleCloseApp as EventListener);
        };
    }, [tryShowHomeVignette]);


    const handleAppClick = (label: string, forceOpen = false) => {
        // Check if the app is currently open
        let isOpen = false;
        if (label === "Terminal") isOpen = isTerminalOpen;
        else if (label === "Explorer") isOpen = isExplorerOpen;
        else if (label === "Task Monitor") isOpen = isTaskMonitorOpen;
        else if (label === "Brave") isOpen = isBraveOpen;
        else if (label === "Google") isOpen = isGoogleOpen;
        else if (label === "Reglook Mail") isOpen = isReglookMailOpen;
        else if (label === "Photos") isOpen = isGalleryOpen;
        else if (label === "FaceTime") isOpen = isFaceTimeOpen;
        else if (label === "Calendar") isOpen = isCalendarOpen;
        else if (label === "Finder") isOpen = isFinderOpen;
        else if (label === "xCloud") isOpen = isXCloudOpen;
        else if (label === "Settings") isOpen = isSettingsOpen;
        else if (label === "Notepad") isOpen = isNotepadOpen;
        else if (label === "Music") isOpen = isMusicOpen;
        else if (label === "Device Manager") isOpen = isDeviceManagerOpen;
        else if (label === "Account") isOpen = isAccountOpen;

        const isMinimized = minimizedApps.includes(label);
        const isTopmost = appClickOrder[appClickOrder.length - 1] === label;

        // Logic: active & topmost -> minimize (unless forced open)
        if (isOpen && !isMinimized && isTopmost && !forceOpen) {
            handleMinimize(label);
            return;
        }

        // Move clicked app to end of order array (brings it to front)
        setAppClickOrder(prev => [...prev.filter(app => app !== label), label]);

        // Bring the app to the front by calling its window manager ref
        setTimeout(() => {
            const windowManagerRef = windowManagerRefs.current[label];
            if (windowManagerRef && typeof windowManagerRef.bringToFront === 'function') {
                windowManagerRef.bringToFront();
            }
        }, 0);

        if (label === "Terminal") {
            setIsTerminalOpen(true);
            setMinimizedApps(prev => prev.filter(a => a !== "Terminal"));
        }
        if (label === "Explorer") {
            setIsExplorerOpen(true);
            setMinimizedApps(prev => prev.filter(a => a !== "Explorer"));
        }
        if (label === "Task Monitor") {
            setIsTaskMonitorOpen(true);
            setMinimizedApps(prev => prev.filter(a => a !== "Task Monitor"));
        }
        if (label === "Brave") {
            setIsBraveOpen(true);
            setMinimizedApps(prev => prev.filter(a => a !== "Brave"));
        }
        if (label === "Google") {
            setIsGoogleOpen(true);
            setMinimizedApps(prev => prev.filter(a => a !== "Google"));
        }
        if (label === "Reglook Mail") {
            setIsReglookMailOpen(true);
            setMinimizedApps(prev => prev.filter(a => a !== "Reglook Mail"));
        }
        if (label === "Photos") {
            setIsGalleryOpen(true);
            setMinimizedApps(prev => prev.filter(a => a !== "Photos"));
        }
        if (label === "FaceTime") {
            setIsFaceTimeOpen(true);
            setMinimizedApps(prev => prev.filter(a => a !== "FaceTime"));
        }
        if (label === "Calendar") {
            setIsCalendarOpen(true);
            setMinimizedApps(prev => prev.filter(a => a !== "Calendar"));
        }
        if (label === "Finder") {
            setIsFinderOpen(true);
            setMinimizedApps(prev => prev.filter(a => a !== "Finder"));
        }
        if (label === "xCloud") {
            setIsXCloudOpen(true);
            setMinimizedApps(prev => prev.filter(a => a !== "xCloud"));
        }
        if (label === "Settings") {
            setIsSettingsOpen(true);
            setMinimizedApps(prev => prev.filter(a => a !== "Settings"));
        }
        if (label === "Notepad") {
            setIsNotepadOpen(true);
            setMinimizedApps(prev => prev.filter(a => a !== "Notepad"));
        }
        if (label === "Music") {
            setIsMusicOpen(true);
            setMinimizedApps(prev => prev.filter(a => a !== "Music"));
        }
        if (label === "Device Manager") {
            setIsDeviceManagerOpen(true);
            setMinimizedApps(prev => prev.filter(a => a !== "Device Manager"));
        }
        if (label === "Account") {
            setIsAccountOpen(true);
            setMinimizedApps(prev => prev.filter(a => a !== "Account"));
        }

        if (!isOpen || isMinimized) {
            tryShowHomeVignette();
        }
    };

    const handleOpenTerminal = (vpsId: string, path: string) => {
        setTerminalConfig({ vpsId, path, timestamp: Date.now() });
        handleAppClick("Terminal", true);
    };

    const handleOpenTaskMonitor = (deviceId: string) => {
        setTaskMonitorDeviceId(deviceId);
        handleAppClick("Task Monitor", true);
    };

    const handleMinimize = (label: string) => {
        setMinimizedApps(prev => Array.from(new Set([...prev, label])));
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    const closeContextMenu = () => {
        setContextMenu(null);
    };

    const activeApps = React.useMemo(() => {
        const apps: string[] = [];
        if (isTerminalOpen) apps.push("Terminal");
        if (isExplorerOpen) apps.push("Explorer");
        if (isTaskMonitorOpen) apps.push("Task Monitor");
        if (isBraveOpen) apps.push("Brave");
        if (isGoogleOpen) apps.push("Google");
        if (isReglookMailOpen) apps.push("Reglook Mail");
        if (isGalleryOpen) apps.push("Photos");
        if (isFaceTimeOpen) apps.push("FaceTime");
        if (isCalendarOpen) apps.push("Calendar");
        if (isFinderOpen) apps.push("Finder");
        if (isXCloudOpen) apps.push("xCloud");
        if (isSettingsOpen) apps.push("Settings");
        if (isNotepadOpen) apps.push("Notepad");
        if (isMusicOpen) apps.push("Music");
        if (isDeviceManagerOpen) apps.push("Device Manager");
        if (isAccountOpen) apps.push("Account");
        return apps;
    }, [
        isTerminalOpen,
        isExplorerOpen,
        isTaskMonitorOpen,
        isBraveOpen,
        isGoogleOpen,
        isReglookMailOpen,
        isGalleryOpen,
        isFaceTimeOpen,
        isCalendarOpen,
        isFinderOpen,
        isXCloudOpen,
        isSettingsOpen,
        isNotepadOpen,
        isMusicOpen,
        isDeviceManagerOpen,
        isAccountOpen,
    ]);



    const handleWallpaperChange = async (img: string) => {
        setBackgroundImage(img);
    };

    if (!isAuthenticated) {
        return <div className="min-h-screen w-full bg-black" />;
    }

    return (
        <ZIndexProvider>
            <AdVisibilityProvider showAds={showAds}>
                <div
                    className="relative min-h-screen w-full overflow-hidden bg-black font-sans selection:bg-white/20"
                    onContextMenu={handleContextMenu}
                >
                {/* Hidden glass interface just to include the SVG filter once for the whole page */}
                <div className="hidden">
                    <GlassInterface includeSvgFilter={true}>
                        <div />
                    </GlassInterface>
                </div>
                {/* Background Image */}
                <BackgroundChanger
                    currentBackground={backgroundImage}
                    onChangeBackground={handleWallpaperChange}
                />

                {/* Menubar */}
                <Menubar
                    showPlanBadge
                    showMusicExperience
                    onCalendarClick={() => {
                        const countsTowardVignette =
                            !isCalendarOpen || minimizedApps.includes("Calendar");
                        setIsCalendarOpen(true);
                        setMinimizedApps(prev => prev.filter(a => a !== "Calendar"));
                        if (countsTowardVignette) tryShowHomeVignette();
                        // Bring to front
                        setTimeout(() => {
                            const windowManagerRef = windowManagerRefs.current["Calendar"];
                            if (windowManagerRef && typeof windowManagerRef.bringToFront === 'function') {
                                windowManagerRef.bringToFront();
                            }
                        }, 0);
                    }}
                    onFinderClick={() => {
                        const countsTowardVignette = !isFinderOpen || minimizedApps.includes("Finder");
                        setIsFinderOpen(true);
                        setMinimizedApps(prev => prev.filter(a => a !== "Finder"));
                        if (countsTowardVignette) tryShowHomeVignette();
                        // Bring to front
                        setTimeout(() => {
                            const windowManagerRef = windowManagerRefs.current["Finder"];
                            if (windowManagerRef && typeof windowManagerRef.bringToFront === 'function') {
                                windowManagerRef.bringToFront();
                            }
                        }, 0);
                    }}
                    onTerminalClick={() => {
                        const countsTowardVignette = !isTerminalOpen || minimizedApps.includes("Terminal");
                        setIsTerminalOpen(true);
                        setMinimizedApps(prev => prev.filter(a => a !== "Terminal"));
                        if (countsTowardVignette) tryShowHomeVignette();
                        setTimeout(() => {
                            const windowManagerRef = windowManagerRefs.current["Terminal"];
                            if (windowManagerRef && typeof windowManagerRef.bringToFront === 'function') {
                                windowManagerRef.bringToFront();
                            }
                        }, 0);
                    }}
                    onExplorerClick={() => {
                        const countsTowardVignette = !isExplorerOpen || minimizedApps.includes("Explorer");
                        setIsExplorerOpen(true);
                        setMinimizedApps(prev => prev.filter(a => a !== "Explorer"));
                        if (countsTowardVignette) tryShowHomeVignette();
                        setTimeout(() => {
                            const windowManagerRef = windowManagerRefs.current["Explorer"];
                            if (windowManagerRef && typeof windowManagerRef.bringToFront === 'function') {
                                windowManagerRef.bringToFront();
                            }
                        }, 0);
                    }}
                    onSettingsClick={() => {
                        const countsTowardVignette = !isSettingsOpen || minimizedApps.includes("Settings");
                        setIsSettingsOpen(true);
                        setMinimizedApps(prev => prev.filter(a => a !== "Settings"));
                        if (countsTowardVignette) tryShowHomeVignette();
                        setTimeout(() => {
                            const windowManagerRef = windowManagerRefs.current["Settings"];
                            if (windowManagerRef && typeof windowManagerRef.bringToFront === 'function') {
                                windowManagerRef.bringToFront();
                            }
                        }, 0);
                    }}
                />


                {/* Main Content Area */}
                <main className="relative pt-40 pb-40 px-10 h-[calc(100vh-120px)] overflow-hidden">
                    <div className="max-w-[1200px] mx-auto flex flex-col items-center justify-center h-full">
                        <AnimatePresence>
                            {isWidgetsVisible && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex flex-col gap-6 items-center"
                                >
                                    <div className="w-full flex justify-center transform transition-all duration-700 hover:scale-[1.01]">
                                        <WeatherWidget />
                                    </div>

                                    <div className="flex flex-wrap justify-center gap-6">
                                        <div className="transform transition-all duration-700 delay-100 hover:scale-[1.03]">
                                            <BoosterWidget />
                                        </div>

                                        <div className="transform transition-all duration-700 delay-200 hover:scale-[1.03]">
                                            <NoteWidget onClick={() => handleAppClick("Notepad")} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>

                {/* Apps - Render in click order for proper z-index stacking */}
                {appClickOrder.map(appName => {
                    switch (appName) {
                        case "Terminal":
                            return isTerminalOpen ? (
                                <div key="Terminal" style={{ display: minimizedApps.includes("Terminal") ? "none" : "block" }}>
                                    <WindowManager
                                        appName="Terminal"
                                        isOpen={true}
                                        ref={ref => { windowManagerRefs.current["Terminal"] = ref || undefined; }}
                                    >
                                        <Terminal
                                            isOpen={true}
                                            onClose={() => setIsTerminalOpen(false)}
                                            onMinimize={() => handleMinimize("Terminal")}
                                            vpsId={terminalConfig?.vpsId}
                                            initialPath={terminalConfig?.path}
                                            requestId={terminalConfig?.timestamp}
                                        />
                                    </WindowManager>
                                </div>
                            ) : null;
                        case "Explorer":
                            return isExplorerOpen ? (
                                <div key="Explorer" style={{ display: minimizedApps.includes("Explorer") ? "none" : "block" }}>
                                    <WindowManager
                                        appName="Explorer"
                                        isOpen={true}
                                        ref={ref => { windowManagerRefs.current["Explorer"] = ref || undefined; }}
                                    >
                                        <Explorer
                                            isOpen={true}
                                            onClose={() => setIsExplorerOpen(false)}
                                            onMinimize={() => handleMinimize("Explorer")}
                                            onOpenTerminal={handleOpenTerminal}
                                            onOpenTaskMonitor={handleOpenTaskMonitor}
                                        />
                                    </WindowManager>
                                </div>
                            ) : null;
                        case "Task Monitor":
                            return isTaskMonitorOpen ? (
                                <div key="Task Monitor" style={{ display: minimizedApps.includes("Task Monitor") ? "none" : "block" }}>
                                    <WindowManager
                                        appName="Task Monitor"
                                        isOpen={true}
                                        ref={ref => { windowManagerRefs.current["Task Monitor"] = ref || undefined; }}
                                    >
                                        <TaskMonitor
                                            isOpen={true}
                                            deviceId={taskMonitorDeviceId || null}
                                            onClose={() => setIsTaskMonitorOpen(false)}
                                            onMinimize={() => handleMinimize("Task Monitor")}
                                        />
                                    </WindowManager>
                                </div>
                            ) : null;
                        case "Brave":
                            return isBraveOpen && !minimizedApps.includes("Brave") ? (
                                <WindowManager
                                    key="Brave"
                                    appName="Brave"
                                    isOpen={true}
                                    ref={ref => { windowManagerRefs.current["Brave"] = ref || undefined; }}
                                >
                                    <Brave
                                        isOpen={true}
                                        onClose={() => setIsBraveOpen(false)}
                                        onMinimize={() => handleMinimize("Brave")}
                                    />
                                </WindowManager>
                            ) : null;
                        case "Google":
                            return isGoogleOpen ? (
                                <WindowManager
                                    key="Google"
                                    appName="Google"
                                    isOpen={true}
                                    ref={ref => { windowManagerRefs.current["Google"] = ref || undefined; }}
                                >
                                    <Google
                                        isOpen={true}
                                        onClose={() => setIsGoogleOpen(false)}
                                    />
                                </WindowManager>
                            ) : null;
                        case "Reglook Mail":
                            return isReglookMailOpen && !minimizedApps.includes("Reglook Mail") ? (
                                <WindowManager
                                    key="Reglook Mail"
                                    appName="Reglook Mail"
                                    isOpen={true}
                                    ref={ref => { windowManagerRefs.current["Reglook Mail"] = ref || undefined; }}
                                >
                                    <ReglookMail
                                        isOpen={true}
                                        onClose={() => setIsReglookMailOpen(false)}
                                        onMinimize={() => handleMinimize("Reglook Mail")}
                                    />
                                </WindowManager>
                            ) : null;
                        case "Photos":
                            return isGalleryOpen && !minimizedApps.includes("Photos") ? (
                                <WindowManager
                                    key="Photos"
                                    appName="Photos"
                                    isOpen={true}
                                    ref={ref => { windowManagerRefs.current["Photos"] = ref || undefined; }}
                                >
                                    <Gallery
                                        isOpen={true}
                                        onClose={() => setIsGalleryOpen(false)}
                                        onMinimize={() => handleMinimize("Photos")}
                                    />
                                </WindowManager>
                            ) : null;
                        case "FaceTime":
                            return isFaceTimeOpen && !minimizedApps.includes("FaceTime") ? (
                                <WindowManager
                                    key="FaceTime"
                                    appName="FaceTime"
                                    isOpen={true}
                                    ref={ref => { windowManagerRefs.current["FaceTime"] = ref || undefined; }}
                                >
                                    <FaceTime
                                        isOpen={true}
                                        onClose={() => setIsFaceTimeOpen(false)}
                                        onMinimize={() => handleMinimize("FaceTime")}
                                    />
                                </WindowManager>
                            ) : null;
                        case "Calendar":
                            return isCalendarOpen && !minimizedApps.includes("Calendar") ? (
                                <WindowManager
                                    key="Calendar"
                                    appName="Calendar"
                                    isOpen={true}
                                    ref={ref => { windowManagerRefs.current["Calendar"] = ref || undefined; }}
                                >
                                    <Calendar
                                        isOpen={true}
                                        onClose={() => setIsCalendarOpen(false)}
                                        onMinimize={() => handleMinimize("Calendar")}
                                    />
                                </WindowManager>
                            ) : null;
                        case "Finder":
                            return isFinderOpen && !minimizedApps.includes("Finder") ? (
                                <WindowManager
                                    key="Finder"
                                    appName="Finder"
                                    isOpen={true}
                                    ref={ref => { windowManagerRefs.current["Finder"] = ref || undefined; }}
                                >
                                    <Finder
                                        isOpen={true}
                                        onClose={() => setIsFinderOpen(false)}
                                        onMinimize={() => handleMinimize("Finder")}
                                    />
                                </WindowManager>
                            ) : null;
                        case "xCloud":
                            return isXCloudOpen && !minimizedApps.includes("xCloud") ? (
                                <WindowManager
                                    key="xCloud"
                                    appName="xCloud"
                                    isOpen={true}
                                    ref={ref => { windowManagerRefs.current["xCloud"] = ref || undefined; }}
                                >
                                    <XCloud
                                        isOpen={true}
                                        onClose={() => setIsXCloudOpen(false)}
                                        onMinimize={() => handleMinimize("xCloud")}
                                    />
                                </WindowManager>
                            ) : null;
                        case "Settings":
                            return isSettingsOpen && !minimizedApps.includes("Settings") ? (
                                <WindowManager
                                    key="Settings"
                                    appName="Settings"
                                    isOpen={true}
                                    ref={ref => { windowManagerRefs.current["Settings"] = ref || undefined; }}
                                >
                                    <Settings
                                        isOpen={true}
                                        onClose={() => setIsSettingsOpen(false)}
                                        onMinimize={() => handleMinimize("Settings")}
                                    />
                                </WindowManager>
                            ) : null;
                        case "Notepad":
                            return isNotepadOpen && !minimizedApps.includes("Notepad") ? (
                                <WindowManager
                                    key="Notepad"
                                    appName="Notepad"
                                    isOpen={true}
                                    ref={ref => { windowManagerRefs.current["Notepad"] = ref || undefined; }}
                                >
                                    <Notepad
                                        isOpen={true}
                                        onClose={() => setIsNotepadOpen(false)}
                                        onMinimize={() => handleMinimize("Notepad")}
                                    />
                                </WindowManager>
                            ) : null;
                        case "Music":
                            return isMusicOpen && !minimizedApps.includes("Music") ? (
                                <WindowManager
                                    key="Music"
                                    appName="Music"
                                    isOpen={true}
                                    ref={ref => { windowManagerRefs.current["Music"] = ref || undefined; }}
                                >
                                    <MusicApp
                                        isOpen={true}
                                        onClose={() => setIsMusicOpen(false)}
                                        onMinimize={() => handleMinimize("Music")}
                                    />
                                </WindowManager>
                            ) : null;
                        case "Device Manager":
                            return isDeviceManagerOpen && !minimizedApps.includes("Device Manager") ? (
                                <WindowManager
                                    key="Device Manager"
                                    appName="Device Manager"
                                    isOpen={true}
                                    ref={ref => { windowManagerRefs.current["Device Manager"] = ref || undefined; }}
                                >
                                    <DeviceManager
                                        isOpen={true}
                                        onClose={() => setIsDeviceManagerOpen(false)}
                                        onMinimize={() => handleMinimize("Device Manager")}
                                    />
                                </WindowManager>
                            ) : null;
                        case "Account":
                            return isAccountOpen && !minimizedApps.includes("Account") ? (
                                <WindowManager
                                    key="Account"
                                    appName="Account"
                                    isOpen={true}
                                    ref={ref => { windowManagerRefs.current["Account"] = ref || undefined; }}
                                >
                                    <AccountApp
                                        isOpen={true}
                                        onClose={() => setIsAccountOpen(false)}
                                        onMinimize={() => handleMinimize("Account")}
                                    />
                                </WindowManager>
                            ) : null;
                        default:
                            return null;
                    }
                })}

                {/* Render any newly opened apps not yet in click order */}
                {isTerminalOpen && !minimizedApps.includes("Terminal") && !appClickOrder.includes("Terminal") && (
                    <WindowManager
                        key="Terminal-new"
                        appName="Terminal"
                        isOpen={true}
                        ref={ref => { windowManagerRefs.current["Terminal"] = ref || undefined; }}
                    >
                        <Terminal
                            isOpen={true}
                            onClose={() => setIsTerminalOpen(false)}
                            onMinimize={() => handleMinimize("Terminal")}
                            vpsId={terminalConfig?.vpsId}
                            initialPath={terminalConfig?.path}
                        />
                    </WindowManager>
                )}

                {isExplorerOpen && !minimizedApps.includes("Explorer") && !appClickOrder.includes("Explorer") && (
                    <WindowManager
                        key="Explorer-new"
                        appName="Explorer"
                        isOpen={true}
                        ref={ref => { windowManagerRefs.current["Explorer"] = ref || undefined; }}
                    >
                        <Explorer
                            isOpen={true}
                            onClose={() => setIsExplorerOpen(false)}
                            onMinimize={() => handleMinimize("Explorer")}
                            onOpenTerminal={handleOpenTerminal}
                            onOpenTaskMonitor={handleOpenTaskMonitor}
                        />
                    </WindowManager>
                )}

                {isTaskMonitorOpen && !minimizedApps.includes("Task Monitor") && !appClickOrder.includes("Task Monitor") && (
                    <WindowManager
                        key="Task Monitor-new"
                        appName="Task Monitor"
                        isOpen={true}
                        ref={ref => { windowManagerRefs.current["Task Monitor"] = ref || undefined; }}
                    >
                        <TaskMonitor
                            isOpen={true}
                            deviceId={taskMonitorDeviceId || null}
                            onClose={() => setIsTaskMonitorOpen(false)}
                            onMinimize={() => handleMinimize("Task Monitor")}
                        />
                    </WindowManager>
                )}

                {isBraveOpen && !minimizedApps.includes("Brave") && !appClickOrder.includes("Brave") && (
                    <WindowManager
                        key="Brave-new"
                        appName="Brave"
                        isOpen={true}
                        ref={ref => { windowManagerRefs.current["Brave"] = ref || undefined; }}
                    >
                        <Brave
                            isOpen={true}
                            onClose={() => setIsBraveOpen(false)}
                            onMinimize={() => handleMinimize("Brave")}
                        />
                    </WindowManager>
                )}

                {isGoogleOpen && !appClickOrder.includes("Google") && (
                    <WindowManager
                        key="Google-new"
                        appName="Google"
                        isOpen={true}
                        ref={ref => { windowManagerRefs.current["Google"] = ref || undefined; }}
                    >
                        <Google
                            isOpen={true}
                            onClose={() => setIsGoogleOpen(false)}
                        />
                    </WindowManager>
                )}

                {isReglookMailOpen && !minimizedApps.includes("Reglook Mail") && !appClickOrder.includes("Reglook Mail") && (
                    <WindowManager
                        key="Reglook Mail-new"
                        appName="Reglook Mail"
                        isOpen={true}
                        ref={ref => { windowManagerRefs.current["Reglook Mail"] = ref || undefined; }}
                    >
                        <ReglookMail
                            isOpen={true}
                            onClose={() => setIsReglookMailOpen(false)}
                            onMinimize={() => handleMinimize("Reglook Mail")}
                        />
                    </WindowManager>
                )}

                {isGalleryOpen && !minimizedApps.includes("Photos") && !appClickOrder.includes("Photos") && (
                    <WindowManager
                        key="Photos-new"
                        appName="Photos"
                        isOpen={true}
                        ref={ref => { windowManagerRefs.current["Photos"] = ref || undefined; }}
                    >
                        <Gallery
                            isOpen={true}
                            onClose={() => setIsGalleryOpen(false)}
                            onMinimize={() => handleMinimize("Photos")}
                        />
                    </WindowManager>
                )}

                {isFaceTimeOpen && !minimizedApps.includes("FaceTime") && !appClickOrder.includes("FaceTime") && (
                    <WindowManager
                        key="FaceTime-new"
                        appName="FaceTime"
                        isOpen={true}
                        ref={ref => { windowManagerRefs.current["FaceTime"] = ref || undefined; }}
                    >
                        <FaceTime
                            isOpen={true}
                            onClose={() => setIsFaceTimeOpen(false)}
                            onMinimize={() => handleMinimize("FaceTime")}
                        />
                    </WindowManager>
                )}

                {isCalendarOpen && !minimizedApps.includes("Calendar") && !appClickOrder.includes("Calendar") && (
                    <WindowManager
                        key="Calendar-new"
                        appName="Calendar"
                        isOpen={true}
                        ref={ref => { windowManagerRefs.current["Calendar"] = ref || undefined; }}
                    >
                        <Calendar
                            isOpen={true}
                            onClose={() => setIsCalendarOpen(false)}
                            onMinimize={() => handleMinimize("Calendar")}
                        />
                    </WindowManager>
                )}

                {isFinderOpen && !minimizedApps.includes("Finder") && !appClickOrder.includes("Finder") && (
                    <WindowManager
                        key="Finder-new"
                        appName="Finder"
                        isOpen={true}
                        ref={ref => { windowManagerRefs.current["Finder"] = ref || undefined; }}
                    >
                        <Finder
                            isOpen={true}
                            onClose={() => setIsFinderOpen(false)}
                            onMinimize={() => handleMinimize("Finder")}
                        />
                    </WindowManager>
                )}

                {isXCloudOpen && !minimizedApps.includes("xCloud") && !appClickOrder.includes("xCloud") && (
                    <WindowManager
                        key="xCloud-new"
                        appName="xCloud"
                        isOpen={true}
                        ref={ref => { windowManagerRefs.current["xCloud"] = ref || undefined; }}
                    >
                        <XCloud
                            isOpen={true}
                            onClose={() => setIsXCloudOpen(false)}
                            onMinimize={() => handleMinimize("xCloud")}
                        />
                    </WindowManager>
                )}

                {isSettingsOpen && !minimizedApps.includes("Settings") && !appClickOrder.includes("Settings") && (
                    <WindowManager
                        key="Settings-new"
                        appName="Settings"
                        isOpen={true}
                        ref={ref => { windowManagerRefs.current["Settings"] = ref || undefined; }}
                    >
                        <Settings
                            isOpen={true}
                            onClose={() => setIsSettingsOpen(false)}
                            onMinimize={() => handleMinimize("Settings")}
                        />
                    </WindowManager>
                )}

                {isNotepadOpen && !minimizedApps.includes("Notepad") && !appClickOrder.includes("Notepad") && (
                    <WindowManager
                        key="Notepad-new"
                        appName="Notepad"
                        isOpen={true}
                        ref={ref => { windowManagerRefs.current["Notepad"] = ref || undefined; }}
                    >
                        <Notepad
                            isOpen={true}
                            onClose={() => setIsNotepadOpen(false)}
                            onMinimize={() => handleMinimize("Notepad")}
                        />
                    </WindowManager>
                )}

                {isMusicOpen && !minimizedApps.includes("Music") && !appClickOrder.includes("Music") && (
                    <WindowManager
                        key="Music-new"
                        appName="Music"
                        isOpen={true}
                        ref={ref => { windowManagerRefs.current["Music"] = ref || undefined; }}
                    >
                        <MusicApp
                            isOpen={true}
                            onClose={() => setIsMusicOpen(false)}
                            onMinimize={() => handleMinimize("Music")}
                        />
                    </WindowManager>
                )}

                {isDeviceManagerOpen && !minimizedApps.includes("Device Manager") && !appClickOrder.includes("Device Manager") && (
                    <WindowManager
                        key="Device Manager-new"
                        appName="Device Manager"
                        isOpen={true}
                        ref={ref => { windowManagerRefs.current["Device Manager"] = ref || undefined; }}
                    >
                        <DeviceManager
                            isOpen={true}
                            onClose={() => setIsDeviceManagerOpen(false)}
                            onMinimize={() => handleMinimize("Device Manager")}
                        />
                    </WindowManager>
                )}

                {isAccountOpen && !minimizedApps.includes("Account") && !appClickOrder.includes("Account") && (
                    <WindowManager
                        key="Account-new"
                        appName="Account"
                        isOpen={true}
                        ref={ref => { windowManagerRefs.current["Account"] = ref || undefined; }}
                    >
                        <AccountApp
                            isOpen={true}
                            onClose={() => setIsAccountOpen(false)}
                            onMinimize={() => handleMinimize("Account")}
                        />
                    </WindowManager>
                )}

                <IdleScreenAd
                    suspend={
                        clickInterstitialOpen ||
                        intervalInterstitialOpen ||
                        multiplexInterstitialOpen ||
                        homeVignetteOpen
                    }
                    onOpenChange={setIdleInterstitialOpen}
                    idleMs={20_000}
                />
                <IntervalScreenAd
                    suspend={
                        idleInterstitialOpen ||
                        clickInterstitialOpen ||
                        multiplexInterstitialOpen ||
                        homeVignetteOpen
                    }
                    onOpenChange={setIntervalInterstitialOpen}
                    intervalMs={60_000}
                />
                <ClickScreenAd
                    suspend={
                        idleInterstitialOpen ||
                        intervalInterstitialOpen ||
                        multiplexInterstitialOpen ||
                        homeVignetteOpen
                    }
                    onOpenChange={setClickInterstitialOpen}
                    clicksThreshold={10}
                />
                <MultiplexScreenAd
                    suspend={
                        idleInterstitialOpen ||
                        intervalInterstitialOpen ||
                        clickInterstitialOpen ||
                        homeVignetteOpen
                    }
                    onOpenChange={setMultiplexInterstitialOpen}
                    delayMs={120_000}
                />

                <VignetteAdModal
                    open={homeVignetteOpen}
                    onDismiss={dismissHomeVignette}
                    bodyText="Full-screen slot for navigation interstitials (e.g. AdSense vignette). Shown sparingly after you open a few apps from the dock or menu."
                />

                {/* Sticky left rail — horizontal leaderboard-style slot */}
                <StickyLeftBannerAd />

                {/* Draggable video ad placeholder (bottom corner; AdSense later) */}
                <VideoAdUnit bottomOffset={96} />

                {/* Dock */}
                <Dock
                    onAppClick={handleAppClick}
                    activeApps={activeApps}
                />

                {/* Desktop Context Menu */}
                {contextMenu && (
                    <DesktopContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        onClose={closeContextMenu}
                        activeApps={activeApps}
                    />
                )}

                {/* Shutdown Overlay */}
                <AnimatePresence>
                    {isShuttingDown && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="fixed inset-0 z-[100000] bg-black/10 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none"
                        >
                            <div className="flex flex-col items-center gap-6">
                                <div className="w-16 h-16 border-4 border-white/10 border-t-white rounded-full animate-spin" />
                                <span className="text-white font-medium text-lg">Shutting Down...</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                </div>
            </AdVisibilityProvider>
        </ZIndexProvider>
    );
}
