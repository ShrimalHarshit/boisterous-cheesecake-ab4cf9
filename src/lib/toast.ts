"use client";

/** Shows the global toast plate mounted in the root layout. */
export function toast(message: string, ms = 2400) {
  if (typeof document === "undefined") return;
  const el = document.getElementById("wh-toast");
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden");
  el.classList.add("tick");
  window.clearTimeout((toast as unknown as { t?: number }).t);
  (toast as unknown as { t?: number }).t = window.setTimeout(() => {
    el.classList.add("hidden");
    el.classList.remove("tick");
  }, ms);
}
