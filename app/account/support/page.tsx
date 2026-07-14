import type { Metadata } from "next";
import { AccountSupportOverview } from "../components/account-support-overview";
import { SectionHeader } from "../components/section-header";

export const metadata: Metadata = {
  title: "Support · Cockpit",
  description: "Get help with Cockpit",
};

export default function SupportPage() {
  return (
    <>
      <SectionHeader title="Support" subtitle="We’re here when you need us" />
      <AccountSupportOverview className="mt-10" />
    </>
  );
}
