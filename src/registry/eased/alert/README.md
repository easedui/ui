# Alert

Tell people what happened and what to do next, in an inline callout tinted by tone that springs open and closed so the page below glides instead of jumping.

## When to use

- Explain a problem where it happened and offer the fix next to it, such as a failed payment with a Retry button.
- Confirm that something worked, in place, by switching the same alert from `danger` to `success`.
- Warn before something might go wrong, such as a card that expires in six days.
- Keep focus on the page when someone dismisses a note, and let the content below glide up.

## When not to use

- A brief confirmation that isn't tied to one place on the page: use a [Toast](/components/toast).
- A destructive action someone can take back: act at once and offer [Undo Pill](/components/undo-pill).
- A decision that must block the page: use an alert dialog in [Dialog](/components/dialog).
- A short status on a row or a card: use a [Badge](/components/badge).

## Usage

```tsx payment-failed.tsx
import { Alert } from "@/components/eased/alert/alert";
import { Button } from "@/components/eased/button/button";

export function PaymentFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert
      tone="danger"
      role="alert"
      title="Your October payment failed"
      actions={
        <Button size="sm" onClick={onRetry}>
          Retry $249.00
        </Button>
      }
    >
      Visa ending 4242 was declined by the bank. We'll try again on Oct 21.
    </Alert>
  );
}
```

## Examples

### Dismissible

Pass `onDismiss` for a close button, and pair it with `open` so the alert collapses instead of vanishing. Put the gap above it in `innerClassName` so the gap closes with it.

```tsx
const [open, setOpen] = useState(true);

<Alert
  open={open}
  innerClassName="pt-3"
  tone="neutral"
  title="Invoices go to billing@northwind.com"
  onDismiss={() => setOpen(false)}
>
  Add a second address in Settings → Billing contacts.
</Alert>
```

### From error to success

Keep one alert mounted and change its `tone`, `title` and `role` as the state changes. The tint cross-fades and the icon swaps in place.

```tsx
<Alert
  tone={paid ? "success" : "danger"}
  role={paid ? "status" : "alert"}
  title={paid ? "Payment received" : "Your October payment failed"}
>
  {paid ? "Visa ending 4242 was charged $249.00." : "Visa ending 4242 was declined by the bank."}
</Alert>
```

### Present on load

Use `role="none"` for an alert that is part of the page when it loads, so it isn't announced over everything else.

```tsx
<Alert tone="warning" role="none" title="Card expires in 6 days">
  Update it before Oct 24 to keep your Pro plan.
</Alert>
```

## API reference

### Alert

| Prop | Type | Default | Description |
|---|---|---|---|
| `tone` | `"neutral" \| "info" \| "success" \| "warning" \| "danger"` | `"info"` | Neutral for notes, info for context, success after it worked, warning before it might not, danger when it didn't. |
| `title` | `ReactNode` | | Required. One line, in sentence case. |
| `children` | `ReactNode` | | Detail under the title: what happened and what to do next. |
| `icon` | `ReactNode \| null` | the tone's icon | A 16px replacement icon, or `null` for none. |
| `actions` | `ReactNode` | | Buttons under the description, such as a small secondary Retry. |
| `onDismiss` | `() => void` | | Shows a Dismiss button that calls this. |
| `open` | `boolean` | `true` | `false` collapses the alert and fades it out; `true` springs it open. |
| `role` | `"status" \| "alert" \| "none"` | `"status"` | `status` is announced politely; `alert` interrupts, for errors someone must act on now; `none` for alerts present on page load. |
| `className` | `string` | `""` | On the outer wrapper that animates height. |
| `innerClassName` | `string` | `""` | On the inner wrapper that collapses with the alert. Put the gap above a dismissible alert here. |

## Keyboard

| Key | Action |
|---|---|
| `Tab` | Moves focus to the actions, then the Dismiss button. |
| `Enter` / `Space` | Activates the focused button. Dismiss moves focus on before the alert closes. |

## Accessibility

- `role="status"` is a polite live region and `role="alert"` an assertive one; `role="none"` adds no role. Change the content of a mounted alert, as in the error-to-success example, so the update is announced.
- The tone's icon is decorative and hidden from screen readers, so the title must say what happened on its own.
- The Dismiss button is a 24px target named "Dismiss". Pressing it moves focus to the next focusable element among the alert's siblings (the previous one when nothing follows, the alert itself as a last resort) before it calls `onDismiss`, so focus never drops to the page body.
- While closing, the content is inert; once closed, it is hidden, so it leaves the tab order and the accessibility tree.

## Responsive

The title and description wrap in the space left beside the icon and the Dismiss button, and actions wrap onto new lines on a narrow screen.

## Motion

The alert springs open and closed on its own height with the smooth spring (no overshoot), so the content below glides. Opening, the content fades in over 200ms on the enter curve just after the height starts; closing, it fades out in 100ms on the exit curve. A close mid-open turns around from the current height. When the tone changes, the tint and icon colour cross-fade over 150ms on the standard curve, and the icon swaps with a 4px blur: the old one leaves 3px up in 100ms, the new one rises 4px on the snappy spring. The Dismiss button presses to 0.96. Reduced motion: the height snaps, and the content and icon fade in 100ms with no travel or blur.

## Notes for AI

Pick Alert for a message tied to a place on the page, and Toast for a passing confirmation. Choose `tone` by what happened and `role` by urgency: `alert` only for errors that need action now, `none` for alerts rendered with the page. For a dismissible alert, keep it mounted and drive `open` from state in `onDismiss`.

Don't conditionally render it to hide it (`{show && <Alert />}`); set `open={false}` so it collapses and the page glides. Don't put margin on the alert or a `gap` on its parent for spacing above a dismissible alert; use `innerClassName`. Don't wrap it in your own height animation or move focus in `onDismiss`: Alert already does both.

## Related

- [Toast](/components/toast): a passing message, not tied to a place on the page.
- [Undo Pill](/components/undo-pill): undo a reversible action instead of warning about it.
- [Dialog](/components/dialog): a blocking confirmation.
