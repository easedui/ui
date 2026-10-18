# Message

A chat message for AI SDK `UIMessage`s: user messages in a sunken bubble, assistant messages flush.

**Motion signature:** consecutive bubbles from one author merge, and the corners where they meet tighten from 16px to 6px as the next one lands, so the run reflows instead of snapping. New messages rise 8px once.

```tsx
{groupMessages(messages).map((g) => (
  <div key={g.key} className="flex flex-col gap-1">
    {g.messages.map(({ message, position }) => (
      <Message key={message.id} message={message} position={position} actions={<CopyAction message={message} />} />
    ))}
  </div>
))}
```

## Props
- `message?`, `role?` (defaults to the message's), `position` (`single` | `first` | `middle` | `last`), `children` (replaces the text, e.g. a streaming Response), `actions`, `actionsVisible` (`hover` keeps its space while hidden | `always`), `animateIn`.
- `MessageAction`: `label`, `onClick`, `pressed`, `children` (a 16px icon).
- `CopyAction`: `message` or `text`; morphs to a check for 1.6s.

The free bubble. The Pro thread (streaming markdown, branches, edit in place, the lift out of the composer) arrives with Conversation and Response.
