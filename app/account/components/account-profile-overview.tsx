"use client";

import React from "react";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  CreditCard,
  Loader2,
  MonitorSmartphone,
  Shield,
  UserRound,
} from "lucide-react";
import { BASE_URL } from "@/lib/baseURL";
import { cn } from "@/lib/utils";

type Me = {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  marketingOptIn: boolean;
  createdAt: string;
  updatedAt: string;
};

function initials(u: Me) {
  const a = u.firstName?.trim().charAt(0);
  const b = u.lastName?.trim().charAt(0);
  if (a || b) return `${a || ""}${b || ""}`.toUpperCase() || "—";
  return u.username?.slice(0, 2).toUpperCase() || "?";
}

function displayName(u: Me) {
  const full = `${u.firstName || ""} ${u.lastName || ""}`.trim();
  return full || u.username || u.email;
}

function memberSince(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

const links = [
  { href: "/account/billing", label: "Billing & usage", icon: CreditCard },
  { href: "/account/devices", label: "My devices", icon: MonitorSmartphone },
  { href: "/account/alerts", label: "Alerts & notifications", icon: Bell },
] as const;

type Props = { className?: string };

export function AccountProfileOverview({ className }: Props) {
  const [user, setUser] = React.useState<Me | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/auth/me`, { credentials: "include" });
      if (!res.ok) {
        setError(
          res.status === 401
            ? "Sign in to view your profile."
            : "Could not load profile."
        );
        setUser(null);
        return;
      }
      setUser((await res.json()) as Me);
    } catch {
      setError("Network error. Check your connection and try again.");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div
        className={cn(
          "relative min-h-[300px] overflow-hidden rounded-3xl border border-white/[0.09] bg-[#050505] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.55)]",
          className
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
          aria-hidden
        />
        <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-4 p-8">
          <Loader2
            className="h-9 w-9 animate-spin text-zinc-500"
            strokeWidth={1.75}
            aria-hidden
          />
          <div className="flex w-full max-w-[280px] flex-col gap-2">
            <div className="h-2.5 w-3/5 animate-pulse rounded-full bg-white/[0.06]" />
            <div className="h-2 w-2/5 animate-pulse rounded-full bg-white/[0.04]" />
          </div>
          <span className="sr-only">Loading profile</span>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border border-white/[0.09] bg-[#050505] px-8 py-12 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.55)]",
          className
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
          aria-hidden
        />
        <div className="relative flex max-w-md flex-col items-start gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
            <UserRound className="h-5 w-5 text-zinc-500" strokeWidth={1.5} />
          </div>
          <p className="pt-2 text-[15px] font-medium leading-snug text-zinc-300">
            {error ?? "Something went wrong."}
          </p>
          <button
            type="button"
            onClick={load}
            className="mt-3 rounded-xl bg-white/[0.09] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] transition-colors hover:bg-white/[0.14]"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-[#050505] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.55)]"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
          aria-hidden
        />

        <div className="relative border-b border-white/[0.06] px-7 pb-8 pt-8 sm:px-8">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
            <div
              className="relative flex h-[5.5rem] w-[5.5rem] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-white/[0.12] to-white/[0.02] p-[1px] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.8)]"
              aria-hidden
            >
              <div className="flex h-full w-full items-center justify-center rounded-2xl bg-[#0a0a0a] text-[1.35rem] font-bold tracking-tight text-white">
                {initials(user)}
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                Your profile
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-[1.65rem] sm:leading-tight">
                {displayName(user)}
              </h2>
              <p className="truncate text-[14px] text-zinc-400">{user.email}</p>
              <p className="truncate font-mono text-[13px] font-medium text-zinc-500">
                @{user.username}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
          <div className="rounded-2xl border border-white/[0.07] bg-[#000] px-4 py-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:py-5">
            <div className="flex items-center gap-2 text-zinc-500">
              <Shield className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <p className="text-[10px] font-bold uppercase tracking-[0.12em]">Role</p>
            </div>
            <p className="mt-2.5 text-[15px] font-semibold capitalize leading-snug text-white">
              {(user.role || "—").replace(/_/g, " ")}
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-[#000] px-4 py-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:py-5">
            <div className="flex items-center gap-2 text-zinc-500">
              <Bell className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <p className="text-[10px] font-bold uppercase tracking-[0.12em]">
                Marketing
              </p>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                  user.marketingOptIn
                    ? "bg-emerald-500/15 text-emerald-400/95 ring-1 ring-emerald-500/25"
                    : "bg-zinc-500/10 text-zinc-400 ring-1 ring-white/[0.06]"
                )}
              >
                {user.marketingOptIn ? "Subscribed" : "Off"}
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-[#000] px-4 py-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:py-5">
            <div className="flex items-center gap-2 text-zinc-500">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <p className="text-[10px] font-bold uppercase tracking-[0.12em]">
                Member since
              </p>
            </div>
            <p className="mt-2.5 text-[15px] font-semibold tabular-nums text-white">
              {memberSince(user.createdAt)}
            </p>
          </div>
        </div>

   
      </div>
    </div>
  );
}
