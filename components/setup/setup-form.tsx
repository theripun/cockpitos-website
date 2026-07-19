"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Monitor, User, Lock, Globe, ArrowRight, ChevronRight, CheckCircle2, Eye, EyeOff, Loader2, AlertCircle, PartyPopperIcon, Hash, PlayCircle, HelpCircle, HelpCircleIcon, Wrench, Copy, Check, Cloud, KeyRound, Server, ShieldCheck, ExternalLink } from "lucide-react";
import { FaAws } from "react-icons/fa";
import { BASE_URL } from "@/lib/baseURL";
import { normalizeAgentInstallCommand } from "@/lib/install-command";
import { motion, AnimatePresence } from "framer-motion";
import "@xterm/xterm/css/xterm.css";

const SETUP_TOUR_SEEN_KEY = "cockpit.setupTourSeen";
const AWS_EC2_CONSOLE_URL = "https://console.aws.amazon.com/ec2/";

function FieldHelp({ text, align = "center" }: { text: string; align?: "left" | "center" | "right" }) {
    const positionClass = align === "right"
        ? "right-0"
        : align === "left"
            ? "left-0"
            : "left-1/2 -translate-x-1/2";
    const arrowClass = align === "right"
        ? "right-4"
        : align === "left"
            ? "left-4"
            : "left-1/2 -translate-x-1/2";

    return (
        <div className="group/tooltip relative">
            <HelpCircle className="h-3.5 w-3.5 cursor-help text-white/40 transition-colors hover:text-white/80" />
            <div className={`absolute ${positionClass} bottom-full mb-2 w-56 rounded-lg border border-white/10 bg-black/90 p-2.5 text-center text-[11px] leading-4 text-white opacity-0 shadow-xl backdrop-blur-md transition-opacity pointer-events-none group-hover/tooltip:opacity-100`}>
                {text}
                <div className={`absolute ${arrowClass} top-full h-0 w-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-black/90`} />
            </div>
        </div>
    );
}

