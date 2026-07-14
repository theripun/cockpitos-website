"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { GlassInterface } from "@/components/common/glass-interface";
import {
    Monitor,
    RotateCcw,
    Power,
    User,
    Settings,
    Info,
    HelpCircle,
    Lock,
    Moon,
    Download,
    HardDrive,
    Wifi,
    Calendar,
    Clock,
    Image,
    FileText,
    Folder,
    Star,
    Share2,
    Copy,
    Trash2,
    Minus,
    Maximize2,
    Minimize2,
    X,
    ChevronRight,
    ChevronLeft,
    // Custom icons defined below
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SubmenuPortal } from "./submenu-portal";

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
}

interface MenuItem {
    label: string;
    icon: React.ComponentType<any>;
    action?: () => void;
    shortcut?: string;
    disabled?: boolean;
    divider?: boolean;
    submenu?: MenuItem[];
}

interface OpenSubmenuState {
    label: string;
    items: MenuItem[];
    position: { top: number; left: number };
}

// Helper function to clamp position to viewport
const clampToViewport = (x: number, y: number, width: number, height: number, padding: number) => {
    const left = Math.min(Math.max(padding, x), window.innerWidth - width - padding);
    const top = Math.min(Math.max(padding, y), window.innerHeight - height - padding);
    return { left, top };
};

const systemMenuItems: MenuItem[] = [
    {
        label: "About This Cockpit",
        icon: Info,
        action: () => {
            console.log("About clicked");
            alert("About This Cockpit action triggered!");
        }
    },
    {
        label: "System Preferences...",
        icon: Settings,
        action: () => {
            console.log("System Preferences clicked");
            alert("System Preferences action triggered!");
        }
    },
    {
        label: "App Store...",
        icon: Download,
        action: () => console.log("App Store clicked")
    },
    {
        label: "",
        icon: () => null,
        divider: true
    },
    {
        label: "Recent Items",
        icon: Clock,
        submenu: [
            { label: "Clear Menu", icon: Trash2, action: () => console.log("Clear recent items") }
        ]
    },
    {
        label: "",
        icon: () => null,
        divider: true
    },
    {
        label: "Force Quit...",
        icon: X,
        shortcut: "⌥⌘⎋",
        action: () => console.log("Force Quit clicked")
    },
    {
        label: "",
        icon: () => null,
        divider: true
    },
    {
        label: "Sleep",
        icon: Moon,
        action: () => console.log("Sleep clicked")
    },
    {
        label: "Refresh",
        icon: RotateCcw,
        action: () => console.log("Restart clicked")
    },
    {
        label: "Shut Down",
        icon: Power,
        action: () => window.dispatchEvent(new Event('cockpit:shutdown'))
    },
    {
        label: "",
        icon: () => null,
        divider: true
    },
    {
        label: "Lock Screen",
        icon: Lock,
        shortcut: "⌃⌘Q",
        action: () => console.log("Lock Screen clicked")
    },
    {
        label: "Log Out User...",
        icon: User,
        shortcut: "⇧⌘Q",
        action: () => console.log("Log Out clicked")
    }
];

const viewMenuItems: MenuItem[] = [
    {
        label: "Show View Options",
        icon: Settings,
        action: () => console.log("Show View Options clicked")
    },
    {
        label: "Clean Up",
        icon: Trash2,
        action: () => console.log("Clean Up clicked")
    },
    {
        label: "Clean Up By",
        icon: Folder,
        submenu: [
            { label: "Name", icon: FileText },
            { label: "Date Modified", icon: Calendar },
            { label: "Date Created", icon: Clock },
            { label: "Size", icon: HardDrive },
            { label: "Kind", icon: Star }
        ]
    },
    {
        label: "",
        icon: () => null,
        divider: true
    },
    {
        label: "Sort By",
        icon: ChevronRight,
        submenu: [
            { label: "None", icon: Minus },
            { label: "", icon: () => null, divider: true },
            { label: "Name", icon: FileText },
            { label: "Date Modified", icon: Calendar },
            { label: "Date Created", icon: Clock },
            { label: "Size", icon: HardDrive },
            { label: "Kind", icon: Star }
        ]
    },
    {
        label: "Hide Extension",
        icon: EyeIcon,
        action: () => console.log("Hide Extension clicked")
    },
    {
        label: "",
        icon: () => null,
        divider: true
    },
    {
        label: "Show Preview",
        icon: Image,
        action: () => console.log("Show Preview clicked")
    },
    {
        label: "Show Tab Bar",
        icon: Minimize2,
        action: () => console.log("Show Tab Bar clicked")
    },
    {
        label: "Show Toolbar",
        icon: Monitor,
        action: () => console.log("Show Toolbar clicked")
    },
    {
        label: "Show Sidebar",
        icon: ChevronLeft,
        action: () => console.log("Show Sidebar clicked")
    },
    {
        label: "Show Status Bar",
        icon: Minimize2,
        action: () => console.log("Show Status Bar clicked")
    }
];

