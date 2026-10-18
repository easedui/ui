"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import {
  isBusy,
  toSubmission,
  useAttachments,
  useAutosize,
  useComposerKeys,
  type Attachment,
  type ChatStatus,
  type ComposerSubmission,
  type ComposerTrigger,
  type UploadFn,
} from "../_primitives/chat-core/chat-core";
import { AutoHeight } from "../_primitives/auto-height/auto-height";
import { InputGroup, controlClass } from "../_primitives/field/field";
import { scrollFadeMask, useScrollEdges } from "../_primitives/scroll-fade/scroll-fade";
import { AttachmentList } from "../attachment/attachment-chip";
import { Button } from "../button/button";
import { bouncy, enter, exit, instant, reducedFade, useSafeReducedMotion } from "../lib/motion";
import { pressIcon } from "../lib/press";

export type ComposerHandle = {
  focus: () => void;
  /** The `<textarea>`, e.g. to anchor a Slash or Mention menu at the caret. */
  textarea: HTMLTextAreaElement | null;
  /** Opens the file picker. */
  openFilePicker: () => void;
};

export type ComposerProps = {
  /** Controlled text. Pair with `onValueChange`. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /**
   * Called on Enter or Send with the text, the attachments and the finished ones as AI SDK
   * `file` parts. Uncontrolled text and attachments clear themselves afterwards.
   */
  onSubmit?: (submission: ComposerSubmission) => void;
  /** `useChat().status`. `submitted` and `streaming` morph Send into Stop. Default `ready`. */
  status?: ChatStatus;
  /** Stop the reply: the Stop button and Escape while busy. */
  onStop?: () => void;

  /** Controlled attachments. Leave out to let the composer keep and upload its own. */
  attachments?: Attachment[];
  /** Files picked, dropped or pasted, when `attachments` is controlled. */
  onAttach?: (files: File[]) => void;
  onRemoveAttachment?: (id: string) => void;
  onRetryAttachment?: (id: string) => void;
  /** Uncontrolled attachments only: uploads each file with progress. Without it files stay local. */
  upload?: UploadFn;
  /** `<input accept>` syntax. Default: anything. */
  accept?: string;
  /** Uncontrolled only: bytes per file; bigger files show an error chip. */
  maxSize?: number;
  /** Uncontrolled only. */
  maxFiles?: number;
  /** Hide the attach button and ignore drops and pasted files. Default true (attachments on). */
  allowAttachments?: boolean;

  placeholder?: string;
  /** Default 1. */
  minRows?: number;
  /** Grow to this many lines, then scroll inside with soft edges. Default 6. */
  maxRows?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Accessible name of the textarea. Default "Message". */
  "aria-label"?: string;
  /** `enter` (default) or `mod-enter`. */
  submitOn?: "enter" | "mod-enter";
  /** ↑ in an empty composer, or ⌘↑ anywhere. */
  onEditLast?: () => void;

  /* ---------- Pro hooks: slash commands, @mentions, model picker ---------- */

  /** The `/` or `@` trigger under the caret after every keystroke (or null). Open your menu from here. */
  onTrigger?: (trigger: ComposerTrigger | null) => void;
  /** Trigger characters. Default `["/", "@"]`. */
  triggerChars?: readonly string[];
  /** Runs first on every keydown; return true to claim the key (an open menu's ↑ ↓ Enter Esc). */
  interceptKey?: (event: KeyboardEvent<HTMLTextAreaElement>) => boolean;
  /** Inside the shell, above the attachments: e.g. a quoted reply or a capability card. */
  header?: ReactNode;
  /** Bottom row, after the attach button: tools, a "+" menu. */
  toolbar?: ReactNode;
  /** Bottom row, just before Send: a model picker, a voice button, a context meter. */
  actions?: ReactNode;

  ref?: Ref<ComposerHandle>;
  className?: string;
};

