# Field

Label, control and one message line, on Base UI's Field.

```tsx
import { Form } from "@base-ui/react/form";
import { Field } from "@/components/eased/field/field";
import { Input } from "@/components/eased/input/input";

<Form errors={serverErrors} onFormSubmit={submit}>
  <Field name="email" label="Work email" description="We’ll send a sign-in link." validate={checkEmail}>
    <Input type="email" />
  </Field>
</Form>
```

| Prop | Type | Default | |
|---|---|---|---|
| `label` | `ReactNode` | | Tied to the control for you. |
| `description` | `ReactNode` | | Helper text; the error takes its place while invalid. |
| `error` | `ReactNode` | | An error you control. Setting it marks the field invalid. |
| `children` | `ReactNode` | | One control: Input, Textarea, Search Field or any Base UI control. |

Plus every Base UI `Field.Root` prop: `name`, `validate`, `validationMode`, `invalid`, `disabled` … Also exports `FieldRoot`, `FieldLabel` and `FieldMessage` for custom layouts.

**Motion signature:** the description and the error share one line and swap with y + blur while the line's height springs; inside Base UI's Form, submitting moves focus to the first invalid field, which shakes once.
