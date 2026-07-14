"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { GlassInterface } from "@/components/common/glass-interface";
import { motion, AnimatePresence } from "framer-motion";
import { SubmenuPortal } from "./submenu-portal";
import {
  Monitor,
  MonitorCog,
  Volume2,
  VolumeX,
  RotateCcw,
  Power,
  User,
  Settings,
  Info,
  HelpCircle,
  Lock,
  Moon,
  Sun,
  Palette,
  Bluetooth,
  Clock,
  Image,
  Folder,
  Trash2,
  Plus,
  Minus,
  X,
  ChevronRight,
} from "lucide-react";

interface DesktopContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  activeApps: string[];
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

function clampToViewport(left: number, top: number, w: number, h: number, pad = 16) {
  // Ensure minimum padding from all edges
  const minPad = pad;
  const maxPad = pad + 4; // Extra padding to prevent touching edges

  // Calculate safe boundaries
  const maxLeft = window.innerWidth - w - maxPad;
  const maxTop = window.innerHeight - h - maxPad;

  // Clamp position with proper padding
  const clampedLeft = Math.max(minPad, Math.min(left, maxLeft));
  const clampedTop = Math.max(minPad, Math.min(top, maxTop));

  return {
    left: clampedLeft,
    top: clampedTop,
  };
}

