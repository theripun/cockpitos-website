"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Server, Cloud, ArrowRight, Play, Volume2, Monitor, ExternalLink } from "lucide-react";
import Image from "next/image";
import { LiquidGlass } from "@/components/common/liquid-glass";
import { Sacramento } from "next/font/google";
import VPSStore from "./screens/vps-store";
import ConnectPC from "./screens/connect";

const sacramento = Sacramento({
    weight: "400",
    subsets: ["latin"],
});

export default function SystemSetup() {
    const [hovered, setHovered] = useState<number | null>(null);
    const [showStore, setShowStore] = useState(false);
    const [showConnect, setShowConnect] = useState(false);
    const [showIntro, setShowIntro] = useState(false); // Initially hidden, waiting for start
    const [greetingIndex, setGreetingIndex] = useState(0);
    const [audioAllowed, setAudioAllowed] = useState<boolean | null>(null); // null = checking, false = denied/needs interaction, true = playing

    // Audio ref
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    const greetings = [
        { text: "Welcome to CockpitOS", lang: "en", font: sacramento.className, isCursive: true }, // English
        { text: "コックピットOSへようこそ", lang: "ja", font: "font-sans", isCursive: false },      // Japanese
        { text: "欢迎使用 CockpitOS", lang: "zh", font: "font-sans", isCursive: false },            // Chinese (Simplified)
        { text: "ยินดีต้อนรับสู่ CockpitOS", lang: "th", font: "font-sans", isCursive: false },    // Thai
        { text: "CockpitOSக்கு வரவேற்கிறோம்", lang: "ta", font: "font-sans", isCursive: false },    // Tamil
        { text: "CockpitOS में आपका स्वागत है", lang: "hi", font: "font-sans", isCursive: false }, // Hindi
        { text: "CockpitOS에 오신 것을 환영합니다", lang: "ko", font: "font-sans", isCursive: false }, // Korean
        { text: "CockpitOS እንኳን ደህና መጡ", lang: "am", font: "font-sans", isCursive: false },     // Amharic (Ethiopia)
        { text: "Добро пожаловать в CockpitOS", lang: "ru", font: "font-sans", isCursive: false },  // Russian
    ];

    // Function to start the experience
    const startExperience = () => {
        setAudioAllowed(true);
        setShowIntro(true); // Start showing greetings
    };

    // Check autoplay on mount
    useEffect(() => {
        const audio = new Audio("/music/cockpit-into.mp3");
        audioRef.current = audio;
        audio.volume = 0.6;

        // Try to play immediately
        audio.play().then(() => {
            // Autoplay successful
            startExperience();
        }).catch(() => {
            // Autoplay blocked, show permission modal
            setAudioAllowed(false);
        });

        return () => {
            audio.pause();
            audio.currentTime = 0;
        };
    }, []);

    // Greeting cycle effect - depends on showIntro
    useEffect(() => {
        if (!showIntro) return;

        const interval = setInterval(() => {
            setGreetingIndex((prev) => {
                if (prev < greetings.length - 1) {
                    return prev + 1;
                } else {
                    clearInterval(interval);
                    setTimeout(() => setShowIntro(false), 1350); // Fade out intro
                    return prev;
                }
            });
        }, 2350);

        return () => clearInterval(interval);
    }, [showIntro]); // Only run when intro starts

    // Handle manual start
    const handleManualStart = () => {
        if (audioRef.current) {
            audioRef.current.play().then(() => {
                startExperience();
            }).catch(console.error);
        } else {
            // Fallback if ref is missing for some reason
            startExperience();
        }
    };

    const choices = [
        {
            id: 1,
            title: "Connect PC",
            subtitle: "Use your VPS via SSH",
            icon: Monitor,
        },
        {
            id: 2,
            title: "New PC",
            subtitle: "Create a VPS and set it up",
            icon: Monitor,
        },
    ];

    return (
        <div className="min-h-screen w-full flex items-center justify-center font-sans relative overflow-hidden text-white selection:bg-white/30">

            {/* Wallpaper Background */}
            <div className="absolute inset-0 pointer-events-none">
                <Image
                    src="/wallpaper/22.jpg"
                    alt="Cockpit Wallpaper"
                    fill
                    priority
                    quality={100}
                    className="object-cover scale-105"
                />
                {/* Subtle overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/10 to-black/50" />
            </div>

            {/* Audio Permission Modal */}
            <AnimatePresence>
                {audioAllowed === false && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-transparent backdrop-blur-md"
                    >
                        <div className="text-center space-y-6 max-w-sm mx-auto p-8">
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm"
                            >
                                <Volume2 className="w-8 h-8 text-black" />
                            </motion.div>

                            <div className="space-y-2">
                                <h1 className="text-2xl font-medium text-white">Enable Audio</h1>
                                <p className="text-white/60 text-sm">To provide the best immersive experience, CockpitOS requires audio playback.</p>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleManualStart}
                                className="px-8 py-3 bg-white text-black rounded-full font-medium text-sm flex items-center justify-center gap-2 mx-auto hover:bg-white/90 transition-colors"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                <span>Start Experience</span>
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {showIntro ? (
                    <motion.div
                        key="intro-container"
                        className="absolute inset-0 flex items-center justify-center z-50 bg-black/10 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, filter: "blur(10px)", scale: 1.1 }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.h1
                                key={greetings[greetingIndex].lang} // Key change triggers animation
                                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                    filter: "blur(0px)",
                                    strokeDashoffset: 0
                                }}
                                exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className={`text-5xl md:text-7xl lg:text-8xl text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] text-center px-4 ${greetings[greetingIndex].font}`}
                                style={greetings[greetingIndex].isCursive ? {
                                    strokeDasharray: 1000,
                                    strokeDashoffset: 1000, // We can animate this if we want SVGs, but for text opacity/blur is better for mixed fonts
                                } : {}}
                            >
                                {greetings[greetingIndex].text}
                            </motion.h1>
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    audioAllowed === true && (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                            className="relative z-10 flex flex-col items-center gap-12"
                        >

                            <div className="mb-[-30px]">
                                <Image
                                    src="/logo/cockpit.svg"
                                    alt="Cockpit Logo"
                                    width={90}
                                    height={90}
                                    priority
                                    className="drop-shadow-xl"
                                />
                            </div>

                            <div className="text-center space-y-2 py-4 px-12">
                                <h1 className="text-2xl font-semibold tracking-tight text-white">System Initialization</h1>
                                <p className="text-white text-[15px] font-medium">Select your preferred setup method</p>
                            </div>


                            {/* The Two Glass Tiles */}
                            <div className="flex flex-wrap justify-center gap-6 px-6 w-full max-w-3xl">
                                {choices.map((choice) => (
                                    <motion.button
                                        key={choice.id}
                                        onClick={() => {
                                            if (choice.id === 1) setShowConnect(true);
                                            if (choice.id === 2) setShowStore(true);
                                        }}
                                        onMouseEnter={() => setHovered(choice.id)}
                                        onMouseLeave={() => setHovered(null)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="group relative w-64 h-64 bg-zinc-900/5 backdrop-blur-xl rounded-[32px] outline-none text-left"
                                    >
                                        <LiquidGlass
                                            className="w-full h-full !rounded-[32px] transition-all duration-300"
                                        >
                                            <div className="w-full h-full flex flex-col items-center justify-center p-6 relative z-10">
                                                {/* Icon Container */}
                                                <div
                                                    className="w-20 h-20 rounded-full bg-white/5 group-hover:bg-white text-white group-hover:text-black flex items-center justify-center mb-6 transition-all duration-300 backdrop-blur-md shadow-inner border border-white/10"
                                                >
                                                    <choice.icon className="w-9 h-9 stroke-[1.5px]" />
                                                </div>

                                                {/* Text */}
                                                <div className="text-center space-y-1.5">
                                                    <span className="block text-lg font-medium text-white">{choice.title}</span>
                                                    <span className="block text-sm text-white/50 font-medium group-hover:text-white/70 transition-colors">{choice.subtitle}</span>
                                                </div>

                                                {/* Hover Indicator */}
                                                <div
                                                    className={`absolute bottom-0 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white transition-all duration-300 ${hovered === choice.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
                                                >
                                                    <span>Start</span>
                                                    <ArrowRight className="w-3 h-3" />
                                                </div>
                                            </div>
                                        </LiquidGlass>
                                    </motion.button>
                                ))}
                            </div>
                            <p className="inline-flex items-center gap-2 text-white text-sm font-medium mt-1 cursor-pointer hover:text-white/80 hover:scale-105 active:scale-95 transition-all duration-300">Login to existing account <ExternalLink className="w-3 h-3" /></p>


                            {/* Copyright Footer */}

                        </motion.div>
                    )
                )}
            </AnimatePresence>

            {/* Copyright Footer - conditionally rendered but outside the transformed container */}
            {!showIntro && audioAllowed === true && !showStore && !showConnect && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="fixed bottom-6 left-8 text-white/40 text-xs font-light tracking-wide z-50"
                    >
                        © {new Date().getFullYear()} Reglook, Intellaris Private Limited. All rights reserved.
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="fixed bottom-6 right-8 z-50 p-2 bg-white/[0.05] hover:scale-105 transition-all duration-300 backdrop-blur-md rounded-none border border-white/0 shadow-2xl flex flex-col items-center gap-2"
                    >
                        <Image
                            src="/help/qr-code.png"
                            alt="Scan for Help"
                            width={80}
                            height={80}
                            className="rounded-none opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
                        />
                        <span className="text-[10px] text-white/50 font-medium">Cockpit Support</span>
                    </motion.div>
                </>
            )}

            {/* VPS Store Popup */}
            <AnimatePresence>
                {showStore && <VPSStore onClose={() => setShowStore(false)} />}
            </AnimatePresence>

            {/* Connect PC Popup */}
            <AnimatePresence>
                {showConnect && <ConnectPC onClose={() => setShowConnect(false)} />}
            </AnimatePresence>
        </div>
    );
}
