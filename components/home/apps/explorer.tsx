"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useDragControls, useMotionValue } from "framer-motion";
import {
    Folder,
    File,
    Image as ImageIcon,
    Music,
    Video,
    ChevronLeft,
    ChevronRight,
    Search,
    LayoutGrid,
    List as ListIcon,
    Clock,
    Download,
    Monitor,
    Folders,
    Cloud,
    HardDrive,
    Share2,
    Star,
    X,
    Maximize2,
    FolderPlus,
    FilePlus,
    Loader2,
    Save,
    FileCode2,
    Terminal,
    Activity,
    RefreshCw,
    Database,
    Trash2,
    AlertTriangle
} from "lucide-react";
import { WINDOW_CONSTANTS } from "../window-constants";
import { AppHorizontalAdRibbon } from "@/components/ads";

interface ExplorerProps {
    isOpen: boolean;
    onClose: () => void;
    onMinimize?: () => void;
    onOpenTerminal?: (vpsId: string, path: string) => void;
    onOpenTaskMonitor?: (deviceId: string) => void;
}

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

interface FileSystemItem {
    name: string;
    type: "folder" | "file" | "image" | "music" | "video";
    size?: number; // Added for remote file system
}

import { BASE_URL } from "@/lib/baseURL";

// --- HOOK ---
// Simplified hook to manage remote file system
function useFileSystem(isOpen: boolean, initialDeviceId: string | null) {
    const [deviceId, setDeviceId] = useState<string | null>(initialDeviceId);
    const [vpsId, setVpsId] = useState<string | null>(null);
    const [currentPath, setCurrentPath] = useState<string>("/"); // Default to root
    const [files, setFiles] = useState<FileSystemItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fsCache = useRef<Record<string, FileSystemItem[]>>({});

    useEffect(() => {
        if (initialDeviceId) setDeviceId(initialDeviceId);
    }, [initialDeviceId]);

    // Fetch files when path or device changes
    useEffect(() => {
        if (!deviceId || !isOpen) return;

        let isMounted = true;
        const targetPath = currentPath;

        const cacheKey = `explorer_folder_${deviceId}_${targetPath}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setFiles(parsed);
                fsCache.current[targetPath] = parsed;
            } catch (e) { }
        }

        async function fetchFiles() {
            if (!cached) setLoading(true);
            try {
                const res = await fetch(`${BASE_URL}/cocktail-fs/${deviceId}/list`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: targetPath }),
                    credentials: 'include'
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.message || `Failed to list files (Status: ${res.status})`);
                }
                const data = await res.json();
                if (isMounted && targetPath === currentPath) {
                    if (data.items) {
                        const mapped = data.items.map((item: any) => {
                            let type: FileSystemItem["type"] = item.isDirectory ? 'folder' : 'file';
                            if (!item.isDirectory) {
                                const ext = item.name.split('.').pop()?.toLowerCase();
                                if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'png'].includes(ext || '')) type = 'image';
                                else if (['mp3', 'wav', 'ogg'].includes(ext || '')) type = 'music';
                                else if (['mp4', 'avi', 'mov', 'mkv'].includes(ext || '')) type = 'video';
                            }
                            return { name: item.name, type: type, size: item.size };
                        });
                        setFiles(mapped);
                        fsCache.current[targetPath] = mapped;
                        localStorage.setItem(cacheKey, JSON.stringify(mapped));
                        setError(null);
                    }
                }
            } catch (e: any) {
                if (isMounted && targetPath === currentPath) {
                    console.warn("FS Fetch Error:", e.message);
                    setError(e.message);
                    if (!cached) setFiles([]);
                }
            } finally {
                if (isMounted && targetPath === currentPath) {
                    setLoading(false);
                }
            }
        }

        fetchFiles();
        return () => { isMounted = false; };
    }, [deviceId, currentPath, isOpen]);

    const refreshFiles = async (background = false) => {
        if (!deviceId) return;
        const targetPath = currentPath;
        if (!background) setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/cocktail-fs/${deviceId}/list`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: targetPath }),
                credentials: 'include'
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Failed to refresh files (Status: ${res.status})`);
            }
            const data = await res.json();
            if (targetPath === currentPath) {
                if (data.items) {
                    const mapped = data.items.map((item: any) => {
                        let type: FileSystemItem["type"] = item.isDirectory ? 'folder' : 'file';
                        if (!item.isDirectory) {
                            const ext = item.name.split('.').pop()?.toLowerCase();
                            if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext || '')) type = 'image';
                            else if (['mp3', 'wav', 'ogg'].includes(ext || '')) type = 'music';
                            else if (['mp4', 'avi', 'mov', 'mkv'].includes(ext || '')) type = 'video';
                        }
                        return { name: item.name, type: type, size: item.size };
                    });
                    setFiles(mapped);
                    fsCache.current[targetPath] = mapped;
                }
                setError(null);
            }
        } catch (e: any) {
            if (targetPath === currentPath) {
                console.error(e);
                if (!background) setError(e.message);
            }
        } finally {
            if (targetPath === currentPath && !background) setLoading(false);
        }
    };

    const createFolder = async (name: string) => {
        if (!deviceId) return;
        const fullPath = `${currentPath === '/' ? '' : currentPath}/${name}`;
        try {
            const res = await fetch(`${BASE_URL}/cocktail-fs/${deviceId}/mkdir`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: fullPath }),
                credentials: 'include'
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Failed to create folder (Status: ${res.status})`);
            }
            await refreshFiles();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const readFile = async (fileName: string) => {
        if (!deviceId) return "";
        const fullPath = `${currentPath === '/' ? '' : currentPath}/${fileName}`;
        try {
            const res = await fetch(`${BASE_URL}/cocktail-fs/${deviceId}/read-text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: fullPath }),
                credentials: 'include'
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Failed to read file (Status: ${res.status})`);
            }
            const data = await res.json();
            return data.content || "";
        } catch (e: any) {
            setError(e.message);
            return "";
        }
    };

    const saveFile = async (fileName: string, content: string) => {
        if (!deviceId) return;
        const fullPath = `${currentPath === '/' ? '' : currentPath}/${fileName}`;
        try {
            const res = await fetch(`${BASE_URL}/cocktail-fs/${deviceId}/write-text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: fullPath, content }),
                credentials: 'include'
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Failed to save file (Status: ${res.status})`);
            }
            await refreshFiles();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const deleteItem = async (name: string) => {
        if (!deviceId) return;
        const fullPath = `${currentPath === '/' ? '' : currentPath}/${name}`;
        try {
            const res = await fetch(`${BASE_URL}/cocktail-fs/${deviceId}/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: fullPath }),
                credentials: 'include'
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Failed to delete (Status: ${res.status})`);
            }
            await refreshFiles();
        } catch (e: any) {
            setError(e.message);
        }
    };

    return {
        deviceId,
        vpsId,
        setDeviceId,
        setVpsId,
        files,
        loading,
        error,
        currentPath,
        setCurrentPath,
        createFolder,
        readFile,
        saveFile,
        deleteItem,
        refreshFiles
    };
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

