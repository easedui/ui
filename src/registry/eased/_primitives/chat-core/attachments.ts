"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ChatFilePart } from "./types";

/* ---------- The model ---------------------------------------------------------- */

export type AttachmentKind = "image" | "file";
export type AttachmentStatus = "uploading" | "done" | "error";

/** One attachment in a composer or a sent message. Plain data: store it anywhere. */
export type Attachment = {
  id: string;
  name: string;
  /** `image` shows a thumbnail; everything else is a file chip. */
  kind: AttachmentKind;
  /** MIME type, e.g. `image/png`, `application/pdf`. */
  mediaType: string;
  /** Bytes. */
  size?: number;
  /** Where the file lives once uploaded (or a `data:` URL). Sent as the `file` part's `url`. */
  url?: string;
  /** A local preview for images while they upload (an object URL). */
  previewUrl?: string;
  /** Default `done`. */
  status?: AttachmentStatus;
  /** Upload progress 0–1 while `uploading`; leave it out when unknown (the ring spins). */
  progress?: number;
  /** Shown under the name when `status` is `error`, e.g. "Over 20 MB". */
  error?: string;
  /** The original file, when it came from the user's device. */
  file?: File;
};

export const kindOf = (mediaType: string): AttachmentKind => (mediaType.startsWith("image/") ? "image" : "file");

let counter = 0;
const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `att-${Date.now()}-${++counter}`);

/** An attachment for a picked, dropped or pasted file. Images get an object-URL preview: call `releaseAttachment` when done. */
export function attachmentFromFile(file: File, status: AttachmentStatus = "uploading"): Attachment {
  const mediaType = file.type || "application/octet-stream";
  const kind = kindOf(mediaType);
  return {
    id: newId(),
    name: file.name || (kind === "image" ? "Pasted image" : "File"),
    kind,
    mediaType,
    size: file.size,
    previewUrl: kind === "image" ? URL.createObjectURL(file) : undefined,
    status,
    file,
  };
}

