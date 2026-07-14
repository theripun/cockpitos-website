import type { Metadata } from "next";
import { AccountAlertsOverview } from "../components/account-alerts-overview";
import { SectionHeader } from "../components/section-header";

export const metadata: Metadata = {
  title: "Alerts & Notifications · Cockpit",
  description: "Notification preferences and alerts",
};

export default function AlertsPage() {
  return (
    <>
      <SectionHeader
        title="Alerts & Notifications"
        subtitle="Control how Cockpit reaches you"
      />
      <AccountAlertsOverview className="mt-10" />
    </>
  );
}
