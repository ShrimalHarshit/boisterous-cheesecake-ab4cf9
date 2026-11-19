"use client";

import { useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { needLogin } from "@/components/login-sheet";
import {
  ABOUT_OPTIONS,
  fmt,
  inr,
  OWNERSHIP_OPTIONS,
  POSSESSION_OPTIONS,
  toSqft,
  VALID_MOBILE,
} from "@/lib/format";
import { toast } from "@/lib/toast";
import type { Lot } from "@/lib/types";

type Form = {
  ownerRole: string;
  type: string;
  name: string;
  number: string;
  address: string;
  city: string;
  locality: string;
  possessionFrom: string;
  aboutProperty: string;
  areaValue: string;
  areaUnit: string;
  price: string;
  negotiable: boolean;
  description: string;
  ownership: string;
  note: string;
};

const UNITS: [string, string][] = [
  ["sqft", "sq ft"],
  ["sqyd", "sq yd"],
  ["acre", "Acre"],
  ["hectare", "Hectare"],
  ["bigha", "Bigha"],
];

const STEPS = [
  { n: "01", label: "Details", hint: "Where and what" },
  { n: "02", label: "Area & photos", hint: "Measured extent" },
  { n: "03", label: "Ownership", hint: "Title standing" },
  { n: "04", label: "Pricing", hint: "Asking number" },
];

const empty: Form = {
  ownerRole: "owner",
  type: "warehouse",
  name: "",
  number: "",
  address: "",
  city: "",
  locality: "",
  possessionFrom: "",
  aboutProperty: "",
  areaValue: "",
  areaUnit: "sqft",
  price: "",
  negotiable: true,
  description: "",
  ownership: "",
  note: "",
};

const compress = (file: File) =>
  new Promise<string | null>((resolve) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 820 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        const ctx = c.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.62));
      };
      img.onerror = () => resolve(null);
      img.src = String(fr.result);
    };
    fr.onerror = () => resolve(null);
    fr.readAsDataURL(file);
  });

