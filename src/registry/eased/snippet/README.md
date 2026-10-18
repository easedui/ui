# Snippet

A one-line command with a `$` prompt and a copy button.

**Motion signature:** when the command changes (pnpm ↔ npm) the old text lifts away and the new one rises in while the pill's width springs to fit, so the copy button glides instead of jumping; copying morphs the icon into a check.

## When to use

- Install and run commands in docs, onboarding and empty states.
- Anything a reader pastes into a terminal as one line.

## When not to use

- Multi-line code: use [Code Block](/components/code-block). A choice of package manager shown as tabs: use [Code Tabs](/components/code-tabs).

## Usage

```tsx install.tsx
import { Snippet } from "@/components/eased/snippet/snippet";
import { useChoice } from "@/components/eased/_primitives/code-core/choice";
import { PACKAGE_MANAGERS, packageCommand, type PackageManager } from "@/components/eased/code-tabs/code-tabs";

const [pm] = useChoice("package-manager", "pnpm", PACKAGE_MANAGERS);
<Snippet text={packageCommand(pm as PackageManager, { dlx: "shadcn@latest add https://eased.dev/r/code-block.json" })} />
```

## Props

| Prop | Default | |
|---|---|---|
| `text` | | The command. Changing it swaps the text and springs the width. |
| `prefix` | `"$"` | Shown, never copied. `null` hides it. |
| `lang` | `"bash"` | Grammar for the command. |
| `label` | `"Copy command"` | Accessible name of the copy button. |
| `onCopy` | | `(text) => void`. |

A command wider than its container scrolls sideways under 20px edge fades. Reduced motion: a 100ms cross-fade and an instant width.
