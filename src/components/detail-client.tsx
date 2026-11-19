"use client";

import { useRef, useState } from "react";
import { Heart } from "@/components/listing-card";
import { Icon } from "@/components/icons";
import { needLogin } from "@/components/login-sheet";
import { fmt, inr, TYPE_LABEL } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { Lot, Seller } from "@/lib/types";

const BADGES = ["Zero brokerage", "Title checked", "Desk verified"];

export function DetailClient({
  lot,
  seller,
  fav,
  logged,
  canEdit,
  related,
}: {
  lot: Lot;
  seller: Seller | null;
  fav: boolean;
  logged: boolean;
  canEdit: boolean;
  related: Lot[];
}) {
  const gallery = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [phone, setPhone] = useState<string | null>(null);
  const photos = lot.photos?.length ? lot.photos : ["/images/lot-plot.jpg"];
  const pps = lot.pricePerSqft ?? (lot.price ? Math.round(lot.price / Math.max(1, lot.sqft)) : null);

  async function log(kind: "phone" | "chat" | "call") {
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ listingId: lot.id, kind }),
      });
      const data = await res.json();
      if (data.number) setPhone(data.number);
      return data.number as string | null;
    } catch {
      return null;
    }
  }

  function revealPhone() {
    if (!logged) {
      needLogin();
      return;
    }
    if (phone) {
      window.location.href = `tel:${phone}`;
      return;
    }
    log("phone").then((n) => {
      if (n) toast(`Seller number: ${n}`);
      else toast("Could not fetch the number");
    });
  }

  function openChat(e: React.MouseEvent) {
    e.preventDefault();
    if (!logged) {
      needLogin();
      return;
    }
    log("chat").then((n) => {
      window.open(`https://wa.me/91${n ?? lot.number}`, "_blank", "noopener");
    });
  }

  function callOwner(e: React.MouseEvent) {
    e.preventDefault();
    if (!logged) {
      needLogin();
      return;
    }
    log("call").then((n) => {
      window.location.href = `tel:${n ?? lot.number}`;
    });
  }

  function onScroll() {
    const el = gallery.current;
    if (!el) return;
    setIdx(Math.min(photos.length - 1, Math.round(el.scrollLeft / Math.max(1, el.clientWidth))));
  }

  const facts: [string, string][] = [
    ["Plot / built area", `${fmt(lot.sqft)} sq ft`],
    ["Property type", TYPE_LABEL[lot.type] ?? "Lot"],
    ["Ownership", lot.ownership ?? "Not stated"],
    ["Possession", lot.possessionFrom ?? "Ready to move"],
    ["Use", lot.aboutProperty ?? "—"],
    ["Price / sq ft", pps ? `₹${fmt(pps)}` : "—"],
  ];

  return (
    <div className="mx-auto max-w-[1440px] px-0 pb-28 sm:px-6 lg:pb-10">
      <div className="lg:grid lg:grid-cols-[1.1fr_1fr] lg:gap-10">
        {/* ── gallery ── */}
        <div className="lg:sticky lg:top-[86px] lg:self-start">
          <div className="relative">
            <div
              ref={gallery}
              onScroll={onScroll}
              className="noscroll snapx flex aspect-[4/3.2] overflow-x-auto border-y-[1.5px] border-ink sm:aspect-[4/3] lg:aspect-[4/3.3] lg:rounded-none lg:border-[1.5px]"
            >
              {photos.map((src, i) => (
                <div key={i} className="imgframe relative h-full w-full shrink-0 snap-center">
                  <img src={src} alt={`${lot.lot} — view ${i + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>

            <a
              href="/"
              aria-label="Back to the index"
              className="absolute left-3 top-3 z-20 grid h-11 w-11 place-items-center border-[1.5px] border-ink bg-paper transition-colors hover:bg-ink hover:text-paper"
            >
              <Icon name="back" className="h-5 w-5" />
            </a>

            <div className="absolute right-3 top-3 z-20">
              <Heart id={lot.id} initial={fav} logged={logged} />
            </div>

            <span className="mono absolute bottom-3 left-3 z-20 border-[1.5px] border-ink bg-paper px-3 py-1.5 text-[12px] font-bold">
              {idx + 1} / {photos.length}
            </span>
            <span className="stamp absolute bottom-3 right-3 z-20 border-r-0 border-b-0 bg-paper">
              {TYPE_LABEL[lot.type]}
            </span>
          </div>

          <div className="hidden gap-2 px-0 pt-3 lg:flex">
            {photos.map((src, i) => (
              <button
                key={i}
                onClick={() => {
                  gallery.current?.scrollTo({ left: i * (gallery.current?.clientWidth ?? 0), behavior: "smooth" });
                }}
                aria-label={`View photo ${i + 1}`}
                className={`h-16 w-20 overflow-hidden border-2 transition-colors ${
                  i === idx ? "border-oxide" : "border-line hover:border-ink"
                }`}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* ── information ── */}
        <div className="px-4 pt-6 sm:px-0 lg:pt-0">
          <div className="flex flex-wrap gap-2">
            {BADGES.map((b) => (
              <span key={b} className="stamp ok">
                <Icon name="check" className="h-3 w-3" />
                {b}
              </span>
            ))}
            {lot.status !== "live" && <span className="stamp">{lot.status}</span>}
          </div>

          <p className="mono mt-4 text-[11px] uppercase tracking-[0.16em] text-mute">
            Lot {lot.lot} · posted {new Date(lot.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </p>

          <h1 className="mt-2 text-[clamp(30px,5.4vw,46px)] leading-[1.02]">
            {lot.locality || lot.city || lot.address.split(",")[0]}
          </h1>
          <p className="mt-2 flex items-start gap-2 text-[15px] text-ink2">
            <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-oxide" />
            <span>{lot.address}</span>
          </p>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lot.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn ghost mt-4 inline-flex"
          >
            <Icon name="pin" className="h-4 w-4" />
            View on map
          </a>

          {/* price plate */}
          <div className="mt-6 border-[1.5px] border-ink bg-card">
            <div className="flex items-end justify-between gap-4 border-b border-line p-4">
              <div>
                <p className="lbl mb-1">Asking price</p>
                <p className="num text-[clamp(28px,6vw,40px)] font-black leading-none">
                  {lot.price ? inr(lot.price) : "On request"}
                </p>
                <p className="mono mt-2 text-[11px] uppercase tracking-[0.1em] text-mute">
                  {pps ? `₹${fmt(pps)} per sq ft` : "Contact desk for pricing"}
                  {lot.negotiable ? " · negotiable" : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="lbl mb-1">Area</p>
                <p className="num text-[clamp(30px,7vw,46px)] font-black leading-none text-oxide">
                  {fmt(lot.sqft)}
                </p>
                <p className="mono mt-1.5 text-[11px] uppercase tracking-[0.1em] text-mute">sq ft</p>
              </div>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-3">
              {facts.map(([k, v], i) => (
                <div
                  key={k}
                  className={`border-line p-3.5 ${i % 2 === 0 ? "border-r" : ""} sm:border-r sm:[&:nth-child(3n)]:border-r-0 ${
                    i < facts.length - 2 ? "border-b" : ""
                  }`}
                >
                  <dt className="cap text-[9px] text-mute">{k}</dt>
                  <dd className="mt-1.5 text-[14px] font-semibold leading-tight">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* seller */}
          <div className="mt-5 flex flex-wrap items-center gap-4 border-[1.5px] border-ink bg-panel p-4">
            <span className="num grid h-14 w-14 shrink-0 place-items-center border-[1.5px] border-ink bg-card text-[24px] font-black">
              {(lot.name || "W").charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold leading-tight">{lot.name}</p>
              <p className="mono text-[11px] uppercase tracking-[0.1em] text-mute">
                {seller?.role === "broker" ? "Broker / builder" : "Owner"}
                {seller?.city ? ` · ${seller.city}` : ""} · {seller?.liveCount ?? 1} live lot
                {(seller?.liveCount ?? 1) > 1 ? "s" : ""}
              </p>
            </div>
            <button onClick={revealPhone} className="btn sm">
              <Icon name="phone" className="h-4 w-4" />
              {phone ? phone : "View phone"}
            </button>
            <div className="hidden w-full gap-3 lg:flex">
              <button onClick={openChat} className="btn ghost flex-1">
                <Icon name="chat" className="h-4 w-4" />
                Chat on WhatsApp
              </button>
              <button onClick={callOwner} className="btn flex-1">
                <Icon name="phone" className="h-4 w-4" />
                Contact owner
              </button>
            </div>
          </div>

          {/* description */}
          <div className="mt-6">
            <div className="sec-head">
              <span className="cap">About this lot</span>
            </div>
            <p className="whitespace-pre-line text-[15.5px] leading-relaxed text-ink2">
              {lot.description}
            </p>
          </div>

          {canEdit && (
            <div className="mt-6 flex gap-3 border-[1.5px] border-dashed border-ink p-4">
              <span className="cap self-center text-mute">Owner controls</span>
              <a href="/account" className="btn ghost sm ml-auto">
                <Icon name="edit" className="h-4 w-4" />
                Edit / take offline
              </a>
            </div>
          )}

          {/* related */}
          {related.length > 0 && (
            <div className="mt-8">
              <div className="sec-head">
                <span className="cap">More like this</span>
                <span className="mono">{String(related.length).padStart(2, "0")}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {related.map((r) => (
                  <a
                    key={r.id}
                    href={`/listing/${r.id}`}
                    className="group border border-line bg-card transition-colors hover:border-ink"
                  >
                    <div className="imgframe aspect-[4/3] border-b border-line">
                      <img
                        src={r.photos?.[0] || "/images/lot-plot.jpg"}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3">
                      <p className="truncate text-[14px] font-bold leading-tight">
                        {r.locality || r.city || "Lot"}
                      </p>
                      <p className="num mt-1 text-[15px] font-extrabold">{inr(r.price)}</p>
                      <p className="mono text-[10.5px] uppercase tracking-[0.1em] text-mute">
                        {fmt(r.sqft)} sq ft
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── sticky contact bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t-[1.5px] border-ink bg-paper px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden">
        <button onClick={openChat} className="btn ghost flex-1">
          <Icon name="chat" className="h-4 w-4" />
          Chat
        </button>
        <button onClick={callOwner} className="btn flex-1">
          <Icon name="phone" className="h-4 w-4" />
          Contact owner
        </button>
      </div>

    </div>
  );
}
