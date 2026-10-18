"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent as ReactClipboardEvent,
  type DragEvent as ReactDragEvent,
  type ReactNode,
} from "react";
import { AutoHeight } from "../_primitives/auto-height/auto-height";
import { TextSwap } from "../_primitives/text-swap/text-swap";
import { blur, ease, enter, exitFast, instant, reducedFade, smooth, snappy, useSafeReducedMotion } from "../lib/motion";
import { pressIcon } from "../lib/press";

/* ---------- The model ------------------------------------------------------------ */

export type FileUploadStatus = "uploading" | "done" | "error";

/** One file in the list. Plain data: keep it in your own state if you control the list. */
export type FileUploadItem = {
  id: string;
  name: string;
  /** Bytes. */
  size: number;
  /** MIME type, e.g. `application/pdf`. */
  type: string;
  status: FileUploadStatus;
  /** 0–1 while uploading; leave it out when unknown. */
  progress?: number;
  /** Shown in place of the size when `status` is `error`, e.g. "Over 10 MB". */
  error?: string;
  /** False for errors a retry cannot fix (too large). Default true. */
  retryable?: boolean;
  /** The original file, when it came from this device. */
  file?: File;
};

/**
 * Uploads one file. Report progress 0–1 through `onProgress`, resolve when stored, reject
 * with an Error whose message the row shows. Abort on `signal` (the row was removed).
 */
export type FileUploadFn = (file: File, ctx: { onProgress: (fraction: number) => void; signal: AbortSignal; item: FileUploadItem }) => Promise<unknown>;

export type FileUploadRejection = { file: File; reason: "type" | "count"; message: string };

export type UseFileUploadOptions = {
  /** Called for each accepted file. Without it, files are listed as done at once. */
  upload?: FileUploadFn;
  /** Same syntax as `<input accept>`: `"image/*,.pdf"`. Other files are refused with a message. */
  accept?: string;
  /** Bytes. Larger files are listed with an error so the person sees why. */
  maxSize?: number;
  /** Files past this count are refused with a message. */
  maxFiles?: number;
  /** Controlled list. Pair with `onValueChange`. */
  value?: FileUploadItem[];
  defaultValue?: FileUploadItem[];
  onValueChange?: (items: FileUploadItem[]) => void;
  /** Files that were refused and why. The component also says so under the dropzone. */
  onReject?: (rejected: FileUploadRejection[]) => void;
};

export type FileUploadController = ReturnType<typeof useFileUpload>;

let counter = 0;
const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `file-${Date.now()}-${++counter}`);

/** `2.4 MB`, `840 kB`, with a no-break space (R47). */
export function formatBytes(bytes: number, locale?: Intl.LocalesArgument) {
  if (bytes < 1000) return `${new Intl.NumberFormat(locale).format(bytes)} ${bytes === 1 ? "byte" : "bytes"}`;
  const units = ["kilobyte", "megabyte", "gigabyte"] as const;
  let i = -1;
  let n = bytes;
  while (n >= 1000 && i < units.length - 1) {
    n /= 1000;
    i++;
  }
  return new Intl.NumberFormat(locale, { style: "unit", unit: units[i], unitDisplay: "short", maximumFractionDigits: n < 10 ? 1 : 0 })
    .format(n)
    .replace(" ", " ");
}

