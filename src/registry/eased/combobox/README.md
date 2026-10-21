# Combobox

A text field that filters a list of options as you type, for one value or several as chips, built on Base UI Combobox, the Eased floating layer and the overlay core's rows, in the same bordered shell as Input.

## When to use

- Choosing from a list too long to scan: countries, repositories, people.
- Several values at once, shown as removable chips: reviewers, labels, tags.
- Lists that load as you type (pass `loading`, and `filter={null}` with your own results).

## When not to use

- A short fixed set: use [Select](/components/select).
- Free text with suggestions (any value allowed): use an Autocomplete or [Search Field](/components/search-field).
- Commands and navigation: use a Command palette.

## Usage

```tsx example.tsx
import { Field } from "@/components/eased/field/field";
import { Combobox } from "@/components/eased/combobox/combobox";

const repos = [
  { value: "deploy-api", label: "fathom/deploy-api", detail: "Go" },
  { value: "dashboard", label: "fathom/dashboard", detail: "TypeScript" },
  { value: "cli", label: "fathom/cli", detail: "Go" },
];

export function Example() {
  return (
    <Field label="Repository" name="repository">
      <Combobox items={repos} placeholder="Search repositories" />
    </Field>
  );
}
```

## Examples

### Several values as chips

`multiple` puts choices in the field as chips. The list stays open after each pick (`keepOpenOnSelect`); Backspace in the empty input removes the last chip.

```tsx
<Combobox
  multiple
  items={[{ label: "Platform", items: platform }, { label: "Reliability", items: sre }]}
  defaultValue={[platform[0]]}
  placeholder="Add reviewers"
  emptyText={(q) => `No one called “${q}”`}
/>
```

### Loading results

```tsx
<Combobox items={results} filter={null} loading={pending} onInputValueChange={search} aria-label="Customer" />
```

## API reference

### Combobox

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `T[] \| ComboboxOptionGroup<T>[]` | | Options (`{ value, label, icon?, detail?, disabled? }`), flat or grouped. |
| `value` / `defaultValue` | `T \| T[] \| null` | | The chosen option objects, compared by `value`. |
| `onValueChange` | `(value, details) => void` | | |
| `multiple` | `boolean` | `false` | Choices become chips in the field. |
| `placeholder` | `string` | | Shown while the input is empty (and, with `multiple`, nothing is chosen). |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 32, 36 or 40px, like Input; with chips it grows a line at a time. |
| `emptyText` | `ReactNode \| (query) => ReactNode` | No matches for “query” | The empty state. |
| `loading` | `boolean` | `false` | A spinner row instead of the empty state. |
| `loadingText` | `string` | `"Searching…"` | |
| `itemToStringLabel` | `(item) => string` | `item.label` | What the input shows and filtering matches. |
| `keepOpenOnSelect` | `boolean` | `true` | With `multiple`, keep the list open after a pick. |
| `invalid` | `boolean` | | Invalid outside a Field; inside one, the field's validity drives it. |
| `disabled` | `boolean` | `false` | |
| `id` / `aria-label` | `string` | | For the input, when no Field labels it. |
| `clearLabel` | `string` | `"Clear"` | The clear button's name. |
| `container` / `zIndex` | | `document.body` / `50` | Portal target and stacking order. |
| `className` / `popupClassName` | `string` | `""` | The shell (set a width here) and the popup. |

Every other Base UI `Combobox.Root` prop passes through (`inputValue`, `onInputValueChange`, `filter`, `filteredItems`, `limit`, `autoHighlight`, `name`, `required` …).

## Keyboard

| Key | Action |
|---|---|
| Typing | Filters the list and opens it. |
| `↓` / `↑` | Moves the highlight; from the input, opens the list. |
| `Enter` | Chooses the highlighted row. |
| `Esc` | Closes the list. |
| `Backspace` | In an empty input, removes the last chip. |
| `←` (at the start) | Moves focus onto the chips; `Backspace` / `Delete` removes the focused one. |

## Accessibility

- The input is a `combobox` controlling a `listbox`; name it with a Field label, a `<label htmlFor={id}>` or `aria-label`.
- The empty and loading states sit in live regions that stay mounted, so changes are announced.
- Focus stays in the input while the list is open; the clear and chevron buttons don't take it.
- Each chip's remove button is named "Remove …". Rows are 40px on coarse pointers.

## Motion

The list drops in 4px from the field toward its resting place at 0.97, opacity on the enter curve in 150ms and scale on the snappy spring, and leaves half as far in 100ms; both are transitions, so they reverse mid-flight. While you type, nothing animates: rows fill in place on highlight (rule 84) and the list's height follows the results with no spring, since a height animation on every keystroke would fight both the typing and Base UI's positioning. The clear button pops in from 0.6 on the snappy spring and leaves in 100ms. Chips pop in from 0.9 on the snappy spring and leave in 100ms; the rest reflow at once. Reduced motion keeps opacity fades only.

## Notes for AI

Pick Combobox over Select when the list is long or people know what they're looking for, and use `multiple` for tags, labels and assignees. Items are objects with a string `value` and a `label`; values are those objects, so keep them referentially stable or rely on the built-in `value` comparison.

Don't wrap it in an Input or add your own clear button, chevron, empty state or chip styles: they're built in. Don't wrap the list in a height animation; for async results pass `filter={null}`, your own `items` and `loading`.

## Related

- [Select](/components/select): a short fixed list without typing.
- [Search Field](/components/search-field): free-text search with the same clear button.
- [Input](/components/input): the shell this matches.
