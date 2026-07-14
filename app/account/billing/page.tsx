import type { Metadata } from "next";
import { BillingUsageCard } from "../components/billing-usage-card";
import { InvoicesCard } from "../components/invoices-card";
import { PaymentMethodCard } from "../components/payment-method-card";
import { PlanDetailsSection } from "../components/plan-details-section";
import { SectionHeader } from "../components/section-header";

export const metadata: Metadata = {
  title: "Billing & Usage · Cockpit",
  description: "Manage your subscriptions and payments",
};

export default function BillingPage() {
  return (
    <>
      <SectionHeader
        title="Billing & Usage"
        subtitle="Manage Your Subscriptions and Payments"
      />
      <PlanDetailsSection planName="Paid Plan" className="mt-8" />
      <div className="mt-10 flex flex-col gap-6">
        <BillingUsageCard />
        <PaymentMethodCard />
        <InvoicesCard />
      </div>
    </>
  );
}
