export const UNIT_LABEL: Record<string, string> = {
  sqft: "sq ft",
  sqyd: "sq yd",
  acre: "Acre",
  hectare: "Hectare",
  bigha: "Bigha",
};

/** Converts any entered area into whole square feet so listings stay comparable. */
export function toSqft(value: number, unit: string): number {
  const v = Number.isFinite(value) ? value : 0;
  switch (unit) {
    case "sqyd":
      return Math.round(v * 9);
    case "acre":
      return Math.round(v * 43560);
    case "hectare":
      return Math.round(v * 107639);
    case "bigha":
      return Math.round(v * 36300);
    default:
      return Math.round(v);
  }
}

export const fmt = (n: number) => Math.round(n).toLocaleString("en-IN");

/** Indian short form: ₹1.20 Cr / ₹24.5 L / ₹9,60,000 */
export function inr(n: number | null | undefined): string {
  if (!n) return "Price on request";
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2).replace(/\.?0+$/, "")} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1).replace(/\.0$/, "")} L`;
  return `₹${fmt(n)}`;
}

export function ago(iso: string | Date): string {
  const t = typeof iso === "string" ? new Date(iso).getTime() : iso.getTime();
  const m = (Date.now() - t) / 60000;
  if (m < 1) return "Just now";
  if (m < 60) return `${Math.round(m)} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} hr ago`;
  const d = Math.round(m / 1440);
  if (d < 30) return `${d} d ago`;
  return new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function dateShort(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function hashHue(s: string): number {
  let h = 0;
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export const TYPE_LABEL: Record<string, string> = {
  land: "Land / Plot",
  warehouse: "Built warehouse",
};

export const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  broker: "Broker / Builder",
  admin: "Admin",
};

export const OWNERSHIP_OPTIONS = [
  "Freehold",
  "Leasehold",
  "Power of Attorney",
  "GPA / Agreement",
];

export const ABOUT_OPTIONS = [
  "Industrial use",
  "Warehousing & logistics",
  "Commercial / shopfloor",
  "Development land",
  "Investment holding",
];

export const POSSESSION_OPTIONS = [
  "Ready to move",
  "Within 3 months",
  "3 – 6 months",
  "6 – 12 months",
  "Under construction",
];

export const VALID_MOBILE = /^[6-9]\d{9}$/;