const itemMenuItems: MenuItem[] = [
    {
        label: "New Folder",
        icon: Folder,
        shortcut: "⇧⌘N",
        action: () => console.log("New Folder clicked")
    },
    {
        label: "New Window",
        icon: Monitor,
        shortcut: "⌘N",
        action: () => console.log("New Finder Window clicked")
    },
    {
        label: "",
        icon: () => null,
        divider: true
    },
    {
        label: "Get Info",
        icon: Info,
        shortcut: "⌘I",
        action: () => console.log("Get Info clicked")
    },
    {
        label: "Rename",
        icon: FileText,
        action: () => console.log("Rename clicked")
    },
    {
        label: "Duplicate",
        icon: Copy,
        shortcut: "⌘D",
        action: () => console.log("Duplicate clicked")
    },
    {
        label: "Share",
        icon: Share2,
        submenu: [
            { label: "AirDrop", icon: Wifi },
            { label: "Mail", icon: MailIcon },
            { label: "Messages", icon: MessageCircleIcon }
        ]
    },
    {
        label: "",
        icon: () => null,
        divider: true
    },
    {
        label: "Compress",
        icon: Download,
        action: () => console.log("Compress clicked")
    },
    {
        label: "",
        icon: () => null,
        divider: true
    },
    {
        label: "Move to Trash",
        icon: Trash2,
        shortcut: "⌘⌫",
        action: () => console.log("Move to Trash clicked")
    }
];

const servicesMenuItems: MenuItem[] = [
    {
        label: "No Services Apply",
        icon: X,
        disabled: true
    }
];

const windowMenuItems: MenuItem[] = [
    {
        label: "Minimize",
        icon: Minimize2,
        shortcut: "⌘M",
        action: () => console.log("Minimize clicked")
    },
    {
        label: "Zoom",
        icon: Maximize2,
        action: () => console.log("Zoom clicked")
    },
    {
        label: "Move Window to Left Side of Screen",
        icon: ChevronLeft,
        shortcut: "⌃⌘←",
        action: () => console.log("Move Left clicked")
    },
    {
        label: "Move Window to Right Side of Screen",
        icon: ChevronRight,
        shortcut: "⌃⌘→",
        action: () => console.log("Move Right clicked")
    },
    {
        label: "",
        icon: () => null,
        divider: true
    },
    {
        label: "Bring All to Front",
        icon: Monitor,
        action: () => console.log("Bring All to Front clicked")
    }
];

const helpMenuItems: MenuItem[] = [
    {
        label: "Cockpit Help",
        icon: HelpCircle,
        shortcut: "⌘?",
        action: () => console.log("Cockpit Help clicked")
    }
];

// Add missing icons
function EyeIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>; }
function MailIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>; }
function MessageCircleIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>; }

