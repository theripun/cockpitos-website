"use client";

import React from "react";

const AdVisibilityContext = React.createContext(false);

export function AdVisibilityProvider({
  children,
  showAds,
}: {
  children: React.ReactNode;
  showAds: boolean;
}) {
  return (
    <AdVisibilityContext.Provider value={showAds}>
      {children}
    </AdVisibilityContext.Provider>
  );
}

export function useShouldShowAds() {
  return React.useContext(AdVisibilityContext);
}
