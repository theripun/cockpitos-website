"use client";

import Script from "next/script";

type AdSenseScriptProps = {
  clientId: string;
};

/** Client-only wrapper so `onLoad` is allowed (Server Components cannot pass event handlers). */
export function AdSenseScript({ clientId }: AdSenseScriptProps) {
  return (
    <Script
      id="adsense-loader"
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
      onLoad={() => {
        window.dispatchEvent(new Event("adsense-script-loaded"));
      }}
    />
  );
}
