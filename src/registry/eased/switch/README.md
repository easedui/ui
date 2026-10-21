# Switch

Turn a setting on or off the moment it flips, with a switch on Base UI's Switch that lays out the whole settings row for you.

## When to use

- Apply a setting at once, with no Save button, such as a notification preference.
- Get a complete settings row from one component: label and description on the left, switch on the right edge.
- Line up several settings so every switch sits on the same right edge.

## When not to use

- Options that only take effect when a form is submitted: use a [Checkbox](/components/checkbox).
- Picking one of several modes, such as light, dark or system: use [Segmented](/components/segmented) or a [Radio Group](/components/radio-group).
- Toggling formatting in a toolbar: use a [Toggle Group](/components/toggle-group).

## Usage

```tsx notification-settings.tsx
import { Switch } from "@/components/eased/switch/switch";

export function NotificationSettings() {
  return (
    <div className="flex flex-col divide-y divide-line-subtle">
      <Switch defaultChecked description="Replies and @mentions in threads you follow." className="py-3.5">
        Comments and mentions
      </Switch>
      <Switch description="New features and changelog posts, about twice a month." className="py-3.5">
        Product updates
      </Switch>
    </div>
  );
}
```

## Examples

### Controlled

Control it with `checked` and `onCheckedChange` when other UI reflects the setting.

```tsx
const [digest, setDigest] = useState(true);

<Switch checked={digest} onCheckedChange={setDigest} description="A summary of the week, every Monday at 9:00.">
  Weekly digest
</Switch>
```

### Disabled, with the reason

Say why a setting is locked in `description`.

```tsx
<Switch defaultChecked disabled description="Required for workspace owners.">
  Sign-in alerts
</Switch>
```

### Bare switch

Leave out `children` when the layout already shows the label, and name it with `aria-label`.

```tsx
<Switch aria-label="Dark mode" checked={dark} onCheckedChange={setDark} />
```

## API reference

### Switch

| Prop | Type | Default | Description |
|---|---|---|---|
| `checked` | `boolean` | | On (controlled). |
| `defaultChecked` | `boolean` | | Initially on (uncontrolled). |
| `onCheckedChange` | `(checked: boolean) => void` | | |
| `value` | `string` | | What a form submits under `name` while on. |
| `name` | `string` | | Form field name. |
| `disabled` | `boolean` | | |
| `required` | `boolean` | | |
| `readOnly` | `boolean` | | Shows the state but doesn't change on click. |
| `children` | `ReactNode` | | The label. With one, Switch renders a settings row. |
| `description` | `ReactNode` | | Muted text under the label. |
| `aria-label` | `string` | | Names a bare switch with no `children`. |
| `id` | `string` | | The switch's `id`. |
| `className` | `string` | `""` | On the row when there is a label, on the switch when there isn't. |

The switch is a 20×36px track with a 16px thumb inset 2px.

## Keyboard

| Key | Action |
|---|---|
| `Tab` | Moves focus to the switch. |
| `Space` / `Enter` | Toggles it. |

## Accessibility

- The switch has `role="switch"` and `aria-checked`. A hidden input submits it with forms and works with Field validation.
- With `children`, a native `<label>` names it and clicking the label toggles it; `description` describes it through `aria-describedby`. Without `children`, pass `aria-label`.
- The focus ring draws around the track. A disabled switch drops to 50% opacity and its label dims.
- The bare track is 20px tall, so on touch screens use the labelled row, where the label is part of the target.

## Responsive

The label column takes the remaining width and wraps; the switch keeps its size and stays on the label's first line, so it never squeezes on a narrow screen.

## Motion

The thumb springs across on the snappy spring (350ms). While pressed, it stretches 4px toward where it's about to go, then the stretch closes behind it as it travels; only `translate` and `clip-path` animate. The track colour changes over 150ms on the standard curve. Disabled and read-only switches don't stretch. Reduced motion: the thumb jumps to its new side without a spring or a stretch, and only colours fade.

## Notes for AI

Pick Switch for a setting that applies immediately; pick Checkbox when the choice waits for a submit. Pass the label as `children` and helper text as `description`, and put row padding on `className`, which lands on the row.

Don't wrap it in your own label or flex row, and don't put a Label next to it: the row already handles naming, layout and the click target. Don't animate the thumb yourself.

## Related

- [Checkbox](/components/checkbox): an option that takes effect on submit.
- [Segmented](/components/segmented): one of a few modes, shown side by side.
- [Field](/components/field): adds validation messages around a control.
