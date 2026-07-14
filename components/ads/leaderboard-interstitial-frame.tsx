"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AdsByGoogleCommandQueue } from "@/types/adsbygoogle";
import { AD_FULLSCREEN_Z_INDEX } from "./z-layers";

const ADSENSE_CLIENT = "ca-pub-6945140222539282";
const ADSENSE_SLOT_MULTIPLEX = "8214545901";
const ADSENSE_SLOT_FINAL = "8685319193";

const pushedAdIns = new WeakSet<Element>();

function usePushAdsenseSlot(adInsRef: React.RefObject<HTMLModElement | null>) {
  useEffect(() => {
    const ins = adInsRef.current;
    if (!ins || pushedAdIns.has(ins) || !ins.isConnected) return;

    const fillSlot = () => {
      if (pushedAdIns.has(ins) || !ins.isConnected) return;
      pushedAdIns.add(ins);
      try {
        const q: AdsByGoogleCommandQueue =
          window.adsbygoogle ?? ([] as unknown as AdsByGoogleCommandQueue);
        window.adsbygoogle = q;
        q.push({});
      } catch {
        pushedAdIns.delete(ins);
      }
    };

    const onScriptLoaded = () => {
      requestAnimationFrame(() => fillSlot());
    };

    window.addEventListener("adsense-script-loaded", onScriptLoaded, { passive: true });
    const fallback = window.setTimeout(onScriptLoaded, 800);

    return () => {
      window.removeEventListener("adsense-script-loaded", onScriptLoaded);
      window.clearTimeout(fallback);
    };
  }, []);
}

function MultiplexAdIns() {
  const adInsRef = useRef<HTMLModElement>(null);
  usePushAdsenseSlot(adInsRef);

  return (
    <ins
      ref={adInsRef}
      className="adsbygoogle block w-full min-w-0"
      style={{ display: "block" }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={ADSENSE_SLOT_MULTIPLEX}
      data-ad-format="autorelaxed"
    />
  );
}

function FinalAdIns() {
  const adInsRef = useRef<HTMLModElement>(null);
  usePushAdsenseSlot(adInsRef);

  return (
    <ins
      ref={adInsRef}
      className="adsbygoogle block w-full min-w-0"
      style={{ display: "block" }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={ADSENSE_SLOT_FINAL}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}

type InterstitialShellProps = {
  title: string;
  subtitle?: string;
  onDismiss: () => void;
  continueDisabled?: boolean;
  continueLabel?: string;
  maxWidthClass: string;
  children: React.ReactNode;
};

function InterstitialShell({
  title,
  subtitle,
  onDismiss,
  continueDisabled = false,
  continueLabel,
  maxWidthClass,
  children,
}: InterstitialShellProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: 8 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className={cn("relative z-10 w-full px-1", maxWidthClass)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="interstitial-ad-title"
    >
      <div className="rounded-2xl bg-transparent p-4 shadow-2xl backdrop-blur-xl sm:p-5">
        <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h2 id="interstitial-ad-title" className="text-[15px] font-semibold tracking-tight text-white">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 text-[12px] leading-snug text-zinc-500">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onDismiss}
            disabled={continueDisabled}
            className="shrink-0 rounded-full bg-white/[0.06] px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-white/[0.1] disabled:pointer-events-none disabled:opacity-40"
          >
            {continueLabel ?? "Continue"}
          </button>
        </div>
        {children}
      </div>
    </motion.div>
  );
}

type InterstitialFrameBaseProps = {
  title: string;
  subtitle?: string;
  onDismiss: () => void;
  continueDisabled?: boolean;
  continueLabel?: string;
};

/**
 * Multiplex (autorelaxed) unit — wider card so the native layout can breathe.
 */
export function LeaderboardInterstitialFrame({
  title,
  subtitle,
  onDismiss,
  continueDisabled = false,
  continueLabel,
}: InterstitialFrameBaseProps) {
  return (
    <InterstitialShell
      title={title}
      subtitle={subtitle}
      onDismiss={onDismiss}
      continueDisabled={continueDisabled}
      continueLabel={continueLabel}
      maxWidthClass="max-w-3xl"
    >
      <div className="w-full min-h-[120px] overflow-hidden rounded-xl bg-transparent">
        <MultiplexAdIns />
      </div>
    </InterstitialShell>
  );
}

/** FinalAd — auto, full-width responsive (idle / interval / click interstitials). */
export function FinalAdInterstitialFrame({
  title,
  subtitle,
  onDismiss,
  continueDisabled = false,
  continueLabel,
}: InterstitialFrameBaseProps) {
  return (
    <InterstitialShell
      title={title}
      subtitle={subtitle}
      onDismiss={onDismiss}
      continueDisabled={continueDisabled}
      continueLabel={continueLabel}
      maxWidthClass="max-w-[728px]"
    >
      <div className="w-full min-h-[90px] overflow-hidden rounded-xl bg-transparent">
        <FinalAdIns />
      </div>
    </InterstitialShell>
  );
}

type InterstitialBackdropProps = {
  children: React.ReactNode;
  /** Match the widest interstitial card (multiplex vs final). */
  contentMaxWidthClass?: string;
};

/** Blocks interaction behind the ad; does not close on backdrop click — only Continue dismisses. */
export function InterstitialBackdrop({ children, contentMaxWidthClass = "max-w-3xl" }: InterstitialBackdropProps) {
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md"
      style={{ zIndex: AD_FULLSCREEN_Z_INDEX }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className={cn("flex w-full justify-center", contentMaxWidthClass)}>{children}</div>
    </motion.div>
  );
}
