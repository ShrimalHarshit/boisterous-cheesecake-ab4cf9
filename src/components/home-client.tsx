"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { LotCard } from "@/components/listing-card";
import { fmt } from "@/lib/format";
import type { Lot, Seller } from "@/lib/types";

type Props = { lots: Lot[]; sellers: Seller[]; favs: number[]; logged: boolean };

const TYPE_TABS: [string, string][] = [
  ["all", "All lots"],
  ["land", "Land / plots"],
  ["warehouse", "Warehouses"],
];
const QUICK: [string, string][] = [
  ["new", "Newest"],
  ["big", "Largest"],
  ["price", "Budget"],
];
const SORTS: [string, string][] = [
  ["new", "Newest first"],
  ["big", "Largest area"],
  ["small", "Smallest area"],
  ["price", "Price — low to high"],
];
const AREAS: [string, string][] = [
  ["any", "Any size"],
  ["s", "Under 10,000 sq ft"],
  ["m", "10,000 – 50,000 sq ft"],
  ["l", "50,000+ sq ft"],
];

const RAIL = [
  { id: "recent", n: "01", label: "Recently added" },
  { id: "index", n: "02", label: "Full lot index" },
  { id: "sellers", n: "03", label: "Verified sellers" },
  { id: "post", n: "04", label: "Post a property" },
];

