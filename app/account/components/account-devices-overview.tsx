"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Globe,
  HardDrive,
  Loader2,
  RefreshCw,
  Server,
  Shield,
  Trash2,
  Wifi,
} from "lucide-react";
import { BASE_URL } from "@/lib/baseURL";
import { cn } from "@/lib/utils";

interface DeviceItem {
  device: {
    id: string;
    name: string;
    status: string;
    lastSeenAt: string | null;
    enrolledAt: string | null;
    os: string | null;
    arch: string | null;
    hostname: string | null;
    lastIp: string | null;
    agentVersion: string | null;
    createdAt: string;
  };
  vps: {
    id: string;
    name: string;
    host: string;
    username: string;
  } | null;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function isOnline(lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() <= 35_000;
}

function statusLabel(device: DeviceItem["device"]): {
  label: string;
  color: string;
  dot: string;
} {
  if (device.status === "enrolling") {
    return { label: "Enrolling", color: "text-amber-400", dot: "bg-amber-400" };
  }
  if (device.status === "disabled") {
    return { label: "Disabled", color: "text-zinc-500", dot: "bg-zinc-500" };
  }
  if (isOnline(device.lastSeenAt)) {
    return { label: "Online", color: "text-emerald-400", dot: "bg-emerald-400" };
  }
  return { label: "Offline", color: "text-rose-400", dot: "bg-rose-400" };
}

/** Newest enrollment / record first (descending time). */
function deviceNewestFirst(a: DeviceItem, b: DeviceItem): number {
  const ta = new Date(a.device.enrolledAt || a.device.createdAt).getTime();
  const tb = new Date(b.device.enrolledAt || b.device.createdAt).getTime();
  const fa = Number.isFinite(ta) ? ta : 0;
  const fb = Number.isFinite(tb) ? tb : 0;
  return fb - fa;
}

type Props = { className?: string };

function statusAccent(device: DeviceItem["device"]): string {
  const w = "border-l-[3px]";
  if (device.status === "enrolling") return `${w} border-l-amber-400`;
  if (device.status === "disabled") return `${w} border-l-zinc-600`;
  if (isOnline(device.lastSeenAt)) return `${w} border-l-emerald-400`;
  return `${w} border-l-rose-400`;
}

function DeviceMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-black/40 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
        <Icon className="h-3 w-3 opacity-70" strokeWidth={2} />
        {label}
      </div>
      <p className="mt-1 break-all text-[12px] font-semibold leading-snug text-zinc-200">
        {value || "—"}
      </p>
    </div>
  );
}

