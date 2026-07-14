"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useDragControls, useMotionValue } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Search,
    Calendar as CalendarIcon,
    Maximize2,
    X,
    LayoutGrid,
    Settings,
    Clock,
    Filter,
    MapPin,
    AlignLeft,
    Check,
    Trash2
} from "lucide-react";
import { WINDOW_CONSTANTS } from "../window-constants";
import { BASE_URL } from "@/lib/baseURL";
import { AppHorizontalAdRibbon } from "@/components/ads";

interface CalendarProps {
    isOpen: boolean;
    onClose: () => void;
    onMinimize?: () => void;
}

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];



function useCalendar(isOpen: boolean) {
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/calendar/events`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
            }
        } catch (e) {
            console.error("Failed to fetch events", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchEvents();
        }
    }, [isOpen, fetchEvents]);

    // WebSocket logic removed as backend support is not implemented yet.
    // This prevents 502 errors in the console.
    /*
    useEffect(() => {
        if (!isOpen) return;
        // ... socket logic ...
    }, [isOpen]);
    */

    const addEvent = async (event: any) => {
        try {
            const res = await fetch(`${BASE_URL}/calendar/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event),
                credentials: 'include',
            });
            if (res.ok) fetchEvents();
            return res.ok;
        } catch (e) {
            console.error("Failed to add event", e);
            return false;
        }
    };

    const updateEvent = async (event: any) => {
        try {
            const res = await fetch(`${BASE_URL}/calendar/events/${event.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event),
                credentials: 'include',
            });
            if (res.ok) fetchEvents();
            return res.ok;
        } catch (e) {
            console.error("Failed to update event", e);
            return false;
        }
    };

    const deleteEvent = async (id: string) => {
        try {
            const res = await fetch(`${BASE_URL}/calendar/events/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.ok) fetchEvents();
            return res.ok;
        } catch (e) {
            console.error("Failed to delete event", e);
            return false;
        }
    };

    return { events, isLoading, addEvent, updateEvent, deleteEvent, refresh: fetchEvents };
}

