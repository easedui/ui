# Textarea

A textarea that grows with its text, on Base UI's Field.Control.

```tsx
import { Textarea } from "@/components/eased/textarea/textarea";

<Field label="Reply">
  <Textarea value={text} onValueChange={setText} maxLength={280} minRows={2} maxRows={6} />
</Field>
```

| Prop | Type | Default | |
|---|---|---|---|
| `minRows` | `number` | `3` | Height when empty. |
| `maxRows` | `number` | `8` | Grows to this, then scrolls. |
| `onValueChange` | `(value: string) => void` | | Every change. |
| `maxLength` | `number` | | Native limit; turns the counter on. |
| `showCount` | `boolean` | `maxLength !== undefined` | The `count/max` counter. |
| `invalid` | `boolean` | | For use outside a Field. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Type size, radius and padding, matching Input. |
| `className`, `controlClassName` | `string` | | Shell and `<textarea>`. |

Plus every `<textarea>` prop. The counter is hidden from screen readers; a status line announces only "approaching the limit" and "limit reached".

**Motion signature:** it autosizes on a smooth height spring instead of jumping a line at a time, and the character counter rolls its digits and turns warning-coloured at 90%.
