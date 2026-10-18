# Badge

A status or count chip with rolling counts and a breathing live dot.

```tsx
import { Badge } from "@/components/eased/badge/badge";

<Badge tone="success" dot="live">Operational</Badge>
<Badge count={unread} tone="brand" aria-label={`${unread} unread`} />   {/* leaves at 0 */}
<Badge count={4}>Queued</Badge>
```

## Props

| Prop | Type | Default | |
|---|---|---|---|
| `children` | `ReactNode` | | The label. Optional for count-only badges. |
| `count` | `number` | | Rolls when it changes. |
| `max` | `number` | `99` | Above this shows `max+`. |
| `showZero` | `boolean` | `false` | Keep a count-only badge at 0; otherwise it leaves (keep it mounted). |
| `dot` | `boolean \| "live"` | `false` | Status dot; `"live"` breathes every 2.4s. |
| `tone` | `neutral \| brand \| success \| warning \| danger \| info` | `neutral` | Subtle fill with state text. |
| `size` | `"sm" \| "md"` | `"sm"` | 20px or 24px tall. |
| `locale` | `Intl.LocalesArgument` | | Count formatting. |
| `aria-label` | `string` | | Spoken instead of the visible text. |

**Motion signature:** counts roll their digits in the direction of change; a count-only badge pops in from 0.85 on the snappy spring and leaves faster than it came; the live dot's halo breathes slowly, pauses off-screen and stops under reduced motion.
