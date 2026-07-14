"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { AdsByGoogleCommandQueue } from "@/types/adsbygoogle";
import { AD_FULLSCREEN_Z_INDEX } from "./z-layers";

/** VignetteAd */
const ADSENSE_CLIENT = "ca-pub-6945140222539282";
const ADSENSE_SLOT_VIGNETTE = "9355403033";

const pushedAdIns = new WeakSet<Element>();

type VignetteAdModalProps = {
  open: boolean;
  onDismiss: () => void;
  /** Main explainer under the title */
  bodyText?: string;
};

/**
 * Full-screen vignette interstitial with AdSense VignetteAd slot. Dismiss only via Continue (no backdrop close).
 */
export function VignetteAdModal({
  open,
  onDismiss,
  bodyText = "Full-screen slot for navigation interstitials (e.g. AdSense vignette). Shown sparingly after route changes.",
}: VignetteAdModalProps) {
  const adInsRef = useRef<HTMLModElement>(null);

  const dismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="vignette-ad"
          className="fixed inset-0 flex items-center justify-center p-6"
          style={{ zIndex: AD_FULLSCREEN_Z_INDEX }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="vignette-ad-title"
        >
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" aria-hidden />

          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_50%_45%,transparent_0%,transparent_42%,rgba(0,0,0,0.5)_72%,rgba(0,0,0,0.92)_100%)]"
            aria-hidden
          />

          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950/90 p-6 text-center shadow-2xl ring-1 ring-white/10 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p
              id="vignette-ad-title"
              className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500"
            >
              Sponsored
            </p>
            <p className="mt-2 text-[15px] font-semibold text-white">Vignette ad</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-500">{bodyText}</p>

            <div
              className="pointer-events-auto mt-4 min-h-[250px] w-full overflow-hidden rounded-xl border border-white/10 bg-black/20"
              role="complementary"
              aria-label="Advertisement"
            >
              <ins
                ref={adInsRef}
                className="adsbygoogle block size-full min-h-[250px] max-w-full"
                style={{
                  display: "block",
                  width: "100%",
                  minHeight: 250,
                  boxSizing: "border-box",
                }}
                data-ad-client={ADSENSE_CLIENT}
                data-ad-slot={ADSENSE_SLOT_VIGNETTE}
                data-ad-format="auto"
                data-full-width-responsive="true"
              />
            </div>

            <button
              type="button"
              onClick={dismiss}
              className="mt-5 w-full rounded-full border border-white/15 bg-white/[0.08] py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/[0.12]"
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
