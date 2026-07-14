import type { Metadata } from "next";
import { AccountDevicesOverview } from "../components/account-devices-overview";
import { SectionHeader } from "../components/section-header";

export const metadata: Metadata = {
  title: "My Devices · Cockpit",
  description: "Your enrolled devices",
};

export default function DevicesPage() {
  return (
    <>
      <SectionHeader
        title="My Devices"
        subtitle="Cockpit-connected systems and agents"
      />
      <AccountDevicesOverview className="mt-10" />
    </>
  );
}
