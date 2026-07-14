"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { GlassInterface } from "@/components/common/glass-interface";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface MenuItem {
    label: string;
    icon: React.ComponentType<any>;
    action?: () => void;
    shortcut?: string;
    disabled?: boolean;
    divider?: boolean;
    submenu?: MenuItem[];
}

interface SubmenuPortalProps {
    items: MenuItem[];
    position: { top: number; left: number };
    onClose: () => void;
    onItemClick?: (item: MenuItem) => void;
    parentLabel?: string;
    triggerRect?: DOMRect; // Optional trigger rectangle for better positioning
}

export function SubmenuPortal({ items, position, onClose, onItemClick, parentLabel, triggerRect }: SubmenuPortalProps) {
    const portalRef = useRef<HTMLDivElement>(null);
    const submenuTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [nestedSubmenu, setNestedSubmenu] = React.useState<{
        item: MenuItem;
        position: { top: number; left: number };
    } | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (portalRef.current && !portalRef.current.contains(event.target as Node)) {
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
            // Clear any pending timers
            if (submenuTimerRef.current) {
                clearTimeout(submenuTimerRef.current);
            }
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    const handleItemClick = (item: MenuItem) => {
        if (item.disabled) return;

        if (item.submenu && item.submenu.length > 0) {
            // Handle nested submenu
            return;
        }

        if (item.action) {
            try {
                item.action();
            } catch (error) {
                console.error('Error executing menu action:', error);
            }
        }
        if (onItemClick) {
            onItemClick(item);
        }
        onClose();
    };

    const handleSubmenuHover = (item: MenuItem, event: React.MouseEvent) => {
        if (item.disabled || !item.submenu || item.submenu.length === 0) return;

        if (submenuTimerRef.current) {
            clearTimeout(submenuTimerRef.current);
        }

        // Store the element reference immediately
        const targetElement = event.currentTarget as HTMLElement;

        submenuTimerRef.current = setTimeout(() => {
            try {
                // Check if element still exists
                if (!targetElement || !document.contains(targetElement)) {
                    return;
                }

                const rect = targetElement.getBoundingClientRect();
                const nestedPosition = calculateNestedSubmenuPosition(rect);
                setNestedSubmenu({
                    item,
                    position: nestedPosition
                });
            } catch (error) {
                console.error('Error calculating submenu position:', error);
            }
        }, 100); // 100ms delay for smooth hover
    };

    const calculateNestedSubmenuPosition = (triggerRect: DOMRect) => {
        const submenuWidth = 200;
        const submenuHeight = (nestedSubmenu?.item.submenu?.length || 5) * 32;

        // Use consistent padding values
        const minPad = 16;
        const maxPad = 20;
        const gap = 8;

        let left = triggerRect.right + gap;
        let top = triggerRect.top - 6;

        // Right edge overflow - position to the left
        if (left + submenuWidth > window.innerWidth - maxPad) {
            left = triggerRect.left - submenuWidth - gap;
        }

        // Bottom edge overflow - position above
        if (top + submenuHeight > window.innerHeight - maxPad) {
            top = triggerRect.top - submenuHeight + triggerRect.height + 6;
        }

        // Final clamping to ensure it stays within viewport with proper padding
        // Left edge
        if (left < minPad) {
            left = minPad;
        }

        // Right edge (double-check)
        if (left + submenuWidth > window.innerWidth - maxPad) {
            left = window.innerWidth - submenuWidth - maxPad;
        }

        // Top edge
        if (top < minPad) {
            top = minPad;
        }

        // Bottom edge (double-check)
        if (top + submenuHeight > window.innerHeight - maxPad) {
            top = window.innerHeight - submenuHeight - maxPad;
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
                        handleItemClick(item);
                    }}
                    onMouseEnter={(e) => {
                        e.stopPropagation();
                        handleSubmenuHover(item, e);
                    }}
                    onMouseLeave={(e) => {
                        e.stopPropagation();
                        if (submenuTimerRef.current) {
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

    return createPortal(
        <>
            <AnimatePresence>
                <motion.div
                    ref={portalRef}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    className="fixed z-[2000]"
                    style={{
                        top: `${Math.max(16, Math.min(position.top, window.innerHeight - (items.length * 32) - 20))}px`,
                        left: `${Math.max(16, Math.min(position.left, window.innerWidth - 200 - 20))}px`
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerUp={(e) => e.stopPropagation()}
                >
                    <GlassInterface className="!rounded-xl !p-1.5 border border-white/10 min-w-48">
                        <div className="space-y-0.5">
                            {items.map((item, index) => renderMenuItem(item, index))}
                        </div>
                    </GlassInterface>
                </motion.div>
            </AnimatePresence>

            {/* Nested submenu portal */}
            {nestedSubmenu && (
                <SubmenuPortal
                    items={nestedSubmenu.item.submenu!}
                    position={nestedSubmenu.position}
                    onClose={() => setNestedSubmenu(null)}
                    onItemClick={onItemClick}
                    parentLabel={nestedSubmenu.item.label}
                />
            )}
        </>,
        document.body
    );
}