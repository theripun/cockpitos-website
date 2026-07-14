import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";

/** Google AdSense publisher ID (site verification + `adsbygoogle` loader). */
const ADSENSE_CLIENT_ID = "ca-pub-6945140222539282";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

import { AdSenseScript } from "../components/ads/adsense-script";
import { ConsoleSuppressor } from "./console-suppressor";
import DeviceChecker from "../components/common/device-checker";

export const metadata: Metadata = {
  title: "Cockpit",
  description: "Get your personal private server desktop in minutes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased`}
        suppressHydrationWarning
      >
        <AdSenseScript clientId={ADSENSE_CLIENT_ID} />
        <ConsoleSuppressor />
        <DeviceChecker />
        {children}
      </body>
    </html>
  );
}
