/**
 * Google AdSense `adsbygoogle.js` command queue (array-like; `.push({})` fills a slot).
 * @see https://developers.google.com/publisher-tag/guides/get-started
 */
export type AdsByGoogleCommandQueue = {
  push: (command: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    adsbygoogle?: AdsByGoogleCommandQueue;
  }
}

export {};
