# Undo Pill

The never-act-immediately pattern: a destructive action shows a floating pill with a draining ring; Undo reverts it, and only expiry commits it.

## When to use

- Deleting, archiving or moving things people may regret: files, messages, rows. The action looks instant and stays reversible for five seconds.
- Repeated actions in a row: with `useUndoQueue`, everything done while the pill is open joins one batch ("Deleted 3 files") and one Undo restores it all.
- Lists and tables where a confirm dialog on every delete would slow people down.

## When not to use

- Actions that cannot be reversed once they start (sending an email to a list, charging a card): confirm first, with a dialog.
- Confirming a success that needs no action ("Saved"): announce it with a status message instead.
- Errors: show them inline beside what failed.

## Usage

Remove the item from view at once, and commit the real delete only in `onCommit`.

```tsx files.tsx
import { useState } from "react";
import { UndoPill, useUndoQueue } from "@/components/eased/undo-pill/undo-pill";

type File = { id: string; name: string };

export function Files({ initial, remove }: { initial: File[]; remove: (ids: string[]) => Promise<void> }) {
  const [files, setFiles] = useState(initial);
  const queue = useUndoQueue<File>({
    message: (items) => (items.length === 1 ? `Deleted “${items[0].name}”` : `Deleted ${items.length} files`),
    onUndo: (items) => setFiles((current) => [...current, ...items]),
    onCommit: (items) => remove(items.map((f) => f.id)),
  });

  const del = (file: File) => {
    setFiles((current) => current.filter((f) => f.id !== file.id));
    queue.push(file);
  };

  return (
    <div className="relative">
      {/* … the list, with a delete button calling del(file) … */}
      <UndoPill {...queue.pill} />
    </div>
  );
}
```

The pill positions itself in its nearest positioned parent, so give that parent `relative`.

## Examples

### At the top

For layouts with a bottom bar, place it at the top; it then enters from above.

```tsx
<UndoPill {...queue.pill} placement="top" />
```

### Without the hook

Drive it yourself: keep it mounted and toggle `open`, so the exit animates.

```tsx
<UndoPill
  open={pending !== null}
  message={`Archived “${pending?.subject}”`}
  onUndo={() => restore(pending)}
  onExpire={() => commitArchive(pending)}
  duration={8000}
/>
```

## API reference

### UndoPill

| Prop | Type | Default | Description |
|---|---|---|---|
| `open` | `boolean` | | Show the pill. Keep it mounted and toggle this so the exit animates. |
| `message` | `string` | | What happened, e.g. `Deleted "Q3 roadmap.pdf"`. Changing it restarts the countdown. |
| `onUndo` | `() => void` | | Put things back. |
| `onExpire` | `() => void` | | The countdown ran out: commit the destructive action here. |
| `duration` | `number` | `5000` | Countdown length in ms. Changing it while open restarts the countdown. |
| `shortcut` | `boolean` | `true` | Bind ⌘Z / Ctrl+Z to Undo while the pill is open. Ignored while typing in a field. |
| `pauseOnHover` | `boolean` | `true` | Pause the countdown while the pointer is over the pill. |
| `pauseOnFocus` | `boolean` | `true` | Pause the countdown while focus is inside the pill. |
| `onPause` / `onResume` | `() => void` | | Called when hover or focus pauses the countdown, and when it resumes. |
| `placement` | `"bottom" \| "top" \| "none"` | `"bottom"` | Centred at the bottom or top of the positioned parent, or `"none"` to place it yourself. |
| `labels` | `{ undo?: string; shortcut?: (mac: boolean) => string }` | `"Undo"`, `"⌘ Z"` / `"Ctrl Z"` | Translate the button and the shortcut hint. |
| `className` | `string` | | Appended to the pill's classes; placement is kept. |

### useUndoQueue

`useUndoQueue<T>({ message, onUndo?, onCommit? })` returns `{ pending, push, undo, commit, pill }`. `push(item)` adds an item to the open batch; spread `pill` onto `<UndoPill>`.

## Keyboard

| Key | Action |
|---|---|
| `⌘ Z` / `Ctrl Z` | Undo while the pill is open, unless focus is in a text field. |
| `Tab` | Reaches the Undo button; focus inside the pill pauses the countdown. |
| `Enter` / `Space` | Undo, on the focused button. |

## Accessibility

- A `role="status"` live region, mounted before the pill opens, announces the message, so screen readers hear "Deleted Q3 roadmap.pdf" without focus moving.
- Hover and focus pause the countdown, so nobody loses the window while reaching for the button.
- The countdown is driven by a timer, not by the animation, so reduced motion or a global animation clamp never shortens it.

## Motion

The pill rises 12px from below (or drops from above with `placement="top"`) with a blur-to-sharp fade, and its size springs on the smooth spring as the message changes. A new message swaps with y + blur. The ring drains linearly over `duration`. It leaves faster than it came, travelling 6px with a slight scale-down and no overshoot. Reduced motion keeps opacity fades only; the ring still drains.

## Notes for AI

Use Undo Pill for any reversible destructive action in a list or table: remove the item from state immediately, `push` it to `useUndoQueue`, and do the real delete in `onCommit`. Render one pill per surface, inside a `relative` parent, and keep it mounted.

Do not call the delete API before expiry, do not add a confirm dialog on top of it, and do not unmount it on close: toggling `open` is what runs the exit and keeps the live region working.

## Related

- [Button](/components/button): the delete action that opens the pill.
- [Kbd](/components/kbd): the keycaps in the shortcut hint.
- [Sortable Table](/components/sortable-table): a table to pair it with.
