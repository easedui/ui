# Text Swap

Change a label, status or short value without a jump.

```tsx
import { TextSwap } from "@/components/eased/text-swap/text-swap";

<p aria-live="polite"><TextSwap direction={dir}>{order.status}</TextSwap></p>
<button><TextSwap swapKey={copied ? "copied" : "copy"}>{copied ? <><Check /> Copied</> : "Copy link"}</TextSwap></button>
```

| Prop | Type | Default | |
|---|---|---|---|
| `children` | `ReactNode` | | Strings and numbers key themselves. |
| `swapKey` | `string \| number` | `children` | Pass when `children` are elements. |
| `direction` | `1 \| -1` | `1` | Use -1 for "back" or a count going down. |
| `animateWidth` | `boolean` | `true` | Spring the width to fit the new text. |
| `initial` | `boolean` | `false` | Animate the first render. |

Reduced motion: a 100ms cross-fade, and the width changes at once. The outgoing copy is hidden from screen readers while it leaves; add `aria-live` on a parent if the change should be announced.

**Motion signature:** text changes with y + blur on a tween kept apart from the spring, travels in the direction of change, and the box springs to the new width.
