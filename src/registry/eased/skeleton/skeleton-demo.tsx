"use client";

import { useEffect, useState } from "react";
import { Avatar } from "../avatar/avatar";
import { Button } from "../button/button";
import { DemoFrame } from "../lib/demo-frame";
import { Skeleton, SkeletonText } from "./skeleton";

type Activity = { id: string; who: string; did: string; what: string; when: string };

const FEED: Activity[] = [
  { id: "1", who: "Maya Okafor", did: "merged", what: "Checkout: smart address paste", when: "4m" },
  { id: "2", who: "Jonas Weber", did: "commented on", what: "Pricing page copy, v3", when: "18m" },
  { id: "3", who: "Priya Raman", did: "opened", what: "Skeleton flashes on fast networks", when: "1h" },
  { id: "4", who: "Leo Martín", did: "shipped", what: "Changelog 2.4", when: "3h" },
];

/** Simulates a request: 1.4s on the first load and on every reload. */
function useFeed() {
  const [attempt, setAttempt] = useState(0);
  const [data, setData] = useState<{ attempt: number; items: Activity[] } | null>(null);
  useEffect(() => {
    const t = window.setTimeout(() => setData({ attempt, items: FEED }), 1400);
    return () => window.clearTimeout(t);
  }, [attempt]);
  const loading = data?.attempt !== attempt;
  return { items: loading || !data ? null : data.items, loading, reload: () => setAttempt((a) => a + 1) };
}

export function SkeletonDemo() {
  const { items, loading, reload } = useFeed();

  return (
    <DemoFrame
      title="Activity"
      meta={loading ? "Loading…" : "Updated just now"}
      actions={
        <Button variant="ghost" size="sm" edge="end" onClick={reload} disabled={loading}>
          Reload
        </Button>
      }
    >
      <ul aria-busy={loading} className="flex flex-col p-1.5">
        {/* While loading, every row renders with stand-in text the length of a real one, so the handoff never moves a pixel. */}
        {(items ?? FEED).map((a) => (
          <li key={a.id} className="flex min-w-0 items-start gap-3 rounded-control px-2.5 py-3">
            <Skeleton loading={loading} className="size-8 shrink-0 rounded-pill">
              <Avatar name={a.who} size="md" />
            </Skeleton>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex min-w-0 items-baseline justify-between gap-3">
                <Skeleton loading={loading} text className="min-w-0">
                  <p className="truncate text-ui-sm text-text">
                    <span className="font-medium">{a.who}</span> <span className="text-text-secondary">{a.did}</span>
                  </p>
                </Skeleton>
                <Skeleton loading={loading} text className="shrink-0">
                  <span className="text-ui-xs text-text-muted tabular-nums">{a.when}</span>
                </Skeleton>
              </div>
              <Skeleton loading={loading} text className="min-w-0 self-start">
                <p className="truncate text-ui-sm text-text-secondary">{a.what}</p>
              </Skeleton>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-auto border-t border-line-subtle p-4">
        <p className="mb-2 text-ui-xs font-medium tracking-caps text-text-muted uppercase">Release notes</p>
        {loading ? (
          <SkeletonText lines={2} />
        ) : (
          <p className="text-pretty text-ui-sm text-text-secondary">
            Skeletons now share one shimmer across the page, and hand off to content in place.
          </p>
        )}
      </div>
    </DemoFrame>
  );
}
