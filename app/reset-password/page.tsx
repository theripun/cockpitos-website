"use client";

import React, { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowLeft, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { BASE_URL } from "@/lib/baseURL";
import { Menubar } from "@/components/home/menubar";

import { Suspense } from "react";

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Initial check for token
    useEffect(() => {
        if (!token) {
            setError("Invalid or missing reset token.");
        }
    }, [token]);

    const isValid = password.length >= 8 && password === confirmPassword;

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        setIsLoading(true);
        setError("");

        try {
            const res = await fetch(`${BASE_URL}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    newPassword: password
                }),
                credentials: "include"
            });

            const data = await res.json();

            if (res.ok && data.ok) {
                setSuccess(true);
                // Redirect after a delay
                setTimeout(() => {
                    router.push('/');
                }, 3000);
            } else {
                setError(data.message || "Failed to reset password. The link may have expired.");
            }
        } catch (err) {
            setError("Failed to connect to the server.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-black font-sans selection:bg-white/20">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/wallpaper/11.jpg"
                    alt="Background"
                    fill
                    priority
                    quality={100}
                    className="object-cover"
                />
                {/* Subtle overlay with blur */}
                <div className="absolute inset-0 bg-black/20 backdrop-blur-xl transition-all duration-1000" />
            </div>

            {/* Menubar */}
            <Menubar
                showFullMenus={false}
                showSystemMonitor={false}
                showSearch={false}
                transparent={true}
            />

            {/* Main Content Area */}
            <main className="relative z-20 min-h-screen flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="w-full max-w-[440px] bg-black/40 backdrop-blur-2xl rounded-[32px] p-10 border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.5)] flex flex-col items-center"
                >
                    <div className="mb-8 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 relative bg-white/5 rounded-full flex items-center justify-center border border-white/10 text-white">
                            <KeyRound className="w-8 h-8" />
                        </div>
                        <div className="text-center space-y-2">
                            <h1 className="text-[28px] font-semibold text-white tracking-tight">
                                Reset Password
                            </h1>
                            <p className="text-white/60 text-[15px]">
                                {success
                                    ? "Your password has been reset successfully"
                                    : "Enter a new secure password for your account"}
                            </p>
                        </div>
                    </div>

                    {!success ? (
                        <form onSubmit={handleResetPassword} className="w-full space-y-5">
                            <div className="space-y-4">
                                <div className="relative group">
                                    <Lock strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40 transition-colors group-focus-within:text-white" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="New Password"
                                        autoComplete="new-password"
                                        className="w-full h-13 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-12 text-white placeholder:text-white/30 outline-none focus:ring-0 focus:ring-white/20 transition-all"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff strokeWidth={2} className="w-4.5 h-4.5" />
                                        ) : (
                                            <Eye strokeWidth={2} className="w-4.5 h-4.5" />
                                        )}
                                    </button>
                                </div>

                                <div className="relative group">
                                    <Lock strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40 transition-colors group-focus-within:text-white" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Confirm Password"
                                        autoComplete="new-password"
                                        className="w-full h-13 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-12 text-white placeholder:text-white/30 outline-none focus:ring-0 focus:ring-white/20 transition-all"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>

                                <div className="text-white/40 text-[13px] text-center">
                                    Password must be at least 8 characters
                                </div>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-xl text-sm justify-center border border-red-400/20"
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={!isValid || isLoading || !token}
                                className={`w-full h-13 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${isValid && !isLoading && token
                                    ? "bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10 active:scale-[0.98]"
                                    : "bg-white/10 text-white/30 cursor-not-allowed"
                                    }`}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-white/50" />
                                ) : (
                                    <>
                                        Reset Password
                                        <ArrowLeft className="w-5 h-5 rotate-180" />
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => router.push('/')}
                                className="w-full flex items-center justify-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Sign In
                            </button>
                        </form>
                    ) : (
                        <div className="flex flex-col p-4 border border-white/5 rounded-xl items-center justify-center py-6 text-center space-y-6 w-full">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-20 h-20 bg-zinc-500/10 rounded-full flex items-center justify-center text-white"
                            >
                                <CheckCircle2 className="w-10 h-10" />
                            </motion.div>
                            <div className="space-y-2">
                                <p className="text-white/80">
                                    Your password has been successfully updated.
                                </p>
                                <p className="text-white/40 text-sm">
                                    Redirecting to login...
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.push('/')}
                                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-medium text-sm"
                            >
                                Return to Sign In Now
                            </button>
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen w-full bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white/20" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
