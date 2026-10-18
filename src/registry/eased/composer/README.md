# Composer

A chat input: auto-growing textarea, attachments row and one Send/Stop button.

**Motion signature:** the box grows on a smooth height spring, the attachments row opens with Auto Height while chips pop in from 0.9, and the Send arrow morphs point for point into a Stop square while a reply streams, without changing size.

```tsx
import { useChat } from "@ai-sdk/react";
import { fromUseChat } from "@/components/eased/_primitives/chat-core/chat-core";
import { Composer } from "@/components/eased/composer/composer";

const { composer } = fromUseChat(useChat());
<Composer {...composer} upload={uploadToS3} accept="image/*,.pdf,.csv" />
```

## Props
- `value` / `defaultValue` / `onValueChange`: the text.
- `onSubmit({ text, attachments, files })`: `files` are AI SDK `file` parts. Uncontrolled text and attachments clear after a send.
- `status` (`useChat().status`), `onStop`: Stop button and Escape while busy.
- Attachments: uncontrolled with `upload`, `accept`, `maxSize`, `maxFiles`; or controlled with `attachments`, `onAttach`, `onRemoveAttachment`, `onRetryAttachment`. `allowAttachments={false}` turns them off. Pick, drop or paste.
- `placeholder`, `minRows` (1), `maxRows` (6, then it scrolls with soft edges), `disabled`, `autoFocus`, `submitOn` (`enter` | `mod-enter`), `onEditLast` (↑ when empty, ⌘↑).
- Pro hooks: `onTrigger` (`/` and `@`), `triggerChars`, `interceptKey` (claim ↑ ↓ Enter Esc for an open menu), `header`, `toolbar`, `actions` (model picker), `ref` → `{ focus, textarea, openFilePicker }`.

Keyboard: Enter sends, Shift+Enter breaks the line, Escape stops a reply, Tab reaches Add files and Send.