/** Whether a file matches an `accept` string. */
export function matchesAccept(file: Pick<File, "name" | "type">, accept?: string) {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept.split(",").some((raw) => {
    const rule = raw.trim().toLowerCase();
    if (!rule) return false;
    if (rule.startsWith(".")) return name.endsWith(rule);
    if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}

/** `"application/pdf,image/png,.jpg"` → `"PDF, PNG or JPG"`. */
export function describeAccept(accept: string) {
  const labels = accept
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => (r.startsWith(".") ? r.slice(1) : r.endsWith("/*") ? `${r.slice(0, -2)}s` : (r.split("/").pop() ?? r)).toUpperCase())
    .map((l) => (l === "IMAGES" || l === "VIDEOS" || l === "AUDIOS" ? l.toLowerCase() : l));
  const unique = [...new Set(labels)];
  return unique.length > 1 ? `${unique.slice(0, -1).join(", ")} or ${unique[unique.length - 1]}` : (unique[0] ?? "");
}

const typeLabel = (item: Pick<FileUploadItem, "name" | "type">) => {
  const ext = item.name.includes(".") ? item.name.split(".").pop() : undefined;
  return (ext || item.type.split("/").pop() || "file").slice(0, 4).toUpperCase();
};

/**
 * The upload state machine: add (pick, drop, paste) with accept, size and count checks,
 * upload with progress, abort on remove, retry on error. Use it directly to add files from
 * your own code (`add`), and pass it to `<FileUpload controller>`.
 */
export function useFileUpload({ upload, accept, maxSize, maxFiles, value, defaultValue, onValueChange, onReject }: UseFileUploadOptions = {}) {
  const [inner, setInner] = useState<FileUploadItem[]>(defaultValue ?? []);
  const items = value ?? inner;
  const list = useRef(items);
  const controllers = useRef(new Map<string, AbortController>());
  const [rejection, setRejection] = useState<{ message: string; key: number } | null>(null);
  const latest = useRef({ upload, onValueChange, onReject, controlled: value !== undefined, accept, maxSize, maxFiles });
  useLayoutEffect(() => {
    list.current = items;
    latest.current = { upload, onValueChange, onReject, controlled: value !== undefined, accept, maxSize, maxFiles };
  });

  const commit = useCallback((next: FileUploadItem[]) => {
    list.current = next;
    if (!latest.current.controlled) setInner(next);
    latest.current.onValueChange?.(next);
  }, []);

  const patch = useCallback(
    (id: string, changes: Partial<FileUploadItem>) => {
      if (!list.current.some((f) => f.id === id)) return;
      commit(list.current.map((f) => (f.id === id ? { ...f, ...changes } : f)));
    },
    [commit],
  );

  const start = useCallback(
    (item: FileUploadItem) => {
      const fn = latest.current.upload;
      if (!fn || !item.file) return;
      const controller = new AbortController();
      controllers.current.set(item.id, controller);
      let last = 0;
      fn(item.file, {
        signal: controller.signal,
        item,
        onProgress: (fraction) => {
          if (controller.signal.aborted || (fraction - last < 0.01 && fraction < 1)) return;
          last = fraction;
          patch(item.id, { progress: Math.min(1, Math.max(0, fraction)) });
        },
      }).then(
        () => {
          controllers.current.delete(item.id);
          if (!controller.signal.aborted) patch(item.id, { status: "done", progress: 1, error: undefined });
        },
        (err: unknown) => {
          controllers.current.delete(item.id);
          if (!controller.signal.aborted) patch(item.id, { status: "error", error: err instanceof Error ? err.message : "Upload failed" });
        },
      );
    },
    [patch],
  );

  const add = useCallback(
    (files: Iterable<File> | ArrayLike<File>) => {
      const { accept, maxSize, maxFiles, upload, onReject } = latest.current;
      const rejected: FileUploadRejection[] = [];
      const room = maxFiles === undefined ? Infinity : Math.max(0, maxFiles - list.current.length);
      const added: FileUploadItem[] = [];
      for (const file of Array.from(files)) {
        if (!matchesAccept(file, accept)) {
          rejected.push({ file, reason: "type", message: `${file.name} isn’t supported.${accept ? ` Use ${describeAccept(accept)}.` : ""}` });
        } else if (added.length >= room) {
          rejected.push({ file, reason: "count", message: `Up to ${maxFiles} files. ${file.name} wasn’t added.` });
        } else {
          const tooBig = maxSize !== undefined && file.size > maxSize;
          added.push({
            id: newId(),
            name: file.name || "Pasted file",
            size: file.size,
            type: file.type || "application/octet-stream",
            status: tooBig ? "error" : upload ? "uploading" : "done",
            progress: tooBig || !upload ? undefined : 0,
            error: tooBig ? `Over ${formatBytes(maxSize!)}` : undefined,
            retryable: tooBig ? false : undefined,
            file,
          });
        }
      }
      if (rejected.length) {
        const message =
          rejected.length === 1 ? rejected[0].message : `${rejected.length} files weren’t added. ${accept ? `Use ${describeAccept(accept)}.` : ""}`.trim();
        setRejection((r) => ({ message, key: (r?.key ?? 0) + 1 }));
        onReject?.(rejected);
      } else if (added.length) setRejection(null);
      if (!added.length) return [];
      commit([...list.current, ...added]);
      for (const item of added) if (item.status === "uploading") start(item);
      return added;
    },
    [commit, start],
  );

  const remove = useCallback(
    (id: string) => {
      controllers.current.get(id)?.abort();
      controllers.current.delete(id);
      commit(list.current.filter((f) => f.id !== id));
    },
    [commit],
  );

  const retry = useCallback(
    (id: string) => {
      const item = list.current.find((f) => f.id === id);
      if (!item?.file || !latest.current.upload || item.retryable === false) return;
      const next: FileUploadItem = { ...item, status: "uploading", progress: 0, error: undefined };
      commit(list.current.map((f) => (f.id === id ? next : f)));
      start(next);
    },
    [commit, start],
  );

  const clear = useCallback(() => {
    for (const c of controllers.current.values()) c.abort();
    controllers.current.clear();
    commit([]);
  }, [commit]);

  const dismissRejection = useCallback(() => setRejection(null), []);

  useEffect(() => {
    const ctrl = controllers.current;
    return () => {
      for (const c of ctrl.values()) c.abort();
    };
  }, []);

  return { items, add, remove, retry, clear, rejection: rejection?.message ?? null, dismissRejection, canRetry: !!upload, accept, maxSize };
}

/* ---------- The component -------------------------------------------------------- */

export type FileUploadProps = UseFileUploadOptions & {
  /** A controller from `useFileUpload`, when your own code also adds files. Its options win. */
  controller?: FileUploadController;
  /** Allow picking several files at once. Default true. */
  multiple?: boolean;
  disabled?: boolean;
  /** The dropzone's title. Default "Drop files here". */
  title?: ReactNode;
  /** The line under the title. Default: the accepted types and the size limit. */
  hint?: ReactNode;
  /** Names the file list. Default "Files". */
  listLabel?: string;
  /** Rendered after the list, inside the component, e.g. a footer with a Submit button. */
  children?: ReactNode;
  className?: string;
};

/**
 * A dropzone and the files dropped on it. Click, drop or paste to add; a drag anywhere on the
 * page wakes the zone, and over it the icon lifts and a soft light follows the pointer. Rows
 * rise in while the list's height springs, each with a progress bar on the smooth spring;
 * removed rows fade and the rest close the gap. Refused files are explained under the zone.
 */
export function FileUpload({
  controller,
  multiple = true,
  disabled = false,
  title = "Drop files here",
  hint,
  listLabel = "Files",
  children,
  className = "",
  ...options
}: FileUploadProps) {
  const own = useFileUpload(options);
  const ctrl = controller ?? own;
  const { items, add, remove, retry, rejection, canRetry } = ctrl;
  const reduced = useSafeReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLButtonElement>(null);
  const glowRef = useRef<HTMLSpanElement>(null);
  const removeRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef<string | "zone" | null>(null);
  const [over, setOver] = useState<{ count: number; valid: boolean } | null>(null);
  const pageDrag = usePageFileDrag(!disabled);
  const depth = useRef(0);
  const hintId = useId();
  const errorId = useId();
  const accept = controller ? controller.accept : options.accept;
  const maxSize = controller ? controller.maxSize : options.maxSize;

  const defaultHint = [accept ? describeAccept(accept) : null, maxSize ? `up to ${formatBytes(maxSize)}` : null].filter(Boolean).join(", ");
  const hintText = hint ?? (defaultHint ? defaultHint[0].toUpperCase() + defaultHint.slice(1) : "Any file type");

  const inspect = (e: ReactDragEvent) => {
    const files = [...e.dataTransfer.items].filter((i) => i.kind === "file");
    // During a drag only types are readable (names arrive on drop), so `.ext` rules can't be judged yet.
    const judgeable = accept ? accept.split(",").every((r) => !r.trim().startsWith(".")) : true;
    const valid = !judgeable || files.every((f) => matchesAccept({ name: "", type: f.type }, accept));
    return { count: files.length, valid };
  };

  const onDragEnter = (e: ReactDragEvent<HTMLButtonElement>) => {
    if (disabled || !e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    depth.current++;
    setOver(inspect(e));
  };
  const onDragOver = (e: ReactDragEvent<HTMLButtonElement>) => {
    if (disabled || !e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    const zone = zoneRef.current;
    const glow = glowRef.current;
    if (zone && glow) {
      const r = zone.getBoundingClientRect();
      glow.style.setProperty("--x", `${e.clientX - r.left}px`);
      glow.style.setProperty("--y", `${e.clientY - r.top}px`);
    }
  };
  const onDragLeave = () => {
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setOver(null);
  };
  const onDrop = (e: ReactDragEvent<HTMLButtonElement>) => {
    if (disabled) return;
    e.preventDefault();
    depth.current = 0;
    setOver(null);
    const files = [...e.dataTransfer.files];
    if (files.length) add(multiple ? files : files.slice(0, 1));
  };
  const onPaste = (e: ReactClipboardEvent) => {
    if (disabled) return;
    const files = [...e.clipboardData.files];
    if (!files.length) return;
    e.preventDefault();
    add(multiple ? files : files.slice(0, 1));
  };

  const onRemove = (id: string) => {
    const at = items.findIndex((f) => f.id === id);
    const neighbour = items[at + 1] ?? items[at - 1];
    // Keep keyboard focus in the list: the next row's remove button, else the dropzone.
    if (document.activeElement === removeRefs.current.get(id)) pendingFocus.current = neighbour ? neighbour.id : "zone";
    remove(id);
  };
  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    (target === "zone" ? zoneRef.current : removeRefs.current.get(target))?.focus();
  }, [items]);

  const active = over !== null;
  const invalid = active && !over.valid;
  const titleText = invalid
    ? "Not a supported type"
    : active
      ? over.count > 1
        ? `Drop ${over.count} files`
        : "Drop to upload"
      : title;

  return (
    <div onPaste={onPaste} className={`flex min-w-0 flex-col ${className}`}>
      <input
        ref={inputRef}
        type="file"
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files?.length) add(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        ref={zoneRef}
        type="button"
        disabled={disabled}
        aria-describedby={`${hintId} ${errorId}`}
        onClick={() => inputRef.current?.click()}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        data-over={active || undefined}
        data-invalid={invalid || undefined}
        data-page-drag={(pageDrag && !active) || undefined}
        className={`group relative isolate flex min-h-32 w-full flex-col items-center justify-center gap-3 overflow-clip rounded-control border border-dashed px-4 py-5 text-center ${pressWideNoScale} ${
          disabled
            ? "cursor-not-allowed border-line bg-surface-sunken text-text-disabled"
            : `cursor-pointer ${
                invalid
                  ? "border-danger bg-danger-subtle"
                  : active
                    ? "border-text bg-surface-hover"
                    : pageDrag
                      ? "border-text-muted bg-surface-hover"
                      : "border-line-strong bg-surface hover-fine:bg-surface-hover"
              }`
        }`}
      >
        <span
          ref={glowRef}
          aria-hidden
          className={`pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(160px_circle_at_var(--x,50%)_var(--y,50%),color-mix(in_oklch,var(--eased-text)_7%,transparent),transparent_70%)] transition-opacity duration-200 ease-standard ${
            active && !invalid ? "opacity-100" : "opacity-0"
          }`}
        />
        <UploadGlyph lifted={active} pageDrag={pageDrag} invalid={invalid} reduced={reduced} disabled={disabled} />
        <span className="flex min-w-0 flex-col items-center gap-0.5">
          <span className={`text-ui font-medium ${disabled ? "" : invalid ? "text-danger-text" : "text-text"}`}>
            <TextSwap swapKey={typeof titleText === "string" ? titleText : active ? "active" : "rest"}>
              {active ? (
                titleText
              ) : (
                <span>
                  {titleText} <span className="font-normal text-text-muted">or</span>{" "}
                  <span className="underline decoration-line-strong underline-offset-2 group-hover-fine:decoration-text">browse</span>
                </span>
              )}
            </TextSwap>
          </span>
          <span id={hintId} className={`text-ui-sm ${disabled ? "" : "text-text-muted"}`}>
            {hintText}
          </span>
        </span>
      </button>

      {/* Always mounted, so the message is announced when it appears. */}
      <div id={errorId} role="status" aria-live="polite">
        <AutoHeight open={!!rejection} innerClassName="pt-3">
          <p className="flex items-start gap-1.5 text-ui-sm text-danger-text">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden className="mt-0.5 size-4 shrink-0">
              <circle cx="8" cy="8" r="6.25" />
              <path d="M8 5v3.5M8 11h.01" />
            </svg>
            <span className="min-w-0 text-pretty">{rejection}</span>
          </p>
        </AutoHeight>
      </div>

      <AutoHeight className="mt-1.5">
        <ul aria-label={listLabel} className="relative flex flex-col">
          <AnimatePresence initial={false} mode="popLayout">
            {items.map((item) => (
              <motion.li
                key={item.id}
                layout={reduced ? false : "position"}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98, filter: `blur(${blur.subtle})` }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  filter: "blur(0px)",
                  transition: reduced ? reducedFade : { ...snappy, opacity: enter, filter: enter },
                }}
                exit={{ opacity: 0, scale: reduced ? 1 : 0.98, filter: reduced ? "blur(0px)" : `blur(${blur.subtle})`, transition: reduced ? reducedFade : exitFast }}
                transition={reduced ? instant : smooth}
                className="w-full border-line-subtle not-first:border-t"
              >
                <FileRow
                  item={item}
                  reduced={reduced}
                  canRetry={canRetry && item.retryable !== false && !!item.file}
                  onRemove={() => onRemove(item.id)}
                  onRetry={() => retry(item.id)}
                  removeRef={(el) => {
                    if (el) removeRefs.current.set(item.id, el);
                    else removeRefs.current.delete(item.id);
                  }}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </AutoHeight>
      {children}
    </div>
  );
}

/** Colour transitions without the press scale: the zone is wider than any press should move. */
const pressWideNoScale =
  "[transition:background-color_150ms_var(--eased-ease-standard),border-color_150ms_var(--eased-ease-standard),color_150ms_var(--eased-ease-standard),box-shadow_var(--eased-duration-focus)_var(--eased-ease-standard)] focus-ring";

/* ---------- Parts --------------------------------------------------------------- */

/** True while files are being dragged anywhere over the page, so the zone can wake up before it is reached. */
function usePageFileDrag(enabled: boolean) {
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let depth = 0;
    const isFiles = (e: DragEvent) => e.dataTransfer?.types.includes("Files") ?? false;
    const onEnter = (e: DragEvent) => {
      if (!isFiles(e)) return;
      depth++;
      setDragging(true);
    };
    const onLeave = (e: DragEvent) => {
      if (!isFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    };
    const reset = () => {
      depth = 0;
      setDragging(false);
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", reset);
    window.addEventListener("dragend", reset);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", reset);
      window.removeEventListener("dragend", reset);
    };
  }, [enabled]);
  return enabled && dragging;
}

