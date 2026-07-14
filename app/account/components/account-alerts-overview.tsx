"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Bell,
  CreditCard,
  Loader2,
  Mail,
  Megaphone,
  Plus,
  Radio,
  Rocket,
  Shield,
  Space,
  Sparkles,
} from "lucide-react";
import { BASE_URL } from "@/lib/baseURL";
import { cn, getCsrfToken } from "@/lib/utils";

const STORAGE_KEY = "cockpit_notification_prefs_v1";

type LocalPrefs = {
  securityAlerts: boolean;
  newDeviceAlerts: boolean;
  credentialAlerts: boolean;
  billingReceipts: boolean;
  billingFailures: boolean;
  usageOverageAlerts: boolean;
  incidentMaintenance: boolean;
  productUpdates: boolean;
};

const DEFAULT_PREFS: LocalPrefs = {
  securityAlerts: true,
  newDeviceAlerts: true,
  credentialAlerts: true,
  billingReceipts: true,
  billingFailures: true,
  usageOverageAlerts: true,
  incidentMaintenance: true,
  productUpdates: true,
};

function loadLocalPrefs(): LocalPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<LocalPrefs>;
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return DEFAULT_PREFS;
  }
}

function saveLocalPrefs(prefs: LocalPrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

type NotificationSwitchProps = {
  id: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  busy?: boolean;
};

function NotificationSwitch({
  id,
  checked,
  onCheckedChange,
  disabled,
  busy,
}: NotificationSwitchProps) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-busy={busy}
      disabled={disabled || busy}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-7 w-11 shrink-0 rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]",
        checked ? "bg-emerald-500/85" : "bg-white/[0.14]",
        disabled && "cursor-not-allowed opacity-45"
      )}
    >
      {busy ? (
        <span className="flex h-full w-full items-center justify-center" aria-hidden>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-white/95" strokeWidth={2.5} />
        </span>
      ) : (
        <span
          className={cn(
            "pointer-events-none absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ease-out",
            checked && "translate-x-[1.125rem]"
          )}
          aria-hidden
        />
      )}
    </button>
  );
}

type RowProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  switchId: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  busy?: boolean;
};

function PreferenceRow({
  icon,
  title,
  description,
  switchId,
  checked,
  onCheckedChange,
  disabled,
  busy,
}: RowProps) {
  return (
    <div className="flex gap-4 border-b border-white/[0.06] py-5 last:border-b-0 last:pb-1">
      <div
        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-black/50 text-zinc-400"
        aria-hidden
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-white">{title}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">{description}</p>
      </div>
      <div className="flex shrink-0 items-start pt-0.5">
        <NotificationSwitch
          id={switchId}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          busy={busy}
        />
      </div>
    </div>
  );
}

type SectionProps = {
  kicker: string;
  children: React.ReactNode;
};

function AlertsSection({ kicker, children }: SectionProps) {
  return (
    <section className="space-y-1">
      <h2 className="px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
        {kicker}
      </h2>
      <div className="rounded-2xl border border-white/[0.07] bg-black/40 px-4 sm:px-5">
        {children}
      </div>
    </section>
  );
}

type Props = { className?: string };

