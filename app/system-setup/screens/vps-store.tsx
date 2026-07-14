"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Cpu, HardDrive, Zap, Check, Server, ArrowRight, Shield } from "lucide-react";
import { LiquidGlass } from "@/components/common/liquid-glass"; // Assuming this exists based on previous file usage

// Mock Data for VPS tiers
const TIERS = [
    {
        id: "starter",
        name: "Nano Core",
        tagline: "Perfect for personal projects",
        price: "$5",
        period: "/mo",
        specs: {
            cpu: "1 vCPU",
            ram: "1 GB RAM",
            storage: "25 GB SSD",
            bandwidth: "1 TB Transfer",
        },
        color: "from-white/20 to-white/20",
        highlight: "white",
    },
    {
        id: "pro",
        name: "Fusion Node",
        tagline: "Balanced power for apps",
        price: "$12",
        period: "/mo",
        specs: {
            cpu: "2 vCPU",
            ram: "4 GB RAM",
            storage: "60 GB NVMe",
            bandwidth: "4 TB Transfer",
        },
        popular: true,
        color: "from-white/20 to-white/20",
        highlight: "white",
    },
    {
        id: "business",
        name: "Quantum Blade",
        tagline: "Production-ready performance",
        price: "$24",
        period: "/mo",
        specs: {
            cpu: "4 vCPU",
            ram: "8 GB RAM",
            storage: "120 GB NVMe",
            bandwidth: "8 TB Transfer",
        },
        color: "from-white/20 to-white/20",
        highlight: "white",
    },
    {
        id: "enterprise",
        name: "Titan Cluster",
        tagline: "Uncompromising raw power",
        price: "$60",
        period: "/mo",
        specs: {
            cpu: "8 vCPU",
            ram: "16 GB RAM",
            storage: "320 GB NVMe",
            bandwidth: "Unlimited",
        },
        color: "from-white/20 to-white/20",
        highlight: "white",
    },
];

interface VPSStoreProps {
    onClose: () => void;
}

export default function VPSStore({ onClose }: VPSStoreProps) {
    const [selected, setSelected] = useState<string | null>(null);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black backdrop-blur-2xl"
        >
            {/* Close Button - Apple style generic close */}
            <button
                onClick={onClose}
                className="absolute top-8 right-8 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white/70 hover:text-white"
            >
                <X className="w-6 h-6" />
            </button>

            {/* Main Stage */}
            <div className="w-full h-full max-w-7xl mx-auto px-6 py-12 flex flex-col relative overflow-y-auto custom-scrollbar">

                {/* Header Section */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                    className="text-center mb-16 space-y-4 pt-10"
                >

                    <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
                        Choose your engine.
                    </h1>
                    <p className="text-xl text-white/50 max-w-2xl mx-auto font-light">
                        High-performance computing, deployed in seconds. Designed for scalability.
                    </p>
                </motion.div>

                {/* Products Display Table */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start pb-20">
                    {TIERS.map((tier, index) => (
                        <motion.div
                            key={tier.id}
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 + (index * 0.1), duration: 0.8, ease: "easeOut" }}
                            className="relative group h-full"
                        >
                            {/* Card Container - Glass Effect mimicking a device on a table */}
                            <div
                                className={`relative h-full bg-zinc-950/90 backdrop-blur-xl rounded-[32px] overflow-hidden transition-all duration-500 ease-out 
                                ${selected === tier.id ? 'ring-2 ring-white/50 scale-[1.02] bg-zinc-800/60' : 'hover:scale-105 hover:bg-zinc-950/90'}`}
                                onClick={() => setSelected(tier.id)}
                            >
                                {/* Active Selection Glow */}
                                {selected === tier.id && (
                                    <div className={`absolute inset-0 bg-gradient-to-b ${tier.color} opacity-20 pointer-events-none`} />
                                )}

                                {/* Popular Badge */}
                                {tier.popular && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-to-r from-white to-white text-black text-[10px] font-bold px-3 py-1 rounded-b-xl shadow-lg shadow-white/20 z-20 uppercase tracking-widest">
                                        Best Value
                                    </div>
                                )}

                                <div className="p-8 flex flex-col h-full relative z-10">
                                    {/* Product Visual - Abstract Server Representation */}
                                    <div className="h-40 w-full mb-8 flex items-center justify-center relative">
                                        {/* "Device" */}
                                        <div className="relative w-24 h-32 bg-gradient-to-br from-zinc-700 to-black rounded-lg border border-white/10 shadow-2xl flex flex-col items-center justify-between py-3 group-hover:-translate-y-2 transition-transform duration-500">
                                            <div className="w-16 h-[2px] bg-white/20 rounded-full" />
                                            {/* Glowing indicator */}
                                            <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] text-${tier.highlight}-400 bg-${tier.highlight}-400`} />
                                            <div className="grid grid-cols-2 gap-1 w-16">
                                                {[...Array(6)].map((_, i) => (
                                                    <div key={i} className="h-1 w-full bg-white/10 rounded-full" />
                                                ))}
                                            </div>
                                        </div>
                                        {/* Reflection/Shadow */}
                                        <div className="absolute -bottom-4 w-24 h-4 bg-black/50 blur-xl rounded-full group-hover:w-20 group-hover:blur-2xl transition-all duration-500" />
                                    </div>

                                    {/* Name & Pricing */}
                                    <div className="mb-6 text-center">
                                        <h3 className="text-xl font-bold text-white mb-1">{tier.name}</h3>
                                        <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-4">{tier.tagline}</p>
                                        <div className="flex items-baseline justify-center gap-1">
                                            <span className="text-3xl font-light text-white">{tier.price}</span>
                                            <span className="text-sm text-white/40">{tier.period}</span>
                                        </div>
                                    </div>

                                    {/* Specs List leading to bottom */}
                                    <ul className="space-y-4 mb-8 flex-1">
                                        <SpecItem icon={Cpu} label={tier.specs.cpu} />
                                        <SpecItem icon={Zap} label={tier.specs.ram} />
                                        <SpecItem icon={HardDrive} label={tier.specs.storage} />
                                        <SpecItem icon={Server} label={tier.specs.bandwidth} />
                                    </ul>

                                    {/* Action Button */}
                                    <button
                                        className={`w-full py-3 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2
                                        ${selected === tier.id
                                                ? 'bg-white text-black hover:bg-white/90 shadow-lg shadow-white/20'
                                                : 'bg-white/5 text-white hover:bg-white/10'}`}
                                    >
                                        {selected === tier.id ? 'Deploy Now' : 'Select'}
                                        {selected === tier.id && <ArrowRight className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

            </div>
        </motion.div>
    );
}

function SpecItem({ icon: Icon, label }: { icon: any, label: string }) {
    return (
        <li className="flex items-center gap-3 text-sm text-white/70">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-white" />
            </div>
            <span>{label}</span>
        </li>
    );
}
