"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Monitor, Smartphone, Lock } from "lucide-react";
import { isCheckoutPathname } from "@/lib/checkout-region";

export default function DeviceChecker() {
    const pathname = usePathname();
    const isCheckout = isCheckoutPathname(pathname);
    // blocked by default on server/initial render if screen is small (handled by CSS)
    // blocked on client if JS detects mobile
    const [isMobileDetected, setIsMobileDetected] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkDevice = () => {
            const ua = navigator.userAgent || navigator.vendor || (window as any).opera || "";

            // Check for strict mobile User Agents
            const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

            // Check for orientation support (widely supported on mobile, rare on desktop)
            const hasOrientation = typeof window.orientation !== "undefined";

            // Check for iPadOS 13+ which masquerades as Desktop (MacIntel) but has touch
            const isIPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;

            if (isMobileUA || hasOrientation || isIPadOS) {
                setIsMobileDetected(true);
            } else {
                setIsMobileDetected(false);
            }
        };

        checkDevice();
        window.addEventListener("resize", checkDevice);
        window.addEventListener("orientationchange", checkDevice);

        return () => {
            window.removeEventListener("resize", checkDevice);
            window.removeEventListener("orientationchange", checkDevice);
        };
    }, []);

    // Logic:
    // 1. CSS `lg:hidden`: IF width < 1024px, show flex (BLOCK). IF width >= 1024px, hidden (ALLOW).
    // 2. JS `isMobileDetected`: IF true, FORCE show flex (BLOCK) even if width is big.

    // So class is:
    // "fixed ... flex" (Always flex base)
    // "lg:hidden" (Hidden on large screens UNLESS overridden)
    // If isMobileDetected -> remove lg:hidden? No, manually handle.

    // Effective visibility:
    // - Small screen (<1024): Visible via CSS (lg:hidden doesn't apply? No, Wait.)
    //   `hidden` means "display: none". `lg:hidden` means "on lg, set display: none".
    //   So implicitly `block` (or flex) on small.
    //   So `<div class="flex lg:hidden ...">` -> Visible on small, Hidden on Large.
    // - If `isMobileDetected` is true: We want it VISIBLE on Large too.
    //   So we simply DO NOT apply `lg:hidden`.

    const visibilityClass = isMobileDetected ? "flex" : "flex lg:hidden";

    if (isCheckout) {
        return null;
    }

    return (
        <div className={`fixed inset-0 z-[9999] bg-black backdrop-blur-sm ${visibilityClass} flex-col items-center justify-center p-8 text-center transition-all duration-500`}>
            <div className="relative mb-8 group">
                {/* <div className="absolute inset-0 bg-transparent blur-3xl rounded-full" /> */}
                {/* <Monitor className="w-32 h-32 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-150 blur-[2px]" /> */}
                <div className="relative bg-zinc-800 p-4 rounded-2xl border border-zinc-800 shadow-2xl shadow-zinc-900/20">
                    <Lock className="w-12 h-12 text-white animate-pulse" />
                </div>
            </div>

            <h1 className="text-3xl font-semibold mb-4 tracking-tighter text-white">
                Desktop Access Only
            </h1>

            <div className="max-w-md space-y-4">
                <p className="text-muted-foreground text-sm leading-relaxed">
                    CockpitOS requires a desktop environment to function correctly.
                    Mobile devices and small screens are not supported.
                </p>

                <div className="text-xs font-mono text-white bg-rose-950 border border-destructive/20 p-2 rounded inline-block">
                    ERR_DEVICE_NOT_SUPPORTED
                </div>
            </div>

            {/* <div className="absolute bottom-8 text-xs text-muted-foreground/50 uppercase tracking-[0.2em]">
                System Protection Active
            </div> */}
        </div>
    );
}
