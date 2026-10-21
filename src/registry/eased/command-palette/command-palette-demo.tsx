"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Avatar } from "../avatar/avatar";
import { DemoFrame } from "../lib/demo-frame";
import { TextSwap } from "../text-swap/text-swap";
import { CommandPalette, CommandPaletteTrigger, type CommandGroup } from "./command-palette";

type Theme = "Light" | "Dark" | "System";

const ISSUES = [
  { id: "NW-482", title: "Offline edits lost after sign-out", status: "In progress" },
  { id: "NW-479", title: "Billing page flashes on first load", status: "In review" },
  { id: "NW-475", title: "Export CSV ignores the date filter", status: "Todo" },
  { id: "NW-471", title: "Invite email lands in spam for Outlook", status: "Todo" },
  { id: "NW-466", title: "Keyboard focus lost after closing a sheet", status: "Done" },
  { id: "NW-463", title: "Dark mode chart labels fail contrast", status: "Done" },
  { id: "NW-458", title: "Slow search on workspaces over 10k issues", status: "Done" },
];

const TEAM = [
  { name: "Mara Lindqvist", team: "Design" },
  { name: "Devon Okafor", team: "Platform" },
  { name: "Priya Raman", team: "Billing" },
  { name: "Tomás Herrera", team: "Mobile" },
];

/**
 * An issue tracker header with the palette's trigger. ⌘K toggles the palette only while the
 * demo is on screen, so a page of demos never has two palettes answering one shortcut.
 */
export function CommandPaletteDemo() {
  const [ran, setRan] = useState<{ label: string; n: number } | null>(null);
  const [theme, setTheme] = useState<Theme>("System");
  const sentinel = useRef<HTMLDivElement>(null);
  const visible = useOnScreen(sentinel);

  const groups = useMemo<CommandGroup[]>(() => {
    const run = (label: string) => () => setRan((r) => ({ label, n: (r?.n ?? 0) + 1 }));
    const pickTheme = (t: Theme) => () => {
      setTheme(t);
      run(`${t} theme`)();
    };
    return [
      {
        label: "Suggestions",
        items: [
          { id: "create", label: "Create issue", icon: <PlusIcon />, shortcut: ["C"], keywords: ["new", "bug", "task"], onSelect: run("Create issue") },
          { id: "docs", label: "Search docs", icon: <BookIcon />, description: "Help", keywords: ["help", "guide"], onSelect: run("Search docs") },
        ],
      },
      {
        label: "Navigation",
        items: [
          { id: "inbox", label: "Go to Inbox", icon: <InboxIcon />, shortcut: ["G", "I"], onSelect: run("Go to Inbox") },
          { id: "projects", label: "Go to Projects", icon: <FolderIcon />, shortcut: ["G", "P"], onSelect: run("Go to Projects") },
          { id: "settings", label: "Settings", icon: <GearIcon />, keywords: ["preferences", "account"], onSelect: run("Settings") },
        ],
      },
      {
        label: "Theme",
        items: (["Light", "Dark", "System"] as const).map((t) => ({
          id: `theme-${t}`,
          label: `${t} theme`,
          icon: t === "Light" ? <SunIcon /> : t === "Dark" ? <MoonIcon /> : <MonitorIcon />,
          description: theme === t ? "Current" : undefined,
          keywords: ["appearance", "mode"],
          onSelect: pickTheme(t),
        })),
      },
      {
        label: "Team",
        items: TEAM.map((p) => ({
          id: p.name,
          label: p.name,
          icon: <Avatar name={p.name} size="xs" />,
          description: p.team,
          keywords: ["assign", "people"],
          onSelect: run(`Open ${p.name}`),
        })),
      },
    ];
  }, [theme]);

  return (
    <DemoFrame
      title={
        <>
          <span aria-hidden className="flex size-5 shrink-0 items-center justify-center rounded-control-xs bg-brand text-ui-2xs font-medium text-text-on-brand">
            N
          </span>
          <p className="truncate">Issues</p>
        </>
      }
      actions={
        <CommandPalette groups={groups} hotkey={visible ? "mod+k" : false} emptyText={(q) => `No commands match “${q}”`}>
          <CommandPaletteTrigger className="w-44 @max-sm:w-32" />
        </CommandPalette>
      }
    >
      <div ref={sentinel} aria-hidden className="pointer-events-none absolute inset-0" />
      <ul className="grid min-h-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] content-start gap-x-3 overflow-hidden px-(--pad) py-2" aria-label="Issues">
        {ISSUES.map((issue) => (
          <li key={issue.id} className="col-span-full grid h-10 grid-cols-subgrid items-center border-b border-line-subtle text-ui-sm last:border-b-0">
            <span className="font-mono text-ui-xs text-text-muted tabular-nums slashed-zero">{issue.id}</span>
            <span className="truncate text-text">{issue.title}</span>
            <Status>{issue.status}</Status>
          </li>
        ))}
      </ul>
      <div className="flex h-11 shrink-0 items-center gap-1.5 border-t border-line-subtle px-(--pad) text-ui-sm">
        <span className="text-text-muted">Ran:</span>
        <span aria-live="polite" className="min-w-0 truncate text-text">
          <TextSwap swapKey={ran?.n ?? 0}>{ran?.label ?? "nothing yet"}</TextSwap>
        </span>
      </div>
    </DemoFrame>
  );
}

