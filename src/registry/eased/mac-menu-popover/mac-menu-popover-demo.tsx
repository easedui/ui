"use client";

import { useState } from "react";
import { macTextSecondary } from "../lib/mac";
import { MacDesktop } from "../lib/mac-desktop";
import {
  MacMenuItem,
  MacMenuPopover,
  MacMenuPopoverClose,
  MacMenuPopoverContent,
  MacMenuSeparator,
  MacStatusItem,
} from "./mac-menu-popover";

/** A plan-usage tracker living in the menu bar, the kind of utility people keep open all day. */
const SESSION = 62;
const WEEK = 38;

export function MacMenuPopoverDemo() {
  // The screen is the collision boundary, so the panel stays on this little desktop.
  const [screen, setScreen] = useState<HTMLDivElement | null>(null);

  return (
    <MacDesktop
      ref={setScreen}
      app="Finder"
      menus={["File", "Edit", "View", "Go"]}
      className="select-none"
      statusItems={
        <MacMenuPopover>
          <MacStatusItem label={`Tally: ${SESSION}% of this session used`}>
            <Gauge value={SESSION} />
            <span>{SESSION}%</span>
          </MacStatusItem>
          <MacMenuPopoverContent collisionBoundary={screen ?? undefined}>
            <UsagePanel />
          </MacMenuPopoverContent>
        </MacMenuPopover>
      }
    />
  );
}

/**
 * Laid out like a macOS menu bar extra (the Battery or Wi-Fi menu): 13px rows, an 11px
 * secondary line under each, slim meters, and actions as menu rows.
 */
function UsagePanel() {
  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-semibold">Tally</p>
        <p className={`${macTextSecondary} text-[11px]`}>Pro plan</p>
      </div>

      <MacMenuSeparator className="mt-2 mb-2.5" />

      <Usage label="Current session" value={SESSION} detail="Resets in 1h 48m · at this pace, full by 11:20" />
      <Usage label="This week" value={WEEK} detail="Resets Thu at 09:00 · 1.24M tokens today" className="mt-3" />

      <MacMenuSeparator className="mt-3 mb-1.5" />

      <MacMenuPopoverClose render={<MacMenuItem icon={<ChartIcon />} shortcut="⌘D" />}>Open Dashboard</MacMenuPopoverClose>
      <MacMenuPopoverClose render={<MacMenuItem icon={<GearIcon />} shortcut="⌘," />}>Settings…</MacMenuPopoverClose>
      <MacMenuPopoverClose render={<MacMenuItem icon={<PowerIcon />} shortcut="⌘Q" />}>Quit Tally</MacMenuPopoverClose>
    </>
  );
}

/** A labelled usage row: name and percentage, a slim meter, then a secondary line. */
function Usage({ label, value, detail, className = "" }: { label: string; value: number; detail: string; className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <p>{label}</p>
        <p className={`${macTextSecondary} tabular-nums`}>{value}%</p>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-1.5 h-1 overflow-hidden rounded-full bg-(--mac-track)"
      >
        <div className={`h-full rounded-full ${ACCENT}`} style={{ width: `${value}%` }} />
      </div>
      <p className={`${macTextSecondary} mt-1.5 text-[11px] leading-[14px] tabular-nums`}>{detail}</p>
    </div>
  );
}

/** macOS system blue, light and dark. */
const ACCENT = "bg-[rgb(0_122_255)] in-[.dark]:bg-[rgb(10_132_255)] in-data-[theme=dark]:bg-[rgb(10_132_255)]";

/* ---------- Glyphs ---------- */

/** The status item's template icon: a ring filled to the session usage, in the bar's text colour. */
function Gauge({ value }: { value: number }) {
  const c = 2 * Math.PI * 5.25;
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <circle cx="8" cy="8" r="5.25" fill="none" stroke="currentColor" strokeOpacity={0.3} strokeWidth={2} />
      <circle
        cx="8"
        cy="8"
        r="5.25"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={`${(value / 100) * c} ${c}`}
        transform="rotate(-90 8 8)"
      />
    </svg>
  );
}

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.3, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function ChartIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden {...stroke}>
      <path d="M2.5 13.5h11M4.5 11V8M8 11V4.5M11.5 11V6.5" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden {...stroke}>
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1.75v1.5M8 12.75v1.5M14.25 8h-1.5M3.25 8h-1.5M12.42 3.58l-1.06 1.06M4.64 11.36l-1.06 1.06M12.42 12.42l-1.06-1.06M4.64 4.64 3.58 3.58" />
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden {...stroke}>
      <path d="M8 2v5.5M4.75 4.25a5 5 0 1 0 6.5 0" />
    </svg>
  );
}
