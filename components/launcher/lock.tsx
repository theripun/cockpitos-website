"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { Lock, Fingerprint, ChevronUp, Delete, ScanFace } from "lucide-react";
import { GlassInterface } from "../common/glass-interface";

interface LockScreenProps {
    onUnlock: () => void;
    onPinVisibleChange?: (visible: boolean) => void;
}

export function LockScreen({ onUnlock, onPinVisibleChange }: LockScreenProps) {
    const [isRevealed, setIsRevealed] = useState(false);
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);
    const [activeKey, setActiveKey] = useState<string | null>(null);
    const [isUnlocking, setIsUnlocking] = useState(false);

    const dragControls = useAnimation();
    const pinPadControls = useAnimation();
    const lockScreenControls = useAnimation();

    const y = useMotionValue(0);

    // Transform drag distance to blur and darkness with clamping for smoothness
    // We cap the blur at 30px to match the Apple style and avoid distortion overflows
    const blurAmount = useTransform(y, [0, -250], [0, 30], { clamp: true });
    const overlayDarkness = useTransform(y, [0, -250], [0, 0.25], { clamp: true });

    const handleDragEnd = (_: any, info: any) => {
        if (info.offset.y < -150) {
            revealPinPad();
        } else {
            dragControls.start({ y: 0 });
        }
    };

    const revealPinPad = () => {
        setIsRevealed(true);
        onPinVisibleChange?.(true);
        // Animate out the swipe layer
        dragControls.start({ y: -1000, opacity: 0 });
    };

    const handleNumberClick = useCallback((num: string) => {
        if (pin.length < 6) {
            setError(false);
            setPin(prev => {
                const newPin = prev + num;
                if (newPin.length === 6) {
                    if (newPin === "123456") {
                        handleCorrectPin();
                    } else {
                        handleWrongPin();
                    }
                }
                return newPin;
            });
        }
    }, [pin]);

    const handleCorrectPin = async () => {
        setIsUnlocking(true);

        // macOS-style zoom out animation - ultra fast
        await lockScreenControls.start({
            scale: 1.5,
            opacity: 0,
            transition: {
                duration: 0.15,
                ease: "easeOut"
            }
        });

        // Call onUnlock after animation completes
        onUnlock();
    };

    const handleWrongPin = async () => {
        setError(true);
        await pinPadControls.start({
            x: [-10, 10, -10, 10, 0],
            transition: { duration: 0.4 }
        });
        setPin("");
        setError(false);
    };

    const handleBackspace = useCallback(() => {
        setPin(prev => prev.slice(0, -1));
        setError(false);
    }, []);

    // Physical Keyboard Support
    useEffect(() => {
        if (!isRevealed) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key >= "0" && e.key <= "9") {
                handleNumberClick(e.key);
                setActiveKey(e.key);
                setTimeout(() => setActiveKey(null), 150);
            } else if (e.key === "Backspace") {
                handleBackspace();
                setActiveKey("backspace");
                setTimeout(() => setActiveKey(null), 150);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isRevealed, handleNumberClick, handleBackspace]);

    // Trackpad / Scroll Support
    useEffect(() => {
        if (isRevealed) return;

        let snapTimeout: NodeJS.Timeout;

        const handleWheel = (e: WheelEvent) => {
            // Clear existing snap timeout
            if (snapTimeout) clearTimeout(snapTimeout);

            // Only respond to vertical scrolling
            if (Math.abs(e.deltaY) < 1) return;

            const currentY = y.get();
            // Map scroll to Y movement (up is negative)
            const newY = Math.min(0, currentY - (e.deltaY * 0.5)); // 0.5 sensitivity for smoother feel
            y.set(newY);

            // If we've scrolled enough, reveal the PIN pad
            if (newY < -150) {
                revealPinPad();
                return;
            }

            // Snap back if the user stops scrolling for 100ms
            snapTimeout = setTimeout(() => {
                const finalY = y.get();
                if (finalY < 0 && finalY > -150) {
                    dragControls.start({ y: 0 });
                    // Also smoothly reset the motion value y
                    const springBack = () => {
                        const val = y.get();
                        if (val < -0.5) {
                            y.set(val * 0.85); // Smooth decay
                            requestAnimationFrame(springBack);
                        } else {
                            y.set(0);
                        }
                    };
                    requestAnimationFrame(springBack);
                }
            }, 150);
        };

        window.addEventListener("wheel", handleWheel, { passive: true });
        return () => {
            window.removeEventListener("wheel", handleWheel);
            if (snapTimeout) clearTimeout(snapTimeout);
        };
    }, [isRevealed, y, dragControls]);

    return (
        <motion.div
            className="fixed inset-0 z-[999] overflow-hidden flex items-center justify-center pointer-events-auto"
            animate={lockScreenControls}
            initial={{ scale: 1, opacity: 1 }}
        >
            {/* 1. Global Interaction Shield - Prevents clicking any background content */}
            <div className="absolute inset-0 pointer-events-auto bg-transparent" />

            {/* 2. Dynamic Background Overlay - No tint/blur, parent handles main background */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                    y // Keep tracking y for any internal needs, but remove styles as per req
                }}
            />

            {/* 2. Swipe Layer - Apple/iOS Style Entry */}
            {!isRevealed && (
                <motion.div
                    drag="y"
                    dragConstraints={{ top: -1000, bottom: 0 }}
                    dragElastic={0.05}
                    onDragEnd={handleDragEnd}
                    animate={dragControls}
                    style={{ y }}
                    className="absolute inset-0 flex flex-col items-center justify-end pb-12 cursor-grab active:cursor-grabbing z-20"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{
                            opacity: 1,
                            y: [0, -8, 0],
                        }}
                        transition={{
                            opacity: { duration: 1 },
                            y: {
                                repeat: Infinity,
                                duration: 2,
                                ease: "easeInOut"
                            }
                        }}
                        className="flex flex-col items-center gap-6"
                    >
                        {/* Subtle Home Bar */}
                        <motion.div
                            animate={{
                                scaleX: [1, 1.05, 1],
                                opacity: [0.6, 1, 0.6]
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 2,
                                ease: "easeInOut"
                            }}
                            className="w-36 h-1 bg-white rounded-full backdrop-blur-sm shadow-sm border border-white/25"
                        />

                        <div className="flex flex-col items-center">
                            <span className="text-[13px] font-semibold tracking-[0.05em] text-white font-[family-name:var(--font-outfit)]">
                                Swipe up to unlock
                            </span>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* 3. PIN Dialog */}
            {isRevealed && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative z-30 w-full max-w-[420px] px-6 flex justify-center"
                >
                    <motion.div animate={pinPadControls} className="w-full flex justify-center">
                        <GlassInterface rounded size="large" includeSvgFilter className="w-full flex justify-center">
                            <div className="flex flex-col items-center w-full py-10 px-8 font-[family-name:var(--font-outfit)]">

                                <div className="flex flex-col items-center text-center gap-4 mb-10">
                                    <div className="w-20 h-20 bg-white/5 rounded-full p-1 border border-white/20 shadow-xl flex items-center justify-center overflow-hidden">
                                        <div className="w-full h-full rounded-full bg-gradient-to-br from-white/20 to-transparent flex items-center justify-center">
                                            <ScanFace className={`w-8 h-8 ${error ? 'text-red-400' : 'text-white'}`} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-2xl font-semibold tracking-tight text-white/90">System User</h2>
                                        <p className="text-white/40 text-[12px] font-medium tracking-wide uppercase">
                                            Enter your PIN
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-6 mb-12">
                                    {[...Array(6)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${i < pin.length
                                                ? (error ? "bg-red-500 border-red-500 scale-125 shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "bg-white border-white scale-125 shadow-[0_0_15px_rgba(255,255,255,0.4)]")
                                                : "bg-transparent border-white/20"
                                                }`}
                                        />
                                    ))}
                                </div>

                                <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                        <button
                                            key={num}
                                            onClick={() => handleNumberClick(num.toString())}
                                            className={`aspect-square rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl font-bold text-white hover:bg-white/10 active:bg-white/20 active:scale-90 shadow-sm transition-all ${activeKey === num.toString() ? "bg-white/20 border-white/40 scale-90 ring-2 ring-white/20" : ""
                                                }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                    <button className="flex items-center justify-center text-white/30 hover:text-white/60">
                                        <Fingerprint className="w-7 h-7 text-white" />
                                    </button>
                                    <button
                                        onClick={() => handleNumberClick("0")}
                                        className={`aspect-square rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl font-bold text-white hover:bg-white/10 active:bg-white/20 active:scale-90 shadow-sm transition-all ${activeKey === "0" ? "bg-white/20 border-white/40 scale-90 ring-2 ring-white/20" : ""
                                            }`}
                                    >
                                        0
                                    </button>
                                    <button
                                        onClick={handleBackspace}
                                        className={`aspect-square flex items-center justify-center text-white/30 hover:text-white/80 transition-all ${activeKey === "backspace" ? "scale-75 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]" : ""
                                            }`}
                                    >
                                        <Delete className="w-6 h-6 text-white" />
                                    </button>
                                </div>

                                <button
                                    onClick={() => {
                                        setIsRevealed(false);
                                        onPinVisibleChange?.(false);
                                        // Animate back to original state
                                        dragControls.start({
                                            y: 0,
                                            opacity: 1,
                                            transition: { type: "spring", damping: 25, stiffness: 120 }
                                        });
                                        y.set(0);
                                        setPin("");
                                    }}
                                    className="mt-10 text-[11px] font-bold tracking-[0.2em] uppercase text-white/30 hover:text-white/60 transition-colors"
                                >
                                    Go Back
                                </button>
                            </div>
                        </GlassInterface>
                    </motion.div>
                </motion.div>
            )}
        </motion.div>
    );
}