/** Frees an attachment's object-URL preview. */
export function releaseAttachment(a: Attachment) {
  if (a.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(a.previewUrl);
}

/** `1.2 MB`, `840 KB`, with a no-break space. */
export function formatBytes(bytes: number, locale?: Intl.LocalesArgument) {
  if (bytes < 1000) return `${new Intl.NumberFormat(locale).format(bytes)}\u00a0${bytes === 1 ? "byte" : "bytes"}`;
  const units = ["byte", "kilobyte", "megabyte", "gigabyte"] as const;
  let i = 0;
  let n = bytes;
  while (n >= 1000 && i < units.length - 1) {
    n /= 1000;
    i++;
  }
  return new Intl.NumberFormat(locale, { style: "unit", unit: units[i], unitDisplay: "short", maximumFractionDigits: n < 10 && i > 0 ? 1 : 0 })
    .format(n)
    .replace(" ", " ");
}

/** The short type label for a file chip: `PDF`, `CSV`, `ZIP`. */
export function fileTypeLabel(a: Pick<Attachment, "name" | "mediaType">) {
  const ext = a.name.includes(".") ? a.name.split(".").pop() : undefined;
  return (ext || a.mediaType.split("/").pop() || "file").slice(0, 4).toUpperCase();
}

/** An AI SDK `file` part for a finished attachment (`sendMessage({ text, files })`). Returns null until it has a URL. */
export function toFilePart(a: Attachment): ChatFilePart | null {
  const url = a.url ?? (a.status === "done" || a.status === undefined ? a.previewUrl : undefined);
  return url ? { type: "file", mediaType: a.mediaType, filename: a.name, url } : null;
}

/** The reverse: an attachment to render a sent `file` part. */
export function fromFilePart(part: ChatFilePart, id = part.url): Attachment {
  return { id, name: part.filename ?? "Attachment", kind: kindOf(part.mediaType), mediaType: part.mediaType, url: part.url, status: "done" };
}

/* ---------- useAttachments ---------------------------------------------------- */

/** Uploads one file. Report progress 0–1; resolve with where it now lives. Respect `signal`. */
export type UploadFn = (file: File, ctx: { onProgress: (fraction: number) => void; signal: AbortSignal }) => Promise<{ url: string }>;

export type UseAttachmentsOptions = {
  /** Upload each file as it is added. Without it, files are kept locally (`done`, previewed by object URL). */
  upload?: UploadFn;
  /** Same syntax as `<input accept>`, e.g. `"image/*,.pdf"`. Files that do not match are rejected. */
  accept?: string;
  /** Bytes; larger files are added with an error so the user sees why. */
  maxSize?: number;
  /** Extra files past this are dropped and reported through `onReject`. */
  maxFiles?: number;
  /** Called with files that were refused, and why. */
  onReject?: (rejected: { file: File; reason: "type" | "count" }[]) => void;
  /** Controlled list. Pair with `onChange`. */
  value?: Attachment[];
  defaultValue?: Attachment[];
  onChange?: (attachments: Attachment[]) => void;
};

export function matchesAccept(file: File, accept?: string) {
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

/**
 * The attachment state machine for a composer: add (pick, drop, paste), upload with progress,
 * cancel on remove, retry on error, and clear after sending. Object-URL previews are freed
 * when an attachment leaves the list and on unmount.
 */
export function useAttachments({ upload, accept, maxSize, maxFiles, onReject, value, defaultValue, onChange }: UseAttachmentsOptions = {}) {
  const [inner, setInner] = useState<Attachment[]>(defaultValue ?? []);
  const attachments = value ?? inner;
  const list = useRef(attachments);
  const controllers = useRef(new Map<string, AbortController>());
  const latest = useRef({ upload, onChange, controlled: value !== undefined });
  useLayoutEffect(() => {
    list.current = attachments;
    latest.current = { upload, onChange, controlled: value !== undefined };
  });

  const commit = useCallback((next: Attachment[]) => {
    for (const a of list.current) if (!next.some((n) => n.id === a.id)) releaseAttachment(a);
    list.current = next;
    if (!latest.current.controlled) setInner(next);
    latest.current.onChange?.(next);
  }, []);

  const patch = useCallback(
    (id: string, changes: Partial<Attachment>) => {
      if (!list.current.some((a) => a.id === id)) return;
      commit(list.current.map((a) => (a.id === id ? { ...a, ...changes } : a)));
    },
    [commit],
  );

  const start = useCallback(
    (a: Attachment) => {
      const fn = latest.current.upload;
      if (!fn || !a.file) return;
      const controller = new AbortController();
      controllers.current.set(a.id, controller);
      let last = 0;
      fn(a.file, {
        signal: controller.signal,
        onProgress: (fraction) => {
          // Throttle to visible steps; the ring springs between them.
          if (controller.signal.aborted || (fraction - last < 0.01 && fraction < 1)) return;
          last = fraction;
          patch(a.id, { progress: Math.min(1, Math.max(0, fraction)) });
        },
      }).then(
        ({ url }) => {
          controllers.current.delete(a.id);
          if (!controller.signal.aborted) patch(a.id, { status: "done", progress: 1, url, error: undefined });
        },
        (err: unknown) => {
          controllers.current.delete(a.id);
          if (!controller.signal.aborted) patch(a.id, { status: "error", error: err instanceof Error ? err.message : "Upload failed" });
        },
      );
    },
    [patch],
  );

  const add = useCallback(
    (files: Iterable<File> | ArrayLike<File>) => {
      const incoming = Array.from(files);
      const rejected: { file: File; reason: "type" | "count" }[] = [];
      const room = maxFiles === undefined ? Infinity : Math.max(0, maxFiles - list.current.length);
      const added: Attachment[] = [];
      for (const file of incoming) {
        if (!matchesAccept(file, accept)) rejected.push({ file, reason: "type" });
        else if (added.length >= room) rejected.push({ file, reason: "count" });
        else {
          const tooBig = maxSize !== undefined && file.size > maxSize;
          const a = attachmentFromFile(file, tooBig ? "error" : latest.current.upload ? "uploading" : "done");
          if (tooBig) a.error = `Over ${formatBytes(maxSize!)}`;
          added.push(a);
        }
      }
      if (rejected.length) onReject?.(rejected);
      if (!added.length) return [];
      commit([...list.current, ...added]);
      for (const a of added) if (a.status === "uploading") start(a);
      return added;
    },
    [accept, maxFiles, maxSize, onReject, commit, start],
  );

  const remove = useCallback(
    (id: string) => {
      controllers.current.get(id)?.abort();
      controllers.current.delete(id);
      commit(list.current.filter((a) => a.id !== id));
    },
    [commit],
  );

  const retry = useCallback(
    (id: string) => {
      const a = list.current.find((x) => x.id === id);
      if (!a?.file || !latest.current.upload) return;
      if (maxSize !== undefined && a.file.size > maxSize) return;
      const next = { ...a, status: "uploading" as const, progress: undefined, error: undefined };
      commit(list.current.map((x) => (x.id === id ? next : x)));
      start(next);
    },
    [commit, start, maxSize],
  );

  /** Empties the list after a send. Previews are kept alive for `keepPreviews` (the sent message may still show them). */
  const clear = useCallback(
    ({ keepPreviews = true }: { keepPreviews?: boolean } = {}) => {
      for (const c of controllers.current.values()) c.abort();
      controllers.current.clear();
      if (keepPreviews) list.current = [];
      commit([]);
    },
    [commit],
  );

  useEffect(() => {
    const ctrl = controllers.current;
    return () => {
      for (const c of ctrl.values()) c.abort();
      for (const a of list.current) releaseAttachment(a);
    };
  }, []);

  const uploading = attachments.some((a) => a.status === "uploading");
  const failed = attachments.some((a) => a.status === "error");

  return {
    attachments,
    add,
    remove,
    retry,
    clear,
    update: patch,
    /** True while any file is still uploading: hold Send until it is false. */
    uploading,
    /** True when any file failed: Send skips those files. */
    failed,
    /** The finished attachments as AI SDK `file` parts. */
    fileParts: attachments.map(toFilePart).filter((p): p is ChatFilePart => p !== null),
  };
}
