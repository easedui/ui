import type { Attachment } from "./attachments";
import { toFilePart } from "./attachments";
import type { ChatFilePart, ChatMessage, ChatStatus } from "./types";

/** What the Composer hands to `onSubmit`. */
export type ComposerSubmission = {
  text: string;
  /** Every attachment in the row, finished or not; `files` is the sendable subset. */
  attachments: Attachment[];
  /** The finished attachments as AI SDK `file` parts. */
  files: ChatFilePart[];
};

/**
 * The slice of AI SDK v5+ `useChat()` the adapter reads. Structural, so Eased has no `ai`
 * dependency: pass the hook's return value as is.
 */
export type UseChatLike<M extends ChatMessage = ChatMessage> = {
  messages: M[];
  status: ChatStatus;
  sendMessage: (message: { text: string; files?: ChatFilePart[] }) => unknown;
  stop: () => unknown;
  regenerate?: (options?: { messageId?: string }) => unknown;
  error?: Error | undefined;
};

/** The Composer props the adapter fills. */
export type ChatComposerBindings = {
  status: ChatStatus;
  onSubmit: (submission: ComposerSubmission) => void;
  onStop: () => void;
};

/**
 * Wires AI SDK's `useChat` into Eased:
 *
 * ```tsx
 * const chat = useChat();
 * const { composer, messages, status } = fromUseChat(chat);
 * <Composer {...composer} />
 * ```
 *
 * A plain function (no hooks), so it is free to call in render.
 */
export function fromUseChat<M extends ChatMessage>(chat: UseChatLike<M>) {
  const composer: ChatComposerBindings = {
    status: chat.status,
    onSubmit: ({ text, files }) => {
      void chat.sendMessage(files.length ? { text, files } : { text });
    },
    onStop: () => void chat.stop(),
  };
  return {
    messages: chat.messages,
    status: chat.status,
    error: chat.error,
    composer,
    regenerate: chat.regenerate,
  };
}

/** Builds the submission the Composer passes to `onSubmit`. */
export function toSubmission(text: string, attachments: Attachment[]): ComposerSubmission {
  return { text, attachments, files: attachments.map(toFilePart).filter((p): p is ChatFilePart => p !== null) };
}