/** Arrow and stop as the same seven-point outline, so one morphs into the other point for point. */
const ARROW = "M8 3L12.5 7.5L9.25 7.5L9.25 13L6.75 13L6.75 7.5L3.5 7.5Z";
const STOP = "M8 4.5L11.5 4.5L11.5 8L11.5 11.5L4.5 11.5L4.5 8L4.5 4.5Z";

/**
 * A chat composer: a textarea that grows on a spring (then scrolls inside with soft edges),
 * an attachments row that opens with Auto Height, and one button whose arrow morphs into a
 * stop square while a reply streams, without changing size. Enter sends, Shift+Enter breaks
 * the line, Escape stops. Files can be picked, dropped onto it or pasted.
 */
export function Composer({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onSubmit,
  status = "ready",
  onStop,
  attachments: attachmentsProp,
  onAttach,
  onRemoveAttachment,
  onRetryAttachment,
  upload,
  accept,
  maxSize,
  maxFiles,
  allowAttachments = true,
  placeholder = "Ask anything…",
  minRows = 1,
  maxRows = 6,
  disabled = false,
  autoFocus,
  "aria-label": ariaLabel = "Message",
  submitOn = "enter",
  onEditLast,
  onTrigger,
  triggerChars,
  interceptKey,
  header,
  toolbar,
  actions,
  ref,
  className = "",
}: ComposerProps) {
  const reduced = useSafeReducedMotion();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const [innerValue, setInnerValue] = useState(defaultValue);
  const value = valueProp ?? innerValue;
  const setValue = (v: string) => {
    if (valueProp === undefined) setInnerValue(v);
    onValueChange?.(v);
  };

  const own = useAttachments({ upload, accept, maxSize, maxFiles });
  const controlled = attachmentsProp !== undefined;
  const attachments = attachmentsProp ?? own.attachments;
  const addFiles = (files: File[]) => {
    if (!files.length || !allowAttachments) return;
    if (controlled) onAttach?.(files);
    else own.add(files);
  };
  const removeAttachment = (id: string) => {
    if (controlled) onRemoveAttachment?.(id);
    else own.remove(id);
    textarea.current?.focus();
  };
  const retryAttachment = controlled ? onRetryAttachment : own.retry;

  const busy = isBusy(status);
  const uploading = attachments.some((a) => a.status === "uploading");
  const sendable = attachments.some((a) => (a.status ?? "done") === "done");
  const canSend = !disabled && !busy && !uploading && (value.trim().length > 0 || sendable);

  const submit = useCallback(() => {
    if (!canSend) return;
    onSubmit?.(toSubmission(value.trim(), attachments.filter((a) => (a.status ?? "done") === "done")));
    if (valueProp === undefined) setInnerValue("");
    onValueChange?.("");
    if (!controlled) own.clear();
  }, [canSend, onSubmit, value, attachments, valueProp, onValueChange, controlled, own]);

  const stop = () => {
    onStop?.();
    textarea.current?.focus();
  };

  const keys = useComposerKeys({
    onSubmit: submit,
    canSubmit: canSend,
    submitOn,
    onEditLast,
    onEscape: () => {
      if (!busy || !onStop) return false;
      onStop();
      return true;
    },
    intercept: interceptKey,
    triggerChars,
    onTrigger,
  });

  const { height } = useAutosize(textarea, { minRows, maxRows, value });
  useScrollEdges(textarea);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => textarea.current?.focus(),
      get textarea() {
        return textarea.current;
      },
      openFilePicker: () => fileInput.current?.click(),
    }),
    [],
  );

  // Drag and drop onto the composer. A counter, because dragenter/leave fire for every child.
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);
  const hasFiles = (e: DragEvent) => allowAttachments && !disabled && Array.from(e.dataTransfer.types).includes("Files");
  const dropHandlers = {
    onDragEnter: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current++;
      setDragging(true);
    },
    onDragOver: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    onDragLeave: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setDragging(false);
    },
    onDrop: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current = 0;
      setDragging(false);
      addFiles(Array.from(e.dataTransfer.files));
      textarea.current?.focus();
    },
  };

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData.files);
    if (!files.length || !allowAttachments) return;
    // A screenshot pastes as a file; text that also carries a file (some apps) keeps the text.
    if (!e.clipboardData.getData("text/plain")) e.preventDefault();
    addFiles(files);
  };

  const sendLabel = busy ? "Stop generating" : uploading ? "Waiting for uploads to finish" : "Send message";
  const sendActive = busy ? Boolean(onStop) : canSend;

  return (
    <form
      className={`relative w-full min-w-0 ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <InputGroup
        multiline
        size="lg"
        {...dropHandlers}
        aria-disabled={disabled || undefined}
        className="gap-0! rounded-panel! p-2 [--pad:8px]! [--radius-outer:var(--eased-radius-panel)]!"
      >
        {header}
        {allowAttachments && (
          <AutoHeight open={attachments.length > 0}>
            {/* Chips share the text line (18px in), with room above for their remove buttons. */}
            <AttachmentList attachments={attachments} onRemove={removeAttachment} onRetry={retryAttachment} className="px-2.5 pt-2.5 pb-1" />
          </AutoHeight>
        )}

        <motion.div style={{ height }} className="relative [overflow:clip]">
          <textarea
            ref={textarea}
            rows={minRows}
            value={value}
            placeholder={placeholder}
            aria-label={ariaLabel}
            disabled={disabled}
            autoFocus={autoFocus}
            enterKeyHint="send"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={keys.onKeyDown}
            onSelect={keys.onSelect}
            onPaste={onPaste}
            style={scrollFadeMask("y", 16)}
            className={`${controlClass} block w-full resize-none px-2.5 py-1.5 text-ui [scrollbar-width:thin]`}
          />
        </motion.div>

        {/* Bottom row: the plus glyph's edge sits on the text line (rule 104); Send is flush with the 8px pad (rule 105). */}
        <div className="flex min-w-0 items-center gap-1 pt-1">
          {allowAttachments && (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                hitArea={false}
                aria-label="Add files"
                disabled={disabled}
                onClick={() => fileInput.current?.click()}
                className=""
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden>
                  <path d="M8 2.75v10.5M2.75 8h10.5" />
                </svg>
              </Button>
              <input
                ref={fileInput}
                type="file"
                multiple
                accept={accept}
                tabIndex={-1}
                className="sr-only"
                aria-hidden
                onChange={(e) => {
                  addFiles(Array.from(e.target.files ?? []));
                  e.target.value = "";
                  textarea.current?.focus();
                }}
              />
            </>
          )}
          {toolbar}
          <div className="min-w-0 flex-1" />
          {actions}
          <button
            type={busy ? "button" : "submit"}
            aria-label={sendLabel}
            aria-disabled={!sendActive || undefined}
            onClick={(e) => {
              if (!sendActive) e.preventDefault();
              else if (busy) stop();
            }}
            className={`relative inline-flex size-8 shrink-0 items-center justify-center bg-brand text-text-on-brand inset-shadow-highlight rounded-control-sm ${pressIcon} ${
              sendActive ? "cursor-pointer hover-fine:bg-brand-hover" : "cursor-not-allowed opacity-40 active:scale-100"
            }`}
          >
            <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
              <motion.path
                initial={false}
                animate={{ d: busy ? STOP : ARROW }}
                transition={reduced ? instant : bouncy}
                fill="currentColor"
                stroke="currentColor"
                strokeWidth={1.25}
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <AnimatePresence>
          {dragging && (
            <motion.div
              key="drop"
              aria-hidden
              className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-[inherit] border border-dashed border-brand-line bg-brand-subtle text-ui font-medium text-brand-text"
              initial={{ opacity: 0, scale: reduced ? 1 : 0.985 }}
              animate={{ opacity: 1, scale: 1, transition: reduced ? reducedFade : enter }}
              exit={{ opacity: 0, transition: reduced ? reducedFade : exit }}
            >
              Drop files to attach
            </motion.div>
          )}
        </AnimatePresence>
      </InputGroup>
      <span role="status" className="sr-only">
        {busy ? "Generating a reply" : ""}
      </span>
    </form>
  );
}
