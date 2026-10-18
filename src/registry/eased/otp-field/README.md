# OTP Field

A one-time-code input on Base UI's OTPField: one input per cell, with `autocomplete="one-time-code"` on the first, so SMS and email autofill, password managers and a pasted code fill every cell at once.

## When to use

- Verifying an email address or phone number with a short code.
- A second factor from an authenticator app.
- Any fixed-length code a person reads from somewhere else and types: a TV pairing code, a door PIN.

## When not to use

- Codes of varying length, or long tokens: use an [Input](/components/input).
- Passwords: use an Input with `type="password"`; codes are short-lived, passwords are not.

## Usage

```tsx example.tsx
import { useState } from "react";
import { Field } from "@/components/eased/field/field";
import { OtpField } from "@/components/eased/otp-field/otp-field";

export function Example() {
  const [code, setCode] = useState("");
  return (
    <Field label="Verification code" description="We sent it to maya@northwind.com.">
      <OtpField value={code} onValueChange={setCode} onValueComplete={(c) => verify(c)} />
    </Field>
  );
}
```

## Examples

### Wrong and right codes

Pass `invalid` (or a Field `error`) when the server rejects the code: the row shakes once. Pass `success` when it's accepted.

```tsx
<Field label="Code" error={wrong ? "That code doesn’t match." : undefined}>
  <OtpField value={code} onValueChange={setCode} success={verified} readOnly={verified} />
</Field>
```

### Grouping and letters

```tsx
<OtpField length={8} groups={[4, 4]} validationType="alphanumeric" />
```

## API reference

### OtpField

| Prop | Type | Default | Description |
|---|---|---|---|
| `length` | `number` | `6` | Number of cells. |
| `groups` | `number[]` | halves for even lengths ≥ 6 | Cells per group, separated by a dash. `[length]` for none. Ignored unless it sums to `length`. |
| `value` | `string` | | Controlled code. |
| `defaultValue` | `string` | `""` | Uncontrolled starting code. |
| `onValueChange` | `(value: string) => void` | | Every change: typing, deleting, paste and autofill. |
| `onValueComplete` | `(value: string) => void` | | When every cell is filled. |
| `invalid` | `boolean` | | Danger borders and one shake when it turns on. Inside a Field, the field's validity drives it too. |
| `success` | `boolean` | `false` | Success borders and a ripple when it turns on. |
| `size` | `"md" \| "lg"` | `"md"` | 40×44 or 48×56 cells. |
| `mask` | `boolean` | `false` | Show dots instead of characters. |
| `getSlotLabel` | `(index, length) => string` | "Character 2 of 6" | Accessible names for cells after the first. |
| `className` | `string` | `""` | Appended to the root's classes. |

Base UI's other OTPField.Root props pass through: `validationType` (`"numeric"` by default, `"alpha"`, `"alphanumeric"`, `"none"`), `normalizeValue`, `onValueInvalid`, `autoSubmit`, `name`, `form`, `required`, `disabled`, `readOnly`, `autoComplete`, `inputMode`.

## Keyboard

| Key | Action |
|---|---|
| Characters | Fill the focused cell and move to the next. |
| `Backspace` | Clears the cell, then moves back. |
| `←` / `→` | Moves between filled cells. |
| `Home` / `End` | First cell, or the first empty one. |
| `⌘V` / `Ctrl V` | Pastes a whole code into every cell; spaces and dashes are dropped. |

## Accessibility

- The first cell is named by the Field label; the others are "Character 2 of 6" and so on.
- Only one cell is in the tab order, so Tab leaves the field in one step.
- Errors are announced by the Field's message line; the shake is never the only signal (the borders turn danger).
- Mobile keyboards open numeric and offer the code from the latest SMS.

## Motion

Each character pops in from half size and a 2px blur, scale on the bouncy spring and position on snappy, and leaves in 100ms at 0.7 scale. The caret in the focused empty cell holds, fades and holds again on a 1.1s cycle, like a native text field. A wrong code shakes the row once, 6px, on the shared field shake; an accepted code ripples left to right, each cell lifting 3px and 4% then settling, 35ms apart. Reduced motion: characters fade in 100ms, the caret stays still, and there is no shake or ripple (the colours carry the state).

## Notes for AI

Use OtpField for fixed-length codes only, inside a Field for its label and error. Verify in `onValueComplete`, set `readOnly` while checking, then set `invalid` or `success` from the result; clear `invalid` when the person edits.

Don't render your own inputs per cell or a hidden input next to it, and don't intercept paste: Base UI already spreads pasted and autofilled codes and filters characters by `validationType`.

## Related

- [Input](/components/input): for codes of any length.
- [Field](/components/field): the label and message line around it.
