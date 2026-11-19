"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Icon, Mark } from "@/components/icons";
import { dateShort, fmt, inr, ROLE_LABEL, ago, TYPE_LABEL } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { Lot } from "@/lib/types";

type Account = {
  id: number;
  name: string;
  mobile: string;
  role: string;
  city: string | null;
  blocked: boolean;
  joinedAt: string;
  listingCount: number;
};

type FeedItem = {
  id: number;
  kind: string;
  createdAt: string;
  user: { id: number; name: string; mobile: string; role: string } | null;
  listing: { id: number; lot: string; title: string; sqft: number; ownerId: number } | null;
};

const KIND_LABEL: Record<string, string> = {
  phone: "Revealed the phone number",
  chat: "Opened a WhatsApp chat",
  call: "Tapped contact owner",
  map: "Opened the map",
  save: "Saved the lot",
};

const STATUS_TABS: [string, string][] = [
  ["all", "All"],
  ["pending", "Pending"],
  ["live", "Live"],
  ["rejected", "Unlisted"],
];

export function AdminConsole({
  lots,
  accounts,
  feed,
  operator,
}: {
  lots: Lot[];
  accounts: Account[];
  feed: FeedItem[];
  operator: string;
}) {
  const [tab, setTab] = useState<"dash" | "users">("dash");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");

  const [rows, setRows] = useState(lots);
  const [people, setPeople] = useState(accounts);

  const counts = useMemo(
    () => ({
      all: rows.length,
      pending: rows.filter((l) => l.status === "pending").length,
      live: rows.filter((l) => l.status === "live").length,
      rejected: rows.filter((l) => l.status === "rejected").length,
    }),
    [rows],
  );

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((l) => {
      if (status !== "all" && l.status !== status) return false;
      if (!needle) return true;
      return `${l.lot} ${l.name} ${l.address} ${l.locality ?? ""} ${l.city ?? ""} ${l.number}`
        .toLowerCase()
        .includes(needle);
    });
  }, [rows, status, q]);

  const totalArea = rows.reduce((a, l) => a + l.sqft, 0);
  const chart = [...rows].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6).reverse();
  const maxArea = Math.max(1, ...chart.map((l) => l.sqft));

  async function setStatus_(id: number, next: string) {
    const prev = rows;
    setRows((r) => r.map((l) => (l.id === id ? { ...l, status: next } : l)));
    try {
      const res = await fetch(`/api/listings/${id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      toast(next === "live" ? "Lot approved and published" : next === "pending" ? "Sent back to review" : "Lot unlisted");
    } catch {
      setRows(prev);
      toast("Could not update the status");
    }
  }

  async function removeLot(id: number) {
    if (!window.confirm("Delete this listing permanently?")) return;
    const prev = rows;
    setRows((r) => r.filter((l) => l.id !== id));
    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast("Listing deleted");
    } catch {
      setRows(prev);
      toast("Could not delete");
    }
  }

  async function toggleBlock(id: number) {
    const prev = people;
    setPeople((p) => p.map((u) => (u.id === id ? { ...u, blocked: !u.blocked } : u)));
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      toast("Account updated");
    } catch {
      setPeople(prev);
      toast("Could not update the account");
    }
  }

  async function removeUser(id: number) {
    if (!window.confirm("Delete this account and all of its listings?")) return;
    const prev = people;
    setPeople((p) => p.filter((u) => u.id !== id));
    setRows((r) => r.filter((l) => l.ownerId !== id));
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      toast("Account and listings removed");
    } catch {
      setPeople(prev);
      toast("Could not delete the account");
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
      {/* console header */}
      <div className="flex flex-wrap items-center gap-3 border-b-[1.5px] border-ink pb-4">
        <span className="flex items-center gap-2.5">
          <Mark className="h-9 w-9 text-ink" filled />
          <span>
            <span className="block font-display text-[19px] font-extrabold leading-none tracking-[-0.04em]">
              ADMIN CONSOLE
            </span>
            <span className="mono block text-[10px] uppercase tracking-[0.14em] text-mute">
              {operator} · desk operations
            </span>
          </span>
        </span>

        <div className="ml-auto flex flex-wrap gap-2">
          <div className="flex border-[1.5px] border-ink">
            {(["dash", "users"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`cap px-4 py-2.5 ${
                  tab === k ? "bg-ink text-paper" : "text-ink2 hover:bg-panel"
                } ${k === "users" ? "border-l-[1.5px] border-ink" : ""}`}
              >
                {k === "dash" ? "Dashboard" : `Accounts ${people.length}`}
              </button>
            ))}
          </div>
          <a href="/" className="btn ghost sm">
            <Icon name="home" className="h-4 w-4" />
            View site
          </a>
        </div>
      </div>

      {/* ── DASHBOARD ── */}
      {tab === "dash" && (
        <div className="mt-6 grid gap-5 lg:grid-cols-[300px_1fr_320px] lg:gap-6">
          {/* left: stats + chart + add */}
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              {[
                ["Total listings", counts.all, ""],
                ["Pending review", counts.pending, "bg-oxide text-white border-oxide"],
                ["Live on index", counts.live, "text-survey"],
                ["Accounts", people.length, ""],
              ].map(([k, v, tone]) => (
                <div key={k as string} className={`border-[1.5px] border-ink p-4 ${tone as string}`}>
                  <p className="num text-[34px] font-black leading-none">{v as number}</p>
                  <p className="cap mt-2 text-[9.5px] opacity-75">{k as string}</p>
                </div>
              ))}
            </div>

            <a
              href="/post"
              className="hatch grid min-h-[120px] place-items-center gap-2 border-[1.5px] border-ink text-center transition-colors hover:bg-ink hover:text-paper"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full border-[1.5px] border-current">
                <Icon name="plus" className="h-5 w-5" />
              </span>
              <span className="cap">Add new property</span>
            </a>

            <div className="border-[1.5px] border-ink bg-card p-4">
              <div className="flex items-center gap-2 border-b border-line pb-2.5">
                <Icon name="area" className="h-4 w-4 text-oxide" />
                <span className="cap">Area under management</span>
              </div>
              <div className="mt-4 flex h-[150px] items-end gap-2">
                {chart.map((l) => (
                  <div key={l.id} className="flex h-full flex-1 flex-col justify-end gap-1.5">
                    <span
                      className="w-full bg-ink"
                      style={{ height: `${Math.max(14, (l.sqft / maxArea) * 100)}%` }}
                      title={`${l.locality || l.city} — ${fmt(l.sqft)} sq ft`}
                    />
                    <span className="mono text-center text-[9px] text-mute">
                      {dateShort(l.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="num mt-4 border-t border-line pt-3 text-[30px] font-black leading-none">
                {fmt(totalArea)}
                <span className="mono ml-2 align-middle text-[11px] font-normal uppercase tracking-[0.12em] text-mute">
                  sq ft total
                </span>
              </p>
            </div>
          </div>

          {/* middle: listings */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3 border-t-[1.5px] border-ink pt-3">
              <h1 className="text-[26px]">
                Listings <span className="mono text-[15px] text-mute">({counts.all})</span>
              </h1>
              <div className="ml-auto flex items-center gap-2 border-[1.5px] border-line bg-card px-3">
                <Icon name="search" className="h-4 w-4 text-mute" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search lot, owner, number"
                  aria-label="Search listings"
                  className="h-10 w-full min-w-0 bg-transparent text-[14px] outline-none placeholder:text-mute sm:w-[210px]"
                />
              </div>
            </div>

            <div className="noscroll mt-3 flex gap-2 overflow-x-auto pb-1">
              {STATUS_TABS.map(([k, label]) => (
                <button key={k} onClick={() => setStatus(k)} className={`chip ${status === k ? "on" : ""}`}>
                  {label} {counts[k as keyof typeof counts]}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {visible.map((l, i) => {
                const tone =
                  l.status === "live"
                    ? "border-survey text-survey"
                    : l.status === "pending"
                      ? "border-oxide text-oxide"
                      : "border-line text-mute";
                return (
                  <article
                    key={l.id}
                    className="rise border border-line bg-card"
                    style={{ "--d": Math.min(i, 8) } as CSSProperties}
                  >
                    <div className="flex gap-3 p-3.5">
                      <a
                        href={`/listing/${l.id}`}
                        className="imgframe h-[92px] w-[92px] shrink-0 border border-line"
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
                              {l.lot} · {TYPE_LABEL[l.type] ?? "Lot"} · {dateShort(l.createdAt)}
                            </p>
                            <h3 className="mt-0.5 truncate text-[18px] leading-tight">
                              {l.locality || l.city || l.address.split(",")[0]}
                            </h3>
                            <p className="truncate text-[13px] text-mute">{l.address}</p>
                          </div>
                          <span className={`cap shrink-0 border-[1.5px] px-2 py-1 ${tone}`}>
                            {l.status}
                          </span>
                        </div>
                        <p className="mono mt-2 truncate text-[12px] text-ink2">
                          by {l.name} · +91 {l.number} · owner #{l.ownerId}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-2">
                          <span className="mono text-[12px]">
                            <strong className="num text-[14px]">{fmt(l.sqft)}</strong> sq ft
                          </span>
                          <span className="mono text-[12px]">
                            <strong className="num text-[14px]">{l.price ? inr(l.price) : "—"}</strong>
                          </span>
                          <span className="mono text-[12px] text-mute">{l.ownership ?? "no title noted"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 border-t border-line bg-panel p-2.5">
                      {l.status !== "live" && (
                        <button onClick={() => setStatus_(l.id, "live")} className="btn oxide sm">
                          <Icon name="check" className="h-4 w-4" />
                          Approve
                        </button>
                      )}
                      {l.status !== "pending" && (
                        <button onClick={() => setStatus_(l.id, "pending")} className="btn ghost sm">
                          Send to review
                        </button>
                      )}
                      {l.status !== "rejected" && (
                        <button onClick={() => setStatus_(l.id, "rejected")} className="btn ghost sm">
                          Unlist
                        </button>
                      )}
                      <a href={`/post?edit=${l.id}`} className="btn ghost sm">
                        <Icon name="edit" className="h-4 w-4" />
                        Edit
                      </a>
                      <button onClick={() => removeLot(l.id)} className="btn ghost sm ml-auto text-oxide">
                        <Icon name="trash" className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}

              {!visible.length && (
                <div className="hatch grid place-items-center gap-2 border-[1.5px] border-ink px-6 py-12 text-center">
                  <p className="font-bold">Nothing in this tray.</p>
                  <p className="text-[14px] text-ink2">Change the status filter or clear the search.</p>
                </div>
              )}
            </div>
          </div>

          {/* right: enquiries */}
          <div className="min-w-0 lg:sticky lg:top-[86px] lg:self-start">
            <div className="border-[1.5px] border-ink bg-card">
              <div className="flex items-center justify-between border-b-[1.5px] border-ink px-4 py-3">
                <span className="cap">Recent enquiries</span>
                <span className="mono text-[11px] text-mute">{feed.length}</span>
              </div>
              <div className="max-h-[720px] divide-y divide-line overflow-y-auto">
                {feed.map((e) => (
                  <div key={e.id} className="p-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="num grid h-9 w-9 shrink-0 place-items-center border border-line bg-panel text-[15px] font-black">
                        {(e.user?.name ?? "G").charAt(0)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14.5px] font-bold leading-tight">
                          {e.user?.name ?? "Guest visitor"}
                        </p>
                        <p className="mono truncate text-[11px] text-mute">
                          {e.user ? `+91 ${e.user.mobile}` : "not logged in"} · {ago(e.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`cap shrink-0 border px-1.5 py-1 ${
                          e.user ? "border-survey text-survey" : "border-line text-mute"
                        }`}
                      >
                        {e.user ? "lead" : "anon"}
                      </span>
                    </div>
                    <p className="mt-2 text-[13px] leading-snug text-ink2">
                      {KIND_LABEL[e.kind] ?? e.kind} for{" "}
                      {e.listing ? (
                        <a href={`/listing/${e.listing.id}`} className="font-semibold text-oxide underline underline-offset-2">
                          {e.listing.title}
                        </a>
                      ) : (
                        "a removed lot"
                      )}
                      {e.listing ? ` (${fmt(e.listing.sqft)} sq ft)` : ""}
                    </p>
                  </div>
                ))}
                {!feed.length && (
                  <p className="hatch m-3 grid place-items-center gap-2 p-6 text-center text-[14px]">
                    No enquiries yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ACCOUNTS ── */}
      {tab === "users" && (
        <div className="mt-6">
          <div className="flex flex-wrap items-end justify-between gap-3 border-t-[1.5px] border-ink pt-3">
            <h1 className="text-[26px]">
              Accounts <span className="mono text-[15px] text-mute">({people.length})</span>
            </h1>
            <p className="mono text-[11.5px] uppercase tracking-[0.12em] text-mute">
              who posted what, and when they joined
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {people.map((u, i) => (
              <article
                key={u.id}
                className="rise flex flex-wrap items-center gap-4 border border-line bg-card p-4"
                style={{ "--d": Math.min(i, 8) } as CSSProperties}
              >
                <span className="num grid h-12 w-12 shrink-0 place-items-center border-[1.5px] border-ink bg-panel text-[20px] font-black">
                  {u.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-[190px] flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-[16.5px] font-bold leading-tight">
                    {u.name}
                    {u.blocked && (
                      <span className="cap border border-oxide px-1.5 py-0.5 text-[9px] text-oxide">
                        blocked
                      </span>
                    )}
                    {u.role === "admin" && (
                      <span className="cap border border-survey px-1.5 py-0.5 text-[9px] text-survey">
                        desk
                      </span>
                    )}
                  </p>
                  <p className="mono text-[12px] text-mute">
                    +91 {u.mobile} · {ROLE_LABEL[u.role] ?? u.role}
                    {u.city ? ` · ${u.city}` : ""} · joined {dateShort(u.joinedAt)}
                  </p>
                </div>

                <div className="flex items-center gap-5">
                  <span className="text-right">
                    <span className="num block text-[22px] font-black leading-none">
                      {u.listingCount}
                    </span>
                    <span className="cap text-[9px] text-mute">lots</span>
                  </span>
                </div>

                {u.role !== "admin" && (
                  <div className="flex gap-2">
                    <button onClick={() => toggleBlock(u.id)} className="btn ghost sm">
                      <Icon name="lock" className="h-4 w-4" />
                      {u.blocked ? "Unblock" : "Block"}
                    </button>
                    <button
                      onClick={() => removeUser(u.id)}
                      className="btn ghost sm text-oxide"
                      aria-label={`Delete ${u.name}`}
                    >
                      <Icon name="trash" className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
