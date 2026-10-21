"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "../avatar/avatar";
import { Button } from "../button/button";
import { Input } from "../input/input";
import { DemoFrame } from "../lib/demo-frame";
import { rowGrid, rowGridRow } from "../lib/layout";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";

type Sort = "updated" | "created" | "name";
type Task = { title: string; owner: string; due: Date; created: number; updated: number; done: boolean };

const day = (d: number) => new Date(2026, 9, d);
const due = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

const TASKS: Task[] = [
  { title: "Final copy review", owner: "Mara Lindqvist", due: day(20), created: 1, updated: 6, done: true },
  { title: "Annual plan toggle QA", owner: "Devon Okafor", due: day(22), created: 2, updated: 9, done: false },
  { title: "Legal sign-off on terms", owner: "Priya Raman", due: day(23), created: 3, updated: 4, done: false },
  { title: "Swap hero screenshots", owner: "Jonas Weber", due: day(21), created: 4, updated: 8, done: true },
  { title: "Stripe price IDs in prod", owner: "Devon Okafor", due: day(24), created: 5, updated: 7, done: false },
];

const PROJECTS = ["Website relaunch", "Q4 growth", "Billing v2", "Brand refresh"];

export function DropdownMenuDemo() {
  const [title, setTitle] = useState("Pricing page launch");
  const [project, setProject] = useState(PROJECTS[0]);
  const [showCompleted, setShowCompleted] = useState(true);
  const [sort, setSort] = useState<Sort>("updated");
  const [renaming, setRenaming] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [status, setStatus] = useState("");
  const titleInput = useRef<HTMLInputElement>(null);
  const focusTitle = useRef(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const say = (message: string) => {
    setStatus(message);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus(""), 2400);
  };

  const tasks = useMemo(() => {
    const list = TASKS.filter((t) => showCompleted || !t.done);
    if (sort === "name") return list.toSorted((a, b) => a.title.localeCompare(b.title));
    return list.toSorted((a, b) => (sort === "updated" ? b.updated - a.updated : b.created - a.created));
  }, [showCompleted, sort]);

  const open = TASKS.filter((t) => !t.done).length;

  return (
    <DemoFrame
      title={deleted ? "Trash" : project}
      meta={deleted ? undefined : `${open} open`}
      actions={
        !deleted && (
          <DropdownMenu>
            <DropdownMenuTrigger variant="ghost" size="icon-sm" className="-me-2" aria-label="Document options">
              <MoreIcon />
            </DropdownMenuTrigger>
            {/* Rename hands focus to the title field instead of back to this button. */}
            <DropdownMenuContent align="end" finalFocus={() => (focusTitle.current ? (titleInput.current ?? true) : true)}>
              <DropdownMenuItem icon={<DuplicateIcon />} shortcut="⌘D" onClick={() => say(`Duplicated as “${title} (copy)”`)}>
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem icon={<PencilIcon />} onClick={() => {
                  focusTitle.current = true;
                  setRenaming(true);
                }}>
                Rename…
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger icon={<FolderIcon />}>Move to</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {PROJECTS.map((p) => (
                    <DropdownMenuItem
                      key={p}
                      disabled={p === project}
                      onClick={() => {
                        setProject(p);
                        say(`Moved to ${p}`);
                      }}
                    >
                      {p}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem
                icon={<LinkIcon />}
                shortcut="⌘⇧C"
                onClick={() => {
                  void navigator.clipboard?.writeText("https://northwind.io/d/pricing-launch").catch(() => {});
                  say("Link copied");
                }}
              >
                Copy link
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={showCompleted} onCheckedChange={setShowCompleted}>
                Show completed
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sort} onValueChange={(v: Sort) => setSort(v)}>
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuRadioItem value="updated">Last updated</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="created">Date created</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>

              <DropdownMenuSeparator />
              <DropdownMenuItem icon={<DownloadIcon />} description="On the Team plan" disabled>
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem icon={<TrashIcon />} shortcut="⌘⌫" tone="danger" onClick={() => setDeleted(true)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    >
      {deleted ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-(--pad) text-center">
          <p className="text-ui-sm text-pretty text-text-secondary">“{title}” is in the Trash for 30 days.</p>
          <Button size="sm" onClick={() => setDeleted(false)}>
            Undo
          </Button>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col px-(--pad) pt-5">
          {renaming ? (
            <form
              className="-mx-[calc(--spacing(2.5)+1px)]"
              onSubmit={(e) => {
                e.preventDefault();
                titleInput.current?.blur();
              }}
            >
              <Input
                ref={titleInput}
                size="sm"
                aria-label="Document name"
                defaultValue={title}
                onFocus={(e) => {
                  focusTitle.current = false;
                  e.currentTarget.select();
                }}
                onBlur={(e) => {
                  const next = e.currentTarget.value.trim();
                  if (next) setTitle(next);
                  setRenaming(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.currentTarget.value = title;
                    e.currentTarget.blur();
                  }
                }}
              />
            </form>
          ) : (
            <h2 className="flex h-8 items-center truncate text-ui-md font-medium text-text">{title}</h2>
          )}
          <p className="mt-1 text-ui-sm text-text-muted">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"} · sorted by{" "}
            {sort === "updated" ? "last updated" : sort === "created" ? "date created" : "name"}
          </p>

          <ul className={`${rowGrid} mt-4 gap-x-2.5 [--col:3.25rem]`} aria-label="Tasks">
            {tasks.map((t) => (
              <li key={t.title} className={`${rowGridRow} h-10 border-t border-line-subtle first:border-t-0`}>
                <Avatar name={t.owner} size="sm" />
                <span className={`truncate text-ui-sm ${t.done ? "text-text-muted line-through decoration-text-disabled" : "text-text"}`}>
                  {t.title}
                </span>
                <span className="text-ui-xs text-text-muted tabular-nums">{due.format(t.due)}</span>
              </li>
            ))}
          </ul>

          <p aria-live="polite" className="mt-auto flex h-11 items-center text-ui-sm text-text-secondary">
            {status}
          </p>
        </div>
      )}
    </DemoFrame>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0" fill="currentColor" aria-hidden>
      <circle cx="3.5" cy="8" r="1.25" />
      <circle cx="8" cy="8" r="1.25" />
      <circle cx="12.5" cy="8" r="1.25" />
    </svg>
  );
}

const DuplicateIcon = () => <Icon d="M5.5 5.5V3.75c0-.7.55-1.25 1.25-1.25h5.5c.7 0 1.25.55 1.25 1.25v5.5c0 .7-.55 1.25-1.25 1.25H10.5M3.75 5.5h5.5c.7 0 1.25.55 1.25 1.25v5.5c0 .7-.55 1.25-1.25 1.25h-5.5c-.7 0-1.25-.55-1.25-1.25v-5.5c0-.7.55-1.25 1.25-1.25Z" />;
const PencilIcon = () => <Icon d="M9.5 3.5 12.5 6.5M2.5 13.5l.6-2.9 7.6-7.6a1.4 1.4 0 0 1 2 0l.3.3a1.4 1.4 0 0 1 0 2l-7.6 7.6-2.9.6Z" />;
const FolderIcon = () => <Icon d="M2.5 4.75c0-.7.55-1.25 1.25-1.25h2.4l1.5 1.5h4.6c.7 0 1.25.55 1.25 1.25v5c0 .7-.55 1.25-1.25 1.25h-8.5c-.7 0-1.25-.55-1.25-1.25v-6.5Z" />;
const LinkIcon = () => <Icon d="M7 9a2.5 2.5 0 0 0 3.5 0l2-2A2.5 2.5 0 0 0 9 3.5l-.5.5M9 7a2.5 2.5 0 0 0-3.5 0l-2 2A2.5 2.5 0 0 0 7 12.5l.5-.5" />;
const DownloadIcon = () => <Icon d="M8 2.5V10M5 7l3 3 3-3M3 12.5h10" />;
const TrashIcon = () => <Icon d="M2.75 4.5h10.5M6.5 4.5V3.25c0-.4.35-.75.75-.75h1.5c.4 0 .75.35.75.75V4.5M4.25 4.5l.6 8c.05.55.5 1 1.05 1h4.2c.55 0 1-.45 1.05-1l.6-8M6.75 7v4M9.25 7v4" />;