export function HomeClient({ lots, sellers, favs, logged }: Props) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("new");
  const [area, setArea] = useState("any");
  const [sheet, setSheet] = useState(false);

  const favSet = useMemo(() => new Set(favs), [favs]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const rows = lots.filter((l) => {
      if (type !== "all" && l.type !== type) return false;
      if (area === "s" && l.sqft >= 10000) return false;
      if (area === "m" && (l.sqft < 10000 || l.sqft >= 50000)) return false;
      if (area === "l" && l.sqft < 50000) return false;
      if (!needle) return true;
      return `${l.name} ${l.address} ${l.locality ?? ""} ${l.city ?? ""} ${l.description}`
        .toLowerCase()
        .includes(needle);
    });
    const by: Record<string, (a: Lot, b: Lot) => number> = {
      new: (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      big: (a, b) => b.sqft - a.sqft,
      small: (a, b) => a.sqft - b.sqft,
      price: (a, b) => (a.price ?? 1e15) - (b.price ?? 1e15),
    };
    return rows.sort(by[sort] ?? by.new);
  }, [lots, q, type, sort, area]);

  const recent = useMemo(
    () => [...lots].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6),
    [lots],
  );

  function go(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      {/* ───────────────── HERO ───────────────── */}
      <section className="mx-auto max-w-[1440px] px-4 pt-6 sm:px-6 sm:pt-9">
        <div className="grid items-end gap-9 lg:grid-cols-[1.06fr_0.94fr] lg:gap-12">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line pb-3">
              <span className="mono text-[10.5px] uppercase tracking-[0.18em] text-mute">
                Lot index · sheet 01
              </span>
              <span className="mono text-[10.5px] uppercase tracking-[0.18em] text-survey">
                {lots.length} live lots
              </span>
              <span className="stamp ml-auto">No brokerage</span>
            </div>

            <h1 className="mt-5 text-[clamp(32px,7.4vw,76px)] leading-[0.94]">
              Commercial land &amp;
              <br />
              ready warehouses,{" "}
              <span className="font-serif font-normal italic tracking-[-0.01em] text-oxide">
                sold direct.
              </span>
            </h1>

            <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-ink2 sm:text-[16px]">
              Owner and broker listings across Nashik, Pune, Bhiwandi, Chakan and Sinnar. Every lot is
              title-checked by our desk before it reaches this index.
            </p>

            {/* type tabs */}
            <div className="mt-6 flex border-[1.5px] border-ink">
              {TYPE_TABS.map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setType(k)}
                  className={`cap flex-1 px-3 py-3 transition-colors ${
                    type === k ? "bg-ink text-paper" : "bg-transparent text-ink2 hover:bg-panel"
                  } ${k !== "all" ? "border-l-[1.5px] border-ink" : ""}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* search + circle filter */}
            <div className="mt-3 flex gap-2.5">
              <div className="relative min-w-0 flex-1 border-[1.5px] border-ink bg-card">
                <Icon
                  name="search"
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-mute"
                />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  aria-label="Search lots"
                  placeholder="Search locality, city, owner…"
                  className="h-[58px] w-full bg-transparent pl-12 pr-[62px] text-[15px] outline-none placeholder:text-mute"
                />
                <button
                  onClick={() => go("index")}
                  aria-label="Search"
                  className="absolute right-[5px] top-1/2 grid h-[46px] w-[46px] -translate-y-1/2 place-items-center rounded-full bg-oxide text-white transition-transform hover:scale-105 active:scale-95"
                >
                  <Icon name="search" className="h-5 w-5" />
                </button>
              </div>
              <button
                onClick={() => setSheet(true)}
                aria-label="Sort and filter"
                className="relative grid h-[58px] w-[58px] shrink-0 place-items-center rounded-full border-[1.5px] border-ink bg-card transition-colors hover:bg-ink hover:text-paper"
              >
                <Icon name="sliders" className="h-6 w-6" />
                {(sort !== "new" || area !== "any") && (
                  <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-[1.5px] border-paper bg-oxide" />
                )}
              </button>
            </div>

            {/* quick chips */}
            <div className="noscroll mt-3 flex gap-2 overflow-x-auto pb-1">
              {QUICK.map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setSort(k)}
                  className={`chip ${sort === k ? "on" : ""}`}
                >
                  {label}
                </button>
              ))}
              <span className="mono flex shrink-0 items-center px-1 text-[11px] uppercase tracking-[0.12em] text-mute">
                {filtered.length} result{filtered.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <figure className="relative m-0 border-[1.5px] border-ink">
            <div className="imgframe aspect-[16/11] lg:aspect-[4/3.6]">
              <img
                src="/images/hero-yard.jpg"
                alt="Warehouse yard and open land parcel at dawn near MIDC Ambad, Nashik"
              />
            </div>
            <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-ink px-3 py-2 text-paper">
              <span className="mono text-[10px] uppercase tracking-[0.14em]">
                Plate 01 — Ambad yard, Nashik
              </span>
              <span className="mono text-[10px] text-[rgba(255,255,255,0.65)]">19.96°N / 73.86°E</span>
            </figcaption>
            <span className="stamp absolute left-0 top-0 border-t-0 border-l-0 bg-paper">
              Surveyed
            </span>
          </figure>
        </div>
      </section>

      {/* ───────────────── RAIL + SECTIONS ───────────────── */}
      <div className="mx-auto mt-14 max-w-[1440px] px-4 sm:px-6">
        <div className="xl:grid xl:grid-cols-[136px_1fr] xl:gap-12">
          <aside className="hidden self-start xl:sticky xl:top-[86px] xl:block">
            <p className="cap border-t-[1.5px] border-ink pt-3 text-mute">Contents</p>
            <ol className="mt-3 space-y-3">
              {RAIL.map((r) => (
                <li key={r.id}>
                  <a
                    href={`#${r.id}`}
                    className="group flex items-start gap-2 text-ink2 transition-colors hover:text-oxide"
                  >
                    <span className="mono text-[11px] text-mute group-hover:text-oxide">{r.n}</span>
                    <span className="text-[13px] leading-tight">{r.label}</span>
                  </a>
                </li>
              ))}
            </ol>
            <p className="mono mt-6 border-t border-line pt-3 text-[10.5px] leading-relaxed text-mute">
              Index compiled
              <br />
              {new Date().toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </aside>

          <div className="min-w-0 space-y-16">
            {/* RECENTLY ADDED */}
            <section id="recent" className="scroll-mt-24">
              <div className="sec-head">
                <span className="cap">01 / Recently added</span>
                <span className="mono">{String(recent.length).padStart(2, "0")} lots</span>
              </div>
              <div className="noscroll snapx -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                {recent.map((l) => (
                  <a
                    key={l.id}
                    href={`/listing/${l.id}`}
                    className="group flex w-[290px] shrink-0 gap-3 border border-line bg-card p-3 transition-colors hover:border-ink sm:w-[330px]"
                  >
                    <div className="imgframe h-[86px] w-[86px] shrink-0 border border-line">
                      <img
                        src={l.photos?.[0] || "/images/lot-plot.jpg"}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="mono text-[10px] uppercase tracking-[0.1em] text-mute">
                        {l.lot} · {l.type === "land" ? "Land" : "Warehouse"}
                      </p>
                      <p className="mt-1 truncate font-bold leading-tight">
                        {l.locality || l.city || l.address.split(",")[0]}
                      </p>
                      <p className="truncate text-[12.5px] text-mute">{l.address}</p>
                      <p className="num mt-1.5 text-[16px] font-extrabold">
                        {fmt(l.sqft)}{" "}
                        <span className="mono text-[10px] font-normal uppercase tracking-[0.1em] text-mute">
                          sq ft
                        </span>
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </section>

            {/* FULL INDEX */}
            <section id="index" className="scroll-mt-24">
              <div className="sec-head">
                <span className="cap">02 / Full lot index</span>
                <span className="mono">
                  {String(filtered.length).padStart(2, "0")} of {String(lots.length).padStart(2, "0")}
                </span>
              </div>

              {filtered.length ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((l, i) => (
                    <LotCard
                      key={l.id}
                      lot={l}
                      index={i}
                      fav={favSet.has(l.id)}
                      logged={logged}
                      feature={i > 0 && i % 5 === 4}
                    />
                  ))}
                </div>
              ) : (
                <div className="hatch grid place-items-center gap-3 border-[1.5px] border-ink px-6 py-16 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full border-[1.5px] border-ink bg-paper">
                    <Icon name="search" className="h-5 w-5" />
                  </span>
                  <p className="font-bold">No lots match that search.</p>
                  <p className="max-w-[42ch] text-[14px] text-ink2">
                    Try a wider area, clear the filters, or post the property you are looking for.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      className="btn ghost sm"
                      onClick={() => {
                        setQ("");
                        setType("all");
                        setSort("new");
                        setArea("any");
                      }}
                    >
                      Reset filters
                    </button>
                    <a href="/post" className="btn oxide sm">
                      Post a property
                    </a>
                  </div>
                </div>
              )}
            </section>

            {/* SELLERS */}
            <section id="sellers" className="scroll-mt-24">
              <div className="sec-head">
                <span className="cap">03 / Verified sellers</span>
                <span className="mono">owners with live lots</span>
              </div>
              <div className="noscroll snapx -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                {sellers.map((s) => (
                  <article
                    key={s.id}
                    className="w-[250px] shrink-0 border border-line bg-card p-4 transition-colors hover:border-ink"
                  >
                    <div className="flex items-center gap-3">
                      <span className="num grid h-12 w-12 shrink-0 place-items-center border-[1.5px] border-ink bg-panel text-[20px] font-black">
                        {s.name.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold leading-tight">{s.name}</p>
                        <p className="mono truncate text-[10.5px] uppercase tracking-[0.1em] text-mute">
                          {s.role === "broker" ? "Broker / builder" : s.role === "admin" ? "Desk" : "Owner"}
                          {s.city ? ` · ${s.city}` : ""}
                        </p>
                      </div>
                    </div>
                    <p className="num mt-4 text-[30px] font-black leading-none">
                      {s.liveCount}
                      <span className="mono ml-2 align-middle text-[10px] font-normal uppercase tracking-[0.12em] text-mute">
                        live lots
                      </span>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
                      {s.lots.slice(0, 2).map((t) => (
                        <span key={t} className="cap border border-line px-2 py-1 text-[9px] text-mute">
                          {t}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* POST BAND */}
            <section id="post" className="scroll-mt-24">
              <div className="hatch relative border-[1.5px] border-ink bg-oxide p-6 sm:p-9">
                <div className="relative z-10 max-w-[46ch]">
                  <span className="cap text-white/75">04 / For owners &amp; brokers</span>
                  <h2 className="mt-3 text-[clamp(28px,5vw,46px)] text-white">
                    List your lot on the{" "}
                    <span className="font-serif font-normal italic">index</span> — free.
                  </h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-white/85">
                    Fill the property sheet, add photos, and our desk reviews it within 24 hours.
                    Live lots get phone, WhatsApp and map enquiries routed to you directly.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <a
                      href="/post"
                      className="btn border-ink bg-ink text-paper hover:bg-white hover:text-ink"
                    >
                      Post your property
                    </a>
                    <a
                      href="/account"
                      className="btn border-white bg-transparent text-white hover:bg-white hover:text-ink"
                    >
                      Track my listings
                    </a>
                  </div>
                </div>
                <span className="mono absolute bottom-3 right-4 z-10 text-[10px] uppercase tracking-[0.14em] text-white/70">
                  Free · reviewed in 24 h
                </span>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ───────────────── FILTER SHEET ───────────────── */}
      {sheet && (
        <div className="fixed inset-0 z-[64] flex items-end justify-center sm:items-center">
          <button
            aria-label="Close filters"
            onClick={() => setSheet(false)}
            className="absolute inset-0 bg-[rgba(22,19,14,0.6)]"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative max-h-[88vh] w-full overflow-y-auto border-[1.5px] border-ink bg-card p-5 sm:max-w-[520px]"
            style={{ animation: "rise .28s cubic-bezier(.2,.7,.3,1) both" }}
          >
            <div className="flex items-center justify-between border-b-[1.5px] border-ink pb-3">
              <h2 className="text-[22px]">Sort &amp; filter</h2>
              <button
                onClick={() => setSheet(false)}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center border border-line hover:border-ink"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>

            <p className="lbl mt-5">Sort by</p>
            <div className="flex flex-wrap gap-2">
              {SORTS.map(([k, label]) => (
                <button key={k} onClick={() => setSort(k)} className={`chip ${sort === k ? "on" : ""}`}>
                  {label}
                </button>
              ))}
            </div>

            <p className="lbl mt-5">Plot area</p>
            <div className="flex flex-wrap gap-2">
              {AREAS.map(([k, label]) => (
                <button key={k} onClick={() => setArea(k)} className={`chip ${area === k ? "on" : ""}`}>
                  {label}
                </button>
              ))}
            </div>

            <p className="lbl mt-5">Property type</p>
            <div className="flex flex-wrap gap-2">
              {TYPE_TABS.map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setType(k)}
                  className={`chip oxide ${type === k ? "on" : ""}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                className="btn ghost flex-1"
                onClick={() => {
                  setSort("new");
                  setArea("any");
                  setType("all");
                  setQ("");
                }}
              >
                Reset
              </button>
              <button className="btn flex-[1.4]" onClick={() => setSheet(false)}>
                Show {filtered.length} result{filtered.length === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
