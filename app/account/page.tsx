import type { Metadata } from "next";
import { AccountProfileOverview } from "./components/account-profile-overview";
import { SectionHeader } from "./components/section-header";

export const metadata: Metadata = {
  title: "Account · Cockpit",
  description: "Your Cockpit account",
};

export default function AccountPage() {
  return (
    <>
      <SectionHeader title="Account" subtitle="Profile and account preferences" />
      <AccountProfileOverview className="mt-10" />
    </>
  );
}