export function SetupForm() {
    const [mode, setMode] = useState<'new' | 'existing'>('new');
    const [connectionType, setConnectionType] = useState<'direct' | 'cloud'>('direct');
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'verifying' | 'enrolling' | 'installing' | 'success' | 'error'>('idle');
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [failStage, setFailStage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [logs, setLogs] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        pcName: "",
        host: "",
        port: 22,
        user: "root",
        password: "",
        deviceId: ""
    });
    const [cloudData, setCloudData] = useState({
        provider: "aws-ec2",
        deviceName: "",
        host: "",
        port: 22,
        username: "ubuntu",
        region: "us-east-1",
        privateKey: "",
        passphrase: "",
    });
    const [suggestedPorts, setSuggestedPorts] = useState<number[]>([]);

    // Tutorial State
    const [tutorialState, setTutorialState] = useState<'idle' | 'prompt' | 'active'>('idle');

    // Repair Modal
    const [showRepairModal, setShowRepairModal] = useState(false);
    const [copiedBlock, setCopiedBlock] = useState<string | null>(null);

    const copyBlock = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedBlock(id);
        setTimeout(() => setCopiedBlock(null), 2000);
    };
    const [tourStep, setTourStep] = useState(0);

    const tourSteps = [
        { key: 'pcName', title: 'Device Name', text: "Give your VPS a friendly name to identify it easily." },
        { key: 'host', title: 'Public IP', text: "Enter the Public IP address of your VPS provided by your host." },
        { key: 'port', title: 'SSH Port', text: "Default is 22. Maintain it unless you've configured a custom port." },
        { key: 'user', title: 'Username', text: "Usually 'root' for fresh VPS installations." },
        { key: 'password', title: 'Password', text: "The root password for your VPS." },
    ];

    // Real Terminal Refs for background pipe
    const termRef = useRef<any>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Ensure configure query param is always set when this form is displayed
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            if (url.searchParams.get('configure') !== 'true') {
                window.history.replaceState(null, '', '/?configure=true');
            }
        }
    }, []);

    // Auto-scroll logic
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (['connecting', 'verifying', 'enrolling', 'installing'].includes(status)) {
            interval = setInterval(() => {
                setElapsedSeconds(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [status]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (termRef.current) termRef.current.dispose();
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    const markSetupTourSeen = () => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(SETUP_TOUR_SEEN_KEY, 'true');
        }
    };

    // Trigger Tutorial Prompt
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (window.localStorage.getItem(SETUP_TOUR_SEEN_KEY) === 'true') return;

        if (mode === 'new' && connectionType === 'direct' && status === 'idle') {
            const timer = setTimeout(() => {
                markSetupTourSeen();
                setTutorialState('prompt');
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [mode, connectionType, status]);

    const startTour = () => {
        markSetupTourSeen();
        setTutorialState('active');
        setTourStep(0);
    };

    const skipTour = () => {
        markSetupTourSeen();
        setTutorialState('idle');
    };

    const nextStep = () => {
        if (tourStep < tourSteps.length - 1) {
            setTourStep(prev => prev + 1);
        } else {
            markSetupTourSeen();
            setTutorialState('idle');
        }
    };

    const isStepActive = (key: string) => tutorialState === 'active' && tourSteps[tourStep].key === key;

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, msg]);
    };

    const initTerminalPipe = async (vpsId: string, installCommand: string) => {
        try {
            const { Terminal } = await import("@xterm/xterm");
            // We use a virtual terminal to capture real output without the xterm UI
            const term = new Terminal();
            termRef.current = term;

            const res = await fetch(`${BASE_URL}/cockpit/vps/${vpsId}/terminal/sessions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

            if (!res.ok) throw new Error("Terminal session failed");
            const { sessionId } = await res.json();

            const wsUrl = BASE_URL.replace(/^http/, "ws");
            const ws = new WebSocket(`${wsUrl}/cockpit/terminal/ws?id=${sessionId}`);
            wsRef.current = ws;

            let shellReady = false;

            ws.onopen = () => {
                ws.send(JSON.stringify({ type: "init", cols: 120, rows: 40 }));

                // Send a Ctrl+C to wake up/clear the prompt
                setTimeout(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: "input", data: "\x03" }));
                    }
                }, 1000);
            };

            ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);

                if (msg.type === "error") {
                    setFailStage('installing');
                    const errorMsg = msg.message || "Unknown error";
                    setErrorMessage(errorMsg);
                    addLog(`✖ Error: ${errorMsg}`);
                    setStatus('error');
                    return;
                }

                if (msg.type === "output") {
                    // Robust regex to strip ANSI escapes, including window titles and paste mode
                    const cleanData = msg.data.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]|(?:\x1B\]0;.*?\x07)/g, '');

                    const lines = cleanData.split(/\r?\n/);
                    lines.forEach((line: string) => {
                        const trimmed = line.trim();
                        // Only log lines that have content and aren't just redundant prompts
                        if (trimmed.length > 0 && !trimmed.match(/^\[\?2004[hl]$/)) {
                            // Check if this looks like a prompt and we haven't sent the command yet
                            // Improved detection: Matches standard prompts (#, $, %, >) and common patterns like user@host:path
                            // relax checking to include common root/user patterns even if suffix is weird
                            const isPrompt =
                                trimmed.endsWith("#") ||
                                trimmed.endsWith("$") ||
                                trimmed.endsWith("%") ||
                                trimmed.endsWith(">") ||
                                trimmed.includes(":~") ||
                                trimmed.includes("@") ||
                                trimmed.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+/); // user@host match

                            if (!shellReady && isPrompt) {
                                shellReady = true; // Set immediately (sync) to block other detectors
                                setTimeout(() => {
                                    addLog("✓ Shell prompt detected, sending installation command...");
                                    ws.send(JSON.stringify({ type: "input", data: installCommand + "\n" }));
                                }, 1200); // slightly longer delay to let the shell fully settle
                            }

                            // Success Detection: Watch for success message or prompt return after start
                            if (shellReady && (
                                trimmed.includes("Cocktail Agent installed and started!") ||
                                (trimmed.includes("Active: active (running)") && trimmed.includes("cocktail.service")) ||
                                (trimmed.includes("E: Unable to locate package neofetch") && logs.some(l => l.includes("installed and started")))
                            )) {
                                setTimeout(() => setStatus('success'), 2000);
                            }

                            // Trigger on "Last login" (standard Linux login message) - robust fallback
                            if (!shellReady && trimmed.startsWith("Last login:")) {
                                shellReady = true; // Set immediately (sync) to block other detectors
                                setTimeout(() => {
                                    addLog("✓ Shell ready (detected login), starting installation...");
                                    ws.send(JSON.stringify({ type: "input", data: installCommand + "\n" }));
                                }, 2000); // wait 2s to let the Kali MOTD finish printing before sending
                            }

                            addLog(trimmed);
                        }
                    });
                }
                if (msg.type === "exit") {
                    setStatus('success');
                }
            };

            // Fallback: If no prompt detected within 15 seconds, send command anyway
            // increased from 5s to 15s to account for slow DNS/SSH logins
            setTimeout(() => {
                if (!shellReady && ws.readyState === WebSocket.OPEN) {
                    addLog("⚠ Shell prompt detection timed out, forcing command execution...");
                    shellReady = true;
                    // Try sending with \n instead of \r
                    ws.send(JSON.stringify({ type: "input", data: installCommand + "\n" }));
                }
            }, 15000);

        } catch (err: any) {
            setFailStage('installing');
            const msg = err.message || "Terminal connection failed";
            setErrorMessage(msg);
            addLog(`✖ Terminal Error: ${msg}`);
            setStatus('error');
        }
    };

    const [isRedeploying, setIsRedeploying] = useState(false);

    const handleConnect = async (force: boolean = false) => {
        if (!force && status !== 'idle' && status !== 'error') return;

        if (force) {
            setIsRedeploying(true);
            if (wsRef.current) wsRef.current.close();
        }

        try {
            setFailStage(null);
            setErrorMessage("");
            setSuggestedPorts([]);
            setStatus('connecting');
            setElapsedSeconds(0);
            setLogs([]);

            // Step 1: Create VPS
            const vpsRes = await fetch(`${BASE_URL}/cockpit/vps`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.pcName,
                    host: formData.host,
                    port: formData.port || 22,
                    username: formData.user,
                    password: formData.password
                }),
                credentials: "include"
            });

            if (!vpsRes.ok) throw new Error("Failed to create VPS entry");
            const vps = await vpsRes.json();
            const vpsId = vps.id;

            // Step 2: Verify
            setStatus('verifying');
            const verifyRes = await fetch(`${BASE_URL}/cockpit/vps/${vpsId}/verify`, {
                method: "POST",
                credentials: "include"
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.ok) {
                // Check for SSH_PORT_MISMATCH
                if (verifyData.code === 'SSH_PORT_MISMATCH' && verifyData.suggestedPorts) {
                    setSuggestedPorts(verifyData.suggestedPorts);
                    setErrorMessage(verifyData.message);
                    setFailStage('verifying');
                    setStatus('error');
                    addLog(`⚠ ${verifyData.message}`);
                    return; // Stop here
                }
                throw new Error(verifyData.message || "Verification failed");
            }

            // Step 3: Enroll
            setStatus('enrolling');
            const enrollRes = await fetch(`${BASE_URL}/cockpit/cocktail/devices/enroll/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vpsId }),
                credentials: "include"
            });

            if (!enrollRes.ok) throw new Error("Enrollment failed");
            const enrollData = await enrollRes.json();

            // Step 4: Real Terminal Pipe
            setStatus('installing');
            let fullCommand = normalizeAgentInstallCommand(enrollData.installCommand || "");
            // Automatically exit SSH when command finishes
            fullCommand += " ; exit";

            initTerminalPipe(vpsId, fullCommand);

        } catch (err: any) {
            setFailStage(status);
            const msg = err.message || "An unexpected error occurred";
            setErrorMessage(msg);
            addLog(`✖ ERROR: ${msg}`);
            setStatus('error');
        } finally {
            setIsRedeploying(false);
        }
    };

    const isFormValid = mode === 'new'
        ? connectionType === 'direct'
            ? (formData.pcName && formData.host && formData.user && formData.password)
            : (cloudData.deviceName && cloudData.host && cloudData.username && cloudData.privateKey)
        : formData.deviceId;

    const handleCloudConnect = async () => {
        if (status !== 'idle' && status !== 'error') return;

        try {
            setFailStage(null);
            setErrorMessage("");
            setSuggestedPorts([]);
            setStatus('connecting');
            setElapsedSeconds(0);
            setLogs([
                `Selected provider: AWS EC2`,
                `Auth model: SSH private key / PEM`,
                `Target: ${cloudData.username}@${cloudData.host}:${cloudData.port || 22}`,
            ]);

            const vpsRes = await fetch(`${BASE_URL}/cockpit/vps`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: cloudData.deviceName,
                    host: cloudData.host,
                    port: cloudData.port || 22,
                    username: cloudData.username,
                    authType: "privateKey",
                    privateKey: cloudData.privateKey,
                    passphrase: cloudData.passphrase || undefined,
                }),
                credentials: "include"
            });

            if (!vpsRes.ok) {
                const data = await vpsRes.json().catch(() => null);
                throw new Error(data?.message || "Failed to create EC2 instance entry");
            }

            const vps = await vpsRes.json();
            const vpsId = vps.id;

            setStatus('verifying');
            const verifyRes = await fetch(`${BASE_URL}/cockpit/vps/${vpsId}/verify`, {
                method: "POST",
                credentials: "include"
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.ok) {
                throw new Error(verifyData.message || "EC2 SSH key verification failed");
            }

            setStatus('enrolling');
            const enrollRes = await fetch(`${BASE_URL}/cockpit/cocktail/devices/enroll/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vpsId }),
                credentials: "include"
            });

            if (!enrollRes.ok) throw new Error("Enrollment failed");
            const enrollData = await enrollRes.json();

            setStatus('installing');
            let fullCommand = normalizeAgentInstallCommand(enrollData.installCommand || "");
            fullCommand += " ; exit";
            initTerminalPipe(vpsId, fullCommand);
        } catch (err: any) {
            setFailStage('cloud');
            const msg = err.message || "An unexpected EC2 connection error occurred";
            setErrorMessage(msg);
            addLog(`✖ ERROR: ${msg}`);
            setStatus('error');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-[1060px] h-[720px] max-h-[calc(100vh-72px)] bg-gradient-to-t from-black/5 to-black/100 rounded-[32px] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row"
        >
            {/* Left Side: Form */}
            <div className="flex-1 bg-transparent p-12 flex flex-col justify-between relative overflow-y-auto no-scrollbar">

                {/* Tutorial Overlays */}
                <AnimatePresence>
                    {(tutorialState === 'prompt' || tutorialState === 'active') && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-40 rounded-[32px] md:rounded-r-none"
                        />
                    )}
                </AnimatePresence>

                {/* Tutorial Prompt Modal */}
                <AnimatePresence>
                    {tutorialState === 'prompt' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] bg-white text-black p-8 rounded-2xl shadow-2xl z-50 flex flex-col items-center text-center space-y-4"
                        >
                            <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center text-black mb-2">
                                <HelpCircleIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold tracking-tight">New to Cockpit?</h3>
<p className="text-sm text-gray-500 leading-relaxed">
    We’ll guide you through connecting your machine — step by step.
</p>
                            <div className="flex flex-col w-full gap-2 pt-2">
                                <button
                                    onClick={startTour}
                                    className="w-full py-2.5 bg-black text-white rounded-xl font-medium text-sm hover:bg-black/90 transition-colors flex items-center justify-center gap-2"
                                >
                                    <PlayCircle className="w-4 h-4" /> Start Tour
                                </button>
                                <button
                                    onClick={skipTour}
                                    className="w-full py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
                                >
                                    Skip setup help
                                </button>
                            </div>

                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {status === 'success' ? (
                        <motion.div
                            key="success-screen"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center h-full text-center space-y-6 py-12"
                        >
                            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4">
                                <PartyPopperIcon className="w-10 h-10 text-white" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-[32px] font-semibold text-white tracking-tight">Setup Complete</h1>
                                <p className="text-[17px] text-white/60 font-normal leading-relaxed max-w-[320px]">
                                    Your device <span className="text-white font-medium">{formData.pcName}</span> is now connected and synchronized with Cockpit.
                                </p>
                            </div>
                            <button
                                onClick={() => window.location.href = '/home'}
                                className="group px-10 py-4 bg-white text-black rounded-full font-bold text-[16px] hover:bg-white/90 transition-all shadow-xl shadow-white/10 flex items-center gap-2"
                            >
                                Get Started
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </motion.div>
                    ) : mode === 'new' ? (
                        <motion.div
                            key="new-device"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-8"
                        >
                            <div className={`space-y-2 relative transition-all duration-300 ${tutorialState === 'active' ? 'blur-[2px] opacity-20' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-[32px] font-semibold text-[#fff] tracking-tight">Configure your device</h1>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (connectionType === 'direct') startTour();
                                        }}
                                        className="group/flow-help relative mt-1 rounded-full bg-white/5 p-1 text-white/40 transition-all hover:bg-white/20 hover:text-white"
                                        title={connectionType === 'direct' ? "Start Setup Guide" : "EC2 key setup flow"}
                                    >
                                        <HelpCircle className="w-4 h-4" />
                                        {connectionType === 'cloud' && (
                                            <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-xl border border-white/10 bg-black/95 p-3 text-left text-[11px] leading-5 text-white opacity-0 shadow-2xl backdrop-blur-md transition-opacity group-hover/flow-help:opacity-100">
                                                Cockpit connects to your EC2 instance over SSH using the pasted PEM key, verifies access, enrolls the device, then installs the agent through the same secure terminal pipeline.
                                                <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-black/95" />
                                            </span>
                                        )}
                                    </button>
                                </div>
                                <p className="text-[17px] text-[#fff] font-normal leading-relaxed">
                                    {connectionType === 'direct'
                                        ? "Enter your VPS details to start the connection process."
                                        : "Connect cloud-managed instances through provider inventory instead of root password access."}
                                </p>
                            </div>

                            <div className={`inline-flex w-fit items-center gap-1 rounded-none border border-white/10 bg-white/[0.06] p-1 ${tutorialState === 'active' ? 'blur-[1px] opacity-40' : ''}`}>
                                {[
                                    { id: 'direct' as const, icon: Server, title: 'Direct SSH' },
                                    { id: 'cloud' as const, icon: Cloud, title: 'EC2 Key' },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                            setConnectionType(item.id);
                                            setTutorialState('idle');
                                            setStatus('idle');
                                            setErrorMessage("");
                                            setFailStage(null);
                                            setLogs([]);
                                        }}
                                        className={`flex h-9 items-center gap-2 rounded-none cursor-pointer px-3 text-[12px] font-semibold transition-all ${connectionType === item.id
                                            ? 'bg-white text-black shadow-lg shadow-black/20'
                                            : 'text-white/60 hover:bg-white/7 hover:text-white'
                                            }`}
                                    >
                                        <item.icon className="h-3.5 w-3.5 shrink-0" />
                                        <span>{item.title}</span>
                                    </button>
                                ))}
                            </div>

                            <div className={connectionType === 'direct' ? "space-y-5" : "hidden"}>
                                {/* Device Name */}
                                <div className={`space-y-3 relative transition-all duration-300 rounded-2xl p-2 -m-2 ${isStepActive('pcName') ? 'z-50 bg-white/5 ring-1 ring-white/20' : tutorialState === 'active' ? 'blur-[1px] opacity-40' : ''}`}>
                                    <div className="flex items-center gap-2">
                                        <label className="text-[13px] font-semibold text-[#fff] ml-1 uppercase tracking-wider opacity-100">Device Name</label>
                                        <div className="group/tooltip relative">
                                            <HelpCircle className="w-3.5 h-3.5 text-white/40 cursor-help hover:text-white/80 transition-colors" />
                                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-black/90 backdrop-blur-md text-white text-[11px] p-2.5 rounded-lg opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity border border-white/10 text-center shadow-xl">
                                                Give your VPS a friendly name (max 11 chars) to identify it quickly.
                                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black/90"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative group mt-1">
                                        <Monitor strokeWidth={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fff] transition-colors group-focus-within:text-[#fff]" />
                                        <input
                                            type="text"
                                            placeholder="e.g. My VPS"
                                            className="w-full text-white font-medium h-12 bg-[#fff]/10 border border-transparent rounded-xl pl-11 pr-4 text-[15px] focus:bg-white/10 focus:border-[#fff]/10 focus:ring-1 focus:ring-[#fff]/10 transition-all outline-none"
                                            value={formData.pcName}
                                            onChange={(e) => setFormData({ ...formData, pcName: e.target.value.slice(0, 11) })}
                                        />
                                    </div>

                                    {/* Tooltip for Device Name */}
                                    <AnimatePresence>
                                        {isStepActive('pcName') && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 20 }}
                                                className="absolute left-0 top-[calc(100%+16px)] w-[240px] bg-white text-black p-4 rounded-xl shadow-2xl z-50 pointer-events-auto"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-bold text-sm">Device Name</span>
                                                    <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-mono">1/5</span>
                                                </div>
                                                <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                                                    Give your VPS a friendly name (max 11 chars) to identify it quickly in your cockpit system interface.
                                                </p>
                                                <div className="flex gap-2">
                                                    <button onClick={skipTour} className="flex-1 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg">Skip</button>
                                                    <button onClick={nextStep} className="flex-1 py-1.5 text-xs font-medium bg-black text-white hover:bg-black/80 rounded-lg">Next</button>
                                                </div>
                                                <div className="absolute -top-2 left-8 w-4 h-4 bg-white transform rotate-45" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="grid grid-cols-[1fr_180px] gap-4 items-end mt-4">
                                    {/* Public IP */}
                                    <div className={`space-y-3 relative transition-all duration-300 rounded-2xl p-2 -m-2 ${isStepActive('host') ? 'z-50 bg-white/5 ring-1 ring-white/20' : tutorialState === 'active' ? 'blur-[1px] opacity-40' : ''}`}>
                                        <div className="flex items-center gap-2">
                                            <label className="text-[13px] font-semibold text-[#fff] ml-1 uppercase tracking-wider">
                                                VPS IPv4 Address
                                            </label>
                                            <div className="group/tooltip relative">
                                                <HelpCircle className="w-3.5 h-3.5 text-white/40 cursor-help hover:text-white/80 transition-colors" />
                                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-black/90 backdrop-blur-md text-white text-[11px] p-2.5 rounded-lg opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity border border-white/10 text-center shadow-xl">
                                                    Enter the IPv4 address provided by your VPS host.
                                                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black/90"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative group mt-1">
                                            <Globe
                                                strokeWidth={2.5}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fff]"
                                            />
                                            <input
                                                type="text"
                                                placeholder="e.g. 192.168.1.1"
                                                className="w-full text-white font-medium h-12 bg-[#fff]/10 border border-transparent rounded-xl pl-11 pr-4 text-[15px] focus:bg-white/10 focus:border-[#fff]/10 focus:ring-1 focus:ring-[#fff]/10 transition-all outline-none"
                                                value={formData.host}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                                    setFormData({ ...formData, host: val });
                                                }}
                                            />
                                        </div>

                                        {/* Tooltip for Host */}
                                        <AnimatePresence>
                                            {isStepActive('host') && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 20 }}
                                                    className="absolute left-0 top-[calc(100%+16px)] w-[240px] bg-white text-black p-4 rounded-xl shadow-2xl z-50 pointer-events-auto"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-bold text-sm">Public IP</span>
                                                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-mono">2/5</span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                                                        Enter the IPv4 address of your VPS. You can find this in your provider's dashboard.
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <button onClick={skipTour} className="flex-1 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg">Skip</button>
                                                        <button onClick={nextStep} className="flex-1 py-1.5 text-xs font-medium bg-black text-white hover:bg-black/80 rounded-lg">Next</button>
                                                    </div>
                                                    <div className="absolute -top-2 left-8 w-4 h-4 bg-white transform rotate-45" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Port */}
                                    <div className={`space-y-3 relative transition-all duration-300 rounded-2xl p-2 -m-2 ${isStepActive('port') ? 'z-50 bg-white/5 ring-1 ring-white/20' : tutorialState === 'active' ? 'blur-[1px] opacity-40' : ''}`}>
                                        <div className="flex items-center gap-2">
                                            <label className="text-[13px] font-semibold text-[#fff] ml-1 uppercase tracking-wider">
                                                Port
                                            </label>
                                            <div className="group/tooltip relative">
                                                <HelpCircle className="w-3.5 h-3.5 text-white/40 cursor-help hover:text-white/80 transition-colors" />
                                                <div className="absolute right-0 bottom-full mb-2 w-48 bg-black/90 backdrop-blur-md text-white text-[11px] p-2.5 rounded-lg opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity border border-white/10 text-center shadow-xl">
                                                    Default is 22. Only change if you configured a custom SSH port.
                                                    <div className="absolute right-4 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black/90"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative group mt-1">
                                            <Hash
                                                strokeWidth={2.5}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fff]"
                                            />
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                placeholder="22"
                                                className="w-full text-white font-medium h-12 bg-[#fff]/10 border border-transparent rounded-xl pl-11 pr-4 text-[15px] focus:bg-white/10 focus:border-[#fff]/10 focus:ring-1 focus:ring-[#fff]/10 transition-all outline-none"
                                                value={formData.port}
                                                onChange={(e) => {
                                                    const onlyDigits = e.target.value.replace(/\D/g, "");
                                                    const n = onlyDigits === "" ? "" : Math.min(65535, Math.max(1, Number(onlyDigits)));

                                                    setFormData({
                                                        ...formData,
                                                        port: n as any
                                                    });
                                                }}
                                            />
                                        </div>

                                        {/* Tooltip for Port */}
                                        <AnimatePresence>
                                            {isStepActive('port') && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 20 }}
                                                    className="absolute right-0 top-[calc(100%+16px)] w-[240px] bg-white text-black p-4 rounded-xl shadow-2xl z-50 pointer-events-auto"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-bold text-sm">SSH Port</span>
                                                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-mono">3/5</span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                                                        The default SSH port is 22. Only change this if you've configured a custom port.
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <button onClick={skipTour} className="flex-1 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg">Skip</button>
                                                        <button onClick={nextStep} className="flex-1 py-1.5 text-xs font-medium bg-black text-white hover:bg-black/80 rounded-lg">Next</button>
                                                    </div>
                                                    <div className="absolute -top-2 right-8 w-4 h-4 bg-white transform rotate-45" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* User */}
                                    <div className={`space-y-3 relative transition-all duration-300 rounded-2xl p-2 -m-2 ${isStepActive('user') ? 'z-50 bg-white/5 ring-1 ring-white/20' : tutorialState === 'active' ? 'blur-[1px] opacity-40' : ''}`}>
                                        <div className="flex items-center gap-2">
                                            <label className="text-[13px] font-semibold text-[#fff] ml-1 uppercase tracking-wider opacity-100">User</label>
                                            <div className="group/tooltip relative">
                                                <HelpCircle className="w-3.5 h-3.5 text-white/40 cursor-help hover:text-white/80 transition-colors" />
                                                <div className="absolute left-0 bottom-full mb-2 w-48 bg-black/90 backdrop-blur-md text-white text-[11px] p-2.5 rounded-lg opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity border border-white/10 text-center shadow-xl">
                                                    Usually 'root'. Ensure this user has sudo privileges.
                                                    <div className="absolute left-4 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black/90"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative group mt-1">
                                            <User strokeWidth={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fff] transition-colors group-focus-within:text-[#fff]" />
                                            <input
                                                type="text"
                                                className="w-full text-white font-medium h-12 bg-[#fff]/10 border border-transparent rounded-xl pl-11 pr-4 text-[15px] focus:bg-white/10 focus:border-[#fff]/10 focus:ring-1 focus:ring-[#fff]/10 transition-all outline-none"
                                                value={formData.user}
                                                onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                                            />
                                        </div>

                                        {/* Tooltip for User */}
                                        <AnimatePresence>
                                            {isStepActive('user') && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 20 }}
                                                    className="absolute left-0 top-[calc(100%+16px)] w-[240px] bg-white text-black p-4 rounded-xl shadow-2xl z-50 pointer-events-auto"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-bold text-sm">Username</span>
                                                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-mono">4/5</span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                                                        Usually “root” Changing this may cause permission issues or disrupt your system.
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <button onClick={skipTour} className="flex-1 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg">Skip</button>
                                                        <button onClick={nextStep} className="flex-1 py-1.5 text-xs font-medium bg-black text-white hover:bg-black/80 rounded-lg">Next</button>
                                                    </div>
                                                    <div className="absolute -top-2 left-8 w-4 h-4 bg-white transform rotate-45" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Password */}
                                    <div className={`space-y-3 relative transition-all duration-300 rounded-2xl p-2 -m-2 ${isStepActive('password') ? 'z-50 bg-white/5 ring-1 ring-white/20' : tutorialState === 'active' ? 'blur-[1px] opacity-40' : ''}`}>
                                        <div className="flex items-center gap-2">
                                            <label className="text-[13px] font-semibold text-[#fff] ml-1 uppercase tracking-wider opacity-100">VPS Password</label>
                                            <div className="group/tooltip relative">
                                                <HelpCircle className="w-3.5 h-3.5 text-white/40 cursor-help hover:text-white/80 transition-colors" />
                                                <div className="absolute right-0 bottom-full mb-2 w-56 bg-black/90 backdrop-blur-md text-white text-[11px] p-2.5 rounded-lg opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity border border-white/10 text-center shadow-xl">
                                                    Root/User password for your VPS.
                                                    <div className="absolute right-4 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black/90"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative group mt-1">
                                            <Lock strokeWidth={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fff] transition-colors group-focus-within:text-[#fff]" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="w-full text-white font-medium h-12 bg-[#fff]/10 border border-transparent rounded-xl pl-11 pr-12 text-[15px] focus:bg-white/10 focus:border-[#fff]/10 focus:ring-1 focus:ring-[#fff]/10 transition-all outline-none"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-white/80 transition-colors"
                                            >
                                                {showPassword ? (
                                                    <EyeOff strokeWidth={2.5} className="w-4 h-4" />
                                                ) : (
                                                    <Eye strokeWidth={2.5} className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>

                                        {/* Tooltip for Password */}
                                        <AnimatePresence>
                                            {isStepActive('password') && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 20 }}
                                                    className="absolute right-0 top-[calc(100%+16px)] w-[240px] bg-white text-black p-4 rounded-xl shadow-2xl z-50 pointer-events-auto"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-bold text-sm">Password</span>
                                                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-mono">5/5</span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                                                        Enter the root password for your VPS.
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <button onClick={skipTour} className="flex-1 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg">Finish</button>
                                                    </div>
                                                    <div className="absolute -top-2 right-8 w-4 h-4 bg-white transform rotate-45" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>

                            {connectionType === 'cloud' && (
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between gap-4 rounded-none border border-white/10 bg-white/[0.06] px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-14 items-center justify-center rounded-none bg-transparent text-white">
                                                <FaAws className="h-7 w-9" aria-hidden="true" />
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-semibold text-white">Powered by AWS</p>
                                                <p className="text-[11px] leading-4 text-white/45">Connect an EC2 instance with your key pair.</p>
                                            </div>
                                        </div>
                                        <a
                                            href={AWS_EC2_CONSOLE_URL}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-white px-3 text-[12px] font-semibold text-black transition-colors hover:bg-white/90"
                                        >
                                            AWS EC2 Console
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <label className="ml-1 text-[13px] font-semibold uppercase tracking-wider text-white">Provider</label>
                                                <FieldHelp text="AWS EC2 is the key-pair instance path. More providers can be added without changing the direct SSH flow." align="left" />
                                            </div>
                                            <div className="relative mt-1">
                                                <Cloud className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white" strokeWidth={2.5} />
                                                <select
                                                    value={cloudData.provider}
                                                    onChange={(e) => setCloudData({ ...cloudData, provider: e.target.value })}
                                                    className="h-12 w-full appearance-none rounded-xl border border-transparent bg-white/10 pl-11 pr-4 text-[15px] font-medium text-white outline-none transition-all focus:border-white/10 focus:bg-white/10 focus:ring-1 focus:ring-white/10"
                                                >
                                                    <option className="bg-black" value="aws-ec2">AWS EC2</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <label className="ml-1 text-[13px] font-semibold uppercase tracking-wider text-white">Region</label>
                                                <FieldHelp text="Select the AWS region where this instance runs. This keeps the setup context clear for your dashboard." align="right" />
                                            </div>
                                            <div className="relative mt-1">
                                                <Globe className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white" strokeWidth={2.5} />
                                                <select
                                                    value={cloudData.region}
                                                    onChange={(e) => setCloudData({ ...cloudData, region: e.target.value })}
                                                    className="h-12 w-full appearance-none rounded-xl border border-transparent bg-white/10 pl-11 pr-4 text-[15px] font-medium text-white outline-none transition-all focus:border-white/10 focus:bg-white/10 focus:ring-1 focus:ring-white/10"
                                                >
                                                    {['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-south-1', 'ap-southeast-1'].map(region => (
                                                        <option key={region} className="bg-black" value={region}>{region}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <label className="ml-1 text-[13px] font-semibold uppercase tracking-wider text-white">Instance name</label>
                                            <FieldHelp text="Use a friendly name that helps you recognize the EC2 instance inside Cockpit after it connects." align="left" />
                                        </div>
                                        <div className="relative mt-1">
                                            <Monitor className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white" strokeWidth={2.5} />
                                            <input
                                                type="text"
                                                placeholder="e.g. prod-web-01"
                                                className="h-12 w-full rounded-xl border border-transparent bg-white/10 pl-11 pr-4 text-[15px] font-medium text-white outline-none transition-all placeholder:text-white/35 focus:border-white/10 focus:bg-white/10 focus:ring-1 focus:ring-white/10"
                                                value={cloudData.deviceName}
                                                onChange={(e) => setCloudData({ ...cloudData, deviceName: e.target.value.slice(0, 24) })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <label className="ml-1 text-[13px] font-semibold uppercase tracking-wider text-white">Public IPv4 / DNS</label>
                                            <FieldHelp text="Use the EC2 public IPv4 address or public DNS name. The security group must allow SSH on this port." align="left" />
                                        </div>
                                        <div className="relative mt-1">
                                            <Globe className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white" strokeWidth={2.5} />
                                            <input
                                                type="text"
                                                placeholder="ec2-13-...compute.amazonaws.com or 13.x.x.x"
                                                className="h-12 w-full rounded-xl border border-transparent bg-white/10 pl-11 pr-4 text-[14px] font-medium text-white outline-none transition-all placeholder:text-white/30 focus:border-white/10 focus:bg-white/10 focus:ring-1 focus:ring-white/10"
                                                value={cloudData.host}
                                                onChange={(e) => setCloudData({ ...cloudData, host: e.target.value.trim() })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-[1fr_1fr] gap-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <label className="ml-1 text-[13px] font-semibold uppercase tracking-wider text-white">SSH user</label>
                                                <FieldHelp text="Use the AMI login user, such as ubuntu for Ubuntu or ec2-user for Amazon Linux." align="left" />
                                            </div>
                                            <div className="relative mt-1">
                                                <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white" strokeWidth={2.5} />
                                                <input
                                                    type="text"
                                                    className="h-12 w-full rounded-xl border border-transparent bg-white/10 pl-11 pr-4 text-[14px] font-medium text-white outline-none transition-all focus:border-white/10 focus:bg-white/10 focus:ring-1 focus:ring-white/10"
                                                    value={cloudData.username}
                                                    onChange={(e) => setCloudData({ ...cloudData, username: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <label className="ml-1 text-[13px] font-semibold uppercase tracking-wider text-white">Port</label>
                                                <FieldHelp text="Default EC2 SSH is port 22. Change this only if your instance uses a custom SSH port." align="right" />
                                            </div>
                                            <div className="relative mt-1">
                                                <Hash className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white" strokeWidth={2.5} />
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder="22"
                                                    className="h-12 w-full rounded-xl border border-transparent bg-white/10 pl-11 pr-4 font-mono text-[13px] font-medium text-white outline-none transition-all placeholder:text-white/30 focus:border-white/10 focus:bg-white/10 focus:ring-1 focus:ring-white/10"
                                                    value={cloudData.port}
                                                    onChange={(e) => {
                                                        const onlyDigits = e.target.value.replace(/\D/g, "");
                                                        const n = onlyDigits === "" ? "" : Math.min(65535, Math.max(1, Number(onlyDigits)));
                                                        setCloudData({ ...cloudData, port: n as any });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <label className="ml-1 text-[13px] font-semibold uppercase tracking-wider text-white">PEM / private key</label>
                                            <FieldHelp text="Paste the full private key contents, including the BEGIN and END lines from your AWS key pair file." align="left" />
                                        </div>
                                        <div className="relative mt-1">
                                            <KeyRound className="absolute left-4 top-4 h-4 w-4 text-white" strokeWidth={2.5} />
                                            <textarea
                                                placeholder={"-----BEGIN OPENSSH PRIVATE KEY-----\\n..."}
                                                className="min-h-[118px] w-full resize-none rounded-xl border border-transparent bg-white/10 py-3 pl-11 pr-4 font-mono text-[12px] font-medium leading-5 text-white outline-none transition-all placeholder:text-white/30 focus:border-white/10 focus:bg-white/10 focus:ring-1 focus:ring-white/10"
                                                value={cloudData.privateKey}
                                                onChange={(e) => setCloudData({ ...cloudData, privateKey: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <label className="ml-1 text-[13px] font-semibold uppercase tracking-wider text-white">Key passphrase optional</label>
                                            <FieldHelp text="Only fill this if your private key itself is encrypted with a passphrase. Most AWS PEM files are not." align="left" />
                                        </div>
                                        <div className="relative mt-1">
                                            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white" strokeWidth={2.5} />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="h-12 w-full rounded-xl border border-transparent bg-white/10 pl-11 pr-4 text-[14px] font-medium text-white outline-none transition-all placeholder:text-white/30 focus:border-white/10 focus:bg-white/10 focus:ring-1 focus:ring-white/10"
                                                value={cloudData.passphrase}
                                                onChange={(e) => setCloudData({ ...cloudData, passphrase: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 mb-10">
                                        <div className="flex items-start gap-3">
                                            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-white" />
                                            <div>
                                                <p className="text-[13px] font-semibold text-white">Secure EC2 setup with your AWS key</p>
                                                <p className="mt-1 text-[12px] leading-5 text-white/55">
                                                    Paste your instance address, the right login user such as <span className="font-mono text-white/80">ubuntu</span> or <span className="font-mono text-white/80">ec2-user</span>, and your AWS private key. Cockpit uses it only to make the SSH connection, verify access, and install your agent securely.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="existing-device"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-8"
                        >
                            <div className="space-y-2">
                                <h1 className="text-[32px] font-semibold text-[#fff] tracking-tight">Sign in with your device</h1>
                                <p className="text-[17px] text-[#fff] font-normal leading-relaxed">We've already sent your setup link to your registered email during the first-time setup.</p>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-3">
                                    <label className="text-[13px] font-semibold text-[#fff] ml-1 uppercase tracking-wider opacity-100">Device ID</label>
                                    <div className="relative group mt-1">
                                        <Monitor strokeWidth={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fff] transition-colors group-focus-within:text-[#fff]" />
                                        <input
                                            type="text"
                                            placeholder=""
                                            className="w-full text-white font-medium h-12 bg-[#fff]/10 border border-transparent rounded-xl pl-11 pr-4 text-[15px] focus:bg-white/10 focus:border-[#fff]/10 focus:ring-1 focus:ring-[#fff]/10 transition-all outline-none font-mono"
                                            value={formData.deviceId}
                                            onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {status !== 'success' && (
                    <div className={`flex items-center justify-between pt-6 border-t border-white/10 ${tutorialState === 'active' ? 'blur-[1px] opacity-40' : ''}`}>
                        {connectionType === 'direct' ? (
                            <button
                                onClick={() => setShowRepairModal(true)}
                                className="text-[12px] text-white hover:text-white/80 underline underline-offset-2 decoration-white/20 hover:decoration-white/40 transition-all flex items-center gap-1.5 font-semibold"
                            >
                                <Wrench className="w-3 h-3" />
                                Repair VPS
                            </button>
                        ) : (
                            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-white/55">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                PEM key setup path
                            </div>
                        )}
                        <button
                            onClick={() => connectionType === 'direct' ? handleConnect() : handleCloudConnect()}
                            disabled={!isFormValid || (status !== 'idle' && status !== 'error')}
                            className={`group px-6 py-3 rounded-full font-semibold text-[15px] flex items-center gap-2 transition-all duration-300 ${isFormValid && (status === 'idle' || status === 'error')
                                ? "bg-[#fff] text-black hover:bg-[#fff]/90 cursor-pointer shadow-lg shadow-[#fff]/20"
                                : "bg-[#F5F5F7]/10 text-[#fff]/30 cursor-not-allowed"
                                }`}
                        >
                            {status === 'idle'
                                ? mode === 'new'
                                    ? connectionType === 'direct' ? "Connect Device" : "Connect EC2 Instance"
                                    : "Add Device"
                                : status === 'error'
                                    ? connectionType === 'direct' ? "Retry Connection" : "Retry EC2 Setup"
                                    : "Connecting..."}
                            {(status === 'idle' || status === 'error') && <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1`} />}
                            {status !== 'idle' && status !== 'error' && (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                    className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full"
                                />
                            )}
                        </button>
                    </div>
                )}

                {/* Repair VPS Modal */}
                <AnimatePresence>
                    {showRepairModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/10 backdrop-blur-sm"
                            onClick={() => setShowRepairModal(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full max-w-lg bg-white text-black rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                                            <Wrench className="w-4.5 h-4.5 text-gray-700" />
                                        </div>
                                        <div>
                                            <h3 className="text-[15px] font-bold text-black tracking-tight">Repair VPS Manually</h3>
                                            <p className="text-[11px] text-gray-400 mt-0.5">SSH into your VPS and run these commands</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowRepairModal(false)}
                                        className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5 text-gray-500" />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
                                    <p className="text-[13px] text-gray-500 leading-relaxed">
                                        If your VPS is unreachable or has broken services from a previous installation, SSH into it from your own terminal and run the commands below to fully remove the Cocktail agent.
                                    </p>

                                    {[
                                        {
                                            id: 'step1',
                                            step: '1',
                                            title: 'Stop & disable the service',
                                            code: 'sudo systemctl stop cocktail\nsudo systemctl disable cocktail'
                                        },
                                        {
                                            id: 'step2',
                                            step: '2',
                                            title: 'Remove the service file',
                                            code: 'sudo rm -f /etc/systemd/system/cocktail.service\nsudo systemctl daemon-reload\nsudo systemctl reset-failed'
                                        },
                                        {
                                            id: 'step3',
                                            step: '3',
                                            title: 'Delete the agent files',
                                            code: 'sudo rm -rf /opt/cocktail'
                                        },
                                        {
                                            id: 'step4',
                                            step: '4',
                                            title: 'Delete the config directory',
                                            code: 'sudo rm -rf /etc/cocktail'
                                        },
                                        {
                                            id: 'step5',
                                            step: '5',
                                            title: 'Verify it\'s fully removed',
                                            code: 'systemctl status cocktail\nls /opt/cocktail'
                                        },
                                    ].map(({ id, step, title, code }) => (
                                        <div key={id} className="group">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="w-5 h-5 rounded-full bg-gray-100 text-[10px] font-black text-gray-500 flex items-center justify-center shrink-0">{step}</span>
                                                <span className="text-[12px] font-semibold text-gray-700">{title}</span>
                                            </div>
                                            <div className="relative">
                                                <pre className="bg-gray-950 text-gray-100 text-[11.5px] font-mono rounded-xl px-4 py-3.5 leading-relaxed overflow-x-auto whitespace-pre">{code}</pre>
                                                <button
                                                    onClick={() => copyBlock(id, code)}
                                                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                                    title="Copy"
                                                >
                                                    {copiedBlock === id
                                                        ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                        : <Copy className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                                        <p className="text-[11.5px] text-gray-500 leading-relaxed">
                                            <span className="font-semibold text-gray-700">After cleanup:</span> the device will go offline in Cockpit since it stops heartbeating. You can then delete it from the Cockpit system interface.
                                        </p>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="px-8 py-5 border-t border-gray-100">
                                    <button
                                        onClick={() => setShowRepairModal(false)}
                                        className="w-full py-2.5 bg-black text-white rounded-xl text-[13px] font-semibold hover:bg-black/80 transition-colors"
                                    >
                                        Done
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Right Side: Log-Integrated Feed */}
            <div className="w-full md:w-[440px] flex-none bg-black p-10 relative flex flex-col font-mono border-l border-white/5">
                {/* Decoration */}
                <div className="absolute top-8 left-8 w-2 h-2 border-t border-l border-white/20" />
                <div className="absolute top-8 right-8 w-2 h-2 border-t border-r border-white/20" />
                <div className="absolute bottom-8 left-8 w-2 h-2 border-b border-l border-white/20" />
                <div className="absolute bottom-8 right-8 w-2 h-2 border-b border-r border-white/20" />

                <div className="flex gap-1.5 mb-8 relative z-10">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                </div>

                <div className="flex-1 text-[13px] space-y-4 relative z-10 overflow-hidden flex flex-col">
                    {/* Connection header */}
                    <div className="flex gap-2.5 items-center flex-none">
                        <span className="text-white/40 select-none">&gt;</span>
                        <span className="text-white bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-bold">
                            {connectionType === 'direct' ? 'SSH' : 'EC2'}
                        </span>
                        <span className="text-white/50 font-medium tracking-tight">
                            {connectionType === 'direct'
                                ? `ssh ${formData.port !== 22 ? `-p ${formData.port} ` : ''}${formData.user || "root"}@${formData.host || "host"}`
                                : `ssh -i key.pem ${cloudData.username || "ubuntu"}@${cloudData.host || "ec2-host"}`}
                        </span>
                        {elapsedSeconds > 0 && status !== 'success' && status !== 'error' && (
                            <div className="ml-auto text-white text-[11px] font-semibold tabular-nums">
                                {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
                            </div>
                        )}
                    </div>

                    {/* Connection Progress Timeline */}
                    {status !== 'idle' && (
                        <div className="pl-5 space-y-4 flex-none border-l border-white/10 ml-0.5">
                            {[
                                { id: 'verifying', label: connectionType === 'direct' ? 'SSH Handshake' : 'PEM Key Handshake', key: ['connecting', 'verifying'] },
                                { id: 'enrolling', label: 'Device Enrollment', key: ['enrolling'] },
                                { id: 'installing', label: 'CockpitOS Installation', key: ['installing', 'success'] }
                            ].map((stage, i) => {
                                const isActive = stage.key.includes(status);
                                const isDone = status === 'success' ||
                                    (i === 0 && !['connecting', 'verifying', 'idle', 'error'].includes(status)) ||
                                    (i === 1 && !['connecting', 'verifying', 'enrolling', 'idle', 'error'].includes(status));
                                const isFailed = status === 'error' && (stage.id === failStage || (failStage === 'connecting' && i === 0) || (failStage === 'cloud' && i === 0));

                                return (
                                    <motion.div
                                        key={stage.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex flex-col gap-1.5"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative flex items-center justify-center">
                                                {isFailed ? (
                                                    <AlertCircle className="w-4 h-4 text-[#FF3B30]" />
                                                ) : isDone ? (
                                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                                ) : isActive ? (
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                                    >
                                                        <Loader2 className="w-4 h-4 text-white/60" />
                                                    </motion.div>
                                                ) : (
                                                    <div className="w-4 h-4 rounded-full border border-white/20" />
                                                )}
                                            </div>
                                            <span className={`text-[13px] font-medium transition-colors duration-300 ${isFailed ? 'text-[#FF3B30]' : isActive || isDone ? 'text-white' : 'text-white/30'}`}>
                                                {isFailed && failStage === 'cloud'
                                                    ? 'EC2 Key Failed'
                                                    : isFailed && stage.id === 'verifying' && errorMessage.toLowerCase().includes('mismatch')
                                                    ? 'Handshake Mismatch'
                                                    : stage.label}
                                            </span>
                                        </div>
                                        {isFailed && errorMessage && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="pl-7 overflow-hidden"
                                            >
                                                <div className="text-[11px] text-[#FF3B30]/70 font-mono bg-[#FF3B30]/5 border border-[#FF3B30]/10 px-2 py-1 rounded max-w-[300px]">
                                                    {errorMessage}
                                                </div>
                                            </motion.div>
                                        )}
                                        {isFailed && suggestedPorts.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="pl-7 pt-2 flex gap-2"
                                            >
                                                {suggestedPorts.map(p => (
                                                    <button
                                                        key={p}
                                                        onClick={() => {
                                                            setFormData({ ...formData, port: p });
                                                            setSuggestedPorts([]);
                                                            handleConnect();
                                                        }}
                                                        className="text-[11px] px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
                                                    >
                                                        Try Port {p}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {status === 'installing' && (
                        <motion.p
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25 }}
                            className="flex items-center gap-2 text-white bg-white/5 p-3 rounded-none font-medium text-xs justify-center"
                            >
We're setting things up - this usually takes about 10 minutes.                        
</motion.p>
                    )}

                    {/* RESTORED HEADER: DEVICE LABEL */}
                    {(connectionType === 'direct' ? formData.pcName : cloudData.deviceName) && (
                        <div className="pl-5 space-y-1 flex-none">
                            <div className="text-white/40 text-[11px] uppercase tracking-widest">
                                Device Label
                            </div>
                            <div className="text-white font-medium">
                                {connectionType === 'direct' ? formData.pcName : cloudData.deviceName}
                            </div>
                        </div>
                    )}

                    {/* Combined Logs: API + REAL TERMINAL PIPE */}
                    <div
                        ref={scrollRef}
                        className="pl-5 space-y-1 mt-4 overflow-y-auto no-scrollbar flex-1"
                    >
                        <AnimatePresence>
                            {logs.map((log, i) => {
                                const isSuccess = log.includes("installed and started") || log.includes("Active: active") || log.includes("✓") || log.includes("success");
                                const isError = log.includes("✖") || log.includes("Error") || log.includes("failed") || log.includes("Unable to locate") || log.includes("forcing");
                                const isPrompt = log.startsWith('root@') || log.startsWith('$') || log.includes(':~#');

                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`text-[12px] whitespace-pre-wrap leading-relaxed ${isSuccess ? 'text-green-400 font-medium' :
                                            isError ? 'text-red-400 font-medium' :
                                                isPrompt ? 'text-white' :
                                                    'text-white/60'
                                            }`}
                                    >
                                        {log}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        <div className="pt-2">
                            {status !== 'success' && status !== 'error' && (
                                <div className="space-y-4">
                                    <motion.div
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ repeat: Infinity, duration: 1 }}
                                        className="w-2 h-4 bg-white/40"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {connectionType === 'direct' && elapsedSeconds > 300 && status !== 'success' && status !== 'error' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="mt-4 relative z-20"
                        >
                            <button
                                onClick={() => handleConnect(true)}
                                disabled={isRedeploying}
                                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/80 text-[10px] font-bold rounded-lg transition-all border border-white/5 flex items-center justify-center gap-2 tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Loader2 className={`w-3 h-3 animate-spin ${isRedeploying ? 'block' : 'hidden'}`} />
                                {isRedeploying ? "Redeploying..." : "Setup taking too long? Redeploy"}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-auto pt-8 flex justify-between items-center border-t border-white/5 opacity-40 relative z-10">
                    <div className="text-[10px] font-mono text-white/40 tracking-tighter">
                        {connectionType === 'direct' ? 'SSH-2.0-OpenSSH_9.0_Cockpit' : 'SSH-2.0-OpenSSH_EC2_KeyPair'}
                    </div>
                    <div className="flex gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-white/40" />
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
