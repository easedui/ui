# Popover

A non-modal panel anchored to a button, built on Base UI Popover and the Eased floating layer.

**Motion signature:** opens from the anchor's transform-origin with a 5px offset toward it, closes at half the distance in 150ms, and because both are transitions a close during the open reverses mid-flight; the trigger presses by colour and never scales.

## Usage

```tsx
import {
  Popover, PopoverTrigger, PopoverContent, PopoverTitle, PopoverDescription, PopoverFooter, PopoverClose,
} from "@/components/eased/popover/popover";

<Popover>
  <PopoverTrigger>Share</PopoverTrigger>
  <PopoverContent align="end">
    <PopoverTitle>Share “Q3 launch plan”</PopoverTitle>
    <PopoverDescription>People you invite can view and comment.</PopoverDescription>
    …
    <PopoverFooter>
      <PopoverClose render={<Button variant="primary" size="sm" className="radius-nested" />}>Done</PopoverClose>
    </PopoverFooter>
  </PopoverContent>
</Popover>
```

Focus moves to the first field on open and back to the trigger on close; Escape and an outside click dismiss.

## Props

- `Popover`: Base UI `Popover.Root` (`open`, `defaultOpen`, `onOpenChange`, `modal`, `actionsRef` …).
- `PopoverTrigger`: an Eased `Button` (which never scales as a trigger). Base UI `Popover.Trigger` props plus the Button's `variant` (`"secondary"`) and `size` (`"sm"`; `"icon-sm"` for a square icon trigger). Pass `render` for a custom trigger and style it with `floatingTrigger`. `openOnHover`, `delay`, `closeDelay` make it a hover-intent trigger.
- `PopoverContent`: `side` (`"bottom"`), `align` (`"center"`), `sideOffset` (6), `alignOffset`, `motion` (override distance, scale, fade, exit), `initialFocus`, `finalFocus`, `container`, `zIndex` (50), `className` (default width `w-80`, capped at the viewport).
- `PopoverTitle`, `PopoverDescription`: label and describe the dialog.
- `PopoverFooter`: a full-bleed sunken action bar; it sets `--pad: 8px`, so buttons using `radius-nested` get a concentric 7px corner.
- `PopoverClose`: Base UI `Popover.Close`.
