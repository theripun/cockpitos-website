"use client";

import React from "react";
import { useShouldShowAds } from "./ad-visibility-context";
import { VideoAdUnit as RawVideoAdUnit } from "./video-ad-unit";
import { IdleScreenAd as RawIdleScreenAd } from "./idle-screen-ad";
import { IntervalScreenAd as RawIntervalScreenAd } from "./interval-screen-ad";
import { ClickScreenAd as RawClickScreenAd } from "./click-screen-ad";
import { MultiplexScreenAd as RawMultiplexScreenAd } from "./multiplex-screen-ad";
import {
  LeaderboardInterstitialFrame,
  FinalAdInterstitialFrame,
  InterstitialBackdrop,
} from "./leaderboard-interstitial-frame";
import { VignetteAdModal as RawVignetteAdModal } from "./vignette-ad-modal";
import { StickyLeftBannerAd as RawStickyLeftBannerAd } from "./sticky-left-banner-ad";
import {
  AppHorizontalAdTrack as RawAppHorizontalAdTrack,
  AppHorizontalAdRibbon as RawAppHorizontalAdRibbon,
} from "./app-inline-banners";

function withAdVisibility<P extends object>(Component: React.ComponentType<P>) {
  return function VisibleAdComponent(props: P) {
    const showAds = useShouldShowAds();
    if (!showAds) return null;
    return <Component {...props} />;
  };
}

export { AdVisibilityProvider, useShouldShowAds } from "./ad-visibility-context";
export {
  LeaderboardInterstitialFrame,
  FinalAdInterstitialFrame,
  InterstitialBackdrop,
};
export const VideoAdUnit = withAdVisibility(RawVideoAdUnit);
export const IdleScreenAd = withAdVisibility(RawIdleScreenAd);
export const IntervalScreenAd = withAdVisibility(RawIntervalScreenAd);
export const ClickScreenAd = withAdVisibility(RawClickScreenAd);
export const MultiplexScreenAd = withAdVisibility(RawMultiplexScreenAd);
export const VignetteAdModal = withAdVisibility(RawVignetteAdModal);
export const StickyLeftBannerAd = withAdVisibility(RawStickyLeftBannerAd);
export const AppHorizontalAdTrack = withAdVisibility(RawAppHorizontalAdTrack);
export const AppHorizontalAdRibbon = withAdVisibility(RawAppHorizontalAdRibbon);
