# Progress

A progress bar on Base UI Progress, with a rolling value and an indeterminate sweep.

```tsx
import { Progress } from "@/components/eased/progress/progress";

<Progress label="Launch film final.mov" value={sent} max={842} />
<Progress label="Processing" value={null} />
<Progress label="Storage" value={7.4} max={10} format={{ style: "unit", unit: "gigabyte" }} size="sm" />
```

## Props

| Prop | Type | Default | |
|---|---|---|---|
| `value` | `number \| null` | | `null` is indeterminate. |
| `min` / `max` | `number` | `0` / `100` | |
| `label` | `ReactNode` | | Visible label and accessible name (else `aria-label`). |
| `showValue` | `boolean` | `true` | The rolling value; hidden while indeterminate. |
| `format` / `locale` | Intl options | percent | Formats the shown and spoken value. |
| `getAriaValueText` | `(formatted, value) => string` | | Spoken value. |
| `size` | `"sm" \| "md"` | `"md"` | 4px or 6px track. |
| `successOnComplete` | `boolean` | `true` | Bar turns success-green at `max`. |

**Motion signature:** the bar rides the smooth spring (no overshoot, so it never reads past the real value) as a full-width bar sliding in from the left, so its rounded end never squashes; the value rolls; an unknown length sweeps a 40% segment on an accelerate–decelerate curve and hands over to the bar the moment a value arrives. Reduced motion: the bar jumps and the sweep becomes a static tint.
