import React from "react";
import "./styles/glass-interface.css";

type GlassSize = "small" | "medium" | "large";
type GlassContent = "default" | "inline" | "alone" | "none";

export interface GlassInterfaceProps {
    children: React.ReactNode;
    rounded?: boolean;
    size?: GlassSize;
    contentLayout?: GlassContent;
    className?: string;
    contentClassName?: string;

    /**
     * If you render multiple GlassInterface components on a page,
     * you should keep this true only once to avoid duplicating the SVG filter.
     */
    includeSvgFilter?: boolean;
    noTransition?: boolean;
    onClick?: () => void;
}

/**
 * Reusable glass container shell
 */
export function GlassInterface({
    children,
    rounded = false,
    size,
    contentLayout = "default",
    className = "",
    contentClassName = "",
    includeSvgFilter = false,
    noTransition = false,
    onClick,
}: GlassInterfaceProps) {
    const containerClasses = [
        "glass-container",
        rounded && "glass-container--rounded",
        size && `glass-container--${size}`,
        noTransition && "glass-container--no-transition",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    const contentClasses = [
        "glass-content-vessel",
        contentLayout !== "none" && "glass-content",
        contentLayout !== "default" && contentLayout !== "none" && `glass-content--${contentLayout}`,
        contentClassName,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={containerClasses} onClick={onClick}>
            {/* glass layers */}
            <div className="glass-filter" />
            {/* <div className="glass-overlay" /> */}
            <div className="glass-specular" />

            {/* content */}
            <div className={contentClasses}>{children}</div>

            {/* Include only once per page ideally */}
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
