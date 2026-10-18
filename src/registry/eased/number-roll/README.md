# Number Roll

Tabular digits that roll in the direction of change, with Intl formatting and locale-aware separators.

```tsx
import { NumberRoll } from "@/components/eased/number-roll/number-roll";

<NumberRoll value={48210.4} format={{ style: "currency", currency: "USD" }} />
<NumberRoll value={139775.9} locale="hi-IN" format={{ style: "currency", currency: "INR" }} />
```

## Props

| Prop | Type | Default | |
|---|---|---|---|
| `value` | `number` | | The number. |
| `locale` | `Intl.LocalesArgument` | runtime | Grouping, decimal mark and numerals. `locales` is a deprecated alias, kept for one release. |
| `format` | `Intl.NumberFormatOptions` | | Currency, percent, compact, units, fixed decimals. |
| `formatter` | `(value) => string` | | Format it yourself; digits roll, everything else swaps. |
| `direction` | `"auto" \| "up" \| "down"` | `"auto"` | Auto rolls up as the number's size grows, down as it shrinks. |
| `animated` | `boolean` | `true` | False shows changes at once, e.g. while dragging. |
| `transition` | Motion transition | `snappy` | The spring each digit rides. |
| `aria-hidden` | `boolean` | `false` | Hide it when something else announces the value. |

**Motion signature:** every digit is a ten-face cylinder on a snappy spring that turns only in the direction of change, so carries roll forward, interrupted rolls redirect from where they are, and new places fade in from the side they roll from while the rest slide over.
