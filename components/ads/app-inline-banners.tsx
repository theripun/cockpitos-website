"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { AdsByGoogleCommandQueue } from "@/types/adsbygoogle";

/** BannerAd — horizontal display unit */
const ADSENSE_CLIENT = "ca-pub-6945140222539282";
const ADSENSE_SLOT_BANNER = "5168746018";

const pushedAdIns = new WeakSet<Element>();

const BANNER_SLOT_H_PX = 50;

/**
 * Fixed-height horizontal strip: fills parent width (`w-full min-w-0`), never grows vertically.
 * Parent apps keep their own flex/grid; this does not set max-width or break responsiveness.
 */
function BannerAdSenseSlot({ className }: { className?: string }) {
  const adInsRef = useRef<HTMLModElement>(null);

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

  return (
    <div className="w-full h-[50px] overflow-hidden">
  <ins
    ref={adInsRef}
    className="adsbygoogle block w-full"
    style={{ display: "block", width: "100%", height: "50px" }}
    data-ad-client={ADSENSE_CLIENT}
    data-ad-slot={ADSENSE_SLOT_BANNER}
  />
</div>
  );
}

type BannerProps = {
  className?: string;
};

/** Horizontal banner: 50px-tall bar; width follows the host container. */
export function AppHorizontalAdTrack({ className }: BannerProps) {
  return (
    <aside
      aria-label="Advertisement"
      className={cn("w-full min-w-0 max-w-full", className)}
    >
      <BannerAdSenseSlot
        className={cn(
          "h-[50px] rounded-lg border border-white/[0.07] bg-zinc-950/55 shadow-sm backdrop-blur-sm"
        )}
      />
    </aside>
  );
}

/** Same 50px-tall unit with alternate chrome (ribbon layout hosts). */
export function AppHorizontalAdRibbon({ className }: BannerProps) {
  return (
    <aside
      aria-label="Advertisement"
      className={cn("w-full min-w-0 max-w-full", className)}
    >
      <BannerAdSenseSlot
        className={cn(
          "h-[50px] rounded-none border border-white/5 shadow-md backdrop-blur-md"
        )}
      />
    </aside>
  );
}
