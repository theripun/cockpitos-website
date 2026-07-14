"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { FinalAdInterstitialFrame, InterstitialBackdrop } from "./leaderboard-interstitial-frame";

type ClickScreenAdProps = {
  /** Pause counting and force-close while another interstitial is active (e.g. idle ad). */
  suspend?: boolean;
  /** Open after this many pointer clicks anywhere. Default 10. */
  clicksThreshold?: number;
  onOpenChange?: (open: boolean) => void;
};

export function ClickScreenAd({ suspend = false, clicksThreshold = 10, onOpenChange }: ClickScreenAdProps) {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const suspendRef = useRef(suspend);
  const countRef = useRef(0);

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
      return;
    }

    const onPointerDown = () => {
      if (suspendRef.current || openRef.current) return;
      countRef.current += 1;
      if (countRef.current >= clicksThreshold) {
        countRef.current = 0;
        setOpenTracked(true);
      }
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [suspend, clicksThreshold, setOpenTracked]);

  const dismiss = useCallback(() => {
    setOpenTracked(false);
  }, [setOpenTracked]);

  return (
    <AnimatePresence>
      {open ? (
        <InterstitialBackdrop key="click-ad" contentMaxWidthClass="max-w-[728px]">
          <FinalAdInterstitialFrame
            title="You are on a free plan"
            onDismiss={dismiss}
          />
        </InterstitialBackdrop>
      ) : null}
    </AnimatePresence>
  );
}
