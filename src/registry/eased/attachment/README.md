# Attachment Chip

An image thumbnail or a typed file chip, with upload progress, errors and remove.

**Motion signature:** the thumbnail sharpens from a 4px blur once it decodes, progress is a ring that springs between reports (spinning when the size is unknown), a failure shakes once, and a removed chip shrinks away while its neighbours slide into the gap.

```tsx
const { attachments, add, remove, retry } = useAttachments({ upload });
<AttachmentList attachments={attachments} onRemove={remove} onRetry={retry} />
```

## Props
- `AttachmentChip`: `attachment`, `onRemove?`, `onRetry?`, `variant` (`auto` | `file`).
- `AttachmentList`: `attachments`, `onRemove?`, `onRetry?`, `label` ("Attachments"), `children`.
- `ProgressRing`: `value?` (0–1), `name`.

The remove button shows on hover and focus with a mouse, and always on touch. Each chip is a labelled group that reads out its name and upload state.
