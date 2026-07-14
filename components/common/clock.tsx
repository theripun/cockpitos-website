"use client";

import React, { useEffect, useState } from "react";

export function GlassClock() {
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    if (!time) return null;

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    };

    const timeString = formatTime(time);
    const dateString = formatDate(time);
    const [timeOnly, period] = timeString.split(" ");

    return (
        <div className="flex flex-col items-center justify-center pt-18 w-full relative z-10">

            <h1 className="text-[10rem] w-[500px] justify-center leading-none font-normal tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/20 select-none flex items-baseline drop-shadow-2xl font-[family-name:var(--font-outfit)]">
                {timeOnly}
            </h1>

            <div className="mt-4 text-md font-medium tracking-widest uppercase text-white font-[family-name:var(--font-outfit)]">
                {dateString}
            </div>
        </div>
    );
}   