export function ContextMenu({ x, y, onClose }: ContextMenuProps) {
    const [openSubmenu, setOpenSubmenu] = useState<OpenSubmenuState | null>(null);
    const [pos, setPos] = useState({ top: y, left: x });
    const menuRef = useRef<HTMLDivElement>(null);
    const submenuTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Reset position when x,y change
    useEffect(() => {
        setPos({ top: y, left: x });
    }, [x, y]);

    // Measure and clamp position after mount
    useLayoutEffect(() => {
        const el = menuRef.current;
        if (!el) return;

        const r = el.getBoundingClientRect();
        const pad = 12;

        const nextLeft = Math.min(Math.max(pad, x), window.innerWidth - r.width - pad);
        const nextTop = Math.min(Math.max(pad, y), window.innerHeight - r.height - pad);

        // Prevent render loops
        if (nextLeft !== pos.left || nextTop !== pos.top) {
            setPos({ left: nextLeft, top: nextTop });
        }
    }, [x, y]); // IMPORTANT: do NOT include pos in deps

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    const handleMenuItemClick = (item: MenuItem) => {
        if (item.disabled) return;
        if (item.action) {
            try {
                item.action();
                onClose();
            } catch (error) {
                console.error('Error executing menu action:', error);
            }
        }
    };

    const handleSubmenuHover = (item: MenuItem, event: React.MouseEvent) => {
        if (item.disabled || !item.submenu || item.submenu.length === 0) return;

        if (submenuTimerRef.current) {
            clearTimeout(submenuTimerRef.current);
        }

        submenuTimerRef.current = setTimeout(() => {
            const rect = (event.target as HTMLElement).getBoundingClientRect();
            const submenuLength = item.submenu?.length || 0;
            const position = calculateSubmenuPosition(rect, submenuLength);
            setOpenSubmenu({
                label: item.label,
                items: item.submenu || [],
                position
            });
        }, 100); // 100ms delay for smooth hover
    };

    const calculateSubmenuPosition = (triggerRect: DOMRect, itemCount: number) => {
        const submenuWidth = 200;
        const submenuHeight = itemCount * 32;

        let left = triggerRect.right + 8;
        let top = triggerRect.top - 6;

        // Right edge overflow - position to the left
        if (left + submenuWidth > window.innerWidth - 10) {
            left = triggerRect.left - submenuWidth - 8;
        }

        // Bottom edge overflow - position above the trigger
        if (top + submenuHeight > window.innerHeight - 10) {
            top = triggerRect.top - submenuHeight + triggerRect.height + 6;
        }

        // Final clamping to ensure it stays within viewport
        // Left edge
        if (left < 10) {
            left = 10;
        }

        // Right edge (double-check)
        if (left + submenuWidth > window.innerWidth - 10) {
            left = window.innerWidth - submenuWidth - 10;
        }

        // Top edge
        if (top < 10) {
            top = 10;
        }

        // Bottom edge (double-check)
        if (top + submenuHeight > window.innerHeight - 10) {
            top = window.innerHeight - submenuHeight - 10;
        }

        return { top, left };
    };

    const renderMenuItem = (item: MenuItem, index: number) => {
        if (item.divider) {
            return (
                <div
                    key={index}
                    className="my-1 border-t border-white/10 mx-2"
                />
            );
        }

        const hasSubmenu = !!item.submenu && item.submenu.length > 0;

        return (
            <div key={index} className="relative">
                <button
                    className={`w-full flex items-center gap-3 px-3 py-1.5 text-left text-[13px] font-medium transition-colors ${item.disabled
                        ? 'text-white/30 cursor-not-allowed'
                        : 'text-white hover:bg-white/10 cursor-pointer'
                        }`}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleMenuItemClick(item);
                    }}
                    onMouseEnter={(e) => {
                        e.stopPropagation();
                        if (hasSubmenu) {
                            handleSubmenuHover(item, e);
                        } else {
                            // Clear any pending submenu timers
                            if (submenuTimerRef.current) {
                                clearTimeout(submenuTimerRef.current);
                            }
                            setOpenSubmenu(null);
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.stopPropagation();
                        if (!hasSubmenu && submenuTimerRef.current) {
                            clearTimeout(submenuTimerRef.current);
                        }
                    }}
                    disabled={item.disabled}
                >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.shortcut && (
                        <span className="text-[11px] text-white/50 font-mono tracking-wide">
                            {item.shortcut}
                        </span>
                    )}
                    {hasSubmenu && (
                        <ChevronRight className="w-3 h-3 text-white/50" />
                    )}
                </button>
            </div>
        );
    };

    // Calculate position for main menu to ensure it stays within viewport
    const getMainPosition = () => {
        if (typeof window === 'undefined') return { top: y, left: x };

        const menuWidth = 240;
        const menuHeight = 350; // Reduced height

        let left = x;
        let top = y;

        // Adjust for right edge - leave more margin
        if (x + menuWidth > window.innerWidth - 20) {
            left = Math.max(20, window.innerWidth - menuWidth - 20);
        } else {
            left = Math.max(20, left);
        }

        // Adjust for bottom edge - leave more margin
        if (y + menuHeight > window.innerHeight - 20) {
            top = Math.max(20, window.innerHeight - menuHeight - 20);
        } else {
            top = Math.max(20, top);
        }

        // Ensure menu doesn't go off left/top edges
        left = Math.max(20, left);
        top = Math.max(20, top);

        return { top, left };
    };

    const position = getMainPosition();

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                ref={menuRef}
                className="fixed z-[1000]"
                style={{
                    top: pos.top,
                    left: pos.left
                }}
            >
                <GlassInterface className="!rounded-xl !p-1.5 border border-white/10 min-w-60">
                    <div className="space-y-0.5">
                        {systemMenuItems.map((item, index) => renderMenuItem(item, index))}
                    </div>
                </GlassInterface>

                {/* Portal-based submenu */}
                {openSubmenu && (
                    <SubmenuPortal
                        items={openSubmenu.items}
                        position={openSubmenu.position}
                        onClose={() => setOpenSubmenu(null)}
                        onItemClick={(item) => {
                            if (item.action) {
                                item.action();
                                onClose();
                            }
                        }}
                    />
                )}
            </motion.div>
        </AnimatePresence>
    );
}