// Modal components (simplified for brevity)
const EntryModal: React.FC<{
    title: string;
    placeholder: string;
    onConfirm: (name: string) => void;
    onCancel: () => void;
    initialValue?: string;
}> = ({ title, placeholder, onConfirm, onCancel, initialValue = "" }) => {
    const [value, setValue] = useState(initialValue);
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-zinc-950 border border-white/5 border-dashed p-6 rounded-3xl w-[320px] relative overflow-hidden group pointer-events-auto"
                onPointerDown={(e) => e.stopPropagation()}
            >
                <div className="absolute inset-0 bg-black pointer-events-none" />
                <h3 className="text-[15px] font-semibold text-zinc-100 mb-2 relative">{title}</h3>
                <p className="text-[11px] text-zinc-500 mb-4 font-medium relative">Please enter a unique name.</p>

                <div className="relative mb-6">
                    <input
                        autoFocus
                        type="text"
                        className="w-full px-3 py-2 bg-white/5 text-[13px] text-white rounded-lg border border-white/5 focus:outline-none focus:ring-1 focus:ring-zinc-500/50 focus:border-zinc-500/50 transition-all placeholder:text-zinc-600 font-medium"
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter" && value.trim()) {
                                onConfirm(value.trim());
                            }
                        }}
                        onKeyUp={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>

                <div className="flex justify-end gap-2.5 relative">
                    <button
                        className="px-4 py-1.5 text-[12px] font-semibold rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-5 py-1.5 text-[12px] font-bold rounded-sm bg-zinc-600 text-white hover:bg-zinc-700 active:scale-95 transition-all"
                        onClick={() => onConfirm(value.trim())}
                        disabled={!value.trim()}
                    >
                        Confirm
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const FileEditorModal: React.FC<{
    fileName: string;
    initialContent: string;
    onSave: (content: string) => void;
    onCancel: () => void;
}> = ({ fileName, initialContent, onSave, onCancel }) => {
    const [content, setContent] = useState(initialContent);
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()}
        >
            <motion.div
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-zinc-950 border border-white/0 rounded-3xl  w-[85vw] h-[85vh] flex flex-col overflow-hidden relative pointer-events-auto"
                onPointerDown={(e) => e.stopPropagation()}
            >
                {/* Editor Header */}
                <div className="shrink-0 h-14 border-b border-white/5 bg-zinc-950 px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-500/10 flex items-center justify-center">
                            <FileCode2 className="w-5 h-5 text-zinc-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-zinc-100 tracking-tight">{fileName}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onCancel}
                            className="
      px-4 py-1.5 text-[11px] font-bold rounded-lg
      text-zinc-400 hover:text-white hover:bg-transparent
      transition-transform duration-150 ease-out
      hover:scale-[1.04]
      active:scale-[0.97]
      will-change-transform
      cursor-pointer
    "
                        >
                            Discard
                        </button>

                        <button
                            onClick={() => onSave(content)}
                            className="
      px-6 py-1.5 text-[11px] font-bold rounded-sm
      bg-zinc-950 text-white hover:bg-transparent
      flex items-center gap-2
      transition-transform duration-150 ease-out
      hover:scale-[1.04]
      active:scale-[0.97]
      will-change-transform 
      cursor-pointer
    "
                        >
                            <Save className="w-3.5 h-3.5" />
                            Save Changes
                        </button>
                    </div>

                </div>

                {/* Main Content Area */}
                <div className="flex-1 relative bg-[#09090b]">
                    <textarea
                        autoFocus
                        spellCheck={false}
                        className="absolute inset-0 w-full h-full p-8 bg-transparent text-zinc-300 focus:outline-none font-mono text-[13px] leading-relaxed resize-none scrollbar-hide no-scrollbar selection:bg-rose-500/30 selection:text-white"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        onKeyUp={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Start typing..."
                    />
                </div>

                {/* Footer / Status Bar */}
                <div className="shrink-0 h-8 bg-zinc-950 px-4 flex items-center justify-center">
                    <div className="flex items-center gap-4 ml-4">
                        <span className="text-[10px] font-medium text-zinc-600">Lines: {content.split('\n').length}</span>
                        <span className="text-[10px] font-medium text-zinc-600">Characters: {content.length}</span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const ConfirmModal: React.FC<{
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel?: string;
    isDestructive?: boolean;
}> = ({ title, message, onConfirm, onCancel, confirmLabel = "Confirm", isDestructive = false }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-zinc-950 border border-white/5 border-dashed p-6 rounded-3xl w-[320px] relative overflow-hidden group shadow-2xl pointer-events-auto"
                onPointerDown={(e) => e.stopPropagation()}
            >
                <div className="absolute inset-0 bg-black pointer-events-none" />
                <h3 className="text-[15px] font-semibold text-zinc-100 mb-2 relative">{title}</h3>
                <p className="text-[11px] text-zinc-500 mb-6 font-medium relative leading-relaxed">{message}</p>

                <div className="flex items-center gap-3 relative">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-[11px] text-zinc-400 font-bold rounded-xl transition-all border border-white/5 active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2 ${isDestructive ? 'bg-rose-500/10 hover:bg-rose-500/20 text-white border-rose-500/20' : 'bg-white/10 hover:bg-white/20 text-white border-white/10'} text-[11px] font-bold rounded-xl transition-all border active:scale-95 shadow-lg shadow-black/20`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const FileSkeleton = ({ mode }: { mode: 'grid' | 'list' }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={mode === 'grid' ? "grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-x-4 gap-y-8" : "flex flex-col space-y-1"}
        >
            {[...Array(mode === 'grid' ? 15 : 10)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    className={mode === 'grid' ? "flex flex-col items-center gap-3" : "flex items-center px-4 py-2 gap-4"}
                >
                    <div className={`
                        ${mode === 'grid' ? "w-16 h-16 rounded-xl" : "w-8 h-8 rounded-lg"} 
                        bg-white/5 animate-pulse relative overflow-hidden
                    `} style={{ animationDuration: '2s' }}>
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-950/90 to-transparent -translate-x-full"
                            animate={{ x: ['100%', '-100%'] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        />
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                        <div className={`
                            ${mode === 'grid' ? "w-14 h-2.5 mx-auto" : "w-40 h-3"} 
                            bg-white/5 rounded animate-pulse
                        `} style={{ animationDuration: '2s', animationDelay: '0.1s' }} />
                        {mode === 'list' && (
                            <div className="w-24 h-2 bg-white/5 rounded animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.2s' }} />
                        )}
                    </div>
                    {mode === 'list' && (
                        <div className="w-16 h-2 bg-white/5 rounded animate-pulse ml-auto" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
                    )}
                </motion.div>
            ))}
        </motion.div>
    );
};

const formatName = (name: string, type: string) => {
    if (name.length <= 12) return name;
    if (type === 'folder') {
        return name.slice(0, 14) + '...';
    } else {
        const lastDotIndex = name.lastIndexOf('.');
        if (lastDotIndex === -1 || lastDotIndex === 0) return name.slice(0, 14) + '...';
        const ext = name.slice(lastDotIndex + 1);
        const base = name.slice(0, 14);
        return `${base}....${ext}`;
    }
};

const formatFileSize = (bytes?: number) => {
    if (bytes === undefined || bytes === 0) return "--";
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(i > 0 ? 1 : 0)) + ' ' + sizes[i];
};

const EmptyFolder = () => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center h-full gap-5 text-zinc-600"
    >
        <div className="relative">
            <div className="absolute inset-0 bg-white/0 blur-3xl rounded-full" />
            <Folder className="w-24 h-24 text-zinc-800/50" strokeWidth={1} />
            <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute inset-0 flex items-center justify-center"
            >
                <Search className="w-8 h-8 text-zinc-700" />
            </motion.div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
            <h3 className="text-[15px] font-semibold text-zinc-400 tracking-tight">Empty Folder</h3>
            <p className="text-[11px] text-zinc-500 font-medium">This directory is currently silent.</p>
        </div>
    </motion.div>
);

const ErrorState = ({ title = "Access Denied", message, onRetry }: { title?: string, message: string, onRetry: () => void }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center h-full gap-5 p-8 text-center"
    >
        <div className="relative">
            <div className="absolute inset-0 bg-rose-500/5 blur-3xl rounded-full" />
            <X className="w-16 h-16 text-rose-500/30" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col items-center gap-2 max-w-sm">
            <h3 className="text-[15px] font-bold text-white tracking-tight">{title}</h3>
            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                {message.includes("ENOENT")
                    ? "The folder you are looking for does not exist or has been moved."
                    : message}
            </p>
            <button
                onClick={onRetry}
                className="mt-2 px-4 py-1.5 bg-rose-950 hover:bg-rose-500/20 text-white text-[10px] font-bold rounded-lg border border-rose-500/20 transition-all active:scale-95"
            >
                Try Again
            </button>
        </div>
    </motion.div>
);

const sidebarItems = [
    {
        section: "Locations", items: [
            { icon: HardDrive, label: "/", color: "text-white" },
            { icon: Folder, label: "/home", color: "text-white" },
            { icon: Folder, label: "/tmp", color: "text-white" },
            { icon: Folder, label: "/opt", color: "text-white" },
            { icon: Folder, label: "/var", color: "text-white" },
            { icon: Folder, label: "/etc", color: "text-white" },
        ]
    }
];

export function Explorer({ isOpen, onClose, onMinimize, onOpenTerminal, onOpenTaskMonitor }: ExplorerProps) {
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

    const [devices, setDevices] = useState<DeviceItem[]>([]);
    const [fetchingDevices, setFetchingDevices] = useState(false);

    // File System Hook
    const {
        deviceId,
        vpsId,
        setDeviceId,
        setVpsId,
        files,
        currentPath,
        setCurrentPath,
        loading,
        createFolder,
        readFile,
        saveFile,
        error: fsError,
        refreshFiles,
        deleteItem
    } = useFileSystem(isOpen, null);

    const [itemToDelete, setItemToDelete] = useState<FileSystemItem | null>(null);

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
                    const single = enrolled[0];
                    setDeviceId(single.device.id);
                    setVpsId(single.vps.id);
                }
            }
        } catch (e) {
            console.error("Failed to fetch devices:", e);
        } finally {
            setFetchingDevices(false);
        }
    };

    useEffect(() => {
        if (isOpen && !deviceId) {
            fetchDevices();
        }
    }, [isOpen, deviceId]);

    const selectedDeviceName = useMemo(() => {
        return devices.find(d => d.device.id === deviceId)?.device.name;
    }, [devices, deviceId]);

    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Navigation History used for back/forward buttons
    const [navHistory, setNavHistory] = useState<string[]>([currentPath]);
    const [historyIndex, setHistoryIndex] = useState(0);

    // Sync history when path changes externally (e.g. via sidebar)
    // Note: This simple sync might duplicate history if we are not careful about who updates path.
    // Better: navigateTo wrapper handles both.

    // Modal States
    const [modalMode, setModalMode] = useState<'none' | 'new-folder' | 'new-file' | 'editor'>('none');
    const [newItemName, setNewItemName] = useState("");
    const [editorContent, setEditorContent] = useState("");
    const [editorFile, setEditorFile] = useState("");
    const [isOpening, setIsOpening] = useState(false);

    // Media Viewer State
    const [selectedMedia, setSelectedMedia] = useState<{
        name: string;
        path: string;
        type: "image" | "video" | "music";
        url?: string;
        status: 'loading' | 'ready' | 'error';
        error?: string;
        size?: number;
    } | null>(null);
    const [transferProgress, setTransferProgress] = useState(0);

    const [mediaLinkCache, setMediaLinkCache] = useState<Record<string, string>>({});

    // PERSISTENCE: Save/Load Media Link Cache
    useEffect(() => {
        if (deviceId && isOpen) {
            const key = `explorer_media_links_${deviceId}`;
            const cached = localStorage.getItem(key);
            if (cached) {
                try { setMediaLinkCache(JSON.parse(cached)); } catch (e) { }
            }
        }
    }, [deviceId, isOpen]);

    useEffect(() => {
        if (deviceId && Object.keys(mediaLinkCache).length > 0) {
            const key = `explorer_media_links_${deviceId}`;
            localStorage.setItem(key, JSON.stringify(mediaLinkCache));
        }
    }, [deviceId, mediaLinkCache]);


    const getFileIcon = (type: FileSystemItem["type"], size = "w-7 h-7") => {
        switch (type) {
            case "folder":
                return (
                    <div className="relative">
                        <Folder className={`text-indigo-500 fill-indigo-500/10 ${size === "w-7 h-7" ? "w-14 h-14" : "w-5 h-5"}`} strokeWidth={1} />
                        {size === "w-7 h-7" && <div className="absolute inset-x-2 bottom-2 h-1 bg-white/20 rounded-full blur-[4px] opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </div>
                );
            case "image":
                return <ImageIcon className={`${size} text-indigo-500`} />;
            case "music":
                return <Music className={`${size} text-rose-500`} />;
            case "video":
                return <Video className={`${size} text-pink-500`} />;
            default:
                return <File className={`${size} text-zinc-400`} />;
        }
    };

    const activeFiles = useMemo(() => {
        return files || [];
    }, [files]);

    const navigateTo = (path: string, addToHistory = true) => {
        setCurrentPath(path);
        if (addToHistory) {
            const newHistory = navHistory.slice(0, historyIndex + 1);
            newHistory.push(path);
            setNavHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }
    };

    const goBack = () => {
        if (historyIndex > 0) {
            const nextIndex = historyIndex - 1;
            setHistoryIndex(nextIndex);
            setCurrentPath(navHistory[nextIndex]);
        }
    };

    const goForward = () => {
        if (historyIndex < navHistory.length - 1) {
            const nextIndex = historyIndex + 1;
            setHistoryIndex(nextIndex);
            setCurrentPath(navHistory[nextIndex]);
        }
    };

    // Reset when opened
    useEffect(() => {
        if (!isOpen) return;
        setIsMaximized(false);
        setSize({ width: 900, height: 600 });
        x.set(0);
        y.set(-15); // Centered accounting for dock space
        // Start at root / instead of /root to avoid EACCES
        setCurrentPath("/");
        setNavHistory(["/"]);
        setHistoryIndex(0);
    }, [isOpen, x, y]);

    // ... toggleMaximize, handleDragEnd, handleResizeStart ...

    // Modal Handlers
    const handleCreateFolder = (name: string) => {
        createFolder(name);
        setModalMode('none');
        setNewItemName("");
    };

    const handleCreateFile = (name: string) => {
        // Create empty file
        saveFile(name, "");
        setModalMode('none');
        setNewItemName("");
        // Optionally open editor immediately
        setTimeout(() => handleOpenFile(name, 'file'), 500);
    };

    const handleSaveFile = (content: string) => {
        saveFile(editorFile, content);
        setModalMode('none');
    };

    const handleOpenFile = async (name: string, type: string) => {
        if (type === 'folder') {
            const nextPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
            navigateTo(nextPath);
        } else if (type === 'file') {
            setIsOpening(true);
            setEditorFile(name);
            try {
                const content = await readFile(name);
                setEditorContent(content);
                setModalMode('editor');
            } finally {
                setIsOpening(false);
            }
        } else if (type === 'image' || type === 'video' || type === 'music') {
            handleOpenMedia(name, type as any);
        }
    };

    const handleOpenFileAsText = async (name: string) => {
        setIsOpening(true);
        setEditorFile(name);
        try {
            const content = await readFile(name);
            setEditorContent(content);
            setModalMode('editor');
            setSelectedMedia(null); // Close media viewer if it was open
        } finally {
            setIsOpening(false);
        }
    };

    const handleOpenMedia = async (name: string, type: "image" | "video" | "music") => {
        const fullPath = `${currentPath === '/' ? '' : currentPath}/${name}`;

        // Use cache if available
        if (mediaLinkCache[fullPath]) {
            setSelectedMedia({
                name,
                path: fullPath,
                type,
                url: mediaLinkCache[fullPath],
                status: 'ready'
            });
            return;
        }

        setSelectedMedia({
            name,
            path: fullPath,
            type,
            status: 'loading'
        });
        setTransferProgress(0);

        try {
            // 1. Init Transfer
            const res = await fetch(`${BASE_URL}/cockpit/cocktail/transfers/download/init`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId, path: fullPath }),
                credentials: 'include'
            });

            if (!res.ok) throw new Error("Failed to initialize media stream");
            const { taskId, downloadUrl } = await res.json();

            // 2. Poll for completion
            let finished = false;
            let attempts = 0;
            const MAX_ATTEMPTS = 100; // 60 seconds

            while (!finished && attempts < MAX_ATTEMPTS) {
                const sRes = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${deviceId}/tasks?limit=10`, { credentials: 'include' });
                if (sRes.ok) {
                    const tasks = await sRes.json();
                    const task = tasks.find((t: any) => t.id === taskId);

                    if (task) {
                        if (task.status === 'succeeded') finished = true;
                        else if (task.status === 'failed') throw new Error(task.error || "VPS failed to process media");

                        if (task.progress) setTransferProgress(task.progress);
                    }
                }

                if (!finished) {
                    await new Promise(r => setTimeout(r, 600));
                    attempts++;
                }
            }

            if (!finished) throw new Error("Media stream timed out");

            setMediaLinkCache(prev => ({ ...prev, [fullPath]: downloadUrl }));
            setSelectedMedia(prev => prev ? { ...prev, status: 'ready', url: downloadUrl } : null);
        } catch (e: any) {
            console.error("Media Open Error:", e);
            setSelectedMedia(prev => prev ? { ...prev, status: 'error', error: e.message } : null);
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
        const apply = (moveEvent: PointerEvent) => {
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
            if (!raf) raf = window.requestAnimationFrame(() => apply(ev));
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
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="explorer-main-window"
                        drag={!isResizing && !isMaximized}
                        dragMomentum={false}
                        dragListener={false}
                        dragControls={dragControls}
                        onDragEnd={handleDragEnd}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        style={{ x, y, width: size.width, height: size.height }}
                        className={[
                            "pointer-events-auto bg-zinc-950 border border-white/5 shadow-3xl flex flex-col overflow-hidden relative font-sans",
                            isMaximized ? "rounded-xl" : "rounded-3xl",
                            isResizing ? "select-none" : "",
                        ].join(" ")}
                    >
                        {/* Title Bar & Toolbar */}
                        <div
                            className="shrink-0 h-14 bg-zinc-900/80 border-b border-white/5 flex items-center justify-between px-4 select-none cursor-default active:cursor-grabbing"
                            onPointerDown={(e) => dragControls.start(e)}
                            onDoubleClick={toggleMaximize}
                        >
                            <div className="flex items-center gap-2.5 w-1/4">
                                <div className="flex items-center gap-2">
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
                                {selectedDeviceName && (
                                    <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest truncate max-w-[120px]">
                                            {selectedDeviceName}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-0 flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={goBack}
                                        disabled={historyIndex === 0}
                                        className={`p-1 rounded transition-colors ${historyIndex === 0 ? "text-zinc-700" : "text-zinc-500 hover:bg-white/5"}`}
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={goForward}
                                        disabled={historyIndex === navHistory.length - 1}
                                        className={`p-1 rounded transition-colors ${historyIndex === navHistory.length - 1 ? "text-zinc-700" : "text-zinc-500 hover:bg-white/5"}`}
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 min-w-65 flex-0">
                                    <div className="flex items-center bg-zinc-950/30 px-3 py-1.5 rounded-lg border border-white/5 min-w-0 flex-1 group/path">
                                        <Folder className="w-3.5 h-3.5 text-zinc-500 shrink-0 mr-2" />
                                        <span className="text-xs font-medium text-zinc-400 truncate tracking-tight select-text scrollbar-hide no-scrollbar">
                                            {currentPath}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-1/4 justify-end">
                                {/* New Buttons */}
                                <div className="flex items-center gap-1 p-0.5 bg-zinc-800/50 rounded-md border border-white/5">
                                    <button
                                        onClick={() => setModalMode('new-folder')}
                                        className="p-1.5 rounded hover:bg-zinc-700/30 transition-colors"
                                        title="New Folder"
                                    >
                                        <FolderPlus className="w-3.5 h-3.5 text-zinc-400 hover:text-white" />
                                    </button>
                                    <button
                                        onClick={() => setModalMode('new-file')}
                                        className="p-1.5 rounded hover:bg-zinc-700/30 transition-colors"
                                        title="New File"
                                    >
                                        <FilePlus className="w-3.5 h-3.5 text-zinc-400 hover:text-white" />
                                    </button>
                                    <button
                                        onClick={() => onOpenTerminal?.(vpsId || deviceId || "", currentPath)}
                                        className="p-1.5 rounded hover:bg-zinc-700/30 transition-colors"
                                        title="Open in Terminal"
                                    >
                                        <Terminal className="w-3.5 h-3.5 text-zinc-400 hover:text-white" />
                                    </button>
                                    <button
                                        onClick={() => onOpenTaskMonitor?.(deviceId || "")}
                                        className="p-1.5 rounded hover:bg-zinc-700/30 transition-colors"
                                        title="System Monitor"
                                    >
                                        <Activity className="w-3.5 h-3.5 text-zinc-400 hover:text-white" />
                                    </button>
                                </div>

                                {/* <div className="flex items-center gap-1 bg-zinc-800/50 rounded-md px-2 py-1 border border-white/5">
                                <Search className="w-3.5 h-3.5 text-zinc-500" />
                                <input
                                    type="text"
                                    placeholder="Search"
                                    className="bg-transparent border-none outline-none text-[13px] text-zinc-300 w-24 placeholder:text-zinc-600"
                                />
                            </div> */}
                                <div className="flex items-center gap-1 p-0.5 bg-zinc-800/50 rounded-md border border-white/5">
                                    <button
                                        onClick={() => setViewMode("grid")}
                                        className={`p-1.5 rounded transition-colors ${viewMode === "grid" ? "bg-zinc-700/80 shadow-sm" : "hover:bg-zinc-700/30"}`}
                                    >
                                        <LayoutGrid className={`w-3.5 h-3.5 ${viewMode === "grid" ? "text-zinc-200" : "text-zinc-500"}`} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode("list")}
                                        className={`p-1.5 rounded transition-colors ${viewMode === "list" ? "bg-zinc-700/80 shadow-sm" : "hover:bg-zinc-700/30"}`}
                                    >
                                        <ListIcon className={`w-3.5 h-3.5 ${viewMode === "list" ? "text-zinc-200" : "text-zinc-500"}`} />
                                    </button>
                                </div>
                                <button
                                    onClick={() => setDeviceId(null)}
                                    className="px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-all"
                                >
                                    Switch
                                </button>
                            </div>
                        </div>

                        {/* Middle Area */}
                        <div className="flex-1 flex min-h-0">
                            {/* Sidebar */}
                            <div className="w-48 shrink-0 bg-zinc-900/40 border-r border-white/5 p-4 overflow-y-auto no-scrollbar backdrop-blur-md">
                                {sidebarItems.map((section, idx) => (
                                    <div key={idx} className="mb-6 last:mb-0">
                                        <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-2 ml-2">
                                            {section.section}
                                        </h3>
                                        <div className="space-y-0.5">
                                            {section.items.map((item, i) => {
                                                const isActive = item.label === "/"
                                                    ? currentPath === "/"
                                                    : (currentPath === item.label || currentPath.startsWith(item.label + "/"));
                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => navigateTo(item.label)}
                                                        className={`
                                                            w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                                            ${isActive
                                                                ? "bg-zinc-500/15 text-zinc-400 font-semibold"
                                                                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"}
                                                        `}
                                                    >
                                                        <item.icon className={`w-4 h-4 ${isActive ? "text-white" : item.color}`} />
                                                        {item.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 bg-zinc-950/40 p-6 overflow-y-auto no-scrollbar scroll-smooth">
                                <AppHorizontalAdRibbon className="mb-5" />
                                {loading && activeFiles.length === 0 ? (
                                    <FileSkeleton mode={viewMode} />
                                ) : fsError ? (
                                    <ErrorState
                                        title={fsError.includes("timed out") ? "Can't connect to your device" : "Access Denied"}
                                        message={
                                            fsError.includes("timed out")
                                                ? "We’re unable to reach this device right now. If the problem continues, please contact our support team at www.reglook.com"
                                                : fsError
                                        }
                                        onRetry={() => refreshFiles()}
                                    />
                                ) : activeFiles.length === 0 ? (
                                    <EmptyFolder />
                                ) : viewMode === "grid" ? (
                                    <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-x-4 gap-y-8">
                                        {activeFiles.map((file: FileSystemItem, idx: number) => (
                                            <div
                                                key={idx}
                                                className="group flex flex-col items-center gap-1.5 cursor-default"
                                                onDoubleClick={() => handleOpenFile(file.name, file.type)}
                                                title={file.name}
                                            >
                                                <div className="
                                                    relative w-16 h-16 rounded-xl flex items-center justify-center 
                                                    transition-all group-hover:scale-105 group-active:scale-95
                                                ">
                                                    {getFileIcon(file.type)}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setItemToDelete(file);
                                                        }}
                                                        className="absolute -top-1 -right-1 w-6 h-6 rounded-lg bg-zinc-950/80 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white hover:text-black hover:border-white/10 transition-all z-10"
                                                    >
                                                        <Trash2 strokeWidth={2.5} className="w-3 h-3 text-white hover:text-black" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenFileAsText(file.name);
                                                        }}
                                                        className="absolute -top-1 -left-1 w-6 h-6 rounded-lg bg-zinc-950/80 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white hover:text-black hover:border-white/10 transition-all z-10"
                                                        title="Force Edit"
                                                    >
                                                        <FileCode2 strokeWidth={2.5} className="w-3 h-3 text-white hover:text-black" />
                                                    </button>
                                                </div>
                                                <span className="text-[11px] font-medium text-zinc-300 text-center line-clamp-1 px-1 rounded-md group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                                                    {formatName(file.name, file.type)}
                                                </span>
                                                <span className="text-[9px] text-zinc-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {formatFileSize(file.size)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        {/* Table Header */}
                                        <div className="flex items-center px-4 py-2 border-b border-white/5 text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-2">
                                            <span className="w-1/2">Name</span>
                                            <span className="w-1/4">Kind</span>
                                            <span className="w-1/4">Size</span>
                                        </div>
                                        {activeFiles.map((file: FileSystemItem, idx: number) => (
                                            <div
                                                key={idx}
                                                className="group flex items-center px-4 py-1.5 rounded-lg hover:bg-rose-500/10 cursor-default transition-colors"
                                                onDoubleClick={() => handleOpenFile(file.name, file.type)}
                                                title={file.name}
                                            >
                                                <div className="w-1/2 flex items-center gap-3">
                                                    {getFileIcon(file.type, "w-5 h-5")}
                                                    <span className="text-xs font-medium text-zinc-300 group-hover:text-rose-400">
                                                        {formatName(file.name, file.type)}
                                                    </span>
                                                </div>
                                                <span className="w-1/4 text-[11px] text-zinc-500 capitalize">{file.type}</span>
                                                <div className="w-1/4 flex items-center justify-between">
                                                    <span className="text-[11px] text-zinc-500 font-medium">{formatFileSize(file.size)}</span>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenFileAsText(file.name);
                                                            }}
                                                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/5 text-zinc-400 hover:text-white transition-all"
                                                            title="Force Edit"
                                                        >
                                                            <FileCode2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setItemToDelete(file);
                                                            }}
                                                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 text-white transition-all"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status bar */}
                        <div className="shrink-0 h-7 bg-zinc-900/30 border-t border-white/5 flex items-center justify-between px-4 text-[10px] text-zinc-500 font-medium">
                            <div className="flex items-center gap-4">
                                <span>{activeFiles.length} items</span>
                                {/* <span>Zero KB available</span> */}
                            </div>
                            {/* <span>Ripun's Cockpit</span> */}
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
                                                    <HardDrive className="w-5 h-5 text-zinc-100" />
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
                                                <RefreshCw className={`w-3 h-3 ${fetchingDevices ? 'animate-spin text-white' : 'text-zinc-500'}`} />
                                                <span className="text-[10px] font-black text-zinc-400 group-hover:text-white uppercase tracking-widest">Update</span>
                                            </motion.button>
                                        </motion.div>

                                        {/* Table Header */}
                                        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 bg-white/[0.01] rounded-t-2xl">
                                            <div className="col-span-5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Storage Node</div>
                                            <div className="col-span-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Endpoint</div>
                                            <div className="col-span-3 text-right text-[9px] font-black text-zinc-500 uppercase tracking-widest">Status</div>
                                        </div>

                                        {/* Table Body */}
                                        <div className="flex flex-col max-h-[350px] overflow-y-auto no-scrollbar bg-white/[0.01] rounded-b-2xl border-x border-b border-white/5">
                                            {fetchingDevices && devices.length === 0 ? (
                                                <div className="py-24 flex flex-col items-center justify-center gap-4">
                                                    <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-white/40 animate-spin" />
                                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Syncing Nodes...</p>
                                                </div>
                                            ) : devices.length === 0 ? (
                                                <div className="py-24 text-center">
                                                    <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto mb-4">
                                                        <Search className="w-6 h-6 text-zinc-800" />
                                                    </div>
                                                    <p className="text-[11px] text-zinc-600 font-bold">No discovered storage nodes.</p>
                                                </div>
                                            ) : (
                                                devices.filter(item => item.device.status !== 'enrolling').map((item, idx) => (
                                                    <motion.button
                                                        key={item.device.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.03 }}
                                                        onClick={() => {
                                                            setDeviceId(item.device.id);
                                                            setVpsId(item.vps.id);
                                                        }}
                                                        className="grid grid-cols-12 gap-4 px-6 py-4 items-center group hover:bg-white/[0.02] transition-all border-b border-white/[0.02] last:border-0 relative text-left"
                                                    >
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
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals - Escaped from transform block */}
            <AnimatePresence>
                {isOpen && modalMode === 'new-folder' && (
                    <EntryModal
                        key="modal-new-folder"
                        title="New Folder"
                        placeholder="Folder Name"
                        onConfirm={handleCreateFolder}
                        onCancel={() => setModalMode('none')}
                    />
                )}
                {isOpen && modalMode === 'new-file' && (
                    <EntryModal
                        key="modal-new-file"
                        title="New File"
                        placeholder="File Name.txt"
                        onConfirm={handleCreateFile}
                        onCancel={() => setModalMode('none')}
                    />
                )}
                {isOpen && modalMode === 'editor' && (
                    <FileEditorModal
                        key="modal-file-editor"
                        fileName={editorFile}
                        initialContent={editorContent}
                        onSave={handleSaveFile}
                        onCancel={() => setModalMode('none')}
                    />
                )}

                {/* File Opening Loader (Apple System Platter Style) */}
                {isOpening && (
                    <motion.div
                        key="file-opening-loader"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[10000] pointer-events-auto"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-black/70 backdrop-blur-2xl p-5 rounded-[28px] flex flex-col items-center gap-4 w-[140px]"
                        >
                            <div className="relative w-12 h-12 flex items-center justify-center">
                                <div className="absolute inset-0 bg-black/5 rounded-full" />
                                <Loader2 className="w-5 h-5 text-zinc-300 animate-spin relative z-10" strokeWidth={2.5} />
                                <div className="absolute inset-0 bg-white/10 blur-xl rounded-full animate-pulse" />
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <span className="text-[12px] font-bold text-white tracking-tight">Opening</span>
                                <span className="text-[10px] font-medium text-zinc-500 truncate w-[100px] mt-0.5">{editorFile}</span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {selectedMedia && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[11000] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-8 sm:p-20 pointer-events-auto"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        {/* Top Bar Actions */}
                        <div className="absolute top-10 left-10 right-10 flex items-center justify-between z-[11001]">
                            <button
                                onClick={() => handleOpenFileAsText(selectedMedia.name)}
                                className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/70 hover:text-white transition-all group"
                                title="Open as Text"
                            >
                                <FileCode2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span className="text-[13px] font-bold">Edit as Text</span>
                            </button>

                            <button
                                onClick={() => setSelectedMedia(null)}
                                className="p-4 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="w-full h-full flex flex-col items-center justify-center relative">
                            {selectedMedia.status === 'loading' && (
                                <div className="flex flex-col items-center gap-6">
                                    <div className="relative w-20 h-20">
                                        <div className="absolute inset-0 rounded-full border-4 border-white/5" />
                                        <motion.div
                                            className="absolute inset-0 rounded-full border-4 border-zinc-500 border-t-transparent"
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-[14px] font-black text-white">{Math.round(transferProgress)}%</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center text-center">
                                        <h3 className="text-white text-[14px] font-medium uppercase tracking-[0.1em]">Working...</h3>
                                        {/* <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-widest mt-2">Streaming securely from {selectedDeviceName}</p> */}
                                    </div>
                                </div>
                            )}

                            {selectedMedia.status === 'error' && (
                                <div className="flex flex-col items-center gap-6 max-w-sm text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                                        <AlertTriangle className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-white text-[16px] font-black uppercase tracking-widest">Failed to Open</h3>
                                        <p className="text-zinc-500 text-[12px] font-medium leading-relaxed mt-2">{selectedMedia.error}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedMedia(null)}
                                        className="mt-4 px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[11px] font-black uppercase tracking-widest text-white transition-all"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            )}

                            {selectedMedia.status === 'ready' && selectedMedia.url && (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="relative max-w-full max-h-full flex items-center justify-center"
                                >
                                    {selectedMedia.type === 'image' ? (
                                        <img
                                            src={selectedMedia.url}
                                            alt={selectedMedia.name}
                                            className="max-w-full max-h-[80vh] rounded-3xl shadow-3xl object-contain border border-white/10"
                                        />
                                    ) : selectedMedia.type === 'video' ? (
                                        <video
                                            src={selectedMedia.url}
                                            controls
                                            autoPlay
                                            className="max-w-full max-h-[80vh] rounded-3xl shadow-3xl border border-white/10"
                                        />
                                    ) : (
                                        <div className="bg-black/40 backdrop-blur-xl p-12 rounded-[40px] border border-white/5 flex flex-col items-center gap-6">
                                            <div className="w-20 h-20 rounded-3xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                                                <Music className="w-10 h-10" />
                                            </div>
                                            <audio
                                                src={selectedMedia.url}
                                                controls
                                                autoPlay
                                                className="w-72"
                                            />
                                        </div>
                                    )}

                                    {/* Info Badge */}
                                    <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-zinc-950/80 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/5 shadow-2xl">
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-bold text-white truncate max-w-[200px]">{selectedMedia.name}</span>
                                            {/* <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">{selectedMedia.type} file on VPS</span> */}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}

                {itemToDelete && (
                    <ConfirmModal
                        key="modal-delete-confirm"
                        title={`Delete ${itemToDelete.type}`}
                        message={`Are you sure you want to permanently delete "${itemToDelete.name}"? This action cannot be undone.`}
                        confirmLabel="Confirm"
                        isDestructive={true}
                        onConfirm={() => {
                            deleteItem(itemToDelete.name);
                            setItemToDelete(null);
                        }}
                        onCancel={() => setItemToDelete(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
