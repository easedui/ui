# Checkbox

Let people turn options on and off, or select a whole group at once, with a checkbox on Base UI's Checkbox and CheckboxGroup.

## When to use

- Let people pick any number of options from a list, such as the columns to export.
- Select or clear a whole group in one click with a parent checkbox that shows a dash when only some are checked.
- Collect an opt-in that only takes effect when a form is submitted, such as "Include totals".

## When not to use

- A setting that applies the moment it changes: use a [Switch](/components/switch).
- Exactly one choice from a few: use a [Radio Group](/components/radio-group) or [Segmented](/components/segmented).
- Toggling formatting in a toolbar: use a [Toggle Group](/components/toggle-group).

## Usage

```tsx export-options.tsx
import { Checkbox } from "@/components/eased/checkbox/checkbox";

export function ExportOptions() {
  return (
    <Checkbox name="totals" defaultChecked description="Adds a row with the total of each number column.">
      Include totals
    </Checkbox>
  );
}
```

## Examples

### Group with a parent

Wrap checkboxes in `CheckboxGroup` to share one value array. A `parent` checkbox checks or clears them all and shows the dash when some are checked; pass every child's value as `allValues`.

```tsx
const columns = ["invoice", "customer", "amount", "status"];
const [value, setValue] = useState(["invoice", "amount"]);

<CheckboxGroup aria-label="Columns" value={value} onValueChange={setValue} allValues={columns}>
  <Checkbox parent>All columns</Checkbox>
  <Checkbox value="invoice">Invoice number</Checkbox>
  <Checkbox value="customer">Customer</Checkbox>
  <Checkbox value="amount">Amount</Checkbox>
  <Checkbox value="status">Status</Checkbox>
</CheckboxGroup>
```

### Disabled, with the reason

Say why an option is unavailable in `description`, so people know what would unlock it.

```tsx
<Checkbox disabled description="Available on the Business plan.">
  Schedule a weekly export
</Checkbox>
```

### Bare box

Leave out `children` in a table row or another layout that already shows the label, and name it with `aria-label`.

```tsx
<Checkbox aria-label="Select invoice INV-2041" checked={selected} onCheckedChange={setSelected} />
```

## API reference

### Checkbox

| Prop | Type | Default | Description |
|---|---|---|---|
| `checked` | `boolean` | | Checked (controlled). |
| `defaultChecked` | `boolean` | | Initially checked (uncontrolled). |
| `onCheckedChange` | `(checked: boolean) => void` | | |
| `indeterminate` | `boolean` | | Shows the dash. A `parent` checkbox sets this itself. |
| `parent` | `boolean` | | Controls every checkbox in its `CheckboxGroup`. |
| `value` | `string` | | Its value inside a `CheckboxGroup`, and what a form submits under `name`. |
| `name` | `string` | | Form field name. |
| `disabled` | `boolean` | | |
| `required` | `boolean` | | |
| `readOnly` | `boolean` | | Shows the state but doesn't change on click. |
| `children` | `ReactNode` | | The label. Clicking anywhere on the row toggles it. |
| `description` | `ReactNode` | | Muted text under the label. |
| `aria-label` | `string` | | Names a bare box with no `children`. |
| `id` | `string` | | |
| `className` | `string` | `""` | Appended to the root's classes. |

### CheckboxGroup

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `string[]` | | Checked values (controlled). |
| `defaultValue` | `string[]` | | Initially checked values (uncontrolled). |
| `onValueChange` | `(value: string[]) => void` | | |
| `allValues` | `string[]` | | Every child's value. Required with a `parent` checkbox. |
| `disabled` | `boolean` | | Disables every checkbox in the group. |
| `aria-label` | `string` | | Names the group. |
| `aria-labelledby` | `string` | | Names the group from a visible heading. |
| `className` | `string` | `""` | Appended to the group's classes. It stacks its children in a column. |

## Keyboard

| Key | Action |
|---|---|
| `Tab` | Moves focus to the checkbox. Each checkbox in a group is its own tab stop. |
| `Space` | Toggles it. On a parent, checks or clears the whole group. |

## Accessibility

- The root has `role="checkbox"` and `aria-checked`, which reads "mixed" when indeterminate. A hidden input submits it with forms and works with Field validation.
- With `children`, the label names the checkbox through `aria-labelledby`, and `description` describes it through `aria-describedby`. Without `children`, pass `aria-label`.
- The focus ring draws around the whole row, label included.
- A labelled row is 32px tall and toggles anywhere you press. A bare box is 16px, so give it a larger row or cell to press in on touch screens.

## Responsive

A long label wraps under itself, and the box stays on the label's first line. Descriptions wrap with `text-pretty`.

## Motion

The fill and border tint in over 150ms on the standard curve. The check draws itself in 200ms on the enter curve and retracts in 100ms on the exit curve as it fades. The indeterminate dash is the same stroke straightened, so check and dash morph into each other on the snappy spring instead of cross-fading. The box presses to 0.9 in 100ms and springs back on the snappy spring; disabled and read-only boxes don't press. Reduced motion: the mark appears and disappears with a 100ms fade, and the box doesn't press.

## Notes for AI

Pick Checkbox for options that take effect on submit and for multi-select lists; pick Switch when the change applies at once. For a "Select all", use `CheckboxGroup` with a `parent` checkbox and `allValues`; don't compute the indeterminate state yourself.

Don't wrap it in a `<label>` or put a Label next to it: pass the label as `children` and the helper text as `description`, and the row handles naming and the click target. Don't animate the check yourself.

## Related

- [Switch](/components/switch): a setting that applies the moment it flips.
- [Radio Group](/components/radio-group): exactly one choice from a list.
- [Field](/components/field): adds validation messages around a control.
