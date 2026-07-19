"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { BASE_URL } from "@/lib/baseURL";
import { getCurrentPlanLabel, type PlanUser } from "@/lib/plan-access";
import { getCsrfToken } from "@/lib/utils";

type PostAuthPricingProps = {
  onContinueFree: () => void;
  onContinuePro: () => void | Promise<void>;
};

const PRO_MONTHLY_USD = 19;
const PRO_PROMO_PRICE = 0;
const OFFER_STORAGE_KEY = "cockpit_welcome80_offer_deadline";
const OFFER_DURATION_MS = 12 * 60 * 60 * 1000;

function formatUsd(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Timer UI is temporarily hidden. Keep this helper with the commented timer block below.
// function pad2(n: number) {
//   return n.toString().padStart(2, "0");
// }

function useWelcomeOfferCountdown() {
  const [deadlineMs, setDeadlineMs] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const now = Date.now();
    const raw = localStorage.getItem(OFFER_STORAGE_KEY);
    let end: number;
    if (raw) {
      const parsed = parseInt(raw, 10);
      end = !Number.isNaN(parsed) && parsed > now ? parsed : now + OFFER_DURATION_MS;
      if (end !== parsed) localStorage.setItem(OFFER_STORAGE_KEY, String(end));
    } else {
      end = now + OFFER_DURATION_MS;
      localStorage.setItem(OFFER_STORAGE_KEY, String(end));
    }
    const id = window.setTimeout(() => {
      setDeadlineMs(end);
      setRemainingMs(Math.max(0, end - now));
      setReady(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (deadlineMs == null) return;
    const tick = () => setRemainingMs(Math.max(0, deadlineMs - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [deadlineMs]);

  const active = ready && remainingMs > 0;
  const h = Math.floor(remainingMs / 3_600_000);
  const m = Math.floor((remainingMs % 3_600_000) / 60_000);
  const s = Math.floor((remainingMs % 60_000) / 1000);

  return { ready, active, h, m, s, remainingMs };
}

const freeFeatures = [
  { label: "Ads", value: "Ad-supported" },
  { label: "Device capacity", value: "Up to 2" },
  { label: "Bandwidth", value: "50 GB" },
  { label: "Storage", value: "100 GB" },
  { label: "API requests", value: "5,000 / mo" },
];

const proFeatures = [
  { label: "Ads", value: "None" },
  { label: "Device capacity", value: "Unlimited" },
  { label: "Bandwidth", value: "1 TB" },
  { label: "Storage", value: "1,000 GB" },
  { label: "API requests", value: "Unlimited" },
  { label: "Intro offer", value: "Free for 1 year" },
];

function FeatureRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-white/[0.08] last:border-0 text-[12px]">
      <span className="text-white/50">{label}</span>
      <span className="text-white text-right font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function PromoHero({
  active,
  ready,
}: {
  active: boolean;
  ready: boolean;
}) {
  if (!ready || !active) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="relative mb-5 overflow-hidden rounded-none bg-black/10 p-[1px] lg:mb-0 lg:h-full"
    >
      <div className="relative h-full overflow-hidden rounded-none bg-black/50 px-5 py-5 backdrop-blur-2xl sm:px-7 sm:py-6">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-transparent blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-transparent blur-3xl"
          aria-hidden
        />
        {/* <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
          aria-hidden
        /> */}

        <div className="relative flex h-full flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 lg:flex-col lg:items-start lg:justify-center lg:gap-8">
          <div className="min-w-0 space-y-2 lg:w-full">
            
            <h2 className="text-balance text-2xl font-bold tracking-tight text-white sm:text-[1.65rem] sm:leading-tight">
              <span className="text-white">
                Pro is free
              </span>{" "}
              for your first year
            </h2>
            <p className="max-w-md text-[13px] leading-snug text-white/65 lg:max-w-none">
              Start with the full Cockpit experience today. No checkout is required right now, and you can cancel anytime before renewal.
                        </p>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="rounded-none border border-white/20 bg-white/[0.08] px-3 py-1.5 text-[12px] font-semibold text-white">
                $0.00 today
              </span>
              <span className="text-[12px] text-white/50">Full Pro access for 12 months</span>
            </div>
            <div className="border-t border-white/10 pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
                Developer-granted offer
              </p>
              <p className="mt-2 text-[13px] leading-snug text-white/65">
                This one-year Pro access has been given by{" "}
                <span className="font-semibold text-white">Ripun Basumatary</span>, the developer
                of CockpitOS at{" "}
                <a
                  href="https://theripun.com"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-white underline decoration-white/25 underline-offset-2 hover:text-white/80"
                >
                  theripun.com
                </a>
                .
              </p>
            </div>
          </div>

          {/* Timer kept for later reactivation.
          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end lg:w-full lg:items-start">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
              <Timer className="h-3.5 w-3.5 text-white" aria-hidden />
              Ends in
            </div>
            <div
              className="grid grid-cols-3 gap-2 sm:gap-2.5 lg:w-full"
              role="timer"
              aria-live="polite"
              aria-label={`Offer ends in ${h} hours, ${m} minutes, ${s} seconds`}
            >
              {[
                { v: pad2(h), l: "hrs" },
                { v: pad2(m), l: "min" },
                { v: pad2(s), l: "sec" },
              ].map((unit) => (
                <div
                  key={unit.l}
                  className="flex min-w-[4.25rem] flex-col items-center rounded-xl border border-white/0 bg-transparent px-2.5 py-2.5 shadow-inner shadow-white/40 sm:min-w-[4.75rem] lg:min-w-0"
                >
                  <span className="text-[22px] font-bold tabular-nums leading-none text-white sm:text-2xl">
                    {unit.v}
                  </span>
                  <span className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-white/40">
                    {unit.l}
                  </span>
                </div>
              ))}
            </div>
          </div>
          */}
        </div>
      </div>
    </motion.div>
  );
}

function hasExplicitPlanData(user: PlanUser) {
  if (!user || typeof user !== "object") return false;

  return [
    "plan",
    "planName",
    "subscriptionPlan",
    "subscriptionTier",
    "tier",
    "subscriptionStatus",
    "planStatus",
    "billingStatus",
    "status",
  ].some((key) => typeof user[key] === "string" && user[key].trim().length > 0);
}

export function PostAuthPricing({ onContinueFree, onContinuePro }: PostAuthPricingProps) {
  const { ready } = useWelcomeOfferCountdown();
  const active = ready;
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentPlanLabel, setCurrentPlanLabel] = useState("Free Plan");
  const [proLoading, setProLoading] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [modal, setModal] = useState<"free" | "pro" | null>(null);
  const isPaidPlanSelected = currentPlanLabel !== "Free Plan";

  const getReadyCsrfToken = useCallback(async () => {
    let token = getCsrfToken();
    if (token) return token;

    await fetch(`${BASE_URL}/auth/csrf`, { credentials: "include" });
    token = getCsrfToken();
    if (!token) {
      throw new Error("Security token missing. Refresh the page and try again.");
    }
    return token;
  }, []);

  const activateProOffer = useCallback(async () => {
    const token = await getReadyCsrfToken();
    const res = await fetch(`${BASE_URL}/users/me/subscription/pro-offer`, {
      method: "POST",
      credentials: "include",
      headers: {
        "x-csrf-token": token,
      },
    });

    if (!res.ok) {
      throw new Error("Could not activate Pro. Please try again.");
    }

    return (await res.json()) as PlanUser;
  }, [getReadyCsrfToken]);

  const setPlanFromBackend = useCallback((user: PlanUser) => {
    setCurrentPlanLabel(getCurrentPlanLabel(user));
  }, []);

  const continueAfterFreeSelection = useCallback(() => {
    if (isPaidPlanSelected) return;
    onContinueFree();
  }, [isPaidPlanSelected, onContinueFree]);

  const continueAfterProActivation = useCallback(async () => {
    if (proLoading) return;
    setActivationError(null);
    setProLoading(true);
    try {
      const data = await activateProOffer();
      setPlanFromBackend(data);
      await Promise.resolve(onContinuePro());
    } catch (e) {
      console.error(e);
      setActivationError(e instanceof Error ? e.message : "Could not activate Pro. Please try again.");
      setProLoading(false);
    }
  }, [activateProOffer, onContinuePro, proLoading, setPlanFromBackend]);

  const handleContinuePro = useCallback(async () => {
    if (proLoading) return;
    if (isPaidPlanSelected) {
      await continueAfterProActivation();
      return;
    }
    setActivationError(null);
    setModal("pro");
  }, [continueAfterProActivation, isPaidPlanSelected, proLoading]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/me`, { credentials: "include" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as PlanUser & { email?: string };
        if (typeof data?.email === "string" && !cancelled) setUserEmail(data.email);
        if (!cancelled && hasExplicitPlanData(data)) {
          setPlanFromBackend(data);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setPlanFromBackend]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className={`mx-auto w-full rounded-none ${
          ready && active
            ? "grid max-w-[1140px] grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,760px)] xl:items-stretch xl:justify-center"
            : "max-w-[720px]"
        }`}
      >
        <PromoHero active={active} ready={ready} />

      <div
        className={`rounded-none bg-black/25 backdrop-blur-xl transition-shadow duration-500 ${
          active
            ? "shadow-[0_24px_64px_rgba(0,0,0,0.35),0_0_80px_-20px_rgba(251,191,36,0.15)]"
            : "shadow-[0_24px_64px_rgba(0,0,0,0.35)]"
        }`}
      >
        <header className="px-6 py-4 border-b border-white/10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-white tracking-tight">Select a Plan</h1>
              <p className="mt-1 text-[13px] leading-snug">
                {userEmail ? (
                  <>
                    <span className="text-white/55">You&apos;re signed in as </span>
                    <span className="font-semibold text-white break-all">{userEmail}</span>
                    <span className="text-white/55">. Pick a tier to continue.</span>
                  </>
                ) : (
                  <span className="text-white/55">
                    You&apos;re signed in. Pick a tier to continue.
                  </span>
                )}
              </p>
            </div>
            <div className="shrink-0 rounded-none border border-white/15 bg-white/[0.06] px-3 py-2 text-left sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                Current plan
              </p>
              <p className="mt-0.5 text-[13px] font-semibold text-white">{currentPlanLabel}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
          <article className="flex flex-col p-6 rounded-none min-h-[min-content]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white mb-2">
              Free forever
            </p>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-[28px] font-semibold text-white tracking-tight tabular-nums">$0</span>
              <span className="text-[13px] text-white/50">/ month</span>
            </div>
            <p className="text-[13px] text-white/60 mb-4 leading-relaxed">
              Enough to try Cockpit and run a small footprint.
            </p>
            <div className="mb-4 flex-1">
              {freeFeatures.map((f) => (
                <FeatureRow key={f.label} label={f.label} value={f.value} />
              ))}
            </div>
            <p className="text-[11px] text-white/45 mb-3">Limited trial experience.</p>
            <button
              type="button"
              disabled={isPaidPlanSelected}
              onClick={() => {
                if (isPaidPlanSelected) return;
                setModal("free");
              }}
              className="w-full h-10 text-[13px] font-medium flex items-center justify-center gap-1.5 bg-white/5 border border-white/15 text-white hover:bg-white/10 rounded-none transition-colors disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.03] disabled:text-white/35 disabled:hover:bg-white/[0.03]"
            >
              {isPaidPlanSelected ? "Free unavailable on Pro" : "Continue with Free"}
              {!isPaidPlanSelected ? <ChevronRight className="w-4 h-4 opacity-90" /> : null}
            </button>
          </article>

          <article className="flex flex-col p-6 rounded-none min-h-[min-content] border-t sm:border-t-0 border-white/10 sm:border-0 bg-white/[0.04]">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                Pro plan
              </p>
              {ready && active ? (
                <span className="rounded-full border border-zinc-400/35 bg-zinc-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                  Free for 1 year
                </span>
              ) : null}
            </div>
            <div className="mb-2 flex min-h-[3.25rem] flex-col gap-1">
              {!ready ? (
                <div className="flex flex-col gap-2 pt-1">
                  <div className="h-9 w-40 max-w-full animate-pulse rounded-md bg-white/[0.08]" />
                  <div className="h-4 w-24 animate-pulse rounded bg-white/[0.06]" />
                </div>
              ) : active ? (
                <>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                    <span className="text-[32px] font-bold tracking-tight tabular-nums text-white sm:text-[34px]">
                      ${formatUsd(PRO_PROMO_PRICE)}
                    </span>
                    <span className="text-[13px] text-white/45">for 1 year</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[15px] font-medium tabular-nums text-white/35 line-through decoration-white/25">
                      ${formatUsd(PRO_MONTHLY_USD)}
                    </span>
                    <span className="text-[11px] text-white/40">regular</span>
                  </div>
                </>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[28px] font-semibold text-white tracking-tight tabular-nums">
                    ${formatUsd(PRO_MONTHLY_USD)}
                  </span>
                  <span className="text-[13px] text-white/50">/ month</span>
                </div>
              )}
            </div>
            <p className="text-[13px] text-white/60 mb-4 leading-relaxed">
              No ads, higher limits, the full Cockpit experience. Cancel anytime before renewal.
            </p>
            <div className="mb-4 flex-1">
              {proFeatures.map((f) => (
                <FeatureRow key={f.label} label={f.label} value={f.value} />
              ))}
            </div>
            <button
              type="button"
              disabled={proLoading}
              onClick={() => void handleContinuePro()}
              className="relative h-11 w-full overflow-hidden rounded-none bg-white text-[13px] font-medium text-neutral-900 transition-[box-shadow,transform] duration-200 hover:bg-white/90 enabled:hover:shadow-[0_0_24px_rgba(255,255,255,0.2)] disabled:cursor-wait disabled:opacity-95"
            >
              {proLoading ? (
                <motion.div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-neutral-900/[0.07] to-transparent"
                  initial={{ x: "-60%" }}
                  animate={{ x: "160%" }}
                  transition={{ duration: 1.15, repeat: Infinity, ease: "linear" }}
                  aria-hidden
                />
              ) : null}
              <span className="relative flex min-h-[2.75rem] items-center justify-center gap-2 px-3">
                <AnimatePresence mode="wait" initial={false}>
                  {proLoading ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -5, filter: "blur(3px)" }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="flex items-center justify-center gap-2"
                    >
                      <Loader2
                        className="h-4 w-4 shrink-0 animate-spin text-neutral-800"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                      <span className="tabular-nums">Activating Pro…</span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0, y: 5, filter: "blur(3px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -4, filter: "blur(3px)" }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="flex items-center justify-center gap-1.5"
                    >
                      {isPaidPlanSelected ? "Continue with Pro" : "Activate Pro for Free"}
                      <ChevronRight className="h-4 w-4 opacity-80" aria-hidden />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </button>
            <p className="text-[11px] text-white/40 mt-3 text-center sm:text-left leading-snug">
              Free for 12 months. You can cancel anytime before renewal.
            </p>
            {activationError ? (
              <p className="mt-2 text-center text-[11px] font-medium leading-snug text-red-200 sm:text-left">
                {activationError}
              </p>
            ) : null}
          </article>
        </div>
      </div>
    </motion.div>

      <AnimatePresence>
        {modal ? (
          <motion.div
            className="fixed inset-0 z-[220] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[420px] rounded-none bg-white p-7 text-black shadow-2xl"
            >
              {modal === "pro" ? (
                <>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-none bg-black text-white">
                    <CheckCircle2 className="h-6 w-6" aria-hidden />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">Pro plan activated</h2>
                  <p className="mt-3 text-[15px] leading-6 text-neutral-600">
                    Your first year of Cockpit Pro is free. You now have the full experience with no ads, higher limits, and complete device access. You can cancel anytime before renewal.
                  </p>
                  {activationError ? (
                    <p className="mt-4 text-[13px] font-medium leading-5 text-red-600">
                      {activationError}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    disabled={proLoading}
                    onClick={() => void continueAfterProActivation()}
                    className="mt-7 h-11 w-full rounded-none bg-black text-[14px] font-semibold text-white transition-colors hover:bg-neutral-900 disabled:cursor-wait disabled:opacity-70"
                  >
                    {proLoading ? "Activating..." : "Continue"}
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold tracking-tight">We recommend Pro</h2>
                  <p className="mt-3 text-[15px] leading-6 text-neutral-600">
                    Free works for a small trial, but Cockpit is designed to be experienced with Pro: no ads, higher limits, and the full server desktop. For now, Pro is free for your first year.
                  </p>
                  <div className="mt-7 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={isPaidPlanSelected}
                      onClick={continueAfterFreeSelection}
                      className="h-11 rounded-none border border-neutral-200 bg-white text-[14px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400"
                    >
                      {isPaidPlanSelected ? "Pro is active" : "Continue free"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActivationError(null);
                        setModal("pro");
                      }}
                      className="h-11 rounded-none bg-black text-[14px] font-semibold text-white transition-colors hover:bg-neutral-900"
                    >
                      Get Pro free
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
