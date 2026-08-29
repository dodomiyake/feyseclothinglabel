// Structured so more currencies can be added later without touching call sites.
const CURRENCY_LOCALE: Record<string, string> = {
  NGN: "en-NG",
  USD: "en-US",
  GBP: "en-GB",
};

export function formatCurrency(amount: number, currency: string = "NGN") {
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? "en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Same formatting, but with the currency code ("NGN") instead of its
 * symbol ("₦"). The PDF documents render with the base-14 Helvetica font,
 * which has no glyph for ₦ (or most non-Latin currency symbols) — it
 * renders as a broken/placeholder character instead of failing loudly, so
 * use this wherever an amount is rendered inside a PDF.
 */
export function formatCurrencyForPdf(amount: number, currency: string = "NGN") {
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? "en-NG", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function relativeTime(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  const diffMs = d.getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const rtf = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });
  if (Math.abs(diffDays) < 1) {
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    return rtf.format(diffHours, "hour");
  }
  return rtf.format(diffDays, "day");
}
