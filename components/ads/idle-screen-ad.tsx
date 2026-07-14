"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { FinalAdInterstitialFrame, InterstitialBackdrop } from "./leaderboard-interstitial-frame";

type IdleScreenAdProps = {
  /** Pause timer and force-close while another interstitial is active (e.g. click ad). */
  suspend?: boolean;
  /** No mouse / activity for this long (ms). Default 20s. */
  idleMs?: number;
  onOpenChange?: (open: boolean) => void;
};

export function IdleScreenAd({ suspend = false, idleMs = 20_000, onOpenChange }: IdleScreenAdProps) {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const suspendRef = useRef(suspend);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    suspendRef.current = suspend;
  }, [suspend]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const setOpenTracked = useCallback(
    (next: boolean) => {
      openRef.current = next;
      setOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange]
  );

  const armTimer = useCallback(() => {
    clearTimer();
    if (suspendRef.current) return;
    timerRef.current = setTimeout(() => {
      setOpenTracked(true);
    }, idleMs);
  }, [clearTimer, idleMs, setOpenTracked]);

  useEffect(() => {
    if (suspend) {
      clearTimer();
      if (openRef.current) setOpenTracked(false);
      return;
    }

    const onActivity = () => {
      if (openRef.current) return;
      armTimer();
    };

    armTimer();
    window.addEventListener("mousemove", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("scroll", onActivity, true);
    window.addEventListener("touchstart", onActivity, { capture: true });

    return () => {
      clearTimer();
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("scroll", onActivity, true);
      window.removeEventListener("touchstart", onActivity, { capture: true });
    };
  }, [suspend, armTimer, clearTimer, setOpenTracked]);

  const dismiss = useCallback(() => {
    setOpenTracked(false);
    if (!suspendRef.current) armTimer();
  }, [armTimer, setOpenTracked]);

  return (
    <AnimatePresence>
      {open ? (
        <InterstitialBackdrop key="idle-ad" contentMaxWidthClass="max-w-[728px]">
          <FinalAdInterstitialFrame
            title="You are on a free plan"
            onDismiss={dismiss}
          />
        </InterstitialBackdrop>
      ) : null}
    </AnimatePresence>
  );
}
