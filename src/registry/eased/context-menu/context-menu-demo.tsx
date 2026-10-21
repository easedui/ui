"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "../button/button";
import { DemoFrame } from "../lib/demo-frame";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "./context-menu";

type Kind = "image" | "video" | "doc" | "type";
type Tag = "Campaign" | "Social" | "Print";
type File = { id: number; name: string; kind: Kind; bytes: number; edited: Date; starred: boolean; tags: Tag[] };

const TAGS: Tag[] = ["Campaign", "Social", "Print"];

const FILES: File[] = [
  { id: 1, name: "hero-autumn.png", kind: "image", bytes: 2_480_000, edited: new Date(2026, 9, 17), starred: true, tags: ["Campaign"] },
  { id: 2, name: "launch-teaser.mp4", kind: "video", bytes: 48_300_000, edited: new Date(2026, 9, 16), starred: false, tags: ["Social"] },
  { id: 3, name: "brand-guidelines.pdf", kind: "doc", bytes: 6_120_000, edited: new Date(2026, 9, 9), starred: false, tags: [] },
  { id: 4, name: "Söhne-Buch.otf", kind: "type", bytes: 214_000, edited: new Date(2026, 8, 30), starred: false, tags: ["Print"] },
  { id: 5, name: "billboard-v3.png", kind: "image", bytes: 11_900_000, edited: new Date(2026, 9, 14), starred: false, tags: ["Print", "Campaign"] },
  { id: 6, name: "press-kit.pdf", kind: "doc", bytes: 3_400_000, edited: new Date(2026, 9, 2), starred: true, tags: [] },
];

const one = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
/** "2.5\u00a0MB": a no-break space between number and unit (R47). */
const size = {
  format(bytes: number) {
    const [value, unit] = bytes >= 1e6 ? [bytes / 1e6, "MB"] : bytes >= 1e3 ? [bytes / 1e3, "KB"] : [bytes, "B"];
    return `${one.format(value)}\u00a0${unit}`;
  },
};
const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export function ContextMenuDemo() {
  const [files, setFiles] = useState(FILES);
  const [trashed, setTrashed] = useState<{ file: File; index: number } | null>(null);
  const [status, setStatus] = useState("");
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const say = (message: string) => {
    setStatus(message);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus(""), 2400);
  };

  const update = (id: number, change: (f: File) => File) => setFiles((list) => list.map((f) => (f.id === id ? change(f) : f)));

  const remove = (file: File) => {
    setTrashed({ file, index: files.indexOf(file) });
    setFiles((list) => list.filter((f) => f.id !== file.id));
    window.clearTimeout(timer.current);
    setStatus("");
  };

  const restore = () => {
    if (!trashed) return;
    setFiles((list) => list.toSpliced(trashed.index, 0, trashed.file));
    setTrashed(null);
  };

  return (
    <DemoFrame title="Brand assets" meta={`${files.length} files`}>
      <div className="flex min-h-0 flex-1 flex-col px-(--pad) pt-4">
        <p className="text-ui-sm text-text-muted">
          Right-click a file<span className="pointer-coarse:hidden">.</span>
          <span className="hidden pointer-coarse:inline">, or press and hold.</span>
        </p>

        <ul className="-mx-1.5 mt-2 grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-x-3 gap-y-2 overflow-y-auto overscroll-contain @sm:grid-cols-3 @xl:grid-cols-4" aria-label="Files">
          {files.map((file) => (
            <li key={file.id} className="min-w-0">
              <ContextMenu>
                {/* Focusable, so focus has somewhere to return when the menu closes. */}
                <ContextMenuTrigger tabIndex={0} className="group flex flex-col gap-2 rounded-control p-1.5 focus-ring [transition:background-color_150ms_var(--eased-ease-standard)] hover-fine:bg-surface-hover data-popup-open:bg-surface-active">
                  <Thumb kind={file.kind} starred={file.starred} />
                  <span className="flex min-w-0 flex-col px-0.5">
                    <span className="truncate text-ui-sm text-text">{file.name}</span>
                    <span className="truncate text-ui-xs text-text-muted tabular-nums">
                      {size.format(file.bytes)} · {date.format(file.edited)}
                    </span>
                  </span>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem icon={<OpenIcon />} shortcut="⌘O" onClick={() => say(`Opened ${file.name}`)}>
                    Open
                  </ContextMenuItem>
                  <ContextMenuItem
                    icon={<DuplicateIcon />}
                    shortcut="⌘D"
                    onClick={() => {
                      const copy = { ...file, id: Date.now(), name: file.name.replace(/(\.[^.]+)$/, " copy$1"), edited: new Date() };
                      setFiles((list) => list.toSpliced(list.indexOf(file) + 1, 0, copy));
                    }}
                  >
                    Duplicate
                  </ContextMenuItem>
                  <ContextMenuItem
                    icon={<LinkIcon />}
                    onClick={() => {
                      void navigator.clipboard?.writeText(`https://assets.northwind.io/${file.name}`).catch(() => {});
                      say("Link copied");
                    }}
                  >
                    Copy link
                  </ContextMenuItem>
                  <ContextMenuSub>
                    <ContextMenuSubTrigger icon={<TagIcon />}>Tags</ContextMenuSubTrigger>
                    <ContextMenuSubContent>
                      {TAGS.map((tag) => (
                        <ContextMenuCheckboxItem
                          key={tag}
                          checked={file.tags.includes(tag)}
                          onCheckedChange={(on) =>
                            update(file.id, (f) => ({ ...f, tags: on ? [...f.tags, tag] : f.tags.filter((t) => t !== tag) }))
                          }
                        >
                          {tag}
                        </ContextMenuCheckboxItem>
                      ))}
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                  <ContextMenuSeparator />
                  <ContextMenuCheckboxItem checked={file.starred} onCheckedChange={(on) => update(file.id, (f) => ({ ...f, starred: on }))}>
                    Starred
                  </ContextMenuCheckboxItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem icon={<TrashIcon />} shortcut="⌘⌫" tone="danger" onClick={() => remove(file)}>
                    Move to Trash
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </li>
          ))}
        </ul>

        <div aria-live="polite" className="flex h-11 shrink-0 items-center justify-between gap-3 text-ui-sm text-text-secondary">
          {trashed ? (
            <>
              <span className="min-w-0 truncate">“{trashed.file.name}” moved to Trash</span>
              <Button variant="ghost" size="sm" edge="end" onClick={restore}>
                Undo
              </Button>
            </>
          ) : (
            <span className="truncate">{status}</span>
          )}
        </div>
      </div>
    </DemoFrame>
  );
}

