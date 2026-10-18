/**
 * timeline-core: events and timelines for matter histories, transaction ledgers, deploy logs
 * and activity feeds. A typed event model, Intl day grouping, relative time on a shared
 * clock, live append with a once-only entrance stagger, and lane packing for span timelines.
 * Import from here; the files behind it may move.
 */
export { toMs, type EventTone, type TimeInput, type TimelineEvent } from "./types";
export { dayKey, dayLabel, daysBetweenKeys, groupByDay, sortEvents, type DayGroup, type DayLabelOptions, type SortOrder } from "./group";
export { formatRelative, relativeRefreshMs, useNow, useRelativeTime, type RelativeOptions } from "./relative";
export { enterMotion, useLiveTimeline, type LiveTimeline, type LiveTimelineOptions } from "./live";
export { packLanes, timeAxis, type Span } from "./lanes";