export function DesktopContextMenu({ x, y, onClose, activeApps }: DesktopContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<number | null>(null);

  const [openSubmenu, setOpenSubmenu] = useState<OpenSubmenuState | null>(null);

  // Simple and reliable positioning
  const pos = useMemo(() => {
    // Estimate menu dimensions
    const estimatedWidth = 220;
    const estimatedHeight = 20 * 32 + 20;
    return clampToViewport(x, y, estimatedWidth, estimatedHeight, 16);
  }, [x, y]);

  // Clear submenu when position changes
  useEffect(() => {
    setOpenSubmenu(null);
  }, [x, y]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) onClose();
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    // premium UX: close on scroll/resize so it never "floats wrong"
    const handleScrollOrResize = () => onClose();

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [onClose]);

  function TerminalIcon() {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    );
  }
  function HeadphonesIcon() {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 14v5a2 2 0 01-2 2h-1v-7h3zM6 21H5a2 2 0 01-2-2v-5h3v7zm15-9a9 9 0 10-18 0v2h18v-2z"
        />
      </svg>
    );
  }

  const menuItems: MenuItem[] = useMemo(
    () => [
      {
        label: "New Window", icon: Monitor, shortcut: "⌘N", action: () => {
          window.open(window.location.href, '_blank');
        }
      },
      {
        label: "New Terminal", icon: TerminalIcon, action: () => {
          const event = new CustomEvent('cockpit:open-app', { detail: { app: 'Terminal' } });
          window.dispatchEvent(event);
        }
      },
      // { label: "", icon: () => null, divider: true },
      // {
      //   label: "Get Info", icon: Info, shortcut: "⌘I", action: () => {
      //     const event = new CustomEvent('cockpit:open-app', { detail: { app: 'Finder' } });
      //     window.dispatchEvent(event);
      //   }
      // },
      {
        label: "Change Background", icon: Image, action: () => {
          const event = new CustomEvent('openBackgroundSelector');
          document.dispatchEvent(event);
        }
      },
      // { label: "", icon: () => null, divider: true },
      // {
      //   label: "Sound",
      //   icon: Volume2,
      //   submenu: [
      //     {
      //       label: "Volume",
      //       icon: Volume2,
      //       submenu: [
      //         { label: "Increase", icon: Plus, action: () => console.log("Volume increased") },
      //         { label: "Decrease", icon: Minus, action: () => console.log("Volume decreased") },
      //         { label: "Mute", icon: VolumeX, action: () => console.log("Audio muted") },
      //       ],
      //     },
      //     {
      //       label: "Output Device",
      //       icon: HeadphonesIcon,
      //       submenu: [
      //         { label: "Built-in Speakers", icon: Volume2, action: () => console.log("Output device set to Built-in Speakers") },
      //         { label: "Headphones", icon: HeadphonesIcon, action: () => console.log("Output device set to Headphones") },
      //         { label: "Bluetooth", icon: Bluetooth, action: () => console.log("Output device set to Bluetooth") },
      //       ],
      //     },
      //   ],
      // },
      { label: "", icon: () => null, divider: true },
      {
        label: "Recent Items",
        icon: Clock,
        submenu: activeApps.length > 0 ? [
          ...activeApps.map(app => ({
            label: app,
            icon: Monitor, // Generic icon for now, ideally map to app icons
            action: () => {
              const event = new CustomEvent('cockpit:open-app', { detail: { app } });
              window.dispatchEvent(event);
            }
          })),
          // { label: "", icon: () => null, divider: true },
          // {
          //   label: "Clear Menu",
          //   icon: Trash2,
          //   action: () => {
          //     console.log("Clear Menu clicked, active apps: ", activeApps);
          //     activeApps.forEach(app => {
          //       const event = new CustomEvent('cockpit:close-app', { detail: { app } });
          //       window.dispatchEvent(event);
          //     });
          //   }
          // }
        ] : [
          { label: "No running apps", icon: X, disabled: true }
        ],
      },
      { label: "", icon: () => null, divider: true },
      { label: "Refresh", icon: RotateCcw, action: () => window.location.reload() },
      { label: "Shut Down", icon: Power, action: () => window.dispatchEvent(new Event('cockpit:shutdown')) },
    ],
    [activeApps]
  );

  const handleMenuItemClick = (item: MenuItem) => {
    if (item.disabled) return;
    if (item.submenu && item.submenu.length > 0) return;
    item.action?.();
    onClose();
  };

  const openSubmenuFromTrigger = (item: MenuItem, triggerEl: HTMLElement) => {
    if (!item.submenu?.length) return;

    const rect = triggerEl.getBoundingClientRect();
    const gap = 8;

    let left = rect.right + gap;
    let top = rect.top - 6;

    const estW = 220;
    const estH = item.submenu.length * 32 + 12;

    if (left + estW > window.innerWidth - 20) left = rect.left - estW - gap;

    const clamped = clampToViewport(left, top, estW, estH, 16);

    setOpenSubmenu({
      label: item.label,
      items: item.submenu,
      position: { left: clamped.left, top: clamped.top },
    });
  };

  const renderMenuItem = (item: MenuItem, index: number) => {
    if (item.divider) return <div key={index} className="my-1 border-t border-white/10 mx-2" />;

    const hasSubmenu = !!item.submenu?.length;

    return (
      <div key={index}>
        <button
          className={`w-full flex items-center gap-3 px-3 py-1.5 text-left text-[13px] font-medium transition-colors ${item.disabled ? "text-white/30 cursor-not-allowed" : "text-white hover:bg-white/10 cursor-pointer"
            }`}
          disabled={item.disabled}
          onClick={(e) => {
            e.stopPropagation();
            handleMenuItemClick(item);
          }}
          onMouseEnter={(e) => {
            e.stopPropagation();

            if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);

            if (hasSubmenu) {
              const el = e.currentTarget as HTMLElement;
              hoverTimerRef.current = window.setTimeout(() => openSubmenuFromTrigger(item, el), 80);
            } else {
              setOpenSubmenu(null);
            }
          }}
        >
          <item.icon className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{item.label}</span>
          {item.shortcut && <span className="text-[11px] text-white/50 font-mono tracking-wide">{item.shortcut}</span>}
          {hasSubmenu && <ChevronRight className="w-3 h-3 text-white/50" />}
        </button>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.1 }}
        className="fixed z-[1000]"
        style={{ top: pos.top, left: pos.left }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <GlassInterface className="!rounded-xl !p-1.5 border border-white/10 min-w-60">
          <div className="space-y-0.5">{menuItems.map(renderMenuItem)}</div>
        </GlassInterface>

        {openSubmenu && (
          <SubmenuPortal
            items={openSubmenu.items}
            position={openSubmenu.position}
            onClose={() => setOpenSubmenu(null)}
            onItemClick={(clicked) => {
              clicked.action?.();
              onClose();
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
