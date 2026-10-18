# Accordion

Disclosures on Base UI's Accordion (buttons in headings, `aria-expanded`/`aria-controls`, arrow keys, Home/End), animated by Auto Height.

```tsx
import { Accordion, AccordionItem } from "@/components/eased/accordion/accordion";

<Accordion defaultValue={["charged"]}>
  <AccordionItem value="charged" title="When am I charged?">
    On the day your trial ends, then on the same date every month.
  </AccordionItem>
  <AccordionItem value="refund" title="Do you offer refunds?">Within 14 days, in full.</AccordionItem>
</Accordion>
```

| Prop | Type | Default | |
|---|---|---|---|
| `value` / `defaultValue` | `string[]` | | Open items, controlled or uncontrolled. |
| `onValueChange` | `(value: string[]) => void` | | |
| `multiple` | `boolean` | `false` | Allow several open at once. |
| `disabled` | `boolean` | | |
| `AccordionItem` | `value`, `title`, `children`, `headingLevel?` (default 3), `disabled?` | | |

**Motion signature:** the height springs open with no overshoot, the content fades in as the height lands, and the chevron turns on the same spring; closing fades the content first and is quicker than opening.
