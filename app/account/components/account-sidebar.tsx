"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Bell,
  CircleUser,
  CreditCard,
  LifeBuoy,
  MonitorSmartphone,
  ScrollText,
  Tags,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** `/account` should only match exactly, not every sub-route */
  exact?: boolean;
};

/** Order: most essential first */
const NAV: NavItem[] = [
  { href: "/account", label: "Account", icon: CircleUser, exact: true },
  { href: "/account/devices", label: "My Devices", icon: MonitorSmartphone },
  { href: "/account/billing", label: "Billing & Usage", icon: CreditCard },
  { href: "/account/plans", label: "Plans & Pricing", icon: Tags },
  { href: "/account/alerts", label: "Alerts & Notifications", icon: Bell },
  { href: "/account/logs", label: "Logs", icon: ScrollText },
  { href: "/account/support", label: "Support", icon: LifeBuoy },
];

function navActive(pathname: string, item: NavItem) {
  const p = pathname.replace(/\/$/, "") || "/";
  const h = item.href.replace(/\/$/, "") || "/";
  if (item.exact) return p === h;
  return p === h || p.startsWith(`${h}/`);
}

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-[260px] shrink-0 flex-col border-r border-white/[0.07] bg-[#030303]">
      <div className="border-b border-white/[0.06] px-5 pt-6 pb-5">
        {/* <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/[0.08]">
            <img
              src="/logo/cockpit.svg"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7"
            />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[16px] font-semibold tracking-tight text-white">Cockpit</p>
          </div>
        </div> */}

        <Link
          href="/home"
          className="mt-5 flex w-full items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-[13px] font-semibold text-zinc-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] transition-colors hover:border-white/[0.1] hover:bg-white/[0.06] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
          Back to desktop
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 pb-8 pt-4" aria-label="Account navigation">
        {NAV.map((item) => {
          const active = navActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-colors",
                active
                  ? "bg-white/[0.09] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                  : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-opacity",
                  active ? "text-white opacity-95" : "opacity-60 group-hover:opacity-90"
                )}
                strokeWidth={1.75}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
