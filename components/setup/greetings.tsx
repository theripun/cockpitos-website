"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronsDown } from "lucide-react";
import "./greetings.css";
import { CommercialWelcomePolicyArticle } from "@/components/setup/commercial-welcome-policy";
import {
  detectCheckoutRegionSlug,
  storeCheckoutRegionSlug,
} from "@/lib/checkout-region";

type Phase = "hello" | "policy";

const HELLO_MS = 3200;
const SCROLL_END_EPS = 36;
const SPINNER_DOTS = Array.from({ length: 12 }, (_, index) => index);

export function Greetings({ onComplete }: { onComplete: () => void }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("hello");
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setPhase("policy"), HELLO_MS);
    return () => clearTimeout(t);
  }, []);

  const updateScrollEnd = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const atBottom = scrollTop + clientHeight >= scrollHeight - SCROLL_END_EPS;
    if (atBottom) setScrolledToEnd(true);
  }, []);

  useEffect(() => {
    if (phase !== "policy") return;
    let cancelled = false;
    (async () => {
      const slug = await detectCheckoutRegionSlug();
      if (cancelled || typeof window === "undefined") return;
      storeCheckoutRegionSlug(slug);
      const search = window.location.search || "";
      router.replace(`/${slug}${search}`, { scroll: false });
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, router]);

  useEffect(() => {
    if (phase !== "policy") return;
    const el = scrollRef.current;
    if (!el) return;

    const ensureShortContent = () => {
      if (el.scrollHeight <= el.clientHeight + SCROLL_END_EPS) {
        setScrolledToEnd(true);
      }
    };

    ensureShortContent();
    const ro = new ResizeObserver(ensureShortContent);
    ro.observe(el);
    return () => ro.disconnect();
  }, [phase]);

  const handlePolicyScroll = () => updateScrollEnd();

  const toggleAgreed = () => {
    if (!scrolledToEnd || accepting) return;
    setAgreed((v) => !v);
  };

  const handleAgree = () => {
    if (!scrolledToEnd || !agreed || accepting) return;
    setAccepting(true);
    onComplete();
  };

  const handleDecline = () => {
    if (accepting) return;
    if (typeof window === "undefined") return;
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.replace("/");
  };

  return (
    <div
      className={`new__bg absolute inset-0 z-0 flex min-h-0 ${
        phase === "hello" ? "items-center justify-center" : "flex-col items-center justify-center"
      }`}
    >
      {phase === "hello" && (
        <div className="hello__div">
          <svg className="hello__svg" viewBox="0 0 1230.94 414.57">
            <path
              d="M-293.58-104.62S-103.61-205.49-60-366.25c9.13-32.45,9-58.31,0-74-10.72-18.82-49.69-33.21-75.55,31.94-27.82,70.11-52.22,377.24-44.11,322.48s34-176.24,99.89-183.19c37.66-4,49.55,23.58,52.83,47.92a117.06,117.06,0,0,1-3,45.32c-7.17,27.28-20.47,97.67,33.51,96.86,66.93-1,131.91-53.89,159.55-84.49,31.1-36.17,31.1-70.64,19.27-90.25-16.74-29.92-69.47-33-92.79,16.73C62.78-179.86,98.7-93.8,159-81.63S302.7-99.55,393.3-269.92c29.86-58.16,52.85-114.71,46.14-150.08-7.44-39.21-59.74-54.5-92.87-8.7-47,65-61.78,266.62-34.74,308.53S416.62-58,481.52-130.31s133.2-188.56,146.54-256.23c14-71.15-56.94-94.64-88.4-47.32C500.53-375,467.58-229.49,503.3-127a73.73,73.73,0,0,0,23.43,33.67c25.49,20.23,55.1,16,77.46,6.32a111.25,111.25,0,0,0,30.44-19.87c37.73-34.23,29-36.71,64.58-127.53C724-284.3,785-298.63,821-259.13a71,71,0,0,1,13.69,22.56c17.68,46,6.81,80-6.81,107.89-12,24.62-34.56,42.72-61.45,47.91-23.06,4.45-48.37-.35-66.48-24.27a78.88,78.88,0,0,1-12.66-25.8c-14.75-51,4.14-88.76,11-101.41,6.18-11.39,37.26-69.61,103.42-42.24,55.71,23.05,100.66-23.31,100.66-23.31"
              transform="translate(311.08 476.02)"
            />
          </svg>
        </div>
      )}

      {phase === "policy" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.88, ease: [0.22, 1, 0.36, 1] }}
          className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-hidden px-4 pb-6 pt-6 sm:pt-8"
        >

          <div
            className="grid h-[min(82vh,900px)] w-full max-w-[min(34rem,94vw)] grid-rows-[minmax(0,1fr)_auto] overflow-hidden rounded-none bg-white"
            style={{
              boxShadow: "0 24px 64px rgba(0,0,0,0.16), 0 8px 24px rgba(0,0,0,0.08)",
            }}
          >
            <div className="relative min-h-0 min-w-0 overflow-hidden bg-white">
              <div
                ref={scrollRef}
                onScroll={handlePolicyScroll}
                className="policy-paper-scroll h-full w-full overflow-y-scroll overflow-x-hidden overscroll-y-contain bg-white px-5 py-6 sm:px-10 sm:py-8 [-webkit-overflow-scrolling:touch]"
                style={{ touchAction: "pan-y" }}
                role="region"
                aria-label="Commercial welcome and platform usage policy"
              >
                <CommercialWelcomePolicyArticle />
              </div>
              {!scrolledToEnd && (
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] flex justify-center bg-gradient-to-t from-white from-35% via-white/90 to-transparent pb-3 pt-14"
                  aria-hidden
                >
                  <motion.div
                    className="flex flex-col items-center gap-0.5 text-neutral-400"
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ChevronsDown className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.5} />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                      Scroll
                    </span>
                  </motion.div>
                </div>
              )}
            </div>
            <div className="bg-white px-5 py-4 sm:px-8 sm:py-5">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={agreed}
                    aria-disabled={!scrolledToEnd || accepting}
                    disabled={!scrolledToEnd || accepting}
                    onClick={toggleAgreed}
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-none border-2 border-neutral-900 bg-white transition-[opacity,transform] duration-200 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 enabled:cursor-pointer"
                  >
                    {agreed && (
                      <svg
                        className="h-4 w-4 text-neutral-900"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                  <span
                    className={`text-left text-[13px] font-medium leading-snug text-neutral-800 sm:text-sm ${
                      !scrolledToEnd ? "opacity-40" : ""
                    }`}
                  >
                    I have read this policy in full and agree to the Platform Terms of Use, security
                    standards, data handling principles, and commercial licensing conditions described above.
                  </span>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <button
                    type="button"
                    onClick={handleAgree}
                    disabled={!scrolledToEnd || !agreed || accepting}
                    aria-busy={accepting}
                    className="order-1 flex min-h-11 w-full items-center justify-center rounded-none bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition-[opacity,transform] hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-35 sm:order-none sm:flex-1"
                  >
                    {accepting ? (
                      <span className="ios-dotted-spinner" aria-label="Continuing" role="status">
                        {SPINNER_DOTS.map((dot) => (
                          <span
                            key={dot}
                            className="ios-dotted-spinner__dot"
                            style={{ "--dot-index": dot } as React.CSSProperties}
                          />
                        ))}
                      </span>
                    ) : (
                      "Accept & Continue"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleDecline}
                    disabled={accepting}
                    className="w-full rounded-none bg-white px-6 py-3 text-sm font-semibold text-neutral-800 underline decoration-neutral-800 underline-offset-4 transition-opacity hover:opacity-70 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 sm:flex-1"
                  >
                    Decline &amp; Exit Setup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
