"use client";

import { GlassInterface } from "@/components/common/glass-interface";
import "@/components/common/styles/glass-interface.css";
import {
    CalendarCheck2,
    Folder,
    BadgeInfo,
    ExternalLink,
    Gauge,
    Globe,
    Images,
    MonitorCog,
    Search,
    Settings,
    Shield,
    UserCircle,
    X,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState, type ComponentType } from "react";

const systemApps = [
    { icon: "/apps/terminal.svg", label: "Terminal", keepImage: true },
    { icon: Folder, label: "Explorer", tileClassName: "bg-transparent", iconClassName: "fill-white text-white" },
    { icon: Gauge, label: "Task Monitor", tileClassName: "bg-transparent", iconClassName: "fill-white/20 text-white" },
    { icon: MonitorCog, label: "Device Manager", tileClassName: "bg-transparent", iconClassName: "fill-white/10 text-white" },
];

// const commsApps = [
//     { icon: Video, label: "FaceTime", color: "bg-white/10" },
//     { icon: MailOpen, label: "Reglook Mail", color: "bg-white/10" },
// ];

const personalApps = [
    { icon: CalendarCheck2, label: "Calendar", tileClassName: "bg-transparent", iconClassName: "fill-white/10 text-white" },
    { icon: UserCircle, label: "Account", tileClassName: "bg-transparent", iconClassName: "fill-white text-white" },
    { icon: Images, label: "Photos", tileClassName: "bg-transparent", iconClassName: "fill-white/10 text-white" },
];

const webApps = [
    { icon: Shield, label: "Brave", url: "https://search.brave.com/", tileClassName: "bg-transparent", iconClassName: "fill-white text-white" },
    { icon: Search, label: "Google", url: "https://google.com", tileClassName: "bg-transparent", iconClassName: "text-white" },
];

export interface DockProps {
    onAppClick?: (label: string) => void;
    activeApps?: string[];
}