export function AccountDevicesOverview({ className }: Props) {
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<DeviceItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(
    null
  );
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/cockpit/cocktail/devices`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setDevices(data || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load devices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const openDeleteModal = (item: DeviceItem) => {
    setDeleteError(null);
    setDeleteTarget(item);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);

    const deletedId = deleteTarget.device.id;
    const deletedName =
      deleteTarget.device.name || deleteTarget.vps?.name || "Device";

    try {
      const res = await fetch(`${BASE_URL}/cockpit/cocktail/devices/${deletedId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { message?: string }).message || `Delete failed (${res.status})`
        );
      }

      setDeleteTarget(null);
      setDeleteError(null);
      setDevices((prev) => prev.filter((d) => d.device.id !== deletedId));
      showToast(`"${deletedName}" deleted successfully`, "success");
      setTimeout(() => fetchDevices(), 800);
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const onlineCount = devices.filter(
    (d) =>
      isOnline(d.device.lastSeenAt) &&
      d.device.status !== "enrolling" &&
      d.device.status !== "disabled"
  ).length;

  const offlineOrOther = Math.max(0, devices.length - onlineCount);

  const sortedDevices = useMemo(
    () => [...devices].sort(deviceNewestFirst),
    [devices]
  );

  return (
    <div className={cn("relative space-y-8", className)}>
      {loading ? (
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="h-3 w-14 animate-pulse rounded bg-white/[0.08]" />
            <div className="h-9 w-40 animate-pulse rounded-lg bg-white/[0.06]" />
          </div>
          <div className="h-[52px] w-full max-w-[280px] animate-pulse rounded-2xl bg-white/[0.05] sm:w-72" />
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white tabular-nums">
              {devices.length}
              <span className="ml-2 text-lg font-semibold text-zinc-500">
                system{devices.length !== 1 ? "s" : ""}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-6 rounded-2xl bg-white/[0.02] px-5 py-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                  Live
                </p>
                <p className="mt-0.5 text-xl font-bold tabular-nums text-emerald-400">
                  {onlineCount}
                </p>
              </div>
              <div className="h-10 w-px bg-white/[0.08]" aria-hidden />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                  Elsewhere
                </p>
                <p className="mt-0.5 text-xl font-bold tabular-nums text-zinc-400">
                  {offlineOrOther}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => fetchDevices()}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full border border-zinc-500/12 bg-black px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-white/[0.08] disabled:opacity-45"
              title="Refresh"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} strokeWidth={2} />
              <span className="text-zinc-400">Sync</span>
            </button>
          </div>
        </div>
      ) : null}

      <AnimatePresence mode="popLayout">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-5 md:grid-cols-2"
          >
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-[220px] animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]"
              />
            ))}
          </motion.div>
        )}

        {!loading && error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] py-16"
          >
            <AlertTriangle className="h-8 w-8 text-rose-400" />
            <p className="mt-3 text-[14px] font-medium text-rose-300">{error}</p>
            <button
              type="button"
              onClick={() => fetchDevices()}
              className="mt-5 rounded-xl bg-white/10 px-5 py-2.5 text-[12px] font-semibold text-white hover:bg-white/15"
            >
              Try again
            </button>
          </motion.div>
        )}

        {!loading && !error && devices.length === 0 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.02] py-20"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.05]">
              <Server className="h-8 w-8 text-zinc-600" strokeWidth={1.5} />
            </div>
            <p className="mt-4 text-[15px] font-semibold text-zinc-300">No systems yet</p>
            <p className="mt-1 max-w-sm text-center text-[13px] leading-relaxed text-zinc-600">
              Complete device enrollment from setup and your devices will show up here.
            </p>
          </motion.div>
        )}

        {!loading && !error && devices.length > 0 ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-5 md:grid-cols-2"
          >
            {sortedDevices.map((item, index) => {
              const { label, color, dot } = statusLabel(item.device);
              const title =
                item.device.name || item.vps?.name || "Unnamed system";
              const subtitle =
                item.device.hostname ||
                item.vps?.host ||
                item.device.lastIp ||
                "No network identity";

              return (
                  <motion.article
                    key={item.device.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: index * 0.04, ease: [0.23, 1, 0.32, 1] }}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border border-black/10 bg-[#0a0a0a] pl-4 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.7)] transition-shadow hover:shadow-[0_28px_56px_-24px_rgba(0,0,0,0.8)]",
                      
                    )}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black via-black to-transparent opacity-100" />

                    <div className="relative p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
                              <Server className="h-4 w-4 text-zinc-400" strokeWidth={1.75} />
                            </div>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ring-white/[0.08]",
                                color,
                                "bg-black/30"
                              )}
                            >
                              <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
                              {label}
                            </span>
                          </div>
                          <h3 className="mt-3 text-lg font-bold leading-snug tracking-tight text-white sm:text-xl">
                            {title}
                          </h3>
                          <p className="mt-1 font-mono text-[12px] text-zinc-500">{subtitle}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(item)}
                          className="shrink-0 rounded-xl p-2.5 text-zinc-500 transition-colors hover:bg-rose-500/15 hover:text-rose-400"
                          title="Remove device"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-2.5">
                        <DeviceMetric
                          label="Last seen"
                          value={
                            item.device.lastSeenAt
                              ? timeAgo(item.device.lastSeenAt)
                              : "Never"
                          }
                          icon={Clock}
                        />
                        <DeviceMetric
                          label="Address"
                          value={
                            item.device.lastIp ||
                            item.vps?.host ||
                            "—"
                          }
                          icon={Wifi}
                        />
                        <DeviceMetric
                          label="Platform"
                          value={
                            item.device.os
                              ? `${item.device.os}${item.device.arch ? ` · ${item.device.arch}` : ""}`
                              : "—"
                          }
                          icon={Cpu}
                        />
                        <DeviceMetric
                          label="Agent"
                          value={
                            item.device.agentVersion
                              ? `v${item.device.agentVersion}`
                              : "—"
                          }
                          icon={Shield}
                        />
                      </div>

                      {item.vps ? (
                        <div className="mt-4 flex items-start gap-2 rounded-xl bg-black/35 px-3 py-2.5 text-[11px] text-white">
                          <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" />
                          <span>
                            <span className="text-zinc-600">Source · </span>
                            <span className="font-medium text-zinc-400">
                              {item.vps.name}
                            </span>
                            <span className="text-zinc-700"> · </span>
                            <span className="text-zinc-500">
                              {item.vps.username}@{item.vps.host}
                            </span>
                          </span>
                        </div>
                      ) : null}

                      {item.device.hostname &&
                      item.device.hostname !== subtitle ? (
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-600">
                          <HardDrive className="h-3.5 w-3.5 text-zinc-700" />
                          <span className="font-mono">{item.device.hostname}</span>
                        </div>
                      ) : null}
                    </div>
                  </motion.article>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget ? (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
            onClick={closeDeleteModal}
            role="presentation"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-md overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#000] shadow-[0_40px_100px_rgba(0,0,0,0.9)]"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-device-title"
            >
              <div className="border-b border-white/[0.06] p-6 pb-5">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-500/25 bg-rose-500/10">
                    <AlertTriangle className="h-5 w-5 text-rose-400" />
                  </div>
                  <div className="min-w-0">
                    <h3
                      id="delete-device-title"
                      className="text-[15px] font-bold text-white"
                    >
                      Delete device?
                    </h3>
                    <p className="mt-2 text-[12px] leading-relaxed text-zinc-500">
                      This removes{" "}
                      <span className="font-semibold text-zinc-200">
                        {deleteTarget.device.name || deleteTarget.vps?.name || "this device"}
                      </span>{" "}
                      and related agent data from Cockpit.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-b border-rose-500/15 bg-rose-500/[0.04] px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06]">
                    <Server className="h-4 w-4 text-zinc-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-zinc-300">
                      {deleteTarget.device.hostname || deleteTarget.device.name || "Unknown"}
                    </p>
                    <p className="text-[10px] text-zinc-600">
                      {deleteTarget.vps?.host || deleteTarget.device.lastIp || "No IP recorded"}
                    </p>
                  </div>
                  {(() => {
                    const { label, color, dot } = statusLabel(deleteTarget.device);
                    return (
                      <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/[0.05] px-2.5 py-1">
                        <div className={cn("h-1.5 w-1.5 rounded-full", dot)} />
                        <span className={cn("text-[10px] font-semibold", color)}>{label}</span>
                      </div>
                    );
                  })()}
                </div>
                <ul className="mt-3 space-y-1.5 text-[10px] text-zinc-500">
                  {[
                    "Metrics and task history",
                    "Agent credentials",
                    "Cached file references",
                  ].map((w) => (
                    <li key={w} className="flex items-center gap-2">
                      <span className="h-1 w-1 shrink-0 rounded-full bg-rose-400/60" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>

              {deleteError ? (
                <div className="flex items-center gap-2 border-b border-rose-500/20 bg-rose-500/10 px-6 py-3">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                  <p className="text-[11px] font-medium text-rose-300">{deleteError}</p>
                </div>
              ) : null}

              <div className="flex gap-3 p-4">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl border border-white/[0.1] bg-white/[0.06] py-2.5 text-[12px] font-semibold text-zinc-200 transition-colors hover:bg-white/[0.1] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-60"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {toast ? (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed bottom-8 left-1/2 z-[250] flex -translate-x-1/2 items-center gap-2.5 rounded-xl px-4 py-2.5 shadow-lg backdrop-blur-xl",
              toast.type === "success"
                ? "border border-emerald-500/25 bg-emerald-500/15"
                : "border border-rose-500/25 bg-rose-500/15"
            )}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            )}
            <span
              className={cn(
                "text-[12px] font-semibold",
                toast.type === "success" ? "text-emerald-200" : "text-rose-200"
              )}
            >
              {toast.message}
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
