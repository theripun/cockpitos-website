import React, { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import Sidebar from "./Sidebar";
import AllUsers from "./AllUsers";
import Overview from "./Overview";
import MailService from "./MailService";
import Tracking from "./Tracking";
import UserQueries from "./UserQueries";
import ActAs from "./ActAs";
import Usage from "./Usage";
import Alerts from "./Alerts";
import Subscriptions from "./Subscriptions";
import AdsRevenue from "./AdsRevenue";

export default async function PilotDashboard({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const isAllUsersTab = params && "all-users" in params;
  const isMailTab = params && "mail-services" in params;
  const isTrackingTab = params && "tracking" in params;
  const isQueriesTab = params && "user-queries" in params;
  const isActAsTab = params && "act-as" in params;
  const isUsageTab = params && "usage" in params;
  const isSubscriptionsTab = params && "subscriptions" in params;
  const isAdsRevenueTab = params && "ads-revenue" in params;
  const isAlertsTab = params && "alerts" in params;

  return (
    <div className="flex h-screen overflow-hidden bg-black font-sans text-white">
      <Suspense
        fallback={
          <div className="z-20 flex w-[240px] shrink-0 flex-col justify-between border-r border-[#1a1a1a] bg-black py-6" />
        }
      >
        <Sidebar />
      </Suspense>

      <div className="relative flex flex-1 flex-col overflow-hidden bg-black">
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-[#1a1a1a] px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-transparent bg-black hover:border-[#1a1a1a] hover:bg-[#0a0a0a]"
            >
              <ChevronLeft className="h-5 w-5 text-neutral-400" />
            </button>
            <h1 className="text-xl font-medium tracking-wide">
              {isAllUsersTab
                ? "All Users"
                : isMailTab
                  ? "Mail Service"
                  : isTrackingTab
                    ? "Tracking & Intelligence"
                    : isQueriesTab
                      ? "User Queries & Tickets"
                      : isActAsTab
                        ? "Act As"
                        : isUsageTab
                          ? "Usage"
                          : isSubscriptionsTab
                            ? "Subscriptions & Billing"
                            : isAdsRevenueTab
                              ? "Ads revenue"
                              : isAlertsTab
                                ? "System Alerts & Logs"
                                : "Overview"}
            </h1>
          </div>
        </div>

        {isAllUsersTab ? (
          <AllUsers />
        ) : isMailTab ? (
          <MailService />
        ) : isTrackingTab ? (
          <Tracking />
        ) : isQueriesTab ? (
          <UserQueries />
        ) : isActAsTab ? (
          <ActAs />
        ) : isUsageTab ? (
          <Usage />
        ) : isSubscriptionsTab ? (
          <Subscriptions />
        ) : isAdsRevenueTab ? (
          <AdsRevenue />
        ) : isAlertsTab ? (
          <Alerts />
        ) : (
          <Overview />
        )}
      </div>
    </div>
  );
}
