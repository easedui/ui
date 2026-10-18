"use client";

import { useRef, useState } from "react";
import { Avatar } from "../avatar/avatar";
import { DemoFrame } from "../lib/demo-frame";
import { ToggleGroup, ToggleGroupItem } from "../toggle-group/toggle-group";
import { ScrollArea } from "./scroll-area";

type Kind = "merged" | "review" | "comment" | "deploy" | "issue";

const EVENTS: { who: string; kind: Kind; what: string; ago: string }[] = [
  { who: "Maya Chen", kind: "merged", what: "Fix sheet scroll handoff on iOS", ago: "2m" },
  { who: "Jonas Weber", kind: "review", what: "Requested changes on #482", ago: "9m" },
  { who: "Priya Raman", kind: "deploy", what: "Shipped v0.14.2 to production", ago: "21m" },
  { who: "Leo Martins", kind: "comment", what: "“Thumb should thicken on hover”", ago: "34m" },
  { who: "Ana Sousa", kind: "issue", what: "Opened #491 Fades flicker in Safari 17", ago: "1h" },
  { who: "Maya Chen", kind: "review", what: "Approved #479 Progressive blur", ago: "1h" },
  { who: "Kenji Sato", kind: "merged", what: "Add superellipse fallback path", ago: "2h" },
  { who: "Jonas Weber", kind: "comment", what: "“Can we pin the corner exponent?”", ago: "2h" },
  { who: "Priya Raman", kind: "deploy", what: "Shipped v0.14.1 to staging", ago: "3h" },
  { who: "Ana Sousa", kind: "merged", what: "Tokenise scrollbar colours", ago: "4h" },
  { who: "Leo Martins", kind: "issue", what: "Opened #488 Rubber-band too loose", ago: "5h" },
  { who: "Kenji Sato", kind: "review", what: "Commented on #476", ago: "6h" },
  { who: "Maya Chen", kind: "deploy", what: "Rolled back v0.14.0", ago: "8h" },
  { who: "Jonas Weber", kind: "merged", what: "Velocity projection for pagers", ago: "Yesterday" },
  { who: "Ana Sousa", kind: "comment", what: "“Feather looks right at 20px”", ago: "Yesterday" },
  { who: "Priya Raman", kind: "issue", what: "Closed #470 Focus ring clipped", ago: "Mon" },
];

const FILTERS: { value: "all" | Kind; label: string }[] = [
  { value: "all", label: "All" },
  { value: "merged", label: "Merged" },
  { value: "review", label: "Reviews" },
  { value: "comment", label: "Comments" },
  { value: "deploy", label: "Deploys" },
  { value: "issue", label: "Issues" },
];

/** An activity feed: a horizontal filter row and a vertical list, both in Scroll Areas. */
export function ScrollAreaDemo() {
  const [filter, setFilter] = useState<"all" | Kind>("all");
  const list = useRef<HTMLDivElement>(null);
  const rows = filter === "all" ? EVENTS : EVENTS.filter((e) => e.kind === filter);

  return (
    <DemoFrame title="Activity" meta={`${rows.length} events`}>
      <ScrollArea orientation="horizontal" fade={24} className="shrink-0 border-b border-line-subtle" aria-label="Filters">
        <ToggleGroup
          value={[filter]}
          onValueChange={(v) => {
            if (!v[0]) return; // one filter is always on
            setFilter(v[0] as "all" | Kind);
            list.current?.scrollTo({ top: 0 });
          }}
          aria-label="Filter activity"
          variant="chips"
          className="w-max px-4 py-2.5"
        >
          {FILTERS.map((f) => (
            <ToggleGroupItem key={f.value} value={f.value}>
              {f.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </ScrollArea>

      <ScrollArea viewportRef={list} className="min-h-0 flex-1" aria-label="Activity">
        <ul>
          {rows.map((e, i) => (
            <li key={`${e.who}-${e.what}`} className={`flex h-12 items-center gap-3 px-4 ${i ? "border-t border-line-subtle" : ""}`}>
              <Avatar name={e.who} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-ui-sm text-text">
                  <span className="font-medium">{e.who}</span> <span className="text-text-secondary">{e.what}</span>
                </p>
                <p className="text-ui-xs text-text-muted capitalize">{e.kind}</p>
              </div>
              <span className="shrink-0 text-ui-xs text-text-muted tabular-nums">{e.ago}</span>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </DemoFrame>
  );
}
