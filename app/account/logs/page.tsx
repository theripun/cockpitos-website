import type { Metadata } from "next";
import { AccountLogsOverview } from "../components/account-logs-overview";
import { SectionHeader } from "../components/section-header";

export const metadata: Metadata = {
  title: "Logs · Cockpit",
  description: "Account and system activity logs",
};

export default function LogsPage() {
  return (
    <>
      <SectionHeader title="Logs" subtitle="Activity and audit history for your account" />
      <AccountLogsOverview className="mt-10" />
    </>
  );
}
