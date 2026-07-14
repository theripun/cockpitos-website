"use client";

import dynamic from "next/dynamic";

const CheckoutClient = dynamic(() => import("./checkout-client"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,0.78fr)_minmax(0,1.22fr)] animate-pulse bg-white lg:grid-cols-2 lg:grid-rows-1">
      <div className="min-h-0 overflow-hidden bg-[#000] lg:h-full" />
      <div className="min-h-0 overflow-y-auto bg-white lg:h-full" />
    </div>
  ),
});

export default function CheckoutLoader() {
  return (
    <div className="h-full min-h-0">
      <CheckoutClient />
    </div>
  );
}