export function Dock({ onAppClick, activeApps = [] }: DockProps) {
    const [redirectModal, setRedirectModal] = useState<{ show: boolean; browser: string; url: string }>({
        show: false,
        browser: "",
        url: ""
    });

    const handleBrowserClick = (browser: string, url: string) => {
        setRedirectModal({ show: true, browser, url });
    };

    const handleProceed = () => {
        window.open(redirectModal.url, '_blank');
        setRedirectModal({ show: false, browser: "", url: "" });
    };

    const handleCancel = () => {
        setRedirectModal({ show: false, browser: "", url: "" });
    };

    return (
        <>
            <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-3">
                <div
                    className="pointer-events-auto isolate max-w-full"
                    style={{
                        transform: "translateZ(0)",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                    }}
                >
                <GlassInterface
                    noTransition
                    contentClassName="!m-0 !flex !items-end !justify-center !gap-2 !px-3.5 !py-2.5"
                    className="!rounded-2xl !shadow-lg !shadow-black/25 ring-1 ring-white/10"
                >
                    <div className="flex items-end gap-2">
                        <DockItem
                            icon={BadgeInfo}
                            label="System Info"
                            tileClassName="bg-transparent"
                            iconClassName="fill-white/10 text-white"
                            onClick={() => onAppClick?.("Finder")}
                            isActive={activeApps.includes("Finder")}
                        />

                        <DockDivider />

                        {systemApps.map((item, index) => (
                            <DockItem
                                key={`sys-${index}`}
                                icon={item.icon}
                                label={item.label}
                                tileClassName={item.tileClassName}
                                iconClassName={item.iconClassName}
                                keepImage={item.keepImage}
                                onClick={() => onAppClick?.(item.label)}
                                isActive={activeApps.includes(item.label)}
                            />
                        ))}

                        <DockDivider />

                        {personalApps.map((item, index) => (
                            <DockItem
                                key={`pers-${index}`}
                                icon={item.icon}
                                label={item.label}
                                tileClassName={item.tileClassName}
                                iconClassName={item.iconClassName}
                                onClick={() => onAppClick?.(item.label)}
                                isActive={activeApps.includes(item.label)}
                            />
                        ))}

                        <DockDivider />

                        {webApps.map((item, index) => (
                            <DockItem
                                key={`web-${index}`}
                                icon={item.icon}
                                label={item.label}
                                tileClassName={item.tileClassName}
                                iconClassName={item.iconClassName}
                                onClick={() => handleBrowserClick(item.label, item.url || "")}
                                isActive={activeApps.includes(item.label)}
                            />
                        ))}

                        <DockDivider />

                        <DockItem
                            icon={Settings}
                            label="Settings"
                            tileClassName="bg-transparent"
                            iconClassName="fill-white/20 text-white"
                            onClick={() => onAppClick?.("Settings")}
                            isActive={activeApps.includes("Settings")}
                        />
                    </div>
                </GlassInterface>
                </div>
            </div>

            {/* Browser Redirection Modal */}
            <AnimatePresence>
                {redirectModal.show && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm"
                        onClick={handleCancel}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-[480px] bg-zinc-950 border border-white/10 rounded-2xl p-8 backdrop-blur-3xl shadow-2xl"
                        >
                            {/* Close Button */}
                            <button
                                onClick={handleCancel}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors group"
                            >
                                <X className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                            </button>

                            {/* Icon */}
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-500/20 flex items-center justify-center">
                                    <ExternalLink className="w-8 h-8 text-zinc-500" />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="text-center space-y-4 mb-8">
                                <h2 className="text-2xl font-bold text-white">External Browser</h2>
                                <p className="text-[15px] text-zinc-400 leading-relaxed">
                                    You&apos;re about to enter <span className="font-bold text-white">{redirectModal.browser}</span> in a new browser tab. This will redirect you to an external page.
                                </p>
                                <div className="px-4 py-2 bg-zinc-900/50 rounded-lg border border-white/5">
                                    <p className="text-[13px] font-semibold text-zinc-500 truncate">{redirectModal.url}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[15px] font-semibold text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleProceed}
                                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-[15px] font-semibold text-white transition-colors flex items-center justify-center gap-2"
                                >
                                    <span>Continue</span>
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function DockDivider() {
    return (
        <div
            className="mx-0.5 h-9 w-px shrink-0 self-center bg-white/15"
            aria-hidden
        />
    );
}

function DockItem({
    icon: Icon,
    label,
    tileClassName = "bg-indigo-500",
    iconClassName = "",
    keepImage = false,
    onClick,
    isActive,
}: {
    icon: ComponentType<{ className?: string }> | string;
    label: string;
    tileClassName?: string;
    iconClassName?: string;
    keepImage?: boolean;
    onClick?: () => void;
    isActive?: boolean;
}) {
    return (
        <motion.div
            whileHover={{ scale: 1.06, y: -3 }}
            whileTap={{ scale: 0.96 }}
            onClick={onClick}
            className="group relative"
        >
            <div
                className={[
                    "relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl",
                    "bg-white/10 transition-colors duration-200",
                    "hover:bg-white/[0.16]",
                    isActive ? "bg-white/[0.18] ring-1 ring-white/25" : "",
                ].join(" ")}
            >
                {typeof Icon === "string" && keepImage ? (
                    <Image src={Icon} alt={label} width={40} height={40} className="h-10 w-10" />
                ) : (
                    <div
                        className={[
                            "flex h-full w-full items-center justify-center rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]",
                            tileClassName,
                        ].join(" ")}
                    >
                        {typeof Icon === "string" ? (
                            <Globe className="h-7 w-7 fill-white/20 text-white transition-colors duration-200" />
                        ) : (
                            <Icon
                                className={
                                    iconClassName
                                        ? `h-7 w-7 transition-colors duration-200 ${iconClassName}`
                                        : "h-7 w-7 fill-white/20 text-white transition-colors duration-200 group-hover:text-white"
                                }
                            />
                        )}
                    </div>
                )}
            </div>

            {isActive && (
                <div className="absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white/90" />
            )}

            <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/65 px-2.5 py-1 text-xs text-white/95 opacity-0 backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100">
                {label}
            </div>
        </motion.div>
    );
}
