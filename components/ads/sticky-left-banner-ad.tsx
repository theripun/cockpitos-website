"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { AdsByGoogleCommandQueue } from "@/types/adsbygoogle";

/** VerticalAd — same publisher as other units */
const ADSENSE_CLIENT = "ca-pub-6945140222539282";
const ADSENSE_SLOT_VERTICAL = "3078806704";

const pushedAdIns = new WeakSet<Element>();

type StickyLeftBannerAdProps = {
  className?: string;
  /** Inset from top of viewport (clears menubar). */
  topClassName?: string;
  /** Inset from bottom (clears dock). */
  bottomClassName?: string;
  /** Rail width — vertical creative scales within this column. */
  railWidthClass?: string;
};

/**
 * Fixed left gutter with a vertical (skyscraper-style) AdSense slot — stays visible on /home like a sticky rail.
 * z-40: below app windows (100+) and interstitials (55+), same band as the corner video unit.
 */
export function StickyLeftBannerAd({
  className,
  topClassName = "top-24",
  bottomClassName = "bottom-36",
  railWidthClass = "w-[min(244px,30vw)]",
}: StickyLeftBannerAdProps) {
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
    <aside
      className={cn(
        "pointer-events-none fixed left-0 z-[40] hidden md:flex",
        topClassName,
        bottomClassName,
        railWidthClass,
        "flex-col justify-center pl-3 pr-1",
        className
      )}
      aria-label="Advertisement sidebar"
    >
      <div
        role="complementary"
        className="pointer-events-auto flex max-h-full min-h-0 flex-col rounded-xl border border-white/10 bg-transparent p-3 shadow-lg ring-1 ring-white/10 backdrop-blur-sm"
      >
        <p className="mt-1 shrink-0 text-[11px] font-medium leading-snug text-white">
          You are on a free plan
        </p>

        <div
          className={cn(
            "relative mt-3 mx-auto flex min-h-0 w-[min(208px,100%)] max-w-full flex-col items-stretch justify-center overflow-hidden rounded-lg border border-white/10",
            "bg-transparent",
            "aspect-[300/600]"
          )}
        >
          <ins
            ref={adInsRef}
            className="adsbygoogle block size-full max-h-full max-w-full"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              boxSizing: "border-box",
            }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={ADSENSE_SLOT_VERTICAL}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      </div>
    </aside>
  );
}