export function AccountAlertsOverview({ className }: Props) {
  const [email, setEmail] = React.useState<string | null>(null);
  const [meLoading, setMeLoading] = React.useState(true);
  const [meError, setMeError] = React.useState<string | null>(null);

  const [local, setLocal] = React.useState<LocalPrefs>(DEFAULT_PREFS);
  const [hydrated, setHydrated] = React.useState(false);

  const [marketingOptIn, setMarketingOptIn] = React.useState(false);
  const [marketingBusy, setMarketingBusy] = React.useState(false);

  React.useEffect(() => {
    setLocal(loadLocalPrefs());
    setHydrated(true);
  }, []);

  const loadMe = React.useCallback(async () => {
    setMeLoading(true);
    setMeError(null);
    try {
      const res = await fetch(`${BASE_URL}/auth/me`, { credentials: "include" });
      if (!res.ok) {
        setMeError(res.status === 401 ? "Sign in to manage notifications." : "Could not load account.");
        setEmail(null);
        return;
      }
      const data = (await res.json()) as { email: string; marketingOptIn: boolean };
      setEmail(data.email ?? null);
      setMarketingOptIn(!!data.marketingOptIn);
    } catch {
      setMeError("Network error. Check your connection and try again.");
      setEmail(null);
    } finally {
      setMeLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadMe();
  }, [loadMe]);

  const persistLocal = React.useCallback((patch: Partial<LocalPrefs>) => {
    setLocal((prev) => {
      const next = { ...prev, ...patch };
      saveLocalPrefs(next);
      return next;
    });
  }, []);

  const setMarketing = async (next: boolean) => {
    const token = getCsrfToken();
    if (!token) {
      setMeError("Security token missing. Refresh the page and try again.");
      return;
    }
    setMarketingBusy(true);
    setMeError(null);
    const prev = marketingOptIn;
    setMarketingOptIn(next);
    try {
      const res = await fetch(`${BASE_URL}/users/me`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
        },
        body: JSON.stringify({ marketingOptIn: next }),
      });
      if (!res.ok) {
        setMarketingOptIn(prev);
        setMeError("Could not update marketing preference.");
        return;
      }
      const data = (await res.json()) as { marketingOptIn: boolean };
      setMarketingOptIn(!!data.marketingOptIn);
    } catch {
      setMarketingOptIn(prev);
      setMeError("Network error while saving.");
    } finally {
      setMarketingBusy(false);
    }
  };

  return (
    <div className={cn("space-y-8", className)}>
      <div
        className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-[#050505] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.55)]"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
          aria-hidden
        />
        <div className="relative border-b border-white/[0.06] px-7 py-8 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.1] bg-gradient-to-br from-zinc-500/15 to-transparent text-zinc-400/95">
                <Bell className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                  Overview
                </p>
                <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-zinc-400">
                  Choose what we email you about. Transactional messages for billing and security can stay
                  on while you tune everything else. Changes apply to this browser; marketing opt-in is
                  saved to your account.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8 px-5 py-8 sm:px-8">
          {meError ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200/95">
              <span className="font-medium">{meError}</span>
              {meError.includes("Sign in") ? null : (
                <button
                  type="button"
                  onClick={loadMe}
                  className="ml-3 font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white/60"
                >
                  Retry
                </button>
              )}
            </div>
          ) : null}

          <AlertsSection kicker="Delivery">
            <div className="flex gap-4 py-5">
              <div
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-black/50 text-zinc-400"
                aria-hidden
              >
                <Mail className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-white">Email</p>
                <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">
                  All notifications below are sent to the address on your account.
                  {meLoading ? (
                    <span className="mt-2 block text-zinc-600">Loading…</span>
                  ) : email ? (
                    <span className="mt-2 block font-mono text-[13px] text-zinc-300">{email}</span>
                  ) : (
                    <span className="mt-2 block text-zinc-600">—</span>
                  )}
                </p>
                <Link
                  href="/account"
                  className="mt-3 inline-flex text-[13px] font-semibold text-zinc-400 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white hover:decoration-white/40"
                >
                  Account profile
                </Link>
              </div>
              <div className="flex shrink-0 items-center pt-1">
                <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-400/95">
                  Primary
                </span>
              </div>
            </div>
            <div className="flex gap-4 border-t border-white/[0.06] py-5">
              <div
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-black/50 text-zinc-500"
                aria-hidden
              >
                <Radio className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-zinc-400">Push & SMS</p>
                <p className="mt-1 text-[13px] leading-relaxed text-zinc-600">
                  Not available for Cockpit web yet. We&apos;ll announce new channels here when they
                  launch.
                </p>
              </div>
            </div>
          </AlertsSection>

          <AlertsSection kicker="Account & security">
            <PreferenceRow
              icon={<Shield className="h-4 w-4" strokeWidth={1.75} />}
              title="Security alerts"
              description="Unusual sign-in activity and steps to protect your account."
              switchId="pref-security"
              checked={hydrated && local.securityAlerts}
              onCheckedChange={(v) => persistLocal({ securityAlerts: v })}
            />
            <PreferenceRow
              icon={<Plus className="h-4 w-4" strokeWidth={1.75} />}
              title="New devices"
              description="When a new device is linked or trusted for your Cockpit session."
              switchId="pref-device"
              checked={hydrated && local.newDeviceAlerts}
              onCheckedChange={(v) => persistLocal({ newDeviceAlerts: v })}
            />
            <PreferenceRow
              icon={<AlertTriangle className="h-4 w-4" strokeWidth={1.75} />}
              title="Password & recovery"
              description="Password changes, recovery, and other credential updates."
              switchId="pref-credential"
              checked={hydrated && local.credentialAlerts}
              onCheckedChange={(v) => persistLocal({ credentialAlerts: v })}
            />
          </AlertsSection>

          <AlertsSection kicker="Billing & usage">
            <PreferenceRow
              icon={<CreditCard className="h-4 w-4" strokeWidth={1.75} />}
              title="Receipts & invoices"
              description="Payment confirmations and invoice PDFs when billing runs."
              switchId="pref-receipts"
              checked={hydrated && local.billingReceipts}
              onCheckedChange={(v) => persistLocal({ billingReceipts: v })}
            />
            <PreferenceRow
              icon={<AlertTriangle className="h-4 w-4" strokeWidth={1.75} />}
              title="Failed payments"
              description="If a charge fails so you can update your payment method in time."
              switchId="pref-payfail"
              checked={hydrated && local.billingFailures}
              onCheckedChange={(v) => persistLocal({ billingFailures: v })}
            />
            <PreferenceRow
              icon={<Bell className="h-4 w-4" strokeWidth={1.75} />}
              title="Usage & overage"
              description="Approaching limits and overage summaries. Overage charges still require your OTP approval."
              switchId="pref-usage"
              checked={hydrated && local.usageOverageAlerts}
              onCheckedChange={(v) => persistLocal({ usageOverageAlerts: v })}
            />
          </AlertsSection>

          <AlertsSection kicker="Product">
            <PreferenceRow
              icon={<Activity className="h-4 w-4" strokeWidth={1.75} />}
              title="Incidents & maintenance"
              description="Status when Cockpit or your region may be degraded."
              switchId="pref-incidents"
              checked={hydrated && local.incidentMaintenance}
              onCheckedChange={(v) => persistLocal({ incidentMaintenance: v })}
            />
            <PreferenceRow
              icon={<Rocket className="h-4 w-4" strokeWidth={1.75} />}
              title="Product updates"
              description="Release notes, improvements, and notable changes to the platform."
              switchId="pref-product"
              checked={hydrated && local.productUpdates}
              onCheckedChange={(v) => persistLocal({ productUpdates: v })}
            />
            <PreferenceRow
              icon={<Megaphone className="h-4 w-4" strokeWidth={1.75} />}
              title="Tips & marketing"
              description="Occasional ideas, webinars, and news from Cockpit. Saved to your account."
              switchId="pref-marketing"
              checked={marketingOptIn}
              onCheckedChange={setMarketing}
              busy={marketingBusy}
              disabled={meLoading}
            />
          </AlertsSection>

          <p className="text-center text-[12px] leading-relaxed text-zinc-600">
            Some legally required or fraud-prevention messages may still be delivered when necessary.
            Preferences for non-marketing categories are stored on this device until server-backed settings
            ship.
          </p>
        </div>
      </div>
    </div>
  );
}
