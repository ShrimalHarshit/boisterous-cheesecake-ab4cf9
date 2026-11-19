"use client";

import { useState, type CSSProperties } from "react";
import { Icon } from "@/components/icons";
import { fmt, inr, TYPE_LABEL } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { Lot } from "@/lib/types";

const STATUS_TONE: Record<string, string> = {
  live: "border-survey text-survey",
  pending: "border-oxide text-oxide",
  rejected: "border-line text-mute",
};

const STATUS_LABEL: Record<string, string> = {
  live: "Live",
  pending: "In review",
  rejected: "Unlisted",
};

export function AccountListings({ lots, admin }: { lots: Lot[]; admin: boolean }) {
  const [rows, setRows] = useState(lots);

  async function remove(id: number) {
    if (!window.confirm("Delete this lot permanently? This cannot be undone.")) return;
    const prev = rows;
    setRows((r) => r.filter((l) => l.id !== id));
    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast("Lot deleted");
    } catch {
      setRows(prev);
      toast("Could not delete — try again");
    }
  }

  if (!rows.length) return null;

  return (
    <div className="space-y-4">
      {rows.map((l, i) => (
        <article
          key={l.id}
          className="rise border border-line bg-card"
          style={{ "--d": Math.min(i, 8) } as CSSProperties}
        >
          <div className="flex flex-col gap-4 p-4 sm:flex-row">
            <a
              href={`/listing/${l.id}`}
              className="imgframe aspect-[4/3] w-full shrink-0 border border-line sm:aspect-square sm:w-[132px]"
            >
              <img
                src={l.photos?.[0] || "/images/lot-plot.jpg"}
                alt=""
                className="h-full w-full object-cover"
              />
            </a>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="mono text-[10.5px] uppercase tracking-[0.12em] text-mute">
                    {l.lot} · {TYPE_LABEL[l.type] ?? "Lot"} ·{" "}
                    {new Date(l.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </p>
                  <h3 className="mt-1 text-[19px] leading-tight">
                    <a href={`/listing/${l.id}`} className="hover:text-oxide">
                      {l.locality || l.city || l.address.split(",")[0]}
                    </a>
                  </h3>
                  <p className="truncate text-[13.5px] text-mute">{l.address}</p>
                </div>
                <span
                  className={`cap shrink-0 border-[1.5px] px-2.5 py-1.5 ${STATUS_TONE[l.status] ?? "border-line text-mute"}`}
                >
                  {STATUS_LABEL[l.status] ?? l.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-2 border-t border-line pt-3">
                <span>
                  <span className="num block text-[20px] font-black leading-none">
                    {fmt(l.sqft)}
                  </span>
                  <span className="cap text-[9px] text-mute">sq ft</span>
                </span>
                <span>
                  <span className="num block text-[20px] font-black leading-none">
                    {l.price ? inr(l.price) : "—"}
                  </span>
                  <span className="cap text-[9px] text-mute">asking</span>
                </span>
                <span>
                  <span className="num block text-[20px] font-black leading-none">
                    {l.ownership ? l.ownership.split(" ")[0] : "—"}
                  </span>
                  <span className="cap text-[9px] text-mute">ownership</span>
                </span>
                <span className="mono ml-auto text-[11.5px] text-mute">
                  +91 {l.number}
                  {admin ? " · owner #" + l.ownerId : ""}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-line bg-panel p-3">
            <a href={`/listing/${l.id}`} className="btn ghost sm">
              <Icon name="eye" className="h-4 w-4" />
              View
            </a>
            <a href={`/post?edit=${l.id}`} className="btn ghost sm">
              <Icon name="edit" className="h-4 w-4" />
              Edit
            </a>
            {l.status === "rejected" && (
              <span className="mono self-center px-1 text-[11.5px] text-mute">
                Held back by the desk — update the details and resubmit.
              </span>
            )}
            <button onClick={() => remove(l.id)} className="btn ghost sm ml-auto text-oxide">
              <Icon name="trash" className="h-4 w-4" />
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

export function LogoutButton() {
  return (
    <a
      href="/api/auth/logout"
      className="btn ghost sm w-full"
    >
      <Icon name="out" className="h-4 w-4" />
      Log out
    </a>
  );
}
