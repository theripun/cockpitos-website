"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useDragControls, useMotionValue } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CircleUser,
  CreditCard,
  ExternalLink,
  LifeBuoy,
  Maximize2,
  MonitorSmartphone,
  ScrollText,
  Tags,
  X,
} from "lucide-react";
import { WINDOW_CONSTANTS } from "../window-constants";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/app/account/components/section-header";
import { AccountProfileOverview } from "@/app/account/components/account-profile-overview";
import { AccountDevicesOverview } from "@/app/account/components/account-devices-overview";
import { AccountPlansOverview } from "@/app/account/components/account-plans-overview";
import { AccountAlertsOverview } from "@/app/account/components/account-alerts-overview";
import { AccountLogsOverview } from "@/app/account/components/account-logs-overview";
import { AccountSupportOverview } from "@/app/account/components/account-support-overview";
import { PlanDetailsSection } from "@/app/account/components/plan-details-section";
import { BillingUsageCard } from "@/app/account/components/billing-usage-card";
import { PaymentMethodCard } from "@/app/account/components/payment-method-card";
import { InvoicesCard } from "@/app/account/components/invoices-card";
import { AppHorizontalAdRibbon, AppHorizontalAdTrack } from "@/components/ads";

type AccountView =
  | "account"
  | "devices"
  | "billing"
  | "plans"
  | "alerts"
  | "logs"
  | "support";

const NAV: { id: AccountView; label: string; icon: LucideIcon }[] = [
  { id: "account", label: "Account", icon: CircleUser },
  { id: "devices", label: "My Devices", icon: MonitorSmartphone },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "plans", label: "Plans", icon: Tags },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "logs", label: "Logs", icon: ScrollText },
  { id: "support", label: "Support", icon: LifeBuoy },
];

