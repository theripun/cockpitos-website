"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  Info,
  ChevronDown,
  CreditCard,
  Wallet,
  Smartphone,
  TreePalm,
  ScanIcon,
} from "lucide-react";
import { BASE_URL } from "@/lib/baseURL";
import { cn } from "@/lib/utils";
import {
  type BillingCountryCode,
  BILLING_COUNTRIES,
  BILLING_COUNTRY_SELECT_OPTIONS,
} from "./billing-address-config";

/** USD display, always 2 decimals */
function usd(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const MONTHLY_USD = 19;
/** Annual = 10× monthly (two months free vs paying monthly for a year). */
const ANNUAL_USD = Math.round(MONTHLY_USD * 10 * 100) / 100;
const MONTHLY_TIMES_12 = Math.round(MONTHLY_USD * 12 * 100) / 100;
const ANNUAL_SAVINGS_VS_MONTHLY = Math.round((MONTHLY_TIMES_12 - ANNUAL_USD) * 100) / 100;
const TAX_RATE = 0.18;
const PROMO_CODE = "WELCOME80";
const PROMO_DISCOUNT_RATE = 0.80;
const PROMO_DISCOUNT_PERCENT = 80;

function checkoutTotals(annual: boolean, promoDiscountActive: boolean) {
  const grossSubtotal = annual ? ANNUAL_USD : MONTHLY_USD;
  const discountAmount = promoDiscountActive
    ? Math.round(grossSubtotal * PROMO_DISCOUNT_RATE * 100) / 100
    : 0;
  const taxableSubtotal =
    Math.round((grossSubtotal - discountAmount) * 100) / 100;
  const tax = Math.round(taxableSubtotal * TAX_RATE * 100) / 100;
  const total = Math.round((taxableSubtotal + tax) * 100) / 100;
  return {
    grossSubtotal,
    discountAmount,
    taxableSubtotal,
    tax,
    total,
  };
}

type ConfettiOpts = NonNullable<Parameters<typeof confetti>[0]>;

const PROMO_CONFETTI_COLORS = ["#ffffff"];

function promoConfettiOriginFromElement(el: HTMLElement | null) {
  if (typeof window === "undefined" || !el) {
    return { x: 0.5, y: 0.5 };
  }
  const rect = el.getBoundingClientRect();
  const w = window.innerWidth || 1;
  const h = window.innerHeight || 1;
  const x = (rect.left + rect.width / 2) / w;
  const y = (rect.top + rect.height / 2) / h;
  return {
    x: Math.min(0.99, Math.max(0.01, x)),
    y: Math.min(0.99, Math.max(0.01, y)),
  };
}

let promoChimeAudioContext: AudioContext | null = null;

function getPromoChimeAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctx = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    if (!promoChimeAudioContext || promoChimeAudioContext.state === "closed") {
      promoChimeAudioContext = new Ctx();
    }
    if (promoChimeAudioContext.state === "suspended") {
      void promoChimeAudioContext.resume();
    }
    return promoChimeAudioContext;
  } catch {
    return null;
  }
}

/** Very soft two-note chime; skips when reduced motion is preferred. */
function playSoftPromoChime() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ctx = getPromoChimeAudioContext();
  if (!ctx) return;

  const master = ctx.createGain();
  master.gain.value = 0.055;
  master.connect(ctx.destination);

  const notes = [
    { hz: 392, at: 0 },
    { hz: 523.25, at: 0.07 },
  ] as const;

  notes.forEach(({ hz, at }) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(hz, ctx.currentTime + at);

    const g = ctx.createGain();
    const t0 = ctx.currentTime + at;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.32, t0 + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.42);

    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + 0.48);
  });
}

