"use client";

import React, { useEffect, useState } from "react";
import { Battery, BatteryLow, BatteryMedium, BatteryFull, Wifi, WifiOff, PlugZap2 } from "lucide-react";

import { GlassInterface } from "./glass-interface";
import "./styles/glass-interface.css";

export function StatusIndicators() {
    const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
    const [isCharging, setIsCharging] = useState<boolean>(false);
    const [isOnline, setIsOnline] = useState<boolean>(true);

    useEffect(() => {
        // Battery Status
        if ("getBattery" in navigator) {
            (navigator as any).getBattery().then((battery: any) => {
                const updateBattery = () => {
                    setBatteryLevel(Math.round(battery.level * 100));
                    setIsCharging(battery.charging);
                };
                updateBattery();
                battery.addEventListener("levelchange", updateBattery);
                battery.addEventListener("chargingchange", updateBattery);
                // Note: Cleaning up events inside the then block is tricky without a ref, 
                // but for a dev cockpit this is usually fine.
            });
        }

        // Online Status
        setIsOnline(navigator.onLine);
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    const getBatteryIcon = () => {
        if (isCharging) return <PlugZap2 className="w-4 h-4 text-white fill-white" />;
        if (batteryLevel === null) return <Battery className="w-4 h-4 fill-white" />;
        if (batteryLevel > 80) return <BatteryFull className="w-4 h-4 fill-white" />;
        if (batteryLevel > 30) return <BatteryMedium className="w-4 h-4 fill-white" />;
        return <BatteryLow className="w-4 h-4 text-red-500 fill-red-500" />;
    };

    return (
        <GlassInterface
            rounded
            size="small"
            className="select-none"
            includeSvgFilter={true}
        >
            <div className="flex items-center gap-4">
                {/* Connectivity */}
                <div className="flex items-center gap-1.5 px-1">
                    {isOnline ? (
                        <Wifi className="w-4 h-4 text-white" />
                    ) : (
                        <WifiOff className="w-4 h-4 text-white/50" />
                    )}
                    <span className="text-[10px] font-semibold text-white tracking-wide">
                        {isOnline ? "LIVE" : "DISC"}
                    </span>
                </div>

                {/* Divider & Battery (Hide if not available) */}
                {batteryLevel !== null && (
                    <>
                        <div className="w-[1px] h-3 bg-white/30" />
                        <div className="flex items-center gap-1.5 px-1">
                            <span className="text-[10px] font-semibold text-white tracking-wide">
                                {`${batteryLevel}%`}
                            </span>
                            {getBatteryIcon()}
                        </div>
                    </>
                )}
            </div>
        </GlassInterface>
    );
}
