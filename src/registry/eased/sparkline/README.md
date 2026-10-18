# Sparkline

A word-sized line chart that fills its container's width.

```tsx
import { Sparkline } from "@/components/eased/sparkline/sparkline";

<Sparkline values={signups} label="Signups, last 30 days" />
<Sparkline values={visitors} label="Visitors" height={56} area interactive format={(v) => fmt.format(v)} formatIndex={(i) => dates[i]} />
```

## Props

| Prop | Type | Default | |
|---|---|---|---|
| `values` | `number[]` | | Oldest first, evenly spaced. |
| `label` | `string` | | Accessible name; a first/last/low/high summary is appended. |
| `color` | `string` | `var(--eased-chart-1)` | Any colour token, or `chartColor(n)`. |
| `height` | `number` | `32` | Pixels. |
| `area` | `boolean` | `false` | A soft wash under the line. |
| `dot` | `boolean` | `true` | The newest point, ringed in the surface colour (set `--chart-surface` on a different background). |
| `curve` | `"monotone" \| "linear"` | `"monotone"` | |
| `zero` | `boolean` | `false` | Include zero in the range. |
| `interactive` | `boolean` | `false` | Scrub for a readout; the sparkline becomes a keyboard slider. |
| `format` / `formatIndex` | functions | | Readout and screen-reader text. |
| `onActiveChange` | `(index \| null) => void` | | |

**Motion signature:** draws in left to right the first time it scrolls into view, then the newest point settles in as a ringed dot; new values morph the line from the shape on screen instead of redrawing it.
