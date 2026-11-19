"use client";

import { useEffect, useState } from "react";
import { AuthCard } from "@/components/auth-card";
import { Icon, Mark } from "@/components/icons";

export const NEED_LOGIN = "wh:need-login";

/** Fire this anywhere: `window.dispatchEvent(new Event(NEED_LOGIN))` */
export function needLogin() {
  window.dispatchEvent(new Event(NEED_LOGIN));
}

export function LoginSheet() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setOpen(true);
    const off = () => setOpen(false);
    window.addEventListener(NEED_LOGIN, on);
    window.addEventListener("wh:logged-in", off);
    return () => {
      window.removeEventListener(NEED_LOGIN, on);
      window.removeEventListener("wh:logged-in", off);
    };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-end justify-center sm:items-center">
      <button
        aria-label="Close"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-[rgba(22,19,14,0.62)] backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[460px] border-[1.5px] border-ink bg-card shadow-[0_-14px_40px_rgba(22,19,14,0.3)] sm:shadow-[10px_10px_0_rgba(22,19,14,0.25)]"
        style={{ animation: "rise .3s cubic-bezier(.2,.7,.3,1) both" }}
      >
        <div className="flex items-center justify-between border-b-[1.5px] border-ink px-5 py-3.5">
          <span className="flex items-center gap-2">
            <Mark className="h-7 w-7 text-ink" />
            <span className="cap">Login required</span>
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center border border-line hover:border-ink"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[76vh] overflow-y-auto py-4">
          <AuthCard
            compact
            next={typeof window !== "undefined" ? window.location.pathname : "/"}
            onSuccess={() => window.dispatchEvent(new Event("wh:logged-in"))}
          />
        </div>
      </div>
    </div>
  );
}
