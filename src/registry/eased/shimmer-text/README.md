# Shimmer Text

A soft band of light sweeps across a label while something is working: "Searching 14 sources…".

```tsx
import { ShimmerText } from "@/components/eased/shimmer-text/shimmer-text";

<ShimmerText>Searching 14 sources…</ShimmerText>
<ShimmerText active={running} className="text-text-secondary">{status}</ShimmerText>
<ShimmerText swap={false}>A paragraph that may wrap onto a second line…</ShimmerText>
```

## Props

| Prop | Type | Default | |
|---|---|---|---|
| `children` | `ReactNode` | | The text. Loading labels end with `…`. |
| `active` | `boolean` | `true` | Turning it off fades the band out where it is (300ms) instead of cutting it mid-sweep. |
| `duration` | `number` | `2.4` | Seconds per cycle: the sweep takes the first 70%, then the band rests off the right edge. |
| `swap` | `boolean` | on for strings | Route changes through Text Swap: the old status lifts and blurs out, the new one rises in, and the box springs to its width with a left-to-right reveal. Swapped text does not wrap; pass `false` for multi-line copy. |
| `className` | `string` | `text-text-muted` | The text colour is the base the band sweeps over. Set `[--shimmer-highlight:…]` to change the band (default the `text` token). |
| `style` | `CSSProperties` | | |

The text stays real text for selection and screen readers; forced-colours mode draws it plain.

**Motion signature:** one 5em band of light, the same width on a short label and a long one, crosses the text on a soft in-out curve every 2.4s; every shimmer on the page shares one phase, so a status that swaps mid-sweep carries the band on, and a finished one lets its band fade where it is. It pauses off-screen; under reduced motion it is plain text.
