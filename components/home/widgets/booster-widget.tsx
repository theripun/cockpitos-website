"use client";

import React, { useState } from "react";
import { GlassInterface } from "@/components/common/glass-interface";
import { getCsrfToken } from "@/lib/utils";
import { BellRing, BrushCleaning, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BASE_URL } from "@/lib/baseURL";

export interface BoosterWidgetProps {
    onClick?: () => void;
}

export function BoosterWidget({ onClick }: BoosterWidgetProps) {
    const [isCleaning, setIsCleaning] = useState(false);
    const [cleanedMB, setCleanedMB] = useState(0);
    const [progress, setProgress] = useState(0);
    const [lastCleaned, setLastCleaned] = useState<number | null>(null);



    const startCleaning = async () => {
        if (isCleaning) return;
        setIsCleaning(true);
        setProgress(0);
        setCleanedMB(0);

        // Start real cleanup in background
        const cleanupPromise = fetch(`${BASE_URL}/cockpit/system/boost`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'x-csrf-token': getCsrfToken()
            },
            credentials: 'include',
            // Usually 'include', but here we rely on potential cookie or none locally
        }).then(res => res.json()).catch(() => ({ freedMB: 0 }));

        let currentProgress = 0;
        let isFetchComplete = false;
        let realFreedMB = 0;

        cleanupPromise.then(data => {
            isFetchComplete = true;
            realFreedMB = data.freedMB || 0;
            // Force jump if animation was slow? No, let it finish naturally or speed up?
        });

        const interval = setInterval(() => {
            // Speed up if fetch is done
            const increment = isFetchComplete ? 5 : Math.random() * 2;
            currentProgress += increment;

            // Wait for fetch at 85%
            if (currentProgress >= 85 && !isFetchComplete) {
                currentProgress = 85;
            }

            if (currentProgress >= 100) {
                currentProgress = 100;
                clearInterval(interval);

                // Use real data
                setCleanedMB(realFreedMB);
                setLastCleaned(realFreedMB);

                setTimeout(() => {
                    setIsCleaning(false);
                }, 1500);
            }
            setProgress(currentProgress);
        }, 50); // Faster tick for smoother accel
    };

    return (
        <GlassInterface
            className="!w-[210px] !h-[210px] !rounded-[2.5rem] !p-5 relative group cursor-pointer overflow-hidden active:scale-95 transition-transform"
            onClick={startCleaning}
        >
            {/* Icon */}
            <div className="absolute top-5 right-5 text-white">
                <BrushCleaning className="w-5 h-5" />
            </div>

            {/* Cleaning Animation Overlay */}
            <AnimatePresence>
                {isCleaning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 backdrop-blur-sm rounded-[2.5rem]"
                    >
                        <div className="flex flex-col items-center gap-4">
                            {/* Animated Broom */}
                            <motion.div
                                animate={{
                                    rotate: [0, -15, 15, -15, 15, 0],
                                    x: [0, -8, 8, -8, 8, 0],
                                }}
                                transition={{
                                    duration: 0.4,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="text-5xl"
                            >
                                <BrushCleaning className="w-5 h-5" />
                            </motion.div>

                            {/* Progress */}
                            <div className="w-28 h-1 bg-white/20 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-white"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ ease: "linear" }}
                                />
                            </div>

                            <span className="text-[12px] font-bold text-white">
                                {/* {progress < 100 ? "Cleaning..." : `Freed ${cleanedMB} MB`} */}
                                {progress < 100 ? "Cleaning..." : `Cleaned`}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col h-full justify-between relative z-10">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">Booster</span>
                    <h3 className="text-xl font-extrabold text-white leading-tight tracking-tight mt-1 group-hover:text-white transition-colors">
                        System Clean
                    </h3>
                </div>

                <div className="space-y-4">
                    {/* Status */}
                    <div className="space-y-2">
                        <div className="text-[11px] text-white/50 leading-relaxed">
                            {lastCleaned
                                ? `Last cleaned: ${lastCleaned} MB freed`
                                : "Tap to optimize your system"
                            }
                        </div>
                    </div>

                    {/* Action */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Tap to Clean</span>
                        </div>

                    </div>
                </div>
            </div>
        </GlassInterface>
    );
}