function UploadGlyph({ lifted, pageDrag, invalid, reduced, disabled }: { lifted: boolean; pageDrag: boolean; invalid: boolean; reduced: boolean; disabled: boolean }) {
  const t = reduced ? instant : snappy;
  return (
    <motion.span
      aria-hidden
      animate={{ scale: lifted && !invalid ? 1.06 : 1, y: lifted && !invalid ? -2 : 0 }}
      transition={t}
      className={`relative flex size-10 items-center justify-center rounded-control border transition-colors duration-150 ease-standard ${
        disabled
          ? "border-line bg-surface-sunken"
          : invalid
            ? "border-danger bg-surface text-danger-text"
            : lifted || pageDrag
              ? "border-line-strong bg-surface text-text shadow-resting"
              : "border-line bg-surface text-text-secondary shadow-resting"
      }`}
    >
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-5">
        <path d="M3.5 12.5v2c0 1.1.9 2 2 2h9c1.1 0 2-.9 2-2v-2" />
        <motion.g animate={{ y: lifted && !invalid ? -1.5 : pageDrag ? -0.75 : 0 }} transition={t}>
          <path d="M10 13V4M6.5 7.5 10 4l3.5 3.5" />
        </motion.g>
      </svg>
    </motion.span>
  );
}

type FileRowProps = {
  item: FileUploadItem;
  reduced: boolean;
  canRetry: boolean;
  onRemove: () => void;
  onRetry: () => void;
  removeRef: (el: HTMLButtonElement | null) => void;
};

