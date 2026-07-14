'use client';

import React, { useEffect, useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';

export function DesktopGuard({ children }: { children: React.ReactNode }) {
    const [isMobileDevice, setIsMobileDevice] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkDevice = () => {
            const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

            // Strict mobile detection
            const isMobileUA = /android|avantgo|blackberry|bada\/|bb10|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od|ad)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(userAgent);

            // Check for "Desktop Mode" on mobile which often masks UA but has touch points and specific screen props
            // Most desktops don't have orientation.
            const hasOrientation = typeof window.orientation !== 'undefined';

            // Touch points check: Tablets/Phones have touch points.
            // But some laptops do too. We need to be careful.
            // Usually mobile devices in desktop mode still have maxTouchPoints > 0.
            // If it has touch points AND screen width is "suspiciously mobile-like" (e.g. high density but effectively small)

            // However, the user said "only desktop devices".
            // Let's rely on UA and screen width > 1024 as the primary factor, 
            // but explicitly block known mobile UAs even if they fake the resolution.

            if (isMobileUA) {
                setIsMobileDevice(true);
            }
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    // CSS handles the width check (< 1024px) naturally with `lg:hidden`.
    // This blocked state is for "Mobile pretending to be Desktop" (UA valid but actually mobile) 
    // OR just enforcing the JS check result.
    // Actually, we can just overlay if EITHER CSS matches OR JS matches.

    return (
        <>
            <div className={`fixed inset-0 z-[9999] bg-background text-foreground flex flex-col items-center justify-center p-8 text-center transition-opacity duration-300 ${isMobileDevice ? 'flex' : 'lg:hidden flex'}`}>
                <div className="max-w-md space-y-6">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse" />
                        <Monitor className="w-24 h-24 text-red-500 relative z-10" />
                        <Smartphone className="w-12 h-12 text-foreground absolute -bottom-2 -right-2 bg-background rounded-full p-2 border-2 border-background" />
                    </div>

                    <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl text-red-500">
                        Desktop Access Only
                    </h1>

                    <p className="text-muted-foreground text-lg leading-relaxed">
                        This secure environment is effectively optimized for desktop-sized displays.
                    </p>

                    <div className="p-4 rounded-lg bg-secondary/50 border border-border backdrop-blur-sm">
                        <p className="text-sm font-medium text-foreground">
                            Please open Cockpit OS on a desktop or laptop computer to continue.
                        </p>
                    </div>
                </div>
            </div>

            {/* 
          We wrap children in a div that is hidden when blocked? 
          No, we just let the fixed overlay cover it.
          However, to prevent interaction with underlying elements (keyboard nav etc),
          we could conditionally hide children.
          But for SEO and initial load, usually better to render.
          The block overlay has z-[9999] and bg-background, so it covers everything.
      */}
            <div className={`${isMobileDevice ? 'hidden' : 'lg:block hidden'} w-full h-full`}>
                {children}
            </div>
        </>
    );
}
