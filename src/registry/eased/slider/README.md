# Slider

Let people pick a value or a range by dragging, with a formatted readout that rolls as it changes, on Base UI's Slider.

## When to use

- Set a value where the rough position matters more than the exact digit, such as a spend cap or an alert threshold.
- Pick a range with two thumbs, such as a price band, by passing an array of two values.
- Show the value as people drag, formatted as currency, a percentage or a unit, without wiring a readout yourself.

## When not to use

- An exact number someone types, such as a quantity: use an [Input](/components/input) with `type="number"`.
- A few named steps, such as small, medium and large: use [Segmented](/components/segmented) or a [Radio Group](/components/radio-group).
- Adjusting a number inline by dragging its label: use [Scrub Label](/components/scrub-label).

## Usage

```tsx spend-cap.tsx
import { useState } from "react";
import { Slider } from "@/components/eased/slider/slider";

export function SpendCap() {
  const [cap, setCap] = useState(400);
  return (
    <Slider
      label="Monthly spend cap"
      value={cap}
      onValueChange={setCap}
      max={2000}
      step={50}
      largeStep={250}
      format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
      locale="en-US"
    />
  );
}
```

## Examples

### Range

Pass an array of two values for two thumbs. Use `minStepsBetweenValues` to keep them apart, and `aria-label` to name each thumb ("Price per million tokens minimum" and "… maximum").

```tsx
<Slider
  label="Model price range"
  defaultValue={[2, 15]}
  max={30}
  step={0.5}
  minStepsBetweenValues={2}
  format={{ style: "currency", currency: "USD" }}
  locale="en-US"
  aria-label="Price per million tokens"
/>
```

### Save when the drag ends

Use `onValueCommitted` to save once when a drag ends or a key is released, instead of on every step.

```tsx
<Slider label="Alert at" defaultValue={80} min={50} max={100} format={{ style: "unit", unit: "percent" }} onValueCommitted={saveThreshold} />
```

### Bare slider

Leave out `label` when the layout already names it, and pass `aria-label`. The readout hides with the label unless you set `showValue`.

```tsx
<Slider aria-label="Volume" defaultValue={60} />
```

## API reference

### Slider

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `number \| readonly number[]` | | The value (controlled). Two values make a range. |
| `defaultValue` | `number \| readonly number[]` | | The initial value (uncontrolled). |
| `onValueChange` | `(value) => void` | | Fires on every change while dragging or stepping. |
| `onValueCommitted` | `(value) => void` | | Fires once when a drag ends or a key is released. |
| `min` | `number` | `0` | |
| `max` | `number` | `100` | |
| `step` | `number` | `1` | |
| `largeStep` | `number` | `10` | How far `Shift` + arrow and `Page Up` / `Page Down` move. |
| `format` | `Intl.NumberFormatOptions` | | Formats the readout and the value screen readers hear. |
| `locale` | `Intl.LocalesArgument` | runtime locale | Locale for `format`. |
| `label` | `ReactNode` | | The label above the track. |
| `showValue` | `boolean` | `true` with a label | Shows the rolling readout on the label row. |
| `minStepsBetweenValues` | `number` | `0` | Minimum steps between a range's two thumbs. |
| `name` | `string` | | Form field name. |
| `disabled` | `boolean` | | Dims the slider to 50% and stops input. |
| `aria-label` | `string` | | Names the thumb, or each thumb of a range with "minimum" and "maximum" added. |
| `className` | `string` | `""` | Appended to the root's classes. |

## Keyboard

| Key | Action |
|---|---|
| `Tab` | Moves focus to the thumb, then to the second thumb of a range. |
| `←` / `→` or `↑` / `↓` | Moves by `step`. |
| `Shift` + arrow | Moves by `largeStep`. |
| `Page Up` / `Page Down` | Moves by `largeStep`. |
| `Home` / `End` | Moves to `min` / `max`. |

## Accessibility

- Each thumb is a Base UI slider input with the value range and the formatted value, so screen readers hear "$400" rather than "400".
- `label` is tied to the slider through `aria-labelledby`; `aria-label` names the thumbs. A range adds "minimum" and "maximum" to each thumb's name.
- The visible readout is hidden from screen readers, so the value isn't read twice.
- The track is 4px, but the 20px band around it is the hit target, and each thumb is a 20px target. Pressing anywhere on the band moves the nearest thumb there.
- The focus ring draws around the focused thumb.

## Responsive

The slider fills its container's width. The label truncates to one line and the readout keeps its size, so the label row never wraps on a narrow screen. Touch scrolling is off inside the 20px band only, so the page still scrolls around it.

## Motion

The thumb swells to 1.1 on hover (pointer devices only) and to 1.25 while dragged, on the snappy spring. The readout's digits roll on [Number Roll](/components/number-roll) when the value steps from keys or a track press, and follow the finger exactly while dragging. Reduced motion: the thumb keeps its size and the digits change without rolling.

## Notes for AI

Pick Slider when position matters more than precision, and pass `format` and `locale` so the readout and the announced value match. Save in `onValueCommitted`, not `onValueChange`, to avoid a request per pixel. For a range, pass an array and an `aria-label` so each thumb gets a distinct name.

Don't build your own value readout or label row: `label` and `showValue` already do it, with rolling digits. Don't format the value in a separate span; set `format`.

## Related

- [Scrub Label](/components/scrub-label): drag a number's label to change it inline.
- [Number Roll](/components/number-roll): the rolling digits in the readout.
- [Input](/components/input): type an exact number.