function firePromoConfettiNearElement(el: HTMLElement | null) {
  if (typeof window === "undefined") return;

  const origin = promoConfettiOriginFromElement(el);
  const count = 150;
  const base: ConfettiOpts = {
    origin,
    disableForReducedMotion: true,
    colors: PROMO_CONFETTI_COLORS,
    zIndex: 9998,
  };

  const shoot = (particleRatio: number, opts: ConfettiOpts) => {
    void confetti({
      ...base,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  };

  shoot(0.28, { spread: 42, startVelocity: 38, angle: 90 });
  shoot(0.22, { spread: 68, startVelocity: 32 });
  shoot(0.32, { spread: 88, decay: 0.9, scalar: 0.78 });
  shoot(0.1, { spread: 105, startVelocity: 22, decay: 0.92, scalar: 1.05 });
  shoot(0.08, { spread: 115, startVelocity: 34 });

  window.setTimeout(() => {
    shoot(0.14, { spread: 72, startVelocity: 28, scalar: 0.88 });
    shoot(0.1, { spread: 95, startVelocity: 18, decay: 0.93, scalar: 0.95 });
  }, 160);

  playSoftPromoChime();
}

function CardBrandMarks() {
  return (
    <div className="flex items-center gap-2 pr-2">
      <span
        className="text-[12px] font-bold italic tracking-tight text-[#000]"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        VISA
      </span>
      <svg width="34" height="22" viewBox="0 0 34 22" className="shrink-0" aria-hidden>
        <circle cx="13" cy="11" r="9" fill="#EB001B" />
        <circle cx="21" cy="11" r="9" fill="#F79E1B" fillOpacity={0.92} />
      </svg>
    </div>
  );
}

export default function CheckoutClient() {
  const router = useRouter();
  const [annual, setAnnual] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const promoInputRef = useRef<HTMLInputElement>(null);
  const [billingCountry, setBillingCountry] = useState<BillingCountryCode>("IN");
  const [billingPostal, setBillingPostal] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [paymentRail, setPaymentRail] = useState<"card" | "upi" | "paypal">("card");
  const [upiVpa, setUpiVpa] = useState("");
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [checkoutEmailStatus, setCheckoutEmailStatus] = useState<
    "loading" | "ready" | "empty"
  >("loading");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [paypalEmailTouched, setPaypalEmailTouched] = useState(false);

  const promoDiscountActive =
    promoInput.trim().toUpperCase() === PROMO_CODE;

  const { grossSubtotal, discountAmount, tax, total } = checkoutTotals(
    annual,
    promoDiscountActive
  );

  const displayPrice = `$${usd(annual ? ANNUAL_USD : MONTHLY_USD)}`;
  const periodNote = annual ? "per year" : "per month";
  const saveLabel =
    ANNUAL_SAVINGS_VS_MONTHLY >= 0.01
      ? `Save $${usd(ANNUAL_SAVINGS_VS_MONTHLY)}`
      : null;

  useEffect(() => {
    if (promoOpen) {
      promoInputRef.current?.focus();
    }
  }, [promoOpen]);

  useEffect(() => {
    setBillingPostal("");
    setBillingState("");
    setBillingPhone("");
  }, [billingCountry]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCheckoutEmailStatus("loading");
      try {
        const res = await fetch(`${BASE_URL}/auth/me`, { credentials: "include" });
        if (cancelled) return;
        if (!res.ok) {
          setCheckoutEmail("");
          setCheckoutEmailStatus("empty");
          return;
        }
        const data = (await res.json()) as { email?: string };
        if (cancelled) return;
        if (typeof data.email === "string" && data.email.trim()) {
          setCheckoutEmail(data.email.trim());
          setCheckoutEmailStatus("ready");
        } else {
          setCheckoutEmail("");
          setCheckoutEmailStatus("empty");
        }
      } catch {
        if (!cancelled) {
          setCheckoutEmail("");
          setCheckoutEmailStatus("empty");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Prefill PayPal email from account email unless user edited it.
  useEffect(() => {
    if (paypalEmailTouched) return;
    if (checkoutEmailStatus === "ready" && checkoutEmail.trim()) {
      setPaypalEmail(checkoutEmail.trim());
    }
  }, [checkoutEmail, checkoutEmailStatus, paypalEmailTouched]);

  const billingCfg = BILLING_COUNTRIES[billingCountry];

  return (
    <div className="grid h-full min-h-0 w-full grid-rows-[minmax(0,0.78fr)_minmax(0,1.22fr)] bg-white font-sans text-neutral-900 antialiased lg:grid-cols-2 lg:grid-rows-1">
      <aside
        className="relative flex min-h-0 flex-col overflow-hidden text-white lg:h-full pl-25"
        aria-label="Order summary"
      >
        <div className="absolute inset-0 z-0" aria-hidden>
          <Image
            src="/wallpaper/67.jpg"
            alt=""
            fill
            priority
            quality={100}
            className="object-cover object-[50%_18%] bg-black rotate-180 scale-[1.08] origin-center"
          />
          <div className="absolute inset-0 bg-black backdrop-blur-xl" />
        </div>
        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-8 sm:px-10 sm:py-10 lg:h-full lg:px-12 lg:py-12">
          <header className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-md text-white/90 transition hover:bg-white/10"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <img src="/logo/cockpit.svg" alt="Cockpit Logo" className="w-[25px] h-[25px]" />
            <span className="text-lg font-semibold tracking-tight">CockpitOS</span>
          </header>

          <div className="mt-10 space-y-2">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-4xl font-semibold tracking-tight sm:text-[2.75rem]">{displayPrice}</span>
              <span className="text-[15px] font-normal text-white">{periodNote}</span>
            </div>
            <p className="max-w-md pt-2 text-[15px] leading-relaxed text-white">
            Subscribe to CockpitOS Pro Plan - No ads, higher limits, built for steady use.
            </p>
          </div>

          <div className="mt-8 rounded-lg border border-white/10 border-dashed bg-transparent p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="font-medium text-white">CockpitOS Pro Plan</p>
                <p className="mt-0.5 text-sm text-white/65">
                  {annual ? "Billed annually" : "Billed monthly"}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-white">
                ${usd(annual ? ANNUAL_USD : MONTHLY_USD)}
                <span className="font-normal text-white">
                  {annual ? " / yr" : " / mo"}
                </span>
              </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={annual}
                onClick={() => setAnnual(!annual)}
                className={cn(
                  "relative h-7 w-12 shrink-0 rounded-full transition-colors cursor-pointer",
                  annual ? "bg-white/20" : "bg-white/20 "
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
                    annual && "translate-x-5"
                  )}
                />
              </button>
              {saveLabel ? (
                <span className="rounded bg-white/20 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {saveLabel}
                </span>
              ) : null}
              <span className="text-sm text-white/65">with annual billing</span>
              <span className="w-full text-sm font-medium tabular-nums text-white/90 sm:ml-auto sm:w-auto">
                ${usd(ANNUAL_USD)} / year
              </span>
            </div>
          </div>

          <div className="mt-10 space-y-0 text-[15px]">
            <div className="flex justify-between border-b border-white/10 py-3 text-white/70">
              <span>Subtotal</span>
              <span className="tabular-nums text-white">${usd(grossSubtotal)}</span>
            </div>
            {promoDiscountActive ? (
              <div className="flex justify-between border-b border-white/10 py-3 text-white font-semibold">
                <span>Promotion ({PROMO_CODE})</span>
                <span className="tabular-nums">−${usd(discountAmount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between border-b border-white/10 py-3 text-white/70">
              <span className="inline-flex items-center gap-1.5">
                <span>
                  Tax <span className="text-white/40">(18%)</span>
                </span>
                <button
                  type="button"
                  className="group relative inline-flex shrink-0 rounded p-0.5 text-white/45 transition hover:text-white/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/35"
                  aria-label="How tax is calculated"
                >
                  <Info className="h-3.5 w-3.5" aria-hidden />
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-50 w-[min(260px,calc(100vw-3rem))] -translate-x-1/2 rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-left text-[11px] font-normal leading-snug text-white/90 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                  >
                    Tax is 18% of your plan subtotal after any promotion discount. Your total updates
                    automatically.
                  </span>
                </button>
              </span>
              <span className="tabular-nums text-white">${usd(tax)}</span>
            </div>
            <div className="flex justify-between py-4 text-base font-semibold text-white">
              <span>Total due today</span>
              <span className="tabular-nums">${usd(total)}</span>
            </div>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setPromoOpen((o) => !o)}
                className="text-left text-sm text-white/70 underline decoration-white/30 underline-offset-4 transition hover:text-white"
              >
                {promoOpen ? "Hide promotion code" : "Add promotion code"}
              </button>
              {promoOpen ? (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    ref={promoInputRef}
                    id="checkout-promo"
                    type="text"
                    value={promoInput}
                    onChange={(e) => {
                      const next = e.target.value;
                      const wasActive =
                        promoInput.trim().toUpperCase() === PROMO_CODE;
                      const nowActive =
                        next.trim().toUpperCase() === PROMO_CODE;
                      setPromoInput(next);
                      if (nowActive && !wasActive) {
                        firePromoConfettiNearElement(e.currentTarget);
                      }
                    }}
                    placeholder="Enter code"
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full rounded-md uppercase border border-white/15 bg-white/5 px-3 py-2 text-[14px] text-white placeholder:text-white/35 outline-none focus:border-white/30 focus:ring-0 sm:max-w-[220px]"
                  />
                  {promoDiscountActive ? (
                    <span className="text-[12px] font-semibold text-white">
                      Exclusive Savings: {PROMO_DISCOUNT_PERCENT}% Off for a Limited Time
                    </span>
                  ) : promoInput.trim().length >= PROMO_CODE.length && !promoDiscountActive ? (
                    <span className="text-[12px] text-white">Invalid code</span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <footer className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-16 text-xs text-white/40">
            <span>©2026 Cockpit. Owned and developed by Ripun Basumatary.</span>
            <Link href="https://theripun.com" className="underline decoration-white/25 underline-offset-2 hover:text-white/60">
              theripun.com
            </Link>
            <Link href="#" className="underline decoration-white/25 underline-offset-2 hover:text-white/60">
              Terms
            </Link>
            <Link href="#" className="underline decoration-white/25 underline-offset-2 hover:text-white/60">
              Privacy
            </Link>
          </footer>
        </div>
      </aside>

      <section
        className="flex min-h-0 w-full flex-col overflow-y-auto overscroll-y-contain bg-white px-6 py-9 text-neutral-900 sm:px-10 sm:py-11 lg:h-full lg:px-12 lg:py-14 xl:px-16"
        aria-label="Payment"
      >
        {/* Constrain content width (keep panel width) */}
        <div className="mx-auto w-full max-w-[450px] lg:max-w-[420px]">
          <h1 className="text-[1.35rem] font-bold tracking-tight text-neutral-900 sm:text-2xl lg:text-[1.75rem]">
            Payment Method
          </h1>

          <div
            className="mt-5 flex rounded-full border-2 border-black/5 bg-transparent p-1"
            role="group"
            aria-label="Payment type"
          >
            <button
              type="button"
              onClick={() => setPaymentRail("card")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-[13px] font-semibold transition",
                paymentRail === "card"
                  ? "bg-black text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              Card
            </button>
            <button
              type="button"
              onClick={() => setPaymentRail("upi")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-[13px] font-semibold transition",
                paymentRail === "upi"
                  ? "bg-black text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              UPI
            </button>
            <button
              type="button"
              onClick={() => setPaymentRail("paypal")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-[13px] font-semibold transition",
                paymentRail === "paypal"
                  ? "bg-black text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              PayPal
            </button>
          </div>

          <form
            className="mt-6 flex w-full flex-col gap-4"
            onSubmit={(e) => e.preventDefault()}
          >
          <div className="rounded-lg border border-neutral-200 bg-transparent px-4 py-3">
            <p
              className="text-[12px] leading-snug text-neutral-700"
              aria-live="polite"
              aria-busy={checkoutEmailStatus === "loading"}
            >
              {checkoutEmailStatus === "loading" ? (
                "Loading your account…"
              ) : checkoutEmailStatus === "ready" ? (
                <>
                  You&apos;re signed in as{" "}
                  <span className="font-semibold text-neutral-900 break-all">{checkoutEmail}</span>.
                </>
              ) : (
                "We couldn't load your account email. Sign in with the account you want to subscribe, then return to checkout."
              )}
            </p>
            {checkoutEmailStatus === "ready" ? (
              <p className="mt-1 text-[11px] leading-snug text-neutral-500">
                Subscriptions and receipts will go to this email.
              </p>
            ) : null}
          </div>

          {paymentRail === "card" ? (
            <>
              <div className="space-y-1.5">
                <label htmlFor="checkout-name" className="text-[13px] font-medium text-neutral-700">
                  Name on card
                </label>
                <input
                  id="checkout-name"
                  type="text"
                  placeholder="Enter your name"
                  className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2.5 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[13px] font-medium text-neutral-700">Debit/credit card</span>
                <div className="overflow-hidden rounded-md border border-neutral-200 bg-white">
                  <div className="flex items-center border-b border-neutral-200">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="Card number"
                      className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none focus:ring-0"
                    />
                    <CardBrandMarks />
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-neutral-200">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM/YY"
                      className="border-0 bg-transparent px-3 py-2.5 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none focus:ring-0"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="CVC"
                      className="border-0 bg-transparent px-3 py-2.5 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none focus:ring-0"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : paymentRail === "upi" ? (
            <div className="space-y-1.5">
              <label htmlFor="checkout-upi-vpa" className="text-[13px] font-medium text-neutral-700">
                UPI ID (VPA)
              </label>
              <input
                id="checkout-upi-vpa"
                type="text"
                inputMode="email"
                autoComplete="off"
                spellCheck={false}
                value={upiVpa}
                onChange={(e) => setUpiVpa(e.target.value)}
                placeholder="you@upi"
                className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2.5 font-mono text-[15px] text-neutral-900 placeholder:text-neutral-400 placeholder:font-sans outline-none transition focus:border-neutral-400"
              />
              <p className="text-[11px] leading-snug text-neutral-500">
                Enter the UPI ID from Google Pay, PhonePe, Paytm, or your bank app. You&apos;ll confirm the
                request in your UPI app.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-4">
              <p className="text-[13px] font-medium text-neutral-900">Pay with PayPal</p>
              <p className="mt-2 text-[11px] leading-snug text-neutral-500">
                You&apos;ll be redirected to PayPal to complete your subscription securely, then returned here.
              </p>
              <div className="mt-3 space-y-1.5">
                <label htmlFor="paypal-email" className="text-[13px] font-medium text-neutral-700">
                  PayPal email
                </label>
                <input
                  id="paypal-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="name@domain.com"
                  value={paypalEmail}
                  onChange={(e) => {
                    setPaypalEmailTouched(true);
                    setPaypalEmail(e.target.value);
                  }}
                  className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2.5 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-neutral-400"
                />
                <p className="text-[11px] leading-snug text-neutral-500">
                  We&apos;ll use this to start your PayPal checkout.
                </p>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-neutral-200 bg-transparent p-4">
            <div className="mb-3 flex items-start justify-between gap-4 border-b border-neutral-200/80 pb-2">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-neutral-900">
                  Billing details
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Always-visible minimal fields */}
              <div className="space-y-1.5">
                <label htmlFor="billing-country" className="text-[13px] font-medium text-neutral-700">
                  Country
                </label>
                <div className="relative">
                  <select
                    id="billing-country"
                    value={billingCountry}
                    onChange={(e) =>
                      setBillingCountry(e.target.value as BillingCountryCode)
                    }
                    className="w-full appearance-none rounded-md border border-neutral-200 bg-white py-2.5 pl-3 pr-10 text-[15px] text-neutral-900 outline-none transition hover:bg-neutral-50 focus:border-neutral-400 cursor-pointer"
                    aria-label="Country"
                  >
                    {BILLING_COUNTRY_SELECT_OPTIONS.map(({ code }) => {
                      const c = BILLING_COUNTRIES[code];
                      return (
                        <option key={code} value={code}>
                          {c.flag} {c.label}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                    aria-hidden
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="billing-postal" className="text-[13px] font-medium text-neutral-700">
                    {billingCfg.postalLabel}
                  </label>
                  <input
                    id="billing-postal"
                    type="text"
                    value={billingPostal}
                    onChange={(e) => setBillingPostal(e.target.value)}
                    placeholder={billingCfg.postalPlaceholder}
                    autoComplete="postal-code"
                    className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2.5 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400"
                  />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <label htmlFor="billing-state" className="text-[13px] font-medium text-neutral-700">
                    {billingCfg.stateLabel}
                  </label>
                  {billingCfg.states.length > 0 ? (
                    <div className="relative">
                      <select
                        id="billing-state"
                        value={billingState}
                        onChange={(e) => setBillingState(e.target.value)}
                        className="w-full min-w-0 appearance-none rounded-md border border-neutral-200 bg-white py-2.5 pl-3 pr-10 text-[15px] text-neutral-900 outline-none transition hover:bg-neutral-50 focus:border-neutral-400 cursor-pointer"
                      >
                        <option value="">{billingCfg.statePlaceholder}</option>
                        {billingCfg.states.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                        aria-hidden
                      />
                    </div>
                  ) : (
                    <input
                      id="billing-state"
                      type="text"
                      value={billingState}
                      onChange={(e) => setBillingState(e.target.value)}
                      placeholder={billingCfg.statePlaceholder}
                      autoComplete="address-level1"
                      className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2.5 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label htmlFor="billing-street" className="text-[13px] font-medium text-neutral-700">
                    Street
                  </label>
                  <input
                    id="billing-street"
                    type="text"
                    placeholder="Address line"
                    autoComplete="street-address"
                    className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2.5 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="billing-phone" className="text-[13px] font-medium text-neutral-700">
                    {billingCfg.phoneLabel}
                  </label>
                  <input
                    id="billing-phone"
                    type="tel"
                    value={billingPhone}
                    onChange={(e) => setBillingPhone(e.target.value)}
                    placeholder={billingCfg.phonePlaceholder}
                    autoComplete="tel"
                    className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2.5 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400"
                  />
                  <p className="text-[11px] leading-tight text-neutral-500">{billingCfg.phoneHint}</p>
                </div>
              </div>
            </div>
          </div>

          {paymentRail === "card" ? (
            <label className="flex cursor-pointer gap-3 rounded-md border border-transparent py-0.5">
              <input
                type="checkbox"
                checked={saveCard}
                onChange={(e) => setSaveCard(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-300 accent-black focus:ring-black/25 cursor-pointer"
              />
              <span className="text-[13px] leading-snug text-neutral-700">
                <span className="font-medium text-neutral-900">Save for 1-click checkout</span>
                <span className="mt-1 block text-[12px] text-neutral-500">
                  Pay faster on Cockpit and where{" "}
                  <Link
                    href="#"
                    className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-700"
                  >
                    Link
                  </Link>{" "}
                  is accepted
                </span>
              </span>
            </label>
          ) : null}

          <button
            type="submit"
            className="mt-1 w-full rounded-lg bg-black py-3 text-[15px] font-semibold text-white transition hover:bg-black/90 active:scale-[0.998]"
          >
            {paymentRail === "card"
              ? "Subscribe"
              : paymentRail === "upi"
                ? "Pay with UPI"
                : "Continue to PayPal"}
          </button>
          </form>

        <p className="mt-5 w-full text-[12px] leading-relaxed text-neutral-500">
            {paymentRail === "card" ? (
              <>
                By confirming your subscription, you allow us to charge your card for this and future payments
                in accordance with terms. You can always cancel your subscription.
              </>
            ) : paymentRail === "upi" ? (
              <>
                By continuing, you authorize us to initiate a UPI collect request for this subscription. Complete
                the payment in your UPI app. You can cancel your subscription according to our terms.
              </>
            ) : (
              <>
                By continuing, you will be redirected to PayPal to authorize this subscription. You can cancel your
                subscription according to our terms.
              </>
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