/** True while the element is at least partly in the viewport. */
function useOnScreen(ref: RefObject<HTMLElement | null>) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setOn(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return on;
}

function Status({ children }: { children: string }) {
  const dot = children === "Done" ? "bg-success" : children === "In progress" ? "bg-warning" : children === "In review" ? "bg-info" : "bg-text-muted";
  return (
    <span className="flex w-22 items-center gap-1.5 text-ui-xs text-text-muted @max-sm:w-auto">
      <span aria-hidden className={`size-1.5 shrink-0 rounded-pill ${dot}`} />
      <span className="@max-sm:sr-only">{children}</span>
    </span>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

const PlusIcon = () => <Icon><path d="M8 3.5v9M3.5 8h9" /></Icon>;
const BookIcon = () => <Icon><path d="M3.5 12.5v-9c0-.55.45-1 1-1h8v10h-8a1 1 0 0 0-1 1Zm0 0c0 .55.45 1 1 1h8" /></Icon>;
const InboxIcon = () => <Icon><path d="M2.5 9h3l1 1.5h3l1-1.5h3M4.25 3.5h7.5l1.75 5.5v3.5c0 .55-.45 1-1 1h-10c-.55 0-1-.45-1-1V9Z" /></Icon>;
const FolderIcon = () => <Icon><path d="M2.5 4.5c0-.55.45-1 1-1h3l1.5 1.5h4.5c.55 0 1 .45 1 1v6c0 .55-.45 1-1 1h-9c-.55 0-1-.45-1-1Z" /></Icon>;
const GearIcon = () => <Icon><circle cx="8" cy="8" r="2" /><path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.75 3.75l1.06 1.06M11.19 11.19l1.06 1.06M3.75 12.25l1.06-1.06M11.19 4.81l1.06-1.06" /></Icon>;
const SunIcon = () => <Icon><circle cx="8" cy="8" r="2.75" /><path d="M8 1.75v1M8 13.25v1M1.75 8h1M13.25 8h1M3.6 3.6l.7.7M11.7 11.7l.7.7M3.6 12.4l.7-.7M11.7 4.3l.7-.7" /></Icon>;
const MoonIcon = () => <Icon><path d="M13 9.5A5.5 5.5 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5Z" /></Icon>;
const MonitorIcon = () => <Icon><rect x="2" y="3" width="12" height="8" rx="1" /><path d="M6 13.5h4M8 11v2.5" /></Icon>;
