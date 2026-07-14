"use client";

import Head from 'next/head';

export default function BootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Head>
        <title>CockpitOS Boot</title>
        <meta name="description" content="Cockpit Operating Surface Boot Sequence" />
      </Head>
      <div className="fixed inset-0 bg-black" style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale'
      }}>
        <style>
          {`
            body {
              background-color: #000000 !important;
            }
            ::-webkit-scrollbar {
              width: 6px;
            }
            ::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.1);
              border-radius: 3px;
            }
            ::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.3);
              border-radius: 3px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.5);
            }
          `}
        </style>
        {children}
      </div>
    </>
  );
}