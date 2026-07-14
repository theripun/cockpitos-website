"use client";

import { AccountSidebar } from "./account-sidebar";

type AccountSettingsShellProps = {
  children: React.ReactNode;
};

export function AccountSettingsShell({ children }: AccountSettingsShellProps) {
  return (
    <div className="flex h-screen min-h-0 w-full bg-[#000] font-sans text-zinc-200 antialiased">
      <AccountSidebar />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[880px] px-10 py-10 pb-16">{children}</div>
      </main>
    </div>
  );
}
