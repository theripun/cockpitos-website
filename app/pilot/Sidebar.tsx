'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Home,
    Users,
    Mail,
    Navigation,
    MessageSquare,
    Bell,
    CreditCard,
    BarChart3,
    UserCog,
    Activity,
} from 'lucide-react';

const MENU_ITEMS = [
    { name: 'Home', icon: Home, param: 'home' },
    { name: 'All Users', icon: Users, param: 'all-users' },
    { name: 'Mail Service', icon: Mail, param: 'mail-services' },
    { name: 'Tracking', icon: Navigation, param: 'tracking' },
    { name: 'User Queries', icon: MessageSquare, param: 'user-queries' },
    { name: 'Act As', icon: UserCog, param: 'act-as' },
    { name: 'Usage', icon: Activity, param: 'usage' },
    { name: 'Subscriptions', icon: CreditCard, param: 'subscriptions' },
    { name: 'Ads revenue', icon: BarChart3, param: 'ads-revenue' },
];

export default function Sidebar() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Determine active tab. Default to 'home' if none is set.
    let activeTab = 'home';
    const allParams = ['home', 'all-users', 'mail-services', 'tracking', 'user-queries', 'act-as', 'usage', 'subscriptions', 'ads-revenue', 'alerts'];
    for (const param of allParams) {
        if (searchParams.has(param)) {
            activeTab = param;
            break;
        }
    }

    const handleNavigation = (param: string) => {
        router.push(`?${param}`, { scroll: false });
    };

    return (
        <div className="w-[240px] shrink-0 bg-black flex flex-col py-6 border-r border-[#1a1a1a] justify-between z-20">
            <div>
                {/* Logo Area */}
                <div className="flex items-center gap-3 px-8 mb-10">
                    <span className="text-white font-bold text-lg">CockpitOS Pilot</span>
                </div>

                {/* Navigation Menu */}
                <div className="flex flex-col gap-2 px-4">
                    {MENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.param;

                        return (
                            <button
                                key={item.param}
                                onClick={() => handleNavigation(item.param)}
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 w-full ${isActive
                                    ? 'bg-[#0a0a0a] text-white border border-[#1a1a1a]'
                                    : 'text-neutral-500 hover:text-neutral-200 hover:bg-[#0a0a0a] border border-transparent'
                                    }`}
                            >
                                <div className={`flex items-center justify-center ${isActive ? 'text-white' : 'text-neutral-500'}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className={`font-medium ${isActive ? 'text-white' : ''}`}>
                                    {item.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Section */}
            <div className="px-4 flex flex-col gap-4">
                <button
                    onClick={() => handleNavigation('alerts')}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 border ${activeTab === 'alerts'
                        ? 'bg-[#0a0a0a] border-[#1a1a1a]'
                        : 'bg-black border-[#1a1a1a] hover:bg-[#0a0a0a]'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <Bell className={`w-5 h-5 ${activeTab === 'alerts' ? 'text-white' : 'text-neutral-500'}`} />
                        <span className={`text-sm font-medium ${activeTab === 'alerts' ? 'text-white' : 'text-gray-300'}`}>Alerts</span>
                    </div>
                    <div className="bg-white/10 text-neutral-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        +5
                    </div>
                </button>

                <div className="flex items-center gap-3 px-4 py-3 bg-[#0a0a0a] rounded-xl hover:bg-[#0f0f0f] transition-colors cursor-pointer border border-[#1a1a1a]">
                    {/* <img
                        src="https://i.pravatar.cc/150?img=11"
                        alt="User avatar"
                        className="w-8 h-8 rounded-full border border-gray-600"
                    /> */}
                    <div className="flex flex-col text-left">
                        <span className="text-sm text-white font-medium">RIPUN BASUMATARY</span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest">Admin</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
