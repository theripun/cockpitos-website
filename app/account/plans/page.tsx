import type { Metadata } from "next";
import { AccountPlansOverview } from "../components/account-plans-overview";
import { SectionHeader } from "../components/section-header";

export const metadata: Metadata = {
  title: "Plans & Pricing · Cockpit",
  description: "Compare Free and Paid Cockpit plans",
};

export default function PlansPage() {
  return (
    <>
      <SectionHeader
        title="Plans & Pricing"
        subtitle="Compare tiers and upgrade when you need to"
      />
      <AccountPlansOverview />
    </>
  );
}
