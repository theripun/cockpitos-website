"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "cockpit_os_pilot_unlocked";
/** Secondary access code — client-side gate only, not a security boundary. */
const PIN = `${7}${8}${1}${3}${1}${8}`;
const TAPS_REQUIRED = 5;

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "a[href],button,input,textarea,select,[data-pilot-interactive]",
    ),
  );
}

export default function PilotAccessGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [showPin, setShowPin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinShake, setPinShake] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") {
        setUnlocked(true);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !unlocked) return;
    const prev = document.title;
    document.title = "Pilot · Cockpit";
    return () => {
      document.title = prev;
    };
  }, [ready, unlocked]);

  const grantAccess = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setUnlocked(true);
  }, []);

  const onDecoyPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!ready || unlocked || showPin) return;
      if (isInteractiveTarget(e.target)) return;
      setTapCount((n) => {
        const next = n + 1;
        if (next >= TAPS_REQUIRED) {
          setShowPin(true);
          return 0;
        }
        return next;
      });
    },
    [ready, unlocked, showPin],
  );

  const onPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === PIN) {
      grantAccess();
      return;
    }
    setPinShake(true);
    setPinInput("");
    window.setTimeout(() => setPinShake(false), 400);
  };

  if (!ready) {
    return <div className="fixed inset-0 z-[200] bg-black" aria-hidden />;
  }

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] overflow-hidden bg-black text-white",
        showPin ? "dark" : "cursor-default select-none",
      )}
      onPointerDown={showPin ? undefined : onDecoyPointerDown}
    >
      {!showPin && (
        <div className="flex min-h-full flex-col items-center justify-center px-6 pt-12">
          <p className="text-sm text-neutral-500">404</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Page not found
          </h1>
          <p className="mt-3 max-w-sm text-center text-sm text-neutral-400">
            The page you are looking for does not exist or has been moved.
          </p>

          <Link
            href="/"
            data-pilot-interactive
            className="mt-10 rounded-md border border-white bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-neutral-200"
          >
            Go to main page
          </Link>
        </div>
      )}

      {showPin && (
        <div
          className="flex min-h-full items-center justify-center p-6"
          data-pilot-interactive
        >
          <Card className="w-full max-w-sm animate-in border-none fade-in zoom-in-95 bg-black shadow-2xl backdrop-blur-sm duration-300">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-lg tracking-tight">Continue</CardTitle>
              <CardDescription className="text-zinc-400">
                Enter your access code to open this area.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <form onSubmit={onPinSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1 space-y-2">
                  <label htmlFor="pilot-access-code" className="sr-only">
                    Access code
                  </label>
                  <Input
                    id="pilot-access-code"
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="Enter code"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    aria-invalid={pinShake}
                    className="h-10 border-zinc-700 bg-zinc-900/50 font-mono text-base tracking-[0.2em] text-zinc-100 placeholder:tracking-normal placeholder:text-zinc-500 focus-visible:ring-zinc-600"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-10 w-full shrink-0 bg-zinc-100 text-zinc-950 hover:bg-white sm:w-auto sm:min-w-[5.5rem]"
                >
                  Continue
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