export function PostWizard({
  logged,
  user,
  initial = null,
}: {
  logged: boolean;
  user: { name: string; mobile: string; city: string | null; role: string } | null;
  initial?: Lot | null;
}) {
  // Guests start on the plain seller sheet; the stepped form follows "Proceed".
  const [phase, setPhase] = useState<"intake" | "wizard">(
    initial || logged ? "wizard" : "intake",
  );
  const [step, setStep] = useState(0);
  const [f, setF] = useState<Form>(() =>
    initial
      ? {
          ownerRole: user?.role === "broker" ? "broker" : "owner",
          type: initial.type,
          name: initial.name,
          number: initial.number,
          address: initial.address,
          city: initial.city ?? "",
          locality: initial.locality ?? "",
          possessionFrom: initial.possessionFrom ?? "",
          aboutProperty: initial.aboutProperty ?? "",
          areaValue: String(initial.areaValue ?? initial.sqft ?? ""),
          areaUnit: initial.areaUnit || "sqft",
          price: initial.price ? String(initial.price) : "",
          negotiable: initial.negotiable,
          description: initial.description,
          ownership: initial.ownership ?? "",
          note: "",
        }
      : {
          ...empty,
          name: user?.name ?? "",
          number: user?.mobile ?? "",
          city: user?.city ?? "",
          ownerRole: user?.role === "broker" ? "broker" : "owner",
        },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<string[]>(() => initial?.photos ?? []);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setF((p) => ({ ...p, [k]: v }));

  const sqft = useMemo(() => {
    const v = parseFloat(String(f.areaValue).replace(/,/g, ""));
    return Number.isFinite(v) && v > 0 ? toSqft(v, f.areaUnit) : 0;
  }, [f.areaValue, f.areaUnit]);

  const pps = useMemo(() => {
    const p = parseFloat(String(f.price).replace(/,/g, ""));
    return p > 0 && sqft > 0 ? Math.round(p / sqft) : 0;
  }, [f.price, sqft]);

  function validate(s: number): Record<string, string> {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!logged && f.name.trim().length < 2) e.name = "Enter the contact name";
      if (!logged && !VALID_MOBILE.test(f.number.replace(/\D/g, "").slice(-10)))
        e.number = "Enter a valid 10-digit mobile number";
      if (f.address.trim().length < 6) e.address = "Enter the full property address";
      if (f.city.trim().length < 2) e.city = "Enter the city / district";
      if (!f.locality.trim()) e.locality = "Enter the locality or MIDC name";
      if (!f.possessionFrom) e.possessionFrom = "Select possession";
      if (!f.aboutProperty) e.aboutProperty = "Select a use category";
      if (f.description.trim().length < 20)
        e.description = "Describe the property in at least 20 characters";
    }
    if (s === 1) {
      const v = parseFloat(String(f.areaValue).replace(/,/g, ""));
      if (!Number.isFinite(v) || v <= 0) e.areaValue = "Enter the area in numbers";
      if (!photos.length) e.photos = "Add at least one photo of the property";
    }
    if (s === 2) {
      if (!f.ownership) e.ownership = "Select the ownership type";
      if (!logged && !VALID_MOBILE.test(f.number.replace(/\D/g, "").slice(-10)))
        e.number = "Enter a valid 10-digit mobile number";
    }
    if (s === 3) {
      const p = parseFloat(String(f.price).replace(/,/g, ""));
      if (!Number.isFinite(p) || p <= 0) e.price = "Enter the expected price";
    }
    return e;
  }

  function next() {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) {
      toast("Check the highlighted fields");
      return;
    }
    setStep((s) => Math.min(3, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    const e = validate(3);
    setErrors(e);
    if (Object.keys(e).length) {
      toast("Check the highlighted fields");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(initial ? `/api/listings/${initial.id}` : "/api/listings", {
        method: initial ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ownerRole: f.ownerRole,
          type: f.type,
          name: f.name,
          number: f.number,
          address: f.address,
          city: f.city,
          locality: f.locality,
          possessionFrom: f.possessionFrom,
          aboutProperty: f.aboutProperty,
          areaValue: parseFloat(String(f.areaValue).replace(/,/g, "")),
          areaUnit: f.areaUnit,
          price: parseFloat(String(f.price).replace(/,/g, "")),
          negotiable: f.negotiable,
          description: f.description,
          ownership: f.ownership,
          note: f.note,
          photos,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBusy(false);
        toast(data.error || "Could not submit — try again");
        if (res.status === 401) needLogin();
        return;
      }
      toast(data.status === "live" ? "Published to the index" : "Submitted for desk review", 3200);
      // Use the callback redirect to set the session cookie reliably
      const dest = data.redirect || "/account";
      if (data.token) {
        window.location.href = `/api/auth/callback?token=${encodeURIComponent(data.token)}&next=${encodeURIComponent(dest)}`;
      } else {
        window.location.href = dest;
      }
    } catch {
      setBusy(false);
      toast("Network error — try again");
    }
  }

  async function addPhotos(list: FileList | null) {
    if (!list?.length) return;
    const room = 6 - photos.length;
    const picked: string[] = [];
    for (const file of Array.from(list).slice(0, room)) {
      const data = await compress(file);
      if (data) picked.push(data);
    }
    if (!picked.length) {
      toast("Could not read that image");
      return;
    }
    setPhotos((p) => [...p, ...picked].slice(0, 6));
    setErrors((e) => ({ ...e, photos: "" }));
  }

  const fld = (
    key: keyof Form,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <label className="block">
      <span className="lbl">{label}</span>
      <input
        className={`field ${errors[key as string] ? "bad" : ""}`}
        value={String(f[key] ?? "")}
        onChange={(e) => set(key, e.target.value as never)}
        {...props}
      />
      <span className="err">{errors[key as string] ?? ""}</span>
    </label>
  );

  const sel = (key: keyof Form, label: string, options: string[], placeholder: string) => (
    <label className="block">
      <span className="lbl">{label}</span>
      <select
        className={`field ${errors[key as string] ? "bad" : ""}`}
        value={String(f[key] ?? "")}
        onChange={(e) => set(key, e.target.value as never)}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <span className="err">{errors[key as string] ?? ""}</span>
    </label>
  );

  /* ─────────── INTAKE: the plain seller sheet ─────────── */
  if (phase === "intake") {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[320px_1fr] lg:gap-12">
          <aside className="lg:sticky lg:top-[86px] lg:self-start">
            <span className="stamp">Seller sheet</span>
            <h1 className="mt-4 text-[clamp(30px,5vw,44px)] leading-[1.02]">
              Tell us what you&apos;re{" "}
              <span className="font-serif font-normal italic text-oxide">putting on the index.</span>
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-ink2">
              Five fields to start. On <strong>Proceed</strong> we&apos;ll open the full property
              sheet — city, locality, possession, measured extent, ownership and pricing — then our
              desk reviews it within 24 hours.
            </p>
            <div className="mt-5 border-[1.5px] border-ink">
              <div className="imgframe aspect-[4/3] border-b-[1.5px] border-ink">
                <img src="/images/plan-desk.jpg" alt="Site plan on a drafting table" />
              </div>
              <p className="mono bg-panel px-3 py-2 text-[10.5px] uppercase tracking-[0.12em] text-mute">
                Sheet 00 — pre-registration
              </p>
            </div>
            <p className="mono mt-4 text-[11.5px] leading-relaxed text-mute">
              Already registered?{" "}
              <button
                onClick={() => (logged ? setPhase("wizard") : needLogin())}
                className="text-oxide underline underline-offset-2"
              >
                Log in instead
              </button>{" "}
              — the sheet fills itself from your account.
            </p>
          </aside>

          <div className="border-[1.5px] border-ink bg-card">
            <div className="flex items-center justify-between border-b-[1.5px] border-ink px-5 py-3.5">
              <span className="cap">Property details &amp; number</span>
              <span className="mono text-[11px] text-mute">01 — 05</span>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <div className="sm:col-span-2">
                <span className="lbl">I am the</span>
                <div className="flex border-[1.5px] border-ink">
                  {[
                    ["owner", "Owner"],
                    ["broker", "Broker / Builder"],
                  ].map(([k, l]) => (
                    <button
                      key={k}
                      onClick={() => set("ownerRole", k)}
                      className={`cap flex-1 px-4 py-3 ${
                        f.ownerRole === k ? "bg-ink text-paper" : "text-ink2 hover:bg-panel"
                      } ${k === "broker" ? "border-l-[1.5px] border-ink" : ""}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <span className="lbl">Property type</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["warehouse", "Built warehouse", "Sheds, godowns, factories"],
                    ["land", "Land / plot", "Open, graded or agricultural"],
                  ].map(([k, l, h]) => (
                    <button
                      key={k}
                      onClick={() => set("type", k)}
                      className={`border-[1.5px] p-4 text-left transition-colors ${
                        f.type === k
                          ? "border-oxide bg-[color-mix(in_srgb,var(--c-oxide)_9%,transparent)]"
                          : "border-line hover:border-ink"
                      }`}
                    >
                      <span className="flex items-center gap-2 font-bold">
                        <Icon name={k === "land" ? "area" : "grid"} className="h-5 w-5 text-oxide" />
                        {l}
                      </span>
                      <span className="mt-1 block text-[13px] text-mute">{h}</span>
                    </button>
                  ))}
                </div>
              </div>

              {fld("name", "Name", {
                placeholder: "Contact person",
                autoComplete: "name",
              })}
              <label className="block">
                <span className="lbl">Number</span>
                <div
                  className={`flex border-[1.5px] bg-paper ${
                    errors.number ? "border-oxide" : "border-line focus-within:border-ink"
                  }`}
                >
                  <span className="mono flex items-center border-r border-line px-3 text-mute">+91</span>
                  <input
                    className="min-w-0 flex-1 bg-transparent px-3 py-3 outline-none"
                    inputMode="tel"
                    maxLength={12}
                    value={f.number}
                    onChange={(e) => set("number", e.target.value.replace(/\D/g, ""))}
                    placeholder="10-digit mobile"
                  />
                </div>
                <span className="err">{errors.number ?? ""}</span>
              </label>

              {fld("address", "Property address", {
                placeholder: "Plot / shed no., MIDC, district, PIN",
              })}
              {fld("city", "City / district", { placeholder: "e.g. Nashik" })}

              <div className="sm:col-span-2">
                <label className="block">
                  <span className="lbl">Description</span>
                  <textarea
                    className={`field ${errors.description ? "bad" : ""}`}
                    value={f.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Road access, power load, clear height, title status, water…"
                  />
                  <span className="err">{errors.description ?? ""}</span>
                </label>
              </div>

              <div className="sm:col-span-2 border-t border-line pt-4">
                <p className="text-[13.5px] text-ink2">
                  On <strong>Proceed</strong> you&apos;ll complete locality, possession, measured
                  area, ownership and pricing — then create your account to track the listing.
                </p>
                <button
                  className="btn mt-4 w-full sm:w-auto"
                  onClick={() => {
                    const e = validate(0);
                    setErrors(e);
                    if (Object.keys(e).length) {
                      toast("Fill the required fields first");
                      return;
                    }
                    setPhase("wizard");
                    setStep(0);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Proceed to the property sheet
                  <Icon name="arrow" className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────── WIZARD: four steps ─────────── */
  const S = STEPS[step];

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-12">
        {/* sticky sheet index */}
        <aside className="lg:sticky lg:top-[86px] lg:self-start">
          <span className="stamp">
            {logged ? "Your sheet — pre-filled" : "Property sheet"}
          </span>
          <h1 className="mt-4 text-[clamp(28px,4.6vw,40px)] leading-[1.04]">
            {initial ? "Edit this lot" : logged ? "Post your lot" : "Complete the sheet"}
          </h1>
          <p className="mt-2 text-[14.5px] text-ink2">
            {initial
              ? `Editing ${initial.lot}. Changes to a live lot send it back to the review queue.`
              : logged
                ? `Signed in as ${user?.name}. Details we already hold are filled in.`
                : "Your account is created at the end, from the number you gave on the seller sheet."}
          </p>

          <ol className="mt-6 border-t-[1.5px] border-ink">
            {STEPS.map((s, i) => (
              <li
                key={s.n}
                className={`flex items-center gap-3 border-b border-line py-3 transition-colors ${
                  i === step ? "text-ink" : i < step ? "text-survey" : "text-mute"
                }`}
              >
                <span
                  className={`mono grid h-8 w-8 shrink-0 place-items-center border text-[11px] font-bold ${
                    i === step
                      ? "border-oxide bg-oxide text-white"
                      : i < step
                        ? "border-survey text-survey"
                        : "border-line"
                  }`}
                >
                  {i < step ? <Icon name="check" className="h-4 w-4" /> : s.n}
                </span>
                <span>
                  <span className="block text-[14.5px] font-bold leading-none">{s.label}</span>
                  <span className="mono block text-[10.5px] uppercase tracking-[0.1em] text-mute">
                    {s.hint}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          {/* live preview plate */}
          <div className="mt-6 border-[1.5px] border-ink bg-card p-4">
            <p className="cap text-mute">Live preview</p>
            <p className="mt-2 font-bold leading-tight">
              {f.locality || f.city || "Locality"} — {f.type === "land" ? "land plot" : "warehouse"}
            </p>
            <p className="mono mt-1 truncate text-[11.5px] text-mute">{f.address || "Address"}</p>
            <div className="mt-3 flex items-end justify-between border-t border-line pt-3">
              <span className="num text-[22px] font-black">
                {sqft ? fmt(sqft) : "—"}
                <span className="mono ml-1 align-middle text-[10px] font-normal uppercase text-mute">
                  sq ft
                </span>
              </span>
              <span className="num text-[18px] font-extrabold text-oxide">
                {f.price ? inr(parseFloat(f.price.replace(/,/g, ""))) : "₹ —"}
              </span>
            </div>
            <p className="mono mt-2 text-[10.5px] uppercase tracking-[0.1em] text-mute">
              {pps ? `₹${fmt(pps)} / sq ft` : "price per sq ft calculated on step 04"}
            </p>
          </div>
        </aside>

        {/* form card */}
        <div className="min-w-0 border-[1.5px] border-ink bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-[1.5px] border-ink px-5 py-3.5">
            <span className="cap">
              Step {S.n} — {S.label}
            </span>
            <div className="flex items-center gap-2">
              <span className="mono text-[11px] text-mute">
                {S.n} / 04 · {Math.round(((step + 1) / 4) * 100)}%
              </span>
              <span className="block h-2 w-24 border border-line">
                <span
                  className="block h-full bg-oxide transition-all duration-300"
                  style={{ width: `${((step + 1) / 4) * 100}%` }}
                />
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {/* ── STEP 01 ── */}
            {step === 0 && (
              <div className="rise grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <span className="lbl">Property type</span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      ["warehouse", "Built warehouse", "Shed, godown or factory block"],
                      ["land", "Land / plot", "Open, graded or agricultural"],
                    ].map(([k, l, h]) => (
                      <button
                        key={k}
                        onClick={() => set("type", k)}
                        className={`border-[1.5px] p-4 text-left transition-colors ${
                          f.type === k
                            ? "border-oxide bg-[color-mix(in_srgb,var(--c-oxide)_9%,transparent)]"
                            : "border-line hover:border-ink"
                        }`}
                      >
                        <span className="flex items-center gap-2 font-bold">
                          <Icon name={k === "land" ? "area" : "grid"} className="h-5 w-5 text-oxide" />
                          {l}
                        </span>
                        <span className="mt-1 block text-[13px] text-mute">{h}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {!logged ? (
                  <>
                    {fld("name", "Name", { placeholder: "Contact person" })}
                    <label className="block">
                      <span className="lbl">Number</span>
                      <div
                        className={`flex border-[1.5px] bg-paper ${
                          errors.number ? "border-oxide" : "border-line focus-within:border-ink"
                        }`}
                      >
                        <span className="mono flex items-center border-r border-line px-3 text-mute">
                          +91
                        </span>
                        <input
                          className="min-w-0 flex-1 bg-transparent px-3 py-3 outline-none"
                          inputMode="tel"
                          maxLength={12}
                          value={f.number}
                          onChange={(e) => set("number", e.target.value.replace(/\D/g, ""))}
                          placeholder="10-digit mobile"
                        />
                      </div>
                      <span className="err">{errors.number ?? ""}</span>
                    </label>
                  </>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 sm:col-span-2">
                    <div className="border border-line bg-paper p-3.5">
                      <span className="lbl">Contact name</span>
                      <p className="text-[15px] font-semibold">{user?.name}</p>
                    </div>
                    <div className="border border-line bg-paper p-3.5">
                      <span className="lbl">Mobile number</span>
                      <p className="mono text-[15px] font-semibold">+91 {user?.mobile}</p>
                    </div>
                  </div>
                )}

                {fld("city", "City / district", { placeholder: "e.g. Nashik" })}
                {fld("locality", "Locality", { placeholder: "e.g. MIDC Ambad" })}
                {fld("address", "Property address", {
                  placeholder: "Plot / shed no., MIDC, district, PIN",
                })}

                {sel("possessionFrom", "Possession from", POSSESSION_OPTIONS, "Select possession")}
                {sel("aboutProperty", "About the property", ABOUT_OPTIONS, "Select use category")}

                <div className="sm:col-span-2">
                  <label className="block">
                    <span className="lbl">About the property</span>
                    <textarea
                      className={`field ${errors.description ? "bad" : ""}`}
                      value={f.description}
                      onChange={(e) => set("description", e.target.value)}
                      placeholder="Road access, power load, clear height, title status, water, boundary…"
                    />
                    <span className="err">{errors.description ?? ""}</span>
                  </label>
                </div>
              </div>
            )}

            {/* ── STEP 02 ── */}
            {step === 1 && (
              <div className="rise grid gap-6">
                <div>
                  <span className="lbl">Plot area — type the number, pick the unit on the right</span>
                  <div
                    className={`flex border-[1.5px] ${
                      errors.areaValue ? "border-oxide" : "border-ink"
                    }`}
                  >
                    <input
                      className="num min-w-0 flex-1 bg-paper px-4 py-4 text-[clamp(26px,5vw,34px)] font-black outline-none"
                      inputMode="decimal"
                      value={f.areaValue}
                      onChange={(e) => set("areaValue", e.target.value.replace(/[^\d.]/g, ""))}
                      placeholder="0"
                      aria-label="Plot area value"
                    />
                    <div className="flex w-[112px] shrink-0 flex-col border-l-[1.5px] border-ink sm:w-[136px]">
                      {UNITS.map(([k, l], i) => (
                        <button
                          key={k}
                          onClick={() => set("areaUnit", k)}
                          className={`cap flex-1 px-2 py-2 transition-colors ${
                            f.areaUnit === k ? "bg-ink text-paper" : "text-ink2 hover:bg-panel"
                          } ${i > 0 ? "border-t border-line" : ""}`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="err m-0">{errors.areaValue ?? ""}</span>
                    <span className="mono text-[12px] text-mute">
                      {sqft > 0 ? `= ${fmt(sqft)} sq ft` : "equivalent in sq ft appears here"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-line pt-5">
                  <span className="lbl">Photos — up to 6, at least one</span>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                    {photos.map((p, i) => (
                      <div key={i} className="relative aspect-square border border-line">
                        <img src={p} alt="" className="h-full w-full object-cover" />
                        <button
                          onClick={() => setPhotos((all) => all.filter((_, j) => j !== i))}
                          aria-label="Remove photo"
                          className="absolute right-1 top-1 grid h-6 w-6 place-items-center border border-ink bg-paper"
                        >
                          <Icon name="x" className="h-3.5 w-3.5" />
                        </button>
                        {i === 0 && (
                          <span className="mono absolute bottom-0 left-0 bg-ink px-1.5 py-0.5 text-[9px] uppercase text-paper">
                            cover
                          </span>
                        )}
                      </div>
                    ))}
                    {photos.length < 6 && (
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="grid aspect-square place-items-center gap-1 border-[1.5px] border-dashed border-mute text-mute transition-colors hover:border-ink hover:text-ink"
                      >
                        <Icon name="camera" className="h-6 w-6" />
                        <span className="cap text-[9px]">Add</span>
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => {
                      void addPhotos(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <span className="err">{errors.photos ?? ""}</span>
                  <p className="mono mt-1 text-[11.5px] text-mute">
                    Frontage, interior, road approach and boundary shots get the most enquiries.
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 03 ── */}
            {step === 2 && (
              <div className="rise grid gap-6">
                <div>
                  <span className="lbl">Ownership — pick one</span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {OWNERSHIP_OPTIONS.map((o) => (
                      <button
                        key={o}
                        onClick={() => set("ownership", o)}
                        className={`border-[1.5px] p-4 text-left transition-colors ${
                          f.ownership === o
                            ? "border-oxide bg-[color-mix(in_srgb,var(--c-oxide)_9%,transparent)]"
                            : "border-line hover:border-ink"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2 font-bold">
                          {o}
                          {f.ownership === o && (
                            <Icon name="check" className="h-5 w-5 text-oxide" />
                          )}
                        </span>
                        <span className="mt-1 block text-[13px] leading-snug text-mute">
                          {o === "Freehold"
                            ? "Absolute sale deed, transferable without consent"
                            : o === "Leasehold"
                              ? "Lease from the authority, transfer needs sanction"
                              : o === "Power of Attorney"
                                ? "Attorney holder selling on behalf of the owner"
                                : "GPA or agreement-to-sell holding — needs extra diligence"}
                        </span>
                      </button>
                    ))}
                  </div>
                  <span className="err">{errors.ownership ?? ""}</span>
                </div>

                {!logged && (
                  <div className="border-t border-line pt-5">
                    <label className="block max-w-[380px]">
                      <span className="lbl">Contact number for enquiries</span>
                      <div
                        className={`flex border-[1.5px] bg-paper ${
                          errors.number ? "border-oxide" : "border-line focus-within:border-ink"
                        }`}
                      >
                        <span className="mono flex items-center border-r border-line px-3 text-mute">
                          +91
                        </span>
                        <input
                          className="min-w-0 flex-1 bg-transparent px-3 py-3 outline-none"
                          inputMode="tel"
                          maxLength={12}
                          value={f.number}
                          onChange={(e) => set("number", e.target.value.replace(/\D/g, ""))}
                          placeholder="10-digit mobile"
                        />
                      </div>
                      <span className="err">{errors.number ?? ""}</span>
                    </label>
                    <p className="mono mt-2 text-[11.5px] text-mute">
                      An account is created with this number at the end — you&apos;ll be signed in
                      automatically.
                    </p>
                  </div>
                )}

                <div className="border-t border-line pt-5">
                  <span className="lbl">Listing as</span>
                  <div className="flex border-[1.5px] border-ink">
                    {[
                      ["owner", "Owner"],
                      ["broker", "Broker / Builder"],
                    ].map(([k, l]) => (
                      <button
                        key={k}
                        onClick={() => set("ownerRole", k)}
                        className={`cap flex-1 px-4 py-3 ${
                          f.ownerRole === k ? "bg-ink text-paper" : "text-ink2 hover:bg-panel"
                        } ${k === "broker" ? "border-l-[1.5px] border-ink" : ""}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 04 ── */}
            {step === 3 && (
              <div className="rise grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block">
                    <span className="lbl">Expected price (₹)</span>
                    <input
                      className={`num field text-[26px] font-black ${errors.price ? "bad" : ""}`}
                      inputMode="numeric"
                      value={f.price}
                      onChange={(e) => set("price", e.target.value.replace(/[^\d]/g, ""))}
                      placeholder="e.g. 24000000"
                    />
                    <span className="err">{errors.price ?? ""}</span>
                  </label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {[
                      ["1", "₹1 L"],
                      ["10", "₹10 L"],
                      ["100", "₹1 Cr"],
                      ["500", "₹5 Cr"],
                    ].map(([mult, label]) => (
                      <button
                        key={label}
                        className="chip"
                        onClick={() => set("price", String(Number(mult) * 100000))}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-[1.5px] border-ink bg-paper p-4">
                  <span className="lbl">Price per sq ft</span>
                  <p className="num text-[30px] font-black leading-none text-oxide">
                    {pps ? `₹${fmt(pps)}` : "—"}
                  </p>
                  <p className="mono mt-2 text-[11px] uppercase tracking-[0.1em] text-mute">
                    {sqft ? `over ${fmt(sqft)} sq ft` : "set area on step 02"}
                  </p>
                </div>

                <div className="border-[1.5px] border-ink bg-paper p-4">
                  <span className="lbl">Negotiable</span>
                  <div className="mt-1 flex border-[1.5px] border-ink">
                    {[
                      [true, "Yes"],
                      [false, "Firm"],
                    ].map(([v, l]) => (
                      <button
                        key={String(v)}
                        onClick={() => set("negotiable", v as boolean)}
                        className={`cap flex-1 px-3 py-2.5 ${
                          f.negotiable === v ? "bg-ink text-paper" : "text-ink2 hover:bg-panel"
                        }`}
                      >
                        {l as string}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block">
                    <span className="lbl">Registry, charges &amp; other notes (optional)</span>
                    <textarea
                      className="field"
                      value={f.note}
                      onChange={(e) => set("note", e.target.value)}
                      placeholder="Who bears registry, stamp duty, any pending dues…"
                    />
                  </label>
                </div>

                <div className="sm:col-span-2 hatch border-[1.5px] border-ink p-4">
                  <p className="cap">Summary</p>
                  <ul className="mono mt-2 space-y-1 text-[13px]">
                    <li>
                      {f.locality || "—"}, {f.city || "—"} · {f.type === "land" ? "Land" : "Warehouse"}
                    </li>
                    <li>
                      {sqft ? fmt(sqft) : "—"} sq ft · {f.ownership || "ownership pending"}
                    </li>
                    <li>
                      {f.price ? inr(parseFloat(f.price)) : "—"}
                      {f.negotiable ? " · negotiable" : " · firm"}
                    </li>
                  </ul>
                  <p className="mt-3 text-[13px] leading-relaxed text-ink2">
                    Submitting adds this lot to the review queue. Our desk checks the details and
                    usually publishes within 24 hours.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* footer */}
          <div className="flex flex-wrap items-center gap-3 border-t-[1.5px] border-ink px-5 py-4">
            {step > 0 ? (
              <button className="btn ghost" onClick={() => setStep((s) => s - 1)}>
                <Icon name="back" className="h-4 w-4" />
                Back
              </button>
            ) : (
              <button
                className="btn ghost"
                onClick={() => {
                  if (initial || logged) window.location.href = "/account";
                  else setPhase("intake");
                }}
              >
                <Icon name="back" className="h-4 w-4" />
                {initial || logged ? "My account" : "Seller sheet"}
              </button>
            )}

            <span className="mono hidden text-[11px] uppercase tracking-[0.12em] text-mute sm:block">
              Step {S.n} of 04
            </span>

            {step < 3 ? (
              <button className="btn ml-auto" onClick={next}>
                Continue
                <Icon name="arrow" className="h-4 w-4" />
              </button>
            ) : (
              <button className="btn oxide ml-auto" onClick={submit} disabled={busy}>
                {busy ? "Saving…" : initial ? "Save changes" : "Submit for review"}
                <Icon name="check" className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
