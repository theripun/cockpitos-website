"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { InterstitialBackdrop, LeaderboardInterstitialFrame } from "./leaderboard-interstitial-frame";

const SESSION_KEY = "cockpit_multiplex_interstitial_shown";

type MultiplexScreenAdProps = {
  /** Pause scheduling / force-close while another fullscreen ad is active. */
  suspend?: boolean;
  /** Wait this long after mount before attempting to show (once per session). */
  delayMs?: number;
  onOpenChange?: (open: boolean) => void;
};

/**
 * Multiplex (autorelaxed) interstitial — at most once per browser session.
 * If `suspend` is true when the timer fires, retries every 5s until it can show or the tab is left.
 */
export function MultiplexScreenAd({
  suspend = false,
  delayMs = 120_000,
  onOpenChange,
}: MultiplexScreenAdProps) {
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
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY) === "1") return;

    let cancelled = false;
    let timeoutId: number | undefined;

    const arm = (ms: number) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(tick, ms);
    };

    function tick() {
      if (cancelled) return;
      if (sessionStorage.getItem(SESSION_KEY) === "1") return;
      if (suspendRef.current) {
        arm(5_000);
        return;
      }
      sessionStorage.setItem(SESSION_KEY, "1");
      setOpenTracked(true);
    }

    arm(delayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [delayMs, setOpenTracked]);

  useEffect(() => {
    if (suspend && openRef.current) setOpenTracked(false);
  }, [suspend, setOpenTracked]);

  const dismiss = useCallback(() => {
    setOpenTracked(false);
  }, [setOpenTracked]);

  return (
    <AnimatePresence>
      {open ? (
        <InterstitialBackdrop key="multiplex-ad" contentMaxWidthClass="max-w-3xl">
          <LeaderboardInterstitialFrame
            title="You are on a free plan"
            onDismiss={dismiss}
          />
        </InterstitialBackdrop>
      ) : null}
    </AnimatePresence>
  );
}
