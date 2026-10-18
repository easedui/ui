# Radio Group

Radios and radio cards on Base UI's RadioGroup: one tab stop, arrow keys move and select, form submission through `name`, Field validation.

```tsx
import { Radio, RadioCard, RadioCards, RadioGroup } from "@/components/eased/radio-group/radio-group";

<RadioGroup aria-label="Drop-off" defaultValue="door">
  <Radio value="door">Leave it at the door</Radio>
  <Radio value="hand" description="We text you 10 minutes before we arrive.">Hand it to me</Radio>
</RadioGroup>

<RadioCards aria-label="Delivery speed" value={speed} onValueChange={setSpeed}>
  <RadioCard value="standard" title="Standard" meta="Free" description="Arrives Fri, Oct 23" />
  <RadioCard value="express" title="Express" meta="$12.00" description="Arrives Wed, Oct 21" />
</RadioCards>
```

| Component | Props | |
|---|---|---|
| `RadioGroup` / `RadioCards` | `value`, `defaultValue`, `onValueChange`, `name`, `disabled`, `required`, `aria-label`/`aria-labelledby` | `RadioCards` adds `columns: 1 \| 2 \| 3` (container-query responsive). |
| `Radio` | `value`, `children` (label), `description?`, `disabled?` | The whole row is the hit target. |
| `RadioCard` | `value`, `title`, `description?`, `meta?`, `icon?`, `disabled?` | |

Explain a disabled option in its description rather than a tooltip.

**Motion signature:** the dot scales out from the centre on the snappy spring and leaves faster than it came; on cards, the selected border is one highlight that travels between cards (rows share a height, so it only ever translates).
