# Spinner

A quarter arc turning on a faint ring: the eased.dev status-badge mark.

```tsx
import { Spinner } from "@/components/eased/spinner/spinner";

<Spinner />                                  {/* role="status", "Loading" */}
<button><Spinner size="sm" label={false} className="text-current" /> Saving…</button>
```

## Props

| Prop | Type | Default | |
|---|---|---|---|
| `size` | `"sm" \| "md" \| "lg" \| number` | `"md"` | `sm` 14px beside 12px text, `md` 16px beside 13–14px, `lg` 20px beside 16px, or any diameter in px (the one numeric `size` in Eased). The ring scales with it. |
| `label` | `string \| false` | `"Loading"` | Announced name; `false` when visible text already says it. |
| `className` | `string` | `text-text-muted` | Colour comes from `currentColor`. |

**Motion signature:** one linear turn every 900ms on the compositor, so it keeps spinning while the main thread is busy; it pauses while off-screen, and under reduced motion the arc freezes in place. Button and Search Field render this same spinner.
