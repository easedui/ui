"use client";

import { useState, type ReactNode } from "react";
import { DemoFrame } from "../lib/demo-frame";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

const FORMATS = [
  { value: "bold", label: "Bold", icon: <path d="M4.5 3h4.25a2.5 2.5 0 0 1 0 5H4.5zM4.5 8h5a2.5 2.5 0 0 1 0 5h-5z" /> },
  { value: "italic", label: "Italic", icon: <path d="M10 3H6.5M9.5 13H6M9 3 7 13" /> },
  { value: "underline", label: "Underline", icon: <path d="M4.5 2.5v4.5a3.5 3.5 0 0 0 7 0V2.5M3.5 13.5h9" /> },
  { value: "strike", label: "Strikethrough", icon: <path d="M3 8h10M10.75 4.25C10.3 3.3 9.3 2.75 8 2.75c-1.8 0-3 .9-3 2.25 0 .9.6 1.6 1.6 2M5 11.5c.45 1.1 1.55 1.75 3 1.75 1.9 0 3.1-.95 3.1-2.4 0-.55-.15-1-.45-1.35" /> },
];

const ALIGNS = [
  { value: "left", label: "Align left", icon: <path d="M2.5 3.5h11M2.5 6.5h7M2.5 9.5h11M2.5 12.5h7" /> },
  { value: "center", label: "Align centre", icon: <path d="M2.5 3.5h11M4.5 6.5h7M2.5 9.5h11M4.5 12.5h7" /> },
  { value: "right", label: "Align right", icon: <path d="M2.5 3.5h11M6.5 6.5h7M2.5 9.5h11M6.5 12.5h7" /> },
  { value: "justify", label: "Justify", icon: <path d="M2.5 3.5h11M2.5 6.5h11M2.5 9.5h11M2.5 12.5h11" /> },
];

const ALIGN_CLASS: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
  justify: "text-justify",
};

const DECORATION: Record<string, string> = {
  "false-false": "",
  "true-false": "underline",
  "false-true": "line-through",
  "true-true": "[text-decoration-line:underline_line-through]",
};

export function ToggleGroupDemo() {
  const [formats, setFormats] = useState<string[]>(["bold"]);
  const [align, setAlign] = useState<string[]>(["left"]);
  const on = (f: string) => formats.includes(f);

  return (
    <DemoFrame title="Release notes" meta="Draft">
      <div className="flex flex-wrap items-center gap-2 border-b border-line-subtle px-4 py-2.5">
        <ToggleGroup multiple aria-label="Text formatting" value={formats} onValueChange={setFormats}>
          {FORMATS.map((f) => (
            <ToggleGroupItem key={f.value} value={f.value} aria-label={f.label}>
              <Icon>{f.icon}</Icon>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <span aria-hidden className="mx-1 h-5 w-px bg-line-subtle" />
        <ToggleGroup aria-label="Alignment" value={align} onValueChange={(v) => v.length && setAlign(v)}>
          {ALIGNS.map((a) => (
            <ToggleGroupItem key={a.value} value={a.value} aria-label={a.label}>
              <Icon>{a.icon}</Icon>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <p className="mb-2 text-ui-xs text-text-muted">v2.14 · Oct 17</p>
        <p
          className={`text-ui-md text-text text-pretty ${ALIGN_CLASS[align[0] ?? "left"]} ${on("bold") ? "font-semibold" : ""} ${
            on("italic") ? "italic" : ""
          } ${DECORATION[`${on("underline")}-${on("strike")}`]} decoration-text-muted underline-offset-3`}
        >
          Checkout now remembers your shipping address between sessions.
        </p>
        <p className="mt-3 text-ui text-text-secondary text-pretty">
          Saved cards now show their expiry month, and a declined payment keeps everything you typed, so a retry is one
          tap.
        </p>
        <p className="mt-4 text-ui-xs font-medium text-text-muted uppercase tracking-caps">Fixed</p>
        <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-4 text-ui text-text-secondary marker:text-text-muted">
          <li>Promo codes no longer reset when you change the quantity.</li>
          <li>Order emails show the delivery window in your time zone.</li>
        </ul>
      </div>
    </DemoFrame>
  );
}