function FileRow({ item, reduced, canRetry, onRemove, onRetry, removeRef }: FileRowProps) {
  const { status } = item;
  // Rows that were already done when they mounted don't replay the check.
  const [initialStatus] = useState(status);
  const progress = item.progress ?? 0;
  const percent = Math.round(progress * 100);
  const sizeText = formatBytes(item.size);
  const spoken =
    status === "uploading" ? `${item.name}, uploading, ${percent}%` : status === "error" ? `${item.name}, failed: ${item.error ?? "upload failed"}` : `${item.name}, ${sizeText}, uploaded`;

  return (
    <div
      role="group"
      aria-label={spoken}
      className="grid h-14 grid-cols-[2.25rem_minmax(0,1fr)_4.5rem] items-center gap-3"
    >
      <span
        aria-hidden
        className={`flex size-9 items-center justify-center rounded-control-sm text-ui-2xs font-medium tracking-caps transition-colors duration-150 ease-standard select-none ${
          status === "error" ? "bg-danger-subtle text-danger-text" : "bg-surface-sunken text-text-secondary"
        }`}
      >
        {status === "error" ? (
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="size-4">
            <circle cx="8" cy="8" r="6.25" />
            <path d="M8 5v3.5M8 11h.01" />
          </svg>
        ) : (
          typeLabel(item)
        )}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="truncate text-ui-sm font-medium text-text" title={item.name}>
          {item.name}
        </p>
        <div className="relative h-4 min-w-0">
          <AnimatePresence initial={false} mode="popLayout">
            {status === "uploading" ? (
              <motion.div
                key="progress"
                className="absolute inset-0 flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: reduced ? reducedFade : enter }}
                exit={{ opacity: 0, transition: reduced ? reducedFade : exitFast }}
              >
                <span className="relative h-1 min-w-0 flex-1 overflow-clip rounded-pill bg-surface-active">
                  <motion.span
                    className="absolute inset-0 origin-left rounded-pill bg-text"
                    initial={false}
                    animate={{ scaleX: progress }}
                    transition={reduced ? instant : smooth}
                  />
                </span>
                <span className="w-8 shrink-0 text-right text-ui-xs text-text-muted tabular-nums">{percent}%</span>
              </motion.div>
            ) : (
              <motion.p
                key={status}
                className={`absolute inset-0 flex items-center gap-1.5 truncate text-ui-xs ${status === "error" ? "text-danger-text" : "text-text-muted"}`}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4, filter: `blur(${blur.soft})` }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: reduced ? reducedFade : { ...snappy, opacity: enter, filter: enter } }}
                exit={{ opacity: 0, transition: reduced ? reducedFade : exitFast }}
              >
                {status === "error" ? (
                  <span className="truncate">{item.error ?? "Upload failed"}</span>
                ) : (
                  <>
                    <span className="tabular-nums">{sizeText}</span>
                    <CheckDraw draw={!reduced && initialStatus !== "done"} />
                  </>
                )}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="-mr-2 flex items-center justify-end gap-0.5">
        {status === "error" && canRetry && (
          <IconButton label={`Retry ${item.name}`} onClick={onRetry}>
            <path d="M12.5 8a4.5 4.5 0 1 1-1.3-3.2M12.5 3v2.5H10" />
          </IconButton>
        )}
        <IconButton ref={removeRef} label={status === "uploading" ? `Cancel ${item.name}` : `Remove ${item.name}`} onClick={onRemove}>
          <path d="M5 5l6 6M11 5l-6 6" />
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({ label, onClick, children, ref }: { label: string; onClick: () => void; children: ReactNode; ref?: (el: HTMLButtonElement | null) => void }) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`inline-flex size-8 cursor-pointer items-center justify-center rounded-control-sm text-text-muted hover-fine:bg-surface-hover hover-fine:text-text active:bg-surface-active ${pressIcon}`}
    >
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-4">
        {children}
      </svg>
    </button>
  );
}

/** A check that draws itself once, when the upload lands. */
function CheckDraw({ draw }: { draw: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-3.5 shrink-0 text-success-text">
      <motion.path
        d="m3.5 8.5 3 3 6-7"
        initial={draw ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, ease: ease.enter, delay: 0.08 }}
      />
    </svg>
  );
}
