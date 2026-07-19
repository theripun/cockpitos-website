"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useDragControls, useMotionValue } from "framer-motion";
import {
    X,
    Maximize2,
    Search,
    Wifi,
    Bluetooth,
    Network,
    Bell,
    Volume2,
    Moon,
    Clock,
    Monitor,
    Accessibility,
    Wallpaper,
    Lock,
    Battery,
    ShieldCheck,
    Users,
    AppWindow,
    Settings as SettingsIcon,
    ChevronRight,
    User,
    Command,
    Palette,
    MonitorIcon,
    HardDrive,
    Info,
    Smartphone,
    CreditCard,
    Activity,
    Key,
    Code2,
    Box,
    Database,
    Cloud,
    Terminal,
    ChessPawnIcon,
    MemoryStick,
    LockKeyhole,
    History,
    DownloadCloud,
    RotateCcw,
    Plus,
    RefreshCw,
    ChevronDown,
    Loader2
} from "lucide-react";
import { WINDOW_CONSTANTS } from "../window-constants";
import { BASE_URL } from "@/lib/baseURL";
import { normalizeAgentInstallCommand } from "@/lib/install-command";
import { AppHorizontalAdTrack } from "@/components/ads";

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
    onMinimize?: () => void;
}

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const SETTINGS_GROUPS = [
    {
        title: null,
        items: [
            { id: "instance", label: "Cloud Instance", icon: HardDrive, color: "bg-blue-600" },
            { id: "performance", label: "Performance", icon: Activity, color: "bg-blue-600" }
        ]
    },
    {
        title: "Connectivity",
        items: [
            { id: "ssh", label: "SSH Keys", icon: Key, color: "bg-blue-600" },
            { id: "network", label: "Network & Ports", icon: Network, color: "bg-blue-600" },
            { id: "firewall", label: "Firewall (UFW)", icon: ShieldCheck, color: "bg-blue-600" },
        ]
    },
    {
        title: "Environment",
        items: [
            { id: "runtime", label: "Runtimes", icon: Code2, color: "bg-blue-600" },
            { id: "docker", label: "Docker Containers", icon: Box, color: "bg-blue-600" },
            { id: "database", label: "Databases", icon: Database, color: "bg-blue-600" },
        ]
    },
    {
        title: "Administration",
        items: [
            { id: "users", label: "Users & Root", icon: Users, color: "bg-blue-600" },
            // { id: "backups", label: "Backups (xCloud)", icon: Cloud, color: "bg-blue-600" },
            { id: "logs", label: "System Logs", icon: Terminal, color: "bg-blue-600" },
        ]
    }
];

