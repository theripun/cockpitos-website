"use client";

import React from "react";
import "./styles/liquid-glass.css";

type LiquidVariant = "panel" | "menu" | "card";
type LiquidTone = "dark" | "light";

export interface LiquidGlassProps {
  children: React.ReactNode;
  className?: string;

  /** Affects padding + radius defaults */
  variant?: LiquidVariant;

  /** Optional: tweak overlay brightness */
  tone?: LiquidTone;

  /** Only include once per page (or put in root layout) */
  includeSvgFilter?: boolean;
}

export function LiquidGlass({
  children,
  className = "",
  variant = "panel",
  tone = "dark",
  includeSvgFilter = false,
}: LiquidGlassProps) {
  const classes = [
    "lgx",
    `lgx--${variant}`,
    `lgx--${tone}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      {/* glass layers */}
      <div className="lgx__specular" />

      {/* content (always vertical stack by default) */}
      <div className="lgx__content">{children}</div>

      {includeSvgFilter && (
        <svg style={{ display: "none" }}>
          <filter id="lg-dist" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.008 0.008"
              numOctaves={2}
              seed={92}
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation={2} result="blurred" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="blurred"
              scale={70}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
      )}
    </div>
  );
}
