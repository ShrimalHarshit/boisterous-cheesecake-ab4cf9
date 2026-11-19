"use client";

import { useState, type CSSProperties } from "react";
import { Icon } from "@/components/icons";
import { fmt, inr } from "@/lib/format";
import { FALLBACK_IMG, type Lot } from "@/lib/types";
import { needLogin } from "@/components/login-sheet";
import { toast } from "@/lib/toast";

const TYPE_TAG: Record<string, string> = { land: "Land / Plot", warehouse: "Warehouse" };

export function Heart({
  id,
  initial,
  logged,
  className = "",
}: {
  id: number;
  initial: boolean;
  logged: boolean;
  className?: string;
}) {
  const [on, setOn] = useState(initial);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!logged) {
      needLogin();
      return;
    }
    const prev = on;
    setOn(!prev);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ listingId: id }),
      });
      if (res.status === 401) {
        setOn(prev);
        needLogin();
        return;
      }
      const data = await res.json();
      setOn(!!data.fav);
      toast(data.fav ? "Saved to your list" : "Removed from saved");
    } catch {
      setOn(prev);
      toast("Could not update — try again");
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={on ? "Remove from saved" : "Save this lot"}
      aria-pressed={on}
      className={`grid h-9 w-9 place-items-center border-[1.5px] border-ink bg-card transition-colors ${
        on ? "bg-oxide text-white border-oxide" : "text-ink hover:bg-ink hover:text-paper"
      } ${className}`}
    >
      <Icon name="heart" filled={on} className="h-[17px] w-[17px]" />
    </button>
  );
}

function photo(l: Lot) {
  return l.photos?.[0] || FALLBACK_IMG;
}

export function LotCard({
  lot,
  index,
  fav,
  logged,
  feature = false,
}: {
  lot: Lot;
  index: number;
  fav: boolean;
  logged: boolean;
  feature?: boolean;
}) {
  const title = lot.locality || lot.city || lot.address.split(",")[0];
  const sub = lot.address;
  const pps = lot.pricePerSqft ?? (lot.price ? Math.round(lot.price / Math.max(1, lot.sqft)) : null);

  const meta = (
    <div className="mt-3.5 flex items-end justify-between gap-3 border-t border-line pt-3">
      <div className="min-w-0">
        <span className="num block text-[24px] font-extrabold leading-none">
          {lot.price ? inr(lot.price) : "On request"}
        </span>
        <span className="mono mt-1.5 block text-[10.5px] uppercase tracking-[0.08em] text-mute">
          {pps ? `₹${fmt(pps)} / sq ft` : "Price on request"}
        </span>
      </div>
      <div className="shrink-0 text-right">
        <span className="num block text-[19px] font-extrabold leading-none">{fmt(lot.sqft)}</span>
        <span className="cap mt-1.5 block text-[9px] text-mute">sq ft</span>
      </div>
    </div>
  );

  const head = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3
          className={`font-extrabold tracking-[-0.03em] ${
            feature ? "text-[24px] sm:text-[30px]" : "text-[17px]"
          } leading-[1.08]`}
        >
          {title}
        </h3>
        <span className="mono shrink-0 border border-line px-1.5 py-0.5 text-[10px] text-mute">
          {lot.lot}
        </span>
      </div>
      <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-mute">{sub}</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <span className="cap border border-ink px-2 py-1 text-[9px]">
          {TYPE_TAG[lot.type] ?? "Lot"}
        </span>
        {lot.negotiable && <span className="cap border border-line px-2 py-1 text-[9px] text-mute">Negotiable</span>}
      </div>
    </>
  );

  if (feature) {
    return (
      <article
        className="rise group relative col-span-1 border border-line bg-card sm:col-span-2"
        style={{ "--d": Math.min(index, 8) } as CSSProperties}
      >
        <a href={`/listing/${lot.id}`} className="grid h-full sm:grid-cols-[1.05fr_1fr]">
          <div className="imgframe aspect-[16/10] border-b border-line sm:aspect-auto sm:min-h-[260px] sm:border-b-0 sm:border-r">
            <img src={photo(lot)} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
            <span className="absolute left-0 top-0 z-10 bg-ink px-2.5 py-1.5 mono text-[10px] uppercase tracking-[0.1em] text-paper">
              Feature lot {lot.lot}
            </span>
            <span className="stamp absolute bottom-0 right-0 z-10 border-r-0 border-b-0 bg-paper">
              {TYPE_TAG[lot.type]}
            </span>
          </div>
          <div className="flex flex-col justify-between gap-4 p-5 sm:p-6">
            <div>
              <p className="cap text-oxide">Total area</p>
              <p className="num mt-2 text-[clamp(46px,9vw,76px)] font-black leading-[0.85]">
                {fmt(lot.sqft)}
              </p>
              <p className="mono mt-2 text-[11px] uppercase tracking-[0.14em] text-mute">
                square feet · {lot.areaUnit === "sqft" ? "measured" : lot.areaUnit}
              </p>
              <div className="mt-5">{head}</div>
            </div>
            {meta}
          </div>
        </a>
        <Heart id={lot.id} initial={fav} logged={logged} className="absolute right-3 top-3 z-20" />
      </article>
    );
  }

  return (
    <article
      className="rise group relative border border-line bg-card"
      style={{ "--d": Math.min(index, 8) } as CSSProperties}
    >
      <a href={`/listing/${lot.id}`} className="block h-full">
        <div className="imgframe aspect-[4/3] border-b border-line">
          <img
            src={photo(lot)}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <span className="absolute left-0 top-0 z-10 bg-ink px-2 py-1.5 mono text-[10px] tracking-[0.1em] text-paper">
            {lot.lot}
          </span>
          <span className="stamp absolute bottom-0 left-0 z-10 border-b-0 border-l-0 bg-paper">
            {TYPE_TAG[lot.type]}
          </span>
        </div>
        <div className="flex h-[calc(100%-0px)] flex-col p-4">
          {head}
          {meta}
        </div>
      </a>
      <Heart id={lot.id} initial={fav} logged={logged} className="absolute right-3 top-3 z-20" />
    </article>
  );
}