interface AccountAppProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
}

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export function AccountApp({ isOpen, onClose, onMinimize }: AccountAppProps) {
  const [size, setSize] = useState({ width: 960, height: 620 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [preMaximizeState, setPreMaximizeState] = useState<{
    size: { width: number; height: number };
    pos: { x: number; y: number };
  } | null>(null);
  const [view, setView] = useState<AccountView>("account");
  const mainScrollRef = useRef<HTMLElement>(null);

  const dragControls = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsMaximized(false);
    setSize({ width: 960, height: 620 });
    x.set(0);
    y.set(-12);
  }, [isOpen, x, y]);

  useEffect(() => {
    const el = mainScrollRef.current;
    if (el) el.scrollTop = 0;
  }, [view]);

  useEffect(() => {
    if (!isOpen) return;
    const el = mainScrollRef.current;
    if (el) el.scrollTop = 0;
  }, [isOpen]);

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
        setSize({ width: 960, height: 620 });
        import("framer-motion").then(({ animate }) => {
          animate(x, 0, springConfig);
          animate(y, -12, springConfig);
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
    const MIN_W = 720;
    const MIN_H = 440;
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
    const onMove = (ev: PointerEvent) => {
      if (!raf) raf = window.requestAnimationFrame(() => applyAction(ev));
    };
    const onUp = (ev: PointerEvent) => {
      try {
        target.releasePointerCapture(ev.pointerId);
      } catch {
        /* noop */
      }
      setIsResizing(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (raf) window.cancelAnimationFrame(raf);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const mainContent = (() => {
    switch (view) {
      case "account":
        return (
          <>
            <SectionHeader title="Account" subtitle="Profile and account preferences" />
            <AccountProfileOverview className="mt-8" />
          </>
        );
      case "devices":
        return (
          <>
            <SectionHeader title="My Devices" subtitle="Cockpit-connected systems and agents" />
            <AccountDevicesOverview className="mt-8" />
          </>
        );
      case "billing":
        return (
          <>
            <SectionHeader title="Billing & Usage" subtitle="Subscriptions and payments" />
            <PlanDetailsSection planName="Paid Plan" className="mt-6" />
            <AppHorizontalAdTrack className="mt-6" />
            <div className="mt-8 flex flex-col gap-6">
              <BillingUsageCard />
              <PaymentMethodCard />
              <InvoicesCard />
            </div>
          </>
        );
      case "plans":
        return (
          <>
            <SectionHeader title="Plans & Pricing" subtitle="Compare tiers when you need more" />
            <AppHorizontalAdRibbon className="mt-5" />
            <div className="mt-6">
              <AccountPlansOverview />
            </div>
          </>
        );
      case "alerts":
        return (
          <>
            <SectionHeader title="Alerts & Notifications" subtitle="How Cockpit reaches you" />
            <AccountAlertsOverview className="mt-8" />
          </>
        );
      case "logs":
        return (
          <>
            <SectionHeader title="Logs" subtitle="Activity for your account" />
            <AccountLogsOverview className="mt-8" />
          </>
        );
      case "support":
        return (
          <>
            <SectionHeader title="Support" subtitle="We’re here when you need us" />
            <AccountSupportOverview className="mt-8" />
          </>
        );
      default:
        return null;
    }
  })();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          drag={!isResizing && !isMaximized}
          dragMomentum={false}
          dragListener={false}
          dragControls={dragControls}
          onDragEnd={handleDragEnd}
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 24 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          style={{ x, y, width: size.width, height: size.height }}
          className={cn(
            "pointer-events-auto relative flex flex-col overflow-hidden border border-white/10 bg-[#020202] font-sans shadow-2xl",
            isMaximized ? "rounded-xl" : "rounded-2xl",
            isResizing && "select-none"
          )}
        >
            <div
              className="flex h-11 shrink-0 cursor-default select-none items-center border-b border-white/[0.06] bg-zinc-900/90 px-3 backdrop-blur-md"
              onPointerDown={(e) => dragControls.start(e)}
              onDoubleClick={toggleMaximize}
            >
              <div className="flex w-[28%] items-center gap-1.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="group/btn flex h-3 w-3 items-center justify-center rounded-full bg-[#FF5F57] transition-transform hover:scale-110 active:scale-95"
                  aria-label="Close"
                >
                  <X className="h-2 w-2 text-black/50 opacity-0 transition-opacity group-hover/btn:opacity-100" />
                </button>
                <button
                  type="button"
                  onClick={() => onMinimize?.()}
                  className="group/btn flex h-3 w-3 items-center justify-center rounded-full bg-[#FEBC2E] transition-transform hover:scale-110 active:scale-95"
                  aria-label="Minimize"
                >
                  <div className="h-[1.5px] w-1.5 bg-black/50 opacity-0 transition-opacity group-hover/btn:opacity-100" />
                </button>
                <button
                  type="button"
                  onClick={toggleMaximize}
                  className="group/btn flex h-3 w-3 items-center justify-center rounded-full bg-[#28C840] transition-transform hover:scale-110 active:scale-95"
                  aria-label="Maximize"
                >
                  <Maximize2 className="h-1.5 w-1.5 text-black/50 opacity-0 transition-opacity group-hover/btn:opacity-100" />
                </button>
              </div>
              <div className="flex flex-1 items-center justify-center gap-2">
                <CircleUser className="h-4 w-4 text-zinc-400" strokeWidth={1.75} />
                <span className="text-[13px] font-semibold tracking-tight text-zinc-200">Account</span>
              </div>
              <div className="flex w-[28%] justify-end" />
            </div>

            <div className="flex min-h-0 min-w-0 flex-1">
              <aside className="flex w-[200px] shrink-0 flex-col border-r border-white/[0.06] bg-[#050505] sm:w-[220px]">
                <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3" aria-label="Account sections">
                  {NAV.map((item) => {
                    const Icon = item.icon;
                    const active = view === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setView(item.id)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12px] font-semibold transition-colors sm:text-[13px]",
                          active
                            ? "bg-white/[0.08] text-white"
                            : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
                        )}
                      >
                        <Icon
                          className={cn("h-[17px] w-[17px] shrink-0", active ? "text-zinc-200" : "opacity-70")}
                          strokeWidth={1.75}
                        />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
                
              </aside>

              <main
                ref={mainScrollRef}
                className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain bg-black"
              >
                <div className="mx-auto max-w-[640px] px-5 py-6 sm:px-8 sm:py-8">{mainContent}</div>
              </main>
            </div>

            {!isMaximized && (
              <>
                <div
                  onPointerDown={handleResizeStart("n")}
                  className="absolute top-0 left-2 right-2 h-1.5 cursor-n-resize"
                />
                <div
                  onPointerDown={handleResizeStart("s")}
                  className="absolute bottom-0 left-2 right-2 h-1.5 cursor-s-resize"
                />
                <div
                  onPointerDown={handleResizeStart("w")}
                  className="absolute left-0 top-2 bottom-2 w-1.5 cursor-w-resize"
                />
                <div
                  onPointerDown={handleResizeStart("e")}
                  className="absolute right-0 top-2 bottom-2 w-1.5 cursor-e-resize"
                />
                <div
                  onPointerDown={handleResizeStart("nw")}
                  className="absolute top-0 left-0 h-3.5 w-3.5 cursor-nw-resize"
                />
                <div
                  onPointerDown={handleResizeStart("ne")}
                  className="absolute top-0 right-0 h-3.5 w-3.5 cursor-ne-resize"
                />
                <div
                  onPointerDown={handleResizeStart("sw")}
                  className="absolute bottom-0 left-0 h-3.5 w-3.5 cursor-sw-resize"
                />
                <div
                  onPointerDown={handleResizeStart("se")}
                  className="absolute bottom-0 right-0 h-3.5 w-3.5 cursor-se-resize"
                />
              </>
            )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
