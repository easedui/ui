# Progressive Blur

A blur that ramps from nothing to 20px over 80px toward an edge, for sticky headers, bottom bars and composers.

**Motion signature:** six stacked backdrop layers, each double the last one's radius and masked to an overlapping band, so content softens gradually instead of meeting a hard-edged frosted strip; linked to a scroller, the blur fades in only once content is actually underneath it.

## Usage

```tsx
import { ProgressiveBlur } from "@/components/eased/progressive-blur/progressive-blur";

const scroller = useRef<HTMLDivElement>(null);

<div className="relative h-96">
  <div ref={scroller} className="h-full overflow-y-auto pt-12">…</div>
  <ProgressiveBlur side="top" size={72} scrollRef={scroller} />
  <header className="absolute inset-x-0 top-0 h-12">…</header>
</div>
```

Place it as a sibling over the scroller (not inside it, or it scrolls away), in a positioned parent; it pins itself to `side`. Render your header or bar after it. It never takes pointer events. Do not put `opacity`, `filter` or `mask` on it or its ancestors up to the scroller: any of them becomes the backdrop root and the blur goes blank. Strength is applied as each layer's own opacity for that reason.

## Props

| Prop | Default | |
|---|---|---|
| `side` | `"top"` | `"top"`, `"bottom"`, `"left"` or `"right"`: the edge the blur is strongest at. |
| `size` | 80 | Ramp length in px. |
| `maxBlur` | 20 | Blur at the edge, px. |
| `layers` | 6 | More is smoother and costs more GPU. |
| `tint` | true | A surface-coloured scrim under the ramp, so text over busy content stays legible. |
| `scrollRef` | | A ref or the scroller element. Scroll-linked strength: top/left fade in as you scroll away from the start, bottom/right while there is more below. Rows added later re-measure at once. |
| `scrollRange` | `size` | Scroll distance to full strength, px. |
| `strength` | 1 | 0–1 number or MotionValue, when there is no `scrollRef`. |
| `className` | | Position and stacking (e.g. `z-10`). |

Strength follows scroll position directly, with no animation, so reduced motion needs no separate branch. Browsers without `backdrop-filter` show the tint only.
