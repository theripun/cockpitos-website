import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import React from "react";

/* ─────────────── TYPES ─────────────── */

export type Tab = "overview" | "users" | "devices" | "logs" | "settings";

export interface MockUser {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    lastSeen: string;
    avatar: string;
    twoFa: boolean;
}

export interface MockDevice {
    id: string;
    name: string;
    ip: string;
    region: string;
    os: string;
    cpu: number;
    ram: number;
    disk: number;
    status: string;
    uptime: string;
    user: string;
}

export interface MockLog {
    id: string;
    level: string;
    time: string;
    service: string;
    message: string;
}

/* ─────────────── MOCK DATA ─────────────── */

export const mockUsers: MockUser[] = [
    { id: "u1", name: "Ripun Basumatary", email: "ripun@cockpit.io", role: "Super Admin", status: "active", lastSeen: "Just now", avatar: "RB", twoFa: true },
    { id: "u2", name: "Alex Chen", email: "alex.chen@cockpit.io", role: "Admin", status: "active", lastSeen: "2m ago", avatar: "AC", twoFa: true },
    { id: "u3", name: "Maria Santos", email: "maria@cockpit.io", role: "Viewer", status: "active", lastSeen: "1h ago", avatar: "MS", twoFa: false },
    { id: "u4", name: "John Wick", email: "john@cockpit.io", role: "Viewer", status: "suspended", lastSeen: "3d ago", avatar: "JW", twoFa: false },
    { id: "u5", name: "Priya Kapoor", email: "priya@cockpit.io", role: "Admin", status: "active", lastSeen: "14m ago", avatar: "PK", twoFa: true },
];

export const mockDevices: MockDevice[] = [
    { id: "a3f8c2d1e4b7219056fa3c", name: "vps-sg-01", ip: "103.41.20.11", region: "Singapore", os: "Ubuntu 22.04", cpu: 34, ram: 61, disk: 44, status: "online", uptime: "22d 4h", user: "ripun" },
    { id: "b17d9e83c0a542f6712de1", name: "vps-us-west-02", ip: "54.199.88.22", region: "US West", os: "Ubuntu 22.04", cpu: 12, ram: 38, disk: 71, status: "online", uptime: "9d 17h", user: "alex" },
    { id: "c52af10b6e3d874920cb7f", name: "vps-eu-01", ip: "178.62.33.99", region: "EU Frankfurt", os: "Debian 12", cpu: 0, ram: 0, disk: 55, status: "offline", uptime: "—", user: "maria" },
    { id: "d840b3e7f9612ca053819d", name: "vps-in-01", ip: "139.59.21.45", region: "Mumbai", os: "Ubuntu 22.04", cpu: 78, ram: 85, disk: 89, status: "warning", uptime: "5d 2h", user: "priya" },
    { id: "e2190c4a8f73d65b1027e4", name: "vps-jp-01", ip: "52.194.11.77", region: "Tokyo", os: "Ubuntu 24.04", cpu: 22, ram: 44, disk: 31, status: "online", uptime: "14d 9h", user: "ripun" },
    { id: "f963d17c2b04a8e591f6b2", name: "vps-au-01", ip: "13.211.34.102", region: "Sydney", os: "Ubuntu 22.04", cpu: 55, ram: 70, disk: 60, status: "online", uptime: "3d 22h", user: "alex" },
    { id: "071e4b82f5d39ca6108073", name: "vps-br-01", ip: "177.71.28.44", region: "São Paulo", os: "Debian 12", cpu: 0, ram: 0, disk: 40, status: "offline", uptime: "—", user: "john" },
    { id: "18a7c50e3f9142d6b84f9a", name: "vps-uk-01", ip: "18.133.44.200", region: "London", os: "Ubuntu 22.04", cpu: 91, ram: 88, disk: 96, status: "warning", uptime: "1d 3h", user: "ripun" },
    { id: "297fb61d0c8e453a9b10c5", name: "vps-ca-01", ip: "35.182.91.55", region: "Montreal", os: "Ubuntu 24.04", cpu: 9, ram: 28, disk: 22, status: "online", uptime: "30d 11h", user: "priya" },
    { id: "3b06a924e7f518dc2d84e7", name: "vps-za-01", ip: "196.216.10.88", region: "Cape Town", os: "Debian 12", cpu: 48, ram: 52, disk: 67, status: "online", uptime: "7d 6h", user: "maria" },
];



export const mockLogs: MockLog[] = [
    { id: "l1", level: "info", time: "09:04:22", service: "auth", message: "User 'ripun' authenticated successfully" },
    { id: "l2", level: "warn", time: "09:02:58", service: "agent", message: "High CPU usage detected on vps-in-01 (78%)" },
    { id: "l3", level: "error", time: "09:01:11", service: "network", message: "Connection timeout to vps-eu-01 after 30s" },
    { id: "l4", level: "info", time: "08:59:44", service: "auth", message: "Session created for user 'alex.chen'" },
    { id: "l5", level: "info", time: "08:58:30", service: "system", message: "Metrics snapshot saved for vps-sg-01" },
    { id: "l6", level: "warn", time: "08:55:02", service: "disk", message: "Disk usage on vps-in-01 crossed 85% threshold" },
    { id: "l7", level: "info", time: "08:52:17", service: "agent", message: "Heartbeat received from vps-us-west-02" },
    { id: "l8", level: "error", time: "08:48:09", service: "cron", message: "Scheduled backup job failed: target unreachable" },
];

export const overview = {
    totalDevices: 10,
    onlineDevices: 7,
    totalUsers: 5,
    activeUsers: 4,
    cpuAvg: 35,
    ramAvg: 53,
};

/* ─────────────── SHARED STYLE MAPS ─────────────── */

export const statusDot: Record<string, string> = {
    online: "bg-white shadow-[0_0_7px_#fff]",
    offline: "bg-rose-600 shadow-[0_0_7px_#f43f5e]",
    warning: "bg-amber-400 shadow-[0_0_7px_#fbbf24]",
    active: "bg-emerald-400 shadow-[0_0_7px_#34d399]",
    suspended: "bg-red-400 shadow-[0_0_7px_#f43f5e]",
};

export const statusPill: Record<string, string> = {
    online: "text-white bg-white/8",
    offline: "text-rose-600 bg-rose-600/8",
    warning: "text-amber-400  bg-amber-400/8",
    active: "text-emerald-400 bg-emerald-400/8",
    suspended: "text-red-400    bg-red-400/8",
};

export const logStyle: Record<string, { label: string; text: string; icon: React.ElementType }> = {
    info: { label: "INFO", text: "text-white", icon: CheckCircle2 },
    warn: { label: "WARN", text: "text-amber-400", icon: AlertTriangle },
    error: { label: "ERR", text: "text-rose-400", icon: XCircle },
};
