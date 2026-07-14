"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Terminal, ArrowRight, Server, Shield, Key, Cpu, Activity, Globe, Eye, EyeOff, CheckCircle, Loader2 } from "lucide-react";
import Image from "next/image";

interface ConnectPCProps {
    onClose: () => void;
}

export default function ConnectPC({ onClose }: ConnectPCProps) {
    const [formData, setFormData] = useState({
        host: "",
        username: "root",
        password: "",
        port: "22",
        name: ""
    });
    const [status, setStatus] = useState<'idle' | 'working' | 'verifying' | 'success'>('idle');
    const [terminalLines, setTerminalLines] = useState<string[]>([
        "> Ready to connect.",
    ]);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }, [terminalLines]);

    const addLog = (line: string) => {
        setTerminalLines(prev => [...prev, `> ${line}`]);
    };

    const handleConnect = async () => {
        if (status !== 'idle') return;
        setStatus('working');
        setTerminalLines(["> Initializing handshake..."]);

        // Simulation Sequence
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

        await delay(800);
        addLog(`Connecting to ${formData.username}@${formData.host || '192.168.1.1'}...`);

        await delay(1200);
        addLog("Connection established (Latency: 24ms).");
        addLog("Verifying host integrity...");

        await delay(1000);
        addLog("Environment check passed.");
        addLog("Initiating Cockpit Agent installation...");

        await delay(1500);
        addLog("Downloading binaries [====================] 100%");

        await delay(800);
        addLog("Installing dependencies...");

        await delay(1000);
        addLog("Starting Cockpit Daemon (cockpitd)...");
        addLog("Service active.");

        await delay(800);
        addLog("Generating secure pairing token...");

        await delay(1000);
        setStatus('verifying');
        addLog("Additional verification required.");
        addLog("Please scan the QR code to confirm device identity.");

        // Wait for "scan"
        await delay(4000);
        setStatus('success');
        addLog("Identity confirmed.");
        addLog("Setup complete. Redirecting...");

        await delay(2000);
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-8 right-8 z-50 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="w-full max-w-5xl h-[600px] bg-[#09090b] border border-white/5 rounded-2xl overflow-hidden flex shadow-2xl relative">

                {/* Left Section: Form */}
                <div className="w-[45%] p-10 flex flex-col relative z-10 bg-black">
                    <div className="mb-8">
                        <motion.h2
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-2xl font-semibold text-white mb-2 tracking-tight"
                        >
                            Connect VPS
                        </motion.h2>
                        <motion.p
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-sm text-white/40 font-medium"
                        >
                            Enter SSH credentials to access your server.
                        </motion.p>
                    </div>

                    <form className="space-y-4 flex-1">
                        <InputGroup label="Name" placeholder="My PC" delay={0.4}
                            value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} icon={Server}
                        />

                        <InputGroup label="Host / IP" placeholder="192.168.1.1" delay={0.5}
                            value={formData.host} onChange={(e: any) => setFormData({ ...formData, host: e.target.value })} icon={Globe}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="User" placeholder="root" delay={0.55}
                                value={formData.username} onChange={(e: any) => setFormData({ ...formData, username: e.target.value })} icon={Cpu}
                            />
                            <InputGroup label="Password" placeholder="••••••••" type="password" delay={0.6}
                                value={formData.password} onChange={(e: any) => setFormData({ ...formData, password: e.target.value })} icon={Key}
                            />
                        </div>
                    </form>

                    <motion.button
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        onClick={handleConnect}
                        disabled={status !== 'idle'}
                        className={`mt-6 w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all
                            ${status === 'idle'
                                ? 'bg-white text-black hover:bg-gray-200'
                                : 'bg-white/10 text-white/50 cursor-not-allowed'}`}
                    >
                        {status === 'idle' ? (
                            <>
                                <span>Connect</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        ) : (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Processing...</span>
                            </>
                        )}
                    </motion.button>
                </div>

                {/* Right Section: Terminal Visual */}
                <div className="flex-1 bg-black relative flex flex-col p-10 overflow-hidden border-l border-white/5">

                    {/* The 4 Corner Squares */}
                    <div className="absolute top-8 left-8 w-2 h-2 border-t border-l border-white/20" />
                    <div className="absolute top-8 right-8 w-2 h-2 border-t border-r border-white/20" />
                    <div className="absolute bottom-8 left-8 w-2 h-2 border-b border-l border-white/20" />
                    <div className="absolute bottom-8 right-8 w-2 h-2 border-b border-r border-white/20" />

                    {/* Terminal Content */}
                    <div className="flex-1 font-mono text-xs text-white space-y-2 relative z-10 mt-4 leading-relaxed overflow-y-auto custom-scrollbar">
                        <AnimatePresence>
                            {status === 'verifying' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 backdrop-blur-sm"
                                >
                                    <div className="bg-white p-4 rounded-xl flex flex-col items-center gap-3 shadow-2xl">
                                        <div className="relative w-32 h-32">
                                            <Image
                                                src="/help/qr-code.png"
                                                alt="Verification QR"
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                        <p className="text-black text-[10px] font-medium uppercase tracking-wider">Scan to Verify</p>
                                    </div>
                                </motion.div>
                            )}
                            {status === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                                >
                                    <div className="flex flex-col items-center gap-4 text-white">
                                        <CheckCircle className="w-12 h-12" />
                                        <span className="text-lg font-semibold text-white">Connected</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {terminalLines.map((line, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 5 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="break-all"
                            >
                                {line}
                            </motion.div>
                        ))}
                        <div ref={bottomRef} />
                        {status === 'working' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ repeat: Infinity, duration: 0.8 }}
                                className="w-1.5 h-4 bg-white/50 inline-block align-middle ml-1"
                            />
                        )}
                    </div>

                    {/* Decorative Footer */}
                    <div className="mt-auto flex justify-between items-center pt-8 opacity-40">
                        <div className="text-[10px] font-mono text-white/50">SSH-2.0-OpenSSH_8.9</div>
                        <div className="flex gap-2">
                            <div className="w-1 h-1 rounded-full bg-white/50" />
                            <div className="w-1 h-1 rounded-full bg-white/20" />
                            <div className="w-1 h-1 rounded-full bg-white/20" />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function InputGroup({ label, placeholder, type = "text", delay, value, onChange, icon: Icon }: any) {
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";

    return (
        <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay, duration: 0.5 }}
            className="space-y-1.5"
        >
            <label className="text-xs font-medium text-white/50 ml-1">{label}</label>
            <div className={`relative group transition-all duration-300 ${focused ? 'scale-[1.01]' : ''}`}>
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Icon className={`w-4 h-4 transition-colors duration-300 ${focused ? 'text-white' : 'text-white/30'}`} />
                </div>
                <input
                    type={isPassword ? (showPassword ? "text" : "password") : type}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={placeholder}
                    className="w-full bg-white/5 border border-white/5 rounded-none px-4 py-3 pl-10 pr-10 text-sm text-white focus:outline-none focus:bg-white/5 focus:border-white/5 transition-all placeholder:text-white/20"
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-white/50 hover:text-white transition-colors"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4 text-white" /> : <Eye className="w-4 h-4 text-white" />}
                    </button>
                )}
            </div>
        </motion.div>
    );
}
