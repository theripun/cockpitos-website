"use client";

import React, { useCallback } from "react";
import Image from "next/image";
import { Greetings } from "@/components/setup/greetings";
import { Menubar } from "@/components/home/menubar";
import { GlassInterface } from "@/components/common/glass-interface";
import { SetupForm } from "@/components/setup/setup-form";
import { LoginForm } from "@/components/setup/login-form";
import { DeviceSelectionModal } from "@/components/setup/device-selection-modal";
import { PostAuthPricing } from "@/components/setup/post-auth-pricing";
import { AnimatePresence, motion } from "framer-motion";
import { BASE_URL } from "@/lib/baseURL";
import {
    detectCheckoutRegionSlug,
    readStoredCheckoutRegionSlug,
    storeCheckoutRegionSlug,
} from "@/lib/checkout-region";

type SetupDevice = {
    id: string;
    name: string;
    host: string;
    username: string;
    status?: string;
};

export default function SetupPage() {
    const [stage, setStage] = React.useState<'greetings' | 'login' | 'pricing' | 'setup' | 'device-selection'>('greetings');
    const [hasSession, setHasSession] = React.useState(false);
    const [devices, setDevices] = React.useState<SetupDevice[]>([]);

    React.useEffect(() => {
        const checkSession = async () => {
            try {
                // Check if reload happened
                const entries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
                if (entries.length > 0 && entries[0].type === "reload") {
                    await fetch(`${BASE_URL}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => { });
                    return;
                }

                const res = await fetch(`${BASE_URL}/cockpit/vps`, { credentials: "include" });
                if (res.ok) {
                    setHasSession(true);
                    const data = await res.json();
                    setDevices(Array.isArray(data) ? data as SetupDevice[] : []);
                }
            } catch (err) {
                console.error("Session check failed:", err);
            }
        };

        checkSession();
    }, []);

    const handleGreetingComplete = () => {
        if (hasSession) {
            // Check for devices if session exists
            if (devices.length > 0) {
                setStage('device-selection');
            } else {
                setStage('setup');
            }
        } else {
            setStage('login');
        }
    };

    const proceedAfterPricing = useCallback(() => {
        if (devices.length > 0) {
            setStage("device-selection");
        } else {
            setStage("setup");
        }
    }, [devices.length]);

    const goToCheckout = useCallback(async () => {
        let slug = readStoredCheckoutRegionSlug();
        if (!slug) {
            slug = await detectCheckoutRegionSlug();
            storeCheckoutRegionSlug(slug);
        }
        // Use a hard navigation so middleware rewrites always apply (avoids client router hanging on non-existent region routes).
        window.location.assign(`/${slug}/checkout`);
    }, []);

    const handleLoginSuccess = async () => {
        try {
            // Re-fetch devices after login
            const res = await fetch(`${BASE_URL}/cockpit/vps`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                const devicesList = Array.isArray(data) ? data as SetupDevice[] : [];
                setDevices(devicesList);
                setStage("pricing");
            } else {
                // Fallback if fetch fails but login succeeded (shouldn't happen often)
                setStage('setup');
            }
        } catch (error) {
            console.error("Failed to fetch devices:", error);
            setStage('setup');
        }
    };

    const handleDeviceSelect = () => {
        // Here we could store the selected device ID in local storage or context if needed
        // For now, assume /home handles default or stored state
        window.location.href = '/home';
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-black font-sans selection:bg-white/20">
            {/* Hidden glass interface just to include the SVG filter once for the whole page */}
            <div className="hidden">
                <GlassInterface includeSvgFilter={true}>
                    <div />
                </GlassInterface>
            </div>

            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/wallpaper/17.jpg"
                    alt="Setup Background"
                    fill
                    priority
                    quality={100}
                    className="object-cover"
                />
                {/* Subtle overlay with blur */}
                <div className={`absolute inset-0 bg-black/20 transition-all duration-1000 ${stage !== 'greetings' ? "backdrop-blur-xl" : "backdrop-blur-md"}`} />
            </div>

            {/* Background Animation */}
            <AnimatePresence>
                {stage === 'greetings' && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                        className="absolute inset-0 z-10"
                    >
                        <Greetings onComplete={handleGreetingComplete} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Menubar */}
            <Menubar
                showFullMenus={false}
                showSystemMonitor={false}
                showSearch={false}
                transparent={true}
            />

            {/* Main Content Area */}
            <main className="relative z-20 min-h-screen flex items-center justify-center p-6">
                <AnimatePresence mode="wait">
                    {stage === 'login' && (
                        <LoginForm key="login" onSuccess={handleLoginSuccess} />
                    )}
                    {stage === "pricing" && (
                        <div key="pricing" className="pointer-events-auto flex w-full max-w-[1180px] items-center justify-center">
                            <PostAuthPricing
                                onContinueFree={proceedAfterPricing}
                                onContinuePro={goToCheckout}
                            />
                        </div>
                    )}
                    {stage === 'device-selection' && (
                        <DeviceSelectionModal
                            key="device-selection"
                            devices={devices}
                            onSelect={handleDeviceSelect}
                            onConfigureNew={() => setStage('setup')}
                        />
                    )}
                    {stage === 'setup' && (
                        <SetupForm key="setup" />
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
