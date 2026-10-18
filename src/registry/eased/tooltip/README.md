# Tooltip

A short visual label for mouse and keyboard users, built on Base UI Tooltip.

**Motion signature:** the first tooltip in a group waits 400ms and the rest appear instantly, with no animation, while you sweep; each enters 3px toward its trigger from the trigger's origin and never shows on touch.

## Usage

```tsx
import { Tooltip, TooltipProvider } from "@/components/eased/tooltip/tooltip";

<TooltipProvider>
  <Tooltip content="Bold" shortcut={["⌘", "B"]}>
    <button aria-label="Bold">…</button>
  </Tooltip>
</TooltipProvider>
```

Wrap a toolbar (or your app) in one `TooltipProvider` so neighbouring tooltips share a delay group. The child is the trigger: one focusable element that accepts a ref, with an `aria-label` matching `content`. Tooltips are supplementary; anything a touch or screen reader user needs belongs in the UI or a Popover.

## Props

`TooltipProvider`: `delay` (400), `closeDelay` (0), `timeout` (400, the window in which the next tooltip opens instantly).

`Tooltip`:

| Prop | Default | |
|---|---|---|
| `content` | | The label. |
| `shortcut` | | `["⌘", "B"]`, or `"Esc"` for one key: Eased `Kbd` caps after the label, hidden from screen readers. |
| `children` | | The trigger element. |
| `side` / `align` | `"top"` / `"center"` | Flips on collision; the enter direction follows. |
| `sideOffset` | 6 | Gap in px. |
| `delay` / `closeDelay` | provider's | Rest time before opening and grace after leaving, ms. |
| `closeOnClick` | true | |
| `open` / `defaultOpen` / `onOpenChange` | | Controlled or uncontrolled. |
| `zIndex` | 50 | Raise it inside a higher layer such as a dialog. |
| `disabled`, `className` | | |
