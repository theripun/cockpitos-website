"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isCheckoutPathname } from "@/lib/checkout-region";

export default function DeviceChecker() {
    const pathname = usePathname();
    const isCheckout = isCheckoutPathname(pathname);
    // blocked by default on server/initial render if screen is small (handled by CSS)
    // blocked on client if JS detects mobile
    const [isMobileDetected, setIsMobileDetected] = useState(false);

    useEffect(() => {
        const checkDevice = () => {
            const legacyWindow = window as Window & { opera?: string };
            const ua = navigator.userAgent || navigator.vendor || legacyWindow.opera || "";

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

    const retryDeviceCheck = () => {
        window.location.reload();
    };

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
        <div className={`fixed inset-0 z-[9999] bg-[#030712] ${visibilityClass} items-center justify-center overflow-hidden px-5 py-6 text-white transition-all duration-500`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(39,144,255,0.36),transparent_30%),radial-gradient(circle_at_18%_88%,rgba(0,221,255,0.16),transparent_28%),linear-gradient(135deg,#020617_0%,#071a3f_48%,#0b5cff_100%)]" />

            <div className="relative flex h-full max-h-[780px] w-full max-w-[560px] flex-col overflow-hidden rounded-[58px] bg-[linear-gradient(180deg,#020817_0%,#08327f_58%,#18b8ff_100%)] px-8 pb-8 pt-9 shadow-[0_28px_60px_rgba(0,8,30,0.5),inset_0_1px_0_rgba(255,255,255,0.18)] sm:px-14 sm:pb-11 sm:pt-12">
                {/* <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_16%,rgba(64,178,255,0.28),transparent_22%),radial-gradient(circle_at_26%_72%,rgba(255,255,255,0.12),transparent_28%)]" /> */}

                <div className="relative z-10">
                    
                    <h1 className="max-w-[430px] text-[54px] font-black leading-[0.95] tracking-[-0.055em] text-white drop-shadow-[0_3px_8px_rgba(10,43,133,0.22)] sm:text-[70px]">
                        Device
                        <br />
                        Unsupported!
                    </h1>
                    <p className="mt-5 max-w-[390px] text-[15px] font-semibold leading-6 text-white sm:text-[17px]">
                        CockpitOS is your private computer in the browser. It lets you
                        manage AWS EC2 or any VPS like a full desktop, with apps, files,
                        terminal, and server controls in one workspace. Pro is free for
                        1 year. Please open it on a laptop or desktop for the full
                        experience.
                    </p>
                </div>

                <div className="relative z-10 mt-auto flex flex-1 items-end justify-center pb-4 pt-6">
                    <svg
                        aria-hidden="true"
                        className="w-[92%] max-w-[430px] drop-shadow-[0_28px_28px_rgba(9,47,139,0.24)]"
                        viewBox="0 0 430 360"
                        fill="none"
                    >
                        <path d="M124 270L302 315L391 169L201 134L124 270Z" fill="#001126" opacity="0.62" />
                        <path d="M85 221C95 164 142 120 202 111L323 92C352 88 378 108 383 137L399 231C404 260 384 287 354 292L234 311C173 321 114 282 91 225L85 221Z" fill="#020617" />
                        <path d="M93 207C105 153 151 112 209 104L318 88C347 84 373 103 379 132L394 220C399 249 380 276 350 281L241 297C181 306 123 270 98 216L93 207Z" fill="#0a3d91" />
                        <path d="M91 213L390 168L399 219L105 264L91 213Z" fill="#020617" />
                        <path d="M106 264L399 219L408 267L128 310C116 296 109 281 106 264Z" fill="#0057ff" />
                        <path d="M110 164L379 124L386 166L91 211C94 193 101 177 110 164Z" fill="#0f8dff" />
                        <path d="M82 208C89 157 127 116 178 101L194 109C147 128 113 168 106 216L82 208Z" fill="#0bd7ff" />
                        <path d="M350 93C368 99 381 115 384 136L407 267C411 289 401 310 384 323L364 313C378 301 386 282 383 263L361 136C358 118 346 103 330 96L350 93Z" fill="#d7f9ff" />
                        <path d="M174 102C176 61 206 29 247 24C278 21 307 36 322 62C286 57 252 62 220 77C202 85 187 94 174 102Z" fill="#e9fdff" />
                        <path d="M218 25C242 9 274 13 294 35C271 34 250 41 231 56C210 72 195 91 186 111C176 79 189 44 218 25Z" fill="#020617" />
                        <path d="M241 24C261 25 281 34 295 49C273 52 252 61 235 76C219 90 207 107 199 126C189 87 205 47 241 24Z" fill="#0d5bff" />
                        <path d="M267 31C286 39 300 55 307 75C286 73 267 78 249 91C232 103 220 120 212 140C209 98 230 55 267 31Z" fill="#84ecff" />
                        <path d="M122 183C147 173 173 166 200 162M99 232C136 220 174 211 213 205M129 279C169 267 210 258 252 252" stroke="#0036a8" strokeWidth="10" strokeLinecap="round" opacity="0.82" />
                        <path d="M127 164C164 152 203 145 241 142M117 216C165 202 214 193 264 189M138 267C185 254 234 246 284 242" stroke="#67e7ff" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
                    </svg>
                </div>

                <div className="relative z-10">
                    <button
                        type="button"
                        onClick={retryDeviceCheck}
                        className="flex h-[70px] w-full items-center justify-center rounded-full bg-white text-[18px] font-bold text-black shadow-[0_18px_34px_rgba(7,50,166,0.18)] transition hover:bg-white/80 active:translate-y-px"
                    >
                        Retry on desktop
                    </button>
                </div>
            </div>
        </div>
    );
}
