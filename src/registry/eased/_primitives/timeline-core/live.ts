"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { duration, ease, reducedFade, stagger as staggers } from "../../lib/motion";
import { sortEvents, type SortOrder } from "./group";
import type { TimelineEvent } from "./types";

export type LiveTimelineOptions = {
  /** Newest first (feeds, logs) or oldest first (a matter's history). Default `desc`. */
  order?: SortOrder;
  /** Keep at most this many events, dropping the oldest. */
  max?: number;
  /** Seconds between rows of one appended batch. Default `stagger.item` (35ms); the batch total is capped at 0.4s (rule 83). */
  stagger?: number;
  /** Stagger the initial events in once on mount too. Default false (they are simply there). */
  animateInitial?: boolean;
};

export type LiveTimeline<E> = {
  /** Sorted events, ready to render (or to `groupByDay`). */
  events: E[];
  /** Adds one or more events; each enters with its slot in the batch's stagger. Existing ids are replaced in place, without re-entering. */
  append(events: E | readonly E[]): void;
  /** Patches one event by id (a pending payment settling); it doesn't re-enter. */
  update(id: string, patch: Partial<E>): void;
  remove(id: string): void;
  /** Replaces everything without entrances (a filter change, a reload). */
  reset(events: readonly E[]): void;
  /** The entrance delay (s) for an id that is entering now, or null if it should just be there. */
  entering(id: string): number | null;
};

/** Max total stagger for a batch, seconds (rule 83). */
const STAGGER_CAP = 0.4;

/**
 * A live event list: append, update and remove by id, kept sorted, with an entrance stagger
 * only for rows that arrived after mount (each enters once; a re-render never replays it).
 * Rows animate with `enterMotion(timeline.entering(id), reduced)`.
 *
 *   const feed = useLiveTimeline(fixtures.events, { max: 50 });
 *   useEffect(() => socket.on("event", feed.append), [feed.append]);
 */
export function useLiveTimeline<E extends TimelineEvent>(initial: readonly E[], { order = "desc", max, stagger = staggers.item, animateInitial = false }: LiveTimelineOptions = {}): LiveTimeline<E> {
  const [state, setState] = useState(() => {
    const sorted = sortEvents(initial, order);
    return { list: trim(sorted, max, order), entering: animateInitial ? delays(sorted.map((e) => e.id), stagger) : new Map<string, number>() };
  });
  const clearTimer = useRef(0);

  const scheduleClear = useCallback(() => {
    clearTimeout(clearTimer.current);
    // After the longest entrance has run, forget it: a row moved to another day group re-mounts and must not replay.
    clearTimer.current = window.setTimeout(() => setState((s) => ({ ...s, entering: new Map() })), (STAGGER_CAP + duration.slow) * 1000 + 100);
  }, []);
  useEffect(() => {
    if (animateInitial) scheduleClear();
    return () => clearTimeout(clearTimer.current);
  }, [animateInitial, scheduleClear]);

  const append = useCallback(
    (input: E | readonly E[]) => {
      const batch = (Array.isArray(input) ? input : [input]) as E[];
      if (!batch.length) return;
      setState(({ list, entering }) => {
        const byId = new Map(batch.map((e) => [e.id, e]));
        const known = new Set(list.map((e) => e.id));
        const fresh = batch.filter((e) => !known.has(e.id));
        // Newest first in a desc feed, so the top row lands first.
        const arrival = sortEvents(fresh, order).map((e) => e.id);
        const replaced = list.map((e) => byId.get(e.id) ?? e);
        return {
          list: trim(sortEvents([...replaced, ...fresh], order), max, order),
          entering: fresh.length ? new Map([...entering, ...delays(arrival, stagger)]) : entering,
        };
      });
      scheduleClear();
    },
    [order, max, stagger, scheduleClear],
  );

  const update = useCallback(
    (id: string, patch: Partial<E>) => setState((s) => ({ ...s, list: sortEvents(s.list.map((e) => (e.id === id ? { ...e, ...patch } : e)), order) })),
    [order],
  );
  const remove = useCallback((id: string) => setState((s) => ({ ...s, list: s.list.filter((e) => e.id !== id) })), []);
  const reset = useCallback((events: readonly E[]) => setState({ list: trim(sortEvents(events, order), max, order), entering: new Map() }), [order, max]);
  const { list, entering: enteringMap } = state;
  const entering = useCallback((id: string) => enteringMap.get(id) ?? null, [enteringMap]);

  return useMemo(() => ({ events: list, append, update, remove, reset, entering }), [list, append, update, remove, reset, entering]);
}

function delays(ids: string[], step: number) {
  const each = ids.length > 1 ? Math.min(step, STAGGER_CAP / (ids.length - 1)) : 0;
  return new Map(ids.map((id, i) => [id, i * each]));
}

function trim<E extends TimelineEvent>(list: E[], max: number | undefined, order: SortOrder) {
  if (max === undefined || list.length <= max) return list;
  return order === "desc" ? list.slice(0, max) : list.slice(list.length - max);
}

/**
 * Motion props for a timeline row: rises `--enter-offset` (6px) and fades in after `delay`, or
 * renders in place when `delay` is null. Reduced motion: opacity only, instant.
 *
 *   <motion.li key={e.id} {...enterMotion(feed.entering(e.id), reduced)}>
 */
export function enterMotion(delay: number | null, reduced = false) {
  if (delay === null) return { initial: false as const };
  if (reduced) return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { ...reducedFade, delay } };
  return {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: duration.slow, ease: ease.enter, delay },
  };
}
