# Number Field

A number input on Base UI's NumberField, with steppers that repeat and speed up while held, digits that roll on every step through NumberRoll, and Intl formatting with the true minus sign.

## When to use

- Quantities, prices, percentages and limits typed into a form.
- Values people nudge more than they type: seats, copies, a stop-loss percentage.
- A compact quantity control in a cart (`layout="split"`).

## When not to use

- Picking from a wide continuous range by feel: use a [Slider](/components/slider).
- Precise scrubbing with ticks and inertia, as in a design tool: use [Scrub Label](/components/scrub-label).
- Identifiers that happen to be digits (a ZIP code, a card number): use an [Input](/components/input).

## Usage

```tsx example.tsx
import { useState } from "react";
import { NumberField } from "@/components/eased/number-field/number-field";

export function Example() {
  const [seats, setSeats] = useState<number | null>(5);
  return <NumberField label="Seats" value={seats} onValueChange={setSeats} min={1} max={250} />;
}
```

## Examples

### Currency and percent

`format` takes `Intl.NumberFormatOptions`; typed text parses in the same locale.

```tsx
<NumberField label="Limit price" format={{ style: "currency", currency: "USD" }} step={0.05} min={0} />
<NumberField label="Stop loss" format={{ style: "percent", maximumFractionDigits: 1 }} step={0.005} min={-0.2} max={0} scrub />
```

### Split steppers

The value centres between − and +, for quantities.

```tsx
<NumberField label="Quantity" layout="split" defaultValue={1} min={1} max={10} />
```

## API reference

### NumberField

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `number \| null` | | Controlled value; `null` is empty. |
| `defaultValue` | `number \| null` | `null` | Uncontrolled starting value. |
| `onValueChange` | `(value: number \| null) => void` | | Every change: typing, each stepper repeat, arrows, scrubbing. |
| `min` / `max` | `number` | | Clamp steps and committed values. The stepper at a bound disables. |
| `step` | `number` | `1` | One press, arrow or scrub tick. |
| `largeStep` / `smallStep` | `number` | `step × 10` / `step ÷ 10` | With Shift / Alt held (keys, steppers and PageUp/PageDown). |
| `format` | `Intl.NumberFormatOptions` | | Currency, percent, units, fixed decimals. |
| `locale` | `string` | runtime | Formatting and parsing. |
| `label` | `ReactNode` | | A visible label. Leave it out inside a Field with its own label. |
| `scrub` | `boolean` | `false` | Drag the label sideways to change the value. Needs `label`. |
| `layout` | `"end" \| "split"` | `"end"` | Steppers together at the end, or around a centred value. |
| `start` | `ReactNode` | | Leading content in the box (not in `split`). |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 32, 36 or 40px. |
| `animated` | `boolean` | `true` | Roll digits on steps. |
| `incrementLabel` / `decrementLabel` | `string` | "Increase" / "Decrease" | Stepper names. |
| `className` / `groupClassName` | `string` | `""` | The root, and the bordered box. |

Base UI's other NumberField.Root props pass through: `name`, `required`, `disabled`, `readOnly`, `allowWheelScrub`, `snapOnStep`, `allowOutOfRange`, `onValueCommitted`, `id`.

## Keyboard

| Key | Action |
|---|---|
| `↑` / `↓` | Step up or down (`Shift`: large step, `Alt`: small step). Arrows don't round to the step's decimals; pass `snapOnStep` to land on multiples of `step`. |
| `PageUp` / `PageDown` | Large step. |
| `Home` / `End` | Jump to `min` / `max`. |
| Typing | Edits the text; it is parsed as you type and formatted on blur. |

## Accessibility

- The input is the one tab stop, named by `label`, a Field label or `aria-label`. Base UI gives it the spinbutton semantics.
- Steppers are named buttons with `aria-controls` on the input, kept out of the tab order (the arrow keys do the same job) and never take focus, so the caret stays where it was.
- The rolling digits are `aria-hidden`; assistive tech reads the input's own value.
- Steppers are 28px inside a 36px field; touch presses don't open the keyboard.

## Motion

A press steps once at once; held, it repeats after 400ms, starting at 150ms between steps and speeding up 14% each time to 35ms. While you aren't typing, the value is a NumberRoll over the input's text: each digit turns on the snappy spring in the direction of change, a 9 → 0 carries forward, and a step mid-roll redirects from where the digit is. Typing swaps the roll for the real text at once; scrubbing shows changes without rolling, so the value tracks the pointer. Reduced motion: digits change in place.

## Notes for AI

Choose NumberField for any typed number with a range; set `min`, `max`, `step` and `format` instead of validating or formatting outside it. Use `layout="split"` for cart quantities and `scrub` when people will nudge the value often.

Don't add your own stepper buttons, key handlers or formatting: Base UI parses and clamps, and the steppers already repeat and accelerate. Values are numbers (a percent of 2.5% is `0.025`).

## Related

- [Scrub Label](/components/scrub-label): Pro precision scrubbing with ticks and inertia.
- [Slider](/components/slider): a continuous range picked by dragging.
- [Number Roll](/components/number-roll): the rolling digits on their own.
