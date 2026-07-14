import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Checkout · Cockpit",
  description: "Subscribe to Cockpit",
};

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <div className="checkout-page-root h-[100dvh] max-h-[100dvh] w-full overflow-hidden">
      <div className="h-full min-h-0">{children}</div>
    </div>
  );
}
