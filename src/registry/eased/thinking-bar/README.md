# Thinking Bar

The line above a reasoning model's answer: "Thinking 4s" while it works, "Thought for 12s" when it's done, with the reasoning folded inside.

```tsx
import { ThinkingBar } from "@/components/eased/thinking-bar/thinking-bar";

<ThinkingBar status={isReasoning ? "thinking" : "done"} lines={["Reading your plan", "Comparing plans"]}>
  {reasoningText}
</ThinkingBar>

// A message loaded from history shows its real duration.
<ThinkingBar status="done" startedAt={msg.reasoningStartedAt} endedAt={msg.reasoningEndedAt}>{msg.reasoning}</ThinkingBar>
```

With the AI SDK, `status` is `"thinking"` while the message's last part is a streaming `reasoning` part.

## Props

| Prop | Type | Default | |
|---|---|---|---|
| `status` | `"thinking" \| "done"` | | |
| `startedAt` / `endedAt` | `number \| Date` | | Omit `startedAt` to count from when `status` turns `thinking`. |
| `label` | `string` | `"Thinking"` | |
| `lines` | `string[]` | | Status lines to rotate through after `label` (2–4s each by length; holds on the last). |
| `doneLabel` | `string` | `"Thought for"` | Under one second it reads "Thought for a moment". |
| `icon` | `ReactNode` | | Before the label, e.g. `<AgentOrb size="sm" label={false} />`. |
| `children` | `ReactNode` | | The reasoning. With it the bar is a disclosure; without it, a plain line. |
| `open` / `defaultOpen` / `onOpenChange` | | | Controlled or uncontrolled. `onOpenChange` also reports the automatic changes. |
| `autoOpen` | `boolean` | `true` | Open while thinking. |
| `autoClose` | `number \| false` | `1000` | Close this many ms after `done`. Both automatic behaviours stop once the reader toggles it, and come back on the next thinking run. |
| `className` | `string` | | |

Base UI Collapsible supplies the button, `aria-expanded` and `aria-controls`. The rolling digits are hidden from assistive tech; the button's name is "Thinking…" or "Thought for 12 seconds", and a polite status announces the result once.

**Motion signature:** the label shimmers while a seconds counter rolls beside it; on completion "Thinking" swaps to "Thought for" and the counter, the same element, glides along the springing width to read "Thought for 12s", while the reasoning folds away on Auto Height and the chevron turns on the same smooth spring.
