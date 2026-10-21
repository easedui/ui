"use client";

import { useState } from "react";
import { Avatar } from "../avatar/avatar";
import { Button } from "../button/button";
import { DemoFrame } from "../lib/demo-frame";
import { rowGrid, rowGridRow } from "../lib/layout";
import { Segmented } from "../segmented/segmented";
import { Skeleton } from "../skeleton/skeleton";
import { ImageCompare } from "./image-compare";

type Mode = "polish" | "loading";

const PEOPLE = [
  { name: "Maya Okafor", email: "maya@atlas.so", role: "Owner" },
  { name: "Jonas Weber", email: "jonas@atlas.so", role: "Can edit" },
  { name: "Priya Raman", email: "priya@atlas.so", role: "Can view" },
];

/** The stage both layers share: one canvas, the card centred on it. */
function Stage({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "eased" }) {
  return (
    <div className={`flex h-full w-full items-center justify-center p-4 ${tone === "eased" ? "bg-bg" : "bg-surface-sunken"}`}>
      {children}
    </div>
  );
}

/** The share card as a default kit ships it: square corners, ragged roles, mixed heights. */
function PlainCard() {
  return (
    <div className="w-full max-w-72 rounded-control-2xs border border-line-strong bg-surface p-3 text-ui-sm">
      <p className="font-medium text-text">Share “Q4 roadmap”</p>
      <div className="mt-2 flex gap-1.5">
        <div className="flex h-8 min-w-0 flex-1 items-center rounded-control-2xs border border-line-strong px-2 text-text-muted">
          Add people…
        </div>
        <div className="flex h-9 items-center rounded-control-2xs bg-brand px-2.5 text-text-on-brand">Invite</div>
      </div>
      <ul className="mt-3 flex flex-col gap-2.5">
        {PEOPLE.map((p) => (
          <li key={p.email} className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-control-2xs bg-surface-hover text-ui-2xs text-text-secondary">
                {p.name[0]}
              </span>
              <span className="truncate text-text-secondary">{p.name}</span>
            </div>
            <span className="shrink-0 text-text-secondary">{p.role}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between border-t border-line-strong pt-3">
        <span className="px-2 text-text-secondary">Copy link</span>
        <div className="flex h-8 items-center rounded-control-2xs border border-line-strong px-4 text-text">Done</div>
      </div>
    </div>
  );
}

/** The same card on Eased: concentric corners, one leading edge, roles in a fixed track. */
function EasedCard({ loading = false }: { loading?: boolean }) {
  return (
    <div className="w-full max-w-72 rounded-panel border border-line bg-surface-raised p-(--pad) shadow-floating [--pad:12px] [--radius-outer:var(--eased-radius-panel)]">
      <Skeleton loading={loading} text block>
        <p className="text-ui-sm font-medium text-text">Share “Q4 roadmap”</p>
      </Skeleton>
      <div className="mt-2 flex gap-1.5">
        <Skeleton loading={loading} block className="min-w-0 flex-1 radius-nested">
          <div className="flex h-control-sm min-w-0 items-center rounded-control-sm border border-line-strong px-2.5 text-ui-sm text-text-muted">
            Add people…
          </div>
        </Skeleton>
        <Skeleton loading={loading} block className="radius-nested">
          <Button size="sm" variant="primary" tabIndex={-1}>
            Invite
          </Button>
        </Skeleton>
      </div>
      <ul className={`${rowGrid} mt-3 gap-x-2.5 gap-y-2 [--col:3.6875rem]`}>
        {PEOPLE.map((p) => (
          <li key={p.email} className={`${rowGridRow} h-7`}>
            <Skeleton loading={loading} className="size-6 rounded-pill">
              <Avatar name={p.name} size="sm" />
            </Skeleton>
            <Skeleton loading={loading} text>
              <span className="block truncate text-ui-sm text-text">{p.name}</span>
            </Skeleton>
            <Skeleton loading={loading} text>
              <span className="block text-ui-sm text-text-muted">{p.role}</span>
            </Skeleton>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between border-t border-line-subtle pt-3">
        <Skeleton loading={loading} text>
          <Button size="sm" variant="ghost" edge="start" tabIndex={-1}>
            Copy link
          </Button>
        </Skeleton>
        <Skeleton loading={loading} block className="rounded-control-sm">
          <Button size="sm" tabIndex={-1}>
            Done
          </Button>
        </Skeleton>
      </div>
    </div>
  );
}

/**
 * "Plain vs Eased": the same share card as a default kit draws it and as Eased does, with
 * one divider between them. Switch to Loading to compare the skeleton with the loaded card.
 */
export function ImageCompareDemo() {
  const [mode, setMode] = useState<Mode>("polish");
  const [value, setValue] = useState(50);

  return (
    <DemoFrame
      title="Compare"
      actions={
        <Segmented<Mode>
          aria-label="What to compare"
          value={mode}
          onValueChange={setMode}
          options={[
            { value: "polish", label: "Polish" },
            { value: "loading", label: "Loading" },
          ]}
        />
      }
    >
      <div className="flex min-h-0 flex-1 flex-col p-(--pad)">
        <ImageCompare
          key={mode}
          aria-label={mode === "polish" ? "Compare the plain card with the Eased card" : "Compare the loading card with the loaded card"}
          defaultValue={value}
          onValueChange={setValue}
          beforeLabel={mode === "polish" ? "Plain" : "Loading"}
          afterLabel={mode === "polish" ? "Eased" : "Loaded"}
          className="min-h-0 flex-1 rounded-control border border-line-subtle"
          before={
            mode === "polish" ? (
              <Stage>
                <PlainCard />
              </Stage>
            ) : (
              <Stage tone="eased">
                <EasedCard loading />
              </Stage>
            )
          }
          after={
            <Stage tone="eased">
              <EasedCard />
            </Stage>
          }
        />
      </div>
    </DemoFrame>
  );
}
