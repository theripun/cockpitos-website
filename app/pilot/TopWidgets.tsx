"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { SlidersHorizontal, Maximize2, X } from 'lucide-react';
import { BASE_URL } from '@/lib/baseURL';

export default function TopWidgets() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch(`${BASE_URL}/users/all`, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            if (Array.isArray(data)) {
                setAllUsers(data);
            }
        } catch (e) {
            console.error('Failed to fetch users:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const unverifiedUsers = allUsers
        .filter(u => !u.isEmailVerified)
        .map(u => ({
            id: u.id.slice(0, 8),
            name: u.name || u.username || 'Unknown Node',
            time: u.lastSeen || 'New'
        }));

    const totalUsersCount = allUsers.length.toLocaleString();
    const totalActiveDevices = allUsers.reduce((acc, user) => acc + (user.devices?.length || 0), 0);
    const activeDevicesCount = totalActiveDevices.toLocaleString();


    return (
        <>
            <div className="grid grid-cols-3 border-b border-[#1a1a1a] bg-black">
                <div className="p-8 flex flex-col justify-center items-center border-r border-[#1a1a1a]">
                    <div className="text-[5.5rem] leading-none font-light tracking-tight text-white">
                        {loading ? '---' : totalUsersCount}
                    </div>
                    <div className="mt-4 text-center text-sm text-neutral-500">
                        Total registered systems<br />
                        across <span className="inline-block px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 text-xs font-medium ml-1">CockpitOS</span>
                    </div>
                </div>

                {/* Widget 2: Active Devices */}
                <div className="p-6 flex flex-col border-r border-[#1a1a1a] relative overflow-hidden group bg-black">
                    <div className="flex justify-between items-center mb-1 relative z-10">
                        <h2 className="text-[15px] text-white font-semibold">Active devices</h2>
                        {/* <button className="w-8 h-8 rounded-full bg-[#161521] flex items-center justify-center hover:bg-[#1e1d2b] transition-colors">
                            <SlidersHorizontal className="w-4 h-4 text-gray-400" />
                        </button> */}
                    </div>

                    <div className="flex-1 flex flex-col relative z-10 mt-2">
                        <div className="text-[2.5rem] font-light text-white tracking-tight leading-none">
                            {loading ? '---' : activeDevicesCount}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                            <div className="bg-white/10 border border-white/10 text-neutral-300 text-[10px] font-bold px-2 py-0.5 rounded-sm">
                                ONLINE
                            </div>
                            {/* <span className="text-xs text-white font-medium">+1,204 up</span> */}
                        </div>
                    </div>

                    {/* SVG Sparkline Graph Background */}
                    <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none transform translate-y-2 opacity-100 group-hover:opacity-100 transition-opacity duration-500">
                        <svg className="w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#525252" stopOpacity="0.35" />
                                    <stop offset="100%" stopColor="#171717" stopOpacity="0" />
                                </linearGradient>
                            </defs>

                            {/* Area Fill */}
                            <path
                                d="M 0 80 C 30 70, 50 90, 80 60 C 110 30, 130 70, 160 40 C 180 20, 190 25, 200 15 L 200 100 L 0 100 Z"
                                fill="url(#chartGradient)"
                            />

                            {/* Line Stroke */}
                            <path
                                d="M 0 80 C 30 70, 50 90, 80 60 C 110 30, 130 70, 160 40 C 180 20, 190 25, 200 15"
                                stroke="#737373"
                                strokeWidth="1.5"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                        </svg>
                    </div>
                </div>

                {/* Widget 3: Unverified Systems */}
                <div className="p-6 flex flex-col bg-black">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-[15px] text-white font-semibold">Unverified systems</h2>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-8 h-8 rounded-full bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center hover:bg-[#111] transition-colors"
                        >
                            <Maximize2 className="w-4 h-4 text-neutral-400" />
                        </button>
                    </div>

                    <div className="flex flex-col gap-4 overflow-y-auto h-[150px] pr-2 
                    [&::-webkit-scrollbar]:w-1 
                    [&::-webkit-scrollbar-track]:bg-transparent 
                    [&::-webkit-scrollbar-thumb]:bg-[#262626] 
                    [&::-webkit-scrollbar-thumb]:rounded-full">

                        {unverifiedUsers.length === 0 && !loading && (
                            <div className="text-gray-500 text-xs text-center py-10 uppercase tracking-widest opacity-50">No unverified systems</div>
                        )}

                        {unverifiedUsers.map((system: any, i: number) => (
                            <React.Fragment key={system.id}>
                                {i > 0 && <div className="h-px w-full bg-[#1a1a1a] shrink-0"></div>}
                                <div className="flex items-center justify-between text-sm shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-[#0a0a0a] border border-[#1a1a1a] rounded-full flex items-center justify-center text-xs font-medium text-neutral-300">
                                            {system.name.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-200">{system.name}</span>
                                            <span className="text-[10px] text-gray-500">{system.id}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-400 text-xs">{system.time}</span>
                                        <button className="px-2 py-1 bg-white/5 hover:bg-white/10 text-xs rounded transition-colors text-white">
                                            Verify
                                        </button>
                                    </div>
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal for Unverified Systems */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsModalOpen(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative bg-black border border-[#1a1a1a] rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="flex justify-between items-center p-6 border-b border-[#1a1a1a]">
                            <h2 className="text-xl text-white font-semibold">All Unverified Systems</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center hover:bg-[#111] transition-colors"
                            >
                                <X className="w-4 h-4 text-neutral-400" />
                            </button>
                        </div>

                        <div className="flex flex-col gap-4 overflow-y-auto p-6
                            [&::-webkit-scrollbar]:w-2
                            [&::-webkit-scrollbar-track]:bg-transparent 
                            [&::-webkit-scrollbar-thumb]:bg-[#262626] 
                            [&::-webkit-scrollbar-thumb]:rounded-full">

                            {unverifiedUsers.map((system: any, i: number) => (
                                <React.Fragment key={system.id}>
                                    {i > 0 && <div className="h-px w-full bg-[#1a1a1a] shrink-0"></div>}
                                    <div className="flex items-center justify-between text-sm shrink-0">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-[#0a0a0a] border border-[#1a1a1a] rounded-full flex items-center justify-center text-sm font-medium text-neutral-300">
                                                {system.name.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-200 text-base">{system.name}</span>
                                                <span className="text-xs text-gray-500 mt-0.5">{system.id}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <span className="text-gray-400 text-xs">{system.time}</span>
                                            {/* <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-sm rounded-lg transition-colors text-white font-medium">
                                                Verify System
                                            </button> */}
                                        </div>
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