const KIND_LABEL: Record<Kind, string> = { image: "PNG", video: "MP4", doc: "PDF", type: "OTF" };

function Thumb({ kind, starred }: { kind: Kind; starred: boolean }) {
  return (
    <span className="relative flex aspect-16/10 items-center justify-center rounded-control-sm border border-line-subtle bg-surface-sunken text-text-muted">
      <KindIcon kind={kind} />
      <span className="absolute start-1.5 bottom-1.5 text-ui-2xs font-medium text-text-muted">{KIND_LABEL[kind]}</span>
      {starred && (
        <svg viewBox="0 0 16 16" className="absolute end-1.5 top-1.5 size-3.5 text-warning" fill="currentColor" aria-label="Starred">
          <path d="m8 1.75 1.9 3.95 4.35.6-3.17 3.03.78 4.32L8 11.58l-3.86 2.07.78-4.32L1.75 6.3l4.35-.6L8 1.75Z" />
        </svg>
      )}
    </span>
  );
}

function KindIcon({ kind }: { kind: Kind }) {
  const d = {
    image: "M3.5 3.5h9a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1ZM2.5 10.5l3-3 3 3 1.5-1.5 3.5 3.5M10.25 6.25h.01",
    video: "M3.5 3.5h9a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1ZM7 6.25v3.5L10 8 7 6.25Z",
    doc: "M4.5 2.5h4.75L12 5.25v7.25a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1ZM9 2.5v3h3M5.75 8.5h4.5M5.75 10.75h3",
    type: "M3.5 4V3h9v1M8 3v10M6.25 13h3.5",
  }[kind];
  return (
    <svg viewBox="0 0 16 16" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

const OpenIcon = () => <Icon d="M9.5 2.5h4v4M13.5 2.5 8 8M11.5 9.5v2.75c0 .7-.55 1.25-1.25 1.25h-6.5c-.7 0-1.25-.55-1.25-1.25v-6.5c0-.7.55-1.25 1.25-1.25H6.5" />;
const DuplicateIcon = () => <Icon d="M5.5 5.5V3.75c0-.7.55-1.25 1.25-1.25h5.5c.7 0 1.25.55 1.25 1.25v5.5c0 .7-.55 1.25-1.25 1.25H10.5M3.75 5.5h5.5c.7 0 1.25.55 1.25 1.25v5.5c0 .7-.55 1.25-1.25 1.25h-5.5c-.7 0-1.25-.55-1.25-1.25v-5.5c0-.7.55-1.25 1.25-1.25Z" />;
const LinkIcon = () => <Icon d="M7 9a2.5 2.5 0 0 0 3.5 0l2-2A2.5 2.5 0 0 0 9 3.5l-.5.5M9 7a2.5 2.5 0 0 0-3.5 0l-2 2A2.5 2.5 0 0 0 7 12.5l.5-.5" />;
const TagIcon = () => <Icon d="M2.5 3.75v3.5c0 .33.13.65.37.88l5 5c.49.49 1.28.49 1.77 0l3.49-3.49c.49-.49.49-1.28 0-1.77l-5-5a1.25 1.25 0 0 0-.88-.37h-3.5c-.69 0-1.25.56-1.25 1.25ZM5.5 5.5h.01" />;
const TrashIcon = () => <Icon d="M2.75 4.5h10.5M6.5 4.5V3.25c0-.4.35-.75.75-.75h1.5c.4 0 .75.35.75.75V4.5M4.25 4.5l.6 8c.05.55.5 1 1.05 1h4.2c.55 0 1-.45 1.05-1l.6-8M6.75 7v4M9.25 7v4" />;
