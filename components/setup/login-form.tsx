"use client";

import React, { useState } from "react";
import { User, Lock, Eye, EyeOff, ChevronRight, AlertCircle, Loader2, Mail, Type, CheckCircle2, ArrowLeft, Github } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { BASE_URL } from "@/lib/baseURL";

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
    const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>('login');
    const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Login Data
    const [loginData, setLoginData] = useState({
        username: "",
        password: ""
    });

    // Signup Data
    const [signupData, setSignupData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        username: "",
        userId: "", // Returned from step 1
        otp: "",
        password: ""
    });

    // Forgot Password Data
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
    const [isForgotPasswordSuccess, setIsForgotPasswordSuccess] = useState(false);

    const isLoginValid = loginData.username && loginData.password;
    const isSignupStep1Valid = signupData.firstName && signupData.lastName && signupData.email && signupData.username;
    const isSignupStep2Valid = signupData.otp && signupData.otp.length >= 4;
    const isSignupStep3Valid = signupData.password && signupData.password.length >= 8;
    const isForgotPasswordValid = forgotPasswordEmail && forgotPasswordEmail.includes('@');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch(`${BASE_URL}/auth/login/password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginData),
                credentials: "include"
            });

            const data = await res.json();

            if (data.ok) {
                onSuccess();
            } else {
                setError(data.message || "Invalid credentials");
            }
        } catch (err) {
            setError("Failed to connect to authentication server");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignupStart = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch(`${BASE_URL}/auth/signup/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: signupData.email,
                    username: signupData.username,
                    firstName: signupData.firstName,
                    lastName: signupData.lastName
                }),
                credentials: "include"
            });

            const data = await res.json();

            if (res.ok && data.userId) {
                setSignupData(prev => ({ ...prev, userId: data.userId }));
                setSignupStep(2);
            } else {
                setError(data.message || "Failed to start signup. Username or email might be taken.");
            }
        } catch (err) {
            setError("Failed to connect to signup server");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignupVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch(`${BASE_URL}/auth/signup/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: signupData.userId,
                    otp: signupData.otp
                }),
                credentials: "include"
            });

            const data = await res.json();

            if (res.ok && data.ok) {
                setSignupStep(3);
                setSuccess("Email verified successfully");
            } else {
                setError(data.message || "Invalid OTP code");
            }
        } catch (err) {
            setError("Failed to verify OTP");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignupFinish = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch(`${BASE_URL}/auth/signup/password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: signupData.userId,
                    password: signupData.password
                }),
                credentials: "include"
            });

            const data = await res.json();

            if (data.ok) {
                setLoginData(prev => ({ ...prev, username: signupData.username }));
                setMode('login');
                setSuccess("Account created successfully. Please sign in.");
                setSignupStep(1);
                setSignupData(prev => ({ ...prev, password: "", userId: "", otp: "" }));
            } else {
                setError(data.message || "Failed to set password");
            }
        } catch (err) {
            setError("Failed to complete signup");
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: forgotPasswordEmail }),
                credentials: "include"
            });

            // We always show success to prevent email enumeration
            setIsForgotPasswordSuccess(true);
            setSuccess("If an account exists with this email, you will receive reset instructions.");
        } catch (err) {
            setError("Failed to connect to the server.");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setMode(prev => prev === 'login' ? 'signup' : 'login');
        setError("");
        setSuccess("");
        setSignupStep(1);
    }

    const onSubmit = (e: React.FormEvent) => {
        if (mode === 'login') return handleLogin(e);
        if (mode === 'forgot-password') return handleForgotPassword(e);
        if (signupStep === 1) return handleSignupStart(e);
        if (signupStep === 2) return handleSignupVerify(e);
        return handleSignupFinish(e);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-[880px] min-h-[500px] bg-black/20 border-[1px] border-white/5 backdrop-blur-2xl rounded-[32px] shadow-[0_40px_100px_rgba(0,0,0,0.5)] flex flex-col md:flex-row overflow-hidden relative"
        >
            {/* Left Column (Branding & SSO) */}
            <div className="w-full md:w-[45%] bg-black/20 p-10 flex flex-col border-b md:border-b-0 md:border-r border-white/5 relative justify-center items-center">
                <div className="flex flex-col items-center gap-6 w-full max-w-[280px]">
                    <div className="w-16 h-16 relative">
                        <Image
                            src="/logo/cockpit.svg"
                            alt="Cockpit Logo"
                            fill
                            className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                        />
                    </div>
                    <div className="text-center space-y-2">
                        <h1 className="text-[28px] font-semibold text-white tracking-tight">
                            Cockpit
                        </h1>
                        {/* <span className="text-3xl text-white mb-4 block font-medium" style={{ fontFamily: 'Brush Script MT, cursive' }}>Thank you</span> */}

                        <p className="text-white/80 text-[15px] leading-relaxed">
                        Sign in to operate your Virtual Private Server as a unified, visual environment.
                        </p>
                    </div>

                    <div className="w-full pt-4 space-y-4">
                        <button
                            type="button"
                            onClick={() => window.location.href = `${BASE_URL}/auth/oauth/github`}
                            className="w-full h-13 rounded-2xl font-semibold flex items-center justify-center gap-2 bg-white/5 border border-white/5 text-white hover:bg-white/10 transition-all active:scale-[0.98]"
                        >
                            <Github className="w-5 h-5" />
                            Continue with GitHub
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Column (Credentials Form) */}
            <div className="w-full md:w-[55%] p-10 flex flex-col relative justify-center bg-transparent">
                <div className="mb-8 text-center md:text-left">
                    <h2 className="text-[24px] font-semibold text-white tracking-tight">
                        {mode === 'login' ? "Sign In" : mode === 'forgot-password' ? "Reset Password" : "Create Account"}
                    </h2>
                    <p className="text-white/60 text-[14px] mt-1">
                        {mode === 'login'
                            ? "Use your account to continue"
                            : mode === 'forgot-password'
                                ? "Enter your email to receive reset instructions"
                                : signupStep === 1
                                    ? "Enter your details to get started"
                                    : signupStep === 2
                                        ? "Verify your email address"
                                        : "Choose a secure password"}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {mode === 'login' && (
                        <motion.form
                            key="login-form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onSubmit={handleLogin}
                            className="w-full space-y-5"
                        >
                            <div className="space-y-4">
                                <div className="relative group">
                                    <User strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40 transition-colors group-focus-within:text-white" />
                                    <input
                                        type="text"
                                        placeholder="Username"
                                        autoComplete="username"
                                        className="w-full h-13 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-white placeholder:text-white/30 outline-none focus:ring-0 focus:ring-white/20 transition-all"
                                        value={loginData.username}
                                        onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                                    />
                                </div>

                                <div className="relative group">
                                    <Lock strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40 transition-colors group-focus-within:text-white" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        autoComplete="current-password"
                                        className="w-full h-13 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-12 text-white placeholder:text-white/30 outline-none focus:ring-0 focus:ring-white/20 transition-all"
                                        value={loginData.password}
                                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
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

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMode('forgot-password');
                                            setError("");
                                            setSuccess("");
                                        }}
                                        className="text-sm text-white/40 hover:text-white transition-colors"
                                    >
                                        Forgot password?
                                    </button>
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

                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 text-white bg-white/10 p-3 rounded-xl text-sm justify-center border border-white/20"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    {success}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={!isLoginValid || isLoading}
                                className={`w-full h-13 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${isLoginValid && !isLoading
                                    ? "bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10 active:scale-[0.98]"
                                    : "bg-white/10 text-white/30 cursor-not-allowed"
                                    }`}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-white/50" />
                                ) : (
                                    <>
                                        Sign In
                                        <ChevronRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>


                        </motion.form>
                    )}
                    {mode === 'signup' && (
                        <motion.form
                            key="signup-form"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={onSubmit}
                            className="w-full space-y-5"
                        >
                            {signupStep === 1 ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative group">
                                            <Type strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40 transition-colors group-focus-within:text-white" />
                                            <input
                                                type="text"
                                                placeholder="First Name"
                                                className="w-full h-13 bg-white/5 rounded-2xl pl-12 pr-4 text-white placeholder:text-white/30 outline-none focus:ring-0 focus:ring-white/20 transition-all invalid:border-red-500/50"
                                                value={signupData.firstName}
                                                onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
                                            />
                                        </div>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                placeholder="Last Name"
                                                className="w-full h-13 bg-white/5 rounded-2xl pl-4 pr-4 text-white placeholder:text-white/30 outline-none focus:ring-0 focus:ring-white/20 transition-all"
                                                value={signupData.lastName}
                                                onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="relative group">
                                        <Mail strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40 transition-colors group-focus-within:text-white" />
                                        <input
                                            type="email"
                                            placeholder="Email Address"
                                            className="w-full h-13 bg-white/5 rounded-2xl pl-12 pr-4 text-white placeholder:text-white/30 outline-none focus:ring-0 focus:ring-white/20 transition-all"
                                            value={signupData.email}
                                            onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                                        />
                                    </div>

                                    <div className="relative group">
                                        <User strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40 transition-colors group-focus-within:text-white" />
                                        <input
                                            type="text"
                                            placeholder="Username"
                                            autoComplete="off"
                                            className="w-full h-13 bg-white/5 rounded-2xl pl-12 pr-4 text-white placeholder:text-white/30 outline-none focus:ring-0 focus:ring-white/20 transition-all"
                                            value={signupData.username}
                                            onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                                        />
                                    </div>
                                </div>
                            ) : signupStep === 2 ? (
                                <div className="space-y-6">
                                    <p className="text-white/60 text-sm text-center px-4">
                                        We sent a 4-digit verification code to <span className="text-white font-medium">{signupData.email}</span>
                                    </p>
                                    <div className="flex justify-center gap-3">
                                        {[0, 1, 2, 3].map((index) => (
                                            <input
                                                key={index}
                                                id={`otp-${index}`}
                                                type="text"
                                                maxLength={1}
                                                className="w-14 h-16 bg-white/5 rounded-2xl text-center text-2xl font-bold text-white outline-none focus:bg-white/10 transition-all"
                                                value={signupData.otp[index] || ""}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^0-9a-zA-Z]/g, '').toUpperCase().slice(0, 1);
                                                    const currentOtp = signupData.otp.split('');
                                                    while (currentOtp.length < 4) currentOtp.push('');
                                                    currentOtp[index] = val;
                                                    const newOtp = currentOtp.join('').slice(0, 4);
                                                    setSignupData({ ...signupData, otp: newOtp });

                                                    if (val && index < 3) {
                                                        const nextInput = document.getElementById(`otp-${index + 1}`);
                                                        nextInput?.focus();
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Backspace' && !signupData.otp[index] && index > 0) {
                                                        const prevInput = document.getElementById(`otp-${index - 1}`);
                                                        prevInput?.focus();
                                                    }
                                                }}
                                                onPaste={(e) => {
                                                    e.preventDefault();
                                                    const pastedData = e.clipboardData.getData('text').toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 4);
                                                    setSignupData({ ...signupData, otp: pastedData });
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <Lock strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40 transition-colors group-focus-within:text-white" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Create Password"
                                            autoComplete="new-password"
                                            className="w-full h-13 bg-white/5 rounded-2xl pl-12 pr-12 text-white placeholder:text-white/30 outline-none focus:ring-0 focus:ring-white/20 transition-all"
                                            value={signupData.password}
                                            onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
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
                                    <div className="text-white/40 text-[13px] text-center">
                                        Password must be at least 8 characters
                                    </div>
                                </div>
                            )}

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
                                disabled={!((signupStep === 1 && isSignupStep1Valid) || (signupStep === 2 && isSignupStep2Valid) || (signupStep === 3 && isSignupStep3Valid)) || isLoading}
                                className={`w-full h-13 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${((signupStep === 1 && isSignupStep1Valid) || (signupStep === 2 && isSignupStep2Valid) || (signupStep === 3 && isSignupStep3Valid)) && !isLoading
                                    ? "bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10 active:scale-[0.98]"
                                    : "bg-white/10 text-white/30 cursor-not-allowed"
                                    }`}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-white/50" />
                                ) : (
                                    <>
                                        {signupStep === 1 ? "Start Signup" : signupStep === 2 ? "Verify OTP" : "Create Account"}
                                        <ChevronRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>


                        </motion.form>
                    )}
                    {mode === 'forgot-password' && (
                        <motion.form
                            key="forgot-password-form"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleForgotPassword}
                            className="w-full space-y-5"
                        >
                            {!isForgotPasswordSuccess ? (
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <Mail strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40 transition-colors group-focus-within:text-white" />
                                        <input
                                            type="email"
                                            placeholder="Email Address"
                                            className="w-full h-13 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-white placeholder:text-white/30 outline-none focus:ring-0 focus:ring-white/20 transition-all"
                                            value={forgotPasswordEmail}
                                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col p-4 border border-white/5 items-center justify-center py-6 text-center space-y-4 rounded-xl">
                                    <div className="w-16 h-16 bg-zinc-500/10 rounded-full flex items-center justify-center text-white">
                                        <Mail className="w-8 h-8" />
                                    </div>
                                    <p className="text-white">
                                        Check your email for instructions to reset your password.
                                    </p>
                                </div>
                            )}

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

                            {success && !isForgotPasswordSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 text-white bg-white/10 p-3 rounded-xl text-sm justify-center border border-white/20"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    {success}
                                </motion.div>
                            )}

                            {!isForgotPasswordSuccess && (
                                <button
                                    type="submit"
                                    disabled={!isForgotPasswordValid || isLoading}
                                    className={`w-full h-13 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${isForgotPasswordValid && !isLoading
                                        ? "bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10 active:scale-[0.98]"
                                        : "bg-white/10 text-white/30 cursor-not-allowed"
                                        }`}
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-white/50" />
                                    ) : (
                                        <>
                                            Send Reset Link
                                            <ChevronRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setMode('login');
                                    setError("");
                                    setSuccess("");
                                    setIsForgotPasswordSuccess(false);
                                }}
                                className="w-full mt-4 flex items-center justify-center gap-2 text-white/40 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Sign In
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>

                {
                    mode !== 'forgot-password' && (
                        <div className="mt-8 pt-6 border-t border-white/5 w-full text-center md:text-left">
                            <button
                                type="button"
                                onClick={toggleMode}
                                className="text-white/40 text-sm hover:text-white/60 transition-colors"
                            >
                                {mode === 'login' ? (
                                    <>Don't have an account? <span className="text-white hover:underline font-medium">Create one</span></>
                                ) : (
                                    <>Already have an account? <span className="text-white hover:underline font-medium">Sign In</span></>
                                )}
                            </button>
                        </div>
                    )
                }
            </div>
        </motion.div >
    );
}
