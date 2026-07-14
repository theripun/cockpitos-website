"use client";

import React, { useEffect, useRef } from "react";
import { motion, useDragControls } from "framer-motion";
import { GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdsByGoogleCommandQueue } from "@/types/adsbygoogle";

/** SquareAd — display unit; creative may be static, video, etc. */
const ADSENSE_CLIENT = "ca-pub-6945140222539282";
const ADSENSE_SLOT_SQUARE = "6471256802";

const pushedAdIns = new WeakSet<Element>();

/**
 * Outer frame is exactly S×S px. Google often needs ~250×250+ for display fill; smaller slots stay blank.
 */
const SQUARE_SIZE = 250;

type VideoAdUnitProps = {
  className?: string;
  /** Extra space from bottom of viewport (dock / safe area). Default clears typical dock height. */
  bottomOffset?: number;
};

/**
 * Bottom-corner draggable SquareAd slot — one compact square (equal width and height).
 */
export function VideoAdUnit({ className, bottomOffset = 96 }: VideoAdUnitProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const adInsRef = useRef<HTMLModElement>(null);
  const dragControls = useDragControls();

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

    // Fallback: `onLoad` may have fired before this listener was attached (e.g. client nav).
    const fallback = window.setTimeout(onScriptLoaded, 800);

    return () => {
      window.removeEventListener("adsense-script-loaded", onScriptLoaded);
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={constraintsRef}
      className={cn("pointer-events-none fixed inset-0 z-40", className)}
      aria-hidden={false}
    >
      <motion.div
        className="pointer-events-auto absolute cursor-default select-none overflow-hidden rounded-xl border border-white/10 ring-1 ring-white/10 backdrop-blur-xs"
        style={{
          width: SQUARE_SIZE,
          height: SQUARE_SIZE,
          boxSizing: "border-box",
          right: 20,
          bottom: bottomOffset,
          touchAction: "none",
        }}
        drag
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={constraintsRef}
        dragMomentum={false}
        dragElastic={0.05}
        whileDrag={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 420, damping: 28 }}
      >
        <div role="banner" aria-label="Advertisement" className="relative size-full">
          {/* Fills the square; border lives on the outer motion box */}
          <div className="absolute inset-0 overflow-hidden">
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
              data-ad-slot={ADSENSE_SLOT_SQUARE}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>

          <div
            className="absolute left-0 right-0 top-0 z-[1] flex h-8 cursor-grab items-center gap-2 bg-transparent px-2 active:cursor-grabbing"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <GripHorizontal className="h-4 w-4 shrink-0 text-white/45" strokeWidth={2} aria-hidden />
          </div>

          <div className="pointer-events-none absolute bottom-1.5 left-1.5 z-[1] max-w-[calc(100%-12px)] truncate rounded-full border border-white/15 bg-transparent px-2 py-0.5 text-[8px] font-medium tracking-wider text-white">
            You are on a free plan
          </div>
        </div>
      </motion.div>
    </div>
  );
}
