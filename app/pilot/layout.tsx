import type { Metadata } from "next";
import PilotAccessGate from "./pilot-access-gate";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PilotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PilotAccessGate>{children}</PilotAccessGate>;
}
