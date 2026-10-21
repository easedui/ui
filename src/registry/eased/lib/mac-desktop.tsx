import type { ReactNode, Ref } from "react";
import { DemoFrame } from "./demo-frame";
import { macFont, macFontFamily, macText } from "./mac";

export type MacDesktopProps = {
  /** The frontmost app, bold at the left of the menu bar. */
  app: string;
  /** Its menu titles. All but the first hide on a narrow tile, from the right. */
  menus?: string[];
  /** Status items left of Wi-Fi, battery and the clock, e.g. a `MacStatusItem`. */
  statusItems?: ReactNode;
  /** Demo controls under the screen, on the Eased surface rather than the wallpaper. */
  footer?: ReactNode;
  /** The screen (menu bar and desktop), e.g. to keep a popover inside it as its collision boundary. */
  ref?: Ref<HTMLDivElement>;
  /** Extra classes for the frame root, e.g. `select-none`. */
  className?: string;
  /** The frame's height in px. Default 420; a whole app screen may ask for more. */
  height?: number;
  /** The desktop under the menu bar: a positioned box, so children can sit `absolute` in it. */
  children?: ReactNode;
};

/**
 * One small macOS screen every Mac pack demo shares, so they read as the same desktop: a soft
 * wallpaper with a few files on it, and a translucent 24px menu bar. Demo only, built on
 * `DemoFrame`, so it keeps the 420px / 28rem tile contract. The whole frame, footer included,
 * sets the system font family (not its size), so the demo never falls back to the app's
 * `--font-sans`, which a fresh shadcn setup leaves circular (Times).
 */
