"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence, useDragControls, useMotionValue } from "framer-motion";
import {
    Images,
    Search,
    Plus,
    Grid,
    Heart,
    Clock,
    MapPinned,
    Users,
    Trash2,
    EyeOff,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    ZoomIn,
    Filter,
    Share2,
    Info,
    Maximize2,
    Minimize2,
    X,
    Image as ImageIcon,

    RefreshCw,
    Database,
    CheckIcon,
    Copy,
    Hash,
    Terminal,
    AlertTriangle,
    Check,
    Loader2,
    HardDrive
} from "lucide-react";
import { WINDOW_CONSTANTS } from "../window-constants";
import Image from "next/image";
import { BASE_URL } from "@/lib/baseURL";
import { AppHorizontalAdTrack } from "@/components/ads";

interface GalleryProps {
    isOpen: boolean;
    onClose: () => void;
    onMinimize?: () => void;
}

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

interface RemoteImage {
    name: string;
    path: string;
    size: number;
    type: "image";
    downloadUrl?: string; // Filled when selected
    status?: 'none' | 'loading' | 'ready' | 'failed';
    mtime?: string | Date;
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
        username: string;
    };
}

export function Gallery({ isOpen, onClose, onMinimize }: GalleryProps) {
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
    const [activeTab, setActiveTab] = useState("Home");
    const [selectedPhoto, setSelectedPhoto] = useState<RemoteImage | null>(null);
    const [zoomLevel, setZoomLevel] = useState(0.8);

    // Remote State
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [devices, setDevices] = useState<DeviceItem[]>([]);
    const [fetchingDevices, setFetchingDevices] = useState(false);
    const [remoteImages, setRemoteImages] = useState<RemoteImage[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);

    // Upload State
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [photoToDelete, setPhotoToDelete] = useState<RemoteImage | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [backgroundTried, setBackgroundTried] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-preview images sequentially (Background only, 3-sec best effort)
    useEffect(() => {
        if (remoteImages.length > 0 && deviceId) {
            // Find images that haven't been attempted by background yet
            const unloaded = remoteImages.filter(p => !p.downloadUrl && p.status === 'none' && !backgroundTried.has(p.path));

            // Process up to 3 in parallel with 3-sec limit
            const batch = unloaded.slice(0, 3);

            batch.forEach(photo => {
                setBackgroundTried(prev => new Set(prev).add(photo.path));
                fetchPhotoPreview(photo, true);
            });
        }
    }, [remoteImages, deviceId, backgroundTried]);

    const [showManualGuide, setShowManualGuide] = useState(false);
    const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // PERSISTENCE: Load cache from localStorage
    useEffect(() => {
        if (deviceId && isOpen) {
            const cacheKey = `gallery_cache_${deviceId}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    setRemoteImages(parsed);
                } catch (e) {
                    console.error("Failed to parse gallery cache:", e);
                }
            }
        }
    }, [deviceId, isOpen]);

    // PERSISTENCE: Save to localStorage whenever remoteImages changes
    useEffect(() => {
        if (deviceId && remoteImages.length > 0) {
            const cacheKey = `gallery_cache_${deviceId}`;
            localStorage.setItem(cacheKey, JSON.stringify(remoteImages));
        }
    }, [deviceId, remoteImages]);

    const computeSHA256 = async (file: File): Promise<string> => {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const handleCopy = (cmd: string) => {
        navigator.clipboard.writeText(cmd);
        setCopiedCommand(cmd);
        setTimeout(() => setCopiedCommand(null), 2000);
    };

    const handleUpload = async (files: FileList | File[]) => {
        const selectedDevice = devices.find(d => d.device.id === deviceId);
        const vpsId = selectedDevice?.vps.id;
        if (!vpsId || !deviceId || files.length === 0) return;

        setIsUploading(true);
        setUploadProgress(0);
        setUploadError(null);

        try {
            const filesArray = Array.from(files);
            for (let i = 0; i < filesArray.length; i++) {
                const file = filesArray[i];
                if (!file.type.startsWith('image/')) continue;

                // 1. Calculate SHA256
                const sha256 = await computeSHA256(file);

                // 2. Init R2 Upload
                const initRes = await fetch(`${BASE_URL}/cockpit/vps/${vpsId}/uploads/init`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filename: file.name,
                        sizeBytes: file.size,
                        mimeType: file.type,
                        destPath: `/home/${file.name}`
                    }),
                    credentials: 'include'
                });

                if (!initRes.ok) throw new Error("Failed to initialize cloud upload");
                const { uploadId, putUrl } = await initRes.json();

                // 3. PUT directly to R2
                const uploadRes = await fetch(putUrl, {
                    method: 'PUT',
                    body: file,
                    headers: { 'Content-Type': file.type }
                });

                if (!uploadRes.ok) throw new Error("Failed to upload to cloud storage");

                // 4. Signal completion to trigger Agent pull
                const completeRes = await fetch(`${BASE_URL}/cockpit/vps/${vpsId}/uploads/${uploadId}/complete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sha256 }),
                    credentials: 'include'
                });

                if (!completeRes.ok) throw new Error("Failed to signal agent task");
                const { taskId } = await completeRes.json();

                // 5. Poll for agent task completion
                await pollTaskProgress(vpsId, uploadId, (pct) => {
                    setUploadProgress(((i + (pct / 100)) / filesArray.length) * 100);
                });
            }

            // Success! Refresh
            setTimeout(() => fetchImages(deviceId), 1000);
        } catch (e: any) {
            console.error("Upload error:", e);
            setUploadError(e.message || "An error occurred during upload");
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const pollTaskProgress = async (vpsId: string, uploadId: string, onPct: (pct: number) => void) => {
        return new Promise((resolve, reject) => {
            const interval = setInterval(async () => {
                try {
                    const res = await fetch(`${BASE_URL}/cockpit/vps/${vpsId}/uploads/${uploadId}`, { credentials: 'include' });
                    if (!res.ok) return;
                    const data = await res.json();

                    const progress = data.task?.result?.progressPct || 0;
                    onPct(progress);

                    if (data.task?.status === 'succeeded') {
                        clearInterval(interval);
                        resolve(true);
                    } else if (data.task?.status === 'failed') {
                        clearInterval(interval);
                        reject(new Error(data.task.error || "Agent task failed"));
                    }
                } catch (e) {
                    clearInterval(interval);
                    reject(e);
                }
            }, 1000);
        });
    };

    // Paste handler
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (!isOpen || !deviceId || isUploading) return;
            const items = e.clipboardData?.items;
            if (!items) return;

            const files: File[] = [];
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        files.push(new File([blob], `pasted-${Date.now()}.png`, { type: blob.type }));
                    }
                }
            }
            if (files.length > 0) handleUpload(files);
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isOpen, deviceId, isUploading]);

    const fetchDevices = async () => {
        setFetchingDevices(true);
        try {
            const res = await fetch(`${BASE_URL}/cockpit/cocktail/devices`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                const enrolled = (data || []).filter((d: any) => d.device?.status !== 'enrolling');
                setDevices(enrolled);

                // Auto-connect if only one enrolled device exists — skip the picker entirely
                if (enrolled.length === 1) {
                    setDeviceId(enrolled[0].device.id);
                }
            }
        } catch (e) {
            console.error("Failed to fetch devices:", e);
        } finally {
            setFetchingDevices(false);
        }
    };

    const fetchImages = async (dId: string) => {
        setIsScanning(true);
        setScanError(null);
        try {
            // Use search for deep discovery in /home
            const res = await fetch(`${BASE_URL}/cocktail-fs/${dId}/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    root: '/home',
                    query: 'jpg|jpeg|png|webp|gif|bmp',
                    maxResults: 200
                }),
                credentials: 'include'
            });

            if (!res.ok) throw new Error("Search failed");
            const data = await res.json();
            const items = data.items || [];

            // Map results to Gallery state
            const images = items.map((item: any) => ({
                name: item.name,
                path: item.path,
                size: item.size,
                mtime: item.mtime,
                type: 'image',
                status: 'none'
            }));

            setRemoteImages(prev => {
                // Merge new discovery with existing cache to keep downloadUrls
                const merged = [...images];
                prev.forEach(p => {
                    const idx = merged.findIndex(m => m.path === p.path);
                    if (idx !== -1 && p.downloadUrl) {
                        merged[idx] = { ...merged[idx], downloadUrl: p.downloadUrl, status: 'ready' };
                    }
                });
                return merged;
            });
        } catch (e: any) {
            setScanError(e.message);
        } finally {
            setIsScanning(false);
        }
    };

    useEffect(() => {
        if (isOpen && !deviceId) {
            fetchDevices();
        }
    }, [isOpen, deviceId]);

    useEffect(() => {
        if (deviceId && isOpen) {
            fetchImages(deviceId);
        }
    }, [deviceId, isOpen]);

    const selectedDeviceName = useMemo(() => {
        return devices.find(d => d.device.id === deviceId)?.device.name;
    }, [devices, deviceId]);

    const fetchPhotoPreview = async (photo: RemoteImage, isBackground = false) => {
        if (photo.status === 'loading' || photo.downloadUrl) return;

        // Set loading in grid
        setRemoteImages(prev => prev.map(p =>
            p.path === photo.path ? { ...p, status: 'loading' } : p
        ));

        try {
            const res = await fetch(`${BASE_URL}/cockpit/cocktail/transfers/download/init`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId, path: photo.path }),
                credentials: 'include'
            });

            if (!res.ok) throw new Error("Failed to init preview");
            const { taskId, downloadUrl } = await res.json();

            // Poll for task completion
            let finished = false;
            let attempts = 0;
            // 3 seconds for background (5 * 600ms), 60 seconds for manual (100 * 600ms)
            const MAX_ATTEMPTS = isBackground ? 5 : 100;

            while (!finished && attempts < MAX_ATTEMPTS) {
                const sRes = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${deviceId}/tasks?limit=10`, { credentials: 'include' });
                if (sRes.ok) {
                    const tasks = await sRes.json();
                    const task = tasks.find((t: any) => t.id === taskId);
                    if (task?.status === 'succeeded') finished = true;
                    else if (task?.status === 'failed') throw new Error(task.error || "VPS failed");
                }
                if (!finished) {
                    await new Promise(r => setTimeout(r, 600));
                    attempts++;
                }
            }

            if (!finished) throw new Error(isBackground ? "Background Timeout" : "VPS Task Timeout (60s)");

            const readyPhoto = { ...photo, status: 'ready' as const, downloadUrl };

            // Update the grid
            setRemoteImages(prev => prev.map(p =>
                p.path === photo.path ? readyPhoto : p
            ));

            return readyPhoto;
        } catch (e: any) {
            console.warn(`Preview for ${photo.name}: ${e.message}`);
            // If background fails or times out, revert to 'none' so it looks like "click to preview"
            // For manual clicks, you might want it to show 'failed', but 'none' is cleaner for "click again"
            setRemoteImages(prev => prev.map(p =>
                p.path === photo.path ? { ...p, status: 'none' } : p
            ));
            return null;
        }
    };
    const handleImageError = (photoPath: string) => {
        setRemoteImages(prev => prev.map(p =>
            p.path === photoPath ? { ...p, downloadUrl: undefined, status: 'none' } : p
        ));
        setBackgroundTried(prev => {
            const next = new Set(prev);
            next.delete(photoPath);
            return next;
        });
        if (selectedPhoto?.path === photoPath) {
            const photo = remoteImages.find(p => p.path === photoPath);
            if (photo) {
                setSelectedPhoto({ ...photo, status: 'loading' });
                fetchPhotoPreview(photo).then(result => {
                    if (result) setSelectedPhoto(result);
                    else setSelectedPhoto(null);
                });
            }
        }
    };

    const handleSelectPhoto = async (photo: RemoteImage) => {
        // If it's already loading/ready, just select it
        if (photo.downloadUrl) {
            setSelectedPhoto(photo);
            return;
        }

        setSelectedPhoto({ ...photo, status: 'loading' });
        const result = await fetchPhotoPreview(photo);
        if (result) {
            setSelectedPhoto(result);
        } else {
            setSelectedPhoto(null);
        }
    };

    const handleNextPhoto = () => {
        if (!selectedPhoto) return;
        const idx = remoteImages.findIndex(p => p.path === selectedPhoto.path);
        if (idx !== -1 && idx < remoteImages.length - 1) {
            handleSelectPhoto(remoteImages[idx + 1]);
        }
    };

    const handlePrevPhoto = () => {
        if (!selectedPhoto) return;
        const idx = remoteImages.findIndex(p => p.path === selectedPhoto.path);
        if (idx > 0) {
            handleSelectPhoto(remoteImages[idx - 1]);
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedPhoto) return;
            if (e.key === "ArrowRight") handleNextPhoto();
            if (e.key === "ArrowLeft") handlePrevPhoto();
            if (e.key === "Escape") setSelectedPhoto(null);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedPhoto, remoteImages]);

    const handleDeletePhoto = (photo: RemoteImage) => {
        setPhotoToDelete(photo);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!deviceId || !photoToDelete?.path) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`${BASE_URL}/cocktail-fs/${deviceId}/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: photoToDelete.path }),
                credentials: 'include'
            });

            if (!res.ok) throw new Error("Delete failed");

            // Remove from local state
            setRemoteImages(prev => prev.filter(p => p.path !== photoToDelete.path));
            setSelectedPhoto(null);
            setShowDeleteConfirm(false);
            setPhotoToDelete(null);
        } catch (e: any) {
            setUploadError(`Delete Failed: ${e.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

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

        const MIN_W = 800;
        const MIN_H = 600;

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

    const sidebarItems = [
        { icon: Grid, label: "Home" },
        { icon: Heart, label: "Favorites" },
        { icon: Clock, label: "Recents" },
        { icon: Users, label: "People" },
        { icon: MapPinned, label: "Places" },
        { icon: EyeOff, label: "Hidden" },
        { icon: Trash2, label: "Recently Deleted" },
    ];

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
                            "pointer-events-auto bg-zinc-900/95 border border-white/5 shadow-3xl flex flex-col overflow-hidden relative backdrop-blur-3xl text-white",
                            isMaximized ? "rounded-none" : "rounded-2xl",
                            isResizing ? "select-none" : "",
                        ].join(" ")}
                    >
                        {/* Header Area */}
                        <div
                            className="shrink-0 h-14 border-b border-white/5 flex items-center px-4 select-none bg-zinc-900/50"
                            onPointerDown={(e) => dragControls.start(e)}
                            onDoubleClick={toggleMaximize}
                        >
                            <div className="flex items-center gap-2 w-1/4">
                                <div onClick={toggleMaximize} className="flex items-center gap-2 cursor-pointer">
                                    <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="w-3 h-3 rounded-full bg-[#FF5F57] group/btn flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
                                        <X className="w-2 h-2 opacity-0 group-hover/btn:opacity-100 text-black/40" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); onMinimize?.(); }} className="w-3 h-3 rounded-full bg-[#FEBC2E] group/btn flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
                                        <div className="w-1.5 h-[1.5px] bg-black/40 opacity-0 group-hover/btn:opacity-100" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); toggleMaximize(); }} className="w-3 h-3 rounded-full bg-[#28C840] group/btn flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
                                        <Maximize2 className="w-1.5 h-1.5 opacity-0 group-hover/btn:opacity-100 text-black/40" />
                                    </button>
                                </div>

                                {selectedDeviceName && (
                                    <div className="flex items-center gap-2 ml-4 pl-4 border-l border-white/10">
                                        <span className="text-[10px] font-black text-white hover:text-white uppercase tracking-widest truncate max-w-[120px]">
                                            {selectedDeviceName}
                                        </span>
                                        <button
                                            onClick={() => setDeviceId(null)}
                                            className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-wider text-zinc-500/80 hover:text-white hover:bg-white/10 transition-all ml-1"
                                        >
                                            Switch
                                        </button>
                                    </div>
                                )}

                                <div className="ml-4 flex items-center gap-1">
                                    {/* <button className="p-1.5 hover:bg-white/5 rounded-md text-zinc-400">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button className="p-1.5 hover:bg-white/5 rounded-md text-zinc-400">
                                        <ChevronRight className="w-4 h-4" />
                                    </button> */}
                                </div>
                            </div>

                            <div className="flex-1 flex justify-center items-center gap-4">
                                {/* <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/5">
                                    <button className="px-5 py-1 text-[11px] font-medium bg-zinc-800 shadow-sm rounded-md transition-all text-white">Years</button>
                                    <button className="px-5 py-1 text-[11px] font-medium text-zinc-500 hover:text-white transition-all">Months</button>
                                    <button className="px-5 py-1 text-[11px] font-medium text-zinc-500 hover:text-white transition-all">Days</button>
                                    <button className="px-5 py-1 text-[11px] font-medium text-zinc-500 hover:text-white transition-all">All Photos</button>
                                </div> */}
                            </div>

                            <div className="w-1/4 flex justify-end items-center gap-3">

                                <button
                                    onClick={() => setShowManualGuide(true)}
                                    className="p-1.5 hover:bg-white/5 rounded-md text-zinc-400 group relative"
                                    title="Manual Transfer Guide"
                                >
                                    <Terminal className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-1.5 hover:bg-white/5 rounded-md text-zinc-400 group relative disabled:opacity-50"
                                    disabled={isUploading || !deviceId}
                                    title="Upload from Device"
                                >
                                    <Plus className="w-4 h-4" />
                                    {isUploading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 rounded-md">
                                            <div className="w-3 h-3 border border-t-white border-white/20 rounded-full animate-spin" />
                                        </div>
                                    )}
                                </button>

                            </div>
                        </div>

                        {/* Main Body */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* Content Grid */}
                            <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
                                {/* Grid Toolbar */}
                                <div className="h-10 border-b border-white/5 border-dashed flex items-center justify-between px-6 shrink-0 bg-zinc-950/80 backdrop-blur-md z-10">
                                    <span className="text-[14px] font-semibold text-white">{activeTab}</span>
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <Minimize2 className="w-3 h-3 text-zinc-500" />
                                            <input
                                                type="range"
                                                min="0.5"
                                                max="2"
                                                step="0.1"
                                                value={zoomLevel}
                                                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                                                className="w-24 accent-white"
                                            />
                                            <Maximize2 className="w-3 h-3 text-zinc-500" />
                                        </div>
                                    </div>
                                </div>

                                <div className="shrink-0 border-b border-white/5 bg-zinc-950/60 px-6 py-2">
                                    <AppHorizontalAdTrack />
                                </div>

                                {/* Main Grid Scroll Area */}
                                <div
                                    className="flex-1 overflow-y-auto p-6 no-scrollbar relative"
                                    onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                                    onDragLeave={() => setIsDraggingOver(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setIsDraggingOver(false);
                                        if (e.dataTransfer.files) handleUpload(e.dataTransfer.files);
                                    }}
                                >
                                    {/* Upload Progress Overlay */}
                                    {isUploading && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="sticky top-0 z-40 mb-6 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl overflow-hidden"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-zinc-500/20 flex items-center justify-center text-zinc-500">
                                                        <Plus className="w-4 h-4 animate-spin-slow" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black uppercase tracking-widest text-white">Uploading to VPS...</p>
                                                    </div>
                                                </div>
                                                <span className="text-[12px] font-black text-zinc-500">{Math.round(uploadProgress)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${uploadProgress}%` }}
                                                    transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Error Notification */}
                                    {/* {uploadError && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="sticky top-0 z-40 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between backdrop-blur-md"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-500">
                                                    <AlertTriangle className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black uppercase tracking-widest text-red-500">Upload Failed</p>
                                                    <p className="text-[9px] font-bold uppercase tracking-tighter text-red-400/80">{uploadError}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setUploadError(null)}
                                                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-red-500/20 transition-all"
                                            >
                                                Dismiss
                                            </button>
                                        </motion.div>
                                    )} */}
                                    {isDraggingOver && (
                                        <div className="absolute inset-0 z-50 bg-zinc-600/10 backdrop-blur-sm border-2 border-dashed border-zinc-500/50 rounded-2xl flex items-center justify-center m-4 pointer-events-none">
                                            <motion.div
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="flex flex-col items-center gap-4 bg-zinc-900/90 p-8 rounded-3xl border border-white/10"
                                            >
                                                <div className="w-16 h-16 rounded-2xl bg-zinc-500/20 flex items-center justify-center text-white">
                                                    <Plus className="w-8 h-8" />
                                                </div>
                                                <div className="flex flex-col items-center text-center">
                                                    <p className="text-white text-[15px] font-black uppercase tracking-widest">Drop to Upload</p>
                                                    <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-tighter mt-1">Files will be sent directly to your VPS home</p>
                                                </div>
                                            </motion.div>
                                        </div>
                                    )}

                                    {isScanning ? (
                                        <div className="h-full flex flex-col items-center justify-center gap-4">
                                            <div className="w-12 h-12 rounded-full border-2 border-zinc-800 border-t-white/40 animate-spin" />
                                        </div>
                                    ) : remoteImages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center">
                                            <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto mb-4">
                                                <Search className="w-6 h-6 text-zinc-800" />
                                            </div>
                                            <p className="text-[12px] text-zinc-400 font-bold">No images discovered.</p>
                                            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">Add photos to your remote home folder</p>
                                        </div>
                                    ) : (
                                        <div
                                            className="grid gap-4"
                                            style={{
                                                gridTemplateColumns: `repeat(auto-fill, minmax(${200 * zoomLevel}px, 1fr))`
                                            }}
                                        >
                                            {remoteImages.map((photo, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.01 }}
                                                    whileHover={{ scale: 1.02 }}
                                                    onClick={() => handleSelectPhoto(photo)}
                                                    className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl transition-all bg-zinc-900 border border-white/5"
                                                >
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <ImageIcon className="w-8 h-8 text-zinc-800/40" />
                                                    </div>

                                                    {photo.downloadUrl && (
                                                        <motion.img
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            src={photo.downloadUrl}
                                                            alt={photo.name}
                                                            onError={() => handleImageError(photo.path)}
                                                            className="absolute inset-0 w-full h-full object-cover"
                                                        />
                                                    )}

                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 pointer-events-none">
                                                        <span className="text-white text-[11px] font-bold truncate">{photo.name}</span>
                                                    </div>

                                                    {photo.status === 'loading' && (
                                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                                            <div className="w-6 h-6 border-2 border-white/10 border-t-white rounded-full animate-spin" />
                                                        </div>
                                                    )}

                                                    {/* <div className="absolute top-3 right-3 p-1.5 bg-black/40 backdrop-blur-md rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Share2 className="w-3.5 h-3.5 text-white" />
                                                    </div> */}
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Bottom Status Bar */}
                                <div className="h-6 flex items-center justify-center px-4 shrink-0 bg-zinc-950/50 backdrop-blur-md">
                                    <span className="text-[10px] text-zinc-500 font-medium">{remoteImages.length} Images Found</span>
                                </div>
                            </div>
                        </div>

                        {/* Photo Viewer Overlay */}
                        <AnimatePresence>
                            {selectedPhoto && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-50 bg-black/95 backdrop-blur-3xl flex flex-col"
                                >
                                    <div className="h-14 flex items-center justify-between px-6 shrink-0">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => setSelectedPhoto(null)}
                                                className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <div className="flex flex-col">
                                                <span className="text-white text-[13px] font-semibold">{selectedPhoto.name}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {/* <button className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"><Share2 className="w-4 h-4" /></button> */}
                                            {/* <button className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"><Heart className="w-4 h-4" /></button> */}
                                            {/* <button className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"><RotateCcw className="w-4 h-4" /></button> */}
                                            <button
                                                onClick={() => setShowInfo(!showInfo)}
                                                className={`p-2 rounded-full text-white transition-colors ${showInfo ? 'bg-white/20' : 'hover:bg-white/10'}`}
                                            >
                                                <Info className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeletePhoto(selectedPhoto)}
                                                disabled={isDeleting}
                                                className="p-2 hover:bg-red-500/80 rounded-full text-white transition-colors disabled:opacity-50"
                                            >
                                                {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden">
                                        <div className="absolute inset-y-0 left-0 w-20 flex items-center justify-center z-20">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handlePrevPhoto(); }}
                                                className="p-3 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white/50 hover:text-white transition-all transform hover:scale-110 active:scale-95 border border-white/5"
                                            >
                                                <ChevronLeft className="w-6 h-6" />
                                            </button>
                                        </div>

                                        <div className="absolute inset-y-0 right-0 w-20 flex items-center justify-center z-20">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleNextPhoto(); }}
                                                className="p-3 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white/50 hover:text-white transition-all transform hover:scale-110 active:scale-95 border border-white/5"
                                            >
                                                <ChevronRight className="w-6 h-6" />
                                            </button>
                                        </div>

                                        <AnimatePresence mode="wait">
                                            {selectedPhoto.status === 'loading' ? (
                                                <motion.div
                                                    key="loader"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex flex-col items-center gap-4"
                                                >
                                                    <div className="w-10 h-10 rounded-full border-2 border-white/5 border-t-white animate-spin" />
                                                </motion.div>
                                            ) : selectedPhoto.downloadUrl ? (
                                                <div className="flex w-full h-full gap-8">
                                                    <motion.div
                                                        key="image"
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className={`relative transition-all duration-500 ${showInfo ? 'flex-[2]' : 'w-full'}`}
                                                    >
                                                        <img
                                                            src={selectedPhoto.downloadUrl}
                                                            alt="Selected"
                                                            onError={() => handleImageError(selectedPhoto.path)}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    </motion.div>

                                                    {showInfo && (
                                                        <motion.div
                                                            initial={{ opacity: 0, x: 20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: 20 }}
                                                            className="flex-1 bg-white/[0.03] border border-white/5 rounded-3xl p-6 backdrop-blur-md overflow-y-auto no-scrollbar"
                                                        >
                                                            <div className="flex items-center justify-between mb-8">
                                                                <span className="text-[12px] font-black uppercase tracking-widest text-white/40">File Metadata</span>
                                                                <button onClick={() => setShowInfo(false)} className="p-1 hover:bg-white/5 rounded-md text-zinc-500"><X className="w-4 h-4" /></button>
                                                            </div>

                                                            <div className="space-y-6">
                                                                <div className="flex flex-col gap-1.5">
                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Filename</span>
                                                                    <span className="text-[13px] font-semibold text-white break-all leading-tight">{selectedPhoto.name}</span>
                                                                </div>

                                                                <div className="flex flex-col gap-1.5">
                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Location</span>
                                                                    <div className="flex items-center gap-2 px-3 py-2 bg-black/40 rounded-xl border border-white/5">
                                                                        <Hash className="w-3 h-3 text-zinc-600" />
                                                                        <span className="text-[11px] font-mono text-zinc-400 truncate">{selectedPhoto.path}</span>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="flex flex-col gap-1.5 bg-black/20 p-4 rounded-2xl border border-white/5">
                                                                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Size</span>
                                                                        <span className="text-[14px] font-bold text-white uppercase tabular-nums">
                                                                            {selectedPhoto.size > 1024 * 1024
                                                                                ? `${(selectedPhoto.size / (1024 * 1024)).toFixed(1)} MB`
                                                                                : `${(selectedPhoto.size / 1024).toFixed(0)} KB`}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex flex-col gap-1.5 bg-black/20 p-4 rounded-2xl border border-white/5">
                                                                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Modified</span>
                                                                        <span className="text-[11px] font-bold text-white uppercase tracking-tighter">
                                                                            {selectedPhoto.mtime ? new Date(selectedPhoto.mtime).toLocaleDateString() : 'N/A'}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="pt-6 border-t border-white/5">
                                                                    <div className="rounded-2xl flex gap-3">
                                                                        <Database strokeWidth={2.5} className="w-4 h-4 text-white shrink-0" />
                                                                        <span className="text-[10px] text-zinc-500 font-medium leading-tight">Stored securely on the remote node and cached at the edge for fast access.</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            ) : null}
                                        </AnimatePresence>
                                    </div>

                                    <div className="h-20 flex items-center justify-center gap-2 px-10 pb-4 overflow-x-auto no-scrollbar shrink-0">
                                        {remoteImages.map((photo, i) => (
                                            <div
                                                key={i}
                                                onClick={() => handleSelectPhoto(photo)}
                                                className={`
                                                    relative h-12 aspect-square rounded-xl overflow-hidden cursor-pointer transition-all shrink-0 border border-white/10
                                                    ${selectedPhoto.path === photo.path ? "ring-2 ring-zinc-500 scale-110 z-10" : "opacity-40 hover:opacity-100"}
                                                `}
                                            >
                                                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                                                    <ImageIcon className="w-4 h-4 text-zinc-600" />
                                                </div>
                                                {photo.downloadUrl && (
                                                    <img
                                                        src={photo.downloadUrl}
                                                        alt=""
                                                        className="absolute inset-0 w-full h-full object-cover"
                                                        onError={() => handleImageError(photo.path)}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Manual Guide Modal */}
                        <AnimatePresence>
                            {showManualGuide && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-[60] bg-black/30 backdrop-blur-xl flex items-center justify-center p-8"
                                >
                                    <motion.div
                                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        className="w-full max-w-xl bg-zinc-950 border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                                    >
                                        <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-white/[0.02]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-zinc-500/10 flex items-center justify-center">
                                                    <Terminal className="w-4 h-4 text-white" />
                                                </div>
                                                <span className="text-[13px] font-black text-white uppercase tracking-widest">Manual Transfer Protocol</span>
                                            </div>
                                            <button onClick={() => setShowManualGuide(false)} className="p-1.5 hover:bg-white/10 rounded-full text-zinc-500 transition-colors">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="p-8 flex flex-col gap-6 overflow-y-auto max-h-[70vh] no-scrollbar">
                                            <section>
                                                <h4 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-3">Option 1: Standard Secure Copy (SCP)</h4>
                                                <p className="text-[12px] text-zinc-400 mb-4 leading-relaxed">Simplest way to push images from your local terminal. Ideal for quick one-off transfers.</p>
                                                <div className="bg-black/60 rounded-2xl p-4 font-mono text-[11px] text-white border border-white/5 relative group">
                                                    <code className="block break-all">
                                                        scp /path/to/image.png {devices.find(d => d.device.id === deviceId)?.vps.username || 'root'}@{devices.find(d => d.device.id === deviceId)?.vps.host || 'VPS_IP'}:/home/
                                                    </code>
                                                    <button
                                                        onClick={() => handleCopy(`scp /path/to/image.png ${devices.find(d => d.device.id === deviceId)?.vps.username || 'root'}@${devices.find(d => d.device.id === deviceId)?.vps.host || 'VPS_IP'}:/home/`)}
                                                        className="absolute top-3 right-3 p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                                                    >
                                                        {copiedCommand?.includes('scp') ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                                                    </button>
                                                </div>
                                            </section>

                                            <div className="h-px bg-white/5 w-full" />

                                            <section>
                                                <h4 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-3">Option 2: Pro Agent Workflow (rsync)</h4>
                                                <p className="text-[12px] text-zinc-400 mb-4 leading-relaxed">Best for multi-device sync. Shows progress, uses compression, and handles resume better than SCP.</p>
                                                <div className="bg-black/60 rounded-2xl p-4 font-mono text-[11px] text-white border border-white/5 relative group">
                                                    <code className="block break-all">
                                                        rsync -av --progress /path/to/photos/ {devices.find(d => d.device.id === deviceId)?.vps.username || 'root'}@{devices.find(d => d.device.id === deviceId)?.vps.host || 'VPS_IP'}:/home/Photos/
                                                    </code>
                                                    <button
                                                        onClick={() => handleCopy(`rsync -av --progress /path/to/photos/ ${devices.find(d => d.device.id === deviceId)?.vps.username || 'root'}@${devices.find(d => d.device.id === deviceId)?.vps.host || 'VPS_IP'}:/home/Photos/`)}
                                                        className="absolute top-3 right-3 p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                                                    >
                                                        {copiedCommand?.includes('rsync') ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                                                    </button>
                                                </div>
                                            </section>

                                            <div className="mt-4 p-4 rounded-2xl bg-zinc-500/5 border border-zinc-500/10 flex gap-4">
                                                <div className="w-8 h-8 rounded-full bg-zinc-500/10 flex items-center justify-center shrink-0">
                                                    <Info className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Network Note</span>
                                                    <p className="text-[11px] text-zinc-500 leading-tight font-medium">These commands run on your local PC to send images to the VPS. Ensure you have SSH access to {devices.find(d => d.device.id === deviceId)?.vps.host || 'this node'}.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Device Selector Overlay */}
                        <AnimatePresence>
                            {!deviceId && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-x-0 bottom-0 top-14 z-50 bg-black/40 backdrop-blur-2xl flex flex-col items-center justify-center p-12"
                                >
                                    <div className="w-full max-w-2xl flex flex-col">
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center justify-between mb-8 px-2 mt-8"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
                                                    <Images className="w-5 h-5 text-zinc-100" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black text-white tracking-tight leading-none">Your Devices</h3>
                                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1.5">Select a storage node to view gallery</p>
                                                </div>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={fetchDevices}
                                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all"
                                            >
                                                <RefreshCw className={`w-3 h-3 ${fetchingDevices ? 'animate-spin text-white' : 'text-zinc-500'}`} />
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
                                                    <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-white/40 animate-spin" />
                                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Scanning Network...</p>
                                                </div>
                                            ) : devices.length === 0 ? (
                                                <div className="py-24 text-center">
                                                    <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto mb-4">
                                                        <Search className="w-6 h-6 text-zinc-800" />
                                                    </div>
                                                    <p className="text-[11px] text-zinc-600 font-bold">No discovered remote nodes.</p>
                                                    <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-tighter">Connect a PC in Settings app</p>
                                                </div>
                                            ) : (
                                                devices.filter(item => item.device.status !== 'enrolling').map((item, idx) => (
                                                    <motion.button
                                                        key={item.device.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.03 }}
                                                        onClick={() => setDeviceId(item.device.id)}
                                                        className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors group text-left"
                                                    >
                                                        <div className="col-span-5 flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                <Database className="w-4 h-4 text-zinc-500 group-hover:text-white" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-zinc-100 group-hover:text-white transition-colors truncate max-w-[150px]">
                                                                    {item.device.name}
                                                                </span>
                                                                <span className="text-[9px] text-zinc-600 font-medium truncate max-w-[120px]">
                                                                    {item.device.id}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="col-span-4 relative">
                                                            <span className="text-[11px] font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors">
                                                                {item.vps.host}
                                                            </span>
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
                                                            <div className="w-4 h-4 flex items-center justify-center">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-all scale-0 group-hover:scale-100 shadow-[0_0_8px_white]" />
                                                            </div>
                                                        </div>
                                                    </motion.button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

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
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                                if (e.target.files) handleUpload(e.target.files);
                                e.target.value = ''; // Reset
                            }}
                        />
                        {/* Delete Confirmation Modal */}
                        <AnimatePresence>
                            {showDeleteConfirm && photoToDelete && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-[70] bg-black/40 backdrop-blur-2xl flex items-center justify-center p-6"
                                >
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        className="w-full max-w-sm bg-zinc-950 border border-white/5 rounded-3xl overflow-hidden shadow-3xl p-8 flex flex-col items-center text-center"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                                            <Trash2 className="w-8 h-8" />
                                        </div>

                                        <h3 className="text-white text-[16px] font-medium mb-2">Delete Photo?</h3>
                                        <p className="text-zinc-500 text-[13px] leading-relaxed mb-8">
                                            This will permanently remove <span className="text-white font-bold">{photoToDelete.name}</span> from the VPS file system. This action cannot be undone.
                                        </p>

                                        <div className="flex flex-col w-full gap-3">
                                            <button
                                                onClick={confirmDelete}
                                                disabled={isDeleting}
                                                className="w-full py-4 bg-red-900 hover:bg-red-950 text-white rounded-2xl text-[11px] font-medium uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 active:scale-[0.98]"
                                            >
                                                {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Delete Permanently"}
                                            </button>
                                            <button
                                                onClick={() => { setShowDeleteConfirm(false); setPhotoToDelete(null); }}
                                                className="w-full py-4 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-2xl text-[11px] font-medium uppercase tracking-[0.1em] transition-all active:scale-[0.98]"
                                            >
                                                Keep Photo
                                            </button>
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
