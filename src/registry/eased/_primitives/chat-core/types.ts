/**
 * Chat message types, structurally compatible with Vercel AI SDK v5+ `UIMessage`.
 *
 * Eased never imports `ai`: these mirror its shapes, so `useChat().messages` passes straight
 * into Eased components and Eased messages pass back into `setMessages`. Only the parts Eased
 * renders are spelled out; every other part type still type-checks through `ChatUnknownPart`.
 *
 * Tool-call state (`input-streaming`, `output-available` …) is owned by `thinking-core`'s
 * `ToolState`; here it stays a plain string so this file has no cross-lane dependency.
 */

/** `useChat().status`: `submitted` is waiting for the first chunk, `streaming` is receiving it. */
export type ChatStatus = "submitted" | "streaming" | "ready" | "error";

export type ChatRole = "system" | "user" | "assistant";

/** Streaming state of a text or reasoning part. */
export type ChatPartState = "streaming" | "done";

export type ChatTextPart = { type: "text"; text: string; state?: ChatPartState };
export type ChatReasoningPart = { type: "reasoning"; text: string; state?: ChatPartState };

/** An attached file. `url` is a hosted URL or a `data:` URL, as AI SDK expects. */
export type ChatFilePart = { type: "file"; mediaType: string; filename?: string; url: string };

export type ChatSourceUrlPart = { type: "source-url"; sourceId: string; url: string; title?: string };
export type ChatStepStartPart = { type: "step-start" };

/** A tool call: `type` is `tool-<name>`. `state` mirrors thinking-core's `ToolState`. */
export type ChatToolPart = {
  type: `tool-${string}`;
  toolCallId: string;
  state: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

/** Anything else AI SDK may send (`data-*`, `dynamic-tool`, `source-document` …). */
export type ChatUnknownPart = { type: string; [key: string]: unknown };

export type ChatMessagePart =
  | ChatTextPart
  | ChatReasoningPart
  | ChatFilePart
  | ChatSourceUrlPart
  | ChatStepStartPart
  | ChatToolPart
  | ChatUnknownPart;

/**
 * One message. Same shape as AI SDK's `UIMessage<METADATA>`: `id`, `role`, `parts`, and an
 * optional `metadata` you define (Eased reads `authorId` and `createdAt` from it when present).
 */
export type ChatMessage<Metadata = unknown> = {
  id: string;
  role: ChatRole;
  parts: ChatMessagePart[];
  metadata?: Metadata;
};

export const isTextPart = (p: ChatMessagePart): p is ChatTextPart => p.type === "text";
export const isFilePart = (p: ChatMessagePart): p is ChatFilePart => p.type === "file";
export const isReasoningPart = (p: ChatMessagePart): p is ChatReasoningPart => p.type === "reasoning";
export const isToolPart = (p: ChatMessagePart): p is ChatToolPart =>
  p.type.startsWith("tool-") && typeof (p as ChatToolPart).toolCallId === "string";

/** The message's text parts joined, e.g. for Copy. */
export function messageText(message: Pick<ChatMessage, "parts">) {
  return message.parts.filter(isTextPart).map((p) => p.text).join("");
}

/** True while a reply is on its way: submitted or streaming. */
export const isBusy = (status: ChatStatus | undefined) => status === "submitted" || status === "streaming";
