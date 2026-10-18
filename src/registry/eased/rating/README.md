# Rating

A star rating with a hover preview, optional half steps and a read-only display mode, on Base UI's RadioGroup. Bring your own icon for hearts, flames or anything that paints with `currentColor`.

## When to use

- Asking for a quick judgement: rate an order, a recipe, a support conversation.
- Showing an average next to a count, read-only, with any fraction (4.3 fills 30% of the fifth star).
- Review rows, where each review carries its own small read-only rating.

## When not to use

- Yes/no or thumbs feedback: use a [Like Button](/components/like-button) or two buttons.
- Precise scores (1–10, NPS): use a [Segmented](/components/segmented) control or a [Slider](/components/slider).
- Picking one of several named options: use a [Radio Group](/components/radio-group).

## Usage

```tsx rate-order.tsx
import { useState } from "react";
import { Rating } from "@/components/eased/rating/rating";

export function RateOrder() {
  const [rating, setRating] = useState(0);
  return <Rating aria-label="Rate your order" value={rating} onValueChange={setRating} clearable />;
}
```

## Examples

### Read-only average

```tsx
<Rating readOnly value={4.3} size="sm" />
```

### Half steps

Each star has a left and a right half; arrow keys step by 0.5.

```tsx
<Rating aria-label="Rate this film" allowHalf defaultValue={3.5} name="rating" />
```

### A custom icon and colour

```tsx
<Rating
  aria-label="How spicy?"
  icon={<FlameIcon />}
  className="[--rating:var(--eased-danger)]"
  max={3}
/>
```

### Show a word for the rating

`onHoverChange` reports the previewed value, so a label can follow the pointer.

```tsx
const WORDS = ["", "Not for me", "Could be better", "Good", "Really good", "Loved it"];
<Rating value={v} onValueChange={setV} onHoverChange={setHover} />
<span>{WORDS[Math.round(hover ?? v)]}</span>
```

## API reference

### Rating

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `number` | | The rating, 0 for none (controlled). |
| `defaultValue` | `number` | `0` | The starting rating (uncontrolled). |
| `onValueChange` | `(value: number) => void` | | |
| `onHoverChange` | `(value: number \| null) => void` | | The previewed rating, `null` when the pointer leaves. |
| `max` | `number` | `5` | How many icons. |
| `allowHalf` | `boolean` | `false` | Half steps. |
| `clearable` | `boolean` | `false` | Choosing the current rating again clears it to 0. |
| `readOnly` | `boolean` | `false` | Display any fraction; no focus stops; read as one image. |
| `disabled` | `boolean` | `false` | |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 16, 20 or 28px icons. |
| `icon` | `ReactNode` | a rounded star | An SVG that paints with `currentColor`. |
| `getLabel` | `(value: number) => string` | `` `4 stars` `` | Each step's accessible name. |
| `name` | `string` | | Submits the value with a form. |
| `aria-label` / `aria-labelledby` | `string` | | Name the group. In `readOnly`, `aria-label` replaces "Rated 4.3 out of 5". |
| `className` / `style` | | | On the root. Set `--rating` (fill) and `--rating-empty` to recolour. |

## Keyboard

| Key | Action |
|---|---|
| `Tab` | Moves focus to the selected step (or the first); the rating is one tab stop. |
| `←` / `→` (`↑` / `↓`) | Selects the previous or next step: whole stars, or halves with `allowHalf`. |
| `Space` | Selects the focused step; with `clearable`, on the current one it clears. |

## Accessibility

- Interactive: Base UI renders a `radiogroup` with one `radio` per step ("3 stars", "3.5 stars"), so screen readers announce the choice and its position. Name it with `aria-label` or `aria-labelledby`.
- Read-only: one `img` named "Rated 4.3 out of 5", so a row of stars is read once, not five times.
- The focus ring is drawn around the whole icon, whichever half has focus.
- The pointer preview is mouse-only; on touch a tap commits at once.

## Motion

Pointing previews the rating: fills slide to the pointer by clip-path in 150ms. Choosing a higher rating fills from the left and each icon that gained fill rises to 1.2 in 100ms and settles on the bouncy spring, 35ms after the one before; a lower rating gives its new last icon a small snappy nudge instead. Every pop is interruptible. Reduced motion: no pops, and fills change in place.

## Notes for AI

Use Rating for star-style feedback and for showing averages: interactive with `value`/`onValueChange` (or `name` in a form), or `readOnly` for display with any fraction. Pair a read-only average with a count in text; use `size="lg"` when the rating is the main question on the screen.

Don't build a row of star buttons yourself or add your own hover state, pop or labels: the component handles preview, keyboard, focus and announcements. Don't use a read-only Rating as an input.

## Related

- [Like Button](/components/like-button): a single yes for media and posts.
- [Radio Group](/components/radio-group): named single choices.
- [Slider](/components/slider): precise numeric scores.
