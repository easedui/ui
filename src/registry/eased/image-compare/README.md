# Image Compare

Two layers of anything, one divider between them: screenshots, two themes of one screen, a plain component next to its Eased twin. Built on the Eased gesture kit and inertia core.

## When to use

- Before and after: a redesign, a photo edit, a renovation, a plain kit next to Eased.
- Showing a state change side by side: a skeleton and the loaded card, light and dark.
- Launch posts and changelogs, where one divider tells the story.

## When not to use

- Comparing numbers or many variants: use a table or Tabs.
- When both sides must stay interactive at once: put them side by side instead.

## Usage

```tsx example.tsx
import { ImageCompare } from "@/components/eased/image-compare/image-compare";

export function Example() {
  return (
    <ImageCompare
      aria-label="Compare the old and new dashboard"
      beforeLabel="Old"
      afterLabel="New"
      className="aspect-video rounded-panel"
      before={<img src="/old.png" alt="" className="size-full object-cover" />}
      after={<img src="/new.png" alt="" className="size-full object-cover" />}
    />
  );
}
```

## Examples

### Two components

Layers can be any element. Both are inert by default, so their buttons are pictures, not controls.

```tsx
<ImageCompare before={<ShareCard variant="plain" />} after={<ShareCard />} beforeLabel="Plain" afterLabel="Eased" />
```

### Vertical, no snapping

```tsx
<ImageCompare orientation="vertical" snap={false} before={…} after={…} />
```

## API reference

### ImageCompare

| Prop | Type | Default | Description |
|---|---|---|---|
| `before` | `ReactNode` | | The layer left of (or above) the divider. |
| `after` | `ReactNode` | | The layer right of (or below) it. It sizes the frame unless the root is sized. |
| `beforeLabel` / `afterLabel` | `ReactNode` | `"Before"` / `"After"` | Tags in the corners; `null` hides one. |
| `value` | `number` | | Divider position 0–100 (controlled). |
| `defaultValue` | `number` | `50` | Uncontrolled start. |
| `onValueChange` | `(value: number) => void` | | Fires when the divider comes to rest. |
| `snap` | `number[] \| false` | `[0, 50, 100]` | Where a flick may rest, in %. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | |
| `interactive` | `boolean` | `false` | Let pointer and keyboard reach the layers. |
| `aria-label` | `string` | `"Compare"` | Names the slider. |
| `className` | `string` | `""` | Size and round the root here. Set `--compare-line` to recolour the line. |

## Keyboard

| Key | Action |
|---|---|
| `Tab` | Focuses the knob. |
| `←` `→` (`↑` `↓` when vertical) | Move 1%; with `Shift`, 10%. |
| `Page Up` / `Page Down` | Move 10%. |
| `Home` / `End` | Jump to 0% or 100%. |

## Accessibility

- The knob is `role="slider"` with `aria-valuetext` such as "62% Plain, 38% Eased", updated as the line moves.
- Both layers are `inert` by default, so duplicated UI is never focusable or read twice; give images real `alt` text if the comparison carries meaning.
- The tags are decorative (`aria-hidden`); the slider's value text names both sides.

## Motion

The top layer is cut with `clip-path` from a MotionValue, so a drag never re-renders. Past an end the line rubber-bands; on release a flick (over 380px/s) coasts on a soft spring to the snap point its momentum reaches, while a slow release rests where it lands unless it is within 3.5% of a snap point. A tap glides the line to the pointer; keys move it on the snappy spring. Under a fine pointer the line leans up to 2% toward the cursor before a drag. Tags fade over 28px as the line passes under them. The knob presses to 0.92 while held and stops 22px short of the ends so it never clips. Reduced motion: no lean, no coast, moves jump.

## Notes for AI

Pick it whenever a before/after or A/B view is wanted, including for components rather than images: pass two complete renders as `before`/`after` and size the root (`aspect-video`, or `flex-1` in a column). Use `defaultValue` and read `onValueChange` only if the position matters to the app.

Do not wrap it in a drag library or add your own pointer handlers to move the line; it already handles drag, flick, tap, keys and resize. Do not put focusable content inside without `interactive`.

## Related

- [Scrub Label](/components/scrub-label): drag a label to change a number.
- [Segmented](/components/segmented): switch between two states instead of revealing both.
