import type { ChatMessage } from "./types";

/** Where a message sits in a run of consecutive messages from one author. */
export type GroupPosition = "single" | "first" | "middle" | "last";

export type GroupOptions<M extends ChatMessage = ChatMessage> = {
  /**
   * Who wrote the message. Default: `metadata.authorId` when present, else the role, so a
   * group chat splits by person and an AI chat by user/assistant.
   */
  getAuthor?: (message: M) => string;
  /** When the message was sent, ms. Default: `metadata.createdAt` (number, string or Date). */
  getTime?: (message: M) => number | undefined;
  /** A pause longer than this starts a new group even for the same author, ms. Default 5 minutes. */
  gap?: number;
};

export type MessageGroup<M extends ChatMessage = ChatMessage> = {
  /** Stable key: the first message's id. */
  key: string;
  author: string;
  role: M["role"];
  messages: { message: M; position: GroupPosition }[];
};

type Meta = { authorId?: unknown; createdAt?: unknown } | undefined;

const defaultAuthor = (m: ChatMessage) => {
  const id = (m.metadata as Meta)?.authorId;
  return typeof id === "string" ? id : m.role;
};

const defaultTime = (m: ChatMessage) => {
  const t = (m.metadata as Meta)?.createdAt;
  if (typeof t === "number") return t;
  if (typeof t === "string" || t instanceof Date) {
    const ms = new Date(t).getTime();
    return Number.isNaN(ms) ? undefined : ms;
  }
  return undefined;
};

function positionOf(index: number, length: number): GroupPosition {
  if (length === 1) return "single";
  if (index === 0) return "first";
  return index === length - 1 ? "last" : "middle";
}

/**
 * Splits a flat message list into runs of consecutive messages from one author. Use the
 * groups to render one avatar and name per run, and each message's `position` to merge
 * bubble corners. Pure and cheap: call it in render.
 */
export function groupMessages<M extends ChatMessage>(messages: readonly M[], options: GroupOptions<M> = {}): MessageGroup<M>[] {
  const { getAuthor = defaultAuthor as (m: M) => string, getTime = defaultTime as (m: M) => number | undefined, gap = 5 * 60_000 } = options;
  const groups: { key: string; author: string; role: M["role"]; items: M[] }[] = [];
  let lastTime: number | undefined;

  for (const message of messages) {
    const author = getAuthor(message);
    const time = getTime(message);
    const current = groups[groups.length - 1];
    const paused = time !== undefined && lastTime !== undefined && time - lastTime > gap;
    if (current && current.author === author && current.role === message.role && !paused) current.items.push(message);
    else groups.push({ key: message.id, author, role: message.role, items: [message] });
    if (time !== undefined) lastTime = time;
  }

  return groups.map(({ key, author, role, items }) => ({
    key,
    author,
    role,
    messages: items.map((message, i) => ({ message, position: positionOf(i, items.length) })),
  }));
}

/** Each message's group position by id, for lists you render flat. */
export function groupPositions<M extends ChatMessage>(messages: readonly M[], options?: GroupOptions<M>) {
  const map = new Map<string, GroupPosition>();
  for (const group of groupMessages(messages, options)) for (const { message, position } of group.messages) map.set(message.id, position);
  return map;
}
