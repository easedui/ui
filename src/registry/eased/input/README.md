# Input

A text input on Base UI's Input.

```tsx
import { Input } from "@/components/eased/input/input";

<Field label="URL" validate={checkSlug} validationMode="onChange">
  <Input start="eased.dev/" value={slug} onValueChange={setSlug} />
</Field>
<Input aria-label="Amount" end="EUR" invalid={tooHigh} />
```

| Prop | Type | Default | |
|---|---|---|---|
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 32, 36 or 40px. |
| `start`, `end` | `ReactNode` | | Leading and trailing addons (icon, prefix, unit, button). |
| `invalid` | `boolean` | | For use outside a Field; inside one, the field's validity drives it. |
| `className` | `string` | | The bordered shell. |
| `controlClassName` | `string` | | The `<input>`. |

Plus every Base UI Input prop (`value`, `defaultValue`, `onValueChange`, `type` …). Text is 16px on touch screens so iOS never zooms on focus.

**Motion signature:** focus firms the border one step and a soft glow grows around it; an error does one 6px horizontal shake, then the message opens with a height spring.