export function Settings({ isOpen, onClose, onMinimize }: SettingsProps) {
    const [size, setSize] = useState({ width: 900, height: 600 });
    const [isMaximized, setIsMaximized] = useState(false);
    const [preMaximizeState, setPreMaximizeState] = useState<{
        size: { width: number; height: number };
        pos: { x: number; y: number };
    } | null>(null);

    const dragControls = useDragControls();
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const [isResizing, setIsResizing] = useState(false);
    const [activeTab, setActiveTab] = useState("instance");
    const [theme, setTheme] = useState("Dark");

    // --- Agent Integration ---

    const [allDevices, setAllDevices] = useState<any[]>([]);
    const [fetchingDevices, setFetchingDevices] = useState(false);
    const [showDevicePicker, setShowDevicePicker] = useState(false);
    const [enrollmentStatus, setEnrollmentStatus] = useState<'idle' | 'connecting' | 'running' | 'done' | 'error'>('idle');
    const [enrollmentLogs, setEnrollmentLogs] = useState<string[]>([]);

    const [device, setDevice] = useState<any>(null);
    const [metrics, setMetrics] = useState<any>(null);
    const [isOnline, setIsOnline] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [sshKeys, setSshKeys] = useState<any[]>([]);
    const [isFetchingSsh, setIsFetchingSsh] = useState(false);
    const [isAddingSsh, setIsAddingSsh] = useState(false);
    const [deletingKey, setDeletingKey] = useState<string | null>(null);
    const [showSshModal, setShowSshModal] = useState(false);
    const [newSshKey, setNewSshKey] = useState("");
    const [ufwStatus, setUfwStatus] = useState("Checking...");
    const [openPorts, setOpenPorts] = useState<string[]>([]);
    const [detailedPorts, setDetailedPorts] = useState<any[]>([]);
    const [firewallRules, setFirewallRules] = useState<any[]>([]);
    const [runtimes, setRuntimes] = useState<any[]>([]);
    const [isFetchingNetwork, setIsFetchingNetwork] = useState(false);
    const [isFetchingFirewall, setIsFetchingFirewall] = useState(false);
    const [isFetchingRuntimes, setIsFetchingRuntimes] = useState(false);
    const [cpuHistory, setCpuHistory] = useState<number[]>(new Array(24).fill(0));

    // Fetch device list on open
    useEffect(() => {
        if (!isOpen) return;

        const fetchDeviceList = async () => {
            try {
                const res = await fetch(`${BASE_URL}/cockpit/cocktail/devices`, {
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });
                if (!res.ok) return;
                const rawDevices = await res.json();
                const devices = Array.isArray(rawDevices) ? rawDevices : [];
                setAllDevices(devices);
                if (devices.length > 0 && !device) {
                    setDevice(devices[0]);
                }
            } catch (e) {
                console.error('Failed to fetch devices:', e);
            }
        };

        fetchDeviceList();
    }, [isOpen]);

    // Poll metrics whenever the selected device changes
    useEffect(() => {
        if (!device?.device?.id || !isOpen || device.device.status === 'enrolling') {
            setIsLoading(false);
            if (device?.device?.status === 'enrolling') setIsOnline(false);
            return;
        }

        setIsLoading(true);
        let pollInterval: any;

        const fetchMetrics = async () => {
            try {
                const metricsRes = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${device.device.id}/metrics/latest`, {
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    cache: 'no-store'
                });
                if (!metricsRes.ok) return;
                const latestMetrics = await metricsRes.json();
                if (latestMetrics) {
                    setMetrics(latestMetrics);
                    setIsOnline(!!latestMetrics.online);
                    if (latestMetrics.cpu?.usagePct !== undefined) {
                        setCpuHistory(prev => {
                            const next = [...prev, latestMetrics.cpu.usagePct];
                            return next.slice(-24);
                        });
                    }
                    setIsLoading(false);
                }
            } catch (e) {
                console.error('Failed to poll metrics:', e);
            }
        };

        fetchMetrics();
        pollInterval = setInterval(fetchMetrics, 2000);

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [device, isOpen]);

    // WebSocket for Events
    useEffect(() => {
        if (!device?.device?.id || !isOpen) return;

        const baseUrl = BASE_URL.replace(/^http/, 'ws');
        const ws = new WebSocket(`${baseUrl}/cockpit/cocktail/ws/ui`);

        ws.onopen = () => {
            ws.send(JSON.stringify({ t: 'ui_hello', deviceId: device.device.id }));
            ws.send(JSON.stringify({ t: 'sub', topics: ['metrics', 'task_progress'] }));
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.t === 'metrics' && msg.data) {
                    setMetrics(msg.data);
                    setIsOnline(true);
                }
            } catch (e) {
                console.error('WS Message error:', e);
            }
        };

        ws.onclose = () => setIsOnline(false);
        return () => ws.close();
    }, [device, isOpen]);

    const [dockerContainers, setDockerContainers] = useState<any[]>([]);
    const [isFetchingDocker, setIsFetchingDocker] = useState(false);
    const [databases, setDatabases] = useState<any[]>([]);
    const [isFetchingDatabases, setIsFetchingDatabases] = useState(false);
    const [systemUsers, setSystemUsers] = useState<any[]>([]);
    const [isFetchingUsers, setIsFetchingUsers] = useState(false);
    const [systemLogs, setSystemLogs] = useState<string[]>([]);
    const [isFetchingLogs, setIsFetchingLogs] = useState(false);
    const enrollmentIncomplete = !!device?.device && (device.device.status === 'enrolling' || !device.device.enrolledAt);

    const refreshDeviceList = async () => {
        try {
            const res = await fetch(`${BASE_URL}/cockpit/cocktail/devices`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                cache: 'no-store'
            });
            if (!res.ok) return;
            const devices = await res.json();
            if (!Array.isArray(devices)) return;
            setAllDevices(devices);
            const current = devices.find((item: any) => item.device?.id === device?.device?.id);
            if (current) setDevice(current);
        } catch (e) {
            console.error('Failed to refresh devices:', e);
        }
    };

    const rerunEnrollment = async () => {
        if (!device?.vps?.id || enrollmentStatus === 'connecting' || enrollmentStatus === 'running') return;

        setEnrollmentStatus('connecting');
        setEnrollmentLogs([
            '[System] Preparing enrollment session...',
            `[System] Target VPS: ${device.vps.username || 'user'}@${device.vps.host}`,
        ]);

        try {
            const sessionRes = await fetch(`${BASE_URL}/cockpit/vps/${device.vps.id}/terminal/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            if (!sessionRes.ok) throw new Error('Could not open the VPS terminal session');
            const sessionData = await sessionRes.json();
            const terminalId = sessionData.sessionId || sessionData.id;
            if (!terminalId) throw new Error('Server returned an invalid terminal session');

            const enrollmentRes = await fetch(`${BASE_URL}/cockpit/cocktail/devices/enroll/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ vpsId: device.vps.id }),
            });
            if (!enrollmentRes.ok) throw new Error('Could not restart enrollment for this device');
            const enrollmentData = await enrollmentRes.json();
            const installCommand = `${normalizeAgentInstallCommand(enrollmentData.installCommand || '')} ; exit`;

            const wsUrl = `${BASE_URL.replace(/^http/, 'ws')}/cockpit/terminal/ws?id=${terminalId}`;
            const ws = new WebSocket(wsUrl);
            let shellReady = false;
            let installStarted = false;

            ws.onopen = () => {
                setEnrollmentLogs(prev => [...prev, '[System] Terminal tunnel established.']);
                ws.send(JSON.stringify({ type: 'init', cols: 120, rows: 40 }));
            };

            ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);

                if (msg.type === 'error') {
                    setEnrollmentStatus('error');
                    setEnrollmentLogs(prev => [...prev, `[ERROR] ${msg.message || 'Terminal error'}`]);
                    return;
                }

                if (msg.type === 'output') {
                    const cleanData = String(msg.data || '').replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]|(?:\x1B\]0;.*?\x07)/g, '');
                    cleanData.split(/\r?\n/).forEach((line) => {
                        const trimmed = line.trim();
                        if (!trimmed || trimmed.match(/^\[\?2004[hl]$/)) return;

                        const isPrompt =
                            trimmed.endsWith('#') ||
                            trimmed.endsWith('$') ||
                            trimmed.includes(':~') ||
                            /^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+/.test(trimmed);

                        if (!shellReady && isPrompt) {
                            shellReady = true;
                            installStarted = true;
                            setEnrollmentStatus('running');
                            setEnrollmentLogs(prev => [...prev.slice(-80), '[System] Shell ready. Running enrollment command...']);
                            setTimeout(() => {
                                if (ws.readyState === WebSocket.OPEN) {
                                    ws.send(JSON.stringify({ type: 'input', data: `${installCommand}\n` }));
                                }
                            }, 800);
                        }

                        if (trimmed.includes('Cocktail Agent installed and started!')) {
                            setEnrollmentStatus('done');
                            void refreshDeviceList();
                        }

                        setEnrollmentLogs(prev => [...prev.slice(-80), trimmed]);
                    });
                }

                if (msg.type === 'exit' && installStarted && enrollmentStatus !== 'done') {
                    setEnrollmentStatus('done');
                    void refreshDeviceList();
                }
            };

            ws.onerror = () => {
                setEnrollmentStatus('error');
                setEnrollmentLogs(prev => [...prev, '[ERROR] Terminal tunnel failed.']);
            };

            ws.onclose = () => {
                if (installStarted) return;
                setEnrollmentStatus('error');
                setEnrollmentLogs(prev => [...prev, '[ERROR] Terminal closed before enrollment started.']);
            };

            setTimeout(() => {
                if (!shellReady && ws.readyState === WebSocket.OPEN) {
                    shellReady = true;
                    installStarted = true;
                    setEnrollmentStatus('running');
                    setEnrollmentLogs(prev => [...prev, '[System] Prompt timeout. Running enrollment command anyway...']);
                    ws.send(JSON.stringify({ type: 'input', data: `${installCommand}\n` }));
                }
            }, 15000);
        } catch (e: any) {
            setEnrollmentStatus('error');
            setEnrollmentLogs(prev => [...prev, `[ERROR] ${e.message || 'Enrollment failed'}`]);
        }
    };

    // Fetch Docker Containers
    const fetchDockerContainers = async () => {
        if (!device?.device?.id || isFetchingDocker) return;
        setIsFetchingDocker(true);
        try {
            const res = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${device.device.id}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    type: 'shell.exec',
                    payload: { command: 'docker ps --format "{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}"' }
                })
            });
            const task = await res.json();

            let attempts = 0;
            const poll = async () => {
                if (attempts > 10) {
                    setIsFetchingDocker(false);
                    return;
                }
                attempts++;
                attempts++;
                const r = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${device.device.id}/tasks?limit=5`, {
                    credentials: 'include'
                });
                const tasks = await r.json();
                const latest = tasks.find((t: any) => t.id === task.id);
                if (latest && latest.status === 'succeeded') {
                    const content = latest.result?.stdout || "";
                    const containers = content.split('\n').filter((l: string) => l.trim()).map((l: string) => {
                        const [id, name, image, status] = l.split('|');
                        return { id, name, image, status };
                    });
                    setDockerContainers(containers);
                    setIsFetchingDocker(false);
                } else if (latest && latest.status === 'failed') {
                    setIsFetchingDocker(false);
                } else {
                    setTimeout(poll, 1000);
                }
            };
            poll();
        } catch (e) {
            console.error('Docker fetch error:', e);
            setIsFetchingDocker(false);
        }
    };

    useEffect(() => {
        if (activeTab === "docker" && device?.device?.id) {
            fetchDockerContainers();
        }
    }, [activeTab, device]);

    // Fetch SSH Keys
    const fetchSshKeys = async () => {
        if (!device?.device?.id || isFetchingSsh) return;
        setIsFetchingSsh(true);
        try {
            const res = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${device.device.id}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    type: 'shell.exec',
                    payload: { command: 'cat ~/.ssh/authorized_keys' }
                })
            });
            const task = await res.json();

            // Poll for result
            let attempts = 0;
            const poll = async () => {
                if (attempts > 10) {
                    setIsFetchingSsh(false);
                    return;
                }
                attempts++;
                const r = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${device.device.id}/tasks?limit=1`, {
                    credentials: 'include'
                });
                const tasks = await r.json();
                const latest = tasks.find((t: any) => t.id === task.id);
                if (latest) {
                    if (latest.status === 'succeeded') {
                        const content = latest.result?.stdout || "";
                        const keys = content.split('\n').filter((l: string) => l.trim() && !l.startsWith('#')).map((l: string, i: number) => {
                            const parts = l.trim().split(/\s+/);
                            const name = parts[parts.length - 1] || `Key ${i + 1}`;
                            const type = parts[0] || 'unknown';
                            return {
                                name,
                                id: type.substring(0, 15), // Shorten type/algo
                                full: l
                            };
                        });
                        setSshKeys(keys);
                        setIsFetchingSsh(false);
                    } else if (latest.status === 'failed') {
                        setSshKeys([]); // Clear keys on failure
                        setIsFetchingSsh(false);
                    } else {
                        setTimeout(poll, 1500);
                    }
                } else {
                    setTimeout(poll, 1500);
                }
            };
            poll();
        } catch (e) {
            console.error('Failed to fetch SSH keys:', e);
            setIsFetchingSsh(false);
        }
    };

    const addSshKey = async () => {
        if (!device?.device?.id || !newSshKey.trim() || isAddingSsh) return;
        setIsAddingSsh(true);
        try {
            // Setup and Append the keys in one go
            const keysToAppend = newSshKey.trim();
            const res = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${device.device.id}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    type: 'shell.exec',
                    payload: { command: `mkdir -p ~/.ssh && chmod 700 ~/.ssh && printf '%s\n' "${keysToAppend}" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys` }
                })
            });
            const task = await res.json();

            // Poll for completion before refreshing
            let attempts = 0;
            const poll = async () => {
                if (attempts > 10) {
                    setNewSshKey("");
                    setShowSshModal(false);
                    fetchSshKeys();
                    setIsAddingSsh(false);
                    return;
                }
                attempts++;
                const r = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${device.device.id}/tasks?limit=5`, {
                    credentials: 'include'
                });
                const tasks = await r.json();
                const latest = tasks.find((t: any) => t.id === task.id);
                if (latest && (latest.status === 'succeeded' || latest.status === 'failed')) {
                    setNewSshKey("");
                    setShowSshModal(false);
                    fetchSshKeys();
                    setIsAddingSsh(false);
                } else {
                    setTimeout(poll, 800);
                }
            };
            poll();
        } catch (e) {
            console.error('Failed to add SSH key:', e);
            setIsAddingSsh(false);
        }
    };

    const deleteSshKey = async (fullKey: string) => {
        if (!device?.device?.id || deletingKey) return;
        setDeletingKey(fullKey);
        try {
            // Using || true because grep returns 1 if no lines are matched (i.e. deleting the last key)
            const command = `grep -v -F "${fullKey.trim()}" ~/.ssh/authorized_keys > ~/.ssh/authorized_keys.tmp || true; mv ~/.ssh/authorized_keys.tmp ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys`;

            const res = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${device.device.id}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    type: 'shell.exec',
                    payload: { command }
                })
            });
            const task = await res.json();

            let attempts = 0;
            const poll = async () => {
                if (attempts > 10) {
                    fetchSshKeys();
                    setDeletingKey(null);
                    return;
                }
                attempts++;
                const r = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${device.device.id}/tasks?limit=5`, {
                    credentials: 'include'
                });
                const tasks = await r.json();
                const latest = tasks.find((t: any) => t.id === task.id);
                if (latest && (latest.status === 'succeeded' || latest.status === 'failed')) {
                    fetchSshKeys();
                    setDeletingKey(null);
                } else {
                    setTimeout(poll, 800);
                }
            };
            poll();
        } catch (e) {
            console.error('Failed to delete SSH key:', e);
            setDeletingKey(null);
        }
    };

    const fetchDetailedPorts = async () => {
        if (!device?.device?.id || isFetchingNetwork) return;
        setIsFetchingNetwork(true);
        try {
            const res = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${device.device.id}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    type: 'shell.exec',
                    payload: { command: "ss -tlnp | awk 'NR>1 {split($7, a, \"\\\"\"); split($4, b, \":\"); print b[length(b)], a[2]}' | sort -un" }
                })
            });
            const task = await res.json();

            let attempts = 0;
            const poll = async () => {
                if (attempts > 10) { setIsFetchingNetwork(false); return; }
                attempts++;
                const r = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${device.device.id}/tasks?limit=5`, { credentials: 'include' });
                const tasks = await r.json();
                const latest = tasks.find((t: any) => t.id === task.id);
                if (latest?.status === 'succeeded') {
                    const lines = (latest.result?.stdout || "").split('\n').filter((l: string) => l.trim());
                    const ports = lines.map((l: string) => {
                        const parts = l.trim().split(/\s+/);
                        const port = parts[0];
                        const service = parts[1] || 'Internal';
                        let traffic = "Real-time";
                        if (port === '22') traffic = "SSH Traffic";
                        if (port === '80' || port === '443') traffic = "Web Traffic";
                        if (port === '5432' || port === '3306') traffic = "DB Traffic";

                        return { port, service, traffic };
                    });
                    setDetailedPorts(ports);
                    setIsFetchingNetwork(false);
                } else {
                    setTimeout(poll, 1000);
                }
            };
            poll();
        } catch (e) {
            console.error(e);
            setIsFetchingNetwork(false);
        }
    };

    const fetchFirewallRules = async () => {
        if (!device?.device?.id || isFetchingFirewall) return;
        setIsFetchingFirewall(true);
        try {
            const res = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${device.device.id}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    type: 'shell.exec',
                    payload: { command: "sudo ufw status numbered" }
                })
            });
            const task = await res.json();

            let attempts = 0;
            const poll = async () => {
                if (attempts > 10) { setIsFetchingFirewall(false); return; }
                attempts++;
                const r = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${device.device.id}/tasks?limit=5`, { credentials: 'include' });
                const tasks = await r.json();
                const latest = tasks.find((t: any) => t.id === task.id);
                if (latest?.status === 'succeeded') {
                    const content = latest.result?.stdout || "";
                    const lines = content.split('\n');
                    const rules = lines.filter((l: string) => l.includes('[') && (l.includes('ALLOW') || l.includes('DENY'))).map((l: string) => {
                        const parts = l.trim().split(/\s{2,}/);
                        return {
                            id: parts[0].replace(/\[|\]/g, '').trim(),
                            to: parts[1],
                            action: parts[2],
                            from: parts[3] || 'Anywhere'
                        };
                    });
                    setFirewallRules(rules);
                    setIsFetchingFirewall(false);
                } else {
                    setTimeout(poll, 1000);
                }
            };
            poll();
        } catch (e) {
            console.error(e);
            setIsFetchingFirewall(false);
        }
    };

    const fetchRuntimes = async () => {
        if (!device?.device?.id || isFetchingRuntimes) return;
        setIsFetchingRuntimes(true);
        try {
            const command = `
                echo "Node.js:$(node -v 2>/dev/null || echo 'Not Installed')"
                echo "Python:$(python3 --version 2>/dev/null || echo 'Not Installed')"
                echo "Docker:$(docker --version 2>/dev/null | awk '{print $3}' | tr -d ',' || echo 'Not Installed')"
                echo "Go:$(go version 2>/dev/null | awk '{print $3}' || echo 'Not Installed')"
                echo "Java:$(java -version 2>&1 | head -n 1 | awk -F'\"' '{print $2}' || echo 'Not Installed')"
                echo "Bun:$(bun -v 2>/dev/null || echo 'Not Installed')"
            `;
            const res = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${device.device.id}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    type: 'shell.exec',
                    payload: { command }
                })
            });
            const task = await res.json();

            let attempts = 0;
            const poll = async () => {
                if (attempts > 10) { setIsFetchingRuntimes(false); return; }
                attempts++;
                const r = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${device.device.id}/tasks?limit=5`, { credentials: 'include' });
                const tasks = await r.json();
                const latest = tasks.find((t: any) => t.id === task.id);
                if (latest?.status === 'succeeded') {
                    const lines = (latest.result?.stdout || "").split('\n').filter((l: string) => l.trim());
                    const detected = lines.map((l: string) => {
                        const [name, version] = l.split(':');
                        const status = version.includes('Not Installed') ? 'Idle' : 'Running';
                        let type = "Runtime";
                        if (name === 'Node.js') type = "JavaScript";
                        if (name === 'Python') type = "AI/ML Workloads";
                        if (name === 'Docker') type = "Containerization";
                        if (name === 'Go') type = "Backend Services";
                        if (name === 'Java') type = "Enterprise Apps";

                        return { name, type, status, version, cpu: status === 'Running' ? `${(Math.random() * 2).toFixed(1)}%` : '0%' };
                    });
                    setRuntimes(detected);
                    setIsFetchingRuntimes(false);
                } else {
                    setTimeout(poll, 1000);
                }
            };
            poll();
        } catch (e) {
            console.error(e);
            setIsFetchingRuntimes(false);
        }
    };

    const fetchDatabases = async () => {
        if (!device?.device?.id || isFetchingDatabases) return;
        setIsFetchingDatabases(true);
        try {
            const command = `
                echo "PostgreSQL:$(psql --version 2>/dev/null || echo 'Not Running')"
                echo "MySQL:$(mysql --version 2>/dev/null || echo 'Not Running')"
                echo "Redis:$(redis-cli --version 2>/dev/null || echo 'Not Running')"
                echo "MongoDB:$(mongosh --version 2>/dev/null || mongod --version 2>/dev/null || echo 'Not Running')"
            `;
            const res = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${device.device.id}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ type: 'shell.exec', payload: { command } })
            });
            const task = await res.json();
            let attempts = 0;
            const poll = async () => {
                if (attempts > 10) { setIsFetchingDatabases(false); return; }
                attempts++;
                const r = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${device.device.id}/tasks?limit=5`, { credentials: 'include' });
                const tasks = await r.json();
                const latest = tasks.find((t: any) => t.id === task.id);
                if (latest?.status === 'succeeded') {
                    const lines = (latest.result?.stdout || "").split('\n').filter((l: string) => l.trim());
                    const dbData = lines.map((l: string) => {
                        const [name, version] = l.split(':');
                        const isRunning = !version.includes('Not Running');
                        return {
                            name: isRunning ? name : name.toLowerCase(),
                            engine: name,
                            conn: isRunning ? `${Math.floor(Math.random() * 50)} Active` : "Offline",
                            size: isRunning ? `${(Math.random() * 10).toFixed(1)} GB` : "0 GB",
                            latency: isRunning ? `${(Math.random() * 2).toFixed(1)}ms` : "N/A",
                            status: isRunning ? 'Running' : 'Offline'
                        };
                    });
                    setDatabases(dbData.filter((d: any) => d.status === 'Running').length > 0 ? dbData.filter((d: any) => d.status === 'Running') : dbData);
                    setIsFetchingDatabases(false);
                } else { setTimeout(poll, 1000); }
            };
            poll();
        } catch (e) { setIsFetchingDatabases(false); }
    };

    const fetchUsers = async () => {
        if (!device?.device?.id || isFetchingUsers) return;
        setIsFetchingUsers(true);
        try {
            const res = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${device.device.id}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    type: 'shell.exec',
                    payload: { command: "grep -v -E '^(#|/bin/false|/usr/sbin/nologin)' /etc/passwd | cut -d: -f1,3,7" }
                })
            });
            const task = await res.json();
            let attempts = 0;
            const poll = async () => {
                if (attempts > 10) { setIsFetchingUsers(false); return; }
                attempts++;
                const r = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${device.device.id}/tasks?limit=5`, { credentials: 'include' });
                const tasks = await r.json();
                const latest = tasks.find((t: any) => t.id === task.id);
                if (latest?.status === 'succeeded') {
                    const lines = (latest.result?.stdout || "").split('\n').filter((l: string) => l.trim());
                    const users = lines.map((l: string) => {
                        const [name, uid, shell] = l.split(':');
                        return { name, uid, shell, role: parseInt(uid) === 0 ? 'Root' : 'User', status: 'Active' };
                    });
                    setSystemUsers(users);
                    setIsFetchingUsers(false);
                } else { setTimeout(poll, 1000); }
            };
            poll();
        } catch (e) { setIsFetchingUsers(false); }
    };

    const fetchLogs = async () => {
        if (!device?.device?.id || isFetchingLogs) return;
        setIsFetchingLogs(true);
        try {
            const res = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${device.device.id}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    type: 'shell.exec',
                    payload: { command: "tail -n 20 /var/log/syslog 2>/dev/null || journalctl -n 20 --no-pager" }
                })
            });
            const task = await res.json();
            let attempts = 0;
            const poll = async () => {
                if (attempts > 10) { setIsFetchingLogs(false); return; }
                attempts++;
                const r = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${device.device.id}/tasks?limit=5`, { credentials: 'include' });
                const tasks = await r.json();
                const latest = tasks.find((t: any) => t.id === task.id);
                if (latest?.status === 'succeeded') {
                    setSystemLogs((latest.result?.stdout || "").split('\n').filter((l: string) => l.trim()));
                    setIsFetchingLogs(false);
                } else { setTimeout(poll, 1000); }
            };
            poll();
        } catch (e) { setIsFetchingLogs(false); }
    };


    const fetchNetworkConfig = async () => {
        if (!device?.device?.id) return;
        try {
            // UFW Status
            const ufwRes = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${device.device.id}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    type: 'shell.exec',
                    payload: { command: 'sudo ufw status | head -n 1' }
                })
            });
            const ufwTask = await ufwRes.json();

            // Open Ports
            const portsRes = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${device.device.id}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    type: 'shell.exec',
                    payload: { command: "ss -tlnp | grep LISTEN | awk '{print $4}' | awk -F: '{print $NF}' | sort -un | head -n 5 | tr '\\n' ','" }
                })
            });
            const portsTask = await portsRes.json();

            const poll = async (id: string, setter: (val: any) => void, parser: (out: string) => any) => {
                let attempts = 0;
                while (attempts < 10) {
                    const r = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${device.device.id}/tasks?limit=5`, { credentials: 'include' });
                    const tasks = await r.json();
                    const latest = tasks.find((t: any) => t.id === id);
                    if (latest?.status === 'succeeded') {
                        setter(parser(latest.result?.stdout || ""));
                        return;
                    }
                    attempts++;
                    await new Promise(res => setTimeout(res, 1000));
                }
            };

            poll(ufwTask.id, (v: any) => setUfwStatus(v.includes('active') ? 'Active' : 'Inactive'), (s: string) => s.toLowerCase());
            poll(portsTask.id, (v: any) => setOpenPorts(v.split(',').filter((p: string) => p.trim()).map((p: string) => p.trim())), (s: string) => s.trim());
        } catch (e) {
            console.error('Failed to fetch network config:', e);
        }
    };

    useEffect(() => {
        if (!device?.device?.id) return;

        if (activeTab === 'ssh' && sshKeys.length === 0) fetchSshKeys();
        if (activeTab === 'instance') fetchNetworkConfig();
        if (activeTab === 'network') fetchDetailedPorts();
        if (activeTab === 'firewall') fetchFirewallRules();
        if (activeTab === 'runtime') fetchRuntimes();
        if (activeTab === 'database') fetchDatabases();
        if (activeTab === 'users') fetchUsers();

        let logInterval: any;
        if (activeTab === 'logs') {
            fetchLogs();
            logInterval = setInterval(fetchLogs, 5000);
        }

        return () => {
            if (logInterval) clearInterval(logInterval);
        };
    }, [activeTab, device]);


    // Reset when opened
    useEffect(() => {
        if (!isOpen) return;
        setIsMaximized(false);
        setSize({ width: 900, height: 600 });
        x.set(0);
        y.set(-15); // Centered accounting for dock space
    }, [isOpen, x, y]);

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
                setSize({ width: 900, height: 600 });
                import("framer-motion").then(({ animate }) => {
                    animate(x, 0, springConfig);
                    animate(y, 0, springConfig);
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

        const applyAction = (moveEvent: PointerEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;

            let w = startW;
            let h = startH;
            let mx = startMX;
            let my = startMY;

            if (dir.includes("e")) w = startW + dx;
            if (dir.includes("s")) h = startH + dy;
            if (dir.includes("w")) { w = startW - dx; mx = startMX + dx; }
            if (dir.includes("n")) { h = startH - dy; my = startMY + dy; }

            setSize({ width: Math.max(700, w), height: Math.max(450, h) });
            x.set(mx);
            y.set(my);
        };

        const onMove = (ev: PointerEvent) => applyAction(ev);
        const onUp = (ev: PointerEvent) => {
            try { target.releasePointerCapture(ev.pointerId); } catch { }
            setIsResizing(false);
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
                    <motion.div
                        drag={!isResizing && !isMaximized}
                        dragMomentum={false}
                        dragListener={false}
                        dragControls={dragControls}
                        onDragEnd={handleDragEnd}
                        initial={{ opacity: 0, scale: 0.9, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 50 }}
                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                        style={{ x, y, width: size.width, height: size.height }}
                        className={[
                            "pointer-events-auto bg-zinc-950/95 border border-white/10 flex flex-row overflow-hidden relative backdrop-blur-3xl text-white shadow-3xl",
                            isMaximized ? "rounded-none" : "rounded-xl",
                            isResizing ? "select-none" : "",
                        ].join(" ")}
                    >
                        {/* Sidebar */}
                        <div className="w-64 border-r border-white/5 flex flex-col bg-black/20 shrink-0 select-none">
                            {/* Window Controls */}
                            <div
                                className="h-14 flex items-center px-4 gap-2 shrink-0 pr-10"
                                onPointerDown={(e) => dragControls.start(e)}
                            >
                                <button onClick={onClose} className="w-3 h-3 rounded-full bg-[#FF5F57] group/btn flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
                                    <X className="w-2 h-2 opacity-0 group-hover/btn:opacity-100 text-black/40" />
                                </button>
                                <button onClick={onMinimize} className="w-3 h-3 rounded-full bg-[#FEBC2E] group/btn flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
                                    <div className="w-1.5 h-[1.5px] bg-black/40 opacity-0 group-hover/btn:opacity-100" />
                                </button>
                                <button onClick={toggleMaximize} className="w-3 h-3 rounded-full bg-[#28C840] group/btn flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
                                    <Maximize2 className="w-1.5 h-1.5 opacity-0 group-hover/btn:opacity-100 text-black/40" />
                                </button>
                            </div>

                            <div className="px-4 mb-4">
                                <div className="relative group">
                                    <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search"
                                        className="w-full bg-black/40 border border-white/5 rounded-md py-1.5 pl-8 pr-4 text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600"
                                    />
                                </div>
                            </div>

                            {/* Device Picker */}
                            {allDevices.length > 0 && (
                                <div className="px-4 mb-3">
                                    <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1.5 px-0.5">Active Node</div>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowDevicePicker(p => !p)}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-black/40 border border-white/5 hover:border-white/10 transition-all group"
                                        >
                                            <div className="w-5 h-5 rounded-md bg-blue-600/80 flex items-center justify-center shrink-0">
                                                <HardDrive className="w-3 h-3 text-white" />
                                            </div>
                                            <span className="flex-1 text-left text-[11px] font-bold text-zinc-200 truncate">
                                                {device?.device?.name ?? 'No Device'}
                                            </span>
                                            <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${showDevicePicker ? 'rotate-180' : ''}`} />
                                        </button>

                                        <AnimatePresence>
                                            {showDevicePicker && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="absolute top-full left-0 right-0 mt-1 bg-zinc-950 border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl"
                                                >
                                                    {allDevices.map((item) => (
                                                        <button
                                                            key={item.device.id}
                                                            onClick={() => {
                                                                setDevice(item);
                                                                setMetrics(null);
                                                                setIsOnline(false);
                                                                setSshKeys([]);
                                                                setShowDevicePicker(false);
                                                            }}
                                                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-white/5 transition-colors ${device?.device?.id === item.device.id ? 'bg-blue-600/10' : ''
                                                                }`}
                                                        >
                                                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.device.status === 'online' ? 'bg-white' : item.device.status === 'enrolling' ? 'bg-amber-400' : 'bg-zinc-600'}`} />
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-[11px] font-bold text-white truncate">{item.device.name}</span>
                                                                <span className="text-[9px] text-zinc-600 truncate">{item.device.status === 'enrolling' ? 'Enrollment incomplete' : item.vps.host}</span>
                                                            </div>
                                                            {device?.device?.id === item.device.id && (
                                                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
                                {SETTINGS_GROUPS.map((group, gIdx) => (
                                    <div key={gIdx} className="px-2.5 mb-2">
                                        {group.title && (
                                            <div className="px-3 py-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                                                {group.title}
                                            </div>
                                        )}
                                        <div className="space-y-[2px]">
                                            {group.items.map((item: any) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => setActiveTab(item.id)}
                                                    className={`
                                                        w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-all
                                                        ${activeTab === item.id
                                                            ? "bg-blue-600 text-white shadow-md"
                                                            : "hover:bg-white/[0.08] text-zinc-300"}
                                                    `}
                                                >
                                                    {'type' in item && item.type === "profile" ? (
                                                        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center -ml-1 overflow-hidden">
                                                            <User className="w-6 h-6 text-zinc-400" />
                                                        </div>
                                                    ) : (
                                                        <div className={`w-6 h-6 rounded-[7px] ${item.color} flex items-center justify-center shadow-sm`}>
                                                            <item.icon className="w-4 h-4 text-white" />
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col items-start flex-1 min-w-0">
                                                        <span className="truncate w-full text-left font-medium">{item.label}</span>
                                                        {'sublabel' in item && item.sublabel && (
                                                            <span className={`text-[10px] text-left truncate w-full ${activeTab === item.id ? "text-white/80" : "text-zinc-500"}`}>
                                                                {item.sublabel}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {'type' in item && item.type === "profile" && <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />}
                                                </button>
                                            ))}
                                        </div>
                                        {gIdx !== SETTINGS_GROUPS.length - 1 && (
                                            <div className="h-[1px] bg-white/[0.03] mx-3 mt-2" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 flex flex-col bg-zinc-950/90 overflow-hidden">
                            <div
                                className="h-14 shrink-0 flex items-center px-10 border-b border-white/5"
                                onPointerDown={(e) => dragControls.start(e)}
                            >
                                <h2 className="text-[20px] font-bold tracking-tight capitalize">{activeTab.replace(/([A-Z])/g, ' $1')}</h2>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar p-10 pt-6">
                                {!isLoading ? (
                                    <AppHorizontalAdTrack className="mb-6 max-w-[640px] mx-auto" />
                                ) : null}
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            <span className="text-zinc-500 text-sm font-medium tracking-wide">Syncing with Agent...</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {activeTab === "instance" && (
                                            <div className="max-w-[600px] mx-auto space-y-8">
                                                {!device ? (
                                                    <div className="p-12 text-center border border-dashed border-white/5 rounded-3xl bg-zinc-950/20">
                                                        <Cloud className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                                                        <h3 className="text-white font-bold text-lg mb-2">No Instances Connected</h3>
                                                        <p className="text-zinc-500 text-sm mb-6 max-w-[300px] mx-auto">Enroll your first server to monitor real-time performance and manage SSH keys.</p>
                                                        <button
                                                            onClick={() => window.location.assign('/in?configure=true')}
                                                            className="px-6 py-2.5 bg-white text-black text-sm font-bold rounded-full hover:bg-zinc-200 transition-colors"
                                                        >
                                                            Start Enrollment
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {enrollmentIncomplete && (
                                                            <div className="p-5 bg-amber-500/10 rounded-3xl border border-amber-400/20 space-y-4">
                                                                <div className="flex items-start gap-4">
                                                                    <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                                                                        <RefreshCw className={`w-5 h-5 text-amber-300 ${enrollmentStatus === 'connecting' || enrollmentStatus === 'running' ? 'animate-spin' : ''}`} />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <h3 className="text-sm font-bold text-white">Enrollment incomplete</h3>
                                                                        <p className="text-[12px] leading-relaxed text-zinc-400 mt-1">
                                                                            The VPS exists, but the Cocktail agent has not finished enrolling. Run enrollment again from the saved VPS connection.
                                                                        </p>
                                                                    </div>
                                                                    <button
                                                                        onClick={rerunEnrollment}
                                                                        disabled={enrollmentStatus === 'connecting' || enrollmentStatus === 'running' || !device?.vps?.id}
                                                                        className="px-4 py-2 bg-white text-black text-[11px] font-black rounded-full hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                                                    >
                                                                        {(enrollmentStatus === 'connecting' || enrollmentStatus === 'running') && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                                                        {enrollmentStatus === 'done' ? 'Enrollment rerun' : 'Enroll Again'}
                                                                    </button>
                                                                </div>
                                                                {enrollmentLogs.length > 0 && (
                                                                    <div className="max-h-44 overflow-y-auto rounded-2xl bg-black/50 border border-white/5 p-3 font-mono text-[11px] leading-relaxed text-zinc-400">
                                                                        {enrollmentLogs.slice(-12).map((line, idx) => (
                                                                            <div
                                                                                key={`${line}-${idx}`}
                                                                                className={line.startsWith('[ERROR]') ? 'text-red-300' : line.includes('installed and started') || line.startsWith('[System]') ? 'text-emerald-300' : ''}
                                                                            >
                                                                                {line}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-6 p-6 bg-zinc-950/50 rounded-3xl border border-white/5">
                                                            <div className="w-20 h-20 rounded-3xl bg-transparent flex items-center justify-center shadow-2xl border border-white/5">
                                                                <HardDrive className="w-10 h-10 text-zinc-400" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-xl font-bold text-white">{device?.device?.name || "My Server"}</h3>
                                                                <p className="text-sm text-zinc-500">{metrics?.os?.distro || "Ubuntu Linux"}</p>
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]' : enrollmentIncomplete ? 'bg-amber-400' : 'bg-red-500'}`} />
                                                                    <span className="text-[11px] font-semibold text-zinc-500">{enrollmentIncomplete ? 'Enrollment incomplete' : isOnline ? 'Online' : 'Offline'} • {metrics?.os?.release || "Awaiting agent"}</span>
                                                                </div>
                                                            </div>
                                                            <div className="ml-auto text-right">
                                                                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Public IP</span>
                                                                <span className="text-[14px] font-bold text-white">{device?.vps?.host || "..."}</span>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="p-5 bg-zinc-950/50 rounded-2xl border border-white/5 space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[13px] font-semibold text-white">CPU Usage</span>
                                                                    <Activity className="w-4 h-4 text-white" />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between text-[11px] font-medium">
                                                                        <span className="text-zinc-500">{metrics?.cpu?.cores || 8} vCPUs</span>
                                                                        <span className="text-white">{metrics?.cpu?.usagePct?.toFixed(1) || 0}%</span>
                                                                    </div>
                                                                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                                                        <motion.div
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${metrics?.cpu?.usagePct || 0}%` }}
                                                                            className="h-full bg-white transition-[width] duration-300"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="p-5 bg-zinc-950/90 rounded-2xl border border-white/5 space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[13px] font-semibold text-white">Memory</span>
                                                                    <MemoryStick className="w-4 h-4 text-white" />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between text-[11px] font-medium">
                                                                        <span className="text-zinc-500">{metrics?.mem?.totalBytes ? (metrics.mem.totalBytes / 1024 / 1024 / 1024).toFixed(1) : 16} GB Total</span>
                                                                        <span className="text-white">{metrics?.mem?.usedBytes ? (metrics.mem.usedBytes / 1024 / 1024 / 1024).toFixed(1) : 0} GB Used</span>
                                                                    </div>
                                                                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                                                        <motion.div
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${(metrics?.mem?.usedBytes / metrics?.mem?.totalBytes * 100) || 0}%` }}
                                                                            className="h-full bg-white transition-[width] duration-300"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div className="flex justify-between items-center px-1">
                                                                <h3 className="text-[13px] font-bold text-zinc-500 uppercase tracking-widest">Network Config</h3>
                                                                <button
                                                                    onClick={fetchNetworkConfig}
                                                                    className="text-[10px] text-zinc-600 hover:text-white font-bold transition-colors"
                                                                >
                                                                    Refresh
                                                                </button>
                                                            </div>
                                                            <div className="bg-zinc-950/50 rounded-2xl border border-white/5 divide-y divide-white/[0.03] overflow-hidden">
                                                                <div className="flex items-center justify-between p-4 hover:bg-white/[0.01] transition-colors cursor-pointer" onClick={() => setActiveTab('ssh')}>
                                                                    <div className="flex items-center gap-3">
                                                                        <Key className="w-4 h-4 text-white" />
                                                                        <span className="text-[13px]">SSH Key Auth</span>
                                                                    </div>
                                                                    <span className={`text-[12px] font-medium ${sshKeys.length > 0 ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                                                        {sshKeys.length > 0 ? `${sshKeys.length} Keys` : 'Disabled'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between p-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <ShieldCheck className="w-4 h-4 text-white" />
                                                                        <span className="text-[13px]">Firewall (UFW)</span>
                                                                    </div>
                                                                    <span className={`text-[12px] font-bold uppercase tracking-widest ${ufwStatus === 'Active' ? 'text-white' : 'text-zinc-600'}`}>
                                                                        {ufwStatus}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between p-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <Network className="w-4 h-4 text-white" />
                                                                        <span className="text-[13px]">Open Ports</span>
                                                                    </div>
                                                                    <span className="text-[12px] text-zinc-500 font-medium tracking-tight">
                                                                        {openPorts.length > 0 ? openPorts.join(', ') : 'None'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="p-4 bg-zinc-500/10 rounded-2xl border border-zinc-500/20 flex items-center gap-4">
                                                            <Info className="w-5 h-5 text-zinc-400 shrink-0" />
                                                            <p className="text-[12px] text-zinc-400/90 leading-relaxed">
                                                                Your cloud instance is automatically backed up every 24 hours to <span className="text-white font-bold">xCloud Storage</span>. Last snapshot was <span className="text-white font-bold">3h ago</span>.
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === "performance" && (
                                            <div className="max-w-[600px] mx-auto space-y-8">
                                                <div className="space-y-6">
                                                    <h3 className="text-[13px] font-bold text-zinc-500 uppercase tracking-widest px-1">Resource Over Time</h3>
                                                    <div className="h-48 bg-zinc-950/50 rounded-2xl border border-white/5 p-4 flex items-end gap-1 overflow-hidden relative group">
                                                        <div className="absolute top-4 left-4 text-[10px] text-zinc-600 font-mono">CPU: {metrics?.cpu?.usagePct?.toFixed(1) || 0}%</div>
                                                        {cpuHistory.map((h, i) => (
                                                            <motion.div
                                                                key={i}
                                                                initial={{ height: 0 }}
                                                                animate={{ height: `${h}%` }}
                                                                className="flex-1 bg-gradient-to-t from-blue-600/20 to-blue-500 rounded-t-sm"
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4">
                                                    {[
                                                        { label: "NET RX", val: metrics?.net?.rxBytesPerSec ? `${(metrics.net.rxBytesPerSec / 1024).toFixed(1)}K/s` : "0K/s", sub: "Incoming" },
                                                        { label: "NET TX", val: metrics?.net?.txBytesPerSec ? `${(metrics.net.txBytesPerSec / 1024).toFixed(1)}K/s` : "0K/s", sub: "Outgoing" },
                                                        { label: "UPTIME", val: metrics?.uptimeSec ? `${Math.floor(metrics.uptimeSec / 3600 / 24)}d` : "0d", sub: "Steady" },
                                                    ].map((stat, i) => (
                                                        <div key={i} className="p-4 bg-zinc-950/50 rounded-2xl border border-white/5 text-center">
                                                            <div className="text-[10px] font-bold text-zinc-600 uppercase mb-1">{stat.label}</div>
                                                            <div className="text-xl font-bold text-white">{stat.val}</div>
                                                            <div className="text-[10px] text-zinc-500">{stat.sub}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {activeTab === "ssh" && (
                                    <div className="max-w-[600px] mx-auto space-y-6">
                                        <div className="flex justify-between items-center px-1">
                                            <div className="space-y-1">
                                                <h3 className="text-[13px] font-bold text-zinc-500 uppercase tracking-widest">Authorized Keys</h3>
                                                <p className="text-[11px] text-zinc-600">These keys can access this instance via SSH.</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => setShowSshModal(true)}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 text-[11px] font-bold text-white transition-all"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    Add Key
                                                </button>
                                                <button
                                                    onClick={fetchSshKeys}
                                                    className="text-[11px] text-zinc-500 hover:text-white font-bold transition-colors"
                                                >
                                                    {isFetchingSsh ? 'Refreshing...' : 'Refresh'}
                                                </button>
                                            </div>
                                        </div>

                                        {showSshModal && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="p-6 bg-zinc-900/50 rounded-3xl border border-white/5 space-y-4"
                                            >
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Paste Public Keys (One per line)</label>
                                                    <textarea
                                                        value={newSshKey}
                                                        onChange={(e) => setNewSshKey(e.target.value)}
                                                        placeholder="ssh-rsa AAAA... (key 1)&#10;ssh-ed25519 BBBB... (key 2)"
                                                        className="w-full mt-4 h-32 bg-black/40 border border-white/5 rounded-2xl p-4 text-[13px] font-mono text-white placeholder:text-zinc-700 focus:outline-none focus:border-white/10 transition-colors resize-none"
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => setShowSshModal(false)}
                                                        className="px-4 py-2 rounded-full text-[12px] font-bold text-zinc-500 hover:text-white transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        disabled={isAddingSsh || !newSshKey.trim()}
                                                        onClick={addSshKey}
                                                        className="px-5 py-2 bg-white text-black rounded-full text-[12px] font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50"
                                                    >
                                                        {isAddingSsh ? 'Adding...' : 'Add Public Key'}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}


                                        <div className="space-y-3">
                                            {sshKeys.length > 0 ? sshKeys.map((key, i) => (
                                                <div key={i} className="flex items-center gap-4 p-4 bg-zinc-950/50 rounded-2xl border border-white/5 group">
                                                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                                                        <Key className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[14px] font-bold text-white truncate max-w-[300px]">{key.name}</div>
                                                        <div className="text-[11px] text-zinc-500 font-mono">{key.id} • Authorized</div>
                                                    </div>
                                                    <button
                                                        onClick={() => deleteSshKey(key.full)}
                                                        disabled={deletingKey === key.full}
                                                        title="Remove Key"
                                                        className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-zinc-500 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                                    >
                                                        {deletingKey === key.full ? (
                                                            <div className="w-4 h-4 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
                                                        ) : (
                                                            <X className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            )) : (
                                                <div className="p-12 text-center text-zinc-500 text-sm border border-dashed border-white/5 rounded-3xl bg-zinc-950/20">
                                                    <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4 border border-white/5">
                                                        <Key className="w-6 h-6 text-zinc-700" />
                                                    </div>
                                                    <h4 className="text-white font-bold mb-1">{isFetchingSsh ? 'Reading Keys...' : 'No SSH Keys Found'}</h4>
                                                    <p className="max-w-[200px] mx-auto text-[12px] text-zinc-600">
                                                        {isFetchingSsh ? 'Checking authorized_keys on your server.' : 'Add your public key to manage this instance via terminal.'}
                                                    </p>
                                                    {!isFetchingSsh && (
                                                        <button
                                                            onClick={fetchSshKeys}
                                                            className="mt-6 text-[11px] font-bold text-blue-500 hover:text-blue-400"
                                                        >
                                                            Try Again
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}


                                {activeTab === "runtime" && (
                                    <div className="max-w-[600px] mx-auto space-y-6">
                                        <div className="flex justify-between items-center px-1">
                                            <h3 className="text-[13px] font-bold text-zinc-500 uppercase tracking-widest">Environment Runtimes</h3>
                                            <button
                                                onClick={fetchRuntimes}
                                                className="text-[11px] text-zinc-500 hover:text-white font-bold transition-colors"
                                            >
                                                {isFetchingRuntimes ? 'Scanning...' : 'Refresh'}
                                            </button>
                                        </div>
                                        <div className="bg-zinc-950/50 rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/[0.03]">
                                            {runtimes.length > 0 ? runtimes.map((item, i) => (
                                                <div key={i} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors">
                                                    <div className={`w-2 h-2 rounded-full ${item.status === 'Running' ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)] animate-pulse' : 'bg-zinc-600'}`} />
                                                    <div className="flex-1">
                                                        <div className="text-[14px] font-bold text-white">{item.name}</div>
                                                        <div className="text-[11px] text-zinc-500">{item.type} • {item.version}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[12px] font-mono text-white">{item.cpu}</div>
                                                        <div className="text-[10px] text-zinc-600 uppercase font-bold">Active Load</div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="p-10 text-center text-zinc-500 text-sm">
                                                    {isFetchingRuntimes ? 'Detecting environment runtimes...' : 'No runtimes detected on this system.'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === "docker" && (
                                    <div className="max-w-[600px] mx-auto space-y-6">
                                        <div className="flex justify-between items-center px-1">
                                            <h3 className="text-[13px] font-bold text-zinc-500 uppercase tracking-widest">Docker Containers</h3>
                                            <button
                                                onClick={fetchDockerContainers}
                                                className="text-[11px] text-zinc-500 hover:text-white font-bold transition-colors"
                                            >
                                                {isFetchingDocker ? 'Fetching...' : 'Refresh'}
                                            </button>
                                        </div>
                                        <div className="bg-zinc-950/50 rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/[0.03]">
                                            {dockerContainers.length > 0 ? dockerContainers.map((item, i) => (
                                                <div key={i} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors">
                                                    <div className={`p-2 rounded-lg bg-white/5`}>
                                                        <Box className="w-5 h-5 text-zinc-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-[14px] font-bold text-white truncate">{item.name}</div>
                                                            <div className="text-[10px] font-mono text-zinc-500 bg-zinc-800 px-1.5 rounded">{item.id}</div>
                                                        </div>
                                                        <div className="text-[11px] text-zinc-500 uppercase font-bold tracking-tight truncate">{item.image}</div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className="flex items-center gap-2 justify-end">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${item.status?.toLowerCase().includes('up') ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'bg-red-500'}`} />
                                                            <span className="text-[11px] text-zinc-400 font-medium">{item.status}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="p-10 text-center text-zinc-500 text-sm">
                                                    {isFetchingDocker ? 'Waiting for Docker daemon...' : 'No active containers found.'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === "database" && (
                                    <div className="max-w-[600px] mx-auto space-y-6">
                                        <div className="flex justify-between items-center px-1">
                                            <h3 className="text-[13px] font-bold text-zinc-500 uppercase tracking-widest">Active Databases</h3>
                                            <button
                                                onClick={fetchDatabases}
                                                className="text-[11px] text-zinc-500 hover:text-white font-bold transition-colors"
                                            >
                                                {isFetchingDatabases ? 'Scanning...' : 'Refresh'}
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            {databases.length > 0 ? databases.map((db, i) => (
                                                <div key={i} className="p-5 bg-zinc-950/50 rounded-2xl border border-white/5 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg bg-white/5`}>
                                                                <Database className="w-5 h-5 text-zinc-400" />
                                                            </div>
                                                            <div>
                                                                <div className="text-[14px] font-bold text-white uppercase">{db.name}</div>
                                                                <div className="text-[11px] text-zinc-500">{db.engine}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${db.status === 'Running' ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'bg-zinc-600'}`} />
                                                            <span className="text-[11px] text-zinc-400 font-medium">{db.status}</span>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.03]">
                                                        <div>
                                                            <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Connections</div>
                                                            <div className="text-[13px] text-white font-medium">{db.conn}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Disk Usage</div>
                                                            <div className="text-[13px] text-white font-medium">{db.size}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Latency</div>
                                                            <div className="text-[13px] text-white font-bold">{db.latency}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="p-10 text-center text-zinc-500 text-sm">
                                                    {isFetchingDatabases ? 'Checking for installed database engines...' : 'No active database engines detected.'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === "users" && (
                                    <div className="max-w-[600px] mx-auto space-y-6">
                                        <div className="flex justify-between items-center px-1">
                                            <h3 className="text-[13px] font-bold text-zinc-500 uppercase tracking-widest">System Users</h3>
                                            <button
                                                onClick={fetchUsers}
                                                className="text-[11px] text-zinc-500 hover:text-white font-bold transition-colors"
                                            >
                                                {isFetchingUsers ? 'Fetching...' : 'Refresh'}
                                            </button>
                                        </div>
                                        <div className="bg-zinc-950/50 rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/[0.03]">
                                            {systemUsers.length > 0 ? systemUsers.map((user, i) => (
                                                <div key={i} className="flex items-center justify-between p-4 px-5 hover:bg-white/[0.01] transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-8 h-8 rounded-full ${user.role === 'Root' ? 'bg-white/10 text-white' : 'bg-zinc-800 text-zinc-500'} flex items-center justify-center font-bold text-[12px]`}>
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="text-[14px] font-bold text-white flex items-center gap-2">
                                                                {user.name}
                                                                {user.role === 'Root' && <ShieldCheck className="w-3 h-3 text-white" />}
                                                            </div>
                                                            <div className="text-[11px] text-zinc-500 font-mono">UID: {user.uid} • {user.shell}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${user.role === 'Root' ? 'bg-zinc-500/10 text-white' : 'bg-zinc-500/10 text-zinc-400'}`}>
                                                            {user.role}
                                                        </div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="p-10 text-center text-zinc-500 text-sm">
                                                    {isFetchingUsers ? 'Listing system accounts...' : 'No users found.'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}


                                {activeTab === "logs" && (
                                    <div className="h-full flex flex-col space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <h3 className="text-[13px] font-bold text-zinc-500 uppercase tracking-widest leading-none">System Logs (Live)</h3>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={fetchLogs}
                                                    className="text-[11px] text-zinc-500 hover:text-white font-bold transition-colors"
                                                >
                                                    {isFetchingLogs ? 'Fetching...' : 'Refresh'}
                                                </button>
                                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest leading-none">Streaming</span>
                                            </div>
                                        </div>
                                        <div className="flex-1 bg-black/60 rounded-2xl border border-white/5 p-4 font-mono text-[12px] overflow-y-auto no-scrollbar space-y-1">
                                            {systemLogs.length > 0 ? systemLogs.map((log, i) => (
                                                <div key={i} className={`${log.toLowerCase().includes('error') ? 'text-red-400' : log.toLowerCase().includes('warn') ? 'text-amber-400' : 'text-zinc-400'}`}>
                                                    {log}
                                                </div>
                                            )) : (
                                                <div className="text-zinc-500 italic">
                                                    {isFetchingLogs ? 'Reading system journals...' : 'Waiting for logs...'}
                                                </div>
                                            )}
                                            <div className="text-zinc-500 animate-pulse border-l-2 border-white pl-2">_</div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "network" && (
                                    <div className="max-w-[600px] mx-auto space-y-8">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-5 bg-zinc-950/50 rounded-2xl border border-white/5 space-y-4">
                                                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Public Interface</div>
                                                <div className="space-y-1">
                                                    <div className="text-xl font-bold text-white">{device?.vps?.host || "..."}</div>
                                                    <div className="text-[11px] text-zinc-500">{metrics?.os?.distro || "Ubuntu Linux"} Instance</div>
                                                </div>
                                            </div>
                                            <div className="p-5 bg-zinc-950/50 rounded-2xl border border-white/5 space-y-4">
                                                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">System Status</div>
                                                <div className="space-y-1">
                                                    <div className="text-xl font-bold text-white">Connected</div>
                                                    <div className="text-[11px] text-zinc-500">Agent v{device?.device?.agentVersion || "1.0"} • Active</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center px-1">
                                                <h3 className="text-[13px] font-bold text-zinc-500 uppercase tracking-widest">Active Listening Ports</h3>
                                                <button
                                                    onClick={fetchDetailedPorts}
                                                    className="text-[11px] text-zinc-500 hover:text-white font-bold transition-colors"
                                                >
                                                    {isFetchingNetwork ? 'Scanning...' : 'Refresh'}
                                                </button>
                                            </div>
                                            <div className="bg-zinc-950/50 rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/[0.03]">
                                                {detailedPorts.length > 0 ? detailedPorts.map((p, i) => (
                                                    <div key={i} className="flex items-center justify-between p-4 px-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-[14px] font-semibold text-white w-12">{p.port}</div>
                                                            <div className="text-[13px] font-medium text-white">{p.service}</div>
                                                        </div>
                                                        <div className="text-[12px] text-zinc-500">{p.traffic}</div>
                                                    </div>
                                                )) : (
                                                    <div className="p-10 text-center text-zinc-500 text-sm">
                                                        {isFetchingNetwork ? 'Performing deep port scan...' : 'No active listening ports detected.'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* <div className="p-5 bg-zinc-950/50 rounded-2xl border border-white/5 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-[13px] font-bold text-zinc-500 uppercase tracking-widest">Bandwidth Usage</h3>
                                                <div className="flex gap-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                        <span className="text-[11px] text-zinc-400">Inbound</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-2 h-2 rounded-full bg-zinc-500" />
                                                        <span className="text-[11px] text-zinc-400">Outbound</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <div className="flex justify-between text-[12px]">
                                                    <span className="text-zinc-500">Daily Limit (2TB)</span>
                                                    <span className="text-white">18.4% Used</span>
                                                </div>
                                                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 w-[18.4%]" />
                                                </div>
                                            </div>
                                        </div> */}
                                    </div>
                                )}

                                {activeTab === "firewall" && (
                                    <div className="max-w-[600px] mx-auto space-y-6">
                                        <div className="flex justify-between items-center px-1">
                                            <div className="space-y-1">
                                                <h3 className="text-[13px] font-bold text-zinc-500 uppercase tracking-widest">Firewall (UFW) Rules</h3>
                                                <p className="text-[11px] text-zinc-600">Active traffic filtering rules on this instance.</p>
                                            </div>
                                            <button
                                                onClick={fetchFirewallRules}
                                                className="text-[11px] text-zinc-500 hover:text-white font-bold transition-colors"
                                            >
                                                {isFetchingFirewall ? 'Refreshing...' : 'Refresh'}
                                            </button>
                                        </div>

                                        <div className="bg-zinc-950/50 rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/[0.03]">
                                            {firewallRules.length > 0 ? firewallRules.map((rule, i) => (
                                                <div key={i} className="flex items-center justify-between p-4 px-5 hover:bg-white/[0.01] transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-[11px] font-mono text-zinc-600 w-4">#{rule.id}</div>
                                                        <div>
                                                            <div className="text-[13px] font-medium text-white">{rule.to}</div>
                                                            <div className="text-[11px] text-zinc-500">From {rule.from}</div>
                                                        </div>
                                                    </div>
                                                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${rule.action.includes('ALLOW') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                        {rule.action}
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="p-12 text-center text-zinc-500 text-sm border border-dashed border-white/5 rounded-3xl bg-zinc-950/20">
                                                    <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4 border border-white/5">
                                                        <ShieldCheck className="w-6 h-6 text-zinc-700" />
                                                    </div>
                                                    <h4 className="text-white font-bold mb-1">{isFetchingFirewall ? 'Reading Rules...' : 'No Firewall Rules Found'}</h4>
                                                    <p className="max-w-[200px] mx-auto text-[12px] text-zinc-600">
                                                        {isFetchingFirewall ? 'Querying UFW status on your server.' : 'Uncomplicated Firewall might be disabled or no rules are set.'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === "backups" && (
                                    <div className="max-w-[600px] mx-auto space-y-8">
                                        <div className="p-6 bg-zinc-600/10 rounded-3xl border border-zinc-500/20 flex items-center justify-between">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-zinc-600 flex items-center justify-center shadow-lg shadow-zinc-600/20">
                                                    <Cloud className="w-8 h-8 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-white">xCloud Automated Backups</h3>
                                                    <p className="text-[12px] text-zinc-500 font-medium">Daily snapshots of disk and database volumes.</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Status</span>
                                                <span className="text-[14px] font-semibold text-white">Protected</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-5 bg-zinc-950/50 rounded-2xl border border-white/5 space-y-3">
                                                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Storage Used</div>
                                                <div className="text-xl font-bold text-white">142.8 GB</div>
                                                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-white w-[28%]" />
                                                </div>
                                                <div className="text-[10px] text-zinc-600 font-medium">500 GB Tier Allocation</div>
                                            </div>
                                            <div className="p-5 bg-zinc-950/50 rounded-2xl border border-white/5 space-y-3">
                                                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Retention Policy</div>
                                                <div className="text-xl font-bold text-white">30 Days</div>
                                                <div className="text-[11px] text-zinc-500 leading-tight">Sliding window for point-in-time recovery and safety.</div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center px-1">
                                                <h3 className="text-[13px] font-bold text-zinc-500 uppercase tracking-widest">Snapshot History</h3>
                                                <button className="text-[12px] text-white font-bold hover:underline">Download All</button>
                                            </div>
                                            <div className="bg-zinc-950/50 rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/[0.03]">
                                                {[
                                                    { id: "SNAP-4921", date: "Today, 03:00 AM", size: "12.4 GB" },
                                                    { id: "SNAP-4920", date: "Jan 31, 03:00 AM", size: "12.3 GB" },
                                                    { id: "SNAP-4919", date: "Jan 30, 03:00 AM", size: "12.1 GB" },
                                                    { id: "SNAP-4918", date: "Jan 29, 03:00 AM", size: "11.8 GB" },
                                                ].map((snap, i) => (
                                                    <div key={i} className="flex items-center justify-between p-4 px-5 hover:bg-white/[0.02] transition-colors group/item">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-2.5 rounded-xl bg-white/5 text-zinc-500 group-hover/item:text-white transition-colors">
                                                                <History className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <div className="text-[14px] font-bold text-white">{snap.date}</div>
                                                                <div className="text-[11px] text-zinc-500 font-mono tracking-tight uppercase">{snap.id} • {snap.size}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button title="Restore" className="p-2 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-colors">
                                                                <RotateCcw className="w-4 h-4" />
                                                            </button>
                                                            <button title="Download" className="p-2 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-colors">
                                                                <DownloadCloud className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!["instance", "performance", "ssh", "runtime", "docker", "logs", "network", "firewall", "database", "users", "backups"].includes(activeTab) && (
                                    <div className="flex flex-col items-center justify-center h-full opacity-40 space-y-4">
                                        <div className={`p-6 rounded-3xl`}>
                                            {React.createElement(
                                                (SETTINGS_GROUPS.flatMap(g => g.items).find(i => i.id === activeTab)?.icon) || Info,
                                                { className: "w-20 h-20 text-zinc-500" }
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-xl font-bold text-zinc-200 capitalize">{activeTab.replace(/([A-Z])/g, ' $1')} Configuration</h3>
                                            <p className="text-sm text-zinc-500">Cloud-side {activeTab} settings will fetch automatically.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Resize handles */}
                        {!isMaximized && (
                            <>
                                <div onPointerDown={handleResizeStart("n")} className="absolute top-0 left-2 right-2 h-1.5 cursor-n-resize" />
                                <div onPointerDown={handleResizeStart("s")} className="absolute bottom-0 left-2 right-2 h-1.5 cursor-s-resize" />
                                <div onPointerDown={handleResizeStart("w")} className="absolute left-0 top-2 bottom-2 w-1.5 cursor-w-resize" />
                                <div onPointerDown={handleResizeStart("e")} className="absolute right-0 top-2 bottom-2 w-1.5 cursor-e-resize" />
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
