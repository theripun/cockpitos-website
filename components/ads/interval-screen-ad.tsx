"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { FinalAdInterstitialFrame, InterstitialBackdrop } from "./leaderboard-interstitial-frame";

const DEFAULT_INTERVAL_MS = 60_000;

type IntervalScreenAdProps = {
  /** Pause scheduling and force-close while another interstitial is active. */
  suspend?: boolean;
  /** Time between closing this ad and the next auto-open. Default 1 minute. */
  intervalMs?: number;
  onOpenChange?: (open: boolean) => void;
};

/**
 * Full-screen interstitial on a fixed wall-clock-style interval (default every 1 minute).
 * User can dismiss anytime — same shell as idle ad.
 */
export function IntervalScreenAd({
  suspend = false,
  intervalMs = DEFAULT_INTERVAL_MS,
  onOpenChange,
}: IntervalScreenAdProps) {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const suspendRef = useRef(suspend);

  useEffect(() => {
    suspendRef.current = suspend;
  }, [suspend]);

  const setOpenTracked = useCallback(
    (next: boolean) => {
      openRef.current = next;
      setOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (suspend) {
      if (openRef.current) setOpenTracked(false);
    }
  }, [suspend, setOpenTracked]);

  useEffect(() => {
    if (suspend || open) return;
    const t = setTimeout(() => {
      setOpenTracked(true);
    }, intervalMs);
    return () => clearTimeout(t);
  }, [suspend, open, intervalMs, setOpenTracked]);

  const dismiss = useCallback(() => {
    setOpenTracked(false);
  }, [setOpenTracked]);

  return (
    <AnimatePresence>
      {open ? (
        <InterstitialBackdrop key="interval-ad" contentMaxWidthClass="max-w-[728px]">
          <FinalAdInterstitialFrame
            title="You are on a free plan"
            onDismiss={dismiss}
            continueDisabled={false}
            continueLabel="Continue"
          />
        </InterstitialBackdrop>
      ) : null}
    </AnimatePresence>
  );
}