function CreateEventModal({ isOpen, onClose, onSave, eventData }: any) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [category, setCategory] = useState("Work");
    const [location, setLocation] = useState("");

    useEffect(() => {
        if (isOpen) {
            const start = eventData?.startTime ? new Date(eventData.startTime) : (eventData?.date || new Date());
            const end = eventData?.endTime ? new Date(eventData.endTime) : new Date(start.getTime() + 3600000);

            const format = (d: Date) => {
                const offset = d.getTimezoneOffset();
                const adjusted = new Date(d.getTime() - (offset * 60 * 1000));
                return adjusted.toISOString().slice(0, 16);
            };

            setStartTime(format(start));
            setEndTime(format(end));
            setTitle(eventData?.title || "");
            setDescription(eventData?.description || "");
            setCategory(eventData?.category || "Work");
            setLocation(eventData?.location || "");
        }
    }, [isOpen, eventData]);

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-zinc-950 border border-white/5 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
                <div className="p-5 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">{eventData?.id ? 'Edit Event' : 'New Event'}</h3>
                        <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-full text-zinc-400 transition-colors"><X className="w-4 h-4" /></button>
                    </div>

                    <div className="space-y-3">
                        <input
                            autoFocus
                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500/50 transition-all placeholder:text-zinc-600 shadow-inner"
                            placeholder="What's the plan?"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-zinc-500 uppercase px-1">Start</label>
                                <input
                                    type="datetime-local"
                                    className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-white focus:outline-none focus:border-zinc-500/50"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-zinc-500 uppercase px-1">End</label>
                                <input
                                    type="datetime-local"
                                    className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-white focus:outline-none focus:border-zinc-500/50"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-500 uppercase px-1">Category</label>
                            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                                {["Work", "Personal", "Family"].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategory(cat)}
                                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${category === cat ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-xl px-4 py-2">
                            <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                            <input
                                className="flex-1 bg-transparent text-[11px] text-zinc-300 focus:outline-none placeholder:text-zinc-700"
                                placeholder="Add location..."
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                        </div>

                        <textarea
                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-300 min-h-[80px] focus:outline-none focus:border-zinc-500/50 transition-all placeholder:text-zinc-600 resize-none shadow-inner"
                            placeholder="Add notes..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <button
                        disabled={!title}
                        onClick={() => {
                            onSave({
                                id: eventData?.id,
                                title,
                                description,
                                startTime: new Date(startTime),
                                endTime: new Date(endTime),
                                category,
                                location
                            });
                            onClose();
                        }}
                        className={`w-full ${eventData?.id ? 'bg-rose-600 hover:bg-rose-500' : 'bg-blue-600 hover:bg-blue-500'} disabled:opacity-50 text-white font-black text-[11px] uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg active:scale-[0.98]`}
                    >
                        {eventData?.id ? 'Update Event' : 'Create Event'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

export function Calendar({ isOpen, onClose, onMinimize }: CalendarProps) {
    const { events, addEvent, deleteEvent, updateEvent, isLoading } = useCalendar(isOpen);

    const [size, setSize] = useState({ width: 950, height: 580 });
    const [isMaximized, setIsMaximized] = useState(false);
    const [preMaximizeState, setPreMaximizeState] = useState<{
        size: { width: number; height: number };
        pos: { x: number; y: number };
    } | null>(null);

    const dragControls = useDragControls();
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const [isResizing, setIsResizing] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEventData, setSelectedEventData] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Reset when opened
    useEffect(() => {
        if (!isOpen) return;
        setIsMaximized(false);
        setSize({ width: 950, height: 580 });
        x.set(0);
        y.set(-15);
    }, [isOpen]);

    const toggleMaximize = () => {
        const springConfig = { type: "spring" as const, stiffness: 400, damping: 30 };
        if (isMaximized) {
            if (preMaximizeState) setSize(preMaximizeState.size);
            else setSize({ width: 950, height: 580 });
            import("framer-motion").then(({ animate }) => {
                animate(x, preMaximizeState?.pos.x || 0, springConfig);
                animate(y, preMaximizeState?.pos.y || -15, springConfig);
            });
            setIsMaximized(false);
        } else {
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
        }
    };

    const handleResizeStart = (dir: ResizeDir) => (e: React.PointerEvent) => {
        if (isMaximized) return;
        e.preventDefault();
        e.stopPropagation();
        const target = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);
        setIsResizing(true);
        const startX = e.clientX, startY = e.clientY, startW = size.width, startH = size.height, startMX = x.get(), startMY = y.get();
        const onMove = (ev: PointerEvent) => {
            const dx = ev.clientX - startX, dy = ev.clientY - startY;
            let w = startW, h = startH, mx = startMX, my = startMY;
            if (dir.includes("e")) w = startW + dx;
            if (dir.includes("s")) h = startH + dy;
            if (dir.includes("w")) { w = startW - dx; mx = startMX + dx; }
            if (dir.includes("n")) { h = startH - dy; my = startMY + dy; }
            setSize({ width: Math.max(800, w), height: Math.max(550, h) });
            x.set(mx); y.set(my);
        };
        const onUp = (ev: PointerEvent) => {
            try { target.releasePointerCapture(ev.pointerId); } catch { }
            setIsResizing(false);
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
    };

    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysCount = new Date(year, month + 1, 0).getDate();
        const startDay = new Date(year, month, 1).getDay();
        const days = [];
        for (let i = 0; i < startDay; i++) days.push({ day: null, date: null });
        for (let i = 1; i <= daysCount; i++) {
            const date = new Date(year, month, i);
            days.push({ day: i, date });
        }
        return days;
    }, [currentDate]);

    const upcomingEvents = useMemo(() => {
        return events
            .filter(e => new Date(e.startTime) >= new Date())
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .slice(0, 5);
    }, [events]);

    const getDayEvents = (date: Date | null) => {
        if (!date) return [];
        return events.filter(e => {
            const d = new Date(e.startTime);
            return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
        });
    };

    const handleAddEvent = (date: Date) => {
        setSelectedEventData({ date });
        setIsModalOpen(true);
    };

    const handleEditEvent = (event: any) => {
        setSelectedEventData(event);
        setIsModalOpen(true);
    };

    const handleSaveEvent = (data: any) => {
        if (data.id) {
            updateEvent(data);
        } else {
            addEvent(data);
        }
    };

    const categoryColors: any = {
        Work: "bg-blue-500",
        Personal: "bg-red-500",
        Family: "bg-green-500"
    };

    const categoryTextColors: any = {
        Work: "text-blue-400",
        Personal: "text-red-400",
        Family: "text-green-400"
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
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        style={{ x, y, width: size.width, height: size.height }}
                        className={[
                            "pointer-events-auto bg-[#0a0a0b]/90 border border-white/5 flex flex-col overflow-hidden relative backdrop-blur-3xl text-white shadow-3xl",
                            isMaximized ? "rounded-none" : "rounded-3xl",
                            isResizing ? "select-none" : "",
                        ].join(" ")}
                    >
                        {/* Header Area */}
                        <div
                            className="shrink-0 h-16 border-b border-white/5 flex items-center px-6 select-none bg-black/40"
                            onPointerDown={(e) => dragControls.start(e)}
                            onDoubleClick={toggleMaximize}
                        >
                            <div className="flex items-center gap-3 w-[240px]">
                                <div className="flex gap-2">
                                    <button onClick={onClose} className="w-3 h-3 rounded-full bg-[#FF5F57] group/btn flex items-center justify-center transition-transform hover:scale-110"><X className="w-2 h-2 opacity-0 group-hover/btn:opacity-100 text-black/40" /></button>
                                    <button onClick={onMinimize} className="w-3 h-3 rounded-full bg-[#FEBC2E] group/btn flex items-center justify-center transition-transform hover:scale-110"><div className="w-1.5 h-[1.5px] bg-black/40 opacity-0 group-hover/btn:opacity-100" /></button>
                                    <button onClick={toggleMaximize} className="w-3 h-3 rounded-full bg-[#28C840] group/btn flex items-center justify-center transition-transform hover:scale-110"><Maximize2 className="w-1.5 h-1.5 opacity-0 group-hover/btn:opacity-100 text-black/40" /></button>
                                </div>

                                <div className="ml-6 flex items-center bg-black/40 p-1 rounded-xl border border-white/5">
                                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-400 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                                    <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 hover:bg-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-zinc-400 transition-colors">Today</button>
                                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-400 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <div className="flex-1 flex justify-center items-center gap-4">
                                <h2 className="text-[17px] font-black tracking-widest uppercase">
                                    {MONTHS[currentDate.getMonth()]} <span className="text-zinc-600 font-medium">{currentDate.getFullYear()}</span>
                                </h2>
                            </div>

                            <div className="w-[240px] flex justify-end items-center gap-4">
                                {/* <Search className="w-4 h-4 text-zinc-600 hover:text-white cursor-pointer transition-colors" /> */}
                                <button
                                    onClick={() => { setSelectedEventData({ date: new Date() }); setIsModalOpen(true); }}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    New Event
                                </button>
                            </div>
                        </div>

                        {/* Main Body */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* Sidebar */}
                            <div className="w-[280px] border-r border-white/5 flex flex-col py-8 px-6 bg-black/40 shrink-0 overflow-y-auto scrollbar-none">
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-2">
                                            <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                                                <LayoutGrid className="w-3 h-3 text-rose-500" />
                                                Categories
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {["Work", "Personal", "Family"].map(cat => (
                                                <div key={cat} className="flex items-center justify-between group px-3 py-2.5 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2.5 h-2.5 rounded-full ${categoryColors[cat]} shadow-lg`} />
                                                        <span className="text-[13px] font-bold text-zinc-300 group-hover:text-white">{cat}</span>
                                                    </div>
                                                    <span className="text-[10px] font-black text-zinc-700 group-hover:text-zinc-500">
                                                        {events.filter(e => e.category === cat).length}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 px-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                                            <Clock className="w-3 h-3 text-rose-500" />
                                            Upcoming
                                        </div>
                                        <div className="space-y-4">
                                            {upcomingEvents.length === 0 ? (
                                                <div className="px-4 py-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                                                    <p className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest">No Events</p>
                                                </div>
                                            ) : upcomingEvents.map((event, i) => (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    key={event.id}
                                                    className="group flex gap-4 px-3 py-1 relative cursor-pointer"
                                                    onClick={() => handleEditEvent(event)}
                                                >
                                                    <div className={`w-1 shrink-0 rounded-full ${categoryColors[event.category] || 'bg-blue-500'}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[13px] font-bold text-zinc-200 truncate group-hover:text-white transition-colors">{event.title}</div>
                                                        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-tighter mt-0.5">
                                                            {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteEvent(event.id); }}
                                                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-500/20 hover:text-rose-500 rounded-lg transition-all text-zinc-600"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* <div className="mt-auto pt-6 border-t border-white/5 flex justify-between">
                                    <button className="p-2.5 hover:bg-white/5 rounded-xl text-zinc-600 hover:text-white transition-all"><Settings className="w-4 h-4" /></button>
                                    <button className="p-2.5 hover:bg-white/5 rounded-xl text-zinc-600 hover:text-white transition-all"><Filter className="w-4 h-4" /></button>
                                </div> */}
                            </div>

                            {/* Calendar Grid */}
                            <div className="flex-1 flex flex-col bg-black overflow-hidden relative">
                                {isLoading && (
                                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                                        <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                    </div>
                                )}

                                <div className="shrink-0 border-b border-white/5 bg-black/50 px-3 py-2">
                                    <AppHorizontalAdRibbon />
                                </div>

                                <div className="grid grid-cols-7 border-b border-white/5 bg-black/60">
                                    {DAYS.map(day => (
                                        <div key={day} className="py-4 text-center text-[10px] font-black text-zinc-600 tracking-[0.2em] uppercase">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex-1 grid grid-cols-7 grid-rows-6 auto-rows-fr">
                                    {calendarDays.map((item, i) => {
                                        const dayEvents = getDayEvents(item.date);
                                        const isToday = item.date?.toDateString() === new Date().toDateString();

                                        return (
                                            <div
                                                key={i}
                                                onDoubleClick={() => item.date && handleAddEvent(item.date)}
                                                className={`
                                                    border-r border-b border-white/[0.03] p-3 flex flex-col gap-2 transition-all
                                                    hover:bg-white/[0.03] relative group
                                                    ${item.day === null ? "bg-white/[0.01]" : "bg-black/20"}
                                                `}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className={`
                                                        text-[12px] font-black w-7 h-7 flex items-center justify-center rounded-xl transition-all
                                                        ${isToday ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20 scale-110" : "text-zinc-500 group-hover:text-zinc-300"}
                                                    `}>
                                                        {item.day}
                                                    </span>
                                                    {item.day && (
                                                        <button
                                                            onClick={() => item.date && handleAddEvent(item.date)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-lg text-zinc-500 transition-all"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="space-y-1.5 overflow-y-auto scrollbar-none flex-1">
                                                    {dayEvents.map(event => (
                                                        <motion.div
                                                            layoutId={`event-${event.id}`}
                                                            key={event.id}
                                                            onClick={() => handleEditEvent(event)}
                                                            className={`px-2 py-1.5 rounded-xl ${categoryColors[event.category] || 'bg-blue-500'}/20 border border-white/5 flex flex-col gap-0.5 group/event relative hover:scale-[1.02] transition-transform cursor-pointer`}
                                                        >
                                                            <div className={`text-[10px] font-bold ${categoryTextColors[event.category] || 'text-blue-400'} truncate leading-tight`}>
                                                                {event.title}
                                                            </div>
                                                            <div className="text-[8px] font-black text-white/30 uppercase tracking-tighter">
                                                                {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Modal Overlay */}
                        <CreateEventModal
                            isOpen={isModalOpen}
                            onClose={() => { setIsModalOpen(false); setSelectedEventData(null); }}
                            eventData={selectedEventData}
                            onSave={handleSaveEvent}
                        />

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
