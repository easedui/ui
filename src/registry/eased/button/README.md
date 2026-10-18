# Button

A button on Base UI's Button whose press scale follows its width, whose label swaps with y + blur while the width springs, and whose loading state keeps its width.

## When to use

- Any action on the page: save, send, open, delete. One `primary` per region marks the main one.
- Labels that change after the action ("Save" → "Saved"): the swap and the width spring are built in.
- Async work: `loading` overlays Eased's Spinner without moving anything around it.
- Square icon actions in toolbars and rows, with `size="icon-sm"` and an `aria-label`.

## When not to use

- Navigation to another page: use a link (`<Link>`), or pass `render={<Link href="…" />}` so it still looks like a button.
- Choosing one of a few options: use [Segmented](/components/segmented) or [Toggle Group](/components/toggle-group).
- An action that needs a second chance: pair the button with [Undo Pill](/components/undo-pill) instead of a confirm step, unless it cannot be reversed.

## Usage

```tsx save-button.tsx
import { Button } from "@/components/eased/button/button";

export function SaveButton({ pending, saved, onSave }: { pending: boolean; saved: boolean; onSave: () => void }) {
  return (
    <Button variant="primary" loading={pending} onClick={onSave}>
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
```

## Examples

### Icon button

Square, with a 44×44 tap target around the 32px visual. Name it with `aria-label`.

```tsx
<Button variant="ghost" size="icon-sm" aria-label="Copy link">
  <LinkIcon />
</Button>
```

### Popover trigger

Triggers that anchor a popup never scale, so the popup's origin stays put. Passing the button as `render` is enough: `aria-haspopup` turns the scale off.

```tsx
<Popover.Trigger render={<Button />}>Share</Popover.Trigger>
```

### Swapping element labels

String labels swap on their own. When `children` are elements, give each state a `swapKey`.

```tsx
<Button swapKey={copied ? "copied" : "copy"}>
  {copied ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy</>}
</Button>
```

## API reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `"primary" \| "secondary" \| "ghost" \| "danger" \| "danger-solid"` | `"secondary"` | One `primary` per region. `danger` is outlined; `danger-solid` is for the final confirm step only. |
| `size` | `"sm" \| "md" \| "lg" \| "icon-sm" \| "icon" \| "icon-lg"` | `"md"` | 32, 36 and 40px; icon sizes are square. |
| `loading` | `boolean` | `false` | Eased's `Spinner` over a transparent label: width kept, focus kept, clicks ignored, `aria-busy`. |
| `swapKey` | `string \| number` | | Swap the label when `children` are elements. String labels swap on their own. |
| `scaleOnPress` | `boolean` | `true` | Off automatically for `aria-haspopup` triggers. |
| `hitArea` | `boolean` | `true` for `icon-sm` | 44×44 tap target around a small button. Pass `false` when the button sits beside other targets (toolbars, rows), so the extended area does not cover them. |

Plus every Base UI Button prop (`disabled`, `focusableWhenDisabled`, `render` …). `type` defaults to `"button"`.

## Keyboard

| Key | Action |
|---|---|
| `Enter` / `Space` | Activates the button. Ignored while `loading`. |
| `Tab` | Moves focus to the button, including while `loading`, and while disabled with `focusableWhenDisabled`. |

## Accessibility

- A native `<button>` with `type="button"` unless you say otherwise; Base UI keeps `disabled` buttons focusable when asked, so a tooltip or reason can still be read.
- `loading` sets `aria-busy` and keeps the label in the accessible name, so the button never goes nameless while the spinner shows.
- Content inside a button is not announced when it changes. Announce "Saved" with your own `role="status"` region.
- Icon-only sizes need an `aria-label`; `icon-sm` gets a 44×44 hit area by default.

## Motion

The press scale follows the width: 0.96 for icon buttons, 0.97 for text buttons and 0.985 past 220px, pressed down in 100ms and released on the snappy spring. A label change swaps with y + blur (out 3px up, in from 4px below) while the width springs to fit. Loading keeps the width, so the button never jumps. Reduced motion keeps the colour changes and drops the scale and the swap travel.

## Notes for AI

Reach for Button for every in-page action, and set `variant="primary"` on only the main action in a region. For async work, pass `loading` rather than disabling the button or swapping in a spinner yourself; for a confirmed state, change the string child and let the swap run.

Do not wrap it in another pressable element, add your own `transition-*` or `active:scale-*` classes, or animate its width: the component already owns press, swap and width. Use `render={<Link />}` for navigation instead of nesting a link inside it.

## Related

- [Spinner](/components/spinner): the loading indicator Button overlays.
- [Undo Pill](/components/undo-pill): the undo window for destructive buttons.
- [Segmented](/components/segmented): when the choice is one of a few options, not an action.
