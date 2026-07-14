"use client";

import React from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const SUPPORT_EMAIL = "support@cockpit.run";

type Props = { className?: string };

export function AccountSupportOverview({ className }: Props) {
  const [copied, setCopied] = React.useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={cn(
        "relative max-w-xl overflow-hidden rounded-3xl border border-white/[0.09] bg-[#050505] px-6 py-10 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.55)] sm:px-10",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
        aria-hidden
      />

      <p className="text-[13px] leading-relaxed text-zinc-400">
        Reach us by email for billing, access, or technical help.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="inline-flex items-center gap-2 rounded-xl bg-white/[0.08] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/[0.12]"
        >
          <Mail className="h-4 w-4 text-zinc-400" strokeWidth={1.75} />
          {SUPPORT_EMAIL}
        </a>
        <button
          type="button"
          onClick={copyEmail}
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] px-3.5 py-2.5 text-[13px] font-medium text-zinc-300 transition-colors hover:bg-white/[0.04]"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <p className="mt-6 text-[12px] text-zinc-600">Typical reply within one business day.</p>

      <div className="mt-10 flex flex-col gap-3 border-t border-white/[0.06] pt-8 text-[13px]">

        <Link
          href="/account/logs"
          className="w-fit text-zinc-400 underline decoration-white/15 underline-offset-4 transition-colors hover:text-zinc-200 hover:decoration-white/35"
        >
          Account activity logs
        </Link>
      </div>
    </div>
  );
}
