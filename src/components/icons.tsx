import type { SVGProps } from "react";

const P: Record<string, string> = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.2-4.2"/>',
  sliders:
    '<path d="M4 7h8M16 7h4M4 12h4M12 12h8M4 17h11M19 17h1"/><circle cx="14" cy="7" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="17" cy="17" r="2"/>',
  heart:
    '<path d="M12 20.5S4.5 15.8 4.5 10.2A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.8c0 5.6-7.5 10.3-7.5 10.3z"/>',
  home: '<path d="M4 11 12 4l8 7v9h-5.5v-6h-5v6H4z"/>',
  user: '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5c1-3.8 4-5.8 7.5-5.8s6.5 2 7.5 5.8"/>',
  back: '<path d="m15 5-7 7 7 7"/>',
  chev: '<path d="m9 5 7 7-7 7"/>',
  pin: '<path d="M12 21.5s7-6.2 7-11.2a7 7 0 1 0-14 0c0 5 7 11.2 7 11.2z"/><circle cx="12" cy="10.2" r="2.6"/>',
  shield:
    '<path d="M12 3 5 6v5.2c0 4.9 3 8.2 7 9.8 4-1.6 7-4.9 7-9.8V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  chat: '<path d="M4 5.5h16v11H9.5L4 20.5z"/><path d="M8 10h8M8 13h5"/>',
  phone:
    '<path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3c0 1.1-.9 2-2 2A16.5 16.5 0 0 1 4.5 5.5c0-1.1.9-2 2-2z"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  camera:
    '<path d="M4 8h3.2l1.8-2.5h6L16.8 8H20v11H4z"/><circle cx="12" cy="13.2" r="3.4"/>',
  trash:
    '<path d="M4.5 6.5h15M9.5 6.5V4h5v2.5M6.5 6.5 7.6 20h8.8l1.1-13.5"/>',
  edit: '<path d="M4 20.2h4.2L20 8.4 15.8 4.2 4 16z"/>',
  moon: '<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5 5l1.8 1.8M17.2 17.2 19 19M19 5l-1.8 1.8M6.8 17.2 5 19"/>',
  out: '<path d="M10 4H4.5v16H10M15 8l4 4-4 4M19 12H9"/>',
  grid: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
  list: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  sort: '<path d="M7 4v16M4 17l3 3 3-3M17 20V4M14 7l3-3 3 3"/>',
  area: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/><path d="M8.5 8.5h7v7h-7z"/>',
  rupee:
    '<path d="M7 4.5h10M7 8.5h10M7 12.5h5.5c2.8 0 4.5-1.7 4.5-4M7 12.5l7 7"/>',
  key: '<circle cx="8" cy="12" r="4"/><path d="M12 12h8M17 12v3.5M20 12v2.5"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  google:
    '<path d="M21 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.1a4.4 4.4 0 0 1-1.9 2.9v2.4h3A9.1 9.1 0 0 0 21 12.2z"/><path d="M12 21.5c2.4 0 4.5-.8 6-2.2l-3-2.4a5.4 5.4 0 0 1-8-2.8H3.9v2.5A9.1 9.1 0 0 0 12 21.5z"/><path d="M7 14.1a5.4 5.4 0 0 1 0-3.4V8.2H3.9a9.1 9.1 0 0 0 0 8.2z"/><path d="M12 6.6a4.9 4.9 0 0 1 3.4 1.3l2.6-2.6A9.1 9.1 0 0 0 3.9 8.2L7 10.7A5.4 5.4 0 0 1 12 6.6z"/>',
  apple:
    '<path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.8-3-.8C6.9 7.5 5.4 8.4 4.6 9.8c-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8s1.9.8 3.1.8 2.1-1.2 2.9-2.4c.9-1.3 1.3-2.6 1.3-2.7 0 0-2.5-1-2.6-3.9zM14.1 5.3c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.1 1.9-1 3 1.1.1 2.2-.6 2.8-1.5z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.2l3.2 2"/>',
  lock: '<path d="M5.5 10.5h13v10h-13z"/><path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7"/>',
  arrow: '<path d="M4.5 12h15M14 6.5l5.5 5.5L14 17.5"/>',
  warn: '<path d="M12 4 2.5 20.5h19z"/><path d="M12 10v4.5M12 17.2v.1"/>',
};

export type IconName = keyof typeof P;

export function Icon({
  name,
  filled = false,
  ...rest
}: { name: IconName; filled?: boolean } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
      dangerouslySetInnerHTML={{ __html: P[name] ?? "" }}
    />
  );
}

/** WareHub mark: a hex bolt head holding a warehouse gable over a horizon line. */
export function Mark({
  filled = false,
  className = "h-8 w-8",
}: {
  filled?: boolean;
  className?: string;
}) {
  const hex = "M24 1.8 43.4 13v22L24 46.2 4.6 35V13z";
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        d={hex}
        fill={filled ? "var(--c-oxide)" : "none"}
        stroke={filled ? "var(--c-oxide)" : "currentColor"}
        strokeWidth={3.2}
        strokeLinejoin="round"
      />
      <g
        fill="none"
        stroke={filled ? "#fff" : "currentColor"}
        strokeWidth={2.6}
        strokeLinecap="square"
        strokeLinejoin="miter"
      >
        <path d="M12.6 26.4 24 17.6l11.4 8.8" />
        <path d="M16.4 26.4v7.6M31.6 26.4v7.6" />
        <path d="M10.4 34h27.2" />
      </g>
    </svg>
  );
}
