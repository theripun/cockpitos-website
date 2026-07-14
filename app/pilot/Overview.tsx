"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Server, TreeDeciduous, MapPin } from 'lucide-react';
import TopWidgets from './TopWidgets';
import { PilotUsersTable, mapApiUserToPilotRow } from './pilot-users-table';
import { BASE_URL } from '@/lib/baseURL';

export default function Overview() {
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

    const RECENT_USER_LIMIT = 20;

    const recentUsers = useMemo(() => {
        return [...allUsers]
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
            .slice(0, RECENT_USER_LIMIT)
            .map(mapApiUserToPilotRow);
    }, [allUsers]);

    return (
        <div className="flex-1 flex flex-col bg-black relative overflow-hidden h-full">
            {/* Top Widgets */}
            <TopWidgets />

            {/* System Status Row */}
            <div className="flex h-24 border-b border-[#1a1a1a] px-8 items-center justify-between gap-12 bg-black z-10 shrink-0">
                {/* System 1: All OK */}
                <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-sm tracking-wide text-white">CockpitOS Frontend</span>
                        <div className="flex-1 flex items-center">
                            <div className="h-[2px] w-full bg-neutral-600"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 mr-2 -ml-1 z-10"></div>
                            <Server className="w-4 h-4 text-neutral-300 ml-1" />
                            <div className="h-[2px] w-[20%] bg-[#1a1a1a] ml-2"></div>
                            <div className="w-1 h-3 bg-neutral-600 ml-1"></div>
                        </div>
                        <span className="text-sm font-medium text-neutral-300">ALL OK</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-400">
                        <div className="flex items-center gap-1"><TreeDeciduous className="w-3 h-3" /> Deployed via Reglook Airnode CLI</div>
                    </div>
                </div>

                {/* System 2: All OK */}
                <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-sm tracking-wide text-white">CogNode Server</span>
                        <div className="flex-1 flex items-center">
                            <div className="h-[2px] w-[70%] bg-neutral-600"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 mr-2 -ml-1 z-10"></div>
                            <Server className="w-4 h-4 text-neutral-300 ml-1" />
                            <div className="h-[2px] w-[30%] bg-[#1a1a1a] ml-2"></div>
                            <div className="w-1 h-3 bg-neutral-600 ml-1"></div>
                        </div>
                        <span className="text-sm font-medium text-neutral-300">ALL OK</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-400">
                        <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> AWS ap-south-1</div>
                    </div>
                </div>

                {/* System 3: All OK */}
                <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-sm tracking-wide text-white">Cocktail Agent</span>
                        <div className="flex-1 flex items-center">
                            <div className="flex gap-1 flex-1">
                                <div className="h-[2px] w-2 bg-neutral-600"></div>
                                <div className="h-[2px] w-2 bg-neutral-600"></div>
                                <div className="h-[2px] w-2 bg-neutral-600"></div>
                                <div className="h-[2px] w-2 bg-neutral-600"></div>
                                <div className="h-[2px] w-2 bg-neutral-600"></div>
                                <div className="h-[2px] w-2 bg-neutral-600"></div>
                            </div>
                            <div className="relative flex items-center justify-center mx-2">
                                <Server className="w-3.5 h-3.5 text-neutral-200 relative z-10" />
                            </div>
                            <div className="h-[2px] w-[30%] bg-[#1a1a1a] ml-1"></div>
                            <div className="w-1 h-3 bg-neutral-600 ml-1"></div>
                        </div>
                        <span className="text-sm font-medium text-neutral-300">ALL OK</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-400">
                        <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Self-hosted (merged)</div>
                    </div>
                </div>
            </div>

            {/* Recent users (table) */}
            <div className="flex min-h-0 flex-1 flex-col bg-black">
                <div className="flex shrink-0 flex-col gap-1 border-b border-[#1a1a1a] px-8 py-5">
                    <h2 className="text-base font-semibold tracking-tight text-white">Recent registrations</h2>
                    <p className="text-xs text-zinc-500">
                        Latest {RECENT_USER_LIMIT} users by signup date (newest first).
                        {!loading && allUsers.length > 0 ? (
                            <span className="text-zinc-600">
                                {' '}
                                · <span className="tabular-nums text-zinc-500">{allUsers.length}</span> total in directory
                            </span>
                        ) : null}
                    </p>
                </div>

                <div className="min-h-0 flex-1 overflow-auto px-8 py-6">
                    <PilotUsersTable rows={recentUsers} loading={loading} />
                </div>
            </div>
        </div>
    );
}
