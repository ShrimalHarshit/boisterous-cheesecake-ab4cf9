"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";

type Mode = "start" | "login" | "signup";

export function AuthCard({
  onSuccess,
  compact = false,
  next,
}: {
  onSuccess?: () => void;
  compact?: boolean;
  next?: string;
}) {
  const [mode, setMode] = useState<Mode>("start");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(action: "login" | "signup" | "provider", provider?: string) {
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, mobile, password: pw, name, provider, next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Something went wrong. Try again.");
        setBusy(false);
        return;
      }
      onSuccess?.();

      // Navigate through the callback GET endpoint so the cookie is set on
      // a top-level page navigation — fetch Set-Cookie headers are silently
      // dropped inside proxy/iframe environments (Arena preview, etc.).
      const dest = data.redirect || next || "/";
      if (data.token) {
        window.location.href = `/api/auth/callback?token=${encodeURIComponent(data.token)}&next=${encodeURIComponent(dest)}`;
      } else {
        window.location.href = dest;
      }
    } catch {
      setErr("Network error. Try again.");
      setBusy(false);
    }
  }

  const digits = mobile.replace(/\D/g, "").slice(-10);
  const mobileOk = /^[6-9]\d{9}$/.test(digits);
  const pwOk = pw.length >= 6;
  const nameOk = name.trim().length > 1;

  if (mode === "start") {
    return (
      <div className={compact ? "" : "px-5 pb-8 pt-5 sm:px-8"}>
        {!compact && (
          <>
            <p className="cap text-mute">Step 01</p>
            <h2 className="mt-2 text-[28px] sm:text-[32px]">Continue to WareHub</h2>
            <p className="mt-2 text-[14px] text-ink2">
              Save lots, contact owners and post your own property.
            </p>
          </>
        )}
        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            onClick={() => submit("provider", "Google")}
            disabled={busy}
            className="btn ghost block"
          >
            <Icon name="google" className="h-[18px] w-[18px]" filled />
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => submit("provider", "Apple")}
            disabled={busy}
            className="btn ghost block"
          >
            <Icon name="apple" className="h-[18px] w-[18px]" filled />
            Continue with Apple
          </button>
        </div>
        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="cap text-mute">or</span>
          <span className="h-px flex-1 bg-line" />
        </div>
        <button type="button" onClick={() => setMode("signup")} className="btn block">
          Create account
        </button>
        <p className="mt-4 text-center text-[14px] text-ink2">
          Already registered?{" "}
          <button
            type="button"
            onClick={() => setMode("login")}
            className="font-semibold text-oxide underline underline-offset-4"
          >
            Log in
          </button>
        </p>
        <p className="mono mt-4 text-center text-[10.5px] leading-relaxed text-mute">
          Demo build — social sign-in is simulated. Seller 9822012345 / demo123 · Admin 9999999999 /
          admin123
        </p>
      </div>
    );
  }

  const signup = mode === "signup";
  return (
    <form
      className={compact ? "" : "px-5 pb-8 pt-5 sm:px-8"}
      onSubmit={(e) => {
        e.preventDefault();
        if (!mobileOk) {
          setErr("Enter a valid 10-digit mobile number — it must start with 6, 7, 8 or 9.");
          return;
        }
        if (!pwOk) {
          setErr("Password must be at least 6 characters.");
          return;
        }
        if (mode === "signup" && !nameOk) {
          setErr("Enter your full name.");
          return;
        }
        submit(signup ? "signup" : "login");
      }}
    >
      {!compact && (
        <>
          <p className="cap text-mute">{signup ? "New account" : "Welcome back"}</p>
          <h2 className="mt-2 text-[28px] sm:text-[32px]">
            {signup ? "Create your account" : "Log in to continue"}
          </h2>
        </>
      )}
      <div className="mt-5 space-y-3.5">
        {signup && (
          <label className="block">
            <span className="lbl">Full name</span>
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rajesh Patil"
              autoComplete="name"
            />
          </label>
        )}
        <label className="block">
          <span className="lbl">Mobile number</span>
          <div className="flex border-[1.5px] border-line bg-card focus-within:border-ink">
            <span className="mono flex items-center border-r border-line px-3 text-[14px] text-mute">
              +91
            </span>
            <input
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[15px] outline-none"
              value={mobile}
              inputMode="tel"
              maxLength={12}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
              placeholder="10-digit mobile"
              autoComplete="tel"
            />
          </div>
        </label>
        <label className="block">
          <span className="lbl">Password</span>
          <input
            className="field"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete={signup ? "new-password" : "current-password"}
          />
        </label>
      </div>
      {err && (
        <p className="mt-3 border-l-[3px] border-oxide bg-[color-mix(in_srgb,var(--c-oxide)_10%,transparent)] px-3 py-2 text-[13px] text-ink2">
          {err}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn mt-4 block">
        {busy ? "Working…" : signup ? "Create account" : "Log in"}
      </button>
      <p className="mt-4 text-center text-[14px] text-ink2">
        {signup ? "Already have an account?" : "New to WareHub?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(signup ? "login" : "signup");
            setErr("");
          }}
          className="font-semibold text-oxide underline underline-offset-4"
        >
          {signup ? "Log in" : "Create account"}
        </button>
      </p>
      <p className="mt-3 text-center">
        <button
          type="button"
          onClick={() => {
            setMode("start");
            setErr("");
          }}
          className="cap text-mute hover:text-ink"
        >
          ‹ All options
        </button>
      </p>
      {!compact && (
        <p className="mono mt-4 border-t border-line pt-4 text-center text-[10.5px] leading-relaxed text-mute">
          Demo seller <strong>9822012345 / demo123</strong>
          <br />
          Admin <strong>9999999999 / admin123</strong>
        </p>
      )}
    </form>
  );
}
