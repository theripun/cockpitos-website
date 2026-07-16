export type PlanUser = Record<string, unknown> | null | undefined;

const PAID_PLANS = new Set(["paid", "pro", "premium", "business", "enterprise"]);
const FREE_PLANS = new Set(["", "free", "starter", "trial"]);
const PAID_STATUSES = new Set(["active", "trialing", "paid"]);

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") return value.trim().toLowerCase();
  }
  return "";
}

export function isPaidPlanUser(user: PlanUser) {
  if (!user || typeof user !== "object") return false;

  const plan = readString(user, [
    "plan",
    "planName",
    "subscriptionPlan",
    "subscriptionTier",
    "tier",
  ]);

  const status = readString(user, [
    "subscriptionStatus",
    "planStatus",
    "billingStatus",
    "status",
  ]);

  if (PAID_PLANS.has(plan)) return true;
  if (PAID_STATUSES.has(status) && !FREE_PLANS.has(plan)) return true;

  return false;
}

export function shouldShowPricingForUser(user: PlanUser) {
  return !isPaidPlanUser(user);
}

function toTitleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getCurrentPlanLabel(user: PlanUser) {
  if (!user || typeof user !== "object") return "Free Plan";

  const plan = readString(user, [
    "plan",
    "planName",
    "subscriptionPlan",
    "subscriptionTier",
    "tier",
  ]);

  if (plan) {
    if (plan === "paid") return "Paid Plan";
    return `${toTitleCase(plan)} Plan`;
  }

  const status = readString(user, [
    "subscriptionStatus",
    "planStatus",
    "billingStatus",
    "status",
  ]);

  if (PAID_STATUSES.has(status)) return "Paid Plan";

  return "Free Plan";
}
