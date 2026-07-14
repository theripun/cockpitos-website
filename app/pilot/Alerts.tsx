'use client';

import React from 'react';
import {
    Bell,
    AlertTriangle,
    Info,
    ShieldAlert,
    Zap,
    ShieldCheck,
    Clock,
    MoreHorizontal,
    CheckCircle2
} from 'lucide-react';

const ALERTS = [
    {
        id: 'ALT-882',
        title: 'Unauthorized Access Attempt',
        description: 'Repeated failed login attempts from IP 185.212.14.8 (Moscow, RU). Node Alpha-Wilson has been temporarily isolated.',
        time: 'Just now',
        type: 'critical',
        source: 'Security Firewall',
        status: 'investigating'
    },
    {
        id: 'ALT-879',
        title: 'Satellite Link Degradation',
        description: 'Atmospheric interference detected in Sector 4B. Uplink integrity dropped to 64%. Automatic relay switch initiated.',
        time: '12 mins ago',
        type: 'warning',
        source: 'Comms Relay',
        status: 'active'
    },
    {
        id: 'ALT-875',
        title: 'Resource Spike Detected',
        description: 'Unusual CPU and Memory utilization on Mumbai West-Gate Node. Usage exceeded 92% for sustained 5 minute period.',
        time: '45 mins ago',
        type: 'system',
        source: 'Node Monitor',
        status: 'resolved'
    },
    {
        id: 'ALT-872',
        title: 'Global Sync Complete',
        description: 'All nodes have successfully synchronized with Guwahati Command Center. Delta latency: 14ms.',
        time: '2 hours ago',
        type: 'success',
        source: 'System Core',
        status: 'clear'
    },
    {
        id: 'ALT-868',
        title: 'Security Patch Applied',
        description: 'Version 2.4.1 hotfix deployed across all tracking modules. Encryption protocols updated to salt-256.',
        time: '5 hours ago',
        type: 'info',
        source: 'Auto-Update',
        status: 'clear'
    }
];

export default function Alerts() {
    return (
        <div className="flex-1 flex flex-col bg-black p-8 gap-8 overflow-hidden h-full">
            {/* Header Content */}
            <div className="flex justify-between items-end mb-2">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#1a1a1a]">
                            <Bell className="w-5 h-5 text-neutral-300" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-white">System Alerts</h2>
                    </div>
                    <p className="text-sm text-neutral-500 font-medium">Real-time security and operational notifications from across the global network.</p>
                </div>

                <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-[11px] font-bold text-gray-400 transition-all uppercase tracking-widest flex items-center gap-2">
                        Mark all as read
                    </button>
                    <button className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-gray-400 transition-all">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Alerts List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                <div className="flex flex-col gap-4">
                    {ALERTS.map((alert) => (
                        <div
                            key={alert.id}
                            className="relative bg-[#0a0a0a] rounded-xl p-6 border border-[#1a1a1a] hover:border-[#262626] transition-all duration-300 group overflow-hidden"
                        >
                            <div className={`absolute top-0 left-0 bottom-0 w-1 ${alert.type === 'critical' ? 'bg-neutral-200' :
                                alert.type === 'warning' ? 'bg-neutral-500' :
                                    alert.type === 'success' ? 'bg-neutral-600' :
                                        'bg-neutral-700'
                                }`} />

                            <div className="flex gap-6">
                                <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border border-[#1a1a1a] ${alert.type === 'critical' ? 'bg-black text-neutral-200' :
                                    alert.type === 'warning' ? 'bg-black text-neutral-400' :
                                        alert.type === 'success' ? 'bg-black text-neutral-500' :
                                            'bg-black text-neutral-600'
                                    }`}>
                                    {alert.type === 'critical' && <ShieldAlert className="w-6 h-6" />}
                                    {alert.type === 'warning' && <AlertTriangle className="w-6 h-6" />}
                                    {alert.type === 'success' && <ShieldCheck className="w-6 h-6" />}
                                    {(alert.type === 'system' || alert.type === 'info') && <Zap className="w-6 h-6" />}
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-white font-bold text-lg leading-none">{alert.title}</h4>
                                                <span className="text-[10px] py-0.5 px-2 bg-white/5 rounded-md text-gray-500 font-bold tracking-widest">#{alert.id}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{alert.source}</span>
                                                <div className="w-1 h-1 rounded-full bg-gray-700" />
                                                <div className="flex items-center gap-1.5 text-gray-500">
                                                    <Clock className="w-3 h-3" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">{alert.time}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-[0.2em] border border-[#1a1a1a] ${alert.status === 'investigating' ? 'bg-black text-neutral-300' :
                                            alert.status === 'active' ? 'bg-black text-neutral-400' :
                                                'bg-black text-neutral-500'
                                            }`}>
                                            {alert.status}
                                        </div>
                                    </div>

                                    <p className="text-gray-400 text-sm leading-relaxed mb-4 max-w-4xl">
                                        {alert.description}
                                    </p>

                                    <div className="flex items-center gap-2">
                                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] text-white font-bold uppercase tracking-widest transition-all border border-white/5">
                                            Investigate
                                        </button>
                                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] text-gray-400 font-bold uppercase tracking-widest transition-all border border-white/5">
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Empty State / Bottom Indicator */}
                    <div className="py-10 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl mt-2 group hover:border-white/10 transition-colors">
                        <CheckCircle2 className="w-8 h-8 text-gray-600 mb-3" />
                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em]">All systems operational</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
}