export function MacDesktop({ app, menus = [], statusItems, footer, ref, className = "", height, children }: MacDesktopProps) {
  return (
    <DemoFrame height={height} className={`${macFontFamily} ${className}`}>
      <div ref={ref} className={`${macFont} ${macText} ${WALLPAPER} relative flex min-h-0 flex-1 flex-col`}>
        <div className="flex h-6 shrink-0 items-center justify-between gap-3 bg-[rgb(255_255_255/0.45)] px-2.5 backdrop-blur-xl in-[.dark]:bg-[rgb(0_0_0/0.3)] in-data-[theme=dark]:bg-[rgb(0_0_0/0.3)]">
          <div aria-hidden className="flex min-w-0 items-center gap-4 overflow-hidden px-1">
            <span className="font-semibold">{app}</span>
            {menus.map((menu, i) => (
              <span key={menu} className={i > 0 ? "@max-sm:hidden" : undefined}>
                {menu}
              </span>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {statusItems}
            <span className="flex h-[22px] items-center px-[7px]" aria-hidden>
              <WifiIcon />
            </span>
            <span className="flex h-[22px] items-center px-[7px] @max-sm:hidden" aria-hidden>
              <BatteryIcon />
            </span>
            <span aria-hidden className="px-[7px] whitespace-nowrap tabular-nums">
              Sat 18 Oct 9:41
            </span>
          </div>
        </div>
        <div className="relative min-h-0 flex-1">
          <DesktopIcons />
          {children}
        </div>
      </div>
      {footer}
    </DemoFrame>
  );
}

/** A soft wallpaper with enough shape that frosted surfaces visibly blur it. */
const WALLPAPER =
  "[--w1:rgb(255_183_140)] [--w2:rgb(126_160_255)] [--w3:rgb(222_208_255)] [--w4:rgb(250_236_228)] " +
  "in-[.dark]:[--w1:rgb(160_70_60)] in-[.dark]:[--w2:rgb(40_60_150)] in-[.dark]:[--w3:rgb(60_40_100)] in-[.dark]:[--w4:rgb(18_18_32)] " +
  "in-data-[theme=dark]:[--w1:rgb(160_70_60)] in-data-[theme=dark]:[--w2:rgb(40_60_150)] in-data-[theme=dark]:[--w3:rgb(60_40_100)] in-data-[theme=dark]:[--w4:rgb(18_18_32)] " +
  "bg-(--w4) bg-[image:radial-gradient(60%_55%_at_88%_30%,var(--w1),transparent),radial-gradient(70%_70%_at_12%_85%,var(--w2),transparent),radial-gradient(50%_50%_at_45%_40%,var(--w3),transparent)]";

/** Files on the desktop, top right: something crisp for frosted panels to blur. */
function DesktopIcons() {
  return (
    <div aria-hidden className="pointer-events-none absolute top-5 right-5 flex flex-col items-center gap-4 text-[11px] leading-[13px]">
      {[
        { label: "launch-cut.mov", art: <VideoArt /> },
        { label: "Invoices", art: <FolderArt /> },
        { label: "Q4 roadmap.pdf", art: <DocArt /> },
      ].map(({ label, art }) => (
        <div key={label} className="flex w-[76px] flex-col items-center gap-1">
          {art}
          <span className="max-w-full truncate rounded-[3px] px-1 font-medium">{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Glyphs ---------- */

function WifiIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden fill="currentColor">
      <path d="M8 13.25 9.6 11.6a2.3 2.3 0 0 0-3.2 0L8 13.25Z" />
      <path d="M3.9 8.95 5.15 10.2a4 4 0 0 1 5.7 0l1.25-1.25a5.8 5.8 0 0 0-8.2 0Z" />
      <path d="M1.5 6.55 2.75 7.8a7.4 7.4 0 0 1 10.5 0l1.25-1.25a9.2 9.2 0 0 0-13 0Z" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg viewBox="0 0 26 12" className="h-3 w-[26px]" aria-hidden>
      <rect x="0.5" y="0.5" width="22" height="11" rx="3" fill="none" stroke="currentColor" strokeOpacity={0.45} />
      <rect x="2" y="2" width="15" height="8" rx="1.75" fill="currentColor" />
      <path d="M24 4.25v3.5c.7-.25 1.1-.9 1.1-1.75S24.7 4.5 24 4.25Z" fill="currentColor" fillOpacity={0.45} />
    </svg>
  );
}

function VideoArt() {
  return (
    <span className="relative flex h-10 w-14 items-center justify-center overflow-hidden rounded-[4px] bg-[linear-gradient(135deg,rgb(32_32_40),rgb(80_60_120))] shadow-[0_1px_3px_rgb(0_0_0/0.25)] ring-1 ring-white/70">
      <svg viewBox="0 0 16 16" className="size-4 text-white/90" fill="currentColor">
        <path d="M5.5 3.75v8.5L12.5 8l-7-4.25Z" />
      </svg>
    </span>
  );
}

function FolderArt() {
  return (
    <svg viewBox="0 0 56 44" className="h-11 w-14 drop-shadow-[0_1px_2px_rgb(0_0_0/0.2)]">
      <path d="M4 8a4 4 0 0 1 4-4h13l5 5h22a4 4 0 0 1 4 4v23a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Z" fill="rgb(88 166 242)" />
      <path d="M4 15a4 4 0 0 1 4-4h40a4 4 0 0 1 4 4v21a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V15Z" fill="rgb(120 190 255)" />
    </svg>
  );
}

function DocArt() {
  return (
    <svg viewBox="0 0 40 48" className="h-12 w-10 drop-shadow-[0_1px_2px_rgb(0_0_0/0.2)]">
      <path d="M4 4a3 3 0 0 1 3-3h19l10 10v32a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V4Z" fill="white" />
      <path d="M26 1v7a3 3 0 0 0 3 3h7" fill="rgb(225 225 230)" />
      <rect x="9" y="17" width="20" height="2" rx="1" fill="rgb(230 80 70)" />
      <rect x="9" y="23" width="22" height="1.5" rx="0.75" fill="rgb(200 200 208)" />
      <rect x="9" y="28" width="18" height="1.5" rx="0.75" fill="rgb(200 200 208)" />
      <rect x="9" y="33" width="21" height="1.5" rx="0.75" fill="rgb(200 200 208)" />
    </svg>
  );
}
